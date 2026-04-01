import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../LanguageSwitcher";

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navClass = ({ isActive }) =>
    isActive
      ? "block rounded-lg bg-[#E06666] px-4 py-2 text-white shadow-md shadow-[#E06666]/20"
      : "block rounded-lg px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-[#FFF5F5] dark:hover:bg-slate-800 hover:text-[#E06666]";

  // Kiểm tra quyền hiển thị menu item
  const canViewUsers = role === "super_admin" || role === "admin";
  const canViewRoles = role === "super_admin" || role === "admin";
  const canViewPermissions = role === "super_admin" || role === "admin";
  const canViewSpecialties = role === "super_admin" || role === "admin";
  const canViewBranches = role === "super_admin" || role === "admin";
  const canViewDoctors = role === "super_admin" || role === "admin";
  const canViewPatients = role === "super_admin" || role === "admin" || role === "doctor";
  const canViewAppointments = role === "super_admin" || role === "admin";
  const canViewDoctorAppointments = role === "doctor";
  const canViewSchedules = role === "super_admin" || role === "admin" || role === "doctor";
  const canViewConsultations = role === "super_admin" || role === "admin" || role === "doctor";
  const canViewDoctorRequests = role === "doctor" || role === "admin" || role === "super_admin"; // Custom view for the UC12-14 flow

  return (
    <div className="min-h-screen bg-bg-app transition-colors duration-200">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}
        <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-bg-surface border-r border-border-main shadow-md transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="border-b border-border-main px-6 py-5">
            <Link to="/admin" className="text-2xl font-bold text-[#E06666]">
              Holora Admin
            </Link>
            <p className="mt-1 text-sm text-text-dim">{t("admin.medicalDashboard")}</p>
          </div>

          <nav className="space-y-2 p-4 overflow-y-auto flex-1" onClick={() => setSidebarOpen(false)}>
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

            {canViewBranches && (
              <NavLink to="/admin/branches" className={navClass}>
                {t("branch.managementTitle")}
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
            {canViewDoctorAppointments && (
              <NavLink to="/doctor/appointments" className={navClass}>
                📅 Lịch Hẹn Của Tôi
              </NavLink>
            )}

            {canViewSchedules && (
              <NavLink to="/admin/schedules" className={navClass}>
                🗓️ Phân Ca Làm Việc
              </NavLink>
            )}

            {canViewConsultations && (
              <NavLink to="/admin/consultations" className={navClass}>
                {t("admin.consultations")}
              </NavLink>
            )}

            {canViewDoctorRequests && (
              <NavLink to="/doctor/consultations" className={navClass}>
                🩺 Ca Tư vấn Bệnh nhân
              </NavLink>
            )}
          </nav>
        </aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col">
          {/* Topbar */}
          <header className="flex items-center justify-between bg-bg-surface px-4 py-4 shadow-sm border-b border-border-main">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(v => !v)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 lg:hidden">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <div>
                <h1 className="text-xl font-semibold text-text-main">
                  {t("admin.adminDashboard")}
                </h1>
                <p className="text-sm text-text-dim">
                  {t("admin.welcome")}, {user?.full_name || t("common.user")} ({role})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-yellow-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition"
              >
                {theme === "light" ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
                )}
              </button>
              <LanguageSwitcher />
              
              <Link
                to="/"
                className="rounded-lg border border-border-main px-4 py-2 text-sm text-text-main hover:bg-gray-50 dark:hover:bg-slate-800 transition"
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