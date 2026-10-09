'use strict';

const BaseRepository = require('@models/BaseRepository');
const TaskStatus = require('@enums/task-status.enum');

class TaskRepository extends BaseRepository {
  constructor(db) {
    super(db, 'agent_tasks');
  }

  /** @returns {Promise<number>} new task id */
  async create({ userId, username, platform, channelId, description }) {
    const result = await this._db.query(
      `INSERT INTO agent_tasks (user_id, username, platform, channel_id, description, status)
       VALUES (?, ?, ?, ?, ?, '${TaskStatus.PENDING}')`,
      [userId, username, platform, channelId, description]
    );
    return result.insertId;
  }

  async updateStatus(id, status, result = undefined) {
    const done = status === TaskStatus.DONE || status === TaskStatus.COMPLETED || status === TaskStatus.FAILED;
    await this._db.query(
      `UPDATE agent_tasks
       SET status = ?, result = ?, completed_at = ${done ? 'NOW()' : 'NULL'}
       WHERE id = ?`,
      [status, result ?? null, id]
    );
  }

  async findAll(limit = 50) {
    return this._db.query(
      `SELECT id, user_id, username, platform, channel_id, description, status, created_at, completed_at
       FROM agent_tasks ORDER BY created_at DESC LIMIT ?`,
      [Math.min(Math.max(Number(limit) || 50, 1), 200)]
    );
  }

  async findOne(id) {
    return this.findById(id);
  }
}

module.exports = TaskRepository;
