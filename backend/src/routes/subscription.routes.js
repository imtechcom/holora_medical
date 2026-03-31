const express = require("express");
const router = express.Router();

const {
  getPlans,
  getMySubscriptions,
  activateSubscription,
  createPayment,
  confirmPayment,
} = require("../controllers/subscription.controller");
const { authenticateToken } = require("../middleware/auth.middleware");
const { authorizeRole } = require("../middleware/role.middleware");

router.get("/plans", getPlans);
router.get("/me", authenticateToken, getMySubscriptions);
router.post(
  "/activate",
  authenticateToken,
  authorizeRole(["super_admin", "admin", "doctor", "clinic_owner", "branch_manager"]),
  activateSubscription
);

router.post(
  "/create-payment",
  authenticateToken,
  authorizeRole(["clinic_owner"]),
  createPayment
);

router.post(
  "/confirm-payment",
  authenticateToken,
  authorizeRole(["clinic_owner"]),
  confirmPayment
);

module.exports = router;
