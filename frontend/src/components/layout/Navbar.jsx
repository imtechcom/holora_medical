import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../LanguageSwitcher";
import Logo from "../Logo";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, role, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/login");
  };

  const isAdmin = role === "super_admin" || role === "admin" || role === "doctor";
  const isClinicOwner = role === "clinic_owner";

  useEffect(() => {
    const onClickOutside = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    const onEsc = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);

    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  return (
    <nav className="relative z-[100] overflow-visible border-b border-[#E06666]/15 bg-white/95 shadow-sm backdrop-blur dark:bg-slate-900/95 dark:border-slate-700">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 overflow-visible px-3 py-2.5 md:px-5">
        <Link to="/" className="flex items-center gap-2.5 transition hover:opacity-85">
          <Logo size="md" />
          <span className="text-base font-semibold tracking-tight text-[#E06666] sm:text-lg">
            Holora Medical
          </span>
        </Link>

        <div className="hidden items-center gap-5 md:flex">
          <Link to="/" className="text-sm font-medium text-gray-700 transition hover:text-[#E06666] dark:text-slate-200">
            {t("navbar.home")}
          </Link>
          <Link to="/doctors" className="text-sm font-medium text-gray-700 transition hover:text-[#E06666] dark:text-slate-200">
            {t("navbar.doctors")}
          </Link>
          <Link to="/pricing" className="text-sm font-medium text-gray-700 transition hover:text-[#E06666] dark:text-slate-200">
            {t("navbar.pricing")}
          </Link>
          <Link to="/branches" className="text-sm font-medium text-gray-700 transition hover:text-[#E06666] dark:text-slate-200">
            Branches
          </Link>
          <Link to="/holoramind" className="text-sm font-medium text-gray-700 transition hover:text-[#E06666] dark:text-slate-200">
            HoloraMind
          </Link>

          {isAuthenticated && role === "patient" && (
            <Link to="/appointments" className="text-sm font-medium text-gray-700 transition hover:text-[#E06666] dark:text-slate-200">
              {t("navbar.appointments")}
            </Link>
          )}

          {isAdmin && (
            <Link
              to="/admin"
              className="rounded-lg bg-[#E06666]/10 px-3 py-1.5 text-sm font-semibold text-[#E06666] transition hover:bg-[#E06666]/20"
            >
              {t("navbar.adminPanel")}
            </Link>
          )}

          {isClinicOwner && (
            <Link
              to="/clinic-owner"
              className="rounded-lg bg-[#E06666]/10 px-3 py-1.5 text-sm font-semibold text-[#E06666] transition hover:bg-[#E06666]/20"
            >
              {t("navbar.providerPortal")}
            </Link>
          )}
        </div>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-[#E06666]/40 hover:text-[#E06666] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#E06666] text-xs font-bold uppercase text-white">
              {(user?.full_name || "U").charAt(0)}
            </span>
            <span className="hidden sm:inline">{isAuthenticated ? (user?.full_name || t("common.user")) : "Menu"}</span>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 z-[120] mt-2 w-72 rounded-2xl border border-gray-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-3 rounded-xl bg-gray-50 p-3 dark:bg-slate-800">
                <p className="truncate text-sm font-semibold text-gray-800 dark:text-slate-100">{isAuthenticated ? (user?.full_name || t("common.user")) : "Guest"}</p>
                <p className="truncate text-xs text-gray-500 dark:text-slate-400">{isAuthenticated ? (user?.email || role) : "Not signed in"}</p>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex w-full items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>
                  <span className="text-xs text-gray-500 dark:text-slate-400">{theme === "light" ? "OFF" : "ON"}</span>
                </button>

                <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-slate-800">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Language</p>
                  <LanguageSwitcher />
                </div>
              </div>

              <div className="my-3 border-t border-gray-100 dark:border-slate-700" />

              <div className="space-y-2">
                {!isAuthenticated ? (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-[#E06666]/40 hover:text-[#E06666] dark:border-slate-700 dark:text-slate-200"
                    >
                      {t("navbar.login")}
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-lg bg-[#E06666] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#D55555]"
                    >
                      {t("navbar.register")}
                    </Link>
                  </>
                ) : (
                  <>
                    {role === "patient" && (
                      <>
                        <Link
                          to="/branches"
                          onClick={() => setMenuOpen(false)}
                          className="block rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-[#E06666]/40 hover:text-[#E06666] dark:border-slate-700 dark:text-slate-200"
                        >
                          Tim chi nhanh
                        </Link>
                        <Link
                          to="/profile"
                          onClick={() => setMenuOpen(false)}
                          className="block rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-[#E06666]/40 hover:text-[#E06666] dark:border-slate-700 dark:text-slate-200"
                        >
                          {t("patient.profile")}
                        </Link>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full rounded-lg bg-gray-100 px-3 py-2 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      {t("navbar.logout")}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
