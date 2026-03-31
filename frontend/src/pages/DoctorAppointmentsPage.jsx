import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { appointmentService } from "../services/appointmentService";

const STATUS_OPTIONS = [
  { value: "",             label: "Tất cả" },
  { value: "scheduled",   label: "Đã đặt" },
  { value: "confirmed",   label: "Xác nhận" },
  { value: "checked_in",  label: "Đã check-in" },
  { value: "in_progress", label: "Đang xử lý" },
  { value: "completed",   label: "Hoàn thành" },
  { value: "cancelled",   label: "Đã hủy" },
  { value: "no_show",     label: "Vắng mặt" },
];

const STATUS_CLS = {
  scheduled:   "bg-yellow-100 text-yellow-800",
  confirmed:   "bg-green-100 text-green-800",
  checked_in:  "bg-teal-100 text-teal-700",
  in_progress: "bg-blue-100 text-blue-800",
  completed:   "bg-purple-100 text-purple-800",
  cancelled:   "bg-red-100 text-red-700",
  no_show:     "bg-gray-100 text-gray-600",
};

const DoctorAppointmentsPage = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await appointmentService.getMyAppointments();
      const list = Array.isArray(data) ? data : (data?.data ?? []);
      setAppointments(list);
    } catch (err) {
      console.error(err);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleUpdateStatus = async (id, newStatus) => {
    let cancelReason = "";
    if (newStatus === "cancelled") {
      cancelReason = prompt("Lý do huỷ ca khám:");
      if (cancelReason === null) return;
    }
    if (!window.confirm(`Xác nhận chuyển sang: ${newStatus.toUpperCase()}?`)) return;
    try {
      await appointmentService.updateStatus(id, newStatus, cancelReason);
      fetchAppointments();
    } catch (err) {
      alert("Lỗi khi cập nhật trạng thái!");
      console.error(err);
    }
  };

  const filtered = statusFilter
    ? appointments.filter((a) => a.status === statusFilter)
    : appointments;

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📅 Lịch Hẹn Của Tôi</h1>
          <p className="text-sm text-gray-400 mt-1">Danh sách bệnh nhân đã đặt lịch với bạn</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E06666]/30"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button onClick={fetchAppointments}
            className="border border-gray-200 bg-white px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition text-gray-600">
            ↻ Làm mới
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Chờ duyệt",   value: appointments.filter(a => a.status === "scheduled").length,   cls: "text-yellow-600 bg-yellow-50" },
          { label: "Xác nhận",    value: appointments.filter(a => a.status === "confirmed").length,   cls: "text-green-600 bg-green-50" },
          { label: "Hoàn thành",  value: appointments.filter(a => a.status === "completed").length,   cls: "text-purple-600 bg-purple-50" },
          { label: "Tổng cộng",   value: appointments.length,                                         cls: "text-gray-700 bg-gray-50" },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl p-4 border border-gray-100 ${stat.cls} flex flex-col items-center`}>
            <span className="text-2xl font-bold">{stat.value}</span>
            <span className="text-xs mt-1 font-medium">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã / Ngày</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Bệnh Nhân</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Lý Do / Loại</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng Thái</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Tác Vụ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="5" className="text-center py-12 text-gray-400">Đang tải...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-gray-400">
                    {statusFilter ? "Không có lịch hẹn với trạng thái này ☕" : "Chưa có bệnh nhân đặt lịch ☕"}
                  </td>
                </tr>
              ) : (
                filtered.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-4">
                      <div className="text-sm font-bold text-indigo-600">{app.appointment_code}</div>
                      <div className="text-xs font-medium text-gray-700 mt-0.5">
                        {new Date(app.appointment_date).toLocaleDateString("vi-VN")}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(app.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {" – "}
                        {new Date(app.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm font-semibold text-gray-900">{app.patient_name || "—"}</div>
                      <div className="text-xs text-gray-400">{app.patient_phone || ""}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm text-gray-700 truncate max-w-[200px]" title={app.reason}>
                        {app.reason || "—"}
                      </div>
                      <span className="mt-1 inline-flex px-2 py-0.5 text-[10px] font-semibold rounded bg-blue-100 text-blue-700 uppercase">
                        {app.appointment_type}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full uppercase ${STATUS_CLS[app.status] || "bg-gray-100 text-gray-600"}`}>
                        {STATUS_OPTIONS.find((o) => o.value === app.status)?.label || app.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="flex flex-col gap-1 items-end">
                        {app.status === "confirmed" && (
                          <>
                            <button onClick={() => navigate(`/appointments/${app.id}/room`)}
                              className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs font-bold">
                              📞 Vào phòng
                            </button>
                            <button onClick={() => handleUpdateStatus(app.id, "completed")}
                              className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1 rounded text-xs">
                              Hoàn tất
                            </button>
                          </>
                        )}
                        {app.status === "scheduled" && (
                          <button onClick={() => handleUpdateStatus(app.id, "cancelled")}
                            className="text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-xs font-semibold">
                            ✕ Huỷ
                          </button>
                        )}
                        {["completed", "cancelled", "no_show"].includes(app.status) && (
                          <span className="text-gray-300 text-xs">— chốt sổ —</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DoctorAppointmentsPage;
