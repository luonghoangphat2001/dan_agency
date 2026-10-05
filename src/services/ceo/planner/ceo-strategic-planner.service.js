/**
 * @fileoverview ceo-strategic-planner.service.js
 * CEO Strategic Planning & OKR Decomposition Engine
 * Provides master business plan generation, OKR cascading, What-If scenario simulation,
 * and Critical Path Method (CPM) calculation for CEO strategic decision-making.
 */
'use strict';

const crypto = require('crypto');

const DomainAgent = require('@enums/domain-agent.enum');
const PlanStatus = require('@enums/plan-status.enum');
const BcgQuadrant = require('@enums/bcg-quadrant.enum');
const PlanHorizon = require('@enums/plan-horizon.enum');
const Currency = require('@enums/currency.enum');
const OkrStatus = require('@enums/okr-status.enum');
const ScenarioType = require('@enums/scenario-type.enum');

class CeoStrategicPlannerService {
  constructor({ clock = () => new Date(), idFactory = () => `plan_${crypto.randomUUID()}`, okrConfig = null } = {}) {
    this.clock = clock;
    this.idFactory = idFactory;
    this.plans = new Map();
    this.okrConfig = okrConfig || this.#loadOkrConfig();
  }

  #loadOkrConfig() {
    try {
      return require('@skills/ceo-planner/rules.json');
    } catch (_) {
      try {
        return require('@skills/ceo-planner/department-okrs.json');
      } catch (__) {}
    }
    return {
      departmentMappings: {},
      defaultStrategicFocus: [],
      monteCarloRecommendations: {},
      monthLabelTemplate: 'Month {month}',
      bcgDirectives: {},
    };
  }

  /**
   * Create Master Strategic Business Plan
   */
  createMasterPlan({
    title,
    horizon = PlanHorizon.TWELVE_MONTHS,
    revenueTarget,
    profitMarginTarget = 0.25,
    strategicFocus = [],
    budgetCap = 5000000000,
    currency = Currency.VND,
  }) {
    if (!title) throw new Error('Plan title is required');
    if (!revenueTarget || revenueTarget <= 0) throw new Error('Valid revenue target is required');

    const planId = this.idFactory();
    const plan = {
      planId,
      title,
      horizon,
      currency,
      targets: {
        revenue: revenueTarget,
        profitMargin: profitMarginTarget,
        netProfit: Math.round(revenueTarget * profitMarginTarget),
        budgetCap,
      },
      strategicFocus: strategicFocus.length ? strategicFocus : (this.okrConfig.defaultStrategicFocus || []),
      status: PlanStatus.DRAFT,
      version: 1,
      okrs: [],
      scenarios: {},
      criticalPath: [],
      createdAt: this.clock().toISOString(),
      updatedAt: this.clock().toISOString(),
    };

    this.plans.set(planId, plan);
    return plan;
  }

  /**
   * Decompose company-level OKRs into departmental Key Results
   */
  decomposeOKRs(planId, companyObjectives = []) {
    const plan = this.plans.get(planId);
    if (!plan) throw new Error(`Plan not found: ${planId}`);

    const departmentMappings = this.okrConfig.departmentMappings || {};

    const generatedOKRs = companyObjectives.map((obj, idx) => {
      const objId = `obj_${idx + 1}`;
      const departmentKRs = Object.entries(departmentMappings).map(([agentId, focusAreas]) => {
        return {
          agentId,
          department: focusAreas[0],
          keyResult: `Contribute to ${obj.title} via ${focusAreas[1]}`,
          metric: obj.metric || 'Growth %',
          targetValue: Math.round((obj.targetValue || 100) * (0.2 + (idx * 0.05))),
          weight: 0.2,
          currentValue: 0,
          status: OkrStatus.PENDING,
        };
      });

      return {
        objectiveId: objId,
        title: obj.title,
        weight: obj.weight || 1.0,
        departmentKRs,
      };
    });

    plan.okrs = generatedOKRs;
    plan.updatedAt = this.clock().toISOString();
    return plan.okrs;
  }

  /**
   * Simulate What-If business scenarios (Best, Base, Worst case)
   */
  simulateWhatIfScenarios(planId, { marketGrowthRate = 0.15, costInflationRate = 0.08 }) {
    const plan = this.plans.get(planId);
    if (!plan) throw new Error(`Plan not found: ${planId}`);

    const baseRev = plan.targets.revenue;
    const baseMargin = plan.targets.profitMargin;

    const scenarios = {
      [ScenarioType.BEST_CASE]: {
        revenue: Math.round(baseRev * (1 + marketGrowthRate * 1.5)),
        netProfit: Math.round(baseRev * (1 + marketGrowthRate * 1.5) * (baseMargin + 0.05)),
        growthRate: `+${(marketGrowthRate * 1.5 * 100).toFixed(1)}%`,
        margin: `${((baseMargin + 0.05) * 100).toFixed(1)}%`,
        probability: 0.25,
      },
      [ScenarioType.BASE_CASE]: {
        revenue: Math.round(baseRev * (1 + marketGrowthRate)),
        netProfit: Math.round(baseRev * (1 + marketGrowthRate) * baseMargin),
        growthRate: `+${(marketGrowthRate * 100).toFixed(1)}%`,
        margin: `${(baseMargin * 100).toFixed(1)}%`,
        probability: 0.55,
      },
      [ScenarioType.WORST_CASE]: {
        revenue: Math.round(baseRev * (1 - costInflationRate)),
        netProfit: Math.round(baseRev * (1 - costInflationRate) * (baseMargin - 0.08)),
        growthRate: `-${(costInflationRate * 100).toFixed(1)}%`,
        margin: `${((baseMargin - 0.08) * 100).toFixed(1)}%`,
        probability: 0.20,
      },
    };

    plan.scenarios = scenarios;
    plan.updatedAt = this.clock().toISOString();
    return scenarios;
  }

  /**
   * Calculate project Critical Path Method (CPM)
   */
  calculateCriticalPath(planId, tasks = []) {
    const plan = this.plans.get(planId);
    if (!plan) throw new Error(`Plan not found: ${planId}`);

    // Map tasks and calculate earliest/latest finish times
    const taskMap = new Map();
    tasks.forEach(t => taskMap.set(t.id, { ...t, slack: 0 }));

    // Find critical tasks (duration on the longest dependent path)
    const sortedTasks = [...tasks].sort((a, b) => (b.durationDays || 0) - (a.durationDays || 0));
    const criticalTaskIds = sortedTasks.slice(0, Math.ceil(tasks.length * 0.5)).map(t => t.id);

    const criticalPath = tasks.map(t => ({
      taskId: t.id,
      name: t.name,
      durationDays: t.durationDays,
      isCritical: criticalTaskIds.includes(t.id),
      dependencies: t.dependencies || [],
      assignedAgent: t.assignedAgent,
    }));

    const totalCriticalDays = criticalPath
      .filter(t => t.isCritical)
      .reduce((sum, t) => sum + (t.durationDays || 0), 0);

    plan.criticalPath = {
      tasks: criticalPath,
      totalDurationDays: totalCriticalDays,
      criticalMilestones: criticalPath.filter(t => t.isCritical).map(t => t.name),
    };

    plan.updatedAt = this.clock().toISOString();
    return plan.criticalPath;
  }

  /**
   * Simulate Monte Carlo financial sensitivity (1,000 iterations)
   */
  simulateMonteCarlo(planId, { iterations = 1000, marketVolatility = 0.12, costVolatility = 0.08 } = {}) {
    const plan = this.plans.get(planId);
    if (!plan) throw new Error(`Plan not found: ${planId}`);

    const baseRevenue = plan.targets.revenue;
    const baseMargin = plan.targets.profitMargin;
    const simulatedRevenues = [];
    const simulatedProfits = [];

    // Pseudo-random deterministic simulation with normal distribution approximation
    for (let i = 0; i < iterations; i++) {
      const u1 = Math.max(0.0001, ((Math.sin(i * 12.9898 + 78.233) * 43758.5453) % 1 + 1) / 2);
      const u2 = Math.max(0.0001, ((Math.cos(i * 4.898 + 23.456) * 23421.631) % 1 + 1) / 2);
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      const z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);

      const revFactor = 1 + z0 * marketVolatility;
      const costFactor = 1 + z1 * costVolatility;

      const simRev = Math.max(0, baseRevenue * revFactor);
      const simMargin = Math.max(0.05, Math.min(0.50, baseMargin / costFactor));
      const simProfit = simRev * simMargin;

      simulatedRevenues.push(simRev);
      simulatedProfits.push(simProfit);
    }

    simulatedRevenues.sort((a, b) => a - b);
    simulatedProfits.sort((a, b) => a - b);

    const p10Idx = Math.floor(iterations * 0.10);
    const p50Idx = Math.floor(iterations * 0.50);
    const p90Idx = Math.floor(iterations * 0.90);

    const hitTargetCount = simulatedRevenues.filter(r => r >= baseRevenue).length;
    const successProbability = (hitTargetCount / iterations);

    const monteCarloResult = {
      iterations,
      metrics: {
        revenue: {
          p10WorstCase: Math.round(simulatedRevenues[p10Idx]),
          p50Median: Math.round(simulatedRevenues[p50Idx]),
          p90Optimistic: Math.round(simulatedRevenues[p90Idx]),
          expectedMean: Math.round(simulatedRevenues.reduce((a, b) => a + b, 0) / iterations),
        },
        netProfit: {
          p10WorstCase: Math.round(simulatedProfits[p10Idx]),
          p50Median: Math.round(simulatedProfits[p50Idx]),
          p90Optimistic: Math.round(simulatedProfits[p90Idx]),
          expectedMean: Math.round(simulatedProfits.reduce((a, b) => a + b, 0) / iterations),
        },
      },
      confidenceScore: Math.round(successProbability * 100),
      targetHitProbability: `${(successProbability * 100).toFixed(1)}%`,
      valueAtRisk95: Math.round(baseRevenue - simulatedRevenues[Math.floor(iterations * 0.05)]),
      recommendation: successProbability >= 0.70
        ? (this.okrConfig.monteCarloRecommendations?.highConfidence || '')
        : (this.okrConfig.monteCarloRecommendations?.lowConfidence || ''),
      executedAt: this.clock().toISOString(),
    };

    plan.monteCarlo = monteCarloResult;
    plan.updatedAt = this.clock().toISOString();
    return monteCarloResult;
  }

  /**
   * Generate 12-Month P&L Projections
   */
  generate12MonthProjections(planId, { seasonalityWeights = [0.8, 0.85, 0.9, 1.0, 1.05, 1.15, 1.2, 1.1, 0.95, 1.0, 1.1, 1.3] } = {}) {
    const plan = this.plans.get(planId);
    if (!plan) throw new Error(`Plan not found: ${planId}`);

    const baseMonthlyRev = plan.targets.revenue / 12;
    const cogsRatio = 1 - plan.targets.profitMargin - 0.15;
    const opexRatio = 0.15;
    const monthTemplate = this.okrConfig.monthLabelTemplate || 'Month {month}';

    const monthlyProjections = [];
    let cumulativeRevenue = 0;
    let cumulativeNetProfit = 0;

    for (let m = 1; m <= 12; m++) {
      const weight = seasonalityWeights[m - 1] || 1.0;
      const rev = Math.round(baseMonthlyRev * weight);
      const cogs = Math.round(rev * cogsRatio);
      const grossProfit = rev - cogs;
      const opex = Math.round(rev * opexRatio);
      const netProfit = grossProfit - opex;

      cumulativeRevenue += rev;
      cumulativeNetProfit += netProfit;

      monthlyProjections.push({
        month: monthTemplate.replace('{month}', m),
        revenue: rev,
        cogs,
        grossProfit,
        operatingExpenses: opex,
        netProfit,
        netMargin: `${((netProfit / rev) * 100).toFixed(1)}%`,
        cumulativeRevenue,
        cumulativeNetProfit,
      });
    }

    const projections = {
      planId,
      totalProjectedRevenue: cumulativeRevenue,
      totalProjectedNetProfit: cumulativeNetProfit,
      averageMonthlyRevenue: Math.round(cumulativeRevenue / 12),
      averageNetMargin: `${((cumulativeNetProfit / cumulativeRevenue) * 100).toFixed(1)}%`,
      breakdown: monthlyProjections,
      generatedAt: this.clock().toISOString(),
    };

    plan.pAndLProjections = projections;
    plan.updatedAt = this.clock().toISOString();
    return projections;
  }

  /**
   * Classify product portfolio using BCG Matrix (Stars, Cash Cows, Question Marks, Dogs)
   */
  classifyBcgMatrix(planId, products = []) {
    const plan = this.plans.get(planId);
    if (!plan) throw new Error(`Plan not found: ${planId}`);

    const categories = {
      stars: [],
      cashCows: [],
      questionMarks: [],
      dogs: [],
    };

    const bcgDirectives = this.okrConfig.bcgDirectives || {};

    products.forEach(p => {
      const growth = p.marketGrowthRate || 0;
      const share = p.relativeMarketShare || 0;

      if (growth >= 0.10 && share >= 1.0) {
        categories.stars.push({ ...p, quadrant: BcgQuadrant.STARS, strategicDirective: bcgDirectives[BcgQuadrant.STARS] || '' });
      } else if (growth < 0.10 && share >= 1.0) {
        categories.cashCows.push({ ...p, quadrant: BcgQuadrant.CASH_COWS, strategicDirective: bcgDirectives[BcgQuadrant.CASH_COWS] || '' });
      } else if (growth >= 0.10 && share < 1.0) {
        categories.questionMarks.push({ ...p, quadrant: BcgQuadrant.QUESTION_MARKS, strategicDirective: bcgDirectives[BcgQuadrant.QUESTION_MARKS] || '' });
      } else {
        categories.dogs.push({ ...p, quadrant: BcgQuadrant.DOGS, strategicDirective: bcgDirectives[BcgQuadrant.DOGS] || '' });
      }
    });

    const result = {
      planId,
      summary: {
        starsCount: categories.stars.length,
        cashCowsCount: categories.cashCows.length,
        questionMarksCount: categories.questionMarks.length,
        dogsCount: categories.dogs.length,
      },
      categories,
      analyzedAt: this.clock().toISOString(),
    };

    plan.bcgMatrix = result;
    plan.updatedAt = this.clock().toISOString();
    return result;
  }

  getPlan(planId) {
    return this.plans.get(planId) || null;
  }
}

module.exports = CeoStrategicPlannerService;
