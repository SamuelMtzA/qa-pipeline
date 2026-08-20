#!/usr/bin/env node

/**
 * QA Pipeline Orchestrator
 *
 * Coordinates the execution of all 6 QA skills in sequence:
 * 1. Requirement Analysis (PRD.md -> requirements.json)        - pure code
 * 2. Exploratory Testing (URL -> exploration.md)                - agent (skipped if QA_AGENT=none)
 * 3. Playwright Capture (URL -> DOM, screenshots, console, net) - pure code
 * 4. Test Generation (requirements + DOM -> .spec.ts files)     - agent (skipped if QA_AGENT=none)
 * 5. Test Execution (run tests -> pass/fail, evidence)          - pure code
 * 6. Reporting (all artifacts -> qa-report.md/json)             - pure code
 *
 * With QA_AGENT=none (default), Skills 1/3/5/6 run without any
 * agent runtime installed. Skills 2/4 are skipped gracefully.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

import { createConfig, writeConfig } from './skills/_shared/run-config.js';
import { loadAll, saveAll, decay, recordRun } from './skills/_shared/memory.js';
import { runAgent, getAdapter } from './skills/_shared/agent-runner.js';
import { generateReport } from './skills/reporting.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m', bright: '\x1b[1m', dim: '\x1b[2m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m',
};

function log(message, color = 'reset') { console.log(`${colors[color]}${message}${colors.reset}`); }
function logStep(step, total, message) { log(`\n[${step}/${total}] ${message}`, 'cyan'); log('─'.repeat(60), 'dim'); }
function logSuccess(message) { log(`✓ ${message}`, 'green'); }
function logError(message) { log(`✗ ${message}`, 'red'); }
function logWarning(message) { log(`⚠ ${message}`, 'yellow'); }
function logInfo(message) { log(`ℹ ${message}`, 'blue'); }

const BLAST_RADIUS_PRESETS = {
  'read-only': ['read', 'navigate'],
  'read-click': ['read', 'navigate', 'click'],
  'read-submit': ['read', 'navigate', 'click', 'submit'],
  'full': ['read', 'navigate', 'click', 'submit', 'delete', 'purchase'],
};

function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
QA Pipeline Orchestrator

Runs the QA pipeline end-to-end. With QA_AGENT=none (default), Skills
1/3/5/6 execute as pure code. Skills 2/4 are skipped (require an agent).
Set QA_AGENT=opencode for full coverage via OpenCode sub-agents.

Usage:
  qa-pipeline <url> [options]

Arguments:
  url                    The URL of the web application to test

Options:
  --prd <path>           Path to PRD markdown file (optional)
  --output <dir>         Output directory (default: .qa-workspace)
  --blast-radius <preset> Safety level: read-only, read-click, read-submit, full
                         (default: read-only)
  --skip-exploration     Skip Skill 2 (exploratory testing)
  --skip-capture         Skip Skill 3 (Playwright capture)
  --skip-execution       Skip Skill 5 (test execution)
  --agent <adapter>      Override QA_AGENT env var: none, opencode, claude-code, codex
  -h, --help             Show this help message

Environment:
  QA_AGENT               Agent adapter (none|opencode|claude-code|codex), default: none

Examples:
  qa-pipeline https://example.com
  qa-pipeline https://example.com --prd docs/PRD.md --blast-radius read-click
  QA_AGENT=opencode qa-pipeline https://example.com
`);
    process.exit(0);
  }

  const config = {
    url: null,
    prdPath: null,
    outputDir: '.qa-workspace',
    blastRadiusPreset: 'read-only',
    skipExploration: false,
    skipCapture: false,
    skipExecution: false,
    agentOverride: null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--prd' && args[i + 1]) config.prdPath = args[++i];
    else if (arg === '--output' && args[i + 1]) config.outputDir = args[++i];
    else if (arg === '--blast-radius' && args[i + 1]) config.blastRadiusPreset = args[++i];
    else if (arg === '--skip-exploration') config.skipExploration = true;
    else if (arg === '--skip-capture') config.skipCapture = true;
    else if (arg === '--skip-execution') config.skipExecution = true;
    else if (arg === '--agent' && args[i + 1]) config.agentOverride = args[++i];
    else if (!arg.startsWith('--') && !config.url) config.url = arg;
  }

  if (!config.url) { logError('URL is required'); process.exit(1); }

  if (!BLAST_RADIUS_PRESETS[config.blastRadiusPreset]) {
    logError(`Invalid blast-radius: ${config.blastRadiusPreset}. Valid: ${Object.keys(BLAST_RADIUS_PRESETS).join(', ')}`);
    process.exit(1);
  }

  return config;
}

function createWorkspace(outputDir, runId) {
  const workspace = path.join(outputDir, runId);
  logInfo(`Creating workspace: ${workspace}`);
  fs.mkdirSync(workspace, { recursive: true });
  fs.mkdirSync(path.join(workspace, 'requirements'), { recursive: true });
  fs.mkdirSync(path.join(workspace, 'exploration'), { recursive: true });
  fs.mkdirSync(path.join(workspace, 'playwright-output'), { recursive: true });
  fs.mkdirSync(path.join(workspace, 'playwright', 'scripts'), { recursive: true });
  fs.mkdirSync(path.join(workspace, 'test-results'), { recursive: true });
  fs.mkdirSync(path.join(workspace, 'reports'), { recursive: true });
  return workspace;
}

function runRequirementAnalysis(workspace, prdPath) {
  logStep(1, 6, 'Requirement Analysis');
  if (!prdPath) { logWarning('No PRD provided, skipping requirement analysis'); return null; }
  if (!fs.existsSync(prdPath)) { logError(`PRD file not found: ${prdPath}`); return null; }

  const requirementsPath = path.join(workspace, 'requirements', 'requirements.json');
  try {
    logInfo(`Analyzing PRD: ${prdPath}`);
    const scriptPath = path.join(__dirname, 'skills', 'requirement-analysis.js');
    execSync(`node "${scriptPath}" "${prdPath}" "${requirementsPath}"`, { stdio: 'inherit' });
    logSuccess(`Requirements saved to: ${requirementsPath}`);
    return requirementsPath;
  } catch (error) {
    logError('Requirement analysis failed');
    console.error(error.message);
    return null;
  }
}

async function runExploratoryTesting(workspace, cliConfig, runConfig, skip) {
  logStep(2, 6, 'Exploratory Testing');
  if (skip) { logWarning('Skipping exploratory testing (--skip-exploration)'); return { skipped: true }; }

  const adapter = cliConfig.agentOverride || getAdapter();
  const result = await runAgent('exploratory-testing', {
    run_id: runConfig.run_id,
    target_url: runConfig.url,
    workspace: workspace,
  }, { adapter });

  if (result.skipped) {
    logWarning(`Exploratory testing skipped: ${result.reason}`);
  } else if (result.success) {
    logSuccess(`Exploratory testing complete`);
  } else {
    logWarning(`Exploratory testing: ${result.error || 'failed'}`);
  }
  return result;
}

async function runPlaywrightCapture(workspace, runConfig, memoryData, skip) {
  logStep(3, 6, 'Playwright Capture');
  if (skip) { logWarning('Skipping Playwright capture (--skip-capture)'); return { skipped: true }; }

  try {
    const { runCapture } = await import('./skills/playwright-capture.js');
    logInfo(`Target URL: ${runConfig.url}`);
    logInfo(`Blast radius: ${runConfig.blast_radius.allowed_actions.join(', ')}`);
    const result = await runCapture({ config: runConfig, workspaceDir: workspace, memoryData });
    logSuccess(`Capture complete: ${result.pagesVisited} pages, ${result.selectorsExtracted} selectors, ${result.consoleErrors} console errors`);
    return result;
  } catch (error) {
    logWarning(`Playwright capture failed: ${error.message}`);
    logInfo('Install Playwright: npm install && npx playwright install chromium');
    return { failed: true, error: error.message };
  }
}

async function runTestGeneration(workspace, requirementsPath, captureResult, cliConfig, runConfig) {
  logStep(4, 6, 'Test Generation');

  const hasDom = captureResult && captureResult.domSnapshotPath && fs.existsSync(captureResult.domSnapshotPath);
  if (!requirementsPath || !fs.existsSync(requirementsPath)) {
    logWarning('No requirements.json found, skipping test generation');
    return { skipped: true };
  }
  if (!hasDom) {
    logWarning('No DOM snapshot found (capture was skipped or failed)');
  }

  const adapter = cliConfig.agentOverride || getAdapter();
  const result = await runAgent('test-generation', {
    run_id: runConfig.run_id,
    workspace: workspace,
    feature_map_path: requirementsPath,
    dom_snapshot_path: captureResult?.domSnapshotPath || null,
  }, { adapter });

  if (result.skipped) {
    logWarning(`Test generation skipped: ${result.reason}`);
  } else if (result.success) {
    logSuccess(`Test generation complete`);
  } else {
    logWarning(`Test generation: ${result.error || 'failed'}`);
  }
  return result;
}

async function runTestExecutionSkill(workspace, scriptsDir, runConfig, skip) {
  logStep(5, 6, 'Test Execution');
  if (skip) { logWarning('Skipping test execution (--skip-execution)'); return { skipped: true }; }

  try {
    const { runTestExecution } = await import('./skills/test-execution.js');
    const result = await runTestExecution({ workspaceDir: workspace, scriptsDir, config: runConfig });
    if (result.tests_total > 0) {
      logSuccess(`Tests: ${result.tests_passed}/${result.tests_total} passed, ${result.tests_failed} failed`);
    } else {
      logInfo(`No tests executed: ${result.note || 'unknown reason'}`);
    }
    return result;
  } catch (error) {
    logWarning(`Test execution failed: ${error.message}`);
    return { failed: true, error: error.message, tests_total: 0, tests_passed: 0, tests_failed: 0 };
  }
}

async function runReportingSkill(workspace, runConfig, captureResult, executionResult, skillsRun, skillsSkipped) {
  logStep(6, 6, 'Reporting');
  try {
    const featureMapPath = path.join(workspace, 'requirements', 'requirements.json');
    let featureMap = null;
    if (fs.existsSync(featureMapPath)) {
      featureMap = JSON.parse(fs.readFileSync(featureMapPath, 'utf-8'));
    }

    const results = {
      tests_total: executionResult?.tests_total || 0,
      tests_passed: executionResult?.tests_passed || 0,
      tests_failed: executionResult?.tests_failed || 0,
      covered_requirements: captureResult?.selectorsExtracted || 0,
    };

    const bugTickets = [];
    if (captureResult?.consoleErrors > 0) {
      bugTickets.push({
        id: 'CONSOLE-001',
        severity: captureResult.consoleErrors > 5 ? 'major' : 'minor',
        title: `${captureResult.consoleErrors} console errors detected during capture`,
      });
    }

    const report = generateReport({
      config: runConfig,
      featureMap,
      results,
      bugTickets,
      skillsRun,
      skillsSkipped,
      workspaceDir: workspace,
    });

    logSuccess(`Report generated: ${report.reportMdPath}`);
    log(`   Verdict: ${report.verdict} | Health: ${report.healthScore}/10`, 'bright');
    return report;
  } catch (error) {
    logError(`Reporting failed: ${error.message}`);
    return { failed: true, error: error.message };
  }
}

async function main() {
  log('\n' + '='.repeat(60), 'bright');
  log('QA Pipeline Orchestrator', 'bright');
  log('='.repeat(60) + '\n', 'bright');

  const cliConfig = parseArgs();
  const adapter = cliConfig.agentOverride || getAdapter();

  log('Configuration:', 'bright');
  log(`  URL: ${cliConfig.url}`, 'dim');
  log(`  PRD: ${cliConfig.prdPath || '(none)'}`, 'dim');
  log(`  Output: ${cliConfig.outputDir}`, 'dim');
  log(`  Blast Radius: ${cliConfig.blastRadiusPreset} (${BLAST_RADIUS_PRESETS[cliConfig.blastRadiusPreset].join(', ')})`, 'dim');
  log(`  Agent: ${adapter}`, 'dim');

  const skipList = [
    cliConfig.skipExploration && 'exploration',
    cliConfig.skipCapture && 'capture',
    cliConfig.skipExecution && 'execution',
  ].filter(Boolean);
  log(`  Skip: ${skipList.join(', ') || '(none)'}`, 'dim');

  const runId = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const workspace = createWorkspace(cliConfig.outputDir, runId);

  const memoryDir = path.join(__dirname, 'memory');
  logInfo('Loading memory...');
  const memoryData = loadAll(memoryDir);
  decay(memoryData);

  const runConfig = createConfig({
    run_id: runId,
    url: cliConfig.url,
    prd_path: cliConfig.prdPath,
    blast_radius: {
      allowed_actions: BLAST_RADIUS_PRESETS[cliConfig.blastRadiusPreset],
      forbidden_routes: [],
      max_depth: 5,
      artifacts_to_capture: ['dom', 'screenshot', 'console', 'network'],
    },
  });

  const configPath = writeConfig(workspace, runConfig);
  logSuccess(`Run config written: ${configPath}`);

  log('\n' + '═'.repeat(60), 'bright');
  log('Starting QA Pipeline', 'bright');
  log('═'.repeat(60), 'bright');

  const skillsRun = [];
  const skillsSkipped = [];

  const requirementsPath = runRequirementAnalysis(workspace, cliConfig.prdPath);
  if (requirementsPath) skillsRun.push('Skill 1: Requirement Analysis');
  else skillsSkipped.push('Skill 1: Requirement Analysis (no PRD)');

  const explorationResult = await runExploratoryTesting(workspace, cliConfig, runConfig, cliConfig.skipExploration);
  if (explorationResult.skipped) skillsSkipped.push('Skill 2: Exploratory Testing');
  else skillsRun.push('Skill 2: Exploratory Testing');

  const captureResult = await runPlaywrightCapture(workspace, runConfig, memoryData, cliConfig.skipCapture);
  if (captureResult.skipped) skillsSkipped.push('Skill 3: Playwright Capture');
  else if (captureResult.failed) skillsSkipped.push('Skill 3: Playwright Capture (failed)');
  else skillsRun.push('Skill 3: Playwright Capture');

  const scriptsDir = path.join(workspace, 'playwright', 'scripts');
  const generationResult = await runTestGeneration(workspace, requirementsPath, captureResult, cliConfig, runConfig);
  if (generationResult.skipped) skillsSkipped.push('Skill 4: Test Generation');
  else skillsRun.push('Skill 4: Test Generation');

  const executionResult = await runTestExecutionSkill(workspace, scriptsDir, runConfig, cliConfig.skipExecution);
  if (executionResult.skipped) skillsSkipped.push('Skill 5: Test Execution');
  else skillsRun.push('Skill 5: Test Execution');

  const reportResult = await runReportingSkill(workspace, runConfig, captureResult, executionResult, skillsRun, skillsSkipped);
  skillsRun.push('Skill 6: Reporting');

  logInfo('Saving memory...');
  recordRun(memoryData, runId, cliConfig.url, reportResult.verdict || 'INCONCLUSIVE', reportResult.healthScore || 0, skillsRun, skillsSkipped);
  saveAll(memoryDir, memoryData);

  log('\n' + '═'.repeat(60), 'bright');
  log('Pipeline Complete', 'bright');
  log('═'.repeat(60), 'bright');

  log('\nWorkspace:', 'bright');
  log(`  ${workspace}`, 'dim');

  log('\nVerdict:', 'bright');
  log(`  ${reportResult.verdict || 'INCONCLUSIVE'} | Health: ${reportResult.healthScore || 0}/10`, 'bright');

  if (skillsSkipped.length > 0) {
    log(`\n  ⚠ Partial run — ${skillsSkipped.length} skill(s) skipped:`, 'yellow');
    for (const s of skillsSkipped) log(`    - ${s}`, 'dim');
    log('  Set QA_AGENT=opencode for full coverage.', 'dim');
  }

  log('\nArtifacts:', 'bright');
  if (requirementsPath && fs.existsSync(requirementsPath)) logSuccess(`Requirements: ${requirementsPath}`);
  if (captureResult?.outputDir) logSuccess(`Capture: ${captureResult.outputDir}`);
  if (executionResult?.resultsPath) logSuccess(`Results: ${executionResult.resultsPath}`);
  if (reportResult?.reportMdPath) logSuccess(`Report: ${reportResult.reportMdPath}`);

  log('\n' + '─'.repeat(60), 'dim');
  log('Next Steps:', 'bright');
  if (adapter === 'none' && skillsSkipped.length > 0) {
    log('1. For full pipeline: QA_AGENT=opencode node orchestrator.js <url>', 'dim');
  } else {
    log('1. Review report: cat ' + (reportResult?.reportMdPath || '<report-path>'), 'dim');
  }
  log('2. Re-run tests: npx playwright test', 'dim');
  log('─'.repeat(60) + '\n', 'dim');
}

main().catch(error => {
  logError('Pipeline failed');
  console.error(error);
  process.exit(1);
});
