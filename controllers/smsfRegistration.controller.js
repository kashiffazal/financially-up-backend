/**
 * SMSF Registration Controller
 * ==============================
 * CRUD operations for SMSF Registration form submissions.
 */

const { SmsfRegistration } = require("../models");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const notificationService = require("../services/notification.service");
const { buildSubmission } = require("../services/formSubmission.service");

/** Public form field → table column, where the names differ */
const FIELD_ALIASES = { m1Phone: "mobileNumber", trusteeCompanyName: "CompanyName", trusteeCompanyAcn: "ACN" };
const { Op } = require("sequelize");

/** GET /api/smsf-registrations - Fetch all with pagination, status filter, search */
const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const whereClause = {};

    if (status && status !== "All") whereClause.status = status;

    // Search across SMSF Name, Individual Name, Company Name, Client Name, mobile
    if (search) {
      whereClause[Op.or] = [
        { NameOfSMSF: { [Op.like]: `%${search}%` } },
        { NameOfIndividual: { [Op.like]: `%${search}%` } },
        { CompanyName: { [Op.like]: `%${search}%` } },
        { NameClient: { [Op.like]: `%${search}%` } },
        { mobileNumber: { [Op.like]: `%${search}%` } },
        { ACN: { [Op.like]: `%${search}%` } },
        { Companyabn: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await SmsfRegistration.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset,
      order: [["createdAt", "DESC"]],
    });

    return successResponse(
      res,
      "SMSF registration records fetched successfully",
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

/** GET /api/smsf-registrations/:id */
const getById = async (req, res, next) => {
  try {
    const record = await SmsfRegistration.findByPk(req.params.id);
    if (!record) return errorResponse(res, "Record not found", 404);
    return successResponse(res, "Record fetched successfully", record);
  } catch (error) {
    next(error);
  }
};

/** POST /api/smsf-registrations */
const create = async (req, res, next) => {
  try {
    // Map answers to columns + keep the full submission (answers without a column are never lost).
    // Public submissions always start as a new query (clients cannot set their own status).
    const { columns, submissionData } = buildSubmission(req, SmsfRegistration, FIELD_ALIASES);
    const formData = { ...columns, submissionData, status: "New Query" };
    const record = await SmsfRegistration.create(formData);

    // Notify staff (fire-and-forget; never blocks the client response)
    notificationService.notifySubmission("SmsfRegistration", record);
    return successResponse(res, "Record created successfully", { ...record.toJSON(), referenceNumber: `SMSF-${record.id}` }, 201);
  } catch (error) {
    next(error);
  }
};

/** PUT /api/smsf-registrations/:id */
const update = async (req, res, next) => {
  try {
    const record = await SmsfRegistration.findByPk(req.params.id);
    if (!record) return errorResponse(res, "Record not found", 404);
    const previousStatus = record.status;
    await record.update(req.body);
    notificationService.notifyStatusChange("SmsfRegistration", record, previousStatus, req);
    return successResponse(res, "Record updated successfully", record);
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/smsf-registrations/:id */
const remove = async (req, res, next) => {
  try {
    const record = await SmsfRegistration.findByPk(req.params.id);
    if (!record) return errorResponse(res, "Record not found", 404);
    await record.destroy();
    return successResponse(res, "Record deleted successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, update, remove };
