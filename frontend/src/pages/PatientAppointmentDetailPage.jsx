import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  FileText,
  Loader2,
  MapPin,
  RefreshCw,
  Stethoscope,
  Video,
  XCircle,
} from "lucide-react";
import { appointmentService } from "../services/appointmentService";
import { consultationService } from "../services/consultationService";

const STATUS_STYLES = {
  scheduled: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  confirmed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  checked_in: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  completed: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  no_show: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300",
};

const STATUS_LABELS = {
  scheduled: "Đã đặt lịch",
  confirmed: "Đã xác nhận",
  checked_in: "Đã check-in",
  in_progress: "Đang khám",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
  no_show: "Vắng mặt",
};

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  }
  // HH:mm:ss string
  return typeof value === "string" ? value.slice(0, 5) : "-";
};

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const InfoRow = ({ icon, iconColor = "text-red-400", label, value }) => {
  const RowIcon = icon;
  return (
  <div className="flex items-start gap-3">
    <div className={`w-8 h-8 rounded-xl bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center flex-shrink-0 mt-0.5`}>
      <RowIcon className={`w-4 h-4 ${iconColor}`} />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">{label}</p>
      <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{value || "-"}</p>
    </div>
  </div>
  );
};

const PatientAppointmentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [linkedConsultation, setLinkedConsultation] = useState(null);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await appointmentService.getAppointmentById(id);
      const data = Array.isArray(res) ? res[0] : (res?.data || res);
      setAppointment(data);
    } catch (err) {
      console.error("fetchAppointmentDetail error:", err);
      setError(err.response?.data?.message || err.message || "Không thể tải thông tin lịch hẹn");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
    consultationService.getByAppointmentId(id)
      .then((res) => setLinkedConsultation(res.data || null))
      .catch(() => setLinkedConsultation(null));
  }, [fetchDetail, id]);

  const canEnterRoom =
    appointment?.appointment_type === "online" &&
    (appointment?.status === "scheduled" || appointment?.status === "confirmed");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-b-[32px] bg-gradient-to-br from-[#E06666] via-red-500 to-rose-600 px-5 pt-10 pb-8 mb-6">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,white,transparent_60%)]" />
        <div className="relative">
          <button
            onClick={() => navigate("/patient/appointments")}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Lịch hẹn của tôi
          </button>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-red-100 text-xs uppercase tracking-widest font-semibold">Chi tiết lịch hẹn</p>
              <h1 className="text-xl font-bold text-white mt-1">
                {appointment?.appointment_code || "..."}
              </h1>
            </div>
            {appointment && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-2xl px-4 py-2 text-xs font-bold uppercase tracking-wide ${
                  STATUS_STYLES[appointment.status] || "bg-white/20 text-white"
                }`}
              >
                {STATUS_LABELS[appointment.status] || appointment.status}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pb-10 space-y-4 max-w-3xl mx-auto">
        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 text-sm text-red-700 dark:text-red-400">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1">{error}</div>
            <button onClick={fetchDetail} className="flex items-center gap-1 text-xs font-medium underline hover:no-underline">
              <RefreshCw className="w-3 h-3" /> Thử lại
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-red-400" />
            <p className="text-sm">Đang tải...</p>
          </div>
        )}

        {appointment && !loading && (
          <>
            {/* Thời gian & Loại */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Thông tin lịch hẹn</h2>
              <div className="space-y-4">
                <InfoRow
                  icon={Calendar}
                  iconColor="text-red-400"
                  label="Ngày khám"
                  value={formatDate(appointment.appointment_date)}
                />
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Clock className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Giờ khám</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
                      {formatTime(appointment.start_time)}
                      {appointment.end_time && (
                        <span className="text-gray-400 font-normal"> – {formatTime(appointment.end_time)}</span>
                      )}
                    </p>
                  </div>
                </div>
                <InfoRow
                  icon={Stethoscope}
                  iconColor="text-blue-400"
                  label="Loại khám"
                  value={appointment.appointment_type === "online" ? "Trực tuyến" : appointment.appointment_type === "offline" ? "Trực tiếp" : appointment.appointment_type}
                />
                {appointment.reason && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FileText className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Lý do khám</p>
                      <p className="text-sm text-gray-900 dark:text-white mt-1 leading-relaxed bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3">
                        {appointment.reason}
                      </p>
                    </div>
                  </div>
                )}
                {appointment.status === "cancelled" && appointment.cancellation_reason && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <XCircle className="w-4 h-4 text-red-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-red-400 font-medium">Lý do hủy</p>
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1 leading-relaxed bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
                        {appointment.cancellation_reason}
                      </p>
                    </div>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400">
                  Đặt lịch lúc: {formatDateTime(appointment.created_at)}
                </div>
              </div>
            </div>

            {/* Thông tin bác sĩ */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Bác sĩ phụ trách</h2>
              <div className="flex items-center gap-4">
                {appointment.doctor_avatar ? (
                  <img
                    src={appointment.doctor_avatar}
                    alt={appointment.doctor_name}
                    className="w-14 h-14 rounded-2xl object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-red-500">
                      {(appointment.doctor_name || "?")
                        .split(" ")
                        .filter(Boolean)
                        .slice(-2)
                        .map((w) => w[0])
                        .join("")
                        .toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">BS. {appointment.doctor_name || "-"}</p>
                  {appointment.specialty_name && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{appointment.specialty_name}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Chi nhánh */}
            {appointment.branch_name && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Chi nhánh khám</h2>
                <InfoRow
                  icon={Building2}
                  iconColor="text-red-400"
                  label="Tên chi nhánh"
                  value={appointment.branch_name}
                />
                {appointment.branch_code && (
                  <div className="mt-3">
                    <InfoRow
                      icon={MapPin}
                      iconColor="text-gray-400"
                      label="Mã chi nhánh"
                      value={appointment.branch_code}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Tư vấn liên kết */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Tư vấn liên kết</h2>
              {linkedConsultation ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Ca tư vấn <span className="font-semibold text-gray-900 dark:text-white">#{linkedConsultation.id}</span>
                    {" "}—{" "}<span className="italic">{linkedConsultation.chief_complaint}</span>
                  </p>
                  <button
                    onClick={() => navigate(`/patient/consultations/${linkedConsultation.id}`)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-500 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-violet-600 transition-all"
                  >
                    Xem chi tiết tư vấn
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Chưa có tư vấn trực tuyến nào được gắn với lịch hẹn này.</p>
                  {(appointment.status === "confirmed" || appointment.status === "in_progress" || appointment.status === "scheduled") && (
                    <button
                      onClick={() => navigate(`/patient/consultations/new?appointmentId=${appointment.id}&branchId=${appointment.branch_id}&doctorId=${appointment.doctor_id}`)}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/10 px-5 py-3 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/20 transition-all"
                    >
                      + Tạo tư vấn từ lịch hẹn này
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            {canEnterRoom && (
              <button
                onClick={() => navigate(`/patient/appointments/${appointment.id}/room`)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#E06666] to-rose-500 px-6 py-4 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all"
              >
                <Video className="w-5 h-5" />
                Vào phòng khám trực tuyến
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PatientAppointmentDetailPage;
