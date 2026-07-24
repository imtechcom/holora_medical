/**
 * migrate-permissions.js
 * Tá»•ng há»£p vÃ  Ä‘á»“ng bá»™ toÃ n bá»™ phÃ¢n quyá»n há»‡ thá»‘ng vÃ o cÆ¡ sá»Ÿ dá»¯ liá»‡u.
 * Cháº¡y: node scripts/db/migrate-permissions.js
 */

const mysql = require("mysql2/promise");
require("dotenv").config();

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT) || 3307,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "holora_medical",
};

// ============================================================
// TOÃ€N Bá»˜ PHÃ‚N QUYá»€N Há»† THá»NG (dá»±a trÃªn phÃ¢n tÃ­ch routes)
// ============================================================
const ALL_PERMISSIONS = [
  // â”€â”€ DASHBOARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { code: "dashboard.access",      name: "Access Dashboard",          module_name: "dashboard",     description: "Truy cáº­p báº£ng Ä‘iá»u khiá»ƒn tá»•ng quan" },
  { code: "dashboard.analytics",   name: "View Analytics",            module_name: "dashboard",     description: "Xem bÃ¡o cÃ¡o thá»‘ng kÃª phÃ¢n tÃ­ch" },

  // â”€â”€ USER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { code: "user.manage",           name: "Manage Users",              module_name: "user",          description: "ToÃ n quyá»n quáº£n lÃ½ ngÆ°á»i dÃ¹ng" },
  { code: "user.view",             name: "View Users",                module_name: "user",          description: "Xem danh sÃ¡ch vÃ  thÃ´ng tin ngÆ°á»i dÃ¹ng" },
  { code: "user.create",           name: "Create User",               module_name: "user",          description: "Táº¡o tÃ i khoáº£n ngÆ°á»i dÃ¹ng má»›i" },
  { code: "user.update",           name: "Update User",               module_name: "user",          description: "Cáº­p nháº­t thÃ´ng tin ngÆ°á»i dÃ¹ng" },
  { code: "user.delete",           name: "Delete User",               module_name: "user",          description: "XÃ³a tÃ i khoáº£n ngÆ°á»i dÃ¹ng" },
  { code: "user.assign_role",      name: "Assign Role to User",       module_name: "user",          description: "GÃ¡n hoáº·c gá»¡ vai trÃ² khá»i ngÆ°á»i dÃ¹ng" },

  // â”€â”€ RBAC â€“ ROLES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { code: "role.manage",           name: "Manage Roles",              module_name: "rbac",          description: "ToÃ n quyá»n quáº£n lÃ½ vai trÃ²" },
  { code: "role.view",             name: "View Roles",                module_name: "rbac",          description: "Xem danh sÃ¡ch vai trÃ²" },
  { code: "role.create",           name: "Create Role",               module_name: "rbac",          description: "Táº¡o vai trÃ² má»›i" },
  { code: "role.update",           name: "Update Role",               module_name: "rbac",          description: "Cáº­p nháº­t vai trÃ²" },
  { code: "role.delete",           name: "Delete Role",               module_name: "rbac",          description: "XÃ³a vai trÃ²" },

  // â”€â”€ RBAC â€“ PERMISSIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { code: "permission.manage",     name: "Manage Permissions",        module_name: "rbac",          description: "ToÃ n quyá»n quáº£n lÃ½ phÃ¢n quyá»n" },
  { code: "permission.view",       name: "View Permissions",          module_name: "rbac",          description: "Xem danh sÃ¡ch phÃ¢n quyá»n" },
  { code: "permission.create",     name: "Create Permission",         module_name: "rbac",          description: "Táº¡o phÃ¢n quyá»n má»›i" },
  { code: "permission.update",     name: "Update Permission",         module_name: "rbac",          description: "Cáº­p nháº­t phÃ¢n quyá»n" },
  { code: "permission.delete",     name: "Delete Permission",         module_name: "rbac",          description: "XÃ³a phÃ¢n quyá»n" },

  // â”€â”€ PATIENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { code: "patient.manage",        name: "Manage Patients",           module_name: "patient",       description: "ToÃ n quyá»n quáº£n lÃ½ bá»‡nh nhÃ¢n" },
  { code: "patient.view",          name: "View Patients",             module_name: "patient",       description: "Xem danh sÃ¡ch vÃ  há»“ sÆ¡ bá»‡nh nhÃ¢n" },
  { code: "patient.create",        name: "Create Patient",            module_name: "patient",       description: "ThÃªm há»“ sÆ¡ bá»‡nh nhÃ¢n má»›i" },
  { code: "patient.update",        name: "Update Patient",            module_name: "patient",       description: "Cáº­p nháº­t há»“ sÆ¡ bá»‡nh nhÃ¢n" },
  { code: "patient.delete",        name: "Delete Patient",            module_name: "patient",       description: "XÃ³a há»“ sÆ¡ bá»‡nh nhÃ¢n" },

  // â”€â”€ DOCTOR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { code: "doctor.manage",         name: "Manage Doctors",            module_name: "doctor",        description: "ToÃ n quyá»n quáº£n lÃ½ bÃ¡c sÄ©" },
  { code: "doctor.view",           name: "View Doctors",              module_name: "doctor",        description: "Xem danh sÃ¡ch vÃ  há»“ sÆ¡ bÃ¡c sÄ©" },
  { code: "doctor.create",         name: "Create Doctor",             module_name: "doctor",        description: "ThÃªm há»“ sÆ¡ bÃ¡c sÄ© má»›i" },
  { code: "doctor.update",         name: "Update Doctor",             module_name: "doctor",        description: "Cáº­p nháº­t há»“ sÆ¡ bÃ¡c sÄ©" },
  { code: "doctor.delete",         name: "Delete Doctor",             module_name: "doctor",        description: "XÃ³a há»“ sÆ¡ bÃ¡c sÄ©" },

  // â”€â”€ BRANCH â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { code: "branch.manage",         name: "Manage Branches",           module_name: "branch",        description: "ToÃ n quyá»n quáº£n lÃ½ chi nhÃ¡nh" },
  { code: "branch.view",           name: "View Branches",             module_name: "branch",        description: "Xem danh sÃ¡ch vÃ  thÃ´ng tin chi nhÃ¡nh" },
  { code: "branch.create",         name: "Create Branch",             module_name: "branch",        description: "ThÃªm chi nhÃ¡nh má»›i" },
  { code: "branch.update",         name: "Update Branch",             module_name: "branch",        description: "Cáº­p nháº­t thÃ´ng tin chi nhÃ¡nh" },
  { code: "branch.delete",         name: "Delete Branch",             module_name: "branch",        description: "XÃ³a chi nhÃ¡nh" },

  // â”€â”€ APPOINTMENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { code: "appointment.manage",    name: "Manage Appointments",       module_name: "appointment",   description: "ToÃ n quyá»n quáº£n lÃ½ lá»‹ch háº¹n" },
  { code: "appointment.view",      name: "View Appointments",         module_name: "appointment",   description: "Xem lá»‹ch háº¹n cá»§a mÃ¬nh" },
  { code: "appointment.admin",     name: "View All Appointments",     module_name: "appointment",   description: "Xem táº¥t cáº£ lá»‹ch háº¹n trong há»‡ thá»‘ng (admin)" },
  { code: "appointment.create",    name: "Create Appointment",        module_name: "appointment",   description: "Äáº·t lá»‹ch háº¹n má»›i" },
  { code: "appointment.update",    name: "Update Appointment Status", module_name: "appointment",   description: "Cáº­p nháº­t tráº¡ng thÃ¡i lá»‹ch háº¹n" },
  { code: "appointment.delete",    name: "Delete Appointment",        module_name: "appointment",   description: "Há»§y / xÃ³a lá»‹ch háº¹n" },

  // â”€â”€ CONSULTATION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { code: "consultation.manage",   name: "Manage Consultations",      module_name: "consultation",  description: "ToÃ n quyá»n quáº£n lÃ½ ca tÆ° váº¥n" },
  { code: "consultation.view",     name: "View Consultations",        module_name: "consultation",  description: "Xem ca tÆ° váº¥n cá»§a mÃ¬nh" },
  { code: "consultation.create",   name: "Create Consultation",       module_name: "consultation",  description: "Gá»­i yÃªu cáº§u tÆ° váº¥n má»›i" },
  { code: "consultation.respond",  name: "Respond to Consultation",   module_name: "consultation",  description: "Pháº£n há»“i / cháº©n Ä‘oÃ¡n ca tÆ° váº¥n" },
  { code: "consultation.reopen",   name: "Reopen Consultation",       module_name: "consultation",  description: "Má»Ÿ láº¡i ca tÆ° váº¥n Ä‘Ã£ hoÃ n thÃ nh" },

  // â”€â”€ SCHEDULE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { code: "schedule.view",         name: "View Schedules",            module_name: "schedule",      description: "Xem lá»‹ch lÃ m viá»‡c cá»§a bÃ¡c sÄ©" },
  { code: "schedule.create",       name: "Create Schedule",           module_name: "schedule",      description: "Táº¡o ca lÃ m viá»‡c má»›i" },
  { code: "schedule.update",       name: "Update Schedule",           module_name: "schedule",      description: "Cáº­p nháº­t ca lÃ m viá»‡c" },
  { code: "schedule.delete",       name: "Delete Schedule",           module_name: "schedule",      description: "XÃ³a ca lÃ m viá»‡c" },

  // â”€â”€ SPECIALTY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { code: "specialty.view",        name: "View Specialties",          module_name: "specialty",     description: "Xem danh má»¥c chuyÃªn khoa" },
  { code: "specialty.create",      name: "Create Specialty",          module_name: "specialty",     description: "ThÃªm chuyÃªn khoa má»›i" },
  { code: "specialty.update",      name: "Update Specialty",          module_name: "specialty",     description: "Cáº­p nháº­t chuyÃªn khoa" },
  { code: "specialty.delete",      name: "Delete Specialty",          module_name: "specialty",     description: "XÃ³a chuyÃªn khoa" },

  // â”€â”€ AI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { code: "ai.manage",             name: "Manage AI Analysis",        module_name: "ai",            description: "ToÃ n quyá»n quáº£n lÃ½ phÃ¢n tÃ­ch AI" },
  { code: "ai.analyze",            name: "Request AI Analysis",       module_name: "ai",            description: "Gá»­i yÃªu cáº§u AI phÃ¢n tÃ­ch áº£nh ca khÃ¡m" },
  { code: "ai.view",               name: "View AI Results",           module_name: "ai",            description: "Xem káº¿t quáº£ phÃ¢n tÃ­ch AI" },
  { code: "ai.review",             name: "Review AI Results",         module_name: "ai",            description: "BÃ¡c sÄ© Ä‘Ã¡nh giÃ¡ vÃ  kiá»ƒm soÃ¡t káº¿t quáº£ AI" },

  // â”€â”€ SUBSCRIPTION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { code: "subscription.view",     name: "View Subscriptions",        module_name: "subscription",  description: "Xem gÃ³i dá»‹ch vá»¥ vÃ  tráº¡ng thÃ¡i Ä‘Äƒng kÃ½" },
  { code: "subscription.activate", name: "Activate Subscription",     module_name: "subscription",  description: "KÃ­ch hoáº¡t gÃ³i dá»‹ch vá»¥" },
  { code: "subscription.manage",   name: "Manage Subscriptions",      module_name: "subscription",  description: "Quáº£n lÃ½ thanh toÃ¡n vÃ  xÃ¡c nháº­n Ä‘Äƒng kÃ½" },

  // â”€â”€ UPLOAD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { code: "upload.file",           name: "Upload Files",              module_name: "upload",        description: "Táº£i áº£nh / tá»‡p Ä‘Ã­nh kÃ¨m lÃªn há»‡ thá»‘ng" },

  // â”€â”€ AUDIT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { code: "audit.view",            name: "View Audit Logs",           module_name: "audit",         description: "Xem nháº­t kÃ½ há»‡ thá»‘ng" },

  // â”€â”€ VIDEO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { code: "video.manage",          name: "Manage Video Sessions",     module_name: "video",         description: "Quáº£n lÃ½ phiÃªn tÆ° váº¥n video" },

  // â”€â”€ REVIEW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { code: "review.manage",         name: "Manage Reviews",            module_name: "review",        description: "Quáº£n lÃ½ Ä‘Ã¡nh giÃ¡" },

  // â”€â”€ NOTIFICATION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { code: "notification.manage",   name: "Manage Notifications",      module_name: "notification",  description: "Quáº£n lÃ½ thÃ´ng bÃ¡o" },
];

