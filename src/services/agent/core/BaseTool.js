'use strict';

const { z } = require('zod');

/**
 * Abstract Base Class for all Agent Tools.
 * Follows Open/Closed and Liskov Substitution Principles.
 */
class BaseTool {
  /**
   * @param {string} name - Unique identifier of the tool (snake_case)
   * @param {string} description - Detailed explanation of when and how LLM should use this tool
   * @param {z.ZodObject<any>} schema - Zod Schema defining inputs for the tool
   */
  constructor(name, description, schema) {
    if (new.target === BaseTool) {
      throw new TypeError('Cannot construct BaseTool instances directly. Subclass must implement it.');
    }
    if (!name || typeof name !== 'string') {
      throw new Error('Tool must have a valid name');
    }
    if (!description || typeof description !== 'string') {
      throw new Error(`Tool "${name}" must have a valid description`);
    }
    if (!schema || !(schema instanceof z.ZodType)) {
      throw new Error(`Tool "${name}" must have a valid Zod schema`);
    }

    this.name = name;
    this.description = description;
    this.schema = schema;
  }

  /**
   * Validates parameters using Zod at runtime.
   * Throws ZodError if invalid.
   * @param {any} rawParameters
   * @returns {any} parsed & sanitized parameters
   */
  validateParameters(rawParameters) {
    let sanitizedParameters = rawParameters;
    if (typeof rawParameters === 'string') {
      try {
        sanitizedParameters = JSON.parse(rawParameters);
      } catch (_) {
        // keep as is, let zod validate/fail
      }
    }
    return this.schema.parse(sanitizedParameters || {});
  }

  /**
   * Alias for backward compatibility
   * @param {any} rawParameters
   */
  validateArgs(rawParameters) {
    return this.validateParameters(rawParameters);
  }

  /**
   * Executes the tool logic. Subclasses must override this method.
   * @param {any} parameters - Validated parameters
   * @param {object} context - Execution context (userId, platform, channelId, database, etc.)
   * @returns {Promise<any>}
   */
  async execute(parameters, context = {}) {
    throw new Error(`Method execute() must be implemented in subclass ${this.name}`);
  }
}

module.exports = BaseTool;
