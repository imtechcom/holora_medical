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
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-gray-800">Chi tiết Ca Tư Vấn #{data.id}</h2>
            <span className={`px-2 py-1 rounded text-xs font-semibold ${data.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
              Trạng thái: {data.status}
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <p><span className="font-medium text-gray-500 w-32 inline-block">Bệnh nhân:</span> {data.patient_name}</p>
            <p><span className="font-medium text-gray-500 w-32 inline-block">Tuổi/Giới tính:</span> {new Date().getFullYear() - new Date(data.date_of_birth).getFullYear() || '--'} tuổi / {data.gender || '--'}</p>
            <p><span className="font-medium text-gray-500 w-32 inline-block">Tiền sử bệnh:</span> {data.medical_history || "Không rõ."}</p>
            <p><span className="font-medium text-gray-500 w-32 inline-block">Dị ứng:</span> {data.allergies || "Không rõ."}</p>
          </div>
          
          <hr className="my-5" />

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Triệu Chứng</h3>
            <p className="font-medium text-red-600 border-l-4 border-red-500 pl-3 mb-2">{data.chief_complaint}</p>
            <p className="text-gray-700 bg-gray-50 p-3 rounded">{data.symptoms}</p>
          </div>
        </div>

        {/* Khung Ảnh đính kèm & Tương tác AI (UC06) */}
        {data.images && data.images.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
               Hình Ảnh Cận Lâm Sàng & Phân Tích
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {data.images.map((img, idx) => {
                const aiResult = aiData?.find(a => a.consultation_image_id === img.id);
                const isProcessing = aiResult?.request_status === 'processing' || aiResult?.request_status === 'queued';
                const isCompleted = aiResult?.request_status === 'completed';
                const isFailed = aiResult?.request_status === 'failed';

                return (
                  <div key={idx} className="relative aspect-square border-2 border-dashed border-gray-300 rounded-md overflow-hidden bg-gray-100 flex flex-col group">
                    <img src={img.image_url} alt="Medical" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    
                    {/* Thanh đáy chứa tác vụ AI */}
                    <div className="absolute bottom-0 left-0 right-0 bg-white/95 p-2 border-t text-center">
                      {aiResult ? (
                        <div className="text-sm">
                            {isProcessing && (
                              <span className="text-blue-600 font-medium flex items-center justify-center gap-1 text-xs">
                                <svg className="animate-spin h-3 w-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                AI đang xử lý...
                              </span>
                            )}
                            {isFailed && <span className="text-red-500 font-medium text-xs">❌ Lỗi Phân tích API</span>}
                            {isCompleted && (
                              <div className="flex flex-col items-center">
                                {getRiskBadge(aiResult.risk_level)}
                                <span className="text-[10px] text-gray-500 font-medium mt-1">Độ chính xác: {aiResult.confidence_score}%</span>
                              </div>
                            )}
                        </div>
                      ) : (
                        role === 'patient' ? (
                          <button 
                            onClick={() => handleRequestAI(img.id)}
                            className="w-full text-xs font-medium text-white bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 py-1.5 rounded transition-all shadow-sm"
                            disabled={requestAILoading === img.id}
                          >
                            {requestAILoading === img.id ? "Đơn đợi..." : "✨ Gửi AI Phân Tích"}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-500">Chưa được y/c quét AI</span>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Lệnh Load data thay F5 */}
            <div className="mt-4 text-right">
              <button onClick={fetchAiData} className="text-xs text-indigo-600 hover:text-indigo-800 underline">↻ Làm mới trạng thái AI</button>
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
                     <span className="font-semibold text-gray-800">Ảnh ID #{res.consultation_image_id}</span>
                     <div className="flex items-center gap-2">
                       <span className="text-xs font-semibold text-gray-500">Rate: {res.confidence_score}%</span>
                       {getRiskBadge(res.risk_level)}
                     </div>
                   </div>
                   <p className="text-gray-700 mb-2 leading-relaxed"><strong>Nhận định:</strong> {res.result_summary}</p>
                   <p className="text-indigo-800 bg-indigo-50 p-2 rounded leading-relaxed border border-indigo-100"><strong>Gợi ý:</strong> {res.recommendation}</p>
                 </div>
               ))}
             </div>
          </div>
        )}


        {/* --- KHUNG CHAT TRAO ĐỔI VỚI BÁC SĨ --- */}
        <div className="flex flex-col flex-1 bg-white rounded-lg shadow-sm border border-gray-200 min-h-[500px]">
          <div className="p-4 border-b bg-gray-50 rounded-t-lg">
            <h3 className="font-bold text-gray-800">Lịch sử Chẩn đoán & Tư vấn</h3>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-6 max-h-[500px]">
            {data.responses && data.responses.length > 0 ? (
              data.responses.map((resp) => (
                <div key={resp.id} className={`flex flex-col max-w-[85%] ${resp.responder_role === 'doctor' || resp.responder_role === 'admin' ? 'ml-auto items-end' : 'items-start'}`}>
                  <span className="text-xs text-gray-500 mb-1 font-medium">{resp.responder_name} - {new Date(resp.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  <div className={`
                    p-3 rounded-lg text-sm
                    ${(resp.responder_role === 'doctor' || resp.responder_role === 'admin')
                      ? resp.response_type === 'diagnosis' ? 'bg-indigo-600 text-white shadow-md' : 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-800'}
                  `}>
                    {resp.response_type === 'diagnosis' && <div className="text-xs font-bold uppercase mb-1 flex items-center gap-1">⚡ KẾT LUẬN Y KHOA</div>}
                    {resp.response_type === 'recommendation' && <div className="text-xs font-bold uppercase mb-1">📋 LỜI KHUYÊN</div>}
                    {resp.response_type === 'prescription_note' && <div className="text-xs font-bold uppercase mb-1">💊 DẶN DÒ DÙNG THUỐC</div>}
                    <p className="whitespace-pre-line leading-relaxed">{resp.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center flex-col text-gray-400">
                <span className="text-4xl mb-2">💬</span>
                <p>Chưa có trao đổi nào.</p>
              </div>
            )}
          </div>

          {/* Form Reply - Chỉ admin/doctor hoặc bệnh nhân rep nếu ca chưa hoàn thành */}
          {data.status !== 'completed' && (
            <form className="p-4 border-t bg-gray-50 rounded-b-lg">
              {(role === 'doctor' || role === 'super_admin' || role === 'admin') && (
                <div className="mb-3">
                  <select 
                    value={replyType} 
                    onChange={(e) => setReplyType(e.target.value)}
                    className="text-sm border-gray-300 rounded focus:ring-blue-500 p-2"
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
                className="w-full border border-gray-300 rounded-md p-3 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                  className="px-5 py-2 bg-blue-600 text-white font-medium rounded text-sm hover:bg-blue-700 disabled:opacity-50"
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
