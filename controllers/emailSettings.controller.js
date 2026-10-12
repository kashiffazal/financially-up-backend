/**
 * Email Settings Controller (Settings > Email)
 * ============================================
 * Sending accounts (SMTP) and who receives form emails.
 *
 * GET    /api/email-settings/accounts                    list (no passwords)       settings.view
 * POST   /api/email-settings/accounts                    add                      settings.update
 * PUT    /api/email-settings/accounts/:id                edit (password optional) settings.update
 * DELETE /api/email-settings/accounts/:id                delete (not the default) settings.update
 * POST   /api/email-settings/accounts/:id/test           { to } send a test email settings.update
 * POST   /api/email-settings/accounts/:id/make-default   { to } test, then default settings.update
 * GET    /api/email-settings/recipients                  routing + form list       settings.view
 * PUT    /api/email-settings/recipients                  save routing              settings.update
 *
 * Passwords are encrypted at rest and never returned. A default account is only
 * accepted after a test email has been delivered through it.
 */

const { sequelize, EmailAccount, Setting } = require("../models");
const { encrypt, canEncrypt } = require("../utils/secretBox");
const mail = require("../services/mail.service");
const { clearSettingsCache } = require("../services/settings.service");
const auditService = require("../services/audit.service");
const { SEARCH_REGISTRY } = require("../services/globalSearch.service");

