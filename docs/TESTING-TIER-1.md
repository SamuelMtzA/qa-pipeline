# Testing Tier 1 — Platform Verification

This document walks through **Tier 1** of the QA Pipeline test plan. Tier 1 covers everything that can be verified **without spinning up an LLM agent** — pure platform code, deterministic logic, and the orchestrator's directory scaffolding. It is the entry gate for any MVP release.

For higher tiers (live LLM runs against a real URL), see `docs/TESTING-TIER-2.md` (TODO).

---

## Prerequisites

- Node.js 20+
- Project dependencies installed (`npm install`)
- macOS, Linux, or Windows shell

> **macOS note:** APFS is case-insensitive by default, so fixture files like `M-1.json` and `m-1.json` will collide. The smoke test uses distinct IDs (`BUG-001`, `BUG-002`) to avoid this.

---

## T1 — Skill 6 smoke test

**What it tests:** the deterministic core of Skill 6 — health-score formula, verdict rules, the 5 required sections in the markdown report, the JSON structure, and determinism (same input → byte-identical output). Does NOT exercise the LLM agent, only the math and the file writer.

**Command:**
```bash
npm run test:reporting
```

**What it does internally:**

1. Builds a synthetic run directory under `.qa-workspace/smoke-<timestamp>/` with 1 major + 1 minor bug ticket, 28/31 tests passing, 87% coverage.
2. Implements the `calculate-health-score` formula in pure JS (mirrors `.opencode/skills/calculate-health-score/SKILL.md` line-for-line).
3. Renders a minimal markdown + JSON report with all 5 required sections:
   - Summary
   - Coverage
   - Failures
   - Root Cause
   - Recommendations
4. Validates the JSON parses, all sections are present, the verdict is `SHIP WITH FIXES`, the score is `8.75`.
5. Runs the formula twice and asserts byte-identical output to prove determinism.
6. Tests 4 verdict edge cases:
   - 0 critical / 0 major / 30/30 tests → `SHIP`
   - 0 critical / 1 major / 30/30 tests → `SHIP WITH FIXES`
   - 1 critical → `DO NOT SHIP` (any critical forces this)
   - 0 tests executed → `INCONCLUSIVE`

**Pass criteria:** `Tests: 29 passed, 0 failed`. The `Verdict: SHIP WITH FIXES | Health: 8.75/10` line is the deterministic expected output for the synthetic fixture.

**Expected runtime:** < 5 seconds.

**Output location:** `.qa-workspace/smoke-<timestamp>/09-report/qa-report.{md,json}` (gitignored).

---

## T2 — Skill 1 fixture validation

**What it tests:** the existing `requirements.json` (the E-Commerce Platform demo PRD already committed to the repo) is well-formed and matches the contract that downstream skills expect.

**Command:**
```bash
node tests/test-requirement-analysis.js requirements.json
```

**What it does internally:**

1. Reads `requirements.json`.
2. Asserts top-level `project` object with `name` and `description`.
3. Walks every feature and asserts required fields:
   - `id` matching `F-XXX`
   - `name` and `description` (non-empty)
   - `requirements` array (≥ 1 item)
   - `acceptance_criteria` array
   - `priority` ∈ `{P0, P1, P2}`
4. Verifies content invariants:
   - `User Authentication` is `P0`
   - There are exactly 5 features

**Pass criteria:** `Tests: 42 passed, 0 failed`.

**Expected runtime:** < 1 second.

---

## T3 — Skill 1 idempotent regeneration

**What it tests:** that `skills/requirement-analysis.js` can re-parse `test-prd.md` into a JSON that passes T2's structural assertions, and that the regenerated output is stable.

**Command:**
```bash
node skills/requirement-analysis.js test-prd.md /tmp/reqs-regen.json
node tests/test-requirement-analysis.js /tmp/reqs-regen.json
```

**Pass criteria:** second command reports `Tests: 42 passed, 0 failed`. As a bonus idempotency check, both files should be the same byte size:

```bash
[ "$(wc -c < requirements.json)" = "$(wc -c < /tmp/reqs-regen.json)" ] && echo "IDEMPOTENT" || echo "DRIFT"
```

**Expected runtime:** < 1 second.

---

## T4 — Orchestrator dry-run

**What it tests:** that `orchestrator.js` correctly creates the run directory tree, runs Skill 1 (the only fully automated skill) end-to-end, and emits the manual-step log for Skills 2–6 (which require an LLM agent to run).

**Command:**
```bash
node orchestrator.js https://example.com --prd test-prd.md --skip-exploration --skip-execution
```

**What it does internally:**

1. Creates `.qa-workspace/<run-id>/` with the standard sub-tree:
   - `requirements/`
   - `exploration/`
   - `playwright/scripts/`
   - `playwright-output/`
   - `test-results/`
   - `reports/`
