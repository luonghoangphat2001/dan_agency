'use strict';

class DatabaseConfig {
  /**
   * @param {import('../reader/EnvReader')} reader
   */
  constructor(reader) {
    this.host = reader.requireString('DB_HOST');
    this.port = reader.requireNumber('DB_PORT');
    this.database = reader.requireString('DB_NAME');
    this.user = reader.requireString('DB_USER');
    this.password = reader.getOptionalString('DB_PASSWORD', '');
    this.connectionLimit = reader.requireNumber('DB_POOL_MAX');
    this.minConnections = reader.requireNumber('DB_POOL_MIN');
    Object.freeze(this);
  }
}

module.exports = DatabaseConfig;
