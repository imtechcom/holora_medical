const db = require('../config/db');

// --- HÀM HỖ TRỢ XỬ LÝ THỜI GIAN NHANH ---
const findPatientIdByUserId = (userId, callback) => {
  db.query('SELECT id FROM patient WHERE user_id = ? LIMIT 1', [userId], (err, rows) => {
    if (err) return callback(err, null);
    callback(null, rows.length ? rows[0].id : null);
  });
};

const findDoctorIdByUserId = (userId, callback) => {
  db.query('SELECT id FROM doctor WHERE user_id = ? LIMIT 1', [userId], (err, rows) => {
    if (err) return callback(err, null);
    callback(null, rows.length ? rows[0].id : null);
  });
};

const timeToMinutes = (timeStr) => {
  const [h, m] = timeStr.split(':');
  return parseInt(h) * 60 + parseInt(m);
};

const minutesToTime = (mins) => {
  const h = Math.floor(mins / 60).toString().padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

// [Thuật toán]: Tính toán Block rảnh rỗi cho Bệnh nhân
exports.getAvailableSlots = (req, res) => {
  const { doctor_id, date, duration_minutes = 30, branch_id } = req.query;

  if (!doctor_id || !date) {
    return res.status(400).json({ message: 'Missing doctor_id or date' });
  }

  const duration = parseInt(duration_minutes);

  const checkBranchCompatibility = (callback) => {
    if (!branch_id) {
      return callback();
    }

    db.query(
      `SELECT id FROM doctor_branch WHERE doctor_id = ? AND branch_id = ? AND deleted_at IS NULL LIMIT 1`,
      [doctor_id, branch_id],
      (branchErr, rows) => {
        if (branchErr) {
          return res.status(500).json({ message: 'Error checking doctor branch', error: branchErr.message });
        }

        if (!rows.length) {
          return res.status(400).json({ message: 'Doctor does not work at selected branch' });
        }

        return callback();
      }
    );
  };

  checkBranchCompatibility(() => {

  // 1. Lấy tất cả các ca (shifts) làm việc của bác sĩ trong ngày
  db.query(
    'SELECT start_time, end_time, slot_duration FROM doctor_schedule WHERE doctor_id = ? AND work_date = ? AND status = "active"',
    [doctor_id, date],
    (err, schedules) => {
      if (err) return res.status(500).json({ message: 'Error fetching schedule', error: err.message });
      if (!schedules.length) return res.json([]); // Bác sĩ không có ca làm việc hôm nay

      // 2. Lấy tất cả các ca đã được Đặt (Bao Nuôi) trong ngày đó
      db.query(
        `SELECT start_time, end_time FROM appointment 
         WHERE doctor_id = ? 
         AND DATE(start_time) = ? 
         AND status NOT IN ('cancelled', 'completed', 'no_show')`,
        [doctor_id, date],
        (err2, bookedAppointments) => {
          if (err2) return res.status(500).json({ message: 'Error fetching booked appointments', error: err2.message });

          // Mã hoá danh sách các thời điểm đã bị khoá
          const bookedIntervals = bookedAppointments.map(app => {
            // Lấy riêng phần giờ HH:mm để so sánh
            const startStr = new Date(app.start_time).toTimeString().substring(0, 5);
            const endStr = new Date(app.end_time).toTimeString().substring(0, 5);
            return {
              start: timeToMinutes(startStr),
              end: timeToMinutes(endStr)
            };
          });

          let availableStartTimes = [];

          // 3. Phân cắt Block Giờ Làm Việc
          schedules.forEach(shift => {
            const shiftStart = timeToMinutes(shift.start_time);
            const shiftEnd = timeToMinutes(shift.end_time);
            const slotDuration = shift.slot_duration || 30; // Block cơ sở: 30 phút

            // Chia ca từ start đến end thành các rãnh slot_duration
            for (let t = shiftStart; t + duration <= shiftEnd; t += slotDuration) {
              const proposedStart = t;
              const proposedEnd = t + duration; // Giả sử khách chọn dịch vụ dài `duration`

              // 4. Kiểm tra xem vùng [proposedStart, proposedEnd] có dẫm lên bookedIntervals không?
              let isConflict = false;
              for (let overlap of bookedIntervals) {
                // Công thức Trùng: (start_A < end_B) AND (end_A > start_B)
                if (proposedStart < overlap.end && proposedEnd > overlap.start) {
                  isConflict = true;
                  break;
                }
              }

              // Nếu không đụng chạm ai, đẩy vào danh sách trống!
              if (!isConflict) {
                availableStartTimes.push(minutesToTime(proposedStart));
              }
            }
          });

          res.json([...new Set(availableStartTimes)].sort()); // Loại bỏ trùng lặp và sắp xếp
        }
      );
    }
  );
  });
};

// Đặt Lịch (POST /appointments)
exports.bookAppointment = (req, res) => {
  if (req.user.role !== 'patient') {
    return res.status(403).json({ message: 'Only patients can book appointments.' });
  }

  findPatientIdByUserId(req.user.id, (err, patient_id) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!patient_id) return res.status(403).json({ message: 'Only patients can book appointments. Profile not found.' });
    _doBookAppointment(req, res, patient_id);
  });
};

