// backend/src/routes/recurringAppointment.child.routes.js

const express = require('express');
const ctrl = require('../controllers/recurringAppointment.child.controller');
const router = express.Router();

router.get('/:recurring_id/children', ctrl.listChildren);
router.post('/child/:id/cancel', ctrl.cancelChild);
router.post('/:recurring_id/cancel-all', ctrl.cancelAll);

module.exports = router;
