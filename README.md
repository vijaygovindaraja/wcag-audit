# wcag-audit

> Scan any website for WCAG accessibility violations from your terminal.

Built for government teams, compliance officers, and developers who need Section 508 and WCAG 2.1/2.2 conformance.

## Try it now

No install needed:

```bash
npx wcag-audit scan https://example.com
```

## Features

- **Single page scan** — audit any URL for WCAG violations
- **Sitemap crawling** — scan entire sites via sitemap.xml
- **Configurable level** — WCAG A, AA, or AAA
- **Multiple formats** — terminal, JSON, CSV
- **Severity breakdown** — critical, serious, moderate, minor
- **WCAG criterion mapping** — know exactly which criteria fail
- **CI/CD ready** — non-zero exit when violations found
- **Programmatic API** — integrate into your pipeline

## Install

```bash
npm install -g wcag-audit
```

## Usage

```bash
# Scan a page at AA level (default)
wcag-audit scan https://example.gov

# Scan at AAA level
wcag-audit scan https://example.gov --level AAA

# JSON output for CI pipelines
wcag-audit scan https://example.gov --format json --output report.json

# CSV for spreadsheet analysis
wcag-audit scan https://example.gov --format csv --output report.csv

# Crawl an entire site via sitemap
wcag-audit crawl https://example.gov/sitemap.xml --max-pages 100

# Custom viewport (mobile testing)
wcag-audit scan https://example.gov --viewport 375x812
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
    Help: https://dequeuniversity.com/rules/axe/4.10/image-alt
    Elements affected: 4
      → img.hero-banner
        Fix any of the following: Element does not have an alt attribute

  [serious] color-contrast: Elements must meet minimum color contrast ratio
    WCAG: wcag2aa, wcag143
    Help: https://dequeuniversity.com/rules/axe/4.10/color-contrast
    Elements affected: 12
      → .nav-link
        Fix any of the following: Element has insufficient color contrast

════════════════════════════════════════════════════
```

## CI/CD Integration

The CLI exits with code `1` when violations are found:

```yaml
# GitHub Actions
- name: Accessibility Audit
  run: npx wcag-audit scan ${{ env.DEPLOY_URL }} --level AA

# GitLab CI
accessibility:
  script: npx wcag-audit scan $DEPLOY_URL --format json --output a11y.json
  artifacts:
    paths: [a11y.json]
```

## Programmatic API

```javascript
const { scanUrl, formatTextReport } = require('wcag-audit');

const results = await scanUrl('https://example.gov', {
  level: 'AA',
  viewport: { width: 1280, height: 720 },
});

console.log(`Violations: ${results.summary.totalViolations}`);
console.log(`Critical: ${results.summary.impactBreakdown.critical}`);
console.log(formatTextReport(results));
```

## How It Works

1. Launches headless Chromium via Puppeteer
2. Navigates to the URL, waits for network idle
3. Injects [axe-core](https://github.com/dequelabs/axe-core) into the page
4. Runs accessibility audit filtered to specified WCAG level
5. Collects violations, passes, and incomplete checks
6. Formats results (text, JSON, or CSV)

## Powered by

- [axe-core](https://github.com/dequelabs/axe-core) — the accessibility testing engine used by Google, Microsoft, and government agencies worldwide
- [Puppeteer](https://pptr.dev/) — headless Chrome for reliable page rendering

## License

MIT
