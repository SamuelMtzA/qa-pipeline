---
name: reporting (legacy)
description: LEGACY REFERENCE ONLY. Use `generate-report` + `calculate-health-score` instead. This file is preserved as a human-readable sample of the full QA report structure (Summary, Coverage, Failures, Root Cause, Recommendations, Appendix).
---

> **DEPRECATED — DO NOT USE IN PIPELINE**
>
> The canonical MVP reporting skills are:
> - `.opencode/skills/generate-report/SKILL.md` — renders the final report
> - `.opencode/skills/calculate-health-score/SKILL.md` — deterministic 0-10 score + verdict
>
> Dispatched by the `qa-reporter` sub-agent during Step 5 of the orchestrator.
> This file is kept as a reference of the full report structure with all 5 required sections.

# Reporting Skill

## Purpose

Generate a comprehensive QA report by consolidating all artifacts from the pipeline: requirements, exploration, test plan, execution results, and evidence.

## Input

- `requirements_path`: Path to requirements.json (from Skill 1)
- `exploration_path`: Path to exploration.md (from Skill 2)
- `test_plan_path`: Path to test-plan.json (from Skill 4)
- `results_path`: Path to results.json (from Skill 5)
- `coverage_path`: Path to coverage-matrix.md (from Skill 4)
- `output_dir`: Directory to save report (default: `reports`)

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

## Report Structure

```markdown
# QA Report: E-Commerce Platform

**Date**: 2026-01-15  
**URL**: https://example-ecommerce.com  
**Duration**: 45 minutes  
**Verdict**: SHIP WITH FIXES

---

## Executive Summary

### Overview
Comprehensive QA testing was performed on the E-Commerce Platform, covering user authentication, product catalog, shopping cart, and checkout functionality. The application is functional with good UX, but has 3 failing tests and 1 major issue that should be addressed before release.

### Key Metrics

| Metric | Value |
|--------|-------|
| **Features Tested** | 5 |
| **Requirements Coverage** | 92% (23/25) |
| **Tests Executed** | 40 |
| **Tests Passed** | 35 (87.5%) |
| **Tests Failed** | 3 (7.5%) |
| **Tests Skipped** | 2 (5%) |
| **Critical Issues** | 0 |
| **Major Issues** | 1 |
| **Minor Issues** | 4 |

### Verdict: SHIP WITH FIXES

**Rationale**: No critical issues found. 87.5% test pass rate is acceptable for release. 3 failing tests are minor issues that can be fixed post-release. 1 major issue (cart badge delay) should be fixed before release if possible.

---

## Coverage Analysis

### Requirements Coverage

**Total Requirements**: 25  
**Covered**: 23 (92%)  
**Not Testable**: 1 (4%)  
**Deferred**: 1 (4%)

#### By Feature

| Feature | Priority | Requirements | Covered | Coverage |
|---------|----------|--------------|---------|----------|
| F-001: User Authentication | P0 | 5 | 4 | 80% |
| F-002: Product Catalog | P1 | 5 | 5 | 100% |
| F-003: Shopping Cart | P0 | 5 | 5 | 100% |
| F-004: Checkout Process | P0 | 5 | 5 | 100% |
| F-005: Order History | P1 | 4 | 3 | 75% |

#### Untested Requirements

1. **F-001**: Failed login attempts are logged
   - Reason: Not testable from UI (requires backend verification)
   
2. **F-005**: Order status updates are tracked
   - Reason: Requires multiple sessions and time delay

### Test Coverage

**Total Tests**: 40  
**P0 (Critical)**: 24 (60%)  
**P1 (Important)**: 12 (30%)  
**P2 (Nice-to-have)**: 4 (10%)

#### By Type

| Type | Count | Percentage |
|------|-------|------------|
| Happy Path | 20 | 50% |
| Error Path | 15 | 37.5% |
| Edge Case | 5 | 12.5% |

---

## Test Results

### Summary

| Metric | Count | Percentage |
|--------|-------|------------|
| **Total Tests** | 40 | 100% |
| **Passed** | 35 | 87.5% |
| **Failed** | 3 | 7.5% |
| **Skipped** | 2 | 5% |
| **Flaky** | 0 | 0% |

### Execution Details

- **Total Duration**: 2 minutes 26 seconds
- **Average Test Duration**: 3.6 seconds
- **Slowest Test**: T-010 (3.46s)
- **Fastest Test**: T-030 (0.89s)

### Results by Feature

| Feature | Tests | Passed | Failed | Skipped | Pass Rate |
|---------|-------|--------|--------|---------|-----------|
| F-001: User Authentication | 17 | 15 | 2 | 0 | 88% |
| F-002: Product Catalog | 5 | 5 | 0 | 0 | 100% |
| F-003: Shopping Cart | 11 | 10 | 1 | 0 | 91% |
| F-004: Checkout Process | 7 | 5 | 0 | 2 | 71% |
| F-005: Order History | 0 | 0 | 0 | 0 | N/A |

---

## Failed Tests

### 1. T-002: Login with invalid email format

**Feature**: F-001 (User Authentication)  
**Priority**: P0  
**Type**: Error Path  
**File**: `auth/login.spec.ts`  
**Duration**: 1.89s

#### Error Details

```
Expected: "Invalid email format"
Received: "Please enter a valid email"
```

**Location**: `auth/login.spec.ts:25:5`

#### Root Cause Analysis

**Category**: Test Bug (Incorrect Expected Value)

**Analysis**: The test expects the error message "Invalid email format" but the application displays "Please enter a valid email". This is a test bug, not an application bug. The application behavior is correct and user-friendly.

**Evidence**:
- Screenshot shows correct error message displayed
- No console errors
- Network requests successful

#### Recommendation

**Action**: Update test to match actual UI text

**Fix**:
```typescript
// Before
await expect(page.getByText('Invalid email format')).toBeVisible();

