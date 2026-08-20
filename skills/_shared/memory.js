/**
 * Memory System — cross-run persistent knowledge with decay policy
 *
 * Converts the documented "compound improvement over runs" claim
 * into real code. Memory files are read before each run and updated
 * after, with confidence scores that decay between verifications.
 *
 * Decay policy (from memory/README.md):
 *   1.0 = verified this run
 *   0.9 = verified last run
 *   0.7 = verified within 3 runs
 *   0.5 = stale threshold (flagged for review)
 *   0.3 = archived (not used as primary)
 *   0.0 = pruned (removed from active memory)
 */

import fs from 'fs';
import path from 'path';

const DECAY_PER_RUN = 0.1;
const STALE_THRESHOLD = 0.5;
const PRUNE_THRESHOLD = 0.0;
const VERIFIED_CONFIDENCE = 1.0;

const MEMORY_FILES = [
  'project-profile.json',
  'selectors.json',
  'auth-flows.json',
  'components.json',
  'fixtures.json',
  'bug-history.json',
  'urls.json',
  'environment.json',
  'coding-standards.json',
  'test-registry.json',
  'run-history.json',
];

/**
 * Load all memory files from a directory.
 * Returns an object keyed by filename (without .json).
 */
export function loadAll(memoryDir) {
  const memory = {};
  for (const file of MEMORY_FILES) {
    const filePath = path.join(memoryDir, file);
    if (fs.existsSync(filePath)) {
      try {
        memory[file.replace('.json', '')] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } catch {
        memory[file.replace('.json', '')] = null;
      }
    } else {
      memory[file.replace('.json', '')] = null;
    }
  }
  return memory;
}

/**
 * Load a single memory file.
 */
export function load(memoryDir, name) {
  const filePath = path.join(memoryDir, `${name}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

/**
 * Save a single memory file.
 */
export function save(memoryDir, name, data) {
  const filePath = path.join(memoryDir, `${name}.json`);
  fs.mkdirSync(memoryDir, { recursive: true });
  data.last_updated = new Date().toISOString();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  return filePath;
}

/**
 * Record a selector as verified (confidence = 1.0) or decay it.
 */
export function recordSelector(memoryData, page, selectorName, selector, verified) {
  if (!memoryData.selectors) memoryData.selectors = { version: 1, pages: {}, global_patterns: {}, anti_patterns: [] };
  if (!memoryData.selectors.pages[page]) {
    memoryData.selectors.pages[page] = { last_verified: null, elements: {} };
  }
  const pageData = memoryData.selectors.pages[page];
  if (!pageData.elements[selectorName]) {
    pageData.elements[selectorName] = {
      preferred_selector: selector,
      fallback_selectors: [],
      verified_count: 0,
      confidence: 0.0,
    };
  }
  const el = pageData.elements[selectorName];
  if (verified) {
    el.confidence = VERIFIED_CONFIDENCE;
    el.verified_count += 1;
    el.preferred_selector = selector;
    pageData.last_verified = new Date().toISOString();
  } else {
    el.confidence = Math.max(PRUNE_THRESHOLD, parseFloat((el.confidence - DECAY_PER_RUN).toFixed(2)));
  }
  return el;
}

/**
 * Get the confidence score for a selector on a page.
 */
export function getConfidence(memoryData, page, selectorName) {
  const pageData = memoryData.selectors?.pages?.[page];
  if (!pageData) return 0.0;
  return pageData.elements?.[selectorName]?.confidence ?? 0.0;
}

/**
 * Record a bug in bug-history.
 */
export function recordBug(memoryData, signature, severity, details = {}) {
  if (!memoryData['bug-history']) {
    memoryData['bug-history'] = { version: 1, last_updated: null, bugs: [], hotspots: [] };
  }
  const history = memoryData['bug-history'];
  const existing = history.bugs.find(b => b.signature === signature);
  if (existing) {
    existing.occurrences = (existing.occurrences || 1) + 1;
    existing.last_seen = new Date().toISOString();
    existing.confidence = Math.min(1.0, existing.confidence + 0.1);
  } else {
    history.bugs.push({
      signature,
      severity,
      first_seen: new Date().toISOString(),
      last_seen: new Date().toISOString(),
      occurrences: 1,
      confidence: 0.5,
      details,
    });
  }
  return history;
}

/**
 * Record a run in run-history.
 */
export function recordRun(memoryData, runId, url, verdict, healthScore, skillsRun, skillsSkipped) {
  if (!memoryData['run-history']) {
    memoryData['run-history'] = { version: 1, last_updated: null, runs: [] };
  }
  memoryData['run-history'].runs.push({
    run_id: runId,
    timestamp: new Date().toISOString(),
    url,
    verdict,
    health_score: healthScore,
    skills_run: skillsRun,
    skills_skipped: skillsSkipped,
  });
  if (memoryData['run-history'].runs.length > 50) {
    memoryData['run-history'].runs = memoryData['run-history'].runs.slice(-50);
  }
  return memoryData['run-history'];
}

/**
 * Apply decay to all selector confidence scores.
 * Called at the start of each run to age unverified entries.
 */
export function decay(memoryData) {
  if (!memoryData.selectors?.pages) return;
  for (const page of Object.keys(memoryData.selectors.pages)) {
    const pageData = memoryData.selectors.pages[page];
    for (const elemName of Object.keys(pageData.elements || {})) {
      const el = pageData.elements[elemName];
      if (el.confidence < VERIFIED_CONFIDENCE) {
        el.confidence = Math.max(PRUNE_THRESHOLD, parseFloat((el.confidence - DECAY_PER_RUN).toFixed(2)));
      }
    }
  }
}

/**
 * Prune entries that have decayed to 0.0.
 */
export function prune(memoryData) {
  if (!memoryData.selectors?.pages) return;
  for (const page of Object.keys(memoryData.selectors.pages)) {
    const pageData = memoryData.selectors.pages[page];
    if (!pageData.elements) continue;
    for (const elemName of Object.keys(pageData.elements)) {
      if (pageData.elements[elemName].confidence <= PRUNE_THRESHOLD) {
        delete pageData.elements[elemName];
      }
    }
    if (Object.keys(pageData.elements || {}).length === 0) {
      delete memoryData.selectors.pages[page];
    }
  }
}

/**
 * Check if a selector is stale (below threshold).
 */
export function isStale(memoryData, page, selectorName) {
  return getConfidence(memoryData, page, selectorName) < STALE_THRESHOLD;
}

/**
 * Save all non-null memory entries to disk.
 */
export function saveAll(memoryDir, memoryData) {
  for (const name of Object.keys(memoryData)) {
    if (memoryData[name] !== null) {
      save(memoryDir, name, memoryData[name]);
    }
  }
}

export {
  DECAY_PER_RUN,
  STALE_THRESHOLD,
  PRUNE_THRESHOLD,
  VERIFIED_CONFIDENCE,
  MEMORY_FILES,
};
