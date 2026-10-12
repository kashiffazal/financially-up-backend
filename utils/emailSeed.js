/**
 * Email Settings Seed (one-time)
 * ==============================
 * The first time the server starts with Settings > Email available:
 *   - the .env mailbox (SMTP_*, EMAIL_SENDER) is saved as an account named
 *     "Imported from server settings (.env)" and made the default
 *   - EMAIL_RECEIVER / EMAIL_CC become the default form recipients
 * so email keeps working exactly as before. Runs once (settings row
 * "system.emailSeeded"); after that everything is managed in the admin.
 */

const { EmailAccount, Setting } = require("../models");
const { encrypt, canEncrypt } = require("./secretBox");
const mail = require("../services/mail.service");

const MARKER = "system.emailSeeded";

const seedEmailSettings = async () => {
  if (await Setting.findOne({ where: { key: MARKER } })) return;
  if (!canEncrypt()) {
    console.warn("⚠️ Email settings: EMAIL_ENCRYPTION_KEY is not set — the .env mailbox was not imported (email still works from .env).");
    return;
  }

  let imported = false;
  if ((await EmailAccount.count()) === 0 && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const port = parseInt(process.env.SMTP_PORT || "465", 10);
    const sender = process.env.EMAIL_SENDER || process.env.SMTP_USER;
    const match = String(sender).match(/^\s*"?([^"<]*)"?\s*<([^>]+)>\s*$/);
    await EmailAccount.create({
      name: "Imported from server settings (.env)",
      host: process.env.SMTP_HOST || "smtp.hostinger.com",
      port,
      security: process.env.SMTP_SECURE === "true" || port === 465 ? "ssl" : "starttls",
      username: process.env.SMTP_USER,
      passwordEncrypted: encrypt(process.env.SMTP_PASS),
      fromName: match ? match[1].trim() || null : null,
      fromEmail: match ? match[2].trim() : sender,
      isDefault: true,
    });
    imported = true;
  }

  if (!(await Setting.findOne({ where: { key: "mail.routing" } }))) {
    const split = (v) => String(v || "").split(/[,;\s]+/).map((x) => x.trim()).filter(Boolean);
    await Setting.create({
      key: "mail.routing",
      value: JSON.stringify({ default: { to: split(process.env.EMAIL_RECEIVER), cc: split(process.env.EMAIL_CC) }, overrides: {} }),
      label: "Form email recipients",
      group: "mail",
      inputType: "json",
    });
  }

  await Setting.create({ key: MARKER, value: "1", label: "Email settings imported", group: "system" });
  mail.clearMailCache();
  if (imported) console.log("✅ Email settings: imported the .env mailbox as the default account.");
};

module.exports = { seedEmailSettings };
