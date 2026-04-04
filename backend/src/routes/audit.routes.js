const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth.middleware");
const { getAuditLogs, getAuditActions, getAuditEntityTypes } = require("../controllers/audit.controller");

// All audit routes require authentication (admin/super_admin checked via frontend route guards)
router.use(authenticateToken);

router.get("/", getAuditLogs);
router.get("/actions", getAuditActions);
router.get("/entity-types", getAuditEntityTypes);

module.exports = router;
