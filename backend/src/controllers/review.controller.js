const db = require("../config/db");
const { logAudit } = require("../utils/audit.util");

// ── Patient tạo đánh giá bác sĩ ────────────────────────────────────────────
const createReview = (req, res) => {
  const userId = req.user.id;
  const { doctor_id, appointment_id, rating, title, comment, is_anonymous } = req.body;

  if (!doctor_id || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "doctor_id và rating (1-5) là bắt buộc." });
  }

  // Lấy patient_id từ user_id
  const getPatientSql = "SELECT id FROM patient WHERE user_id = ? LIMIT 1";
  db.query(getPatientSql, [userId], (err, pResults) => {
    if (err) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: err.message });
    if (!pResults.length) return res.status(404).json({ message: "Không tìm thấy hồ sơ bệnh nhân." });

    const patientId = pResults[0].id;

    // Kiểm tra bác sĩ tồn tại
    db.query("SELECT id FROM doctor WHERE id = ?", [doctor_id], (dErr, dResults) => {
      if (dErr) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: dErr.message });
      if (!dResults.length) return res.status(404).json({ message: "Không tìm thấy bác sĩ." });

      // Nếu có appointment_id, kiểm tra trạng thái completed & thuộc về patient
      const checkAndInsert = () => {
        // Kiểm tra trùng lặp
        let dupSql, dupParams;
        if (appointment_id) {
          dupSql = "SELECT id FROM review WHERE patient_id = ? AND doctor_id = ? AND appointment_id = ?";
          dupParams = [patientId, doctor_id, appointment_id];
        } else {
          dupSql = "SELECT id FROM review WHERE patient_id = ? AND doctor_id = ? AND appointment_id IS NULL";
          dupParams = [patientId, doctor_id];
        }

        db.query(dupSql, dupParams, (dupErr, dupResults) => {
          if (dupErr) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: dupErr.message });
          if (dupResults.length) return res.status(409).json({ message: "Bạn đã đánh giá bác sĩ này cho phiên này rồi." });

          const insertSql = `
            INSERT INTO review (patient_id, doctor_id, appointment_id, rating, title, comment, is_anonymous, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())
          `;
          db.query(insertSql, [patientId, doctor_id, appointment_id || null, rating, title || null, comment || null, is_anonymous ? 1 : 0], (iErr, iResult) => {
            if (iErr) return res.status(500).json({ message: "Lỗi tạo đánh giá", error: iErr.message });

            logAudit(req, "REVIEW_CREATE", "review", iResult.insertId, { doctor_id, rating, appointment_id: appointment_id || null });
            return res.status(201).json({ message: "Gửi đánh giá thành công. Đánh giá sẽ được duyệt trước khi hiển thị.", review_id: iResult.insertId });
          });
        });
      };

      if (appointment_id) {
        db.query(
          "SELECT id, status FROM appointment WHERE id = ? AND patient_id = ?",
          [appointment_id, patientId],
          (aErr, aResults) => {
            if (aErr) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: aErr.message });
            if (!aResults.length) return res.status(404).json({ message: "Không tìm thấy lịch hẹn." });
            if (aResults[0].status !== "completed") return res.status(400).json({ message: "Chỉ đánh giá được khi lịch hẹn đã hoàn thành." });
            checkAndInsert();
          }
        );
      } else {
        // Kiểm tra patient có ít nhất 1 consultation completed với bác sĩ
        db.query(
          "SELECT id FROM consultation WHERE patient_id = ? AND doctor_id = ? AND status = 'completed' LIMIT 1",
          [patientId, doctor_id],
          (cErr, cResults) => {
            if (cErr) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: cErr.message });
            if (!cResults.length) return res.status(400).json({ message: "Bạn cần có ít nhất 1 phiên tư vấn hoàn thành với bác sĩ này." });
            checkAndInsert();
          }
        );
      }
    });
  });
};

// ── Patient xem đánh giá của mình ──────────────────────────────────────────
const getMyReviews = (req, res) => {
  const userId = req.user.id;

  const sql = `
    SELECT r.*, d.full_name as doctor_name, d.avatar_url as doctor_avatar, d.doctor_code
    FROM review r
    JOIN patient p ON r.patient_id = p.id
    JOIN doctor d ON r.doctor_id = d.id
    WHERE p.user_id = ?
    ORDER BY r.created_at DESC
  `;
  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: err.message });
    return res.json({ message: "OK", data: results });
  });
};

