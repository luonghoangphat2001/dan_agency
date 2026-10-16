'use strict';

/**
 * Execution Status for ReAct & Multi-Agent Orchestration Runs.
 */
const AgentRunStatus = Object.freeze({
  PENDING: 'pending',
  RUNNING: 'running',
  SUCCESS: 'success',
  COMPLETED: 'completed',
  FAILED: 'failed',
  TIMEOUT: 'timeout',
  BLOCKED: 'blocked',
});

module.exports = AgentRunStatus;
