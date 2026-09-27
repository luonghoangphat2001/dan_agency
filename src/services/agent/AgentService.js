'use strict';

const ToolRegistry = require('@services/agent/core/ToolRegistry');
const ReActEngine = require('@services/agent/core/ReActEngine');
const AgentMemoryService = require('@services/agent/memory/AgentMemoryService');
const MySQLQueryTool = require('@services/agent/tools/MySQLQueryTool');
const ExcelReaderTool = require('@services/agent/tools/ExcelReaderTool');
const DiscordNotifyTool = require('@services/agent/tools/DiscordNotifyTool');
const TelegramNotifyTool = require('@services/agent/tools/TelegramNotifyTool');
const WebSearchTool = require('@services/agent/tools/WebSearchTool');
const WebCrawlTool = require('@services/agent/tools/WebCrawlTool');
const WorkspaceSandboxService = require('@services/agent/sandbox/WorkspaceSandboxService');
const WorkspaceFileTool = require('@services/agent/tools/WorkspaceFileTool');
const WorkspaceCommandTool = require('@services/agent/tools/WorkspaceCommandTool');
const SkillService = require('@services/agent/skills/SkillService');
const SkillLoaderTool = require('@services/agent/tools/SkillLoaderTool');
const localization = require('@lang');

/**
 * Top-level Agent Service providing complete ReAct AI Agent capabilities.
 */
class AgentService {
  /** @type {ToolRegistry} */
  #toolRegistry;
  /** @type {AgentMemoryService} */
  #memoryService;
  /** @type {import('@models/AgentStateRepository')} */
  #stateRepository;
  /** @type {import('@services/ai/AIService')} */
  #aiService;
  /** @type {import('@services/openclaw/OpenClawService')|null} */
  #openClawService;
  /** @type {import('@services/notification/DiscordNotificationService')|null} */
  #discordNotifyService;
  /** @type {WorkspaceSandboxService} */
  #workspaceSandboxService;
  /** @type {SkillService} */
  #skillService;

