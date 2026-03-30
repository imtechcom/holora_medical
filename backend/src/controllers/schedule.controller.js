const db = require('../config/db');

exports.getDoctorSchedules = (req, res) => {
  const { doctor_id, start_date, end_date } = req.query;
  
  // Lấy danh sách ca làm việc của 1 bác sĩ trong một khoảng thời gian
  let query = 'SELECT * FROM doctor_schedule WHERE 1=1';
  let params = [];

  if (doctor_id) {
    query += ' AND doctor_id = ?';
    params.push(doctor_id);
  }
  if (start_date) {
    query += ' AND work_date >= ?';
    params.push(start_date);
  }
  if (end_date) {
    query += ' AND work_date <= ?';
    params.push(end_date);
  }

  query += ' ORDER BY work_date, start_time';

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ message: 'Error fetching schedules', error: err.message });
    res.json(results);
  });
};

exports.createSchedule = (req, res) => {
  const { doctor_id, schedules } = req.body; 
  // schedules: [{work_date: '2026-04-05', start_time: '08:00', end_time: '12:00', slot_duration: 30}]
  
  if (!doctor_id || !schedules || !Array.isArray(schedules) || schedules.length === 0) {
    return res.status(400).json({ message: 'Invalid data format. Expected doctor_id and array of schedules.' });
  }

  const values = schedules.map(s => [
    doctor_id, s.work_date, s.start_time, s.end_time, s.slot_duration || 30, 'active'
  ]);

  const query = `
    INSERT INTO doctor_schedule (doctor_id, work_date, start_time, end_time, slot_duration, status)
    VALUES ?
  `;

  db.query(query, [values], (err, result) => {
    if (err) return res.status(500).json({ message: 'Error adding schedules', error: err.message });
    res.status(201).json({ message: 'Schedules bulk-created successfully!', affectedRows: result.affectedRows });
  });
};

exports.deleteSchedule = (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM doctor_schedule WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ message: 'Error deleting schedule', error: err.message });
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
    if (err) return res.status(500).json({ message: 'Error updating schedule', error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Schedule not found' });
    res.json({ message: 'Schedule updated successfully' });
  });
};
