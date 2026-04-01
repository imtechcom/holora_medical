import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { User, LogOut, Settings, Shield } from "lucide-react";

const UserDropdown = ({ profilePath = "/patient/profile" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user, role, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
      >
        <div className="w-9 h-9 rounded-full bg-[#E06666] flex items-center justify-center text-white font-bold text-sm shadow-sm">
          {getInitials(user?.full_name)}
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-semibold text-text-main leading-tight truncate max-w-[120px]">
            {user?.full_name || t("common.user")}
          </p>
          <p className="text-[11px] text-text-dim leading-tight capitalize">
            {t(`admin.role${role.charAt(0).toUpperCase() + role.slice(1)}`) || role}
          </p>
        </div>
        <svg className={`w-4 h-4 text-text-dim transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 border-b border-gray-50 dark:border-slate-700 mb-1">
            <p className="text-sm font-bold text-text-main truncate">{user?.full_name}</p>
            <p className="text-xs text-text-dim truncate">{user?.email}</p>
          </div>

          <div className="px-2 space-y-1">
            <Link
              to={profilePath}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-main hover:bg-[#FFF5F5] dark:hover:bg-slate-700 hover:text-[#E06666] transition-colors"
            >
              <User className="w-4 h-4" />
              <span>{t("patient.myProfile")}</span>
            </Link>

            <Link
              to={profilePath} // Temporary link for settings
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-main hover:bg-[#FFF5F5] dark:hover:bg-slate-700 hover:text-[#E06666] transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>{t("admin.configuration") || "Settings"}</span>
            </Link>
            
            {["admin", "super_admin"].includes(role) && (
               <Link
               to="/admin"
               onClick={() => setIsOpen(false)}
               className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-main hover:bg-[#FFF5F5] dark:hover:bg-slate-700 hover:text-[#E06666] transition-colors"
             >
               <Shield className="w-4 h-4" />
               <span>{t("navbar.adminPanel")}</span>
             </Link>
            )}
          </div>

          <div className="my-2 border-t border-gray-50 dark:border-slate-700" />

          <div className="px-2">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>{t("common.logout")}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
