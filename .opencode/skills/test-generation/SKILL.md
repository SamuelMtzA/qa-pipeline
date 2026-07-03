---
name: test-generation
description: Generate Playwright test files from requirements and DOM snapshot. Use this skill when you need to create executable test scripts based on product requirements and observed page structure.
---

# Test Generation Skill

## Purpose

Generate executable Playwright test files (.spec.ts) from structured requirements and DOM snapshot data.

## Input

- `requirements_path`: Path to requirements.json (from Skill 1)
- `dom_snapshot_path`: Path to dom-snapshot.json (from Skill 3)
- `output_dir`: Directory to save test files (default: `playwright/scripts`)

## Output

- **Test Files**: `*.spec.ts` files organized by feature
  - `auth/login.spec.ts` - Authentication tests
  - `auth/register.spec.ts` - Registration tests
  - `products/catalog.spec.ts` - Product catalog tests
  - `cart/cart.spec.ts` - Shopping cart tests
  - `checkout/checkout.spec.ts` - Checkout tests
- **Test Plan**: `test-plan.json` - Structured test plan
- **Coverage Matrix**: `coverage-matrix.md` - Feature to test mapping

## Process

1. Read requirements.json
2. Read dom-snapshot.json
3. For each feature in requirements:
   a. Identify testable requirements
   b. Map to DOM elements (selectors)
   c. Generate test cases (happy path, error path, edge cases)
   d. Create Playwright test file
4. Generate test plan summary
5. Generate coverage matrix
6. Validate all test files with `npx playwright test --list`

## Test Case Generation Strategy

### Per Feature

#### Happy Path Tests
- Primary user journey
- Valid inputs
- Expected success states

#### Error Path Tests
- Invalid inputs
- Missing required fields
- Unauthorized access
- Network errors

#### Edge Case Tests (P0 features only)
- Empty states
- Boundary values
- Concurrent actions
- Timeout scenarios

### Selector Strategy

**Priority order**:
1. `getByRole('button', { name: 'Submit' })` - Role-based
2. `getByLabel('Email')` - Label-based
3. `getByTestId('submit-btn')` - Test ID
4. `getByPlaceholder('Enter email')` - Placeholder
5. `locator('.submit-btn')` - CSS (last resort)

**Rules**:
- Every selector must exist in DOM snapshot
- Prefer semantic selectors (role, label) over CSS
- Avoid fragile selectors (nth-child, auto-generated classes)
- Flag selectors not in DOM as `[UNVERIFIED]`

## Example Output

