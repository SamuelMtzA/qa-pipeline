/**
 * DOM Analyzer — pattern recognition for page classification
 *
 * Reads DOM snapshots and selector data from Skill 3 (Playwright Capture)
 * and classifies pages, identifies forms, and groups interactive elements.
 */

import fs from 'fs';
import path from 'path';

const PAGE_TYPES = {
  AUTH: 'auth', SEARCH: 'search', LIST: 'list', FORM: 'form',
  DASHBOARD: 'dashboard', LANDING: 'landing', ERROR: 'error', UNKNOWN: 'unknown',
};

export function analyzeDom(html, url, title = '') {
  const forms = extractForms(html);
  const inputs = extractInputs(html);
  const buttons = extractButtons(html);
  const links = extractLinks(html, url);
  const tables = extractTables(html);
  const images = extractImages(html);
  const headings = extractHeadings(html);
  const navElements = extractNav(html);
  const pageType = classifyPage({ forms, inputs, buttons, links, tables, headings, navElements });
  const complexity = calculateComplexity({ forms, inputs, buttons, links, tables, images });
  return { url, title, type: pageType, forms, inputs, buttons, links, tables, images: images.length, headings, navElements, complexity };
}

function classifyPage({ forms, inputs, buttons, links, tables, headings, navElements }) {
  const hasPasswordField = inputs.some(i => i.type === 'password');
  const hasEmailField = inputs.some(i => i.type === 'email' || i.label?.toLowerCase().includes('email'));
  const hasSearchInput = inputs.some(i => i.type === 'search' || i.label?.toLowerCase().includes('search'));
  const hasTable = tables.length > 0;
  const hasManyLinks = links.length > 10;
  const hasForm = forms.length > 0;
  const hasManyInputs = inputs.length >= 3;
  if (hasPasswordField && (hasEmailField || inputs.length <= 3)) return PAGE_TYPES.AUTH;
  if (hasSearchInput) return PAGE_TYPES.SEARCH;
  if (hasTable) return PAGE_TYPES.LIST;
  if (hasForm && hasManyInputs) return PAGE_TYPES.FORM;
  if (hasManyLinks && navElements.length > 0 && !hasForm) return PAGE_TYPES.DASHBOARD;
  if (headings.length > 0 && links.length > 3 && !hasForm) return PAGE_TYPES.LANDING;
  if (headings.length === 0 && links.length === 0) return PAGE_TYPES.ERROR;
  return PAGE_TYPES.UNKNOWN;
}

function extractForms(html) {
  const forms = [];
  const formRegex = /<form[^>]*>([\s\S]*?)<\/form>/gi;
  let match;
  while ((match = formRegex.exec(html)) !== null) {
    const formHtml = match[0];
    const actionMatch = formHtml.match(/action=["']([^"']*)["']/i);
    const methodMatch = formHtml.match(/method=["']([^"']*)["']/i);
    const formInputs = extractInputs(formHtml);
    const formButtons = extractButtons(formHtml);
    forms.push({ action: actionMatch?.[1] || null, method: methodMatch?.[1]?.toUpperCase() || 'GET', inputs: formInputs, buttons: formButtons, fieldCount: formInputs.length });
  }
  return forms;
}

function extractInputs(html) {
  const inputs = [];
  const inputRegex = /<input[^>]*>/gi;
  let match;
  while ((match = inputRegex.exec(html)) !== null) {
    const tag = match[0];
    const type = tag.match(/type=["']([^"']*)["']/i)?.[1] || 'text';
    const name = tag.match(/name=["']([^"']*)["']/i)?.[1] || null;
    const placeholder = tag.match(/placeholder=["']([^"']*)["']/i)?.[1] || null;
    const id = tag.match(/id=["']([^"']*)["']/i)?.[1] || null;
    const ariaLabel = tag.match(/aria-label=["']([^"']*)["']/i)?.[1] || null;
    const label = findLabel(html, id) || placeholder || ariaLabel || name || type;
    inputs.push({ tag: 'input', type, name, placeholder, id, label, selector: buildSelector('input', type, label, id) });
  }
  const textareaRegex = /<textarea[^>]*>([\s\S]*?)<\/textarea>/gi;
  while ((match = textareaRegex.exec(html)) !== null) {
    const tag = match[0];
    const name = tag.match(/name=["']([^"']*)["']/i)?.[1] || null;
    const id = tag.match(/id=["']([^"']*)["']/i)?.[1] || null;
    const placeholder = tag.match(/placeholder=["']([^"']*)["']/i)?.[1] || null;
    const label = findLabel(html, id) || placeholder || name || 'textarea';
    inputs.push({ tag: 'textarea', type: 'textarea', name, placeholder, id, label, selector: `getByLabel('${label}')` });
  }
  const selectRegex = /<select[^>]*>([\s\S]*?)<\/select>/gi;
  while ((match = selectRegex.exec(html)) !== null) {
    const tag = match[0];
    const name = tag.match(/name=["']([^"']*)["']/i)?.[1] || null;
    const id = tag.match(/id=["']([^"']*)["']/i)?.[1] || null;
    const label = findLabel(html, id) || name || 'select';
    inputs.push({ tag: 'select', type: 'select', name, id, label, selector: `getByLabel('${label}')` });
  }
  return inputs;
}

