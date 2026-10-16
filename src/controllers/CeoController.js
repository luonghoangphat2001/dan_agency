'use strict';

const defaultDailyBriefService = require('@services/agent/DailyBriefService');
const defaultAiEngineClient = require('@services/ai/AIEngineClient');
const ApiResponse = require('@utils/ApiResponse');

class CeoController {
  #dailyBriefService;
  #aiEngineClient;
  #openClawService;

  /**
   * @param {{ dailyBriefService?: any, aiEngineClient?: any, openClawService?: any }} [deps]
   */
  constructor({
    dailyBriefService = defaultDailyBriefService,
    aiEngineClient = defaultAiEngineClient,
    openClawService = null,
  } = {}) {
    this.#dailyBriefService = dailyBriefService;
    this.#aiEngineClient = aiEngineClient;
    this.#openClawService = openClawService;

    this.getDailyBrief = this.getDailyBrief.bind(this);
    this.orchestrate = this.orchestrate.bind(this);
    this.getExceptionInbox = this.getExceptionInbox.bind(this);
    this.processApproval = this.processApproval.bind(this);
  }

  /**
   * Triggers CEO 08:00 AM Daily Briefing generation.
   */
  async getDailyBrief(request, response, nextFunction) {
    try {
      const result = await this.#dailyBriefService.generateDailyBrief({
        userId: request.user?.id || 'ceo',
        sendNotification: request.query.notify === 'true',
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
      const result = await this.#aiEngineClient.orchestrateAgent({
        prompt: prompt || 'Executive operational status audit',
        userId: request.user?.id || 'ceo',
        executiveRole: executiveRole || 'ceo',
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
      if (this.#openClawService && typeof this.#openClawService.listApprovals === 'function') {
        const liveApprovals = await this.#openClawService.listApprovals({ status: 'pending', limit: 20 });
        if (liveApprovals?.items?.length) {
          return ApiResponse.success(response, {
            exceptions: liveApprovals.items,
            count: liveApprovals.items.length,
          });
        }
      }

      const exceptions = [
        {
          id: 'exp_101',
          source: 'OpenClaw Scraper',
          severity: 'HIGH',
          title: 'Competitor Pricing Anomaly Detected',
          description: 'Detected 15% discount on target course. Recommend automated price match.',
          status: 'PENDING_APPROVAL',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'exp_102',
          source: 'Agent Dan CFO',
          severity: 'MEDIUM',
          title: 'API Cost Threshold Warning',
          description: 'Local Ollama routing saved $450 today. Switch remainder 10% batch jobs to Ollama?',
          status: 'PENDING_APPROVAL',
          createdAt: new Date().toISOString(),
        },
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
      if (!approvalId || !decision) {
        return ApiResponse.badRequest(response, 'approvalId and decision are required.', 'INVALID_PAYLOAD');
      }

      let clawResult = null;
      if (this.#openClawService && typeof this.#openClawService.decideApproval === 'function') {
        try {
          clawResult = await this.#openClawService.decideApproval(approvalId, {
            decision,
            actorId: request.user?.id || 'ceo',
            reason: reason || null,
          });
        } catch (clawErr) {
          console.warn('[CeoController] OpenClaw decideApproval non-fatal fallback:', clawErr.message);
        }
      }

      return ApiResponse.success(response, {
        approvalId,
        decision,
        reason: reason || null,
        processedAt: new Date().toISOString(),
        status: 'PROCESSED',
        openClaw: clawResult,
        message: `Approval '${approvalId}' set to '${decision}' by CEO.`,
      });
    } catch (error) {
      nextFunction(error);
    }
  }
}

module.exports = CeoController;
