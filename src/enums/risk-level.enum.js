'use strict';

/**
 * Risk Level Enum (synchronized with Database CHECK constraints)
 */
const RiskLevel = Object.freeze({
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
});

module.exports = RiskLevel;
