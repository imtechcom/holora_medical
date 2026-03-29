const express = require("express");
const {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
} = require("../controllers/patient.controller");

const router = express.Router();

// Get all patients
router.get("/", getAllPatients);

// Get patient by ID
router.get("/:id", getPatientById);

// Create patient
router.post("/", createPatient);

// Update patient
router.put("/:id", updatePatient);

// Delete patient
router.delete("/:id", deletePatient);

module.exports = router;
