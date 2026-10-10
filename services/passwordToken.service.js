/**
 * Password Links Service
 * ======================
 * Issues and checks one-time password links and sends their emails.
 *
 *   issueAndEmail(user, purpose, { createdByUserId, requestIp })
 *       setup -> "Set up your account" email, link valid 48 hours
 *       reset -> "Reset your password" email, link valid 1 hour
 *   findValidToken(rawToken)  -> { record, user } or null
 *   consumeToken(record)      -> marks it used and cancels the user's other links
 *
 * The link opens /admin/set-password?token=... in the admin panel.
 * Only a SHA-256 hash of the token is stored (models/PasswordToken.js).
 */

const crypto = require("crypto");
const { Op } = require("sequelize");
const { PasswordToken, User } = require("../models");
const { sendMail, renderEmail, mailConfig } = require("./mail.service");

const VALIDITY_MS = {
  setup: 48 * 60 * 60 * 1000,
  reset: 60 * 60 * 1000,
};

const hashToken = (raw) => crypto.createHash("sha256").update(String(raw)).digest("hex");

/** Cancel every unused link of the user (a new one replaces them). */
const cancelOpenTokens = (userId) =>
  PasswordToken.update({ usedAt: new Date() }, { where: { userId, usedAt: null } });

/** Create a link; returns the raw token (only ever sent by email). */
const issueToken = async (user, purpose, { createdByUserId = null, requestIp = null } = {}) => {
  await cancelOpenTokens(user.id);
  const raw = crypto.randomBytes(32).toString("hex");
  await PasswordToken.create({
    userId: user.id,
    tokenHash: hashToken(raw),
    purpose,
    expiresAt: new Date(Date.now() + VALIDITY_MS[purpose]),
    createdByUserId,
    requestIp: requestIp ? String(requestIp).slice(0, 64) : null,
  });
  return raw;
};

const linkFor = (raw) => `${mailConfig().appUrl}/admin/set-password?token=${raw}`;

/**
 * Create a link and email it. Throws when the email can't be sent, so the
 * caller can tell the admin (the link is then cancelled).
 */
const issueAndEmail = async (user, purpose, options = {}) => {
  const raw = await issueToken(user, purpose, options);
  const url = linkFor(raw);
  const name = user.firstName || "there";

  const content =
    purpose === "setup"
      ? {
          subject: "Your Financially Up staff account",
          preheader: "Set your password to start using the staff portal.",
          heading: `Welcome, ${name}`,
          intro:
            "A staff account has been created for you on the Financially Up portal. Choose your own password to activate it.",
          rows: [["Sign-in email", user.email]],
          cta: { label: "Set my password", url },
          footnote:
            "This link works once and expires in 48 hours. If it has expired, ask your administrator to send a new one. If you weren't expecting this email, you can ignore it.",
        }
      : {
          subject: "Reset your Financially Up password",
          preheader: "Use this link to choose a new password.",
          heading: "Reset your password",
          intro: `Hi ${name}, we received a request to reset the password for your Financially Up staff account.`,
          rows: [["Sign-in email", user.email]],
          cta: { label: "Choose a new password", url },
          footnote:
            "This link works once and expires in 1 hour. If you didn't ask for a reset, ignore this email — your password won't change.",
        };

  try {
    const { html, text } = await renderEmail(content);
    await sendMail({ to: user.email, subject: content.subject, html, text });
  } catch (error) {
    await cancelOpenTokens(user.id).catch(() => {});
    throw error;
  }
};

/** The unused, unexpired link for a raw token, with its active user — or null. */
const findValidToken = async (raw) => {
  if (typeof raw !== "string" || !/^[a-f0-9]{64}$/.test(raw)) return null;
  const record = await PasswordToken.findOne({
    where: { tokenHash: hashToken(raw), usedAt: null, expiresAt: { [Op.gt]: new Date() } },
  });
  if (!record) return null;
  const user = await User.findByPk(record.userId);
  if (!user || user.status !== "Active") return null;
  return { record, user };
};

/** Use a link: mark it used and cancel the user's other open links. */
const consumeToken = async (record) => {
  await record.update({ usedAt: new Date() });
  await cancelOpenTokens(record.userId);
};

module.exports = { issueAndEmail, findValidToken, consumeToken, cancelOpenTokens };
