'use strict';

const axios = require('axios');
const { z } = require('zod');
const BaseTool = require('@services/agent/core/BaseTool');
const localization = require('@lang');

/**
 * Tool allowing the Agent to send a notification or report to Telegram.
 */
class TelegramNotifyTool extends BaseTool {
  #token;

  constructor(token = process.env.TELEGRAM_TOKEN) {
    const schema = z.object({
      chatId: z.string().describe(localization.t('agent.tools.telegram_notify.schema_chat_id')),
      message: z.string().min(1).describe(localization.t('agent.tools.telegram_notify.schema_message')),
      parseMode: z.enum(['Markdown', 'HTML', 'None']).default('Markdown').describe(localization.t('agent.tools.telegram_notify.schema_parse_mode'))
    });

    super(
      'telegram_notify',
      localization.t('agent.tools.telegram_notify.description'),
      schema
    );

    this.#token = token || process.env.TELEGRAM_TOKEN;
  }

  async execute(parameters, context = {}) {
    const token = this.#token || process.env.TELEGRAM_TOKEN;
    if (!token) {
      return {
        success: false,
        error: localization.t('agent.tools.telegram_notify.error_token_missing')
      };
    }

    const chatId = parameters.chatId || context.channelId;
    if (!chatId) {
      return {
        success: false,
        error: localization.t('agent.tools.telegram_notify.error_chat_id_missing')
      };
    }

    try {
      const payload = {
        chat_id: chatId,
        text: parameters.message
      };
      if (parameters.parseMode && parameters.parseMode !== 'None') {
        payload.parse_mode = parameters.parseMode;
      }

      const response = await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, payload, {
        timeout: 10000
      });

      return {
        success: true,
        messageId: response.data?.result?.message_id,
        chat: response.data?.result?.chat?.title || response.data?.result?.chat?.username
      };
    } catch (error) {
      return {
        success: false,
        error: localization.t('agent.tools.telegram_notify.error_send_failed', {
          errorMessage: error.response?.data?.description || error.message
        })
      };
    }
  }
}

module.exports = TelegramNotifyTool;
