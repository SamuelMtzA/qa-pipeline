# Skill 4: Test Generation

## Overview

Generate executable Playwright test files (.spec.ts) from structured requirements and DOM snapshot data.

## Input

- **requirements.json**: Structured requirements from Skill 1
- **dom-snapshot.json**: DOM snapshot from Skill 3
- **Output Directory**: Directory to save test files (default: `playwright/scripts`)

## Output

### Test Files
- `auth/login.spec.ts` - Authentication tests
- `auth/register.spec.ts` - Registration tests
- `products/catalog.spec.ts` - Product catalog tests
- `cart/cart.spec.ts` - Shopping cart tests
- `checkout/checkout.spec.ts` - Checkout tests

### Metadata
- `test-plan.json` - Structured test plan
- `coverage-matrix.md` - Feature to test mapping

## Usage

```bash
# Generate tests from requirements and DOM
@test-generation requirements.json playwright-output/dom-snapshot.json

# Specify output directory
@test-generation requirements.json dom-snapshot.json my-tests/
```

## Test Generation Strategy

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

## Example Test

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
});
```

## Test Plan Structure

```json
{
  "project": "E-Commerce Platform",
  "generated": "2026-01-15T10:30:00Z",
  "summary": {
    "total": 40,
    "P0": 24,
    "P1": 12,
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
      "steps": [...],
      "expected": "Redirect to /account/profile",
      "dependencies": []
    }
  ]
}
```

## Coverage Matrix

The coverage matrix shows which requirements are covered by tests:

```markdown
### F-001: User Authentication (P0)

| Requirement | Test ID | Status |
|-------------|---------|--------|
| Users can register with email and password | T-010, T-011 | ✓ Covered |
| Password must be at least 8 characters | T-012 | ✓ Covered |
| Users can login with email and password | T-001, T-002, T-003, T-004 | ✓ Covered |
| Failed login attempts are logged | - | ✗ Not testable from UI |
```

## Testing

```bash
# Validate generated tests
npx playwright test --list

# Run all tests
npx playwright test

# Run specific test file
npx playwright test auth/login.spec.ts
```

## Sample Output

See `playwright/` directory for sample outputs:
- `scripts/auth/login.spec.ts` - 9 login tests
- `scripts/auth/register.spec.ts` - 8 registration tests
- `scripts/cart/cart.spec.ts` - 11 cart tests
- `test-plan.json` - Structured test plan
- `coverage-matrix.md` - Coverage analysis

## Integration with Other Skills

This skill uses:
- **Skill 1 (Requirement Analysis)**: requirements.json input
- **Skill 3 (Playwright MCP)**: dom-snapshot.json input

This skill feeds into:
- **Skill 5 (Execution)**: Executes generated test files
- **Skill 6 (Reporting)**: Uses test plan and coverage matrix

## Error Handling

- **Requirements not found**: Error with file path
- **DOM snapshot not found**: Error with file path
- **No testable requirements**: Warning, generate placeholder tests
- **Selector not in DOM**: Flag as `[UNVERIFIED]`, continue
- **Test validation fails**: Error with validation output

## Limitations

- **No test execution**: Only generates test files
- **No authentication setup**: Tests assume clean state
- **No test data management**: Tests use hardcoded or env var data
- **No parallel execution**: Tests are sequential by default

## Files

- `.opencode/skills/test-generation/SKILL.md` - Skill definition
- `playwright/scripts/` - Generated test files
- `playwright/test-plan.json` - Test plan
- `playwright/coverage-matrix.md` - Coverage matrix
- `skills/README-skill4.md` - This documentation
