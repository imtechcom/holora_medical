const mysql = require("mysql2/promise");
require("dotenv").config();

const queries = [
  `
    CREATE TABLE IF NOT EXISTS subscription_plan (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(80) NOT NULL,
      name VARCHAR(150) NOT NULL,
      scope_type ENUM('doctor', 'branch') NOT NULL,
      billing_cycle ENUM('monthly', 'yearly') NOT NULL DEFAULT 'monthly',
      price_cents INT UNSIGNED NOT NULL DEFAULT 0,
      currency VARCHAR(10) NOT NULL DEFAULT 'VND',
      status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at DATETIME NULL DEFAULT NULL,
      UNIQUE KEY uk_subscription_plan_code (code),
      INDEX idx_subscription_plan_scope (scope_type),
      INDEX idx_subscription_plan_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  `
    CREATE TABLE IF NOT EXISTS subscription_entitlement (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      plan_id BIGINT UNSIGNED NOT NULL,
      feature_code VARCHAR(100) NOT NULL,
      is_enabled TINYINT(1) NOT NULL DEFAULT 1,
      limit_value INT NULL DEFAULT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_plan_feature (plan_id, feature_code),
      INDEX idx_entitlement_feature (feature_code),
      CONSTRAINT fk_entitlement_plan FOREIGN KEY (plan_id) REFERENCES subscription_plan(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  `
    CREATE TABLE IF NOT EXISTS provider_subscription (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      plan_id BIGINT UNSIGNED NOT NULL,
      scope_type ENUM('doctor', 'branch') NOT NULL,
      scope_id BIGINT UNSIGNED NOT NULL,
      owner_user_id BIGINT UNSIGNED NOT NULL,
      status ENUM('trialing', 'active', 'past_due', 'cancelled', 'expired') NOT NULL DEFAULT 'trialing',
      starts_at DATETIME NOT NULL,
      ends_at DATETIME NULL DEFAULT NULL,
      trial_ends_at DATETIME NULL DEFAULT NULL,
      auto_renew TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at DATETIME NULL DEFAULT NULL,
      INDEX idx_provider_subscription_scope (scope_type, scope_id),
      INDEX idx_provider_subscription_owner (owner_user_id),
      INDEX idx_provider_subscription_status (status),
      INDEX idx_provider_subscription_deleted (deleted_at),
      CONSTRAINT fk_provider_subscription_plan FOREIGN KEY (plan_id) REFERENCES subscription_plan(id),
      CONSTRAINT fk_provider_subscription_owner FOREIGN KEY (owner_user_id) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  `
    INSERT INTO subscription_plan (code, name, scope_type, billing_cycle, price_cents, currency, status)
    VALUES
      ('DOCTOR_TRIAL_14D', 'Doctor Trial 14 Days', 'doctor', 'monthly', 0, 'VND', 'active'),
      ('DOCTOR_PRO_MONTHLY', 'Doctor Pro Monthly', 'doctor', 'monthly', 299000, 'VND', 'active'),
      ('BRANCH_TRIAL_30D', 'Branch Trial 30 Days', 'branch', 'monthly', 0, 'VND', 'active'),
      ('BRANCH_GROWTH_MONTHLY', 'Branch Growth Monthly', 'branch', 'monthly', 999000, 'VND', 'active')
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      billing_cycle = VALUES(billing_cycle),
      price_cents = VALUES(price_cents),
      currency = VALUES(currency),
      status = VALUES(status),
      updated_at = CURRENT_TIMESTAMP;
  `,
  `
    INSERT INTO subscription_entitlement (plan_id, feature_code, is_enabled, limit_value)
    SELECT p.id, 'branch.manage', 1, NULL
    FROM subscription_plan p
    WHERE p.code IN ('DOCTOR_TRIAL_14D', 'DOCTOR_PRO_MONTHLY', 'BRANCH_TRIAL_30D', 'BRANCH_GROWTH_MONTHLY')
    ON DUPLICATE KEY UPDATE
      is_enabled = VALUES(is_enabled),
      limit_value = VALUES(limit_value),
      updated_at = CURRENT_TIMESTAMP;
  `,
  `
    INSERT INTO subscription_entitlement (plan_id, feature_code, is_enabled, limit_value)
    SELECT p.id, 'doctor.manage', 1,
      CASE
        WHEN p.code = 'DOCTOR_TRIAL_14D' THEN 1
        WHEN p.code = 'DOCTOR_PRO_MONTHLY' THEN 3
        ELSE NULL
      END AS limit_value
    FROM subscription_plan p
    WHERE p.code IN ('DOCTOR_TRIAL_14D', 'DOCTOR_PRO_MONTHLY', 'BRANCH_TRIAL_30D', 'BRANCH_GROWTH_MONTHLY')
    ON DUPLICATE KEY UPDATE
      is_enabled = VALUES(is_enabled),
      limit_value = VALUES(limit_value),
      updated_at = CURRENT_TIMESTAMP;
  `,
  `
    INSERT INTO subscription_entitlement (plan_id, feature_code, is_enabled, limit_value)
    SELECT p.id, 'appointment.receive', 1, NULL
    FROM subscription_plan p
    WHERE p.code IN ('DOCTOR_TRIAL_14D', 'DOCTOR_PRO_MONTHLY', 'BRANCH_TRIAL_30D', 'BRANCH_GROWTH_MONTHLY')
    ON DUPLICATE KEY UPDATE
      is_enabled = VALUES(is_enabled),
      limit_value = VALUES(limit_value),
      updated_at = CURRENT_TIMESTAMP;
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

    console.log("Starting Subscription Migration...\\n");

    for (let i = 0; i < queries.length; i += 1) {
      console.log(`Executing Query ${i + 1}/${queries.length}...`);
      await connection.query(queries[i]);
      console.log(`Query ${i + 1} completed successfully\\n`);
    }

    console.log("Subscription migration completed successfully!");
  } catch (error) {
    console.error("Subscription migration failed:", error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

migrate();
