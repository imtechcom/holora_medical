import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertCircle, CalendarDays, Loader2, MessageSquare,
  RefreshCw, Search, Sparkles, Stethoscope, User,
} from "lucide-react";
import { consultationService } from "../services/consultationService";

/* ── Constants ─────────────────────────────── */
const STATUS_STYLES = {
  pending:     "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  in_progress: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  completed:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
};

/* ── Helpers ────────────────────────────────── */
const fmtDateTime = (v, lang) => {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString(lang === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
};

/* ── Skeletons ─────────────────────────────── */
const SkeletonHero = () => (
  <div className="animate-pulse rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-8 md:p-10">
    <div className="h-3 w-24 rounded bg-slate-700" />
    <div className="mt-4 h-8 w-64 rounded bg-slate-700" />
    <div className="mt-3 h-4 w-80 rounded bg-slate-700" />
  </div>
);
const SkeletonCard = () => (
  <div className="animate-pulse rounded-2xl border border-border-main bg-bg-surface p-4 dark:bg-slate-800">
    <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
    <div className="mt-3 h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
    <div className="mt-3 flex gap-2">
      <div className="h-6 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
      <div className="h-6 w-20 rounded-full bg-slate-200 dark:bg-slate-700" />
    </div>
  </div>
);

/* ══════════════════════════════════════════════
   DoctorConsultationHistoryPage — Doctor Zone (cyan)
   ══════════════════════════════════════════════ */
const DoctorConsultationHistoryPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const statusLabels = useMemo(() => ({
    pending:     t("doctor.consultationsPage.status.pending",    { defaultValue: "Pending" }),
    in_progress: t("doctor.consultationsPage.status.inProgress", { defaultValue: "In Progress" }),
    completed:   t("doctor.consultationsPage.status.completed",  { defaultValue: "Completed" }),
  }), [t]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await consultationService.getDoctorRequests();
      setConsultations(res.data || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || t("doctor.consultationsPage.errors.loadHistory", { defaultValue: "Failed to load consultations" }));
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchHistory(); }, []);

  const stats = useMemo(() => ({
    total:      consultations.length,
    pending:    consultations.filter((c) => c.status === "pending").length,
    inProgress: consultations.filter((c) => c.status === "in_progress").length,
    completed:  consultations.filter((c) => c.status === "completed").length,
  }), [consultations]);

  const filtered = useMemo(() => {
    let list = consultations;
    if (statusFilter) list = list.filter((c) => c.status === statusFilter);
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((c) =>
        (c.chief_complaint || "").toLowerCase().includes(q) ||
        (c.patient_name || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [consultations, statusFilter, searchTerm]);

  const getStatusLabel = (s) => statusLabels[s] || s;

  return (
    <div className="mx-auto max-w-6xl space-y-6">

      {/* ── Hero ── */}
      {loading ? <SkeletonHero /> : (
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-8 text-white shadow-lg md:p-10">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-teal-500/10 blur-2xl" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                {t("doctor.zone", { defaultValue: "Doctor Zone" })}
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                {t("doctor.consultationsPage.title", { defaultValue: "Consultation Requests" })}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
                {t("doctor.consultationsPage.heroDescription", { defaultValue: "Review and respond to patient consultation requests." })}
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                {t("doctor.consultationsPage.summaryTitle", { defaultValue: "Overview" })}
              </div>
              <p className="mt-2 text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-slate-400">{t("doctor.consultationsPage.totalLabel", { defaultValue: "Total" })}</p>
            </div>
          </div>
        </section>
      )}

      {/* ── Stat cards ── */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
      ) : (
        <section className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {[
            { label: t("doctor.consultationsPage.pendingLabel",    { defaultValue: "Pending" }),     value: stats.pending,    icon: CalendarDays,  color: "text-amber-500" },
            { label: t("doctor.consultationsPage.inProgressLabel", { defaultValue: "In Progress" }), value: stats.inProgress, icon: MessageSquare, color: "text-sky-500" },
            { label: t("doctor.consultationsPage.completedLabel",  { defaultValue: "Completed" }),   value: stats.completed,  icon: Stethoscope,   color: "text-emerald-500" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border-main bg-bg-surface p-5 shadow-sm dark:bg-slate-800">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-text-dim">{s.label}</p>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <p className="mt-2 text-3xl font-bold text-text-main">{s.value}</p>
            </div>
          ))}
        </section>
      )}

      {/* ── List section ── */}
      <section className="rounded-2xl border border-border-main bg-bg-surface shadow-sm dark:bg-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-main px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-text-main">
              {t("doctor.consultationsPage.listTitle", { defaultValue: "Consultations List" })}
            </h2>
            <p className="text-sm text-text-dim">
              {t("doctor.consultationsPage.listDescription", { defaultValue: "All consultation requests from patients" })}
            </p>
          </div>
          <button onClick={fetchHistory}
            className="inline-flex items-center gap-2 rounded-xl border border-border-main px-3 py-2 text-xs font-semibold text-text-main transition hover:bg-bg-app">
            <RefreshCw className="h-3.5 w-3.5" /> {t("common.refresh", { defaultValue: "Refresh" })}
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-border-main px-5 py-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim" />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("doctor.consultationsPage.searchPlaceholder", { defaultValue: "Search by complaint or patient..." })}
              className="w-full rounded-xl border border-border-main bg-bg-app py-2 pl-9 pr-3 text-sm text-text-main outline-none focus:ring-2 focus:ring-cyan-500 dark:bg-slate-900" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-border-main bg-bg-app px-3 py-2 text-sm font-medium text-text-main outline-none focus:ring-2 focus:ring-cyan-500 dark:bg-slate-900">
            <option value="">{t("doctor.consultationsPage.filterAll", { defaultValue: "All Status" })}</option>
            {Object.entries(statusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>

        {error && (
          <div className="mx-5 mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Desktop table ── */}
        <div className="hidden overflow-x-auto px-5 pb-5 md:block">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.08em] text-text-dim">
                <th className="px-3 py-4">{t("doctor.consultationsPage.columns.reason", { defaultValue: "Complaint" })}</th>
                <th className="px-3 py-4">{t("doctor.consultationsPage.columns.patient", { defaultValue: "Patient" })}</th>
                <th className="px-3 py-4">{t("doctor.consultationsPage.columns.createdAt", { defaultValue: "Date" })}</th>
                <th className="px-3 py-4">{t("doctor.consultationsPage.columns.status", { defaultValue: "Status" })}</th>
                <th className="px-3 py-4 text-right">{t("doctor.consultationsPage.columns.actions", { defaultValue: "Actions" })}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="px-3 py-10 text-center text-sm text-text-dim">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="5" className="px-3 py-10 text-center text-sm text-text-dim">
                  {t("doctor.consultationsPage.empty", { defaultValue: "No consultations found." })}
                </td></tr>
              ) : filtered.map((item) => (
                <tr key={item.id} className="border-t border-border-main/70 text-sm">
                  <td className="px-3 py-4">
                    <p className="max-w-[320px] truncate font-semibold text-text-main" title={item.chief_complaint}>
                      {item.chief_complaint || "—"}
                    </p>
                  </td>
                  <td className="px-3 py-4 text-text-main">
                    {item.patient_name || t("doctor.consultationsPage.unassignedPatient", { defaultValue: "Unknown" })}
                  </td>
                  <td className="px-3 py-4 text-text-dim">{fmtDateTime(item.created_at, i18n.language)}</td>
                  <td className="px-3 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[item.status] || "bg-slate-100 text-slate-700"}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-right">
                    <button onClick={() => navigate(`/doctor/consultations/${item.id}`)}
                      className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-cyan-700">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {t("doctor.consultationsPage.viewAction", { defaultValue: "View" })}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Mobile cards ── */}
        <div className="space-y-3 p-4 md:hidden">
          {loading ? (
            [1, 2, 3].map((i) => <SkeletonCard key={i} />)
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-text-dim">
              {t("doctor.consultationsPage.empty", { defaultValue: "No consultations found." })}
            </div>
          ) : filtered.map((item) => (
            <article key={item.id}
              className="rounded-2xl border border-border-main bg-bg-surface p-4 shadow-sm transition hover:shadow dark:bg-slate-800">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 truncate text-sm font-bold text-text-main" title={item.chief_complaint}>
                  {item.chief_complaint || "—"}
                </p>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${STATUS_STYLES[item.status] || "bg-slate-100 text-slate-700"}`}>
                  {getStatusLabel(item.status)}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2 text-sm text-text-dim">
                <User className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.patient_name || t("doctor.consultationsPage.unassignedPatient", { defaultValue: "Unknown" })}</span>
              </div>
              <p className="mt-1 text-xs text-text-dim">{fmtDateTime(item.created_at, i18n.language)}</p>

              <div className="mt-3 border-t border-border-main pt-3">
                <button onClick={() => navigate(`/doctor/consultations/${item.id}`)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-cyan-700">
                  <MessageSquare className="h-3.5 w-3.5" />
                  {t("doctor.consultationsPage.viewAction", { defaultValue: "View" })}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default DoctorConsultationHistoryPage;
