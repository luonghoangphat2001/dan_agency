/**
 * @fileoverview multi-sig-status.enum.js
 * Multi-Signature Approval Statuses
 */
'use strict';

const MultiSigStatus = Object.freeze({
  PENDING_SIGNATURES: 'PENDING_SIGNATURES',
  APPROVED_READY_FOR_EXECUTION: 'APPROVED_READY_FOR_EXECUTION',
});

module.exports = MultiSigStatus;
