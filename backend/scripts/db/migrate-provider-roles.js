const mysql = require("mysql2/promise");
require("dotenv").config();

const queries = [
  `
    INSERT INTO role (name, code, description, status, created_at, updated_at)
    VALUES
      ('Clinic Owner', 'clinic_owner', 'Owner of clinic/provider account', 'active', NOW(), NOW()),
      ('Branch Manager', 'branch_manager', 'Manager of a specific branch', 'active', NOW(), NOW())
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      description = VALUES(description),
      status = VALUES(status),
      updated_at = NOW();
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

    console.log("Starting Provider Roles Migration...\\n");

    for (let i = 0; i < queries.length; i += 1) {
      console.log(`Executing Query ${i + 1}/${queries.length}...`);
      await connection.query(queries[i]);
      console.log(`Query ${i + 1} completed successfully\\n`);
    }

    console.log("Provider roles migration completed successfully!");
  } catch (error) {
    console.error("Provider roles migration failed:", error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

migrate();
