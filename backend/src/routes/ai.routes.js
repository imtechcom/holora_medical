const express = require("express");
const router = express.Router();
const { requestAnalysis, getAIAnalysisForConsultation } = require("../controllers/ai.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

// Toàn quyền yêu cầu bảo mật token
router.use(authenticateToken);

// [UC06] Yêu cầu gọi API AI Model quét ảnh
router.post("/analyze", requestAnalysis);

// [UC07] Xem kết quả AI Model của một ca khám
router.get("/consultation/:consultation_id", getAIAnalysisForConsultation);

module.exports = router;
