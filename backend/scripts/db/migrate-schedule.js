require("dotenv").config();
const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3307,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "holora_medical",
});

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS doctor_schedule (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    doctor_id BIGINT UNSIGNED NOT NULL,
    work_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration INT NOT NULL DEFAULT 30,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctor(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

const dummyData = `
  INSERT INTO doctor_schedule (doctor_id, work_date, start_time, end_time, slot_duration, status)
  VALUES 
  (1, CURRENT_DATE() + INTERVAL 1 DAY, '08:00:00', '12:00:00', 30, 'active'),
  (1, CURRENT_DATE() + INTERVAL 1 DAY, '13:00:00', '17:00:00', 30, 'active'),
  (1, CURRENT_DATE() + INTERVAL 2 DAY, '08:00:00', '12:00:00', 30, 'active')
`;

console.log("Executing Migration...");

db.query(createTableQuery, (err) => {
  if (err) {
    console.error("❌ Migration failed Table Creation:", err);
    process.exit(1);
  }
  console.log("✅ SUCCESS: Table 'doctor_schedule' created!");
  
  db.query(dummyData, (err2) => {
    if (err2 && err2.code !== 'ER_DUP_ENTRY') {
      console.error("❌ Migration failed Dummy Data:", err2);
      process.exit(1);
    }
    console.log("✅ SUCCESS: Dummy Data added!");
    process.exit(0);
  });
});
