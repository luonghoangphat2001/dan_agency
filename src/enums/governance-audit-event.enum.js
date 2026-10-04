/**
 * @fileoverview governance-audit-event.enum.js
 * Governance Emergency Audit Trail Event Types
 */
'use strict';

const GovernanceAuditEvent = Object.freeze({
  EMERGENCY_VETO_TRIGGERED: 'EMERGENCY_VETO_TRIGGERED',
  EMERGENCY_VETO_LIFTED: 'EMERGENCY_VETO_LIFTED',
});

module.exports = GovernanceAuditEvent;
