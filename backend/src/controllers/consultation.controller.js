const db = require("../config/db");

// Bệnh nhân gửi yêu cầu tư vấn mới (UC04)
const createConsultation = (req, res) => {
  const userId = req.user.id;
  const { chief_complaint, symptoms, attachments } = req.body;

  if (!chief_complaint || !symptoms) {
    return res.status(400).json({ message: "Vui lòng nhập lý do khám và triệu chứng." });
  }

  // Lấy patient_id từ user_id
  const getPatientSql = "SELECT id FROM patient WHERE user_id = ? LIMIT 1";
  db.query(getPatientSql, [userId], (err, pResults) => {
    if (err) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: err.message });
    if (!pResults.length) return res.status(404).json({ message: "Không tìm thấy hồ sơ bệnh nhân cho người dùng này." });
    
    const patientId = pResults[0].id;

    // Insert vào bảng consultation
    const insertConsultationSql = `
      INSERT INTO consultation (patient_id, chief_complaint, symptoms, status, priority, created_at, updated_at) 
      VALUES (?, ?, ?, 'pending', 'normal', NOW(), NOW())
    `;
    
    db.query(insertConsultationSql, [patientId, chief_complaint, symptoms], (insertErr, cResult) => {
      if (insertErr) return res.status(500).json({ message: "Lỗi tạo tư vấn", error: insertErr.message });
      
      const consultationId = cResult.insertId;

      // Nếu có hình ảnh đính kèm (URL dạng mảng)
      if (attachments && Array.isArray(attachments) && attachments.length > 0) {
        const insertImageSql = `
          INSERT INTO consultation_image (consultation_id, uploaded_by, image_url, image_type, created_at) 
          VALUES ?
        `;
        // map data để insert nhiều hàng cùng lúc trong mysql2
        const imageValues = attachments.map(url => [consultationId, userId, url, 'symptom', new Date()]);
        
        db.query(insertImageSql, [imageValues], (imgErr) => {
           if(imgErr) console.error("Lỗi insert hình ảnh:", imgErr);
        });
      }

      return res.status(201).json({ 
        message: "Gửi yêu cầu tư vấn thành công.", 
        consultation_id: consultationId 
      });
    });
  });
};

// Bác sĩ lấy danh sách yêu cầu cần duyệt (UC12)
const getDoctorConsultations = (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  // Bản chất Admin có quyền xem tất cả, khỏi cần lấy hồ sơ bác sĩ
  if (role === 'admin' || role === 'super_admin') {
    const adminSql = `
      SELECT 
        c.id, c.chief_complaint, c.status, c.priority, c.created_at,
        p.full_name as patient_name, p.gender, p.date_of_birth
      FROM consultation c
      JOIN patient p ON c.patient_id = p.id
      ORDER BY c.created_at DESC
    `;
    db.query(adminSql, (err, results) => {
      if (err) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: err.message });
      return res.json({ message: "Lấy danh sách thành công", data: results });
    });
    return;
  }

  // Lấy doctor_id từ user_id đối với Bác sĩ
  const getDoctorSql = "SELECT id FROM doctor WHERE user_id = ? LIMIT 1";
  
  db.query(getDoctorSql, [userId], (err, dResults) => {
    if (err) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: err.message });
    if (!dResults.length) return res.status(403).json({ message: "Tài khoản của bạn chưa được liên kết hồ sơ bác sĩ." });

    const doctorId = dResults[0].id;

    // Lấy danh sách ca đang pending hoặc đang được chính bác sĩ này xử lý
    const sql = `
      SELECT 
        c.id, c.chief_complaint, c.status, c.priority, c.created_at,
        p.full_name as patient_name, p.gender, p.date_of_birth
      FROM consultation c
      JOIN patient p ON c.patient_id = p.id
      WHERE (c.status = 'pending' AND c.doctor_id IS NULL) 
         OR (c.status = 'in_progress' AND c.doctor_id = ?)
      ORDER BY c.created_at DESC
    `;

    db.query(sql, [doctorId], (err, results) => {
      if (err) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: err.message });
      
      return res.json({
        message: "Lấy danh sách thành công",
        data: results
      });
    });
  });
};

