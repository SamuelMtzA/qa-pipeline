---
name: test-execution
description: Execute Playwright tests and capture results with traces, videos, and screenshots. Use this skill when you need to run generated test files and collect execution evidence.
---

# Test Execution Skill

## Purpose

Execute generated Playwright test files and capture comprehensive execution evidence including pass/fail status, traces, videos, and screenshots.

## Input

- `test_dir`: Directory containing test files (default: `playwright/scripts`)
- `output_dir`: Directory to save execution results (default: `test-results`)
- `config`: Playwright config file (default: `playwright/playwright.config.ts`)

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
- **Content**: Pass/fail counts, duration, failure details

## Process

1. Validate test files with `npx playwright test --list`
2. Configure Playwright for trace, video, and screenshot capture
3. Execute tests with `npx playwright test`
4. Parse test results from Playwright output
5. Collect traces, videos, and screenshots
6. Generate summary report
7. Update test-plan.json with execution status

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

## Example Output

### results.json

```json
{
  "config": {
    "testDir": "/path/to/playwright/scripts",
    "outputDir": "/path/to/test-results"
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
                "message": "Expected: 'Invalid email format'",
                "stack": "Error: expect(received).toBeVisible()",
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
  ],
  "stats": {
    "total": 40,
    "passed": 35,
    "failed": 3,
    "skipped": 2,
    "flaky": 0,
    "duration": 145678
  }
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
| **Flaky** | 0 | 0% |

## Failed Tests

### 1. T-002: Login with invalid email format
**File**: `auth/login.spec.ts`  
**Duration**: 1.89s  
**Retries**: 1

**Error**:
```
Expected: "Invalid email format"
Received: "Please enter a valid email"
```

**Location**: `auth/login.spec.ts:25:5`

**Evidence**:
- Screenshot: `screenshots/T-002-login-with-invalid-email-format.png`
- Video: `videos/T-002-login-with-invalid-email-format.webm`
- Trace: `traces/T-002-login-with-invalid-email-format.zip`

**Recommendation**: Update expected error message to match actual UI text.

---

### 2. T-015: Navigate to forgot password page
**File**: `auth/login.spec.ts`  
**Duration**: 2.1s  
**Retries**: 1

**Error**:
```
Timeout 5000ms exceeded.
Waiting for page to have URL matching /\/forgot-password/
```

**Location**: `auth/login.spec.ts:89:5`

**Evidence**:
- Screenshot: `screenshots/T-015-navigate-to-forgot-password-page.png`
- Video: `videos/T-015-navigate-to-forgot-password-page.webm`
- Trace: `traces/T-015-navigate-to-forgot-password-page.zip`

**Recommendation**: Check if forgot password link exists and is clickable.

---

### 3. T-034: Apply valid coupon
**File**: `cart/cart.spec.ts`  
**Duration**: 3.2s  
**Retries**: 1

**Error**:
```
Expected: "$89.99"
Received: "$99.99"
```

**Location**: `cart/cart.spec.ts:67:5`

**Evidence**:
- Screenshot: `screenshots/T-034-apply-valid-coupon.png`
- Video: `videos/T-034-apply-valid-coupon.webm`
- Trace: `traces/T-034-apply-valid-coupon.zip`

**Recommendation**: Verify coupon code "SAVE10" is valid and discount is applied.

## Skipped Tests

### 1. T-053: Confirmation email is sent
**File**: `checkout/checkout.spec.ts`  
**Reason**: Requires email server integration

### 2. T-060: Order history page lists all past orders
**File**: `orders/history.spec.ts`  
**Reason**: Requires pre-existing order data

## Performance

| Metric | Value |
|--------|-------|
| **Total Duration** | 2m 26s |
| **Average Test Duration** | 3.6s |
| **Slowest Test** | T-034 (3.2s) |
| **Fastest Test** | T-030 (0.8s) |

## Evidence Files

| Type | Count | Size |
|------|-------|------|
| **Screenshots** | 3 | 450 KB |
| **Videos** | 3 | 12 MB |
| **Traces** | 3 | 8 MB |
| **Total** | 9 | 20.5 MB |

## Next Steps

1. **Fix failed tests**:
   - Update expected error messages
   - Verify forgot password link
   - Test coupon functionality

2. **Enable skipped tests**:
   - Set up email server integration
   - Create test data fixtures

3. **Generate report** using Skill 6 (Reporting)
```

## Usage

```bash
# Execute all tests
@test-execution

# Specify test directory
@test-execution playwright/scripts

# Specify output directory
@test-execution playwright/scripts my-results/
```

## Agent Workflow

1. Agent validates test files with `npx playwright test --list`
2. Agent configures Playwright for evidence capture
3. Agent executes tests with `npx playwright test`
4. Agent parses results from JSON output
5. Agent collects traces, videos, and screenshots
6. Agent generates summary report
7. Agent updates test-plan.json with execution status

## Validation

The skill validates:
- Test directory exists and contains .spec.ts files
- Playwright config exists
- Tests pass validation (`npx playwright test --list`)
- Results JSON is generated
- Evidence files are collected for failed tests

## Error Handling

- **No tests found**: Error with test directory path
- **Validation fails**: Error with validation output
- **Execution fails**: Continue, collect partial results
- **Evidence missing**: Warning, continue with available evidence
- **Results parse error**: Error with parse details

## Integration with Other Skills

This skill uses:
- **Skill 4 (Test Generation)**: Generated test files

This skill feeds into:
- **Skill 6 (Reporting)**: Uses execution results and evidence

## Limitations

- **No test data setup**: Tests must handle their own data
- **No parallel execution**: Tests run sequentially by default
- **No test environment setup**: Assumes app is running
- **No retry logic**: Only retries configured in Playwright config

## Files

- `.opencode/skills/test-execution/SKILL.md` - This skill definition
- `skills/README-skill5.md` - Documentation