// ── Public: Đánh giá của 1 bác sĩ (chỉ approved) ──────────────────────────
const getDoctorReviews = (req, res) => {
  const { doctorId } = req.params;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
  const offset = (page - 1) * limit;

  const countSql = "SELECT COUNT(*) as total FROM review WHERE doctor_id = ? AND status = 'approved'";
  db.query(countSql, [doctorId], (cErr, cResults) => {
    if (cErr) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: cErr.message });
    const total = cResults[0].total;

    const sql = `
      SELECT r.id, r.rating, r.title, r.comment, r.is_anonymous, r.created_at,
             CASE WHEN r.is_anonymous = 1 THEN NULL ELSE p.full_name END as patient_name,
             CASE WHEN r.is_anonymous = 1 THEN NULL ELSE p.avatar_url END as patient_avatar
      FROM review r
      JOIN patient p ON r.patient_id = p.id
      WHERE r.doctor_id = ? AND r.status = 'approved'
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `;
    db.query(sql, [doctorId, limit, offset], (err, results) => {
      if (err) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: err.message });
      return res.json({
        message: "OK",
        data: results,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    });
  });
};

// ── Public: Rating summary (avg, distribution) ─────────────────────────────
const getDoctorRatingSummary = (req, res) => {
  const { doctorId } = req.params;

  const sql = `
    SELECT 
      COUNT(*) as total_reviews,
      ROUND(AVG(rating), 1) as average_rating,
      SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as star_5,
      SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as star_4,
      SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as star_3,
      SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as star_2,
      SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as star_1
    FROM review
    WHERE doctor_id = ? AND status = 'approved'
  `;
  db.query(sql, [doctorId], (err, results) => {
    if (err) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: err.message });
    const row = results[0];
    return res.json({
      message: "OK",
      data: {
        total_reviews: row.total_reviews || 0,
        average_rating: parseFloat(row.average_rating) || 0,
        distribution: {
          5: row.star_5 || 0,
          4: row.star_4 || 0,
          3: row.star_3 || 0,
          2: row.star_2 || 0,
          1: row.star_1 || 0,
        },
      },
    });
  });
};

// ── Doctor xem đánh giá nhận được ──────────────────────────────────────────
const getMyReceivedReviews = (req, res) => {
  const userId = req.user.id;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
  const offset = (page - 1) * limit;
  const status = req.query.status; // optional filter

  // Lấy doctor_id từ user_id
  db.query("SELECT id FROM doctor WHERE user_id = ? LIMIT 1", [userId], (dErr, dResults) => {
    if (dErr) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: dErr.message });
    if (!dResults.length) return res.status(404).json({ message: "Không tìm thấy hồ sơ bác sĩ." });

    const doctorId = dResults[0].id;
    let whereClauses = ["r.doctor_id = ?"];
    let params = [doctorId];

    if (status && ["pending", "approved", "rejected", "hidden"].includes(status)) {
      whereClauses.push("r.status = ?");
      params.push(status);
    }

    const countSql = `SELECT COUNT(*) as total FROM review r WHERE ${whereClauses.join(" AND ")}`;
    db.query(countSql, params, (cErr, cResults) => {
      if (cErr) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: cErr.message });
      const total = cResults[0].total;

      const sql = `
        SELECT r.*,
               CASE WHEN r.is_anonymous = 1 THEN NULL ELSE p.full_name END as patient_name
        FROM review r
        JOIN patient p ON r.patient_id = p.id
        WHERE ${whereClauses.join(" AND ")}
        ORDER BY r.created_at DESC
        LIMIT ? OFFSET ?
      `;
      db.query(sql, [...params, limit, offset], (err, results) => {
        if (err) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: err.message });
        return res.json({
          message: "OK",
          data: results,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
      });
    });
  });
};

// ── Admin: Lấy tất cả đánh giá (quản lý) ──────────────────────────────────
const getAllReviews = (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
  const offset = (page - 1) * limit;
  const { status, doctor_id, rating } = req.query;

  let whereClauses = ["1=1"];
  let params = [];

  if (status && ["pending", "approved", "rejected", "hidden"].includes(status)) {
    whereClauses.push("r.status = ?");
    params.push(status);
  }
  if (doctor_id) {
    whereClauses.push("r.doctor_id = ?");
    params.push(doctor_id);
  }
  if (rating) {
    whereClauses.push("r.rating = ?");
    params.push(parseInt(rating));
  }

  const whereStr = whereClauses.join(" AND ");

  const countSql = `SELECT COUNT(*) as total FROM review r WHERE ${whereStr}`;
  db.query(countSql, params, (cErr, cResults) => {
    if (cErr) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: cErr.message });
    const total = cResults[0].total;

    const sql = `
      SELECT r.*, p.full_name as patient_name, d.full_name as doctor_name, d.doctor_code
      FROM review r
      JOIN patient p ON r.patient_id = p.id
      JOIN doctor d ON r.doctor_id = d.id
      WHERE ${whereStr}
      ORDER BY 
        CASE r.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 WHEN 'hidden' THEN 2 ELSE 3 END,
        r.created_at DESC
      LIMIT ? OFFSET ?
    `;
    db.query(sql, [...params, limit, offset], (err, results) => {
      if (err) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: err.message });
      return res.json({
        message: "OK",
        data: results,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    });
  });
};

