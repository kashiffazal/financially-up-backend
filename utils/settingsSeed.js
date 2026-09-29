/**
 * Global Settings Seeder
 * ======================
 * Registers the default global variables on startup.
 *
 * IMPORTANT: only missing keys are inserted. Values edited in the Admin Portal
 * are never overwritten by a restart, so `DEFAULT_SETTINGS` is the fallback set,
 * not the source of truth once the app is running.
 */

const Setting = require("../models/Setting");

const DEFAULT_SETTINGS = [
  /* ─── Company Identity ─── */
  { key: "company.name", value: "Financially Up", label: "Company Name", group: "company", inputType: "text", sortOrder: 1 },
  { key: "company.legalName", value: "Financially Up Pty Ltd", label: "Registered Legal Name", group: "company", inputType: "text", sortOrder: 2 },
  { key: "company.abn", value: "84 659 717 263", label: "ABN", group: "company", inputType: "text", sortOrder: 3, helpText: "Australian Business Number shown on forms and PDFs" },
  { key: "company.taxAgentNumber", value: "25800000", label: "Tax Agent Registration Number", group: "company", inputType: "text", sortOrder: 4, helpText: "Placeholder until the registered TPB number is issued" },
  { key: "company.phone", value: "1300 328 316", label: "Phone Number", group: "company", inputType: "text", sortOrder: 5 },
  { key: "company.email", value: "info@financiallyup.com.au", label: "Primary Email", group: "company", inputType: "email", sortOrder: 6 },
  { key: "company.address", value: "Level 5, 100 Walker St, North Sydney NSW 2060, Australia", label: "Office Address", group: "company", inputType: "textarea", sortOrder: 7 },
  { key: "company.tagline", value: "Accounting | Taxation | Advisory", label: "Tagline", group: "company", inputType: "text", sortOrder: 8 },
  { key: "company.logoUrl", value: "/images/logo.png", label: "Logo URL", group: "company", inputType: "text", sortOrder: 9, helpText: "Path or absolute URL used in PDF headers" },

  /* ─── Contact Emails ─── */
  { key: "email.info", value: "info@financiallyup.com.au", label: "General Enquiries Email", group: "email", inputType: "email", sortOrder: 1 },
  { key: "email.admin", value: "admin@financiallyup.com.au", label: "Administration Email", group: "email", inputType: "email", sortOrder: 2 },
  { key: "email.privacy", value: "privacy@financiallyup.com.au", label: "Privacy Officer Email", group: "email", inputType: "email", sortOrder: 3 },
  { key: "email.support", value: "support@financiallyup.com.au", label: "Client Support Email", group: "email", inputType: "email", sortOrder: 4 },

  /* ─── Application URLs ─── */
  { key: "url.website", value: "https://financiallyup.com.au", label: "Public Website URL", group: "url", inputType: "url", sortOrder: 1 },
  { key: "url.api", value: "https://api-financiallyup.innotechcloud.online", label: "API Base URL", group: "url", inputType: "url", sortOrder: 2, helpText: "Used to build absolute links to uploaded files in PDFs" },
  { key: "url.adminPortal", value: "https://financiallyup.innotechcloud.online/admin", label: "Admin Portal URL", group: "url", inputType: "url", sortOrder: 3 },
];

/**
 * Inserts any settings that do not yet exist, and refreshes presentation
 * metadata (label/group/inputType/order) on existing rows without touching values.
 */
const seedSettings = async () => {
  try {
    let created = 0;
    for (const setting of DEFAULT_SETTINGS) {
      const [record, wasCreated] = await Setting.findOrCreate({
        where: { key: setting.key },
        defaults: setting,
      });
      if (wasCreated) {
        created += 1;
      } else {
        await record.update({
          label: setting.label,
          group: setting.group,
          inputType: setting.inputType,
          helpText: setting.helpText ?? null,
          sortOrder: setting.sortOrder,
        });
      }
    }
    console.log(`--> Global settings ready (${DEFAULT_SETTINGS.length} keys, ${created} newly created)`);
  } catch (error) {
    console.error("Settings seeding failed:", error.message);
  }
};

module.exports = { seedSettings, DEFAULT_SETTINGS };
