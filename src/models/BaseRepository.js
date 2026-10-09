'use strict';

const PaginationUtils = require('@utils/PaginationUtils');

/**
 * Base Abstract Repository providing shared CRUD helpers, pagination, and database access.
 */
class BaseRepository {
  /** @type {import('./Database')} */
  _db;

  /** @type {string} */
  _tableName;

  /**
   * @param {import('./Database')} db
   * @param {string} [tableName='']
   */
  constructor(db, tableName = '') {
    if (new.target === BaseRepository) {
      throw new TypeError('Cannot construct BaseRepository instances directly');
    }
    this._db = db;
    this._tableName = tableName;
  }

  /**
   * Get the underlying database connection instance.
   * @returns {import('./Database')}
   */
  get db() {
    return this._db;
  }

  /**
   * Finds a single record by primary key id.
   * @param {number|string} id
   * @param {string} [idColumn='id']
   * @returns {Promise<object|null>}
   */
  async findById(id, idColumn = 'id') {
    if (!this._tableName) throw new Error('[BaseRepository] Table name not specified for findById.');
    return this._db.queryOne(
      `SELECT * FROM ${this._tableName} WHERE ${idColumn} = ? LIMIT 1`,
      [id]
    );
  }

  /**
   * Checks whether a record exists by primary key id.
   * @param {number|string} id
   * @param {string} [idColumn='id']
   * @returns {Promise<boolean>}
   */
  async existsById(id, idColumn = 'id') {
    if (!this._tableName) throw new Error('[BaseRepository] Table name not specified for existsById.');
    const row = await this._db.queryOne(
      `SELECT 1 AS found FROM ${this._tableName} WHERE ${idColumn} = ? LIMIT 1`,
      [id]
    );
    return Boolean(row?.found);
  }

  /**
   * Retrieves all records from the table with optional limit/offset.
   * @param {{ limit?: number, offset?: number, orderBy?: string }} [options]
   * @returns {Promise<Array<any>>}
   */
  async findAll({ limit = 100, offset = 0, orderBy = 'id ASC' } = {}) {
    if (!this._tableName) throw new Error('[BaseRepository] Table name not specified for findAll.');
    return this._db.query(
      `SELECT * FROM ${this._tableName} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
      [limit, offset]
    );
  }

  /**
   * Counts rows matching optional WHERE conditions.
   * @param {string} [whereClause='']
   * @param {Array<any>} [params=[]]
   * @returns {Promise<number>}
   */
  async count(whereClause = '', params = []) {
    if (!this._tableName) throw new Error('[BaseRepository] Table name not specified for count.');
    const sql = `SELECT COUNT(*) AS total FROM ${this._tableName} ${whereClause ? `WHERE ${whereClause}` : ''}`;
    const row = await this._db.queryOne(sql, params);
    return Number(row?.total || 0);
  }

  /**
   * Deletes a record by primary key id.
   * @param {number|string} id
   * @param {string} [idColumn='id']
   * @returns {Promise<boolean>}
   */
  async deleteById(id, idColumn = 'id') {
    if (!this._tableName) throw new Error('[BaseRepository] Table name not specified for deleteById.');
    const result = await this._db.query(
      `DELETE FROM ${this._tableName} WHERE ${idColumn} = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }

  /**
   * Executes a paginated query using PaginationUtils.
   * @param {string} selectSql
   * @param {Array<any>} params
   * @param {object} [queryParams={}] - req.query object containing limit/offset/page
   * @param {object} [paginationOptions={}]
   * @returns {Promise<{ items: Array<any>, limit: number, offset: number, page: number }>}
   */
  async paginateQuery(selectSql, params = [], queryParams = {}, paginationOptions = {}) {
    const { limit, offset, page } = PaginationUtils.parse(queryParams, paginationOptions);
    const paginatedSql = `${selectSql} LIMIT ? OFFSET ?`;
    const items = await this._db.query(paginatedSql, [...params, limit, offset]);

    return { items, limit, offset, page };
  }
}

module.exports = BaseRepository;
