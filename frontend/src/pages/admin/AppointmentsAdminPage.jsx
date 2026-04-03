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
  scheduled:   "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  confirmed:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  checked_in:  "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  completed:   "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  cancelled:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  no_show:     "bg-bg-app text-text-dim dark:bg-slate-700",
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
  const [cancelModal, setCancelModal] = useState(null); // { id, newStatus }
  const [cancelReasonInput, setCancelReasonInput] = useState("");
  const [error, setError] = useState("");

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
    if (newStatus === "cancelled") {
      setCancelModal({ id, newStatus });
      setCancelReasonInput("");
      return;
    }
    setConfirmState({ id, newStatus, cancelReason: "" });
  };

  const confirmUpdateStatus = async () => {
    if (!confirmState) return;
    try {
      setError("");
      await appointmentService.updateStatus(confirmState.id, confirmState.newStatus, confirmState.cancelReason);
      fetchAppointments({ status: statusFilter, start_date: startDate, end_date: endDate, search });
    } catch (err) {
      setError("Lỗi khi cập nhật trạng thái!");
      console.error(err);
    } finally {
      setConfirmState(null);
    }
  };

  const confirmCancelWithReason = () => {
    const reason = cancelReasonInput.trim();
    setCancelModal(null);
    setCancelReasonInput("");
    setConfirmState({ id: cancelModal.id, newStatus: cancelModal.newStatus, cancelReason: reason });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const hasFilter = statusFilter || startDate || endDate;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-text-main">Quản Lý Ca Khám</h1>
        <span className="text-sm text-text-dim">{appointments.length} lịch hẹn</span>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border border-border-main bg-bg-surface p-4 dark:bg-slate-800">
        <div className="flex flex-wrap items-end gap-3">
          <form onSubmit={handleSearchSubmit} className="flex min-w-[220px] flex-1 gap-2">
            <input
              type="text"
              placeholder="Tìm bệnh nhân, mã lịch, bác sĩ..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="flex-1 rounded-lg border border-border-main bg-bg-app px-3 py-2 text-sm text-text-main placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-[#E06666]/30 dark:bg-slate-800/60"
            />
            <button type="submit"
              className="rounded-lg bg-[#E06666] px-4 py-2 text-sm font-medium text-white hover:bg-[#D55555] transition">
              Tìm
            </button>
            {search && (
              <button type="button" onClick={() => { setSearch(""); setSearchInput(""); }}
                className="rounded-lg border border-border-main px-3 py-2 text-sm text-text-dim hover:bg-bg-app transition">
                ✕
              </button>
            )}
          </form>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-border-main bg-bg-app px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-[#E06666]/30 dark:bg-slate-800/60">
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border border-border-main bg-bg-app px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-[#E06666]/30 dark:bg-slate-800/60" />
          <span className="text-sm text-text-dim">→</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg border border-border-main bg-bg-app px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-[#E06666]/30 dark:bg-slate-800/60" />
          {hasFilter && (
            <button onClick={() => { setStatusFilter(""); setStartDate(""); setEndDate(""); }}
              className="text-xs text-text-dim underline hover:text-text-main">
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border-main bg-bg-surface shadow-sm dark:bg-slate-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border-main">
            <thead className="bg-bg-app dark:bg-slate-900/60">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-dim">Mã / Ngày</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-dim">Bệnh Nhân</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-dim">Bác Sĩ / Chi Nhánh</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-dim">Lý Do / Loại</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-dim">Trạng Thái</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-dim">Tác Vụ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {loading ? (
                <tr><td colSpan="6" className="py-12 text-center text-text-dim">Đang tải...</td></tr>
              ) : appointments.length === 0 ? (
                <tr><td colSpan="6" className="py-12 text-center text-text-dim">Không có lịch hẹn nào phù hợp</td></tr>
              ) : (
                appointments.map((app) => (
                  <tr key={app.id} className="hover:bg-bg-app dark:hover:bg-slate-700/50 transition">
                    <td className="px-5 py-4">
                      <div className="text-sm font-bold text-[#E06666]">{app.appointment_code}</div>
                      <div className="mt-0.5 text-xs font-medium text-text-main">
                        {new Date(app.appointment_date).toLocaleDateString("vi-VN")}
                      </div>
                      <div className="text-xs text-text-dim">
                        {new Date(app.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {" – "}
                        {new Date(app.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm font-semibold text-text-main">{app.patient_name || "—"}</div>
                      <div className="text-xs text-text-dim">{app.patient_phone || ""}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm text-text-main">{app.doctor_name || "—"}</div>
                      {app.branch_name && (
                        <div className="text-xs text-text-dim">{app.branch_name}</div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="max-w-[180px] truncate text-sm text-text-dim" title={app.reason}>
                        {app.reason || "—"}
                      </div>
                      <span className="mt-1 inline-flex rounded bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {app.appointment_type}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-bold uppercase ${STATUS_CLS[app.status] || "bg-bg-app text-text-dim"}`}>
                        {STATUS_OPTIONS.find((o) => o.value === app.status)?.label || app.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <div className="flex flex-col items-end gap-1">
                        {app.status === "scheduled" && (
                          <>
                            <button onClick={() => handleUpdateStatus(app.id, "confirmed")}
                              className="rounded bg-emerald-500 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-600">
                              ✓ Duyệt
                            </button>
                            <button onClick={() => handleUpdateStatus(app.id, "cancelled")}
                              className="rounded bg-red-500 px-3 py-1 text-xs font-semibold text-white hover:bg-red-600">
                              ✕ Từ chối
                            </button>
                          </>
                        )}
                        {app.status === "confirmed" && (
                          <>
                            <button onClick={() => navigate(`/admin/appointments/${app.id}/room`)}
                              className="rounded bg-blue-600 px-3 py-1 text-xs font-bold text-white hover:bg-blue-700">
                              Vào phòng
                            </button>
                            <button onClick={() => handleUpdateStatus(app.id, "completed")}
                              className="rounded border border-border-main px-3 py-1 text-xs text-text-dim hover:bg-bg-app transition">
                              Hoàn tất
                            </button>
                          </>
                        )}
                        {["completed", "cancelled", "no_show"].includes(app.status) && (
                          <span className="text-xs text-text-dim">— chốt sổ —</span>
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

      {/* Cancel Reason Modal */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-3xl border border-border-main bg-bg-surface p-6 shadow-2xl dark:bg-slate-800">
            <h3 className="mb-1 text-lg font-bold text-text-main">Lý do từ chối / huỷ</h3>
            <p className="mb-4 text-sm text-text-dim">Nhập lý do để thông báo cho bệnh nhân.</p>
            <textarea
              value={cancelReasonInput}
              onChange={(e) => setCancelReasonInput(e.target.value)}
              placeholder="Ví dụ: Tự ý không phù hợp, bác sĩ vắng..."
              rows={3}
              className="w-full resize-none rounded-xl border border-border-main bg-bg-app px-3 py-2 text-sm text-text-main placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-[#E06666]/30 dark:bg-slate-700"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => { setCancelModal(null); setCancelReasonInput(""); }}
                className="rounded-xl border border-border-main px-4 py-2 text-sm text-text-main hover:bg-bg-app dark:hover:bg-slate-700 transition"
              >
                Đóng
              </button>
              <button
                onClick={confirmCancelWithReason}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition"
              >
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsAdminPage;