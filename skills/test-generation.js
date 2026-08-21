/**
 * Skill 4: Test Generation — heuristic/template-based implementation
 *
 * Reads requirements.json (from Skill 1) + selectors.json (from Skill 3)
 * and generates .spec.ts files by:
 *   - Matching features to pages by keyword
 *   - Detecting test patterns from acceptance criteria
 *   - Generating Playwright tests using grounded selectors
 *   - Marking unresolvable matches as [UNVERIFIED]
 *
 * When QA_AGENT=none, this runs as pure code (no LLM needed).
 */

import fs from 'fs';
import path from 'path';
import { generateSpecFile, detectTestPattern } from './_shared/test-templates.js';

/**
 * Generate .spec.ts files from requirements + captured selectors.
 */
export async function runTestGeneration({ config, workspaceDir, memoryData }) {
  const scriptsDir = path.join(workspaceDir, 'playwright', 'scripts');
  fs.mkdirSync(scriptsDir, { recursive: true });

  const requirementsPath = path.join(workspaceDir, 'requirements', 'requirements.json');
  if (!fs.existsSync(requirementsPath)) {
    return { scriptsDir, testsGenerated: 0, coveragePct: 0, note: 'No requirements.json found — run Skill 1 with a PRD' };
  }

  const requirements = JSON.parse(fs.readFileSync(requirementsPath, 'utf-8'));
  const features = requirements.features || [];

  if (features.length === 0) {
    return { scriptsDir, testsGenerated: 0, coveragePct: 0, note: 'No features in requirements.json' };
  }

  const captureDir = path.join(workspaceDir, 'playwright-output');
  const selectorsPath = path.join(captureDir, 'selectors.json');
  let pageSelectors = [];
  if (fs.existsSync(selectorsPath)) {
    pageSelectors = JSON.parse(fs.readFileSync(selectorsPath, 'utf-8'));
  }

  const pagesVisitedPath = path.join(captureDir, 'pages-visited.json');
  let pagesVisited = [];
  if (fs.existsSync(pagesVisitedPath)) {
    pagesVisited = JSON.parse(fs.readFileSync(pagesVisitedPath, 'utf-8'));
  }

  const generatedFiles = [];
  let totalTests = 0;
  let verifiedTests = 0;
  let unverifiedTests = 0;

  for (const feature of features) {
    const matchedPage = matchFeatureToPage(feature, pagesVisited, pageSelectors);
    const selectors = getSelectorsForPage(matchedPage, pageSelectors);

    const spec = generateSpecFile({ feature, page: matchedPage, selectors });
    const specPath = path.join(scriptsDir, spec.fileName);
    fs.writeFileSync(specPath, spec.content);
    generatedFiles.push(spec.fileName);

    const testCount = (spec.content.match(/^test\(/gm) || []).length;
    const unverifiedCount = (spec.content.match(/^test\(.*\[UNVERIFIED\]/gm) || []).length;
    totalTests += testCount;
    verifiedTests += testCount - unverifiedCount;
    unverifiedTests += unverifiedCount;
  }

  const testPlanPath = path.join(scriptsDir, 'test-plan.json');
  const testPlan = {
    run_id: config.run_id,
    generated_at: new Date().toISOString(),
    engine: 'heuristic',
    features: features.length,
    tests: totalTests,
    verified: verifiedTests,
    unverified: unverifiedTests,
    files: generatedFiles,
    coverage: features.length > 0 ? Math.round((verifiedTests / Math.max(totalTests, 1)) * 100) : 0,
  };
  fs.writeFileSync(testPlanPath, JSON.stringify(testPlan, null, 2));

  return {
    scriptsDir,
    testsGenerated: totalTests,
    verifiedTests,
    unverifiedTests,
    coveragePct: testPlan.coverage,
    files: generatedFiles,
    testPlanPath,
  };
}

/**
 * Match a feature to the best page based on keyword matching.
 */
function matchFeatureToPage(feature, pagesVisited, pageSelectors) {
  if (!pagesVisited || pagesVisited.length === 0) {
    return { url: '', title: '', type: 'unknown' };
  }

  const featureName = (feature.name || '').toLowerCase();
  const featureDesc = (feature.description || '').toLowerCase();
  const searchTerms = featureName.split(/\s+/).concat(featureDesc.split(/\s+/)).filter(t => t.length > 2);

  let bestPage = pagesVisited[0];
  let bestScore = 0;

  for (const page of pagesVisited) {
    const pageTitle = (page.title || '').toLowerCase();
    const pageRoute = (page.route || '').toLowerCase();
    const pageUrl = (page.url || '').toLowerCase();

    let score = 0;
    for (const term of searchTerms) {
      if (pageTitle.includes(term)) score += 3;
      if (pageRoute.includes(term)) score += 2;
      if (pageUrl.includes(term)) score += 1;
    }

    if (score > bestScore) {
      bestScore = score;
      bestPage = page;
    }
  }

  return {
    url: bestPage.url,
    title: bestPage.title || '',
    route: bestPage.route || '',
    type: bestPage.type || 'unknown',
  };
}

/**
 * Get all selectors for a given page from the captured selectors data.
 */
function getSelectorsForPage(page, pageSelectors) {
  if (!page.route || !pageSelectors) return [];
  const pageData = pageSelectors.find(s => s.page === page.route);
  if (!pageData) return [];
  return pageData.selectors || [];
}
