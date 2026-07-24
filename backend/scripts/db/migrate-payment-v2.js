const mysql = require("mysql2/promise");
require("dotenv").config();

/**
 * Payment Migration V2
 * - Adds invoice_number, paid_at, description columns to payment_order
 */
const queries = [
  `ALTER TABLE payment_order
     ADD COLUMN invoice_number VARCHAR(30) NULL AFTER token,
     ADD COLUMN paid_at DATETIME NULL AFTER invoice_number,
     ADD COLUMN description VARCHAR(255) NULL AFTER paid_at;`,

  `ALTER TABLE payment_order
     ADD UNIQUE KEY uq_invoice_number (invoice_number);`,
];

async function migrate() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host:     process.env.DB_HOST     || "localhost",
      port:     process.env.DB_PORT     || 3306,
      user:     process.env.DB_USER     || "root",
      password: process.env.DB_PASSWORD || "password",
      database: process.env.DB_NAME     || "holora_medical",
    });

    console.log("Starting Payment Migration V2...\n");

    for (let i = 0; i < queries.length; i += 1) {
      console.log(`Executing Query ${i + 1}/${queries.length}...`);
      try {
        await connection.query(queries[i]);
        console.log(`Query ${i + 1} completed\n`);
      } catch (err) {
        if (err.code === "ER_DUP_FIELDNAME" || err.code === "ER_DUP_KEYNAME") {
          console.log(`Query ${i + 1} skipped (already exists)\n`);
        } else {
          console.error(`Query ${i + 1} failed:`, err.message, "\n");
        }
      }
    }

    console.log("Payment Migration V2 finished.");
  } catch (err) {
    console.error("Migration connection error:", err);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

migrate();
