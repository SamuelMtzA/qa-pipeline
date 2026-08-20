---
name: playwright-mcp
description: Capture DOM, screenshots, console logs, and network requests from a web page using Playwright MCP. Use this skill when you need to gather comprehensive page data for testing or analysis.
---

# Playwright MCP Skill

## Purpose

Capture comprehensive page data including DOM structure, screenshots, console logs, and network requests using Playwright MCP tools.

## Input

- `url`: The URL of the web page to capture (e.g., `https://example.com`)
- `output_dir`: Directory to save outputs (default: `playwright-output`)

## Output

The skill produces four types of output:

### 1. DOM Snapshot
- **File**: `{output_dir}/dom-snapshot.json`
- **Format**: JSON representation of the page's accessibility tree
- **Content**: All interactive elements, their roles, names, and states

### 2. Screenshots
- **Files**: 
  - `{output_dir}/screenshot-desktop.png` (1920x1080)
  - `{output_dir}/screenshot-tablet.png` (768x1024)
  - `{output_dir}/screenshot-mobile.png` (375x667)
- **Format**: PNG images at three viewport sizes

### 3. Console Logs
- **File**: `{output_dir}/console-logs.json`
- **Format**: JSON array of console messages
- **Content**: Errors, warnings, info messages with timestamps

### 4. Network Requests
- **File**: `{output_dir}/network-requests.json`
- **Format**: JSON array of network requests
- **Content**: URL, method, status, duration, response size

## Process

1. Create output directory if it doesn't exist
2. Navigate to the target URL
3. Wait for page to fully load (networkidle)
4. Capture DOM snapshot using `browser_snapshot`
5. Take screenshots at three viewport sizes
6. Capture console logs using `browser_console_messages`
7. Capture network requests using `browser_network_requests`
8. Save all outputs to files
9. Generate summary report

## Playwright MCP Tools Used

| Tool | Purpose | Output |
|------|---------|--------|
| `browser_navigate` | Navigate to URL | - |
| `browser_snapshot` | Get accessibility tree | dom-snapshot.json |
| `browser_take_screenshot` | Capture screenshots | screenshot-*.png |
| `browser_resize` | Change viewport size | - |
| `browser_console_messages` | Get console logs | console-logs.json |
| `browser_network_requests` | Get network requests | network-requests.json |

## Example Output

### dom-snapshot.json

```json
{
  "url": "https://example.com",
  "title": "Example Domain",
  "timestamp": "2026-01-15T10:30:00Z",
  "viewport": {
    "width": 1920,
    "height": 1080
  },
  "elements": [
    {
      "role": "heading",
      "name": "Example Domain",
      "level": 1,
      "selector": "h1"
    },
    {
      "role": "link",
      "name": "More information...",
      "href": "https://www.iana.org/domains/example",
      "selector": "a"
    }
  ],
  "forms": [],
  "buttons": [],
  "inputs": []
}
```

### console-logs.json

```json
{
  "url": "https://example.com",
  "timestamp": "2026-01-15T10:30:00Z",
  "messages": [
    {
      "type": "error",
      "text": "Failed to load resource: net::ERR_FAILED",
      "location": "https://example.com/favicon.ico",
      "timestamp": "2026-01-15T10:30:01Z"
    },
    {
      "type": "warning",
      "text": "Deprecated API usage detected",
      "location": "app.js:42",
      "timestamp": "2026-01-15T10:30:02Z"
    },
    {
      "type": "info",
      "text": "Application initialized",
      "location": "app.js:1",
      "timestamp": "2026-01-15T10:30:00Z"
    }
  ],
  "summary": {
    "errors": 1,
    "warnings": 1,
    "info": 1,
    "total": 3
  }
}
```

### network-requests.json

