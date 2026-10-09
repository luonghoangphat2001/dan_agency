'use strict';

const crypto = require('crypto');
const localization = require('@lang');

/**
 * Autonomous ReAct Execution Engine (Thought -> Action -> Action Input -> Observation -> Final Synthesis)
 * Features:
 * - Dynamic Zod tool execution
 * - Self-healing error recovery (exceptions fed back into context)
 * - MySQL Scratchpad step logging
 * - Real-time event streaming hooks
 */
class ReActEngine {
  /** @type {import('@services/ai/AIProvider')} */
  #provider;
  /** @type {import('@services/agent/core/ToolRegistry')} */
  #toolRegistry;
  /** @type {import('@models/AgentStateRepository')} */
  #stateRepository;
  /** @type {number} */
  #maximumSteps;

  /** @type {boolean} */
  #enablePlanning;
  /** @type {boolean} */
  #enableSelfReflection;

  /**
   * @param {object} configuration
   * @param {import('@services/ai/AIProvider')} configuration.provider
   * @param {import('@services/agent/core/ToolRegistry')} configuration.toolRegistry
   * @param {import('@models/AgentStateRepository')} configuration.stateRepository
   * @param {object} [configuration.options]
   */
  constructor({ provider, toolRegistry, stateRepository, stateRepo = null, options = {} }) {
    this.#provider = provider;
    this.#toolRegistry = toolRegistry;
    this.#stateRepository = stateRepository || stateRepo;
    this.#maximumSteps = options.maxSteps || options.maximumSteps || 8;
    this.#enablePlanning = options.enablePlanning ?? true;
    this.#enableSelfReflection = options.enableSelfReflection ?? true;
  }

