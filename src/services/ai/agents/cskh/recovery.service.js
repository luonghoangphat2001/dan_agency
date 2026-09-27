/**
 * @fileoverview recovery.service - Provides recovery functionality.
 */
'use strict';

const localization = require('@lang');

/**
 * RecoveryService
 * Manages recovery logic.
 */
class RecoveryService {
  constructor({
    defaultVoucherAmount = 50000,
    templateConfidence = 0.95,
  } = {}) {
    this.defaultVoucherAmount = defaultVoucherAmount;
    this.templateConfidence = templateConfidence;
  }

  /**
   * build - Executes build.
   * @param {*} feedback - Input parameter.
   * @returns {*} Result of operation.
   */
  build(feedback) {
    const severe = feedback.sentiment === 'negative' || Number(feedback.rating) <= 2;
    const defaultCustomerName = localization.t('agents.cskh.default_customer_name');
    const customerName = feedback.customer_name || defaultCustomerName;
    const replyContent = severe
      ? localization.t('agents.cskh.recovery_severe', { customerName })
      : localization.t('agents.cskh.recovery_normal', { customerName });

    return Object.freeze({
      severe,
      reply_content: replyContent,
      confidence: this.templateConfidence,
      voucher_amount: severe ? this.defaultVoucherAmount : null,
    });
  }
}

module.exports = RecoveryService;
