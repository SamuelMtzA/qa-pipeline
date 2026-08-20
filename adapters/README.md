# Adapters

Agent runtime adapters for qa-pipeline. Each adapter translates the QA pipeline's skill specs into the native format of a specific coding agent (OpenCode, Claude Code, Codex).

## Architecture

```
qa-pipeline/
├── skills/                  # Core pipeline (agent-agnostic)
│   ├── requirement-analysis.js
│   ├── playwright-capture.js
│   ├── test-execution.js
│   ├── reporting.js
│   └── _shared/
│       ├── run-config.js
│       ├── memory.js
│       └── agent-runner.js  # selects adapter via QA_AGENT env var
├── adapters/
│   ├── opencode/            # Full implementation
│   │   ├── agent/           # qa-orchestrator, qa-analyst, etc.
│   │   └── skills/          # SKILL.md specs
│   ├── claude-code/         # Stub (TODO)
│   │   └── agents/
│   └── codex/               # Stub (TODO)
│       └── agents/
└── .opencode -> adapters/opencode  # Symlink for backward compat
```

## How It Works

1. **Skills 1, 3, 5, 6** run as pure Node code — no agent needed.
2. **Skills 2, 4** require an LLM agent. The `agent-runner.js` module dispatches to the active adapter:
   - `QA_AGENT=none` (default) → skills skipped gracefully
   - `QA_AGENT=opencode` → dispatched via OpenCode sub-agents
   - `QA_AGENT=claude-code` → dispatched via Claude Code (stub)
   - `QA_AGENT=codex` → dispatched via Codex (stub)

## Adding a New Adapter

1. Create `adapters/<runtime>/` with:
   - `README.md` — adapter documentation
   - `agents/` — translated agent prompts
   - Root config file (e.g., `CLAUDE.md`, `AGENTS.md`) at repo root
2. Update `skills/_shared/agent-runner.js`:
   - Add the runtime to `runAgent()` dispatch
   - Implement the `run<Runtime>Agent()` function
3. Test with `QA_AGENT=<runtime> node orchestrator.js <url>`

## Backward Compatibility

The `.opencode` symlink at the repo root points to `adapters/opencode/`, so existing OpenCode users who clone and run `opencode` directly are unaffected.
