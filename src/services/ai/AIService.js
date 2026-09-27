'use strict';

const AIFactory         = require('@services/ai/AIFactory');
const AgentLoop         = require('@services/ai/AgentLoop');
const InsightRepository = require('@models/InsightRepository');
const Database          = require('@models/Database');
const SkillService      = require('@services/agent/skills/SkillService');
const localization      = require('@lang');
const {
  getProviderMeta,
  getProviderOrder,
  getFallbackVersion,
} = require('@services/ai/ProviderCatalog');

/**
 * AI business-logic service.
 * Orchestrates provider selection, history retrieval, and message persistence.
 */
class AIService {
  /** @type {import('../models/ConfigRepository')} */
  #configRepo;
  /** @type {import('../models/ConversationRepository')} */
  #conversationRepo;
  /** @type {import('../models/InsightRepository')|null} */
  #insightRepo;
  /** @type {SkillService} */
  #skillService;

  /**
   * @param {import('../models/ConfigRepository')} configRepo
   * @param {import('../models/ConversationRepository')} conversationRepo
   * @param {import('../models/InsightRepository')|null} [insightRepo]
   * @param {SkillService|null} [skillService]
   */
  constructor(configRepo, conversationRepo, insightRepo = null, skillService = null) {
    this.#configRepo = configRepo;
    this.#conversationRepo = conversationRepo;
    this.#insightRepo = insightRepo;
    this.#skillService = skillService || new SkillService();
  }

  /**
   * Returns the injected SkillService instance.
   * @returns {SkillService}
   */
  getSkillService() {
    return this.#skillService;
  }

  /**
   * Send a message with full channel-history context.
   * Persists both the user message and the AI response.
   *
   * @param {{ channelId: string, userId: string, username: string, prompt: string }} opts
   * @returns {Promise<string>}
   */
  async chat({ channelId, userId, username, prompt, platform = null }) {
    await this.#configRepo.refreshIfNeeded();

    const configKey   = platform ? `${platform}_active_model` : 'active_model';
    const activeModel = this.#configRepo.get(configKey) || this.#configRepo.get('active_model') || 'gemini';
    const systemPrompt = this.#configRepo.get('system_prompt') || localization.t('agent.system.default_prompt');

    const history = await this.#conversationRepo.findByChannel(channelId, 10);
    const messages = [
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: 'user', content: prompt },
    ];

    console.log(`[AIService] chat | platform=${platform} model=${activeModel} user=${username}(${userId}) channel=${channelId} prompt="${prompt.slice(0, 80)}${prompt.length > 80 ? '…' : ''}"`);

    let usedProvider = activeModel;
    let result;
    const t0 = Date.now();
    try {
      ({ result, usedProvider } = await this.#chatWithFallbacks('chat', activeModel, messages, systemPrompt));
    } catch (err) {
      console.error(`[AIService] Provider error (${activeModel}):`, err);
      throw err;
    }

    const elapsed   = Date.now() - t0;
    const text      = result.text      ?? result;
    const tokensIn  = result.tokensIn  ?? 0;
    const tokensOut = result.tokensOut ?? 0;
    const savedModel = this.#resolveModelVersion(usedProvider);

    console.log(`[AIService] done  | model=${savedModel} tokens=${tokensIn}in/${tokensOut}out time=${elapsed}ms reply="${text.slice(0, 60)}${text.length > 60 ? '…' : ''}"`);

    await this.#conversationRepo.save({ channelId, userId, username, role: 'user', content: prompt, model: savedModel });
    await this.#conversationRepo.save({ channelId, userId: 'bot', username: 'Đần', role: 'assistant', content: text, model: savedModel, tokensIn, tokensOut });

    return text;
  }

  /**
   * Chat with extra context (e.g. search results) injected for this turn only.
   * Saves the original user prompt to history - NOT the full context-augmented prompt.
   *
   * @param {{ channelId: string, userId: string, username: string, prompt: string, context: string, platform?: string }} opts
   * @returns {Promise<string>}
   */
  async chatWithContext({ channelId, userId, username, prompt, context, platform = null }) {
    await this.#configRepo.refreshIfNeeded();

    const configKey   = platform ? `${platform}_active_model` : 'active_model';
    const activeModel = this.#configRepo.get(configKey) || this.#configRepo.get('active_model') || 'gemini';
    const systemPrompt = this.#configRepo.get('system_prompt') || localization.t('agent.system.default_prompt');

    const history = await this.#conversationRepo.findByChannel(channelId, 10);
    const augmentedPrompt = localization.t('agent.system.augmented_prompt', { context, prompt });
    const messages = [
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: 'user', content: augmentedPrompt },
    ];

