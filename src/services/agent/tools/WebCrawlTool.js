'use strict';

const { z } = require('zod');
const BaseTool = require('@services/agent/core/BaseTool');
const localization = require('@lang');

/**
 * Tool for reading webpage content using OpenClaw's headless browser crawler.
 */
class WebCrawlTool extends BaseTool {
  /** @type {import('@services/openclaw/OpenClawService')} */
  #openClawService;

  constructor(openClawService) {
    const schema = z.object({
      url: z.string().url().describe(localization.t('agent.tools.web_crawl.schema_url')),
      selector: z.string().optional().describe(localization.t('agent.tools.web_crawl.schema_selector'))
    });

    super(
      'web_crawl',
      localization.t('agent.tools.web_crawl.description'),
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
      const crawlResult = await this.#openClawService.crawl(parameters.url, parameters.selector || null);
      // Truncate text if excessively long to protect token limit
      const maxCharacters = 8000;
      let textContent = crawlResult.text || '';
      const isTruncated = textContent.length > maxCharacters;
      if (isTruncated) {
        textContent = textContent.substring(0, maxCharacters) + localization.t('agent.tools.web_crawl.truncated_suffix');
      }

      return {
        success: true,
        url: parameters.url,
        title: crawlResult.title || '',
        httpStatus: crawlResult.httpStatus || 200,
        isTruncated,
        content: textContent
      };
    } catch (error) {
      return {
        success: false,
        error: localization.t('agent.tools.web_crawl.error_crawl_failed', { errorMessage: error.message })
      };
    }
  }
}

module.exports = WebCrawlTool;
