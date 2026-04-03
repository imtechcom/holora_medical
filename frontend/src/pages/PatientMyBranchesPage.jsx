import React, { useEffect, useState } from "react";
import { AlertCircle, Building2, CalendarDays, Loader2, Mail, MapPin, MessageSquare, Phone, RefreshCw } from "lucide-react";
import { getMyBranchesApi } from "../services/patientService";

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return `${value}`;
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const BranchCard = ({ branch, type }) => {
  const isAppt = type === "appointment";
  const count = isAppt ? branch.appointment_count : branch.consultation_count;
  const lastDate = isAppt ? branch.last_appointment_date : branch.last_consultation_date;
  const countLabel = isAppt ? "lịch hẹn" : "tư vấn";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-5 h-5 text-red-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">{branch.name}</p>
          {branch.city && (
            <p className="text-xs text-red-500 font-medium mt-0.5">{branch.city}</p>
          )}
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-medium bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 px-2 py-0.5 rounded-full flex-shrink-0">
          {isAppt ? <CalendarDays className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
          {count} {countLabel}
        </span>
      </div>

      <div className="mt-3 space-y-1.5 pl-1">
        {branch.address && (
          <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
            <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-400" />
            <span>{branch.address}</span>
          </div>
        )}
        {branch.phone && (
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Phone className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
            <span>{branch.phone}</span>
          </div>
        )}
        {branch.email && (
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Mail className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
            <span className="truncate">{branch.email}</span>
          </div>
        )}
        <p className="text-xs text-gray-400 pt-0.5">Lần cuối: {formatDate(lastDate)}</p>
      </div>
    </div>
  );
};

const Section = ({ title, icon, branches, type, emptyMsg }) => {
  const SectionIcon = icon;
  return (
  <div>
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
        <SectionIcon className="w-4 h-4 text-red-500" />
      </div>
      <h2 className="text-base font-bold text-gray-900 dark:text-white">{title}</h2>
      <span className="ml-auto text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
        {branches.length}
      </span>
    </div>
    {branches.length === 0 ? (
      <div className="text-center py-10 text-gray-400 dark:text-gray-500 text-sm bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
        {emptyMsg}
      </div>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {branches.map((b) => (
          <BranchCard key={b.id} branch={b} type={type} />
        ))}
      </div>
    )}
  </div>
  );
};

const PatientMyBranchesPage = () => {
  const [data, setData] = useState({ appointments: [], consultations: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getMyBranchesApi();
      setData(res.data || { appointments: [], consultations: [] });
    } catch (err) {
      console.error("getMyBranches error:", err);
      setError(err.response?.data?.message || err.message || "Không thể tải danh sách chi nhánh");
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
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Chi nhánh của tôi</h1>
          </div>
          <p className="text-red-100 text-sm">Danh sách chi nhánh bạn đã sử dụng dịch vụ</p>
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
              title="Chi nhánh đặt lịch hẹn"
              icon={CalendarDays}
              branches={data.appointments}
              type="appointment"
              emptyMsg="Bạn chưa đặt lịch hẹn tại chi nhánh nào"
            />
            <Section
              title="Chi nhánh đã tư vấn"
              icon={MessageSquare}
              branches={data.consultations}
              type="consultation"
              emptyMsg="Bạn chưa có cuộc tư vấn tại chi nhánh nào"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default PatientMyBranchesPage;
