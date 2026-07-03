# Skills Directory

This directory contains skill documentation and specifications.

## Skill Definitions

Skill definitions live in `.opencode/skills/<skill-name>/SKILL.md` and are automatically discovered by OpenCode.

### Core Skills

| Skill | Purpose | Browser |
|-------|---------|---------|
| `read-requirements` | Parse PRD into raw sections | No |
| `extract-user-stories` | Transform requirements into feature map | No |
| `identify-risks` | Analyze feature map to produce risk register | No |
| `explore-ui` | Walk live app and discover pages | Yes |
| `inspect-dom` | Extract element inventory from accessibility tree | Yes |
| `capture-console-errors` | Capture and classify console messages | Yes |
| `analyze-network` | Capture and analyze network requests | Yes |
| `generate-test-cases` | Generate test plans and Playwright scripts | No |
| `run-playwright` | Execute tests with evidence capture | Yes |
| `auto-heal` | Recover from selector failures | Yes |
| `generate-report` | Consolidate artifacts into QA report | No |
| `calculate-health-score` | Compute deterministic health score (0-10) | No |
| `create-bug-ticket` | Format failure into structured bug ticket | No |
| `manage-registry` | Read/write/update cross-run test registry | No |
| `visual-regression` | Compare screenshots against baselines | Partial |
| `validate-accessibility` | Run WCAG 2.2 AA checks | Yes |

## Skill File Structure

Each skill is defined in `.opencode/skills/<skill-name>/SKILL.md`:

```markdown
---
name: skill-name
description: Use when [specific trigger]. Performs [specific action].
---

# Skill Name

## Purpose
One paragraph: what this skill does and why it matters.

## Input
| Field | Required | Format | Description |
|-------|----------|--------|-------------|
| field_1 | Yes | JSON | Description |

## Output
| Field | Format | Description |
|-------|--------|-------------|
| output_1 | JSON | Description |

## Decision Logic
Step-by-step instructions for the agent.

## Examples
Concrete input/output examples.

## Dependencies
- Skills: [list of dependent skills]
- Tools: [list of tools used]
```

## Skill Design Principles

1. **Small and focused** - Single responsibility
2. **Composable** - Can be combined with other skills
3. **Evidence-grounded** - Outputs trace to inputs
4. **Well-documented** - Clear inputs, outputs, examples
5. **Testable** - Can be validated in isolation

## Adding a New Skill

1. Create `.opencode/skills/<skill-name>/SKILL.md`
2. Add frontmatter with `name` and `description`
3. Document purpose, inputs, outputs, decision logic
4. Provide concrete examples
5. List dependencies (skills and tools)
6. Test in isolation before integrating

## Skill Composition

Skills are composed by agents. For example:

```
qa-explorer agent uses:
  explore-ui → inspect-dom → capture-console-errors → analyze-network
```

Skills can also be composed by other skills:

```
generate-test-cases uses:
  extract-user-stories (for feature map)
  inspect-dom (for element selectors)
```