// Xem chi tiết một ca tư vấn (Dùng cho cả bác sĩ và bệnh nhân) (UC13)
const getConsultationDetails = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT 
      c.*,
      p.full_name as patient_name, p.gender, p.date_of_birth, p.medical_history, p.allergies,
      d.full_name as doctor_name
    FROM consultation c
    JOIN patient p ON c.patient_id = p.id
    LEFT JOIN doctor d ON c.doctor_id = d.id
    WHERE c.id = ?
  `;

  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: err.message });
    if (!results.length) return res.status(404).json({ message: "Không tìm thấy yêu cầu tư vấn." });

    const consultation = results[0];

    // Lấy hình ảnh liên quan
    const imgSql = "SELECT image_url, image_type FROM consultation_image WHERE consultation_id = ?";
    db.query(imgSql, [id], (imgErr, imgResults) => {
      if (imgErr) console.error(imgErr);
      consultation.images = imgResults || [];

      // Lấy phản hồi (lịch sử chat/chẩn đoán)
      const respSql = `
        SELECT cr.*, u.full_name as responder_name, r.code as responder_role
        FROM consultation_response cr
        JOIN users u ON cr.responder_user_id = u.id
        JOIN user_role ur ON u.id = ur.user_id
        JOIN role r ON ur.role_id = r.id
        WHERE cr.consultation_id = ?
        ORDER BY cr.created_at ASC
      `;
      db.query(respSql, [id], (respErr, respResults) => {
        if (respErr) console.error(respErr);
        consultation.responses = respResults || [];

        return res.json({
          message: "Lấy chi tiết thành công",
          data: consultation
        });
      });
    });
  });
};

// Bác sĩ trả lời tư vấn (UC14)
const addConsultationResponse = (req, res) => {
  const userId = req.user.id;
  const { id } = req.params; // consultation_id
  const { content, response_type, complete } = req.body;

  if (!content) {
    return res.status(400).json({ message: "Nội dung phản hồi không được để trống." });
  }

  // Nếu là bác sĩ, ta lấy doctor_id để update người trực tiếp phụ trách ca này
  const getDoctorSql = "SELECT id FROM doctor WHERE user_id = ? LIMIT 1";
  db.query(getDoctorSql, [userId], (err, dResults) => {
    if (err) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: err.message });
    
    // Lưu ý: User có thể là bệnh nhân rep lại bác sĩ, lúc này doctor_id sẽ ko có
    const isDoctor = dResults.length > 0;
    const doctorId = isDoctor ? dResults[0].id : null;

    const newStatus = complete ? 'completed' : 'in_progress';
    const finalResponseType = response_type || 'message';

    db.beginTransaction((err) => {
      if (err) return res.status(500).json({ error: err.message });

      // Cập nhật trạng thái Consultation
      let updateSql;
      let updateParams;

      if (isDoctor) {
        // Gán ca này cho bác sĩ này nếu trước đây đang pending
        updateSql = `
          UPDATE consultation 
          SET status = ?, doctor_id = COALESCE(doctor_id, ?), updated_at = NOW() 
          ${complete ? ', completed_at = NOW()' : ", started_at = COALESCE(started_at, NOW())"}
          WHERE id = ?
        `;
        updateParams = [newStatus, doctorId, id];
      } else {
        // Bệnh nhân tự trả lời, không cần update doctor_id
        updateSql = `
          UPDATE consultation 
          SET updated_at = NOW() 
          WHERE id = ?
        `;
        updateParams = [id];
      }

      db.query(updateSql, updateParams, (updErr) => {
        if (updErr) {
          db.rollback(() => res.status(500).json({ error: updErr.message }));
          return;
        }

        // Insert nội dung phản hồi
        const insertRespSql = `
          INSERT INTO consultation_response (consultation_id, responder_user_id, response_type, content, is_from_ai, created_at, updated_at)
          VALUES (?, ?, ?, ?, 0, NOW(), NOW())
        `;
        db.query(insertRespSql, [id, userId, finalResponseType, content], (insErr, result) => {
          if (insErr) {
            db.rollback(() => res.status(500).json({ error: insErr.message }));
            return;
          }

          db.commit((commitErr) => {
            if (commitErr) {
              db.rollback(() => res.status(500).json({ error: commitErr.message }));
              return;
            }
            res.status(201).json({ 
              message: "Đã thêm phản hồi", 
              response_id: result.insertId 
            });
          });
        });
      });
    });
  });
};

module.exports = {
  createConsultation,
  getDoctorConsultations,
  getConsultationDetails,
  addConsultationResponse
};