```json
{
  "url": "https://example.com",
  "timestamp": "2026-01-15T10:30:00Z",
  "requests": [
    {
      "url": "https://example.com/",
      "method": "GET",
      "status": 200,
      "statusText": "OK",
      "duration": 245,
      "size": 1256,
      "type": "document"
    },
    {
      "url": "https://example.com/style.css",
      "method": "GET",
      "status": 200,
      "statusText": "OK",
      "duration": 89,
      "size": 4521,
      "type": "stylesheet"
    },
    {
      "url": "https://example.com/favicon.ico",
      "method": "GET",
      "status": 404,
      "statusText": "Not Found",
      "duration": 156,
      "size": 0,
      "type": "image"
    }
  ],
  "summary": {
    "total": 3,
    "successful": 2,
    "failed": 1,
    "totalSize": 5777,
    "totalDuration": 490
  }
}
```

### summary.md

```markdown
# Playwright MCP Capture Report

**URL**: https://example.com
**Timestamp**: 2026-01-15T10:30:00Z

## DOM Snapshot
- **Elements**: 2
- **Forms**: 0
- **Buttons**: 0
- **Inputs**: 0

## Screenshots
- Desktop (1920x1080): screenshot-desktop.png
- Tablet (768x1024): screenshot-tablet.png
- Mobile (375x667): screenshot-mobile.png

## Console Logs
- **Errors**: 1
- **Warnings**: 1
- **Info**: 1
- **Total**: 3

### Errors
- Failed to load resource: net::ERR_FAILED (favicon.ico)

### Warnings
- Deprecated API usage detected (app.js:42)

## Network Requests
- **Total**: 3
- **Successful**: 2
- **Failed**: 1
- **Total Size**: 5.8 KB
- **Total Duration**: 490ms

### Failed Requests
- https://example.com/favicon.ico (404 Not Found)

## Files Generated
- dom-snapshot.json
- screenshot-desktop.png
- screenshot-tablet.png
- screenshot-mobile.png
- console-logs.json
- network-requests.json
- summary.md
```

## Usage

```bash
# Capture page data
@playwright-mcp https://example.com

# Specify output directory
@playwright-mcp https://example.com my-output-dir
```

## Agent Workflow

1. Agent reads skill instructions
2. Agent creates output directory
3. Agent navigates to URL using `browser_navigate`
4. Agent waits for page load (networkidle)
5. Agent captures DOM using `browser_snapshot`
6. Agent takes screenshots at three viewport sizes:
   - Desktop: `browser_resize(1920, 1080)` → `browser_take_screenshot`
   - Tablet: `browser_resize(768, 1024)` → `browser_take_screenshot`
   - Mobile: `browser_resize(375, 667)` → `browser_take_screenshot`
7. Agent captures console logs using `browser_console_messages`
8. Agent captures network requests using `browser_network_requests`
9. Agent saves all outputs to files
10. Agent generates summary report

## Validation

The skill validates:
- URL is accessible
- DOM snapshot captured
- At least one screenshot captured
- Console logs captured (may be empty)
- Network requests captured (may be empty)

## Error Handling

- **URL not accessible**: Error with status code
- **Page load timeout**: Warning, capture what's available
- **Screenshot fails**: Warning, continue with other captures
- **Console logs empty**: Normal, save empty array
- **Network requests empty**: Normal, save empty array

## Integration with Other Skills

This skill is used by:
- **Skill 2 (Exploratory Testing)**: Captures page data during exploration
- **Skill 5 (Execution)**: Captures page data during test execution
- **Skill 6 (Reporting)**: Uses captured data in final report

## Limitations

- **Static capture**: Only captures initial page state
- **No interaction**: Doesn't click or type (use exploratory-testing for that)
- **No authentication**: Captures public pages only
- **Three viewports only**: Desktop, tablet, mobile

## Performance Considerations

- **Network idle wait**: Waits up to 30 seconds for network to settle
- **Screenshot size**: PNG format, ~100-500 KB per screenshot
- **DOM snapshot size**: JSON format, ~10-100 KB depending on page complexity
- **Console logs**: Typically small (<10 KB)
- **Network requests**: Typically small (<50 KB)

## Files

- `.opencode/skills/playwright-mcp/SKILL.md` - This skill definition
- `skills/README-skill3.md` - Documentation
