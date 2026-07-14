# Skill 6: Reporting

> **MVP v1.0 status:** ✅ Complete
>
> **Canonical skills** (used by the pipeline):
> - `generate-report` — renders the final QA report
> - `calculate-health-score` — deterministic 0-10 score + verdict
>
> **Legacy reference** (kept for human review of the full report structure):
> - `reporting` — superseded by the canonical pair above
>
> **Sub-agent:** `qa-reporter` (`.opencode/agent/qa-reporter.md`) — dispatched by the orchestrator at Step 5.

## Overview

Generate a comprehensive QA report by consolidating all artifacts from the pipeline: requirements, exploration, test plan, execution results, and evidence.

## Input

- **requirements.json**: Structured requirements from Skill 1
- **exploration.md**: Exploration report from Skill 2
- **test-plan.json**: Test plan from Skill 4
- **results.json**: Execution results from Skill 5
- **coverage-matrix.md**: Coverage analysis from Skill 4
- **Output Directory**: Directory to save report (default: `reports`)

## Output

### QA Report (Markdown)
- **File**: `reports/qa-report.md`
- **Format**: Structured markdown document
- **Sections**:
  - Executive Summary
  - Coverage Analysis
  - Test Results
  - Failed Tests with Root Cause Analysis
  - Issues Found During Exploration
  - Recommendations
  - Appendix

### QA Report (JSON)
- **File**: `reports/qa-report.json`
- **Format**: Machine-readable JSON
- **Content**: Same data as markdown report

## Usage

```bash
# Generate report from all artifacts
@reporting

# Specify artifact paths
@reporting requirements.json exploration.md test-plan.json results.json coverage-matrix.md

# Specify output directory
@reporting --output my-reports/
```

## Report Structure

### Executive Summary

- Overview of testing performed
- Key metrics (coverage, pass rate, issues)
- Verdict: SHIP / SHIP WITH FIXES / DO NOT SHIP
- Rationale for verdict

### Coverage Analysis

- Requirements coverage by feature
- Untested requirements with reasons
- Test coverage by priority and type

### Test Results

- Summary statistics (passed, failed, skipped)
- Execution details (duration, performance)
- Results by feature

### Failed Tests

For each failed test:
- Error details
- Root cause analysis (test bug vs application bug)
- Evidence (screenshot, video, trace)
- Recommendation with priority and effort

### Issues Found

- Major issues from exploration
- Minor issues from exploration
- Impact and recommendations

### Recommendations

- High priority fixes
- Medium priority improvements
- Low priority enhancements
- Effort estimates for each

### Appendix

- Test environment details
- Files generated
- Evidence files
- Commands used
- Next steps

## Verdict Logic

### SHIP
- 0 critical issues
- 0 major issues
- Test pass rate ≥ 95%
- Coverage ≥ 90%

### SHIP WITH FIXES
- 0 critical issues
- ≤ 2 major issues
- Test pass rate ≥ 80%
- Coverage ≥ 80%

### DO NOT SHIP
- Any critical issues
- > 2 major issues
- Test pass rate < 80%
- Coverage < 80%

## Root Cause Analysis

For each failed test, categorize as:

### Test Bug
- Incorrect expected values
- Wrong selectors
- Missing waits
- Test logic errors

### Application Bug
- Feature not implemented
- Feature not working correctly
- UI doesn't match requirements
- Performance issues

### Environment Issue
- Network failures
- Service unavailable
- Configuration problems

### Flaky Test
- Intermittent failures
- Timing issues
- Race conditions

## Sample Output

See `reports/` directory for sample outputs:
- `qa-report.md` - Comprehensive markdown report (25 KB)
- `qa-report.json` - Machine-readable JSON report (18 KB)

### Key Metrics from Sample Report

| Metric | Value |
|--------|-------|
| Features Tested | 5 |
| Requirements Coverage | 92% (23/25) |
| Tests Executed | 40 |
| Tests Passed | 35 (87.5%) |
| Tests Failed | 3 (7.5%) |
| Critical Issues | 0 |
| Major Issues | 1 |
| Minor Issues | 4 |
| **Verdict** | **SHIP WITH FIXES** |

## Integration with Other Skills

This skill uses:
- **Skill 1 (Requirement Analysis)**: requirements.json
- **Skill 2 (Exploratory Testing)**: exploration.md
- **Skill 3 (Playwright MCP)**: playwright-output/
- **Skill 4 (Test Generation)**: test-plan.json, coverage-matrix.md
- **Skill 5 (Test Execution)**: results.json, test-results/

This skill is the final step in the pipeline.

## Error Handling

- **Missing input**: Warning, generate partial report
- **Invalid JSON**: Error with file path
- **Calculation error**: Warning, use default values
- **Write error**: Error with file path

## Limitations

- **No historical comparison**: Doesn't compare with previous runs
- **No trend analysis**: Doesn't show trends over time
- **No automated fix suggestions**: Only provides recommendations
- **No integration with issue trackers**: Doesn't create tickets

## Report Quality Checklist

- [ ] All sections present
- [ ] Metrics calculated correctly
- [ ] Failed tests have root cause analysis
- [ ] Recommendations are actionable
- [ ] Evidence links are valid
- [ ] Verdict is justified
- [ ] Next steps are clear

## Files

- `.opencode/skills/reporting/SKILL.legacy.md` - Legacy skill definition (superseded by `generate-report` + `calculate-health-score`)
- `reports/qa-report.md` - Sample markdown report
- `reports/qa-report.json` - Sample JSON report
- `skills/README-skill6.md` - This documentation
