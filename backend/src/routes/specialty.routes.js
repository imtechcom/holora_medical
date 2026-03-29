const express = require("express");
const router = express.Router();
const {
  getAllSpecialties,
  getSpecialtyById,
  createSpecialty,
  updateSpecialty,
  deleteSpecialty,
} = require("../controllers/specialty.controller");

// Get all specialties
router.get("/", getAllSpecialties);

// Get specialty by ID
router.get("/:id", getSpecialtyById);

// Create specialty
router.post("/", createSpecialty);

// Update specialty
router.put("/:id", updateSpecialty);

// Delete specialty
router.delete("/:id", deleteSpecialty);

module.exports = router;
