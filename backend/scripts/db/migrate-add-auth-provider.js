const db = require("../../src/config/db");

const migrate = () => {
    const sql = `
        ALTER TABLE users 
        ADD COLUMN auth_provider ENUM('local', 'google') NOT NULL DEFAULT 'local' AFTER id,
        ADD COLUMN google_id VARCHAR(150) NULL AFTER auth_provider;
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Migration failed:", err.message);
            process.exit(1);
        }
        console.log("Migration successful: added auth_provider and google_id to users table.");
        process.exit(0);
    });
};

migrate();
