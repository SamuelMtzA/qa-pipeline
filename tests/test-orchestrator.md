# Testing the Orchestrator

This document describes how to test the simple orchestrator.

## Prerequisites

1. OpenCode CLI installed
2. Playwright MCP configured (already in `opencode.json`)
3. A web application URL to test

## Test 1: Basic Flow (No PRD)

```bash
# Start OpenCode
opencode

# Run the orchestrator
@qa-orchestrator "QA my app at https://example.com"
```

**Expected:**
1. Orchestrator creates `.qa-workspace/<run-id>/`
2. Skips requirements phase (no PRD)
3. Explores https://example.com
4. Generates test cases from exploration
5. Produces QA report
6. Outputs summary with verdict

## Test 2: Full Flow (With PRD)

```bash
# Run with PRD
@qa-orchestrator "QA my app at https://example.com with PRD at docs/sample-prd.md"
```

**Expected:**
1. Orchestrator creates `.qa-workspace/<run-id>/`
2. Parses docs/sample-prd.md
3. Extracts feature map with use cases
4. Explores https://example.com
5. Generates test cases from feature map + app map
6. Produces QA report with coverage metrics
7. Outputs summary with verdict

## Test 3: With Credentials

```bash
# Set environment variables
export TEST_USER="test@example.com"
export TEST_PASS="password123"

# Run with credentials
@qa-orchestrator "QA my app at https://staging.example.com with PRD at docs/sample-prd.md and credentials in environment"
```

**Expected:**
1. Orchestrator uses credentials for authenticated exploration
2. Generates tests for authenticated flows
3. Produces comprehensive QA report

## Verification Checklist

After each test, verify:

- [ ] Run directory created: `.qa-workspace/<run-id>/`
- [ ] Config file exists: `00-config.json`
- [ ] Feature map exists (if PRD provided): `01-requirements/feature-map.json`
- [ ] App map exists: `04-exploration/app-map.json`
- [ ] Screenshots captured: `04-exploration/screenshots/`
- [ ] Test plan exists: `05-test-cases/test-plan.json`
- [ ] Playwright scripts exist: `06-playwright/scripts/`
- [ ] Scripts validate: `npx playwright test --list` succeeds
- [ ] QA report exists: `09-report/qa-report.md`
- [ ] Report has verdict: SHIP / SHIP WITH FIXES / DO NOT SHIP

## Running Generated Tests

```bash
# Navigate to the generated scripts
cd .qa-workspace/<run-id>/06-playwright

# Install dependencies (if needed)
npm install

# List all tests
npx playwright test --list

# Run all tests
npx playwright test

# Run with UI mode
npx playwright test --ui

# View HTML report
npx playwright show-report
```

## Troubleshooting

### Playwright MCP Not Responding

```bash
# Test MCP directly
npx @playwright/mcp@latest --help

# Check browser installation
npx playwright install chromium
```

### Orchestrator Not Found

```bash
# Verify agent file exists
ls .opencode/agent/qa-orchestrator.md

# Restart OpenCode
opencode
```

### Skills Not Loaded

```bash
# Verify skill files exist
ls .opencode/skills/*/SKILL.md

# Check opencode.json has skills.paths
cat opencode.json | grep -A 3 "skills"
```

## Expected Output Structure

```
.qa-workspace/20260702-143022/
├── 00-config.json
├── 01-requirements/
│   ├── feature-map.json
│   └── feature-map.md
├── 04-exploration/
│   ├── app-map.json
│   ├── app-map.md
│   └── screenshots/
│       ├── home-375.png
│       ├── home-768.png
│       └── home-1440.png
├── 05-test-cases/
│   ├── test-plan.json
│   └── test-plan.md
├── 06-playwright/
│   ├── playwright.config.ts
│   └── scripts/
│       ├── auth/
│       │   └── login.spec.ts
│       └── search/
│           └── search.spec.ts
└── 09-report/
    ├── qa-report.md
    └── qa-report.json
```
