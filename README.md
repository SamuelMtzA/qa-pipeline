# QA Pipeline

AI-powered QA platform built on OpenCode's agent infrastructure. Takes a web application URL, walks the app like a real user using Playwright MCP, generates executable Playwright test scripts, and produces a severity-ranked QA report with a ship/no-ship verdict.

## Features

- **Requirements Analysis**: Parse PRD/specs into structured feature maps with use cases and acceptance criteria
- **Exploratory Testing**: Walk the live app to discover pages, elements, flows, and anomalies
- **Test Generation**: Generate executable Playwright test scripts grounded in observed behavior
- **Reporting**: Produce severity-ranked QA reports with health scores and verdicts
- **Memory System**: Cross-run learning that compounds over time (selectors, auth flows, bug history)
- **Plugin Architecture**: Modular capabilities via before/during/after phase hooks

## Quick Start

### Prerequisites

- Node.js 18+
- OpenCode CLI installed
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd qa-pipeline

# OpenCode will auto-discover the configuration
opencode
```

### Usage

```bash
# Start OpenCode
opencode

# Run the QA pipeline
@qa-orchestrator "QA my app at https://example.com"

# With a PRD
@qa-orchestrator "QA my app at https://example.com with PRD at docs/prd.md"
```

### What Happens

1. **Requirement Analysis**: Parses your PRD (if provided) into a feature map
2. **Exploratory Testing**: Walks your app, discovers pages, captures screenshots
3. **Test Generation**: Creates Playwright test scripts from feature map + app map
4. **Reporting**: Produces a QA report with verdict (SHIP / SHIP WITH FIXES / DO NOT SHIP)

### Output

```
.qa-workspace/<run-id>/
├── 00-config.json              # Run configuration
├── 01-requirements/            # Feature map
│   ├── feature-map.md
│   └── feature-map.json
├── 04-exploration/             # App map and screenshots
│   ├── app-map.md
│   ├── app-map.json
│   └── screenshots/
├── 05-test-cases/              # Test plan
│   ├── test-plan.md
│   └── test-plan.json
├── 06-playwright/              # Generated test scripts
│   └── scripts/
└── 09-report/                  # Final QA report
    ├── qa-report.md
    └── qa-report.json
```

## Architecture

### Agents

- **qa-orchestrator**: Pipeline engine that sequences phases and dispatches sub-agents
- **qa-analyst**: Parses PRDs and extracts feature maps
- **qa-explorer**: Walks the live app and discovers pages/elements
- **qa-generator**: Generates test plans and Playwright scripts
- **qa-runner**: Executes tests and captures evidence
- **qa-investigator**: Analyzes failures and produces bug reports
- **qa-reporter**: Consolidates artifacts into final reports

### Skills

Small, reusable instructions that agents compose:
- `read-requirements`: Parse PRD into raw sections
- `extract-user-stories`: Transform requirements into feature map
- `explore-ui`: Walk live app and discover pages
- `inspect-dom`: Extract element inventory from accessibility tree
- `generate-test-cases`: Generate test plans and scripts
- `run-playwright`: Execute tests with evidence capture
- `generate-report`: Consolidate artifacts into QA report
- And more...

### Module System

Pluggable capabilities that register into pipeline phases:
- **Core**: Fundamental QA pipeline (always enabled)
- **Visual Regression**: Screenshot comparison against baselines
- **Accessibility**: WCAG 2.2 AA automated checks
- **API Testing**: Backend API endpoint testing
- **Performance**: Core Web Vitals measurement
- **Security**: XSS, CSRF, auth bypass testing
- **Mobile Testing**: Device emulation and touch gestures

## Project Structure

```
qa-pipeline/
├── .opencode/
│   ├── agent/          # Agent definitions
│   └── skills/         # Skill definitions
├── agents/             # Agent documentation
├── skills/             # Skill documentation
├── mcp/                # MCP server configs
├── memory/             # Cross-run persistent knowledge
├── prompts/            # Reusable prompt templates
├── reports/            # Generated QA reports
├── evidence/           # Test evidence
├── playwright/         # Playwright test scripts
├── tests/              # Platform tests
├── config/             # Configuration files
└── .qa-workspace/      # Runtime artifacts (gitignored)
```

## Development

### Adding a New Skill

1. Create `.opencode/skills/<skill-name>/SKILL.md`
2. Document purpose, inputs, outputs, decision logic, examples
3. Test in isolation before integrating with agents

### Adding a New Agent

1. Create `.opencode/agent/qa-<role>.md`
2. Define responsibilities, inputs, outputs, decision process
3. Specify which skills the agent uses

### Adding a New Module

1. Create `.qa-modules/<module-name>/module.json`
2. Define phases, skills, agents, artifacts, dependencies
3. Add to `opencode.json` → `qa.modules`
4. Restart OpenCode

See [AGENTS.md](AGENTS.md) for detailed conventions.

## Configuration

### opencode.json

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "playwright": {
      "type": "local",
      "command": ["npx", "-y", "@playwright/mcp@latest"],
      "enabled": true
    }
  },
  "skills": {
    "paths": [".opencode/skills", "skills"]
  }
}
```

### Environment Variables

```bash
export TEST_USER="test@example.com"
export TEST_PASS="password123"
export API_KEY="your-api-key"
```

## Roadmap

### MVP (v1)
- ✅ Requirements Analysis
- ✅ Exploratory Testing
- ✅ Playwright Test Generation
- ✅ Reporting

### v2
- Test Execution (run tests automatically)
- Failure Analysis (root-cause hypotheses)
- Memory System (cross-run learning)
- Plugin System (module architecture)
- Visual Regression
- Accessibility Testing

### v3
- API Testing
- Performance Testing
- Security Testing
- Mobile Testing
- Standalone CLI
- CI/CD Integration
- Web Dashboard

## Testing

```bash
# Validate generated Playwright scripts
cd playwright
npx playwright test --list

# Execute tests
npx playwright test

# Run platform tests
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

See [AGENTS.md](AGENTS.md) for coding conventions.

## License

Apache 2.0

## Resources

- [OpenCode Documentation](https://opencode.ai)
- [Playwright MCP](https://github.com/microsoft/playwright-mcp)
- [Playwright Documentation](https://playwright.dev)
- [Design Document](docs/DESIGN.md)

## Support

- Issues: [GitHub Issues](https://github.com/your-org/qa-pipeline/issues)
- Discussions: [GitHub Discussions](https://github.com/your-org/qa-pipeline/discussions)
