'use strict';

/**
 * Initialize the agents database tables.
 * @param {import('@models/Database')} db
 * @param {{ addColumnIfMissing: Function, widenColumnIfNeeded: Function }} helpers
 */
module.exports = async function initializeAgents(db, helpers) {
    await db.query(`
      CREATE TABLE IF NOT EXISTS ai_memories (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        user_id    VARCHAR(64)  NOT NULL,
        platform   VARCHAR(16)  NOT NULL,
        channel_id VARCHAR(64)  NOT NULL,
        mem_key    VARCHAR(255) NOT NULL,
        mem_value  TEXT         NOT NULL,
        source     VARCHAR(500),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at DATETIME NULL,
        UNIQUE KEY uniq_user_key (user_id, platform, mem_key),
        INDEX idx_user (user_id, platform)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS agent_tasks (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        user_id      VARCHAR(64)  NOT NULL,
        username     VARCHAR(128) NOT NULL,
        platform     VARCHAR(16)  NOT NULL,
        channel_id   VARCHAR(64)  NOT NULL,
        description  TEXT         NOT NULL,
        status       ENUM('pending','running','done','failed') DEFAULT 'pending',
        result       MEDIUMTEXT,
        created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at   DATETIME NULL,
        completed_at DATETIME,
        INDEX idx_channel (channel_id),
        INDEX idx_status  (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS agent_runs (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        platform VARCHAR(50) NOT NULL DEFAULT 'web',
        channel_id VARCHAR(100) NULL,
        prompt TEXT NOT NULL,
        status ENUM('running', 'success', 'failed', 'timeout') DEFAULT 'running',
        final_answer LONGTEXT NULL,
        total_steps INT DEFAULT 0,
        total_tokens_in INT DEFAULT 0,
        total_tokens_out INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_platform (user_id, platform),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS agent_steps (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        run_id VARCHAR(36) NOT NULL,
        step_index INT NOT NULL,
        thought TEXT NULL,
        tool_name VARCHAR(100) NULL,
        tool_input JSON NULL,
        tool_output LONGTEXT NULL,
        duration_ms INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (run_id) REFERENCES agent_runs(id) ON DELETE CASCADE,
        INDEX idx_run_step (run_id, step_index)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
};





