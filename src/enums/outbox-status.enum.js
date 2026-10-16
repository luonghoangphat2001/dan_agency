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
});

module.exports = OutboxStatus;
