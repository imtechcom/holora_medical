const express = require("express");
const router = express.Router();
const {
  getAllSpecialties,
  getSpecialtyById,
  createSpecialty,
  updateSpecialty,
  deleteSpecialty,
  updateSpecialtyParent,
  reassignAndDeleteSpecialty,
} = require("../controllers/specialty.controller");

// Get all specialties
router.get("/", getAllSpecialties);

// Get specialty by ID
router.get("/:id", getSpecialtyById);

// Create specialty
router.post("/", createSpecialty);

// Update specialty
router.put("/:id", updateSpecialty);

// Update specialty parent (for drag/drop hierarchy)
router.patch("/:id/parent", updateSpecialtyParent);

// Reassign doctors from source specialty to target specialty, then delete source
router.post("/:id/reassign-delete", reassignAndDeleteSpecialty);

// Delete specialty
router.delete("/:id", deleteSpecialty);

module.exports = router;
