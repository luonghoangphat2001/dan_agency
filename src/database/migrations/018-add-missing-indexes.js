/**
 * @fileoverview 018-add-missing-indexes - Non-destructive index optimization migration for OpenClaw.
 */
'use strict';

module.exports = Object.freeze({
  id: '018-add-missing-indexes',
  up: `
    ALTER TABLE workflows
      ADD KEY idx_workflows_updated_at (updated_at);

    ALTER TABLE workflows
      ADD KEY idx_workflows_agent_created (assigned_agent_id, created_at);

    ALTER TABLE workflows
      ADD KEY idx_workflows_completed_agent (state, completed_at, assigned_agent_id);

    ALTER TABLE workflow_actions
      ADD KEY idx_workflow_actions_status_started (status, started_at);

    ALTER TABLE workflow_actions
      ADD KEY idx_workflow_actions_created_at (created_at);

    ALTER TABLE outbox_jobs
      ADD KEY idx_outbox_jobs_claim_opt (status, priority, available_at, id);

    ALTER TABLE approval_requests
      ADD KEY idx_approval_requests_workflow_created (workflow_id, created_at);

    ALTER TABLE intelligence_traces
      ADD COLUMN is_kpi_deviation TINYINT(1) GENERATED ALWAYS AS (
        CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.kpiDeviation')) = 'true' THEN 1 ELSE 0 END
      ) VIRTUAL;

    ALTER TABLE intelligence_traces
      ADD KEY idx_intelligence_traces_kpi (is_kpi_deviation, occurred_at);
  `,
  down: `
    ALTER TABLE intelligence_traces DROP KEY idx_intelligence_traces_kpi;
    ALTER TABLE intelligence_traces DROP COLUMN is_kpi_deviation;
    ALTER TABLE approval_requests DROP KEY idx_approval_requests_workflow_created;
    ALTER TABLE outbox_jobs DROP KEY idx_outbox_jobs_claim_opt;
    ALTER TABLE workflow_actions DROP KEY idx_workflow_actions_created_at;
    ALTER TABLE workflow_actions DROP KEY idx_workflow_actions_status_started;
    ALTER TABLE workflows DROP KEY idx_workflows_completed_agent;
    ALTER TABLE workflows DROP KEY idx_workflows_agent_created;
    ALTER TABLE workflows DROP KEY idx_workflows_updated_at;
  `,
});
