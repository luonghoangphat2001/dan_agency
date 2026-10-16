'use strict';

const migration = require('@database/migrations/018-add-missing-indexes');

describe('018-add-missing-indexes migration', () => {
  it('defines non-destructive index and virtual column optimization', () => {
    expect(migration.id).toBe('018-add-missing-indexes');
    expect(migration.up).toContain('idx_workflows_updated_at');
    expect(migration.up).toContain('idx_workflows_agent_created');
    expect(migration.up).toContain('idx_workflows_completed_agent');
    expect(migration.up).toContain('idx_workflow_actions_status_started');
    expect(migration.up).toContain('idx_workflow_actions_created_at');
    expect(migration.up).toContain('idx_outbox_jobs_claim_opt');
    expect(migration.up).toContain('idx_approval_requests_workflow_created');
    expect(migration.up).toContain('is_kpi_deviation TINYINT(1) GENERATED ALWAYS AS');
    expect(migration.up).toContain('idx_intelligence_traces_kpi');
  });

  it('provides safe reversible rollback statements without dropping existing data tables', () => {
    expect(migration.down).toContain('DROP KEY idx_intelligence_traces_kpi');
    expect(migration.down).toContain('DROP COLUMN is_kpi_deviation');
    expect(migration.down).toContain('DROP KEY idx_workflows_updated_at');
    expect(migration.down).not.toMatch(/DROP TABLE/i);
  });
});
