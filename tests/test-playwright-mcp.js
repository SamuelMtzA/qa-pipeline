#!/usr/bin/env node

/**
 * Test script for playwright-mcp skill
 * Validates the captured page data
 */

import fs from 'fs';
import path from 'path';

const outputDir = process.argv[2] || 'playwright-output';

if (!fs.existsSync(outputDir)) {
  console.error(`Error: ${outputDir} not found`);
  process.exit(1);
}

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

// Test DOM snapshot
const domPath = path.join(outputDir, 'dom-snapshot.json');
test('DOM snapshot exists', fs.existsSync(domPath));

if (fs.existsSync(domPath)) {
  const dom = JSON.parse(fs.readFileSync(domPath, 'utf-8'));
  test('DOM has URL', dom.url !== undefined);
  test('DOM has title', dom.title !== undefined);
  test('DOM has timestamp', dom.timestamp !== undefined);
  test('DOM has viewport', dom.viewport !== undefined);
  test('DOM has elements array', Array.isArray(dom.elements));
  test('DOM has at least 1 element', dom.elements.length >= 1);
  test('DOM has forms array', Array.isArray(dom.forms));
  test('DOM has buttons array', Array.isArray(dom.buttons));
  test('DOM has inputs array', Array.isArray(dom.inputs));
  test('DOM has links array', Array.isArray(dom.links));
  test('DOM has summary', dom.summary !== undefined);
}

// Test console logs
const consolePath = path.join(outputDir, 'console-logs.json');
test('Console logs exist', fs.existsSync(consolePath));

if (fs.existsSync(consolePath)) {
  const console = JSON.parse(fs.readFileSync(consolePath, 'utf-8'));
  test('Console has URL', console.url !== undefined);
  test('Console has timestamp', console.timestamp !== undefined);
  test('Console has messages array', Array.isArray(console.messages));
  test('Console has summary', console.summary !== undefined);
  test('Console summary has errors count', console.summary.errors !== undefined);
  test('Console summary has warnings count', console.summary.warnings !== undefined);
  test('Console summary has info count', console.summary.info !== undefined);
}

// Test network requests
const networkPath = path.join(outputDir, 'network-requests.json');
test('Network requests exist', fs.existsSync(networkPath));

if (fs.existsSync(networkPath)) {
  const network = JSON.parse(fs.readFileSync(networkPath, 'utf-8'));
  test('Network has URL', network.url !== undefined);
  test('Network has timestamp', network.timestamp !== undefined);
  test('Network has requests array', Array.isArray(network.requests));
  test('Network has at least 5 requests', network.requests.length >= 5);
  test('Network has summary', network.summary !== undefined);
  test('Network summary has total count', network.summary.total !== undefined);
  test('Network summary has successful count', network.summary.successful !== undefined);
  test('Network summary has failed count', network.summary.failed !== undefined);
  test('Network summary has totalSize', network.summary.totalSize !== undefined);
  test('Network requests have URL', network.requests.every(r => r.url !== undefined));
  test('Network requests have method', network.requests.every(r => r.method !== undefined));
  test('Network requests have status', network.requests.every(r => r.status !== undefined));
}

// Test screenshots
test('Desktop screenshot exists', fs.existsSync(path.join(outputDir, 'screenshot-desktop.png')));
test('Tablet screenshot exists', fs.existsSync(path.join(outputDir, 'screenshot-tablet.png')));
test('Mobile screenshot exists', fs.existsSync(path.join(outputDir, 'screenshot-mobile.png')));

// Test summary
test('Summary report exists', fs.existsSync(path.join(outputDir, 'summary.md')));

if (fs.existsSync(path.join(outputDir, 'summary.md'))) {
  const summary = fs.readFileSync(path.join(outputDir, 'summary.md'), 'utf-8');
  test('Summary has title', summary.includes('# Playwright MCP Capture Report'));
  test('Summary has URL', summary.includes('**URL**:'));
  test('Summary has timestamp', summary.includes('**Timestamp**:'));
  test('Summary has DOM section', summary.includes('## DOM Snapshot'));
  test('Summary has screenshots section', summary.includes('## Screenshots'));
  test('Summary has console section', summary.includes('## Console Logs'));
  test('Summary has network section', summary.includes('## Network Requests'));
  test('Summary has issues section', summary.includes('## Issues Detected'));
  test('Summary has recommendations', summary.includes('## Recommendations'));
}

console.log('');
console.log(`Tests: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
