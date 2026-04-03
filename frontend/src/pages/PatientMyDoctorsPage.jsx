import React, { useEffect, useState } from "react";
import { AlertCircle, CalendarDays, Loader2, MessageSquare, RefreshCw, UserRound } from "lucide-react";
import { getMyDoctorsApi } from "../services/patientService";

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return `${value}`;
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const Avatar = ({ avatarUrl, name, size = "md" }) => {
  const sizeClass = size === "lg" ? "w-14 h-14 text-xl" : "w-11 h-11 text-base";
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0`}
      />
    );
  }
  const initials = (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div
      className={`${sizeClass} rounded-full bg-red-100 text-red-600 flex items-center justify-center font-semibold flex-shrink-0`}
    >
      {initials}
    </div>
  );
};

const DoctorCard = ({ doctor, type }) => {
  const isAppt = type === "appointment";
  const count = isAppt ? doctor.appointment_count : doctor.consultation_count;
  const lastDate = isAppt ? doctor.last_appointment_date : doctor.last_consultation_date;
  const countLabel = isAppt ? "lịch hẹn" : "tư vấn";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 flex items-start gap-3 shadow-sm hover:shadow-md transition-shadow">
      <Avatar avatarUrl={doctor.avatar_url} name={doctor.full_name} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight truncate">
          BS. {doctor.full_name}
        </p>
        {doctor.specialty_name && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
            {doctor.specialty_name}
          </p>
        )}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <span className="inline-flex items-center gap-1 text-xs font-medium bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 px-2 py-0.5 rounded-full">
            {isAppt ? <CalendarDays className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
            {count} {countLabel}
          </span>
          <span className="text-xs text-gray-400">Lần cuối: {formatDate(lastDate)}</span>
        </div>
      </div>
    </div>
  );
};

const Section = ({ title, icon, doctors, type, emptyMsg }) => {
  const SectionIcon = icon;
  return (
  <div>
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
        <SectionIcon className="w-4 h-4 text-red-500" />
      </div>
      <h2 className="text-base font-bold text-gray-900 dark:text-white">{title}</h2>
      <span className="ml-auto text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
        {doctors.length}
      </span>
    </div>
    {doctors.length === 0 ? (
      <div className="text-center py-10 text-gray-400 dark:text-gray-500 text-sm bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
        {emptyMsg}
      </div>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {doctors.map((doc) => (
          <DoctorCard key={doc.id} doctor={doc} type={type} />
        ))}
      </div>
    )}
  </div>
  );
};

const PatientMyDoctorsPage = () => {
  const [data, setData] = useState({ appointments: [], consultations: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getMyDoctorsApi();
      setData(res.data || { appointments: [], consultations: [] });
    } catch (err) {
      console.error("getMyDoctors error:", err);
      setError(err.response?.data?.message || err.message || "Không thể tải danh sách bác sĩ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-b-[32px] bg-gradient-to-br from-[#E06666] via-red-500 to-rose-600 px-5 pt-10 pb-8 mb-6">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,white,transparent_60%)]" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <UserRound className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Bác sĩ của tôi</h1>
          </div>
          <p className="text-red-100 text-sm">Danh sách bác sĩ bạn đã tương tác</p>
          {!loading && (
            <div className="flex gap-3 mt-4">
              <div className="bg-white/15 rounded-xl px-3 py-2 text-center min-w-[70px]">
                <p className="text-white text-lg font-bold">{data.appointments.length}</p>
                <p className="text-red-100 text-xs">Đặt lịch</p>
              </div>
              <div className="bg-white/15 rounded-xl px-3 py-2 text-center min-w-[70px]">
                <p className="text-white text-lg font-bold">{data.consultations.length}</p>
                <p className="text-red-100 text-xs">Tư vấn</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pb-10 space-y-8 max-w-5xl mx-auto">
        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 text-sm text-red-700 dark:text-red-400">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1">{error}</div>
            <button onClick={fetchData} className="flex items-center gap-1 text-xs font-medium underline hover:no-underline">
              <RefreshCw className="w-3 h-3" />
              Thử lại
            </button>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-red-400" />
            <p className="text-sm">Đang tải...</p>
          </div>
        ) : (
          <>
            <Section
              title="Bác sĩ đã đặt lịch hẹn"
              icon={CalendarDays}
              doctors={data.appointments}
              type="appointment"
              emptyMsg="Bạn chưa đặt lịch hẹn với bác sĩ nào"
            />
            <Section
              title="Bác sĩ đã tư vấn"
              icon={MessageSquare}
              doctors={data.consultations}
              type="consultation"
              emptyMsg="Bạn chưa có cuộc tư vấn nào"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default PatientMyDoctorsPage;
