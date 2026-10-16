'use strict';

/**
 * Goal Horizon Enum (matches 011-create-goals.js CHECK constraint)
 */
const GoalHorizon = Object.freeze({
  YEAR: 'year',
  QUARTER: 'quarter',
  MONTH: 'month',
  WEEK: 'week',

  values() {
    return [this.YEAR, this.QUARTER, this.MONTH, this.WEEK];
  },
});

module.exports = GoalHorizon;

