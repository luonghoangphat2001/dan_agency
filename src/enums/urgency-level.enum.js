'use strict';

/**
 * Threat & Alert Urgency Level Enum
 */
const UrgencyLevel = Object.freeze({
  RED_IMMEDIATE: 'RED_IMMEDIATE',
  YELLOW_MONITOR: 'YELLOW_MONITOR',
  ACTION_WITHIN_24H: 'ACTION_WITHIN_24H',
  ACTION_WITHIN_7D: 'ACTION_WITHIN_7D',
});

module.exports = UrgencyLevel;
