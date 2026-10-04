/**
 * @fileoverview goal-arbitration.service.js
 * Multi-Agent Goal Conflict Arbitration Engine (Pareto Frontier Resolver)
 * Arbitrates conflicting departmental goals between CSKH, CFO, Ops, R&D, and Logistics
 * based on CEO's active operating philosophy (CASH_FIRST, GROWTH_FIRST, BALANCED).
 */
'use strict';

const crypto = require('crypto');

const ArbitrationStatus = require('@enums/arbitration-status.enum');
const CeoPolicy = require('@enums/ceo-policy.enum');
const ConflictType = require('@enums/conflict-type.enum');

class GoalArbitrationService {
  constructor({ clock = () => new Date(), skillRules = null } = {}) {
    this.clock = clock;
    this.arbitrationLog = new Map();
    this.skillRules = skillRules || this.#loadSkillRules();
  }

  #loadSkillRules() {
    try {
      return require('@skills/ceo-arbitration/rules.json');
    } catch (_) {}
    return null;
  }

  /**
   * Arbitrates inter-agent goal conflicts
   * @param {Object} params
   * @param {string} params.conflictType - e.g., CSKH_DISCOUNT_VS_CFO_MARGIN, OPS_STOCK_VS_CFO_CASH, RND_QUALITY_VS_LOGISTICS_COST
   * @param {Array<string>} params.parties - e.g., ['dan_cskh', 'dan_cfo']
   * @param {Object} params.demands - Specific demands from each party
   * @param {string} [params.ceoPolicy='BALANCED'] - CASH_FIRST | GROWTH_FIRST | BALANCED
   * @param {Object} [params.constraints={}]
   */
  arbitrate({
    conflictType,
    parties = [],
    demands = {},
    ceoPolicy = CeoPolicy.BALANCED,
    constraints = {},
  }) {
    if (!conflictType) throw new Error('Conflict type is required');
    if (!parties || parties.length < 2) throw new Error('At least 2 parties required for arbitration');

    const arbitrationId = `arb_${crypto.randomUUID().substring(0, 8)}`;

    // Evaluate trade-off utility
    const evaluation = this.#calculateParetoDecision(conflictType, demands, ceoPolicy, constraints, parties);

    const verdict = {
      arbitrationId,
      conflictType,
      parties,
      ceoPolicy,
      verdictSummary: evaluation.summary,
      winningPosture: evaluation.winningPosture,
      compromiseScore: evaluation.paretoScore, // 0 - 100
      directives: evaluation.directives,
      arbitrationProof: {
        financialImpact: evaluation.financialImpact,
        customerImpact: evaluation.customerImpact,
        rationale: evaluation.rationale,
      },
      status: ArbitrationStatus.BINDING_RESOLVED,
      timestamp: this.clock().toISOString(),
    };

    this.arbitrationLog.set(arbitrationId, verdict);
    return verdict;
  }

  #calculateParetoDecision(conflictType, demands, policy, constraints, parties = []) {
    const conflictConfig = this.skillRules?.conflictEvaluations?.[conflictType];
    if (conflictConfig) {
      const evaluation = conflictConfig[policy] || conflictConfig.DEFAULT || conflictConfig.BALANCED;
      if (evaluation) {
        return {
          winningPosture: evaluation.winningPosture,
          summary: evaluation.summary,
          paretoScore: evaluation.paretoScore,
          directives: evaluation.directives || {},
          financialImpact: evaluation.financialImpact,
          customerImpact: evaluation.customerImpact,
          rationale: evaluation.rationale,
        };
      }
    }

    const defaultConfig = this.skillRules?.conflictEvaluations?.DEFAULT || {};
    const directives = parties.reduce((acc, p) => {
      acc[p] = defaultConfig.directiveTemplate;
      return acc;
    }, {});

    return {
      winningPosture: defaultConfig.winningPosture,
      summary: defaultConfig.summary ? defaultConfig.summary.replace('{conflictType}', conflictType) : '',
      paretoScore: defaultConfig.paretoScore,
      directives,
      financialImpact: defaultConfig.financialImpact,
      customerImpact: defaultConfig.customerImpact,
      rationale: defaultConfig.rationale,
    };
  }

  getArbitration(arbitrationId) {
    return this.arbitrationLog.get(arbitrationId) || null;
  }

  listArbitrations(limit = 50) {
    return Array.from(this.arbitrationLog.values()).slice(-limit);
  }
}

module.exports = GoalArbitrationService;
