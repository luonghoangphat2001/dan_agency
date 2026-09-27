'use strict';

const localization = require('@lang');

/**
 * Static tool definitions for OpenClaw endpoints in each AI provider's native format.
 * Tools: web_search, web_crawl, http_fetch, browser_automate
 */
class ToolRegistry {
  /** Shared parameter definitions — one source of truth */
  static get #PARAMS() {
    return {
      web_search: {
        description: localization.t('tools.web_search.description'),
        properties: {
          query: { type: 'string', description: localization.t('tools.web_search.query') },
          num:   { type: 'number', description: localization.t('tools.web_search.num') },
        },
        required: ['query'],
      },
      web_crawl: {
        description: localization.t('tools.web_crawl.description'),
        properties: {
          url:      { type: 'string', description: localization.t('tools.web_crawl.url') },
          selector: { type: 'string', description: localization.t('tools.web_crawl.selector') },
        },
        required: ['url'],
      },
      http_fetch: {
        description: localization.t('tools.http_fetch.description'),
        properties: {
          url:     { type: 'string',  description: localization.t('tools.http_fetch.url') },
          method:  { type: 'string',  description: localization.t('tools.http_fetch.method') },
          headers: { type: 'object',  description: localization.t('tools.http_fetch.headers') },
          body:    { type: 'string',  description: localization.t('tools.http_fetch.body') },
        },
        required: ['url'],
      },
      browser_automate: {
        description: localization.t('tools.browser_automate.description'),
        properties: {
          url:   { type: 'string', description: localization.t('tools.browser_automate.url') },
          steps: {
            type: 'array',
            description: localization.t('tools.browser_automate.steps'),
            items: {
              type: 'object',
              properties: {
                action:   { type: 'string', description: localization.t('tools.browser_automate.action') },
                selector: { type: 'string', description: localization.t('tools.browser_automate.selector') },
                value:    { type: 'string', description: localization.t('tools.browser_automate.value') },
              },
              required: ['action'],
            },
          },
        },
        required: ['url', 'steps'],
      },
      save_memory: {
        description: localization.t('tools.save_memory.description'),
        properties: {
          key:    { type: 'string', description: localization.t('tools.save_memory.key') },
          value:  { type: 'string', description: localization.t('tools.save_memory.value') },
          source: { type: 'string', description: localization.t('tools.save_memory.source') },
        },
        required: ['key', 'value'],
      },
      recall_memory: {
        description: localization.t('tools.recall_memory.description'),
        properties: {},
        required: [],
      },
      company_dashboard_metrics: {
        description: localization.t('tools.company_dashboard_metrics.description'),
        properties: {
          period: {
            type: 'string',
            description: localization.t('tools.company_dashboard_metrics.period'),
            enum: ['today', 'month', 'quarter', 'year'],
          },
        },
        required: [],
      },
      schedule_manage: {
        description: localization.t('tools.schedule_manage.description'),
        properties: {
          operation: {
            type: 'string',
            description: localization.t('tools.schedule_manage.operation'),
            enum: ['create', 'list', 'update', 'delete'],
          },
          scheduleId: { type: 'number', description: localization.t('tools.schedule_manage.scheduleId') },
          title: { type: 'string', description: localization.t('tools.schedule_manage.title') },
          remindAt: { type: 'string', description: localization.t('tools.schedule_manage.remindAt') },
          repeatType: { type: 'string', description: localization.t('tools.schedule_manage.repeatType') },
          date: { type: 'string', description: localization.t('tools.schedule_manage.date') },
        },
        required: ['operation'],
      },
    };
  }

  /**
   * Tool definitions for Gemini (functionDeclarations format).
   * @returns {Array<{name: string, description: string, parameters: object}>}
   */
  static forGemini() {
    return Object.entries(ToolRegistry.#PARAMS).map(([name, spec]) => ({
      name,
      description: spec.description,
      parameters: {
        type: 'OBJECT',
        properties: Object.fromEntries(
          Object.entries(spec.properties).map(([k, v]) => [k, {
            type:        v.type === 'array' ? 'ARRAY' : v.type === 'object' ? 'OBJECT' : 'STRING',
            description: v.description,
            ...(v.type === 'array' ? {
              items: {
                type: v.items?.type === 'object' ? 'OBJECT' : 'STRING',
                ...(v.items?.properties ? {
                  properties: Object.fromEntries(
                    Object.entries(v.items.properties).map(([itemKey, item]) => [itemKey, {
                      type: item.type === 'object' ? 'OBJECT' : item.type === 'array' ? 'ARRAY' : 'STRING',
                      description: item.description,
                    }])
                  ),
                  required: v.items.required || [],
                } : {}),
              },
            } : {}),
          }])
        ),
        required: spec.required,
      },
    }));
  }

  /**
   * Tool definitions for Claude (tools format).
   * @returns {Array<{name: string, description: string, input_schema: object}>}
   */
  static forClaude() {
    return Object.entries(ToolRegistry.#PARAMS).map(([name, spec]) => ({
      name,
      description: spec.description,
      input_schema: {
        type: 'object',
        properties: Object.fromEntries(
          Object.entries(spec.properties).map(([k, v]) => [k, {
            type:        v.type,
            description: v.description,
          }])
        ),
        required: spec.required,
      },
    }));
  }

  /**
   * Tool definitions for ChatGPT (tools format with type: "function").
   * @returns {Array<{type: "function", function: object}>}
   */
  static forChatGPT() {
    return Object.entries(ToolRegistry.#PARAMS).map(([name, spec]) => ({
      type: 'function',
      function: {
        name,
        description: spec.description,
        parameters: {
          type: 'object',
          properties: Object.fromEntries(
            Object.entries(spec.properties).map(([k, v]) => [k, {
              type:        v.type,
              description: v.description,
            }])
          ),
          required: spec.required,
        },
      },
    }));
  }
}

module.exports = ToolRegistry;
