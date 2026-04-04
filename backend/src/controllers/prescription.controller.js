const db = require("../config/db");
const { logAudit } = require("../utils/audit.util");
const { generateMedicalCode } = require("../utils/medical-code.util");

// ── Helper: get doctor_id from user_id ──────────────────────────────────────
const getDoctorId = (userId, cb) => {
  db.query("SELECT id FROM doctor WHERE user_id = ? LIMIT 1", [userId], (err, rows) => {
    if (err) return cb(err);
    if (!rows.length) return cb(new Error("NOT_DOCTOR"));
    cb(null, rows[0].id);
  });
};

const getPatientId = (userId, cb) => {
  db.query("SELECT id FROM patient WHERE user_id = ? LIMIT 1", [userId], (err, rows) => {
    if (err) return cb(err);
    if (!rows.length) return cb(new Error("NOT_PATIENT"));
    cb(null, rows[0].id);
  });
};

// ── 1. Doctor tạo toa thuốc ─────────────────────────────────────────────────
const createPrescription = (req, res) => {
  const userId = req.user.id;
  const { consultation_id, appointment_id, patient_id, diagnosis, notes, items } = req.body;

  if (!patient_id) {
    return res.status(400).json({ message: "patient_id là bắt buộc." });
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Toa thuốc phải có ít nhất 1 dòng thuốc." });
  }
  for (const item of items) {
    if (!item.medication_name || !item.medication_name.trim()) {
      return res.status(400).json({ message: "Tên thuốc không được để trống." });
    }
  }

  getDoctorId(userId, (dErr, doctorId) => {
    if (dErr) {
      if (dErr.message === "NOT_DOCTOR") return res.status(403).json({ message: "Chỉ bác sĩ mới có thể kê toa." });
      return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: dErr.message });
    }

    generateMedicalCode("prescription", (codeErr, prescriptionCode) => {
      if (codeErr) return res.status(500).json({ message: "Lỗi tạo mã toa thuốc", error: codeErr.message });

      const insertSql = `
        INSERT INTO prescription (consultation_id, appointment_id, doctor_id, patient_id, prescription_code, diagnosis, notes, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', NOW(), NOW())
      `;
      const params = [
        consultation_id || null,
        appointment_id || null,
        doctorId,
        patient_id,
        prescriptionCode,
        diagnosis || null,
        notes || null,
      ];

      db.query(insertSql, params, (err, result) => {
        if (err) return res.status(500).json({ message: "Lỗi tạo toa thuốc", error: err.message });

        const prescriptionId = result.insertId;

        // Insert items
        const itemValues = items.map((item, idx) => [
          prescriptionId,
          item.medication_name.trim(),
          item.dosage || null,
          item.frequency || null,
          item.duration || null,
          item.quantity || null,
          item.unit || null,
          item.route || null,
          item.instructions || null,
          item.sort_order ?? idx,
        ]);

        const itemSql = `
          INSERT INTO prescription_item (prescription_id, medication_name, dosage, frequency, duration, quantity, unit, route, instructions, sort_order)
          VALUES ?
        `;
        db.query(itemSql, [itemValues], (itemErr) => {
          if (itemErr) return res.status(500).json({ message: "Lỗi thêm thuốc vào toa", error: itemErr.message });

          logAudit(req, "PRESCRIPTION_CREATE", "prescription", prescriptionId, { patient_id, consultation_id, items: items.length });
          return res.status(201).json({
            message: "Tạo toa thuốc thành công.",
            prescription_id: prescriptionId,
            prescription_code: prescriptionCode,
          });
        });
      });
    });
  });
};

