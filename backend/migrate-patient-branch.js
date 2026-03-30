const mysql = require("mysql2/promise");
require("dotenv").config();

const queries = [
  `
    CREATE TABLE IF NOT EXISTS patient_branch (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      patient_id BIGINT UNSIGNED NOT NULL,
      branch_id BIGINT UNSIGNED NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at DATETIME NULL DEFAULT NULL,
      UNIQUE KEY uk_patient_branch (patient_id, branch_id),
      INDEX idx_patient_branch_patient (patient_id),
      INDEX idx_patient_branch_branch (branch_id),
      INDEX idx_patient_branch_deleted_at (deleted_at),
      CONSTRAINT fk_patient_branch_patient FOREIGN KEY (patient_id) REFERENCES patient(id) ON DELETE CASCADE,
      CONSTRAINT fk_patient_branch_branch FOREIGN KEY (branch_id) REFERENCES branch(id) ON DELETE CASCADE
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

    console.log("Starting Patient-Branch Migration...\n");

    for (let i = 0; i < queries.length; i += 1) {
      console.log(`Executing Query ${i + 1}/${queries.length}...`);
      await connection.query(queries[i]);
      console.log(`Query ${i + 1} completed successfully\n`);
    }

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

migrate();