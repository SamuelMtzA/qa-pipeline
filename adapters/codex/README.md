# Codex Adapter (Stub)

This adapter enables qa-pipeline to run with [OpenAI Codex](https://github.com/openai/codex) as the agent runtime for Skills 2 (Exploratory Testing) and 4 (Test Generation).

## Status: Not yet implemented

The adapter stub exists to define the interface. To implement:

1. Create `AGENTS.md` at the repo root with instructions for Codex to act as the QA orchestrator
2. Translate the OpenCode agent prompts from `adapters/opencode/agent/qa-*.md` into Codex's format
3. Update `skills/_shared/agent-runner.js` `runCodexAgent()` to invoke `codex` CLI with the appropriate skill prompt
4. Test with `QA_AGENT=codex node orchestrator.js <url>`

## Agent Mapping

| QA Role | OpenCode Agent | Codex Equivalent |
|---|---|---|
| Orchestrator | `qa-orchestrator.md` | `AGENTS.md` (root instructions) |
| Analyst | `qa-analyst.md` | `agents/qa-analyst.md` |
| Explorer | `qa-explorer.md` | `agents/qa-explorer.md` |
| Generator | `qa-generator.md` | `agents/qa-generator.md` |
| Runner | `qa-runner.md` | `agents/qa-runner.md` |
| Reporter | `qa-reporter.md` | `agents/qa-reporter.md` |

## Usage (once implemented)

```bash
QA_AGENT=codex node orchestrator.js https://example.com --prd docs/PRD.md
```
