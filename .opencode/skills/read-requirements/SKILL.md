---
name: read-requirements
description: Parse a PRD, spec document, API documentation, or free-text description and extract raw structured content. Use when analyzing product requirements before test generation.
---

# Read Requirements

Parse product specifications and extract structured content for downstream test generation.

## Purpose

Extract raw sections, entities, actions, and constraints from PRD documents. This skill performs **extraction only** — it does not interpret or prioritize. Downstream skills (`extract-user-stories`) consume its output.

## Input

| Field | Required | Format | Description |
|-------|----------|--------|-------------|
| `source_path` | Yes | File path or URL | Path to PRD, spec, OpenAPI YAML, or plain text |
| `source_type` | No | `prd`, `api_spec`, `freeform` | Hint for parsing strategy; auto-detected if omitted |
| `target_url` | No | URL string | The application URL, used to resolve relative references |

## Output

| Field | Format | Description |
|-------|--------|-------------|
| `raw_sections` | JSON array | Extracted document sections with heading, body text, and hierarchy level |
| `entities` | JSON array | Nouns/entities found: users, products, orders, etc. |
| `actions` | JSON array | Verbs/actions found: create, delete, search, authenticate, etc. |
| `constraints` | JSON array | Conditionals and business rules: "must", "required", "only if", etc. |
| `api_endpoints` | JSON array | (If API spec) Extracted endpoints with method, path, params, responses |
| `parse_warnings` | JSON array | Sections that were unreadable, ambiguous, or empty |

## Decision Logic

1. **Detect source type** from file extension or content structure
2. **Parse document** into sections based on headings (H1, H2, H3)
3. **Extract entities** by identifying nouns and noun phrases
4. **Extract actions** by identifying verbs and verb phrases
5. **Extract constraints** by identifying conditionals ("must", "should", "if", "when")
6. **Flag ambiguities** as parse warnings

## Examples

### Example 1: Markdown PRD

**Input:** `docs/prd.md` (e-commerce PRD)

**Output:**
```json
{
  "raw_sections": [
    { "heading": "User Authentication", "level": 2, "body": "Users must be able to..." },
    { "heading": "Product Catalog", "level": 2, "body": "Products are displayed..." }
  ],
  "entities": ["user", "product", "cart", "order", "payment"],
  "actions": ["register", "login", "search", "add to cart", "checkout", "pay"],
  "constraints": [
    "Users must verify email before checkout",
    "Cart expires after 30 minutes of inactivity"
  ],
  "parse_warnings": []
}
```

### Example 2: OpenAPI Spec

**Input:** `api/openapi.yaml`

**Output:**
```json
{
  "api_endpoints": [
    { "method": "POST", "path": "/auth/login", "params": ["email", "password"], "responses": [200, 401] },
    { "method": "GET", "path": "/products", "params": ["?search", "?page"], "responses": [200] }
  ],
  "entities": ["user", "product", "auth_token"],
  "actions": ["login", "logout", "list_products", "get_product"],
  "parse_warnings": ["Section 'Webhooks' has no endpoint definitions"]
}
```

## Dependencies

- None (leaf skill)
- Tools: `read`, `glob`, `webfetch` (if source is a URL)

## Usage

This skill is invoked by the `qa-analyst` agent during Phase 1 (Requirement Analysis).
