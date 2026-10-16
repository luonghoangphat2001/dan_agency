'use strict';

/**
 * Risk Level Enum (synchronized with Database CHECK constraints)
 */
const RiskLevel = Object.freeze({
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',

  values() {
    return [this.LOW, this.MEDIUM, this.HIGH, this.CRITICAL];
  },
});

module.exports = RiskLevel;