const SECURITY = ["ssl", "starttls", "none"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ROUTING_KEY = "mail.routing";

const clean = (v, max = 190) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const isEmail = (v) => EMAIL_RE.test(String(v || "").trim());

const audit = (req, action, description, resourceId = null) =>
  auditService.log({
    actorUserId: req.user?.id,
    action,
    module: "settings",
    resourceType: "email_account",
    resourceId,
    description,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

/** Account as shown in the admin (never the password). */
const safe = (record) => {
  const { passwordEncrypted, ...rest } = record.get ? record.get({ plain: true }) : record;
  return { ...rest, hasPassword: Boolean(passwordEncrypted) };
};

const fail = (res, error, fallback) => {
  console.error(`[EmailSettings] ${fallback}:`, error);
  return res.status(500).json({ success: false, message: fallback });
};

/** Validate the account fields; returns { values } or { error }. */
const readAccountInput = (body, { requirePassword }) => {
  const values = {
    name: clean(body.name, 120),
    host: clean(body.host),
    port: Number(body.port),
    security: SECURITY.includes(body.security) ? body.security : "ssl",
    username: clean(body.username),
    fromName: clean(body.fromName, 120) || null,
    fromEmail: clean(body.fromEmail),
    replyTo: clean(body.replyTo) || null,
  };
  if (!values.name) return { error: "Give this account a name, e.g. Client Microsoft 365." };
  if (!values.host) return { error: "Enter the SMTP server, e.g. smtp.office365.com." };
  if (!Number.isInteger(values.port) || values.port < 1 || values.port > 65535) return { error: "Enter a valid port (usually 465 or 587)." };
  if (!values.username) return { error: "Enter the username (usually the mailbox email address)." };
  if (!isEmail(values.fromEmail)) return { error: "Enter a valid From email address." };
  if (values.replyTo && !isEmail(values.replyTo)) return { error: "Enter a valid Reply-To address, or leave it empty." };
  const password = typeof body.password === "string" ? body.password : "";
  if (requirePassword && !password) return { error: "Enter the mailbox password." };
  return { values, password };
};

/** The branded test email, sent with a specific account. */
const sendTestWith = async (req, record, to) => {
  const { decrypt } = require("../utils/secretBox");
  const account = record.get({ plain: true });
  const plainAccount = { ...account, source: "db", password: decrypt(account.passwordEncrypted) };
  if (!plainAccount.password) {
    const error = new Error("The saved password can't be read. Edit the account and enter the password again.");
    error.friendly = error.message;
    throw error;
  }
  const { html, text } = await mail.renderEmail({
    preheader: "Your email settings are working.",
    heading: "Test email from the Financially Up portal",
    intro: "If you're reading this, the portal can send email with this account.",
    rows: [
      ["Account", account.name],
      ["Sent from", `${record.fromName ? `${record.fromName} ` : ""}<${record.fromEmail}>`],
      ["Server", `${record.host}:${record.port} (${record.security.toUpperCase()})`],
      ["Requested by", req.user?.fullName || req.user?.email],
    ],
    footnote: "This test was sent from Settings > Email. No action is needed.",
  });
  await mail.sendMail({ to, subject: "Test email · Financially Up portal", html, text }, plainAccount);
};

/** Record a test result on the account and turn errors into plain English. */
const runTest = async (req, record, to) => {
  try {
    await sendTestWith(req, record, to);
    await record.update({ lastTestAt: new Date(), lastTestOk: true, lastTestMessage: `Test email delivered to ${to}` });
    return { ok: true };
  } catch (error) {
    const friendly = error.friendly || mail.explainMailError(error);
    const detail = String(error?.response || error?.message || "").slice(0, 400);
    await record.update({ lastTestAt: new Date(), lastTestOk: false, lastTestMessage: friendly.slice(0, 500) });
    return { ok: false, message: friendly, detail };
  }
};

// ============================
// Accounts
// ============================

/** GET /accounts */
const listAccounts = async (req, res) => {
  try {
    const rows = await EmailAccount.findAll({ order: [["isDefault", "DESC"], ["name", "ASC"]] });
    const active = await mail.getActiveAccount();
    return res.status(200).json({
      success: true,
      data: rows.map(safe),
      // Until a default is chosen, email is sent with the server's .env settings
      fallback: active && active.source === "env" ? { name: active.name, username: active.username, host: active.host } : null,
      canEncrypt: canEncrypt(),
    });
  } catch (error) {
    return fail(res, error, "Failed to load email accounts.");
  }
};

/** POST /accounts */
const createAccount = async (req, res) => {
  if (!canEncrypt()) {
    return res.status(500).json({ success: false, message: "EMAIL_ENCRYPTION_KEY is not set on the server, so passwords can't be stored safely." });
  }
  const { values, password, error } = readAccountInput(req.body || {}, { requirePassword: true });
  if (error) return res.status(400).json({ success: false, message: error });
  try {
    const record = await EmailAccount.create({
      ...values,
      passwordEncrypted: encrypt(password),
      isDefault: false,
      createdByUserId: req.user?.id || null,
      updatedByUserId: req.user?.id || null,
    });
    await audit(req, "EMAIL_ACCOUNT_ADDED", `Added email account "${record.name}" (${record.username} via ${record.host})`, record.id);
    return res.status(201).json({ success: true, message: "Email account added. Send a test or make it the default to start using it.", data: safe(record) });
  } catch (err) {
    return fail(res, err, "Failed to add the email account.");
  }
};

/** PUT /accounts/:id — editing the default account re-checks the connection first */
const updateAccount = async (req, res) => {
  const { values, password, error } = readAccountInput(req.body || {}, { requirePassword: false });
  if (error) return res.status(400).json({ success: false, message: error });
  try {
    const record = await EmailAccount.findByPk(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: "Email account not found." });
    if (password && !canEncrypt()) {
      return res.status(500).json({ success: false, message: "EMAIL_ENCRYPTION_KEY is not set on the server." });
    }

    const changes = { ...values, updatedByUserId: req.user?.id || null };
    if (password) changes.passwordEncrypted = encrypt(password);
    const connectionChanged =
      Boolean(password) || ["host", "port", "security", "username"].some((k) => String(record[k]) !== String(values[k]));

    // The default account sends every email: don't save settings that can't connect
    if (record.isDefault && connectionChanged) {
      const { decrypt } = require("../utils/secretBox");
      const candidate = { ...record.get({ plain: true }), ...values, password: password || decrypt(record.passwordEncrypted) };
      const transport = mail.createTransportFor(candidate);
      try {
        await transport.verify();
      } catch (verifyError) {
        return res.status(400).json({
          success: false,
          message: `Not saved — this is the default account and the new settings don't connect. ${mail.explainMailError(verifyError)}`,
          detail: String(verifyError?.response || verifyError?.message || "").slice(0, 400),
        });
      } finally {
        transport.close?.();
      }
    }

    if (connectionChanged) Object.assign(changes, { lastTestOk: null, lastTestMessage: null, lastTestAt: null });
    await record.update(changes);
    mail.clearMailCache();
    await audit(req, "EMAIL_ACCOUNT_UPDATED", `Updated email account "${record.name}"${password ? " (password changed)" : ""}`, record.id);
    return res.status(200).json({ success: true, message: "Email account saved.", data: safe(record) });
  } catch (err) {
    return fail(res, err, "Failed to save the email account.");
  }
};

/** DELETE /accounts/:id */
const deleteAccount = async (req, res) => {
  try {
    const record = await EmailAccount.findByPk(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: "Email account not found." });
    if (record.isDefault) {
      return res.status(400).json({ success: false, message: "This is the default account. Make another account the default before deleting it." });
    }
    await record.destroy();
    await audit(req, "EMAIL_ACCOUNT_DELETED", `Deleted email account "${record.name}"`, record.id);
    return res.status(200).json({ success: true, message: "Email account deleted." });
  } catch (err) {
    return fail(res, err, "Failed to delete the email account.");
  }
};

/** POST /accounts/:id/test  { to } */
const testAccount = async (req, res) => {
  const to = clean(req.body?.to);
  if (!isEmail(to)) return res.status(400).json({ success: false, message: "Enter a valid email address to send the test to." });
  try {
    const record = await EmailAccount.findByPk(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: "Email account not found." });
    const result = await runTest(req, record, to);
    await audit(req, result.ok ? "EMAIL_TEST_SENT" : "EMAIL_TEST_FAILED", `Test email for "${record.name}" to ${to}: ${result.ok ? "delivered" : result.message}`, record.id);
    if (!result.ok) return res.status(400).json({ success: false, message: result.message, detail: result.detail, data: safe(record) });
    return res.status(200).json({ success: true, message: `Test email sent to ${to}. Check that inbox (and spam).`, data: safe(record) });
  } catch (err) {
    return fail(res, err, "Failed to send the test email.");
  }
};

