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
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-[#E06666] to-[#C04444] p-8 text-white shadow-lg md:p-10">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/75">{t("doctor.zone")}</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              {t("doctor.dashboardPage.heroTitle", { name: doctorName })}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85 md:text-base">
              {t("doctor.welcomeMessage")}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                {t("doctor.dashboardPage.specialtyLabel", { value: specialtyName })}
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                {t("doctor.dashboardPage.branchLabel", { value: branchName })}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
              <Sparkles className="h-4 w-4" />
              {t("doctor.dashboardPage.todayAtGlance")}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold">{todayAppointments}</p>
                <p className="text-xs text-white/70">{t("doctor.dashboardPage.appointmentsShort")}</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingConsultations}</p>
                <p className="text-xs text-white/70">{t("doctor.dashboardPage.pendingRequestsShort")}</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-white/85">
              {t("doctor.dashboardPage.performanceHint")}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {stats.map((item) => (
          <div
            key={item.label}
            className={`rounded-2xl border-l-4 ${item.accent} border border-border-main bg-bg-surface p-6 shadow-sm dark:bg-slate-800`}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-text-dim">{item.label}</p>
                <p className="mt-2 text-3xl font-bold text-text-main">{item.value}</p>
              </div>
              {item.icon}
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {quickLinks.map((link) => (
            <Link
              key={link.link}
              to={link.link}
              className="group rounded-2xl border border-border-main bg-bg-surface p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-800"
            >
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${link.color}`}>
                {link.icon}
              </div>
              <h3 className="font-semibold text-text-main">{link.title}</h3>
              <p className="mt-1 text-sm text-text-dim">{link.description}</p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#E06666] transition group-hover:gap-3">
                {t("doctor.dashboardPage.openAction")}
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="rounded-3xl border border-border-main bg-[linear-gradient(135deg,#eef6ff_0%,#f4ecff_100%)] p-8 shadow-sm dark:border-slate-700 dark:bg-[linear-gradient(135deg,rgba(30,41,59,1)_0%,rgba(51,65,85,0.92)_100%)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-xl">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-text-main">
                <UserCircle2 className="h-5 w-5 text-[#E06666]" />
                {t("doctor.updateProfile")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-text-dim">
                {t("doctor.updateProfileDesc")}
              </p>
            </div>

            <Link
              to="/doctor/profile"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E06666] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#D85555]"
            >
              {t("common.editProfile")}
            </Link>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/40 bg-white/70 p-4 dark:border-slate-600 dark:bg-slate-900/40">
              <p className="text-xs uppercase tracking-[0.2em] text-text-dim">{t("doctor.dashboardPage.profileTrustTitle")}</p>
              <p className="mt-2 text-sm font-medium text-text-main">
                {t("doctor.dashboardPage.profileTrustDescription")}
              </p>
            </div>
            <div className="rounded-2xl border border-white/40 bg-white/70 p-4 dark:border-slate-600 dark:bg-slate-900/40">
              <p className="text-xs uppercase tracking-[0.2em] text-text-dim">{t("doctor.dashboardPage.visibilityImpactTitle")}</p>
              <p className="mt-2 text-sm font-medium text-text-main">
                {t("doctor.dashboardPage.visibilityImpactDescription")}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border-main bg-bg-surface p-8 shadow-sm dark:bg-slate-800">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-xl">
              <h3 className="flex items-center gap-2 text-xl font-semibold text-text-main">
                <ShieldCheck className="h-5 w-5 text-[#E06666]" />
                {t("doctor.setAvailability")}
              </h3>
              <p className="mt-2 text-sm leading-6 text-text-dim">
                {t("doctor.setAvailabilityDesc")}
              </p>
            </div>

            <Link
              to="/doctor/schedule"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E06666] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#D55555]"
            >
              {t("doctor.configureSchedule")}
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-start gap-3 rounded-2xl border border-border-main bg-bg-app p-4 dark:bg-slate-900">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
              <p className="text-sm text-text-main">{t("doctor.dashboardPage.scheduleTipOne")}</p>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-border-main bg-bg-app p-4 dark:bg-slate-900">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
              <p className="text-sm text-text-main">{t("doctor.dashboardPage.scheduleTipTwo")}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DoctorDashboardPage;
