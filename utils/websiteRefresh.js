/**
 * Website Cache Refresh
 * =====================
 * Asks the Next.js website to refresh cached data right away
 * (POST {SITE_URL}/api/revalidate with REVALIDATE_SECRET):
 *   - "blog"      after blog changes
 *   - "settings"  after Settings > Company Details changes (every page shows them)
 * Without REVALIDATE_SECRET the website still picks changes up on its own
 * (blog within 60 seconds, settings within 5 minutes).
 */

const refreshWebsite = (tags) => {
  const secret = process.env.REVALIDATE_SECRET;
  const base = require("./siteConfig").siteUrl();
  if (!secret) return;
  fetch(`${base}/api/revalidate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-revalidate-secret": secret },
    body: JSON.stringify({ tags }),
    signal: AbortSignal.timeout(5000),
  }).catch((error) => console.warn(`[Website] Refresh of ${tags.join(", ")} failed (it will update on its own):`, error.message));
};

module.exports = { refreshWebsite };
