const mysql = require("mysql2/promise");
require("dotenv").config();

const queries = [
  "ALTER TABLE appointment ADD COLUMN branch_id BIGINT UNSIGNED NULL AFTER specialty_id",
  "ALTER TABLE appointment ADD INDEX idx_appointment_branch_id (branch_id)",
  "ALTER TABLE appointment ADD CONSTRAINT fk_appointment_branch FOREIGN KEY (branch_id) REFERENCES branch(id) ON DELETE SET NULL",
];

const ignorableCodes = new Set([
  "ER_DUP_FIELDNAME",
  "ER_DUP_KEYNAME",
  "ER_CANT_CREATE_TABLE",
  "ER_FK_DUP_NAME",
  "ER_DUP_INDEX",
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

    console.log("Starting Appointment Branch Migration...\n");

    for (let i = 0; i < queries.length; i += 1) {
      const query = queries[i];
      try {
        console.log(`Executing Query ${i + 1}/${queries.length}...`);
        await connection.query(query);
        console.log(`Query ${i + 1} completed successfully\n`);
      } catch (error) {
        if (ignorableCodes.has(error.code)) {
          console.log(`Query ${i + 1} skipped (${error.code})\n`);
          continue;
        }
        throw error;
      }
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