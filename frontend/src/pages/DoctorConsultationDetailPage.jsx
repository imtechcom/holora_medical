import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { consultationService } from "../services/consultationService";
import { aiService } from "../services/aiService";
import { useAuth } from "../context/AuthContext";
import ConfirmModal from "../components/ConfirmModal";

const DoctorConsultationDetailPage = () => {
  const { id } = useParams();
  const { role } = useAuth();
  const [data, setData] = useState(null);
  const [aiData, setAiData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyType, setReplyType] = useState("message");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Trạng thái nút bấm gửi yêu cầu
  const [requestAILoading, setRequestAILoading] = useState(null);
  const [confirmAiImageId, setConfirmAiImageId] = useState(null);

  useEffect(() => {
    fetchDetail();
    fetchAiData();
  }, [id]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await consultationService.getConsultationDetails(id);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load detail");
    } finally {
      setLoading(false);
    }
  };

  const fetchAiData = async () => {
    try {
      const res = await aiService.getAnalysisForConsultation(id);
      setAiData(res.data || []);
    } catch (err) {
      console.error("Failed to load AI data:", err);
    }
  };

  const startRequestAI = async (imageId) => {
    setRequestAILoading(imageId);
    try {
      await aiService.requestImageAnalysis(id, imageId);
      // Gọi fetch lại danh sách AI để thấy trạng thái "Queued/Processing" ngay lập tức
      await fetchAiData();
      
      // Bắt đầu một vòng lặp Poll (mỗi 2 giây một lần) để chờ AI service trả kết quả
      const interval = setInterval(async () => {
         const currentRes = await aiService.getAnalysisForConsultation(id);
         const updatedRecord = currentRes.data.find(a => a.consultation_image_id === imageId);
         
         if (updatedRecord && updatedRecord.request_status !== 'processing' && updatedRecord.request_status !== 'queued') {
            // Đã hoàn thành hoặc fail
            setAiData(currentRes.data);
            clearInterval(interval);
         } else {
            setAiData(currentRes.data); // Update liên tục cho thấy trạng thái
         }
      }, 2500);

    } catch (err) {
      alert("Lỗi khi yêu cầu AI: " + (err.response?.data?.message || err.message));
    } finally {
      setRequestAILoading(null);
      setConfirmAiImageId(null);
    }
  };

  const handleRequestAI = (imageId) => {
    setConfirmAiImageId(imageId);
  };

  const handleReplySubmit = async (e, markComplete = false) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        content: replyText,
        response_type: replyType,
        complete: markComplete
      };
      await consultationService.addResponse(id, payload);
      setReplyText("");
      setReplyType("message");
      await fetchDetail();
    } catch (err) {
      alert("Lỗi khi gửi phản hồi: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Đang tải chi tiết...</div>;
  if (error) return <div className="p-10 text-center text-red-500">{error}</div>;
  if (!data) return null;

  // Render Risk Badge
  const getRiskBadge = (level) => {
    switch(level) {
      case 'low': return <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">Low Risk</span>;
      case 'medium': return <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs">Medium Risk</span>;
      case 'high': return <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs animate-pulse">High Risk</span>;
      default: return null;
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-4 flex flex-col md:flex-row gap-6 mt-6 pb-20">
      
      {/* Khung bên Trái: Thông tin Bệnh nhân & Hồ sơ (UC13) */}
      <div className="w-full md:w-5/12 space-y-6">
        <div className="bg-bg-surface p-6 rounded-2xl shadow-sm border border-border-main dark:bg-slate-800">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-text-main">Chi tiết Ca Tư Vấn #{data.id}</h2>
            <span className={`px-2 py-1 rounded text-xs font-semibold ${data.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
              Trạng thái: {data.status}
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <p><span className="font-medium text-text-dim w-32 inline-block">Bệnh nhân:</span> {data.patient_name}</p>
            <p><span className="font-medium text-text-dim w-32 inline-block">Tuổi/Giới tính:</span> {new Date().getFullYear() - new Date(data.date_of_birth).getFullYear() || '--'} tuổi / {data.gender || '--'}</p>
            <p><span className="font-medium text-text-dim w-32 inline-block">Tiền sử bệnh:</span> {data.medical_history || "Không rõ."}</p>
            <p><span className="font-medium text-text-dim w-32 inline-block">Dị ứng:</span> {data.allergies || "Không rõ."}</p>
          </div>
          
          <hr className="my-5" />

          <div>
            <h3 className="text-lg font-semibold text-text-main mb-2">Triệu Chứng</h3>
            <p className="font-medium text-red-600 border-l-4 border-red-500 pl-3 mb-2">{data.chief_complaint}</p>
            <p className="text-text-main bg-bg-app p-3 rounded dark:bg-slate-700">{data.symptoms}</p>
          </div>
        </div>

        {/* Khung Ảnh đính kèm & Tiền Xử Lý & Phân Tích AI */}
        {data.images && data.images.length > 0 && (
          <div className="bg-bg-surface p-6 rounded-2xl shadow-sm border border-border-main dark:bg-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-main flex items-center gap-2">
                🩻 Hình Ảnh Cận Lâm Sàng
              </h3>
              <button onClick={fetchAiData} className="text-xs text-indigo-600 hover:text-indigo-800 underline flex items-center gap-1">
                ↻ Làm mới
              </button>
            </div>

            <div className="space-y-4">
              {data.images.map((img, idx) => {
                const aiResult = aiData?.find(a => a.consultation_image_id === img.id);
                const isProcessing = aiResult?.request_status === 'processing' || aiResult?.request_status === 'queued';
                const isCompleted = aiResult?.request_status === 'completed';
                const isFailed = aiResult?.request_status === 'failed';
                // TODO (Giai đoạn 2): thay bằng img.preprocessed_url khi backend hỗ trợ tiền xử lý ảnh
                const preprocessedUrl = null;

                return (
                  <div key={idx} className="border border-border-main rounded-xl overflow-hidden dark:border-slate-700">

                    {/* Card header: số ảnh + trạng thái AI */}
                    <div className="bg-bg-app px-4 py-2 flex items-center justify-between border-b border-border-main dark:bg-slate-900">
                      <span className="text-xs font-bold text-text-dim uppercase tracking-widest">Ảnh #{idx + 1}</span>
                      <div className="flex items-center gap-2">
                        {isProcessing && (
                          <span className="flex items-center gap-1 text-[10px] text-blue-600 font-medium">
                            <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                            </svg>
                            AI đang phân tích...
                          </span>
                        )}
                        {isCompleted && getRiskBadge(aiResult.risk_level)}
                        {isFailed && <span className="text-[10px] text-red-500 font-medium">❌ Lỗi AI</span>}
                        {!aiResult && <span className="text-[10px] text-text-dim">Chưa phân tích</span>}
                      </div>
                    </div>

                    {/* So sánh ảnh: Gốc | Đã tiền xử lý */}
                    <div className="grid grid-cols-2 divide-x divide-border-main dark:divide-slate-700">

                      {/* Panel 1: Ảnh gốc */}
                      <div className="flex flex-col">
                        <div className="bg-slate-50 dark:bg-slate-900/40 px-3 py-1.5 text-center border-b border-border-main">
                          <span className="text-[9px] font-semibold uppercase tracking-widest text-text-dim">Ảnh gốc</span>
                        </div>
                        <div className="aspect-square overflow-hidden bg-bg-app dark:bg-slate-800 group">
                          <img src={img.image_url} alt="Ảnh gốc" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                      </div>

                      {/* Panel 2: Ảnh sau tiền xử lý (framework – Giai đoạn 2) */}
                      <div className="flex flex-col">
                        <div className="bg-violet-50 dark:bg-violet-900/20 px-3 py-1.5 text-center border-b border-border-main flex items-center justify-center gap-1.5">
                          <span className="text-[9px] font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">Ảnh đã xử lý</span>
                          <span className="bg-violet-200 text-violet-700 dark:bg-violet-800/50 dark:text-violet-300 text-[7px] font-bold uppercase px-1.5 py-0.5 rounded-sm leading-none">Sắp ra mắt</span>
                        </div>
                        <div className="aspect-square flex flex-col items-center justify-center bg-violet-50/60 dark:bg-violet-900/10 gap-2 p-3">
                          {preprocessedUrl ? (
                            <img src={preprocessedUrl} alt="Ảnh đã xử lý" className="w-full h-full object-cover" />
                          ) : (
                            <>
                              <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-xl">🔬</div>
                              <p className="text-[9px] font-semibold text-violet-600 dark:text-violet-300 text-center">Tiền xử lý ảnh</p>
                              <p className="text-[8px] text-violet-400 text-center leading-relaxed px-1">Khử nhiễu · Cân bằng histogram · Tăng tương phản</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Thông số kỹ thuật */}
                    <div className="border-t border-border-main dark:border-slate-700 grid grid-cols-2 divide-x divide-border-main dark:divide-slate-700 text-[10px]">

                      {/* Thông số tiền xử lý */}
                      <div className="px-3 py-2.5 bg-violet-50/50 dark:bg-violet-900/10">
                        <p className="font-bold text-[9px] uppercase tracking-widest text-violet-600 dark:text-violet-400 mb-2">🔬 Tiền xử lý (Giai đoạn 2)</p>
                        <div className="space-y-1 text-text-dim">
                          <div className="flex justify-between"><span>Mức nhiễu (dB)</span><span className="font-mono text-violet-300">—</span></div>
                          <div className="flex justify-between"><span>Tương phản</span><span className="font-mono text-violet-300">—</span></div>
                          <div className="flex justify-between"><span>Độ sắc nét</span><span className="font-mono text-violet-300">—</span></div>
                          <div className="flex justify-between"><span>Phương pháp</span><span className="font-mono text-violet-300">—</span></div>
                        </div>
                      </div>

                      {/* Thông số phân tích AI */}
                      <div className="px-3 py-2.5 bg-indigo-50/50 dark:bg-indigo-900/10">
                        <p className="font-bold text-[9px] uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">✨ Phân tích AI</p>
                        <div className="space-y-1 text-text-dim">
                          <div className="flex justify-between">
                            <span>Mức rủi ro</span>
                            {isCompleted
                              ? <span className="font-bold font-mono uppercase">{aiResult.risk_level || '—'}</span>
                              : <span className="font-mono text-indigo-200">—</span>}
                          </div>
                          <div className="flex justify-between">
                            <span>Độ chính xác</span>
                            {isCompleted
                              ? <span className="font-bold font-mono">{aiResult.confidence_score}%</span>
                              : <span className="font-mono text-indigo-200">—</span>}
                          </div>
                          <div className="flex justify-between">
                            <span>Nhận định</span>
                            {isCompleted
                              ? <span className="font-mono text-emerald-600 font-bold">✓ Có</span>
                              : <span className="font-mono text-indigo-200">—</span>}
                          </div>
                          <div className="flex justify-between">
                            <span>Gợi ý điều trị</span>
                            {isCompleted
                              ? <span className="font-mono text-emerald-600 font-bold">✓ Có</span>
                              : <span className="font-mono text-indigo-200">—</span>}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer: hành động AI */}
                    <div className="border-t border-border-main px-4 py-2.5 bg-bg-app dark:bg-slate-900 flex items-center gap-3">
                      {!aiResult && role === 'patient' && (
                        <button
                          onClick={() => handleRequestAI(img.id)}
                          className="text-xs font-medium text-white bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 px-3 py-1.5 rounded-lg transition-all shadow-sm disabled:opacity-60"
                          disabled={requestAILoading === img.id}
                        >
                          {requestAILoading === img.id ? "Đang gửi..." : "✨ Yêu cầu AI phân tích"}
                        </button>
                      )}
                      {!aiResult && role !== 'patient' && (
                        <span className="text-[10px] text-text-dim">Bệnh nhân chưa yêu cầu phân tích AI</span>
                      )}
                      {isCompleted && <span className="text-[10px] text-emerald-600 font-medium">✓ Phân tích hoàn thành</span>}
                      {isProcessing && <span className="text-[10px] text-blue-600 font-medium">Đang xử lý...</span>}
                      {isFailed && <span className="text-[10px] text-red-500">Phân tích thất bại</span>}
                      <span className="text-[9px] text-text-dim ml-auto">Tiền xử lý → AI phân tích</span>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>


      {/* Khung bên Phải: AI Results Dashboard & Khung Chat (UC14, UC07) */}
      <div className="w-full md:w-7/12 flex flex-col gap-6">

        {/* --- [UC07] THẺ TỔNG KẾT AI ANALYSIS CHI TIẾT --- */}
        {aiData.filter(a => a.request_status === 'completed').length > 0 && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-lg shadow-sm border border-indigo-100 relative overflow-hidden">
             {/* Icon Background trang trí */}
             <div className="absolute -right-4 -top-4 text-8xl opacity-5">🤖</div>
             
             <h3 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
               <span className="text-xl">✨</span> Báo cáo Phân Tích từ Trợ lý Mô hình AI
             </h3>
             
             <div className="space-y-4">
               {aiData.filter(a => a.request_status === 'completed').map((res, i) => (
                 <div key={i} className="bg-white/70 p-4 rounded border border-white/50 shadow-sm text-sm">
                   <div className="flex justify-between items-center mb-2">
                   <span className="font-semibold text-text-main">Ảnh ID #{res.consultation_image_id}</span>
                     <div className="flex items-center gap-2">
                   <span className="text-xs font-semibold text-text-dim">Rate: {res.confidence_score}%</span>
                       {getRiskBadge(res.risk_level)}
                     </div>
                   </div>
                   <p className="text-text-main mb-2 leading-relaxed"><strong>Nhận định:</strong> {res.result_summary}</p>
                   <p className="text-indigo-800 bg-indigo-50 p-2 rounded leading-relaxed border border-indigo-100"><strong>Gợi ý:</strong> {res.recommendation}</p>
                 </div>
               ))}
             </div>
          </div>
        )}


        {/* --- KHUNG CHAT TRAO ĐỔI VỚI BÁC SĨ --- */}
        <div className="flex flex-col flex-1 bg-bg-surface rounded-2xl shadow-sm border border-border-main min-h-[500px] dark:bg-slate-800">
          <div className="p-4 border-b border-border-main bg-bg-app rounded-t-2xl dark:bg-slate-900">
            <h3 className="font-bold text-text-main">Lịch sử Chẩn đoán & Tư vấn</h3>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-6 max-h-[500px]">
            {data.responses && data.responses.length > 0 ? (
              data.responses.map((resp) => (
                <div key={resp.id} className={`flex flex-col max-w-[85%] ${resp.responder_role === 'doctor' || resp.responder_role === 'admin' ? 'ml-auto items-end' : 'items-start'}`}>
                  <span className="text-xs text-text-dim mb-1 font-medium">{resp.responder_name} - {new Date(resp.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  <div className={`
                    p-3 rounded-lg text-sm
                    ${(resp.responder_role === 'doctor' || resp.responder_role === 'admin')
                      ? resp.response_type === 'diagnosis' ? 'bg-indigo-600 text-white shadow-md' : 'bg-blue-600 text-white' 
                      : 'bg-bg-app text-text-main dark:bg-slate-700'}
                  `}>
                    {resp.response_type === 'diagnosis' && <div className="text-xs font-bold uppercase mb-1 flex items-center gap-1">⚡ KẾT LUẬN Y KHOA</div>}
                    {resp.response_type === 'recommendation' && <div className="text-xs font-bold uppercase mb-1">📋 LỜI KHUYÊN</div>}
                    {resp.response_type === 'prescription_note' && <div className="text-xs font-bold uppercase mb-1">💊 DẶN DÒ DÙNG THUỐC</div>}
                    <p className="whitespace-pre-line leading-relaxed">{resp.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center flex-col text-text-dim">
                <span className="text-4xl mb-2">💬</span>
                <p>Chưa có trao đổi nào.</p>
              </div>
            )}
          </div>

          {/* Form Reply - Chỉ admin/doctor hoặc bệnh nhân rep nếu ca chưa hoàn thành */}
          {data.status !== 'completed' && (
            <form className="p-4 border-t border-border-main bg-bg-app rounded-b-2xl dark:bg-slate-900">
              {(role === 'doctor' || role === 'super_admin' || role === 'admin') && (
                <div className="mb-3">
                  <select 
                    value={replyType} 
                    onChange={(e) => setReplyType(e.target.value)}
                    className="text-sm border-border-main bg-bg-app rounded focus:ring-[#E06666]/30 p-2 dark:bg-slate-700"
                  >
                    <option value="message">Gửi tin nhắn (Trao đổi phụ)</option>
                    <option value="diagnosis">Đưa ra Chẩn Đoán (Kết luận)</option>
                    <option value="recommendation">Đưa ra Lời khuyên</option>
                    <option value="prescription_note">Kê toa / Dặn dò thuốc</option>
                  </select>
                </div>
              )}
              
              <textarea
                required
                rows="3"
                className="w-full border border-border-main bg-bg-app rounded-md p-3 focus:ring-[#E06666]/30 focus:border-[#E06666] text-sm text-text-main dark:bg-slate-700"
                placeholder={role === 'patient' ? "Nhập câu hỏi thêm cho bác sĩ..." : "Nhập nội dung phản hồi của bác sĩ..."}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              ></textarea>

              <div className="flex gap-3 justify-end mt-3">
                {(role === 'doctor' || role === 'super_admin' || role === 'admin') && (
                   <button
                    type="button"
                    className="px-4 py-2 bg-green-600 text-white font-medium rounded text-sm hover:bg-green-700 disabled:opacity-50"
                    onClick={(e) => handleReplySubmit(e, true)}
                    disabled={isSubmitting || !replyText.trim()}
                  >
                    Gửi và Kết thúc ca
                  </button>
                )}

                <button
                  type="button"
                  className="px-5 py-2 bg-[#E06666] text-white font-medium rounded text-sm hover:bg-[#D55555] disabled:opacity-50"
                  onClick={(e) => handleReplySubmit(e, false)}
                  disabled={isSubmitting || !replyText.trim()}
                >
                  Gửi {role === 'patient' ? "tin nhắn" : "phản hồi"}
                </button>
              </div>
            </form>
          )}
          
          {data.status === 'completed' && (
              <div className="p-4 bg-green-50 text-green-700 text-center rounded-b-lg font-medium border-t">
                Ca tư vấn này đã được đánh dấu hoàn thành.
              </div>
          )}
        </div>

      </div>

      <ConfirmModal
        isOpen={confirmAiImageId !== null}
        title="Gửi ảnh này cho Holora AI phân tích?"
        description="Tác vụ này có thể mất vài giây do hệ thống sẽ gửi ảnh sang dịch vụ model để xử lý."
        badgeLabel="Holora AI"
        tone="info"
        confirmLabel="Gửi phân tích"
        cancelLabel="Hủy"
        closeLabel="Đóng"
        onConfirm={() => startRequestAI(confirmAiImageId)}
        onClose={() => setConfirmAiImageId(null)}
      />
    </div>
  );
};

export default DoctorConsultationDetailPage;
