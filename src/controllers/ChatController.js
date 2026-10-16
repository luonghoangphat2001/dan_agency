'use strict';

const ApiResponse = require('@utils/ApiResponse');

/**
 * Handles one-shot AI chat requests from the web dashboard.
 */
class ChatController {
  /** @type {import('../services/AIService')} */
  #aiService;

  /** @param {import('../services/AIService')} aiService */
  constructor(aiService) {
    this.#aiService = aiService;
    this.handle = this.handle.bind(this);
  }

  async handle(req, res) {
    const { message, model } = req.body || {};
    if (!message) {
      return ApiResponse.badRequest(res, 'No message', 'MISSING_MESSAGE');
    }

    try {
      const response = await this.#aiService.chatOnce(
        [{ role: 'user', content: message }],
        model || null
      );
      return ApiResponse.success(res, { response, model: model || 'default' });
    } catch (err) {
      console.error('[ChatController] chat failed:', err);
      return ApiResponse.serverError(res, err.message, 'CHAT_EXECUTION_ERROR');
    }
  }
}

module.exports = ChatController;
