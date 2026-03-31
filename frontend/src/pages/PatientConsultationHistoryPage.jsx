import React, { useState, useEffect } from "react";
import { consultationService } from "../services/consultationService";

const PatientConsultationHistoryPage = () => {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [selectedId, setSelectedId] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Chat/Response Form State
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await consultationService.getPatientHistory();
      setConsultations(res.data || []);
    } catch (err) {
      console.error("Lỗi fetch lịch sử y án:", err);
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
  };

  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      setSubmitting(true);
      // Bệnh nhân luôn trả lời với complete = false
      await consultationService.addResponse(selectedId, {
        content: replyText,
        complete: false,
      });

      setReplyText("");
      
      // Load lại detail data
      const res = await consultationService.getConsultationDetails(selectedId);
      setDetailData(res.data);
    } catch (err) {
      console.error("Lỗi gửi tin nhắn phản hồi:", err);
      alert("Đã xảy ra lỗi khi gửi thư.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          Lịch Sử Tư Vấn Khám Bệnh
        </h1>
        <button
          onClick={fetchHistory}
          className="rounded border bg-white px-3 py-1 text-sm font-medium shadow-sm hover:bg-gray-50"
        >
          ↻ Làm mới
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#E06666]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase text-white">
                  Lý do khám (Bạn đã ghi)
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase text-white">
                  Bác sĩ phụ trách
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase text-white">
                  Ngày Gửi
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase text-white">
                  Trạng Thái
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase text-white">
                  Khung Chat
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-10 text-center text-gray-500">
                    Đang dò tìm Lịch sử tư vấn của bạn...
                  </td>
                </tr>
              ) : consultations.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-10 text-center text-gray-500">
                    Bạn chưa từng xin tư vấn bệnh rảo nào cả.
                  </td>
                </tr>
              ) : (
                consultations.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900 truncate w-64 uppercase" title={item.chief_complaint}>
                        {item.chief_complaint}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-indigo-700 text-sm">
                        {item.doctor_name || "Đang xếp phòng..."}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                      {new Date(item.created_at).toLocaleString("vi-VN")}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase
                        ${item.status === 'pending' && 'bg-yellow-100 text-yellow-800'}
                        ${item.status === 'in_progress' && 'bg-blue-100 text-blue-800'}
                        ${item.status === 'completed' && 'bg-green-100 text-green-800'}`}>
                        {item.status === 'pending' ? 'Chờ Bác Sĩ' : item.status === 'in_progress' ? 'Đang Trao Đổi' : 'Đã Chốt Bệnh'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenDetail(item.id)}
                        className="rounded-lg bg-[#E06666] px-4 py-2 font-bold text-white shadow hover:bg-[#c95151]"
                      >
                        Vào Xem / Trả lời
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CHI TIẾT DÀNH CHO BỆNH NHÂN */}
      {selectedId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex h-[90vh] w-[95vw] max-w-6xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden md:flex-row">
            
            {loadingDetail ? (
              <div className="flex h-full w-full items-center justify-center text-lg text-gray-500">
                Đang bung túi hồ sơ...
              </div>
            ) : detailData ? (
              <>
                {/* TRÁI: Hồ sơ của tui */}
                <div className="w-full border-r border-gray-200 bg-[#FFF5F5] p-6 overflow-y-auto md:w-1/3">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-[#E06666]">Đơn Khám Của Mình</h3>
                    <button onClick={handleCloseDetail} className="text-[#E06666] text-2xl font-bold hover:text-red-700 md:hidden">&times;</button>
                  </div>
                  
                  <div className="mt-4 rounded-xl bg-white p-4 shadow-sm border border-red-50">
                    <p className="text-sm font-bold text-gray-700">Lý do Khám:</p>
                    <p className="text-sm text-gray-800 mt-1">{detailData.chief_complaint}</p>
                    
                    <p className="text-sm font-bold text-gray-700 mt-4">Triệu chứng đã khai báo:</p>
                    <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap">{detailData.symptoms}</p>
                  </div>

                  <div className="mt-4 rounded-xl bg-white p-4 shadow-sm border border-red-50">
                    <p className="text-sm font-bold text-gray-700 mb-2">Hình đính kèm ({detailData.images?.length || 0}):</p>
                     {detailData.images?.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {detailData.images.map((img, idx) => (
                           <a key={idx} href={img.image_url.startsWith('http') ? img.image_url : `http://localhost:5000${img.image_url}`} target="_blank" rel="noreferrer">
                              <img src={img.image_url.startsWith('http') ? img.image_url : `http://localhost:5000${img.image_url}`} alt="symptom" className="h-24 w-full object-cover rounded-lg border hover:opacity-80 transition cursor-pointer" />
                           </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Mình đã không chụp ảnh nào.</p>
                    )}
                  </div>
                </div>

                {/* PHẢI: Khung Chat 2 chiều */}
                <div className="flex w-full flex-col bg-white md:w-2/3">
                  <div className="flex items-center justify-between border-b px-6 py-4 shadow-sm w-full">
                    <h3 className="font-bold text-gray-800 flex items-center">
                      <span className="mr-2 text-xl">💬</span>
                      Lời Dặn Bác Sĩ & Trò Chuyện
                    </h3>
                    <button onClick={handleCloseDetail} className="rounded-full bg-gray-100 px-3 py-1 font-bold text-gray-600 hover:bg-gray-200 hidden md:block border">
                      Thoát ra ngoài
                    </button>
                  </div>

                  {/* Message History */}
                  <div className="flex-1 overflow-y-auto p-6 bg-gray-50 flex flex-col gap-4">
                     {detailData.responses?.length === 0 ? (
                        <div className="flex h-full items-center justify-center flex-col">
                           <p className="text-gray-400 italic text-sm mb-2">Bác sĩ chưa có phản hồi nào. Hãy kiên nhẫn đợi ráng chút nhé.</p>
                           <p className="text-gray-400 text-xs">Bạn cũng có thể cung cấp thêm Tình Trạng Hiện Tại ở dưới nếu rát cần thiết.</p>
                        </div>
                     ) : (
                       detailData.responses?.map((msg) => {
                         const isMe = msg.responder_user_id === detailData.patient_id; // Này so id hơi rối vì schema mình ko pass user_id thẳng ra, nên dùng role.
                         const iAmSending = msg.responder_role === 'patient';
                         
                         return (
                           <div key={msg.id} className={`flex w-full ${iAmSending ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[70%] rounded-2xl p-4 shadow-sm ${iAmSending ? 'bg-[#E06666] text-white rounded-tr-none' : 'bg-white border rounded-tl-none'}`}>
                                 <div className={`text-[10px] font-bold uppercase mb-1 ${iAmSending ? 'text-red-100' : 'text-gray-400'}`}>
                                    {iAmSending ? 'Chính MÌnh' : msg.responder_name} • {new Date(msg.created_at).toLocaleTimeString('vi-VN')}
                                 </div>
                                 <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                              </div>
                           </div>
                         )
                       })
                     )}
                  </div>

                  {/* Input Bệnh nhân */}
                  {detailData.status !== 'completed' ? (
                    <form onSubmit={handleSubmitResponse} className="border-t bg-white p-4">
                       <textarea
                         value={replyText}
                         onChange={(e) => setReplyText(e.target.value)}
                         placeholder="Gửi thêm câu hỏi hoặc báo cáo diễn biến chẩn để Bác sĩ xem..."
                         className="w-full resize-none rounded-xl border border-gray-300 p-3 text-sm focus:border-[#E06666] focus:ring-1 focus:ring-[#F7CACA] outline-none"
                         rows="2"
                         required
                       />
                       <div className="mt-2 flex justify-end">
                          <button 
                            type="submit" 
                            disabled={submitting}
                            className="rounded-lg bg-[#E06666] px-6 py-2 font-bold text-white shadow-md hover:bg-[#d85a5a] disabled:opacity-50"
                          >
                            {submitting ? "Đang đẩy..." : "Gửi Đi 📤"}
                          </button>
                       </div>
                    </form>
                  ) : (
                    <div className="bg-green-50 text-green-700 italic border-t border-green-200 p-4 text-center text-sm font-semibold">
                       — Y án này đã được Bác sĩ kết luận Hoàn Tất. Chúc bạn mau khỏe ạ. —
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

export default PatientConsultationHistoryPage;