// ── 2. Lấy toa thuốc theo ID (doctor, patient, admin) ──────────────────────
const getPrescriptionById = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const sql = `
    SELECT p.*,
           d.user_id AS doctor_user_id, u_doc.full_name AS doctor_name,
           pt.user_id AS patient_user_id, u_pat.full_name AS patient_name
    FROM prescription p
    JOIN doctor d ON p.doctor_id = d.id
    JOIN users u_doc ON d.user_id = u_doc.id
    JOIN patient pt ON p.patient_id = pt.id
    JOIN users u_pat ON pt.user_id = u_pat.id
    WHERE p.id = ?
  `;

  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: err.message });
    if (!results.length) return res.status(404).json({ message: "Không tìm thấy toa thuốc." });

    const prescription = results[0];

    // Kiểm tra quyền: doctor chủ toa, patient của toa, hoặc admin
    const role = req.user.role;
    const isAdmin = role === "admin" || role === "super_admin";
    const isOwnerDoctor = prescription.doctor_user_id === userId;
    const isOwnerPatient = prescription.patient_user_id === userId;

    if (!isAdmin && !isOwnerDoctor && !isOwnerPatient) {
      return res.status(403).json({ message: "Bạn không có quyền xem toa thuốc này." });
    }

    // Lấy items
    db.query(
      "SELECT * FROM prescription_item WHERE prescription_id = ? ORDER BY sort_order ASC, id ASC",
      [id],
      (itemErr, itemResults) => {
        if (itemErr) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: itemErr.message });
        prescription.items = itemResults || [];
        return res.json({ message: "Thành công", data: prescription });
      }
    );
  });
};

// ── 3. Lấy toa thuốc theo consultation_id ───────────────────────────────────
const getPrescriptionsByConsultation = (req, res) => {
  const { consultationId } = req.params;

  const sql = `
    SELECT p.*, u_doc.full_name AS doctor_name
    FROM prescription p
    JOIN doctor d ON p.doctor_id = d.id
    JOIN users u_doc ON d.user_id = u_doc.id
    WHERE p.consultation_id = ?
    ORDER BY p.created_at DESC
  `;

  db.query(sql, [consultationId], (err, results) => {
    if (err) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: err.message });

    if (results.length === 0) {
      return res.json({ message: "Thành công", data: [] });
    }

    // Lấy items cho tất cả prescriptions
    const ids = results.map((r) => r.id);
    db.query(
      "SELECT * FROM prescription_item WHERE prescription_id IN (?) ORDER BY sort_order ASC, id ASC",
      [ids],
      (itemErr, itemResults) => {
        if (itemErr) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: itemErr.message });

        const itemMap = {};
        (itemResults || []).forEach((item) => {
          if (!itemMap[item.prescription_id]) itemMap[item.prescription_id] = [];
          itemMap[item.prescription_id].push(item);
        });

        results.forEach((p) => {
          p.items = itemMap[p.id] || [];
        });

        return res.json({ message: "Thành công", data: results });
      }
    );
  });
};

// ── 4. Lấy toa thuốc theo appointment_id ────────────────────────────────────
const getPrescriptionsByAppointment = (req, res) => {
  const { appointmentId } = req.params;

  const sql = `
    SELECT p.*, u_doc.full_name AS doctor_name
    FROM prescription p
    JOIN doctor d ON p.doctor_id = d.id
    JOIN users u_doc ON d.user_id = u_doc.id
    WHERE p.appointment_id = ?
    ORDER BY p.created_at DESC
  `;

  db.query(sql, [appointmentId], (err, results) => {
    if (err) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: err.message });

    if (results.length === 0) {
      return res.json({ message: "Thành công", data: [] });
    }

    const ids = results.map((r) => r.id);
    db.query(
      "SELECT * FROM prescription_item WHERE prescription_id IN (?) ORDER BY sort_order ASC, id ASC",
      [ids],
      (itemErr, itemResults) => {
        if (itemErr) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: itemErr.message });

        const itemMap = {};
        (itemResults || []).forEach((item) => {
          if (!itemMap[item.prescription_id]) itemMap[item.prescription_id] = [];
          itemMap[item.prescription_id].push(item);
        });

        results.forEach((p) => {
          p.items = itemMap[p.id] || [];
        });

        return res.json({ message: "Thành công", data: results });
      }
    );
  });
};

