import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Phone,
  Mail,
  User,
  Stethoscope,
  Building2,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
  Download,
} from "lucide-react";
import { appointmentService } from "../services/appointmentService";

const STATUS_STYLES = {
  scheduled: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  confirmed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  checked_in: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  completed: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  no_show: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300",
};

const DoctorAppointmentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const statusLabels = {
    scheduled: t("doctor.appointmentDetail.status.scheduled"),
    confirmed: t("doctor.appointmentDetail.status.confirmed"),
    checked_in: t("doctor.appointmentDetail.status.checkedIn"),
    in_progress: t("doctor.appointmentDetail.status.inProgress"),
    completed: t("doctor.appointmentDetail.status.completed"),
    cancelled: t("doctor.appointmentDetail.status.cancelled"),
    no_show: t("doctor.appointmentDetail.status.noShow"),
  };

  const fetchAppointmentDetail = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await appointmentService.getAppointmentById(id);
      const result = Array.isArray(data) ? data[0] : (data?.data || data);
      setAppointment(result);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          err.message ||
          t("doctor.appointmentDetail.errors.loadFailed")
      );
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    fetchAppointmentDetail();
  }, [fetchAppointmentDetail]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString(
      i18n.language === "vi" ? "vi-VN" : "en-US",
      { weekday: "long", year: "numeric", month: "long", day: "numeric" }
    );
  };

  const formatTime = (timeString) => {
    if (!timeString) return "-";
    return new Date(timeString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString(
      i18n.language === "vi" ? "vi-VN" : "en-US",
      {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return "-";
    const start = new Date(startTime);
    const end = new Date(endTime);
    const minutes = Math.round((end - start) / (1000 * 60));
    return `${minutes} ${t("common.minutes")}`;
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm text-text-dim">
            {t("doctor.appointmentDetail.loading")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/doctor/appointments")}
          className="inline-flex items-center gap-2 rounded-lg border border-border-main px-3 py-2 text-sm font-medium text-text-main transition hover:bg-bg-app"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("common.back")}
        </button>
        <h1 className="text-2xl font-bold text-text-main">
          {t("doctor.appointmentDetail.title")}
        </h1>
        <div />
      </div>

      {/* Error */}
      {error ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-semibold">{t("doctor.appointmentDetail.errors.title")}</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      ) : null}

      {/* Content */}
      {appointment && (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Column: Appointment & Patient Info */}
          <div className="space-y-6 lg:col-span-8">
            {/* Appointment Card */}
            <div className="rounded-2xl border border-border-main bg-bg-surface p-6 shadow-sm dark:bg-slate-800">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-text-main">
                    {t("doctor.appointmentDetail.appointmentInfo")}
                  </h2>
                  <p className="mt-1 text-sm text-text-dim">
                    {t("doctor.appointmentDetail.code")}: {appointment.appointment_code}
                  </p>
                </div>
                <span
                  className={`inline-flex rounded-full px-4 py-2 text-xs font-semibold ${
                    STATUS_STYLES[appointment.status] ||
                    "bg-slate-100 text-slate-700"
                  }`}
                >
                  {statusLabels[appointment.status] || appointment.status}
                </span>
              </div>

              <div className="space-y-4 border-t border-border-main/50 pt-4">
                {/* Date & Time */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex gap-3">
                    <Calendar className="h-5 w-5 flex-shrink-0 text-blue-500" />
                    <div>
                      <p className="text-xs font-medium text-text-dim">
                        {t("doctor.appointmentDetail.date")}
                      </p>
                      <p className="mt-1 font-semibold text-text-main">
                        {formatDate(appointment.appointment_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Clock className="h-5 w-5 flex-shrink-0 text-emerald-500" />
                    <div>
                      <p className="text-xs font-medium text-text-dim">
                        {t("doctor.appointmentDetail.time")}
                      </p>
                      <p className="mt-1">
                        <span className="font-semibold text-text-main">
                          {formatTime(appointment.start_time)}
                        </span>
                        <span className="text-text-dim"> - </span>
                        <span className="font-semibold text-text-main">
                          {formatTime(appointment.end_time)}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Duration & Type */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex gap-3">
                    <Clock className="h-5 w-5 flex-shrink-0 text-purple-500" />
                    <div>
                      <p className="text-xs font-medium text-text-dim">
                        {t("doctor.appointmentDetail.duration")}
                      </p>
                      <p className="mt-1 font-semibold text-text-main">
                        {calculateDuration(
                          appointment.start_time,
                          appointment.end_time
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Stethoscope className="h-5 w-5 flex-shrink-0 text-red-500" />
                    <div>
                      <p className="text-xs font-medium text-text-dim">
                        {t("doctor.appointmentDetail.type")}
                      </p>
                      <p className="mt-1 inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold uppercase text-blue-700 dark:border-blue-800/30 dark:bg-blue-900/20 dark:text-blue-300">
                        {appointment.appointment_type || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <p className="text-xs font-medium text-text-dim">
                    {t("doctor.appointmentDetail.reason")}
                  </p>
                  <p className="mt-2 rounded-lg border border-border-main/50 bg-bg-app p-3 text-sm text-text-main dark:bg-slate-900">
                    {appointment.reason || t("doctor.appointmentDetail.noReason")}
                  </p>
                </div>
              </div>
            </div>

            {/* Patient Info Card */}
            <div className="rounded-2xl border border-border-main bg-bg-surface p-6 shadow-sm dark:bg-slate-800">
              <h2 className="mb-4 text-lg font-bold text-text-main">
                {t("doctor.appointmentDetail.patientInfo")}
              </h2>

              <div className="space-y-4 border-t border-border-main/50 pt-4">
                {/* Patient Name */}
                <div className="flex gap-3">
                  <User className="h-5 w-5 flex-shrink-0 text-blue-500" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-text-dim">
                      {t("doctor.appointmentDetail.patientName")}
                    </p>
                    <p className="mt-1 font-semibold text-text-main">
                      {appointment.patient_name || "-"}
                    </p>
                  </div>
                </div>

                {/* Patient Phone */}
                <div className="flex gap-3">
                  <Phone className="h-5 w-5 flex-shrink-0 text-emerald-500" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-text-dim">
                      {t("doctor.appointmentDetail.patientPhone")}
                    </p>
                    <p className="mt-1 font-semibold text-text-main">
                      {appointment.patient_phone || "-"}
                    </p>
                  </div>
                </div>

                {/* Specialty */}
                {appointment.specialty_name && (
                  <div className="flex gap-3">
                    <Stethoscope className="h-5 w-5 flex-shrink-0 text-red-500" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-text-dim">
                        {t("doctor.appointmentDetail.specialty")}
                      </p>
                      <p className="mt-1 font-semibold text-text-main">
                        {appointment.specialty_name}
                      </p>
                    </div>
                  </div>
                )}

                {/* Branch */}
                {appointment.branch_name && (
                  <div className="flex gap-3">
                    <Building2 className="h-5 w-5 flex-shrink-0 text-purple-500" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-text-dim">
                        {t("doctor.appointmentDetail.branch")}
                      </p>
                      <div className="mt-1">
                        <p className="font-semibold text-text-main">
                          {appointment.branch_name}
                        </p>
                        {appointment.branch_code && (
                          <p className="text-xs text-text-dim">
                            ({appointment.branch_code})
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Summary & Actions */}
          <div className="space-y-6 lg:col-span-4">
            {/* Summary Card */}
            <div className="rounded-2xl border border-border-main bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-sm dark:from-blue-950/20 dark:to-indigo-950/20 dark:border-blue-900/30">
              <h3 className="flex items-center gap-2 font-bold text-text-main">
                <CheckCircle className="h-5 w-5 text-blue-500" />
                {t("doctor.appointmentDetail.summaryTitle")}
              </h3>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-dim">
                    {t("doctor.appointmentDetail.code")}
                  </span>
                  <span className="font-semibold text-text-main">
                    {appointment.appointment_code}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-dim">
                    {t("doctor.appointmentDetail.status")}
                  </span>
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      STATUS_STYLES[appointment.status] ||
                      "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {statusLabels[appointment.status] || appointment.status}
                  </span>
                </div>
                <div className="border-t border-border-main/20 pt-3">
                  <span className="text-text-dim">
                    {t("doctor.appointmentDetail.appointmentDateTime")}
                  </span>
                  <p className="mt-1 font-semibold text-text-main">
                    {formatDate(appointment.appointment_date)}
                  </p>
                  <p className="text-xs text-text-dim">
                    {formatTime(appointment.start_time)} -{" "}
                    {formatTime(appointment.end_time)}
                  </p>
                </div>
              </div>
            </div>

            {/* Timeline Info */}
            <div className="rounded-2xl border border-border-main bg-bg-surface p-6 shadow-sm dark:bg-slate-800">
              <h3 className="mb-4 font-bold text-text-main">
                {t("doctor.appointmentDetail.timeline")}
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs font-medium text-text-dim">
                    {t("doctor.appointmentDetail.created")}
                  </p>
                  <p className="mt-1 font-semibold text-text-main">
                    {appointment.created_at
                      ? formatDateTime(appointment.created_at)
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-text-dim">
                    {t("doctor.appointmentDetail.updated")}
                  </p>
                  <p className="mt-1 font-semibold text-text-main">
                    {appointment.updated_at
                      ? formatDateTime(appointment.updated_at)
                      : "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Export Button */}
            <button
              onClick={() => window.print()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-3 font-semibold text-white transition hover:bg-blue-600"
            >
              <Download className="h-4 w-4" />
              {t("doctor.appointmentDetail.actions.print")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointmentDetailPage;
