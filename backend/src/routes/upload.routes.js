const express = require("express");
const router = express.Router();
const { uploadConfig, uploadFiles } = require("../controllers/upload.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

// Cần đăng nhập để tải ảnh
router.use(authenticateToken);

// Bắt nhiều file với field key là "attachments" (Tối đa 5 hình một lần)
router.post("/", uploadConfig.array("attachments", 5), uploadFiles);

module.exports = router;
