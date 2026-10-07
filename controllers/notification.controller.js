/**
 * Notification Controller
 * =======================
 * Staff notification feed for the admin header bell.
 *
 * Visibility rules (applied to every endpoint):
 *   - Administrators see everything; other staff only see notifications whose
 *     `permission` they hold (NULL permission = everyone).
 *   - Nobody sees notifications about their own actions.
 */

const { Op, literal } = require("sequelize");
const models = require("../models");
const { MODULES_BY_KEY, notificationBus } = require("../services/notification.service");

const HEARTBEAT_MS = 25000;

const { Notification, NotificationRead, ContactEnquiry, NewIndividualClient } = models;

const MAX_PAGE_SIZE = 50;

// ============================
// Visibility helpers
// ============================

const isSuperAdmin = (req) => (req.user?.roles || []).some((r) => r.slug === "administrator");

const visibilityConditions = (req) => {
  const userId = Number(req.user.id);
  const conditions = [{ [Op.or]: [{ actorUserId: null }, { actorUserId: { [Op.ne]: userId } }] }];
  if (!isSuperAdmin(req)) {
    conditions.push({
      [Op.or]: [{ permission: null }, { permission: { [Op.in]: req.permissions || [] } }],
    });
  }
  return conditions;
};

// A dismissed notification always has a read row, so it never counts as unread
const unreadCondition = (req) =>
  literal(
    `NOT EXISTS (SELECT 1 FROM notification_reads nr WHERE nr.notificationId = \`notifications\`.\`id\` AND nr.userId = ${Number(
      req.user.id
    )})`
  );

// Hides notifications the user removed from their own list
const notDismissedCondition = (req) =>
  literal(
    `NOT EXISTS (SELECT 1 FROM notification_reads nd WHERE nd.notificationId = \`notifications\`.\`id\` AND nd.userId = ${Number(
      req.user.id
    )} AND nd.dismissedAt IS NOT NULL)`
  );

/** Visible to the user AND still in their list. */
const listConditions = (req) => [...visibilityConditions(req), notDismissedCondition(req)];

const parseMeta = (meta) => {
  if (!meta) return {};
  if (typeof meta === "object") return meta;
  try {
    return JSON.parse(meta);
  } catch {
    return {};
  }
};

const ENQUIRY_MODULE = { name: "Website Enquiry", color: "#0ea5e9" };

const serialize = (row, read) => ({
  id: row.id,
  type: row.type,
  moduleKey: row.moduleKey,
  moduleName: (MODULES_BY_KEY[row.moduleKey] || (row.moduleKey === "enquiries" ? ENQUIRY_MODULE : {})).name || null,
  color: (MODULES_BY_KEY[row.moduleKey] || (row.moduleKey === "enquiries" ? ENQUIRY_MODULE : {})).color || "#64748b",
  recordId: row.recordId,
  reference: row.reference,
  title: row.title,
  message: row.message,
  meta: parseMeta(row.meta),
  actorName: row.actorName,
  createdAt: row.createdAt,
  read: Boolean(read),
});

const countUnread = (req) =>
  Notification.count({ where: { [Op.and]: [...visibilityConditions(req), unreadCondition(req)] } });

const findVisible = (req, id) =>
  Notification.findOne({
    where: { [Op.and]: [{ id: Number(id) || 0 }, ...visibilityConditions(req)] },
    raw: true,
  });

const markRead = (notificationId, userId) =>
  NotificationRead.findOrCreate({
    where: { notificationId, userId },
    defaults: { notificationId, userId, readAt: new Date() },
  });

// ============================
// Endpoints
// ============================

/**
 * GET /api/notifications?filter=all|unread&limit=20&before=<id>
 */
const list = async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), MAX_PAGE_SIZE);
    const before = parseInt(req.query.before, 10);
    const unreadOnly = req.query.filter === "unread";

    const conditions = listConditions(req);
    if (unreadOnly) conditions.push(unreadCondition(req));
    if (before > 0) conditions.push({ id: { [Op.lt]: before } });

    const rows = await Notification.findAll({
      where: { [Op.and]: conditions },
      order: [["id", "DESC"]],
      limit: limit + 1,
      raw: true,
    });

    const page = rows.slice(0, limit);
    const reads = page.length
      ? await NotificationRead.findAll({
          where: { userId: req.user.id, notificationId: { [Op.in]: page.map((r) => r.id) } },
          attributes: ["notificationId"],
          raw: true,
        })
      : [];
    const readIds = new Set(reads.map((r) => r.notificationId));

    return res.status(200).json({
      success: true,
      data: {
        items: page.map((row) => serialize(row, readIds.has(row.id))),
        hasMore: rows.length > limit,
        unreadCount: await countUnread(req),
      },
    });
  } catch (error) {
    console.error("[Notifications] list error:", error);
    return res.status(500).json({ success: false, message: "Failed to load notifications." });
  }
};

