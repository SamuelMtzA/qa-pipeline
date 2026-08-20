# QA Pipeline

An AI-powered QA platform built on OpenCode's agent infrastructure that automates the entire testing lifecycle from requirements to reports.

## 🎯 Overview

QA Pipeline takes a web application URL (and optionally a PRD), walks the app like a real user using Playwright MCP, generates executable Playwright test scripts, and produces a severity-ranked QA report with a ship/no-ship verdict.

### Key Features

- **Automated Requirement Analysis** - Parse PRDs into structured requirements
- **Exploratory Testing** - Discover pages, forms, and user flows
- **Playwright MCP Integration** - Capture DOM, screenshots, console logs, network requests
- **Test Generation** - Generate executable Playwright tests from requirements + DOM
- **Test Execution** - Run tests and capture evidence (traces, videos, screenshots)
- **Comprehensive Reporting** - Generate QA reports with verdict and recommendations

## Quick Start

### Prerequisites

- Node.js 20+
- Playwright (auto-installed via `npm install && npx playwright install chromium`)
- OpenCode CLI (optional — only needed for Skills 2 & 4 with `QA_AGENT=opencode`)

### Quick Demo (no agent required)

```bash
git clone https://github.com/SamuelMtzA/qa-pipeline.git
cd qa-pipeline
npm install && npx playwright install chromium

# Run the pipeline against a live demo app (QA_AGENT=none by default)
node orchestrator.js https://demo.playwright.dev/todomvc --prd examples/prd-todo.md --skip-execution
```

Expected output:

```
[1/6] Requirement Analysis
✓ Parsed 4 features from examples/prd-todo.md

[2/6] Exploratory Testing
⚠ Skipped (QA_AGENT=none — requires AI agent)

[3/6] Playwright Capture
✓ Capture complete: 1 pages, 3 selectors, 0 console errors

[4/6] Test Generation
⚠ Skipped (QA_AGENT=none — requires AI agent)

[5/6] Test Execution
⚠ Skipped (--skip-execution)

[6/6] Reporting
✓ Report generated: .qa-workspace/<run-id>/09-report/qa-report.md
   Verdict: INCONCLUSIVE | Health: 6.5/10
```

Skills 1 (Requirement Analysis), 3 (Playwright Capture), and 6 (Reporting) run as pure code. Skills 2 and 4 are skipped gracefully when `QA_AGENT=none`. For full coverage:

```bash
QA_AGENT=opencode node orchestrator.js https://demo.playwright.dev/todomvc --prd examples/prd-todo.md
```

Artifacts are written to `.qa-workspace/<run-id>/`:
- `00-config.json` — run config with blast_radius
- `requirements/requirements.json` — parsed PRD features
- `playwright-output/` — DOM snapshot, screenshots, console logs, network logs, selectors
- `09-report/qa-report.md` + `qa-report.json` — verdict, health score, coverage, recommendations

### Basic Usage

```bash
# Run the pipeline
node orchestrator.js https://example.com

# With PRD
node orchestrator.js https://example.com --prd docs/PRD.md

# Using npm script
npm run pipeline -- https://example.com --prd docs/PRD.md

# Using global command (after npm link)
qa-pipeline https://example.com --prd docs/PRD.md
```

## 📋 Pipeline Flow

The pipeline executes 6 skills in sequence:

