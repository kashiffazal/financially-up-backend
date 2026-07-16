/**
 * Business Name Registration Controller
 * ==============================
 * Business logic for all Business Name Registration CRUD operations.
 *
 * Endpoints handled:
 * - GET    /  → getAll (with pagination, status filter, search)
 * - GET   /:id → getById
 * - POST   /  → create (called by Old App when form is submitted)
 * - PUT   /:id → update (used by Admin Panel to edit or change status)
 * - DELETE /:id → remove
 */

const { BusinessNameRegistration } = require("../models");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { Op } = require("sequelize");

/**
 * GET /api/business-name-registrations
 * Fetch all records with pagination, status filtering, and search.
 */
const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    // Build dynamic WHERE clause
    const whereClause = {};

    if (status && status !== "All") {
      whereClause.status = status;
    }

    // Search across Name, email, PhoneNumber, ABN, businessProposeName
    if (search) {
      whereClause[Op.or] = [
        { Name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { PhoneNumber: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { ABN: { [Op.like]: `%${search}%` } },
        { businessProposeName: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await BusinessNameRegistration.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset,
      order: [["createdAt", "DESC"]],
    });

    return successResponse(res, "Business name registration records fetched successfully", {
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

/**
 * GET /api/business-name-registrations/:id
 */
const getById = async (req, res, next) => {
  try {
    const record = await BusinessNameRegistration.findByPk(req.params.id);
    if (!record) return errorResponse(res, "Record not found", 404);
    return successResponse(res, "Record fetched successfully", record);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/business-name-registrations
 */
const create = async (req, res, next) => {
  try {
    const formData = req.body;
    if (!formData.status) formData.status = "New Query";
    const record = await BusinessNameRegistration.create(formData);
    return successResponse(res, "Record created successfully", record, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/business-name-registrations/:id
 */
const update = async (req, res, next) => {
  try {
    const record = await BusinessNameRegistration.findByPk(req.params.id);
    if (!record) return errorResponse(res, "Record not found", 404);
    await record.update(req.body);
    return successResponse(res, "Record updated successfully", record);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/business-name-registrations/:id
 */
const remove = async (req, res, next) => {
  try {
    const record = await BusinessNameRegistration.findByPk(req.params.id);
    if (!record) return errorResponse(res, "Record not found", 404);
    await record.destroy();
    return successResponse(res, "Record deleted successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, update, remove };
