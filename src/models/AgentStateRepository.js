'use strict';

const BaseRepository = require('@models/BaseRepository');

/**
 * Repository for managing agent execution state: agent_runs and agent_steps.
 */
class AgentStateRepository extends BaseRepository {
  constructor(database) {
    super(database, 'agent_runs');
  }

  /**
   * Creates a new agent run record.
   * @param {{ id: string, userId: string, platform?: string, channelId?: string, prompt: string }} runData
   */
  async createRun({ id, userId, platform = 'web', channelId = null, prompt }) {
    await this._db.query(
      `INSERT INTO agent_runs (id, user_id, platform, channel_id, prompt, status)
       VALUES (?, ?, ?, ?, ?, 'running')`,
      [id, userId, platform, channelId, prompt]
    );
  }

  /**
   * Records an execution step (Scratchpad trace).
   * @param {string} runId
   * @param {{ stepIndex: number, thought?: string, toolName?: string, toolInput?: any, toolOutput?: any, durationMs?: number }} stepData
   */
  async recordStep(runId, { stepIndex, thought = null, toolName = null, toolInput = null, toolOutput = null, durationMs = 0 }) {
    const inputJson = toolInput ? JSON.stringify(toolInput) : null;
    const outputText = typeof toolOutput === 'object' ? JSON.stringify(toolOutput) : (toolOutput ? String(toolOutput) : null);

    await this._db.query(
      `INSERT INTO agent_steps (run_id, step_index, thought, tool_name, tool_input, tool_output, duration_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [runId, stepIndex, thought, toolName, inputJson, outputText, durationMs]
    );
  }

  /**
   * Updates an agent run with final results and token counts.
   * @param {string} id
   * @param {{ status: 'success'|'failed'|'timeout', finalAnswer?: string, totalSteps?: number, totalTokensIn?: number, totalTokensOut?: number }} updateData
   */
  async completeRun(id, { status = 'success', finalAnswer = null, totalSteps = 0, totalTokensIn = 0, totalTokensOut = 0 }) {
    await this._db.query(
      `UPDATE agent_runs
       SET status = ?, final_answer = ?, total_steps = ?, total_tokens_in = ?, total_tokens_out = ?, updated_at = NOW()
       WHERE id = ?`,
      [status, finalAnswer, totalSteps, totalTokensIn, totalTokensOut, id]
    );
  }

  /**
   * Retrieves a run with all its steps.
   * @param {string} runId
   * @returns {Promise<{ run: any, steps: any[] }|null>}
   */
  async getRunDetails(runId) {
    const run = await this.findById(runId);
    if (!run) return null;

    const steps = await this._db.query(
      'SELECT * FROM agent_steps WHERE run_id = ? ORDER BY step_index ASC',
      [runId]
    );

    return { run, steps };
  }

  /**
   * Retrieves recent runs for a user.
   * @param {string} userId
   * @param {number} limit
   */
  async getRecentRuns(userId, limit = 10) {
    return await this._db.query(
      'SELECT * FROM agent_runs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
      [userId, limit]
    );
  }
}

module.exports = AgentStateRepository;
