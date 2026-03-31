require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrateResetPassword() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    console.log('Bắt đầu di trú: Thêm cột Quên Mật Khẩu (Forgot Password) vào bảng users...');

    const [columns] = await connection.query(`SHOW COLUMNS FROM users LIKE 'reset_password_token'`);
    if (columns.length === 0) {
      await connection.query(`
        ALTER TABLE users 
        ADD COLUMN reset_password_token VARCHAR(255) NULL AFTER password_hash,
        ADD COLUMN reset_password_expires DATETIME NULL AFTER reset_password_token
      `);
      console.log('Đã tạo thành công 2 cột: reset_password_token, reset_password_expires.');
    } else {
      console.log('Các cột quên mật khẩu đã tồn tại. Bỏ qua...');
    }

    console.log('✅ Hoàn tất quá trình nâng cấp Database (Reset Password Schema)!');
  } catch (err) {
    console.error('Lỗi khi cập nhật bảng users:', err);
  } finally {
    await connection.end();
  }
}

migrateResetPassword();
