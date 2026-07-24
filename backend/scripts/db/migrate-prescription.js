const mysql = require("mysql2");
require("dotenv").config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const queries = [
  `CREATE TABLE IF NOT EXISTS prescription (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    consultation_id BIGINT UNSIGNED DEFAULT NULL,
    appointment_id BIGINT UNSIGNED DEFAULT NULL,
    doctor_id BIGINT UNSIGNED NOT NULL,
    patient_id BIGINT UNSIGNED NOT NULL,
    prescription_code VARCHAR(50) NOT NULL,
    diagnosis TEXT DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    status ENUM('draft','issued','cancelled') NOT NULL DEFAULT 'draft',
    issued_at DATETIME DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_prescription_code (prescription_code),
    KEY idx_prescription_consultation (consultation_id),
    KEY idx_prescription_appointment (appointment_id),
    KEY idx_prescription_doctor (doctor_id),
    KEY idx_prescription_patient (patient_id),
    KEY idx_prescription_status (status),
    CONSTRAINT fk_prescription_consultation FOREIGN KEY (consultation_id) REFERENCES consultation(id) ON DELETE SET NULL,
    CONSTRAINT fk_prescription_appointment FOREIGN KEY (appointment_id) REFERENCES appointment(id) ON DELETE SET NULL,
    CONSTRAINT fk_prescription_doctor FOREIGN KEY (doctor_id) REFERENCES doctor(id) ON DELETE CASCADE,
    CONSTRAINT fk_prescription_patient FOREIGN KEY (patient_id) REFERENCES patient(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS prescription_item (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    prescription_id BIGINT UNSIGNED NOT NULL,
    medication_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) DEFAULT NULL,
    frequency VARCHAR(100) DEFAULT NULL,
    duration VARCHAR(100) DEFAULT NULL,
    quantity INT UNSIGNED DEFAULT NULL,
    unit VARCHAR(50) DEFAULT NULL,
    route VARCHAR(100) DEFAULT NULL,
    instructions TEXT DEFAULT NULL,
    sort_order INT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_item_prescription (prescription_id),
    CONSTRAINT fk_item_prescription FOREIGN KEY (prescription_id) REFERENCES prescription(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err);
    process.exit(1);
  }

  console.log("Connected to database");

  let completed = 0;

  queries.forEach((query, index) => {
    connection.query(query, (queryErr) => {
      if (queryErr) {
        console.log(`Query ${index + 1} error: ${queryErr.message}`);
      } else {
        console.log(`Query ${index + 1} executed successfully`);
      }

      completed += 1;

      if (completed === queries.length) {
        console.log("\n✅ Prescription tables created");
        connection.end(() => process.exit(0));
      }
    });
  });
});
