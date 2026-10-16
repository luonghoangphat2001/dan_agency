'use strict';

/**
 * Outbox Job Status Enum
 */
const OutboxStatus = Object.freeze({
  PENDING: 'pending',
  PROCESSING: 'processing',
  RETRY: 'retry',
  DELIVERED: 'delivered',
  DEAD: 'dead',

  values() {
    return [this.PENDING, this.PROCESSING, this.RETRY, this.DELIVERED, this.DEAD];
  },
});

module.exports = OutboxStatus;

