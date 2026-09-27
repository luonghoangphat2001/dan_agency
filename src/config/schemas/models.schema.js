'use strict';

/**
 * Schema definitions for platform-wide and provider-specific AI models.
 */
const MODEL_CONFIG_SCHEMA = [
  // Platform Default Active Models
  {
    key: 'active_model',
    type: 'string',
    allowEmpty: false,
    category: 'platform_model',
  },
  {
    key: 'learning_active_model',
    type: 'string',
    allowEmpty: false,
    category: 'platform_model',
  },
  {
    key: 'discord_active_model',
    type: 'string',
    allowEmpty: false,
    category: 'platform_model',
  },
  {
    key: 'telegram_active_model',
    type: 'string',
    allowEmpty: false,
    category: 'platform_model',
  },

  // Primary Provider Version Selectors
  {
    key: 'gemini_model',
    type: 'string',
    allowEmpty: false,
    category: 'provider_model',
  },
  {
    key: 'claude_model',
    type: 'string',
    allowEmpty: false,
    category: 'provider_model',
  },
  {
    key: 'chatgpt_model',
    type: 'string',
    allowEmpty: false,
    category: 'provider_model',
  },

  // Extended Provider Models
  {
    key: 'deepseek_model',
    type: 'string',
    allowEmpty: false,
    category: 'provider_model',
  },
  {
    key: 'vllm_model',
    type: 'string',
    allowEmpty: false,
    category: 'provider_model',
  },
  {
    key: 'kimi_model',
    type: 'string',
    allowEmpty: false,
    category: 'provider_model',
  },
  {
    key: 'ollama_model',
    type: 'string',
    allowEmpty: false,
    category: 'provider_model',
  },
  {
    key: 'nvidia_model',
    type: 'string',
    allowEmpty: false,
    category: 'provider_model',
  },
  {
    key: 'cloudflare_model',
    type: 'string',
    allowEmpty: false,
    category: 'provider_model',
  },

  // Provider Proxy Endpoints
  {
    key: 'claude_base_url',
    type: 'string',
    category: 'provider_network',
    envFallbacks: [
      'CLAUDE_API_BASE_URL',
      'CLAUDE_BASE_URL',
    ],
  },
];

/**
 * UI schema and metadata for supported chat / bot platforms.
 */
const PLATFORMS_METADATA = [
  {
    key: 'discord',
    field: 'discord_active_model',
    iconClass: 'fa-brands fa-discord',
    titleKey: 'manager.config.platforms.discord.title',
    descriptionKey: 'manager.config.platforms.discord.description',
    color: 'text-indigo-400',
  },
  {
    key: 'telegram',
    field: 'telegram_active_model',
    iconClass: 'fa-brands fa-telegram',
    titleKey: 'manager.config.platforms.telegram.title',
    descriptionKey: 'manager.config.platforms.telegram.description',
    color: 'text-blue-400',
  },
  {
    key: 'learning',
    field: 'learning_active_model',
    iconClass: 'fa-solid fa-graduation-cap',
    titleKey: 'manager.config.platforms.learning.title',
    descriptionKey: 'manager.config.platforms.learning.description',
    color: 'text-emerald-400',
  },
  {
    key: 'web',
    field: 'active_model',
    iconClass: 'fa-solid fa-desktop',
    titleKey: 'manager.config.platforms.web.title',
    descriptionKey: 'manager.config.platforms.web.description',
    color: 'text-purple-400',
  },
];

/**
 * UI schema and metadata for additional AI provider models.
 */
const ADDITIONAL_PROVIDERS_METADATA = [
  { key: 'deepseek', field: 'deepseek_model', label: 'DeepSeek', iconClass: 'fa-solid fa-compass text-sky-400', placeholder: 'deepseek-chat' },
  { key: 'kimi', field: 'kimi_model', label: 'Kimi', iconClass: 'fa-solid fa-brain text-purple-400', placeholder: 'kimi-k2.6' },
  { key: 'vllm', field: 'vllm_model', label: 'vLLM', iconClass: 'fa-solid fa-bolt text-amber-400', placeholder: 'llama3.1' },
  { key: 'ollama', field: 'ollama_model', label: 'Ollama', iconClass: 'fa-solid fa-server text-emerald-400', placeholder: 'llama3.1' },
  { key: 'nvidia', field: 'nvidia_model', label: 'NVIDIA NIM', iconClass: 'fa-solid fa-microchip text-green-400', placeholder: 'meta/llama-3.2-11b-vision-instruct' },
  { key: 'cloudflare', field: 'cloudflare_model', label: 'Cloudflare AI', iconClass: 'fa-solid fa-cloud text-amber-400', placeholder: '@cf/meta/llama-3.1-8b-instruct' },
];

module.exports = {
  MODEL_CONFIG_SCHEMA,
  PLATFORMS_METADATA,
  ADDITIONAL_PROVIDERS_METADATA,
};
