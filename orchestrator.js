#!/usr/bin/env node

/**
 * QA Pipeline Orchestrator
 * 
 * Coordinates the execution of all 6 QA skills in sequence:
 * 1. Requirement Analysis (PRD.md → requirements.json)
 * 2. Exploratory Testing (URL → exploration.md)
 * 3. Playwright MCP (URL → DOM, screenshots, console, network)
 * 4. Test Generation (requirements + DOM → .spec.ts files)
 * 5. Test Execution (run tests → pass/fail, traces, videos, screenshots)
 * 6. Reporting (all artifacts → qa-report.md/json)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, total, message) {
  log(`\n[${step}/${total}] ${message}`, 'cyan');
  log('─'.repeat(60), 'dim');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

/**
 * Parse command-line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
QA Pipeline Orchestrator

For fully automated pipeline, use OpenCode:
  @qa-orchestrator "QA my app at https://example.com with PRD at docs/prd.md"

CLI usage (manual mode — exploration, MCP, generation, and execution are manual):
  qa-pipeline <url> [options]

Arguments:
  url                    The URL of the web application to test

Options:
  --prd <path>           Path to PRD markdown file (optional)
  --output <dir>         Output directory (default: .qa-workspace)
  --skip-exploration     Skip exploratory testing (manual in CLI mode)
  --skip-execution       Skip test execution (manual in CLI mode)
  -h, --help             Show this help message

Examples:
  qa-pipeline https://example.com
  qa-pipeline https://example.com --prd docs/PRD.md
  qa-pipeline https://example.com --output my-tests
`);
    process.exit(0);
  }

  const config = {
    url: null,
    prdPath: null,
    outputDir: '.qa-workspace',
    skipExploration: false,
    skipExecution: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--prd' && args[i + 1]) {
      config.prdPath = args[++i];
    } else if (arg === '--output' && args[i + 1]) {
      config.outputDir = args[++i];
    } else if (arg === '--skip-exploration') {
      config.skipExploration = true;
    } else if (arg === '--skip-execution') {
      config.skipExecution = true;
    } else if (!arg.startsWith('--') && !config.url) {
      config.url = arg;
    }
  }

  if (!config.url) {
    logError('URL is required');
    process.exit(1);
  }

  return config;
}

/**
 * Create workspace directory structure
 */
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

/**
 * Skill 1: Requirement Analysis
 */
function runRequirementAnalysis(workspace, prdPath) {
  logStep(1, 6, 'Requirement Analysis');
  
  if (!prdPath) {
    logWarning('No PRD provided, skipping requirement analysis');
    return null;
  }

  if (!fs.existsSync(prdPath)) {
    logError(`PRD file not found: ${prdPath}`);
    return null;
  }

  const requirementsPath = path.join(workspace, 'requirements', 'requirements.json');
  
  try {
    logInfo(`Analyzing PRD: ${prdPath}`);
    
    const scriptPath = path.join(__dirname, 'skills', 'requirement-analysis.js');
    execSync(`node "${scriptPath}" "${prdPath}" "${requirementsPath}"`, {
      stdio: 'inherit',
    });
    
    logSuccess(`Requirements saved to: ${requirementsPath}`);
    return requirementsPath;
  } catch (error) {
    logError('Requirement analysis failed');
    console.error(error.message);
    return null;
  }
}

/**
 * Skill 2: Exploratory Testing
 */
function runExploratoryTesting(workspace, url, skip) {
  logStep(2, 6, 'Exploratory Testing');
  
  if (skip) {
    logWarning('Skipping exploratory testing (--skip-exploration)');
    logInfo('You can manually explore the application and create exploration.md');
    return null;
  }

  const explorationPath = path.join(workspace, 'exploration', 'exploration.md');
  
  logInfo(`Target URL: ${url}`);
  logInfo('For automated execution, run via OpenCode:');
  logInfo('  @qa-orchestrator "QA my app at https://..."');
  logInfo('The qa-explorer sub-agent automates this step with Playwright MCP.');
  logInfo(`For manual CLI mode, save your findings to: ${explorationPath}`);
  
  return explorationPath;
}

/**
 * Skill 3: Playwright MCP
 */
function runPlaywrightMCP(workspace, url) {
  logStep(3, 6, 'Playwright MCP Capture');
  
  const outputDir = path.join(workspace, 'playwright-output');
  
  logInfo(`Target URL: ${url}`);
  logInfo('For automated execution, the qa-explorer sub-agent captures DOM,');
  logInfo('screenshots, console logs, and network requests via Playwright MCP.');
  logInfo(`For manual CLI mode, save outputs to: ${outputDir}`);
  
  return outputDir;
}

/**
 * Skill 4: Test Generation
 */
function runTestGeneration(workspace, requirementsPath, playwrightOutputDir) {
  logStep(4, 6, 'Test Generation');
  
  const domSnapshotPath = path.join(playwrightOutputDir, 'dom-snapshot.json');
  
  if (!requirementsPath || !fs.existsSync(requirementsPath)) {
    logWarning('No requirements.json found, skipping test generation');
    return null;
  }

  if (!fs.existsSync(domSnapshotPath)) {
    logWarning('No dom-snapshot.json found, skipping test generation');
    logInfo('Please run Playwright MCP capture first');
    return null;
  }

  const scriptsDir = path.join(workspace, 'playwright', 'scripts');
  
  logInfo('For automated execution, the qa-generator sub-agent reconciles');
  logInfo('the feature map with the app map and generates Playwright scripts.');
  logInfo(`Requirements: ${requirementsPath}`);
  logInfo(`DOM Snapshot: ${domSnapshotPath}`);
  logInfo(`Output directory: ${scriptsDir}`);
  
  return scriptsDir;
}

