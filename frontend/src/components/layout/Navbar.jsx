import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../LanguageSwitcher";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, role, logout } = useAuth();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Kiểm tra có phải admin hoặc super_admin hoặc doctor không
  const isAdmin = role === "super_admin" || role === "admin" || role === "doctor";

  return (
    <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
      <Link to="/" className="text-xl font-bold text-[#E06666]">
        {t("navbar.holora")}
      </Link>

      <div className="hidden md:flex gap-6 items-center">
        <Link to="/" className="hover:text-[#E06666]">{t("navbar.home")}</Link>
        <Link to="/doctors" className="hover:text-[#E06666]">{t("navbar.doctors")}</Link>
        {isAuthenticated && role === "patient" && (
          <Link to="/appointments" className="hover:text-[#E06666]">{t("navbar.appointments")}</Link>
        )}
        {isAdmin && (
          <Link to="/admin" className="hover:text-[#E06666] font-semibold text-[#E06666]">
            {t("navbar.adminPanel")}
          </Link>
        )}
      </div>

      <div className="flex gap-3 items-center">
        <LanguageSwitcher />
        
        {!isAuthenticated ? (
          <>
            <Link
              to="/login"
              className="border px-4 py-2 rounded-lg hover:bg-gray-100"
            >
              {t("navbar.login")}
            </Link>

            <Link
              to="/register"
              className="bg-[#E06666] text-white px-4 py-2 rounded-lg hover:bg-red-500"
            >
              {t("navbar.register")}
            </Link>
          </>
        ) : (
          <>
            <span className="text-sm font-medium">
              {t("common.hello")}, {user?.full_name || t("common.user")}
            </span>

            <button
              onClick={handleLogout}
              className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              {t("navbar.logout")}
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;