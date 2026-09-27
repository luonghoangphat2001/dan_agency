/**
 * @fileoverview logger.service - Provides logger functionality.
 */
'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Resolve the openclaw project root by walking upward to find package.json.
 * @returns {string}
 */
function resolveProjectRoot() {
  let dir = __dirname;
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, 'package.json'))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(__dirname, '../../..');
}

const DEFAULT_LOG_FILE = process.env.OPENCLAW_LOG_FILE
  ? path.resolve(process.env.OPENCLAW_LOG_FILE)
  : path.join(resolveProjectRoot(), '.log');

/**
 * LoggerService
 * Manages logger logic.
 */
class LoggerService {
  constructor(logFile = DEFAULT_LOG_FILE) {
    this.logFile = logFile;
  }

  /**
   * info - Executes info.
   * @param {*} message - Input parameter.
   * @param {*} context - Input parameter.
   * @returns {*} Result of operation.
   */
  info(message, context = {}) {
    this.write('info', message, context);
  }

  /**
   * error - Executes error.
   * @param {*} message - Input parameter.
   * @param {*} context - Input parameter.
   * @returns {*} Result of operation.
   */
  error(message, context = {}) {
    this.write('error', message, context);
  }

  /**
   * write - Executes write.
   * @param {*} level - Input parameter.
   * @param {*} message - Input parameter.
   * @param {*} context - Input parameter.
   * @returns {*} Result of operation.
   */
  write(level, message, context = {}) {
    const entry = {
      ...context,
      time: new Date().toISOString(),
      level,
      message,
    };

    try {
      fs.appendFileSync(this.logFile, `${JSON.stringify(entry)}\n`, 'utf8');
    } catch (err) {
      console.error(`[OpenClaw] Failed to write ${this.logFile}: ${err.message}`);
    }
  }

  /**
   * formatError - Executes format error.
   * @param {*} err - Input parameter.
   * @returns {*} Result of operation.
   */
  formatError(err) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
      statusCode: err.statusCode || err.response?.status,
      details: err.details,
    };
  }
}

module.exports = new LoggerService();
module.exports.LoggerService = LoggerService;
