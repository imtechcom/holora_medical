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
  "ALTER TABLE `doctor` ADD CONSTRAINT `uk_doctor_code` UNIQUE KEY `uk_doctor_code` (`doctor_code`)",
  "ALTER TABLE `patient` ADD CONSTRAINT `uk_patient_code` UNIQUE KEY `uk_patient_code` (`patient_code`)",
  "ALTER TABLE `patient` ADD INDEX `idx_patient_code` (`patient_code`)",
];

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err);
    process.exit(1);
  }

  console.log("Connected to database");

  let completedQueries = 0;

  queries.forEach((query, index) => {
    connection.query(query, (queryErr) => {
      if (queryErr) {
        console.log(`Query ${index + 1} may already exist: ${query.substring(0, 60)}...`);
        console.log(`Error (ignorable): ${queryErr.message}`);
      } else {
        console.log(`Query ${index + 1} executed successfully`);
      }

      completedQueries += 1;

      if (completedQueries === queries.length) {
        console.log("\n✅ Medical code constraints updated");
        connection.end(() => process.exit(0));
      }
    });
  });
});