const express = require('express');
const router = express.Router();
const emrController = require('../controllers/emr.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.use(authenticateToken);

// Tạo hồ sơ EMR mới
router.post('/', emrController.createEmrRecord);
// Lấy danh sách EMR theo bệnh nhân
router.get('/patient/:patient_id', emrController.getEmrRecordsByPatient);
// Lấy chi tiết EMR
router.get('/:id', emrController.getEmrRecordById);
// Cập nhật EMR
router.put('/:id', emrController.updateEmrRecord);
// Xóa EMR
router.delete('/:id', emrController.deleteEmrRecord);

module.exports = router;