function findLabel(html, id) {
  if (!id) return null;
  const labelRegex = new RegExp(`<label[^>]*for=["']${id}["'][^>]*>([^<]+)</label>`, 'i');
  const match = html.match(labelRegex);
  return match?.[1]?.trim() || null;
}

function buildSelector(tag, type, label, id) {
  if (label) return `getByLabel('${label}')`;
  if (id) return `#${id}`;
  if (type === 'password') return `getByLabel('Password')`;
  if (type === 'email') return `getByLabel('Email')`;
  return `getByRole('textbox')`;
}

function extractButtons(html) {
  const buttons = [];
  const buttonRegex = /<(button|a[^>]*role=["']button["'])[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  while ((match = buttonRegex.exec(html)) !== null) {
    const text = match[2]?.replace(/<[^>]*>/g, '').trim().slice(0, 60);
    if (text) buttons.push({ tag: 'button', label: text, selector: `getByRole('button', { name: '${text}' })` });
  }
  const inputButtonRegex = /<input[^>]*type=["'](submit|button|reset)["'][^>]*>/gi;
  while ((match = inputButtonRegex.exec(html)) !== null) {
    const value = match[0].match(/value=["']([^"']*)["']/i)?.[1] || match[1];
    buttons.push({ tag: 'input', label: value, selector: `getByRole('button', { name: '${value}' })` });
  }
  return buttons;
}

function extractLinks(html, baseUrl) {
  const links = [];
  const linkRegex = /<a[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    const text = match[2]?.replace(/<[^>]*>/g, '').trim().slice(0, 60);
    if (!href || href.startsWith('javascript:') || href === '#') continue;
    try {
      const resolved = new URL(href, baseUrl).href;
      links.push({ href: resolved, text, selector: text ? `getByRole('link', { name: '${text}' })` : null });
    } catch {
      links.push({ href, text, selector: text ? `getByRole('link', { name: '${text}' })` : null });
    }
  }
  return links;
}

function extractTables(html) {
  const tables = [];
  const tableRegex = /<table[^>]*>/gi;
  let match;
  while ((match = tableRegex.exec(html)) !== null) tables.push({ tag: 'table' });
  return tables;
}

function extractImages(html) {
  const images = [];
  const imgRegex = /<img[^>]*src=["']([^"']*)["']/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null) images.push({ src: match[1] });
  return images;
}

function extractHeadings(html) {
  const headings = [];
  const headingRegex = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match;
  while ((match = headingRegex.exec(html)) !== null) {
    const text = match[2]?.replace(/<[^>]*>/g, '').trim();
    if (text) headings.push({ level: parseInt(match[1]), text: text.slice(0, 80) });
  }
  return headings;
}

function extractNav(html) {
  const nav = [];
  const navRegex = /<(nav|header)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  while ((match = navRegex.exec(html)) !== null) {
    const navLinks = extractLinks(match[2], '');
    nav.push({ links: navLinks.length });
  }
  return nav;
}

function calculateComplexity({ forms, inputs, buttons, links, tables, images }) {
  let score = 0;
  score += forms.length * 3;
  score += inputs.length * 1;
  score += buttons.length * 1;
  score += Math.min(links.length, 20) * 0.5;
  score += tables.length * 2;
  score += Math.min(images.length, 10) * 0.3;
  return Math.round(score * 10) / 10;
}

export function analyzeCapture(workspaceDir) {
  const captureDir = path.join(workspaceDir, 'playwright-output');
  const pagesPath = path.join(captureDir, 'pages-visited.json');
  const domPath = path.join(captureDir, 'dom-snapshot.html');
  if (!fs.existsSync(pagesPath)) {
    return { pages: [], stats: { totalPages: 0, totalForms: 0, totalInputs: 0, totalButtons: 0, totalLinks: 0 } };
  }
  const visitedPages = JSON.parse(fs.readFileSync(pagesPath, 'utf-8'));
  const domHtml = fs.existsSync(domPath) ? fs.readFileSync(domPath, 'utf-8') : '';
  const analyzedPages = visitedPages.map(p => analyzeDom(domHtml, p.url, p.title || ''));
  const stats = {
    totalPages: analyzedPages.length,
    totalForms: analyzedPages.reduce((a, p) => a + p.forms.length, 0),
    totalInputs: analyzedPages.reduce((a, p) => a + p.inputs.length, 0),
    totalButtons: analyzedPages.reduce((a, p) => a + p.buttons.length, 0),
    totalLinks: analyzedPages.reduce((a, p) => a + p.links.length, 0),
  };
  return { pages: analyzedPages, stats };
}

export { PAGE_TYPES };
