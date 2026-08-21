/**
 * Test Templates — Playwright test generators for common patterns
 *
 * Each template takes a feature + matched selectors and produces
 * a syntactically valid .spec.ts test block. Selectors are always
 * grounded in observed DOM (from selectors.json) — never invented.
 */

const TEST_BOILERPLACE = `import { test, expect } from '@playwright/test';`;

function escapeQuote(str) {
  return (str || '').replace(/'/g, "\\'").replace(/\n/g, ' ');
}

export function formSubmissionTest({ feature, page, selectors, acceptanceCriteria }) {
  const testName = `${feature.name}: ${acceptanceCriteria.summary || 'form submission'}`;
  const inputs = selectors.filter(s => s.tag === 'input' || s.tag === 'textarea' || s.tag === 'select');
  const buttons = selectors.filter(s => s.tag === 'button');
  const submitButton = buttons[0] || inputs.find(i => i.type === 'submit');
  const fillSteps = inputs.slice(0, 3).map((input, i) => {
    const value = input.type === 'email' ? 'test@example.com'
      : input.type === 'password' ? 'TestPassword123!'
      : input.type === 'number' ? '42'
      : `test-value-${i + 1}`;
    return `  await page.${input.selector}.fill('${value}');`;
  }).join('\n');
  const clickStep = submitButton
    ? `  await page.${submitButton.selector}.click();`
    : `  await page.keyboard.press('Enter');`;
  return `test('${escapeQuote(testName)}', async ({ page }) => {
  await page.goto('${page.url}');
${fillSteps}
${clickStep}
  await page.waitForLoadState('networkidle');
  // TODO: Add assertion based on acceptance criteria
  // Criteria: ${escapeQuote(acceptanceCriteria.text || acceptanceCriteria.summary || '')}
});`;
}

export function navigationTest({ feature, page, selectors, acceptanceCriteria }) {
  const testName = `${feature.name}: ${acceptanceCriteria.summary || 'navigation'}`;
  const links = selectors.filter(s => s.tag === 'a' && s.selector);
  const targetLink = links[0];
  if (!targetLink) {
    return `test('${escapeQuote(testName)} [UNVERIFIED]', async ({ page }) => {
  await page.goto('${page.url}');
  // [UNVERIFIED] No links found in captured DOM for this feature
  // Criteria: ${escapeQuote(acceptanceCriteria.text || '')}
});`;
  }
  return `test('${escapeQuote(testName)}', async ({ page }) => {
  await page.goto('${page.url}');
  await page.${targetLink.selector}.click();
  await page.waitForLoadState('networkidle');
  // TODO: Assert navigation result
  // Criteria: ${escapeQuote(acceptanceCriteria.text || '')}
});`;
}

export function toggleTest({ feature, page, selectors, acceptanceCriteria }) {
  const testName = `${feature.name}: ${acceptanceCriteria.summary || 'toggle'}`;
  const checkboxes = selectors.filter(s => s.type === 'checkbox' || s.label?.toLowerCase().includes('complete'));
  const checkbox = checkboxes[0];
  if (!checkbox) {
    return `test('${escapeQuote(testName)} [UNVERIFIED]', async ({ page }) => {
  await page.goto('${page.url}');
  // [UNVERIFIED] No checkbox/toggle found in captured DOM
  // Criteria: ${escapeQuote(acceptanceCriteria.text || '')}
});`;
  }
  return `test('${escapeQuote(testName)}', async ({ page }) => {
  await page.goto('${page.url}');
  await page.${checkbox.selector}.click();
  // TODO: Assert state change
  // Criteria: ${escapeQuote(acceptanceCriteria.text || '')}
});`;
}

export function filterTest({ feature, page, selectors, acceptanceCriteria }) {
  const testName = `${feature.name}: ${acceptanceCriteria.summary || 'filter'}`;
  const filterLinks = selectors.filter(s => s.tag === 'a' && s.selector &&
    (s.label?.toLowerCase().includes('all') ||
     s.label?.toLowerCase().includes('active') ||
     s.label?.toLowerCase().includes('completed')));
  if (filterLinks.length === 0) {
    return `test('${escapeQuote(testName)} [UNVERIFIED]', async ({ page }) => {
  await page.goto('${page.url}');
  // [UNVERIFIED] No filter controls found in captured DOM
  // Criteria: ${escapeQuote(acceptanceCriteria.text || '')}
});`;
  }
  const filterClicks = filterLinks.slice(0, 3).map(link =>
    `  await page.${link.selector}.click();
  await page.waitForTimeout(500);`
  ).join('\n');
  return `test('${escapeQuote(testName)}', async ({ page }) => {
  await page.goto('${page.url}');
${filterClicks}
  // TODO: Assert filtered results
  // Criteria: ${escapeQuote(acceptanceCriteria.text || '')}
});`;
}

export function clearActionTest({ feature, page, selectors, acceptanceCriteria }) {
  const testName = `${feature.name}: ${acceptanceCriteria.summary || 'clear action'}`;
  const clearButton = selectors.find(s =>
    s.tag === 'button' &&
    (s.label?.toLowerCase().includes('clear') || s.label?.toLowerCase().includes('remove'))
  );
  if (!clearButton) {
    return `test('${escapeQuote(testName)} [UNVERIFIED]', async ({ page }) => {
  await page.goto('${page.url}');
  // [UNVERIFIED] No clear/remove button found in captured DOM
  // Criteria: ${escapeQuote(acceptanceCriteria.text || '')}
});`;
  }
  return `test('${escapeQuote(testName)}', async ({ page }) => {
  await page.goto('${page.url}');
  await page.${clearButton.selector}.click();
  await page.waitForLoadState('networkidle');
  // TODO: Assert items cleared
  // Criteria: ${escapeQuote(acceptanceCriteria.text || '')}
});`;
}

export function detectTestPattern(criteriaText) {
  const text = (criteriaText || '').toLowerCase();
  if (text.includes('fill') || text.includes('enter') || text.includes('type') || text.includes('register') || text.includes('login') || text.includes('submit')) return 'form';
  if (text.includes('click') && (text.includes('link') || text.includes('navigate') || text.includes('redirect'))) return 'navigation';
  if (text.includes('checkbox') || text.includes('toggle') || text.includes('complete') || text.includes('mark')) return 'toggle';
  if (text.includes('filter') || (text.includes('all') && text.includes('active'))) return 'filter';
  if (text.includes('clear') || text.includes('remove') || text.includes('delete')) return 'clear';
  if (text.includes('click')) return 'navigation';
  return 'form';
}

export function generateSpecFile({ feature, page, selectors }) {
  const priorityTag = `@${feature.priority || 'P1'}`;
  const testBlocks = (feature.acceptance_criteria || []).map((criteria, i) => {
    const criteriaText = typeof criteria === 'string' ? criteria : (criteria.text || criteria);
    const pattern = detectTestPattern(criteriaText);
    const context = {
      feature,
      page,
      selectors,
      acceptanceCriteria: { text: criteriaText, summary: criteriaText.slice(0, 60) },
    };
    let testBlock;
    switch (pattern) {
      case 'form': testBlock = formSubmissionTest(context); break;
      case 'navigation': testBlock = navigationTest(context); break;
      case 'toggle': testBlock = toggleTest(context); break;
      case 'filter': testBlock = filterTest(context); break;
      case 'clear': testBlock = clearActionTest(context); break;
      default: testBlock = formSubmissionTest(context);
    }
    return testBlock;
  }).join('\n\n');

  const fileName = feature.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `feature-${feature.id}`;
  const describeBlock = `test.describe('${escapeQuote(feature.name)} ${priorityTag}', () => {\n${testBlocks}\n});`;
  const specContent = `${TEST_BOILERPLACE}\n\n${describeBlock}\n`;
  return { fileName: `${fileName}.spec.ts`, content: specContent };
}

export { escapeQuote };
