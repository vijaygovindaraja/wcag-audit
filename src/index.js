/**
 * wcag-audit — Programmatic API
 *
 * Use this module to integrate accessibility auditing into your
 * CI/CD pipeline, testing framework, or custom tooling.
 *
 * @example
 * const { scanUrl, crawlSitemap } = require('wcag-audit');
 *
 * const results = await scanUrl('https://example.gov', { level: 'AA' });
 * console.log(`Found ${results.violations.length} violations`);
 */

const { scanUrl } = require('./scanner');
const { crawlSitemap } = require('./crawler');
const { formatTextReport, formatJsonReport, formatCsvReport } = require('./reporter');

module.exports = {
  scanUrl,
  crawlSitemap,
  formatTextReport,
  formatJsonReport,
  formatCsvReport,
};
