const db = require("../config/db");
const { logAudit } = require("../utils/audit.util");

const MAX_IMAGE_LIMIT = 3; // Giới hạn tối đa số ảnh/ca tư vấn
const MAX_RESPONSE_ATTACHMENTS = 5;

const parseBoolean = (value) => value === true || value === 1 || value === "1" || value === "true";

const parseJsonArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [value];
  } catch {
    return [value];
  }
};

const normalizeResponseAttachments = (req) => {
  if (Array.isArray(req.files) && req.files.length > 0) {
    return req.files.map((file) => ({
      image_url: `${req.protocol}://${req.get("host")}/public/uploads/${file.filename}`,
      file_name: file.originalname,
      mime_type: file.mimetype,
      file_size: file.size,
    }));
  }

  return parseJsonArray(req.body?.attachments)
    .map((item) => {
      if (!item) return null;
      if (typeof item === "string") {
        return { image_url: item };
      }
      if (typeof item === "object" && item.image_url) {
        return {
          image_url: item.image_url,
          file_name: item.file_name || null,
          mime_type: item.mime_type || null,
          file_size: item.file_size || null,
        };
      }
      return null;
    })
    .filter(Boolean);
};

// Bệnh nhân gửi yêu cầu tư vấn mới (UC04)
const createConsultation = (req, res) => {
  const userId = req.user.id;
  const { chief_complaint, symptoms, attachments, doctor_id, appointment_id } = req.body;

  if (!chief_complaint || !symptoms) {
    return res.status(400).json({ message: "Vui lòng nhập lý do khám và triệu chứng." });
  }

  // Kiểm tra giới hạn số ảnh
  if (attachments && Array.isArray(attachments) && attachments.length > MAX_IMAGE_LIMIT) {
    return res.status(400).json({
      message: `Chỉ được gửi tối đa ${MAX_IMAGE_LIMIT} ảnh mỗi ca tư vấn.`,
      code: "IMAGE_LIMIT_EXCEEDED",
    });
  }

  // Lấy patient_id từ user_id
  const getPatientSql = "SELECT id FROM patient WHERE user_id = ? LIMIT 1";
  db.query(getPatientSql, [userId], (err, pResults) => {
    if (err) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: err.message });
    if (!pResults.length) return res.status(404).json({ message: "Không tìm thấy hồ sơ bệnh nhân cho người dùng này." });
    
    const patientId = pResults[0].id;
    const assignedDoctorId = doctor_id ? Number(doctor_id) : null;
    const appointmentId = appointment_id ? Number(appointment_id) : null;

    // Insert vào bảng consultation
    const insertConsultationSql = `
      INSERT INTO consultation (patient_id, doctor_id, appointment_id, chief_complaint, symptoms, status, priority, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, 'pending', 'normal', NOW(), NOW())
    `;
    
    db.query(insertConsultationSql, [patientId, assignedDoctorId, appointmentId, chief_complaint, symptoms], (insertErr, cResult) => {
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

      logAudit(req, "CONSULTATION_CREATE", "consultation", consultationId, { doctor_id: assignedDoctorId });
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
        c.id, c.chief_complaint, c.symptoms, c.status, c.priority, c.created_at, c.started_at, c.completed_at,
        p.full_name as patient_name, p.gender, p.date_of_birth,
        d.full_name as doctor_name, d.doctor_code,
        (SELECT COUNT(*) FROM consultation_response cr WHERE cr.consultation_id = c.id) as response_count
      FROM consultation c
      JOIN patient p ON c.patient_id = p.id
      LEFT JOIN doctor d ON c.doctor_id = d.id
      ORDER BY 
        CASE c.status WHEN 'pending' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END,
        c.created_at DESC
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
         OR (c.doctor_id = ? AND c.status IN ('pending', 'in_progress', 'completed'))
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
    const imgSql = `
      SELECT id, image_url, image_type, response_id, uploaded_by, caption, file_name, mime_type, file_size, created_at
      FROM consultation_image
      WHERE consultation_id = ? AND response_id IS NULL
      ORDER BY created_at ASC
    `;
    db.query(imgSql, [id], (imgErr, imgResults) => {
      if (imgErr) console.error(imgErr);
      consultation.images = imgResults || [];

      // Lấy phản hồi (lịch sử chat/chẩn đoán)
      const respSql = `
        SELECT
          cr.*,
          u.full_name as responder_name,
          COALESCE(
            (
              SELECT r.code
              FROM user_role ur
              JOIN role r ON ur.role_id = r.id
              WHERE ur.user_id = cr.responder_user_id
              ORDER BY ur.id ASC
              LIMIT 1
            ),
            'unknown'
          ) as responder_role
        FROM consultation_response cr
        JOIN users u ON cr.responder_user_id = u.id
        WHERE cr.consultation_id = ?
        ORDER BY cr.created_at ASC
      `;
      db.query(respSql, [id], (respErr, respResults) => {
        if (respErr) console.error(respErr);
        const responseImageSql = `
          SELECT id, consultation_id, response_id, uploaded_by, image_url, image_type, caption, file_name, mime_type, file_size, created_at
          FROM consultation_image
          WHERE consultation_id = ? AND response_id IS NOT NULL
          ORDER BY created_at ASC
        `;

        db.query(responseImageSql, [id], (responseImageErr, responseImageResults) => {
          if (responseImageErr) console.error(responseImageErr);

          const responseImagesById = (responseImageResults || []).reduce((acc, image) => {
            const key = String(image.response_id);
            if (!acc[key]) acc[key] = [];
            acc[key].push(image);
            return acc;
          }, {});

          consultation.responses = (respResults || []).map((response) => ({
            ...response,
            attachments: responseImagesById[String(response.id)] || [],
          }));

          return res.json({
            message: "Lấy chi tiết thành công",
            data: consultation,
          });
        });
      });
    });
  });
};