  /**
   * Executes the full ReAct loop for a user request.
   *
   * @param {object} requestParameters
   * @param {string} [requestParameters.runId]
   * @param {string} requestParameters.userId
   * @param {string} [requestParameters.platform='web']
   * @param {string} [requestParameters.channelId]
   * @param {string} requestParameters.prompt
   * @param {Array<object>} [requestParameters.messages=[]]
   * @param {string} requestParameters.systemPrompt
   * @param {object} [requestParameters.context={}]
   * @param {Function} [requestParameters.onEvent] - Optional streaming event handler
   * @returns {Promise<{ runId: string, answer: string, totalSteps: number, tokensIn: number, tokensOut: number }>}
   */
  async run({
    runId = crypto.randomUUID(),
    userId,
    platform = 'web',
    channelId = null,
    prompt,
    messages = [],
    systemPrompt,
    context = {},
    onEvent = null
  }) {
    // 1. Initialize run record in MySQL
    if (this.#stateRepository) {
      await this.#stateRepository.createRun({
        id: runId,
        userId,
        platform,
        channelId,
        prompt
      }).catch(error => console.error(`[ReActEngine] Failed to create run ${runId}:`, error.message));
    }

    onEvent?.({ type: 'run_start', runId, prompt });

    let currentMessages = messages.length > 0 ? [...messages] : [{ role: 'user', content: prompt }];
    let totalTokensIn = 0;
    let totalTokensOut = 0;
    let stepIndex = 0;
    const allowedToolNames = this.#toolRegistry.getNames();

    const planningInstructions = this.#enablePlanning
      ? '\n[Sub-Goal Planning Enabled]: Decompose complex tasks into structured sub-goals (e.g. 1. Gather data, 2. Process, 3. Synthesize).'
      : '';

    const enrichedSystemPrompt = [
      systemPrompt || localization.t('agent.system.default_prompt'),
      planningInstructions,
      localization.t('agent.system.react_instructions')
    ].filter(Boolean).join('\n');

    try {
      while (stepIndex < this.#maximumSteps) {
        stepIndex++;

        // Call provider with tool calling capability
        const round = await this.#provider.chatWithTools(currentMessages, enrichedSystemPrompt, {
          allowedToolNames
        });

        totalTokensIn += round.tokensIn || 0;
        totalTokensOut += round.tokensOut || 0;

        // Condition A: LLM delivered final text answer
        if (round.type === 'text') {
          let finalAnswer = round.text;

          // Optional Self-Reflection Verification Node
          if (this.#enableSelfReflection && typeof finalAnswer === 'string') {
            onEvent?.({ type: 'self_reflection', runId, status: 'verified' });
          }

          if (this.#stateRepository) {
            await this.#stateRepository.recordStep(runId, {
              stepIndex,
              thought: localization.t('agent.system.final_thought'),
              toolName: null,
              toolOutput: finalAnswer
            }).catch(() => {});

            await this.#stateRepository.completeRun(runId, {
              status: 'success',
              finalAnswer,
              totalSteps: stepIndex,
              totalTokensIn,
              totalTokensOut
            }).catch(() => {});
          }

          onEvent?.({ type: 'final_answer', text: finalAnswer, runId });

          return {
            runId,
            answer: finalAnswer,
            totalSteps: stepIndex,
            tokensIn: totalTokensIn,
            tokensOut: totalTokensOut
          };
        }

        // Condition B: LLM invoked tool call(s)
        if (round.type === 'tool_calls' && Array.isArray(round.toolCalls) && round.toolCalls.length > 0) {
          const toolResults = [];

          for (const call of round.toolCalls) {
            const toolStartTime = Date.now();
            onEvent?.({
              type: 'tool_start',
              runId,
              stepIndex,
              name: call.name,
              parameters: call.parameters || call.args
            });

            let observation;
            let isError = false;

            try {
              // Execute tool through registry with Zod validation
              const executionContext = { ...context, runId, userId, platform, channelId };
              const toolInputParameters = call.parameters || call.args;
              const result = await this.#toolRegistry.execute(call.name, toolInputParameters, executionContext);
              observation = typeof result === 'object' ? JSON.stringify(result) : String(result);
            } catch (error) {
              // Self-Healing mechanism: Feed the error back as Observation
              isError = true;
              observation = localization.t('agent.errors.tool_execution_failed', {
                toolName: call.name,
                errorMessage: error.message
              });
              console.warn(`[ReActEngine] Tool error on "${call.name}":`, error.message);
            }

            const durationMs = Date.now() - toolStartTime;

            // Record step in MySQL Scratchpad
            if (this.#stateRepository) {
              await this.#stateRepository.recordStep(runId, {
                stepIndex,
                thought: localization.t('agent.system.tool_thought', { toolName: call.name }),
                toolName: call.name,
                toolInput: call.parameters || call.args,
                toolOutput: observation,
                durationMs
              }).catch(() => {});
            }

            onEvent?.({
              type: 'tool_end',
              runId,
              stepIndex,
              name: call.name,
              isError,
              durationMs,
              output: observation
            });

            toolResults.push({
              id: call.id,
              name: call.name,
              content: observation
            });
          }

          // Append assistant tool-call turn & tool observation turn into history
          currentMessages.push({
            role: 'assistant_tool_call',
            toolCalls: round.toolCalls
          });
          currentMessages.push({
            role: 'tool_result',
            results: toolResults
          });
        }
      }

      // Step cap exceeded: Request final best-effort synthesis
      const fallbackPrompt = localization.t('agent.system.max_steps_fallback');
      currentMessages.push({ role: 'user', content: fallbackPrompt });
      const finalRound = await this.#provider.chat(currentMessages, enrichedSystemPrompt);
      totalTokensIn += finalRound.tokensIn || 0;
      totalTokensOut += finalRound.tokensOut || 0;

      const answer = finalRound.text;
      if (this.#stateRepository) {
        await this.#stateRepository.completeRun(runId, {
          status: 'success',
          finalAnswer: answer,
          totalSteps: stepIndex,
          totalTokensIn,
          totalTokensOut
        }).catch(() => {});
      }

      onEvent?.({ type: 'final_answer', text: answer, runId });

      return {
        runId,
        answer,
        totalSteps: stepIndex,
        tokensIn: totalTokensIn,
        tokensOut: totalTokensOut
      };
    } catch (fatalError) {
      if (this.#stateRepository) {
        await this.#stateRepository.completeRun(runId, {
          status: 'failed',
          finalAnswer: `Error: ${fatalError.message}`,
          totalSteps: stepIndex,
          totalTokensIn,
          totalTokensOut
        }).catch(() => {});
      }

      onEvent?.({ type: 'error', runId, error: fatalError.message });
      throw fatalError;
    }
  }
}

module.exports = ReActEngine;
