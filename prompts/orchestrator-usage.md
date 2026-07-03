# Orchestrator Prompt Template

## Basic Usage

```
@qa-orchestrator "QA my app at https://example.com"
```

## With PRD

```
@qa-orchestrator "QA my app at https://example.com with PRD at docs/prd.md"
```

## With Credentials

```
@qa-orchestrator "QA my app at https://staging.example.com with PRD at docs/prd.md and credentials in .env"
```

## With Focus Area

```
@qa-orchestrator "QA my app at https://example.com, focus on checkout and authentication flows"
```

## With Blast Radius

```
@qa-orchestrator "QA my app at https://staging.example.com, allow staging mutations"
```

## Full Example

```
@qa-orchestrator "QA my app at https://staging.myapp.com with PRD at docs/prd.md.
Focus on checkout and authentication. Allow staging mutations.
Test credentials are in .env file."
```

## Expected Behavior

1. Orchestrator asks at most 2 clarifying questions
2. Creates run directory: `.qa-workspace/<run-id>/`
3. Writes `00-config.json` with all inputs
4. Dispatches phases in order:
   - Phase 1: Requirement Analysis (if PRD provided)
   - Phase 2: Exploratory Testing
   - Phase 3: Test Generation
   - Phase 4: Reporting
5. Produces final report: `09-report/qa-report.md`

## Output Locations

- Run config: `.qa-workspace/<run-id>/00-config.json`
- Feature map: `.qa-workspace/<run-id>/01-requirements/feature-map.json`
- App map: `.qa-workspace/<run-id>/04-exploration/app-map.json`
- Test plan: `.qa-workspace/<run-id>/05-test-cases/test-plan.json`
- Scripts: `.qa-workspace/<run-id>/06-playwright/scripts/`
- Report: `.qa-workspace/<run-id>/09-report/qa-report.md`
