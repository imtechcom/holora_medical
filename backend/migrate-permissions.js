/**
 * migrate-permissions.js
 * Tổng hợp và đồng bộ toàn bộ phân quyền hệ thống vào cơ sở dữ liệu.
 * Chạy: node migrate-permissions.js
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
// TOÀN BỘ PHÂN QUYỀN HỆ THỐNG (dựa trên phân tích routes)
// ============================================================
const ALL_PERMISSIONS = [
  // ── DASHBOARD ─────────────────────────────────────────────
  { code: "dashboard.access",      name: "Access Dashboard",          module_name: "dashboard",     description: "Truy cập bảng điều khiển tổng quan" },
  { code: "dashboard.analytics",   name: "View Analytics",            module_name: "dashboard",     description: "Xem báo cáo thống kê phân tích" },

  // ── USER ──────────────────────────────────────────────────
  { code: "user.manage",           name: "Manage Users",              module_name: "user",          description: "Toàn quyền quản lý người dùng" },
  { code: "user.view",             name: "View Users",                module_name: "user",          description: "Xem danh sách và thông tin người dùng" },
  { code: "user.create",           name: "Create User",               module_name: "user",          description: "Tạo tài khoản người dùng mới" },
  { code: "user.update",           name: "Update User",               module_name: "user",          description: "Cập nhật thông tin người dùng" },
  { code: "user.delete",           name: "Delete User",               module_name: "user",          description: "Xóa tài khoản người dùng" },
  { code: "user.assign_role",      name: "Assign Role to User",       module_name: "user",          description: "Gán hoặc gỡ vai trò khỏi người dùng" },

  // ── RBAC – ROLES ──────────────────────────────────────────
  { code: "role.manage",           name: "Manage Roles",              module_name: "rbac",          description: "Toàn quyền quản lý vai trò" },
  { code: "role.view",             name: "View Roles",                module_name: "rbac",          description: "Xem danh sách vai trò" },
  { code: "role.create",           name: "Create Role",               module_name: "rbac",          description: "Tạo vai trò mới" },
  { code: "role.update",           name: "Update Role",               module_name: "rbac",          description: "Cập nhật vai trò" },
  { code: "role.delete",           name: "Delete Role",               module_name: "rbac",          description: "Xóa vai trò" },

  // ── RBAC – PERMISSIONS ────────────────────────────────────
  { code: "permission.manage",     name: "Manage Permissions",        module_name: "rbac",          description: "Toàn quyền quản lý phân quyền" },
  { code: "permission.view",       name: "View Permissions",          module_name: "rbac",          description: "Xem danh sách phân quyền" },
  { code: "permission.create",     name: "Create Permission",         module_name: "rbac",          description: "Tạo phân quyền mới" },
  { code: "permission.update",     name: "Update Permission",         module_name: "rbac",          description: "Cập nhật phân quyền" },
  { code: "permission.delete",     name: "Delete Permission",         module_name: "rbac",          description: "Xóa phân quyền" },

  // ── PATIENT ───────────────────────────────────────────────
  { code: "patient.manage",        name: "Manage Patients",           module_name: "patient",       description: "Toàn quyền quản lý bệnh nhân" },
  { code: "patient.view",          name: "View Patients",             module_name: "patient",       description: "Xem danh sách và hồ sơ bệnh nhân" },
  { code: "patient.create",        name: "Create Patient",            module_name: "patient",       description: "Thêm hồ sơ bệnh nhân mới" },
  { code: "patient.update",        name: "Update Patient",            module_name: "patient",       description: "Cập nhật hồ sơ bệnh nhân" },
  { code: "patient.delete",        name: "Delete Patient",            module_name: "patient",       description: "Xóa hồ sơ bệnh nhân" },

  // ── DOCTOR ────────────────────────────────────────────────
  { code: "doctor.manage",         name: "Manage Doctors",            module_name: "doctor",        description: "Toàn quyền quản lý bác sĩ" },
  { code: "doctor.view",           name: "View Doctors",              module_name: "doctor",        description: "Xem danh sách và hồ sơ bác sĩ" },
  { code: "doctor.create",         name: "Create Doctor",             module_name: "doctor",        description: "Thêm hồ sơ bác sĩ mới" },
  { code: "doctor.update",         name: "Update Doctor",             module_name: "doctor",        description: "Cập nhật hồ sơ bác sĩ" },
  { code: "doctor.delete",         name: "Delete Doctor",             module_name: "doctor",        description: "Xóa hồ sơ bác sĩ" },

  // ── BRANCH ────────────────────────────────────────────────
  { code: "branch.manage",         name: "Manage Branches",           module_name: "branch",        description: "Toàn quyền quản lý chi nhánh" },
  { code: "branch.view",           name: "View Branches",             module_name: "branch",        description: "Xem danh sách và thông tin chi nhánh" },
  { code: "branch.create",         name: "Create Branch",             module_name: "branch",        description: "Thêm chi nhánh mới" },
  { code: "branch.update",         name: "Update Branch",             module_name: "branch",        description: "Cập nhật thông tin chi nhánh" },
  { code: "branch.delete",         name: "Delete Branch",             module_name: "branch",        description: "Xóa chi nhánh" },

  // ── APPOINTMENT ───────────────────────────────────────────
  { code: "appointment.manage",    name: "Manage Appointments",       module_name: "appointment",   description: "Toàn quyền quản lý lịch hẹn" },
  { code: "appointment.view",      name: "View Appointments",         module_name: "appointment",   description: "Xem lịch hẹn của mình" },
  { code: "appointment.admin",     name: "View All Appointments",     module_name: "appointment",   description: "Xem tất cả lịch hẹn trong hệ thống (admin)" },
  { code: "appointment.create",    name: "Create Appointment",        module_name: "appointment",   description: "Đặt lịch hẹn mới" },
  { code: "appointment.update",    name: "Update Appointment Status", module_name: "appointment",   description: "Cập nhật trạng thái lịch hẹn" },
  { code: "appointment.delete",    name: "Delete Appointment",        module_name: "appointment",   description: "Hủy / xóa lịch hẹn" },

  // ── CONSULTATION ──────────────────────────────────────────
  { code: "consultation.manage",   name: "Manage Consultations",      module_name: "consultation",  description: "Toàn quyền quản lý ca tư vấn" },
  { code: "consultation.view",     name: "View Consultations",        module_name: "consultation",  description: "Xem ca tư vấn của mình" },
  { code: "consultation.create",   name: "Create Consultation",       module_name: "consultation",  description: "Gửi yêu cầu tư vấn mới" },
  { code: "consultation.respond",  name: "Respond to Consultation",   module_name: "consultation",  description: "Phản hồi / chẩn đoán ca tư vấn" },
  { code: "consultation.reopen",   name: "Reopen Consultation",       module_name: "consultation",  description: "Mở lại ca tư vấn đã hoàn thành" },

  // ── SCHEDULE ──────────────────────────────────────────────
  { code: "schedule.view",         name: "View Schedules",            module_name: "schedule",      description: "Xem lịch làm việc của bác sĩ" },
  { code: "schedule.create",       name: "Create Schedule",           module_name: "schedule",      description: "Tạo ca làm việc mới" },
  { code: "schedule.update",       name: "Update Schedule",           module_name: "schedule",      description: "Cập nhật ca làm việc" },
  { code: "schedule.delete",       name: "Delete Schedule",           module_name: "schedule",      description: "Xóa ca làm việc" },

  // ── SPECIALTY ─────────────────────────────────────────────
  { code: "specialty.view",        name: "View Specialties",          module_name: "specialty",     description: "Xem danh mục chuyên khoa" },
  { code: "specialty.create",      name: "Create Specialty",          module_name: "specialty",     description: "Thêm chuyên khoa mới" },
  { code: "specialty.update",      name: "Update Specialty",          module_name: "specialty",     description: "Cập nhật chuyên khoa" },
  { code: "specialty.delete",      name: "Delete Specialty",          module_name: "specialty",     description: "Xóa chuyên khoa" },

  // ── AI ────────────────────────────────────────────────────
  { code: "ai.manage",             name: "Manage AI Analysis",        module_name: "ai",            description: "Toàn quyền quản lý phân tích AI" },
  { code: "ai.analyze",            name: "Request AI Analysis",       module_name: "ai",            description: "Gửi yêu cầu AI phân tích ảnh ca khám" },
  { code: "ai.view",               name: "View AI Results",           module_name: "ai",            description: "Xem kết quả phân tích AI" },
  { code: "ai.review",             name: "Review AI Results",         module_name: "ai",            description: "Bác sĩ đánh giá và kiểm soát kết quả AI" },

  // ── SUBSCRIPTION ──────────────────────────────────────────
  { code: "subscription.view",     name: "View Subscriptions",        module_name: "subscription",  description: "Xem gói dịch vụ và trạng thái đăng ký" },
  { code: "subscription.activate", name: "Activate Subscription",     module_name: "subscription",  description: "Kích hoạt gói dịch vụ" },
  { code: "subscription.manage",   name: "Manage Subscriptions",      module_name: "subscription",  description: "Quản lý thanh toán và xác nhận đăng ký" },

  // ── UPLOAD ────────────────────────────────────────────────
  { code: "upload.file",           name: "Upload Files",              module_name: "upload",        description: "Tải ảnh / tệp đính kèm lên hệ thống" },

  // ── AUDIT ─────────────────────────────────────────────────
  { code: "audit.view",            name: "View Audit Logs",           module_name: "audit",         description: "Xem nhật ký hệ thống" },

  // ── VIDEO ─────────────────────────────────────────────────
  { code: "video.manage",          name: "Manage Video Sessions",     module_name: "video",         description: "Quản lý phiên tư vấn video" },

  // ── REVIEW ────────────────────────────────────────────────
  { code: "review.manage",         name: "Manage Reviews",            module_name: "review",        description: "Quản lý đánh giá" },

  // ── NOTIFICATION ──────────────────────────────────────────
  { code: "notification.manage",   name: "Manage Notifications",      module_name: "notification",  description: "Quản lý thông báo" },
];

// ============================================================
async function main() {
  const conn = await mysql.createConnection(dbConfig);
  console.log("✅ Kết nối cơ sở dữ liệu thành công\n");

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const perm of ALL_PERMISSIONS) {
    const [rows] = await conn.execute(
      "SELECT id, module_name, description FROM permission WHERE code = ? LIMIT 1",
      [perm.code]
    );

    if (rows.length === 0) {
      // Chèn mới
      await conn.execute(
        `INSERT INTO permission (name, code, module_name, description, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'active', NOW(), NOW())`,
        [perm.name, perm.code, perm.module_name, perm.description]
      );
      console.log(`  ➕ [INSERT] ${perm.code} (${perm.module_name})`);
      inserted++;
    } else {
      const row = rows[0];
      const needsUpdate = row.module_name !== perm.module_name || row.description !== perm.description;
      if (needsUpdate) {
        // Cập nhật module_name / description còn thiếu
        await conn.execute(
          `UPDATE permission SET name = ?, module_name = ?, description = ?, updated_at = NOW()
           WHERE id = ?`,
          [perm.name, perm.module_name, perm.description, row.id]
        );
        console.log(`  ✏️  [UPDATE] ${perm.code} — module_name / description đã được cập nhật`);
        updated++;
      } else {
        console.log(`  ⏭️  [SKIP]   ${perm.code} — đã tồn tại, không thay đổi`);
        skipped++;
      }
    }
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log(`✅ Hoàn thành!`);
  console.log(`   ➕ Đã thêm mới : ${inserted}`);
  console.log(`   ✏️  Đã cập nhật : ${updated}`);
  console.log(`   ⏭️  Bỏ qua      : ${skipped}`);
  console.log(`   📋 Tổng        : ${ALL_PERMISSIONS.length}`);
  console.log(`${"─".repeat(50)}\n`);

  await conn.end();
}

main().catch((err) => {
  console.error("❌ Lỗi:", err.message);
  process.exit(1);
});
