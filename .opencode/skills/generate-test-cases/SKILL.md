---
name: generate-test-cases
description: Generate structured test plans and executable Playwright scripts from feature maps and app maps. Use after exploration to create tests.
---

# Generate Test Cases

Generate structured test plans and executable Playwright test scripts from a feature map and app map.

## Purpose

Take the feature map (what the app should do) and app map (what the app actually has) and produce test cases with evidence grounding, then generate executable Playwright scripts.

## Input

| Field | Required | Format | Description |
|-------|----------|--------|-------------|
| `feature_map` | Yes | JSON | From extract-user-stories |
| `app_map` | Yes | JSON | From explore-ui |
| `risk_register` | No | JSON array | From identify-risks (influences priority) |

## Output

| Field | Format | Description |
|-------|--------|-------------|
| `test_plan` | JSON | Structured test plan |
| `test_plan_md` | Markdown string | Human-readable test plan |
| `scripts` | TypeScript files | Playwright test scripts |
| `coverage_matrix` | Markdown string | Feature → test mapping |

## Test Plan Schema

```json
{
  "tests": [
    {
      "id": "T-001",
      "name": "Login with valid credentials",
      "feature_ref": "F-001/UC-001",
      "priority": "P0",
      "type": "functional",
      "preconditions": ["User is on the login page"],
      "steps": [
        { "action": "Navigate to /login", "expected": "Login form is visible" },
        { "action": "Fill email field with test@example.com", "expected": "Email field populated" },
        { "action": "Fill password field", "expected": "Password field populated" },
        { "action": "Click Sign In button", "expected": "Redirect to /dashboard" }
      ],
      "evidence_refs": ["screenshots/login-1440.png"],
      "dependencies": [],
      "script": "scripts/auth/login.spec.ts",
      "tags": ["auth", "smoke", "P0"]
    }
  ],
  "summary": {
    "total": 31,
    "P0": 12,
    "P1": 14,
    "P2": 5,
    "coverage_pct": 92
  }
}
```

## Decision Logic

### Test Case Generation

1. **Reconcile feature map with app map**:
   - Match features to discovered pages/elements
   - Flag features with no corresponding page (untestable)
   - Flag discovered pages with no corresponding feature (undocumented)

2. **For each feature/use-case, generate**:
   - Happy path test (primary user journey)
   - Error path test (invalid inputs, unauthorized access)
   - Edge case test (empty states, boundary values) for P0 features

3. **Evidence grounding**:
   - Every test step must reference an element discovered during exploration
   - Selectors come from app map's element inventory, not invented
   - If a step references an element not in app map, flag as `[UNVERIFIED]`

4. **Priority ordering**:
   - P0: auth, core business flow, payment, data integrity
   - P1: secondary flows, search/filter, settings, navigation
   - P2: cosmetic, edge cases, nice-to-have

5. **Dependency mapping**:
   - Tests requiring auth depend on login test
   - Tests requiring data depend on data-creation tests
   - Independent tests marked as parallelizable

### Playwright Script Generation

1. **Use `@playwright/test` framework**
2. **Group tests** with `test.describe` blocks per feature
3. **Use role-based selectors**:
   - `page.getByRole('button', { name: 'Submit' })`
   - `page.getByLabel('Email')`
   - `page.getByTestId('...')`
4. **Include `waitForLoadState`** before critical assertions
5. **Tag tests** with priority: `test('name', { tag: '@P0' }, async (...) => { ... })`
6. **Validate scripts** with `npx playwright test --list`

## Examples

### Example: Login Test

**Input:** Feature F-001 (User Authentication), App map shows /login page

**Output:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('T-001: Login with valid credentials', { tag: '@P0' }, async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel('Email')).toBeVisible();
    
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill(process.env.TEST_PASS!);
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.getByText('Welcome')).toBeVisible();
  });

  test('T-002: Login with invalid password', { tag: '@P0' }, async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('wrong-password');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    await expect(page.getByText('Invalid credentials')).toBeVisible();
    await expect(page).toHaveURL(/login/);
  });
});
```

## Dependencies

- **Skills**: `extract-user-stories` (feature map), `explore-ui` (app map)
- **Tools**: `read`, `write`, `bash` (for `npx playwright test --list`)

## Usage

This skill is invoked by the `qa-generator` agent during Phase 3 (Test Generation).