// After
await expect(page.getByText('Please enter a valid email')).toBeVisible();
```

**Priority**: Low (test bug, not application bug)

**Evidence**:
- Screenshot: `test-results/screenshots/T-002-login-with-invalid-email-format.png`
- Video: `test-results/videos/T-002-login-with-invalid-email-format.webm`
- Trace: `test-results/traces/T-002-login-with-invalid-email-format.zip`

---

### 2. T-015: Navigate to forgot password page

**Feature**: F-001 (User Authentication)  
**Priority**: P1  
**Type**: Happy Path  
**File**: `auth/login.spec.ts`  
**Duration**: 2.1s

#### Error Details

```
Timeout 5000ms exceeded.
Waiting for page to have URL matching /\/forgot-password/
```

**Location**: `auth/login.spec.ts:89:5`

#### Root Cause Analysis

**Category**: Application Bug (Missing Feature)

**Analysis**: The "Forgot password?" link exists on the login page but does not navigate to a forgot password page. The link may be a placeholder or the feature is not implemented.

**Evidence**:
- Screenshot shows link is visible
- Click action succeeds
- Page does not navigate (URL remains /login)
- No console errors
- No network requests to /forgot-password

#### Recommendation

**Action**: Implement forgot password feature or remove link

**Options**:
1. Implement forgot password page and email flow
2. Remove "Forgot password?" link if feature is not planned
3. Update link to show "Coming soon" message

**Priority**: Medium (missing feature, affects user experience)

**Evidence**:
- Screenshot: `test-results/screenshots/T-015-navigate-to-forgot-password-page.png`
- Video: `test-results/videos/T-015-navigate-to-forgot-password-page.webm`
- Trace: `test-results/traces/T-015-navigate-to-forgot-password-page.zip`

---

### 3. T-034: Apply valid coupon

**Feature**: F-003 (Shopping Cart)  
**Priority**: P1  
**Type**: Happy Path  
**File**: `cart/cart.spec.ts`  
**Duration**: 3.2s

#### Error Details

```
Expected: "$89.99"
Received: "$99.99"
```

**Location**: `cart/cart.spec.ts:67:5`

#### Root Cause Analysis

**Category**: Application Bug (Feature Not Implemented)

**Analysis**: The coupon code "SAVE10" is accepted (no error message) but the discount is not applied. The total remains $99.99 instead of $89.99 (10% discount). This suggests the coupon functionality is not fully implemented.

**Evidence**:
- Screenshot shows coupon input accepted
- No error message displayed
- Total does not update
- Network request to /api/cart/coupon returns 200 OK
- Response does not include discount

#### Recommendation

**Action**: Implement coupon discount calculation

**Fix**:
1. Verify coupon code in backend
2. Calculate discount (10% of subtotal)
3. Apply discount to total
4. Update UI to show discount line item

**Priority**: High (feature not working as expected)

**Evidence**:
- Screenshot: `test-results/screenshots/T-034-apply-valid-coupon.png`
- Video: `test-results/videos/T-034-apply-valid-coupon.webm`
- Trace: `test-results/traces/T-034-apply-valid-coupon.zip`

---

## Issues Found During Exploration

### Major Issues

#### 1. Cart Badge Update Delay

**Location**: Header cart icon  
**Description**: Cart badge doesn't update immediately after adding item to cart. Requires page refresh to see updated count.

**Impact**: Users may think item wasn't added and add duplicates

**Recommendation**: Update badge state immediately via JavaScript

**Severity**: Major

---

### Minor Issues

#### 1. Low Resolution Hero Image

**Location**: Home page hero banner  
**Description**: Image appears pixelated on high-DPI displays

**Recommendation**: Use @2x images or SVG

**Severity**: Minor

#### 2. Small Footer Links on Mobile

**Location**: Footer on mobile view  
**Description**: Links are too small to tap easily on mobile devices

**Recommendation**: Increase padding and font size on mobile

**Severity**: Minor

#### 3. No Loading Indicator for Cart Operations

**Location**: Add to Cart button, Update Cart button  
**Description**: No visual feedback while operations are in progress

**Recommendation**: Show spinner or disable button during API call

**Severity**: Minor

#### 4. Product Image Gallery Navigation

**Location**: Product detail page  
**Description**: Thumbnail images don't have hover state to indicate they're clickable

**Recommendation**: Add hover state to thumbnails

**Severity**: Minor

---

## Recommendations

### High Priority

1. **Fix coupon functionality** (T-034)
   - Implement discount calculation
   - Apply discount to total
   - Show discount line item in cart
   - **Effort**: 4-8 hours
   - **Impact**: High (feature not working)

2. **Fix cart badge update delay** (Exploration Issue)
   - Update badge state immediately after adding item
   - Use optimistic UI updates
   - **Effort**: 2-4 hours
   - **Impact**: High (poor UX)

### Medium Priority

3. **Implement forgot password feature** (T-015)
   - Create forgot password page
   - Implement email flow
   - OR remove link if not planned
   - **Effort**: 8-16 hours (if implementing)
   - **Impact**: Medium (missing feature)

4. **Add loading indicators** (Exploration Issue)
   - Show spinner on "Add to Cart" button
   - Disable button while processing
   - **Effort**: 2-4 hours
   - **Impact**: Medium (better UX)

### Low Priority

5. **Update test error messages** (T-002)
   - Update expected error message to match UI
   - **Effort**: 5 minutes
   - **Impact**: Low (test bug only)

6. **Optimize images** (Exploration Issue)
   - Use @2x images for high-DPI displays
   - Compress images
   - **Effort**: 2-4 hours
   - **Impact**: Low (visual quality)

7. **Improve mobile footer** (Exploration Issue)
   - Increase footer link tap targets
   - **Effort**: 1-2 hours
   - **Impact**: Low (mobile UX)

---

## Appendix

### Test Environment

- **Browser**: Chromium
- **Playwright Version**: 1.40.0
- **Node.js Version**: 24.16.0
- **OS**: macOS

### Files Generated

| File | Size | Description |
|------|------|-------------|
| `requirements.json` | 12 KB | Structured requirements |
| `exploration.md` | 45 KB | Exploration report |
| `test-plan.json` | 8 KB | Test plan |
| `coverage-matrix.md` | 6 KB | Coverage analysis |
| `results.json` | 15 KB | Execution results |
| `summary.md` | 12 KB | Execution summary |
| `qa-report.md` | 25 KB | This report |
| `qa-report.json` | 18 KB | Machine-readable report |

### Evidence Files

| Type | Count | Total Size |
|------|-------|------------|
| Screenshots | 3 | 450 KB |
| Videos | 3 | 12 MB |
| Traces | 3 | 8 MB |
| **Total** | 9 | 20.5 MB |

### Commands Used

```bash
# Skill 1: Requirement Analysis
node skills/requirement-analysis.js test-prd.md requirements.json

