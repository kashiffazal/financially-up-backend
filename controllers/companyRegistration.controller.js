/**
 * Company Registration Controller
 * ==============================
 * CRUD operations for Company Registration form submissions.
 */

const { CompanyRegistration } = require("../models");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { Op } = require("sequelize");

/** GET /api/company-registrations — Fetch all with pagination, status filter, search */
const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const whereClause = {};

    if (status && status !== "All") whereClause.status = status;

    // Search across company name, email, name_ABN, first name, last name
    if (search) {
      whereClause[Op.or] = [
        { companyName: { [Op.like]: `%${search}%` } },
        { proposed_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { isFirst_name: { [Op.like]: `%${search}%` } },
        { isLast_name: { [Op.like]: `%${search}%` } },
        { name_ABN: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await CompanyRegistration.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset,
      order: [["createdAt", "DESC"]],
    });

    return successResponse(res, "Company registration records fetched successfully", {
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

/** GET /api/company-registrations/:id */
const getById = async (req, res, next) => {
  try {
    const record = await CompanyRegistration.findByPk(req.params.id);
    if (!record) return errorResponse(res, "Record not found", 404);
    return successResponse(res, "Record fetched successfully", record);
  } catch (error) {
    next(error);
  }
};

/** POST /api/company-registrations */
const create = async (req, res, next) => {
  try {
    const formData = req.body;
    if (!formData.status) formData.status = "New Query";
    const record = await CompanyRegistration.create(formData);
    return successResponse(res, "Record created successfully", record, 201);
  } catch (error) {
    next(error);
  }
};

/** PUT /api/company-registrations/:id */
const update = async (req, res, next) => {
  try {
    const record = await CompanyRegistration.findByPk(req.params.id);
    if (!record) return errorResponse(res, "Record not found", 404);
    await record.update(req.body);
    return successResponse(res, "Record updated successfully", record);
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/company-registrations/:id */
const remove = async (req, res, next) => {
  try {
    const record = await CompanyRegistration.findByPk(req.params.id);
    if (!record) return errorResponse(res, "Record not found", 404);
    await record.destroy();
    return successResponse(res, "Record deleted successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, update, remove };
