/**
 * Brand Text (backend)
 * ====================
 * Emails and PDF templates are written with the default company details
 * ("Financially Up", "Financially Up Pty Ltd", info@financiallyup.com.au,
 * 1300 328 316, ...) so they stay readable. brandText() swaps them for the
 * live values from Settings > Company Details. Same rules as the website's
 * financially-up-frontend/lib/brand.js - keep the two in sync.
 *
 *   const settings = await getSettingsMap();
 *   brandText("Thank you for choosing Financially Up.", settings)
 */

// The one list of default values (also seeded into the settings table)
const { DEFAULT_SETTINGS } = require("./settingsSeed");
const DEFAULTS = Object.fromEntries(DEFAULT_SETTINGS.map((row) => [row.key, row.value]));
const DEFAULT_NAME = DEFAULTS["company.name"];
const DEFAULT_LEGAL = DEFAULTS["company.legalName"];

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const LEGAL_PATTERN = new RegExp(escapeRegExp(DEFAULT_LEGAL), "gi");
const NAME_PATTERN = new RegExp(escapeRegExp(DEFAULT_NAME), "gi");
// Company mailboxes only - a staff member's own address is never changed
const EMAIL_PATTERN = /\b(?:info|admin|privacy|support|enquiries|contact|hello)@financiallyup\.com\.au\b/gi;
const SITE_PATTERN = /\bhttps?:\/\/(?:www\.)?financiallyup\.com\.au\b/gi;
// Not after "@": a staff member's own address keeps its domain
const HOST_PATTERN = /(?<!@)\b(?:www\.)?financiallyup\.com\.au\b/gi;
const TEL_PATTERN = /tel:\+?(?:61)?1300328316/g;
const PHONE_PATTERN = /\b1300[\s-]?328[\s-]?316\b/g;
const ABN_PATTERN = /\b84\s?659\s?717\s?263\b/g;
const ADDRESS_PATTERN = /Level 5, 100 Walker St(?:reet)?,? North Sydney,? NSW,? 2060(?:,? Australia)?/g;
const TPB_PATTERN = /\b(?:26234055|26242127|25800000)\b/g;
const ANY_DEFAULT = /financially\s?up|1300[\s-]?328[\s-]?316|1300328316|84\s?659\s?717\s?263|100 Walker St|26234055|26242127|25800000/i;

const matchCase = (match, value) => (match === match.toUpperCase() && match !== match.toLowerCase() ? value.toUpperCase() : value);

/**
 * @param {string} text
 * @param {object} settings - flat settings map (services/settings.service getSettingsMap)
 * @returns {string}
 */
const brandText = (text, settings = {}) => {
  if (typeof text !== "string" || !ANY_DEFAULT.test(text)) return text;
  const value = (key) => settings[key] || DEFAULTS[key];
  const phone = value("company.phone");
  const site = require("./siteConfig").siteUrl();
  return text
    .replace(EMAIL_PATTERN, value("company.email"))
    .replace(SITE_PATTERN, site)
    .replace(HOST_PATTERN, site.replace(/^https?:\/\//, ""))
    .replace(LEGAL_PATTERN, (m) => matchCase(m, value("company.legalName")))
    .replace(NAME_PATTERN, (m) => matchCase(m, value("company.name")))
    .replace(TEL_PATTERN, `tel:${phone.replace(/[^\d+]/g, "")}`)
    .replace(PHONE_PATTERN, phone)
    .replace(ABN_PATTERN, value("company.abn"))
    .replace(ADDRESS_PATTERN, value("company.address"))
    .replace(TPB_PATTERN, value("company.taxAgentNumber"));
};

module.exports = { brandText };
