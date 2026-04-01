import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { appointmentService } from "../../services/appointmentService";
import ConfirmModal from "../../components/ConfirmModal";
const STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
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
  checked_in:  "bg-teal-100 text-teal-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed:   "bg-purple-100 text-purple-800",
  cancelled:   "bg-red-100 text-red-800",
  no_show:     "bg-gray-100 text-gray-600",
};

const AppointmentsAdminPage = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter state
  const [statusFilter,    setStatusFilter]    = useState("");
  const [startDate,       setStartDate]       = useState("");
  const [endDate,         setEndDate]         = useState("");
  const [search,          setSearch]          = useState("");
  const [searchInput,     setSearchInput]     = useState("");
  const [confirmState, setConfirmState] = useState(null);

  const fetchAppointments = async (filters = {}) => {
    try {
      setLoading(true);
      const data = await appointmentService.getAllAppointmentsAdmin(filters);
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments({ status: statusFilter, start_date: startDate, end_date: endDate, search });
  }, [statusFilter, startDate, endDate, search]);

  const handleUpdateStatus = async (id, newStatus) => {
    let cancelReason = "";
    if (newStatus === "cancelled") {
      cancelReason = prompt("Lý do từ chối/huỷ ca khám này là gì?");
      if (cancelReason === null) return;
    }
    setConfirmState({ id, newStatus, cancelReason });
  };

  const confirmUpdateStatus = async () => {
    if (!confirmState) return;
    try {
      await appointmentService.updateStatus(confirmState.id, confirmState.newStatus, confirmState.cancelReason);
      fetchAppointments({ status: statusFilter, start_date: startDate, end_date: endDate, search });
    } catch (err) {
      alert("Lỗi khi cập nhật trạng thái!");
      console.error(err);
    } finally {
      setConfirmState(null);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const hasFilter = statusFilter || startDate || endDate;

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">🏥 Quản Lý Ca Khám</h1>
        <span className="text-sm text-gray-400">{appointments.length} lịch hẹn</span>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 min-w-[220px]">
            <input
              type="text"
              placeholder="Tìm bệnh nhân, mã lịch, bác sĩ..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-[#E06666]/30"
            />
            <button type="submit"
              className="bg-[#E06666] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#D55555] transition">
              Tìm
            </button>
            {search && (
              <button type="button" onClick={() => { setSearch(""); setSearchInput(""); }}
                className="border border-gray-200 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 text-gray-500">
                ✕
              </button>
            )}
          </form>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E06666]/30">
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E06666]/30" />
          <span className="text-gray-400 text-sm">→</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E06666]/30" />
          {hasFilter && (
            <button onClick={() => { setStatusFilter(""); setStartDate(""); setEndDate(""); }}
              className="text-xs text-gray-400 hover:text-gray-600 underline">
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã / Ngày</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Bệnh Nhân</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Bác Sĩ / Chi Nhánh</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Lý Do / Loại</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng Thái</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Tác Vụ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="6" className="text-center py-12 text-gray-400">Đang tải...</td></tr>
              ) : appointments.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-12 text-gray-400">Không có lịch hẹn nào phù hợp ☕</td></tr>
              ) : (
                appointments.map((app) => (
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
                      <div className="text-sm text-gray-800">{app.doctor_name || "—"}</div>
                      {app.branch_name && (
                        <div className="text-xs text-gray-400">📍 {app.branch_name}</div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm text-gray-700 truncate max-w-[180px]" title={app.reason}>
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
                        {app.status === "scheduled" && (
                          <>
                            <button onClick={() => handleUpdateStatus(app.id, "confirmed")}
                              className="text-white bg-green-500 hover:bg-green-600 px-3 py-1 rounded text-xs font-semibold">
                              ✓ Duyệt
                            </button>
                            <button onClick={() => handleUpdateStatus(app.id, "cancelled")}
                              className="text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-xs font-semibold">
                              ✕ Từ chối
                            </button>
                          </>
                        )}
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

      <ConfirmModal
        isOpen={Boolean(confirmState)}
        title={confirmState ? `Xác nhận chuyển sang: ${confirmState.newStatus.toUpperCase()}?` : ""}
        description="Thay đổi trạng thái sẽ ảnh hưởng trực tiếp đến luồng xử lý lịch hẹn của phòng khám."
        badgeLabel="Appointment Admin"
        tone={confirmState?.newStatus === "cancelled" ? "danger" : "info"}
        confirmLabel={confirmState?.newStatus === "cancelled" ? "Xác nhận hủy" : "Xác nhận cập nhật"}
        cancelLabel="Hủy"
        closeLabel="Đóng"
        onConfirm={confirmUpdateStatus}
        onClose={() => setConfirmState(null)}
      />
    </div>
  );
};

export default AppointmentsAdminPage;