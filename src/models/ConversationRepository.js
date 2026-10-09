'use strict';

const BaseRepository = require('@models/BaseRepository');

/**
 * Repository for the conversations table.
 */
class ConversationRepository extends BaseRepository {
  constructor(db) {
    super(db, 'conversations');
  }

  /**
   * @param {{ channelId: string, userId: string, username: string, role: string, content: string, model: string, tokensIn?: number, tokensOut?: number }} msg
   */
  async save({ channelId, userId, username, role, content, model, tokensIn = 0, tokensOut = 0 }) {
    await this._db.query(
      'INSERT INTO conversations (channel_id, user_id, username, role, content, model, tokens_in, tokens_out) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [channelId, userId, username, role, content, model, tokensIn, tokensOut]
    );
  }

  /**
   * Get the most recent messages for a channel, ordered oldest-first.
   * @param {string} channelId
   * @param {number} [limit]
   * @returns {Promise<any[]>}
   */
  async findByChannel(channelId, limit = 10) {
    return this._db.query(
      'SELECT * FROM (SELECT * FROM conversations WHERE channel_id = ? ORDER BY created_at DESC LIMIT ?) t ORDER BY created_at ASC',
      [channelId, limit]
    );
  }

  /**
   * Paginated full history, newest first.
   * @param {number} [limit]
   * @param {number} [offset]
   * @returns {Promise<any[]>}
   */
  async findAll(limit = 50, offset = 0) {
    return this._db.query(
      'SELECT * FROM conversations ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
  }

  /**
   * @returns {Promise<{ total: number, today: number, byModel: any[], tokensByModel: any[] }>}
   */
  async getStats() {
    const totalRow = await this._db.queryOne('SELECT COUNT(*) AS c FROM conversations');
    const todayRow = await this._db.queryOne(
      'SELECT COUNT(*) AS c FROM conversations WHERE DATE(created_at) = CURDATE()'
    );
    // Count only user messages (one per Q&A exchange) to avoid double-counting
    const byModel = await this._db.query(
      'SELECT model, COUNT(*) AS count FROM conversations WHERE role = "user" GROUP BY model ORDER BY count DESC'
    );
    const tokensByModel = await this._db.query(
      'SELECT model, SUM(tokens_in) AS tokens_in, SUM(tokens_out) AS tokens_out FROM conversations WHERE role = "assistant" GROUP BY model ORDER BY (SUM(tokens_in) + SUM(tokens_out)) DESC'
    );
    // Today's usage per model (for rate-limit awareness)
    const todayByModel = await this._db.query(
      `SELECT model,
              COUNT(*)         AS requests,
              SUM(tokens_in)   AS tokens_in,
              SUM(tokens_out)  AS tokens_out
       FROM conversations
       WHERE role = 'assistant' AND DATE(created_at) = CURDATE()
       GROUP BY model
       ORDER BY (SUM(tokens_in) + SUM(tokens_out)) DESC`
    );

    // Last 7 days daily breakdown per model
    const dailyUsage = await this._db.query(
      `SELECT DATE(created_at)  AS day,
              model,
              COUNT(*)          AS requests,
              SUM(tokens_in)    AS tokens_in,
              SUM(tokens_out)   AS tokens_out
       FROM conversations
       WHERE role = 'assistant'
         AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
       GROUP BY DATE(created_at), model
       ORDER BY day DESC, (SUM(tokens_in) + SUM(tokens_out)) DESC`
    );

    return { total: totalRow.c, today: todayRow.c, byModel, tokensByModel, todayByModel, dailyUsage };
  }
}

module.exports = ConversationRepository;
