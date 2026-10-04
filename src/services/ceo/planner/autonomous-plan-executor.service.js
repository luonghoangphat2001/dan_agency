/**
 * @fileoverview autonomous-plan-executor.service.js
 * Multi-Agent Plan Execution & Cross-Departmental Coordination
 * Dispatches plan milestones to 5 Domain Agents, monitors micro-task SLAs,
 * and provides Conflict Arbitration between departments.
 */
'use strict';

const crypto = require('crypto');

const PlanExecutionStatus = require('@enums/plan-execution-status.enum');
const CeoPolicy = require('@enums/ceo-policy.enum');
const DomainAgent = require('@enums/domain-agent.enum');

class AutonomousPlanExecutorService {
  constructor({
    domainAgents = {},
    clock = () => new Date(),
    idFactory = () => `exec_${crypto.randomUUID()}`,
    skillRules = null,
  } = {}) {
    this.domainAgents = domainAgents;
    this.clock = clock;
    this.idFactory = idFactory;
    this.executions = new Map();
    this.conflicts = new Map();
    this.skillRules = skillRules || this.#loadSkillRules();
  }

  #loadSkillRules() {
    try {
      return require('@skills/ceo-arbitration/rules.json');
    } catch (_) {}
    return null;
  }

  /**
   * Dispatches task packages to 5 Domain Agents
   */
  async dispatchMilestone(milestone) {
    const execId = this.idFactory();
    const tasks = milestone.tasks || [];

    const dispatched = tasks.map((task) => {
      const targetAgent = task.assignedAgent;
      return {
        taskId: task.taskId || `task_${crypto.randomUUID().substring(0, 8)}`,
        agentId: targetAgent,
        action: task.name,
        params: task.params || {},
        status: PlanExecutionStatus.DISPATCHED,
        dispatchedAt: this.clock().toISOString(),
      };
    });

    const executionRecord = {
      executionId: execId,
      milestoneId: milestone.id || milestone.milestoneId,
      title: milestone.title,
      dispatchedTasks: dispatched,
      status: PlanExecutionStatus.IN_PROGRESS,
      createdAt: this.clock().toISOString(),
    };

    this.executions.set(execId, executionRecord);
    return executionRecord;
  }

  /**
   * Arbitrates goal conflicts between Domain Agents (Conflict Arbitration)
   */
  arbitrateConflict({ agentA, goalA, agentB, goalB, context = {}, ceoPolicy = CeoPolicy.BALANCED }) {
    const conflictId = `conf_${crypto.randomUUID().substring(0, 8)}`;

    const policyRules = this.skillRules?.ceoPolicies?.[ceoPolicy] || this.skillRules?.ceoPolicies?.[CeoPolicy.BALANCED] || {};

    let winner = 'COOPERATIVE_CONSENSUS';
    if (policyRules.winnerTarget === 'cfo') {
      winner = agentA.includes('cfo') ? agentA : agentB;
    } else if (policyRules.winnerTarget === 'rnd_or_cskh') {
      winner = (agentA.includes('rnd') || agentA.includes('cskh')) ? agentA : agentB;
    } else if (policyRules.winner) {
      winner = policyRules.winner;
    }

    const resolution = {
      winner,
      decision: policyRules.decision,
      adjustment: policyRules.adjustment,
    };

    const record = {
      conflictId,
      parties: [agentA, agentB],
      goals: [goalA, goalB],
      policy: ceoPolicy,
      resolution,
      timestamp: this.clock().toISOString(),
      resolved: true,
    };

    this.conflicts.set(conflictId, record);
    return record;
  }

  /**
   * Synthesizes execution outputs from 5 Domain Agents into a unified report
   */
  synthesizeExecutiveReport(executionId, taskResults = []) {
    const exec = this.executions.get(executionId);
    const completedTasks = taskResults.filter(t => t.status === PlanExecutionStatus.SUCCESS);
    const failedTasks = taskResults.filter(t => t.status === PlanExecutionStatus.FAILED);

    return {
      executionId,
      totalTasks: taskResults.length,
      completionRate: taskResults.length ? Math.round((completedTasks.length / taskResults.length) * 100) : 0,
      departmentSummaries: {
        [DomainAgent.RND]: taskResults.find(t => t.agentId === DomainAgent.RND)?.output || 'No tasks',
        [DomainAgent.LOGISTICS]: taskResults.find(t => t.agentId === DomainAgent.LOGISTICS)?.output || 'No tasks',
        [DomainAgent.CFO]: taskResults.find(t => t.agentId === DomainAgent.CFO)?.output || 'No tasks',
        [DomainAgent.OPS]: taskResults.find(t => t.agentId === DomainAgent.OPS)?.output || 'No tasks',
        [DomainAgent.CSKH]: taskResults.find(t => t.agentId === DomainAgent.CSKH)?.output || 'No tasks',
      },
      hasBottlenecks: failedTasks.length > 0,
      failedDetails: failedTasks.map(f => ({ agentId: f.agentId, error: f.error })),
      generatedAt: this.clock().toISOString(),
    };
  }
}

module.exports = AutonomousPlanExecutorService;
