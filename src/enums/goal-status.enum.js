'use strict';

/**
 * Goal Status Enum (matches 011-create-goals.js CHECK constraint)
 */
const GoalStatus = Object.freeze({
  DRAFT: 'draft',
  ACTIVE: 'active',
  AT_RISK: 'at_risk',
  ACHIEVED: 'achieved',
  CANCELLED: 'cancelled',

  values() {
    return [this.DRAFT, this.ACTIVE, this.AT_RISK, this.ACHIEVED, this.CANCELLED];
  },
});

module.exports = GoalStatus;