// ── Admin: Moderate (approve/reject/hide) ───────────────────────────────────
const moderateReview = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !["approved", "rejected", "hidden"].includes(status)) {
    return res.status(400).json({ message: "Status phải là approved, rejected hoặc hidden." });
  }

  db.query("SELECT id, status as old_status FROM review WHERE id = ?", [id], (sErr, sResults) => {
    if (sErr) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: sErr.message });
    if (!sResults.length) return res.status(404).json({ message: "Không tìm thấy đánh giá." });

    const oldStatus = sResults[0].old_status;

    db.query("UPDATE review SET status = ?, updated_at = NOW() WHERE id = ?", [status, id], (uErr) => {
      if (uErr) return res.status(500).json({ message: "Lỗi cập nhật", error: uErr.message });

      logAudit(req, "REVIEW_MODERATE", "review", id, { old_status: oldStatus, new_status: status });
      return res.json({ message: `Đánh giá đã được ${status === "approved" ? "duyệt" : status === "rejected" ? "từ chối" : "ẩn"}.` });
    });
  });
};

// ── Patient cập nhật đánh giá (chỉ khi pending) ────────────────────────────
const updateReview = (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { rating, title, comment, is_anonymous } = req.body;

  if (rating && (rating < 1 || rating > 5)) {
    return res.status(400).json({ message: "Rating phải từ 1 đến 5." });
  }

  db.query(
    `SELECT r.id, r.status FROM review r JOIN patient p ON r.patient_id = p.id WHERE r.id = ? AND p.user_id = ?`,
    [id, userId],
    (sErr, sResults) => {
      if (sErr) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: sErr.message });
      if (!sResults.length) return res.status(404).json({ message: "Không tìm thấy đánh giá." });
      if (sResults[0].status !== "pending") return res.status(400).json({ message: "Chỉ sửa được đánh giá chưa duyệt." });

      const updates = [];
      const params = [];
      if (rating) { updates.push("rating = ?"); params.push(rating); }
      if (title !== undefined) { updates.push("title = ?"); params.push(title); }
      if (comment !== undefined) { updates.push("comment = ?"); params.push(comment); }
      if (is_anonymous !== undefined) { updates.push("is_anonymous = ?"); params.push(is_anonymous ? 1 : 0); }

      if (!updates.length) return res.status(400).json({ message: "Không có thông tin cập nhật." });

      updates.push("updated_at = NOW()");
      params.push(id);

      db.query(`UPDATE review SET ${updates.join(", ")} WHERE id = ?`, params, (uErr) => {
        if (uErr) return res.status(500).json({ message: "Lỗi cập nhật", error: uErr.message });

        logAudit(req, "REVIEW_UPDATE", "review", id, { rating, title });
        return res.json({ message: "Cập nhật đánh giá thành công." });
      });
    }
  );
};

// ── Patient xóa đánh giá ───────────────────────────────────────────────────
const deleteReview = (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  db.query(
    `SELECT r.id FROM review r JOIN patient p ON r.patient_id = p.id WHERE r.id = ? AND p.user_id = ?`,
    [id, userId],
    (sErr, sResults) => {
      if (sErr) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: sErr.message });
      if (!sResults.length) return res.status(404).json({ message: "Không tìm thấy đánh giá." });

      db.query("DELETE FROM review WHERE id = ?", [id], (dErr) => {
        if (dErr) return res.status(500).json({ message: "Lỗi xóa đánh giá", error: dErr.message });

        logAudit(req, "REVIEW_DELETE", "review", id, {});
        return res.json({ message: "Xóa đánh giá thành công." });
      });
    }
  );
};

// ── Patient kiểm tra đã đánh giá chưa (cho UI) ────────────────────────────
const checkReviewExists = (req, res) => {
  const userId = req.user.id;
  const { doctor_id, appointment_id } = req.query;

  if (!doctor_id) return res.status(400).json({ message: "doctor_id là bắt buộc." });

  db.query("SELECT id FROM patient WHERE user_id = ? LIMIT 1", [userId], (pErr, pResults) => {
    if (pErr) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: pErr.message });
    if (!pResults.length) return res.json({ data: { exists: false } });

    const patientId = pResults[0].id;
    let sql, params;

    if (appointment_id) {
      sql = "SELECT id, rating, status FROM review WHERE patient_id = ? AND doctor_id = ? AND appointment_id = ?";
      params = [patientId, doctor_id, appointment_id];
    } else {
      sql = "SELECT id, rating, status FROM review WHERE patient_id = ? AND doctor_id = ? AND appointment_id IS NULL";
      params = [patientId, doctor_id];
    }

    db.query(sql, params, (err, results) => {
      if (err) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: err.message });
      if (results.length) {
        return res.json({ data: { exists: true, review: results[0] } });
      }
      return res.json({ data: { exists: false } });
    });
  });
};

module.exports = {
  createReview,
  getMyReviews,
  getDoctorReviews,
  getDoctorRatingSummary,
  getMyReceivedReviews,
  getAllReviews,
  moderateReview,
  updateReview,
  deleteReview,
  checkReviewExists,
};
