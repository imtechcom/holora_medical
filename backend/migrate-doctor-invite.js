const mysql = require("mysql2/promise");
require("dotenv").config();

const queries = [
  `
    CREATE TABLE IF NOT EXISTS doctor_invite (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT UNSIGNED NOT NULL,
      doctor_id BIGINT UNSIGNED NOT NULL,
      email VARCHAR(150) NOT NULL,
      token_hash CHAR(64) NOT NULL,
      expires_at DATETIME NOT NULL,
      used_at DATETIME NULL DEFAULT NULL,
      revoked_at DATETIME NULL DEFAULT NULL,
      created_by_user_id BIGINT UNSIGNED NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_doctor_invite_token_hash (token_hash),
      INDEX idx_doctor_invite_user (user_id),
      INDEX idx_doctor_invite_doctor (doctor_id),
      INDEX idx_doctor_invite_email (email),
      INDEX idx_doctor_invite_expiry (expires_at),
      CONSTRAINT fk_doctor_invite_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_doctor_invite_doctor FOREIGN KEY (doctor_id) REFERENCES doctor(id) ON DELETE CASCADE,
      CONSTRAINT fk_doctor_invite_creator FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
];

async function migrate() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "password",
      database: process.env.DB_NAME || "holora_medical",
    });

    console.log("Starting Doctor Invite Migration...\\n");

    for (let i = 0; i < queries.length; i += 1) {
      console.log(`Executing Query ${i + 1}/${queries.length}...`);
      await connection.query(queries[i]);
      console.log(`Query ${i + 1} completed successfully\\n`);
    }

    console.log("Doctor invite migration completed successfully!");
  } catch (error) {
    console.error("Doctor invite migration failed:", error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

migrate();
