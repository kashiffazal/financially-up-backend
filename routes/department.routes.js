/**
 * Department Routes
 * =================
 * Base path: /api/departments (Settings > Departments)
 *
 * GET    /   list + staff count per department   (settings.view)
 * POST   /   add            { name }             (settings.update)
 * PUT    /   rename         { from, to }         (settings.update)
 * DELETE /   remove         { name, moveTo }     (settings.update)
 */

const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authenticate");
const { authorize } = require("../middleware/authorize");
const controller = require("../controllers/department.controller");

router.get("/", authenticate, authorize("settings.view"), controller.listDepartments);
router.post("/", authenticate, authorize("settings.update"), controller.addDepartment);
router.put("/", authenticate, authorize("settings.update"), controller.renameDepartment);
router.delete("/", authenticate, authorize("settings.update"), controller.removeDepartment);

module.exports = router;
