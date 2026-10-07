/**
 * Trust Registration Controller
 * ==============================
 * CRUD operations for Trust Registration form submissions.
 */

const { TrustRegistration } = require("../models");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const notificationService = require("../services/notification.service");
const { buildSubmission, splitName } = require("../services/formSubmission.service");

/** Public form field → table column, where the names differ */
const FIELD_ALIASES = {
  trusteeName: (value) => {
    const name = splitName(value);
    return { fname: name.first, lname: name.last };
  },
  appointerName: (value) => {
    const name = splitName(value);
    return { fname1: name.first, lname1: name.last };
  },
};
const { Op } = require("sequelize");

/** GET /api/trust-registrations - Fetch all with pagination, status filter, search */
const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const whereClause = {};

    if (status && status !== "All") whereClause.status = status;

    // Search across trust name, trustee names, appointer names
    if (search) {
      whereClause[Op.or] = [
        { TrustName: { [Op.like]: `%${search}%` } },
        { fname: { [Op.like]: `%${search}%` } },
        { lname: { [Op.like]: `%${search}%` } },
        { fname1: { [Op.like]: `%${search}%` } },
        { lname1: { [Op.like]: `%${search}%` } },
        { TypeOfTrust: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await TrustRegistration.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset,
      order: [["createdAt", "DESC"]],
    });

    return successResponse(
      res,
      "Trust registration records fetched successfully",
      {
        records: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit)),
        },
      },
    );
  } catch (error) {
    next(error);
  }
};

/** GET /api/trust-registrations/:id */
const getById = async (req, res, next) => {
  try {
    const record = await TrustRegistration.findByPk(req.params.id);
    if (!record) return errorResponse(res, "Record not found", 404);
    return successResponse(res, "Record fetched successfully", record);
  } catch (error) {
    next(error);
  }
};

/** POST /api/trust-registrations */
const create = async (req, res, next) => {
  try {
    // Map answers to columns + keep the full submission (answers without a column are never lost).
    // Public submissions always start as a new query (clients cannot set their own status).
    const { columns, submissionData } = buildSubmission(req, TrustRegistration, FIELD_ALIASES);
    const formData = { ...columns, submissionData, status: "New Query" };
    const record = await TrustRegistration.create(formData);

    // Notify staff (fire-and-forget; never blocks the client response)
    notificationService.notifySubmission("TrustRegistration", record);
    return successResponse(res, "Trust registration record created successfully", { ...record.toJSON(), referenceNumber: `TRU-${record.id}` }, 201);
  } catch (error) {
    next(error);
  }
};

/** PUT /api/trust-registrations/:id */
const update = async (req, res, next) => {
  try {
    const record = await TrustRegistration.findByPk(req.params.id);
    if (!record) return errorResponse(res, "Record not found", 404);
    const previousStatus = record.status;
    await record.update(req.body);
    notificationService.notifyStatusChange("TrustRegistration", record, previousStatus, req);
    return successResponse(res, "Record updated successfully", record);
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/trust-registrations/:id */
const remove = async (req, res, next) => {
  try {
    const record = await TrustRegistration.findByPk(req.params.id);
    if (!record) return errorResponse(res, "Record not found", 404);
    await record.destroy();
    return successResponse(res, "Record deleted successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, update, remove };
