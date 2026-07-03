# Skill 5: Test Execution

## Overview

Execute generated Playwright test files and capture comprehensive execution evidence including pass/fail status, traces, videos, and screenshots.

## Input

- **Test Directory**: Directory containing test files (default: `playwright/scripts`)
- **Output Directory**: Directory to save execution results (default: `test-results`)
- **Config**: Playwright config file (default: `playwright/playwright.config.ts`)

## Output

### Test Results
- **File**: `test-results/results.json`
- **Format**: JSON with test execution details
- **Content**: Test ID, name, status (pass/fail), duration, error messages

### Traces
- **Files**: `test-results/traces/*.zip`
- **Format**: Playwright trace files
- **Content**: Full execution trace for failed tests

### Videos
- **Files**: `test-results/videos/*.webm`
- **Format**: WebM video files
- **Content**: Screen recording of failed tests

### Screenshots
- **Files**: `test-results/screenshots/*.png`
- **Format**: PNG images
- **Content**: Screenshots at failure point

### Summary Report
- **File**: `test-results/summary.md`
- **Format**: Markdown summary
- **Content**: Pass/fail counts, duration, failure details, recommendations

## Usage

```bash
# Execute all tests
@test-execution

# Specify test directory
@test-execution playwright/scripts

# Specify output directory
@test-execution playwright/scripts my-results/
```

## Playwright Configuration

The skill uses a Playwright config optimized for evidence capture:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './scripts',
  outputDir: '../test-results',
  
  // Capture evidence on failure
  use: {
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  
  // Retry failed tests
  retries: 1,
  
  // Reporter configuration
  reporter: [
    ['list'],
    ['json', { outputFile: '../test-results/results.json' }]
  ],
  
  // Timeout settings
  timeout: 30000,
  expect: {
    timeout: 5000
  }
});
```

## Execution Process

1. **Validate tests**: `npx playwright test --list`
2. **Configure Playwright**: Set up evidence capture
3. **Execute tests**: `npx playwright test`
4. **Parse results**: Read JSON output
5. **Collect evidence**: Gather traces, videos, screenshots
6. **Generate summary**: Create markdown report
7. **Update test plan**: Mark tests as executed

## Sample Output

### results.json

```json
{
  "stats": {
    "total": 40,
    "passed": 35,
    "failed": 3,
    "skipped": 2,
    "flaky": 0,
    "duration": 145678
  },
  "suites": [
    {
      "title": "Authentication - Login",
      "file": "auth/login.spec.ts",
      "specs": [
        {
          "title": "T-001: Login with valid credentials",
          "tests": [
            {
              "testId": "T-001",
              "status": "passed",
              "duration": 2345,
              "retries": 0
            }
          ]
        },
        {
          "title": "T-002: Login with invalid email format",
          "tests": [
            {
              "testId": "T-002",
              "status": "failed",
              "duration": 1890,
              "retries": 1,
              "error": {
                "message": "Expected: 'Invalid email format'\nReceived: 'Please enter a valid email'",
                "location": "auth/login.spec.ts:25:5"
              },
              "attachments": [
                {
                  "name": "screenshot",
                  "path": "screenshots/T-002-login-with-invalid-email-format.png"
                },
                {
                  "name": "video",
                  "path": "videos/T-002-login-with-invalid-email-format.webm"
                },
                {
                  "name": "trace",
                  "path": "traces/T-002-login-with-invalid-email-format.zip"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

### summary.md

```markdown
# Test Execution Report

**Date**: 2026-01-15T10:30:00Z  
**Duration**: 2 minutes 26 seconds  
**Status**: 35 passed, 3 failed, 2 skipped

## Summary

| Metric | Count | Percentage |
|--------|-------|------------|
| **Total Tests** | 40 | 100% |
| **Passed** | 35 | 87.5% |
| **Failed** | 3 | 7.5% |
| **Skipped** | 2 | 5% |

## Failed Tests

### 1. T-002: Login with invalid email format

**Error**: Expected "Invalid email format", received "Please enter a valid email"

**Evidence**:
- Screenshot: `screenshots/T-002-login-with-invalid-email-format.png`
- Video: `videos/T-002-login-with-invalid-email-format.webm`
- Trace: `traces/T-002-login-with-invalid-email-format.zip`

**Recommendation**: Update expected error message to match actual UI text.
```

## Viewing Evidence

### View Trace

```bash
npx playwright show-trace test-results/traces/T-002-login-with-invalid-email-format.zip
```

Opens interactive trace viewer with:
- DOM snapshots at each step
- Network requests
- Console logs
- Screenshots
- Action timeline

### View Video

```bash
# Open video file directly
open test-results/videos/T-002-login-with-invalid-email-format.webm
```

### View Screenshot

```bash
# Open screenshot file directly
open test-results/screenshots/T-002-login-with-invalid-email-format.png
```

### View HTML Report

```bash
npx playwright show-report
```

Opens interactive HTML report with:
- Test results by suite
- Failure details
- Evidence links
- Performance metrics

## Testing

```bash
# Validate test execution
node tests/test-test-execution.js test-results
```

## Sample Output

See `test-results/` directory for sample outputs:
- `results.json` - Execution results (40 tests, 35 passed, 3 failed, 2 skipped)
- `summary.md` - Comprehensive summary report
- `screenshots/` - Failure screenshots (3 files)
- `videos/` - Failure videos (3 files)
- `traces/` - Failure traces (3 files)

## Integration with Other Skills

This skill uses:
- **Skill 4 (Test Generation)**: Generated test files

This skill feeds into:
- **Skill 6 (Reporting)**: Uses execution results and evidence

## Error Handling

- **No tests found**: Error with test directory path
- **Validation fails**: Error with validation output
- **Execution fails**: Continue, collect partial results
- **Evidence missing**: Warning, continue with available evidence
- **Results parse error**: Error with parse details

## Limitations

- **No test data setup**: Tests must handle their own data
- **No parallel execution**: Tests run sequentially by default
- **No test environment setup**: Assumes app is running
- **No retry logic**: Only retries configured in Playwright config

## Performance

- **Execution time**: ~2-3 minutes for 40 tests
- **Evidence size**: ~20 MB for 3 failed tests
- **Trace size**: ~2-3 MB per trace
- **Video size**: ~4 MB per video
- **Screenshot size**: ~150 KB per screenshot

## Files

- `.opencode/skills/test-execution/SKILL.md` - Skill definition
- `test-results/` - Execution results and evidence
- `skills/README-skill5.md` - This documentation
