const db = require('./db');

const initHoloraMind = () => {
  // Đồng bộ kiểu dữ liệu BIGINT UNSIGNED với hệ thống hiện tại
  const sqlChats = `
    CREATE TABLE IF NOT EXISTS holora_mind_chats (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT UNSIGNED NOT NULL,
      title VARCHAR(255) DEFAULT 'Cuộc trò chuyện mới',
      model_name VARCHAR(50) DEFAULT 'HoloraMind-v1',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      CONSTRAINT fk_holora_mind_chat_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  const sqlMessages = `
    CREATE TABLE IF NOT EXISTS holora_mind_messages (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      chat_id BIGINT UNSIGNED NOT NULL,
      role ENUM('user', 'assistant') NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_holora_mind_msg_chat FOREIGN KEY (chat_id) REFERENCES holora_mind_chats(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  console.log("Đang khởi tạo các bảng HoloraMind...");

  db.query(sqlChats, (err) => {
    if (err) {
      console.error("Lỗi khi tạo bảng holora_mind_chats:", err.message);
    } else {
      console.log("✓ Bảng holora_mind_chats đã sẵn sàng.");
      db.query(sqlMessages, (err2) => {
        if (err2) {
          console.error("Lỗi khi tạo bảng holora_mind_messages:", err2.message);
        } else {
          console.log("✓ Bảng holora_mind_messages đã sẵn sàng.");
        }
        process.exit(0);
      });
    }
  });
};

initHoloraMind();
