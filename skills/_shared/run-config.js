/**
 * Run Configuration — 00-config.json schema + blast_radius enforcement
 *
 * Converts the documented "blast-radius declarations" safety claim
 * into enforced code. The orchestrator validates every run config
 * against this schema before any skill executes.
 */

import fs from 'fs';
import path from 'path';

const ALLOWED_ACTIONS = [
  'read',        // navigate to pages, observe DOM, take screenshots
  'navigate',    // follow links, change URLs
  'click',       // click non-mutating buttons (tabs, accordions, filters)
  'submit',      // submit forms (login, search, contact)
  'delete',      // click delete/remove buttons
  'purchase',    // complete checkout/payment flows
];

export const DEFAULT_BLAST_RADIUS = {
  allowed_actions: ['read', 'navigate'],
  forbidden_routes: [],
  max_depth: 5,
  artifacts_to_capture: ['dom', 'screenshot', 'console', 'network'],
};

export const DEFAULT_CONFIG = {
  run_id: null,
  timestamp: null,
  url: null,
  prd_path: null,
  credentials: { env_var_refs: [], inline: 'never' },
  blast_radius: { ...DEFAULT_BLAST_RADIUS },
};

/**
 * Create a run config from options.
 */
export function createConfig({ run_id, url, prd_path = null, credentials = null, blast_radius = null }) {
  const config = {
    run_id,
    timestamp: new Date().toISOString(),
    url,
    prd_path,
    credentials: credentials || { env_var_refs: [], inline: 'never' },
    blast_radius: blast_radius || { ...DEFAULT_BLAST_RADIUS },
  };
  return validateConfig(config);
}

/**
 * Validate a config object against the schema.
 * Throws on invalid config so the orchestrator fails fast.
 */
export function validateConfig(config) {
  const errors = [];

  if (!config.run_id || typeof config.run_id !== 'string') {
    errors.push('run_id must be a non-empty string');
  }
  if (!config.timestamp || typeof config.timestamp !== 'string') {
    errors.push('timestamp must be a string');
  }
  if (!config.url || typeof config.url !== 'string') {
    errors.push('url must be a non-empty string');
  }

  const br = config.blast_radius;
  if (!br || typeof br !== 'object') {
    errors.push('blast_radius is required (safety enforcement)');
  } else {
    if (!Array.isArray(br.allowed_actions) || br.allowed_actions.length === 0) {
      errors.push('blast_radius.allowed_actions must be a non-empty array');
    } else {
      const invalid = br.allowed_actions.filter(a => !ALLOWED_ACTIONS.includes(a));
      if (invalid.length > 0) {
        errors.push(`blast_radius.allowed_actions contains invalid values: ${invalid.join(', ')}. Valid: ${ALLOWED_ACTIONS.join(', ')}`);
      }
    }
    if (!Array.isArray(br.forbidden_routes)) {
      errors.push('blast_radius.forbidden_routes must be an array');
    }
    if (typeof br.max_depth !== 'number' || br.max_depth < 1) {
      errors.push('blast_radius.max_depth must be a positive number');
    }
    if (!Array.isArray(br.artifacts_to_capture) || br.artifacts_to_capture.length === 0) {
      errors.push('blast_radius.artifacts_to_capture must be a non-empty array');
    }
  }

  if (config.credentials && config.credentials.inline !== 'never') {
    errors.push('credentials.inline must be "never" — use env_var_refs');
  }

  if (errors.length > 0) {
    const msg = 'Run config validation failed:\n  ' + errors.map(e => `- ${e}`).join('\n');
    throw new Error(msg);
  }

  return config;
}

/**
 * Check whether an action is allowed by the blast_radius.
 */
export function isActionAllowed(config, action) {
  return config.blast_radius.allowed_actions.includes(action);
}

/**
 * Check whether a route is forbidden by the blast_radius.
 */
export function isRouteForbidden(config, route) {
  return config.blast_radius.forbidden_routes.some(pattern => {
    if (pattern.startsWith('*') && pattern.endsWith('*')) return route.includes(pattern.slice(1, -1));
    if (pattern.endsWith('/*')) {
      const base = pattern.slice(0, -2);
      return route === base || route.startsWith(base + '/');
    }
    if (pattern.endsWith('*')) return route.startsWith(pattern.slice(0, -1));
    if (pattern.startsWith('*')) return route.endsWith(pattern.slice(1));
    return route === pattern;
  });
}

/**
 * Write 00-config.json to a workspace directory.
 */
export function writeConfig(workspaceDir, config) {
  const validated = validateConfig(config);
  const configPath = path.join(workspaceDir, '00-config.json');
  fs.writeFileSync(configPath, JSON.stringify(validated, null, 2));
  return configPath;
}

/**
 * Load and validate 00-config.json from a workspace directory.
 */
export function loadConfig(workspaceDir) {
  const configPath = path.join(workspaceDir, '00-config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error(`No 00-config.json found in ${workspaceDir}`);
  }
  const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  return validateConfig(raw);
}

export { ALLOWED_ACTIONS };