// ── 5. Patient xem toa thuốc của mình ───────────────────────────────────────
const getMyPrescriptions = (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20, status } = req.query;
  const offset = (page - 1) * limit;

  getPatientId(userId, (pErr, patientId) => {
    if (pErr) {
      if (pErr.message === "NOT_PATIENT") return res.status(403).json({ message: "Không tìm thấy hồ sơ bệnh nhân." });
      return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: pErr.message });
    }

    let where = "p.patient_id = ?";
    const params = [patientId];

    if (status) {
      where += " AND p.status = ?";
      params.push(status);
    }

    const countSql = `SELECT COUNT(*) AS total FROM prescription p WHERE ${where}`;
    db.query(countSql, params, (cErr, cResults) => {
      if (cErr) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: cErr.message });

      const total = cResults[0].total;

      const dataSql = `
        SELECT p.*, u_doc.full_name AS doctor_name
        FROM prescription p
        JOIN doctor d ON p.doctor_id = d.id
        JOIN users u_doc ON d.user_id = u_doc.id
        WHERE ${where}
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `;

      db.query(dataSql, [...params, Number(limit), Number(offset)], (dErr, results) => {
        if (dErr) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: dErr.message });

        // Lấy items
        if (results.length === 0) {
          return res.json({ message: "Thành công", data: [], pagination: { total, page: Number(page), limit: Number(limit) } });
        }

        const ids = results.map((r) => r.id);
        db.query(
          "SELECT * FROM prescription_item WHERE prescription_id IN (?) ORDER BY sort_order ASC, id ASC",
          [ids],
          (itemErr, itemResults) => {
            if (itemErr) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: itemErr.message });

            const itemMap = {};
            (itemResults || []).forEach((item) => {
              if (!itemMap[item.prescription_id]) itemMap[item.prescription_id] = [];
              itemMap[item.prescription_id].push(item);
            });

            results.forEach((p) => {
              p.items = itemMap[p.id] || [];
            });

            return res.json({
              message: "Thành công",
              data: results,
              pagination: { total, page: Number(page), limit: Number(limit) },
            });
          }
        );
      });
    });
  });
};

// ── 6. Doctor xem toa thuốc đã kê ───────────────────────────────────────────
const getDoctorPrescriptions = (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20, status } = req.query;
  const offset = (page - 1) * limit;

  getDoctorId(userId, (dErr, doctorId) => {
    if (dErr) {
      if (dErr.message === "NOT_DOCTOR") return res.status(403).json({ message: "Không tìm thấy hồ sơ bác sĩ." });
      return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: dErr.message });
    }

    let where = "p.doctor_id = ?";
    const params = [doctorId];

    if (status) {
      where += " AND p.status = ?";
      params.push(status);
    }

    const countSql = `SELECT COUNT(*) AS total FROM prescription p WHERE ${where}`;
    db.query(countSql, params, (cErr, cResults) => {
      if (cErr) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: cErr.message });

      const total = cResults[0].total;

      const dataSql = `
        SELECT p.*, u_pat.full_name AS patient_name
        FROM prescription p
        JOIN patient pt ON p.patient_id = pt.id
        JOIN users u_pat ON pt.user_id = u_pat.id
        WHERE ${where}
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `;

      db.query(dataSql, [...params, Number(limit), Number(offset)], (dErr2, results) => {
        if (dErr2) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: dErr2.message });

        return res.json({
          message: "Thành công",
          data: results,
          pagination: { total, page: Number(page), limit: Number(limit) },
        });
      });
    });
  });
};

// ── 7. Cập nhật toa thuốc (chỉ khi draft) ──────────────────────────────────
const updatePrescription = (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { diagnosis, notes, items } = req.body;

  getDoctorId(userId, (dErr, doctorId) => {
    if (dErr) {
      if (dErr.message === "NOT_DOCTOR") return res.status(403).json({ message: "Chỉ bác sĩ mới có thể sửa toa." });
      return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: dErr.message });
    }

    db.query("SELECT id, status, doctor_id FROM prescription WHERE id = ?", [id], (err, results) => {
      if (err) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: err.message });
      if (!results.length) return res.status(404).json({ message: "Không tìm thấy toa thuốc." });

      const prescription = results[0];
      if (prescription.doctor_id !== doctorId) {
        return res.status(403).json({ message: "Bạn không có quyền sửa toa thuốc này." });
      }
      if (prescription.status !== "draft") {
        return res.status(400).json({ message: "Chỉ có thể sửa toa thuốc ở trạng thái nháp." });
      }

      // Update main record
      const updateSql = "UPDATE prescription SET diagnosis = ?, notes = ?, updated_at = NOW() WHERE id = ?";
      db.query(updateSql, [diagnosis || null, notes || null, id], (uErr) => {
        if (uErr) return res.status(500).json({ message: "Lỗi cập nhật toa thuốc", error: uErr.message });

        // Replace items if provided
        if (items && Array.isArray(items) && items.length > 0) {
          db.query("DELETE FROM prescription_item WHERE prescription_id = ?", [id], (delErr) => {
            if (delErr) return res.status(500).json({ message: "Lỗi cập nhật thuốc", error: delErr.message });

            const itemValues = items.map((item, idx) => [
              id,
              item.medication_name.trim(),
              item.dosage || null,
              item.frequency || null,
              item.duration || null,
              item.quantity || null,
              item.unit || null,
              item.route || null,
              item.instructions || null,
              item.sort_order ?? idx,
            ]);

            db.query(
              `INSERT INTO prescription_item (prescription_id, medication_name, dosage, frequency, duration, quantity, unit, route, instructions, sort_order) VALUES ?`,
              [itemValues],
              (insErr) => {
                if (insErr) return res.status(500).json({ message: "Lỗi thêm thuốc", error: insErr.message });

                logAudit(req, "PRESCRIPTION_UPDATE", "prescription", Number(id), { items: items.length });
                return res.json({ message: "Cập nhật toa thuốc thành công." });
              }
            );
          });
        } else {
          logAudit(req, "PRESCRIPTION_UPDATE", "prescription", Number(id), {});
          return res.json({ message: "Cập nhật toa thuốc thành công." });
        }
      });
    });
  });
};

