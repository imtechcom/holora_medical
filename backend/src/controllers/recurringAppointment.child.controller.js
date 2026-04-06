// backend/src/controllers/recurringAppointment.child.controller.js

const db = require('../config/db');

// Lấy tất cả appointment con theo recurring_id
exports.listChildren = (req, res) => {
  const { recurring_id } = req.params;
  db.query(
    `SELECT * FROM appointment WHERE recurring_id = ? ORDER BY appointment_date ASC`,
    [recurring_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};

// Huỷ 1 appointment con
exports.cancelChild = (req, res) => {
  const { id } = req.params;
  db.query(
    `UPDATE appointment SET status = 'cancelled' WHERE id = ?`,
    [id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
};

// Huỷ cả chuỗi
exports.cancelAll = (req, res) => {
  const { recurring_id } = req.params;
  db.query(
    `UPDATE appointment SET status = 'cancelled' WHERE recurring_id = ?`,
    [recurring_id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
};
