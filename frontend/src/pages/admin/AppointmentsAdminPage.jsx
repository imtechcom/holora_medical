import React, { useState, useEffect } from "react";
import { appointmentService } from "../../services/appointmentService";
import { useAuth } from "../../context/AuthContext";

const AppointmentsAdminPage = () => {
  const { role } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, [role]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const data = await appointmentService.getMyAppointments();
      setAppointments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    let cancelReason = "";
    if (newStatus === "cancelled") {
       cancelReason = prompt("Lý do từ chối/huỷ ca khám này là gì?");
       if (cancelReason === null) return; // User băm cancel prompt
    }

    if (!window.confirm(`Xác nhận chuyển ca khám sang trạng thái: ${newStatus.toUpperCase()}?`)) return;

    try {
      await appointmentService.updateStatus(id, newStatus, cancelReason);
      fetchAppointments();
    } catch (err) {
      alert("Lỗi khi cập nhật trạng thái!");
      console.error(err);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">🏥 Quản Lý Ca Khám (Appointments)</h1>
        <button onClick={fetchAppointments} className="bg-white border rounded px-3 py-1 shadow-sm text-sm font-medium hover:bg-gray-50">
          ↻ Làm mới dữ liệu
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã / Ngày Khám</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bệnh Nhân</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lý do / Loại</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng Thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase text-right">Tác Vụ Duyệt</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="5" className="text-center py-10">Đang tải biểu đồ ca khám...</td></tr>
              ) : appointments.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-10 text-gray-500">Chưa có ai đặt lịch. Bác sĩ đi uống Cafe thôi ☕</td></tr>
              ) : (
                appointments.map(app => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-indigo-600">{app.appointment_code}</div>
                      <div className="text-xs font-medium text-gray-800 mt-1">{new Date(app.appointment_date).toLocaleDateString('vi-VN')}</div>
                      <div className="text-xs text-gray-500">{new Date(app.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(app.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">{app.patient_name}</div>
                      <div className="text-xs text-gray-500">SĐT: {app.patient_phone || "N/A"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-800 truncate w-48 font-medium" title={app.reason}>{app.reason}</div>
                      <span className="px-2 py-0.5 mt-1 inline-flex text-[10px] leading-5 font-semibold rounded bg-blue-100 text-blue-800 uppercase">
                        {app.appointment_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-full uppercase
                        ${app.status === 'scheduled' && 'bg-yellow-100 text-yellow-800'}
                        ${app.status === 'confirmed' && 'bg-green-100 text-green-800'}
                        ${['cancelled', 'no_show'].includes(app.status) && 'bg-red-100 text-red-800'}
                        ${app.status === 'completed' && 'bg-purple-100 text-purple-800'}
                        ${app.status === 'in_progress' && 'bg-blue-100 text-blue-800'}
                      `}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                       {app.status === 'scheduled' && (
                         <>
                           <button onClick={() => handleUpdateStatus(app.id, 'confirmed')} className="text-white bg-green-500 hover:bg-green-600 px-3 py-1 rounded shadow-sm">
                             Duyệt Ca
                           </button>
                           <button onClick={() => handleUpdateStatus(app.id, 'cancelled')} className="text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded shadow-sm">
                             Từ Chối
                           </button>
                         </>
                       )}
                       {app.status === 'confirmed' && (
                         <button onClick={() => handleUpdateStatus(app.id, 'completed')} className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded border border-indigo-200">
                           Đánh dấu Hoàn Tất
                         </button>
                       )}
                       {['completed', 'cancelled', 'no_show'].includes(app.status) && (
                         <span className="text-gray-400 text-xs">- Đã chốt sổ -</span>
                       )}
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

export default AppointmentsAdminPage;