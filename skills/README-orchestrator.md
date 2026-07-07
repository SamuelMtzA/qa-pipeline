# QA Pipeline Orchestrator

## Overview

The orchestrator coordinates the execution of all 6 QA skills in sequence, managing the workspace and passing artifacts between skills.

## Usage

### Command Line

```bash
# Basic usage
node orchestrator.js https://example.com

# With PRD
node orchestrator.js https://example.com --prd docs/PRD.md

# Custom output directory
node orchestrator.js https://example.com --output my-tests

# Skip manual steps
node orchestrator.js https://example.com --skip-exploration --skip-execution
```

### NPM Script

```bash
# Using npm script
npm run pipeline -- https://example.com --prd docs/PRD.md
```

### Global CLI (after npm link)

```bash
# Link package globally
npm link

# Use as global command
qa-pipeline https://example.com --prd docs/PRD.md
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `url` | Target URL to test (required) | - |
| `--prd <path>` | Path to PRD markdown file | null |
| `--output <dir>` | Output directory | `.qa-workspace` |
| `--skip-exploration` | Skip exploratory testing | false |
| `--skip-execution` | Skip test execution | false |
| `-h, --help` | Show help message | - |

## Pipeline Flow

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
│ Output: playwright-output/ (DOM, screenshots, console, etc) │
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
│ Output: test-results/ (results.json, traces, videos, etc)   │
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

## Workspace Structure

The orchestrator creates a timestamped workspace for each run:

```
.qa-workspace/
└── 2026-01-15T10-30-00/
    ├── requirements/
    │   └── requirements.json
    ├── exploration/
    │   └── exploration.md
    ├── playwright-output/
    │   ├── dom-snapshot.json
    │   ├── console-logs.json
    │   ├── network-requests.json
    │   ├── screenshot-desktop.png
    │   ├── screenshot-tablet.png
    │   ├── screenshot-mobile.png
    │   └── summary.md
    ├── playwright/
    │   └── scripts/
    │       ├── auth/
    │       │   ├── login.spec.ts
    │       │   └── register.spec.ts
    │       └── cart/
    │           └── cart.spec.ts
    ├── test-results/
    │   ├── results.json
    │   ├── summary.md
    │   ├── screenshots/
    │   ├── videos/
    │   └── traces/
    └── reports/
        ├── qa-report.md
        └── qa-report.json
```

## Current Limitations

The orchestrator currently automates only **Step 1 (Requirement Analysis)**. The remaining steps require manual execution or AI agents:

### Manual Steps

1. **Exploratory Testing** - Requires AI agent with Playwright MCP
2. **Playwright MCP Capture** - Requires manual execution with OpenCode
3. **Test Generation** - Requires AI agent with code generation
4. **Test Execution** - Requires Playwright test runner
5. **Reporting** - Requires AI agent with analysis capabilities

### Future Automation

Future versions will automate all steps using AI agents:

```javascript
// Future: Automated exploratory testing
await agent.run('exploratory-testing', {
  url: config.url,
  output: explorationPath
});

// Future: Automated Playwright MCP capture
await agent.run('playwright-mcp', {
  url: config.url,
  output: playwrightOutputDir
});

// Future: Automated test generation
await agent.run('test-generation', {
  requirements: requirementsPath,
  domSnapshot: domSnapshotPath,
  output: scriptsDir
});

// Future: Automated reporting
await agent.run('reporting', {
  workspace: workspace,
  output: reportsDir
});
```

## Error Handling

The orchestrator handles errors gracefully:

- **Missing PRD**: Skips requirement analysis, continues pipeline
- **Missing artifacts**: Skips dependent steps, logs warnings
- **Script failures**: Logs errors, continues pipeline
- **Invalid arguments**: Shows help message, exits with error

## Exit Codes

| Code | Description |
|------|-------------|
| 0 | Success |
| 1 | Error (invalid arguments, script failure) |

## Examples

### Example 1: Full Pipeline with PRD

```bash
node orchestrator.js https://example-ecommerce.com --prd test-prd.md

