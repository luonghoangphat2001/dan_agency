'use strict';

const localization = require('@lang');

/**
 * Controller handling Agent ReAct chat and trace endpoints.
 */
class AgentController {
  /** @type {import('@services/agent/AgentService')} */
  #agentService;

  /**
   * @param {import('@services/agent/AgentService')} agentService
   */
  constructor(agentService) {
    this.#agentService = agentService;
    this.chat = this.chat.bind(this);
    this.getRun = this.getRun.bind(this);
    this.listTools = this.listTools.bind(this);
  }

  /**
   * POST /api/agent/chat
   * Supports standard JSON response or Server-Sent Events (SSE).
   */
  async chat(request, response) {
    const { prompt, model, stream = false, channelId = null } = request.body || {};
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return response.status(400).json({ ok: false, error: localization.t('agent.errors.prompt_required') });
    }

    const userId = request.user?.id ? String(request.user.id) : (request.headers['x-user-id'] || 'web_user');
    const username = request.user?.username || 'Web User';
    const platform = 'web';

    // 1. SSE Streaming Mode
    if (stream === true || stream === 'true') {
      response.setHeader('Content-Type', 'text/event-stream');
      response.setHeader('Cache-Control', 'no-cache');
      response.setHeader('Connection', 'keep-alive');
      response.flushHeaders?.();

      const sendEvent = (event, data) => {
        response.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      };

      try {
        const result = await this.#agentService.chat({
          userId,
          username,
          platform,
          channelId,
          prompt,
          model,
          onEvent: (event) => {
            sendEvent(event.type || 'message', event);
          }
        });

        sendEvent('done', result);
        return response.end();
      } catch (error) {
        sendEvent('error', { error: error.message });
        return response.end();
      }
    }

    // 2. Standard JSON Mode
    try {
      const result = await this.#agentService.chat({
        userId,
        username,
        platform,
        channelId,
        prompt,
        model
      });

      return response.json({
        ok: true,
        data: result
      });
    } catch (error) {
      console.error('[AgentController] Error during chat:', error);
      return response.status(500).json({
        ok: false,
        error: error.message || localization.t('agent.errors.internal_agent_error')
      });
    }
  }

  /**
   * GET /api/agent/runs/:id
   */
  async getRun(request, response) {
    const { id } = request.params;
    if (!id) {
      return response.status(400).json({ ok: false, error: localization.t('agent.errors.run_id_required') });
    }

    try {
      const trace = await this.#agentService.getRunTrace(id);
      if (!trace) {
        return response.status(404).json({ ok: false, error: localization.t('agent.errors.run_not_found') });
      }

      return response.json({ ok: true, data: trace });
    } catch (error) {
      return response.status(500).json({ ok: false, error: error.message });
    }
  }

  /**
   * GET /api/agent/tools
   */
  async listTools(request, response) {
    try {
      const registry = this.#agentService.getToolRegistry();
      const tools = registry.getAll().map(tool => ({
        name: tool.name,
        description: tool.description
      }));

      return response.json({ ok: true, count: tools.length, data: tools });
    } catch (error) {
      return response.status(500).json({ ok: false, error: error.message });
    }
  }
}

module.exports = AgentController;
