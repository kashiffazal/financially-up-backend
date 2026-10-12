/**
 * Mail Service
 * ============
 * One place that sends every email, with the branded HTML layout.
 *
 * Sending account (Settings > Email in the admin):
 *   - the default EmailAccount from the database, when one is set
 *   - otherwise the server's .env values (SMTP_HOST, SMTP_PORT, SMTP_SECURE,
 *     SMTP_USER, SMTP_PASS, EMAIL_SENDER) — so nothing stops while moving over
 *
 * Who receives form emails (Settings > Email > Recipients, setting "mail.routing"):
 *   { default: { to: [...], cc: [...], bcc: [...] }, overrides: { "<area>": { to, cc, bcc } } }
 *   area = an application module key (e.g. "medicare") or "enquiries".
 *   Falls back to EMAIL_RECEIVER / EMAIL_CC (.env), then the Primary Email (company.email).
 *
 *   SITE_URL          website / admin portal base URL (links in staff emails; utils/siteConfig.js)
 *   COMPANY_LOGO_URL  optional - the logo is normally embedded in the email, else {API_URL}/images/logo.png
 *
 * All user-supplied text is HTML-escaped before it is placed in a template.
 */

const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const { getSettingsMap } = require("./settings.service");
const { brandText } = require("../utils/brand");

// Logo embedded as an inline attachment, referenced in the HTML as cid:<LOGO_CID>
const LOGO_CID = "company-logo@financiallyup";
const LOGO_PATH = path.join(__dirname, "../public/images/logo.png");
const hasLogoFile = () => fs.existsSync(LOGO_PATH);

const ROUTING_KEY = "mail.routing";
const CACHE_MS = 60 * 1000;

// ============================
// Sending account
// ============================

let cached = { at: 0, account: null, transporter: null };

/** Forget the cached account (called after any change in Settings > Email). */
const clearMailCache = () => {
  if (cached.transporter) cached.transporter.close?.();
  cached = { at: 0, account: null, transporter: null };
};

/** The .env account (used until a default is chosen in Settings > Email). */
const envAccount = () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  const port = parseInt(process.env.SMTP_PORT || "465", 10);
  const sender = process.env.EMAIL_SENDER || process.env.SMTP_USER;
  const match = String(sender).match(/^\s*"?([^"<]*)"?\s*<([^>]+)>\s*$/);
  return {
    source: "env",
    name: "Server settings (.env)",
    host: process.env.SMTP_HOST || "smtp.hostinger.com",
    port,
    security: process.env.SMTP_SECURE === "true" || port === 465 ? "ssl" : "starttls",
    username: process.env.SMTP_USER,
    password: process.env.SMTP_PASS,
    fromName: match ? match[1].trim() : "",
    fromEmail: match ? match[2].trim() : sender,
    replyTo: null,
  };
};

/** Database account (plain object with the decrypted password). */
const fromRecord = (record) => {
  const { decrypt } = require("../utils/secretBox");
  const row = record.get ? record.get({ plain: true }) : record;
  return { ...row, source: "db", password: decrypt(row.passwordEncrypted) };
};

/** The account all email is sent with: the default one, else .env. */
const getActiveAccount = async () => {
  if (cached.account && Date.now() - cached.at < CACHE_MS) return cached.account;
  let account = null;
  try {
    const { EmailAccount } = require("../models");
    const record = await EmailAccount.findOne({ where: { isDefault: true } });
    if (record) account = fromRecord(record);
  } catch (error) {
    console.error("[EMAIL] Could not load the default email account:", error.message);
  }
  account = account || envAccount();
  cached = { at: Date.now(), account, transporter: null };
  return account;
};

/** nodemailer transport for an account. */
const createTransportFor = (account) => {
  const security = account.security || "ssl";
  return nodemailer.createTransport({
    host: account.host,
    port: Number(account.port),
    secure: security === "ssl",
    requireTLS: security === "starttls",
    ignoreTLS: security === "none",
    auth: { user: account.username, pass: account.password || "" },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 30000,
  });
};

const formatFrom = (account) =>
  account.fromName ? `"${String(account.fromName).replace(/"/g, "'")}" <${account.fromEmail}>` : account.fromEmail;

/** Transport of the active account (reused). */
const getTransporter = async () => {
  const account = await getActiveAccount();
  if (!account) throw new Error("No email account is set up (Settings > Email, or SMTP_* in .env).");
  if (!cached.transporter) cached.transporter = createTransportFor(account);
  return cached.transporter;
};

const mailConfig = () => ({
  appUrl: require("../utils/siteConfig").siteUrl(),
  logoUrl: process.env.COMPANY_LOGO_URL || `${require("../utils/siteConfig").apiUrl()}/images/logo.png`,
});

// ============================
// Recipients (who receives form emails)
// ============================

const splitList = (value) =>
  (Array.isArray(value) ? value : String(value || "").split(/[,;\s]+/))
    .map((v) => String(v).trim())
    .filter(Boolean);

