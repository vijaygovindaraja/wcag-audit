/**
 * Sitemap crawler for multi-page accessibility audits.
 *
 * Fetches a sitemap XML, extracts URLs, and scans each page
 * sequentially with progress reporting.
 */

const { scanUrl } = require('./scanner');

/**
 * Crawl a sitemap and scan all pages for accessibility violations.
 *
 * @param {string} sitemapUrl - URL to sitemap.xml or website root
 * @param {object} options - Crawl options
 * @returns {Promise<object[]>} Array of scan results per page
 */
async function crawlSitemap(sitemapUrl, options = {}) {
  const maxPages = options.maxPages || 50;
  const urls = await extractUrls(sitemapUrl, maxPages);

  console.log(`Found ${urls.length} URLs to scan`);

  const results = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`[${i + 1}/${urls.length}] Scanning: ${url}`);

    try {
      const result = await scanUrl(url, options);
      results.push(result);

      const violations = result.violations.length;
      if (violations > 0) {
        console.log(`  → ${violations} violations found`);
      } else {
        console.log(`  → No violations`);
      }
    } catch (error) {
      console.log(`  → Error: ${error.message}`);
      results.push({
        url,
        pageTitle: '',
        level: options.level || 'AA',
        scannedAt: new Date().toISOString(),
        violations: [],
        passes: [],
        incomplete: [],
        error: error.message,
        summary: {
          totalViolations: 0,
          totalPasses: 0,
          totalIncomplete: 0,
          impactBreakdown: { critical: 0, serious: 0, moderate: 0, minor: 0 },
          wcagBreakdown: {},
        },
      });
    }
  }

  return results;
}

async function extractUrls(sitemapUrl, maxPages) {
  // Try fetching as sitemap XML first
  try {
    const response = await fetch(sitemapUrl);
    const text = await response.text();

    if (text.includes('<urlset') || text.includes('<sitemapindex')) {
      const urls = [];
      const locRegex = /<loc>(.*?)<\/loc>/g;
      let match;

      while ((match = locRegex.exec(text)) !== null && urls.length < maxPages) {
        const url = match[1].trim();
        // Skip sitemap index entries, only include page URLs
        if (!url.endsWith('.xml')) {
          urls.push(url);
        }
      }

      if (urls.length > 0) {
        return urls;
      }
    }
  } catch {
    // Not a valid sitemap, try as website root
  }

  // Try appending /sitemap.xml
  try {
    const base = sitemapUrl.endsWith('/') ? sitemapUrl : sitemapUrl + '/';
    const response = await fetch(`${base}sitemap.xml`);
    const text = await response.text();

    if (text.includes('<urlset')) {
      const urls = [];
      const locRegex = /<loc>(.*?)<\/loc>/g;
      let match;

      while ((match = locRegex.exec(text)) !== null && urls.length < maxPages) {
        const url = match[1].trim();
        if (!url.endsWith('.xml')) {
          urls.push(url);
        }
      }

      if (urls.length > 0) {
        return urls;
      }
    }
  } catch {
    // No sitemap found
  }

  // Fall back to scanning just the provided URL
  return [sitemapUrl];
}

module.exports = { crawlSitemap };
