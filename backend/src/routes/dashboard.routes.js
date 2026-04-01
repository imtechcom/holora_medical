const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboard.controller");
const { authenticateToken } = require("../middleware/auth.middleware");
const { authorizeRole } = require("../middleware/role.middleware");

const allowed = authorizeRole("super_admin", "admin", "doctor", "clinic_owner");

router.get("/stats",     authenticateToken, allowed, dashboardController.getDashboardStats);
router.get("/analytics", authenticateToken, allowed, dashboardController.getAnalytics);

module.exports = router;
