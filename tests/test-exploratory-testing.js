#!/usr/bin/env node

/**
 * Test script for exploratory-testing skill
 * Validates the exploration report structure
 */

import fs from 'fs';

const explorationPath = process.argv[2] || 'exploration.md';

if (!fs.existsSync(explorationPath)) {
  console.error(`Error: ${explorationPath} not found`);
  process.exit(1);
}

const content = fs.readFileSync(explorationPath, 'utf-8');

let passed = 0;
let failed = 0;

function test(name, condition) {
  if (condition) {
    console.log(`✓ ${name}`);
    passed++;
  } else {
    console.error(`✗ ${name}`);
    failed++;
  }
}

// Test required sections
test('Has title', content.includes('# Exploratory Testing Report'));
test('Has URL', content.includes('**URL**:'));
test('Has date', content.includes('**Date**:'));
test('Has Application Overview section', content.includes('## Application Overview'));
test('Has Pages Discovered section', content.includes('## Pages Discovered'));
test('Has Navigation Structure section', content.includes('## Navigation Structure'));
test('Has Forms Identified section', content.includes('## Forms Identified'));
test('Has Interactive Elements section', content.includes('## Interactive Elements'));
test('Has User Flows Tested section', content.includes('## User Flows Tested'));
test('Has Visual Observations section', content.includes('## Visual Observations'));
test('Has Issues Found section', content.includes('## Issues Found'));
test('Has Screenshots section', content.includes('## Screenshots'));
test('Has Recommendations section', content.includes('## Recommendations'));
test('Has Next Steps section', content.includes('## Next Steps'));
test('Has Summary section', content.includes('## Summary'));

// Test content quality
test('Has at least 3 pages discovered', (content.match(/### \d+\. /g) || []).length >= 3);
test('Has at least 2 forms identified', (content.match(/### \d+\. .* Form/g) || []).length >= 2);
test('Has at least 2 user flows tested', (content.match(/### Flow \d+:/g) || []).length >= 2);
test('Has screenshots referenced', content.includes('screenshots/'));
test('Has responsive testing', content.includes('Desktop') && content.includes('Tablet') && content.includes('Mobile'));

// Test issue categorization
test('Has Critical Issues subsection', content.includes('### Critical Issues'));
test('Has Major Issues subsection', content.includes('### Major Issues'));
test('Has Minor Issues subsection', content.includes('### Minor Issues'));

// Test summary metrics
test('Has Pages Explored count', content.includes('**Pages Explored**:'));
test('Has Forms Identified count', content.includes('**Forms Identified**:'));
test('Has User Flows Tested count', content.includes('**User Flows Tested**:'));
test('Has Critical Issues count', content.includes('**Critical Issues**:'));
test('Has Major Issues count', content.includes('**Major Issues**:'));
test('Has Minor Issues count', content.includes('**Minor Issues**:'));

console.log('');
console.log(`Tests: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
