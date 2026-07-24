/**
 * Migration: Add ip_address and user_agent to refresh_tokens for session tracking
 * Run: node scripts/db/migrate-session-tracking.js
 */
const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3307,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "holora_medical",
  multipleStatements: true,
});

const sql = `
ALTER TABLE refresh_tokens
  ADD COLUMN ip_address VARCHAR(45) NULL AFTER token_hash,
  ADD COLUMN user_agent VARCHAR(500) NULL AFTER ip_address;
`;

db.connect((err) => {
  if (err) {
    console.error("Connection failed:", err.message);
    process.exit(1);
  }

  console.log("Connected to MySQL");

  db.query(sql, (queryErr) => {
    if (queryErr) {
      if (queryErr.code === "ER_DUP_FIELDNAME") {
        console.log("âœ… Columns already exist â€” skipping");
      } else {
        console.error("Migration failed:", queryErr.message);
        process.exit(1);
      }
    } else {
      console.log("âœ… ip_address and user_agent columns added to refresh_tokens");
    }

    db.end();
    process.exit(0);
  });
});

