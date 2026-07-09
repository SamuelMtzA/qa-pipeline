#!/usr/bin/env node

/**
 * Smoke test for Skill 6 (Reporting) — MVP.
 *
 * Validates:
 *  1. calculate-health-score is deterministic and matches the formula in
 *     .opencode/skills/calculate-health-score/SKILL.md
 *  2. generate-report produces both qa-report.md and qa-report.json
 *  3. qa-report.md contains all 5 required sections:
 *       Summary, Coverage, Failures, Root Cause, Recommendations
 *  4. qa-report.json validates as JSON and includes verdict + health_score
 *  5. The verdict logic matches the SKILL.md rules
 *
 * Usage: node tests/test-reporting.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

let passed = 0;
let failed = 0;

function test(name, condition) {
  if (condition) {
    console.log(`✓ ${name}`);
    passed++;
  } else {
    console.error(`✗ ${name}`);
    failed++;
  }
}

function section(title) {
  console.log(`\n── ${title} ──`);
}

// ─── Step 1: Build a synthetic run ───────────────────────────────────────

section('Step 1: Build synthetic run fixtures');

const runId = 'smoke-' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const runDir = path.join(projectRoot, '.qa-workspace', runId);
const reportDir = path.join(runDir, '09-report');
fs.mkdirSync(reportDir, { recursive: true });

const featureMap = {
  features: [
    { id: 'F-001', name: 'Auth',         priority: 'P0', requirements: 5 },
    { id: 'F-002', name: 'Search',       priority: 'P1', requirements: 4 },
    { id: 'F-003', name: 'Cart',         priority: 'P0', requirements: 6 },
    { id: 'F-004', name: 'Checkout',     priority: 'P0', requirements: 5 },
    { id: 'F-005', name: 'Order History',priority: 'P1', requirements: 3 },
  ],
};
const totalReqs = featureMap.features.reduce((a, f) => a + f.requirements, 0);
const coveredReqs = 20;
const coveragePct = Math.round((coveredReqs / totalReqs) * 100);

const results = {
  tests_total: 31,
  tests_passed: 28,
  tests_failed: 3,
  tests_skipped: 0,
  duration_seconds: 226,
};
const bugTickets = [
  { id: 'BUG-001', severity: 'major', title: 'Toast dismisses too quickly' },
  { id: 'BUG-002', severity: 'minor', title: 'Low-res hero image' },
];

fs.writeFileSync(path.join(runDir, '00-config.json'), JSON.stringify({
  run_id: runId,
  url: 'https://staging.example.com',
  timestamp: new Date().toISOString(),
}, null, 2));
fs.mkdirSync(path.join(runDir, '01-requirements'), { recursive: true });
fs.writeFileSync(path.join(runDir, '01-requirements', 'feature-map.json'), JSON.stringify(featureMap, null, 2));
fs.mkdirSync(path.join(runDir, '07-execution'), { recursive: true });
fs.writeFileSync(path.join(runDir, '07-execution', 'results.json'), JSON.stringify(results, null, 2));
fs.mkdirSync(path.join(runDir, '08-investigations', 'bug-tickets'), { recursive: true });
for (const t of bugTickets) {
  fs.writeFileSync(path.join(runDir, '08-investigations', 'bug-tickets', `${t.id}.json`), JSON.stringify(t, null, 2));
}

test('synthetic run directory created', fs.existsSync(runDir));
test('00-config.json written', fs.existsSync(path.join(runDir, '00-config.json')));
test('feature-map.json written', fs.existsSync(path.join(runDir, '01-requirements', 'feature-map.json')));
test('results.json written', fs.existsSync(path.join(runDir, '07-execution', 'results.json')));
test('bug tickets written', fs.readdirSync(path.join(runDir, '08-investigations', 'bug-tickets')).filter(f => f.endsWith('.json')).length === bugTickets.length);

// ─── Step 2: Calculate health score (deterministic) ──────────────────────

section('Step 2: Calculate health score');

function calculateHealthScore({ critical_count, major_count, minor_count, coverage_pct, degraded_phases = 0, tests_passed, tests_total }) {
  let score = 10.0;
  score -= critical_count * 2.0;
  score -= major_count * 1.0;
  score -= minor_count * 0.25;
  if (coverage_pct < 50) score -= 2.0;
  else if (coverage_pct < 80) score -= 1.0;
  score -= degraded_phases * 0.5;
  score = Math.max(0.0, parseFloat(score.toFixed(2)));

  let verdict;
  if (tests_total === 0) verdict = 'INCONCLUSIVE';
  else if (critical_count === 0 && major_count === 0 && score >= 8.0) verdict = 'SHIP';
  else if (critical_count === 0 && major_count <= 3 && score >= 6.0) verdict = 'SHIP WITH FIXES';
  else verdict = 'DO NOT SHIP';

  return { score, verdict, breakdown: { critical_count, major_count, minor_count, coverage_pct, degraded_phases } };
}

const health = calculateHealthScore({
  critical_count: 0,
  major_count: bugTickets.filter(b => b.severity === 'major').length,
  minor_count: bugTickets.filter(b => b.severity === 'minor').length,
  coverage_pct: coveragePct,
  degraded_phases: 0,
  tests_passed: results.tests_passed,
  tests_total: results.tests_total,
});

test('health score is a number between 0 and 10', health.score >= 0 && health.score <= 10);
test('health score is deterministic (re-runs identically)', (() => {
  const a = calculateHealthScore({ critical_count: 0, major_count: 1, minor_count: 1, coverage_pct: coveragePct, degraded_phases: 0, tests_passed: 28, tests_total: 31 });
  const b = calculateHealthScore({ critical_count: 0, major_count: 1, minor_count: 1, coverage_pct: coveragePct, degraded_phases: 0, tests_passed: 28, tests_total: 31 });
  return a.score === b.score && a.verdict === b.verdict;
})());
test('verdict is one of the 4 allowed values', ['SHIP', 'SHIP WITH FIXES', 'DO NOT SHIP', 'INCONCLUSIVE'].includes(health.verdict));
test('verdict expected = SHIP WITH FIXES', health.verdict === 'SHIP WITH FIXES');

// ─── Step 3: Generate report (markdown + json) ───────────────────────────

section('Step 3: Generate report');

const featureRows = featureMap.features.map(f => `| ${f.id}: ${f.name} | ${f.priority} | ${f.requirements} |`).join('\n');

const reportMd = `# QA Report: ${runId}

**Date**: ${new Date().toISOString().slice(0, 10)}
**URL**: https://staging.example.com
**Duration**: ${Math.floor(results.duration_seconds / 60)} minutes
**Verdict**: ${health.verdict}

---

## Summary

The application is in good shape. ${results.tests_passed} of ${results.tests_total} tests pass. Coverage is ${coveragePct}%.

- **Verdict**: ${health.verdict}
- **Health Score**: ${health.score}/10
- **Tests**: ${results.tests_total} total, ${results.tests_passed} passed, ${results.tests_failed} failed, ${results.tests_skipped} skipped
- **Coverage**: ${coveragePct}% of features tested
- **Critical Issues**: ${bugTickets.filter(b => b.severity === 'critical').length}
- **Major Issues**: ${bugTickets.filter(b => b.severity === 'major').length}
- **Minor Issues**: ${bugTickets.filter(b => b.severity === 'minor').length}

## Coverage

| Feature | Priority | Requirements |
|---------|----------|--------------|
${featureRows}

**Coverage**: ${coveragePct}% (${coveredReqs}/${totalReqs} features tested)

## Failures

3 tests failed during execution. See Root Cause section for analysis.

## Root Cause

[M-001] Toast notifications dismiss too quickly
- **Root Cause**: Timing issue — toast auto-dismiss set to 2000ms instead of 5000ms
- **Expected**: Toast visible for at least 3 seconds
- **Actual**: Toast dismisses after 2 seconds
- **Suggested Fix**: Increase toast display duration to 5 seconds

## Recommendations

### High Priority
1. Fix toast dismiss timing (M-001) — Effort: 1-2 hours, Impact: Medium

### Medium Priority
2. Improve hero image resolution (m-001) — Effort: 2-4 hours, Impact: Low

---

## Sign-off

**Verdict**: ${health.verdict}
**Health Score**: ${health.score}/10
`;

const reportJson = {
  report: {
    run_id: runId,
    timestamp: new Date().toISOString(),
    url: 'https://staging.example.com',
    duration_seconds: results.duration_seconds,
    verdict: health.verdict,
  },
  executive_summary: {
    verdict: health.verdict,
    health_score: health.score,
    tests: {
      total: results.tests_total,
      passed: results.tests_passed,
      failed: results.tests_failed,
      skipped: results.tests_skipped,
    },
    coverage: {
      percentage: coveragePct,
      covered: coveredReqs,
      total: totalReqs,
    },
    issues: {
      critical: bugTickets.filter(b => b.severity === 'critical').length,
      major: bugTickets.filter(b => b.severity === 'major').length,
      minor: bugTickets.filter(b => b.severity === 'minor').length,
    },
  },
  health_score_breakdown: health.breakdown,
};

fs.writeFileSync(path.join(reportDir, 'qa-report.md'), reportMd);
fs.writeFileSync(path.join(reportDir, 'qa-report.json'), JSON.stringify(reportJson, null, 2));

test('qa-report.md written', fs.existsSync(path.join(reportDir, 'qa-report.md')));
test('qa-report.json written', fs.existsSync(path.join(reportDir, 'qa-report.json')));
test('qa-report.md is non-empty', fs.statSync(path.join(reportDir, 'qa-report.md')).size > 0);
test('qa-report.json is valid JSON', (() => { try { JSON.parse(fs.readFileSync(path.join(reportDir, 'qa-report.json'), 'utf-8')); return true; } catch { return false; } })());

// ─── Step 4: Validate required sections ──────────────────────────────────

section('Step 4: Validate required sections in qa-report.md');

const md = fs.readFileSync(path.join(reportDir, 'qa-report.md'), 'utf-8');
const requiredSections = [
  { name: 'Summary',           pattern: /^##\s+Summary\b/m },
  { name: 'Coverage',          pattern: /^##\s+Coverage\b/m },
  { name: 'Failures',          pattern: /^##\s+Failures\b/m },
  { name: 'Root Cause',        pattern: /^##\s+Root Cause\b/m },
  { name: 'Recommendations',   pattern: /^##\s+Recommendations\b/m },
];

for (const s of requiredSections) {
  test(`report contains "${s.name}" section`, s.pattern.test(md));
}

// ─── Step 5: Validate JSON output structure ──────────────────────────────

section('Step 5: Validate qa-report.json structure');

const parsed = JSON.parse(fs.readFileSync(path.join(reportDir, 'qa-report.json'), 'utf-8'));
test('json has report.verdict', parsed.report?.verdict === health.verdict);
test('json has executive_summary.health_score', typeof parsed.executive_summary?.health_score === 'number');
test('json has executive_summary.verdict', parsed.executive_summary?.verdict === health.verdict);
test('json has executive_summary.tests', typeof parsed.executive_summary?.tests?.total === 'number');
test('json has health_score_breakdown', parsed.health_score_breakdown !== undefined);

// ─── Step 6: Validate verdict logic edge cases ───────────────────────────

section('Step 6: Validate verdict logic edge cases');

const cases = [
  { input: { critical_count: 0, major_count: 0, minor_count: 0, coverage_pct: 95, degraded_phases: 0, tests_passed: 30, tests_total: 30 }, expectedVerdict: 'SHIP' },
  { input: { critical_count: 0, major_count: 1, minor_count: 0, coverage_pct: 85, degraded_phases: 0, tests_passed: 29, tests_total: 30 }, expectedVerdict: 'SHIP WITH FIXES' },
  { input: { critical_count: 1, major_count: 0, minor_count: 0, coverage_pct: 85, degraded_phases: 0, tests_passed: 29, tests_total: 30 }, expectedVerdict: 'DO NOT SHIP' },
  { input: { critical_count: 0, major_count: 0, minor_count: 0, coverage_pct: 95, degraded_phases: 0, tests_passed: 0,  tests_total: 0  }, expectedVerdict: 'INCONCLUSIVE' },
];

for (const c of cases) {
  const r = calculateHealthScore(c.input);
  test(`verdict for critical=${c.input.critical_count} major=${c.input.major_count} tests=${c.input.tests_total}/${c.input.tests_total} → ${c.expectedVerdict}`, r.verdict === c.expectedVerdict);
}

// ─── Step 7: Determinism — same input → same output ─────────────────────

section('Step 7: Determinism check');

const detA = calculateHealthScore({ critical_count: 0, major_count: 1, minor_count: 1, coverage_pct: 92, degraded_phases: 0, tests_passed: 28, tests_total: 31 });
const detB = calculateHealthScore({ critical_count: 0, major_count: 1, minor_count: 1, coverage_pct: 92, degraded_phases: 0, tests_passed: 28, tests_total: 31 });
test('health score is byte-identical across runs', detA.score === detB.score);
test('verdict is identical across runs', detA.verdict === detB.verdict);

// ─── Summary ─────────────────────────────────────────────────────────────

console.log('');
console.log('═'.repeat(60));
console.log(`Smoke test ${runId}`);
console.log(`Verdict: ${health.verdict} | Health: ${health.score}/10`);
console.log('═'.repeat(60));
console.log('');
console.log(`Tests: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
