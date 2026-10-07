/**
 * Medicare Controller
 * ==============================
 * CRUD operations for Medicare form submissions.
 */

const { Medicare } = require("../models");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const notificationService = require("../services/notification.service");
const { buildSubmission } = require("../services/formSubmission.service");

/** Public form field → table column, where the names differ */
const FIELD_ALIASES = { lastName: "familyName", phoneNumber: "phone" };
const { Op } = require("sequelize");

/** GET /api/medicare - Fetch all with pagination, status filter, search */
const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const whereClause = {};

    if (status && status !== "All") whereClause.status = status;

    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { familyName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { medicareNumber: { [Op.like]: `%${search}%` } },
        { FullName: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Medicare.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset,
      order: [["createdAt", "DESC"]],
    });

    return successResponse(res, "Medicare records fetched successfully", {
      records: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/** GET /api/medicare/:id */
const getById = async (req, res, next) => {
  try {
    const record = await Medicare.findByPk(req.params.id);
    if (!record) return errorResponse(res, "Record not found", 404);
    return successResponse(res, "Record fetched successfully", record);
  } catch (error) {
    next(error);
  }
};

/** POST /api/medicare */
const create = async (req, res, next) => {
  try {
    // Map answers to columns + keep the full submission (answers without a column are never lost).
    // Public submissions always start as a new query (clients cannot set their own status).
    const { columns, submissionData } = buildSubmission(req, Medicare, FIELD_ALIASES);
    const formData = { ...columns, submissionData, status: "New Query" };
    const record = await Medicare.create(formData);

    // Notify staff (fire-and-forget; never blocks the client response)
    notificationService.notifySubmission("Medicare", record);
    return successResponse(res, "Medicare record created successfully", { ...record.toJSON(), referenceNumber: `MED-${record.id}` }, 201);
  } catch (error) {
    next(error);
  }
};

/** PUT /api/medicare/:id */
const update = async (req, res, next) => {
  try {
    const record = await Medicare.findByPk(req.params.id);
    if (!record) return errorResponse(res, "Record not found", 404);
    const previousStatus = record.status;
    await record.update(req.body);
    notificationService.notifyStatusChange("Medicare", record, previousStatus, req);
    return successResponse(res, "Record updated successfully", record);
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/medicare/:id */
const remove = async (req, res, next) => {
  try {
    const record = await Medicare.findByPk(req.params.id);
    if (!record) return errorResponse(res, "Record not found", 404);
    await record.destroy();
    return successResponse(res, "Record deleted successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, update, remove };
