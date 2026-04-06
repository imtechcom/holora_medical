// backend/src/repository/recurringAppointment.repository.js

const db = require('../config/db');

const queryAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

const createRecurring = async (data) => {
  const { patient_id, doctor_id, branch_id, repeat_type, repeat_interval, repeat_days, start_date, end_date, note } = data;
  const sql = `
    INSERT INTO recurring_appointments (patient_id, doctor_id, branch_id, repeat_type, repeat_interval, repeat_days, start_date, end_date, note, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())
  `;
  const result = await queryAsync(sql, [
    patient_id, doctor_id, branch_id, repeat_type, repeat_interval || 1, 
    repeat_days ? JSON.stringify(repeat_days) : null, 
    start_date, end_date || null, note || null
  ]);
  return { id: result.insertId, ...data };
};

const getById = async (id) => {
  const rows = await queryAsync('SELECT * FROM recurring_appointments WHERE id = ?', [id]);
  return rows[0] || null;
};

const updateRecurring = (id, data) => {
  const fields = [];
  const params = [];
  Object.keys(data).forEach(key => {
    fields.push(`${key} = ?`);
    params.push(key === 'repeat_days' ? JSON.stringify(data[key]) : data[key]);
  });
  params.push(id);
  const sql = `UPDATE recurring_appointments SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
  return queryAsync(sql, params);
};

const deleteRecurring = (id) => {
  return queryAsync('DELETE FROM recurring_appointments WHERE id = ?', [id]);
};

const listByPatient = (patient_id) => {
  return queryAsync('SELECT * FROM recurring_appointments WHERE patient_id = ?', [patient_id]);
};

const listByDoctor = (doctor_id) => {
  return queryAsync('SELECT * FROM recurring_appointments WHERE doctor_id = ?', [doctor_id]);
};

module.exports = {
  createRecurring,
  getById,
  updateRecurring,
  deleteRecurring,
  listByPatient,
  listByDoctor,
};
