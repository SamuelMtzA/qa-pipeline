/**
 * Skill 2: Exploratory Testing — heuristic implementation
 *
 * Reads Skill 3 capture output (pages-visited.json, selectors.json,
 * dom-snapshot.html) and generates exploration.md by:
 *   - Classifying pages by DOM patterns
 *   - Identifying forms, buttons, links, inputs
 *   - Generating a human-readable exploration report
 *
 * When QA_AGENT=none, this runs as pure code (no LLM needed).
 * When QA_AGENT=opencode, the qa-explorer sub-agent can provide
 * richer analysis (user flows, visual observations, etc).
 */

import fs from 'fs';
import path from 'path';
import { analyzeCapture, PAGE_TYPES } from './_shared/dom-analyzer.js';

const PAGE_TYPE_LABELS = {
  [PAGE_TYPES.AUTH]: 'Authentication',
  [PAGE_TYPES.SEARCH]: 'Search',
  [PAGE_TYPES.LIST]: 'List/Data',
  [PAGE_TYPES.FORM]: 'Form',
  [PAGE_TYPES.DASHBOARD]: 'Dashboard',
  [PAGE_TYPES.LANDING]: 'Landing Page',
  [PAGE_TYPES.ERROR]: 'Error Page',
  [PAGE_TYPES.UNKNOWN]: 'Unknown',
};

/**
 * Run exploratory testing analysis on captured data.
 */
export async function runExploratoryTesting({ config, workspaceDir, memoryData }) {
  const explorationDir = path.join(workspaceDir, 'exploration');
  fs.mkdirSync(explorationDir, { recursive: true });

  const { pages, stats } = analyzeCapture(workspaceDir);

  if (pages.length === 0) {
    const emptyReport = generateReport({ config, pages: [], stats, flows: [], issues: [], screenshots: [] });
    fs.writeFileSync(path.join(explorationDir, 'exploration.md'), emptyReport);
    return { explorationPath: path.join(explorationDir, 'exploration.md'), pagesDiscovered: 0, elementsFound: 0, note: 'No pages captured — run Skill 3 first' };
  }

  const captureDir = path.join(workspaceDir, 'playwright-output');
  const selectorsData = fs.existsSync(path.join(captureDir, 'selectors.json'))
    ? JSON.parse(fs.readFileSync(path.join(captureDir, 'selectors.json'), 'utf-8'))
    : [];

  const allSelectors = selectorsData.flatMap(s => s.selectors || []);
  const flows = detectFlows(pages);
  const issues = detectIssues(pages, stats);
  const screenshots = pages.filter(p => p.screenshot).map(p => ({ page: p.url, file: `../playwright-output/${p.screenshot}` }));

  const report = generateReport({ config, pages, stats, flows, issues, screenshots });

  const explorationPath = path.join(explorationDir, 'exploration.md');
  fs.writeFileSync(explorationPath, report);

  return {
    explorationPath,
    pagesDiscovered: stats.totalPages,
    elementsFound: stats.totalForms + stats.totalInputs + stats.totalButtons + stats.totalLinks,
    formsIdentified: stats.totalForms,
    interactiveElements: stats.totalButtons + stats.totalInputs,
    linksDiscovered: stats.totalLinks,
    flowsDetected: flows.length,
    issuesFound: issues.length,
  };
}

function detectFlows(pages) {
  const flows = [];
  for (let i = 0; i < pages.length - 1; i++) {
    const from = pages[i];
    const to = pages[i + 1];
    if (from.links?.some(l => l.href === to.url)) {
      flows.push({
        name: `${from.title || from.url} → ${to.title || to.url}`,
        steps: [from.url, to.url],
      });
    }
  }
  if (flows.length === 0 && pages.length > 0) {
    flows.push({ name: 'Single page exploration', steps: [pages[0].url] });
  }
  return flows;
}

function detectIssues(pages, stats) {
  const issues = [];
  for (const page of pages) {
    if (page.type === PAGE_TYPES.ERROR) {
      issues.push({ severity: 'critical', page: page.url, description: 'Page appears to be an error page (no headings, no links)' });
    }
    if (page.inputs) {
      const inputsWithoutLabel = page.inputs.filter(i => !i.label || i.label === i.type);
      if (inputsWithoutLabel.length > 0) {
        issues.push({ severity: 'minor', page: page.url, description: `${inputsWithoutLabel.length} input(s) without proper labels (accessibility concern)` });
      }
    }
    if (page.buttons) {
      const buttonsWithoutText = page.buttons.filter(b => !b.label || b.label === 'button');
      if (buttonsWithoutText.length > 0) {
        issues.push({ severity: 'minor', page: page.url, description: `${buttonsWithoutText.length} button(s) without text content` });
      }
    }
  }
  return issues;
}

