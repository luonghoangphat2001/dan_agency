/**
 * @fileoverview autonomy-governance.service.js
 * CEO Governance, Tiered Autonomy (L1-L4) & Multi-Signature Sentinel
 * Enforces financial guardrails, multi-signature threshold approvals,
 * and emergency kill-switch / veto mechanisms for autonomous agents.
 */
'use strict';

const crypto = require('crypto');
const AutonomyLevel = require('@enums/autonomy-level.enum');
const MultiSigStatus = require('@enums/multi-sig-status.enum');
const GovernanceSystemStatus = require('@enums/governance-system-status.enum');
const GovernanceAuditEvent = require('@enums/governance-audit-event.enum');
const GovernanceRole = require('@enums/governance-role.enum');

class AutonomyGovernanceService {
  constructor({
    clock = () => new Date(),
    secretKey = 'governance-secret-salt',
    financialLimits = {
      L1_MAX_SPEND: 0,
      L2_MAX_SPEND: 0,
      L3_MAX_SPEND: 20000000,       // 20M VND auto-approved
      L4_MAX_SPEND: 100000000,      // 100M VND limit for L4
      MULTI_SIG_THRESHOLD: 50000000 // >50M VND requires multi-sig
    },
    skillRules = null,
  } = {}) {
    this.clock = clock;
    this.secretKey = secretKey;
    this.financialLimits = financialLimits;
    this.multiSigRequests = new Map();
    this.emergencyState = {
      isFrozen: false,
      vetoReason: null,
      frozenAt: null,
      initiatedBy: null,
    };
    this.auditLog = [];
    this.skillRules = skillRules || this.#loadSkillRules();
  }

