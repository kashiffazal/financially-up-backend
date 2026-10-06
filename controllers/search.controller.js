/**
 * Global Search Controller
 * ========================
 * Handles the admin header search across every application module.
 */

const { successResponse, errorResponse } = require("../utils/apiResponse");
const {
  globalSearch,
  MIN_QUERY_LENGTH,
  MAX_QUERY_LENGTH,
} = require("../services/globalSearch.service");

/**
 * GET /api/search
 * Query params:
 *   q     - search term (2–100 chars): name, email, phone, ABN/ACN or reference
 *   limit - max results per module (1–10, default 5)
 */
const search = async (req, res) => {
  const q = String(req.query.q || "").trim();
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 5, 1), 10);

  if (q.length < MIN_QUERY_LENGTH) {
    return successResponse(res, `Enter at least ${MIN_QUERY_LENGTH} characters.`, {
      query: q,
      total: 0,
      groups: [],
    });
  }

  if (q.length > MAX_QUERY_LENGTH) {
    return errorResponse(res, `Search term must be ${MAX_QUERY_LENGTH} characters or fewer.`, 400);
  }

  try {
    const isSuperAdmin = (req.user?.roles || []).some((r) => r.slug === "administrator");
    const data = await globalSearch(q, {
      perModule: limit,
      permissions: req.permissions || [],
      isSuperAdmin,
    });

    return successResponse(res, "Search completed.", data);
  } catch (error) {
    console.error("[Search] globalSearch error:", error);
    return errorResponse(res, "Search is temporarily unavailable.", 500);
  }
};

module.exports = {
  search,
};
