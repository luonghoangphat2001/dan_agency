'use strict';

/**
 * Approval Status Enum
 */
const ApprovalStatus = Object.freeze({
  PENDING: 'pending',
  CONSUMED: 'consumed',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
});

module.exports = ApprovalStatus;
