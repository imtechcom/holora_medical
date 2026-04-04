const express = require("express");
const router = express.Router();
const { login, register, googleAuth, acceptDoctorInvite, forgotPassword, resetPassword, refreshToken, logoutUser, logoutAll } = require("../controllers/auth.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleAuth);
router.post("/doctor-invite/accept", acceptDoctorInvite);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/refresh", refreshToken);
router.post("/logout", logoutUser);
router.post("/logout-all", authenticateToken, logoutAll);

module.exports = router;