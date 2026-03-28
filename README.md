# wcag-audit

WCAG accessibility audit CLI — scan websites for accessibility violations with actionable reports.

Built for government teams, compliance officers, and developers who need to ensure Section 508 and WCAG 2.1/2.2 conformance.

## Features

- **Single page scan** — audit any URL for WCAG violations
- **Sitemap crawling** — scan entire sites via sitemap.xml
- **Configurable conformance level** — A, AA, or AAA
- **Multiple output formats** — terminal, JSON, CSV
- **Impact severity breakdown** — critical, serious, moderate, minor
- **WCAG criterion mapping** — know exactly which criteria are violated
- **CI/CD ready** — exits with non-zero code when violations found
- **Programmatic API** — integrate into your testing pipeline

## Install

```bash
npm install -g wcag-audit
```

## Quick Start

```bash
# Scan a single page
wcag-audit scan https://example.gov

# Scan at AAA level
wcag-audit scan https://example.gov --level AAA

# Output as JSON
wcag-audit scan https://example.gov --format json --output report.json

# Output as CSV for spreadsheet analysis
wcag-audit scan https://example.gov --format csv --output report.csv

# Crawl an entire site
wcag-audit crawl https://example.gov/sitemap.xml --max-pages 100
```

## Example Output

```
════════════════════════════════════════════════════
  WCAG ACCESSIBILITY AUDIT REPORT
════════════════════════════════════════════════════

  URL:      https://example.gov
  Title:    Example Government Site
  Level:    WCAG AA
  Scanned:  2026-03-27T23:00:00.000Z

  Critical: 2  Serious: 5  Moderate: 8  Minor: 3

  [critical] image-alt: Images must have alternate text
    WCAG: wcag2a, wcag111
    Elements affected: 4
      → img.hero-banner
        Fix any of the following: Element does not have an alt attribute

  [serious] color-contrast: Elements must meet minimum color contrast ratio
    WCAG: wcag2aa, wcag143
    Elements affected: 12
      → .nav-link
        Fix any of the following: Element has insufficient color contrast

════════════════════════════════════════════════════
```

## Programmatic API

```javascript
const { scanUrl, formatTextReport } = require('wcag-audit');

const results = await scanUrl('https://example.gov', {
  level: 'AA',
  viewport: { width: 1280, height: 720 },
});

// Access structured results
console.log(`Violations: ${results.summary.totalViolations}`);
console.log(`Critical: ${results.summary.impactBreakdown.critical}`);

// Generate formatted report
console.log(formatTextReport(results));
```

## CI/CD Integration

The CLI exits with code `1` when violations are found, making it easy to integrate into CI pipelines:

```yaml
# GitHub Actions example
- name: Accessibility Audit
  run: npx wcag-audit scan ${{ env.DEPLOY_URL }} --level AA --format json --output a11y-report.json
```

## How It Works

1. Launches a headless Chromium browser via Puppeteer
2. Navigates to the target URL and waits for the page to load
3. Injects [axe-core](https://github.com/dequelabs/axe-core) into the page
4. Runs the accessibility audit filtered to the specified WCAG level
5. Collects violations, passes, and incomplete checks
6. Formats results into the requested output format

## License

MIT
