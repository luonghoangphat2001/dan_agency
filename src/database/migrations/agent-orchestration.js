'use strict';

/**
 * Migration creating agent_orchestration_runs and agent_orchestration_steps tables.
 * @param {import('@models/Database')} db
 */
async function up(db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS agent_orchestration_runs (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      executive_role VARCHAR(32) DEFAULT 'ceo',
      prompt TEXT NOT NULL,
      status VARCHAR(32) DEFAULT 'running',
      final_answer LONGTEXT,
      total_steps INT DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_user_id (user_id),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS agent_orchestration_steps (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      run_id VARCHAR(36) NOT NULL,
      step_name VARCHAR(64) NOT NULL,
      agent_role VARCHAR(32) NOT NULL,
      output_data LONGTEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_run_id (run_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

module.exports = { up };
