/**
 * @fileoverview Agent - Provides agent functionality.
 */
"use strict";

const { AgentLifecycleState } = require('@enums');

/**
 * Agent
 * Manages agent domain state and lifecycle logic.
 */
class Agent {
  /**
   * constructor - Executes constructor.
   * @param {*} data - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor(data = {}) {
    this.agentId = data.agentId || data.agent_id;
    this.goalId = data.goalId || data.goal_id;
    this.autonomyLevel = data.autonomyLevel || data.autonomy_level || 0;
    this.lifecycleState = data.lifecycleState || data.lifecycle_state || AgentLifecycleState.DRAFT;
    this.limits = data.limits || {};
    this.enabled = Boolean(data.enabled);
    this.version = data.version || data.state_version || 1;
    this.createdAt = data.createdAt || data.created_at || new Date().toISOString();
    this.updatedAt = data.updatedAt || data.updated_at || new Date().toISOString();
  }

  /**
   * Checks whether the agent is in active production execution.
   * @returns {boolean}
   */
  isActive() {
    return this.lifecycleState === AgentLifecycleState.ACTIVE;
  }

  /**
   * Checks whether the agent is currently paused.
   * @returns {boolean}
   */
  isPaused() {
    return this.lifecycleState === AgentLifecycleState.PAUSED;
  }

  /**
   * Checks whether the agent is quarantined or suspended due to anomaly or safety breach.
   * @returns {boolean}
   */
  isQuarantined() {
    return [
      AgentLifecycleState.QUARANTINED,
      AgentLifecycleState.SUSPENDED,
    ].includes(this.lifecycleState);
  }
}

module.exports = Agent;
