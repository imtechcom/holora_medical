// Doctor Earnings History Controller
const db = require('../config/db');

// GET /earnings/history?from=YYYY-MM-DD&to=YYYY-MM-DD
exports.getDoctorEarningsHistory = async (req, res) => {
  const doctorId = req.user.id;
  const { from, to } = req.query;
  let sql = `SELECT id, appointment_id, amount, paid_at, note FROM payment WHERE doctor_id = ?`;
  const params = [doctorId];
  if (from) {
    sql += ' AND paid_at >= ?';
    params.push(from);
  }
  if (to) {
    sql += ' AND paid_at <= ?';
    params.push(to);
  }
  sql += ' ORDER BY paid_at DESC';
  try {
    const [rows] = await db.promise().query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};
