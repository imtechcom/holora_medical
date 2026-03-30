const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/schedule.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { authorizeRole } = require('../middleware/role.middleware');

// Mọi tác vụ phải có token
router.use(authenticateToken);

// Cả Bệnh nhân và Bác sĩ đều có thể xem ca làm việc
router.get('/', scheduleController.getDoctorSchedules);

// Chỉ Admin và Bác sĩ mới có quyền vạch lịch rảnh
router.post('/', authorizeRole('super_admin', 'admin', 'doctor'), scheduleController.createSchedule);
router.put('/:id', authorizeRole('super_admin', 'admin', 'doctor'), scheduleController.updateSchedule);
router.delete('/:id', authorizeRole('super_admin', 'admin', 'doctor'), scheduleController.deleteSchedule);

module.exports = router;
