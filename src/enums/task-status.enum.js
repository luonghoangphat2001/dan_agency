'use strict';

/**
 * Task Execution Status & Aggregate Status Enums
 */
const TaskStatus = Object.freeze({
  PENDING: 'pending',
  EXECUTING: 'executing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  SKIPPED: 'skipped',

  values() {
    return [this.PENDING, this.EXECUTING, this.COMPLETED, this.FAILED, this.SKIPPED];
  },
});

const TaskAggregateStatus = Object.freeze({
  COMPLETED: 'completed',
  PARTIAL: 'partial',
  FAILED: 'failed',

  values() {
    return [this.COMPLETED, this.PARTIAL, this.FAILED];
  },
});

module.exports = {
  TaskStatus,
  TaskAggregateStatus,
};

