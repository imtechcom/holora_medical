const express = require('express');
const router = express.Router();
const { getDoctorEarningsHistory } = require('../controllers/earnings-history.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.use(authenticateToken);
router.get('/history', getDoctorEarningsHistory);

module.exports = router;
