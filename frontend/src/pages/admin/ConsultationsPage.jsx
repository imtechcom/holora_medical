import React, { useState, useEffect } from "react";
import { resolveApiUrl } from "../../services/api";
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
  const [detailError, setDetailError] = useState("");

  // Chat/Response Form State
  const [replyText, setReplyText] = useState("");
  const [markComplete, setMarkComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

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
    setDetailError("");
    setLoadingDetail(true);
    try {
      const res = await consultationService.getConsultationDetails(id);
      setDetailData(res.data);
    } catch (err) {
      console.error("Lỗi fetch chi tiết y án:", err);
      setDetailError("Không thể tải chi tiết Y án.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedId(null);
    setDetailData(null);
    setDetailError("");
    setSubmitError("");
    setReplyText("");
    setMarkComplete(false);
  };

  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      setSubmitting(true);
      setSubmitError("");
      await consultationService.addResponse(selectedId, {
        content: replyText,
        complete: markComplete,
      });

      setReplyText("");

      if (markComplete) {
        handleCloseDetail();
        fetchConsultations();
      } else {
        const res = await consultationService.getConsultationDetails(selectedId);
        setDetailData(res.data);
      }
    } catch (err) {
      console.error("Lỗi phản hồi y án:", err);
      setSubmitError("Đã xảy ra lỗi khi gửi chẩn đoán.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-text-main">Y Án Hội Chẩn</h1>
        <button
          onClick={fetchConsultations}
          className="rounded-lg border border-border-main bg-bg-surface px-3 py-2 text-sm font-medium text-text-dim hover:bg-bg-app dark:bg-slate-800 dark:hover:bg-slate-700 transition"
        >
          Làm mới
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border-main bg-bg-surface shadow-sm dark:bg-slate-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border-main">
            <thead className="bg-bg-app dark:bg-slate-900/60">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-dim">
                  Bệnh Nhân & Lý Do Khám
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-dim">
                  Thời gian ghi nhận
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-dim">
                  Cấp thiết
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-dim">
                  Trạng Thái
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-dim">
                  Thao Tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
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
                  <tr key={item.id} className="hover:bg-bg-app dark:hover:bg-slate-700/50 transition">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-text-main">
                        {item.patient_name}
                      </div>
                      <div className="mt-1 w-64 truncate text-xs font-medium text-text-dim" title={item.chief_complaint}>
                        {item.chief_complaint}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-text-dim">
                      {new Date(item.created_at).toLocaleString("vi-VN")}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-bold uppercase ${
                        item.priority === "high"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-bg-app text-text-dim dark:bg-slate-700"
                      }`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-bold uppercase ${
                        item.status === "pending"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : item.status === "in_progress"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenDetail(item.id)}
                        className="rounded-lg bg-[#E06666] px-4 py-1.5 font-bold text-white shadow-sm hover:bg-[#D55555] transition"
                      >
                        Xem Hồ Sơ & Trả Lời
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
          <div className="flex h-[90vh] w-[95vw] max-w-6xl flex-col overflow-hidden rounded-2xl border border-border-main bg-bg-surface shadow-2xl dark:bg-slate-800 md:flex-row">
            
            {loadingDetail ? (
              <div className="flex h-full w-full items-center justify-center text-lg text-text-dim">
                Đang tải hồ sơ chi tiết...
              </div>
            ) : detailError ? (
              <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-8">
                <p className="text-sm text-red-600 dark:text-red-400">{detailError}</p>
                <button onClick={handleCloseDetail} className="rounded-lg border border-border-main px-4 py-2 text-sm text-text-main hover:bg-bg-app transition">Đóng</button>
              </div>
            ) : detailData ? (
              <>
                {/* TRÁI: Hồ sơ tĩnh */}
                <div className="w-full overflow-y-auto border-r border-border-main bg-bg-app p-6 dark:bg-slate-900/40 md:w-1/3">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-text-main">Thông Tin Tổng Quan</h3>
                    <button onClick={handleCloseDetail} className="text-text-dim text-2xl font-bold hover:text-red-500 md:hidden">&times;</button>
                  </div>
                  
                  <div className="rounded-xl border border-border-main bg-bg-surface p-4 shadow-sm dark:bg-slate-800">
                    <p className="text-sm text-text-dim">Bệnh nhân</p>
                    <p className="font-bold text-lg text-[#E06666]">{detailData.patient_name}</p>
                    <p className="text-xs text-text-dim mt-1">Giới tính: {detailData.gender} - Sinh ngày: {new Date(detailData.date_of_birth).toLocaleDateString('vi-VN')}</p>
                  </div>

                  <div className="mt-4 rounded-xl border border-border-main bg-bg-surface p-4 shadow-sm dark:bg-slate-800">
                    <p className="text-sm font-bold text-text-main">Lý do khám:</p>
                    <p className="text-sm text-text-dim mt-1">{detailData.chief_complaint}</p>
                    <p className="text-sm font-bold text-text-main mt-4">Triệu chứng:</p>
                    <p className="text-sm text-text-dim mt-1 whitespace-pre-wrap">{detailData.symptoms}</p>
                  </div>

                  <div className="mt-4 rounded-xl border border-border-main bg-bg-surface p-4 shadow-sm dark:bg-slate-800">
                    <p className="text-sm font-bold text-text-main mb-2">Hình ảnh đính kèm ({detailData.images?.length || 0}):</p>
                    {detailData.images?.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {detailData.images.map((img, idx) => (
                           <a key={idx} href={resolveApiUrl(img.image_url)} target="_blank" rel="noreferrer">
                              <img src={resolveApiUrl(img.image_url)} alt="symptom" className="h-24 w-full object-cover rounded-lg border hover:opacity-80 transition cursor-pointer" />
                           </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-text-dim italic">Bệnh nhân không gửi kèm ảnh chụp</p>
                    )}
                  </div>
                </div>

                {/* PHẢI: Khung Chat & Form Responses */}
                <div className="flex w-full flex-col bg-white md:w-2/3">
                  <div className="flex w-full items-center justify-between border-b border-border-main px-6 py-4">
                    <h3 className="font-bold text-text-main">Lịch Sử Hội Chẩn & Kê Đơn</h3>
                    <button onClick={handleCloseDetail} className="hidden rounded-lg border border-border-main px-3 py-1 text-sm font-medium text-text-dim hover:bg-bg-app dark:hover:bg-slate-700 transition md:block">
                      Đóng ✕
                    </button>
                  </div>

                  {/* Message History */}
                  <div className="flex flex-1 flex-col gap-4 overflow-y-auto bg-bg-app p-6 dark:bg-slate-900/30">
                     {detailData.responses?.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-sm italic text-text-dim">
                           Chưa có phản hồi hay trao đổi nào.
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
                    <form onSubmit={handleSubmitResponse} className="border-t border-border-main bg-bg-surface p-4 dark:bg-slate-800">
                       {submitError && (
                         <p className="mb-2 text-xs text-red-600 dark:text-red-400">{submitError}</p>
                       )}
                       <textarea
                         value={replyText}
                         onChange={(e) => setReplyText(e.target.value)}
                         placeholder="Gõ chẩn đoán, toa thuốc hoặc yêu cầu bệnh nhân cung cấp thêm thông tin..."
                         className="w-full resize-none rounded-xl border border-border-main bg-bg-app p-3 text-sm text-text-main placeholder:text-text-dim focus:border-[#E06666] focus:outline-none focus:ring-1 focus:ring-[#E06666]/30 dark:bg-slate-700"
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
                    <div className="bg-bg-app p-4 text-center text-sm font-semibold italic text-text-dim dark:bg-slate-900/30">
                       — Y Án Này Đã Được Khóa Sổ Lịch Sử —
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-10 text-center text-sm text-red-600 dark:text-red-400">Lỗi không mong muốn. Vui lòng thử lại.</div>
            )}
            
          </div>
        </div>
      )}

    </div>
  );
};

export default ConsultationsPage;