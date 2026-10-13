/**
 * Trash Service
 * =============
 * "Move to Trash" / "Restore" for every application log and the newsletter
 * (not enquiries). Trash is a status ("Trash"): the record is never deleted,
 * no email / PDF / review decision is triggered, and the status it had before is
 * kept in record_trash so Restore puts it back exactly there.
 *
 * Trashed records are left out of the "All" tab, the dashboard and Global Search.
 */

const { Op } = require("sequelize");
const auditService = require("./audit.service");

const TRASH = "Trash";

/** module key -> model + the status a record gets back if its previous one is unknown */
const TRASH_MODULES = {
  "new-individual": { model: "NewIndividualEngagement", defaultStatus: "Pending Review" },
  "new-company": { model: "NewCompanyRegistration", defaultStatus: "Submitted" },
  "legacy-company": { model: "CompanyRegistration", defaultStatus: "New Query" },
  "legacy-individual": { model: "IndividualEngagement", defaultStatus: "New Query" },
  "entity-engagements": { model: "EntityEngagement", defaultStatus: "New Query" },
  "changes-company": { model: "ChangesToCompanyDetails", defaultStatus: "New Query" },
  gst: { model: "GstRegistration", defaultStatus: "New Query" },
  medicare: { model: "Medicare", defaultStatus: "New Query" },
  trust: { model: "TrustRegistration", defaultStatus: "New Query" },
  smsf: { model: "SmsfRegistration", defaultStatus: "New Query" },
  "business-names": { model: "BusinessNameRegistration", defaultStatus: "New Query" },
  "apply-tfn": { model: "ApplyTfnAbns", defaultStatus: "New Query" },
  newsletter: { model: "NewsletterSubscriber", defaultStatus: "Subscribed" },
};

/** Sequelize `where` part that hides trashed records (dashboard counts, search, lists). */
const notTrashed = { [Op.or]: [{ status: { [Op.ne]: TRASH } }, { status: null }] };

const QUERY_METHODS = new Set(["count", "findAll", "findOne", "findAndCountAll", "sum", "max", "min"]);

/**
 * The same model, but every count / find leaves out trashed records. Used by
 * the dashboard and Global Search so they never need their own "not Trash" filters.
 */
const withoutTrash = (Model) => {
  if (!Model?.rawAttributes?.status) return Model;
  return new Proxy(Model, {
    get(target, prop) {
      const value = target[prop];
      if (typeof prop === "string" && QUERY_METHODS.has(prop) && typeof value === "function") {
        return (options = {}, ...rest) => {
          // count(field) / sum(field, options) style calls: options come second
          if (typeof options === "string") {
            const [opts = {}, ...others] = rest;
            return value.call(target, options, { ...opts, where: opts.where ? { [Op.and]: [opts.where, notTrashed] } : notTrashed }, ...others);
          }
          return value.call(target, { ...options, where: options.where ? { [Op.and]: [options.where, notTrashed] } : notTrashed }, ...rest);
        };
      }
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
};

const actorOf = (req) => {
  const user = req?.user || {};
  return {
    id: user.id || null,
    name: user.fullName || [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || null,
  };
};

const cleanIds = (ids) => [...new Set((Array.isArray(ids) ? ids : [ids]).map(Number).filter((n) => Number.isInteger(n) && n > 0))];

/**
 * Move records to Trash.
 * @returns {{ done: number[], skipped: number[] }} skipped = not found or already in Trash
 */
const moveToTrash = async (moduleKey, ids, req) => {
  const models = require("../models");
  const Model = models[TRASH_MODULES[moduleKey].model];
  const actor = actorOf(req);
  const done = [];
  const skipped = [];

  for (const id of cleanIds(ids)) {
    const record = await Model.findByPk(id);
    if (!record || record.status === TRASH) {
      skipped.push(id);
      continue;
    }
    const previousStatus = record.status || null;
    await models.sequelize.transaction(async (transaction) => {
      await models.RecordTrash.destroy({ where: { moduleKey, recordId: id }, transaction });
      await models.RecordTrash.create(
        { moduleKey, recordId: id, previousStatus, trashedByUserId: actor.id, trashedByName: actor.name, trashedAt: new Date() },
        { transaction }
      );
      await record.update({ status: TRASH }, { transaction });
    });
    done.push(id);
    await auditService.log({
      actorUserId: actor.id,
      action: "MOVE_TO_TRASH",
      module: moduleKey,
      resourceType: TRASH_MODULES[moduleKey].model,
      resourceId: String(id),
      description: `Moved to Trash (was "${previousStatus || "-"}")`,
      beforeData: { status: previousStatus },
      afterData: { status: TRASH },
      ipAddress: req?.ip,
      userAgent: req?.headers?.["user-agent"],
    });
  }
  return { done, skipped };
};

/**
 * Restore records from Trash to the status they had before.
 * @returns {{ done: {id:number,status:string}[], skipped: number[] }}
 */
const restoreFromTrash = async (moduleKey, ids, req) => {
  const models = require("../models");
  const config = TRASH_MODULES[moduleKey];
  const Model = models[config.model];
  const actor = actorOf(req);
  const done = [];
  const skipped = [];

  for (const id of cleanIds(ids)) {
    const record = await Model.findByPk(id);
    if (!record || record.status !== TRASH) {
      skipped.push(id);
      continue;
    }
    const saved = await models.RecordTrash.findOne({ where: { moduleKey, recordId: id } });
    // The previous status must still be one the record accepts (ENUM columns)
    const allowed = Model.rawAttributes.status?.values;
    let status = saved?.previousStatus || config.defaultStatus;
    if (allowed && !allowed.includes(status)) status = config.defaultStatus;

    await models.sequelize.transaction(async (transaction) => {
      await record.update({ status }, { transaction });
      await models.RecordTrash.destroy({ where: { moduleKey, recordId: id }, transaction });
    });
    done.push({ id, status });
    await auditService.log({
      actorUserId: actor.id,
      action: "RESTORE_FROM_TRASH",
      module: moduleKey,
      resourceType: config.model,
      resourceId: String(id),
      description: `Restored from Trash to "${status}"`,
      beforeData: { status: TRASH },
      afterData: { status },
      ipAddress: req?.ip,
      userAgent: req?.headers?.["user-agent"],
    });
  }
  return { done, skipped };
};

/** A copy of the models object where every Trash-enabled model hides trashed records. */
const hideTrashed = (models) => {
  const copy = { ...models };
  Object.values(TRASH_MODULES).forEach(({ model }) => {
    if (copy[model]) copy[model] = withoutTrash(copy[model]);
  });
  return copy;
};

module.exports = { TRASH, TRASH_MODULES, notTrashed, withoutTrash, hideTrashed, moveToTrash, restoreFromTrash };
