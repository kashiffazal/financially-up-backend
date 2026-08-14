/**
 * Entity Engagement Controller
 * ==============================
 * CRUD operations for Entity Engagement form submissions.
 */

const { EntityEngagement } = require("../models");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { Op } = require("sequelize");

/** GET /api/entity-engagements - Fetch all with pagination, status filter, search */
const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const whereClause = {};

    if (status && status !== "All") whereClause.status = status;

    // Search across entity name, legal name, email, phone, ABN, TFN
    if (search) {
      whereClause[Op.or] = [
        { LegalName: { [Op.like]: `%${search}%` } },
        { TradingName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { PhoneNumber: { [Op.like]: `%${search}%` } },
        { ABN: { [Op.like]: `%${search}%` } },
        { TFN: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await EntityEngagement.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset,
      order: [["createdAt", "DESC"]],
    });

    return successResponse(
      res,
      "Entity engagement records fetched successfully",
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

/** GET /api/entity-engagements/:id */
const getById = async (req, res, next) => {
  try {
    const record = await EntityEngagement.findByPk(req.params.id);
    if (!record) return errorResponse(res, "Record not found", 404);
    return successResponse(res, "Record fetched successfully", record);
  } catch (error) {
    next(error);
  }
};

/** POST /api/entity-engagements */
const create = async (req, res, next) => {
  try {
    const formData = req.body;
    if (!formData.status) formData.status = "New Query";
    const record = await EntityEngagement.create(formData);
    return successResponse(
      res,
      "Entity engagement record created successfully",
      record,
      201,
    );
  } catch (error) {
    next(error);
  }
};

/** PUT /api/entity-engagements/:id */
const update = async (req, res, next) => {
  try {
    const record = await EntityEngagement.findByPk(req.params.id);
    if (!record) return errorResponse(res, "Record not found", 404);
    await record.update(req.body);
    return successResponse(res, "Record updated successfully", record);
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/entity-engagements/:id */
const remove = async (req, res, next) => {
  try {
    const record = await EntityEngagement.findByPk(req.params.id);
    if (!record) return errorResponse(res, "Record not found", 404);
    await record.destroy();
    return successResponse(res, "Record deleted successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, update, remove };
