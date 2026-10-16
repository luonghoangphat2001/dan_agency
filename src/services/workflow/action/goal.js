/**
 * @fileoverview goal - Provides goal functionality.
 */
'use strict';

const { GoalHorizon, GoalStatus, GoalOwnerType } = require('@enums');

const HORIZONS = Object.freeze(Object.values(GoalHorizon));
const STATUSES = Object.freeze(Object.values(GoalStatus));
const OWNER_TYPES = Object.freeze(Object.values(GoalOwnerType));
const STATUS_TRANSITIONS = Object.freeze({
  [GoalStatus.DRAFT]: Object.freeze([GoalStatus.ACTIVE, GoalStatus.CANCELLED]),
  [GoalStatus.ACTIVE]: Object.freeze([GoalStatus.AT_RISK, GoalStatus.ACHIEVED, GoalStatus.CANCELLED]),
  [GoalStatus.AT_RISK]: Object.freeze([GoalStatus.ACTIVE, GoalStatus.ACHIEVED, GoalStatus.CANCELLED]),
  [GoalStatus.ACHIEVED]: Object.freeze([]),
  [GoalStatus.CANCELLED]: Object.freeze([]),
});

/**
 * Goal
 * Manages goal logic.
 */
class Goal {
  /**
   * constructor - Executes constructor.
   * @param {*} input - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor(input) {
    this.#validate(input);
    this.goalId = input.goalId;
    this.parentGoalId = input.parentGoalId || null;
    this.horizon = input.horizon;
    this.title = input.title.trim();
    this.description = input.description?.trim() || null;
    this.ownerType = input.ownerType;
    this.ownerId = String(input.ownerId);
    this.target = Object.freeze({ ...input.target });
    this.progress = Number(input.progress || 0);
    this.status = input.status || GoalStatus.DRAFT;
    this.startsAt = new Date(input.startsAt);
    this.deadlineAt = new Date(input.deadlineAt);
    this.version = Number(input.version || 1);
    Object.freeze(this);
  }

  /**
   * transition - Executes transition.
   * @param {*} toStatus - Input parameter.
   * @param {*} progress - Input parameter.
   * @returns {*} Result of operation.
   */
  transition(toStatus, progress = this.progress) {
    if (!STATUS_TRANSITIONS[this.status]?.includes(toStatus)) {
      throw new TypeError(`Goal transition is not allowed: ${this.status} -> ${toStatus}`);
    }
    if (!Number.isFinite(progress) || progress < 0 || progress > 1) {
      throw new TypeError('Goal progress must be between 0 and 1');
    }
    if (toStatus === 'achieved' && progress !== 1) {
      throw new TypeError('Achieved goal must have progress 1');
    }
    return new Goal({ ...this, status: toStatus, progress, version: this.version + 1 });
  }

  #validate(input = {}) {
    if (!input.goalId || !input.title?.trim() || !input.ownerId) {
      throw new TypeError('Goal requires goalId, title, and ownerId');
    }
    if (!HORIZONS.includes(input.horizon)) throw new TypeError('Invalid goal horizon');
    if (!OWNER_TYPES.includes(input.ownerType)) throw new TypeError('Invalid goal owner type');
    if (!input.target || typeof input.target !== 'object'
      || !input.target.metric || input.target.value === undefined) {
      throw new TypeError('Goal target requires metric and value');
    }
    if (!STATUSES.includes(input.status || 'draft')) throw new TypeError('Invalid goal status');
    const startsAt = new Date(input.startsAt);
    const deadlineAt = new Date(input.deadlineAt);
    if (!Number.isFinite(startsAt.getTime()) || deadlineAt <= startsAt) {
      throw new TypeError('Goal deadline must be after start');
    }
  }
}

module.exports = Goal;
module.exports.HORIZONS = HORIZONS;
module.exports.STATUSES = STATUSES;
module.exports.STATUS_TRANSITIONS = STATUS_TRANSITIONS;
