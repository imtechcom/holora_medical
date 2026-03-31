const mysql = require("mysql2/promise");
require("dotenv").config();

/**
 * Subscription V2 Migration
 * - Adds 'account' scope_type to subscription_plan and provider_subscription tables
 * - Upserts HOLORA_FREE (free, 3 branches, 3 doctors/branch) and HOLORA_PLUS (paid, unlimited)
 */
const queries = [
  // 1. Add 'account' to subscription_plan.scope_type enum
  `
    ALTER TABLE subscription_plan
    MODIFY scope_type ENUM('doctor', 'branch', 'account') NOT NULL;
  `,
  // 2. Add 'account' to provider_subscription.scope_type enum
  `
    ALTER TABLE provider_subscription
    MODIFY scope_type ENUM('doctor', 'branch', 'account') NOT NULL;
  `,
  // 3. Upsert HOLORA_FREE and HOLORA_PLUS plans
  `
    INSERT INTO subscription_plan (code, name, scope_type, billing_cycle, price_cents, currency, status)
    VALUES
      ('HOLORA_FREE', 'Holora Free', 'account', 'monthly', 0, 'VND', 'active'),
      ('HOLORA_PLUS', 'Holora Plus', 'account', 'monthly', 299000, 'VND', 'active')
    ON DUPLICATE KEY UPDATE
      name        = VALUES(name),
      scope_type  = VALUES(scope_type),
      billing_cycle = VALUES(billing_cycle),
      price_cents = VALUES(price_cents),
      currency    = VALUES(currency),
      status      = VALUES(status),
      updated_at  = CURRENT_TIMESTAMP;
  `,
  // 4. HOLORA_FREE – branch.manage entitlement (max 3 branches)
  `
    INSERT INTO subscription_entitlement (plan_id, feature_code, is_enabled, limit_value)
    SELECT p.id, 'branch.manage', 1, 3
    FROM subscription_plan p
    WHERE p.code = 'HOLORA_FREE'
    ON DUPLICATE KEY UPDATE
      is_enabled  = 1,
      limit_value = 3,
      updated_at  = CURRENT_TIMESTAMP;
  `,
  // 5. HOLORA_FREE – doctor.manage entitlement (max 3 doctors per branch)
  `
    INSERT INTO subscription_entitlement (plan_id, feature_code, is_enabled, limit_value)
    SELECT p.id, 'doctor.manage', 1, 3
    FROM subscription_plan p
    WHERE p.code = 'HOLORA_FREE'
    ON DUPLICATE KEY UPDATE
      is_enabled  = 1,
      limit_value = 3,
      updated_at  = CURRENT_TIMESTAMP;
  `,
  // 6. HOLORA_PLUS – branch.manage entitlement (unlimited)
  `
    INSERT INTO subscription_entitlement (plan_id, feature_code, is_enabled, limit_value)
    SELECT p.id, 'branch.manage', 1, NULL
    FROM subscription_plan p
    WHERE p.code = 'HOLORA_PLUS'
    ON DUPLICATE KEY UPDATE
      is_enabled  = 1,
      limit_value = NULL,
      updated_at  = CURRENT_TIMESTAMP;
  `,
  // 7. HOLORA_PLUS – doctor.manage entitlement (unlimited)
  `
    INSERT INTO subscription_entitlement (plan_id, feature_code, is_enabled, limit_value)
    SELECT p.id, 'doctor.manage', 1, NULL
    FROM subscription_plan p
    WHERE p.code = 'HOLORA_PLUS'
    ON DUPLICATE KEY UPDATE
      is_enabled  = 1,
      limit_value = NULL,
      updated_at  = CURRENT_TIMESTAMP;
  `,
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

    console.log("Starting Subscription V2 Migration...\n");

    for (let i = 0; i < queries.length; i += 1) {
      console.log(`Executing Query ${i + 1}/${queries.length}...`);
      try {
        await connection.query(queries[i]);
        console.log(`Query ${i + 1} completed\n`);
      } catch (err) {
        // ALTER TABLE may fail if enum already contains the value – that is fine
        if (err.code === "ER_DUP_KEYNAME" || err.message.includes("Duplicate")) {
          console.log(`Query ${i + 1} skipped (already applied)\n`);
        } else {
          console.warn(`Query ${i + 1} warning: ${err.message}\n`);
        }
      }
    }

    console.log("✅ Subscription V2 Migration completed!");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

migrate();
