'use strict';

const { z } = require('zod');
const BaseTool = require('@services/agent/core/BaseTool');
const InsightRepository = require('@models/InsightRepository');

/**
 * Tool for actively recalling long-term user memories and stored preferences.
 */
class RecallMemoryTool extends BaseTool {
  /** @type {InsightRepository|null} */
  #insightRepo;

  /**
   * @param {import('@models/Database')} [db]
   */
  constructor(db = null) {
    const schema = z.object({
      queryKey: z.string().optional().describe('Optional key or pattern to filter memories'),
    });

    super(
      'recall_memory',
      'Recalls stored long-term user preferences, directives, and past insights.',
      schema
    );

    this.#insightRepo = db ? new InsightRepository(db) : null;
  }

  async execute(parameters, context = {}) {
    const db = context.database || context.db;
    const repo = this.#insightRepo || (db ? new InsightRepository(db) : null);

    if (!repo) {
      return { success: false, error: 'Database context unavailable for memory recall.' };
    }

    const userId = context.userId || 'system';
    const platform = context.platform || 'web';

    const memories = await repo.findByUser(userId, platform);
    if (!Array.isArray(memories) || memories.length === 0) {
      return { success: true, count: 0, memories: [] };
    }

    const filtered = parameters?.queryKey
      ? memories.filter(m => m.mem_key.toLowerCase().includes(parameters.queryKey.toLowerCase()))
      : memories;

    return {
      success: true,
      count: filtered.length,
      memories: filtered.map(m => ({ key: m.mem_key, value: m.mem_value, updatedAt: m.updated_at }))
    };
  }
}

module.exports = RecallMemoryTool;
