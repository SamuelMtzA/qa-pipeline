# Agents Directory

This directory contains agent documentation and specifications.

## Agent Definitions

Agent definitions live in `.opencode/agent/` and are automatically discovered by OpenCode.

### Core Agents

- **qa-orchestrator** - Pipeline engine that sequences phases and dispatches sub-agents
- **qa-analyst** - Parses PRDs and extracts feature maps
- **qa-explorer** - Walks the live app and discovers pages/elements
- **qa-generator** - Generates test plans and Playwright scripts
- **qa-runner** - Executes tests and captures evidence (v2)
- **qa-investigator** - Analyzes failures and produces bug reports (v2)
- **qa-reporter** - Consolidates artifacts into final reports

## Agent File Structure

Each agent is defined in `.opencode/agent/qa-<role>.md` with YAML frontmatter:

```markdown
---
description: When to use this agent
mode: subagent
model: anthropic/claude-sonnet-4-6
permission:
  edit: deny
  bash:
    "mkdir *": allow
    "*": deny
  read: allow
  write: allow
---

You are the [Agent Name]. You [responsibilities].

## Your Task
[Detailed instructions]

## Rules
[Constraints and guardrails]

## Output
[What to write and where]
```

## Agent Responsibilities

### qa-orchestrator
- Conduct onboarding interview
- Create run directory and config
- Dispatch phases in order
- Handle failures gracefully
- Produce run summary

### qa-analyst
- Parse PRD/spec documents
- Extract feature map with use cases
- Assign priorities (P0/P1/P2)
- Identify implicit requirements

### qa-explorer
- Walk the live app (BFS crawl)
- Discover pages and elements
- Capture screenshots at 3 viewports
- Identify anomalies and broken links
- Produce app map

### qa-generator
- Reconcile feature map + app map
- Generate test cases with evidence grounding
- Produce Playwright scripts
- Validate scripts with `playwright test --list`

### qa-reporter
- Collect all phase artifacts
- Invoke `calculate-health-score` and `generate-report` skills
- Compute health score and verdict (deterministic)
- Assemble QA report (`09-report/qa-report.md` + `.json`)
- Return compact summary to orchestrator
- **Skills**: `calculate-health-score`, `generate-report`
- **Tools**: `read`, `write`, `glob` (no bash, no edits)
- **MVP**: defined in `.opencode/agent/qa-reporter.md`

## Adding a New Agent

1. Create `.opencode/agent/qa-<role>.md`
2. Define frontmatter (description, mode, model, permission)
3. Write clear responsibilities and decision process
4. Specify which skills the agent uses
5. Define failure handling behavior
6. Test with sample inputs
