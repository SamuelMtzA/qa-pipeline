# Playwright Directory

This directory contains Playwright test scripts and configuration.

## Structure

```
playwright/
├── playwright.config.ts    # Playwright configuration
├── scripts/                # Generated test scripts
│   ├── auth/
│   │   ├── login.spec.ts
│   │   └── logout.spec.ts
│   ├── search/
│   │   └── search.spec.ts
│   └── checkout/
│       └── checkout.spec.ts
├── fixtures/               # Shared test fixtures
│   ├── auth.setup.ts
│   └── test-data.ts
└── helpers/                # Shared test helpers
    └── wait-helpers.ts
```

## Running Tests

```bash
# List all tests
npm run test:list

# Run all tests
npm run test

# Run with UI mode
npm run test:ui

# Run in debug mode
npm run test:debug

# Show HTML report
npm run test:report
```

## Test Script Conventions

### File Organization
- Group by feature: `scripts/<feature>/<test-name>.spec.ts`
- Use kebab-case for filenames
- One `test.describe` block per feature

### Selectors
- Prefer role-based: `getByRole('button', { name: 'Submit' })`
- Fallback to label: `getByLabel('Email')`
- Use test IDs: `getByTestId('submit-btn')`
- Avoid: CSS classes, nth-child, XPath

### Assertions
- Use specific matchers: `toBeVisible()`, `toHaveText()`, `toHaveURL()`
- Include `waitForLoadState` before critical assertions
- Set reasonable timeouts (5s default)

### Tags
- `@P0` - Critical features (auth, checkout, core flows)
- `@P1` - Important features (search, settings, navigation)
- `@P2` - Nice-to-have (cosmetic, edge cases)

## Example Test

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('T-001: Login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill(process.env.TEST_PASS!);
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.getByText('Welcome, Test User')).toBeVisible();
  });
});
```
