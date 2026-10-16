'use strict';

const defaultAiEngineClient = require('@services/ai/AIEngineClient');
const ExecutiveRole = require('@enums/executive-role.enum');
const NotificationSeverity = require('@enums/notification-severity.enum');

class DailyBriefService {
  #aiEngineClient;
  #discordNotificationService;

  /**
   * @param {{ aiEngineClient?: any, discordNotificationService?: any }} [deps]
   */
  constructor({
    aiEngineClient = defaultAiEngineClient,
    discordNotificationService = null,
  } = {}) {
    this.#aiEngineClient = aiEngineClient;
    this.#discordNotificationService = discordNotificationService;
  }

  /**
   * Set or update discord notification service instance.
   * @param {any} service
   */
  setDiscordNotificationService(service) {
    this.#discordNotificationService = service;
  }

  /**
   * Generates and dispatches the Executive Daily Briefing (08:00 AM) for CEO.
   * Aggregates intelligence across 6 Sub-Agents (R&D, CFO, Ops, Logistics, CSKH, HR).
   * @param {Object} options
   * @param {string} [options.userId='ceo']
   * @param {boolean} [options.sendNotification=true]
   * @returns {Promise<Object>}
   */
  async generateDailyBrief({ userId = 'ceo', sendNotification = true } = {}) {
    const prompt = 'Synthesize executive daily operational metrics for CEO 08:00 AM briefing.';
    
    // Call Python dan-ai-engine multi-agent orchestrator
    const orchestrationResult = await this.#aiEngineClient.orchestrateAgent({
      prompt,
      userId,
      executiveRole: ExecutiveRole.CEO
    });

    const synthesis = orchestrationResult.final_synthesis || 'Daily Briefing Generated.';

    let notificationSent = false;
    if (sendNotification && this.#discordNotificationService) {
      try {
        const todayStr = new Date().toISOString().slice(0, 10);
        await this.#discordNotificationService.enqueue({
          idempotencyKey: `daily-brief:${userId}:${todayStr}`,
          source: 'daily_brief',
          severity: NotificationSeverity.INFO,
          title: '👑 Dan AI CEO Executive Daily Briefing (08:00 AM)',
          message: synthesis,
          channelId: null,
        });
        notificationSent = true;
      } catch (error) {
        console.warn('[DailyBriefService] Discord notification fallback/skip:', error.message);
      }
    }

    return {
      success: true,
      timestamp: new Date().toISOString(),
      userId,
      orchestration: orchestrationResult,
      notificationSent
    };
  }

  /**
   * Generates weekly review report for CEO.
   */
  async generateWeeklyReview({ userId = 'ceo' } = {}) {
    const prompt = 'Synthesize weekly executive review across R&D roadmap, CFO financial savings, Ops Uptime, and CSKH CSAT.';
    const orchestrationResult = await this.#aiEngineClient.orchestrateAgent({
      prompt,
      userId,
      executiveRole: ExecutiveRole.CEO
    });

    return {
      success: true,
      period: 'WEEKLY',
      timestamp: new Date().toISOString(),
      report: orchestrationResult.final_synthesis
    };
  }
}

const defaultInstance = new DailyBriefService();
defaultInstance.DailyBriefService = DailyBriefService;
module.exports = defaultInstance;
