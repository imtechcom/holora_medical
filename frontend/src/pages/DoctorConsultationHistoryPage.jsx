import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  CalendarDays,
  Loader2,
  MessageSquare,
  RefreshCw,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { consultationService } from "../services/consultationService";

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  in_progress: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
};

const STATUS_LABEL_KEYS = {
  pending: "doctor.consultationsPage.status.pending",
  in_progress: "doctor.consultationsPage.status.inProgress",
  completed: "doctor.consultationsPage.status.completed",
};

const formatDateTime = (value, locale) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return `${value}`;
  return d.toLocaleString(locale === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const DoctorConsultationHistoryPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await consultationService.getDoctorRequests();
      setConsultations(res.data || []);
    } catch (err) {
      console.error("Failed to fetch consultations:", err);
      setError(err.response?.data?.message || err.message || t("doctor.consultationsPage.errors.loadHistory"));
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const pending = consultations.filter((c) => c.status === "pending").length;
    const inProgress = consultations.filter((c) => c.status === "in_progress").length;
    const completed = consultations.filter((c) => c.status === "completed").length;
    return {
      total: consultations.length,
      pending,
      inProgress,
      completed,
    };
  }, [consultations]);

  const getStatusLabel = (status) => t(STATUS_LABEL_KEYS[status] || "doctor.consultationsPage.status.unknown");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-[#3B82F6] to-[#1E40AF] p-8 text-white shadow-lg md:p-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/75">{t("doctor.zone")}</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              {t("doctor.consultationsPage.title")}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85 md:text-base">
              {t("doctor.consultationsPage.heroDescription")}
            </p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              <Sparkles className="h-4 w-4" />
              {t("doctor.consultationsPage.summaryTitle")}
            </div>
            <p className="mt-2 text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-white/75">{t("doctor.consultationsPage.totalLabel")}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border-main bg-bg-surface p-5 shadow-sm dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-text-dim">{t("doctor.consultationsPage.pendingLabel")}</p>
            <CalendarDays className="h-5 w-5 text-amber-500" />
          </div>
          <p className="mt-2 text-3xl font-bold text-text-main">{stats.pending}</p>
        </div>
        <div className="rounded-2xl border border-border-main bg-bg-surface p-5 shadow-sm dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-text-dim">{t("doctor.consultationsPage.inProgressLabel")}</p>
            <MessageSquare className="h-5 w-5 text-sky-500" />
          </div>
          <p className="mt-2 text-3xl font-bold text-text-main">{stats.inProgress}</p>
        </div>
        <div className="rounded-2xl border border-border-main bg-bg-surface p-5 shadow-sm dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-text-dim">{t("doctor.consultationsPage.completedLabel")}</p>
            <Stethoscope className="h-5 w-5 text-emerald-500" />
          </div>
          <p className="mt-2 text-3xl font-bold text-text-main">{stats.completed}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-border-main bg-bg-surface shadow-sm dark:bg-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-main px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-text-main">{t("doctor.consultationsPage.listTitle")}</h2>
            <p className="text-sm text-text-dim">{t("doctor.consultationsPage.listDescription")}</p>
          </div>
          <button
            onClick={fetchHistory}
            className="inline-flex items-center gap-2 rounded-lg border border-border-main px-3 py-2 text-sm font-semibold text-text-main transition hover:bg-bg-app"
          >
            <RefreshCw className="h-4 w-4" />
            {t("common.refresh")}
          </button>
        </div>

        {error ? (
          <div className="mx-5 mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="overflow-x-auto px-2 pb-2 md:px-5 md:pb-5">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.08em] text-text-dim">
                <th className="px-3 py-4">{t("doctor.consultationsPage.columns.reason")}</th>
                <th className="px-3 py-4">{t("doctor.consultationsPage.columns.patient")}</th>
                <th className="px-3 py-4">{t("doctor.consultationsPage.columns.createdAt")}</th>
                <th className="px-3 py-4">{t("doctor.consultationsPage.columns.status")}</th>
                <th className="px-3 py-4 text-right">{t("doctor.consultationsPage.columns.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-3 py-10 text-center text-sm text-text-dim">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("doctor.consultationsPage.loading")}
                    </span>
                  </td>
                </tr>
              ) : consultations.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-3 py-10 text-center text-sm text-text-dim">
                    {t("doctor.consultationsPage.empty")}
                  </td>
                </tr>
              ) : (
                consultations.map((item) => (
                  <tr key={item.id} className="border-t border-border-main/70 text-sm">
                    <td className="px-3 py-4">
                      <p className="max-w-[320px] truncate font-semibold text-text-main" title={item.chief_complaint}>
                        {item.chief_complaint}
                      </p>
                    </td>
                    <td className="px-3 py-4 text-text-main">
                      {item.patient_name || t("doctor.consultationsPage.unassignedPatient")}
                    </td>
                    <td className="px-3 py-4 text-text-dim">{formatDateTime(item.created_at, i18n.language)}</td>
                    <td className="px-3 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          STATUS_STYLES[item.status] || "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-right">
                      <button
                        onClick={() => navigate(`/doctor/consultations/${item.id}`)}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#3B82F6] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2563EB]"
                      >
                        <MessageSquare className="h-4 w-4" />
                        {t("doctor.consultationsPage.viewAction")}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
};

export default DoctorConsultationHistoryPage;
