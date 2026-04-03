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

// ─── Doctor-specific dashboard ────────────────────────────────────────────────
// Returns stats scoped to the authenticated doctor: today's appointments,
// pending consultations, total patients, upcoming schedules, recent appointments.
const getDoctorDashboard = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'User not authenticated' });

  try {
    // Resolve doctor_id from user_id
    const doctorRows = await queryAsync(
      `SELECT id, full_name, doctor_code, avatar_url, specialty_id
       FROM doctor WHERE user_id = ? AND status <> 'deleted' LIMIT 1`,
      [userId]
    );
    if (!doctorRows.length) {
      return res.status(404).json({ message: 'Doctor profile not found for this user' });
    }
    const doctor = doctorRows[0];
    const doctorId = doctor.id;

    // Get specialty name
    const specRows = await queryAsync(
      `SELECT name FROM specialty WHERE id = ? LIMIT 1`,
      [doctor.specialty_id]
    );

    // Get branch names
    const branchRows = await queryAsync(
      `SELECT b.name FROM branch b
       INNER JOIN doctor_branch db ON db.branch_id = b.id AND db.deleted_at IS NULL
       WHERE db.doctor_id = ? AND b.deleted_at IS NULL`,
      [doctorId]
    );

    const today = new Date().toISOString().slice(0, 10);

    const [
      todayAppointments,
      totalAppointments,
      pendingConsultations,
      totalConsultations,
      totalPatients,
      upcomingSchedules,
      recentAppointments,
      appointmentsByStatus,
    ] = await Promise.all([
      // Today's appointments count
      queryAsync(
        `SELECT COUNT(*) AS count FROM appointment
         WHERE doctor_id = ? AND DATE(appointment_date) = ? AND status NOT IN ('cancelled','no_show')`,
        [doctorId, today]
      ),
      // Total appointments
      queryAsync(
        `SELECT COUNT(*) AS count FROM appointment WHERE doctor_id = ?`,
        [doctorId]
      ),
      // Pending consultations (unassigned or assigned to this doctor, status pending/in_progress)
      queryAsync(
        `SELECT COUNT(*) AS count FROM consultation
         WHERE (doctor_id = ? OR (doctor_id IS NULL AND status = 'pending'))
           AND status IN ('pending','in_progress')`,
        [doctorId]
      ),
      // Total consultations
      queryAsync(
        `SELECT COUNT(*) AS count FROM consultation WHERE doctor_id = ?`,
        [doctorId]
      ),
      // Total unique patients
      queryAsync(
        `SELECT COUNT(DISTINCT patient_id) AS count FROM appointment WHERE doctor_id = ?`,
        [doctorId]
      ),
      // Next 5 upcoming schedules
      queryAsync(
        `SELECT id, work_date, start_time, end_time, slot_duration, status
         FROM doctor_schedule
         WHERE doctor_id = ? AND work_date >= ?
         ORDER BY work_date ASC, start_time ASC LIMIT 5`,
        [doctorId, today]
      ),
      // Recent 5 appointments
      queryAsync(
        `SELECT a.id, a.appointment_code, a.appointment_date, a.start_time, a.end_time,
                a.status, a.appointment_type, a.reason,
                p.full_name AS patient_name
         FROM appointment a
         LEFT JOIN patient p ON p.id = a.patient_id
         WHERE a.doctor_id = ?
         ORDER BY a.appointment_date DESC, a.start_time DESC LIMIT 5`,
        [doctorId]
      ),
      // Appointments breakdown by status
      queryAsync(
        `SELECT status, COUNT(*) AS count FROM appointment WHERE doctor_id = ? GROUP BY status`,
        [doctorId]
      ),
    ]);

    return res.json({
      doctor: {
        id: doctorId,
        full_name: doctor.full_name,
        doctor_code: doctor.doctor_code,
        avatar_url: doctor.avatar_url,
        specialty_name: specRows[0]?.name || null,
        branch_names: branchRows.map(r => r.name),
      },
      stats: {
        today_appointments: todayAppointments[0]?.count || 0,
        total_appointments: totalAppointments[0]?.count || 0,
        pending_consultations: pendingConsultations[0]?.count || 0,
        total_consultations: totalConsultations[0]?.count || 0,
        total_patients: totalPatients[0]?.count || 0,
      },
      upcoming_schedules: upcomingSchedules,
      recent_appointments: recentAppointments,
      appointments_by_status: appointmentsByStatus,
    });
  } catch (err) {
    console.error('Get doctor dashboard error:', err);
    return res.status(500).json({ message: 'Database error', error: err.message });
  }
};

module.exports = {
  getDashboardStats,
  getAnalytics,
  getDoctorDashboard,
};
