/**
 * @fileoverview automate.service - Provides automate functionality.
 */
'use strict';

const AppError = require('@utils/errors/app.error');
const { WebAction } = require('@enums');

const STEP_HANDLERS = Object.freeze({
  [WebAction.CLICK]: async (page, step) => {
    if (step.selector) {
      await page.click(step.selector);
    }
  },
  [WebAction.FILL]: async (page, step) => {
    if (step.selector) {
      await page.fill(step.selector, step.value ?? '');
    }
  },
  [WebAction.WAIT]: async (page, step) => {
    await page.waitForTimeout(step.ms ?? 1000);
  },
});

/**
 * AutomateService
 * Manages automate logic.
 */
class AutomateService {
  /**
   * constructor - Executes constructor.
   * @param {*} browserEngine - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor(browserEngine = null) {
    this.browserEngine = browserEngine;
  }

  /**
   * automate - Asynchronously executes automate.
   * @param {*} url - Input parameter.
   * @param {*} steps - Input parameter.
   * @param {*} screenshot - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async automate({ url, steps = [], screenshot = false }) {
    let browser;

    try {
      browser = await this.getBrowserEngine().launch({
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-zygote',
          '--single-process',
        ],
      });
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

      for (const step of steps) {
        await this.runStep(page, step);
      }

      const result = { url };
      if (screenshot) {
        const buf = await page.screenshot({ type: 'png' });
        result.screenshot = buf.toString('base64');
      }

      return result;
    } finally {
      if (browser) await browser.close();
    }
  }

  /**
   * getBrowserEngine - Executes get browser engine.
   * @returns {*} Result of operation.
   */
  getBrowserEngine() {
    if (this.browserEngine) {
      return this.browserEngine;
    }

    try {
      this.browserEngine = require('playwright').chromium;
      return this.browserEngine;
    } catch (err) {
      throw new AppError('playwright is not installed. Run npm install before using browser automation.', 500);
    }
  }

  /**
   * runStep - Asynchronously executes run step using strategy pattern.
   * @param {*} page - Input parameter.
   * @param {*} step - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async runStep(page, step) {
    const handler = STEP_HANDLERS[step?.action];
    if (handler) {
      await handler(page, step);
    }
  }
}

module.exports = AutomateService;
