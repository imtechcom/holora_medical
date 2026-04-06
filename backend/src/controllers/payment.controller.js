// Mock payment controller for appointment payments
const db = require('../config/db');

// POST /appointments/:id/pay
exports.payForAppointment = (req, res) => {
  const { id } = req.params;
  const { role, id: user_id } = req.user;

  // Only patients can pay for their own appointments
  if (role !== 'patient') {
    return res.status(403).json({ message: 'Only patients can pay for appointments.' });
  }

  // Find patient_id for this user
  db.query('SELECT id FROM patient WHERE user_id = ? LIMIT 1', [user_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!rows.length) return res.status(403).json({ message: 'Patient profile not found.' });
    const patient_id = rows[0].id;

    // Check appointment ownership and status
    db.query('SELECT * FROM appointment WHERE id = ? AND patient_id = ?', [id, patient_id], (err2, rows2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      if (!rows2.length) return res.status(404).json({ message: 'Appointment not found.' });
      const appt = rows2[0];
      if (appt.payment_status === 'paid') {
        return res.status(400).json({ message: 'Appointment already paid.' });
      }
      // Mark as paid (mock)
      db.query('UPDATE appointment SET payment_status = ? WHERE id = ?', ['paid', id], (err3) => {
        if (err3) return res.status(500).json({ error: err3.message });
        return res.json({ message: 'Payment successful (mock).', appointment_id: id });
      });
    });
  });
};

// GET /appointments/:id/payment-status
exports.getAppointmentPaymentStatus = (req, res) => {
  const { id } = req.params;
  db.query('SELECT payment_status FROM appointment WHERE id = ?', [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!rows.length) return res.status(404).json({ message: 'Appointment not found.' });
    res.json({ payment_status: rows[0].payment_status || 'unpaid' });
  });
};
