const express = require("express");
const {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  getMyProfile,
  updateMyProfile,
} = require("../controllers/patient.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

const router = express.Router();

// Protected endpoints - Patient self-service profile management
router.get("/me", authenticateToken, getMyProfile);
router.put("/me", authenticateToken, updateMyProfile);

// Public endpoints (for admin/system use)
router.get("/", getAllPatients);
router.get("/:id", getPatientById);
router.post("/", createPatient);
router.put("/:id", updatePatient);
router.delete("/:id", deletePatient);

module.exports = router;
