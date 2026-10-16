'use strict';

const Workflow = require('../../src/models/Workflow');
const Agent = require('../../src/models/Agent');
const Approval = require('../../src/models/Approval');
const { CeoCommand, CeoException } = require('../../src/models/Ceo');
const DeadLetter = require('../../src/models/DeadLetter');
const Goal = require('../../src/models/Goal');
const {
  WorkflowState,
  RiskLevel,
  AgentLifecycleState,
  ApprovalStatus,
  ExceptionSourceType,
  DeadLetterStatus,
  DeadLetterSourceType,
  GoalStatus,
  GoalHorizon,
  GoalOwnerType,
} = require('@enums');

describe('Domain Models with Enum Integration & Rich Helper Methods', () => {
  describe('Workflow Model', () => {
    it('initializes with default Enum values', () => {
      const workflow = new Workflow({ workflowId: 'wfl_1' });
      expect(workflow.state).toBe(WorkflowState.RECEIVED);
      expect(workflow.riskLevel).toBe(RiskLevel.LOW);
      expect(workflow.isTerminal()).toBe(false);
      expect(workflow.isActive()).toBe(true);
      expect(workflow.isPendingApproval()).toBe(false);
    });

    it('correctly evaluates terminal and active states', () => {
      const completed = new Workflow({ state: WorkflowState.COMPLETED });
      expect(completed.isTerminal()).toBe(true);
      expect(completed.isActive()).toBe(false);

      const failed = new Workflow({ state: WorkflowState.FAILED });
      expect(failed.isTerminal()).toBe(true);
      expect(failed.isActive()).toBe(false);

      const cancelled = new Workflow({ state: WorkflowState.CANCELLED });
      expect(cancelled.isTerminal()).toBe(true);
      expect(cancelled.isActive()).toBe(false);

      const executing = new Workflow({ state: WorkflowState.EXECUTING });
      expect(executing.isTerminal()).toBe(false);
      expect(executing.isActive()).toBe(true);

      const awaiting = new Workflow({ state: WorkflowState.AWAITING_APPROVAL });
      expect(awaiting.isPendingApproval()).toBe(true);
    });
  });

  describe('Agent Model', () => {
    it('initializes with AgentLifecycleState.DRAFT in uppercase matching MySQL check constraint', () => {
      const agent = new Agent({ agentId: 'dan_agent' });
      expect(agent.lifecycleState).toBe(AgentLifecycleState.DRAFT);
      expect(agent.isActive()).toBe(false);
      expect(agent.isPaused()).toBe(false);
      expect(agent.isQuarantined()).toBe(false);
    });

    it('evaluates active, paused, and quarantined helper methods', () => {
      const active = new Agent({ lifecycleState: AgentLifecycleState.ACTIVE });
      expect(active.isActive()).toBe(true);

      const paused = new Agent({ lifecycleState: AgentLifecycleState.PAUSED });
      expect(paused.isPaused()).toBe(true);

      const quarantined = new Agent({ lifecycleState: AgentLifecycleState.QUARANTINED });
      expect(quarantined.isQuarantined()).toBe(true);

      const suspended = new Agent({ lifecycleState: AgentLifecycleState.SUSPENDED });
      expect(suspended.isQuarantined()).toBe(true);
    });
  });

  describe('Approval Model', () => {
    it('initializes with ApprovalStatus.PENDING and RiskLevel.MEDIUM', () => {
      const approval = new Approval({ approvalId: 'apr_1' });
      expect(approval.status).toBe(ApprovalStatus.PENDING);
      expect(approval.riskLevel).toBe(RiskLevel.MEDIUM);
      expect(approval.isPending()).toBe(true);
      expect(approval.isDecided()).toBe(false);
    });

    it('evaluates decided status helper', () => {
      const consumed = new Approval({ status: ApprovalStatus.CONSUMED });
      expect(consumed.isPending()).toBe(false);
      expect(consumed.isDecided()).toBe(true);

      const rejected = new Approval({ status: ApprovalStatus.REJECTED });
      expect(rejected.isDecided()).toBe(true);

      const expired = new Approval({ status: ApprovalStatus.EXPIRED });
      expect(expired.isDecided()).toBe(true);
    });
  });

  describe('Ceo Models', () => {
    it('initializes CeoCommand with default risk level and status', () => {
      const cmd = new CeoCommand({ requestId: 'cmd_1' });
      expect(cmd.risk).toBe(RiskLevel.LOW);
      expect(cmd.status).toBe('processing');
    });

    it('initializes CeoException with default ExceptionSourceType and RiskLevel', () => {
      const exc = new CeoException({ exceptionId: 'exc_1' });
      expect(exc.sourceType).toBe(ExceptionSourceType.APPROVAL);
      expect(exc.severity).toBe(RiskLevel.MEDIUM);
      expect(exc.status).toBe('open');
    });
  });

  describe('DeadLetter Model', () => {
    it('initializes with default DeadLetterSourceType and DeadLetterStatus', () => {
      const dl = new DeadLetter({ deadLetterId: 'dl_1', correlationId: 'corr_1' });
      expect(dl.sourceType).toBe(DeadLetterSourceType.WORKFLOW_ACTION);
      expect(dl.status).toBe(DeadLetterStatus.OPEN);
      expect(dl.isOpen()).toBe(true);
      expect(dl.isResolved()).toBe(false);
      expect(dl.isReplayed()).toBe(false);
      expect(dl.canRetry(3)).toBe(true);
    });

    it('evaluates resolved and retry status helpers', () => {
      const resolved = new DeadLetter({ status: DeadLetterStatus.RESOLVED });
      expect(resolved.isOpen()).toBe(false);
      expect(resolved.isResolved()).toBe(true);
      expect(resolved.canRetry()).toBe(false);

      const maxed = new DeadLetter({ attemptCount: 5 });
      expect(maxed.canRetry(5)).toBe(false);
    });
  });

  describe('Goal Model', () => {
    it('initializes with default GoalHorizon, GoalOwnerType, and GoalStatus', () => {
      const goal = new Goal({ goalId: 'goal_1', ownerId: 'ceo_1' });
      expect(goal.horizon).toBe(GoalHorizon.QUARTER);
      expect(goal.ownerType).toBe(GoalOwnerType.CEO);
      expect(goal.status).toBe(GoalStatus.DRAFT);
      expect(goal.isDraft()).toBe(true);
      expect(goal.isActive()).toBe(false);
      expect(goal.isCompleted()).toBe(false);
    });

    it('correctly tracks active, at_risk, achieved, and cancelled lifecycle', () => {
      const active = new Goal({ status: GoalStatus.ACTIVE });
      expect(active.isActive()).toBe(true);
      expect(active.isCompleted()).toBe(false);

      const atRisk = new Goal({ status: GoalStatus.AT_RISK });
      expect(atRisk.isAtRisk()).toBe(true);

      const achieved = new Goal({ status: GoalStatus.ACHIEVED });
      expect(achieved.isAchieved()).toBe(true);
      expect(achieved.isCompleted()).toBe(true);

      const cancelled = new Goal({ status: GoalStatus.CANCELLED });
      expect(cancelled.isCancelled()).toBe(true);
      expect(cancelled.isCompleted()).toBe(true);
    });
  });
});

