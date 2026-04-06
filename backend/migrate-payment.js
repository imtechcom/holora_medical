const mysql = require("mysql2/promise");
require("dotenv").config();

/**
 * Payment Migration
 * - Creates the payment_order table for tracking subscription payment orders
 */
const queries = [
  // Subscription payment order table (cũ)
  `
  CREATE TABLE IF NOT EXISTS payment_order (
    id            INT UNSIGNED     AUTO_INCREMENT PRIMARY KEY,
    user_id       INT UNSIGNED     NOT NULL,
    plan_code     VARCHAR(50)      NOT NULL,
    scope_type    VARCHAR(20)      NOT NULL DEFAULT 'account',
    months        TINYINT UNSIGNED NOT NULL DEFAULT 1,
    amount_cents  INT UNSIGNED     NOT NULL,
    currency      VARCHAR(10)      NOT NULL DEFAULT 'VND',
    payment_method VARCHAR(30)     NOT NULL,
    status        ENUM('pending','paid','failed','expired') NOT NULL DEFAULT 'pending',
    token         VARCHAR(64)      NOT NULL,
    expires_at    DATETIME         NOT NULL,
    created_at    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_payment_token (token),
    KEY idx_user_status (user_id, status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  // Doctor earning/payment table (mới)
  `
  CREATE TABLE IF NOT EXISTS payment (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT UNSIGNED NOT NULL,
    appointment_id INT UNSIGNED DEFAULT NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(8) DEFAULT 'VND',
    type VARCHAR(32) DEFAULT 'consultation',
    status VARCHAR(16) DEFAULT 'paid',
    note VARCHAR(255) DEFAULT NULL,
    paid_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctor(id) ON DELETE CASCADE,
    FOREIGN KEY (appointment_id) REFERENCES appointment(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `,
];

async function migrate() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host:     process.env.DB_HOST     || "localhost",
      port:     process.env.DB_PORT     || 3306,
      user:     process.env.DB_USER     || "root",
      password: process.env.DB_PASSWORD || "password",
      database: process.env.DB_NAME     || "holora_medical",
    });

    console.log("Starting Payment Migration...\n");

    for (let i = 0; i < queries.length; i += 1) {
      console.log(`Executing Query ${i + 1}/${queries.length}...`);
      try {
        await connection.query(queries[i]);
        console.log(`Query ${i + 1} completed\n`);
      } catch (err) {
        if (err.code === "ER_TABLE_EXISTS_ERROR") {
          console.log(`Query ${i + 1} skipped (table already exists)\n`);
        } else {
          console.warn(`Query ${i + 1} warning: ${err.message}\n`);
        }
      }
    }

    console.log("✅ Payment Migration completed!");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

migrate();
