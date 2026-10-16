'use strict';

/**
 * Workflow State Enum
 */
const WorkflowState = Object.freeze({
  RECEIVED: 'received',
  QUEUED: 'queued',
  PLANNING: 'planning',
  EXECUTING: 'executing',
  AWAITING_APPROVAL: 'awaiting_approval',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
});

module.exports = WorkflowState;
