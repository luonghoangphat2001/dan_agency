'use strict';

/**
 * Status of outgoing notifications in outbox table.
 */
const NotificationStatus = Object.freeze({
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
});

module.exports = NotificationStatus;