    console.log(`[AIService] chatWithContext | platform=${platform} model=${activeModel} user=${username}(${userId}) channel=${channelId} prompt="${prompt.slice(0, 80)}"`);

    let usedProvider = activeModel;
    let result;
    const t0 = Date.now();
    try {
      ({ result, usedProvider } = await this.#chatWithFallbacks('chat', activeModel, messages, systemPrompt));
    } catch (err) {
      console.error(`[AIService] Provider error (${activeModel}):`, err);
      throw err;
    }

    const elapsed   = Date.now() - t0;
    const text      = result.text      ?? result;
    const tokensIn  = result.tokensIn  ?? 0;
    const tokensOut = result.tokensOut ?? 0;
    const savedModel = this.#resolveModelVersion(usedProvider);

    console.log(`[AIService] done  | model=${savedModel} tokens=${tokensIn}in/${tokensOut}out time=${elapsed}ms`);

    await this.#conversationRepo.save({ channelId, userId, username, role: 'user', content: prompt, model: savedModel });
    await this.#conversationRepo.save({ channelId, userId: 'bot', username: 'Đần', role: 'assistant', content: text, model: savedModel, tokensIn, tokensOut });

    return text;
  }

  /**
   * Agent-mode chat: AI decides when to call OpenClaw tools autonomously.
   *
   * @param {{ channelId: string, userId: string, username: string, prompt: string, platform?: string, openClawService: import('../services/OpenClawService'), schedulerService?: import('../services/SchedulerService') }} opts
   * @returns {Promise<string>}
   */
  async agentChat({ channelId, userId, username, prompt, platform = null, openClawService, schedulerService = null }) {
    await this.#configRepo.refreshIfNeeded();

    const configKey   = platform ? `${platform}_active_model` : 'active_model';
    const activeModel = this.#configRepo.get(configKey) || this.#configRepo.get('active_model') || 'gemini';
    const systemPrompt = this.#configRepo.get('system_prompt') || localization.t('agent.system.default_prompt');

    const history  = await this.#conversationRepo.findByChannel(channelId, 10);
    const messages = [
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: 'user', content: prompt },
    ];

    console.log(`[AIService] agentChat | platform=${platform} model=${activeModel} user=${username}(${userId}) channel=${channelId} prompt="${prompt.slice(0, 80)}${prompt.length > 80 ? '…' : ''}"`);

    let enhancedSystemPrompt = systemPrompt;
    // Load orchestration policy from skill file — avoids hardcoded business logic in source code.
    const orchestrationSkill = this.#skillService.getSkill('openclaw-orchestration');
    if (orchestrationSkill?.content) {
      enhancedSystemPrompt += '\n\n' + orchestrationSkill.content;
    }
    let iRepo = this.#insightRepo;
    try {
      if (!iRepo) {
        const db = await Database.getInstance();
        iRepo = new InsightRepository(db);
      }
      const mems = await iRepo.findByUser(userId, platform || 'unknown');
      if (mems && mems.length > 0) {
        const memStr = mems.map((m) => `- ${m.mem_key}: ${m.mem_value}`).join('\n');
        const header = localization.t('agent.system.user_memory_header');
        enhancedSystemPrompt += `\n\n${header}\n${memStr}`;
      }
    } catch (_) { /* memory does not block main flow */ }