  /**
   * @param {object} serviceParameters
   * @param {import('@services/ai/AIService')} serviceParameters.aiService
   * @param {import('@models/Database')} serviceParameters.database
   * @param {import('@models/AgentStateRepository')} serviceParameters.stateRepository
   * @param {import('@models/ConversationRepository')} serviceParameters.conversationRepository
   * @param {import('@models/InsightRepository')} serviceParameters.insightRepository
   * @param {import('@services/openclaw/OpenClawService')|null} [serviceParameters.openClawService]
   * @param {import('@services/notification/DiscordNotificationService')|null} [serviceParameters.discordNotifyService]
   */
  constructor({
    aiService,
    database = null,
    db = null,
    stateRepository = null,
    stateRepo = null,
    conversationRepository = null,
    conversationRepo = null,
    insightRepository = null,
    insightRepo = null,
    openClawService = null,
    discordNotifyService = null
  }) {
    const resolvedDatabase = database || db;
    const resolvedStateRepo = stateRepository || stateRepo;
    const resolvedConversationRepo = conversationRepository || conversationRepo;
    const resolvedInsightRepo = insightRepository || insightRepo;

    this.#aiService = aiService;
    this.#stateRepository = resolvedStateRepo;
    this.#openClawService = openClawService;
    this.#discordNotifyService = discordNotifyService;

    // 1. Initialize Memory Service
    this.#memoryService = new AgentMemoryService({
      conversationRepository: resolvedConversationRepo,
      insightRepository: resolvedInsightRepo,
      stateRepository: resolvedStateRepo
    });

    // 2. Initialize Workspace Sandbox & Dynamic Skill Services
    this.#workspaceSandboxService = new WorkspaceSandboxService({
      openClawService: this.#openClawService
    });
    this.#skillService = new SkillService();

    // 3. Initialize Tool Registry and register tools
    this.#toolRegistry = new ToolRegistry();
    this.#registerDefaultTools(resolvedDatabase);
  }

  #registerDefaultTools(database) {
    if (database) {
      this.#toolRegistry.register(new MySQLQueryTool(database));
    }
    this.#toolRegistry.register(new ExcelReaderTool());
    this.#toolRegistry.register(new DiscordNotifyTool(this.#discordNotifyService));
    this.#toolRegistry.register(new TelegramNotifyTool());

    // Register Workspace Sandbox Tools
    this.#toolRegistry.register(new WorkspaceFileTool(this.#workspaceSandboxService));
    this.#toolRegistry.register(new WorkspaceCommandTool(this.#workspaceSandboxService));

    // Register Dynamic Skill Loader Tool
    this.#toolRegistry.register(new SkillLoaderTool(this.#skillService));

    if (this.#openClawService) {
      this.#toolRegistry.register(new WebSearchTool(this.#openClawService));
      this.#toolRegistry.register(new WebCrawlTool(this.#openClawService));
    }
  }

  /**
   * Registers a custom external tool into the agent.
   * @param {import('./core/BaseTool')} tool
   */
  registerTool(tool) {
    this.#toolRegistry.register(tool);
    return this;
  }

  /**
   * Get the active tool registry
   * @returns {ToolRegistry}
   */
  getToolRegistry() {
    return this.#toolRegistry;
  }

  /**
   * Get the active Workspace Sandbox Service
   * @returns {WorkspaceSandboxService}
   */
  getWorkspaceService() {
    return this.#workspaceSandboxService;
  }

  /**
   * Get the active Skill Service
   * @returns {SkillService}
   */
  getSkillService() {
    return this.#skillService;
  }

  /**
   * Main entry point for interacting with the Autonomous Agent.
   *
   * @param {object} chatParameters
   * @param {string} chatParameters.userId
   * @param {string} [chatParameters.username='User']
   * @param {string} [chatParameters.platform='web']
   * @param {string} [chatParameters.channelId]
   * @param {string} chatParameters.prompt
   * @param {string} [chatParameters.model]
   * @param {Function} [chatParameters.onEvent] - Real-time SSE or WebSocket stream callback
   * @returns {Promise<{ runId: string, answer: string, totalSteps: number, tokensIn: number, tokensOut: number }>}
   */
  async chat({
    userId,
    username = 'User',
    platform = 'web',
    channelId = null,
    prompt,
    model = null,
    onEvent = null
  }) {
    const effectiveChannelId = channelId || `${platform}_${userId}`;

    // 1. Build Memory Context
    const { systemContext, historyMessages } = await this.#memoryService.buildMemoryContext({
      userId,
      platform,
      channelId: effectiveChannelId,
      historyLimit: 6
    });

    // 2. Resolve Active AI Provider
    const provider = this.#aiService.getProvider(model);
    const skillsContext = this.#skillService.formatSkillsForPrompt();
    const systemPrompt = [
      localization.t('agent.system.default_prompt'),
      localization.t('agent.system.tools_preamble'),
      skillsContext,
      systemContext
    ].filter(Boolean).join('\n\n');

    // 3. Initialize ReAct Engine
    const engine = new ReActEngine({
      provider,
      toolRegistry: this.#toolRegistry,
      stateRepository: this.#stateRepository,
      options: { maxSteps: 8 }
    });

    // 4. Execute ReAct Loop
    const result = await engine.run({
      userId,
      platform,
      channelId: effectiveChannelId,
      prompt,
      messages: [...historyMessages, { role: 'user', content: prompt }],
      systemPrompt,
      context: { userId, username, platform, channelId: effectiveChannelId },
      onEvent
    });

    // 5. Persist Chat turns to history
    await this.#memoryService.saveConversationTurn({
      channelId: effectiveChannelId,
      userId,
      username,
      role: 'user',
      content: prompt,
      model: model || this.#aiService.getCurrentModel(),
      tokensIn: 0,
      tokensOut: 0
    });

    await this.#memoryService.saveConversationTurn({
      channelId: effectiveChannelId,
      userId: 'bot',
      username: 'Dan AI Agent',
      role: 'assistant',
      content: result.answer,
      model: model || this.#aiService.getCurrentModel(),
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut
    });

    return result;
  }

  /**
   * Retrieves step-by-step trace of a run
   * @param {string} runId
   */
  async getRunTrace(runId) {
    return await this.#memoryService.getRunTrace(runId);
  }
}

module.exports = AgentService;
