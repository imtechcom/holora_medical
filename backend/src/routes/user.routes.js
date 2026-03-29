const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  assignRoleToUser,
  removeRoleFromUser,
  getUserRoles,
  getAvailableRoles,
} = require("../controllers/user.controller");

// GET all users
router.get("/", getAllUsers);

// GET user by ID
router.get("/:id", getUserById);

// GET user roles
router.get("/:user_id/roles", getUserRoles);

// GET available roles for user
router.get("/:user_id/available-roles", getAvailableRoles);

// POST create user
router.post("/", createUser);

// POST assign role to user
router.post("/assign-role", assignRoleToUser);

// POST remove role from user
router.post("/remove-role", removeRoleFromUser);

// PUT update user
router.put("/:id", updateUser);

// DELETE user
router.delete("/:id", deleteUser);

module.exports = router;
