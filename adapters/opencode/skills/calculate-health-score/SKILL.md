---
name: calculate-health-score
description: Compute a numeric health score (0-10) and verdict from QA artifacts. Use to determine ship/no-ship decision.
---

# Calculate Health Score

Compute a deterministic health score from QA artifacts and determine the verdict.

## Purpose

Take issue counts, coverage percentage, and phase statuses, then compute a health score (0-10) and verdict (SHIP / SHIP WITH FIXES / DO NOT SHIP / INCONCLUSIVE).

## Input

| Field | Required | Format | Description |
|-------|----------|--------|-------------|
| `critical_count` | Yes | Integer | Number of critical issues |
| `major_count` | Yes | Integer | Number of major issues |
| `minor_count` | Yes | Integer | Number of minor issues |
| `coverage_pct` | No | Number | Test coverage percentage (0-100) |
| `degraded_phases` | No | Integer | Number of degraded/skipped phases |
| `tests_passed` | No | Integer | Number of passing tests |
| `tests_total` | No | Integer | Total tests executed |

## Output

| Field | Format | Description |
|-------|--------|-------------|
| `score` | Number | Health score 0.0-10.0 |
| `breakdown` | JSON | Deduction details |
| `verdict` | String | SHIP / SHIP WITH FIXES / DO NOT SHIP / INCONCLUSIVE |

## Formula

```javascript
// Base score
let score = 10.0;

// Deductions
score -= critical_count * 2.0;
score -= major_count * 1.0;
score -= minor_count * 0.25;

if (coverage_pct < 50) {
  score -= 2.0;
} else if (coverage_pct < 80) {
  score -= 1.0;
}

score -= degraded_phases * 0.5;

// Floor at 0
score = Math.max(0.0, score);

// Verdict
let verdict;
if (tests_total === 0) {
  verdict = "INCONCLUSIVE";
} else if (critical_count === 0 && major_count === 0 && score >= 8.0) {
  verdict = "SHIP";
} else if (critical_count === 0 && major_count <= 3 && score >= 6.0) {
  verdict = "SHIP WITH FIXES";
} else {
  verdict = "DO NOT SHIP";
}
```

## Examples

### Example 1: Clean Run

**Input:**
```json
{
  "critical_count": 0,
  "major_count": 2,
  "minor_count": 3,
  "coverage_pct": 92,
  "degraded_phases": 0,
  "tests_passed": 29,
  "tests_total": 31
}
```

**Output:**
```json
{
  "score": 7.25,
  "breakdown": {
    "base": 10.0,
    "critical_deduction": 0,
    "major_deduction": -2.0,
    "minor_deduction": -0.75,
    "coverage_deduction": 0,
    "degradation_deduction": 0
  },
  "verdict": "SHIP WITH FIXES"
}
```

### Example 2: Problematic Run

**Input:**
```json
{
  "critical_count": 2,
  "major_count": 3,
  "minor_count": 2,
  "coverage_pct": 85,
  "degraded_phases": 1,
  "tests_passed": 24,
  "tests_total": 31
}
```

**Output:**
```json
{
  "score": 3.5,
  "breakdown": {
    "base": 10.0,
    "critical_deduction": -4.0,
    "major_deduction": -3.0,
    "minor_deduction": -0.5,
    "coverage_deduction": 0,
    "degradation_deduction": -0.5
  },
  "verdict": "DO NOT SHIP"
}
```

## Dependencies

- None (pure computation)
- Tools: none

## Usage

This skill is invoked by `generate-report` to compute the health score and verdict.