    const context = {
      userId,
      platform: platform || 'unknown',
      channelId,
      username,
      authorizedOperator: this.#isAuthorizedOperator(userId, platform),
    };
    let usedProvider = activeModel;
    let result;
    const t0 = Date.now();
    try {
      ({ result, usedProvider } = await this.#agentChatWithFallbacks(
        activeModel,
        messages,
        enhancedSystemPrompt,
        openClawService,
        iRepo,
        context,
        schedulerService,
      ));
    } catch (err) {
      console.error(`[AIService] agentChat error (${activeModel}):`, err);
      // An orchestration request must never degrade into an unrelated web
      // search. A schedule/company action needs a working model and its
      // structured tool call; search results can look successful while
      // silently skipping the requested side effect.
      throw new Error(`AI orchestration unavailable: ${err?.message || 'no provider available'}`);
    }

    const elapsed    = Date.now() - t0;
    const text       = result.text;
    const tokensIn   = result.tokensIn  ?? 0;
    const tokensOut  = result.tokensOut ?? 0;
    const savedModel = this.#resolveModelVersion(usedProvider);

    console.log(`[AIService] agentChat done | model=${savedModel} tokens=${tokensIn}in/${tokensOut}out time=${elapsed}ms`);

    await this.#conversationRepo.save({ channelId, userId, username, role: 'user', content: prompt, model: savedModel });
    await this.#conversationRepo.save({ channelId, userId: 'bot', username: 'Đần', role: 'assistant', content: text, model: savedModel, tokensIn, tokensOut });

    return text;
  }

  /**
   * One-shot chat without history or persistence (used by the web dashboard).
   *
   * @param {Array<{role: string, content: string}>} messages
   * @param {string|null} [modelOverride]
   * @returns {Promise<string>}
   */
  async chatOnce(messages, modelOverride = null, platform = null) {
    await this.#configRepo.refreshIfNeeded();
    const model = modelOverride || this.#configRepo.get(platform ? `${platform}_active_model` : 'active_model') || 'gemini';
    const systemPrompt = this.#configRepo.get('system_prompt') || localization.t('agent.system.default_prompt');
    const { result } = await this.#chatWithFallbacks('chat', model, messages, systemPrompt);
    return result.text ?? result;
  }

  /**
   * Get the currently active model key and its display label.
   * @param {string|null} [platform]
   * @returns {{ key: string, label: string }}
   */
  currentModel(platform = null) {
    const configKey = platform ? `${platform}_active_model` : 'active_model';
    const key = this.#configRepo.get(configKey) || 'gemini';
    return { key, label: getProviderMeta(key).label };
  }

  /**
   * Switch the active model and persist it.
   * @param {'gemini'|'claude'|'chatgpt'|'deepseek'|'vllm'|'kimi'|'ollama'} modelKey
   * @param {string|null} [platform]
   * @returns {Promise<string>} Display label of the new model
   */
  async setModel(modelKey, platform = null) {
    const configKey = platform ? `${platform}_active_model` : 'active_model';
    await this.#configRepo.set(configKey, modelKey);
    const label = this.currentModel(platform).label;
    console.log(`[AIService] model switched | platform=${platform} key=${modelKey} label=${label}`);
    return label;
  }

  /**
   * Map a provider key ('gemini'|'claude'|'chatgpt'|'deepseek'|'vllm'|'kimi'|'ollama') to the actual model version
   * string stored in config, so stats show meaningful names.
   * @param {string} providerKey
   * @returns {string}
   */
  #resolveModelVersion(providerKey) {
    return getFallbackVersion(providerKey, this.#configRepo);
  }

  #isAuthorizedOperator(userId, platform) {
    if (!['discord', 'telegram'].includes(platform)) return false;
    const configuredIds = [
      process.env.CEO_DISCORD_USER_IDS,
      process.env.CEO_DISCORD_USER_ID,
      process.env.CEO_TELEGRAM_USER_IDS,
      process.env.CEO_TELEGRAM_USER_ID,
    ].filter(Boolean)
      .flatMap((value) => String(value).split(','))
      .map((value) => value.trim())
      .filter(Boolean);
    return configuredIds.includes(String(userId));
  }

  /**
   * Get active provider instance for Agent execution.
   * @param {string} [model]
   * @returns {import('./AIProvider')}
   */
  getProvider(model = null) {
    const activeModel = model || this.#configRepo.get('active_model') || 'gemini';
    return this.#createProvider(activeModel);
  }

  /**
   * Get current model name.
   * @param {string} [platform]
   * @returns {string}
   */
  getCurrentModel(platform = null) {
    const configKey = platform ? `${platform}_active_model` : 'active_model';
    return this.#configRepo.get(configKey) || this.#configRepo.get('active_model') || 'gemini';
  }

  /** @param {string} model */
  #createProvider(model) {
    return AIFactory.create(model, {
      geminiModel:  this.#configRepo.get('gemini_model'),
      claudeModel:  this.#configRepo.get('claude_model'),
      claudeBaseUrl: this.#configRepo.get('claude_base_url'),
      chatgptModel:  this.#configRepo.get('chatgpt_model'),
      kimiModel:     this.#configRepo.get('kimi_model') || process.env.KIMI_MODEL,
      kimiBaseUrl:   process.env.KIMI_BASE_URL,
      kimiApiKey:    process.env.KIMI_API_KEY,
      deepseekModel: this.#configRepo.get('deepseek_model') || process.env.DEEPSEEK_MODEL,
      deepseekBaseUrl: process.env.DEEPSEEK_BASE_URL,
      vllmModel:     this.#configRepo.get('vllm_model') || process.env.VLLM_MODEL,
      vllmBaseUrl:   process.env.VLLM_BASE_URL,
      ollamaModel:   this.#configRepo.get('ollama_model') || process.env.OLLAMA_MODEL,
      ollamaBaseUrl: process.env.OLLAMA_BASE_URL,
      nvidiaModel:   this.#configRepo.get('nvidia_model') || process.env.NVIDIA_MODEL,
      nvidiaBaseUrl: process.env.NVIDIA_BASE_URL,
      cloudflareModel: this.#configRepo.get('cloudflare_model') || process.env.CLOUDFLARE_MODEL,
      cloudflareBaseUrl: process.env.CLOUDFLARE_BASE_URL,
    });
  }

  /**
   * Build the provider order for a request.
   * @param {string} primaryModel
   * @returns {string[]}
   */
  #providerOrder(primaryModel) {
    const order = [];
    const add = (key) => {
      if (!key || order.includes(key)) return;
      order.push(key);
    };

    add(primaryModel);
    for (const key of getProviderOrder()) add(key);
    return order;
  }

  /**
   * Try providers in order until one succeeds.
   * @param {'chat'|'chatWithTools'} mode
   * @param {string} primaryModel
   * @param {Array<object>} messages
   * @param {string} systemPrompt
   * @returns {Promise<{result: any, usedProvider: string}>}
   */
  async #chatWithFallbacks(mode, primaryModel, messages, systemPrompt) {
    let lastErr = null;
    for (const providerKey of this.#providerOrder(primaryModel)) {
      try {
        const provider = this.#createProvider(providerKey);
        const result = mode === 'chatWithTools'
          ? await provider.chatWithTools(messages, systemPrompt)
          : await provider.chat(messages, systemPrompt);
        return { result, usedProvider: providerKey };
      } catch (err) {
        lastErr = err;
        console.warn(`[AIService] ${mode} failed (${providerKey}): ${err.message}`);
      }
    }
    throw lastErr || new Error('No AI provider available');
  }

  /**
   * Agent loop with provider fallback.
   * @param {string} primaryModel
   * @param {Array<object>} messages
   * @param {string} systemPrompt
   * @param {import('./OpenClawService')} openClawService
   * @param {import('../models/InsightRepository')|null} insightRepo
   * @param {{userId: string, platform: string, channelId: string}|null} context
   * @param {import('./SchedulerService')|null} schedulerService
   * @returns {Promise<{result: {text: string, tokensIn?: number, tokensOut?: number}, usedProvider: string}>}
   */
  async #agentChatWithFallbacks(primaryModel, messages, systemPrompt, openClawService, insightRepo, context, schedulerService = null) {
    let lastErr = null;
    for (const providerKey of this.#providerOrder(primaryModel)) {
      try {
        const provider = this.#createProvider(providerKey);
        const result = await new AgentLoop(provider, openClawService, insightRepo, schedulerService, this.#skillService)
          .run(messages, systemPrompt, context);
        return { result, usedProvider: providerKey };
      } catch (err) {
        const message = err?.message || String(err);
        lastErr = err;
        console.warn(`[AIService] agentChat failed (${providerKey}):`, err);
        if (this.#shouldSkipProviderError(err)) continue;
      }
    }
    throw lastErr || new Error('No AI provider available');
  }

  /**
   * Errors like quota, billing, auth, or balance issues are treated as provider-level dead ends.
   * @param {unknown} err
   * @returns {boolean}
   */
  #shouldSkipProviderError(err) {
    const text = `${err?.message || ''} ${err?.code || ''}`.toLowerCase();
    return (
      text.includes('quota') ||
      text.includes('insufficient balance') ||
      text.includes('billing') ||
      text.includes('invalid api key') ||
      text.includes('unauthorized') ||
      text.includes('access denied') ||
      text.includes('suspended') ||
      text.includes('connection error')
    );
  }

}

module.exports = AIService;