/** POST /accounts/:id/make-default  { to } — only after a successful test email */
const makeDefault = async (req, res) => {
  const to = clean(req.body?.to);
  if (!isEmail(to)) return res.status(400).json({ success: false, message: "Enter a valid email address to send the test to." });
  try {
    const record = await EmailAccount.findByPk(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: "Email account not found." });
    const result = await runTest(req, record, to);
    if (!result.ok) {
      await audit(req, "EMAIL_DEFAULT_REJECTED", `"${record.name}" was not made the default: ${result.message}`, record.id);
      return res.status(400).json({
        success: false,
        message: `This account can't be the default yet — the test email failed. ${result.message}`,
        detail: result.detail,
        data: safe(record),
      });
    }
    await sequelize.transaction(async (transaction) => {
      await EmailAccount.update({ isDefault: false }, { where: { isDefault: true }, transaction });
      await record.update({ isDefault: true, updatedByUserId: req.user?.id || null }, { transaction });
    });
    mail.clearMailCache();
    await audit(req, "EMAIL_DEFAULT_CHANGED", `"${record.name}" is now the default email account (test delivered to ${to})`, record.id);
    return res.status(200).json({
      success: true,
      message: `Test email delivered to ${to}. "${record.name}" is now the default — all portal emails are sent with it.`,
      data: safe(record),
    });
  } catch (err) {
    return fail(res, err, "Failed to change the default email account.");
  }
};

// ============================
// Recipients
// ============================

/** Forms (and website enquiries) that can have their own recipients. */
const routingAreas = () => [
  { key: "enquiries", label: "Website Enquiries" },
  ...SEARCH_REGISTRY.filter((m) => m.key !== "blog").map((m) => ({ key: m.key, label: m.name })),
];

/** GET /recipients */
const getRecipients = async (req, res) => {
  try {
    return res.status(200).json({ success: true, data: { routing: await mail.getRouting(), areas: routingAreas() } });
  } catch (err) {
    return fail(res, err, "Failed to load recipients.");
  }
};

/** PUT /recipients  { default: {to, cc, bcc}, overrides: { area: {to, cc, bcc} } } */
const updateRecipients = async (req, res) => {
  const body = req.body || {};
  const list = (v) =>
    [...new Set((Array.isArray(v) ? v : String(v || "").split(/[,;\s]+/)).map((x) => String(x).trim().toLowerCase()).filter(Boolean))];
  const bad = [];
  const check = (arr) => {
    arr.filter((x) => !isEmail(x)).forEach((x) => bad.push(x));
    return arr;
  };

  const routing = {
    default: { to: check(list(body.default?.to)), cc: check(list(body.default?.cc)), bcc: check(list(body.default?.bcc)) },
    overrides: {},
  };
  const known = new Set(routingAreas().map((a) => a.key));
  for (const [key, value] of Object.entries(body.overrides || {})) {
    if (!known.has(key)) continue;
    const to = check(list(value?.to));
    const cc = check(list(value?.cc));
    const bcc = check(list(value?.bcc));
    if (to.length) routing.overrides[key] = { to, cc, bcc };
  }

  if (bad.length) return res.status(400).json({ success: false, message: `Not a valid email address: ${bad.slice(0, 3).join(", ")}` });
  if (!routing.default.to.length) return res.status(400).json({ success: false, message: "Add at least one address to receive form emails." });

  try {
    const value = JSON.stringify(routing);
    const row = await Setting.findOne({ where: { key: ROUTING_KEY } });
    if (row) await row.update({ value });
    else await Setting.create({ key: ROUTING_KEY, value, label: "Form email recipients", group: "mail", inputType: "json" });
    clearSettingsCache();
    const overridesText = Object.entries(routing.overrides).map(([k, v]) => `${k} → ${v.to.join(", ")}`).join("; ");
    await audit(req, "EMAIL_RECIPIENTS_UPDATED", `Form emails go to ${routing.default.to.join(", ")}${overridesText ? ` (own lists: ${overridesText})` : ""}`);
    return res.status(200).json({ success: true, message: "Recipients saved.", data: { routing, areas: routingAreas() } });
  } catch (err) {
    return fail(res, err, "Failed to save recipients.");
  }
};

module.exports = {
  listAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  testAccount,
  makeDefault,
  getRecipients,
  updateRecipients,
};
