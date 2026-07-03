#!/usr/bin/env node

/**
 * Test script for requirement-analysis skill
 * Validates the output structure and content
 */

import fs from 'fs';

const requirementsPath = process.argv[2] || 'requirements.json';

if (!fs.existsSync(requirementsPath)) {
  console.error(`Error: ${requirementsPath} not found`);
  process.exit(1);
}

const requirements = JSON.parse(fs.readFileSync(requirementsPath, 'utf-8'));

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

// Test structure
test('Has project object', requirements.project !== undefined);
test('Has project name', requirements.project.name !== undefined && requirements.project.name.length > 0);
test('Has project description', requirements.project.description !== undefined);
test('Has features array', Array.isArray(requirements.features));
test('Has at least one feature', requirements.features.length > 0);

// Test each feature
requirements.features.forEach((feature, index) => {
  test(`Feature ${index + 1} has id`, feature.id !== undefined && feature.id.startsWith('F-'));
  test(`Feature ${index + 1} has name`, feature.name !== undefined && feature.name.length > 0);
  test(`Feature ${index + 1} has description`, feature.description !== undefined);
  test(`Feature ${index + 1} has requirements array`, Array.isArray(feature.requirements));
  test(`Feature ${index + 1} has acceptance_criteria array`, Array.isArray(feature.acceptance_criteria));
  test(`Feature ${index + 1} has priority`, ['P0', 'P1', 'P2'].includes(feature.priority));
  test(`Feature ${index + 1} has at least one requirement`, feature.requirements.length > 0);
});

// Test specific content
test('User Authentication is P0', requirements.features.find(f => f.name === 'User Authentication')?.priority === 'P0');
test('Has 5 features', requirements.features.length === 5);

console.log('');
console.log(`Tests: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
