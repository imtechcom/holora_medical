// backend/src/controllers/recurringAppointment.controller.js

const repo = require('../repository/recurringAppointment.repository');


const recurringService = require('../services/recurringAppointment.service');
exports.create = async (req, res) => {
  try {
    const data = req.body;
    const recurring = await repo.createRecurring(data);
    // Generate child appointments
    await recurringService.generateAppointments(recurring);
    res.json(recurring);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const recurring = await repo.getById(req.params.id);
    if (!recurring) return res.status(404).json({ message: 'Not found' });
    res.json(recurring);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    await repo.updateRecurring(req.params.id, req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await repo.deleteRecurring(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.listByPatient = async (req, res) => {
  try {
    const list = await repo.listByPatient(req.params.patient_id);
    res.json(list);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.listByDoctor = async (req, res) => {
  try {
    const list = await repo.listByDoctor(req.params.doctor_id);
    res.json(list);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
