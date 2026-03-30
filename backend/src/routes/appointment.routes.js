const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointment.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { authorizeRole } = require('../middleware/role.middleware');

// Public Search Tool (Guest cũng có thể tra giờ rảnh của Bác sĩ nhưng khi đặt phải Login)
router.get('/available-slots', appointmentController.getAvailableSlots);

// Các thao tác dưới đây yêu cầu Đăng Nhập
router.use(authenticateToken);

// Bệnh nhân đặt lịch
router.post('/', authorizeRole('patient'), appointmentController.bookAppointment);

// Lấy lịch hẹn của mình (Nếu Patient thì thấy lịch chữa, nếu Doctor thì thấy lịch làm việc)
router.get('/', appointmentController.getMyAppointments);

// Cập nhật trạng thái (Bác sĩ/Admin duyệt ca, hoàn thành ca, huỷ ca)
router.put('/:id/status', authorizeRole('super_admin', 'admin', 'doctor'), appointmentController.updateAppointmentStatus);

module.exports = router;
