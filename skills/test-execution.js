/**
 * Skill 5: Test Execution — pure code implementation
 *
 * Runs `npx playwright test` against generated .spec.ts files,
 * captures results, and writes a structured results.json.
 *
 * If no test scripts exist (e.g., QA_AGENT=none skipped test
 * generation), produces an empty result set with a note.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Run Playwright tests and capture results.
 */
export async function runTestExecution({ workspaceDir, scriptsDir, config }) {
  const resultsDir = path.join(workspaceDir, '07-execution');
  fs.mkdirSync(resultsDir, { recursive: true });

  if (!scriptsDir || !fs.existsSync(scriptsDir)) {
    return writeEmptyResults(resultsDir, 'No test scripts directory found');
  }

  const testFiles = findTestFiles(scriptsDir);

  if (testFiles.length === 0) {
    return writeEmptyResults(resultsDir, 'No .spec.ts files found — test generation was skipped (requires QA_AGENT)');
  }

  const configPath = ensurePlaywrightConfig(scriptsDir, config);

  try {
    const jsonReportPath = path.join(resultsDir, 'playwright-report.json');
    const cmd = `npx playwright test --config="${configPath}" --reporter=json --output="${resultsDir}" 2>&1 || true`;

    let rawOutput;
    try {
      rawOutput = execSync(cmd, {
        cwd: scriptsDir,
        encoding: 'utf-8',
        timeout: 300000,
        env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: jsonReportPath },
      });
    } catch (err) {
      rawOutput = err.stdout || err.message;
    }

    let playwrightResults = null;
    if (fs.existsSync(jsonReportPath)) {
      playwrightResults = JSON.parse(fs.readFileSync(jsonReportPath, 'utf-8'));
    }

    const summary = parseResults(playwrightResults, rawOutput, testFiles);

    const resultsPath = path.join(resultsDir, 'results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(summary, null, 2));

    const summaryMdPath = path.join(resultsDir, 'summary.md');
    fs.writeFileSync(summaryMdPath, formatSummaryMd(summary));

    return {
      resultsDir,
      resultsPath,
      ...summary,
    };
  } catch (error) {
    return writeEmptyResults(resultsDir, `Test execution failed: ${error.message}`);
  }
}

function findTestFiles(scriptsDir) {
  const files = [];
  function scan(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (entry.name.endsWith('.spec.ts')) {
        files.push(fullPath);
      }
    }
  }
  if (fs.existsSync(scriptsDir)) scan(scriptsDir);
  return files;
}

function ensurePlaywrightConfig(scriptsDir, config) {
  const configPath = path.join(scriptsDir, 'playwright.config.ts');
  if (fs.existsSync(configPath)) return configPath;

  const parentConfig = path.join(path.dirname(scriptsDir), 'playwright.config.ts');
  if (fs.existsSync(parentConfig)) return parentConfig;

  const fallbackConfig = `import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: '${config.url}',
    headless: true,
    viewport: { width: 1440, height: 900 },
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
});
`;
  fs.writeFileSync(configPath, fallbackConfig);
  return configPath;
}

function parseResults(playwrightResults, rawOutput, testFiles) {
  if (playwrightResults) {
    const suites = playwrightResults.suites || [];
    let total = 0, passed = 0, failed = 0, skipped = 0;
    const failures = [];

    function walkSuite(suite) {
      for (const spec of suite.specs || []) {
        total++;
        const lastResult = spec.tests?.[0]?.results?.[0];
        if (!lastResult) {
          skipped++;
        } else if (lastResult.status === 'passed') {
          passed++;
        } else if (lastResult.status === 'failed') {
          failed++;
          failures.push({
            title: spec.title,
            file: spec.file,
            error: lastResult.error?.message?.slice(0, 500),
          });
        } else {
          skipped++;
        }
      }
      for (const child of suite.suites || []) walkSuite(child);
    }

    for (const suite of suites) walkSuite(suite);

    return {
      tests_total: total,
      tests_passed: passed,
      tests_failed: failed,
      tests_skipped: skipped,
      duration_seconds: Math.round((playwrightResults.stats?.duration || 0) / 1000),
      failures,
      testFiles: testFiles.length,
    };
  }

  const passed = (rawOutput.match(/(\d+) passed/g) || [])[1] || 0;
  const failed = (rawOutput.match(/(\d+) failed/g) || [])[1] || 0;
  const skipped = (rawOutput.match(/(\d+) skipped/g) || [])[1] || 0;
  const total = parseInt(passed) + parseInt(failed) + parseInt(skipped);

  return {
    tests_total: total,
    tests_passed: parseInt(passed),
    tests_failed: parseInt(failed),
    tests_skipped: parseInt(skipped),
    duration_seconds: 0,
    failures: [],
    testFiles: testFiles.length,
    note: 'Results parsed from text output (JSON reporter unavailable)',
  };
}

function formatSummaryMd(summary) {
  return `# Test Execution Summary

**Tests**: ${summary.tests_total} total, ${summary.tests_passed} passed, ${summary.tests_failed} failed, ${summary.tests_skipped} skipped
**Duration**: ${summary.duration_seconds}s
**Test Files**: ${summary.testFiles}

${summary.failures.length > 0 ? '## Failures\n\n' + summary.failures.map(f => `- **${f.title}** (${f.file}): ${f.error || 'unknown error'}`).join('\n') : 'No failures.'}
`;
}

function writeEmptyResults(resultsDir, reason) {
  const summary = {
    tests_total: 0,
    tests_passed: 0,
    tests_failed: 0,
    tests_skipped: 0,
    duration_seconds: 0,
    failures: [],
    testFiles: 0,
    note: reason,
  };
  const resultsPath = path.join(resultsDir, 'results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(summary, null, 2));
  fs.writeFileSync(path.join(resultsDir, 'summary.md'), `# Test Execution Summary\n\n**No tests run.** ${reason}\n`);
  return { resultsDir, resultsPath, ...summary };
}
