const aiEngineClient = require('@services/ai/AIEngineClient');
const discordNotificationService = require('@services/notification/DiscordNotificationService');
const ExecutiveRole = require('@enums/executive-role.enum');

class DailyBriefService {
  /**
   * Generates and dispatches the Executive Daily Briefing (08:00 AM) for CEO.
   * Aggregates intelligence across 5 Sub-Agents (R&D, CFO, Ops, Logistics, CSKH).
   * @param {Object} options
   * @param {string} [options.userId='ceo']
   * @param {boolean} [options.sendNotification=true]
   * @returns {Promise<Object>}
   */
  async generateDailyBrief({ userId = 'ceo', sendNotification = true } = {}) {
    const prompt = 'Synthesize executive daily operational metrics for CEO 08:00 AM briefing.';
    
    // Call Python dan-ai-engine multi-agent orchestrator
    const orchestrationResult = await aiEngineClient.orchestrateAgent({
      prompt,
      userId,
      executiveRole: ExecutiveRole.CEO
    });

    const synthesis = orchestrationResult.final_synthesis || 'Daily Briefing Generated.';

    let notificationSent = false;
    if (sendNotification) {
      try {
        await discordNotificationService.sendNotification({
          title: '👑 Dan AI CEO Executive Daily Briefing (08:00 AM)',
          message: synthesis,
          type: 'EXECUTIVE_BRIEFING'
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
    const orchestrationResult = await aiEngineClient.orchestrateAgent({
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

module.exports = new DailyBriefService();