function generateReport({ config, pages, stats, flows, issues, screenshots }) {
  const date = new Date().toISOString().slice(0, 10);
  const criticalIssues = issues.filter(i => i.severity === 'critical');
  const majorIssues = issues.filter(i => i.severity === 'major');
  const minorIssues = issues.filter(i => i.severity === 'minor');

  let pageSections = '';
  pages.forEach((page, i) => {
    pageSections += `\n### ${i + 1}. ${page.title || 'Untitled'} (${PAGE_TYPE_LABELS[page.type] || page.type})\n\n`;
    pageSections += `- **URL**: ${page.url}\n`;
    pageSections += `- **Type**: ${PAGE_TYPE_LABELS[page.type] || page.type}\n`;
    pageSections += `- **Complexity**: ${page.complexity}\n`;
    pageSections += `- **Forms**: ${page.forms?.length || 0}\n`;
    pageSections += `- **Inputs**: ${page.inputs?.length || 0}\n`;
    pageSections += `- **Buttons**: ${page.buttons?.length || 0}\n`;
    pageSections += `- **Links**: ${page.links?.length || 0}\n`;
    if (page.headings?.length > 0) {
      pageSections += `- **Headings**: ${page.headings.map(h => `H${h.level} "${h.text}"`).join(', ')}\n`;
    }
  });

  let formSections = '';
  let formCount = 0;
  pages.forEach(page => {
    page.forms?.forEach(form => {
      formCount++;
      formSections += `\n### ${formCount}. ${page.title || page.url} Form\n\n`;
      formSections += `- **Page**: ${page.url}\n`;
      formSections += `- **Method**: ${form.method}\n`;
      formSections += `- **Action**: ${form.action || '(same page)'}\n`;
      formSections += `- **Fields**: ${form.fieldCount}\n`;
      if (form.inputs?.length > 0) {
        formSections += `- **Input Labels**: ${form.inputs.map(i => i.label).join(', ')}\n`;
      }
      if (form.buttons?.length > 0) {
        formSections += `- **Buttons**: ${form.buttons.map(b => b.label).join(', ')}\n`;
      }
    });
  });
  if (formCount === 0) formSections = '\n*No forms identified on captured pages.*\n';

  let interactiveSections = '';
  pages.forEach(page => {
    if (page.buttons?.length > 0 || page.inputs?.length > 0) {
      interactiveSections += `\n### ${page.title || page.url}\n\n`;
      if (page.inputs?.length > 0) {
        interactiveSections += `**Inputs:**\n`;
        page.inputs.forEach(i => interactiveSections += `- ${i.label} (${i.type}) → \`${i.selector}\`\n`);
      }
      if (page.buttons?.length > 0) {
        interactiveSections += `**Buttons:**\n`;
        page.buttons.forEach(b => interactiveSections += `- ${b.label} → \`${b.selector}\`\n`);
      }
    }
  });
  if (!interactiveSections) interactiveSections = '\n*No interactive elements found.*\n';

  let flowSections = '';
  flows.forEach((flow, i) => {
    flowSections += `\n### Flow ${i + 1}: ${flow.name}\n\n`;
    flow.sections?.forEach((step, j) => {
      flowSections += `${j + 1}. Navigate to ${step}\n`;
    });
    flow.steps?.forEach((step, j) => {
      flowSections += `${j + 1}. Navigate to ${step}\n`;
    });
  });
  if (flows.length === 0) flowSections = '\n*No multi-step flows detected. Single-page exploration only.*\n';

  let screenshotSections = '';
  screenshots.forEach(s => {
    screenshotSections += `- **${s.page}**: \`${s.file}\`\n`;
  });
  if (screenshots.length === 0) screenshotSections = '*No screenshots captured.*\n';

  return `# Exploratory Testing Report

**URL**: ${config.url}
**Date**: ${date}
**Run ID**: ${config.run_id}
**Engine**: Heuristic (no agent) — generated by DOM pattern analysis

## Application Overview

The application at ${config.url} was explored using automated DOM analysis. ${stats.totalPages} page(s) were discovered and analyzed. The application contains ${stats.totalForms} form(s), ${stats.totalInputs} input field(s), ${stats.totalButtons} button(s), and ${stats.totalLinks} link(s).

## Pages Discovered
${pageSections}

## Navigation Structure

The application has ${stats.totalLinks} internal links across ${stats.totalPages} page(s). Navigation structure was inferred from link analysis.

## Forms Identified
${formSections}

## Interactive Elements
${interactiveSections}

## User Flows Tested
${flowSections}

## Visual Observations

- **Desktop (1440x900)**: Screenshots captured at desktop viewport
- **Tablet**: Not captured in heuristic mode (set QA_AGENT=opencode for multi-viewport)
- **Mobile**: Not captured in heuristic mode (set QA_AGENT=opencode for multi-viewport)

## Issues Found

### Critical Issues
${criticalIssues.length > 0 ? criticalIssues.map(i => `- **[${i.page}]**: ${i.description}`).join('\n') : 'None identified.'}

### Major Issues
${majorIssues.length > 0 ? majorIssues.map(i => `- **[${i.page}]**: ${i.description}`).join('\n') : 'None identified.'}

### Minor Issues
${minorIssues.length > 0 ? minorIssues.map(i => `- **[${i.page}]**: ${i.description}`).join('\n') : 'None identified.'}

## Screenshots
${screenshotSections}

## Recommendations

1. **Review exploration report** for completeness — heuristic mode may miss complex flows
2. **Add accessibility labels** to any inputs identified without proper labels
3. **Run with QA_AGENT=opencode** for deeper analysis (user flows, visual testing, multi-viewport)
4. **Verify page classifications** match expected application structure

## Next Steps

1. Review generated test cases (Skill 4) for coverage gaps
2. Execute generated tests (Skill 5) to validate functionality
3. Review QA report (Skill 6) for verdict and health score

## Summary

**Pages Explored**: ${stats.totalPages}
**Forms Identified**: ${stats.totalForms}
**User Flows Tested**: ${flows.length}
**Critical Issues**: ${criticalIssues.length}
**Major Issues**: ${majorIssues.length}
**Minor Issues**: ${minorIssues.length}

> **Note:** This report was generated by the heuristic engine (QA_AGENT=none). For richer analysis including multi-viewport testing, visual observations, and complex user flow detection, run with \`QA_AGENT=opencode\`.
`;
}
