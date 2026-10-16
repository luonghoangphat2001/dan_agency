/**
 * @fileoverview workflow-state-machine - Provides workflow-state-machine functionality.
 */
'use strict';

const { WorkflowState } = require('@enums');

const TRANSITIONS = Object.freeze({
  [WorkflowState.RECEIVED]: Object.freeze([
    WorkflowState.QUEUED,
    WorkflowState.FAILED,
    WorkflowState.CANCELLED,
    WorkflowState.PAUSED,
  ]),
  [WorkflowState.QUEUED]: Object.freeze([
    WorkflowState.RUNNING,
    WorkflowState.FAILED,
    WorkflowState.CANCELLED,
    WorkflowState.PAUSED,
  ]),
  [WorkflowState.RUNNING]: Object.freeze([
    WorkflowState.AWAITING_APPROVAL,
    WorkflowState.COMPLETED,
    WorkflowState.FAILED,
    WorkflowState.CANCELLED,
    WorkflowState.PAUSED,
  ]),
  [WorkflowState.AWAITING_APPROVAL]: Object.freeze([
    WorkflowState.RUNNING,
    WorkflowState.FAILED,
    WorkflowState.CANCELLED,
    WorkflowState.PAUSED,
  ]),
  [WorkflowState.PAUSED]: Object.freeze([
    WorkflowState.RECEIVED,
    WorkflowState.QUEUED,
    WorkflowState.RUNNING,
    WorkflowState.AWAITING_APPROVAL,
    WorkflowState.FAILED,
    WorkflowState.CANCELLED,
  ]),
  [WorkflowState.COMPLETED]: Object.freeze([]),
  [WorkflowState.FAILED]: Object.freeze([WorkflowState.QUEUED, WorkflowState.CANCELLED]),
  [WorkflowState.CANCELLED]: Object.freeze([]),
});

/**
 * InvalidWorkflowTransitionError
 * Manages invalid workflow transition error logic.
 */
class InvalidWorkflowTransitionError extends Error {
  /**
   * constructor - Executes constructor.
   * @param {*} from - Input parameter.
   * @param {*} to - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor(from, to) {
    super(`Workflow transition is not allowed: ${from} -> ${to}`);
    this.name = 'InvalidWorkflowTransitionError';
    this.code = 'invalid_workflow_transition';
    this.from = from;
    this.to = to;
  }
}

/**
 * WorkflowStateMachine
 * Manages workflow state machine logic.
 */
class WorkflowStateMachine {
  /**
   * canTransition - Executes can transition.
   * @param {*} from - Input parameter.
   * @param {*} to - Input parameter.
   * @returns {*} Result of operation.
   */
  canTransition(from, to) {
    return TRANSITIONS[from]?.includes(to) === true;
  }

  /**
   * assertTransition - Executes assert transition.
   * @param {*} from - Input parameter.
   * @param {*} to - Input parameter.
   * @returns {*} Result of operation.
   */
  assertTransition(from, to) {
    if (!this.canTransition(from, to)) {
      throw new InvalidWorkflowTransitionError(from, to);
    }
  }

  /**
   * isTerminal - Executes is terminal.
   * @param {*} state - Input parameter.
   * @returns {*} Result of operation.
   */
  isTerminal(state) {
    return Array.isArray(TRANSITIONS[state]) && TRANSITIONS[state].length === 0;
  }
}

module.exports = new WorkflowStateMachine();
module.exports.WorkflowStateMachine = WorkflowStateMachine;
module.exports.InvalidWorkflowTransitionError = InvalidWorkflowTransitionError;
module.exports.TRANSITIONS = TRANSITIONS;
