'use strict';

/**
 * Polymorphic Morph Types Enum
 */
const ActorType = Object.freeze({
  CEO: 'ceo',
  AGENT: 'agent',
  OPERATOR: 'operator',
  SYSTEM: 'system',
});

const GoalOwnerType = Object.freeze({
  CEO: 'ceo',
  AGENT: 'agent',
  DEPARTMENT: 'department',
});

const ExceptionSourceType = Object.freeze({
  APPROVAL: 'approval',
  DEAD_LETTER: 'dead_letter',
  CONFLICT: 'conflict',
  KPI_DEVIATION: 'kpi_deviation',
});

module.exports = Object.freeze({
  ActorType,
  GoalOwnerType,
  ExceptionSourceType,
});
