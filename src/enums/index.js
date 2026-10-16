'use strict';

const WorkflowState = require('./workflow-state.enum');
const WorkflowActionStatus = require('./workflow-action-status.enum');
const RiskLevel = require('./risk-level.enum');
const ApprovalStatus = require('./approval-status.enum');
const DeadLetterStatus = require('./dead-letter-status.enum');
const OutboxStatus = require('./outbox-status.enum');
const AgentLifecycleState = require('./agent-lifecycle-state.enum');
const AgentMemoryScope = require('./agent-memory-scope.enum');
const { ActorType, GoalOwnerType, ExceptionSourceType } = require('./morph-type.enum');

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

module.exports = Object.freeze({
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
