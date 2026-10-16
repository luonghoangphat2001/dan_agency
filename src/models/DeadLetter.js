'use strict';

const { DeadLetterStatus, DeadLetterSourceType } = require('@enums');

/**
 * DeadLetter Domain Model
 * Represents a failed or unprocessable message/action/event preserved for manual inspection or automated replay.
 * Morph relationship via (sourceType, sourceId).
 */
class DeadLetter {
  constructor(data = {}) {
    this.deadLetterId = data.deadLetterId || data.dead_letter_id;
    this.sourceType = data.sourceType || data.source_type || DeadLetterSourceType.WORKFLOW_ACTION;
    this.sourceId = data.sourceId || data.source_id;
    this.eventId = data.eventId || data.event_id || null;
    this.workflowId = data.workflowId || data.workflow_id || null;
    this.actionId = data.actionId || data.action_id || null;
    this.correlationId = data.correlationId || data.correlation_id;
    this.payloadSnapshot = data.payloadSnapshot || data.payload_snapshot || {};
    this.payloadHash = data.payloadHash || data.payload_hash;
    this.errorCode = data.errorCode || data.error_code || 'unknown_error';
    this.errorClass = data.errorClass || data.error_class || null;
    this.errorMessage = data.errorMessage || data.error_message || '';
    this.errorDetails = data.errorDetails || data.error_details || null;
    this.attemptCount = data.attemptCount ?? data.attempt_count ?? 1;
    this.firstFailedAt = data.firstFailedAt || data.first_failed_at || new Date().toISOString();
    this.lastFailedAt = data.lastFailedAt || data.last_failed_at || new Date().toISOString();
    this.status = data.status || DeadLetterStatus.OPEN;
    this.resolution = data.resolution || null;
    this.resolvedBy = data.resolvedBy || data.resolved_by || null;
    this.resolvedAt = data.resolvedAt || data.resolved_at || null;
    this.replayJobId = data.replayJobId || data.replay_job_id || null;
    this.createdAt = data.createdAt || data.created_at || new Date().toISOString();
    this.updatedAt = data.updatedAt || data.updated_at || new Date().toISOString();
  }

  isOpen() {
    return this.status === DeadLetterStatus.OPEN;
  }

  isResolved() {
    return this.status === DeadLetterStatus.RESOLVED;
  }

  isReplayed() {
    return this.status === DeadLetterStatus.REPLAYED;
  }

  canRetry(maxAttempts = 5) {
    return this.isOpen() && this.attemptCount < maxAttempts;
  }
}

module.exports = DeadLetter;

