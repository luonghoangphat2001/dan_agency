/**
 * @fileoverview episodic-learning.service.js
 * Long-term Episodic Memory & Continuous Agent Evolution Engine
 * Accumulates past campaign post-mortems, calculates dynamic Caution Multipliers,
 * and proposes adaptive System Prompt and Guardrail evolutions.
 */
'use strict';

const crypto = require('crypto');
const DomainAgent = require('@enums/domain-agent.enum');
const PostMortemOutcome = require('@enums/post-mortem-outcome.enum');

class EpisodicLearningService {
  constructor({ clock = () => new Date(), rules = null } = {}) {
    this.clock = clock;
    this.postMortems = new Map();
    this.adaptiveRules = [];
    this.rules = rules || this.#loadRules();
  }

  #loadRules() {
    try {
      return require('@skills/learning-evaluation-default/rules.json');
    } catch (_) {}
    return { strategicAdviceTemplates: {}, promptEnhancements: {} };
  }

  /**
   * Records post-campaign learning report (Post-Mortem Record)
   */
  recordPostMortem({
    campaignOrPlanTitle,
    outcome = PostMortemOutcome.SUCCESS, // SUCCESS | PARTIAL | FAILURE
    plannedBudget = 0,
    actualSpend = 0,
    plannedRevenue = 0,
    actualRevenue = 0,
    rootCauses = [],
    lessonsLearned = [],
    tags = [],
  }) {
    const recordId = `pm_${crypto.randomUUID().substring(0, 8)}`;
    const financialVariance = actualSpend > 0 && plannedBudget > 0
      ? ((actualSpend - plannedBudget) / plannedBudget)
      : 0;
    const revenueAchievement = plannedRevenue > 0
      ? (actualRevenue / plannedRevenue)
      : 1.0;

    const record = {
      recordId,
      title: campaignOrPlanTitle,
      outcome,
      financialVariancePct: (financialVariance * 100).toFixed(1),
      revenueAchievementPct: (revenueAchievement * 100).toFixed(1),
      rootCauses,
      lessonsLearned,
      tags: tags.map(t => t.toLowerCase()),
      recordedAt: this.clock().toISOString(),
    };

    this.postMortems.set(recordId, record);
    return record;
  }

  /**
   * Calculates dynamic Caution Multiplier for new plans
   */
  calculateCautionMultiplier({ proposedTitle = '', planTags = [], budget = 0 }) {
    const historicalFailures = Array.from(this.postMortems.values()).filter(p => p.outcome === PostMortemOutcome.FAILURE || p.outcome === PostMortemOutcome.PARTIAL);

    let similarityHits = 0;
    const triggeredLessons = [];

    const normalizedTags = planTags.map(t => t.toLowerCase());

    historicalFailures.forEach(fail => {
      // Check tag overlap
      const matchingTags = fail.tags.filter(t => normalizedTags.includes(t));
      if (matchingTags.length > 0) {
        similarityHits += matchingTags.length;
        triggeredLessons.push(...fail.lessonsLearned);
      }
    });

    // Base multiplier is 1.0. Increases by 0.1 for each historical risk match, capped at 1.5
    const cautionMultiplier = Math.min(1.5, 1.0 + (similarityHits * 0.10));
    const adjustedBudgetBuffer = Math.round(budget * (cautionMultiplier - 1.0));

    const adviceTemplates = this.rules.strategicAdviceTemplates || {};
    const formattedBuffer = adjustedBudgetBuffer.toLocaleString('en-US');

    const strategicAdvice = cautionMultiplier > 1.15
      ? (adviceTemplates.cautionWarning || '')
          .replace('{similarityHits}', similarityHits)
          .replace('{cautionMultiplier}', cautionMultiplier.toFixed(2))
          .replace('{adjustedBudgetBuffer}', formattedBuffer)
      : (adviceTemplates.cautionSafe || '');

    return {
      baseCautionMultiplier: 1.0,
      appliedCautionMultiplier: Number(cautionMultiplier.toFixed(2)),
      riskSimilarityScore: similarityHits,
      recommendedContingencyBuffer: adjustedBudgetBuffer,
      lessonsSurfaced: Array.from(new Set(triggeredLessons)),
      strategicAdvice,
      evaluatedAt: this.clock().toISOString(),
    };
  }

  /**
   * Generates proposed System Prompt and Guardrail evolutions (Prompt Evolution)
   */
  generatePromptEvolutions(agentId = DomainAgent.RND) {
    const relevantFailures = Array.from(this.postMortems.values()).filter(p => p.outcome !== PostMortemOutcome.SUCCESS);
    const enhancements = this.rules.promptEnhancements || {};

    const promptEnhancements = enhancements[agentId] || enhancements.default || [];

    return {
      agentId,
      version: 'v2.1.0-adaptive',
      evolutionType: 'HEURISTIC_RULE_SYNTHESIS',
      totalPastIncidentsAnalyzed: relevantFailures.length,
      adaptiveRules: promptEnhancements,
      generatedAt: this.clock().toISOString(),
    };
  }

  listPostMortems() {
    return Array.from(this.postMortems.values());
  }
}

module.exports = EpisodicLearningService;
