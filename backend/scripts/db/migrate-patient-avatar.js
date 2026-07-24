/**
 * Migration: Add avatar_url column to patient table
 * Run: node scripts/db/migrate-patient-avatar.js
 */
const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3307,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "holora_medical",
});

const sql = `ALTER TABLE patient ADD COLUMN avatar_url VARCHAR(255) NULL AFTER medical_history`;

db.connect((err) => {
  if (err) {
    console.error("Connection failed:", err.message);
    process.exit(1);
  }

  console.log("Connected to MySQL");

  db.query(sql, (queryErr) => {
    if (queryErr) {
      if (queryErr.code === "ER_DUP_FIELDNAME") {
        console.log("âš ï¸ Column avatar_url already exists, skipping.");
        db.end();
        process.exit(0);
      }
      console.error("Migration failed:", queryErr.message);
      process.exit(1);
    }

    console.log("âœ… patient.avatar_url added successfully");
    db.end();
    process.exit(0);
  });
});

