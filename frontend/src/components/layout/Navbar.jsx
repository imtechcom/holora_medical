import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../LanguageSwitcher";
import Logo from "../Logo";

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
    <nav className="bg-white shadow-md px-4 md:px-8 py-3 flex justify-between items-center border-b-2 border-[#E06666]/10">
      {/* Logo and Brand */}
      <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition">
        <Logo size="md" />
        <div className="hidden sm:block">
          <div className="text-lg font-black text-[#E06666]">Holora</div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Medical</div>
        </div>
      </Link>

      {/* Desktop Navigation */}
      <div className="hidden md:flex gap-8 items-center">
        <Link 
          to="/" 
          className="text-gray-700 font-medium hover:text-[#E06666] transition"
        >
          {t("navbar.home")}
        </Link>
        <Link 
          to="/doctors" 
          className="text-gray-700 font-medium hover:text-[#E06666] transition"
        >
          {t("navbar.doctors")}
        </Link>
        {isAuthenticated && role === "patient" && (
          <Link 
            to="/appointments" 
            className="text-gray-700 font-medium hover:text-[#E06666] transition"
          >
            {t("navbar.appointments")}
          </Link>
        )}
        {isAdmin && (
          <Link 
            to="/admin" 
            className="font-semibold text-[#E06666] px-3 py-2 rounded-lg bg-[#E06666]/10 hover:bg-[#E06666]/20 transition"
          >
            {t("navbar.adminPanel")}
          </Link>
        )}
      </div>

      {/* Right Section */}
      <div className="flex gap-3 items-center">
        <LanguageSwitcher />
        
        {!isAuthenticated ? (
          <>
            <Link
              to="/login"
              className="hidden sm:block border-2 border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:border-[#E06666] hover:text-[#E06666] transition font-medium"
            >
              {t("navbar.login")}
            </Link>

            <Link
              to="/register"
              className="bg-[#E06666] text-white px-4 py-2 rounded-lg hover:bg-[#D55555] transition font-medium shadow-md hover:shadow-lg"
            >
              {t("navbar.register")}
            </Link>
          </>
        ) : (
          <>
            <div className="hidden sm:flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">
                {user?.full_name || t("common.user")}
              </span>
              
              {role === "patient" && (
                <Link
                  to="/profile"
                  className="text-sm px-3 py-2 rounded-lg hover:bg-[#E06666]/10 text-[#E06666] font-medium transition"
                >
                  {t("patient.profile")}
                </Link>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition font-medium"
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