/**
 * Individual Engagement Controller
 * ==================================
 * Business logic for all Individual Engagement CRUD operations.
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

const { IndividualEngagement } = require("../models");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { Op } = require("sequelize");

/**
 * GET /api/individual-engagement
 * Fetch all individual engagements with pagination, status filtering, and search.
 *
 * Query Parameters:
 * - page (default: 1) — current page number
 * - limit (default: 10) — records per page
 * - status — filter by workflow status (e.g., "New Query", "Approved")
 * - search — search across FirstName, LastName, email, PhoneNumber
 */
const getAll = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
    } = req.query;

    // Build dynamic WHERE clause based on query parameters
    const whereClause = {};

    // Filter by status if provided
    if (status && status !== "All") {
      whereClause.status = status;
    }

    // Search across multiple fields if search term provided
    if (search) {
      whereClause[Op.or] = [
        { FirstName: { [Op.like]: `%${search}%` } },
        { LastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { PhoneNumber: { [Op.like]: `%${search}%` } },
        { Occupation: { [Op.like]: `%${search}%` } },
      ];
    }

    // Calculate offset for pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Fetch data with pagination and filters
    const { count, rows } = await IndividualEngagement.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset,
      order: [["createdAt", "DESC"]], // Newest first
    });

    return successResponse(res, "Individual engagements fetched successfully", {
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
 * GET /api/individual-engagement/:id
 * Fetch a single individual engagement by its ID.
 */
const getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const engagement = await IndividualEngagement.findByPk(id);

    if (!engagement) {
      return errorResponse(res, "Individual engagement not found", 404);
    }

    return successResponse(res, "Individual engagement fetched successfully", engagement);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/individual-engagement
 * Create a new individual engagement record.
 * This endpoint is called by the Old App when a user submits the form.
 * The request body should match the form field names exactly.
 */
const create = async (req, res, next) => {
  try {
    const formData = req.body;

    // Set default status if not provided
    if (!formData.status) {
      formData.status = "New Query";
    }

    // Create the record — Sequelize will only save fields that match the model
    const engagement = await IndividualEngagement.create(formData);

    return successResponse(
      res,
      "Individual engagement created successfully",
      engagement,
      201 // 201 Created
    );
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/individual-engagement/:id
 * Update an existing individual engagement record.
 * Used by the Admin Panel for:
 * - Changing status (e.g., "New Query" → "Approved")
 * - Editing form fields
 */
const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if record exists
    const engagement = await IndividualEngagement.findByPk(id);

    if (!engagement) {
      return errorResponse(res, "Individual engagement not found", 404);
    }

    // Update the record with new data
    await engagement.update(updateData);

    return successResponse(res, "Individual engagement updated successfully", engagement);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/individual-engagement/:id
 * Delete an individual engagement record.
 * Currently performs a hard delete. Can be changed to soft delete later
 * by adding a 'deletedAt' column and using Sequelize's paranoid mode.
 */
const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if record exists
    const engagement = await IndividualEngagement.findByPk(id);

    if (!engagement) {
      return errorResponse(res, "Individual engagement not found", 404);
    }

    // Delete the record
    await engagement.destroy();

    return successResponse(res, "Individual engagement deleted successfully");
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
