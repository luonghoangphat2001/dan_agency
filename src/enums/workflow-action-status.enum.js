'use strict';

/**
 * Workflow Action Status Enum
 */
const WorkflowActionStatus = Object.freeze({
  PROPOSED: 'proposed',
  SCHEDULED: 'scheduled',
  EXECUTING: 'executing',
  COMPLETED: 'completed',
  RETRY_QUEUED: 'retry_queued',
  MANUAL_REVIEW: 'manual_review',
  UNKNOWN: 'unknown',
  FAILED: 'failed',

  values() {
    return [
      this.PROPOSED,
      this.SCHEDULED,
      this.EXECUTING,
      this.COMPLETED,
      this.RETRY_QUEUED,
      this.MANUAL_REVIEW,
      this.UNKNOWN,
      this.FAILED,
    ];
  },
});

module.exports = WorkflowActionStatus;