### auth/login.spec.ts

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication - Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('T-001: Login with valid credentials', { tag: '@P0' }, async ({ page }) => {
    // Arrange
    const email = 'test@example.com';
    const password = process.env.TEST_PASSWORD || 'password123';

    // Act
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Login' }).click();

    // Assert
    await expect(page).toHaveURL(/\/account\/profile/);
    await expect(page.getByText('Welcome')).toBeVisible();
  });

  test('T-002: Login with invalid email', { tag: '@P0' }, async ({ page }) => {
    // Arrange
    const email = 'invalid-email';
    const password = 'password123';

    // Act
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Login' }).click();

    // Assert
    await expect(page.getByText('Invalid email format')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('T-003: Login with empty password', { tag: '@P0' }, async ({ page }) => {
    // Arrange
    const email = 'test@example.com';

    // Act
    await page.getByLabel('Email').fill(email);
    await page.getByRole('button', { name: 'Login' }).click();

    // Assert
    await expect(page.getByText('Password is required')).toBeVisible();
  });

  test('T-004: Login with wrong password', { tag: '@P0' }, async ({ page }) => {
    // Arrange
    const email = 'test@example.com';
    const password = 'wrongpassword';

    // Act
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Login' }).click();

    // Assert
    await expect(page.getByText('Invalid email or password')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('T-005: Remember me checkbox', { tag: '@P1' }, async ({ page }) => {
    // Arrange
    const email = 'test@example.com';
    const password = process.env.TEST_PASSWORD || 'password123';

    // Act
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByLabel('Remember me').check();
    await page.getByRole('button', { name: 'Login' }).click();

    // Assert
    await expect(page).toHaveURL(/\/account\/profile/);
    // Verify session persists (check cookie)
  });
});
```

### test-plan.json

```json
{
  "project": "E-Commerce Platform",
  "generated": "2026-01-15T10:30:00Z",
  "summary": {
    "total": 24,
    "P0": 12,
    "P1": 8,
    "P2": 4,
    "coverage": 92
  },
  "tests": [
    {
      "id": "T-001",
      "name": "Login with valid credentials",
      "feature": "F-001",
      "priority": "P0",
      "type": "happy-path",
      "file": "auth/login.spec.ts",
      "steps": [
        { "action": "Navigate to /login", "selector": null },
        { "action": "Fill email", "selector": "getByLabel('Email')" },
        { "action": "Fill password", "selector": "getByLabel('Password')" },
        { "action": "Click login", "selector": "getByRole('button', { name: 'Login' })" }
      ],
      "expected": "Redirect to /account/profile",
      "dependencies": []
    }
  ]
}
```

### coverage-matrix.md

```markdown
# Test Coverage Matrix

**Project**: E-Commerce Platform  
**Generated**: 2026-01-15T10:30:00Z  
**Coverage**: 92% (23/25 requirements)

## Features

### F-001: User Authentication (P0)
| Requirement | Test ID | Status |
|-------------|---------|--------|
| Users can register with email and password | T-010, T-011 | ✓ Covered |
| Password must be at least 8 characters | T-012 | ✓ Covered |
| Users can login with email and password | T-001, T-002, T-003, T-004 | ✓ Covered |
| Failed login attempts are logged | - | ✗ Not testable from UI |
| Users can reset their password via email | T-015 | ✓ Covered |

### F-002: Product Catalog (P1)
| Requirement | Test ID | Status |
|-------------|---------|--------|
| Products are displayed in a grid layout | T-020 | ✓ Covered |
| Each product shows image, name, price | T-020 | ✓ Covered |
| Users can filter products by category | T-021 | ✓ Covered |
| Users can search products by name | T-022 | ✓ Covered |
| Product details page shows full information | T-023 | ✓ Covered |

## Untested Requirements

1. **F-001**: Failed login attempts are logged
   - Reason: Not testable from UI (requires backend verification)
   
2. **F-005**: Order status updates are tracked
   - Reason: Requires multiple sessions and time delay

## Summary

- **Total Requirements**: 25
- **Covered**: 23 (92%)
- **Not Testable**: 1 (4%)
- **Deferred**: 1 (4%)
```

## Usage

```bash
# Generate tests from requirements and DOM
@test-generation requirements.json playwright-output/dom-snapshot.json

# Specify output directory
@test-generation requirements.json dom-snapshot.json my-tests/
```

## Agent Workflow

1. Agent reads requirements.json
2. Agent reads dom-snapshot.json
3. Agent identifies testable requirements
4. Agent maps requirements to DOM elements
5. Agent generates test cases for each feature
6. Agent creates .spec.ts files with Playwright syntax
7. Agent generates test-plan.json
8. Agent generates coverage-matrix.md
9. Agent validates tests with `npx playwright test --list`

## Validation

The skill validates:
- Requirements file exists and is valid JSON
- DOM snapshot exists and is valid JSON
- At least one test is generated
- All selectors exist in DOM snapshot (or flagged as unverified)
- Test files pass `npx playwright test --list`

## Error Handling

- **Requirements not found**: Error with file path
- **DOM snapshot not found**: Error with file path
- **No testable requirements**: Warning, generate placeholder tests
- **Selector not in DOM**: Flag as `[UNVERIFIED]`, continue
- **Test validation fails**: Error with validation output

## Integration with Other Skills

This skill uses:
- **Skill 1 (Requirement Analysis)**: requirements.json input
- **Skill 3 (Playwright MCP)**: dom-snapshot.json input

This skill feeds into:
- **Skill 5 (Execution)**: Executes generated test files
- **Skill 6 (Reporting)**: Uses test plan and coverage matrix

## Limitations

- **No test execution**: Only generates test files
- **No authentication setup**: Tests assume clean state
- **No test data management**: Tests use hardcoded or env var data
- **No parallel execution**: Tests are sequential by default

## Files

- `.opencode/skills/test-generation/SKILL.md` - This skill definition
- `skills/README-skill4.md` - Documentation
