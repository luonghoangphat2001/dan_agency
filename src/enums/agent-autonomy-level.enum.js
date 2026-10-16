'use strict';

/**
 * Agent Autonomy Level Enum
 * Matches MySQL check constraint in 015-create-agent-autonomy-settings.js:
 * CHECK (autonomy_level IN ('OBSERVE', 'PROPOSE', 'EXECUTE_LOW_RISK', 'FULL_WITH_LIMITS'))
 */
const AgentAutonomyLevel = Object.freeze({
  OBSERVE: 'OBSERVE',
  PROPOSE: 'PROPOSE',
  EXECUTE_LOW_RISK: 'EXECUTE_LOW_RISK',
  FULL_WITH_LIMITS: 'FULL_WITH_LIMITS',

  values() {
    return [
      this.OBSERVE,
      this.PROPOSE,
      this.EXECUTE_LOW_RISK,
      this.FULL_WITH_LIMITS,
    ];
  },
});

module.exports = AgentAutonomyLevel;

