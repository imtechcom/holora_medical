const express = require("express");
const router = express.Router();
const consultationController = require("../controllers/consultation.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

// Tất cả endpoints đều phải đăng nhập
router.use(authenticateToken);

// Patient -> Xem hoặc tạo yêu cầu
router.post("/", consultationController.createConsultation);

// Doctor -> Xem danh sách chờ
router.get("/doctor-requests", consultationController.getDoctorConsultations);

// Patient -> Xem lịch sử cùa mình
router.get("/my-history", consultationController.getPatientConsultations);

// Lấy chi tiết 1 ca tư vấn (Bệnh nhân và Bác sĩ dùng chung)
router.get("/:id", consultationController.getConsultationDetails);

// Trả lời phản hồi / Chẩn đoán (Bệnh nhân và Bác sĩ dùng chung)
router.post("/:id/responses", consultationController.addConsultationResponse);

// Bác sĩ mở lại ca tư vấn đã hoàn thành
router.patch("/:id/reopen", consultationController.reopenConsultation);

module.exports = router;