/**
 * GET /api/notifications/unread-count
 * Lightweight poll: unread count + the newest unread item (for "new notification" toasts).
 */
const unreadCount = async (req, res) => {
  try {
    const [count, latest] = await Promise.all([
      countUnread(req),
      Notification.findOne({
        where: { [Op.and]: [...visibilityConditions(req), unreadCondition(req)] },
        order: [["id", "DESC"]],
        raw: true,
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: { unreadCount: count, latest: latest ? serialize(latest, false) : null },
    });
  } catch (error) {
    console.error("[Notifications] unreadCount error:", error);
    return res.status(500).json({ success: false, message: "Failed to load notifications." });
  }
};

/**
 * Current state of the application / enquiry a notification points at.
 */
const buildTarget = async (row) => {
  if (row.moduleKey === "enquiries" && row.recordId) {
    const enquiry = await ContactEnquiry.findByPk(row.recordId, { raw: true });
    if (!enquiry) return { kind: "enquiry", exists: false };
    const { ipAddress, userAgent, ...safe } = enquiry;
    return { kind: "enquiry", exists: true, url: `/admin/enquiries?open=${enquiry.id}`, enquiry: safe };
  }

  const mod = MODULES_BY_KEY[row.moduleKey];
  if (!mod || !row.recordId) return null;

  const Model = models[mod.model];
  const record = Model ? await Model.findByPk(row.recordId, { raw: true }) : null;
  if (!record) {
    return { kind: "application", exists: false, moduleName: mod.name, color: mod.color, route: mod.route };
  }

  if (mod.client && record[mod.client.localKey]) {
    record.__client = await NewIndividualClient.findByPk(record[mod.client.localKey], {
      attributes: ["fullName", "firstName", "lastName", "email", "mobile"],
      raw: true,
    });
  }

  const reference = mod.refField
    ? record[mod.refField] || `${mod.refFallbackPrefix}-${record.id}`
    : `${mod.refPrefix}-${record.id}`;
  const firstOf = (kind) => {
    const f = mod.fields.find((field) => field.kind === kind && record[field.col]);
    return f ? record[f.col] : null;
  };

  return {
    kind: "application",
    exists: true,
    moduleKey: mod.key,
    moduleName: mod.name,
    color: mod.color,
    route: mod.route,
    url: `${mod.route}?open=${record.id}`,
    reference,
    title: mod.title(record),
    subtitle: mod.subtitle(record),
    status: record.status || null,
    email: record.__client?.email || firstOf("email"),
    phone: record.__client?.mobile || firstOf("phone"),
    pdfUrl: record.clientPdfPath || null,
    submittedAt: record.submittedAt || record.createdAt,
  };
};

/**
 * GET /api/notifications/:id — full details; marks the notification as read.
 */
const getById = async (req, res) => {
  try {
    const row = await findVisible(req, req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Notification not found." });

    await markRead(row.id, req.user.id);
    const target = await buildTarget(row);

    return res.status(200).json({
      success: true,
      data: { notification: serialize(row, true), target, unreadCount: await countUnread(req) },
    });
  } catch (error) {
    console.error("[Notifications] getById error:", error);
    return res.status(500).json({ success: false, message: "Failed to load notification." });
  }
};

/**
 * POST /api/notifications/:id/read
 */
const markOneRead = async (req, res) => {
  try {
    const row = await findVisible(req, req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Notification not found." });
    await markRead(row.id, req.user.id);
    return res.status(200).json({ success: true, data: { unreadCount: await countUnread(req) } });
  } catch (error) {
    console.error("[Notifications] markOneRead error:", error);
    return res.status(500).json({ success: false, message: "Failed to update notification." });
  }
};

/**
 * POST /api/notifications/read-all
 */
const markAllRead = async (req, res) => {
  try {
    const unread = await Notification.findAll({
      where: { [Op.and]: [...visibilityConditions(req), unreadCondition(req)] },
      attributes: ["id"],
      limit: 2000,
      raw: true,
    });
    if (unread.length) {
      const now = new Date();
      await NotificationRead.bulkCreate(
        unread.map((n) => ({ notificationId: n.id, userId: req.user.id, readAt: now })),
        { ignoreDuplicates: true }
      );
    }
    return res.status(200).json({ success: true, data: { unreadCount: await countUnread(req) } });
  } catch (error) {
    console.error("[Notifications] markAllRead error:", error);
    return res.status(500).json({ success: false, message: "Failed to update notifications." });
  }
};

/**
 * DELETE /api/notifications/:id — remove one notification from MY list.
 * Notifications are shared by every staff member who may see them, so this only
 * hides it for the current user; colleagues keep theirs.
 */
const dismissOne = async (req, res) => {
  try {
    const row = await findVisible(req, req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Notification not found." });
    const now = new Date();
    await NotificationRead.bulkCreate([{ notificationId: row.id, userId: req.user.id, readAt: now, dismissedAt: now }], {
      updateOnDuplicate: ["dismissedAt"],
    });
    return res.status(200).json({ success: true, data: { unreadCount: await countUnread(req) } });
  } catch (error) {
    console.error("[Notifications] dismissOne error:", error);
    return res.status(500).json({ success: false, message: "Failed to remove notification." });
  }
};

/**
 * POST /api/notifications/:id/restore — undo a removal (it comes back as read).
 */
const restoreOne = async (req, res) => {
  try {
    const row = await findVisible(req, req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Notification not found." });
    await NotificationRead.update({ dismissedAt: null }, { where: { notificationId: row.id, userId: req.user.id } });
    return res.status(200).json({ success: true, data: { unreadCount: await countUnread(req) } });
  } catch (error) {
    console.error("[Notifications] restoreOne error:", error);
    return res.status(500).json({ success: false, message: "Failed to restore notification." });
  }
};

/**
 * DELETE /api/notifications?filter=all|unread — clear my list (or only my unread items).
 */
const dismissAll = async (req, res) => {
  try {
    const conditions = listConditions(req);
    if (req.query.filter === "unread") conditions.push(unreadCondition(req));

    // Batches drop out of `conditions` once dismissed, so keep taking the next batch
    let removed = 0;
    for (let batch = 0; batch < 100; batch++) {
      const rows = await Notification.findAll({
        where: { [Op.and]: conditions },
        attributes: ["id"],
        limit: 1000,
        raw: true,
      });
      if (!rows.length) break;
      const now = new Date();
      await NotificationRead.bulkCreate(
        rows.map((n) => ({ notificationId: n.id, userId: req.user.id, readAt: now, dismissedAt: now })),
        { updateOnDuplicate: ["dismissedAt"] }
      );
      removed += rows.length;
    }
    return res.status(200).json({ success: true, data: { removed, unreadCount: await countUnread(req) } });
  } catch (error) {
    console.error("[Notifications] dismissAll error:", error);
    return res.status(500).json({ success: false, message: "Failed to clear notifications." });
  }
};

/**
 * GET /api/notifications/stream — Server-Sent Events.
 * Pushes each new notification the user is allowed to see, the moment it is saved.
 * A comment line every 25s keeps proxies and the browser from closing the connection.
 */
const stream = (req, res) => {
  const userId = Number(req.user.id);
  const admin = isSuperAdmin(req);
  const permissions = new Set(req.permissions || []);

  res.status(200).set({
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no", // disable proxy buffering (nginx / LiteSpeed)
  });
  res.flushHeaders?.();
  res.write("retry: 5000\n\n");
  res.write("event: ready\ndata: {}\n\n");

  const onNotification = (row) => {
    if (row.actorUserId && Number(row.actorUserId) === userId) return; // never your own actions
    if (!admin && row.permission && !permissions.has(row.permission)) return;
    res.write(`event: notification\ndata: ${JSON.stringify(serialize(row, false))}\n\n`);
  };

  notificationBus.on("notification", onNotification);
  const heartbeat = setInterval(() => res.write(": keep-alive\n\n"), HEARTBEAT_MS);

  req.on("close", () => {
    clearInterval(heartbeat);
    notificationBus.off("notification", onNotification);
  });
};

module.exports = {
  stream,
  list,
  unreadCount,
  getById,
  markOneRead,
  markAllRead,
  dismissOne,
  restoreOne,
  dismissAll,
};
