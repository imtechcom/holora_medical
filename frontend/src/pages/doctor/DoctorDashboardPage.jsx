import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserCircle2,
  Users,
} from "lucide-react";

const DoctorDashboardPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [todayAppointments] = useState(3);
  const [pendingConsultations] = useState(2);
  const [totalPatients] = useState(45);
  const doctorName = user?.full_name || t("common.user");
  const specialtyName = user?.specialty || t("doctor.dashboardPage.notSpecified");
  const branchName = user?.branch || t("doctor.dashboardPage.notAssigned");

  const quickLinks = [
    {
      icon: <Calendar className="w-6 h-6" />,
      title: t("doctor.myAppointments"),
      description: t("doctor.dashboardPage.quickLinks.appointmentsDescription", { count: todayAppointments }),
      link: "/doctor/appointments",
      color: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300",
    },
    {
      icon: <Stethoscope className="w-6 h-6" />,
      title: t("doctor.consultationRequests"),
      description: t("doctor.dashboardPage.quickLinks.consultationsDescription", { count: pendingConsultations }),
      link: "/doctor/consultations",
      color: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-300",
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: t("doctor.schedule"),
      description: t("doctor.dashboardPage.quickLinks.scheduleDescription"),
      link: "/doctor/schedule",
      color: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: t("doctor.myPatients"),
      description: t("doctor.dashboardPage.quickLinks.patientsDescription", { count: totalPatients }),
      link: "/doctor/patients",
      color: "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-300",
    },
  ];

  const stats = [
    {
      label: t("doctor.todayAppointments"),
      value: todayAppointments,
      icon: <Calendar className="w-10 h-10 text-blue-500 opacity-25" />,
      accent: "border-blue-500",
    },
    {
      label: t("doctor.pendingRequests"),
      value: pendingConsultations,
      icon: <Stethoscope className="w-10 h-10 text-green-500 opacity-25" />,
      accent: "border-green-500",
    },
    {
      label: t("doctor.totalPatients"),
      value: totalPatients,
      icon: <Users className="w-10 h-10 text-amber-500 opacity-25" />,
      accent: "border-amber-500",
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="overflow-hidden rounded-2xl sm:rounded-[28px] bg-gradient-to-br from-[#E06666] to-[#C04444] p-5 sm:p-8 md:p-10 text-white shadow-lg">
        <div className="grid gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/75">{t("doctor.zone")}</p>
            <h1 className="mt-2 sm:mt-3 text-xl sm:text-3xl font-bold tracking-tight md:text-4xl leading-tight">
              {t("doctor.dashboardPage.heroTitle", { name: doctorName })}
            </h1>
            <p className="mt-2 sm:mt-3 max-w-2xl text-xs sm:text-sm leading-6 text-white/85 md:text-base">
              {t("doctor.welcomeMessage")}
            </p>

            <div className="mt-3 sm:mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                {t("doctor.dashboardPage.specialtyLabel", { value: specialtyName })}
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                {t("doctor.dashboardPage.branchLabel", { value: branchName })}
              </span>
            </div>
          </div>

          <div className="rounded-xl sm:rounded-2xl border border-white/15 bg-white/10 p-4 sm:p-5 backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
              <Sparkles className="h-4 w-4" />
              {t("doctor.dashboardPage.todayAtGlance")}
            </div>
            <div className="mt-4 sm:mt-5 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xl sm:text-2xl font-bold">{todayAppointments}</p>
                <p className="text-xs text-white/70">{t("doctor.dashboardPage.appointmentsShort")}</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">{pendingConsultations}</p>
                <p className="text-xs text-white/70">{t("doctor.dashboardPage.pendingRequestsShort")}</p>
              </div>
            </div>
            <div className="mt-3 sm:mt-4 rounded-xl sm:rounded-2xl border border-white/10 bg-black/10 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-white/85">
              {t("doctor.dashboardPage.performanceHint")}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3 sm:gap-4">
        {stats.map((item) => (
          <div
            key={item.label}
            className={`rounded-xl sm:rounded-2xl border-l-4 ${item.accent} border border-border-main bg-bg-surface p-3 sm:p-6 shadow-sm dark:bg-slate-800`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-text-dim truncate">{item.label}</p>
                <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-text-main">{item.value}</p>
              </div>
              <div className="hidden sm:block shrink-0">{item.icon}</div>
            </div>
          </div>
        ))}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-text-main">
              {t("doctor.quickAccess")}
            </h2>
            <p className="mt-1 text-sm text-text-dim">
              {t("doctor.dashboardPage.quickAccessDescription")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {quickLinks.map((link) => (
            <Link
              key={link.link}
              to={link.link}
              className="group rounded-xl sm:rounded-2xl border border-border-main bg-bg-surface p-4 sm:p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-800"
            >
              <div className={`mb-3 sm:mb-4 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl ${link.color}`}>
                {React.cloneElement(link.icon, { className: "w-5 h-5 sm:w-6 sm:h-6" })}
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-text-main leading-tight">{link.title}</h3>
              <p className="mt-1 text-xs sm:text-sm text-text-dim line-clamp-2">{link.description}</p>
              <div className="mt-3 sm:mt-4 inline-flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-semibold text-[#E06666] transition group-hover:gap-2 sm:group-hover:gap-3">
                {t("doctor.dashboardPage.openAction")}
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        <div className="rounded-2xl sm:rounded-3xl border border-border-main bg-[linear-gradient(135deg,#eef6ff_0%,#f4ecff_100%)] p-5 sm:p-8 shadow-sm dark:border-slate-700 dark:bg-[linear-gradient(135deg,rgba(30,41,59,1)_0%,rgba(51,65,85,0.92)_100%)]">
          <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-base sm:text-xl font-semibold text-text-main">
                <UserCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-[#E06666] shrink-0" />
                {t("doctor.updateProfile")}
              </h2>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm leading-6 text-text-dim">
                {t("doctor.updateProfileDesc")}
              </p>
            </div>
            <Link
              to="/doctor/profile"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E06666] px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-semibold text-white transition hover:bg-[#D85555] shrink-0"
            >
              {t("common.editProfile")}
            </Link>
          </div>

          <div className="mt-4 sm:mt-6 grid gap-2 sm:gap-3 grid-cols-2">
            <div className="rounded-xl sm:rounded-2xl border border-white/40 bg-white/70 p-3 sm:p-4 dark:border-slate-600 dark:bg-slate-900/40">
              <p className="text-xs uppercase tracking-[0.2em] text-text-dim">{t("doctor.dashboardPage.profileTrustTitle")}</p>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm font-medium text-text-main">
                {t("doctor.dashboardPage.profileTrustDescription")}
              </p>
            </div>
            <div className="rounded-xl sm:rounded-2xl border border-white/40 bg-white/70 p-3 sm:p-4 dark:border-slate-600 dark:bg-slate-900/40">
              <p className="text-xs uppercase tracking-[0.2em] text-text-dim">{t("doctor.dashboardPage.visibilityImpactTitle")}</p>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm font-medium text-text-main">
                {t("doctor.dashboardPage.visibilityImpactDescription")}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl sm:rounded-3xl border border-border-main bg-bg-surface p-5 sm:p-8 shadow-sm dark:bg-slate-800">
          <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-base sm:text-xl font-semibold text-text-main">
                <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-[#E06666] shrink-0" />
                {t("doctor.setAvailability")}
              </h3>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm leading-6 text-text-dim">
                {t("doctor.setAvailabilityDesc")}
              </p>
            </div>
            <Link
              to="/doctor/schedule"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E06666] px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-semibold text-white transition hover:bg-[#D55555] shrink-0"
            >
              {t("doctor.configureSchedule")}
            </Link>
          </div>

          <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
            <div className="flex items-start gap-3 rounded-xl sm:rounded-2xl border border-border-main bg-bg-app p-3 sm:p-4 dark:bg-slate-900">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500 shrink-0" />
              <p className="text-xs sm:text-sm text-text-main">{t("doctor.dashboardPage.scheduleTipOne")}</p>
            </div>
            <div className="flex items-start gap-3 rounded-xl sm:rounded-2xl border border-border-main bg-bg-app p-3 sm:p-4 dark:bg-slate-900">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500 shrink-0" />
              <p className="text-xs sm:text-sm text-text-main">{t("doctor.dashboardPage.scheduleTipTwo")}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DoctorDashboardPage;
