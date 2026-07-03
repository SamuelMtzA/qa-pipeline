---
name: extract-user-stories
description: Transform raw extracted requirements into structured user stories with acceptance criteria and priority levels. Use after read-requirements to create a feature map.
---

# Extract User Stories

Transform raw requirements into a structured feature map with user stories, acceptance criteria, and priorities.

## Purpose

Take the output from `read-requirements` (raw sections, entities, actions, constraints) and produce a structured feature map that downstream skills can use to generate tests.

## Input

| Field | Required | Format | Description |
|-------|----------|--------|-------------|
| `raw_sections` | Yes | JSON array | Output from read-requirements |
| `entities` | Yes | JSON array | Nouns/entities from read-requirements |
| `actions` | Yes | JSON array | Verbs/actions from read-requirements |
| `constraints` | Yes | JSON array | Business rules from read-requirements |

## Output

| Field | Format | Description |
|-------|--------|-------------|
| `feature_map` | JSON | Structured feature map |
| `feature_map_md` | Markdown string | Human-readable version |
| `coverage_gaps` | JSON array | Features mentioned but not fully specified |

## Feature Map Schema

```json
{
  "features": [
    {
      "id": "F-001",
      "name": "User Authentication",
      "priority": "P0",
      "description": "Users can register, login, and manage their account",
      "source_reference": "PRD Section 3.1",
      "use_cases": [
        {
          "id": "UC-001",
          "name": "Login with email/password",
          "story": "As a user, I want to login with my email and password so that I can access my account",
          "acceptance_criteria": [
            "Valid credentials redirect to /dashboard",
            "Invalid credentials show error message",
            "Password field is masked"
          ],
          "type": "functional",
          "testability": "testable"
        }
      ]
    }
  ],
  "implicit_requirements": [
    {
      "id": "IR-001",
      "name": "Responsive Design",
      "description": "All pages render correctly at 375px, 768px, and 1440px viewports"
    }
  ]
}
```

## Decision Logic

1. **Group related entities and actions** into features
2. **For each feature**, identify use cases (specific user scenarios)
3. **Write user stories** in format: "As a [role], I want [action] so that [outcome]"
4. **Define acceptance criteria** as observable, testable outcomes
5. **Assign priorities**:
   - P0: "must", "required", auth, payment, core business flow
   - P1: "should", "important", secondary flows
   - P2: "nice to have", "optional", cosmetic
6. **Add implicit requirements** (responsive, error handling, accessibility, performance)
7. **Identify coverage gaps** where features are mentioned but not fully specified

## Examples

### Example: E-commerce Feature

**Input:**
```json
{
  "entities": ["user", "cart", "order", "payment"],
  "actions": ["checkout", "pay"],
  "constraints": ["Users must verify email before checkout"]
}
```

**Output:**
```json
{
  "features": [
    {
      "id": "F-004",
      "name": "Checkout Flow",
      "priority": "P0",
      "description": "Users can complete purchases",
      "use_cases": [
        {
          "id": "UC-001",
          "name": "Complete purchase with credit Card",
          "story": "As a shopper, I want to pay with a credit card so that I can complete my purchase",
          "acceptance_criteria": [
            "Valid card details result in successful payment and confirmation page",
            "Invalid card number shows 'Invalid card' error",
            "Payment processing shows a loading spinner",
            "Order confirmation email is triggered"
          ],
          "type": "functional",
          "testability": "testable"
        }
      ]
    }
  ]
}
```

## Dependencies

- **Skills**: `read-requirements` (provides input data)
- **Tools**: `read`, `write`

## Usage

This skill is invoked by the `qa-analyst` agent after `read-requirements` completes.
