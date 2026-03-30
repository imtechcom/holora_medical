import React, { useState, useEffect } from "react";
import { scheduleService } from "../../services/appointmentService";
import { useAuth } from "../../context/AuthContext";

const DoctorSchedulePage = () => {
  const { role, id: userId, doctor_id } = useAuth(); // Nếu role = doctor, doctor_id được gán
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [editId, setEditId] = useState(null);
  const [workDate, setWorkDate] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("12:00");
  const [slotDuration, setSlotDuration] = useState(30);

  useEffect(() => {
    fetchSchedules();
  }, [role]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const data = await scheduleService.getDoctorSchedules(doctor_id, "", "");
      setSchedules(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditId(null);
    setWorkDate("");
    setStartTime("08:00");
    setEndTime("12:00");
    setSlotDuration(30);
  };

  const handleEditClick = (shift) => {
    setEditId(shift.id);
    // Format YYYY-MM-DD
    const dateStr = new Date(shift.work_date).toISOString().split('T')[0];
    setWorkDate(dateStr);
    setStartTime(shift.start_time.substring(0, 5));
    setEndTime(shift.end_time.substring(0, 5));
    setSlotDuration(shift.slot_duration);
  };

  const handleSubmitSchedule = async (e) => {
    e.preventDefault();
    if (!doctor_id) {
       return alert("Lỗi: Tài khoản của bạn không được liên kết với ID Bác Sĩ.");
    }
    
    try {
      if (editId) {
        // Mode UPDATE (Edit)
        await scheduleService.updateSchedule(editId, {
          work_date: workDate, 
          start_time: startTime, 
          end_time: endTime, 
          slot_duration: slotDuration,
          status: 'active'
        });
        alert("✅ Đã Cập Nhật Ca làm việc thành công!");
      } else {
        // Mode CREATE
        await scheduleService.createSchedule({
          doctor_id: doctor_id,
          schedules: [
            { work_date: workDate, start_time: startTime, end_time: endTime, slot_duration: slotDuration }
          ]
        });
        alert("✅ Đã Mở Ca làm việc thành công!");
      }
      resetForm();
      fetchSchedules();
    } catch (err) {
      alert("Lỗi lưu trữ ca làm việc!");
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xoá/đóng Ca làm việc này? Khách sẽ không thể đặt lịch vào ngày này nữa.")) return;
    try {
      await scheduleService.deleteSchedule(id);
      if (editId === id) resetForm();
      fetchSchedules();
    } catch (err) {
      alert("Lỗi khi xoá ca.");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🗓️ Thiết Lập Phân Ca Làm Việc (Doctor Shifts)</h1>
          <p className="text-gray-500 text-sm mt-1">Giúp Bệnh Nhân biết được lúc nào bạn Rảnh để Đặt lịch tương tác.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Khung Tạo/Sửa Ca Mới */}
        <div className={`col-span-1 p-5 rounded-lg shadow-sm border h-fit transition-colors ${editId ? 'bg-yellow-50 border-yellow-300' : 'bg-white border-gray-200'}`}>
          <div className="flex justify-between items-center mb-4">
             <h2 className={`text-lg font-bold flex items-center gap-2 ${editId ? 'text-yellow-800' : 'text-gray-800'}`}>
                <span className="text-xl">{editId ? '✏️' : '➕'}</span> 
                {editId ? 'Chỉnh Sửa Ca' : 'Mở Ca Mới'}
             </h2>
             {editId && (
               <button onClick={resetForm} className="text-xs text-red-600 hover:text-red-800 font-medium">HUỶ SỬA</button>
             )}
          </div>

          <form onSubmit={handleSubmitSchedule} className="space-y-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày làm việc</label>
                <input 
                  type="date" required 
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border-gray-300 rounded p-2 focus:ring-indigo-500" 
                  value={workDate} onChange={e => setWorkDate(e.target.value)} 
                />
             </div>
             <div className="grid grid-cols-2 gap-3">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Từ Giờ</label>
                   <input 
                     type="time" required 
                     className="w-full border-gray-300 rounded p-2 focus:ring-indigo-500" 
                     value={startTime} onChange={e => setStartTime(e.target.value)} 
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Đến Giờ</label>
                   <input 
                     type="time" required 
                     className="w-full border-gray-300 rounded p-2 focus:ring-indigo-500" 
                     value={endTime} onChange={e => setEndTime(e.target.value)} 
                   />
                </div>
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thời lượng 1 Block tiêu chuẩn</label>
                <select 
                   className="w-full border-gray-300 rounded p-2 focus:ring-indigo-500"
                   value={slotDuration} onChange={e => setSlotDuration(parseInt(e.target.value))}
                >
                   <option value={30}>30 Phút</option>
                   <option value={60}>60 Phút</option>
                </select>
             </div>
             <button type="submit" className={`w-full font-medium py-2 rounded-md transition-colors mt-2 text-white shadow-sm ${editId ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                {editId ? 'Lưu Thay Đổi (Update)' : 'Xuất Bản Lên Hệ Thống'}
             </button>
          </form>
        </div>

        {/* Khung Danh sách Ca (Nhật ký) */}
        <div className="col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
           <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex justify-between items-center">
             <h2 className="text-base font-bold text-gray-700">Lịch Trình Tương Lai (Active Shifts)</h2>
             <button onClick={fetchSchedules} className="text-indigo-600 text-xs hover:text-indigo-800">↻ Refresh</button>
           </div>
           
           <div className="p-5 h-[500px] overflow-y-auto">
              {loading ? (
                 <p className="text-center text-gray-400 py-10">Đang đồng bộ lịch...</p>
              ) : schedules.length === 0 ? (
                 <div className="text-center py-10 flex flex-col items-center">
                    <span className="text-5xl mb-3 opacity-50">💤</span>
                    <p className="text-gray-500">Bạn chưa thiết lập bất kỳ ca làm việc nào.</p>
                    <p className="text-xs text-gray-400 max-w-xs mt-1">Hệ thống Đặt Lịch sẽ khoá Bệnh Nhân lại nếu bạn không có khung giờ rảnh.</p>
                 </div>
              ) : (
                 <div className="space-y-3">
                    {schedules.map(shift => (
                       <div key={shift.id} className={`flex justify-between items-center p-3 sm:p-4 rounded border transition-shadow relative overflow-hidden ${editId === shift.id ? 'bg-yellow-50 border-yellow-300 shadow' : 'bg-white hover:shadow-md'}`}>
                          {/* Dấu viền màu chỉ thị Active */}
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${shift.status==='active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          
                          <div className="ml-2 flex-1">
                             <h3 className="font-bold text-gray-800 text-lg">Ngày: {new Date(shift.work_date).toLocaleDateString('vi-VN')}</h3>
                             <p className="text-sm text-gray-600 font-medium">Khung giờ: <span className="text-indigo-700 font-bold">{shift.start_time.substring(0,5)} - {shift.end_time.substring(0,5)}</span></p>
                             <div className="flex gap-2 mt-1">
                               <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">Slot {shift.slot_duration}m</span>
                               <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100">{shift.status.toUpperCase()}</span>
                             </div>
                          </div>

                          <div className="flex flex-col gap-2">
                             <button onClick={() => handleEditClick(shift)} className="text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 text-xs font-semibold px-3 py-1.5 border border-yellow-200 rounded transition-colors" title="Chỉnh Sửa Ca">
                               ✏️ Sửa Lịch
                             </button>
                             <button onClick={() => handleDelete(shift.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs font-semibold px-3 py-1.5 border border-red-200 rounded transition-colors" title="Tuỷ/Huỷ Ca rảnh">
                               🗑️ Đóng Ca
                             </button>
                          </div>
                       </div>
                    ))}
                 </div>
              )}
           </div>
        </div>

      </div>
    </div>
  );
};

export default DoctorSchedulePage;