/** Saved routing { default: {to, cc, bcc}, overrides: {area: {to, cc, bcc}} } (never throws). */
const getRouting = async () => {
  try {
    const settings = await getSettingsMap();
    const parsed = JSON.parse(settings[ROUTING_KEY] || "{}");
    return {
      default: { to: splitList(parsed.default?.to), cc: splitList(parsed.default?.cc), bcc: splitList(parsed.default?.bcc) },
      overrides: parsed.overrides && typeof parsed.overrides === "object" ? parsed.overrides : {},
    };
  } catch {
    return { default: { to: [], cc: [], bcc: [] }, overrides: {} };
  }
};

/**
 * Staff recipients for an area (application module key, or "enquiries").
 * Uses the area's own list when it has one, otherwise the default list.
 * @returns {Promise<{to: string[], cc: string[], bcc: string[]}>}
 */
const getStaffRecipients = async (area) => {
  const routing = await getRouting();
  const override = area ? routing.overrides[area] : null;
  if (override && splitList(override.to).length) {
    return { to: splitList(override.to), cc: splitList(override.cc), bcc: splitList(override.bcc) };
  }
  if (routing.default.to.length) return routing.default;
  // Before Settings > Email is filled in: .env, then the Administration Email setting
  const settings = await getSettingsMap().catch(() => ({}));
  const to = splitList(process.env.EMAIL_RECEIVER || settings["company.email"]);
  return { to, cc: splitList(process.env.EMAIL_CC), bcc: [] };
};

// ============================
// Sending
// ============================

/** Attach the inline logo when the rendered layout references it. */
const withLogo = (html, attachments) =>
  html && html.includes(`cid:${LOGO_CID}`) && hasLogoFile()
    ? [...(attachments || []), { filename: "logo.png", path: LOGO_PATH, cid: LOGO_CID, contentDisposition: "inline" }]
    : attachments;

/**
 * Send one email with the active account. Throws on failure so callers can
 * record the error.
 * @param {object} message - { to, cc, bcc, subject, html, text, replyTo, attachments }
 * @param {object} [account] - send with this account instead (Settings > Email tests)
 */
const sendMail = async ({ to, cc, bcc, subject, html, text, replyTo, attachments }, account = null) => {
  // Company name / email / phone written in the templates follow Settings > Company Details
  const settings = await getSettingsMap().catch(() => ({}));
  subject = brandText(subject, settings);
  html = brandText(html, settings);
  text = brandText(text, settings);
  const useAccount = account || (await getActiveAccount());
  if (!useAccount) throw new Error("No email account is set up (Settings > Email, or SMTP_* in .env).");
  if (!to || (Array.isArray(to) && !to.length)) throw new Error("No recipient address.");
  const transport = account ? createTransportFor(account) : await getTransporter();
  try {
    const info = await transport.sendMail({
      from: formatFrom(useAccount),
      to,
      cc: cc && cc.length ? cc : undefined,
      bcc: bcc && bcc.length ? bcc : undefined,
      replyTo: replyTo || useAccount.replyTo || undefined,
      subject,
      html,
      text,
      attachments: withLogo(html, attachments),
    });
    console.log(`[EMAIL] "${subject}" → ${[].concat(to).join(", ")} (MsgId: ${info.messageId})`);
    return info;
  } finally {
    if (account) transport.close?.();
  }
};

/**
 * Plain-English reason an SMTP error happened (for Settings > Email).
 * @returns {string}
 */
const explainMailError = (error) => {
  const code = String(error?.code || "");
  const msg = String(error?.response || error?.message || "");
  if (/5\.7\.139|basic authentication is disabled|SmtpClientAuthentication is disabled/i.test(msg)) {
    return "Microsoft 365 is blocking username/password sign-in for this mailbox (SMTP AUTH is off or basic authentication was retired). Ask the Microsoft 365 admin to enable Authenticated SMTP for this mailbox, or use a different email service.";
  }
  if (code === "EAUTH" || /535|authentication|username and password not accepted|invalid login/i.test(msg)) {
    return "The server refused the login. Check the username and password (Gmail and Microsoft 365 may need an app password).";
  }
  // Refused / unreachable first: those also arrive as generic socket errors
  if (code === "ECONNREFUSED" || /ECONNREFUSED/.test(msg)) return "The mail server refused the connection. Check the server name and port.";
  if (/self[- ]signed|certificate|wrong version number|ssl3_get_record|tls/i.test(msg) || code === "ESOCKET") {
    return "Secure connection failed. Check that the security setting matches the port (SSL for 465, STARTTLS for 587).";
  }
  if (code === "ETIMEDOUT" || code === "ECONNECTION" || /timeout|timed out/i.test(msg)) {
    return "Couldn't reach the mail server in time. Check the server name and port, and that the hosting allows outgoing SMTP.";
  }
  if (code === "EDNS" || code === "ENOTFOUND" || /getaddrinfo|ENOTFOUND/i.test(msg)) {
    return "The mail server name couldn't be found. Check the SMTP server address.";
  }
  if (/sender|from address|not owned|SendAsDenied|5\.7\.60/i.test(msg)) {
    return "The server won't send from this From address. Use the mailbox's own address (or one it may send as).";
  }
  if (code === "EENVELOPE" || /recipient|mailbox unavailable|550/i.test(msg)) {
    return "The test recipient was rejected. Check the email address you're sending the test to.";
  }
  return "The email couldn't be sent. See the technical details below.";
};

