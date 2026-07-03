---
name: generate-report
description: Consolidate artifacts from multiple pipeline phases into a structured QA report with health score and verdict. Use at the end of the pipeline.
---

# Generate Report

Consolidate all phase artifacts into a final, severity-ranked QA report with a clear ship/no-ship verdict.

## Purpose

Take all artifacts from the pipeline (feature map, app map, test plan, execution results, failure bundles) and produce a consolidated QA report.

## Input

| Field | Required | Format | Description |
|-------|----------|--------|-------------|
| `run_config` | Yes | JSON | Run configuration |
| `feature_map` | No | JSON | From extract-user-stories |
| `app_map` | No | JSON | From explore-ui |
| `test_plan` | No | JSON | From generate-test-cases |
| `execution_results` | No | JSON | From run-playwright (v2) |
| `failure_bundles` | No | JSON array | From create-bug-ticket (v2) |

## Output

| Field | Format | Description |
|-------|--------|-------------|
| `report_md` | Markdown string | Full QA report |
| `report_json` | JSON | Machine-readable report |
| `verdict` | String | SHIP / SHIP WITH FIXES / DO NOT SHIP / INCONCLUSIVE |
| `health_score` | Number | 0-10 |

## Report Structure

```markdown
# QA Report: [URL] — [timestamp]

## Executive Summary
- **Verdict**: SHIP / SHIP WITH FIXES / DO NOT SHIP / INCONCLUSIVE
- **Health Score**: X/10
- **Tests**: N total, N passed, N failed, N skipped
- **Coverage**: N% of features tested
- **Critical Issues**: N
- **Major Issues**: N
- **Minor Issues**: N

[1-2 sentence summary of overall quality]

## Critical Issues
[C-1] [Issue title]
- **URL**: [affected page]
- **Feature**: [feature map reference]
- **Tests**: [affected test IDs]
- **Root Cause**: [from failure bundle]
- **Steps to Reproduce**: ...
- **Expected**: [what should happen]
- **Actual**: [what actually happens]
- **Suggested Fix**: [from investigator]

## Major Issues
[M-1] [same format as critical]

## Minor Issues
[m-1] [URL] | [description] | [suggested fix]

## Positive Observations
- [What works well]

## Coverage Summary
| Feature | Priority | Status | Tests |
|---------|----------|--------|-------|
| F-001   | P0       | ✓      | T-001 |

**Coverage**: N% (N/N features tested)

## Pages Tested
- [URL 1]
- [URL 2]

## Phase Summary
| Phase | Status | Key Output |
|-------|--------|------------|
| Requirements | completed | N features extracted |
| Exploration | completed | N pages discovered |
| Generation | completed | N tests generated |

## Rerun Inputs
url: [url]
prd: [path]
run_id: [id]
```

## Decision Logic

### Health Score Calculation

```
Base: 10.0

Deductions:
  critical_count × 2.0
  major_count × 1.0
  minor_count × 0.25
  coverage_pct < 80: -1.0
  coverage_pct < 50: -2.0 (replaces -1.0, not additive)
  degraded_phases × 0.5

Floor: 0.0
```

### Verdict Rules

| Condition | Verdict |
|-----------|---------|
| 0 critical, 0 major, health ≥ 8 | SHIP |
| 0 critical, ≤3 major, health ≥ 6 | SHIP WITH FIXES |
| Any critical, OR health < 6 | DO NOT SHIP |
| No tests executed | INCONCLUSIVE |

### Partial Run Handling

- If a phase was skipped: note in report, exclude from relevant section
- If exploration was skipped: "Tests based on spec only — not verified against live app"
- If no tests generated: "No tests generated — see Phase 3 status"
- Always produce a report, even if all phases failed (error report)

## Examples

### Example: Clean Run

**Input:** All artifacts available, 31 tests, 28 passed, 3 failed

**Output:**
```markdown
# QA Report: https://staging.myapp.com — 2026-07-02T14:30:22Z

## Executive Summary
- **Verdict**: SHIP WITH FIXES
- **Health Score**: 7.25/10
- **Tests**: 31 total, 28 passed, 3 failed
- **Coverage**: 92% (11/12 features tested)
- **Critical Issues**: 0
- **Major Issues**: 2
- **Minor Issues**: 1

The application is in good shape. 28 of 31 tests pass. The 3 failures are
minor issues that should be fixed before release.

## Major Issues
[M-1] Toast notifications dismiss too quickly
- **URL**: /settings, /profile
- **Feature**: All forms
- **Tests**: T-015, T-018
- **Root Cause**: Timing issue
- **Expected**: Toast visible for at least 3 seconds
- **Actual**: Toast dismisses after 2 seconds
- **Suggested Fix**: Increase toast display duration to 5 seconds

## Coverage Summary
| Feature | Priority | Status | Tests |
|---------|----------|--------|-------|
| F-001: Auth | P0 | ✓ | T-001, T-002, T-003 |
| F-002: Search | P1 | ✓ | T-005, T-006, T-007 |

**Coverage**: 92% (11/12 features tested)
```

## Dependencies

- **Skills**: `calculate-health-score` (score computation)
- **Tools**: `read`, `write`, `glob`

## Usage

This skill is invoked by the `qa-reporter` agent during Phase 4 (Reporting).
