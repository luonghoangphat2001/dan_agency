'use strict';

/**
 * Agent Lifecycle State Enum
 */
const AgentLifecycleState = Object.freeze({
  DRAFT: 'DRAFT',
  TESTING: 'TESTING',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  SUSPENDED: 'SUSPENDED',
  QUARANTINED: 'QUARANTINED',
  FIXING: 'FIXING',
  CANARY: 'CANARY',
  RETIRED: 'RETIRED',
});

module.exports = AgentLifecycleState;
