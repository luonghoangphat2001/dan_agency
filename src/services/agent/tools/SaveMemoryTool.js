'use strict';

const { z } = require('zod');
const BaseTool = require('@services/agent/core/BaseTool');
const InsightRepository = require('@models/InsightRepository');

/**
 * Tool for dynamically saving long-term user directives, preferences, and insights.
 */
class SaveMemoryTool extends BaseTool {
  /** @type {InsightRepository|null} */
  #insightRepo;

  /**
   * @param {import('@models/Database')} [db]
   */
  constructor(db = null) {
    const schema = z.object({
      key: z.string().min(1).describe('Memory key or topic (e.g., preferred_language, ceo_report_style)'),
      value: z.string().min(1).describe('The detailed content or instruction to remember'),
    });

    super(
      'save_memory',
      'Saves an important user preference, directive, or insight into long-term agent memory.',
      schema
    );

    this.#insightRepo = db ? new InsightRepository(db) : null;
  }

  async execute(parameters, context = {}) {
    const { key, value } = parameters;
    const db = context.database || context.db;
    const repo = this.#insightRepo || (db ? new InsightRepository(db) : null);

    if (!repo) {
      return { success: false, error: 'Database context unavailable for memory storage.' };
    }

    const userId = context.userId || 'system';
    const platform = context.platform || 'web';
    const channelId = context.channelId || null;

    await repo.upsert(userId, platform, channelId, key, value, 'agent_tool');
    return {
      success: true,
      message: `Memory saved successfully: [${key}] = "${value}"`
    };
  }
}

module.exports = SaveMemoryTool;
