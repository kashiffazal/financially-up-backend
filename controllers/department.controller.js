/**
 * Department Controller
 * =====================
 * Manages the staff department list (Settings > Departments). The list is the
 * "staff.departments" setting (JSON array); staff keep their department as text
 * on their user record (User.department).
 *
 * GET    /api/departments                    list + how many staff use each   (settings.view)
 * POST   /api/departments         { name }   add                              (settings.update)
 * PUT    /api/departments         { from, to } rename (staff are updated too)   (settings.update)
 * DELETE /api/departments         { name, moveTo } remove; staff in it move to
 *                                  `moveTo` (another department) or none     (settings.update)
 */

const { Op, fn, col } = require("sequelize");
const { sequelize, Setting, User } = require("../models");
const { clearSettingsCache } = require("../services/settings.service");
const auditService = require("../services/audit.service");

const KEY = "staff.departments";
const MAX_LENGTH = 100;

const clean = (value) => (typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, MAX_LENGTH) : "");
const same = (a, b) => a.toLowerCase() === b.toLowerCase();

const readList = async (transaction) => {
  const row = await Setting.findOne({ where: { key: KEY }, transaction });
  let list = [];
  try {
    list = JSON.parse(row?.value || "[]");
  } catch {
    list = [];
  }
  return { row, list: Array.isArray(list) ? list.map((d) => clean(String(d))).filter(Boolean) : [] };
};

const saveList = async (row, list, transaction) => {
  if (row) await row.update({ value: JSON.stringify(list) }, { transaction });
  else await Setting.create({ key: KEY, value: JSON.stringify(list), label: "Departments", group: "staff", inputType: "list" }, { transaction });
};

/** { "Audit & Assurance": 3, ... } — staff per department (deleted users excluded). */
const staffCounts = async (transaction) => {
  const rows = await User.findAll({
    attributes: ["department", [fn("COUNT", col("id")), "count"]],
    where: { department: { [Op.ne]: null } },
    group: ["department"],
    raw: true,
    transaction,
  });
  return rows.reduce((map, r) => ({ ...map, [r.department]: Number(r.count) }), {});
};

const audit = (req, action, description) =>
  auditService.log({
    actorUserId: req.user?.id,
    action,
    module: "settings",
    resourceType: "department",
    description,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

const sendList = async (res, message, status = 200) => {
  const { list } = await readList();
  const counts = await staffCounts();
  return res.status(status).json({
    success: true,
    ...(message ? { message } : {}),
    data: list.map((name) => ({ name, staffCount: counts[name] || 0 })),
  });
};

const fail = (res, error, fallback) => {
  console.error(`[Departments] ${fallback}:`, error);
  return res.status(500).json({ success: false, message: fallback });
};

/** GET /api/departments */
const listDepartments = async (req, res) => {
  try {
    return await sendList(res);
  } catch (error) {
    return fail(res, error, "Failed to load departments.");
  }
};

/** POST /api/departments  { name } */
const addDepartment = async (req, res) => {
  const name = clean(req.body?.name);
  if (!name) return res.status(400).json({ success: false, message: "Please enter a department name." });
  try {
    const { row, list } = await readList();
    if (list.some((d) => same(d, name))) {
      return res.status(409).json({ success: false, message: `"${name}" is already in the list.` });
    }
    await saveList(row, [...list, name]);
    clearSettingsCache();
    await audit(req, "DEPARTMENT_ADDED", `Added department "${name}"`);
    return await sendList(res, `"${name}" added.`, 201);
  } catch (error) {
    return fail(res, error, "Failed to add the department.");
  }
};

/** PUT /api/departments  { from, to } — staff in "from" move to "to" */
const renameDepartment = async (req, res) => {
  const from = clean(req.body?.from);
  const to = clean(req.body?.to);
  if (!from || !to) return res.status(400).json({ success: false, message: "Please enter the new department name." });
  try {
    let moved = 0;
    await sequelize.transaction(async (transaction) => {
      const { row, list } = await readList(transaction);
      const index = list.findIndex((d) => d === from);
      if (index === -1) throw Object.assign(new Error(`"${from}" isn't in the list.`), { status: 404 });
      if (list.some((d, i) => i !== index && same(d, to))) {
        throw Object.assign(new Error(`"${to}" is already in the list.`), { status: 409 });
      }
      list[index] = to;
      await saveList(row, list, transaction);
      [moved] = await User.update({ department: to }, { where: { department: from }, transaction });
    });
    clearSettingsCache();
    await audit(req, "DEPARTMENT_RENAMED", `Renamed department "${from}" to "${to}" (${moved} staff updated)`);
    return await sendList(res, moved ? `Renamed. ${moved} staff now show "${to}".` : "Renamed.");
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    return fail(res, error, "Failed to rename the department.");
  }
};

/** DELETE /api/departments  { name, moveTo } — moveTo: another department, or empty for none */
const removeDepartment = async (req, res) => {
  // The admin panel sends DELETE data as query parameters
  const input = { ...(req.query || {}), ...(req.body || {}) };
  const name = clean(input.name);
  const moveTo = clean(input.moveTo) || null;
  if (!name) return res.status(400).json({ success: false, message: "Missing department name." });
  try {
    let moved = 0;
    await sequelize.transaction(async (transaction) => {
      const { row, list } = await readList(transaction);
      if (!list.includes(name)) throw Object.assign(new Error(`"${name}" isn't in the list.`), { status: 404 });
      if (moveTo && (moveTo === name || !list.includes(moveTo))) {
        throw Object.assign(new Error("Choose a department from the list to move staff to."), { status: 400 });
      }
      await saveList(row, list.filter((d) => d !== name), transaction);
      [moved] = await User.update({ department: moveTo }, { where: { department: name }, transaction });
    });
    clearSettingsCache();
    await audit(
      req,
      "DEPARTMENT_REMOVED",
      `Removed department "${name}"${moved ? ` (${moved} staff moved to ${moveTo ? `"${moveTo}"` : "no department"})` : ""}`
    );
    return await sendList(res, moved ? `Removed. ${moved} staff moved to ${moveTo || "no department"}.` : "Removed.");
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    return fail(res, error, "Failed to remove the department.");
  }
};

module.exports = { listDepartments, addDepartment, renameDepartment, removeDepartment };