// ============================================================
async function main() {
  const conn = await mysql.createConnection(dbConfig);
  console.log("âœ… Káº¿t ná»‘i cÆ¡ sá»Ÿ dá»¯ liá»‡u thÃ nh cÃ´ng\n");

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const perm of ALL_PERMISSIONS) {
    const [rows] = await conn.execute(
      "SELECT id, module_name, description FROM permission WHERE code = ? LIMIT 1",
      [perm.code]
    );

    if (rows.length === 0) {
      // ChÃ¨n má»›i
      await conn.execute(
        `INSERT INTO permission (name, code, module_name, description, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'active', NOW(), NOW())`,
        [perm.name, perm.code, perm.module_name, perm.description]
      );
      console.log(`  âž• [INSERT] ${perm.code} (${perm.module_name})`);
      inserted++;
    } else {
      const row = rows[0];
      const needsUpdate = row.module_name !== perm.module_name || row.description !== perm.description;
      if (needsUpdate) {
        // Cáº­p nháº­t module_name / description cÃ²n thiáº¿u
        await conn.execute(
          `UPDATE permission SET name = ?, module_name = ?, description = ?, updated_at = NOW()
           WHERE id = ?`,
          [perm.name, perm.module_name, perm.description, row.id]
        );
        console.log(`  âœï¸  [UPDATE] ${perm.code} â€” module_name / description Ä‘Ã£ Ä‘Æ°á»£c cáº­p nháº­t`);
        updated++;
      } else {
        console.log(`  â­ï¸  [SKIP]   ${perm.code} â€” Ä‘Ã£ tá»“n táº¡i, khÃ´ng thay Ä‘á»•i`);
        skipped++;
      }
    }
  }

  console.log(`\n${"â”€".repeat(50)}`);
  console.log(`âœ… HoÃ n thÃ nh!`);
  console.log(`   âž• ÄÃ£ thÃªm má»›i : ${inserted}`);
  console.log(`   âœï¸  ÄÃ£ cáº­p nháº­t : ${updated}`);
  console.log(`   â­ï¸  Bá» qua      : ${skipped}`);
  console.log(`   ðŸ“‹ Tá»•ng        : ${ALL_PERMISSIONS.length}`);
  console.log(`${"â”€".repeat(50)}\n`);

  await conn.end();
}

main().catch((err) => {
  console.error("âŒ Lá»—i:", err.message);
  process.exit(1);
});

