/**
 * @fileoverview dynamic-replanner.service.js
 * Dynamic Re-Planning & Bottleneck Resolution Sentinel
 * Detects plan slippages, supply chain disruptions, market price spikes,
 * and automatically triggers contingency re-planning options for the CEO.
 */
'use strict';

const crypto = require('crypto');

const RePlanSeverity = require('@enums/replan-severity.enum');
const RePlanStatus = require('@enums/replan-status.enum');
const PlanStatus = require('@enums/plan-status.enum');

class DynamicRePlannerService {
  constructor({ clock = () => new Date(), skillRules = null } = {}) {
    this.clock = clock;
    this.replanHistories = new Map();
    this.skillRules = skillRules || this.#loadSkillRules();
  }

  #loadSkillRules() {
    try {
      return require('@skills/ceo-arbitration/rules.json');
    } catch (_) {}
    return null;
  }

  /**
   * Evaluates whether re-planning should be triggered based on KPIs and incidents
   */
  evaluateReplanTrigger({
    currentProgressPct,
    expectedProgressPct,
    criticalSlaBreached = false,
    supplyChainDisrupted = false,
    costSurgePct = 0,
  }) {
    const lagPct = expectedProgressPct - currentProgressPct;
    let trigger = false;
    let reason = '';
    let severity = RePlanSeverity.LOW;

    if (criticalSlaBreached || supplyChainDisrupted) {
      trigger = true;
      reason = supplyChainDisrupted ? 'Supply chain disruption detected' : 'Critical SLA breach on milestone';
      severity = RePlanSeverity.CRITICAL;
    } else if (costSurgePct >= 0.20) {
      trigger = true;
      reason = `Material cost surge exceeds tolerance (+${(costSurgePct * 100).toFixed(1)}%)`;
      severity = RePlanSeverity.HIGH;
    } else if (lagPct >= 25) {
      trigger = true;
      reason = `Milestone delivery lag is severe (-${lagPct}% vs schedule)`;
      severity = RePlanSeverity.HIGH;
    } else if (lagPct >= 15) {
      trigger = true;
      reason = `Milestone delivery lag is moderate (-${lagPct}% vs schedule)`;
      severity = RePlanSeverity.MEDIUM;
    }

    return {
      needsReplan: trigger,
      severity,
      reason: reason || 'Progress is within acceptable tolerance window',
      lagPct: Math.max(0, lagPct),
      timestamp: this.clock().toISOString(),
    };
  }

  /**
   * Generates 3 contingency re-planning options for CEO selection
   */
  generateContingencyOptions(planId, currentIssue) {
    const replanId = `replan_${crypto.randomUUID().substring(0, 8)}`;

    const options = this.skillRules?.contingencyOptions || [];

    const record = {
      replanId,
      planId,
      issue: currentIssue,
      options,
      status: RePlanStatus.AWAITING_CEO_SELECTION,
      createdAt: this.clock().toISOString(),
    };

    this.replanHistories.set(replanId, record);
    return record;
  }

  /**
   * Applies selected option and updates plan version (Plan v2)
   */
  applySelectedOption(replanId, selectedOptionId, oldPlan) {
    const record = this.replanHistories.get(replanId);
    if (!record) throw new Error(`Replan record not found: ${replanId}`);

    const selected = record.options.find(o => o.optionId === selectedOptionId);
    if (!selected) throw new Error(`Invalid optionId: ${selectedOptionId}`);

    const newVersion = (oldPlan.version || 1) + 1;
    const updatedPlan = {
      ...oldPlan,
      version: newVersion,
      status: PlanStatus.ACTIVE_REVISED,
      replanContext: {
        replanId,
        appliedOption: selected.title,
        rationale: selected.strategy,
        revisedAt: this.clock().toISOString(),
      },
      updatedAt: this.clock().toISOString(),
    };

    record.status = RePlanStatus.EXECUTED;
    record.selectedOption = selectedOptionId;
    return updatedPlan;
  }

  /**
   * Real-time deviation sentinel
   */
  detectDeviations(planId, {
    actualProgressPct = 0,
    plannedProgressPct = 0,
    actualSpend = 0,
    budgetCap = 0,
    supplierStatus = 'HEALTHY',
    activeIncidents = 0,
  } = {}) {
    const progressLag = Math.max(0, plannedProgressPct - actualProgressPct);
    const budgetOverrun = budgetCap > 0 && actualSpend > budgetCap ? ((actualSpend - budgetCap) / budgetCap) : 0;
    const supplyChainAlert = supplierStatus !== 'HEALTHY';

    const triggers = [];
    if (progressLag >= 20) triggers.push(`Progress lag is severe (-${progressLag}%)`);
    if (budgetOverrun > 0.10) triggers.push(`Budget overrun exceeds threshold (+${(budgetOverrun * 100).toFixed(1)}%)`);
    if (supplyChainAlert) triggers.push(`Supply chain red alert (${supplierStatus})`);
    if (activeIncidents >= 3) triggers.push(`Discovered ${activeIncidents} concurrent operational incidents`);

    const replanRequired = triggers.length > 0;
    const severity = triggers.length >= 2 || supplyChainAlert ? RePlanSeverity.CRITICAL : (replanRequired ? RePlanSeverity.HIGH : RePlanSeverity.NORMAL);

    return {
      planId,
      replanRequired,
      severity,
      triggers,
      metrics: {
        progressLagPct: progressLag,
        budgetOverrunPct: (budgetOverrun * 100).toFixed(1),
        supplierStatus,
        activeIncidents,
      },
      recommendedAction: replanRequired
        ? 'Trigger dynamic re-planning procedure immediately and submit 3 contingency options for CEO.'
        : 'System operating safely within tolerance thresholds.',
      checkedAt: this.clock().toISOString(),
    };
  }

  /**
   * Anti-flapping filter
   */
  canTriggerReplan(planId, minCooldownMinutes = 120) {
    const records = Array.from(this.replanHistories.values())
      .filter(r => r.planId === planId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (records.length === 0) return { allowed: true, reason: 'Initial re-plan trigger' };

    const lastReplan = records[0];
    const diffMs = Math.abs(new Date(this.clock()) - new Date(lastReplan.createdAt));
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < minCooldownMinutes) {
      return {
        allowed: false,
        cooldownRemainingMinutes: minCooldownMinutes - diffMinutes,
        reason: `Anti-Flapping mechanism: Cooldown period remaining (${diffMinutes}/${minCooldownMinutes} mins). Avoid continuous plan churn.`,
      };
    }

    return { allowed: true, reason: 'Cooldown requirement satisfied for next re-plan cycle' };
  }

  /**
   * Generates visual diff between original and revised plans (Diff Visualizer)
   */
  generatePlanDiff(originalPlan, revisedPlan) {
    const diff = {
      planId: originalPlan.planId,
      versionTransition: `v${originalPlan.version || 1} ➔ v${revisedPlan.version || 2}`,
      changes: [],
    };

    if (originalPlan.targets?.revenue !== revisedPlan.targets?.revenue) {
      diff.changes.push({
        field: 'targets.revenue',
        from: originalPlan.targets?.revenue,
        to: revisedPlan.targets?.revenue,
        impact: 'Revenue target adjustment',
      });
    }

    if (originalPlan.targets?.budgetCap !== revisedPlan.targets?.budgetCap) {
      diff.changes.push({
        field: 'targets.budgetCap',
        from: originalPlan.targets?.budgetCap,
        to: revisedPlan.targets?.budgetCap,
        impact: 'Budget cap change',
      });
    }

    if (revisedPlan.replanContext) {
      diff.changes.push({
        field: 'strategy.appliedOption',
        from: 'Original Plan',
        to: revisedPlan.replanContext.appliedOption,
        impact: revisedPlan.replanContext.rationale,
      });
    }

    return diff;
  }
}

module.exports = DynamicRePlannerService;
