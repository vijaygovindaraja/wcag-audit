/**
 * Core accessibility scanner using Puppeteer + axe-core.
 *
 * Launches a headless browser, navigates to the target URL,
 * injects axe-core, and runs the accessibility audit.
 */

const puppeteer = require('puppeteer');
const axe = require('axe-core');
const fs = require('fs');
const path = require('path');

const AXE_SOURCE = fs.readFileSync(
  path.resolve(require.resolve('axe-core'), '..', 'axe.min.js'),
  'utf-8'
);

const WCAG_TAGS = {
  A: ['wcag2a', 'wcag21a'],
  AA: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
  AAA: ['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21a', 'wcag21aa', 'wcag21aaa', 'wcag22aa'],
};

/**
 * Scan a single URL for accessibility violations.
 *
 * @param {string} url - URL to scan
 * @param {object} options - Scan options
 * @param {string} options.level - WCAG conformance level (A, AA, AAA)
 * @param {{width: number, height: number}} options.viewport - Browser viewport
 * @returns {Promise<object>} Axe-core results with metadata
 */
async function scanUrl(url, options = {}) {
  const level = options.level || 'AA';
  const viewport = options.viewport || { width: 1280, height: 720 };

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport(viewport);

    const startTime = Date.now();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    const loadTime = Date.now() - startTime;

    // Inject axe-core
    await page.evaluate(AXE_SOURCE);

    // Run axe audit with WCAG level filter
    const runTags = WCAG_TAGS[level] || WCAG_TAGS['AA'];
    const results = await page.evaluate((tags) => {
      return window.axe.run(document, {
        runOnly: { type: 'tag', values: tags },
        resultTypes: ['violations', 'passes', 'incomplete'],
      });
    }, runTags);

    const pageTitle = await page.title();

    return {
      url,
      pageTitle,
      level,
      viewport,
      loadTime,
      scannedAt: new Date().toISOString(),
      violations: results.violations || [],
      passes: results.passes || [],
      incomplete: results.incomplete || [],
      summary: {
        totalViolations: (results.violations || []).length,
        totalPasses: (results.passes || []).length,
        totalIncomplete: (results.incomplete || []).length,
        impactBreakdown: countByImpact(results.violations || []),
        wcagBreakdown: countByWcag(results.violations || []),
      },
    };
  } finally {
    await browser.close();
  }
}

function countByImpact(violations) {
  const counts = { critical: 0, serious: 0, moderate: 0, minor: 0 };

  for (const v of violations) {
    if (v.impact in counts) {
      counts[v.impact]++;
    }
  }

  return counts;
}

function countByWcag(violations) {
  const counts = {};

  for (const v of violations) {
    for (const tag of v.tags || []) {
      if (tag.startsWith('wcag')) {
        counts[tag] = (counts[tag] || 0) + 1;
      }
    }
  }

  return counts;
}

module.exports = { scanUrl };
