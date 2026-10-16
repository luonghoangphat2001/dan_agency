'use strict';

const enums = require('@enums');
const {
  Workflow,
  Agent,
  Approval,
  Policy,
  Goal,
  Morph,
  Ceo,
  Governance,
  Queue,
  System,
  WorkflowState,
  GoalStatus,
  RiskLevel,
} = require('@enums');

describe('Enums Namespace System', () => {
  describe('Workflow Namespace', () => {
    it('provides State and ActionStatus', () => {
      expect(Workflow.State.COMPLETED).toBe('completed');
      expect(Workflow.State.RECEIVED).toBe('received');
      expect(Workflow.ActionStatus.PROPOSED).toBe('proposed');
      expect(Workflow.TaskStatus.COMPLETED).toBe('completed');
      expect(Workflow.TaskAggregateStatus.PARTIAL).toBe('partial');
      expect(Workflow.SopExecutionStatus.COMPLETED).toBe('COMPLETED');
    });
  });

  describe('Agent Namespace', () => {
    it('provides LifecycleState, AutonomyLevel, and Domain', () => {
      expect(Agent.LifecycleState.ACTIVE).toBe('ACTIVE');
      expect(Agent.AutonomyLevel.FULL_WITH_LIMITS).toBe('FULL_WITH_LIMITS');
      expect(Agent.TieredAutonomyLevel.L3).toBe('L3');
      expect(Agent.Domain.CFO).toBe('dan_cfo');
    });
  });

  describe('Approval Namespace', () => {
    it('provides Status and Mode', () => {
      expect(Approval.Status.PENDING).toBe('pending');
      expect(Approval.Status.CONSUMED).toBe('consumed');
      expect(Approval.Mode.ALWAYS).toBe('always');
    });
  });

  describe('Policy Namespace', () => {
    it('provides Decision and RiskLevel', () => {
      expect(Policy.Decision.ALLOW).toBe('allow');
      expect(Policy.Decision.DENY).toBe('deny');
      expect(Policy.RiskLevel.CRITICAL).toBe('critical');
    });
  });

  describe('Goal Namespace', () => {
    it('provides Status, Horizon, and OwnerType', () => {
      expect(Goal.Status.ACTIVE).toBe('active');
      expect(Goal.Horizon.QUARTER).toBe('quarter');
      expect(Goal.OwnerType.CEO).toBe('ceo');
    });
  });

  describe('Morph Namespace', () => {
    it('provides polymorphic types for Actor, GoalOwner, Exception, and DeadLetter', () => {
      expect(Morph.ActorType.OPERATOR).toBe('operator');
      expect(Morph.GoalOwnerType.DEPARTMENT).toBe('department');
      expect(Morph.ExceptionSourceType.KPI_DEVIATION).toBe('kpi_deviation');
      expect(Morph.DeadLetterSourceType.WORKFLOW_ACTION).toBe('workflow_action');
    });
  });

  describe('Ceo Namespace', () => {
    it('provides CeoPolicy, ExceptionStatus, and strategic planning enums', () => {
      expect(Ceo.Policy.CASH_FIRST).toBe('CASH_FIRST');
      expect(Ceo.ExceptionStatus.OPEN).toBe('open');
      expect(Ceo.RePlanSeverity.CRITICAL).toBe('CRITICAL');
      expect(Ceo.BcgQuadrant.STAR).toBe('STAR');
    });
  });

  describe('Governance Namespace', () => {
    it('provides AuditEvent, Role, and SystemStatus', () => {
      expect(Governance.Role.SECURITY_OFFICER).toBe('SECURITY_OFFICER');
      expect(Governance.SystemStatus.OPERATIONAL).toBe('OPERATIONAL');
    });
  });

  describe('Queue & System Namespaces', () => {
    it('provides Queue and System enums', () => {
      expect(Queue.OutboxStatus.PROCESSING).toBe('processing');
      expect(Queue.DeadLetterStatus.OPEN).toBe('open');
      expect(System.CircuitBreakerState.CLOSED).toBe('closed');
      expect(System.ReportHealthStatus.DEGRADED).toBe('degraded');
      expect(System.WebAction.CLICK).toBe('click');
    });
  });

  describe('Backward Compatibility', () => {
    it('exports flat enums identically', () => {
      expect(WorkflowState.COMPLETED).toBe(Workflow.State.COMPLETED);
      expect(GoalStatus.ACTIVE).toBe(Goal.Status.ACTIVE);
      expect(RiskLevel.HIGH).toBe(Policy.RiskLevel.HIGH);
      expect(enums.WorkflowState).toBe(Workflow.State);
    });
  });
});
