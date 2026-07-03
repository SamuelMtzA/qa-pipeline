# Skill 1: Requirement Analysis

## Overview

Parses a Product Requirements Document (PRD) in markdown format and extracts structured requirements into JSON.

## Input

- **File**: `PRD.md` (or any markdown file)
- **Format**: Markdown with H1 for project name, H2 for features, H3 for sections

## Output

- **File**: `requirements.json`
- **Format**: Structured JSON with project info and features array

## Usage

```bash
node skills/requirement-analysis.js <prd-path> [output-path]
```

### Examples

```bash
# Basic usage
node skills/requirement-analysis.js test-prd.md

# Specify output path
node skills/requirement-analysis.js docs/PRD.md output/requirements.json
```

## PRD Format

The skill expects markdown with this structure:

```markdown
# Project Name

Project description.

## Feature Name

Feature description.

### Requirements
- Requirement 1
- Requirement 2
- Requirement 3

### Acceptance Criteria
- Given X, when Y, then Z
- Given A, when B, then C
```

## Output Structure

```json
{
  "project": {
    "name": "Project Name",
    "description": "Project description"
  },
  "features": [
    {
      "id": "F-001",
      "name": "Feature Name",
      "description": "Feature description",
      "requirements": [
        "Requirement 1",
        "Requirement 2"
      ],
      "acceptance_criteria": [
        "Given X, when Y, then Z"
      ],
      "priority": "P0"
    }
  ]
}
```

## Priority Assignment

The skill automatically assigns priorities based on keywords:

- **P0** (Critical): "must", "required", "critical", "essential"
- **P1** (Important): "should", "important", "needed" (default)
- **P2** (Nice-to-have): "could", "nice-to-have", "optional"

## Testing

```bash
# Run the skill
node skills/requirement-analysis.js test-prd.md requirements.json

# Validate output
node tests/test-requirement-analysis.js requirements.json
```

## Implementation Details

- **Language**: Node.js (ES modules)
- **Dependencies**: None (uses built-in `fs` and `path`)
- **Parsing**: Simple regex-based markdown parsing
- **Validation**: Checks for required fields and structure

## Error Handling

- File not found: Exits with error message
- No features found: Exits with error suggesting PRD structure
- Missing requirements: Warns but continues

## Limitations

- Simple parsing (no full markdown AST)
- No support for tables or complex formatting
- Priority detection is keyword-based (not semantic)

## Next Steps

This skill feeds into:
- **Skill 4 (Test Generation)**: Uses requirements to generate test cases
- **Skill 6 (Reporting)**: Uses requirements to calculate coverage

## Files

- `skills/requirement-analysis.js` - Implementation
- `.opencode/skills/requirement-analysis/SKILL.md` - Skill definition
- `tests/test-requirement-analysis.js` - Validation tests
- `test-prd.md` - Sample PRD for testing
- `requirements.json` - Sample output
