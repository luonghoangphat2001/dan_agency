'use strict';

/**
 * Polymorphic Morph Types Enum
 */
const ActorType = Object.freeze({
  CEO: 'ceo',
  AGENT: 'agent',
  OPERATOR: 'operator',
  SYSTEM: 'system',

  values() {
    return [this.CEO, this.AGENT, this.OPERATOR, this.SYSTEM];
  },
});

const GoalOwnerType = Object.freeze({
  CEO: 'ceo',
  AGENT: 'agent',
  DEPARTMENT: 'department',

  values() {
    return [this.CEO, this.AGENT, this.DEPARTMENT];
  },
});

const ExceptionSourceType = Object.freeze({
  APPROVAL: 'approval',
  DEAD_LETTER: 'dead_letter',
  CONFLICT: 'conflict',
  KPI_DEVIATION: 'kpi_deviation',

  values() {
    return [this.APPROVAL, this.DEAD_LETTER, this.CONFLICT, this.KPI_DEVIATION];
  },
});

const DeadLetterSourceType = Object.freeze({
  WORKFLOW_ACTION: 'workflow_action',
  OUTBOX_JOB: 'outbox_job',
  EVENT: 'event',
  WORKFLOW: 'workflow',

  values() {
    return [this.WORKFLOW_ACTION, this.OUTBOX_JOB, this.EVENT, this.WORKFLOW];
  },
});

module.exports = Object.freeze({
  ActorType,
  GoalOwnerType,
  ExceptionSourceType,
  DeadLetterSourceType,
});

