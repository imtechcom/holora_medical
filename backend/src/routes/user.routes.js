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
  getUserSessions,
  forceLogoutUser,
  revokeSession,
  getUserLoginHistory,
} = require("../controllers/user.controller");

// GET all users
router.get("/", getAllUsers);

// GET user by ID
router.get("/:id", getUserById);

// GET user roles
router.get("/:user_id/roles", getUserRoles);

// GET available roles for user
router.get("/:user_id/available-roles", getAvailableRoles);

// GET active sessions for a user
router.get("/:id/sessions", getUserSessions);

// GET login history for a user
router.get("/:id/login-history", getUserLoginHistory);

// POST create user
router.post("/", createUser);

// POST assign role to user
router.post("/assign-role", assignRoleToUser);

// POST remove role from user
router.post("/remove-role", removeRoleFromUser);

// POST force logout all sessions for a user
router.post("/:id/force-logout", forceLogoutUser);

// DELETE a single session
router.delete("/:id/sessions/:sessionId", revokeSession);

// PUT update user
router.put("/:id", updateUser);

// DELETE user
router.delete("/:id", deleteUser);

module.exports = router;
