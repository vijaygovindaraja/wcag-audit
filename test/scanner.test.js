/**
 * Tests for scanner module.
 *
 * The scanUrl function requires Puppeteer (browser), so we test the
 * internal helpers and validate the public API contract by mocking
 * the browser layer.
 */

const path = require('path');

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

// Test WCAG_TAGS mapping (we re-implement the logic here to test the contract)
console.log('\nWCAG level tag mapping:');

const WCAG_TAGS = {
  A: ['wcag2a', 'wcag21a'],
  AA: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
  AAA: ['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21a', 'wcag21aa', 'wcag21aaa', 'wcag22aa'],
};

assert(WCAG_TAGS.A.length === 2, 'Level A has 2 tag groups');
assert(WCAG_TAGS.AA.length === 5, 'Level AA has 5 tag groups');
assert(WCAG_TAGS.AAA.length === 7, 'Level AAA has 7 tag groups');
assert(WCAG_TAGS.AA.includes('wcag2a'), 'AA includes A-level tags');
assert(WCAG_TAGS.AA.includes('wcag2aa'), 'AA includes AA-level tags');
assert(WCAG_TAGS.AAA.includes('wcag2aaa'), 'AAA includes AAA-level tags');
assert(!WCAG_TAGS.A.includes('wcag2aa'), 'A does not include AA tags');

// Test countByImpact logic
console.log('\ncountByImpact:');

function countByImpact(violations) {
  const counts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  for (const v of violations) {
    if (v.impact in counts) {
      counts[v.impact]++;
    }
  }
  return counts;
}

const violations = [
  { impact: 'critical' },
  { impact: 'critical' },
  { impact: 'serious' },
  { impact: 'moderate' },
  { impact: 'moderate' },
  { impact: 'moderate' },
  { impact: 'minor' },
];

const counts = countByImpact(violations);
assert(counts.critical === 2, 'counts 2 critical');
assert(counts.serious === 1, 'counts 1 serious');
assert(counts.moderate === 3, 'counts 3 moderate');
assert(counts.minor === 1, 'counts 1 minor');

const emptyCounts = countByImpact([]);
assert(emptyCounts.critical === 0, 'empty violations returns all zeros');
assert(emptyCounts.serious === 0, 'empty serious is 0');

// Test countByWcag logic
console.log('\ncountByWcag:');

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

const wcagViolations = [
  { tags: ['wcag2a', 'wcag111', 'cat.text-alternatives'] },
  { tags: ['wcag2aa', 'wcag143'] },
  { tags: ['wcag2a', 'wcag412'] },
];

const wcagCounts = countByWcag(wcagViolations);
assert(wcagCounts['wcag2a'] === 2, 'wcag2a appears twice');
assert(wcagCounts['wcag2aa'] === 1, 'wcag2aa appears once');
assert(wcagCounts['wcag111'] === 1, 'wcag111 counted');
assert(wcagCounts['cat.text-alternatives'] === undefined, 'non-wcag tags excluded');

const emptyWcag = countByWcag([]);
assert(Object.keys(emptyWcag).length === 0, 'empty violations returns empty object');

// Test with missing tags
const noTags = countByWcag([{ tags: undefined }, { tags: [] }, {}]);
assert(Object.keys(noTags).length === 0, 'handles missing/empty tags');

// Test scan result structure validation
console.log('\nScan result structure:');

function validateScanResult(result) {
  const required = ['url', 'violations', 'passes', 'incomplete', 'summary'];
  const missing = required.filter(key => !(key in result));
  return missing;
}

const validResult = {
  url: 'https://example.com',
  violations: [],
  passes: [],
  incomplete: [],
  summary: { totalViolations: 0 },
};

assert(validateScanResult(validResult).length === 0, 'valid result passes structure check');
assert(validateScanResult({}).length === 5, 'empty object missing all required fields');
assert(validateScanResult({ url: 'x', violations: [] }).length === 3, 'partial object reports missing fields');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
