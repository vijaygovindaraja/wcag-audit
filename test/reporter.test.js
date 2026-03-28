const { formatTextReport, formatJsonReport, formatCsvReport } = require('../src/reporter');

// Mock scan results for testing
const mockResults = {
  url: 'https://example.gov',
  pageTitle: 'Example Government Site',
  level: 'AA',
  viewport: { width: 1280, height: 720 },
  loadTime: 1234,
  scannedAt: '2026-03-27T00:00:00.000Z',
  violations: [
    {
      id: 'image-alt',
      impact: 'critical',
      description: 'Images must have alternate text',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/image-alt',
      tags: ['wcag2a', 'wcag111'],
      nodes: [
        { target: ['img.hero'], failureSummary: 'Fix: Element does not have an alt attribute' },
        { target: ['img.logo'], failureSummary: 'Fix: Element does not have an alt attribute' },
      ],
    },
    {
      id: 'color-contrast',
      impact: 'serious',
      description: 'Elements must meet minimum color contrast ratio',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/color-contrast',
      tags: ['wcag2aa', 'wcag143'],
      nodes: [
        { target: ['.nav-link'], failureSummary: 'Fix: Insufficient contrast ratio' },
      ],
    },
  ],
  passes: [
    { id: 'html-has-lang', description: 'html element must have a lang attribute' },
  ],
  incomplete: [],
  summary: {
    totalViolations: 2,
    totalPasses: 1,
    totalIncomplete: 0,
    impactBreakdown: { critical: 1, serious: 1, moderate: 0, minor: 0 },
    wcagBreakdown: { wcag2a: 1, wcag111: 1, wcag2aa: 1, wcag143: 1 },
  },
};

const emptyResults = {
  url: 'https://clean.gov',
  pageTitle: 'Clean Site',
  level: 'AA',
  scannedAt: '2026-03-27T00:00:00.000Z',
  violations: [],
  passes: [{ id: 'html-has-lang', description: 'OK' }],
  incomplete: [],
  summary: {
    totalViolations: 0,
    totalPasses: 1,
    totalIncomplete: 0,
    impactBreakdown: { critical: 0, serious: 0, moderate: 0, minor: 0 },
    wcagBreakdown: {},
  },
};

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ ${message}`);
  }
}

// formatTextReport tests
console.log('\nformatTextReport:');

const textReport = formatTextReport(mockResults);
assert(textReport.includes('WCAG ACCESSIBILITY AUDIT REPORT'), 'contains report header');
assert(textReport.includes('https://example.gov'), 'contains URL');
assert(textReport.includes('Example Government Site'), 'contains page title');
assert(textReport.includes('image-alt'), 'contains violation rule id');
assert(textReport.includes('color-contrast'), 'contains second violation');
assert(textReport.includes('critical'), 'contains impact level');
assert(textReport.includes('img.hero'), 'contains affected element selector');
assert(textReport.includes('wcag2a'), 'contains WCAG tag');

const cleanReport = formatTextReport(emptyResults);
assert(cleanReport.includes('No violations found'), 'shows no violations for clean site');

const reportWithPasses = formatTextReport(mockResults, { includePasses: true });
assert(reportWithPasses.includes('html-has-lang'), 'includes passing checks when option enabled');

const multiReport = formatTextReport([mockResults, emptyResults], { multi: true });
assert(multiReport.includes('Pages scanned:'), 'multi-page report shows page count');
assert(multiReport.includes('example.gov'), 'multi-page report includes first URL');
assert(multiReport.includes('clean.gov'), 'multi-page report includes second URL');

// formatJsonReport tests
console.log('\nformatJsonReport:');

const jsonReport = formatJsonReport(mockResults);
const parsed = JSON.parse(jsonReport);
assert(parsed.url === 'https://example.gov', 'JSON contains correct URL');
assert(parsed.violations.length === 2, 'JSON contains correct violation count');
assert(parsed.summary.impactBreakdown.critical === 1, 'JSON contains correct impact breakdown');

// formatCsvReport tests
console.log('\nformatCsvReport:');

const csvReport = formatCsvReport(mockResults);
const csvLines = csvReport.split('\n');
assert(csvLines[0] === 'url,page_title,rule_id,impact,description,wcag,elements_affected,help_url', 'CSV has correct headers');
assert(csvLines.length === 3, 'CSV has header + 2 violation rows');
assert(csvLines[1].includes('image-alt'), 'CSV first row contains image-alt');
assert(csvLines[1].includes('critical'), 'CSV first row contains impact');
assert(csvLines[2].includes('color-contrast'), 'CSV second row contains color-contrast');

const multiCsv = formatCsvReport([mockResults, emptyResults], { multi: true });
const multiCsvLines = multiCsv.split('\n');
assert(multiCsvLines.length === 3, 'multi-page CSV only includes violations (not clean site)');

// CSV escaping tests
console.log('\nCSV escaping:');

const resultsWithComma = {
  ...mockResults,
  pageTitle: 'Site, with comma',
  violations: [{
    id: 'test',
    impact: 'minor',
    description: 'Description with "quotes"',
    helpUrl: 'https://example.com',
    tags: ['wcag2a'],
    nodes: [],
  }],
};
const escapedCsv = formatCsvReport(resultsWithComma);
assert(escapedCsv.includes('"Site, with comma"'), 'escapes commas in CSV values');
assert(escapedCsv.includes('""quotes""'), 'escapes double quotes in CSV values');

// Summary
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
