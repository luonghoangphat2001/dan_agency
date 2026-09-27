'use strict';

/**
 * List of monitored autonomous OpenClaw agents.
 */
const MONITORED_AGENTS = [
  'dan_rnd',
  'dan_logistics',
  'dan_cfo',
  'dan_ops',
  'dan_cskh',
];

/**
 * Schema definitions for OpenClaw orchestrator integration and per-agent routing.
 */
const AGENT_CONFIG_SCHEMA = [
  {
    key: 'openclaw_enabled',
    type: 'string',
    category: 'agent_integration',
  },
  {
    key: 'openclaw_url',
    type: 'string',
    category: 'agent_integration',
    envFallbacks: [
      'OPENCLAW_URL',
      'OPENCLAW_BASE_URL',
    ],
  },
  {
    key: 'google_cx',
    type: 'string',
    category: 'agent_integration',
  },
];

/**
 * UI schema and metadata for monitored OpenClaw agents.
 */
const AGENTS_METADATA = [
  { key: 'dan_rnd', label: 'R&D' },
  { key: 'dan_logistics', label: 'Logistics' },
  { key: 'dan_cfo', label: 'CFO' },
  { key: 'dan_ops', label: 'Operations' },
  { key: 'dan_cskh', label: 'CSKH' },
];

module.exports = {
  MONITORED_AGENTS,
  AGENT_CONFIG_SCHEMA,
  AGENTS_METADATA,
};
