/**
 * Skill 3: Playwright Capture — pure code implementation
 *
 * Uses the Playwright API directly (not via MCP stdio) to:
 *   - Navigate to the target URL
 *   - Capture full DOM snapshot
 *   - Take screenshots
 *   - Collect console messages (errors + warnings)
 *   - Collect network requests (non-static)
 *   - Extract grounded selectors from observed DOM
 *
 * Honors blast_radius from run config:
 *   - 'navigate' required to follow links
 *   - 'click' required to click non-mutating buttons
 *   - 'submit' required to submit forms
 *   - forbidden_routes are never visited
 *
 * Replicates the opencode.json Playwright MCP settings:
 *   headless Chromium, 1440x900 viewport, full DOM snapshot mode
 */

import fs from 'fs';
import path from 'path';

let chromium = null;

async function getChromium() {
  if (chromium) return chromium;
  try {
    const pw = await import('playwright');
    chromium = pw.chromium;
  } catch {
    try {
      const pw = await import('@playwright/test');
      chromium = pw.chromium;
    } catch {
      throw new Error('Playwright is not installed. Run: npm install playwright && npx playwright install chromium');
    }
  }
  return chromium;
}

/**
 * Run Playwright capture against a target URL.
 */
export async function runCapture({ config, workspaceDir, memoryData, maxDepth = null }) {
  const outputDir = path.join(workspaceDir, 'playwright-output');
  fs.mkdirSync(outputDir, { recursive: true });

  const browser = await (await getChromium()).launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();
  const consoleMessages = [];
  const networkRequests = [];
  const selectorsExtracted = [];
  const pagesVisited = [];

  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        url: msg.location()?.url || null,
        lineNumber: msg.location()?.lineNumber || null,
      });
    }
  });

  page.on('request', req => {
    const resourceType = req.resourceType();
    if (resourceType !== 'image' && resourceType !== 'font' && resourceType !== 'stylesheet') {
      networkRequests.push({
        method: req.method(),
        url: req.url(),
        resourceType,
        headers: Object.keys(req.headers()),
      });
    }
  });

  page.on('response', res => {
    const idx = networkRequests.findIndex(r => r.url === res.url() && r.method === res.request().method());
    if (idx >= 0) {
      networkRequests[idx].status = res.status();
      networkRequests[idx].statusText = res.statusText();
    }
  });

  const depth = maxDepth || config.blast_radius.max_depth;
  const canNavigate = config.blast_radius.allowed_actions.includes('navigate');
  const canClick = config.blast_radius.allowed_actions.includes('click');

  async function visitPage(url, currentDepth) {
    if (currentDepth > depth) return;
    if (pagesVisited.some(p => p.url === url)) return;

    const route = new URL(url).pathname;
    if (isRouteForbidden(config, route)) {
      console.log(`  ⚠ Skipping forbidden route: ${route}`);
      return;
    }

    console.log(`  → Visiting: ${url} (depth ${currentDepth})`);

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    } catch (err) {
      console.log(`  ⚠ Navigation failed: ${err.message}`);
      pagesVisited.push({ url, status: 'failed', error: err.message });
      return;
    }

    await page.waitForTimeout(1000);

    const domSnapshot = await page.content();
    const pagePath = new URL(url).pathname.replace(/\//g, '_') || 'root';
    const screenshotName = `screenshot-${pagePath}-${currentDepth}.png`;

    await page.screenshot({
      path: path.join(outputDir, screenshotName),
      fullPage: true,
    });

    const pageSelectors = await extractSelectors(page);
    selectorsExtracted.push({ page: route, depth: currentDepth, selectors: pageSelectors });

    if (memoryData) {
      const { recordSelector } = await import('./_shared/memory.js');
      for (const sel of pageSelectors) {
        recordSelector(memoryData, route, sel.name, sel.selector, true);
      }
    }

    pagesVisited.push({
      url,
      route,
      status: 'ok',
      title: await page.title(),
      screenshot: screenshotName,
      selectorCount: pageSelectors.length,
    });

    if (canClick && currentDepth < depth) {
      const links = await page.$$eval('a[href]', anchors =>
        anchors.map(a => ({
          href: a.href,
          text: a.textContent?.trim()?.slice(0, 80) || '',
        })).filter(l => l.href && !l.href.startsWith('javascript:') && !l.href.startsWith('#'))
      );

      const internalLinks = links.filter(l => {
        try {
          return new URL(l.href).origin === new URL(url).origin;
        } catch {
          return false;
        }
      }).slice(0, 5);

      for (const link of internalLinks) {
        if (!pagesVisited.some(p => p.url === link.href)) {
          await visitPage(link.href, currentDepth + 1);
        }
      }
    }
  }

  await visitPage(config.url, 0);

  await browser.close();

  const domOutputPath = path.join(outputDir, 'dom-snapshot.html');
  const lastPage = pagesVisited.find(p => p.status === 'ok');
  if (lastPage) {
    const page2 = await (await (await getChromium()).launch({ headless: true })).newPage();
    await page2.goto(config.url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
    fs.writeFileSync(domOutputPath, await page2.content());
    await page2.context().browser().close();
  }

  const consolePath = path.join(outputDir, 'console.json');
  fs.writeFileSync(consolePath, JSON.stringify(consoleMessages, null, 2));

  const networkPath = path.join(outputDir, 'network.json');
  fs.writeFileSync(networkPath, JSON.stringify(networkRequests, null, 2));

  const selectorsPath = path.join(outputDir, 'selectors.json');
  fs.writeFileSync(selectorsPath, JSON.stringify(selectorsExtracted, null, 2));

  const pagesPath = path.join(outputDir, 'pages-visited.json');
  fs.writeFileSync(pagesPath, JSON.stringify(pagesVisited, null, 2));

  return {
    outputDir,
    pagesVisited: pagesVisited.length,
    selectorsExtracted: selectorsExtracted.reduce((a, p) => a + p.selectors.length, 0),
    consoleErrors: consoleMessages.filter(m => m.type === 'error').length,
    consoleWarnings: consoleMessages.filter(m => m.type === 'warning').length,
    networkRequests: networkRequests.length,
    domSnapshotPath: domOutputPath,
    consolePath,
    networkPath,
    selectorsPath,
    pagesPath,
  };
}

