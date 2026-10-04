/**
 * @fileoverview executive-briefing.service.js
 * CEO Executive Briefing & Root Cause Analysis (RCA) Engine
 * Produces crisp 1-page executive briefs, anomaly alerts, and actionable recommendations.
 */
'use strict';

const crypto = require('crypto');
const DomainAgent = require('@enums/domain-agent.enum');

class ExecutiveBriefingService {
  constructor({ clock = () => new Date(), rules = null } = {}) {
    this.clock = clock;
    this.rules = rules || this.#loadRules();
  }

  #loadRules() {
    try {
      return require('@skills/ceo-planner/rules.json');
    } catch (_) {}
    return { executiveBriefing: {} };
  }

  /**
   * Generates Morning CEO Flash Brief - 60-second read
   */
  generateMorningFlashBrief({
    financials = { revenueYesterday: 0, targetYesterday: 0, cashRunwayDays: 120 },
    operations = { orderCount: 0, onTimeRate: 0.98, incidentCount: 0 },
    criticalAlerts = [],
  }) {
    const briefingRules = this.rules.executiveBriefing || {};
    const revenueGap = financials.revenueYesterday - financials.targetYesterday;
    const revStatus = revenueGap >= 0
      ? (briefingRules.statusTargetAchieved || '🟢 TARGET ACHIEVED')
      : (briefingRules.statusShortfall || '🔴 SHORTFALL');

    const headlineTemplate = briefingRules.headlineTemplate || 'CEO EXECUTIVE BRIEF - {status} ({sign}{gapMb}m VND)';
    const headline = headlineTemplate
      .replace('{status}', revStatus)
      .replace('{sign}', revenueGap >= 0 ? '+' : '')
      .replace('{gapMb}', Math.round(revenueGap / 1000000));

    const cashRunwayTemplate = briefingRules.cashRunwayTemplate || '{days} days safe';
    const cashRunway = cashRunwayTemplate.replace('{days}', financials.cashRunwayDays);

    const brief = {
      briefId: `brief_${crypto.randomUUID().substring(0, 8)}`,
      date: this.clock().toISOString().split('T')[0],
      headline,
      kpiRadar: {
        revenue: `${Math.round(financials.revenueYesterday / 1000000)}m / ${Math.round(financials.targetYesterday / 1000000)}m VND`,
        cashRunway,
        fulfillmentSLA: `${(operations.onTimeRate * 100).toFixed(1)}%`,
        activeIncidents: operations.incidentCount,
      },
      topPrioritiesToday: briefingRules.defaultPriorities || [],
      redAlerts: criticalAlerts.length > 0 ? criticalAlerts : [briefingRules.defaultNoRedAlerts || ''],
      readingTime: briefingRules.readingTime || '45 seconds',
      generatedAt: this.clock().toISOString(),
    };

    return brief;
  }

  /**
   * Root Cause Analysis (RCA 5-Whys)
   */
  performRootCauseAnalysis({ problemStatement, symptoms = [], context = {} }) {
    const briefingRules = this.rules.executiveBriefing || {};
    const rcaId = `rca_${crypto.randomUUID().substring(0, 8)}`;

    const defaultWhys = briefingRules.defaultWhys || [];
    const whys = defaultWhys.map((w, idx) => {
      if (idx === 0 && symptoms[0]) {
        return { ...w, observation: symptoms[0] };
      }
      return { ...w };
    });

    const rawActions = briefingRules.defaultCorrectiveActions || [];
    const correctiveActions = rawActions.map(act => {
      let ownerEnum = act.owner;
      if (act.owner === 'dan_ops') ownerEnum = DomainAgent.OPS;
      else if (act.owner === 'dan_logistics') ownerEnum = DomainAgent.LOGISTICS;
      else if (act.owner === 'dan_rnd') ownerEnum = DomainAgent.RND;
      else if (act.owner === 'dan_cfo') ownerEnum = DomainAgent.CFO;
      else if (act.owner === 'dan_cskh') ownerEnum = DomainAgent.CSKH;

      return {
        ...act,
        owner: ownerEnum,
      };
    });

    return {
      rcaId,
      problem: problemStatement,
      whysChain: whys,
      rootCause: whys[whys.length - 1]?.observation || '',
      correctiveActions,
      estimatedRecoveryDays: 2,
      analyzedAt: this.clock().toISOString(),
    };
  }
}

module.exports = ExecutiveBriefingService;