> **Status legend:** `✓ Automated` = runs as plain Node code · `⚠ Manual` = requires an AI agent to interpret the skill's SKILL.md spec at runtime

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Requirement Analysis                                │
│ Input: PRD.md (optional)                                    │
│ Output: requirements/requirements.json                      │
│ Status: ✓ Automated                                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Exploratory Testing                                 │
│ Input: URL                                                  │
│ Output: exploration/exploration.md                          │
│ Status: ⚠ Manual (requires AI agent)                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Playwright MCP                                      │
│ Input: URL                                                  │
│ Output: playwright-output/ (DOM, screenshots, etc)          │
│ Status: ⚠ Manual (requires Playwright MCP)                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 4: Test Generation                                     │
│ Input: requirements.json + dom-snapshot.json                │
│ Output: playwright/scripts/*.spec.ts                        │
│ Status: ⚠ Manual (requires AI agent)                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 5: Test Execution                                      │
│ Input: playwright/scripts/*.spec.ts                         │
│ Output: test-results/ (results, traces, videos, etc)        │
│ Status: ⚠ Manual (requires Playwright test runner)          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 6: Reporting                                           │
│ Input: All artifacts from steps 1-5                         │
│ Output: reports/qa-report.md + qa-report.json               │
│ Status: ⚠ Manual (requires AI agent)                        │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ Skills

### Skill 1: Requirement Analysis

Parses PRD markdown files into structured JSON requirements.

**Input:** `PRD.md`  
**Output:** `requirements.json`

```bash
node skills/requirement-analysis.js test-prd.md requirements.json
```

**Features:**
- Extracts features, requirements, acceptance criteria
- Assigns priorities (P0, P1, P2) based on keywords
- Generates unique feature IDs (F-001, F-002, etc.)
- Validates PRD structure

### Skill 2: Exploratory Testing

Explores web applications and documents findings.

**Input:** URL  
**Output:** `exploration.md`

**Features:**
- Discovers pages and navigation structure
- Identifies forms and interactive elements
- Tests user flows
- Captures screenshots
- Documents visual observations

### Skill 3: Playwright MCP

Captures comprehensive page data using Playwright MCP tools.

**Input:** URL  
**Output:** DOM snapshot, screenshots, console logs, network requests

**Features:**
- Captures accessibility tree (DOM structure)
- Takes screenshots at 3 viewport sizes
- Captures console errors and warnings
- Records network requests and responses
- Generates summary report

### Skill 4: Test Generation

Generates Playwright test files from requirements and DOM snapshot.

**Input:** `requirements.json` + `dom-snapshot.json`  
**Output:** `*.spec.ts` files

**Features:**
- Generates happy path, error path, and edge case tests
- Uses role-based selectors grounded in DOM
- Organizes tests by feature
- Creates test plan and coverage matrix
- Validates tests with `playwright test --list`

### Skill 5: Test Execution

Executes Playwright tests and captures evidence.

**Input:** `*.spec.ts` files  
**Output:** `results.json`, traces, videos, screenshots

**Features:**
- Runs tests with Playwright test runner
- Captures traces on failure
- Records videos on failure
- Takes screenshots on failure
- Generates execution summary

### Skill 6: Reporting

Generates comprehensive QA reports from all artifacts.

**Input:** All artifacts from skills 1-5  
**Output:** `qa-report.md` + `qa-report.json`

**Features:**
- Executive summary with verdict (SHIP / SHIP WITH FIXES / DO NOT SHIP)
- Coverage analysis (requirements and tests)
- Failed test analysis with root cause
- Issue categorization (critical, major, minor)
- Actionable recommendations with effort estimates

## 📁 Project Structure

```
qa-pipeline/
├── .opencode/
│   ├── agent/
│   │   └── qa-orchestrator.md          # Orchestrator agent definition
│   └── skills/
│       ├── requirement-analysis/
│       │   └── SKILL.md                # Skill 1 definition
│       ├── exploratory-testing/
│       │   └── SKILL.md                # Skill 2 definition
│       ├── playwright-mcp/
│       │   └── SKILL.md                # Skill 3 definition
│       ├── test-generation/
│       │   └── SKILL.md                # Skill 4 definition
│       ├── test-execution/
│       │   └── SKILL.md                # Skill 5 definition
│       └── reporting/
│           └── SKILL.md                # Skill 6 definition
├── bin/
│   └── qa-pipeline                     # CLI wrapper
├── skills/
│   ├── requirement-analysis.js         # Skill 1 implementation
│   ├── README-skill1.md                # Skill 1 documentation
│   ├── README-skill2.md                # Skill 2 documentation
│   ├── README-skill3.md                # Skill 3 documentation
│   ├── README-skill4.md                # Skill 4 documentation
│   ├── README-skill5.md                # Skill 5 documentation
│   ├── README-skill6.md                # Skill 6 documentation
│   └── README-orchestrator.md          # Orchestrator documentation
├── playwright/
│   ├── playwright.config.ts            # Playwright configuration
│   ├── test-plan.json                  # Sample test plan
│   ├── coverage-matrix.md              # Sample coverage matrix
│   └── scripts/                        # Generated test scripts
│       ├── auth/
│       │   ├── login.spec.ts
│       │   └── register.spec.ts
│       └── cart/
│           └── cart.spec.ts
├── playwright-output/                  # Sample Playwright MCP outputs
│   ├── dom-snapshot.json
│   ├── console-logs.json
│   ├── network-requests.json
│   ├── screenshot-*.png
│   └── summary.md
├── test-results/                       # Sample test execution results
│   ├── results.json
│   ├── summary.md
│   ├── screenshots/
│   ├── videos/
│   └── traces/
├── reports/                            # Sample QA reports
│   ├── qa-report.md
│   └── qa-report.json
├── tests/                              # Validation tests
│   ├── test-requirement-analysis.js
│   ├── test-exploratory-testing.js
│   └── test-playwright-mcp.js
├── orchestrator.js                     # Main orchestrator script
├── package.json                        # NPM configuration
├── tsconfig.json                       # TypeScript configuration
├── test-prd.md                         # Sample PRD for testing
├── exploration.md                      # Sample exploration report
├── requirements.json                   # Sample requirements output
├── AGENTS.md                           # Agent conventions
└── README.md                           # This file
```

## 🔧 Configuration

### opencode.json

Playwright MCP configuration:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "playwright": {
      "type": "local",
      "command": [
        "npx", "-y", "@playwright/mcp@latest",
        "--browser", "chromium",
        "--headless",
        "--viewport-size", "1440x900",
        "--timeout-action", "10000",
        "--timeout-navigation", "30000",
        "--console-level", "warning",
        "--snapshot-mode", "full",
        "--output-dir", ".qa-workspace/playwright-output",
        "--test-id-attribute", "data-testid"
      ],
      "enabled": true
    }
  },
  "skills": {
    "paths": [".opencode/skills", "skills"]
  }
}
```

### playwright.config.ts

Playwright test configuration:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './scripts',
  outputDir: '../test-results',
  use: {
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  retries: 1,
  reporter: [
    ['list'],
    ['json', { outputFile: '../test-results/results.json' }]
  ],
  timeout: 30000,
  expect: { timeout: 5000 }
});
```

## 📊 Sample Output

### Requirements JSON

```json
{
  "project": {
    "name": "E-Commerce Platform",
    "description": "A modern e-commerce platform"
  },
  "features": [
    {
      "id": "F-001",
      "name": "User Authentication",
      "priority": "P0",
      "requirements": [
        "Users can register with email and password",
        "Password must be at least 8 characters"
      ],
      "acceptance_criteria": [
        "Given valid credentials, when user clicks Login, then redirected to dashboard"
      ]
    }
  ]
}
```

### QA Report

```markdown
# QA Report: E-Commerce Platform

**Verdict**: SHIP WITH FIXES

## Summary
- Features Tested: 5
- Requirements Coverage: 92% (23/25)
- Tests Executed: 40
- Tests Passed: 35 (87.5%)
- Tests Failed: 3 (7.5%)
- Critical Issues: 0
- Major Issues: 1
- Minor Issues: 4

## Failed Tests
### T-002: Login with invalid email format
**Error**: Expected "Invalid email format", received "Please enter a valid email"
**Root Cause**: Test bug (incorrect expected value)
**Recommendation**: Update test to match actual UI text

## Recommendations
1. Fix coupon functionality (High priority, 4-8 hours)
2. Fix cart badge update delay (High priority, 2-4 hours)
3. Implement forgot password feature (Medium priority, 8-16 hours)
```

## 🧪 Testing

### Run Validation Tests

```bash
# Test requirement analysis skill
node tests/test-requirement-analysis.js requirements.json

# Test exploratory testing skill
node tests/test-exploratory-testing.js exploration.md

# Test Playwright MCP skill
node tests/test-playwright-mcp.js playwright-output
```

### Run Generated Tests

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

## 🤖 Using with OpenCode

### Start OpenCode

```bash
opencode
```

### Run Skills via OpenCode

```bash
# Requirement analysis
@requirement-analysis test-prd.md

# Exploratory testing
@exploratory-testing https://example.com

# Playwright MCP capture
@playwright-mcp https://example.com

# Test generation
@test-generation requirements.json playwright-output/dom-snapshot.json

# Test execution
@test-execution

# Reporting
@reporting
```

### Run Full Pipeline via Orchestrator Agent

```bash
@qa-orchestrator "Run QA pipeline for https://example.com with PRD at test-prd.md"
```

## 📈 Roadmap

### Current Status (v1.1)

- ✓ Skill 1: Requirement Analysis — **automated** (plain Node code in `skills/requirement-analysis.js`)
- 🤖 Skill 2: Exploratory Testing — agent-capable (executed by `qa-explorer` sub-agent at runtime; not yet implemented as code)
- 🤖 Skill 3: Playwright MCP — agent-capable (executed by `qa-explorer` sub-agent at runtime; not yet implemented as code)
- 🤖 Skill 4: Test Generation — agent-capable (executed by `qa-generator` sub-agent at runtime; not yet implemented as code)
- 🤖 Skill 5: Test Execution — agent-capable (executed by `qa-runner` sub-agent at runtime; not yet implemented as code)
- 🤖 Skill 6: Reporting — agent-capable (executed by `qa-reporter` sub-agent at runtime; health-score formula implemented in `tests/test-reporting.js`)
- ✓ Orchestrator — **automated** (coordinates skills, dispatches sub-agents; `orchestrator.js` scaffolds run workspace and runs Skill 1)

### Future Enhancements

- **Parallel execution** of independent skills
- **Caching** to avoid re-running expensive steps
- **Resume** pipeline from failed step
- **Plugin system** for custom skills
- **Web dashboard** for pipeline management
- **CI/CD integration** (GitHub Actions, GitLab CI)
- **Distributed execution** across multiple machines

## 🤝 Contributing

### Adding New Skills

1. Create skill definition in `.opencode/skills/<skill-name>/SKILL.md`
2. Implement skill logic in `skills/<skill-name>.js` (if automated)
3. Add skill execution to orchestrator
4. Update workspace structure to include new artifacts
5. Add validation tests in `tests/`
6. Update documentation

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add -A
git commit -m "feat(skill): add my new skill"

# Push and create PR
git push origin feature/my-feature
```

### Commit Message Format

```
<type>(<scope>): <description>

Types: feat, fix, docs, refactor, test, chore
Scopes: skill-1, skill-2, ..., skill-6, orchestrator, playwright
```

## 📚 Documentation

- [Skill 1: Requirement Analysis](skills/README-skill1.md)
- [Skill 2: Exploratory Testing](skills/README-skill2.md)
- [Skill 3: Playwright MCP](skills/README-skill3.md)
- [Skill 4: Test Generation](skills/README-skill4.md)
- [Skill 5: Test Execution](skills/README-skill5.md)
- [Skill 6: Reporting](skills/README-skill6.md)
- [Orchestrator](skills/README-orchestrator.md)
- [Agent Conventions](AGENTS.md)

## 🔗 Resources

- [OpenCode Documentation](https://opencode.ai)
- [Playwright MCP](https://github.com/microsoft/playwright-mcp)
- [Playwright Documentation](https://playwright.dev)
- [Design Document](docs/DESIGN.md)

## 📄 License

Apache 2.0

## 🙏 Acknowledgments

Built with:
- [OpenCode](https://opencode.ai) - AI agent infrastructure
- [Playwright](https://playwright.dev) - Browser automation
- [Playwright MCP](https://github.com/microsoft/playwright-mcp) - MCP server for Playwright

---

**Status**: MVP Complete - All 6 skills implemented and tested  
**Version**: 1.0.0  
**Last Updated**: 2026-07-07
