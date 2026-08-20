---
name: explore-ui
description: Walk a live web application to discover pages, navigation structure, and interactive elements. Use for exploratory testing and app mapping.
---

# Explore UI

Walk a live web application like a real user, discovering pages, mapping flows, and capturing evidence.

## Purpose

Navigate the target URL, discover every page and interactive element, capture screenshots and evidence, and produce a structured app map.

## Input

| Field | Required | Format | Description |
|-------|----------|--------|-------------|
| `target_url` | Yes | URL string | Starting URL for exploration |
| `credentials` | No | `{ username, password }` | Test credentials for authenticated areas |
| `feature_map` | No | JSON | From extract-user-stories (guides exploration focus) |
| `max_pages` | No | Integer | Page limit (default: 50) |
| `max_duration_min` | No | Integer | Time limit in minutes (default: 8) |

## Output

| Field | Format | Description |
|-------|--------|-------------|
| `app_map` | JSON | Structured app map (pages, elements, links, flows) |
| `app_map_md` | Markdown string | Human-readable app map |
| `screenshots` | PNG files | Per-page screenshots at 3 viewports |
| `discovery_stats` | JSON | Pages discovered, links tested, broken links |

## App Map Schema

```json
{
  "pages": [
    {
      "url": "https://app.example.com/login",
      "title": "Login",
      "type": "auth",
      "elements": [
        { "selector": "getByLabel('Email')", "type": "input", "label": "Email" },
        { "selector": "getByRole('button', { name: 'Sign In' })", "type": "button", "label": "Sign In" }
      ],
      "links_to": ["/dashboard", "/forgot-password"],
      "screenshots": {
        "mobile": "screenshots/login-375.png",
        "tablet": "screenshots/login-768.png",
        "desktop": "screenshots/login-1440.png"
      }
    }
  ],
  "flows": [
    {
      "name": "Login → Dashboard",
      "steps": ["/login", "/dashboard"]
    }
  ],
  "stats": {
    "pages_discovered": 22,
    "links_tested": 87,
    "broken_links": 2
  }
}
```

## Decision Logic

### Exploration Strategy

1. **Start at target_url**
2. **Take accessibility snapshot** to understand page structure
3. **Screenshot at 3 viewports**: 375px (mobile), 768px (tablet), 1440px (desktop)
4. **Extract all navigation links** and menu items
5. **Build URL queue** for breadth-first discovery
6. **For each URL in queue**:
   - Navigate to URL
   - Take snapshot and screenshots
   - Record interactive elements (buttons, forms, links)
   - Check for console errors
   - Check for network failures
   - Add newly discovered links to queue
7. **Identify user flows** from page sequences
8. **Stop when**: all URLs visited OR max_pages OR max_duration

### Safety Rules

- **Read-only by default**: Do NOT click mutating buttons (delete, purchase, submit order)
- **Never enter real credentials** — only use test credentials from input
- **Respect rate limits** — wait 500ms between rapid page navigations

### Element Inspection

At each page, identify:
- Buttons: `getByRole('button')`
- Links: `getByRole('link')`
- Forms: `getByRole('form')`
- Inputs: `getByRole('textbox')`, `getByLabel()`
- Selects: `getByRole('combobox')`

## Examples

### Example: SaaS Dashboard

**Input:** `target_url = "https://staging.myapp.com"`

**Output:**
```json
{
  "pages": [
    {
      "url": "/login",
      "title": "Login",
      "elements": [
        { "selector": "getByLabel('Email')", "type": "input" },
        { "selector": "getByLabel('Password')", "type": "input" },
        { "selector": "getByRole('button', { name: 'Sign In' })", "type": "button" }
      ],
      "links_to": ["/dashboard", "/forgot-password"]
    },
    {
      "url": "/dashboard",
      "title": "Dashboard",
      "elements": [
        { "selector": "getByRole('navigation')", "type": "nav" },
        { "selector": "getByRole('button', { name: 'New Project' })", "type": "button" }
      ],
      "links_to": ["/settings", "/profile"]
    }
  ],
  "flows": [
    { "name": "Login Flow", "steps": ["/login", "/dashboard"] }
  ],
  "stats": {
    "pages_discovered": 22,
    "links_tested": 87,
    "broken_links": 2
  }
}
```

## Dependencies

- **Skills**: None (leaf skill)
- **Tools**: `playwright_browser_navigate`, `playwright_browser_snapshot`, `playwright_browser_take_screenshot`, `playwright_browser_click`, `playwright_browser_resize`, `read`, `write`

## Usage

This skill is invoked by the `qa-explorer` agent during Phase 2 (Exploratory Testing).
