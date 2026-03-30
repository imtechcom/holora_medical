const db = require("../config/db");
const { mockAnalyzeImageAPI } = require("../services/ai.service");

// [UC06] Yêu cầu phân tích AI từ hình ảnh
const requestAnalysis = (req, res) => {
  const userId = req.user.id;
  const { consultation_id, consultation_image_id } = req.body;

  if (!consultation_id || !consultation_image_id) {
    return res.status(400).json({ message: "Thiếu thông tin (consultation_id / consultation_image_id)!" });
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
      // 4. Gửi request đến External AI Service API
      mockAnalyzeImageAPI(imageUrl)
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

   const sql = `
     SELECT 
       req.id as request_id, req.consultation_image_id, req.status as request_status, req.requested_at,
       req.error_message, img.image_url,
       res.result_summary, res.confidence_score, res.risk_level, res.recommendation, res.created_at as completed_at
     FROM ai_analysis_request req
     LEFT JOIN ai_analysis_result res ON req.id = res.request_id
     LEFT JOIN consultation_image img ON req.consultation_image_id = img.id
     WHERE req.consultation_id = ?
     ORDER BY req.created_at DESC
   `;

   db.query(sql, [consultation_id], (err, results) => {
     if (err) return res.status(500).json({ error: err.message });
     // Có thể trả null, hoặc list các AI requests
     return res.json({ data: results });
   });
};

module.exports = {
  requestAnalysis,
  getAIAnalysisForConsultation,
};
