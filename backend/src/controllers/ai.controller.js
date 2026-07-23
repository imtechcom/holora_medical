const db = require("../config/db");
const { analyzeImage } = require("../services/ai.service");
const { createNotification } = require("../utils/notification.util");


// [UC06] Yêu cầu phân tích AI từ hình ảnh
const requestAnalysis = (req, res) => {
  const userId = req.user.id;
  const { consultation_id, consultation_image_id } = req.body;
  console.log("[AI-Debug] Request Body:", req.body);

  if (!consultation_id || !consultation_image_id) {
    return res.status(400).json({ message: "Thiếu thông tin (consultation_id / consultation_image_id)! [v3-AI]" });
  }

  // 1. Kiểm tra hình ảnh đầu vào (Main Flow 3)
  const checkImgSql = "SELECT image_url FROM consultation_image WHERE id = ? AND consultation_id = ?";
  db.query(checkImgSql, [consultation_image_id, consultation_id], (err, imgResults) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!imgResults.length) {
      return res.status(404).json({ message: "Không tìm thấy hình ảnh tương ứng. (E1. Invalid Image)" });
    }

    const imageUrl = imgResults[0].image_url;

    // 2. Gửi request chuẩn bị phân tích (Main Flow 4)
    // Ghi vào bảng ai_analysis_request trạng thái 'queued' hoặc 'processing'
    const insertReqSql = `
      INSERT INTO ai_analysis_request 
        (consultation_id, consultation_image_id, requested_by, model_name, request_type, status)
      VALUES (?, ?, ?, 'Holora-Med-Vision-v1.2', 'image_analysis', 'processing')
    `;

    db.query(insertReqSql, [consultation_id, consultation_image_id, userId], (reqErr, rResult) => {
      if (reqErr) return res.status(500).json({ error: reqErr.message });

      const requestId = rResult.insertId;

      // 3. Trả về kết quả ngay lập tức cho Patient (Async flow A2)
      res.status(202).json({
        message: "Yêu cầu phân tích AI đã được gửi đi thành công.",
        analysis_request_id: requestId,
        status: "processing"
      });

      // ============================================
      // BACKGROUND ASYNC PROCESSING (Không chặn Request UI)
      // ============================================
      // 4. Gửi request đến External AI Service API (Thực tế là FastAPI Container)
      analyzeImage(imageUrl, consultation_id, consultation_image_id)
        .then((aiResponse) => {
          // 5. AI service xử lý & trả về -> Parse (Main Flow 5 & 6)
          const { confidenceScore, riskLevel, resultSummary, recommendation, rawResponse } = aiResponse;

          // Lưu kết quả vào báo cáo ai_analysis_result (Main Flow 7 & 8)
          const insertResSql = `
            INSERT INTO ai_analysis_result 
              (request_id, result_summary, result_payload, confidence_score, risk_level, recommendation)
            VALUES (?, ?, ?, ?, ?, ?)
          `;
          db.query(insertResSql, [
            requestId, resultSummary, rawResponse, 
            confidenceScore, riskLevel, recommendation
          ], (insErr) => {
             if (insErr) {
               console.error("Lỗi khi ghi data AI vào DB:", insErr);
               return; // Skip if internal DB error
             }

             // Cập nhật lại status của Yêu cầu ban đầu
             const updateReqSql = "UPDATE ai_analysis_request SET status = 'completed', completed_at = NOW() WHERE id = ?";
             db.query(updateReqSql, [requestId]);
          });
        })
        .catch((aiErr) => {
          // Xử lý luồng Exception Flow E3, E4: Update status failed
          console.error("AI External API Error:", aiErr.message);
          const updateErrSql = "UPDATE ai_analysis_request SET status = 'failed', error_message = ? WHERE id = ?";
          db.query(updateErrSql, [aiErr.message, requestId]);
        });
    });
  });
};

