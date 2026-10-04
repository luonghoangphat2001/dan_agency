/**
 * @fileoverview plan-execution-status.enum.js
 * Multi-Agent Milestone & Task Execution Statuses
 */
'use strict';

const PlanExecutionStatus = Object.freeze({
  DISPATCHED: 'DISPATCHED',
  IN_PROGRESS: 'IN_PROGRESS',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
});

module.exports = PlanExecutionStatus;
