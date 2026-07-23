const mysql = require("mysql2");

const dbConfig = {
  host: process.env.DB_HOST || "mysql",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "holora_app",
  password: process.env.DB_PASSWORD || "holora_password",
  database: process.env.DB_NAME || "holora_medical",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
};

console.log(`[Database] Attempting to connect to ${dbConfig.host}:${dbConfig.port} as ${dbConfig.user}...`);

const pool = mysql.createPool(dbConfig);

// Helper function to test connection with retries
const connectWithRetry = (attempts = 5, delay = 5000) => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error(`[Database] Connection failed (Attempt ${6 - attempts}/5):`, {
        code: err.code,
        errno: err.errno,
        sqlState: err.sqlState,
        message: err.message
      });
      
      if (attempts > 1) {
        console.log(`[Database] Retrying in ${delay/1000}s...`);
        setTimeout(() => connectWithRetry(attempts - 1, delay), delay);
      } else {
        console.error("[Database] Maximum connection attempts reached. System may be unstable.");
      }
    } else {
      console.log("[Database] Connected to MySQL successfully.");
      connection.release();
    }
  });
};

// Initial connection test
connectWithRetry();

module.exports = pool;