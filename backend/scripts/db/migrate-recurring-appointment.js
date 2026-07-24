const mysql = require("mysql2/promise");
require("dotenv").config();

const queries = [
  // 1. Create recurring_appointments table
  `CREATE TABLE IF NOT EXISTS recurring_appointments (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    patient_id BIGINT UNSIGNED NOT NULL,
    doctor_id BIGINT UNSIGNED NOT NULL,
    branch_id BIGINT UNSIGNED NOT NULL,
    repeat_type ENUM('daily', 'weekly', 'monthly') NOT NULL,
    repeat_interval INT UNSIGNED DEFAULT 1,
    repeat_days JSON DEFAULT NULL,
    start_date DATE NOT NULL,
    end_date DATE DEFAULT NULL,
    note TEXT DEFAULT NULL,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_recurring_patient (patient_id),
    KEY idx_recurring_doctor (doctor_id),
    KEY idx_recurring_branch (branch_id),
    CONSTRAINT fk_recurring_patient FOREIGN KEY (patient_id) REFERENCES patient(id) ON DELETE CASCADE,
    CONSTRAINT fk_recurring_doctor FOREIGN KEY (doctor_id) REFERENCES doctor(id) ON DELETE CASCADE,
    CONSTRAINT fk_recurring_branch FOREIGN KEY (branch_id) REFERENCES branch(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // 2. Add recurring_id to appointment table
  "ALTER TABLE appointment ADD COLUMN recurring_id BIGINT UNSIGNED NULL AFTER branch_id",

  // 3. Add index for recurring_id
  "ALTER TABLE appointment ADD INDEX idx_appointment_recurring_id (recurring_id)",

  // 4. Add foreign key constraint
  "ALTER TABLE appointment ADD CONSTRAINT fk_appointment_recurring FOREIGN KEY (recurring_id) REFERENCES recurring_appointments(id) ON DELETE SET NULL",
];

const ignorableCodes = new Set([
  "ER_DUP_FIELDNAME",    // Column already exists
  "ER_DUP_KEYNAME",      // Index already exists
  "ER_FK_DUP_NAME",      // Constraint already exists
  "ER_DUP_INDEX",        // Index already exists
]);

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

    console.log("🚀 Starting Recurring Appointment Migration...\n");

    for (let i = 0; i < queries.length; i += 1) {
      const query = queries[i];
      try {
        console.log(`Executing Query ${i + 1}/${queries.length}...`);
        await connection.query(query);
        console.log(`✅ Query ${i + 1} completed successfully\n`);
      } catch (error) {
        if (ignorableCodes.has(error.code)) {
          console.log(`⚠️ Query ${i + 1} skipped (${error.code})\n`);
          continue;
        }
        throw error;
      }
    }

    console.log("🎉 Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

migrate();