// Lấy thông tin AI Status mới nhất cho một Ca khám
const getAIAnalysisForConsultation = (req, res) => {
   const { consultation_id } = req.params;
   const role = req.user.role;

   let sql;
   if (role === 'patient') {
     // Bệnh nhân chỉ thấy kết quả được bác sĩ chia sẻ
     sql = `
       SELECT
         req.id as request_id, req.consultation_image_id, req.status as request_status, req.requested_at,
         img.image_url,
         res.result_summary, res.confidence_score, res.risk_level, res.recommendation, res.created_at as completed_at,
         res.doctor_review_status, res.shared_with_patient, res.review_note, res.result_payload
       FROM ai_analysis_request req
       INNER JOIN ai_analysis_result res ON req.id = res.request_id AND res.shared_with_patient = 1
       LEFT JOIN consultation_image img ON req.consultation_image_id = img.id
       WHERE req.consultation_id = ?
       ORDER BY req.requested_at DESC
     `;
   } else {
     // Bác sĩ / admin thấy tất cả + trạng thái đánh giá
     sql = `
       SELECT
         req.id as request_id, req.consultation_image_id, req.status as request_status, req.requested_at,
         req.error_message, img.image_url,
         res.result_summary, res.confidence_score, res.risk_level, res.recommendation, res.created_at as completed_at,
         res.doctor_review_status, res.shared_with_patient, res.review_note, res.result_payload
       FROM ai_analysis_request req
       LEFT JOIN ai_analysis_result res ON req.id = res.request_id
       LEFT JOIN consultation_image img ON req.consultation_image_id = img.id
       WHERE req.consultation_id = ?
       ORDER BY req.requested_at DESC
     `;
   }

   db.query(sql, [consultation_id], (err, results) => {
     // Nếu query lỗi (ví dụ: chưa chạy migration), trả mảng rỗng thay vì crash
     if (err) {
       console.error('getAIAnalysisForConsultation error:', err.sqlMessage || err.message);
       return res.json({ data: [] });
     }
     return res.json({ data: results });
   });
};

// Bác sĩ đánh giá kết quả AI và kiểm soát quyền xem của bệnh nhân
const reviewAIResult = (req, res) => {
  const userId = req.user.id;
  const { requestId } = req.params;
  const { review_status, review_note } = req.body;

  const VALID_STATUSES = ['pending_review', 'approved', 'approved_watch', 'not_standard', 'revoked'];
  if (!review_status || !VALID_STATUSES.includes(review_status)) {
    return res.status(400).json({ message: "Trạng thái đánh giá không hợp lệ." });
  }

  const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
  db.query("SELECT id FROM doctor WHERE user_id = ? LIMIT 1", [userId], (err, dResults) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!dResults.length && !isAdmin) {
      return res.status(403).json({ message: "Chỉ bác sĩ mới có quyền đánh giá kết quả AI." });
    }

    const doctorId = dResults.length ? dResults[0].id : null;
    const sharedWithPatient = ['approved', 'approved_watch'].includes(review_status) ? 1 : 0;

    const updateSql = `
      UPDATE ai_analysis_result
      SET doctor_review_status = ?, shared_with_patient = ?, review_note = ?,
          reviewed_by_doctor_id = ?, reviewed_at = NOW()
      WHERE request_id = ?
    `;
    db.query(updateSql, [review_status, sharedWithPatient, review_note || null, doctorId, requestId], (err2, result) => {
      if (err2) return res.status(500).json({ error: err2.message });
      if (result.affectedRows === 0) return res.status(404).json({ message: "Không tìm thấy kết quả AI cần cập nhật." });

      // Gửi thông báo cho bệnh nhân khi bác sĩ chia sẻ kết quả AI
      if (sharedWithPatient) {
        const patientUserSql = `
          SELECT p.user_id
          FROM ai_analysis_request req
          JOIN consultation c ON c.id = req.consultation_id
          JOIN patient p ON p.id = c.patient_id
          WHERE req.id = ?
          LIMIT 1
        `;
        db.query(patientUserSql, [requestId], (pErr, pRows) => {
          if (pErr || !pRows.length) return; // silent — không ảnh hưởng response đã gửi
          const patientUserId = pRows[0].user_id;
          createNotification(db, {
            userId:  patientUserId,
            type:    'ai_result_shared',
            title:   'Bác sĩ vừa chia sẻ kết quả phân tích AI với bạn',
            body:    review_note
              ? `Ghi chú của bác sĩ: ${review_note}`
              : 'Hãy vào xem chi tiết tư vấn để xem kết quả AI được chia sẻ.',
            link:    `/patient/consultations`, // frontend tự hiển thị
          });
        });
      }

      return res.json({ message: "Đã lưu đánh giá kết quả AI.", shared_with_patient: sharedWithPatient });
    });
  });
};


module.exports = {
  requestAnalysis,
  getAIAnalysisForConsultation,
  reviewAIResult,
};
