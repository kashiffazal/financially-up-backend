/**
 * GST Registration Controller
 * ==============================
 * Business logic for all GST Registration CRUD operations.
 * Called by the router, interacts with the Sequelize model,
 * and returns standardized API responses.
 *
 * Endpoints handled:
 * - GET    /  → getAll (with pagination, status filter, search)
 * - GET   /:id → getById
 * - POST   /  → create (called by Old App when form is submitted)
 * - PUT   /:id → update (used by Admin Panel to edit or change status)
 * - DELETE /:id → remove
 */

const { GstRegistration } = require("../models");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const notificationService = require("../services/notification.service");
const { buildSubmission, splitName } = require("../services/formSubmission.service");

/** Public form field → table column, where the names differ */
const FIELD_ALIASES = {
  // Contact person → first / last name columns (used by tables, search & notifications)
  contactName: (value) => {
    const name = splitName(value);
    return { firstName: name.first, lastName: name.last };
  },
};
const { Op } = require("sequelize");

/**
 * GET /api/gst-registrations
 * Fetch all GST registration records with pagination, status filtering, and search.
 *
 * Query Parameters:
 * - page (default: 1) - current page number
 * - limit (default: 10) - records per page
 * - status - filter by workflow status (e.g., "New Query", "Approved")
 * - search - search across firstName, lastName, email, phone, abn
 */
const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    // Build dynamic WHERE clause based on query parameters
    const whereClause = {};

    // Filter by status if provided
    if (status && status !== "All") {
      whereClause.status = status;
    }

    // Search across multiple fields if search term provided
    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { abn: { [Op.like]: `%${search}%` } },
      ];
    }

    // Calculate offset for pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Fetch data with pagination and filters
    const { count, rows } = await GstRegistration.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset,
      order: [["createdAt", "DESC"]], // Newest first
    });

    return successResponse(
      res,
      "GST registration records fetched successfully",
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

/**
 * GET /api/gst-registrations/:id
 * Fetch a single GST registration record by its ID.
 */
const getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const record = await GstRegistration.findByPk(id);

    if (!record) {
      return errorResponse(res, "GST registration record not found", 404);
    }

    return successResponse(
      res,
      "GST registration record fetched successfully",
      record,
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/gst-registrations
 * Create a new GST registration record.
 * This endpoint is called by the Old App when a user submits the form.
 */
const create = async (req, res, next) => {
  try {
    // Map answers to columns + keep the full submission (answers without a column are never lost).
    // Public submissions always start as a new query (clients cannot set their own status).
    const { columns, submissionData } = buildSubmission(req, GstRegistration, FIELD_ALIASES);
    const formData = { ...columns, submissionData, status: "New Query" };

    // Create the record - Sequelize will only save fields that match the model
    const record = await GstRegistration.create(formData);

    // Notify staff (fire-and-forget; never blocks the client response)
    notificationService.notifySubmission("GstRegistration", record);

    return successResponse(res, "GST registration record created successfully", { ...record.toJSON(), referenceNumber: `GST-${record.id}` }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/gst-registrations/:id
 * Update an existing GST registration record.
 */
const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const record = await GstRegistration.findByPk(id);

    if (!record) {
      return errorResponse(res, "GST registration record not found", 404);
    }

    const previousStatus = record.status;

    await record.update(updateData);

    notificationService.notifyStatusChange("GstRegistration", record, previousStatus, req);

    return successResponse(
      res,
      "GST registration record updated successfully",
      record,
    );
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/gst-registrations/:id
 * Delete a GST registration record.
 */
const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const record = await GstRegistration.findByPk(id);

    if (!record) {
      return errorResponse(res, "GST registration record not found", 404);
    }

    await record.destroy();

    return successResponse(res, "GST registration record deleted successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