const _doBookAppointment = (req, res, patient_id) => {
  const { doctor_id, specialty_id, branch_id, appointment_date, start_time, duration_minutes, reason, appointment_type } = req.body;

  if (!doctor_id || !branch_id || !appointment_date || !start_time || !duration_minutes) {
    return res.status(400).json({ message: 'Điền thiếu thông tin đặt lịch, bao gồm chi nhánh!' });
  }

  db.query(
    `SELECT id FROM doctor_branch WHERE doctor_id = ? AND branch_id = ? AND deleted_at IS NULL LIMIT 1`,
    [doctor_id, branch_id],
    (branchErr, branchRows) => {
      if (branchErr) {
        return res.status(500).json({ message: branchErr.message });
      }

      if (!branchRows.length) {
        return res.status(400).json({ message: 'Bác sĩ không làm việc tại chi nhánh đã chọn.' });
      }

      // Chuyển đối Start Time String ('08:00') sang Datetime thực tế
      const startDateTime = `${appointment_date} ${start_time}:00`;
      const endDateTimeMins = timeToMinutes(start_time) + parseInt(duration_minutes);
      const endDateTime = `${appointment_date} ${minutesToTime(endDateTimeMins)}:00`;

      // Kiểm tra chống Race-Condition (Lỡ 1s trước có ông đặt rồi)
      db.query(
        `SELECT id FROM appointment 
         WHERE doctor_id = ? AND status NOT IN ('cancelled', 'completed', 'no_show')
         AND (start_time < ? AND end_time > ?)`,
        [doctor_id, endDateTime, startDateTime],
        (err, overlaps) => {
          if (err) return res.status(500).json({ message: err.message });
          if (overlaps.length > 0) {
            return res.status(409).json({ message: 'Rất tiếc, khung giờ NÀY VỪA BỊ ĐẶT. Vui lòng chọn khung giờ khác.' });
          }

          // Khớp Slot thành công, tạo Order
          const appointment_code = 'APP' + Date.now().toString().substring(5);
          const query = `
            INSERT INTO appointment (patient_id, doctor_id, specialty_id, branch_id, appointment_code, appointment_date, start_time, end_time, appointment_type, reason, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')
          `;
          const params = [patient_id, doctor_id, specialty_id || null, branch_id, appointment_code, appointment_date, startDateTime, endDateTime, appointment_type || 'online', reason];

          db.query(query, params, (err2, result) => {
            if (err2) return res.status(500).json({ message: err2.message });
            res.status(201).json({ message: 'Đặt lịch thành công!', appointment_id: result.insertId });
          });
        }
      );
    }
  );
};

// Lấy lịch của Tôi
exports.getMyAppointments = (req, res) => {
  const { role, id: user_id } = req.user;

  let query = `
    SELECT a.*, 
           d.full_name as doctor_name, d.avatar_url as doctor_avatar, s.name as specialty_name,
           p.full_name as patient_name, p.phone as patient_phone,
           b.name as branch_name, b.code as branch_code
    FROM appointment a
    LEFT JOIN doctor d ON a.doctor_id = d.id
    LEFT JOIN specialty s ON d.specialty_id = s.id
    LEFT JOIN patient p ON a.patient_id = p.id
    LEFT JOIN branch b ON a.branch_id = b.id
    WHERE 1=1
  `;
  const params = [];

  const runQuery = (filterField, filterValue) => {
    if (filterField) {
      query += ` AND ${filterField} = ?`;
      params.push(filterValue);
    }
    query += ' ORDER BY a.appointment_date DESC, a.start_time DESC';
    db.query(query, params, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  };

  if (role === 'patient') {
    findPatientIdByUserId(user_id, (err, patient_id) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!patient_id) return res.status(403).json({ message: 'Patient profile not found.' });
      runQuery('a.patient_id', patient_id);
    });
  } else if (role === 'doctor') {
    findDoctorIdByUserId(user_id, (err, doctor_id) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!doctor_id) return res.status(403).json({ message: 'Doctor profile not found.' });
      runQuery('a.doctor_id', doctor_id);
    });
  } else {
    runQuery(null, null); // Admin lấy tất.
  }
};

