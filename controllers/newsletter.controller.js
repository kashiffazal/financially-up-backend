/**
 * Newsletter Controller
 * =====================
 * Public:  POST /api/newsletter-subscribers          (website newsletter forms)
 * Staff:   GET /  ·  GET /:id  ·  PUT /:id                          (/admin/newsletter)
 *
 * Records are never deleted — staff mark people Unsubscribed instead.
 */

const { Op } = require("sequelize");
const { NewsletterSubscriber } = require("../models");
const notificationService = require("../services/notification.service");
const auditService = require("../services/audit.service");

const STATUSES = ["Subscribed", "Unsubscribed"];
const SOURCES = ["blog_listing", "blog_article"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Anti-spam (same approach as the contact form): a hidden field browsers never
// autofill, and a minimum time between showing the form and submitting it.
const HONEYPOT_FIELD = "fu_newsletter_trap";
const MIN_HUMAN_FILL_MS = 1500;

/** "+10:00" or "+11:00" (daylight saving) — Sydney's UTC offset on a YYYY-MM-DD day. */
const sydneyOffset = (dateStr) => {
  const name = new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Sydney", timeZoneName: "longOffset" })
    .formatToParts(new Date(`${dateStr}T12:00:00Z`))
    .find((p) => p.type === "timeZoneName")?.value;
  return /^GMT[+-]\d{2}:\d{2}$/.test(name || "") ? name.slice(3) : "+10:00";
};

const clean = (value, max) => (typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, max) : "");

