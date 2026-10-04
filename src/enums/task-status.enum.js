'use strict';

/**
 * Task Execution Status Enum for dan-api
 */
const TaskStatus = Object.freeze({
  PENDING: 'pending',
  PROCESSING: 'processing',
  RUNNING: 'running',
  DONE: 'done',
  COMPLETED: 'completed',
  FAILED: 'failed',
});

module.exports = TaskStatus;