2. Runs Skill 1 (Requirement Analysis) and writes `requirements/requirements.json` inside the run dir.
3. Skips Skills 2–3 (--skip-exploration) and Skill 5 (--skip-execution).
4. Logs a "manual step" message for Skills 3, 4, 6 (LLM-driven phases).

**Verify manually:**

```bash
RUN=$(ls -t .qa-workspace | grep -v smoke | head -1)
ls ".qa-workspace/$RUN/"
ls ".qa-workspace/$RUN/requirements/"
head -10 ".qa-workspace/$RUN/requirements/requirements.json"
```

**Pass criteria:** the 7 standard sub-dirs exist, and `requirements/requirements.json` is non-empty (matches the size of the original `requirements.json`, ~4509 bytes).

**Known caveat:** `00-config.json` is **not** written by `orchestrator.js` — it is only written by the `qa-orchestrator` sub-agent (see `.opencode/agent/qa-orchestrator.md` Step 1). The CLI does not have access to the LLM, so it skips the agent-level setup. This is expected and not a defect.

**Expected runtime:** < 5 seconds.

---

## T5 — Cross-skill report shape check

**What it tests:** that the canonical reporting skills (`generate-report` + `calculate-health-score`) produce a report whose top-level shape matches the legacy reference, and that both pipelines agree on the verdict.

**Command:**
```bash
# Show structure of the reference report (legacy 9-section shape)
grep -E '^(#|\s*##) ' reports/qa-report.md

# Show structure of the canonical smoke-test report (5-section shape)
cat $(ls -td .qa-workspace/smoke-*/09-report/qa-report.md | head -1) | grep -E '^(#|\s*##) '

# Compare top-level JSON keys
node -e "const r=require('./reports/qa-report.json'); console.log('ref:', Object.keys(r).join(','))"
SMOKE=$(ls -td .qa-workspace/smoke-*/09-report/qa-report.json | head -1)
node -e "const r=require('./$SMOKE'); console.log('canon:', Object.keys(r).join(','))"
```

**Pass criteria:**

- Both reports contain a top-level title (`# QA Report:`) and a verdict line
- Both reports agree on the ship/no-ship decision for equivalent inputs
- The **canonical** report contains exactly the 5 required sections:
  - `## Summary`
  - `## Coverage`
  - `## Failures`
  - `## Root Cause`
  - `## Recommendations`

**Expected outcome:** the canonical report is **intentionally smaller** (5 sections) than the legacy reference (9 sections + Appendix + Sign-off). This is by design — the legacy `reporting` skill was demoted in v1.0 and the canonical pair is now the source of truth. The two templates will not match section-for-section, but the **verdict must always match** for equivalent inputs.

**Expected runtime:** < 5 seconds.

---

## Running all 5 tests

```bash
npm run test:reporting && \
node tests/test-requirement-analysis.js requirements.json && \
node skills/requirement-analysis.js test-prd.md /tmp/reqs-regen.json && \
node tests/test-requirement-analysis.js /tmp/reqs-regen.json && \
node orchestrator.js https://example.com --prd test-prd.md --skip-exploration --skip-execution
```

Or use the bundled npm script:

```bash
npm run test:smoke
```

(The `test:smoke` script currently aliases to T1 only; expand as more tests are wired up.)

---

## CI integration

The same five tests run automatically on every push and PR via `.github/workflows/qa-pipeline-test.yml`. See that file for the exact job definition. Smoke-test artifacts are uploaded as workflow artifacts (7-day retention) for post-mortem inspection.

---

## Moving to Tier 2

Once Tier 1 is green, the next step is **Tier 2** — exercising the LLM-driven skills (Skills 2, 3, 4, 5, 6) end-to-end against a real URL using an interactive OpenCode session. See `docs/TESTING-TIER-2.md` (TODO) for the procedure.

The minimum Tier 2 test is:

```bash
opencode
# inside the OpenCode TUI:
@qa-orchestrator "QA https://demo.playwright.dev/todomvc/ with PRD at test-prd.md"
```

Then walk the verifier checklist at the bottom of `tests/test-orchestrator.md`.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `coverage_pct is not defined` in T1 | outdated test file | `git pull` to refresh `tests/test-reporting.js` |
| T1 only writes `M-001.json`, missing `m-001.json` | macOS APFS case-insensitive collision (fixed in v1.0) | use a Node ≥ 18 and the latest `test-reporting.js` (bug IDs are `BUG-001` / `BUG-002`) |
| T2 reports `Has 5 features` failure | requirements.json was edited | re-run T3 to regenerate, or revert the change |
| T4 shows `00-config.json not found` | expected — CLI does not write it; the agent does | ignore or run inside OpenCode with `@qa-orchestrator` |
| T5: canonical report missing `## Executive Summary` | the canonical template uses `## Summary` (your spec, not legacy) | this is correct — the v1.0 plan demoted the legacy 9-section shape |

---

**Status:** Tier 1 is the release gate for v1.0. All 5 tests passing = MVP platform is verified.
