const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { authorizeRole } = require('../middleware/role.middleware');

// All payment endpoints require authentication
router.use(authenticateToken);

// Patient pays for appointment (mock)
router.post('/appointments/:id/pay', authorizeRole('patient'), paymentController.payForAppointment);

// Get payment status for appointment
router.get('/appointments/:id/payment-status', paymentController.getAppointmentPaymentStatus);

module.exports = router;
