# Contributing to QA Pipeline

Thank you for your interest in contributing! This document covers setup, conventions, and how to add new skills or adapters.

## Quick Start

```bash
git clone https://github.com/SamuelMtzA/qa-pipeline.git
cd qa-pipeline
npm install
npx playwright install chromium
npm run test:all  # 98 assertions across 3 test suites
```

## Prerequisites

- Node.js 20+
- Playwright (auto-installed via `npm install && npx playwright install chromium`)
- OpenCode CLI (optional — only needed for Skills 2 & 4 with `QA_AGENT=opencode`)

## Branch Strategy

- `main` — stable, tested code
- `develop` — integration branch
- `feature/<name>` — new features
- `fix/<name>` — bug fixes

## Commit Messages

Use [conventional commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

Types: feat, fix, docs, refactor, test, chore
Scopes: skill, agent, orchestrator, memory, config, playwright, arch
```

Examples:
- `feat(skill): add playwright-capture for Skill 3`
- `fix(memory): correct decay policy for unverified selectors`
- `docs(readme): reconcile automation-status contradiction`

## Testing

Before submitting a PR, all tests must pass:

```bash
npm run test:all
```

This runs:
- `test:reporting` — 29 assertions (health score, verdict logic, report structure)
- `test:memory` — 34 assertions (load/save/decay/prune, selector/bug/run recording)
- `test:run-config` — 35 assertions (blast_radius schema, validation, route matching)

### Adding Tests

When adding a new skill or module:
1. Create `tests/test-<module>.js` following the existing pattern (assertion counter + `test()` function)
2. Add a `test:<module>` script to `package.json`
3. Add a CI stage in `.github/workflows/qa-pipeline-test.yml`

## Adding a New Skill

### Pure Code Skill (no agent needed)

1. Implement the skill in `skills/<skill-name>.js`
2. Export a main function that takes `{ config, workspaceDir, memoryData }` and returns a result object
3. Wire it into `orchestrator.js` in the appropriate sequence position
4. Add tests in `tests/test-<skill-name>.js`
5. Update `README.md` pipeline-flow diagram

### Agent-Driven Skill (requires LLM)

1. Create the skill spec at `adapters/opencode/skills/<skill-name>/SKILL.md` with YAML frontmatter (`name`, `description`)
2. Create or update the agent at `adapters/opencode/agent/qa-<role>.md`
3. Add the skill to `SKILLS_REQUIRING_AGENT` in `skills/_shared/agent-runner.js`
4. Update `orchestrator.js` to dispatch via `runAgent()`
5. For non-OpenCode adapters: translate the spec into `adapters/<runtime>/agents/`

## Adding a New Adapter

See `adapters/README.md` for the full guide. Summary:

1. Create `adapters/<runtime>/` with `README.md` and `agents/` directory
2. Translate agent prompts from `adapters/opencode/agent/qa-*.md`
3. Implement `run<Runtime>Agent()` in `skills/_shared/agent-runner.js`
4. Test with `QA_AGENT=<runtime> node orchestrator.js <url>`

## Memory System

Memory files in `memory/` are gitignored (mutable cross-run state). The skeleton files are force-tracked. If you add a new memory file:

1. Create the skeleton JSON at `memory/<name>.json`
2. Force-add it: `git add -f memory/<name>.json`
3. Add it to `MEMORY_FILES` in `skills/_shared/memory.js`
4. Document it in `memory/README.md`

## Safety Conventions

- **Read-only by default**: the pipeline's `blast_radius` defaults to `['read', 'navigate']`
- **No inline credentials**: `credentials.inline` must always be `'never'` — use env var references
- **Grounded selectors**: test selectors must come from observed DOM, never invented
- **PII redaction**: artifacts should not contain personally identifiable information

## Pull Request Checklist

- [ ] All tests pass (`npm run test:all`)
- [ ] Commit messages follow conventional commits
- [ ] New skills have corresponding tests
- [ ] Memory file changes are backwards-compatible
- [ ] Schema changes are documented
- [ ] No secrets or credentials in committed files

## Questions?

- Open an issue: https://github.com/SamuelMtzA/qa-pipeline/issues
- Read the architecture: `docs/ARCHITECTURE.md`
- Read the testing guide: `docs/TESTING-TIER-1.md`
