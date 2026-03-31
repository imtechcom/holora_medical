import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../LanguageSwitcher";
import Logo from "../Logo";

const ClinicOwnerLayout = ({ children }) => {
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navClass = ({ isActive }) =>
    isActive
      ? "flex items-center gap-2 rounded-lg bg-[#E06666] px-4 py-2 text-white font-medium"
      : "flex items-center gap-2 rounded-lg px-4 py-2 text-gray-700 hover:bg-[#FFF5F5] hover:text-[#E06666] transition";

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md flex flex-col">
          <div className="border-b px-6 py-5">
            <Link to="/clinic-owner" className="flex items-center gap-2">
              <Logo size="sm" />
              <div>
                <div className="text-base font-bold text-[#E06666]">Provider Portal</div>
                <div className="text-xs text-gray-500">Holora Medical</div>
              </div>
            </Link>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            <NavLink to="/clinic-owner" end className={navClass}>
              🏠 {t("clinicOwner.dashboard") || "Dashboard"}
            </NavLink>

            <div className="pt-3 pb-1">
              <p className="px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                {t("clinicOwner.myClinic") || "My Clinic"}
              </p>
            </div>

            <NavLink to="/clinic-owner/branches" className={navClass}>
              🏥 {t("clinicOwner.myBranches") || "My Branches"}
            </NavLink>

            <NavLink to="/clinic-owner/doctors" className={navClass}>
              👨‍⚕️ {t("clinicOwner.myDoctors") || "My Doctors"}
            </NavLink>

            <NavLink to="/clinic-owner/subscription" className={navClass}>
              💳 {t("clinicOwner.subscription") || "Subscription"}
            </NavLink>
          </nav>

          <div className="border-t p-4">
            <p className="text-xs text-gray-500 truncate mb-1">{user?.full_name || user?.email}</p>
            <p className="text-xs text-[#E06666] font-medium capitalize mb-3">{role}</p>
            <button
              onClick={handleLogout}
              className="w-full rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 transition"
            >
              {t("common.logout")}
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex flex-1 flex-col">
          {/* Topbar */}
          <header className="flex items-center justify-between bg-white px-6 py-4 shadow-sm">
            <div>
              <h1 className="text-xl font-semibold text-gray-800">Provider Portal</h1>
              <p className="text-sm text-gray-500">
                {t("admin.welcome")}, {user?.full_name || t("common.user")}
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
            </div>
          </header>

          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  );
};

export default ClinicOwnerLayout;
