'use strict';

const { zodToJsonSchema } = require('zod-to-json-schema');

/**
 * Adapter converting Zod tool definitions into native formats for:
 * - OpenAI / OpenAI-compatible
 * - Google Gemini
 * - Anthropic Claude
 */
class ToolAdapter {
  /**
   * Generates standard JSON schema from Zod schema, cleaning up unwanted metadata.
   * @param {import('./BaseTool')} tool
   * @returns {object}
   */
  static toJsonSchema(tool) {
    const rawSchema = zodToJsonSchema(tool.schema, {
      name: tool.name,
      $refStrategy: 'none',
      target: 'openApi3'
    });

    const schema = rawSchema.definitions?.[tool.name] || rawSchema;
    // Strip $schema if present
    const { $schema, ...cleaned } = schema;
    return cleaned;
  }

  /**
   * Convert to OpenAI Tools format
   * @param {import('./BaseTool')} tool
   * @returns {object}
   */
  static toOpenAI(tool) {
    const parameters = this.toJsonSchema(tool);
    return {
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'object',
          properties: parameters.properties || {},
          required: parameters.required || []
        }
      }
    };
  }

  /**
   * Convert to Google Gemini functionDeclarations format
   * @param {import('./BaseTool')} tool
   * @returns {object}
   */
  static toGemini(tool) {
    const parameters = this.toJsonSchema(tool);
    
    // Helper to recursively clean schema for Gemini compatibility
    const sanitizeForGemini = (targetObject) => {
      if (!targetObject || typeof targetObject !== 'object') return targetObject;
      if (Array.isArray(targetObject)) return targetObject.map(sanitizeForGemini);

      const copy = { ...targetObject };
      delete copy.additionalProperties;
      delete copy.$schema;
      delete copy.default;

      if (copy.properties) {
        const cleanedProperties = {};
        for (const [key, propertyValue] of Object.entries(copy.properties)) {
          cleanedProperties[key] = sanitizeForGemini(propertyValue);
        }
        copy.properties = cleanedProperties;
      }
      if (copy.items) {
        copy.items = sanitizeForGemini(copy.items);
      }
      return copy;
    };

    return {
      name: tool.name,
      description: tool.description,
      parameters: sanitizeForGemini({
        type: 'object',
        properties: parameters.properties || {},
        required: parameters.required || []
      })
    };
  }

  /**
   * Convert to Anthropic Claude Tools format
   * @param {import('./BaseTool')} tool
   * @returns {object}
   */
  static toClaude(tool) {
    const parameters = this.toJsonSchema(tool);
    return {
      name: tool.name,
      description: tool.description,
      input_schema: {
        type: 'object',
        properties: parameters.properties || {},
        required: parameters.required || []
      }
    };
  }

  /**
   * Universal converter based on provider identifier
   * @param {import('./BaseTool')} tool
   * @param {'openai'|'gemini'|'claude'} providerType
   * @returns {object}
   */
  static toFormat(tool, providerType = 'openai') {
    const normalized = (providerType || '').toLowerCase();
    if (normalized.includes('gemini') || normalized.includes('google')) {
      return this.toGemini(tool);
    }
    if (normalized.includes('claude') || normalized.includes('anthropic')) {
      return this.toClaude(tool);
    }
    return this.toOpenAI(tool);
  }
}

module.exports = ToolAdapter;
