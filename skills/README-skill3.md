# Skill 3: Playwright MCP Integration

## Overview

Capture comprehensive page data including DOM structure, screenshots, console logs, and network requests using Playwright MCP tools.

## Input

- **URL**: The web page URL to capture (e.g., `https://example.com`)
- **Output Directory**: Directory to save outputs (default: `playwright-output`)

## Output

Four types of output:

### 1. DOM Snapshot
- **File**: `dom-snapshot.json`
- **Format**: JSON representation of accessibility tree
- **Content**: All interactive elements, forms, buttons, inputs, links

### 2. Screenshots
- **Files**: 
  - `screenshot-desktop.png` (1920x1080)
  - `screenshot-tablet.png` (768x1024)
  - `screenshot-mobile.png` (375x667)
- **Format**: PNG images at three viewport sizes

### 3. Console Logs
- **File**: `console-logs.json`
- **Format**: JSON array of console messages
- **Content**: Errors, warnings, info messages with timestamps and locations

### 4. Network Requests
- **File**: `network-requests.json`
- **Format**: JSON array of network requests
- **Content**: URL, method, status, duration, size, type for each request

### 5. Summary Report
- **File**: `summary.md`
- **Format**: Markdown summary of all captured data
- **Content**: Statistics, issues detected, recommendations

## Usage

This skill is designed to be used by an AI agent with access to Playwright MCP tools.

### Agent Workflow

```bash
# Start OpenCode with Playwright MCP
opencode

# Invoke the skill
@playwright-mcp https://example.com
```

### Manual Execution

The agent follows these steps:

1. Create output directory
2. Navigate to URL using `browser_navigate`
3. Wait for page load (networkidle)
4. Capture DOM using `browser_snapshot`
5. Take screenshots at three viewport sizes:
   - Desktop: `browser_resize(1920, 1080)` → `browser_take_screenshot`
   - Tablet: `browser_resize(768, 1024)` → `browser_take_screenshot`
   - Mobile: `browser_resize(375, 667)` → `browser_take_screenshot`
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

## Output Examples

### DOM Snapshot Structure

```json
{
  "url": "https://example.com",
  "title": "Example Domain",
  "timestamp": "2026-01-15T10:30:00Z",
  "viewport": { "width": 1920, "height": 1080 },
  "elements": [
    {
      "role": "link",
      "name": "Home",
      "href": "/",
      "selector": "a[href='/']"
    }
  ],
  "forms": [],
  "buttons": [],
  "inputs": [],
  "links": [],
  "summary": {
    "totalElements": 45,
    "forms": 1,
    "buttons": 3,
    "inputs": 1,
    "links": 10
  }
}
```

### Console Logs Structure

```json
{
  "url": "https://example.com",
  "timestamp": "2026-01-15T10:30:00Z",
  "messages": [
    {
      "type": "error",
      "text": "Failed to load resource",
      "location": "favicon.ico",
      "timestamp": "2026-01-15T10:30:01Z"
    }
  ],
  "summary": {
    "errors": 1,
    "warnings": 0,
    "info": 0,
    "total": 1
  }
}
```

### Network Requests Structure

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
      "size": 15234,
      "type": "document",
      "contentType": "text/html"
    }
  ],
  "summary": {
    "total": 11,
    "successful": 10,
    "failed": 1,
    "totalSize": 3366102,
    "totalDuration": 2458
  }
}
```

## Testing

```bash
# Validate captured data
node tests/test-playwright-mcp.js playwright-output
```

## Sample Output

See `playwright-output/` directory for sample outputs:
- `dom-snapshot.json` - 45 elements, 1 form, 3 buttons
- `console-logs.json` - 8 messages (1 error, 3 warnings, 4 info)
- `network-requests.json` - 11 requests (10 successful, 1 failed)
- `screenshot-*.png` - Screenshots at 3 viewport sizes
- `summary.md` - Comprehensive summary report

## Integration with Other Skills

This skill is used by:
- **Skill 2 (Exploratory Testing)**: Captures page data during exploration
- **Skill 4 (Test Generation)**: Uses DOM snapshot to identify testable elements
- **Skill 5 (Execution)**: Captures page data during test execution
- **Skill 6 (Reporting)**: Uses captured data in final report

## Error Handling

- **URL not accessible**: Error with status code
- **Page load timeout**: Warning, capture what's available
- **Screenshot fails**: Warning, continue with other captures
- **Console logs empty**: Normal, save empty array
- **Network requests empty**: Normal, save empty array

## Performance

- **Capture time**: ~3-5 seconds for typical page
- **Output size**: ~500 KB - 2 MB depending on page complexity
- **Network idle wait**: Up to 30 seconds

## Limitations

- **Static capture**: Only captures initial page state
- **No interaction**: Doesn't click or type
- **No authentication**: Captures public pages only
- **Three viewports only**: Desktop, tablet, mobile

## Files

- `.opencode/skills/playwright-mcp/SKILL.md` - Skill definition
- `playwright-output/` - Sample outputs
- `tests/test-playwright-mcp.js` - Validation script
- `skills/README-skill3.md` - This documentation
