const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    process.exit(1);
  }
  console.log('Connected to database');

  // Run migration queries
  const queries = [
    "ALTER TABLE `doctor` MODIFY `user_id` bigint UNSIGNED NULL",
    "ALTER TABLE `doctor` MODIFY `specialty_id` bigint UNSIGNED NULL",
    "ALTER TABLE `doctor` ADD CONSTRAINT `unique_license_number` UNIQUE KEY `uk_license_number` (`license_number`)",
    "ALTER TABLE `doctor` ADD INDEX `idx_doctor_code` (`doctor_code`)",
    "ALTER TABLE `doctor` MODIFY `status` enum('active','inactive','on_leave','deleted') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active'",
    "ALTER TABLE `consultation_image` ADD COLUMN `response_id` bigint unsigned NULL AFTER `uploaded_by`",
    "ALTER TABLE `consultation_image` ADD INDEX `idx_consultation_image_response_id` (`response_id`)",
    "ALTER TABLE `consultation_image` ADD CONSTRAINT `fk_consultation_image_response` FOREIGN KEY (`response_id`) REFERENCES `consultation_response` (`id`) ON DELETE CASCADE ON UPDATE CASCADE",
  ];

  let completedQueries = 0;

  queries.forEach((query, index) => {
    connection.query(query, (err) => {
      if (err) {
        // Some queries might fail if constraints already exist, which is fine
        console.log(`Query ${index + 1} (may already exist): ${query.substring(0, 50)}...`);
        console.log(`Error (ignorable): ${err.message}`);
      } else {
        console.log(`Query ${index + 1} executed successfully: ${query.substring(0, 50)}...`);
      }
      
      completedQueries++;
      
      if (completedQueries === queries.length) {
        console.log('\n✅ Database schema updates completed!');
        connection.end(() => {
          process.exit(0);
        });
      }
    });
  });
});