# Skill 2: Exploratory Testing
@exploratory-testing https://example-ecommerce.com

# Skill 3: Playwright MCP
@playwright-mcp https://example-ecommerce.com

# Skill 4: Test Generation
@test-generation requirements.json playwright-output/dom-snapshot.json

# Skill 5: Test Execution
@test-execution

# Skill 6: Reporting
@reporting
```

### Next Steps

1. **Fix high priority issues** (coupon functionality, cart badge)
2. **Update failing tests** (error messages)
3. **Implement missing features** (forgot password)
4. **Re-run tests** to verify fixes
5. **Generate final report** for release approval

---

## Sign-off

**QA Engineer**: AI Agent  
**Date**: 2026-01-15  
**Verdict**: SHIP WITH FIXES  
**Confidence**: High

**Notes**: Application is functional with good UX. 3 failing tests are minor issues. 1 major issue (cart badge delay) should be fixed before release if possible. Overall quality is acceptable for release with known issues documented.
```

## Usage

```bash
# Generate report from all artifacts
@reporting

# Specify artifact paths
@reporting requirements.json exploration.md test-plan.json results.json coverage-matrix.md

# Specify output directory
@reporting --output my-reports/
```

## Agent Workflow

1. Agent reads all input artifacts
2. Agent extracts key metrics and data
3. Agent analyzes failed tests for root causes
4. Agent categorizes issues by severity
5. Agent generates recommendations with priorities
6. Agent writes markdown report
7. Agent writes JSON report
8. Agent validates report structure

## Validation

The skill validates:
- All input files exist and are valid
- Report has all required sections
- Metrics are calculated correctly
- Recommendations are actionable

## Error Handling

- **Missing input**: Warning, generate partial report
- **Invalid JSON**: Error with file path
- **Calculation error**: Warning, use default values
- **Write error**: Error with file path

## Integration with Other Skills

This skill uses:
- **Skill 1 (Requirement Analysis)**: requirements.json
- **Skill 2 (Exploratory Testing)**: exploration.md
- **Skill 3 (Playwright MCP)**: playwright-output/
- **Skill 4 (Test Generation)**: test-plan.json, coverage-matrix.md
- **Skill 5 (Test Execution)**: results.json, test-results/

This skill is the final step in the pipeline.

## Limitations

- **No historical comparison**: Doesn't compare with previous runs
- **No trend analysis**: Doesn't show trends over time
- **No automated fix suggestions**: Only provides recommendations
- **No integration with issue trackers**: Doesn't create tickets

## Files

- `.opencode/skills/reporting/SKILL.md` - This skill definition
- `skills/README-skill6.md` - Documentation
