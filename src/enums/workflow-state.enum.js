'use strict';

/**
 * Workflow State Enum
 */
const WorkflowState = Object.freeze({
  RECEIVED: 'received',
  QUEUED: 'queued',
  PLANNING: 'planning',
  EXECUTING: 'executing',
  RUNNING: 'running',
  AWAITING_APPROVAL: 'awaiting_approval',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',

  values() {
    return [
      this.RECEIVED,
      this.QUEUED,
      this.PLANNING,
      this.EXECUTING,
      this.RUNNING,
      this.AWAITING_APPROVAL,
      this.PAUSED,
      this.COMPLETED,
      this.FAILED,
      this.CANCELLED,
    ];
  },
});

module.exports = WorkflowState;

