/**
 * @fileoverview CeoPlannerController - REST API Controller for CEO Autonomous Cockpit
 * Connects the 6 enterprise solutions addressing the 6 fatal weaknesses.
 */
'use strict';

const BaseController = require('@controllers/BaseController');
const {
  CeoStrategicPlannerService,
  AutonomousPlanExecutorService,
  DynamicRePlannerService,
  MarketIntelligenceSynthesizerService,
  ExecutiveBriefingService,
  GoalArbitrationService,
  AutonomyGovernanceService,
  EpisodicLearningService,
} = require('@services/ceo/planner');

class CeoPlannerController extends BaseController {
  constructor({
    plannerService = new CeoStrategicPlannerService(),
    executorService = new AutonomousPlanExecutorService(),
    replannerService = new DynamicRePlannerService(),
    marketIntelService = new MarketIntelligenceSynthesizerService(),
    briefingService = new ExecutiveBriefingService(),
    arbitrationService = new GoalArbitrationService(),
    governanceService = new AutonomyGovernanceService(),
    learningService = new EpisodicLearningService(),
  } = {}) {
    super();
    this.plannerService = plannerService;
    this.executorService = executorService;
    this.replannerService = replannerService;
    this.marketIntelService = marketIntelService;
    this.briefingService = briefingService;
    this.arbitrationService = arbitrationService;
    this.governanceService = governanceService;
    this.learningService = learningService;
  }

  // 1. Solution 1: Master Plan, OKRs, Monte Carlo, P&L
  async createPlan(req, res) {
    try {
      const plan = this.plannerService.createMasterPlan(req.body);
      if (req.body.companyObjectives) {
        this.plannerService.decomposeOKRs(plan.planId, req.body.companyObjectives);
      }
      return this.created(res, { plan });
    } catch (err) {
      return this.badRequest(res, err.message);
    }
  }

  async getPlan(req, res) {
    const plan = this.plannerService.getPlan(req.params.planId);
    if (!plan) return this.notFound(res, 'Plan not found');
    return this.ok(res, { plan });
  }

  async simulateMonteCarlo(req, res) {
    try {
      const result = this.plannerService.simulateMonteCarlo(req.params.planId, req.body || {});
      return this.ok(res, { monteCarlo: result });
    } catch (err) {
      return this.badRequest(res, err.message);
    }
  }

  async getProjections(req, res) {
    try {
      const projections = this.plannerService.generate12MonthProjections(req.params.planId, req.body || {});
      return this.ok(res, { projections });
    } catch (err) {
      return this.badRequest(res, err.message);
    }
  }

  async classifyBcg(req, res) {
    try {
      const bcg = this.plannerService.classifyBcgMatrix(req.params.planId, req.body.products || []);
      return this.ok(res, { bcg });
    } catch (err) {
      return this.badRequest(res, err.message);
    }
  }

  // 2. Solution 2: Dynamic Re-Planning & Deviation Sentinel
  async checkDeviations(req, res) {
    try {
      const result = this.replannerService.detectDeviations(req.params.planId, req.body || {});
      return this.ok(res, { deviationAssessment: result });
    } catch (err) {
      return this.badRequest(res, err.message);
    }
  }

  async requestContingencyOptions(req, res) {
    try {
      const allowed = this.replannerService.canTriggerReplan(req.params.planId);
      if (!allowed.allowed) {
        return this.badRequest(res, allowed.reason);
      }
      const contingency = this.replannerService.generateContingencyOptions(req.params.planId, req.body.issue || 'Operational Deviation');
      return this.ok(res, { contingency });
    } catch (err) {
      return this.badRequest(res, err.message);
    }
  }

  async applyReplan(req, res) {
    try {
      const oldPlan = this.plannerService.getPlan(req.params.planId);
      if (!oldPlan) return this.notFound(res, 'Original plan not found');
      const updatedPlan = this.replannerService.applySelectedOption(req.body.replanId, req.body.selectedOptionId, oldPlan);
      const diff = this.replannerService.generatePlanDiff(oldPlan, updatedPlan);
      return this.ok(res, { updatedPlan, diff });
    } catch (err) {
      return this.badRequest(res, err.message);
    }
  }

  // 3. Solution 3: Actionable Market Intelligence & Threat Radar
  async analyzeMarketIntel(req, res) {
    try {
      const threatRadar = this.marketIntelService.analyzeCompetitorThreats(req.body.competitorActivities || []);
      const actions = this.marketIntelService.generateAutonomousActions(threatRadar);
      return this.ok(res, { threatRadar, autonomousActions: actions });
    } catch (err) {
      return this.badRequest(res, err.message);
    }
  }

  // 4. Solution 4: Pareto Goal Arbitration
  async arbitrateConflict(req, res) {
    try {
      const verdict = this.arbitrationService.arbitrate(req.body);
      return this.ok(res, { verdict });
    } catch (err) {
      return this.badRequest(res, err.message);
    }
  }

  // 5. Solution 5: Governance, L1-L4, Multi-Sig, Kill-Switch
  async evaluateAutonomy(req, res) {
    try {
      const evaluation = this.governanceService.evaluateActionAutonomy(req.body);
      return this.ok(res, { evaluation });
    } catch (err) {
      return this.badRequest(res, err.message);
    }
  }

  async createMultiSig(req, res) {
    try {
      const request = this.governanceService.createMultiSigRequest(req.body);
      return this.created(res, { multiSigRequest: request });
    } catch (err) {
      return this.badRequest(res, err.message);
    }
  }

  async signMultiSig(req, res) {
    try {
      const updated = this.governanceService.signMultiSigRequest(req.body);
      return this.ok(res, { multiSigRequest: updated });
    } catch (err) {
      return this.badRequest(res, err.message);
    }
  }

  async triggerEmergencyVeto(req, res) {
    try {
      const veto = this.governanceService.triggerEmergencyVeto(req.body || {});
      return this.ok(res, veto);
    } catch (err) {
      return this.badRequest(res, err.message);
    }
  }

  async liftEmergencyVeto(req, res) {
    try {
      const result = this.governanceService.liftEmergencyVeto(req.body || {});
      return this.ok(res, result);
    } catch (err) {
      return this.badRequest(res, err.message);
    }
  }

  // 6. Solution 6: Episodic Learning & Caution Multiplier
  async recordPostMortem(req, res) {
    try {
      const record = this.learningService.recordPostMortem(req.body);
      return this.created(res, { postMortem: record });
    } catch (err) {
      return this.badRequest(res, err.message);
    }
  }

  async calculateCaution(req, res) {
    try {
      const result = this.learningService.calculateCautionMultiplier(req.body);
      return this.ok(res, { cautionAssessment: result });
    } catch (err) {
      return this.badRequest(res, err.message);
    }
  }

  // Executive Briefings
  async getMorningBrief(req, res) {
    try {
      const brief = this.briefingService.generateMorningFlashBrief(req.body || {});
      return this.ok(res, { morningBrief: brief });
    } catch (err) {
      return this.badRequest(res, err.message);
    }
  }

  async performRca(req, res) {
    try {
      const rca = this.briefingService.performRootCauseAnalysis(req.body || {});
      return this.ok(res, { rca });
    } catch (err) {
      return this.badRequest(res, err.message);
    }
  }
}

module.exports = CeoPlannerController;
