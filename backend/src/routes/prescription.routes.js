const express = require("express");
const router = express.Router();
const prescriptionController = require("../controllers/prescription.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

// All prescription routes require auth
router.use(authenticateToken);

// Doctor
router.post("/", prescriptionController.createPrescription);
router.get("/doctor/me", prescriptionController.getDoctorPrescriptions);
router.put("/:id", prescriptionController.updatePrescription);
router.post("/:id/issue", prescriptionController.issuePrescription);
router.post("/:id/cancel", prescriptionController.cancelPrescription);

// Patient
router.get("/patient/me", prescriptionController.getMyPrescriptions);

// By context
router.get("/consultation/:consultationId", prescriptionController.getPrescriptionsByConsultation);
router.get("/appointment/:appointmentId", prescriptionController.getPrescriptionsByAppointment);
router.get("/:id", prescriptionController.getPrescriptionById);

module.exports = router;
