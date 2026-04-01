import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Loader2,
  MessageSquare,
  RefreshCw,
  Sparkles,
  User,
  X,
  LogIn,
} from "lucide-react";
import { appointmentService } from "../services/appointmentService";
import ConfirmModal from "../components/ConfirmModal";

const STATUS_STYLES = {
  scheduled: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  confirmed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  checked_in: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  completed: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  no_show: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300",
};

const STATUS_ICON_COLORS = {
  scheduled: "text-amber-500",
  confirmed: "text-emerald-500",
  completed: "text-purple-500",
  total: "text-slate-500",
};

const DoctorAppointmentsPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [confirmState, setConfirmState] = useState(null);
  const [cancelModal, setCancelModal] = useState({ open: false, id: null, reason: "" });

  const statusLabels = {
    scheduled: t("doctor.appointmentsPage.status.scheduled"),
    confirmed: t("doctor.appointmentsPage.status.confirmed"),
    checked_in: t("doctor.appointmentsPage.status.checkedIn"),
    in_progress: t("doctor.appointmentsPage.status.inProgress"),
    completed: t("doctor.appointmentsPage.status.completed"),
    cancelled: t("doctor.appointmentsPage.status.cancelled"),
    no_show: t("doctor.appointmentsPage.status.noShow"),
  };

  const statusOptions = [
    { value: "", label: t("doctor.appointmentsPage.filters.all") },
    { value: "scheduled", label: statusLabels.scheduled },
    { value: "confirmed", label: statusLabels.confirmed },
    { value: "checked_in", label: statusLabels.checked_in },
    { value: "in_progress", label: statusLabels.in_progress },
    { value: "completed", label: statusLabels.completed },
    { value: "cancelled", label: statusLabels.cancelled },
    { value: "no_show", label: statusLabels.no_show },
  ];

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await appointmentService.getMyAppointments();
      const list = Array.isArray(data) ? data : (data?.data ?? []);
      setAppointments(list);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || t("doctor.appointmentsPage.errors.loadFailed"));
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleUpdateStatus = (id, newStatus) => {
    if (newStatus === "cancelled") {
      setCancelModal({ open: true, id, reason: "" });
      return;
    }
    const nextLabel = statusLabels[newStatus] || newStatus.toUpperCase();
    setConfirmState({ id, newStatus, cancelReason: "", nextLabel });
  };

  const handleConfirmCancel = async () => {
    try {
      await appointmentService.updateStatus(cancelModal.id, "cancelled", cancelModal.reason);
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.message || err.message || t("doctor.appointmentsPage.updateError"));
      console.error(err);
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
      setError(err.response?.data?.message || err.message || t("doctor.appointmentsPage.updateError"));
      console.error(err);
    } finally {
      setConfirmState(null);
    }
  };

  const filtered = statusFilter
    ? appointments.filter((a) => a.status === statusFilter)
    : appointments;

  const stats = useMemo(() => {
    return {
      pending: appointments.filter((a) => a.status === "scheduled").length,
      confirmed: appointments.filter((a) => a.status === "confirmed").length,
      completed: appointments.filter((a) => a.status === "completed").length,
      total: appointments.length,
    };
  }, [appointments]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Hero Section */}
      <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-[#3B82F6] to-[#1E40AF] p-8 text-white shadow-lg md:p-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/75">{t("doctor.zone")}</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              {t("doctor.appointmentsPage.title")}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85 md:text-base">
              {t("doctor.appointmentsPage.heroDescription")}
            </p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              <Sparkles className="h-4 w-4" />
              {t("doctor.appointmentsPage.summaryTitle")}
            </div>
            <p className="mt-2 text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-white/75">{t("doctor.appointmentsPage.totalLabel")}</p>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border-main bg-bg-surface p-5 shadow-sm dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-text-dim">{t("doctor.appointmentsPage.stats.pending")}</p>
            <Clock className={`h-5 w-5 ${STATUS_ICON_COLORS.scheduled}`} />
          </div>
          <p className="mt-2 text-3xl font-bold text-text-main">{stats.pending}</p>
        </div>
        <div className="rounded-2xl border border-border-main bg-bg-surface p-5 shadow-sm dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-text-dim">{t("doctor.appointmentsPage.stats.confirmed")}</p>
            <CheckCircle className={`h-5 w-5 ${STATUS_ICON_COLORS.confirmed}`} />
          </div>
          <p className="mt-2 text-3xl font-bold text-text-main">{stats.confirmed}</p>
        </div>
        <div className="rounded-2xl border border-border-main bg-bg-surface p-5 shadow-sm dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-text-dim">{t("doctor.appointmentsPage.stats.completed")}</p>
            <Calendar className={`h-5 w-5 ${STATUS_ICON_COLORS.completed}`} />
          </div>
          <p className="mt-2 text-3xl font-bold text-text-main">{stats.completed}</p>
        </div>
      </section>

      {/* Appointments Table */}
      <section className="rounded-2xl border border-border-main bg-bg-surface shadow-sm dark:bg-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-main px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-text-main">{t("doctor.appointmentsPage.listTitle")}</h2>
            <p className="text-sm text-text-dim">{t("doctor.appointmentsPage.listDescription")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-border-main bg-bg-app px-3 py-2 text-sm font-medium text-text-main outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#BFDBFE] dark:bg-slate-900"
            >
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <button
              onClick={fetchAppointments}
              className="inline-flex items-center gap-2 rounded-lg border border-border-main px-3 py-2 text-sm font-semibold text-text-main transition hover:bg-bg-app"
            >
              <RefreshCw className="h-4 w-4" />
              {t("common.refresh")}
            </button>
          </div>
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
                <th className="px-3 py-4">{t("doctor.appointmentsPage.columns.codeDate")}</th>
                <th className="px-3 py-4">{t("doctor.appointmentsPage.columns.patient")}</th>
                <th className="px-3 py-4">{t("doctor.appointmentsPage.columns.reasonType")}</th>
                <th className="px-3 py-4">{t("doctor.appointmentsPage.columns.status")}</th>
                <th className="px-3 py-4 text-right">{t("doctor.appointmentsPage.columns.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-3 py-10 text-center text-sm text-text-dim">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("doctor.appointmentsPage.loading")}
                    </span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-3 py-10 text-center text-sm text-text-dim">
                    {statusFilter
                      ? t("doctor.appointmentsPage.emptyFiltered")
                      : t("doctor.appointmentsPage.emptyAll")}
                  </td>
                </tr>
              ) : (
                filtered.map((app) => (
                  <tr key={app.id} className="border-t border-border-main/70 text-sm">
                    <td className="px-3 py-4">
                      <p className="font-semibold text-text-main">{app.appointment_code}</p>
                      <p className="text-xs text-text-dim">
                        {new Date(app.appointment_date).toLocaleDateString(
                          i18n.language === "vi" ? "vi-VN" : "en-US"
                        )}
                      </p>
                      <p className="text-xs text-text-dim">
                        {new Date(app.start_time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        -{" "}
                        {new Date(app.end_time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </td>
                    <td className="px-3 py-4">
                      <p className="font-semibold text-text-main">{app.patient_name || "-"}</p>
                      <p className="text-xs text-text-dim">{app.patient_phone || "-"}</p>
                    </td>
                    <td className="px-3 py-4">
                      <p
                        className="max-w-[280px] truncate text-text-main"
                        title={app.reason}
                      >
                        {app.reason || "-"}
                      </p>
                      <span className="mt-1 inline-flex rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700">
                        {app.appointment_type}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          STATUS_STYLES[app.status] || "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {statusLabels[app.status] || app.status}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-right">
                      <div className="flex flex-col gap-1 items-end">
                        <button
                          onClick={() => navigate(`/doctor/appointments/${app.id}`)}
                          className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                        >
                          {t("doctor.appointmentsPage.viewDetails")}
                        </button>
                        {app.status === "confirmed" && (
                          <>
                            <button
                              onClick={() => navigate(`/appointments/${app.id}/room`)}
                              className="inline-flex items-center gap-1 rounded-lg bg-[#3B82F6] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#2563EB]"
                            >
                              <LogIn className="h-3 w-3" />
                              {t("doctor.appointmentsPage.enterRoom")}
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(app.id, "completed")}
                              className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                            >
                              {t("doctor.appointmentsPage.completeAction")}
                            </button>
                          </>
                        )}
                        {app.status === "scheduled" && (
                          <button
                            onClick={() => handleUpdateStatus(app.id, "cancelled")}
                            className="inline-flex items-center gap-1 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-600"
                          >
                            <X className="h-3 w-3" />
                            {t("doctor.appointmentsPage.cancelAction")}
                          </button>
                        )}
                        {["completed", "cancelled", "no_show"].includes(app.status) && (
                          <span className="text-xs text-text-dim italic">
                            {t("doctor.appointmentsPage.closedLabel")}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Cancel reason modal */}
      {cancelModal.open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md overflow-hidden rounded-t-3xl border border-border-main bg-bg-surface p-6 shadow-2xl sm:rounded-3xl dark:bg-slate-900">
            <h3 className="text-base font-bold text-text-main">{t("doctor.appointmentsPage.cancelPrompt") || "Lý do huỷ lịch hẹn"}</h3>
            <p className="mt-1 text-sm text-text-dim">Nhập lý do để bệnh nhân được thông báo.</p>
            <textarea
              autoFocus
              rows={3}
              value={cancelModal.reason}
              onChange={(e) => setCancelModal((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder="VD: Bác sĩ có lịch đột xuất, vui lòng đặt lại..."
              className="mt-4 w-full resize-none rounded-xl border border-border-main bg-bg-app px-4 py-3 text-sm text-text-main outline-none focus:ring-2 focus:ring-red-400 dark:bg-slate-800"
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setCancelModal({ open: false, id: null, reason: "" })}
                className="flex-1 rounded-xl border border-border-main px-4 py-2.5 text-sm font-semibold text-text-main transition hover:bg-bg-app"
              >
                {t("common.cancel") || "Đóng"}
              </button>
              <button
                onClick={handleConfirmCancel}
                className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-600"
              >
                {t("doctor.appointmentsPage.cancelAction") || "Xác nhận huỷ"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(confirmState)}
        title={t("doctor.appointmentsPage.confirmUpdate", { status: confirmState?.nextLabel || "" })}
        description={t("doctor.appointmentsPage.listDescription")}
        badgeLabel={t("doctor.zone")}
        tone={confirmState?.newStatus === "cancelled" ? "danger" : "info"}
        confirmLabel={confirmState?.newStatus === "cancelled" ? t("doctor.appointmentsPage.cancelAction") : t("common.update")}
        cancelLabel={t("common.cancel")}
        closeLabel={t("common.close")}
        onConfirm={confirmUpdateStatus}
        onClose={() => setConfirmState(null)}
      />
    </div>
  );
};

export default DoctorAppointmentsPage;
