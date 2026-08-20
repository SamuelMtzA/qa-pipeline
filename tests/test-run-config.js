#!/usr/bin/env node

/**
 * Test for run-config.js — validates blast_radius schema enforcement
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  createConfig, validateConfig, writeConfig, loadConfig,
  isActionAllowed, isRouteForbidden,
  DEFAULT_BLAST_RADIUS, ALLOWED_ACTIONS,
} from '../skills/_shared/run-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let passed = 0, failed = 0;

function test(name, condition) {
  if (condition) { console.log(`✓ ${name}`); passed++; }
  else { console.error(`✗ ${name}`); failed++; }
}

function section(title) { console.log(`\n── ${title} ──`); }

// ─── Step 1: createConfig produces valid config ──────────────────

section('Step 1: createConfig');

const config = createConfig({
  run_id: 'test-001',
  url: 'https://example.com',
});

test('config has run_id', config.run_id === 'test-001');
test('config has url', config.url === 'https://example.com');
test('config has timestamp', typeof config.timestamp === 'string');
test('config has blast_radius', config.blast_radius !== undefined);
test('default blast_radius is read-only', config.blast_radius.allowed_actions.includes('read') && config.blast_radius.allowed_actions.includes('navigate'));
test('default blast_radius does not include click', !config.blast_radius.allowed_actions.includes('click'));
test('default blast_radius does not include submit', !config.blast_radius.allowed_actions.includes('submit'));
test('default blast_radius does not include delete', !config.blast_radius.allowed_actions.includes('delete'));
test('default blast_radius has max_depth', config.blast_radius.max_depth === 5);
test('default blast_radius has artifacts_to_capture', config.blast_radius.artifacts_to_capture.length > 0);
test('credentials.inline is never', config.credentials.inline === 'never');

// ─── Step 2: validateConfig rejects invalid configs ──────────────

section('Step 2: validateConfig rejections');

test('rejects missing run_id', (() => { try { validateConfig({ url: 'x', timestamp: 'x', blast_radius: DEFAULT_BLAST_RADIUS }); return false; } catch { return true; } })());
test('rejects missing url', (() => { try { validateConfig({ run_id: 'x', timestamp: 'x', blast_radius: DEFAULT_BLAST_RADIUS }); return false; } catch { return true; } })());
test('rejects missing blast_radius', (() => { try { validateConfig({ run_id: 'x', url: 'x', timestamp: 'x' }); return false; } catch { return true; } })());
test('rejects empty allowed_actions', (() => { try { validateConfig({ run_id: 'x', url: 'x', timestamp: 'x', blast_radius: { allowed_actions: [], forbidden_routes: [], max_depth: 5, artifacts_to_capture: ['dom'] } }); return false; } catch { return true; } })());
test('rejects invalid action name', (() => { try { validateConfig({ run_id: 'x', url: 'x', timestamp: 'x', blast_radius: { allowed_actions: ['hack'], forbidden_routes: [], max_depth: 5, artifacts_to_capture: ['dom'] } }); return false; } catch { return true; } })());
test('rejects inline credentials', (() => { try { validateConfig({ run_id: 'x', url: 'x', timestamp: 'x', credentials: { inline: 'password123' }, blast_radius: DEFAULT_BLAST_RADIUS }); return false; } catch { return true; } })());
test('rejects max_depth < 1', (() => { try { validateConfig({ run_id: 'x', url: 'x', timestamp: 'x', blast_radius: { allowed_actions: ['read'], forbidden_routes: [], max_depth: 0, artifacts_to_capture: ['dom'] } }); return false; } catch { return true; } })());

// ─── Step 3: isActionAllowed ─────────────────────────────────────

section('Step 3: isActionAllowed');

const readOnlyConfig = createConfig({ run_id: 't1', url: 'https://x.com' });
test('read is allowed by default', isActionAllowed(readOnlyConfig, 'read') === true);
test('navigate is allowed by default', isActionAllowed(readOnlyConfig, 'navigate') === true);
test('click is NOT allowed by default', isActionAllowed(readOnlyConfig, 'click') === false);
test('delete is NOT allowed by default', isActionAllowed(readOnlyConfig, 'delete') === false);

const fullConfig = createConfig({
  run_id: 't2', url: 'https://x.com',
  blast_radius: { allowed_actions: ALLOWED_ACTIONS, forbidden_routes: [], max_depth: 10, artifacts_to_capture: ['dom', 'screenshot'] },
});
test('all actions allowed in full mode', isActionAllowed(fullConfig, 'delete') === true && isActionAllowed(fullConfig, 'purchase') === true);

// ─── Step 4: isRouteForbidden ────────────────────────────────────

section('Step 4: isRouteForbidden');

const configWithForbidden = createConfig({
  run_id: 't3', url: 'https://x.com',
  blast_radius: { allowed_actions: ['read', 'navigate'], forbidden_routes: ['/admin/*', '/api/*'], max_depth: 3, artifacts_to_capture: ['dom'] },
});
test('/admin is forbidden', isRouteForbidden(configWithForbidden, '/admin') === true);
test('/admin/users is forbidden (wildcard)', isRouteForbidden(configWithForbidden, '/admin/users') === true);
test('/api/data is forbidden (wildcard)', isRouteForbidden(configWithForbidden, '/api/data') === true);
test('/home is NOT forbidden', isRouteForbidden(configWithForbidden, '/home') === false);

// ─── Step 5: writeConfig + loadConfig round-trip ─────────────────

section('Step 5: writeConfig + loadConfig');

const tmpDir = path.join(__dirname, '..', '.qa-workspace', 'test-config-' + Date.now());
fs.mkdirSync(tmpDir, { recursive: true });
const writtenPath = writeConfig(tmpDir, config);
test('config file written', fs.existsSync(writtenPath));
test('config file is valid JSON', (() => { try { JSON.parse(fs.readFileSync(writtenPath, 'utf-8')); return true; } catch { return false; } })());

const loaded = loadConfig(tmpDir);
test('loaded config matches run_id', loaded.run_id === config.run_id);
test('loaded config matches url', loaded.url === config.url);
test('loaded config has blast_radius', loaded.blast_radius.allowed_actions.includes('read'));

fs.rmSync(tmpDir, { recursive: true, force: true });

// ─── Step 6: ALLOWED_ACTIONS list ────────────────────────────────

section('Step 6: ALLOWED_ACTIONS');

test('ALLOWED_ACTIONS has 6 entries', ALLOWED_ACTIONS.length === 6);
test('ALLOWED_ACTIONS includes read', ALLOWED_ACTIONS.includes('read'));
test('ALLOWED_ACTIONS includes purchase', ALLOWED_ACTIONS.includes('purchase'));

// ─── Summary ─────────────────────────────────────────────────────

console.log('');
console.log(`Tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
