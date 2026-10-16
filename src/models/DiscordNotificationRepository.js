'use strict';

const BaseRepository = require('@models/BaseRepository');
const NotificationStatus = require('@enums/notification-status.enum');
const NotificationSeverity = require('@enums/notification-severity.enum');

/**
 * Durable boundary between the dashboard HTTP process and the Discord bot.
 */
class DiscordNotificationRepository extends BaseRepository {
  constructor(db) {
    super(db, 'discord_notification_outbox');
  }

  async enqueue(notification) {
    const severity = notification.severity || NotificationSeverity.INFO;
    const result = await this._db.query(
      `INSERT INTO discord_notification_outbox
         (idempotency_key, source, severity, title, message, channel_id)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
      [
        notification.idempotencyKey,
        notification.source,
        severity,
        notification.title,
        notification.message,
        notification.channelId,
      ]
    );

    return {
      id: Number(result.insertId),
      duplicate: Number(result.affectedRows) !== 1,
    };
  }

  async findPending(limit = 20) {
    return this._db.query(
      `SELECT * FROM discord_notification_outbox
       WHERE status = '${NotificationStatus.PENDING}' AND attempt_count < 5
       ORDER BY created_at ASC
       LIMIT ?`,
      [Math.min(Math.max(Number(limit) || 20, 1), 100)]
    );
  }

  async markSent(id) {
    await this._db.query(
      `UPDATE discord_notification_outbox
       SET status = '${NotificationStatus.SENT}', sent_at = NOW(), attempt_count = attempt_count + 1, last_error = NULL
       WHERE id = ? AND status = '${NotificationStatus.PENDING}'`,
      [id]
    );
  }

  async markFailed(id, error) {
    await this._db.query(
      `UPDATE discord_notification_outbox
       SET status = IF(attempt_count + 1 >= 5, '${NotificationStatus.FAILED}', '${NotificationStatus.PENDING}'),
           attempt_count = attempt_count + 1,
           last_error = ?
       WHERE id = ? AND status = '${NotificationStatus.PENDING}'`,
      [String(error || 'Unknown delivery error').slice(0, 500), id]
    );
  }
}

module.exports = DiscordNotificationRepository;
