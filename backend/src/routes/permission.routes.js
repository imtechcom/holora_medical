const express = require("express");
const {
  getAllPermissions,
  getPermissionById,
  createPermission,
  updatePermission,
  deletePermission,
  getModules,
} = require("../controllers/permission.controller");

const router = express.Router();

// Get all permissions
router.get("/", getAllPermissions);

// Get modules
router.get("/modules/list", getModules);

// Get permission by ID
router.get("/:id", getPermissionById);

// Create permission
router.post("/", createPermission);

// Update permission
router.put("/:id", updatePermission);

// Delete permission
router.delete("/:id", deletePermission);

module.exports = router;
