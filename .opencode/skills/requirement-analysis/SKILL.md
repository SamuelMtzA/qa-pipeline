---
name: requirement-analysis
description: Analyze a PRD markdown file and extract structured requirements into JSON format. Use this skill when you need to parse product requirements from a markdown document into a machine-readable format.
---

# Requirement Analysis Skill

## Purpose

Parse a Product Requirements Document (PRD) in markdown format and extract structured requirements into JSON.

## Input

- `prd_path`: Path to the PRD markdown file (e.g., `PRD.md`)

## Output

- `requirements.json`: Structured JSON containing:
  - `project`: Project name and description
  - `features`: Array of features with:
    - `id`: Unique identifier (F-001, F-002, etc.)
    - `name`: Feature name
    - `description`: Feature description
    - `requirements`: Array of specific requirements
    - `acceptance_criteria`: Array of testable acceptance criteria
    - `priority`: P0 (critical), P1 (important), P2 (nice-to-have)

## Process

1. Read the PRD markdown file
2. Parse markdown structure (headings, lists, tables)
3. Extract features from H2/H3 headings
4. Extract requirements from bullet points and paragraphs
5. Extract acceptance criteria from "Acceptance Criteria" sections
6. Assign priorities based on keywords:
   - P0: "must", "required", "critical", "essential"
   - P1: "should", "important", "needed"
   - P2: "could", "nice-to-have", "optional"
7. Generate unique IDs for each feature
8. Write structured JSON to `requirements.json`

## Example

### Input: PRD.md

```markdown
# E-Commerce Platform

## User Authentication

Users must be able to register and login to the platform.

### Requirements
- Users can register with email and password
- Password must be at least 8 characters
- Users can login with email and password
- Failed login attempts are logged

### Acceptance Criteria
- Given a valid email and password, when the user clicks "Register", then an account is created
- Given an invalid email, when the user clicks "Register", then an error message is shown
- Given valid credentials, when the user clicks "Login", then they are redirected to dashboard
```

### Output: requirements.json

```json
{
  "project": {
    "name": "E-Commerce Platform",
    "description": "E-Commerce Platform"
  },
  "features": [
    {
      "id": "F-001",
      "name": "User Authentication",
      "description": "Users must be able to register and login to the platform.",
      "requirements": [
        "Users can register with email and password",
        "Password must be at least 8 characters",
        "Users can login with email and password",
        "Failed login attempts are logged"
      ],
      "acceptance_criteria": [
        "Given a valid email and password, when the user clicks 'Register', then an account is created",
        "Given an invalid email, when the user clicks 'Register', then an error message is shown",
        "Given valid credentials, when the user clicks 'Login', then they are redirected to dashboard"
      ],
      "priority": "P0"
    }
  ]
}
```

## Usage

```bash
# Analyze a PRD file
@requirement-analysis PRD.md

# Output will be written to requirements.json
```

## Validation

The skill validates:
- PRD file exists and is readable
- Markdown structure is valid
- At least one feature is found
- Each feature has at least one requirement

## Error Handling

- If PRD file not found: Error with file path
- If no features found: Error suggesting PRD structure
- If markdown parsing fails: Error with line number
