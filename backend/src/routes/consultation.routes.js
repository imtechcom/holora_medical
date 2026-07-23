const express = require("express");
const router = express.Router();
const consultationController = require("../controllers/consultation.controller");
const { uploadConfig } = require("../controllers/upload.controller");
const { authenticateToken } = require("../middleware/auth.middleware");
const { authorizeRole } = require("../middleware/role.middleware");

// Tất cả endpoints đều phải đăng nhập
router.use(authenticateToken);

// Patient -> Xem hoặc tạo yêu cầu
router.post("/", consultationController.createConsultation);

// Doctor -> Xem danh sách chờ
router.get("/doctor-requests", consultationController.getDoctorConsultations);

// Clinic Owner -> Xem tất cả tư vấn thuộc chi nhánh
router.get("/owner/all", authorizeRole("clinic_owner"), consultationController.getOwnerConsultations);

// Patient -> Xem lịch sử cùa mình
router.get("/my-history", consultationController.getPatientConsultations);

// Lấy chi tiết 1 ca tư vấn (Bệnh nhân và Bác sĩ dùng chung)
router.get("/:id", consultationController.getConsultationDetails);

// Trả lời phản hồi / Chẩn đoán (Bệnh nhân và Bác sĩ dùng chung)
router.post("/:id/responses", uploadConfig.array("attachments", 5), consultationController.addConsultationResponse);

// Bác sĩ mở lại ca tư vấn đã hoàn thành
router.patch("/:id/reopen", consultationController.reopenConsultation);

// Bệnh nhân xóa ảnh (chỉ khi chưa có AI phân tích)
router.delete("/:id/images/:imageId", consultationController.deleteConsultationImage);

module.exports = router;