// ── 8. Phát hành toa thuốc (draft → issued) ─────────────────────────────────
const issuePrescription = (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  getDoctorId(userId, (dErr, doctorId) => {
    if (dErr) {
      if (dErr.message === "NOT_DOCTOR") return res.status(403).json({ message: "Chỉ bác sĩ mới có thể phát hành toa." });
      return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: dErr.message });
    }

    db.query("SELECT id, status, doctor_id FROM prescription WHERE id = ?", [id], (err, results) => {
      if (err) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: err.message });
      if (!results.length) return res.status(404).json({ message: "Không tìm thấy toa thuốc." });

      const prescription = results[0];
      if (prescription.doctor_id !== doctorId) {
        return res.status(403).json({ message: "Bạn không có quyền phát hành toa thuốc này." });
      }
      if (prescription.status !== "draft") {
        return res.status(400).json({ message: "Chỉ có thể phát hành toa thuốc nháp." });
      }

      db.query(
        "UPDATE prescription SET status = 'issued', issued_at = NOW(), updated_at = NOW() WHERE id = ?",
        [id],
        (uErr) => {
          if (uErr) return res.status(500).json({ message: "Lỗi phát hành toa thuốc", error: uErr.message });

          logAudit(req, "PRESCRIPTION_ISSUE", "prescription", Number(id), {});
          return res.json({ message: "Phát hành toa thuốc thành công." });
        }
      );
    });
  });
};

// ── 9. Hủy toa thuốc ────────────────────────────────────────────────────────
const cancelPrescription = (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  getDoctorId(userId, (dErr, doctorId) => {
    if (dErr) {
      if (dErr.message === "NOT_DOCTOR") return res.status(403).json({ message: "Chỉ bác sĩ mới có thể hủy toa." });
      return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: dErr.message });
    }

    db.query("SELECT id, status, doctor_id FROM prescription WHERE id = ?", [id], (err, results) => {
      if (err) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: err.message });
      if (!results.length) return res.status(404).json({ message: "Không tìm thấy toa thuốc." });

      const prescription = results[0];
      if (prescription.doctor_id !== doctorId) {
        return res.status(403).json({ message: "Bạn không có quyền hủy toa thuốc này." });
      }
      if (prescription.status === "cancelled") {
        return res.status(400).json({ message: "Toa thuốc đã bị hủy." });
      }

      db.query(
        "UPDATE prescription SET status = 'cancelled', updated_at = NOW() WHERE id = ?",
        [id],
        (uErr) => {
          if (uErr) return res.status(500).json({ message: "Lỗi hủy toa thuốc", error: uErr.message });

          logAudit(req, "PRESCRIPTION_CANCEL", "prescription", Number(id), {});
          return res.json({ message: "Đã hủy toa thuốc." });
        }
      );
    });
  });
};

module.exports = {
  createPrescription,
  getPrescriptionById,
  getPrescriptionsByConsultation,
  getPrescriptionsByAppointment,
  getMyPrescriptions,
  getDoctorPrescriptions,
  updatePrescription,
  issuePrescription,
  cancelPrescription,
};
