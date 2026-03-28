#!/usr/bin/env node

/**
 * wcag-audit — WCAG accessibility audit CLI
 *
 * Scans websites for WCAG 2.1 AA/AAA accessibility violations using axe-core
 * and generates actionable reports for developers and compliance teams.
 *
 * Designed for government teams needing Section 508 and WCAG compliance.
 */

const { Command } = require('commander');
const { scanUrl } = require('./scanner');
const { formatTextReport, formatJsonReport, formatCsvReport } = require('./reporter');
const { crawlSitemap } = require('./crawler');

const program = new Command();

program
  .name('wcag-audit')
  .description('Scan websites for WCAG accessibility violations')
  .version('1.0.0');

program
  .command('scan')
  .description('Scan a URL for accessibility violations')
  .argument('<url>', 'URL to scan')
  .option('-l, --level <level>', 'WCAG conformance level (A, AA, AAA)', 'AA')
  .option('-f, --format <format>', 'Output format (text, json, csv)', 'text')
  .option('-o, --output <file>', 'Write report to file instead of stdout')
  .option('--include-passes', 'Include passing checks in the report')
  .option('--viewport <size>', 'Viewport size (e.g., 1280x720)', '1280x720')
  .action(async (url, options) => {
    try {
      const [width, height] = options.viewport.split('x').map(Number);
      const results = await scanUrl(url, {
        level: options.level,
        viewport: { width, height },
      });

      let report;
      switch (options.format) {
        case 'json':
          report = formatJsonReport(results, { includePasses: options.includePasses });
          break;
        case 'csv':
          report = formatCsvReport(results);
          break;
        default:
          report = formatTextReport(results, { includePasses: options.includePasses });
      }

      if (options.output) {
        require('fs').writeFileSync(options.output, report);
        console.log(`Report written to ${options.output}`);
      } else {
        console.log(report);
      }

      // Exit with non-zero if violations found
      const violationCount = results.violations.length;
      if (violationCount > 0) {
        process.exit(1);
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(2);
    }
  });

program
  .command('crawl')
  .description('Scan all pages in a sitemap for accessibility violations')
  .argument('<url>', 'Sitemap URL or website URL')
  .option('-l, --level <level>', 'WCAG conformance level (A, AA, AAA)', 'AA')
  .option('-f, --format <format>', 'Output format (text, json, csv)', 'text')
  .option('-o, --output <file>', 'Write report to file')
  .option('-m, --max-pages <n>', 'Maximum pages to scan', '50')
  .option('--viewport <size>', 'Viewport size', '1280x720')
  .action(async (url, options) => {
    try {
      const [width, height] = options.viewport.split('x').map(Number);
      const maxPages = parseInt(options.maxPages, 10);

      console.log(`Crawling ${url} (max ${maxPages} pages)...`);

      const allResults = await crawlSitemap(url, {
        level: options.level,
        viewport: { width, height },
        maxPages,
      });

      let report;
      switch (options.format) {
        case 'json':
          report = formatJsonReport(allResults, { multi: true });
          break;
        case 'csv':
          report = formatCsvReport(allResults, { multi: true });
          break;
        default:
          report = formatTextReport(allResults, { multi: true });
      }

      if (options.output) {
        require('fs').writeFileSync(options.output, report);
        console.log(`Report written to ${options.output}`);
      } else {
        console.log(report);
      }

      const totalViolations = Array.isArray(allResults)
        ? allResults.reduce((sum, r) => sum + r.violations.length, 0)
        : allResults.violations.length;

      if (totalViolations > 0) {
        process.exit(1);
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(2);
    }
  });

program.parse();
