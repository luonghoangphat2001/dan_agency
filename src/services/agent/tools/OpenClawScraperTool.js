'use strict';

const { z } = require('zod');
const axios = require('axios');
const BaseTool = require('@services/agent/core/BaseTool');

/**
 * Tool for triggering OpenClaw Playwright Scraper microservice.
 */
class OpenClawScraperTool extends BaseTool {
  #openClawUrl;

  constructor(openClawUrl = process.env.OPENCLAW_URL || 'http://127.0.0.1:4000') {
    const schema = z.object({
      url: z.string().url().describe('Target webpage URL to scrape via OpenClaw'),
      selector: z.string().optional().describe('Optional CSS selector to target specific DOM element'),
    });

    super(
      'openclaw_scrape',
      'Triggers OpenClaw Playwright scraper to extract real-time web page content or DOM elements.',
      schema
    );

    this.#openClawUrl = openClawUrl;
  }

  async execute(parameters, _context = {}) {
    const { url, selector } = parameters;
    try {
      const response = await axios.post(
        `${this.#openClawUrl}/api/v1/fetch`,
        { url, selector: selector || 'body' },
        { timeout: 15000 }
      );

      return {
        success: true,
        url,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        url,
        error: error.message
      };
    }
  }
}

module.exports = OpenClawScraperTool;
