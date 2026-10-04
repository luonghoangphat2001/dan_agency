'use strict';

const AiProvider = require('@enums/ai-provider.enum');

const PROVIDER_ORDER = [
  AiProvider.CLAUDE,
  AiProvider.CHATGPT,
  AiProvider.GEMINI,
  AiProvider.DEEPSEEK,
  AiProvider.VLLM,
  AiProvider.KIMI,
  AiProvider.OLLAMA,
  AiProvider.NVIDIA,
  AiProvider.CLOUDFLARE,
];

const PROVIDER_META = {
  [AiProvider.CLAUDE]:     { key: AiProvider.CLAUDE,     label: 'Claude 🧠',   shortLabel: 'Claude',   icon: '✳️' },
  [AiProvider.CHATGPT]:    { key: AiProvider.CHATGPT,    label: 'ChatGPT 🤖', shortLabel: 'ChatGPT',  icon: '🤖' },
  [AiProvider.GEMINI]:     { key: AiProvider.GEMINI,     label: 'Gemini ✨',   shortLabel: 'Gemini',   icon: '🌟' },
  [AiProvider.DEEPSEEK]:   { key: AiProvider.DEEPSEEK,   label: 'DeepSeek 🌊', shortLabel: 'DeepSeek', icon: '🌊' },
  [AiProvider.VLLM]:       { key: AiProvider.VLLM,       label: 'vLLM ⚡',     shortLabel: 'vLLM',     icon: '⚡' },
  [AiProvider.KIMI]:       { key: AiProvider.KIMI,       label: 'Kimi',       shortLabel: 'Kimi',     icon: '🧠' },
  [AiProvider.OLLAMA]:     { key: AiProvider.OLLAMA,     label: 'Ollama',     shortLabel: 'Ollama',   icon: '🦙' },
  [AiProvider.NVIDIA]:     { key: AiProvider.NVIDIA,     label: 'NVIDIA NIM 🟢', shortLabel: 'NVIDIA', icon: '🟢' },
  [AiProvider.CLOUDFLARE]: { key: AiProvider.CLOUDFLARE, label: 'Cloudflare AI ☁️', shortLabel: 'Cloudflare', icon: '☁️' },
  [AiProvider.WEB_SEARCH]: { key: AiProvider.WEB_SEARCH, label: 'Web Search 🌐', shortLabel: 'Web Search', icon: '🌐' },
};

const MODEL_SWITCH_ALIASES = {
  [AiProvider.CLAUDE]:     [AiProvider.CLAUDE],
  [AiProvider.CHATGPT]:    [AiProvider.CHATGPT, 'gpt', AiProvider.OPENAI],
  [AiProvider.GEMINI]:     [AiProvider.GEMINI],
  [AiProvider.DEEPSEEK]:   [AiProvider.DEEPSEEK],
  [AiProvider.VLLM]:       [AiProvider.VLLM],
  [AiProvider.KIMI]:       [AiProvider.KIMI],
  [AiProvider.OLLAMA]:     [AiProvider.OLLAMA],
  [AiProvider.NVIDIA]:     [AiProvider.NVIDIA, 'nim'],
  [AiProvider.CLOUDFLARE]: [AiProvider.CLOUDFLARE, 'cf', 'workers-ai'],
};

function getProviderMeta(providerKey) {
  return PROVIDER_META[providerKey] || { key: providerKey, label: providerKey, shortLabel: providerKey, icon: '🤖' };
}

function getProviderOrder() {
  return [...PROVIDER_ORDER];
}

function getProviderLabels() {
  return PROVIDER_ORDER.map((key) => getProviderMeta(key));
}

function getFallbackVersion(providerKey, configRepo, env = process.env) {
  switch (providerKey) {
    case AiProvider.GEMINI:
      return configRepo.get('gemini_model') || 'models/gemini-2.5-flash';
    case AiProvider.CLAUDE:
      return configRepo.get('claude_model') || 'claude-sonnet-4-6';
    case AiProvider.CHATGPT:
    case AiProvider.OPENAI:
      return configRepo.get('chatgpt_model') || 'gpt-4o';
    case AiProvider.DEEPSEEK:
      return env.DEEPSEEK_MODEL || 'deepseek-v4-flash';
    case AiProvider.VLLM:
      return env.VLLM_MODEL || 'llama3.1';
    case AiProvider.KIMI:
      return env.KIMI_MODEL || 'kimi-k2.6';
    case AiProvider.OLLAMA:
      return env.OLLAMA_MODEL || 'llama3.1';
    case AiProvider.NVIDIA:
      return env.NVIDIA_MODEL || 'meta/llama-3.2-11b-vision-instruct';
    case AiProvider.CLOUDFLARE:
      return env.CLOUDFLARE_MODEL || '@cf/meta/llama-3.1-8b-instruct';
    default:
      return providerKey;
  }
}

function getAliasMap() {
  return MODEL_SWITCH_ALIASES;
}

module.exports = {
  PROVIDER_ORDER,
  PROVIDER_META,
  MODEL_SWITCH_ALIASES,
  getProviderMeta,
  getProviderOrder,
  getProviderLabels,
  getFallbackVersion,
  getAliasMap,
};
