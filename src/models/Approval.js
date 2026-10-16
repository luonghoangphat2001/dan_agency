/**
 * @fileoverview Approval - Provides approval functionality.
 */
"use strict";

const { ApprovalStatus, RiskLevel } = require('@enums');

/**
 * Approval
 * Manages approval request domain logic.
 */
class Approval {
  /**
   * constructor - Executes constructor.
   * @param {*} data - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor(data = {}) {
    this.approvalId = data.approvalId || data.approval_id;
    this.workflowId = data.workflowId || data.workflow_id;
    this.actionId = data.actionId || data.action_id;
    this.riskLevel = data.riskLevel || data.risk_level || RiskLevel.MEDIUM;
    this.status = data.status || ApprovalStatus.PENDING;
    this.actorId = data.actorId || data.actor_id || null;
    this.requestedAt = data.requestedAt || data.requested_at || new Date().toISOString();
    this.expiresAt = data.expiresAt || data.expires_at || null;
    this.decidedAt = data.decidedAt || data.decided_at || null;
  }

  /**
   * Checks whether the approval is currently awaiting decision.
   * @returns {boolean}
   */
  isPending() {
    return this.status === ApprovalStatus.PENDING;
  }

  /**
   * Checks whether the approval has already been decided (consumed, rejected, or expired).
   * @returns {boolean}
   */
  isDecided() {
    return [
      ApprovalStatus.CONSUMED,
      ApprovalStatus.REJECTED,
      ApprovalStatus.EXPIRED,
    ].includes(this.status);
  }
}

module.exports = Approval;