  #loadSkillRules() {
    try {
      return require('@skills/autonomy-governance/rules.json');
    } catch (_) {}
    return { reasons: {}, messages: {} };
  }

  #formatReason(key, vars = {}) {
    let tpl = this.skillRules?.reasons?.[key] || '';
    Object.entries(vars).forEach(([k, v]) => {
      tpl = tpl.replace(`{${k}}`, v);
    });
    return tpl;
  }

  #getMessage(key) {
    return this.skillRules?.messages?.[key] || '';
  }

  /**
   * Evaluate L1-L4 autonomy level authority for a proposed action
   */
  evaluateActionAutonomy({
    actionType,
    amount = 0,
    proposedBy,
    currentAutonomyLevel = AutonomyLevel.L3,
  }) {
    if (this.emergencyState.isFrozen) {
      return {
        allowed: false,
        requiresHumanApproval: true,
        reason: this.#formatReason('SYSTEM_FROZEN', { vetoReason: this.emergencyState.vetoReason }),
        autonomyLevel: currentAutonomyLevel,
      };
    }

    // 1. Automatic Tiered Threshold Evaluation
    if (currentAutonomyLevel === AutonomyLevel.L1) {
      return {
        allowed: false,
        requiresHumanApproval: true,
        reason: this.#formatReason('L1_ASSISTED'),
        autonomyLevel: AutonomyLevel.L1,
      };
    }

    if (currentAutonomyLevel === AutonomyLevel.L2) {
      return {
        allowed: false,
        requiresHumanApproval: true,
        reason: this.#formatReason('L2_RECOMMEND'),
        autonomyLevel: AutonomyLevel.L2,
      };
    }

    if (currentAutonomyLevel === AutonomyLevel.L3) {
      if (amount > this.financialLimits.MULTI_SIG_THRESHOLD) {
        return {
          allowed: false,
          requiresMultiSig: true,
          requiresHumanApproval: true,
          reason: this.#formatReason('L3_MULTI_SIG', { amount: amount.toLocaleString('vi-VN') }),
          autonomyLevel: AutonomyLevel.L3,
        };
      }

      if (amount <= this.financialLimits.L3_MAX_SPEND) {
        return {
          allowed: true,
          requiresHumanApproval: false,
          reason: this.#formatReason('L3_AUTO_APPROVED', { amount: amount.toLocaleString('vi-VN') }),
          autonomyLevel: AutonomyLevel.L3,
        };
      }

      return {
        allowed: false,
        requiresHumanApproval: true,
        reason: this.#formatReason('L3_SINGLE_APPROVAL', { amount: amount.toLocaleString('vi-VN') }),
        autonomyLevel: AutonomyLevel.L3,
      };
    }

    // L4 Fully Autonomous
    if (amount > this.financialLimits.MULTI_SIG_THRESHOLD) {
      return {
        allowed: false,
        requiresMultiSig: true,
        requiresHumanApproval: true,
        reason: this.#formatReason('L4_MULTI_SIG'),
        autonomyLevel: AutonomyLevel.L4,
      };
    }

    return {
      allowed: true,
      requiresHumanApproval: false,
      reason: this.#formatReason('L4_FULLY_AUTONOMOUS'),
      autonomyLevel: AutonomyLevel.L4,
    };
  }

  /**
   * Create Multi-Signature Request for high-value financial actions
   */
  createMultiSigRequest({
    title,
    actionType,
    amount,
    requiredSignatures = 2,
    eligibleSigners = [GovernanceRole.CEO, GovernanceRole.CFO, GovernanceRole.COO],
    payload = {},
  }) {
    const requestId = `msig_${crypto.randomUUID().substring(0, 8)}`;

    const request = {
      requestId,
      title,
      actionType,
      amount,
      requiredSignatures,
      eligibleSigners,
      collectedSignatures: [],
      payload,
      status: MultiSigStatus.PENDING_SIGNATURES,
      createdAt: this.clock().toISOString(),
    };

    this.multiSigRequests.set(requestId, request);
    return request;
  }

  /**
   * Digital HMAC-SHA256 signature verification and sign action
   */
  signMultiSigRequest({ requestId, signerId, signerRole, secretKey = this.secretKey }) {
    const request = this.multiSigRequests.get(requestId);
    if (!request) throw new Error(`MultiSig request not found: ${requestId}`);

    if (request.status !== MultiSigStatus.PENDING_SIGNATURES) {
      throw new Error(`Cannot sign request in status: ${request.status}`);
    }

    if (!request.eligibleSigners.includes(signerRole)) {
      throw new Error(`Role ${signerRole} is not eligible to sign this request`);
    }

    const alreadySigned = request.collectedSignatures.some(s => s.signerRole === signerRole);
    if (alreadySigned) {
      throw new Error(`Role ${signerRole} has already signed this request`);
    }

    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(`${requestId}:${signerId}:${signerRole}:${request.amount}`);
    const digitalSignature = hmac.digest('hex');

    request.collectedSignatures.push({
      signerId,
      signerRole,
      signature: digitalSignature,
      signedAt: this.clock().toISOString(),
    });

    if (request.collectedSignatures.length >= request.requiredSignatures) {
      request.status = MultiSigStatus.APPROVED_READY_FOR_EXECUTION;
      request.approvedAt = this.clock().toISOString();
    }

    return request;
  }

  /**
   * Trigger CEO Emergency Kill-Switch / Veto freeze
   */
  triggerEmergencyVeto({ reason = this.#getMessage('DEFAULT_VETO_REASON'), initiatedBy = GovernanceRole.CEO } = {}) {
    this.emergencyState = {
      isFrozen: true,
      vetoReason: reason,
      frozenAt: this.clock().toISOString(),
      initiatedBy,
    };

    this.auditLog.push({
      event: GovernanceAuditEvent.EMERGENCY_VETO_TRIGGERED,
      details: this.emergencyState,
      timestamp: this.clock().toISOString(),
    });

    return {
      status: GovernanceSystemStatus.SYSTEM_FROZEN,
      message: this.#getMessage('VETO_TRIGGERED'),
      emergencyState: this.emergencyState,
    };
  }

  /**
   * Lift Emergency System Freeze
   */
  liftEmergencyVeto({ initiatedBy = GovernanceRole.CEO, confirmationNote = this.#getMessage('DEFAULT_LIFT_NOTE') } = {}) {
    const previousReason = this.emergencyState.vetoReason;
    this.emergencyState = {
      isFrozen: false,
      vetoReason: null,
      frozenAt: null,
      initiatedBy: null,
    };

    this.auditLog.push({
      event: GovernanceAuditEvent.EMERGENCY_VETO_LIFTED,
      initiatedBy,
      confirmationNote,
      previousReason,
      timestamp: this.clock().toISOString(),
    });

    return {
      status: GovernanceSystemStatus.SYSTEM_RESTORED,
      message: this.#getMessage('VETO_LIFTED'),
      restoredAt: this.clock().toISOString(),
    };
  }

  isSystemFrozen() {
    return this.emergencyState.isFrozen;
  }

  getMultiSigRequest(requestId) {
    return this.multiSigRequests.get(requestId) || null;
  }
}

module.exports = AutonomyGovernanceService;
