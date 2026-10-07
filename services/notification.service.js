/**
 * Notification Service
 * ====================
 * Creates staff notifications for:
 *   - notifySubmission()     a client submitted an application form
 *   - notifyStatusChange()   a staff member changed an application's status / decision
 *   - notifyContactEnquiry() a website visitor sent the contact form
 *
 * Module names, references, admin routes and permissions come from the Global
 * Search registry so every screen describes a module the same way.
 *
 * Every function is fire-and-forget safe: errors are logged, never thrown, so a
 * notification problem can never break a form submission or status update.
 */

const { EventEmitter } = require("events");
const { Notification, NewIndividualClient } = require("../models");

/**
 * In-process event bus: every saved notification is emitted as "notification"
 * so the live stream (GET /api/notifications/stream) can push it instantly.
 * Note: single Node process only — with several processes, clients still get
 * updates through the 30s polling fallback.
 */
const notificationBus = new EventEmitter();
notificationBus.setMaxListeners(0);
const { SEARCH_REGISTRY } = require("./globalSearch.service");
const { sendApplicationStaffAlert } = require("./alertEmail.service");

// Modules that already send their own staff alert email on submission
const MODULES_WITH_OWN_STAFF_EMAIL = new Set(["new-individual"]);

const MODULES_BY_MODEL = Object.fromEntries(SEARCH_REGISTRY.map((m) => [m.model, m]));
const MODULES_BY_KEY = Object.fromEntries(SEARCH_REGISTRY.map((m) => [m.key, m]));

const ENQUIRY_PERMISSION = "enquiries.view";

// ============================
// Helpers
// ============================

const plain = (record) => (record && typeof record.get === "function" ? record.get({ plain: true }) : record || {});

const referenceFor = (mod, row) =>
  mod.refField ? row[mod.refField] || `${mod.refFallbackPrefix}-${row.id}` : `${mod.refPrefix}-${row.id}`;

const firstValue = (row, fields, kind) => {
  const field = fields.find((f) => f.kind === kind && row[f.col]);
  return field ? String(row[field.col]) : null;
};

/** Display name + contact details for a record (loads the client for flagship engagements). */
const describeRecord = async (mod, row) => {
  if (mod.client && row[mod.client.localKey] && !row.__client) {
    row.__client = await NewIndividualClient.findByPk(row[mod.client.localKey], {
      attributes: ["fullName", "firstName", "lastName", "email", "mobile"],
      raw: true,
    });
  }
  const client = row.__client || {};
  return {
    reference: referenceFor(mod, row),
    displayName: mod.title(row),
    email: client.email || firstValue(row, mod.fields, "email"),
    phone: client.mobile || firstValue(row, mod.fields, "phone"),
  };
};

/** `req.user` → { actorUserId, actorName } (null when the request is anonymous). */
const actorFrom = (req) => {
  const user = req?.user;
  if (!user) return { actorUserId: null, actorName: null };
  return {
    actorUserId: user.id,
    actorName: user.fullName || [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || null,
  };
};

const save = async (payload) => {
  try {
    const created = await Notification.create(payload);
    notificationBus.emit("notification", created.get({ plain: true }));
    return created;
  } catch (error) {
    console.error("[Notification] Failed to save notification:", error.message);
    return null;
  }
};

// ============================
// Public API
// ============================

/**
 * A client submitted an application.
 * @param {string} modelName - Sequelize model name (e.g. "GstRegistration")
 * @param {object} record - Created record (instance or plain object)
 */
const notifySubmission = async (modelName, record) => {
  try {
    const mod = MODULES_BY_MODEL[modelName];
    if (!mod || !record) return null;
    const row = plain(record);
    const info = await describeRecord(mod, row);

    if (!MODULES_WITH_OWN_STAFF_EMAIL.has(mod.key)) {
      sendApplicationStaffAlert({
        moduleName: mod.name,
        route: mod.route,
        recordId: row.id,
        reference: info.reference,
        clientName: info.displayName,
        email: info.email,
        phone: info.phone,
      }).catch((error) => console.error(`[Notification] Staff email for ${info.reference} failed:`, error.message));
    }

    return save({
      type: "submission",
      moduleKey: mod.key,
      recordId: row.id,
      reference: info.reference,
      title: `New ${mod.name}`,
      message: `${info.displayName} submitted a new application.`,
      meta: {
        moduleName: mod.name,
        clientName: info.displayName,
        email: info.email,
        phone: info.phone,
        status: row.status || null,
      },
      permission: mod.permission || null,
    });
  } catch (error) {
    console.error("[Notification] notifySubmission error:", error.message);
    return null;
  }
};

/**
 * A staff member changed an application's status (or recorded a decision).
 * Skipped when the status did not actually change.
 *
 * @param {string} modelName
 * @param {object} record - Record AFTER the update
 * @param {string|null} fromStatus - Status BEFORE the update
 * @param {object} req - Express request (actor = req.user)
 * @param {object} [extra] - { notes, decision } extra context for the details view
 */
const notifyStatusChange = async (modelName, record, fromStatus, req, extra = {}) => {
  try {
    const mod = MODULES_BY_MODEL[modelName];
    if (!mod || !record) return null;
    const row = plain(record);
    const toStatus = row.status || extra.toStatus || null;
    if (!toStatus || toStatus === fromStatus) return null;

    const info = await describeRecord(mod, row);
    const actor = actorFrom(req);
    const who = actor.actorName || "A staff member";

    return save({
      type: "status_change",
      moduleKey: mod.key,
      recordId: row.id,
      reference: info.reference,
      title: `${info.reference} marked "${toStatus}"`,
      message: `${who} changed ${info.displayName}'s ${mod.name} from ${fromStatus || "—"} to ${toStatus}.`,
      meta: {
        moduleName: mod.name,
        clientName: info.displayName,
        email: info.email,
        phone: info.phone,
        fromStatus: fromStatus || null,
        toStatus,
        notes: extra.notes || null,
      },
      permission: mod.permission || null,
      ...actor,
    });
  } catch (error) {
    console.error("[Notification] notifyStatusChange error:", error.message);
    return null;
  }
};

/**
 * A website visitor sent the contact form.
 * @param {object} enquiry - ContactEnquiry record
 */
const notifyContactEnquiry = async (enquiry) => {
  try {
    const row = plain(enquiry);
    const name = [row.firstName, row.lastName].filter(Boolean).join(" ") || row.email;
    const excerpt = String(row.message || "").replace(/\s+/g, " ").trim().slice(0, 140);

    return save({
      type: "contact_enquiry",
      moduleKey: "enquiries",
      recordId: row.id,
      reference: row.referenceNumber,
      title: `New enquiry from ${name}`,
      message: row.service ? `${row.service}${excerpt ? ` — ${excerpt}` : ""}` : excerpt || "New website enquiry.",
      meta: {
        clientName: name,
        email: row.email,
        phone: row.phone,
        service: row.service,
        preferredContact: row.preferredContact,
        source: row.source,
      },
      permission: ENQUIRY_PERMISSION,
    });
  } catch (error) {
    console.error("[Notification] notifyContactEnquiry error:", error.message);
    return null;
  }
};

module.exports = {
  notificationBus,
  notifySubmission,
  notifyStatusChange,
  notifyContactEnquiry,
  actorFrom,
  MODULES_BY_KEY,
  MODULES_BY_MODEL,
  ENQUIRY_PERMISSION,
};
