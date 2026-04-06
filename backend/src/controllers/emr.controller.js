const db = require('../config/db');

// Tạo hồ sơ EMR mới
exports.createEmrRecord = (req, res) => {
  const { patient_id, doctor_id, appointment_id, title, summary, diagnosis, treatment, notes, attachments } = req.body;
  if (!patient_id || !title) return res.status(400).json({ message: 'Thiếu thông tin bắt buộc.' });
  db.query(
    `INSERT INTO emr_record (patient_id, doctor_id, appointment_id, title, summary, diagnosis, treatment, notes, attachments) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [patient_id, doctor_id || null, appointment_id || null, title, summary || null, diagnosis || null, treatment || null, notes || null, attachments ? JSON.stringify(attachments) : null],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: result.insertId });
    }
  );
};

// Lấy danh sách EMR theo bệnh nhân
exports.getEmrRecordsByPatient = (req, res) => {
  const { patient_id } = req.params;
  db.query(
    `SELECT * FROM emr_record WHERE patient_id = ? ORDER BY created_at DESC`,
    [patient_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};

// Lấy chi tiết EMR
exports.getEmrRecordById = (req, res) => {
  const { id } = req.params;
  db.query(
    `SELECT * FROM emr_record WHERE id = ?`,
    [id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!rows.length) return res.status(404).json({ message: 'Không tìm thấy hồ sơ EMR.' });
      res.json(rows[0]);
    }
  );
};

// Cập nhật EMR
exports.updateEmrRecord = (req, res) => {
  const { id } = req.params;
  const { title, summary, diagnosis, treatment, notes, attachments } = req.body;
  db.query(
    `UPDATE emr_record SET title=?, summary=?, diagnosis=?, treatment=?, notes=?, attachments=?, updated_at=NOW() WHERE id=?`,
    [title, summary, diagnosis, treatment, notes, attachments ? JSON.stringify(attachments) : null, id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Đã cập nhật hồ sơ EMR.' });
    }
  );
};

// Xóa EMR
exports.deleteEmrRecord = (req, res) => {
  const { id } = req.params;
  db.query(`DELETE FROM emr_record WHERE id = ?`, [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Đã xóa hồ sơ EMR.' });
  });
};
