import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const HomePage = () => {
  const { i18n } = useTranslation();
  const isVi = i18n.language === "vi";

  return (
    <div className="relative min-h-[calc(100vh-140px)] overflow-hidden bg-white text-gray-900 dark:bg-[#0F141F] dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-180px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#E06666]/10 blur-3xl dark:bg-[#E06666]/12" />
        <div className="absolute bottom-[-120px] left-[-120px] h-[260px] w-[260px] rounded-full bg-[#F6B4B4]/25 blur-3xl dark:bg-[#4B2A34]/35" />
        <div className="absolute bottom-[-100px] right-[-110px] h-[250px] w-[250px] rounded-full bg-[#FFDAD4]/30 blur-3xl dark:bg-[#2E3C55]/30" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-140px)] max-w-5xl flex-col items-center justify-center px-6 py-14">
        <p className="inline-flex items-center rounded-full border border-[#E06666]/25 bg-[#FFF5F5] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#C14D4D] dark:border-[#E06666]/35 dark:bg-[#2B1F28] dark:text-[#F3A3A3]">
          {isVi ? "Holora AI Native" : "Holora AI Native"}
        </p>

        <h1 className="mt-7 text-center text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl dark:text-slate-100">
          {isVi ? "Chọn vai trò để bắt đầu" : "Choose your role to start"}
        </h1>

        <p className="mt-4 max-w-2xl text-center text-base leading-7 text-gray-600 sm:text-lg dark:text-slate-400">
          {isVi
            ? "Một điểm vào duy nhất, hệ thống đưa bạn thẳng đến đúng khu vực chức năng."
            : "One clean entry point, then direct routing to the right workspace."}
        </p>

        <div className="mt-10 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            to="/appointments"
            className="group flex min-h-[230px] flex-col rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#E06666]/40 hover:shadow-lg dark:border-slate-700 dark:bg-[#141B29] dark:hover:border-[#E06666]/50 dark:hover:shadow-[0_18px_35px_rgba(0,0,0,0.35)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#E06666] dark:text-[#F29A9A]">
              {isVi ? "For Patients" : "For Patients"}
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-gray-900 dark:text-slate-100">
              {isVi ? "Bệnh nhân" : "Patients"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-slate-400">
              {isVi
                ? "Đặt lịch, theo dõi lịch khám, gửi yêu cầu tư vấn trong một luồng đơn giản."
                : "Book appointments, track schedule, and request consultations in one simple flow."}
            </p>
            <p className="mt-auto pt-5 text-sm font-semibold text-[#C14D4D] transition group-hover:translate-x-1 dark:text-[#F29A9A]">
              {isVi ? "Đi tới patient flow" : "Go to patient flow"} →
            </p>
          </Link>

          <Link
            to="/register/provider"
            className="group flex min-h-[230px] flex-col rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#E06666]/40 hover:shadow-lg dark:border-slate-700 dark:bg-[#141B29] dark:hover:border-[#E06666]/50 dark:hover:shadow-[0_18px_35px_rgba(0,0,0,0.35)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#E06666] dark:text-[#F29A9A]">
              {isVi ? "For Doctors / Branch Owners" : "For Doctors / Branch Owners"}
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-gray-900 dark:text-slate-100">
              {isVi ? "Bác sĩ / Chủ chi nhánh" : "Doctors / Branch Owners"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-slate-400">
              {isVi
                ? "Mở chi nhánh, quản lý đội ngũ bác sĩ và vận hành lịch khám theo hệ thống."
                : "Open branches, manage doctor teams, and operate schedules in a focused workspace."}
            </p>
            <p className="mt-auto pt-5 text-sm font-semibold text-[#C14D4D] transition group-hover:translate-x-1 dark:text-[#F29A9A]">
              {isVi ? "Đi tới provider flow" : "Go to provider flow"} →
            </p>
          </Link>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500 dark:text-slate-500">
          <Link to="/login" className="transition hover:text-[#E06666] dark:hover:text-[#F29A9A]">
            {isVi ? "Đăng nhập" : "Sign in"}
          </Link>
          <span className="text-gray-300 dark:text-slate-600">•</span>
          <Link to="/pricing" className="transition hover:text-[#E06666] dark:hover:text-[#F29A9A]">
            {isVi ? "Bảng giá" : "Pricing"}
          </Link>
          <span className="text-gray-300 dark:text-slate-600">•</span>
          <Link to="/holoramind" className="text-xs uppercase tracking-[0.14em] transition hover:text-[#E06666] dark:hover:text-[#F29A9A]">
            HoloraMind
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
