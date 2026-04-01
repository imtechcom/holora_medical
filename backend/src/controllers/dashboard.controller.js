const db = require('../config/db');

const queryAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

const getDashboardStats = (req, res) => {
  // Queries
  const userQuery = `SELECT COUNT(*) AS count FROM users WHERE deleted_at IS NULL`;
  const patientQuery = `SELECT COUNT(*) AS count FROM patient WHERE deleted_at IS NULL`;
  const doctorQuery = `SELECT COUNT(*) AS count FROM doctor WHERE status <> 'deleted'`;
  const appointmentQuery = `SELECT COUNT(*) AS count FROM appointment`;
  const consultationQuery = `SELECT COUNT(*) AS count FROM consultation`;

  let totalUsers = 0;
  let totalPatients = 0;
  let totalDoctors = 0;
  let totalAppointments = 0;
  let totalConsultations = 0;

  db.query(userQuery, (err, userRes) => {
    if (err) return res.status(500).json({ error: err.message });
    totalUsers = userRes[0].count;

    db.query(patientQuery, (err, patientRes) => {
      if (err) return res.status(500).json({ error: err.message });
      totalPatients = patientRes[0].count;

      db.query(doctorQuery, (err, doctorRes) => {
        if (err) return res.status(500).json({ error: err.message });
        totalDoctors = doctorRes[0].count;

        db.query(appointmentQuery, (err, appointmentRes) => {
          if (err) return res.status(500).json({ error: err.message });
          totalAppointments = appointmentRes[0].count;

          db.query(consultationQuery, (err, consultationRes) => {
            if (err) return res.status(500).json({ error: err.message });
            totalConsultations = consultationRes[0].count;

            return res.json({
              users: totalUsers,
              patients: totalPatients,
              doctors: totalDoctors,
              appointments: totalAppointments,
              consultations: totalConsultations,
            });
          });
        });
      });
    });
  });
};

// ─── Analytics endpoint ───────────────────────────────────────────────────────
// Returns chart data: appointments by month, statuses, top specialties
const getAnalytics = async (req, res) => {
  try {
    const [
      appointmentsByMonth,
      appointmentsByStatus,
      consultationsByStatus,
      topSpecialties,
    ] = await Promise.all([
      // Appointments per month — last 6 months
      queryAsync(`
        SELECT DATE_FORMAT(appointment_date, '%Y-%m') AS month, COUNT(*) AS count
        FROM appointment
        WHERE appointment_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        GROUP BY month
        ORDER BY month ASC
      `),
      // Appointment status breakdown
      queryAsync(`
        SELECT status, COUNT(*) AS count
        FROM appointment
        GROUP BY status
        ORDER BY count DESC
      `),
      // Consultation status breakdown
      queryAsync(`
        SELECT status, COUNT(*) AS count
        FROM consultation
        GROUP BY status
        ORDER BY count DESC
      `),
      // Top 5 specialties by active doctor count
      queryAsync(`
        SELECT s.name, COUNT(d.id) AS count
        FROM specialty s
        LEFT JOIN doctor d ON d.specialty_id = s.id AND d.status <> 'deleted'
        WHERE s.status = 'active'
        GROUP BY s.id, s.name
        ORDER BY count DESC
        LIMIT 5
      `),
    ]);

    return res.json({
      appointmentsByMonth,
      appointmentsByStatus,
      consultationsByStatus,
      topSpecialties,
    });
  } catch (err) {
    console.error('Get analytics error:', err);
    return res.status(500).json({ message: 'Database error', error: err.message });
  }
};

module.exports = {
  getDashboardStats,
  getAnalytics,
};

