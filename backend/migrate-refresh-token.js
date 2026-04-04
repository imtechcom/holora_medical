/**
 * Migration: Create refresh_tokens table for token rotation
 * Run: node migrate-refresh-token.js
 */
const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3307,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "holora_medical",
  multipleStatements: true,
});

const sql = `
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  revoked_at DATETIME NULL,
  replaced_by_hash VARCHAR(255) NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_rt_token_hash (token_hash),
  INDEX idx_rt_user_id (user_id),
  INDEX idx_rt_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

db.connect((err) => {
  if (err) {
    console.error("Connection failed:", err.message);
    process.exit(1);
  }

  console.log("Connected to MySQL");

  db.query(sql, (queryErr) => {
    if (queryErr) {
      console.error("Migration failed:", queryErr.message);
      process.exit(1);
    }

    console.log("✅ refresh_tokens table created successfully");
    db.end();
    process.exit(0);
  });
});