// Cập nhật trạng thái
exports.updateAppointmentStatus = (req, res) => {
  const { id } = req.params;
  const { status, cancellation_reason } = req.body;
  
  db.query('UPDATE appointment SET status = ?, cancellation_reason = ? WHERE id = ?', 
  [status, cancellation_reason || null, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Đã cập nhật trạng thái ca khám!' });
  });
};

// Admin: Lấy TẤT CẢ lịch khám với filter (status, date range, search)
exports.getAllAppointmentsAdmin = (req, res) => {
  const { status, start_date, end_date, search } = req.query;

  let query = `
    SELECT a.*,
           d.full_name AS doctor_name, d.avatar_url AS doctor_avatar,
           s.name AS specialty_name,
           p.full_name AS patient_name, p.phone AS patient_phone,
           b.name AS branch_name, b.code AS branch_code
    FROM appointment a
    LEFT JOIN doctor d ON a.doctor_id = d.id
    LEFT JOIN specialty s ON d.specialty_id = s.id
    LEFT JOIN patient p ON a.patient_id = p.id
    LEFT JOIN branch b ON a.branch_id = b.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ' AND a.status = ?';
    params.push(status);
  }
  if (start_date) {
    query += ' AND a.appointment_date >= ?';
    params.push(start_date);
  }
  if (end_date) {
    query += ' AND a.appointment_date <= ?';
    params.push(end_date);
  }
  if (search) {
    query += ' AND (p.full_name LIKE ? OR a.appointment_code LIKE ? OR d.full_name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY a.appointment_date DESC, a.start_time DESC';

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// Lấy chi tiết lịch khám theo ID (Kèm verify quyền truy cập)
// Lấy tư vấn được liên kết với lịch hẹn
exports.getConsultationByAppointmentId = (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT c.id, c.status, c.chief_complaint, c.appointment_id, c.created_at
    FROM consultation c
    WHERE c.appointment_id = ?
    LIMIT 1
  `;
  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ message: "Lỗi cơ sở dữ liệu", error: err.message });
    if (!results.length) return res.status(404).json({ message: "Chưa có tư vấn liên kết với lịch hẹn này." });
    return res.json({ message: "OK", data: results[0] });
  });
};

exports.getAppointmentById = (req, res) => {
  const { id } = req.params;
  const { role, id: user_id } = req.user;

  const checkAndFetch = (patient_id, doctor_id) => {
    const query = `
      SELECT a.*, 
             d.full_name as doctor_name, d.avatar_url as doctor_avatar, s.name as specialty_name,
             p.full_name as patient_name, p.phone as patient_phone,
             b.name as branch_name, b.code as branch_code
      FROM appointment a
      LEFT JOIN doctor d ON a.doctor_id = d.id
      LEFT JOIN specialty s ON d.specialty_id = s.id
      LEFT JOIN patient p ON a.patient_id = p.id
      LEFT JOIN branch b ON a.branch_id = b.id
      WHERE a.id = ?
    `;

    db.query(query, [id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!results.length) return res.status(404).json({ message: 'Không tìm thấy lịch khám!' });

      const appointment = results[0];

      // Verify quyền: Chỉ Admin, Bác sĩ nhận ca, hoặc Bệnh nhân đặt ca mới được lấy thông tin.
      if (role === 'patient' && appointment.patient_id !== patient_id) {
        return res.status(403).json({ message: 'Bạn không có quyền truy cập Video Call của lịch hẹn này!' });
      }
      if (role === 'doctor' && appointment.doctor_id !== doctor_id) {
        return res.status(403).json({ message: 'Bạn không có quyền truy cập Video Call của lịch hẹn này!' });
      }

      res.json(appointment);
    });
  };

  if (role === 'patient') {
    findPatientIdByUserId(user_id, (err, patient_id) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!patient_id) return res.status(403).json({ message: 'Patient profile not found.' });
      checkAndFetch(patient_id, null);
    });
  } else if (role === 'doctor') {
    findDoctorIdByUserId(user_id, (err, doctor_id) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!doctor_id) return res.status(403).json({ message: 'Doctor profile not found.' });
      checkAndFetch(null, doctor_id);
    });
  } else {
    checkAndFetch(null, null); // Admin
  }
};