// Bác sĩ trả lời tư vấn (UC14)
const addConsultationResponse = (req, res) => {
  const userId = req.user.id;
  const { id } = req.params; // consultation_id
  const body = req.body || {};
  const { content, response_type, complete } = body;
  const attachments = normalizeResponseAttachments(req);
  const hasContent = typeof content === "string" && content.trim().length > 0;
  const completeFlag = parseBoolean(complete);

  if (!hasContent && attachments.length === 0) {
    return res.status(400).json({ message: "Vui lòng nhập nội dung hoặc đính kèm hình ảnh." });
  }

  if (attachments.length > MAX_RESPONSE_ATTACHMENTS) {
    return res.status(400).json({
      message: `Chỉ được gửi tối đa ${MAX_RESPONSE_ATTACHMENTS} hình ảnh trong một phản hồi.`,
      code: "RESPONSE_IMAGE_LIMIT_EXCEEDED",
    });
  }

  // Validate response_type - only allow known types, default to 'message'
  const VALID_RESPONSE_TYPES = ['message', 'diagnosis', 'prescription', 'recommendation', 'prescription_note', 'follow_up'];
  const finalResponseType = (response_type && VALID_RESPONSE_TYPES.includes(response_type)) ? response_type : 'message';
  const finalContent = hasContent ? content.trim() : "";

  // Lấy 1 connection cố định từ pool để đảm bảo transaction toàn vẹn
  db.getConnection((connErr, connection) => {
    if (connErr) return res.status(500).json({ message: "Lỗi kết nối cơ sở dữ liệu", error: connErr.message });

    // Nếu là bác sĩ, ta lấy doctor_id để update người trực tiếp phụ trách ca này
    connection.query("SELECT id FROM doctor WHERE user_id = ? LIMIT 1", [userId], (err, dResults) => {
      if (err) {
        connection.release();
        return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: err.message });
      }

      // Lưu ý: User có thể là bệnh nhân rep lại bác sĩ, lúc này doctor_id sẽ ko có
      const isDoctor = dResults.length > 0;
      const doctorId = isDoctor ? dResults[0].id : null;
      const newStatus = completeFlag ? 'completed' : 'in_progress';

      connection.beginTransaction((txErr) => {
        if (txErr) {
          connection.release();
          return res.status(500).json({ error: txErr.message });
        }

        // Cập nhật trạng thái Consultation
        let updateSql;
        let updateParams;

        if (isDoctor) {
          // Gán ca này cho bác sĩ này nếu trước đây đang pending
          updateSql = completeFlag
            ? `UPDATE consultation SET status = ?, doctor_id = COALESCE(doctor_id, ?), completed_at = NOW(), updated_at = NOW() WHERE id = ?`
            : `UPDATE consultation SET status = ?, doctor_id = COALESCE(doctor_id, ?), started_at = COALESCE(started_at, NOW()), updated_at = NOW() WHERE id = ?`;
          updateParams = [newStatus, doctorId, id];
        } else {
          // Bệnh nhân tự trả lời, không cần update doctor_id
          updateSql = `UPDATE consultation SET updated_at = NOW() WHERE id = ?`;
          updateParams = [id];
        }

        connection.query(updateSql, updateParams, (updErr) => {
          if (updErr) {
            return connection.rollback(() => {
              connection.release();
              res.status(500).json({ error: updErr.message });
            });
          }

          // Insert nội dung phản hồi
          const insertRespSql = `
            INSERT INTO consultation_response (consultation_id, responder_user_id, response_type, content, is_from_ai, created_at, updated_at)
            VALUES (?, ?, ?, ?, 0, NOW(), NOW())
          `;
          connection.query(insertRespSql, [id, userId, finalResponseType, finalContent], (insErr, result) => {
            if (insErr) {
              return connection.rollback(() => {
                connection.release();
                res.status(500).json({ error: insErr.message });
              });
            }

            const responseId = result.insertId;

            const commitResponse = () => {
              connection.commit((commitErr) => {
                connection.release();
                if (commitErr) {
                  return res.status(500).json({ error: commitErr.message });
                }
                logAudit(req, "CONSULTATION_RESPONSE", "consultation", Number(id), {
                  response_type: finalResponseType,
                  complete: completeFlag,
                  attachments: attachments.length,
                });
                res.status(201).json({
                  message: "Đã thêm phản hồi",
                  response_id: responseId,
                  attachments_count: attachments.length,
                });
              });
            };

            if (attachments.length === 0) {
              commitResponse();
              return;
            }

            const insertImageSql = `
              INSERT INTO consultation_image (consultation_id, uploaded_by, response_id, image_url, image_type, created_at)
              VALUES ?
            `;
            const imageValues = attachments.map((attachment) => [
              Number(id),
              userId,
              responseId,
              attachment.image_url,
              'other',
              new Date(),
            ]);

            connection.query(insertImageSql, [imageValues], (imgErr) => {
              if (imgErr) {
                return connection.rollback(() => {
                  connection.release();
                  res.status(500).json({ error: imgErr.message });
                });
              }

              commitResponse();
            });
          });
        });
      });
    });
  });
};

