/**
 * Tests for crawler module — URL extraction from sitemaps.
 */

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

// Test sitemap XML parsing logic (extracted for testability)
function extractUrlsFromXml(xmlText, maxPages) {
  const urls = [];
  const locRegex = /<loc>(.*?)<\/loc>/g;
  let match;

  while ((match = locRegex.exec(xmlText)) !== null && urls.length < maxPages) {
    const url = match[1].trim();
    if (!url.endsWith('.xml')) {
      urls.push(url);
    }
  }

  return urls;
}

// Basic sitemap parsing
console.log('\nSitemap XML parsing:');

const simpleSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.gov/</loc></url>
  <url><loc>https://example.gov/about</loc></url>
  <url><loc>https://example.gov/contact</loc></url>
</urlset>`;

const urls = extractUrlsFromXml(simpleSitemap, 50);
assert(urls.length === 3, 'extracts 3 URLs from simple sitemap');
assert(urls[0] === 'https://example.gov/', 'first URL is root');
assert(urls[2] === 'https://example.gov/contact', 'third URL is contact');

// Max pages limit
console.log('\nMax pages limiting:');

const limited = extractUrlsFromXml(simpleSitemap, 2);
assert(limited.length === 2, 'respects maxPages limit');
assert(limited[1] === 'https://example.gov/about', 'stops at correct URL');

// Sitemap index (should skip .xml entries)
console.log('\nSitemap index handling:');

const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://example.gov/sitemap-pages.xml</loc></sitemap>
  <sitemap><loc>https://example.gov/sitemap-posts.xml</loc></sitemap>
</sitemapindex>`;

const indexUrls = extractUrlsFromXml(sitemapIndex, 50);
assert(indexUrls.length === 0, 'filters out .xml sitemap index entries');

// Mixed sitemap with XML sub-sitemaps and actual pages
console.log('\nMixed content handling:');

const mixedSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset>
  <url><loc>https://example.gov/page1</loc></url>
  <url><loc>https://example.gov/sub-sitemap.xml</loc></url>
  <url><loc>https://example.gov/page2</loc></url>
</urlset>`;

const mixedUrls = extractUrlsFromXml(mixedSitemap, 50);
assert(mixedUrls.length === 2, 'skips .xml entries in mixed sitemap');
assert(mixedUrls[0] === 'https://example.gov/page1', 'keeps page URLs');
assert(mixedUrls[1] === 'https://example.gov/page2', 'keeps second page URL');

// Empty sitemap
console.log('\nEdge cases:');

const emptyUrls = extractUrlsFromXml('', 50);
assert(emptyUrls.length === 0, 'empty string returns no URLs');

const noLocUrls = extractUrlsFromXml('<urlset></urlset>', 50);
assert(noLocUrls.length === 0, 'urlset with no loc entries returns empty');

// Whitespace in URLs
const whitespaceSitemap = `<urlset>
  <url><loc>  https://example.gov/spaced  </loc></url>
</urlset>`;
const spacedUrls = extractUrlsFromXml(whitespaceSitemap, 50);
assert(spacedUrls.length === 1, 'extracts URL with whitespace');
assert(spacedUrls[0] === 'https://example.gov/spaced', 'trims whitespace from URLs');

// Large sitemap with maxPages=0
const zeroLimit = extractUrlsFromXml(simpleSitemap, 0);
assert(zeroLimit.length === 0, 'maxPages=0 returns empty array');

// Unicode in URLs
const unicodeSitemap = `<urlset>
  <url><loc>https://example.gov/café</loc></url>
  <url><loc>https://example.gov/日本語</loc></url>
</urlset>`;
const unicodeUrls = extractUrlsFromXml(unicodeSitemap, 50);
assert(unicodeUrls.length === 2, 'handles Unicode URLs');
assert(unicodeUrls[0] === 'https://example.gov/café', 'preserves accented characters');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
