const express = require("express");
const router = express.Router();
const {
  getAllDoctors,
  getDoctorById,
  getDoctorsByOwnerBranches,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} = require("../controllers/doctor.controller");
const { authenticateToken } = require("../middleware/auth.middleware");
const {
  requireProviderRole,
  requireActiveSubscription,
  requireOwnedBranchAccess,
  enforceDoctorManageLimit,
} = require("../middleware/provider.middleware");

// Get all doctors
router.get("/", getAllDoctors);

// Get doctors in branches owned by the authenticated clinic_owner
router.get("/my-branches", authenticateToken, requireProviderRole, getDoctorsByOwnerBranches);

// Get doctor by ID
router.get("/:id", getDoctorById);

// Create doctor
router.post(
  "/",
  authenticateToken,
  requireProviderRole,
  requireOwnedBranchAccess({ allowEmpty: false }),
  requireActiveSubscription("doctor.manage", { scopeOrder: ["branch", "doctor"] }),
  enforceDoctorManageLimit(),
  createDoctor
);

// Update doctor
router.put(
  "/:id",
  authenticateToken,
  requireProviderRole,
  requireOwnedBranchAccess({ allowEmpty: true }),
  requireActiveSubscription("doctor.manage", { scopeOrder: ["branch", "doctor"] }),
  updateDoctor
);

// Delete doctor
router.delete(
  "/:id",
  authenticateToken,
  requireProviderRole,
  requireActiveSubscription("doctor.manage", { scopeOrder: ["branch", "doctor"] }),
  deleteDoctor
);

module.exports = router;