/**
 * Skill 5: Test Execution
 */
function runTestExecution(workspace, scriptsDir, skip) {
  logStep(5, 6, 'Test Execution');
  
  if (skip) {
    logWarning('Skipping test execution (--skip-execution)');
    return null;
  }

  if (!scriptsDir || !fs.existsSync(scriptsDir)) {
    logWarning('No test scripts found, skipping test execution');
    return null;
  }

  const testFiles = fs.readdirSync(scriptsDir, { recursive: true })
    .filter(file => file.endsWith('.spec.ts'));

  if (testFiles.length === 0) {
    logWarning('No .spec.ts files found, skipping test execution');
    return null;
  }

  const resultsDir = path.join(workspace, 'test-results');
  
  logInfo(`Found ${testFiles.length} test files`);
  logInfo('For automated execution, the qa-runner sub-agent executes tests');
  logInfo('and captures evidence (traces, videos, screenshots).');
  logInfo(`Scripts directory: ${scriptsDir}`);
  logInfo(`Results directory: ${resultsDir}`);
  logInfo('Run tests manually with: npx playwright test');
  
  return resultsDir;
}

/**
 * Skill 6: Reporting
 */
function runReporting(workspace) {
  logStep(6, 6, 'Reporting');
  
  const reportsDir = path.join(workspace, 'reports');
  
  logInfo('Report generation is automated via the qa-reporter sub-agent');
  logInfo('Invoke @qa-orchestrator to run the full pipeline end-to-end');
  logInfo(`Reports directory: ${reportsDir}`);
  
  return reportsDir;
}

/**
 * Main orchestrator function
 */
async function main() {
  log('\n' + '='.repeat(60), 'bright');
  log('QA Pipeline Orchestrator', 'bright');
  log('='.repeat(60) + '\n', 'bright');

  const config = parseArgs();
  
  log('Configuration:', 'bright');
  log(`  URL: ${config.url}`, 'dim');
  log(`  PRD: ${config.prdPath || '(none)'}`, 'dim');
  log(`  Output: ${config.outputDir}`, 'dim');
  log(`  Skip Exploration: ${config.skipExploration}`, 'dim');
  log(`  Skip Execution: ${config.skipExecution}`, 'dim');

  // Generate run ID (timestamp)
  const runId = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  
  // Create workspace
  const workspace = createWorkspace(config.outputDir, runId);
  
  log('\n' + '═'.repeat(60), 'bright');
  log('Starting QA Pipeline', 'bright');
  log('═'.repeat(60), 'bright');

  // Execute skills in sequence
  const requirementsPath = runRequirementAnalysis(workspace, config.prdPath);
  const explorationPath = runExploratoryTesting(workspace, config.url, config.skipExploration);
  const playwrightOutputDir = runPlaywrightMCP(workspace, config.url);
  const scriptsDir = runTestGeneration(workspace, requirementsPath, playwrightOutputDir);
  const resultsDir = runTestExecution(workspace, scriptsDir, config.skipExecution);
  const reportsDir = runReporting(workspace);

  // Summary
  log('\n' + '═'.repeat(60), 'bright');
  log('Pipeline Complete', 'bright');
  log('═'.repeat(60), 'bright');
  
  log('\nWorkspace:', 'bright');
  log(`  ${workspace}`, 'dim');
  
  log('\nArtifacts:', 'bright');
  if (requirementsPath && fs.existsSync(requirementsPath)) {
    logSuccess(`Requirements: ${requirementsPath}`);
  } else {
    logWarning('Requirements: (not generated)');
  }
  
  if (explorationPath) {
    logInfo(`Exploration: ${explorationPath} (manual in CLI mode)`);
  }
  
  if (playwrightOutputDir) {
    logInfo(`Playwright Output: ${playwrightOutputDir} (manual in CLI mode)`);
  }
  
  if (scriptsDir) {
    logInfo(`Test Scripts: ${scriptsDir} (manual in CLI mode)`);
  }
  
  if (resultsDir) {
    logInfo(`Test Results: ${resultsDir} (manual in CLI mode)`);
  }
  
  if (reportsDir) {
    logInfo(`Reports: ${reportsDir} (automated via qa-reporter in OpenCode)`);
  }

  log('\n' + '─'.repeat(60), 'dim');
  log('Next Steps:', 'bright');
  log('1. Complete manual steps (exploration, Playwright MCP, test generation)', 'dim');
  log('2. Run tests: cd playwright && npx playwright test', 'dim');
  log('3. Generate report via @qa-orchestrator (automated)', 'dim');
  log('1. For fully automated pipeline, run in OpenCode:', 'dim');
  log('     @qa-orchestrator "QA my app at <url>"', 'dim');
  log('2. For manual CLI mode, complete steps above then run:', 'dim');
  log('     cd playwright && npx playwright test', 'dim');
  log('─'.repeat(60) + '\n', 'dim');
}

// Run the orchestrator
main().catch(error => {
  logError('Pipeline failed');
  console.error(error);
  process.exit(1);
});
