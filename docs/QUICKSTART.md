# Quick Start Guide

Get started with the QA Pipeline in 5 minutes.

## Prerequisites

- Node.js 18+
- OpenCode CLI installed
- Git

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd qa-pipeline

# Start OpenCode
opencode
```

## Your First QA Run

### Option 1: Simple Test (No PRD)

```bash
# In OpenCode, run:
@qa-orchestrator "QA my app at https://example.com"
```

The orchestrator will:
1. Explore https://example.com
2. Discover pages and elements
3. Generate Playwright test scripts
4. Produce a QA report

### Option 2: Full Test (With PRD)

```bash
# In OpenCode, run:
@qa-orchestrator "QA my app at https://example.com with PRD at docs/sample-prd.md"
```

The orchestrator will:
1. Parse the PRD and extract features
2. Explore the live application
3. Generate tests grounded in both spec and observation
4. Produce a QA report with coverage metrics

## Understanding the Output

After the pipeline completes, you'll see:

```
✅ QA Pipeline Complete

Run ID: 20260702-143022
Verdict: SHIP WITH FIXES
Health Score: 7.25/10

Tests Generated: 31
Coverage: 92%

Report: .qa-workspace/20260702-143022/09-report/qa-report.md
Scripts: .qa-workspace/20260702-143022/06-playwright/scripts/
```

### Key Files

- **QA Report**: `.qa-workspace/<run-id>/09-report/qa-report.md`
  - Executive summary with verdict
  - List of issues (critical, major, minor)
  - Coverage matrix
  - Recommendations

- **Test Scripts**: `.qa-workspace/<run-id>/06-playwright/scripts/`
  - Executable Playwright tests
  - Organized by feature
  - Ready to run

- **App Map**: `.qa-workspace/<run-id>/04-exploration/app-map.json`
  - Discovered pages and elements
  - Screenshots at 3 viewports
  - Navigation flows

## Running the Generated Tests

```bash
# Navigate to the generated scripts
cd .qa-workspace/<run-id>/06-playwright

# Install dependencies (first time only)
npm install

# List all tests
npx playwright test --list

# Run all tests
npx playwright test

# Run with UI mode (interactive)
npx playwright test --ui

# View HTML report
npx playwright show-report
```

## Verdicts Explained

| Verdict | Meaning | Action |
|---------|---------|--------|
| **SHIP** | No critical or major issues | Safe to release |
| **SHIP WITH FIXES** | Minor issues only | Fix before release |
| **DO NOT SHIP** | Critical or major issues | Block release, fix issues |
| **INCONCLUSIVE** | No tests executed | Investigate why |

## Health Score

The health score (0-10) is calculated from:
- Critical issues: -2.0 each
- Major issues: -1.0 each
- Minor issues: -0.25 each
- Low coverage (<80%): -1.0
- Very low coverage (<50%): -2.0

## Next Steps

### Customize the Pipeline

1. **Add your PRD**: Replace `docs/sample-prd.md` with your product requirements
2. **Configure credentials**: Set environment variables for authenticated testing
3. **Adjust focus**: Specify which features to prioritize

### Extend with Modules

Enable additional testing capabilities:

```json
// opencode.json
{
  "qa": {
    "modules": {
      "visual-regression": { "enabled": true },
      "accessibility": { "enabled": true },
      "performance": { "enabled": true }
    }
  }
}
```

### Integrate with CI/CD

```yaml
# .github/workflows/qa.yml
name: QA Pipeline
on: [pull_request]
jobs:
  qa:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npx opencode @qa-orchestrator "QA my app at ${{ env.STAGING_URL }}"
      - run: cat .qa-workspace/*/09-report/qa-report.md >> $GITHUB_STEP_SUMMARY
```

## Troubleshooting

### Playwright MCP Not Working

```bash
# Test MCP directly
npx @playwright/mcp@latest --help

# Install browsers
npx playwright install chromium
```

### Orchestrator Not Found

```bash
# Verify agent exists
ls .opencode/agent/qa-orchestrator.md

# Restart OpenCode
opencode
```

### Tests Fail to Run

```bash
# Check Playwright installation
npx playwright --version

# Install dependencies
cd .qa-workspace/<run-id>/06-playwright
npm install
```

## Example Runs

### E-Commerce Site

```bash
@qa-orchestrator "QA my app at https://demo-store.example.com with PRD at docs/sample-prd.md"
```

Expected output:
- 30-40 tests covering auth, cart, checkout
- Screenshots of all pages
- Coverage: 85-95%

### SaaS Dashboard

```bash
@qa-orchestrator "QA my app at https://staging.myapp.com with credentials in .env"
```

Expected output:
- 20-30 tests covering dashboard features
- Authenticated exploration
- Coverage: 70-85%

### Marketing Site

```bash
@qa-orchestrator "QA my app at https://example.com"
```

Expected output:
- 10-20 tests covering forms and navigation
- Public pages only
- Coverage: 60-80%

## Learn More

- [Architecture Documentation](docs/DESIGN.md)
- [Agent Specifications](agents/README.md)
- [Skill Catalog](skills/README.md)
- [Module Authoring Guide](docs/MODULES.md)
- [Testing Guide](tests/test-orchestrator.md)

## Support

- **Issues**: [GitHub Issues](https://github.com/your-org/qa-pipeline/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/qa-pipeline/discussions)
- **Documentation**: [https://opencode.ai](https://opencode.ai)
