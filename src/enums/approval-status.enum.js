'use strict';

/**
 * Approval Status Enum
 */
const ApprovalStatus = Object.freeze({
  PENDING: 'pending',
  CONSUMED: 'consumed',
  REJECTED: 'rejected',
  EXPIRED: 'expired',

  values() {
    return [this.PENDING, this.CONSUMED, this.REJECTED, this.EXPIRED];
  },
});

module.exports = ApprovalStatus;

