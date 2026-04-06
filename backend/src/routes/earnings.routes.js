// Doctor Earnings Routes
const express = require('express');
const router = express.Router();
const earningsController = require('../controllers/earnings.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// GET /earnings/doctor/:doctorId
router.use(authenticateToken);
router.get('/doctor/:doctorId', earningsController.getDoctorEarnings);

module.exports = router;
