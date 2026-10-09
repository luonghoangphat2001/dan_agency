const dailyBriefService = require('@services/agent/DailyBriefService');
const aiEngineClient = require('@services/ai/AIEngineClient');
const openClawService = require('@services/openclaw/OpenClawService');
const ApiResponse = require('@utils/ApiResponse');

class CeoController {
  /**
   * Triggers CEO 08:00 AM Daily Briefing generation.
   */
  async getDailyBrief(request, response, nextFunction) {
    try {
      const result = await dailyBriefService.generateDailyBrief({
        userId: request.user?.id || 'ceo',
        sendNotification: request.query.notify === 'true'
      });
      return ApiResponse.success(response, result, 'Daily briefing generated successfully.');
    } catch (error) {
      nextFunction(error);
    }
  }

  /**
   * Triggers 5 Sub-Agent ESR Multi-Agent Orchestration.
   */
  async orchestrate(request, response, nextFunction) {
    try {
      const { prompt, executiveRole } = request.body;
      const result = await aiEngineClient.orchestrateAgent({
        prompt: prompt || 'Executive operational status audit',
        userId: request.user?.id || 'ceo',
        executiveRole: executiveRole || 'ceo'
      });
      return ApiResponse.success(response, result, 'Multi-agent orchestration executed successfully.');
    } catch (error) {
      nextFunction(error);
    }
  }

  /**
   * Fetches Exception Inbox items for CEO approval.
   */
  async getExceptionInbox(request, response, nextFunction) {
    try {
      const exceptions = [
        {
          id: 'exp_101',
          source: 'OpenClaw Scraper',
          severity: 'HIGH',
          title: 'Competitor Pricing Anomaly Detected',
          description: 'Detected 15% discount on target course. Recommend automated price match.',
          status: 'PENDING_APPROVAL',
          createdAt: new Date().toISOString()
        },
        {
          id: 'exp_102',
          source: 'Agent Dan CFO',
          severity: 'MEDIUM',
          title: 'API Cost Threshold Warning',
          description: 'Local Ollama routing saved $450 today. Switch remainder 10% batch jobs to Ollama?',
          status: 'PENDING_APPROVAL',
          createdAt: new Date().toISOString()
        }
      ];
      return ApiResponse.success(response, { exceptions, count: exceptions.length });
    } catch (error) {
      nextFunction(error);
    }
  }

  /**
   * Handles 1-Click Approval/Rejection for CEO.
   */
  async processApproval(request, response, nextFunction) {
    try {
      const { approvalId, decision, reason } = request.body;
      return ApiResponse.success(response, {
        approvalId,
        decision,
        reason: reason || null,
        processedAt: new Date().toISOString(),
        status: 'PROCESSED',
        message: `Approval '${approvalId}' set to '${decision}' by CEO.`
      });
    } catch (error) {
      nextFunction(error);
    }
  }
}

module.exports = new CeoController();
