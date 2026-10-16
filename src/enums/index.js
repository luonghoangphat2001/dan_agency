'use strict';

// --- Individual Enum Modules ---
const WorkflowState = require('./workflow-state.enum');
const WorkflowActionStatus = require('./workflow-action-status.enum');
const RiskLevel = require('./risk-level.enum');
const ApprovalStatus = require('./approval-status.enum');
const DeadLetterStatus = require('./dead-letter-status.enum');
const OutboxStatus = require('./outbox-status.enum');
const AgentLifecycleState = require('./agent-lifecycle-state.enum');
const AgentMemoryScope = require('./agent-memory-scope.enum');
const {
  ActorType,
  GoalOwnerType,
  ExceptionSourceType,
  DeadLetterSourceType,
} = require('./morph-type.enum');
const CeoExceptionStatus = require('./ceo-exception-status.enum');
const GoalStatus = require('./goal-status.enum');
const GoalHorizon = require('./goal-horizon.enum');
const CircuitBreakerState = require('./circuit-breaker-state.enum');
const ApprovalMode = require('./approval-mode.enum');
const PolicyDecision = require('./policy-decision.enum');
const AgentAutonomyLevel = require('./agent-autonomy-level.enum');
const { TaskStatus, TaskAggregateStatus } = require('./task-status.enum');
const SopExecutionStatus = require('./sop-execution-status.enum');
const WebAction = require('./web-action.enum');
const ReportHealthStatus = require('./report-health-status.enum');

const ArbitrationStatus = require('./arbitration-status.enum');
const AutonomyLevel = require('./autonomy-level.enum');
const BcgQuadrant = require('./bcg-quadrant.enum');
const CeoPolicy = require('./ceo-policy.enum');
const ConflictType = require('./conflict-type.enum');
const ContingencyStrategy = require('./contingency-strategy.enum');
const Currency = require('./currency.enum');
const DomainAgent = require('./domain-agent.enum');
const GovernanceAuditEvent = require('./governance-audit-event.enum');
const GovernanceRole = require('./governance-role.enum');
const GovernanceSystemStatus = require('./governance-system-status.enum');
const MultiSigStatus = require('./multi-sig-status.enum');
const OkrStatus = require('./okr-status.enum');
const PlanExecutionStatus = require('./plan-execution-status.enum');
const PlanHorizon = require('./plan-horizon.enum');
const PlanStatus = require('./plan-status.enum');
const PositioningStatus = require('./positioning-status.enum');
const PostMortemOutcome = require('./post-mortem-outcome.enum');
const RePlanSeverity = require('./replan-severity.enum');
const RePlanStatus = require('./replan-status.enum');
const ScenarioType = require('./scenario-type.enum');
const SentimentType = require('./sentiment-type.enum');
const ThreatSeverity = require('./threat-severity.enum');
const ThreatType = require('./threat-type.enum');
const UrgencyLevel = require('./urgency-level.enum');

// --- Domain Namespaces ---
const Workflow = Object.freeze({
  State: WorkflowState,
  ActionStatus: WorkflowActionStatus,
  TaskStatus,
  TaskAggregateStatus,
  SopExecutionStatus,
});

const Agent = Object.freeze({
  LifecycleState: AgentLifecycleState,
  AutonomyLevel: AgentAutonomyLevel,
  TieredAutonomyLevel: AutonomyLevel,
  MemoryScope: AgentMemoryScope,
  Domain: DomainAgent,
});

const Approval = Object.freeze({
  Status: ApprovalStatus,
  Mode: ApprovalMode,
  MultiSigStatus,
});

const Policy = Object.freeze({
  Decision: PolicyDecision,
  RiskLevel,
  CeoPolicy,
});

const Goal = Object.freeze({
  Status: GoalStatus,
  Horizon: GoalHorizon,
  OwnerType: GoalOwnerType,
  OkrStatus,
});

const Morph = Object.freeze({
  ActorType,
  GoalOwnerType,
  ExceptionSourceType,
  DeadLetterSourceType,
});

const Ceo = Object.freeze({
  Policy: CeoPolicy,
  ExceptionStatus: CeoExceptionStatus,
  ArbitrationStatus,
  ConflictType,
  ContingencyStrategy,
  PlanStatus,
  PlanExecutionStatus,
  PlanHorizon,
  RePlanSeverity,
  RePlanStatus,
  PostMortemOutcome,
  PositioningStatus,
  BcgQuadrant,
  ScenarioType,
  ThreatType,
  ThreatSeverity,
  UrgencyLevel,
  SentimentType,
});

const Governance = Object.freeze({
  AuditEvent: GovernanceAuditEvent,
  Role: GovernanceRole,
  SystemStatus: GovernanceSystemStatus,
  MultiSigStatus,
  AutonomyLevel,
});

const Queue = Object.freeze({
  OutboxStatus,
  DeadLetterStatus,
  DeadLetterSourceType,
});

const System = Object.freeze({
  CircuitBreakerState,
  Currency,
  WebAction,
  ReportHealthStatus,
});

module.exports = Object.freeze({
  // Domain Namespaces
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

  // Flat exports for 100% backward compatibility
  WorkflowState,
  WorkflowActionStatus,
  RiskLevel,
  ApprovalStatus,
  DeadLetterStatus,
  OutboxStatus,
  AgentLifecycleState,
  AgentMemoryScope,
  ActorType,
  GoalOwnerType,
  ExceptionSourceType,
  DeadLetterSourceType,
  CeoExceptionStatus,
  GoalStatus,
  GoalHorizon,
  CircuitBreakerState,
  ApprovalMode,
  PolicyDecision,
  AgentAutonomyLevel,
  TaskStatus,
  TaskAggregateStatus,
  SopExecutionStatus,
  WebAction,
  ReportHealthStatus,
  ArbitrationStatus,
  AutonomyLevel,
  BcgQuadrant,
  CeoPolicy,
  ConflictType,
  ContingencyStrategy,
  Currency,
  DomainAgent,
  GovernanceAuditEvent,
  GovernanceRole,
  GovernanceSystemStatus,
  MultiSigStatus,
  OkrStatus,
  PlanExecutionStatus,
  PlanHorizon,
  PlanStatus,
  PositioningStatus,
  PostMortemOutcome,
  RePlanSeverity,
  RePlanStatus,
  ScenarioType,
  SentimentType,
  ThreatSeverity,
  ThreatType,
  UrgencyLevel,
});
