'use strict';

const BaseRepository = require('@models/BaseRepository');

/**
 * Repository managing Multi-Agent Orchestration runs and step execution traces.
 */
class AgentOrchestrationRepository extends BaseRepository {
  constructor(db) {
    super(db, 'agent_orchestration_runs');
  }

  /**
   * Record a new orchestration run.
   * @param {{ id: string, userId: string, executiveRole: string, prompt: string }} runData
   */
  async createRun({ id, userId, executiveRole = 'ceo', prompt }) {
    await this._db.query(
      `INSERT INTO agent_orchestration_runs (id, user_id, executive_role, prompt, status)
       VALUES (?, ?, ?, ?, 'running')`,
      [id, userId, executiveRole, prompt]
    );
  }

  /**
   * Record an execution step for a run.
   * @param {string} runId
   * @param {{ stepName: string, agentRole: string, outputData: any }} stepData
   */
  async recordStep(runId, { stepName, agentRole, outputData }) {
    await this._db.query(
      `INSERT INTO agent_orchestration_steps (run_id, step_name, agent_role, output_data)
       VALUES (?, ?, ?, ?)`,
      [runId, stepName, agentRole, JSON.stringify(outputData)]
    );
  }

  /**
   * Mark orchestration run as completed.
   * @param {string} runId
   * @param {{ status?: string, finalAnswer: string, totalSteps?: number }} result
   */
  async completeRun(runId, { status = 'success', finalAnswer, totalSteps = 1 }) {
    await this._db.query(
      `UPDATE agent_orchestration_runs
       SET status = ?, final_answer = ?, total_steps = ?, updated_at = NOW()
       WHERE id = ?`,
      [status, finalAnswer, totalSteps, runId]
    );
  }
}

module.exports = AgentOrchestrationRepository;
