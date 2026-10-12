/**
 * Domains (server config)
 * =======================
 * The only place the backend reads its domains from. Set per Hostinger account
 * in hPanel > Environment variables (see .env.example):
 *
 *   SITE_URL            website + admin portal   (NEW_APP_URL still works)
 *   API_URL             this Node API            (without /api)
 *   PHP_PDF_SERVER_URL  PHP PDF service
 *
 * Read when used (not when the file loads), so .env is always applied first.
 * Local-development defaults only; no live domain is written in the code.
 */

const clean = (value) => String(value || "").trim().replace(/\/+$/, "");

const siteUrl = () => clean(process.env.SITE_URL || process.env.NEW_APP_URL) || "http://localhost:3000";

const apiUrl = () => (clean(process.env.API_URL) || `http://localhost:${process.env.PORT || 5000}`).replace(/\/api$/, "");

const phpPdfServerUrl = () =>
  clean(process.env.PHP_PDF_SERVER_URL) || "http://localhost/myProjects/nextjs/financially-up/financially-up-php-backend";

/** Startup check: on a live server every domain must be set (otherwise links point at localhost). */
const warnIfDomainsMissing = () => {
  if (process.env.NODE_ENV !== "production") return;
  const missing = [
    ["SITE_URL (or NEW_APP_URL)", process.env.SITE_URL || process.env.NEW_APP_URL],
    ["API_URL", process.env.API_URL],
    ["PHP_PDF_SERVER_URL", process.env.PHP_PDF_SERVER_URL],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);
  if (missing.length) console.warn(`⚠️ Domains not set: ${missing.join(", ")} - add them in hPanel > Environment variables (see .env.example).`);
  else console.log(`🌐 Domains: site ${siteUrl()} | api ${apiUrl()} | pdf ${phpPdfServerUrl()}`);
};

module.exports = { siteUrl, apiUrl, phpPdfServerUrl, warnIfDomainsMissing };
