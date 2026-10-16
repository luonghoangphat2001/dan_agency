'use strict';

const BaseRepository = require('@models/BaseRepository');
const bcrypt = require('bcryptjs');
const UserRole = require('@enums/user-role.enum');

/**
 * Repository for the users table.
 * Owns all password hashing so callers never touch bcrypt directly.
 */
class UserRepository extends BaseRepository {
  constructor(db) {
    super(db, 'users');
  }

  /**
   * Insert the admin user on first run.
   * Accepts a pre-hashed password so the caller can migrate
   * an existing hash from the config table without re-hashing.
   * @param {string} username
   * @param {string|null} passwordHash  bcrypt hash
   */
  async seedAdmin(username, passwordHash) {
    if (!passwordHash) return;
    const existing = await this.findByUsername(username);
    if (!existing) {
      await this._db.query(
        `INSERT INTO users (username, password_hash, role) VALUES (?, ?, '${UserRole.ADMIN}')`,
        [username, passwordHash]
      );
    }
  }

  /**
   * Ensure default admin user exists on application boot.
   * Encapsulates password hashing and database insertion.
   * @param {string} [username]
   * @param {string} [password]
   * @returns {Promise<void>}
   */
  async ensureDefaultAdmin(
    username = process.env.ADMIN_DEFAULT_USER || 'admin',
    password = process.env.ADMIN_DEFAULT_PASSWORD || 'ChangeMeInEnv123!'
  ) {
    const existing = await this.findByUsername(username);
    if (!existing) {
      if (!process.env.ADMIN_DEFAULT_PASSWORD && process.env.NODE_ENV === 'production') {
        console.warn('[SECURITY WARNING] ADMIN_DEFAULT_PASSWORD is not set in production. Using fallback initial password.');
      }
      const hash = await bcrypt.hash(password, 10);
      await this._db.query(
        `INSERT INTO users (username, password_hash, role) VALUES (?, ?, '${UserRole.ADMIN}')`,
        [username, hash]
      );
      console.log(`[UserRepository] Seeded default admin account (${username})`);
    }
  }

  /**
   * @param {string} username
   * @returns {Promise<any|null>}
   */
  async findByUsername(username) {
    return this._db.queryOne('SELECT * FROM users WHERE username = ?', [username]);
  }

  /**
   * @returns {Promise<any[]>}
   */
  async findAll() {
    return this._db.query(
      'SELECT id, username, role, created_at, last_active FROM users ORDER BY created_at ASC'
    );
  }

  /** @param {string} username */
  async updateLastActive(username) {
    await this._db.query('UPDATE users SET last_active = NOW() WHERE username = ?', [username]);
  }

  /**
   * @param {string} username
   * @param {string} password  plain-text
   * @param {'admin'|'user'|'student'} [role]
   */
  async create(username, password, role = UserRole.USER) {
    const hash = await bcrypt.hash(password, 10);
    await this._db.query(
      'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
      [username, hash, role]
    );
  }

  /**
   * @param {string} username
   * @param {string} password  plain-text
   */
  async updatePassword(username, password) {
    const hash = await bcrypt.hash(password, 10);
    await this._db.query(
      'UPDATE users SET password_hash = ? WHERE username = ?',
      [hash, username]
    );
  }

  /** @param {string} username */
  async delete(username) {
    await this._db.query('DELETE FROM users WHERE username = ?', [username]);
  }

  /**
   * Constant-time password verification.
   * @param {string} plaintext
   * @param {string} hash
   * @returns {Promise<boolean>}
   */
  async verifyPassword(plaintext, hash) {
    return bcrypt.compare(plaintext, hash);
  }
}

module.exports = UserRepository;
