import api from "./api";

export const aiService = {
  // Bệnh nhân yêu cầu AI chạy qua một nút bấm. API xử lý non-blocking.
  requestImageAnalysis: async (consultationId, consultationImageId) => {
    const response = await api.post("/ai/analyze", {
      consultation_id: consultationId,
      consultation_image_id: consultationImageId
    });
    return response.data;
  },

  // Pull kết quả AI về trình duyệt
  getAnalysisForConsultation: async (consultationId) => {
    const response = await api.get(`/ai/consultation/${consultationId}`);
    return response.data;
  }
};
