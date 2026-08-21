#!/usr/bin/env node

/**
 * Test for memory.js — validates load/save/decay/prune cycle
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  loadAll, load, save, saveAll,
  recordSelector, getConfidence, recordBug, recordRun,
  decay, prune, isStale,
  DECAY_PER_RUN, STALE_THRESHOLD, VERIFIED_CONFIDENCE,
} from '../skills/_shared/memory.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let passed = 0, failed = 0;

function test(name, condition) {
  if (condition) { console.log(`✓ ${name}`); passed++; }
  else { console.error(`✗ ${name}`); failed++; }
}

function section(title) { console.log(`\n── ${title} ──`); }

const tmpMemoryDir = path.join(__dirname, '..', '.qa-workspace', 'test-memory-' + Date.now());
fs.mkdirSync(tmpMemoryDir, { recursive: true });

// ─── Step 1: loadAll on empty dir ────────────────────────────────

section('Step 1: loadAll on empty dir');

const emptyMemory = loadAll(tmpMemoryDir);
test('loadAll returns object', typeof emptyMemory === 'object');
test('loadAll returns null for missing files', emptyMemory.selectors === null);
test('loadAll has all expected keys', ['selectors', 'bug-history', 'run-history', 'project-profile'].every(k => k in emptyMemory));

// ─── Step 2: save + load round-trip ──────────────────────────────

section('Step 2: save + load round-trip');

save(tmpMemoryDir, 'selectors', { version: 1, pages: {}, global_patterns: {}, anti_patterns: [] });
const loaded = load(tmpMemoryDir, 'selectors');
test('saved file can be loaded', loaded !== null);
test('loaded file has version', loaded.version === 1);
test('saved file has last_updated', typeof loaded.last_updated === 'string');

// ─── Step 3: recordSelector ──────────────────────────────────────

section('Step 3: recordSelector');

const memoryData = { selectors: { version: 1, pages: {}, global_patterns: {}, anti_patterns: [] } };

recordSelector(memoryData, '/login', 'email_input', "getByLabel('Email')", true);
test('selector recorded with confidence 1.0', getConfidence(memoryData, '/login', 'email_input') === 1.0);
test('selector has verified_count 1', memoryData.selectors.pages['/login'].elements.email_input.verified_count === 1);
test('page has last_verified set', memoryData.selectors.pages['/login'].last_verified !== null);

recordSelector(memoryData, '/login', 'email_input', "getByLabel('Email')", true);
test('re-verified selector has count 2', memoryData.selectors.pages['/login'].elements.email_input.verified_count === 2);

// ─── Step 4: decay ───────────────────────────────────────────────

section('Step 4: decay');

recordSelector(memoryData, '/search', 'search_box', "getByRole('searchbox')", true);
test('fresh selector has confidence 1.0', getConfidence(memoryData, '/search', 'search_box') === 1.0);

decay(memoryData);
test('verified selector stays at 1.0 after decay', getConfidence(memoryData, '/login', 'email_input') === 1.0);

memoryData.selectors.pages['/login'].elements.email_input.confidence = 0.8;
decay(memoryData);
test('unverified selector decays by 0.1', getConfidence(memoryData, '/login', 'email_input') === 0.7);

// ─── Step 5: isStale ─────────────────────────────────────────────

section('Step 5: isStale');

test('confidence 0.7 is not stale', isStale(memoryData, '/login', 'email_input') === false);

memoryData.selectors.pages['/login'].elements.email_input.confidence = 0.4;
test('confidence 0.4 is stale', isStale(memoryData, '/login', 'email_input') === true);

// ─── Step 6: prune ───────────────────────────────────────────────

section('Step 6: prune');

memoryData.selectors.pages['/login'].elements.email_input.confidence = 0.0;
prune(memoryData);
test('pruned selector is removed', !('email_input' in (memoryData.selectors.pages['/login']?.elements || {})));
test('empty page is pruned', !('/login' in memoryData.selectors.pages));

// ─── Step 7: recordBug ───────────────────────────────────────────

section('Step 7: recordBug');

const bugMemory = {};
recordBug(bugMemory, 'toast-dismiss-too-fast', 'major', { page: '/checkout' });
test('bug recorded', bugMemory['bug-history'].bugs.length === 1);
test('bug has occurrences 1', bugMemory['bug-history'].bugs[0].occurrences === 1);
test('bug has confidence 0.5', bugMemory['bug-history'].bugs[0].confidence === 0.5);

recordBug(bugMemory, 'toast-dismiss-too-fast', 'major');
test('re-reported bug has occurrences 2', bugMemory['bug-history'].bugs[0].occurrences === 2);
test('re-reported bug confidence increased', bugMemory['bug-history'].bugs[0].confidence > 0.5);

// ─── Step 8: recordRun ───────────────────────────────────────────

section('Step 8: recordRun');

const runMemory = {};
recordRun(runMemory, 'run-001', 'https://example.com', 'SHIP WITH FIXES', 8.75, ['Skill 1', 'Skill 3'], ['Skill 2']);
test('run recorded', runMemory['run-history'].runs.length === 1);
test('run has verdict', runMemory['run-history'].runs[0].verdict === 'SHIP WITH FIXES');
test('run has health_score', runMemory['run-history'].runs[0].health_score === 8.75);

for (let i = 0; i < 55; i++) {
  recordRun(runMemory, `run-${i}`, 'https://example.com', 'SHIP', 10.0, [], []);
}
test('run-history capped at 50', runMemory['run-history'].runs.length === 50);

// ─── Step 9: saveAll ─────────────────────────────────────────────

section('Step 9: saveAll');

const allData = {
  selectors: { version: 1, pages: { '/test': { last_verified: '2026-01-01', elements: { btn: { preferred_selector: "getByRole('button')", fallback_selectors: [], verified_count: 1, confidence: 1.0 } } } }, global_patterns: {}, anti_patterns: [] },
  'bug-history': { version: 1, bugs: [], hotspots: [] },
  'run-history': { version: 1, runs: [] },
};

saveAll(tmpMemoryDir, allData);
test('selectors.json saved', fs.existsSync(path.join(tmpMemoryDir, 'selectors.json')));
test('bug-history.json saved', fs.existsSync(path.join(tmpMemoryDir, 'bug-history.json')));
test('run-history.json saved', fs.existsSync(path.join(tmpMemoryDir, 'run-history.json')));

const reloaded = loadAll(tmpMemoryDir);
test('reloaded selectors has page', reloaded.selectors.pages['/test'] !== undefined);
test('reloaded bug-history has bugs array', Array.isArray(reloaded['bug-history'].bugs));

// ─── Step 10: Constants ──────────────────────────────────────────

section('Step 10: Constants');

test('DECAY_PER_RUN is 0.1', DECAY_PER_RUN === 0.1);
test('STALE_THRESHOLD is 0.5', STALE_THRESHOLD === 0.5);
test('VERIFIED_CONFIDENCE is 1.0', VERIFIED_CONFIDENCE === 1.0);

// ─── Cleanup ─────────────────────────────────────────────────────

fs.rmSync(tmpMemoryDir, { recursive: true, force: true });

// ─── Summary ─────────────────────────────────────────────────────

console.log('');
console.log(`Tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
