import React, { useState, useEffect } from "react";
import { consultationService } from "../../services/consultationService";
import { useAuth } from "../../context/AuthContext";

const ConsultationsPage = () => {
  const { role } = useAuth();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [selectedId, setSelectedId] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Chat/Response Form State
  const [replyText, setReplyText] = useState("");
  const [markComplete, setMarkComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const res = await consultationService.getDoctorRequests();
      setConsultations(res.data || []);
    } catch (err) {
      console.error("Lỗi fetch danh sách y án:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (id) => {
    setSelectedId(id);
    setDetailData(null);
    setLoadingDetail(true);
    try {
      const res = await consultationService.getConsultationDetails(id);
      setDetailData(res.data);
    } catch (err) {
      console.error("Lỗi fetch chi tiết y án:", err);
      alert("Không thể tải chi tiết Y án.");
      setSelectedId(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedId(null);
    setDetailData(null);
    setReplyText("");
    setMarkComplete(false);
  };

  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      setSubmitting(true);
      await consultationService.addResponse(selectedId, {
        content: replyText,
        complete: markComplete,
      });

      setReplyText("");
      
      if (markComplete) {
        // Đã hoàn tất -> Đóng modal và tải lại master list
        handleCloseDetail();
        fetchConsultations();
      } else {
        // Chat tiếp -> Chỉ tải lại Detail data
        const res = await consultationService.getConsultationDetails(selectedId);
        setDetailData(res.data);
      }
    } catch (err) {
      console.error("Lỗi phản hồi y án:", err);
      alert("Đã xảy ra lỗi khi gửi chẩn đoán.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          🩺 Y Án Hội Chẩn (Consultations)
        </h1>
        <button
          onClick={fetchConsultations}
          className="rounded border bg-white px-3 py-1 text-sm font-medium shadow-sm hover:bg-gray-50"
        >
          ↻ Làm mới Master List
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Bệnh Nhân & Lý Do Khám
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Thời gian ghi nhận
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Cấp thiết (Priority)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Trạng Thái
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">
                  Thao Tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-10 text-center text-gray-500">
                    Đang dò tìm Hồ sơ Y án...
                  </td>
                </tr>
              ) : consultations.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-10 text-center text-gray-500">
                    Chưa có yêu cầu tư vấn nào đang chờ.
                  </td>
                </tr>
              ) : (
                consultations.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">
                        {item.patient_name}
                      </div>
                      <div className="mt-1 w-64 truncate text-xs font-medium text-gray-600" title={item.chief_complaint}>
                        {item.chief_complaint}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {new Date(item.created_at).toLocaleString("vi-VN")}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-bold uppercase
                        ${item.priority === "high" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-bold uppercase
                        ${item.status === 'pending' && 'bg-yellow-100 text-yellow-800'}
                        ${item.status === 'in_progress' && 'bg-blue-100 text-blue-800'}
                        ${item.status === 'completed' && 'bg-green-100 text-green-800'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenDetail(item.id)}
                        className="rounded bg-indigo-600 px-4 py-1.5 font-bold text-white shadow-sm hover:bg-indigo-700"
                      >
                        👁 Xem Hồ Sơ & Trả Lời
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL / SLIDE OVER CHO DETAIL VIEW */}
      {selectedId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex h-[90vh] w-[95vw] max-w-6xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden md:flex-row">
            
            {loadingDetail ? (
              <div className="flex h-full w-full items-center justify-center text-lg text-gray-500">
                Đang bung hồ sơ Y án chi tiết...
              </div>
            ) : detailData ? (
              <>
                {/* TRÁI: Hồ sơ tĩnh */}
                <div className="w-full border-r border-gray-200 bg-slate-50 p-6 overflow-y-auto md:w-1/3">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-800">Thông Tin Tổng Quan</h3>
                    {/* Nút đóng dành cho màn mobile */}
                    <button onClick={handleCloseDetail} className="text-red-500 text-2xl font-bold hover:text-red-700 md:hidden">&times;</button>
                  </div>
                  
                  <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500">Bệnh nhân</p>
                    <p className="font-bold text-lg text-indigo-700">{detailData.patient_name}</p>
                    <p className="text-xs text-gray-500 mt-1">Giới tính: {detailData.gender} - Sinh ngày: {new Date(detailData.date_of_birth).toLocaleDateString('vi-VN')}</p>
                  </div>

                  <div className="mt-4 rounded-xl bg-white p-4 shadow-sm border border-gray-100">
                    <p className="text-sm font-bold text-gray-700">Lý do khám (Chief Complaint):</p>
                    <p className="text-sm text-gray-800 mt-1">{detailData.chief_complaint}</p>
                    
                    <p className="text-sm font-bold text-gray-700 mt-4">Khai báo triệu chứng:</p>
                    <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap">{detailData.symptoms}</p>
                  </div>

                  <div className="mt-4 rounded-xl bg-white p-4 shadow-sm border border-gray-100">
                    <p className="text-sm font-bold text-gray-700 mb-2">Hình ảnh đính kèm ({detailData.images?.length || 0}):</p>
                    {detailData.images?.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {detailData.images.map((img, idx) => (
                           <a key={idx} href={img.image_url.startsWith('http') ? img.image_url : `http://localhost:5000${img.image_url}`} target="_blank" rel="noreferrer">
                              <img src={img.image_url.startsWith('http') ? img.image_url : `http://localhost:5000${img.image_url}`} alt="symptom" className="h-24 w-full object-cover rounded-lg border hover:opacity-80 transition cursor-pointer" />
                           </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Bệnh nhân không gửi kèm ảnh chụp</p>
                    )}
                  </div>
                </div>

                {/* PHẢI: Khung Chat & Form Responses */}
                <div className="flex w-full flex-col bg-white md:w-2/3">
                  <div className="flex items-center justify-between border-b px-6 py-4 shadow-sm w-full">
                    <h3 className="font-bold text-gray-800 flex items-center">
                      <span className="mr-2 text-xl">💬</span>
                      Lịch Sử Hội Chẩn & Kê Đơn
                    </h3>
                    <button onClick={handleCloseDetail} className="rounded-full bg-red-100 px-3 py-1 font-bold text-red-600 hover:bg-red-200 hidden md:block">
                      Tắt hồ sơ X
                    </button>
                  </div>

                  {/* Message History */}
                  <div className="flex-1 overflow-y-auto p-6 bg-gray-50 flex flex-col gap-4">
                     {detailData.responses?.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-gray-400 italic text-sm">
                           Chưa có phản hồi hay trao đổi nào. Hãy là người đầu tiên gõ chẩn đoán.
                        </div>
                     ) : (
                       detailData.responses?.map((msg) => {
                         const isPatient = msg.responder_role === 'patient';
                         return (
                           <div key={msg.id} className={`flex w-full ${isPatient ? 'justify-start' : 'justify-end'}`}>
                              <div className={`max-w-[70%] rounded-2xl p-4 shadow-sm ${isPatient ? 'bg-white border rounded-tl-none' : 'bg-[#E06666] text-white rounded-tr-none'}`}>
                                 <div className={`text-xs font-bold mb-1 ${isPatient ? 'text-gray-500' : 'text-red-100'}`}>
                                    {msg.responder_name} • {new Date(msg.created_at).toLocaleTimeString('vi-VN')}
                                 </div>
                                 <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                              </div>
                           </div>
                         )
                       })
                     )}
                  </div>

                  {/* Input Bác Sĩ */}
                  {detailData.status !== 'completed' ? (
                    <form onSubmit={handleSubmitResponse} className="border-t bg-white p-4">
                       <textarea
                         value={replyText}
                         onChange={(e) => setReplyText(e.target.value)}
                         placeholder="Gõ chẩn đoán, toa thuốc hoặc yêu cầu bệnh nhân cung cấp thêm thông tin..."
                         className="w-full resize-none rounded-xl border border-gray-300 p-3 text-sm focus:border-[#E06666] focus:ring-1 focus:ring-[#F7CACA] outline-none"
                         rows="3"
                         required
                       />
                       <div className="mt-3 flex items-center justify-between">
                          <label className="flex items-center cursor-pointer select-none">
                             <input 
                               type="checkbox" 
                               checked={markComplete}
                               onChange={(e) => setMarkComplete(e.target.checked)}
                               className="mr-2 h-4 w-4 cursor-pointer text-[#E06666] focus:ring-[#E06666]" 
                             />
                             <span className="text-sm font-semibold text-gray-700">Đánh dấu: "Đã khám Tới Nơi Tới Chốn (Hoàn Tất Ca)"</span>
                          </label>
                          <button 
                            type="submit" 
                            disabled={submitting}
                            className="rounded-lg bg-[#E06666] px-6 py-2 font-bold text-white shadow-md hover:bg-[#d85a5a] disabled:opacity-50"
                          >
                            {submitting ? "Đang đẩy..." : (markComplete ? "Chốt Sổ & Đóng" : "Gửi Hội Chẩn")}
                          </button>
                       </div>
                    </form>
                  ) : (
                    <div className="bg-gray-200 text-gray-500 italic p-4 text-center text-sm font-semibold">
                       — Y Án Này Đã Được Khóa Sổ Lịch Sử —
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-10 text-center text-red-500">Lỗi không mong muốn. Dữ liệu null.</div>
            )}
            
          </div>
        </div>
      )}

    </div>
  );
};

export default ConsultationsPage;