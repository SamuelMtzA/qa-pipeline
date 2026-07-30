# Context (Project Resumption Guide)

## Current Status

**Version:** 1.0.0 (MVP Complete)  
**Last Updated:** 2026-07-07  
**Status:** All 6 skills implemented and tested

## What Works

### Fully Automated (via OpenCode)
- Requirement analysis (PRD parsing)
- Exploratory testing (UI discovery)
- Playwright MCP integration (DOM capture)
- Test generation (Playwright scripts)
- Test execution (run tests + evidence)
- Reporting (QA report with verdict)

### CLI Mode
- Phase 1: Requirement analysis (automated)
- Phases 2-5: Manual (require OpenCode agents)

## Entry Points

### Start OpenCode
```bash
cd qa-pipeline
opencode
```

### Run Full Pipeline
```bash
@qa-orchestrator "QA my app at https://example.com with PRD at docs/prd.md"
```

### Run Individual Skills
```bash
@requirement-analysis test-prd.md
@exploratory-testing https://example.com
@playwright-mcp https://example.com
@test-generation requirements.json playwright-output/dom-snapshot.json
@test-execution
@reporting
```

### CLI Mode
```bash
node orchestrator.js https://example.com --prd docs/prd.md
```

## Known Limitations

### CLI Mode
- Phases 2-5 require manual execution or OpenCode agents
- No automatic test generation from CLI alone
- No automatic report generation from CLI alone

### General
- No parallel execution of independent skills (sequential only)
- No caching (re-runs expensive steps)
- No resume from failed step (must restart pipeline)
- No web dashboard for pipeline management
- No distributed execution

## Next Priorities

### High Priority
1. **Parallel execution** — Run independent skills concurrently
2. **Caching** — Skip already-completed steps
3. **Resume** — Continue from failed step
4. **CI/CD integration** — GitHub Actions, GitLab CI

### Medium Priority
5. **Plugin system** — Custom skills via modules
6. **Web dashboard** — Visual pipeline management
7. **Distributed execution** — Multi-machine support

### Low Priority
8. **Enhanced reporting** — HTML reports, trend analysis
9. **Accessibility testing** — axe-core integration
10. **Performance testing** — Load testing capabilities

## Project Structure (Key Files)

```
qa-pipeline/
├── .opencode/
│   ├── agent/              # 6 agent definitions
│   └── skills/             # 12 skill definitions
├── orchestrator.js         # CLI orchestrator
├── opencode.json           # OpenCode config (MCP, skills)
├── AGENTS.md               # Project conventions
├── README.md               # Full documentation
├── docs/
│   ├── ARCHITECTURE.md     # System design
│   ├── CONTEXT.md          # This file (resumption guide)
│   ├── QUICKSTART.md       # Quick start guide
│   └── TESTING-TIER-1.md   # Testing documentation
├── skills/                 # Skill implementations
├── playwright/             # Playwright config + test scripts
├── memory/                 # Cross-run persistent knowledge (gitignored)
└── .qa-workspace/          # Runtime artifacts (gitignored)
```

## Environment Setup

### Prerequisites
- Node.js 18+
- OpenCode CLI
- Playwright MCP server (auto-installed via npx)
- GitHub CLI (`gh`) for GitHub MCP

### Install
```bash
npm install
npm link  # Optional: global command
```

### GitHub MCP Setup
1. Install GitHub CLI: `brew install gh`
2. Authenticate: `gh auth login -h github.com`
3. Get token: `gh auth token`
4. Copy `opencode.json.example` to `opencode.json`
5. Replace `YOUR_GITHUB_TOKEN_HERE` with your token
6. Verify `opencode.json` is gitignored (it should be)

### Verify
```bash
node orchestrator.js --help
npm run test:smoke
```

## Common Tasks

### Add New Skill
1. Create `.opencode/skills/<skill-name>/SKILL.md`
2. Implement logic in `skills/<skill-name>.js` (if automated)
3. Add to orchestrator
4. Add validation tests in `tests/`
5. Update documentation

### Add New Agent
1. Create `.opencode/agent/qa-<role>.md`
2. Define responsibilities, inputs, outputs
3. Specify skills agent uses
4. Test with sample inputs

### Run Tests
```bash
npm run test              # Run Playwright tests
npm run test:smoke        # Run smoke tests
npm run test:ui           # Run with UI mode
npm run test:report       # Show HTML report
```

### View Generated Artifacts
```bash
ls .qa-workspace/         # List all runs
ls .qa-workspace/<run-id>/  # List specific run artifacts
cat .qa-workspace/<run-id>/09-report/qa-report.md  # View report
```

## Git Strategy

### Branch Strategy
- `main` — Stable, tested code
- `develop` — Integration branch
- `feature/<name>` — New features
- `fix/<name>` — Bug fixes

### Commit Messages
Use conventional commits:
- `feat(skill):` — New skill
- `feat(agent):` — New agent
- `fix(playwright):` — Playwright fix
- `docs:` — Documentation
- `test:` — Test updates

### What's Gitignored
- `.qa-workspace/` — Runtime artifacts
- `memory/*.json` — Mutable cross-run state
- `playwright-output/` — MCP capture artifacts
- `*.spec.ts` — Generated test scripts
- `requirements.json` — Generated requirements
- `exploration.md` — Generated exploration
- `evidence/` — Screenshots, videos, traces
- `.env*` — Secrets

## Troubleshooting

### Agent Not Found
- Verify agent file exists: `.opencode/agent/qa-<role>.md`
- Check frontmatter: `description` field required
- Restart OpenCode after adding new agents

### Skill Not Loaded
- Verify skill file exists: `.opencode/skills/<name>/SKILL.md`
- Check frontmatter: `name` and `description` required
- Verify `skills.paths` in `opencode.json` includes directory

### Playwright MCP Issues
- Verify MCP configured: `opencode.json` → `mcp.playwright`
- Test MCP directly: `npx @playwright/mcp@latest --help`
- Check browser installation: `npx playwright install chromium`

## Resources

- **README.md** — Full documentation
- **AGENTS.md** — Project conventions
- **docs/ARCHITECTURE.md** — System design
- **OpenCode docs** — https://opencode.ai
- **Playwright docs** — https://playwright.dev
- **Playwright MCP** — https://github.com/microsoft/playwright-mcp

## Quick Resume Checklist

1. [ ] Read this file (CONTEXT.md)
2. [ ] Read ARCHITECTURE.md for system design
3. [ ] Check `git log --oneline -10` for recent changes
4. [ ] Run `npm install` if dependencies changed
5. [ ] Run `npm run test:smoke` to verify setup
6. [ ] Start OpenCode: `opencode`
7. [ ] Test with sample: `@qa-orchestrator "QA my app at https://example.com"`
