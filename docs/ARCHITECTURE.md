# Architecture

## System Overview

QA Pipeline automates web application testing through 6 sequential phases. Each phase is implemented as an OpenCode agent with specialized skills.

```
User Input (URL + optional PRD)
    │
    ▼
┌─────────────────────────────────────────┐
│ Phase 1: Requirements Analysis          │
│ Agent: qa-analyst                       │
│ Skills: read-requirements,              │
│         extract-user-stories            │
│ Output: feature-map.json, feature-map.md│
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ Phase 2: Exploratory Testing            │
│ Agent: qa-explorer                      │
│ Skills: explore-ui, playwright-mcp      │
│ Tools: Playwright MCP (browser control) │
│ Output: app-map.json, app-map.md,       │
│         screenshots/                    │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ Phase 3: Test Generation                │
│ Agent: qa-generator                     │
│ Skills: generate-test-cases             │
│ Output: test-plan.json, test-plan.md,   │
│         *.spec.ts                       │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ Phase 4: Test Execution                 │
│ Agent: qa-runner                        │
│ Skills: test-execution                  │
│ Tools: Playwright test runner           │
│ Output: results.json, evidence/         │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ Phase 5: Reporting                      │
│ Agent: qa-reporter                      │
│ Skills: calculate-health-score,         │
│         generate-report                 │
│ Output: qa-report.md, qa-report.json    │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ Phase 6: Summary                        │
│ Agent: qa-orchestrator                  │
│ Output: User-facing summary             │
└─────────────────────────────────────────┘
```

## Agent Hierarchy

### Primary Agent
**qa-orchestrator** — Coordinates pipeline, dispatches sub-agents, manages context between phases.

### Sub-Agents
- **qa-analyst** — Parses PRD into structured requirements
- **qa-explorer** — Discovers pages, forms, user flows via Playwright MCP
- **qa-generator** — Generates Playwright tests from requirements + DOM
- **qa-runner** — Executes tests, captures evidence
- **qa-reporter** — Generates QA report with verdict and health score

## Skill Composition

### Core Skills (6)
1. **requirement-analysis** — Parse PRD markdown to JSON
2. **exploratory-testing** — Discover UI elements and flows
3. **playwright-mcp** — Capture DOM, screenshots, console, network
4. **test-generation** — Generate Playwright test scripts
5. **test-execution** — Run tests and capture evidence
6. **reporting** — Generate QA report with verdict

### Supporting Skills (6)
- **read-requirements** — Extract features from PRD
- **extract-user-stories** — Parse acceptance criteria
- **explore-ui** — Navigate and document UI
- **generate-test-cases** — Create test plan from requirements
- **calculate-health-score** — Compute deterministic health metric
- **generate-report** — Format QA report

## Data Flow

```
PRD.md (optional)
    │
    ▼
requirements.json ──────────────────────┐
    │                                    │
    ▼                                    ▼
exploration.md                    test-plan.json
    │                                    │
    ▼                                    ▼
dom-snapshot.json ──────────────► *.spec.ts
console-logs.json                        │
network-requests.json                    ▼
screenshots/                      results.json
    │                                    │
    └────────────────────────────────────┘
                                         │
                                         ▼
                                  qa-report.md
                                  qa-report.json
```

### Artifact Locations
All artifacts stored in `.qa-workspace/<run-id>/`:
- `00-config.json` — Run configuration
- `01-requirements/` — Feature map
- `04-exploration/` — App map, screenshots
- `05-test-cases/` — Test plan
- `06-playwright/` — Test scripts
- `07-execution/` — Results, evidence
- `09-report/` — QA report

## Memory System

Cross-run persistent knowledge stored in `memory/`:

| File | Purpose |
|------|---------|
| `project-profile.json` | Tech stack, framework, quirks |
| `selectors.json` | Known-good selectors per page |
| `auth-flows.json` | Authentication procedures |
| `test-registry.json` | Accumulated test suite |
| `bug-history.json` | Historical bugs and hotspots |
| `urls.json` | Route map |
| `environment.json` | Config values, feature flags |
| `coding-standards.json` | Learned patterns and anti-patterns |

**Characteristics:**
- Read before each run, updated after
- Each entry has confidence score and decay policy
- Gitignored (mutable state, changes per run)

## Module System

Pluggable capabilities that register into pipeline phases via hooks.

### Module Structure
```
.qa-modules/<module-name>/
├── module.json         # Module manifest
├── agents/             # Module-specific agents (optional)
└── skills/             # Module-specific skills
```

### Phase Hooks
- `before` — Prepare data, inject context
- `during` — Augment core behavior
- `after` — Process outputs, generate artifacts

### Adding a Module
1. Create `.qa-modules/<module-name>/module.json`
2. Define phases, skills, agents, artifacts, dependencies
3. Add to `opencode.json` → `qa.modules`
4. Restart OpenCode

## MCP Integration

### Playwright MCP
Browser automation via Model Context Protocol.

**Configuration** (`opencode.json`):
```json
{
  "mcp": {
    "playwright": {
      "type": "local",
      "command": ["npx", "-y", "@playwright/mcp@latest", ...],
      "enabled": true
    }
  }
}
```

**Capabilities:**
- `browser_navigate` — Navigate to URL
- `browser_snapshot` — Capture accessibility tree
- `browser_click` — Click elements
- `browser_type` — Type into inputs
- `browser_take_screenshot` — Capture screenshots
- `browser_console_messages` — Read console logs
- `browser_network_requests` — Capture network traffic

**Used by:** `qa-explorer` agent for exploratory testing and DOM capture.

## Execution Modes

### OpenCode Mode (Fully Automated)
```bash
opencode
@qa-orchestrator "QA my app at https://example.com with PRD at docs/prd.md"
```

All phases automated via sub-agents. Artifacts written to `.qa-workspace/<run-id>/`.

### CLI Mode (Manual Steps)
```bash
node orchestrator.js https://example.com --prd docs/prd.md
```

Phase 1 automated (requirement analysis). Phases 2-5 require manual execution or OpenCode agents.

## Error Handling

- **Phase fails** — Log error, mark phase as `degraded`, continue to next phase
- **All phases fail** — Abort and produce minimal error report
- **Missing inputs** — Use defaults or skip phase

## Context Management

When invoking skills:
- Pass file paths to artifacts (not raw content)
- Pass brief summary of prior phase results (3 sentences max)
- Never pass raw screenshots or large DOM snapshots

## Configuration

### opencode.json
- MCP server configuration (Playwright)
- Skill paths (`.opencode/skills`, `skills`)

### playwright.config.ts
- Test directory (`./scripts`)
- Output directory (`../test-results`)
- Evidence capture (traces, videos, screenshots on failure)
- Browser configuration (Chromium, Firefox, WebKit)
- Timeout settings

## Extensibility

### Adding a Skill
1. Create `.opencode/skills/<skill-name>/SKILL.md`
2. Document purpose, inputs, outputs, decision logic, examples
3. Test skill in isolation before integrating with agents
4. Update `AGENTS.md` if skill introduces new conventions

### Adding an Agent
1. Create `.opencode/agent/qa-<role>.md`
2. Define responsibilities, inputs, outputs, decision process
3. Specify which skills agent uses
4. Define failure handling behavior
5. Test with sample inputs
