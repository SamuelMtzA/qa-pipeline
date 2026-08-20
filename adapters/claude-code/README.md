# Claude Code Adapter (Stub)

This adapter enables qa-pipeline to run with [Claude Code](https://docs.anthropic.com/en/docs/claude-code) as the agent runtime for Skills 2 (Exploratory Testing) and 4 (Test Generation).

## Status: Not yet implemented

The adapter stub exists to define the interface. To implement:

1. Create `CLAUDE.md` at the repo root with instructions for Claude Code to act as the QA orchestrator
2. Translate the OpenCode agent prompts from `adapters/opencode/agent/qa-*.md` into Claude Code's format
3. Update `skills/_shared/agent-runner.js` `runClaudeCodeAgent()` to invoke `claude` CLI with the appropriate skill prompt
4. Test with `QA_AGENT=claude-code node orchestrator.js <url>`

## Agent Mapping

| QA Role | OpenCode Agent | Claude Code Equivalent |
|---|---|---|
| Orchestrator | `qa-orchestrator.md` | `CLAUDE.md` (root instructions) |
| Analyst | `qa-analyst.md` | `agents/qa-analyst.md` |
| Explorer | `qa-explorer.md` | `agents/qa-explorer.md` |
| Generator | `qa-generator.md` | `agents/qa-generator.md` |
| Runner | `qa-runner.md` | `agents/qa-runner.md` |
| Reporter | `qa-reporter.md` | `agents/qa-reporter.md` |

## Usage (once implemented)

```bash
QA_AGENT=claude-code node orchestrator.js https://example.com --prd docs/PRD.md
```