const audit = (req, action, subscriber, description) =>
  auditService.log({
    actorUserId: req.user?.id,
    action,
    module: "newsletter",
    resourceType: "newsletter_subscriber",
    resourceId: subscriber.id,
    description,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

/** Staff view of a subscriber (no IP / browser details). */
const safe = (record) => {
  const { ipAddress, userAgent, ...rest } = record.get ? record.get({ plain: true }) : record;
  return rest;
};

/**
 * POST /api/newsletter-subscribers (public)  { name, email, source, sourcePage, formElapsedMs, fu_newsletter_trap }
 */
const subscribe = async (req, res) => {
  try {
    const body = req.body || {};
    const name = clean(body.name, 120);
    const email = clean(body.email, 190).toLowerCase();
    if (!name) {
      return res.status(400).json({ success: false, message: "Please enter your name." });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address." });
    }

    // Suspected bots get the normal success reply, but nothing is saved
    // (browser autofill may copy the email or name into the hidden field, so those are allowed)
    const trap = clean(body[HONEYPOT_FIELD], 200).toLowerCase();
    const elapsedMs = Number(body.formElapsedMs);
    const isBot =
      (trap && trap !== email && trap !== name.toLowerCase()) ||
      (Number.isFinite(elapsedMs) && elapsedMs >= 0 && elapsedMs < MIN_HUMAN_FILL_MS);
    if (isBot) {
      console.warn(`[Newsletter] Ignored a suspected bot sign-up for ${email}`);
      return res.status(201).json({ success: true, message: "Thanks for subscribing! Check your inbox soon." });
    }

    const details = {
      name,
      source: SOURCES.includes(body.source) ? body.source : "blog_listing",
      sourcePage: clean(body.sourcePage, 255) || null,
      ipAddress: req.ip || null,
      userAgent: clean(req.get("user-agent"), 255) || null,
    };

    const existing = await NewsletterSubscriber.findOne({ where: { email } });
    if (existing?.status === "Subscribed") {
      // Older sign-ups had no name: keep the one given now
      if (!existing.name) await existing.update({ name });
      return res.status(200).json({ success: true, alreadySubscribed: true, message: "You're already subscribed — thank you!" });
    }

    let subscriber;
    if (existing) {
      // Came back after unsubscribing
      subscriber = await existing.update({
        ...details,
        status: "Subscribed",
        subscribedAt: new Date(),
        unsubscribedAt: null,
        updatedByUserId: null,
        updatedByName: null,
      });
    } else {
      try {
        subscriber = await NewsletterSubscriber.create({ ...details, email, status: "Subscribed", subscribedAt: new Date() });
      } catch (error) {
        // Same email submitted twice at the same moment
        if (error.name !== "SequelizeUniqueConstraintError") throw error;
        return res.status(200).json({ success: true, alreadySubscribed: true, message: "You're already subscribed — thank you!" });
      }
    }

    notificationService.notifyNewsletterSubscriber(subscriber, Boolean(existing));

    return res.status(201).json({ success: true, message: "Thanks for subscribing! Check your inbox soon." });
  } catch (error) {
    console.error("[Newsletter] subscribe error:", error);
    return res.status(500).json({ success: false, message: "We couldn't subscribe you right now. Please try again shortly." });
  }
};

/**
 * GET /api/newsletter-subscribers (staff)
 * Query: status (Subscribed|Unsubscribed), search (name or email), from / to (YYYY-MM-DD, by sign-up date)
 * Returns every match (the admin table paginates and exports the same list) + status counts.
 */
const list = async (req, res) => {
  try {
    const { status, search, from, to } = req.query;
    const where = {};
    if (STATUSES.includes(status)) where.status = status;
    // Exports leave out trashed subscribers (the admin list loads them for its Trash tab)
    // (under Op.and, so the name / email search below can't replace it)
    else if (req.query.excludeTrash) where[Op.and] = [require("../services/trash.service").notTrashed];
    const q = clean(search, 190);
    if (q) {
      const like = { [Op.like]: `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%` };
      where[Op.or] = [{ email: like }, { name: like }];
    }

    // Dates are whole calendar days in Sydney time (daylight saving aware)
    const day = (value) => (/^\d{4}-\d{2}-\d{2}$/.test(String(value || "")) ? value : null);
    const range = {};
    if (day(from)) range[Op.gte] = new Date(`${from}T00:00:00${sydneyOffset(from)}`);
    if (day(to)) range[Op.lte] = new Date(`${to}T23:59:59.999${sydneyOffset(to)}`);
    if (Object.getOwnPropertySymbols(range).length) where.subscribedAt = range;

    const [rows, subscribed, unsubscribed] = await Promise.all([
      NewsletterSubscriber.findAll({
        where,
        attributes: { exclude: ["ipAddress", "userAgent"] },
        order: [["subscribedAt", "DESC"], ["id", "DESC"]],
        limit: 50000,
      }),
      NewsletterSubscriber.count({ where: { status: "Subscribed" } }),
      NewsletterSubscriber.count({ where: { status: "Unsubscribed" } }),
    ]);

    return res.status(200).json({
      success: true,
      data: rows,
      counts: { all: subscribed + unsubscribed, Subscribed: subscribed, Unsubscribed: unsubscribed },
    });
  } catch (error) {
    console.error("[Newsletter] list error:", error);
    return res.status(500).json({ success: false, message: "Failed to load newsletter subscribers." });
  }
};

/**
 * GET /api/newsletter-subscribers/:id (staff) — one subscriber (live list updates)
 */
const getById = async (req, res) => {
  try {
    const subscriber = await NewsletterSubscriber.findByPk(req.params.id, { attributes: { exclude: ["ipAddress", "userAgent"] } });
    if (!subscriber) return res.status(404).json({ success: false, message: "Subscriber not found." });
    return res.status(200).json({ success: true, data: subscriber });
  } catch (error) {
    console.error("[Newsletter] getById error:", error);
    return res.status(500).json({ success: false, message: "Failed to load subscriber." });
  }
};

/**
 * PUT /api/newsletter-subscribers/:id (staff)  { status: "Subscribed" | "Unsubscribed" }
 */
const update = async (req, res) => {
  try {
    const subscriber = await NewsletterSubscriber.findByPk(req.params.id);
    if (!subscriber) return res.status(404).json({ success: false, message: "Subscriber not found." });

    const status = req.body?.status;
    if (!STATUSES.includes(status)) return res.status(400).json({ success: false, message: "Invalid status." });
    if (status === subscriber.status) {
      return res.status(200).json({ success: true, message: `Already ${status.toLowerCase()}.`, data: safe(subscriber) });
    }

    await subscriber.update({
      status,
      ...(status === "Unsubscribed" ? { unsubscribedAt: new Date() } : { subscribedAt: new Date(), unsubscribedAt: null }),
      updatedByUserId: req.user?.id || null,
      updatedByName: req.user?.fullName || req.user?.email || null,
    });
    await audit(
      req,
      status === "Unsubscribed" ? "UNSUBSCRIBE" : "RESUBSCRIBE",
      subscriber,
      `${status === "Unsubscribed" ? "Unsubscribed" : "Re-subscribed"} ${subscriber.email} from the newsletter`
    );

    return res.status(200).json({
      success: true,
      message: status === "Unsubscribed" ? "Subscriber unsubscribed." : "Subscriber re-subscribed.",
      data: safe(subscriber),
    });
  } catch (error) {
    console.error("[Newsletter] update error:", error);
    return res.status(500).json({ success: false, message: "Failed to update subscriber." });
  }
};

module.exports = { subscribe, list, getById, update, STATUSES };
