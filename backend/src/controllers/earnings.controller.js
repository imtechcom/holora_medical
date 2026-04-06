// Doctor Earnings Controller
const db = require('../config/db');

// GET /earnings/doctor/:doctorId
exports.getDoctorEarnings = async (req, res) => {
  const doctorId = req.params.doctorId;
  try {
    const [rows] = await db.promise().query(
      `SELECT IFNULL(SUM(amount),0) as total_earnings, COUNT(*) as payment_count FROM payment WHERE doctor_id = ?`,
      [doctorId]
    );
    res.json({
      doctorId,
      totalEarnings: rows[0].total_earnings,
      paymentCount: rows[0].payment_count
    });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};
