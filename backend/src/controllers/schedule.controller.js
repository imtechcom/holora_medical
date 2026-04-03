const db = require('../config/db');

const TABLE_MISSING_MESSAGE = 'doctor_schedule table is missing. Please run schedule migration (npm run migrate:schedule).';

const findDoctorIdByUserId = (userId, callback) => {
  if (!userId) return callback(null, null);

  db.query('SELECT id FROM doctor WHERE user_id = ? LIMIT 1', [userId], (err, rows) => {
    if (err) return callback(err);
    if (!rows || !rows.length) return callback(null, null);
    return callback(null, rows[0].id);
  });
};

exports.getDoctorSchedules = (req, res) => {
  const { doctor_id, start_date, end_date } = req.query;
  const userRole = req.user?.role;
  const isAdmin = userRole === 'super_admin' || userRole === 'admin';

  const runQuery = (effectiveDoctorId) => {
    let query;
    const params = [];

    if (isAdmin) {
      // Admin view: join doctor + branch info
      query = `
        SELECT ds.*,
               d.full_name AS doctor_name, d.doctor_code, d.avatar_url AS doctor_avatar,
               s.name AS specialty_name,
               GROUP_CONCAT(DISTINCT b.name ORDER BY b.name SEPARATOR ', ') AS branch_names
        FROM doctor_schedule ds
        LEFT JOIN doctor d ON ds.doctor_id = d.id
        LEFT JOIN specialty s ON d.specialty_id = s.id
        LEFT JOIN doctor_branch db ON db.doctor_id = d.id AND db.deleted_at IS NULL
        LEFT JOIN branch b ON b.id = db.branch_id AND b.deleted_at IS NULL
        WHERE 1=1
      `;
    } else {
      query = 'SELECT * FROM doctor_schedule ds WHERE 1=1';
    }

    if (effectiveDoctorId) {
      query += ' AND ds.doctor_id = ?';
      params.push(effectiveDoctorId);
    }
    if (start_date) {
      query += ' AND ds.work_date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND ds.work_date <= ?';
      params.push(end_date);
    }

    if (isAdmin) {
      query += ' GROUP BY ds.id ORDER BY ds.work_date DESC, ds.start_time DESC';
    } else {
      query += ' ORDER BY ds.work_date, ds.start_time';
    }

    db.query(query, params, (err, results) => {
      if (err) {
        if (err.code === 'ER_NO_SUCH_TABLE') {
          return res.status(500).json({ message: TABLE_MISSING_MESSAGE, error: err.message });
        }
        return res.status(500).json({ message: 'Error fetching schedules', error: err.message });
      }
      res.json(results);
    });
  };

  if (req.user?.role === 'doctor') {
    findDoctorIdByUserId(req.user.id, (err, resolvedDoctorId) => {
      if (err) {
        return res.status(500).json({ message: 'Error fetching schedules', error: err.message });
      }
      if (!resolvedDoctorId) {
        return res.status(400).json({ message: 'This account is not linked to a doctor profile.' });
      }
      return runQuery(resolvedDoctorId);
    });
    return;
  }

  runQuery(doctor_id || null);
};

exports.createSchedule = (req, res) => {
  const { doctor_id, schedules } = req.body; 
  // schedules: [{work_date: '2026-04-05', start_time: '08:00', end_time: '12:00', slot_duration: 30}]
  
  if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
    return res.status(400).json({ message: 'Invalid data format. Expected array of schedules.' });
  }

  const persistSchedules = (effectiveDoctorId) => {
    if (!effectiveDoctorId) {
      return res.status(400).json({ message: 'This account is not linked to a doctor profile.' });
    }

    const values = schedules.map((s) => [
      effectiveDoctorId, s.work_date, s.start_time, s.end_time, s.slot_duration || 30, 'active',
    ]);

    const query = `
      INSERT INTO doctor_schedule (doctor_id, work_date, start_time, end_time, slot_duration, status)
      VALUES ?
    `;

    db.query(query, [values], (err, result) => {
      if (err) {
        if (err.code === 'ER_NO_SUCH_TABLE') {
          return res.status(500).json({ message: TABLE_MISSING_MESSAGE, error: err.message });
        }
        return res.status(500).json({ message: 'Error adding schedules', error: err.message });
      }
      res.status(201).json({ message: 'Schedules bulk-created successfully!', affectedRows: result.affectedRows });
    });
  };

  if (req.user?.role === 'doctor') {
    findDoctorIdByUserId(req.user.id, (err, resolvedDoctorId) => {
      if (err) {
        return res.status(500).json({ message: 'Error adding schedules', error: err.message });
      }
      return persistSchedules(resolvedDoctorId);
    });
    return;
  }

  persistSchedules(doctor_id || null);
};

exports.deleteSchedule = (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM doctor_schedule WHERE id = ?', [id], (err, result) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') {
        return res.status(500).json({ message: TABLE_MISSING_MESSAGE, error: err.message });
      }
      return res.status(500).json({ message: 'Error deleting schedule', error: err.message });
    }
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Schedule not found' });
    res.json({ message: 'Schedule deleted successfully' });
  });
};

exports.updateSchedule = (req, res) => {
  const { id } = req.params;
  const { work_date, start_time, end_time, slot_duration, status } = req.body;

  const query = `
    UPDATE doctor_schedule 
    SET work_date = ?, start_time = ?, end_time = ?, slot_duration = ?, status = ?
    WHERE id = ?
  `;
  
  db.query(query, [work_date, start_time, end_time, slot_duration || 30, status || 'active', id], (err, result) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') {
        return res.status(500).json({ message: TABLE_MISSING_MESSAGE, error: err.message });
      }
      return res.status(500).json({ message: 'Error updating schedule', error: err.message });
    }
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Schedule not found' });
    res.json({ message: 'Schedule updated successfully' });
  });
};
