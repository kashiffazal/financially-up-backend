/**
 * Changes To Company Details Controller
 * ==============================
 * CRUD operations for Changes to Company Details form submissions.
 */

const { ChangesToCompanyDetails } = require("../models");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { Op } = require("sequelize");

/** GET /api/changes-to-company-details — Fetch all with pagination, status filter, search */
const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const whereClause = {};

    if (status && status !== "All") whereClause.status = status;

    // Search across company name, contact names, email, ACN/ABN
    if (search) {
      whereClause[Op.or] = [
        { NameOfCompany: { [Op.like]: `%${search}%` } },
        { fname: { [Op.like]: `%${search}%` } },
        { lname: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { ACNorABN: { [Op.like]: `%${search}%` } },
        { YourName: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await ChangesToCompanyDetails.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset,
      order: [["createdAt", "DESC"]],
    });

    return successResponse(res, "Changes to company details records fetched successfully", {
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

/** GET /api/changes-to-company-details/:id */
const getById = async (req, res, next) => {
  try {
    const record = await ChangesToCompanyDetails.findByPk(req.params.id);
    if (!record) return errorResponse(res, "Record not found", 404);
    return successResponse(res, "Record fetched successfully", record);
  } catch (error) {
    next(error);
  }
};

/** POST /api/changes-to-company-details */
const create = async (req, res, next) => {
  try {
    const formData = req.body;
    if (!formData.status) formData.status = "New Query";
    const record = await ChangesToCompanyDetails.create(formData);
    return successResponse(res, "Record created successfully", record, 201);
  } catch (error) {
    next(error);
  }
};

/** PUT /api/changes-to-company-details/:id */
const update = async (req, res, next) => {
  try {
    const record = await ChangesToCompanyDetails.findByPk(req.params.id);
    if (!record) return errorResponse(res, "Record not found", 404);
    await record.update(req.body);
    return successResponse(res, "Record updated successfully", record);
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/changes-to-company-details/:id */
const remove = async (req, res, next) => {
  try {
    const record = await ChangesToCompanyDetails.findByPk(req.params.id);
    if (!record) return errorResponse(res, "Record not found", 404);
    await record.destroy();
    return successResponse(res, "Record deleted successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, update, remove };
