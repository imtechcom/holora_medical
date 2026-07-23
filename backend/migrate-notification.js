/**
 * Migration: Tạo bảng notification
 * Run: node migrate-notification.js
 */
const db = require("./src/config/db");

const sql = `
  CREATE TABLE IF NOT EXISTS notification (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT NOT NULL,
    type         VARCHAR(60) NOT NULL,
    title        VARCHAR(200) NOT NULL,
    body         TEXT,
    link         VARCHAR(255),
    is_read      TINYINT(1) NOT NULL DEFAULT 0,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_read (user_id, is_read),
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

db.query(sql, (err) => {
  if (err) {
    console.error("Migration FAILED:", err.message);
  } else {
    console.log("✅ Table 'notification' created (or already exists).");
  }
  process.exit(0);
});
