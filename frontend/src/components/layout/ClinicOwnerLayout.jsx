import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../LanguageSwitcher";
import Logo from "../Logo";
import NotificationBadge from "../NotificationBadge";
import Breadcrumb from "../Breadcrumb";

const ClinicOwnerLayout = ({ children }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navClass = ({ isActive }) =>
    isActive
      ? "flex items-center gap-3 rounded-lg bg-[#E06666] px-4 py-2.5 text-white font-medium transition"
      : "flex items-center gap-3 rounded-lg px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-[#FFF5F5] dark:hover:bg-slate-800 hover:text-[#E06666] transition";

  return (
    <div className="min-h-screen bg-bg-app dark:bg-slate-900 transition-colors duration-200">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-bg-surface dark:bg-slate-800 shadow-md flex flex-col border-r border-border-main">
          <div className="border-b border-border-main px-6 py-5">
            <Link to="/clinic-owner" className="flex items-center gap-2">
              <Logo size="sm" />
              <div>
                <div className="text-base font-bold text-[#E06666]">{t("clinicOwner.portal") || "Provider Portal"}</div>
                <div className="text-xs text-text-dim">{t("common.holora") || "Holora Medical"}</div>
              </div>
            </Link>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            <NavLink to="/clinic-owner" end className={navClass}>
              <span>🏠</span>
              <span>{t("clinicOwner.dashboard") || "Dashboard"}</span>
            </NavLink>

            <div className="pt-3 pb-1">
              <p className="px-4 text-xs font-semibold uppercase tracking-wider text-text-dim">
                {t("clinicOwner.myClinic") || "My Clinic"}
              </p>
            </div>

            <NavLink to="/clinic-owner/branches" className={navClass}>
              <span>🏥</span>
              <span>{t("clinicOwner.myBranches") || "My Branches"}</span>
            </NavLink>

            <NavLink to="/clinic-owner/doctors" className={navClass}>
              <span>👨‍⚕️</span>
              <span>{t("clinicOwner.myDoctors") || "My Doctors"}</span>
            </NavLink>

            <NavLink to="/clinic-owner/patients" className={navClass}>
              <span>🧑‍⚕️</span>
              <span>{t("clinicOwner.myPatients") || "My Patients"}</span>
            </NavLink>

            <div className="pt-3 pb-1">
              <p className="px-4 text-xs font-semibold uppercase tracking-wider text-text-dim">
                {t("clinicOwner.billing") || "Billing"}
              </p>
            </div>

            <NavLink to="/clinic-owner/subscription" className={navClass}>
              <span>💳</span>
              <span>{t("clinicOwner.subscription") || "Subscription"}</span>
            </NavLink>
          </nav>

          <div className="border-t border-border-main p-4 space-y-3">
            <p className="text-xs text-text-dim truncate">{user?.full_name || user?.email}</p>
            <p className="text-xs text-[#E06666] font-medium capitalize">{t("clinicOwner.role") || "Clinic Owner"}</p>
            <button
              onClick={handleLogout}
              className="w-full rounded-lg bg-gray-100 dark:bg-slate-700 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition"
            >
              {t("common.logout")}
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col">
          {/* Topbar */}
          <header className="flex items-center justify-between bg-bg-surface dark:bg-slate-800 px-6 py-4 shadow-sm border-b border-border-main">
            <div>
              <h1 className="text-xl font-semibold text-text-main">{t("clinicOwner.portal") || "Provider Portal"}</h1>
              <p className="text-sm text-text-dim">
                {t("admin.welcome")}, {user?.full_name || t("common.user")}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <NotificationBadge />
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-yellow-400 hover:bg-gray-200 dark:hover:bg-slate-600 transition"
              >
                {theme === "light" ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1m-16 0H1m15.364 5.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
              </button>
              <LanguageSwitcher />
              <Link
                to="/"
                className="rounded-lg border border-border-main px-4 py-2 text-sm text-text-main hover:bg-bg-app dark:hover:bg-slate-700 transition"
              >
                {t("common.viewSite") || "View Site"}
              </Link>
            </div>
          </header>

          {/* Breadcrumb */}
          <Breadcrumb />

          {/* Main content area */}
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  );
};

export default ClinicOwnerLayout;
