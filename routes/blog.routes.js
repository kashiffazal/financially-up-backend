/**
 * Public Blog Routes (website)
 * ============================
 * Base path: /api/blog — read-only, live (published) posts only.
 *
 * GET /hub           → posts + categories + tags for the /blog page
 * GET /posts/:slug   → one article + recent articles
 * GET /slugs         → published slugs
 */

const express = require("express");
const router = express.Router();
const controller = require("../controllers/blog.controller");

router.get("/hub", controller.hub);
router.get("/posts/:slug", controller.getBySlug);
router.get("/slugs", controller.slugs);

module.exports = router;
