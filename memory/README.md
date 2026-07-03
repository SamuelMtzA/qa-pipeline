# Memory Directory

This directory contains cross-run persistent knowledge that the QA platform accumulates over time.

## Files

- `project-profile.json` - Tech stack, framework, project structure, quirks
- `selectors.json` - Known-good selectors per page/element
- `auth-flows.json` - Authentication procedures and patterns
- `components.json` - Reusable UI component signatures
- `fixtures.json` - Reusable test data and setup patterns
- `bug-history.json` - Historical bugs with root causes and hotspots
- `urls.json` - Known application URLs and route map
- `environment.json` - Environment variables, configs, feature flags
- `coding-standards.json` - Test writing conventions and anti-patterns
- `test-registry.json` - Accumulated test suite (cross-run)
- `visual-baselines/` - Baseline screenshots per page/viewport
- `run-history.json` - Index of all runs with summaries

## How It Works

1. **Before each run**: Memory files are read and condensed into a brief (max 2000 tokens)
2. **During execution**: Agents use memory to make better decisions
3. **After each run**: Memory files are updated with new knowledge

## Decay Policy

Each memory entry has a confidence score (0.0-1.0):
- 1.0 = verified this run
- 0.9 = verified last run
- 0.7 = verified within 3 runs
- 0.5 = stale threshold (flagged for review)
- 0.3 = archived (not used as primary)
- 0.0 = pruned (removed from active memory)

## Example: Selectors Memory

```json
{
  "pages": {
    "/login": {
      "last_verified": "20260702-143022",
      "elements": {
        "email_input": {
          "preferred_selector": "getByLabel('Email')",
          "fallback_selectors": [
            "getByRole('textbox', { name: 'Email' })",
            "getByPlaceholder('Enter your email')"
          ],
          "verified_count": 5,
          "confidence": 1.0
        }
      }
    }
  }
}
```

## Compound Improvement

Run 1: Full discovery (100% exploration time)
Run 2: Known routes verified (70% exploration time)
Run 5: Only new/changed pages (40% exploration time)
Run 10: Delta-only exploration (25% exploration time)
