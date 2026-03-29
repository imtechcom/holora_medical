const express = require("express");
const router = express.Router();
const {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getRolePermissions,
  assignPermissionToRole,
  removePermissionFromRole,
} = require("../controllers/role.controller");

// GET all roles
router.get("/", getAllRoles);

// GET role by ID
router.get("/:id", getRoleById);

// POST create role
router.post("/", createRole);

// PUT update role
router.put("/:id", updateRole);

// DELETE role
router.delete("/:id", deleteRole);

// GET role permissions
router.get("/:id/permissions", getRolePermissions);

// POST assign permission to role
router.post("/permissions/assign", assignPermissionToRole);

// DELETE remove permission from role
router.post("/permissions/remove", removePermissionFromRole);

module.exports = router;
