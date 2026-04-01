const express = require("express");
const {
  getAllPatients,
  getPatientById,
  getNextPatientCode,
  createPatient,
  updatePatient,
  deletePatient,
  getMyProfile,
  updateMyProfile,
  getPatientsByOwnerBranches,
  getMyStats,
} = require("../controllers/patient.controller");
const { authenticateToken } = require("../middleware/auth.middleware");
const { requireProviderRole } = require("../middleware/provider.middleware");

const router = express.Router();

// Protected endpoints - Patient self-service profile management
router.get("/me", authenticateToken, getMyProfile);
router.put("/me", authenticateToken, updateMyProfile);
router.get("/me/stats", authenticateToken, getMyStats);

// Get patients in branches owned by the authenticated clinic_owner
router.get("/my-branches", authenticateToken, requireProviderRole, getPatientsByOwnerBranches);

// Public endpoints (for admin/system use)
router.get("/", getAllPatients);
router.get("/next-code", getNextPatientCode);
router.get("/:id", getPatientById);
router.post("/", createPatient);
router.put("/:id", updatePatient);
router.delete("/:id", deletePatient);

module.exports = router;
