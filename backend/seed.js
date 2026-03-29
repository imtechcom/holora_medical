const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3307,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "holora_medical",
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  }
  console.log("Connected to MySQL - Starting seed...");
  seedDatabase();
});

const seedDatabase = async () => {
  try {
    // Insert roles
    const roles = [
      { name: "Admin", code: "admin", description: "System administrator with full access" },
      { name: "Doctor", code: "doctor", description: "Medical professional" },
      { name: "Patient", code: "patient", description: "Patient user" },
      { name: "Manager", code: "manager", description: "Hospital manager" },
    ];

    for (const role of roles) {
      const checkRoleSql = `SELECT id FROM role WHERE code = ? LIMIT 1`;
      db.query(checkRoleSql, [role.code], (err, results) => {
        if (err) {
          console.error("Check role error:", err);
        } else if (results.length === 0) {
          const insertRoleSql = `INSERT INTO role (name, code, description, status, created_at, updated_at) 
            VALUES (?, ?, ?, 'active', NOW(), NOW())`;
          db.query(insertRoleSql, [role.name, role.code, role.description], (err) => {
            if (err) {
              console.error(`Error adding role ${role.code}:`, err.message);
            } else {
              console.log(`✓ Role ${role.code} added`);
            }
          });
        } else {
          console.log(`✓ Role ${role.code} already exists`);
        }
      });
    }

    // Insert permissions
    const permissions = [
      { name: "View Users", code: "view_users", resource: "users", action: "read" },
      { name: "Create User", code: "create_user", resource: "users", action: "create" },
      { name: "Update User", code: "update_user", resource: "users", action: "update" },
      { name: "Delete User", code: "delete_user", resource: "users", action: "delete" },
      { name: "View Roles", code: "view_roles", resource: "roles", action: "read" },
      { name: "Create Role", code: "create_role", resource: "roles", action: "create" },
      { name: "Update Role", code: "update_role", resource: "roles", action: "update" },
      { name: "Delete Role", code: "delete_role", resource: "roles", action: "delete" },
      { name: "View Permissions", code: "view_permissions", resource: "permissions", action: "read" },
      { name: "Create Permission", code: "create_permission", resource: "permissions", action: "create" },
      { name: "Update Permission", code: "update_permission", resource: "permissions", action: "update" },
      { name: "Delete Permission", code: "delete_permission", resource: "permissions", action: "delete" },
      { name: "View Patients", code: "view_patients", resource: "patients", action: "read" },
      { name: "Create Patient", code: "create_patient", resource: "patients", action: "create" },
      { name: "Update Patient", code: "update_patient", resource: "patients", action: "update" },
      { name: "View Doctors", code: "view_doctors", resource: "doctors", action: "read" },
      { name: "Create Appointment", code: "create_appointment", resource: "appointments", action: "create" },
      { name: "View Appointments", code: "view_appointments", resource: "appointments", action: "read" },
    ];

    for (const permission of permissions) {
      const checkPermSql = `SELECT id FROM permission WHERE code = ? LIMIT 1`;
      db.query(checkPermSql, [permission.code], (err, results) => {
        if (err) {
          console.error("Check permission error:", err);
        } else if (results.length === 0) {
          const insertPermSql = `INSERT INTO permission (name, code, resource, action, status, created_at, updated_at) 
            VALUES (?, ?, ?, ?, 'active', NOW(), NOW())`;
          db.query(insertPermSql, [permission.name, permission.code, permission.resource, permission.action], (err) => {
            if (err) {
              console.error(`Error adding permission ${permission.code}:`, err.message);
            } else {
              console.log(`✓ Permission ${permission.code} added`);
            }
          });
        } else {
          console.log(`✓ Permission ${permission.code} already exists`);
        }
      });
    }

    setTimeout(() => {
      console.log("\n✓ Database seeding completed!");
      db.end();
      process.exit(0);
    }, 3000);
  } catch (err) {
    console.error("Seeding error:", err);
    db.end();
    process.exit(1);
  }
};
