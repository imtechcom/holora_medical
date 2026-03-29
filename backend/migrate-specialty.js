const mysql = require('mysql2/promise');
require('dotenv').config();

const queries = [
  // 1. Add deleted_at column (ignore if already exists)
  `ALTER TABLE specialty ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;`,

  // 2. Add doctor_count column (ignore if already exists)
  `ALTER TABLE specialty ADD COLUMN doctor_count INT UNSIGNED DEFAULT 0;`,

  // 3. Add UNIQUE constraint on code (ignore if already exists)
  `ALTER TABLE specialty ADD CONSTRAINT uk_specialty_code UNIQUE (code);`,

  // 4. Update status enum type
  `ALTER TABLE specialty MODIFY status ENUM('active', 'inactive') DEFAULT 'active' NOT NULL;`,

  // 5. Add indexes for performance
  `CREATE INDEX idx_specialty_code ON specialty(code);`,
  `CREATE INDEX idx_specialty_status ON specialty(status);`,
  `CREATE INDEX idx_specialty_deleted_at ON specialty(deleted_at);`,

  // 6. Update doctor_count based on current doctors assigned
  `UPDATE specialty s 
   SET doctor_count = (
     SELECT COUNT(*) FROM doctor d 
     WHERE d.specialty_id = s.id 
     AND d.status != 'deleted'
   )
   WHERE s.deleted_at IS NULL;`,
];

async function migrate() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'holora_medical',
    });

    console.log('🚀 Starting Specialty Table Migration...\n');

    for (let i = 0; i < queries.length; i++) {
      try {
        console.log(`📝 Executing Query ${i + 1}/${queries.length}...`);
        await connection.query(queries[i]);
        console.log(`✅ Query ${i + 1} completed successfully\n`);
      } catch (err) {
        // Ignore errors for existing columns, constraints, or indexes
        if (err.errno === 1060 || // Duplicate column name
            err.errno === 1064 || // Check syntax, but might be OK if it's about existing items
            err.code === 'ER_DUP_KEYNAME' || // Duplicate key name
            err.code === 'ER_DUP_KEY_NAME' ||
            err.code === 'ER_CANT_CREATE_TABLE' ||
            err.code === 'ER_CANT_FIND_WRONG_INDEX' ||
            err.code === 'ER_DUP_INDEX' ||
            err.message.includes('already exists')) {
          console.log(`⚠️  Query ${i + 1} skipped (already exists)\n`);
        } else {
          console.error(`❌ Query ${i + 1} failed:`, err.message);
          throw err;
        }
      }
    }

    console.log('✨ Migration completed successfully!');
    console.log('\n📊 Specialty Table Schema:');
    const [rows] = await connection.query('DESCRIBE specialty');
    console.table(rows);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.code) {
      console.error('Error Code:', error.code);
    }
    if (error.errno) {
      console.error('Error Number:', error.errno);
    }
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

migrate();
