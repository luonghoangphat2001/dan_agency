'use strict';

const { z } = require('zod');
const BaseTool = require('@services/agent/core/BaseTool');
const localization = require('@lang');

/**
 * Tool for executing web searches via OpenClaw / Google Custom Search.
 */
class WebSearchTool extends BaseTool {
  /** @type {import('@services/openclaw/OpenClawService')} */
  #openClawService;

  constructor(openClawService) {
    const schema = z.object({
      query: z.string().min(1).describe(localization.t('agent.tools.web_search.schema_query')),
      num: z.number().int().min(1).max(20).default(5).describe(localization.t('agent.tools.web_search.schema_num'))
    });

    super(
      'web_search',
      localization.t('agent.tools.web_search.description'),
      schema
    );

    this.#openClawService = openClawService;
  }

  async execute(parameters, context = {}) {
    if (!this.#openClawService) {
      return {
        success: false,
        error: localization.t('agent.errors.service_unavailable', { serviceName: 'OpenClaw' })
      };
    }

    try {
      const results = await this.#openClawService.search(parameters.query, parameters.num);
      return {
        success: true,
        query: parameters.query,
        count: (results.results || []).length,
        results: results.results || []
      };
    } catch (error) {
      return {
        success: false,
        error: localization.t('agent.tools.web_search.error_search_failed', { errorMessage: error.message })
      };
    }
  }
}

module.exports = WebSearchTool;
