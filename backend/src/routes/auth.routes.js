const express = require("express");
const router = express.Router();
const { login, register, googleAuth, acceptDoctorInvite, forgotPassword, resetPassword } = require("../controllers/auth.controller");

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleAuth);
router.post("/doctor-invite/accept", acceptDoctorInvite);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;