// ============================
// Branded layout
// ============================

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/**
 * Render a branded email.
 * @param {object} opts
 * @param {string} opts.preheader   Inbox preview text
 * @param {string} opts.heading
 * @param {string} [opts.intro]     Plain text (escaped)
 * @param {Array<[string,string]>} [opts.rows]   Label/value pairs (escaped); empty values skipped
 * @param {string} [opts.reference] Highlighted reference number
 * @param {string} [opts.quote]     Multi-line message block (escaped)
 * @param {{label:string,url:string}} [opts.cta]
 * @param {string} [opts.footnote]  Small text under the content (escaped)
 */
const renderEmail = async ({ preheader, heading, intro, rows = [], reference, quote, cta, footnote }) => {
  const settings = await getSettingsMap().catch(() => ({}));
  const logoSrc = hasLogoFile() ? `cid:${LOGO_CID}` : mailConfig().logoUrl;
  const companyName = settings["company.legalName"] || settings["company.name"];
  const phone = settings["company.phone"];
  const email = settings["company.email"];
  const address = settings["company.address"];

  const rowsHtml = rows
    .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== "")
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:.04em;width:38%;vertical-align:top;">${escapeHtml(label)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;color:#0f172a;font-size:14px;vertical-align:top;">${escapeHtml(value)}</td>
        </tr>`
    )
    .join("");

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(heading)}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader || heading)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
        <tr><td style="background:#008043;padding:20px 28px;">
          ${
            logoSrc
              ? `<img src="${escapeHtml(logoSrc)}" alt="${escapeHtml(companyName)}" height="34" style="display:block;height:34px;border:0;background:#ffffff;border-radius:8px;padding:6px 10px;">`
              : `<span style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:.02em;">${escapeHtml(companyName)}</span>`
          }
        </td></tr>
        <tr><td style="padding:28px;">
          <h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;color:#0f172a;">${escapeHtml(heading)}</h1>
          ${intro ? `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#334155;">${escapeHtml(intro)}</p>` : ""}
          ${
            reference
              ? `<div style="margin:0 0 18px;padding:14px 16px;background:#eaf7f0;border-left:4px solid #008043;border-radius:8px;">
                   <div style="font-size:11px;font-weight:bold;color:#008043;text-transform:uppercase;letter-spacing:.06em;">Reference</div>
                   <div style="margin-top:4px;font-family:Consolas,Menlo,monospace;font-size:18px;font-weight:800;color:#0f172a;">${escapeHtml(reference)}</div>
                 </div>`
              : ""
          }
          ${rowsHtml ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;">${rowsHtml}</table>` : ""}
          ${
            quote
              ? `<div style="margin:0 0 18px;padding:14px 16px;background:#f8fafc;border-left:3px solid #008043;border-radius:0 8px 8px 0;font-size:14px;line-height:1.6;color:#334155;white-space:pre-line;">${escapeHtml(quote)}</div>`
              : ""
          }
          ${
            cta
              ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 4px;"><tr><td style="background:#008043;border-radius:10px;">
                   <a href="${escapeHtml(cta.url)}" style="display:inline-block;padding:12px 22px;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;">${escapeHtml(cta.label)} &rarr;</a>
                 </td></tr></table>`
              : ""
          }
          ${footnote ? `<p style="margin:18px 0 0;font-size:12px;line-height:1.5;color:#64748b;">${escapeHtml(footnote)}</p>` : ""}
        </td></tr>
        <tr><td style="padding:18px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;line-height:1.6;color:#64748b;">
          <strong style="color:#334155;">${escapeHtml(companyName)}</strong><br>
          ${[phone && `Phone: ${escapeHtml(phone)}`, email && `Email: ${escapeHtml(email)}`].filter(Boolean).join(" &nbsp;|&nbsp; ")}
          ${address ? `<br>${escapeHtml(address)}` : ""}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = [
    heading,
    intro,
    reference && `Reference: ${reference}`,
    ...rows.filter(([, v]) => v).map(([l, v]) => `${l}: ${v}`),
    quote,
    cta && `${cta.label}: ${cta.url}`,
    footnote,
    "",
    companyName,
  ]
    .filter(Boolean)
    .join("\n\n");

  return { html, text };
};

module.exports = {
  getTransporter,
  getActiveAccount,
  createTransportFor,
  clearMailCache,
  mailConfig,
  getRouting,
  getStaffRecipients,
  sendMail,
  explainMailError,
  renderEmail,
  escapeHtml,
};
