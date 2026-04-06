// backend/src/routes/recurringAppointment.routes.js

const express = require('express');
const ctrl = require('../controllers/recurringAppointment.controller');
const router = express.Router();

router.post('/', ctrl.create);
router.get('/:id', ctrl.getById);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.delete);
router.get('/patient/:patient_id', ctrl.listByPatient);
router.get('/doctor/:doctor_id', ctrl.listByDoctor);

module.exports = router;
