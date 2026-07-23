const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Tạo thư mục nếu chưa có
const uploadDir = path.join(__dirname, "../../public/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình Multer lưu đĩa cứng
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Đặt tên ngẫu nhiên: time + số random + phần mở rộng
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// Bộ lọc file chỉ cho ảnh và pdf
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf/;
  const extMatch = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeMatch = allowedTypes.test(file.mimetype);

  if (extMatch && mimeMatch) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ hỗ trợ file hình ảnh (JPG, PNG, GIF, WEBP) hoặc PDF!"), false);
  }
};

const uploadConfig = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter,
});


// API Controller
const uploadFiles = (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Không có file nào được tải lên." });
    }

    // Trả về mảng url mà client có thể truy cập được
    // URL sẽ có định dạng: http://localhost:5000/public/uploads/... (đính kèm biến môi trường nếu cần)
    const protocol = req.protocol;
    const host = req.get("host"); // ex: localhost:5000

    const urls = req.files.map(
      (file) => `${protocol}://${host}/public/uploads/${file.filename}`
    );

    return res.status(200).json({
      message: "Tải lên thành công!",
      urls: urls,
    });
  } catch (error) {
    console.error("Lỗi upload:", error);
    return res.status(500).json({ message: "Lỗi Server nội bộ", error: error.message });
  }
};

module.exports = {
  uploadConfig,
  uploadFiles,
};