// Bệnh nhân xem lịch sử tư vấn của chính mình (UCxx)
const getPatientConsultations = (req, res) => {
  const userId = req.user.id;

  const getPatientSql = "SELECT id FROM patient WHERE user_id = ? LIMIT 1";
  db.query(getPatientSql, [userId], (err, pResults) => {
    if (err) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: err.message });
    if (!pResults.length) return res.status(403).json({ message: "Không tìm thấy hồ sơ bệnh nhân." });

    const patientId = pResults[0].id;

    const sql = `
      SELECT 
        c.id, c.chief_complaint, c.status, c.priority, c.created_at,
        d.full_name as doctor_name
      FROM consultation c
      LEFT JOIN doctor d ON c.doctor_id = d.id
      WHERE c.patient_id = ?
      ORDER BY c.created_at DESC
    `;

    db.query(sql, [patientId], (err, results) => {
      if (err) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: err.message });
      
      return res.json({
        message: "Lấy lịch sử tư vấn thành công",
        data: results
      });
    });
  });
};

// Bác sĩ mở lại ca tư vấn đã hoàn thành (chuyển từ completed → in_progress)
const reopenConsultation = (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  // Chỉ bác sĩ hoặc admin mới được mở lại
  db.query(`SELECT id FROM doctor WHERE user_id = ? LIMIT 1`, [userId], (err, dResults) => {
    if (err) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: err.message });

    const isDoctor = dResults.length > 0;
    const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
    if (!isDoctor && !isAdmin) {
      return res.status(403).json({ message: "Chỉ bác sĩ mới có quyền mở lại ca tư vấn." });
    }

    // Kiểm tra ca có tồn tại và đang ở trạng thái completed không
    db.query(`SELECT id, status FROM consultation WHERE id = ? LIMIT 1`, [id], (err2, cResults) => {
      if (err2) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: err2.message });
      if (!cResults.length) return res.status(404).json({ message: "Không tìm thấy ca tư vấn." });
      if (cResults[0].status !== 'completed') {
        return res.status(400).json({ message: "Chỉ có thể mở lại ca đã hoàn thành." });
      }

      const sql = `UPDATE consultation SET status = 'in_progress', completed_at = NULL, updated_at = NOW() WHERE id = ?`;
      db.query(sql, [id], (err3) => {
        if (err3) return res.status(500).json({ message: "Lỗi cập nhật trạng thái", error: err3.message });
        logAudit(req, "CONSULTATION_REOPEN", "consultation", Number(id));
        return res.json({ message: "Đã mở lại ca tư vấn thành công." });
      });
    });
  });
};

