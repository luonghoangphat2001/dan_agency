'use strict';

const { z } = require('zod');
const BaseTool = require('@services/agent/core/BaseTool');
const localization = require('@lang');

/**
 * Tool allowing the Agent to send notifications to Discord.
 */
class DiscordNotifyTool extends BaseTool {
  /** @type {import('@services/notification/DiscordNotificationService')} */
  #notificationService;

  constructor(notificationService) {
    const schema = z.object({
      title: z.string().min(1).max(255).describe(localization.t('agent.tools.discord_notify.schema_title')),
      message: z.string().min(1).max(1800).describe(localization.t('agent.tools.discord_notify.schema_message')),
      severity: z.enum(['info', 'success', 'warning', 'critical']).default('info').describe(localization.t('agent.tools.discord_notify.schema_severity')),
      channelId: z.string().optional().describe(localization.t('agent.tools.discord_notify.schema_channel_id'))
    });

    super(
      'discord_notify',
      localization.t('agent.tools.discord_notify.description'),
      schema
    );

    this.#notificationService = notificationService;
  }

  async execute(parameters, context = {}) {
    if (!this.#notificationService) {
      return {
        success: false,
        error: localization.t('agent.errors.service_unavailable', { serviceName: 'Discord' })
      };
    }

    try {
      const idempotencyKey = `agent-notify-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      await this.#notificationService.enqueue({
        idempotencyKey,
        title: parameters.title,
        message: parameters.message,
        severity: parameters.severity,
        source: 'dan-agent',
        channelId: parameters.channelId || context.channelId || null
      });

      // Attempt immediate delivery
      const deliveredResult = await this.#notificationService.deliverPending(5);

      return {
        success: true,
        delivered: deliveredResult.delivered > 0,
        queued: true,
        message: localization.t('agent.tools.discord_notify.success_message')
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = DiscordNotifyTool;
