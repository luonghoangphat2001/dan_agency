'use strict';

const BaseRepository = require('@models/BaseRepository');

/**
 * Persists OpenClaw interaction logs for admin monitoring.
 */
class OpenClawRepository extends BaseRepository {
  constructor(db) {
    super(db, 'openclaw_logs');
  }

  /**
   * Save one OpenClaw interaction.
   * @param {{
   *   userId: string, username: string, platform: string, channelId: string,
   *   queryType: 'search'|'crawl', query: string,
   *   resultPreview: string, aiSummary: string,
   * }} opts
   */
  async save({ userId, username, platform, channelId, queryType, query, resultPreview, aiSummary }) {
    await this._db.query(
      `INSERT INTO openclaw_logs
         (user_id, username, platform, channel_id, query_type, query, result_preview, ai_summary)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, username, platform, channelId, queryType, query,
       resultPreview.slice(0, 1000), aiSummary.slice(0, 2000)]
    );
  }

  /**
   * Return recent logs, newest first.
   * @param {number} [limit]
   * @param {number} [offset]
   * @returns {Promise<any[]>}
   */
  async findRecent(limit = 50, offset = 0) {
    return this._db.query(
      `SELECT * FROM openclaw_logs ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
  }
}

module.exports = OpenClawRepository;
