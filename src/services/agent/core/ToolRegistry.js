'use strict';

const BaseTool = require('@services/agent/core/BaseTool');
const ToolAdapter = require('@services/agent/core/ToolAdapter');
const localization = require('@lang');

/**
 * Dynamic Tool Registry managing agent tools, schema generation and runtime execution.
 */
class ToolRegistry {
  /** @type {Map<string, BaseTool>} */
  #tools = new Map();

  /**
   * Registers a tool.
   * @param {BaseTool} tool
   * @returns {ToolRegistry}
   */
  register(tool) {
    if (!(tool instanceof BaseTool)) {
      throw new TypeError('Cannot register tool. Object must inherit from BaseTool.');
    }
    this.#tools.set(tool.name, tool);
    return this;
  }

  /**
   * Unregisters a tool by name.
   * @param {string} name
   * @returns {boolean}
   */
  unregister(name) {
    return this.#tools.delete(name);
  }

  /**
   * Gets a tool by name.
   * @param {string} name
   * @returns {BaseTool|undefined}
   */
  get(name) {
    return this.#tools.get(name);
  }

  /**
   * Checks if tool exists.
   * @param {string} name
   * @returns {boolean}
   */
  has(name) {
    return this.#tools.has(name);
  }

  /**
   * Returns all registered tools.
   * @returns {BaseTool[]}
   */
  getAll() {
    return Array.from(this.#tools.values());
  }

  /**
   * Returns all tool names.
   * @returns {string[]}
   */
  getNames() {
    return Array.from(this.#tools.keys());
  }

  /**
   * Returns formatted declarations for the target provider.
   * @param {string} providerType - 'openai' | 'gemini' | 'claude'
   * @param {string[]} [allowedNames] - Optional filter for specific tools
   * @returns {object[]}
   */
  getDeclarations(providerType = 'openai', allowedNames = null) {
    let tools = this.getAll();
    if (Array.isArray(allowedNames)) {
      tools = tools.filter(tool => allowedNames.includes(tool.name));
    }
    return tools.map(tool => ToolAdapter.toFormat(tool, providerType));
  }

  /**
   * Executes a tool with runtime Zod validation.
   * @param {string} name - Tool name
   * @param {any} rawParameters - Raw parameters provided by LLM
   * @param {object} context - Execution context (user, database, etc.)
   * @returns {Promise<any>}
   */
  async execute(name, rawParameters, context = {}) {
    const tool = this.get(name);
    if (!tool) {
      throw new Error(localization.t('agent.errors.tool_not_found', { toolName: name }));
    }

    // 1. Zod runtime validation & coercion
    const validatedParameters = tool.validateParameters(rawParameters);

    // 2. Execution
    return await tool.execute(validatedParameters, context);
  }
}

module.exports = ToolRegistry;
