'use strict';

const { GoalStatus, GoalHorizon, GoalOwnerType } = require('@enums');

/**
 * Goal Domain Model
 * Represents a strategic or operational goal / OKR in OpenClaw.
 * Morph relationship via (ownerType, ownerId).
 */
class Goal {
  constructor(data = {}) {
    this.goalId = data.goalId || data.goal_id;
    this.parentGoalId = data.parentGoalId || data.parent_goal_id || null;
    this.horizon = data.horizon || GoalHorizon.QUARTER;
    this.title = data.title || '';
    this.description = data.description || null;
    this.ownerType = data.ownerType || data.owner_type || GoalOwnerType.CEO;
    this.ownerId = data.ownerId || data.owner_id;
    this.target = data.target || {};
    this.progress = Number(data.progress ?? 0);
    this.status = data.status || GoalStatus.DRAFT;
    this.startsAt = data.startsAt || data.starts_at || new Date().toISOString();
    this.deadlineAt = data.deadlineAt || data.deadline_at;
    this.version = data.version || 1;
    this.createdAt = data.createdAt || data.created_at || new Date().toISOString();
    this.updatedAt = data.updatedAt || data.updated_at || new Date().toISOString();
  }

  isDraft() {
    return this.status === GoalStatus.DRAFT;
  }

  isActive() {
    return this.status === GoalStatus.ACTIVE;
  }

  isAtRisk() {
    return this.status === GoalStatus.AT_RISK;
  }

  isAchieved() {
    return this.status === GoalStatus.ACHIEVED;
  }

  isCancelled() {
    return this.status === GoalStatus.CANCELLED;
  }

  isCompleted() {
    return this.isAchieved() || this.isCancelled();
  }
}

module.exports = Goal;

