import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertCircle, Calendar, CheckCircle, Clock, Loader2, LogIn,
  RefreshCw, Sparkles, User, X,
} from "lucide-react";
import { appointmentService } from "../services/appointmentService";
import ConfirmModal from "../components/ConfirmModal";

/* ── Constants ─────────────────────────────── */
const STATUS_STYLES = {
  scheduled:   "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  confirmed:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  checked_in:  "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  completed:   "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  cancelled:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  no_show:     "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300",
};

/* ── Skeleton ──────────────────────────────── */
const SkeletonHero = () => (
  <div className="animate-pulse rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-8 md:p-10">
    <div className="h-3 w-24 rounded bg-slate-700" />
    <div className="mt-4 h-8 w-64 rounded bg-slate-700" />
    <div className="mt-3 h-4 w-80 rounded bg-slate-700" />
  </div>
);
const SkeletonRow = () => (
  <div className="animate-pulse rounded-2xl border border-border-main bg-bg-surface p-4 dark:bg-slate-800">
    <div className="flex items-center gap-4">
      <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="h-6 w-20 rounded-full bg-slate-200 dark:bg-slate-700" />
    </div>
  </div>
);

/* ── Helpers ────────────────────────────────── */
const fmtDate = (d, lang) => d ? new Date(d).toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
const fmtTime = (t) => {
  if (!t) return "—";
  try { return new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); } catch { return "—"; }
};

/* ══════════════════════════════════════════════
   DoctorAppointmentsPage — Doctor Zone (cyan)
   ══════════════════════════════════════════════ */
const DoctorAppointmentsPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [confirmState, setConfirmState] = useState(null);
  const [cancelModal, setCancelModal] = useState({ open: false, id: null, reason: "" });

  const statusLabels = useMemo(() => ({
    scheduled:   t("doctor.appointmentsPage.status.scheduled",  { defaultValue: "Scheduled" }),
    confirmed:   t("doctor.appointmentsPage.status.confirmed",  { defaultValue: "Confirmed" }),
    checked_in:  t("doctor.appointmentsPage.status.checkedIn",  { defaultValue: "Checked In" }),
    in_progress: t("doctor.appointmentsPage.status.inProgress", { defaultValue: "In Progress" }),
    completed:   t("doctor.appointmentsPage.status.completed",  { defaultValue: "Completed" }),
    cancelled:   t("doctor.appointmentsPage.status.cancelled",  { defaultValue: "Cancelled" }),
    no_show:     t("doctor.appointmentsPage.status.noShow",     { defaultValue: "No Show" }),
  }), [t]);

  const statusOptions = useMemo(() => [
    { value: "", label: t("doctor.appointmentsPage.filters.all", { defaultValue: "All" }) },
    ...Object.entries(statusLabels).map(([v, l]) => ({ value: v, label: l })),
  ], [t, statusLabels]);

  /* ── Fetch ── */
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await appointmentService.getMyAppointments();
      setAppointments(Array.isArray(data) ? data : data?.data ?? []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || t("doctor.appointmentsPage.errors.loadFailed", { defaultValue: "Failed to load appointments" }));
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  /* ── Actions ── */
  const handleUpdateStatus = (id, newStatus) => {
    if (newStatus === "cancelled") { setCancelModal({ open: true, id, reason: "" }); return; }
    setConfirmState({ id, newStatus, cancelReason: "", nextLabel: statusLabels[newStatus] || newStatus });
  };

  const handleConfirmCancel = async () => {
    try {
      await appointmentService.updateStatus(cancelModal.id, "cancelled", cancelModal.reason);
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.message || err.message || t("doctor.appointmentsPage.updateError", { defaultValue: "Update failed" }));
    } finally {
      setCancelModal({ open: false, id: null, reason: "" });
    }
  };

  const confirmUpdateStatus = async () => {
    if (!confirmState) return;
    try {
      await appointmentService.updateStatus(confirmState.id, confirmState.newStatus, confirmState.cancelReason);
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.message || err.message || t("doctor.appointmentsPage.updateError", { defaultValue: "Update failed" }));
    } finally {
      setConfirmState(null);
    }
  };

  const filtered = statusFilter ? appointments.filter((a) => a.status === statusFilter) : appointments;

  const stats = useMemo(() => ({
    pending:   appointments.filter((a) => a.status === "scheduled").length,
    confirmed: appointments.filter((a) => a.status === "confirmed").length,
    completed: appointments.filter((a) => a.status === "completed").length,
    total:     appointments.length,
  }), [appointments]);

  /* ── Render helpers ── */
  const renderActions = (app) => (
    <div className="flex flex-wrap gap-1.5">
      <button onClick={() => navigate(`/doctor/appointments/${app.id}`)}
        className="inline-flex items-center gap-1 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-100 dark:border-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-300">
        {t("doctor.appointmentsPage.viewDetails", { defaultValue: "Details" })}
      </button>
      {app.appointment_type === "online" && ["scheduled", "confirmed"].includes(app.status) && (
        <button onClick={() => navigate(`/doctor/appointments/${app.id}/room`)}
          className="inline-flex items-center gap-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-cyan-700">
          <LogIn className="h-3 w-3" /> {t("doctor.appointmentsPage.enterRoom", { defaultValue: "Enter Room" })}
        </button>
      )}
      {app.status === "confirmed" && (
        <button onClick={() => handleUpdateStatus(app.id, "completed")}
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
          {t("doctor.appointmentsPage.completeAction", { defaultValue: "Complete" })}
        </button>
      )}
      {app.status === "scheduled" && (
        <>
          <button onClick={() => handleUpdateStatus(app.id, "confirmed")}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-600">
            <CheckCircle className="h-3 w-3" /> {t("doctor.appointmentsPage.confirmAction", { defaultValue: "Confirm" })}
          </button>
          <button onClick={() => handleUpdateStatus(app.id, "cancelled")}
            className="inline-flex items-center gap-1 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-600">
            <X className="h-3 w-3" /> {t("doctor.appointmentsPage.cancelAction", { defaultValue: "Cancel" })}
          </button>
        </>
      )}
      {["completed", "cancelled", "no_show"].includes(app.status) && (
        <span className="text-xs italic text-text-dim">{t("doctor.appointmentsPage.closedLabel", { defaultValue: "Closed" })}</span>
      )}
    </div>
  );

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
                {t("doctor.appointmentsPage.title", { defaultValue: "My Appointments" })}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
                {t("doctor.appointmentsPage.heroDescription", { defaultValue: "View and manage all your patient appointments." })}
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                {t("doctor.appointmentsPage.summaryTitle", { defaultValue: "Overview" })}
              </div>
              <p className="mt-2 text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-slate-400">{t("doctor.appointmentsPage.totalLabel", { defaultValue: "Total" })}</p>
            </div>
          </div>
        </section>
      )}

      {/* ── Stat cards ── */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">{[1,2,3].map(i => <SkeletonRow key={i} />)}</div>
      ) : (
        <section className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {[
            { label: t("doctor.appointmentsPage.stats.pending", { defaultValue: "Pending" }), value: stats.pending, icon: Clock, color: "text-amber-500" },
            { label: t("doctor.appointmentsPage.stats.confirmed", { defaultValue: "Confirmed" }), value: stats.confirmed, icon: CheckCircle, color: "text-emerald-500" },
            { label: t("doctor.appointmentsPage.stats.completed", { defaultValue: "Completed" }), value: stats.completed, icon: Calendar, color: "text-purple-500" },
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

      {/* ── Filter bar ── */}
      <section className="rounded-2xl border border-border-main bg-bg-surface shadow-sm dark:bg-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-main px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-text-main">
              {t("doctor.appointmentsPage.listTitle", { defaultValue: "Appointments List" })}
            </h2>
            <p className="text-sm text-text-dim">
              {t("doctor.appointmentsPage.listDescription", { defaultValue: "All your upcoming and past appointments" })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-border-main bg-bg-app px-3 py-2 text-sm font-medium text-text-main outline-none focus:ring-2 focus:ring-cyan-500 dark:bg-slate-900">
              {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button onClick={fetchAppointments}
              className="inline-flex items-center gap-2 rounded-xl border border-border-main px-3 py-2 text-xs font-semibold text-text-main transition hover:bg-bg-app">
              <RefreshCw className="h-3.5 w-3.5" /> {t("common.refresh", { defaultValue: "Refresh" })}
            </button>
          </div>
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
                <th className="px-3 py-4">{t("doctor.appointmentsPage.columns.codeDate", { defaultValue: "Code / Date" })}</th>
                <th className="px-3 py-4">{t("doctor.appointmentsPage.columns.patient", { defaultValue: "Patient" })}</th>
                <th className="px-3 py-4">{t("doctor.appointmentsPage.columns.reasonType", { defaultValue: "Reason / Type" })}</th>
                <th className="px-3 py-4">{t("doctor.appointmentsPage.columns.status", { defaultValue: "Status" })}</th>
                <th className="px-3 py-4 text-right">{t("doctor.appointmentsPage.columns.actions", { defaultValue: "Actions" })}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="px-3 py-10 text-center text-sm text-text-dim">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="5" className="px-3 py-10 text-center text-sm text-text-dim">
                  {statusFilter
                    ? t("doctor.appointmentsPage.emptyFiltered", { defaultValue: "No appointments match this filter." })
                    : t("doctor.appointmentsPage.emptyAll", { defaultValue: "No appointments yet." })}
                </td></tr>
              ) : filtered.map((app) => (
                <tr key={app.id} className="border-t border-border-main/70 text-sm">
                  <td className="px-3 py-4">
                    <p className="font-semibold text-text-main">{app.appointment_code}</p>
                    <p className="text-xs text-text-dim">{fmtDate(app.appointment_date, i18n.language)}</p>
                    <p className="text-xs text-text-dim">{fmtTime(app.start_time)} – {fmtTime(app.end_time)}</p>
                  </td>
                  <td className="px-3 py-4">
                    <p className="font-semibold text-text-main">{app.patient_name || "—"}</p>
                    <p className="text-xs text-text-dim">{app.patient_phone || "—"}</p>
                  </td>
                  <td className="px-3 py-4">
                    <p className="max-w-[280px] truncate text-text-main" title={app.reason}>{app.reason || "—"}</p>
                    <span className="mt-1 inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[10px] font-bold uppercase text-cyan-700 dark:border-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-300">
                      {app.appointment_type}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[app.status] || "bg-slate-100 text-slate-700"}`}>
                      {statusLabels[app.status] || app.status}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-right">
                    <div className="flex flex-col items-end gap-1">{renderActions(app)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Mobile cards ── */}
        <div className="space-y-3 p-4 md:hidden">
          {loading ? (
            [1, 2, 3].map((i) => <SkeletonRow key={i} />)
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-text-dim">
              {statusFilter
                ? t("doctor.appointmentsPage.emptyFiltered", { defaultValue: "No appointments match this filter." })
                : t("doctor.appointmentsPage.emptyAll", { defaultValue: "No appointments yet." })}
            </div>
          ) : filtered.map((app) => (
            <article key={app.id}
              className="rounded-2xl border border-border-main bg-bg-surface p-4 shadow-sm transition hover:shadow dark:bg-slate-800">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-text-main">{app.appointment_code}</p>
                  <p className="mt-0.5 text-xs text-text-dim">
                    {fmtDate(app.appointment_date, i18n.language)} &middot; {fmtTime(app.start_time)} – {fmtTime(app.end_time)}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${STATUS_STYLES[app.status] || "bg-slate-100 text-slate-700"}`}>
                  {statusLabels[app.status] || app.status}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <User className="h-4 w-4 shrink-0 text-text-dim" />
                <span className="truncate text-sm text-text-main">{app.patient_name || "—"}</span>
                <span className="ml-auto shrink-0 text-xs text-text-dim">{app.patient_phone || ""}</span>
              </div>

              {app.reason && (
                <p className="mt-2 truncate text-xs text-text-dim" title={app.reason}>{app.reason}</p>
              )}

              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[10px] font-bold uppercase text-cyan-700 dark:border-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-300">
                  {app.appointment_type}
                </span>
              </div>

              <div className="mt-3 border-t border-border-main pt-3">
                {renderActions(app)}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Cancel reason modal ── */}
      {cancelModal.open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md overflow-hidden rounded-t-3xl border border-border-main bg-bg-surface p-6 shadow-2xl sm:rounded-3xl dark:bg-slate-900">
            <h3 className="text-base font-bold text-text-main">
              {t("doctor.appointmentsPage.cancelPrompt", { defaultValue: "Cancellation Reason" })}
            </h3>
            <p className="mt-1 text-sm text-text-dim">
              {t("doctor.appointmentsPage.cancelPromptDesc", { defaultValue: "Enter a reason so the patient will be notified." })}
            </p>
            <textarea autoFocus rows={3}
              value={cancelModal.reason}
              onChange={(e) => setCancelModal((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder={t("doctor.appointmentsPage.cancelPlaceholder", { defaultValue: "e.g. Doctor has an urgent schedule change, please rebook..." })}
              className="mt-4 w-full resize-none rounded-xl border border-border-main bg-bg-app px-4 py-3 text-sm text-text-main outline-none focus:ring-2 focus:ring-red-400 dark:bg-slate-800"
            />
            <div className="mt-4 flex gap-3">
              <button onClick={() => setCancelModal({ open: false, id: null, reason: "" })}
                className="flex-1 rounded-xl border border-border-main px-4 py-2.5 text-sm font-semibold text-text-main transition hover:bg-bg-app">
                {t("common.cancel", { defaultValue: "Cancel" })}
              </button>
              <button onClick={handleConfirmCancel}
                className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-600">
                {t("doctor.appointmentsPage.confirmCancel", { defaultValue: "Confirm Cancel" })}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(confirmState)}
        title={t("doctor.appointmentsPage.confirmUpdate", { defaultValue: "Update status to {{status}}?", status: confirmState?.nextLabel || "" })}
        description={t("doctor.appointmentsPage.listDescription", { defaultValue: "All your upcoming and past appointments" })}
        badgeLabel={t("doctor.zone", { defaultValue: "Doctor Zone" })}
        tone={confirmState?.newStatus === "cancelled" ? "danger" : "info"}
        confirmLabel={confirmState?.newStatus === "cancelled" ? t("doctor.appointmentsPage.cancelAction", { defaultValue: "Cancel" }) : t("common.update", { defaultValue: "Update" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        closeLabel={t("common.close", { defaultValue: "Close" })}
        onConfirm={confirmUpdateStatus}
        onClose={() => setConfirmState(null)}
      />
    </div>
  );
};

export default DoctorAppointmentsPage;
