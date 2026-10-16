/**
 * @fileoverview risk.catalog - Provides risk functionality.
 */
'use strict';

const actionCatalog = require('@schemas/workflow/action.catalog');
const { RiskLevel, ApprovalMode } = require('@enums');

const RISK_POLICY_VERSION = '1.0.0';
const RISK_LEVELS = Object.freeze(RiskLevel.values());
const APPROVAL_MODES = ApprovalMode;

const DEFAULT_THRESHOLDS = Object.freeze({
  purchaseOrderDraftAmount: 500000,
  voucherAmount: 100000,
  externalResponseConfidence: 0.85,
  voucherConfidence: 0.9,
});

function policy(action, baseRisk, approval, conditions = []) {
  return Object.freeze({
    action,
    baseRisk,
    approval,
    conditions: Object.freeze(conditions),
    policyVersion: RISK_POLICY_VERSION,
  });
}

const ACTION_RISK_POLICIES = Object.freeze([
  policy('order.list', RiskLevel.LOW, APPROVAL_MODES.NEVER),
  policy('order.read', RiskLevel.LOW, APPROVAL_MODES.NEVER),
  policy('product.list', RiskLevel.LOW, APPROVAL_MODES.NEVER),
  policy('product.read', RiskLevel.LOW, APPROVAL_MODES.NEVER),
  policy('inventory.read', RiskLevel.LOW, APPROVAL_MODES.NEVER),
  policy('finance.summary.read', RiskLevel.LOW, APPROVAL_MODES.NEVER),
  policy('cskh.feedback.list', RiskLevel.LOW, APPROVAL_MODES.NEVER),
  policy(
    'inventory.purchase_order_draft.create',
    RiskLevel.MEDIUM,
    APPROVAL_MODES.CONDITIONAL,
    [{
      field: 'total_amount',
      operator: 'gte',
      thresholdKey: 'purchaseOrderDraftAmount',
      escalatesTo: RiskLevel.HIGH,
    }],
  ),
  policy('finance.refund.execute', RiskLevel.CRITICAL, APPROVAL_MODES.ALWAYS),
  policy(
    'ops.order_status.update',
    RiskLevel.MEDIUM,
    APPROVAL_MODES.CONDITIONAL,
    [{
      field: 'target_status',
      operator: 'in',
      value: ['cancelled', 'refunded'],
      escalatesTo: RiskLevel.HIGH,
    }],
  ),
  policy(
    'cskh.response.send',
    RiskLevel.MEDIUM,
    APPROVAL_MODES.CONDITIONAL,
    [{
      field: 'confidence',
      operator: 'lt',
      thresholdKey: 'externalResponseConfidence',
      escalatesTo: RiskLevel.HIGH,
    }],
  ),
  policy(
    'cskh.voucher.issue',
    RiskLevel.MEDIUM,
    APPROVAL_MODES.CONDITIONAL,
    [
      {
        field: 'amount',
        operator: 'gte',
        thresholdKey: 'voucherAmount',
        escalatesTo: RiskLevel.HIGH,
      },
      {
        field: 'confidence',
        operator: 'lt',
        thresholdKey: 'voucherConfidence',
        escalatesTo: RiskLevel.HIGH,
      },
    ],
  ),
]);

const DEFAULT_DENY_POLICY = Object.freeze({
  action: null,
  baseRisk: RiskLevel.CRITICAL,
  approval: APPROVAL_MODES.ALWAYS,
  conditions: Object.freeze([]),
  decision: 'deny',
  reason: 'unknown_action',
  policyVersion: RISK_POLICY_VERSION,
});

/**
 * RiskCatalog
 * Manages risk catalog logic.
 */
class RiskCatalog {
  constructor(policies = ACTION_RISK_POLICIES, actions = actionCatalog.list()) {
    this.policies = new Map();
    policies.forEach((entry) => this.register(entry));
    this.assertComplete(actions);
  }

  /**
   * register - Executes register.
   * @param {*} entry - Input parameter.
   * @returns {*} Result of operation.
   */
  register(entry) {
    if (!entry?.action || !RISK_LEVELS.includes(entry.baseRisk)) {
      throw new TypeError('Risk policy must define a valid action and baseRisk');
    }

    if (!Object.values(APPROVAL_MODES).includes(entry.approval)) {
      throw new TypeError(`Invalid approval mode for action: ${entry.action}`);
    }

    if (this.policies.has(entry.action)) {
      throw new TypeError(`Duplicate risk policy: ${entry.action}`);
    }

    this.policies.set(entry.action, Object.freeze({ ...entry }));
  }

  /**
   * assertComplete - Executes assert complete.
   * @param {*} actions - Input parameter.
   * @returns {*} Result of operation.
   */
  assertComplete(actions) {
    const missing = actions
      .map(({ name }) => name)
      .filter((actionName) => !this.policies.has(actionName));

    if (missing.length > 0) {
      throw new TypeError(`Missing risk policies: ${missing.join(', ')}`);
    }
  }

  /**
   * get - Executes get.
   * @param {*} actionName - Input parameter.
   * @returns {*} Result of operation.
   */
  get(actionName) {
    return this.policies.get(actionName) || DEFAULT_DENY_POLICY;
  }

  /**
   * list - Executes list.
   * @returns {*} Result of operation.
   */
  list() {
    return Array.from(this.policies.values());
  }
}

module.exports = new RiskCatalog();
module.exports.RiskCatalog = RiskCatalog;
module.exports.ACTION_RISK_POLICIES = ACTION_RISK_POLICIES;
module.exports.APPROVAL_MODES = APPROVAL_MODES;
module.exports.DEFAULT_DENY_POLICY = DEFAULT_DENY_POLICY;
module.exports.DEFAULT_THRESHOLDS = DEFAULT_THRESHOLDS;
module.exports.RISK_LEVELS = RISK_LEVELS;
module.exports.RISK_POLICY_VERSION = RISK_POLICY_VERSION;