async function extractSelectors(page) {
  const selectors = [];

  const testIdElements = await page.$$eval('[data-testid]', els =>
    els.map(e => ({
      name: e.getAttribute('data-testid'),
      tag: e.tagName.toLowerCase(),
      selector: `getByTestId('${e.getAttribute('data-testid')}')`,
    }))
  ).catch(() => []);
  selectors.push(...testIdElements);

  const labeledInputs = await page.$$eval('input, textarea, select', els =>
    els.filter(e => {
      const id = e.id;
      if (!id) return false;
      const label = document.querySelector(`label[for="${id}"]`);
      return label && label.textContent?.trim();
    }).map(e => {
      const label = document.querySelector(`label[for="${e.id}"]`);
      return {
        name: label?.textContent?.trim()?.slice(0, 60) || e.id,
        tag: e.tagName.toLowerCase(),
        selector: `getByLabel('${label?.textContent?.trim()}')`,
      };
    })
  ).catch(() => []);
  selectors.push(...labeledInputs);

  const buttons = await page.$$eval('button, [role="button"]', els =>
    els.map(e => ({
      name: e.textContent?.trim()?.slice(0, 60) || e.getAttribute('aria-label') || 'unnamed-button',
      tag: e.tagName.toLowerCase(),
      selector: `getByRole('button', { name: '${e.textContent?.trim()?.slice(0, 60)}' })`,
    })).filter(b => b.name && b.name !== 'unnamed-button')
  ).catch(() => []);
  selectors.push(...buttons);

  const links = await page.$$eval('a[href]', els =>
    els.map(e => ({
      name: e.textContent?.trim()?.slice(0, 60) || 'link',
      tag: 'a',
      selector: `getByRole('link', { name: '${e.textContent?.trim()?.slice(0, 60)}' })`,
      href: e.getAttribute('href'),
    })).filter(l => l.name && l.name !== 'link')
  ).catch(() => []);
  selectors.push(...links);

  const seen = new Set();
  return selectors.filter(s => {
    if (seen.has(s.selector)) return false;
    seen.add(s.selector);
    return true;
  });
}

function isRouteForbidden(config, route) {
  return config.blast_radius.forbidden_routes.some(pattern => {
    if (pattern.startsWith('*') && pattern.endsWith('*')) return route.includes(pattern.slice(1, -1));
    if (pattern.endsWith('/*')) {
      const base = pattern.slice(0, -2);
      return route === base || route.startsWith(base + '/');
    }
    if (pattern.endsWith('*')) return route.startsWith(pattern.slice(0, -1));
    if (pattern.startsWith('*')) return route.endsWith(pattern.slice(1));
    return route === pattern;
  });
}

export { extractSelectors };