// Clinic Owner: Lấy tất cả tư vấn thuộc bác sĩ trong chi nhánh của owner
const getOwnerConsultations = (req, res) => {
  const userId = req.user.id;
  const { status, priority, start_date, end_date, search, branch_id, doctor_id } = req.query;

  let query = `
    SELECT DISTINCT
      c.id, c.chief_complaint, c.symptoms, c.status, c.priority,
      c.created_at, c.started_at, c.completed_at,
      p.full_name AS patient_name, p.gender, p.date_of_birth,
      d.full_name AS doctor_name, d.doctor_code,
      (SELECT COUNT(*) FROM consultation_response cr WHERE cr.consultation_id = c.id) AS response_count,
      GROUP_CONCAT(DISTINCT b.name ORDER BY b.name SEPARATOR ', ') AS branch_names
    FROM consultation c
    JOIN patient p ON c.patient_id = p.id
    INNER JOIN doctor d ON c.doctor_id = d.id
    INNER JOIN doctor_branch db ON db.doctor_id = d.id AND db.deleted_at IS NULL
    INNER JOIN branch b ON b.id = db.branch_id AND b.owner_user_id = ? AND b.deleted_at IS NULL
    WHERE 1=1
  `;
  const params = [userId];

  if (status) {
    query += ' AND c.status = ?';
    params.push(status);
  }
  if (priority) {
    query += ' AND c.priority = ?';
    params.push(priority);
  }
  if (start_date) {
    query += ' AND DATE(c.created_at) >= ?';
    params.push(start_date);
  }
  if (end_date) {
    query += ' AND DATE(c.created_at) <= ?';
    params.push(end_date);
  }
  if (branch_id) {
    query += ' AND b.id = ?';
    params.push(branch_id);
  }
  if (doctor_id) {
    query += ' AND c.doctor_id = ?';
    params.push(doctor_id);
  }
  if (search) {
    query += ' AND (p.full_name LIKE ? OR c.chief_complaint LIKE ? OR d.full_name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ` GROUP BY c.id
    ORDER BY
      CASE c.status WHEN 'pending' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END,
      c.created_at DESC`;

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ message: "Database error", error: err.message });
    return res.json({ message: "OK", data: results });
  });
};

// Bệnh nhân xóa ảnh (chỉ khi chưa có AI phân tích)
const deleteConsultationImage = (req, res) => {
  const userId = req.user.id;
  const { id: consultationId, imageId } = req.params;

  // 1. Xác minh consultation thuộc về bệnh nhân này
  const ownerSql = `
    SELECT c.id FROM consultation c
    JOIN patient p ON p.id = c.patient_id
    WHERE c.id = ? AND p.user_id = ? AND c.status = 'pending'
    LIMIT 1
  `;
  db.query(ownerSql, [consultationId, userId], (err, ownerRows) => {
    if (err) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: err.message });
    if (!ownerRows.length) {
      return res.status(403).json({
        message: "Không thể xóa ảnh: ca tư vấn không tồn tại, không thuộc về bạn, hoặc đã được xử lý.",
      });
    }

    // 2. Kiểm tra ảnh có bị AI phân tích chưa
    const aiCheckSql = `
      SELECT id FROM ai_analysis_request
      WHERE consultation_image_id = ?
      LIMIT 1
    `;
    db.query(aiCheckSql, [imageId], (aiErr, aiRows) => {
      if (aiErr) return res.status(500).json({ message: "Lỗi kiểm tra AI", error: aiErr.message });
      if (aiRows.length > 0) {
        return res.status(409).json({
          message: "Không thể xóa: ảnh này đã được gửi đi phân tích AI. Hãy nhắn bác sĩ qua chat để thêm ảnh mới.",
          code: "IMAGE_ALREADY_ANALYZED",
        });
      }

      // 3. Xóa ảnh
      const deleteSql = "DELETE FROM consultation_image WHERE id = ? AND consultation_id = ?";
      db.query(deleteSql, [imageId, consultationId], (delErr, delResult) => {
        if (delErr) return res.status(500).json({ message: "Lỗi xóa ảnh", error: delErr.message });
        if (delResult.affectedRows === 0) {
          return res.status(404).json({ message: "Không tìm thấy ảnh này trong ca tư vấn." });
        }
        logAudit(req, "CONSULTATION_IMAGE_DELETE", "consultation_image", imageId, { consultationId });
        return res.status(200).json({ message: "Đã xóa ảnh thành công." });
      });
    });
  });
};

module.exports = {
  createConsultation,
  getDoctorConsultations,
  getConsultationDetails,
  addConsultationResponse,
  getPatientConsultations,
  reopenConsultation,
  getOwnerConsultations,
  deleteConsultationImage,
};

