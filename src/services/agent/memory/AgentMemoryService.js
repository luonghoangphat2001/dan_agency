'use strict';

const localization = require('@lang');

/**
 * Service managing 3-tiered memory for the Agent:
 * 1. Short-term Scratchpad: agent_steps from recent runs
 * 2. Working Context: recent chat messages from conversations
 * 3. Long-term Profile: user insights and memories from ai_memories
 */
class AgentMemoryService {
  /** @type {import('@models/ConversationRepository')} */
  #conversationRepository;
  /** @type {import('@models/InsightRepository')} */
  #insightRepository;
  /** @type {import('@models/AgentStateRepository')} */
  #stateRepository;

  constructor({
    conversationRepository,
    conversationRepo = null,
    insightRepository,
    insightRepo = null,
    stateRepository,
    stateRepo = null
  }) {
    this.#conversationRepository = conversationRepository || conversationRepo;
    this.#insightRepository = insightRepository || insightRepo;
    this.#stateRepository = stateRepository || stateRepo;
  }

  /**
   * Builds complete prompt context incorporating user profile and chat history.
   *
   * @param {object} contextParameters
   * @param {string} contextParameters.userId
   * @param {string} [contextParameters.platform='web']
   * @param {string} [contextParameters.channelId]
   * @param {number} [contextParameters.historyLimit=8]
   * @returns {Promise<{ systemContext: string, historyMessages: Array<{role: string, content: string}> }>}
   */
  async buildMemoryContext({ userId, platform = 'web', channelId = null, historyLimit = 8 }) {
    // 1. Fetch Long-term User Memories
    let userMemories = [];
    if (this.#insightRepository && userId) {
      try {
        userMemories = await this.#insightRepository.findByUser(userId, platform);
      } catch (error) {
        console.warn('[AgentMemoryService] Failed to load user memories:', error.message);
      }
    }

    let memorySection = '';
    if (Array.isArray(userMemories) && userMemories.length > 0) {
      const items = userMemories.map(memory => `- ${memory.mem_key}: ${memory.mem_value}`).join('\n');
      memorySection = `\n${localization.t('agent.system.memory_section_header')}\n${items}\n`;
    }

    // 2. Fetch Working Chat History
    const historyMessages = [];
    const effectiveChannelId = channelId || `${platform}_${userId}`;
    if (this.#conversationRepository && effectiveChannelId) {
      try {
        const rows = await this.#conversationRepository.findByChannel(effectiveChannelId, historyLimit);
        if (Array.isArray(rows)) {
          for (const row of rows) {
            if (row.role === 'user' || row.role === 'assistant') {
              historyMessages.push({
                role: row.role,
                content: row.content
              });
            }
          }
        }
      } catch (error) {
        console.warn('[AgentMemoryService] Failed to load conversation history:', error.message);
      }
    }

    return {
      systemContext: memorySection,
      historyMessages
    };
  }

  /**
   * Saves conversation turn to the conversations table.
   */
  async saveConversationTurn({ channelId, userId, username, role, content, model, tokensIn = 0, tokensOut = 0 }) {
    if (this.#conversationRepository) {
      await this.#conversationRepository.save({
        channelId,
        userId,
        username,
        role,
        content,
        model,
        tokensIn,
        tokensOut
      }).catch(error => console.error('[AgentMemoryService] Failed to save conversation turn:', error.message));
    }
  }

  /**
   * Retrieves detailed execution trace for a given run ID.
   */
  async getRunTrace(runId) {
    if (this.#stateRepository) {
      return await this.#stateRepository.getRunDetails(runId);
    }
    return null;
  }
}

module.exports = AgentMemoryService;
