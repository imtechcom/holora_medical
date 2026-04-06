// Script: run-sql-migrations.js
// Tự động chạy tất cả các file .sql trong backend/migrations theo thứ tự tên file
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function runMigrations() {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'holora_medical',
    multipleStatements: true,
  });

  for (const file of files) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    console.log(`\n=== Running migration: ${file} ===`);
    try {
      await connection.query(sql);
      console.log('✅ Success');
    } catch (err) {
      console.error('❌ Error:', err.message);
    }
  }
  await connection.end();
  console.log('\nAll migrations completed.');
}

runMigrations();
