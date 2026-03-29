import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../LanguageSwitcher";

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navClass = ({ isActive }) =>
    isActive
      ? "block rounded-lg bg-[#E06666] px-4 py-2 text-white"
      : "block rounded-lg px-4 py-2 text-gray-700 hover:bg-[#FFF5F5] hover:text-[#E06666]";

  // Kiểm tra quyền hiển thị menu item
  const canViewUsers = role === "super_admin" || role === "admin";
  const canViewRoles = role === "super_admin" || role === "admin";
  const canViewPermissions = role === "super_admin" || role === "admin";
  const canViewSpecialties = role === "super_admin" || role === "admin";
  const canViewDoctors = role === "super_admin" || role === "admin";
  const canViewPatients = role === "super_admin" || role === "admin" || role === "doctor";
  const canViewAppointments = role === "super_admin" || role === "admin" || role === "doctor";
  const canViewConsultations = role === "super_admin" || role === "admin" || role === "doctor";

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md">
          <div className="border-b px-6 py-5">
            <Link to="/admin" className="text-2xl font-bold text-[#E06666]">
              Holora Admin
            </Link>
            <p className="mt-1 text-sm text-gray-500">{t("admin.medicalDashboard")}</p>
          </div>

          <nav className="space-y-2 p-4">
            <NavLink to="/admin" end className={navClass}>
              {t("admin.dashboard")}
            </NavLink>

            {canViewUsers && (
              <NavLink to="/admin/users" className={navClass}>
                {t("admin.users")}
              </NavLink>
            )}

            {canViewRoles && (
              <NavLink to="/admin/roles" className={navClass}>
                {t("admin.rolesManagement")}
              </NavLink>
            )}

            {canViewPermissions && (
              <NavLink to="/admin/permissions" className={navClass}>
                {t("admin.permissionsManagement")}
              </NavLink>
            )}

            {canViewSpecialties && (
              <NavLink to="/admin/specialties" className={navClass}>
                {t("specialty.managementTitle")}
              </NavLink>
            )}

            {canViewDoctors && (
              <NavLink to="/admin/doctors" className={navClass}>
                {t("admin.doctorsManagement")}
              </NavLink>
            )}

            {canViewPatients && (
              <NavLink to="/admin/patients" className={navClass}>
                {t("admin.patients")}
              </NavLink>
            )}

            {canViewAppointments && (
              <NavLink to="/admin/appointments" className={navClass}>
                {t("admin.appointments")}
              </NavLink>
            )}

            {canViewConsultations && (
              <NavLink to="/admin/consultations" className={navClass}>
                {t("admin.consultations")}
              </NavLink>
            )}
          </nav>
        </aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col">
          {/* Topbar */}
          <header className="flex items-center justify-between bg-white px-6 py-4 shadow-sm">
            <div>
              <h1 className="text-xl font-semibold text-gray-800">
                {t("admin.adminDashboard")}
              </h1>
              <p className="text-sm text-gray-500">
                {t("admin.welcome")}, {user?.full_name || t("common.user")} ({role})
              </p>
            </div>

            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              
              <Link
                to="/"
                className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
              >
                {t("common.viewSite")}
              </Link>

              <button
                onClick={handleLogout}
                className="rounded-lg bg-gray-200 px-4 py-2 text-sm hover:bg-gray-300"
              >
                {t("common.logout")}
              </button>
            </div>
          </header>

          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;