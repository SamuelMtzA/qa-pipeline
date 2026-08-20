# QA Pipeline - Project Conventions

## Overview

This is an AI-powered QA platform built on OpenCode's agent infrastructure. It takes a web application URL (and optionally a PRD), walks the app like a real user using Playwright MCP, generates executable Playwright test scripts, and produces a severity-ranked QA report.

## Directory Structure

```
qa-pipeline/
├── adapters/
│   ├── opencode/            # OpenCode adapter (full implementation)
│   │   ├── agent/           # Agent definitions (qa-orchestrator, qa-analyst, etc.)
│   │   └── skills/          # Skill definitions (read-requirements, explore-ui, etc.)
│   ├── claude-code/         # Claude Code adapter (stub)
│   └── codex/               # Codex adapter (stub)
├── .opencode -> adapters/opencode  # Symlink for backward compat
├── agents/             # Agent documentation and specifications
├── skills/             # Skill documentation and specifications
├── mcp/                # MCP server configurations
├── memory/             # Cross-run persistent knowledge (selectors, auth flows, etc.)
├── prompts/            # Reusable prompt templates
├── reports/            # Generated QA reports (markdown and JSON)
├── evidence/           # Test evidence (screenshots, traces, network logs)
├── playwright/         # Playwright test scripts and configuration
├── tests/              # Unit and integration tests for the platform itself
├── config/             # Configuration files and schemas
└── .qa-workspace/      # Runtime artifacts (gitignored)
```

## Naming Conventions

### Files
- **Agents**: `qa-<role>.md` (e.g., `qa-orchestrator.md`, `qa-analyst.md`)
- **Skills**: `<skill-name>/SKILL.md` in `adapters/opencode/skills/` (or `.opencode/skills/` via symlink)
- **Reports**: `qa-report-<run-id>.md` and `qa-report-<run-id>.json`
- **Test scripts**: `<feature>/<test-name>.spec.ts` in `playwright/scripts/`
- **Evidence**: `T-<id>-<test-name>/<type>.png` (e.g., `T-001-login-valid/before.png`)

### Directories
- **Run artifacts**: `.qa-workspace/<run-id>/` where `run-id` is `YYYYMMDD-HHMMSS`
- **Memory files**: `memory/<category>.json` (e.g., `memory/selectors.json`)
- **Module directories**: `.qa-modules/<module-name>/` for plugin modules

## Code Style

### Agent Definitions
- Use YAML frontmatter for metadata (description, mode, model, permission)
- Include clear sections: Responsibilities, Inputs, Outputs, Decision Process, Skills, Tools, Failure Handling
- Provide concrete examples

### Skill Definitions
- Frontmatter must include `name` and `description`
- Include: Purpose, Input, Output, Dependencies, Decision Logic, Examples
- Keep skills small and composable (single responsibility)
- Document which Playwright MCP tools are used

### Test Scripts
- Use `@playwright/test` framework
- Group tests with `test.describe` blocks per feature
- Use role-based selectors: `getByRole`, `getByLabel`, `getByTestId`
- Include `waitForLoadState` before critical assertions
- Tag tests with priority: `@P0`, `@P1`, `@P2`

## Development Workflow

### Adding a New Skill
1. Create `adapters/opencode/skills/<skill-name>/SKILL.md`
2. Document purpose, inputs, outputs, decision logic, examples
3. Test the skill in isolation before integrating with agents
4. Update this file if the skill introduces new conventions

### Adding a New Agent
1. Create `adapters/opencode/agent/qa-<role>.md`
2. Define responsibilities, inputs, outputs, decision process
3. Specify which skills the agent uses
4. Define failure handling behavior
5. Test with sample inputs

### Running the Pipeline
```bash
# Start OpenCode
opencode

# Invoke the orchestrator
@qa-orchestrator "QA my app at https://example.com with PRD at docs/prd.md"
```

### Testing Generated Scripts
```bash
cd playwright
npx playwright test --list  # Validate syntax
npx playwright test         # Execute tests
```

## Quality Standards

### Test Generation
- Every test case must trace to a feature map entry AND an app map element
- Selectors must be grounded in observed DOM (no invented selectors)
- Include happy path, error path, and edge cases for P0 features
- Coverage matrix must explicitly flag untested features

### Reporting
- Reports must include: verdict, health score, issues, coverage, pages tested
- Verdict logic: SHIP / SHIP WITH FIXES / DO NOT SHIP / INCONCLUSIVE
- Health score formula is deterministic (same inputs → same output)
- Missing data is noted, not silently dropped

### Safety
- Read-only by default (no mutating actions without explicit opt-in)
- Blast-radius declarations in run config
- Credentials stored as env-var references, never inline
- PII redaction on all artifacts

## Module System

Modules are pluggable capabilities that register into pipeline phases via hooks.

### Module Structure
```
.qa-modules/<module-name>/
├── module.json         # Module manifest
├── agents/             # Module-specific agents (optional)
└── skills/             # Module-specific skills
```

### Phase Hooks
- `before`: Prepare data, inject context
- `during`: Augment core behavior
- `after`: Process outputs, generate artifacts

### Adding a Module
1. Create `.qa-modules/<module-name>/module.json`
2. Define phases, skills, agents, artifacts, dependencies
3. Add to `opencode.json` → `qa.modules`
4. Restart OpenCode

## Memory System

Cross-run persistent knowledge stored in `memory/`:
- `project-profile.json`: Tech stack, framework, quirks
- `selectors.json`: Known-good selectors per page
- `auth-flows.json`: Authentication procedures
- `components.json`: UI component signatures
- `fixtures.json`: Reusable test setup patterns
- `bug-history.json`: Historical bugs and hotspots
- `urls.json`: Route map
- `environment.json`: Config values, feature flags
- `coding-standards.json`: Learned patterns and anti-patterns
- `test-registry.json`: Accumulated test suite
- `visual-baselines/`: Baseline screenshots
- `run-history.json`: Run index

Memory is read before each run and updated after. Each memory file has a decay policy and confidence score.

## Git Conventions

### Commit Messages
- Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- Scope: `feat(skill):`, `feat(agent):`, `feat(module):`, `fix(playwright):`
- Example: `feat(skill): add read-requirements skill for PRD parsing`

### Branch Strategy
- `main`: Stable, tested code
- `develop`: Integration branch
- `feature/<name>`: New features
- `fix/<name>`: Bug fixes

## Dependencies

### Required
- Node.js 18+
- OpenCode CLI
- Playwright MCP server (auto-installed via npx)

### Optional
- TypeScript 5+ (for test scripts)
- axe-core (for accessibility testing)

## Troubleshooting

### Playwright MCP Issues
- Verify MCP is configured: `opencode.json` → `mcp.playwright`
- Test MCP directly: `npx @playwright/mcp@latest --help`
- Check browser installation: `npx playwright install chromium`

### Agent Not Found
- Verify agent file exists: `adapters/opencode/agent/qa-<role>.md` (or `.opencode/agent/` via symlink)
- Check frontmatter: `description` field is required
- Restart OpenCode after adding new agents

### Skill Not Loaded
- Verify skill file exists: `adapters/opencode/skills/<name>/SKILL.md` (or `.opencode/skills/` via symlink)
- Check frontmatter: `name` and `description` are required
- Verify `skills.paths` in `opencode.json` includes the directory

## Resources

- OpenCode docs: https://opencode.ai
- Playwright MCP: https://github.com/microsoft/playwright-mcp
- Playwright docs: https://playwright.dev
