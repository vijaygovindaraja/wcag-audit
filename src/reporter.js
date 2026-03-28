/**
 * Report formatters for accessibility audit results.
 *
 * Supports text (terminal), JSON, and CSV output formats.
 */

const IMPACT_COLORS = {
  critical: '\x1b[31m',  // red
  serious: '\x1b[33m',   // yellow
  moderate: '\x1b[36m',  // cyan
  minor: '\x1b[37m',     // white
};
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

/**
 * Format results as human-readable text for terminal output.
 */
function formatTextReport(results, options = {}) {
  const isMulti = options.multi && Array.isArray(results);
  const scans = isMulti ? results : [results];

  const lines = [];

  lines.push(`${BOLD}════════════════════════════════════════════════════${RESET}`);
  lines.push(`${BOLD}  WCAG ACCESSIBILITY AUDIT REPORT${RESET}`);
  lines.push(`${BOLD}════════════════════════════════════════════════════${RESET}`);
  lines.push('');

  let totalViolations = 0;
  let totalPages = scans.length;

  for (const scan of scans) {
    totalViolations += scan.violations.length;
  }

  if (isMulti) {
    lines.push(`  Pages scanned:  ${totalPages}`);
  }

  lines.push(`  Total issues:   ${totalViolations}`);
  lines.push('');

  for (const scan of scans) {
    if (isMulti) {
      lines.push(`${BOLD}── ${scan.url}${RESET}`);
      lines.push(`   ${scan.pageTitle || 'Untitled'}`);
      lines.push('');
    } else {
      lines.push(`  URL:      ${scan.url}`);
      lines.push(`  Title:    ${scan.pageTitle || 'Untitled'}`);
      lines.push(`  Level:    WCAG ${scan.level}`);
      lines.push(`  Scanned:  ${scan.scannedAt}`);
      lines.push('');
    }

    if (scan.summary) {
      const impact = scan.summary.impactBreakdown;
      lines.push(`  ${IMPACT_COLORS.critical}Critical: ${impact.critical}${RESET}  ${IMPACT_COLORS.serious}Serious: ${impact.serious}${RESET}  ${IMPACT_COLORS.moderate}Moderate: ${impact.moderate}${RESET}  Minor: ${impact.minor}`);
      lines.push('');
    }

    if (scan.violations.length === 0) {
      lines.push('  ✓ No violations found');
      lines.push('');
      continue;
    }

    // Sort by impact severity
    const sorted = [...scan.violations].sort((a, b) => {
      const order = { critical: 0, serious: 1, moderate: 2, minor: 3 };
      return (order[a.impact] ?? 4) - (order[b.impact] ?? 4);
    });

    for (const violation of sorted) {
      const color = IMPACT_COLORS[violation.impact] || '';
      lines.push(`  ${color}[${violation.impact}]${RESET} ${violation.id}: ${violation.description}`);
      lines.push(`    WCAG: ${violation.tags.filter(t => t.startsWith('wcag')).join(', ')}`);
      lines.push(`    Help: ${violation.helpUrl}`);
      lines.push(`    Elements affected: ${violation.nodes.length}`);

      // Show first 3 affected elements
      for (const node of violation.nodes.slice(0, 3)) {
        const selector = node.target?.[0] || 'unknown';
        lines.push(`      → ${selector}`);
        if (node.failureSummary) {
          const fix = node.failureSummary.split('\n')[0];
          lines.push(`        ${fix}`);
        }
      }

      if (violation.nodes.length > 3) {
        lines.push(`      ... and ${violation.nodes.length - 3} more`);
      }

      lines.push('');
    }

    if (options.includePasses && scan.passes.length > 0) {
      lines.push(`  ${BOLD}Passing checks: ${scan.passes.length}${RESET}`);
      for (const pass of scan.passes.slice(0, 10)) {
        lines.push(`    ✓ ${pass.id}: ${pass.description}`);
      }
      if (scan.passes.length > 10) {
        lines.push(`    ... and ${scan.passes.length - 10} more`);
      }
      lines.push('');
    }
  }

  lines.push(`${BOLD}════════════════════════════════════════════════════${RESET}`);

  return lines.join('\n');
}

/**
 * Format results as JSON.
 */
function formatJsonReport(results, options = {}) {
  return JSON.stringify(results, null, 2);
}

/**
 * Format results as CSV.
 */
function formatCsvReport(results, options = {}) {
  const isMulti = options.multi && Array.isArray(results);
  const scans = isMulti ? results : [results];

  const headers = ['url', 'page_title', 'rule_id', 'impact', 'description', 'wcag', 'elements_affected', 'help_url'];
  const rows = [headers.join(',')];

  for (const scan of scans) {
    for (const violation of scan.violations) {
      const wcag = violation.tags.filter(t => t.startsWith('wcag')).join(';');
      rows.push([
        csvEscape(scan.url),
        csvEscape(scan.pageTitle || ''),
        csvEscape(violation.id),
        csvEscape(violation.impact),
        csvEscape(violation.description),
        csvEscape(wcag),
        violation.nodes.length,
        csvEscape(violation.helpUrl),
      ].join(','));
    }
  }

  return rows.join('\n');
}

function csvEscape(value) {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

module.exports = { formatTextReport, formatJsonReport, formatCsvReport };
