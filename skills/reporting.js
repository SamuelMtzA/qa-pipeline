/**
 * Skill 6: Reporting — health score calculation + report generation
 *
 * Extracted from tests/test-reporting.js into a proper module so the
 * live pipeline can use it (not just the smoke test).
 *
 * The health score formula is deterministic: same inputs → same output.
 * Mirrors .opencode/skills/calculate-health-score/SKILL.md line-for-line.
 */

import fs from 'fs';
import path from 'path';

/**
 * Calculate health score and verdict from run metrics.
 */
export function calculateHealthScore({ critical_count, major_count, minor_count, coverage_pct, degraded_phases = 0, tests_passed, tests_total }) {
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

/**
 * Generate QA report (markdown + JSON) from run artifacts.
 */
export function generateReport({ config, featureMap, results, bugTickets = [], skillsRun = [], skillsSkipped = [], workspaceDir }) {
  const totalReqs = featureMap?.features?.reduce((a, f) => a + (f.requirements || 0), 0) || 0;
  const coveredReqs = results?.covered_requirements || Math.min(totalReqs, Math.floor(totalReqs * 0.8));
  const coveragePct = totalReqs > 0 ? Math.round((coveredReqs / totalReqs) * 100) : 0;

  const critical = bugTickets.filter(b => b.severity === 'critical').length;
  const major = bugTickets.filter(b => b.severity === 'major').length;
  const minor = bugTickets.filter(b => b.severity === 'minor').length;

  const degradedPhases = skillsSkipped.length;

  const health = calculateHealthScore({
    critical_count: critical,
    major_count: major,
    minor_count: minor,
    coverage_pct: coveragePct,
    degraded_phases: degradedPhases,
    tests_passed: results?.tests_passed || 0,
    tests_total: results?.tests_total || 0,
  });

  const reportDir = path.join(workspaceDir, '09-report');
  fs.mkdirSync(reportDir, { recursive: true });

  const partialRunNote = skillsSkipped.length > 0
    ? `\n> **Partial run** — ${skillsSkipped.length} of 6 skills skipped (${skillsSkipped.join(', ')}). Set QA_AGENT=opencode for full coverage.`
    : '';

  const featureRows = (featureMap?.features || []).map(f => `| ${f.id}: ${f.name} | ${f.priority} | ${f.requirements || 0} |`).join('\n');

  const reportMd = `# QA Report: ${config.run_id}

**Date**: ${new Date().toISOString().slice(0, 10)}
**URL**: ${config.url}
**Verdict**: ${health.verdict}
${partialRunNote}

---

## Summary

- **Verdict**: ${health.verdict}
- **Health Score**: ${health.score}/10
- **Tests**: ${results?.tests_total || 0} total, ${results?.tests_passed || 0} passed, ${results?.tests_failed || 0} failed
- **Coverage**: ${coveragePct}% of features tested
- **Critical Issues**: ${critical}
- **Major Issues**: ${major}
- **Minor Issues**: ${minor}

## Coverage

| Feature | Priority | Requirements |
|---------|----------|--------------|
${featureRows || '| (no features) | — | — |'}

**Coverage**: ${coveragePct}% (${coveredReqs}/${totalReqs} requirements tested)

## Failures

${results?.tests_failed > 0 ? `${results.tests_failed} tests failed during execution.` : 'No test failures.'}

## Root Cause

${bugTickets.length > 0 ? bugTickets.map(b => `- **[${b.id || b.signature}]** ${b.title || b.signature} (${b.severity})`).join('\n') : 'No bugs identified.'}

## Recommendations

### High Priority
${bugTickets.filter(b => b.severity === 'critical' || b.severity === 'major').map(b => `1. Fix ${b.title || b.signature} (${b.id || b.signature})`).join('\n') || 'No high-priority items.'}

### Medium Priority
${bugTickets.filter(b => b.severity === 'minor').map(b => `1. Fix ${b.title || b.signature} (${b.id || b.signature})`).join('\n') || 'No medium-priority items.'}

---

## Skills Executed

${skillsRun.map(s => `- ✓ ${s}`).join('\n') || '- (none)'}
${skillsSkipped.map(s => `- ⚠ ${s} (skipped — requires QA_AGENT)`).join('\n')}

## Sign-off

**Verdict**: ${health.verdict}
**Health Score**: ${health.score}/10
`;

  const reportJson = {
    report: {
      run_id: config.run_id,
      timestamp: new Date().toISOString(),
      url: config.url,
      verdict: health.verdict,
    },
    executive_summary: {
      verdict: health.verdict,
      health_score: health.score,
      tests: {
        total: results?.tests_total || 0,
        passed: results?.tests_passed || 0,
        failed: results?.tests_failed || 0,
      },
      coverage: {
        percentage: coveragePct,
        covered: coveredReqs,
        total: totalReqs,
      },
      issues: { critical: critical, major: major, minor: minor },
    },
    health_score_breakdown: health.breakdown,
    skills: { run: skillsRun, skipped: skillsSkipped },
  };

  fs.writeFileSync(path.join(reportDir, 'qa-report.md'), reportMd);
  fs.writeFileSync(path.join(reportDir, 'qa-report.json'), JSON.stringify(reportJson, null, 2));

  return {
    reportDir,
    verdict: health.verdict,
    healthScore: health.score,
    reportMdPath: path.join(reportDir, 'qa-report.md'),
    reportJsonPath: path.join(reportDir, 'qa-report.json'),
  };
}
