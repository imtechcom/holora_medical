import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../LanguageSwitcher";
import Logo from "../Logo";
import NotificationBadge from "../NotificationBadge";
import Breadcrumb from "../Breadcrumb";
import UserDropdown from "../UserDropdown";
import { 
  Home, 
  Hospital, 
  Users, 
  Calendar, 
  Stethoscope, 
  Bot, 
  User,
  Moon,
  Sun,
  Layout,
  Shield
} from "lucide-react";

const PatientLayout = ({ children }) => {
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
            <Link to="/patient" className="flex items-center gap-2">
              <Logo size="sm" />
              <div>
                <div className="text-base font-bold text-[#E06666]">{t("patient.zone") || "My Zone"}</div>
                <div className="text-xs text-text-dim">{t("common.holora") || "Holora Medical"}</div>
              </div>
            </Link>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            <NavLink to="/patient" end className={navClass}>
              <Home className="w-5 h-5" />
              <span>{t("patient.dashboard")}</span>
            </NavLink>

            <div className="pt-3 pb-1">
              <p className="px-4 text-xs font-semibold uppercase tracking-wider text-text-dim">
                {t("patient.discovery")}
              </p>
            </div>

            <NavLink to="/patient/branches" className={navClass}>
              <Hospital className="w-5 h-5" />
              <span>{t("patient.browseBranches")}</span>
            </NavLink>

            <NavLink to="/patient/doctors" className={navClass}>
              <Users className="w-5 h-5" />
              <span>{t("patient.browseDoctors")}</span>
            </NavLink>

            <div className="pt-3 pb-1">
              <p className="px-4 text-xs font-semibold uppercase tracking-wider text-text-dim">
                {t("patient.myActivity")}
              </p>
            </div>

            <NavLink to="/patient/appointments" className={navClass}>
              <Calendar className="w-5 h-5" />
              <span>{t("patient.myAppointments")}</span>
            </NavLink>

            <NavLink to="/patient/consultations" className={navClass}>
              <Stethoscope className="w-5 h-5" />
              <span>{t("patient.myConsultations")}</span>
            </NavLink>

            <div className="pt-3 pb-1">
              <p className="px-4 text-xs font-semibold uppercase tracking-wider text-text-dim">
                {t("patient.tools")}
              </p>
            </div>

            <NavLink to="/patient/holoramind" className={navClass}>
              <Bot className="w-5 h-5 text-[#E06666]" />
              <span className="font-semibold text-[#E06666]">{t("patient.aiAssistant")}</span>
            </NavLink>

            <NavLink to="/patient/profile" className={navClass}>
              <User className="w-5 h-5" />
              <span>{t("patient.profile")}</span>
            </NavLink>
          </nav>

          <div className="border-t border-border-main p-4">
            <div className="flex items-center gap-3 px-4 py-2 opacity-60">
               <Shield className="w-4 h-4 text-[#E06666]" />
               <span className="text-xs font-bold uppercase tracking-widest text-[#E06666]">{t("patient.zone")}</span>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Topbar */}
          <header className="flex h-16 items-center justify-between bg-bg-surface dark:bg-slate-800 px-6 shadow-sm border-b border-border-main z-40">
            <div className="flex items-center gap-4">
               <div className="lg:hidden">
                 {/* Mobile menu toggle could go here */}
               </div>
               <h1 className="text-lg font-bold text-text-main flex items-center gap-2">
                 <Layout className="w-5 h-5 text-[#E06666]" />
                 {t("patient.myZone")}
               </h1>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-yellow-400 hover:bg-gray-100 dark:hover:bg-slate-600 transition-all"
              >
                {theme === "light" ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </button>
              
              <div className="h-8 w-px bg-border-main" />
              
              <NotificationBadge />
              <LanguageSwitcher />

              <div className="h-8 w-px bg-border-main" />

              <UserDropdown profilePath="/patient/profile" />
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

export default PatientLayout;
