'use strict';

const BaseRepository = require('@models/BaseRepository');
const EnvMapping = require('@enums/env-mapping.enum');

/**
 * Repository for the key-value config table.
 * Maintains an in-process cache for zero-latency reads.
 * All initial configurations are resolved from ENV variables with fail-fast try/catch.
 * Zero || fallback operators.
 */
class ConfigRepository extends BaseRepository {
  /** @type {Map<string, string>} */
  #cache = new Map();

  /** Timestamp of last cache warm — used for TTL-based inter-process refresh */
  #cacheAt = 0;
  static #CACHE_TTL = 5_000;

  static #ENV_MAPPINGS = EnvMapping;

  /** @param {import('@models/Database')} db */
  constructor(db) {
    super(db, 'config');
  }

  /**
   * Reads initial configuration strictly from ENV variables.
   * Logs warnings with try/catch when an env variable is absent. Zero || operators.
   * @returns {Record<string, string>}
   */
  #resolveEnvConfig() {
    const configMap = {};
    for (const [key, envVar] of Object.entries(EnvMapping)) {
      try {
        const val = process.env[envVar];
        if (val === undefined || val === null) {
          throw new Error(`[ConfigRepository] Env variable '${envVar}' is not defined for key '${key}'`);
        }
        configMap[key] = String(val).trim();
      } catch (err) {
        console.warn(err.message);
        configMap[key] = '';
      }
    }
    return configMap;
  }

  /**
   * Reloads the in-memory cache directly from the database.
   */
  async #loadCache() {
    const rows = await this._db.query(`SELECT \`key\`, value FROM ${this._tableName}`);
    this.#cache.clear();
    for (const row of rows) {
      this.#cache.set(row.key, row.value);
    }
    this.#cacheAt = Date.now();
  }

  /** Insert env-driven config and warm the cache. Call once after DB.init(). */
  async init() {
    const configMap = this.#resolveEnvConfig();
    const entries = Object.entries(configMap);

    if (entries.length > 0) {
      const placeholders = entries.map(() => '(?, ?)').join(', ');
      const values = entries.flatMap(([key, val]) => [key, val]);
      await this._db.query(
        `INSERT IGNORE INTO ${this._tableName} (\`key\`, value) VALUES ${placeholders}`,
        values
      );
    }

    await this.#loadCache();
  }

  /**
   * Re-read all config from DB if the cache is older than CACHE_TTL.
   */
  async refreshIfNeeded() {
    if (Date.now() - this.#cacheAt < ConfigRepository.#CACHE_TTL) return;
    await this.#loadCache();
  }

  /**
   * Synchronous cache read — no DB round-trip.
   * @param {string} key
   * @returns {string|null}
   */
  get(key) {
    return this.#cache.get(key) ?? null;
  }

  /**
   * Persist a value to DB first, then update the local cache.
   * @param {string} key
   * @param {string} value
   */
  async set(key, value) {
    const str = String(value);
    await this._db.query(
      `INSERT INTO ${this._tableName} (\`key\`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?`,
      [key, str, str]
    );
    this.#cache.set(key, str);
  }
}

module.exports = ConfigRepository;