# Output:
# [1/6] Requirement Analysis
# ✓ Parsed 5 features from test-prd.md
# ✓ Output written to .qa-workspace/2026-01-15T10-30-00/requirements/requirements.json
#
# [2/6] Exploratory Testing
# ⚠ Exploratory testing is a manual step in the current implementation
#
# ... (remaining steps)
```

### Example 2: Quick Test (Skip Manual Steps)

```bash
node orchestrator.js https://example.com --skip-exploration --skip-execution

# Output:
# [1/6] Requirement Analysis
# ⚠ No PRD provided, skipping requirement analysis
#
# [2/6] Exploratory Testing
# ⚠ Skipping exploratory testing (--skip-exploration)
#
# ... (remaining steps)
```

### Example 3: Custom Output Directory

```bash
node orchestrator.js https://example.com --output my-tests

# Creates workspace at: my-tests/2026-01-15T10-30-00/
```

## Integration with OpenCode

The orchestrator is designed to work with OpenCode's agent infrastructure:

1. **Skills** are defined in `.opencode/skills/`
2. **Agents** use skills via OpenCode's skill loading system
3. **Orchestrator** coordinates skill execution and artifact management

### Using with OpenCode

```bash
# Start OpenCode
opencode

# Run orchestrator via OpenCode agent
@qa-orchestrator "Run QA pipeline for https://example.com with PRD at test-prd.md"
```

## Development

### Adding New Skills

1. Create skill definition in `.opencode/skills/<skill-name>/SKILL.md`
2. Implement skill logic in `skills/<skill-name>.js` (if automated)
3. Add skill execution to orchestrator
4. Update workspace structure to include new artifacts

### Testing the Orchestrator

```bash
# Test with sample PRD
node orchestrator.js https://example.com --prd test-prd.md

# Verify workspace creation
ls -la .qa-workspace/

# Check requirements.json
cat .qa-workspace/*/requirements/requirements.json
```

## Troubleshooting

### Issue: "URL is required"

**Solution**: Provide a URL as the first argument
```bash
node orchestrator.js https://example.com
```

### Issue: "PRD file not found"

**Solution**: Check the PRD path is correct
```bash
node orchestrator.js https://example.com --prd ./docs/PRD.md
```

### Issue: "Permission denied"

**Solution**: Make scripts executable
```bash
chmod +x bin/qa-pipeline orchestrator.js skills/requirement-analysis.js
```

### Issue: "Cannot find module"

**Solution**: Ensure you're in the qa-pipeline directory
```bash
cd qa-pipeline
node orchestrator.js https://example.com
```

## Architecture

### Component Diagram

```
┌──────────────────┐
│   CLI Interface  │
│  (bin/qa-pipeline)│
└────────┬─────────┘
         │
         ↓
┌──────────────────┐
│   Orchestrator   │
│ (orchestrator.js)│
└────────┬─────────┘
         │
         ├──────────────────┬──────────────────┬──────────────────┐
         ↓                  ↓                  ↓                  ↓
┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│   Workspace    │ │     Skills     │ │   Artifacts    │ │     Logs       │
│   Manager      │ │   Executor     │ │   Manager      │ │   Manager      │
└────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘
```

### Design Principles

1. **Sequential Execution**: Skills run in order, each depending on previous outputs
2. **Graceful Degradation**: Missing artifacts skip dependent steps, don't fail pipeline
3. **Workspace Isolation**: Each run gets its own timestamped workspace
4. **Artifact Passing**: Skills communicate via files, not in-memory data
5. **Clear Feedback**: Color-coded logs show progress, success, warnings, errors

## Future Enhancements

1. **Parallel Execution**: Run independent skills in parallel
2. **Caching**: Cache artifacts to avoid re-running expensive steps
3. **Resume**: Resume pipeline from failed step
4. **Configuration File**: Support `.qa-pipeline.json` for default options
5. **Plugin System**: Allow custom skills to be plugged in
6. **Web Dashboard**: Visual interface for pipeline management
7. **CI/CD Integration**: GitHub Actions, GitLab CI templates
8. **Distributed Execution**: Run skills on different machines

## Files

- `orchestrator.js` - Main orchestrator script
- `bin/qa-pipeline` - CLI wrapper
- `package.json` - NPM configuration with bin entry
- `skills/README-orchestrator.md` - This documentation
