/**
 * Medicare Controller
 * ==============================
 * CRUD operations for Medicare form submissions.
 */

const { Medicare } = require("../models");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { Op } = require("sequelize");

/** GET /api/medicare — Fetch all with pagination, status filter, search */
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
    const formData = req.body;
    if (!formData.status) formData.status = "New Query";
    const record = await Medicare.create(formData);
    return successResponse(res, "Medicare record created successfully", record, 201);
  } catch (error) {
    next(error);
  }
};

/** PUT /api/medicare/:id */
const update = async (req, res, next) => {
  try {
    const record = await Medicare.findByPk(req.params.id);
    if (!record) return errorResponse(res, "Record not found", 404);
    await record.update(req.body);
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
