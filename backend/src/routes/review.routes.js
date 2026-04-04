const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/review.controller");
const { authenticateToken } = require("../middleware/auth.middleware");
const { authorizeRole } = require("../middleware/role.middleware");

// ── Public endpoints (không cần auth) ──────────────────────────────────────
router.get("/doctor/:doctorId", reviewController.getDoctorReviews);
router.get("/doctor/:doctorId/summary", reviewController.getDoctorRatingSummary);

// ── Authenticated endpoints ────────────────────────────────────────────────
router.use(authenticateToken);

// Patient
router.post("/", reviewController.createReview);
router.get("/me", reviewController.getMyReviews);
router.get("/check", reviewController.checkReviewExists);
router.put("/:id", reviewController.updateReview);
router.delete("/:id", reviewController.deleteReview);

// Doctor
router.get("/received", reviewController.getMyReceivedReviews);

// Admin
router.get("/admin", authorizeRole("admin", "super_admin"), reviewController.getAllReviews);
router.patch("/:id/moderate", authorizeRole("admin", "super_admin"), reviewController.moderateReview);

module.exports = router;
