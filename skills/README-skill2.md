# Skill 2: Exploratory Testing

## Overview

Explore a web application interactively and document findings in a structured markdown report.

## Input

- **URL**: The web application URL to explore (e.g., `https://example.com`)

## Output

- **File**: `exploration.md`
- **Format**: Structured markdown document with:
  - Application overview
  - Pages discovered
  - Navigation structure
  - Forms and interactive elements
  - User flows tested
  - Visual observations
  - Issues found (critical, major, minor)
  - Screenshots
  - Recommendations

## Usage

This skill is designed to be used by an AI agent with access to Playwright MCP tools.

### Manual Exploration

```bash
# Start OpenCode with Playwright MCP
opencode

# Invoke the skill
@exploratory-testing https://example.com
```

### Agent Workflow

1. Agent reads skill instructions from `.opencode/skills/exploratory-testing/SKILL.md`
2. Agent uses Playwright MCP tools to explore the application
3. Agent documents findings in `exploration.md`
4. Agent captures screenshots to `screenshots/` directory

## Exploration Strategy

### Phase 1: Landing Page
- Navigate to URL
- Take screenshot
- Document page structure
- Identify navigation elements

### Phase 2: Navigation Discovery
- Click through main navigation
- Document each page
- Map site structure
- Take screenshots of key pages

### Phase 3: Interactive Elements
- Identify all forms
- Identify all buttons and links
- Test hover states
- Document form fields and validation

### Phase 4: User Flows
- Test common user journeys
- Document multi-step processes
- Note authentication requirements
- Identify error states

### Phase 5: Visual Assessment
- Test responsiveness (desktop, tablet, mobile)
- Note visual issues
- Check accessibility basics

## Playwright MCP Tools Used

| Tool | Purpose |
|------|---------|
| `browser_navigate` | Navigate to URLs |
| `browser_snapshot` | Get page structure |
| `browser_take_screenshot` | Capture screenshots |
| `browser_click` | Click elements |
| `browser_type` | Type into inputs |
| `browser_resize` | Test responsiveness |
| `browser_console_messages` | Check for errors |
| `browser_network_requests` | Monitor API calls |

## Report Structure

```markdown
# Exploratory Testing Report

**URL**: https://example.com
**Date**: 2026-01-15
**Duration**: 45 minutes

## Application Overview
[Brief description of the application]

## Pages Discovered
### 1. Home Page (/)
[Details about the page]

### 2. Products Page (/products)
[Details about the page]

## Navigation Structure
[Tree diagram of site structure]

## Forms Identified
### 1. Login Form
[Form details: fields, validation, submit action]

## Interactive Elements
### Buttons
[Table of buttons and their actions]

### Links
[Table of links and destinations]

## User Flows Tested
### Flow 1: Browse and Add Product
[Steps, expected result, actual result, pass/fail]

## Visual Observations
### Responsiveness
[Desktop, tablet, mobile observations]

### Visual Issues
[List of visual issues found]

## Issues Found
### Critical Issues
[List of critical issues]

### Major Issues
[List of major issues]

### Minor Issues
[List of minor issues]

## Screenshots
[Table of screenshots captured]

## Recommendations
[Prioritized list of recommendations]

## Next Steps
[Suggested next actions]

## Summary
[Metrics and overall assessment]
```

## Testing

```bash
# Validate exploration report
node tests/test-exploratory-testing.js exploration.md
```

## Implementation Notes

- **Agent-driven**: This skill is executed by an AI agent, not a standalone script
- **Interactive**: Requires real-time browser interaction via Playwright MCP
- **Screenshots**: Saves screenshots to `screenshots/` directory
- **Duration**: Typically 30-60 minutes for a medium-sized application

## Error Handling

- **URL not accessible**: Report error and stop
- **Page load timeout**: Log warning and continue
- **Screenshot fails**: Log warning and continue
- **No interactive elements**: Note in report

## Limitations

- **Manual exploration**: Not automated crawling
- **Authentication**: Limited to what's visible without credentials
- **Performance**: No performance testing
- **Security**: No security testing

## Next Steps

This skill feeds into:
- **Skill 4 (Test Generation)**: Uses discovered pages and forms to generate tests
- **Skill 6 (Reporting)**: Uses issues found in final report

## Files

- `.opencode/skills/exploratory-testing/SKILL.md` - Skill definition
- `exploration.md` - Sample output
- `tests/test-exploratory-testing.js` - Validation script
- `skills/README-skill2.md` - This documentation
