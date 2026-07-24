const mysql = require("mysql2/promise");
require("dotenv").config();

const statements = [
  "ALTER TABLE branch ADD COLUMN owner_user_id BIGINT UNSIGNED NULL AFTER code",
  "CREATE INDEX idx_branch_owner_user ON branch(owner_user_id)",
  "ALTER TABLE branch ADD CONSTRAINT fk_branch_owner_user FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE SET NULL",
  "ALTER TABLE doctor ADD COLUMN created_by_user_id BIGINT UNSIGNED NULL AFTER user_id",
  "CREATE INDEX idx_doctor_created_by_user ON doctor(created_by_user_id)",
  "ALTER TABLE doctor ADD CONSTRAINT fk_doctor_created_by_user FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL",
];

const isIgnorableError = (err) => {
  const ignorableCodes = [
    "ER_DUP_FIELDNAME",
    "ER_DUP_KEYNAME",
    "ER_CANT_CREATE_TABLE",
    "ER_FK_DUP_NAME",
    "ER_DUP_INDEX",
  ];

  if (ignorableCodes.includes(err.code)) {
    return true;
  }

  const msg = (err.message || "").toLowerCase();
  return (
    msg.includes("duplicate column") ||
    msg.includes("duplicate key") ||
    msg.includes("duplicate foreign key") ||
    msg.includes("already exists")
  );
};

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

    console.log("Starting Provider Ownership Migration...\\n");

    for (let i = 0; i < statements.length; i += 1) {
      const sql = statements[i];
      try {
        await connection.query(sql);
        console.log(`Statement ${i + 1}/${statements.length} executed`);
      } catch (err) {
        if (isIgnorableError(err)) {
          console.log(`Statement ${i + 1}/${statements.length} skipped: ${err.message}`);
          continue;
        }

        throw err;
      }
    }

    console.log("Provider ownership migration completed successfully!");
  } catch (error) {
    console.error("Provider ownership migration failed:", error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

migrate();
