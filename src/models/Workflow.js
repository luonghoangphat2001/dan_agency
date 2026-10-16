/**
 * @fileoverview Workflow - Provides workflow functionality.
 */
"use strict";

const { WorkflowState, RiskLevel } = require('@enums');

/**
 * Workflow
 * Manages workflow domain logic and state.
 */
class Workflow {
  /**
   * constructor - Executes constructor.
   * @param {*} data - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor(data = {}) {
    this.workflowId = data.workflowId || data.workflow_id;
    this.eventId = data.eventId || data.event_id;
    this.correlationId = data.correlationId || data.correlation_id;
    this.workflowType = data.workflowType || data.workflow_type;
    this.state = data.state || WorkflowState.RECEIVED;
    this.assignedAgentId = data.assignedAgentId || data.assigned_agent_id;
    this.riskLevel = data.riskLevel || data.risk_level || RiskLevel.LOW;
    this.priority = data.priority ?? 50;
    this.policyVersion = data.policyVersion || data.policy_version || "1.0.0";
    this.inputContext = data.inputContext || data.input_context || {};
    this.stateVersion = data.stateVersion || data.state_version || 1;
    this.createdAt = data.createdAt || data.created_at || new Date().toISOString();
    this.completedAt = data.completedAt || data.completed_at || null;
  }

  /**
   * Checks whether the workflow has reached a terminal state.
   * @returns {boolean}
   */
  isTerminal() {
    return [
      WorkflowState.COMPLETED,
      WorkflowState.FAILED,
      WorkflowState.CANCELLED,
    ].includes(this.state);
  }

  /**
   * Checks whether the workflow is actively executing or pending execution.
   * @returns {boolean}
   */
  isActive() {
    return !this.isTerminal();
  }

  /**
   * Checks whether the workflow is awaiting human or system approval.
   * @returns {boolean}
   */
  isPendingApproval() {
    return this.state === WorkflowState.AWAITING_APPROVAL;
  }
}

module.exports = Workflow;
