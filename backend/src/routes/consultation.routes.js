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

// Lấy chi tiết 1 ca tư vấn (Bệnh nhân và Bác sĩ dùng chung)
router.get("/:id", consultationController.getConsultationDetails);

// Trả lời phản hồi / Chẩn đoán (Bệnh nhân và Bác sĩ dùng chung)
router.post("/:id/responses", consultationController.addConsultationResponse);

module.exports = router;
