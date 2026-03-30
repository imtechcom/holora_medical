/**
 * Đóng vai trò là "External AI Model API" theo mô tả của UC06.
 * Hàm này mô phỏng độ trễ phân tích (3-5 giây) do AI model bên ngoài quyết định, 
 * và trả về một chuỗi JSON chuẩn y sinh học.
 */
const mockAnalyzeImageAPI = (imageUrl) => {
  return new Promise((resolve, reject) => {
    // Random delay từ 3-5s để mô phỏng "processing" Async
    const delayMs = Math.floor(Math.random() * 2000) + 3000;

    setTimeout(() => {
      // 5% tỉ lệ gọi rớt để mô phỏng Exceptional Flow (E3. AI API Lỗi)
      if (Math.random() < 0.05) {
        return reject(new Error("External AI API Rate Limit Exceeded or Timeout (Giả lập)"));
      }

      const riskLevels = ["low", "medium", "high"];
      const randomRiskIndex = Math.floor(Math.random() * riskLevels.length);
      const riskLevel = riskLevels[randomRiskIndex];
      
      const confidenceScore = parseFloat((Math.random() * (99.9 - 80.0) + 80.0).toFixed(2));
      
      // Dựa vào risk level để viết summary & recommendation
      let resultSummary = "";
      let recommendation = "";
      
      if (riskLevel === "low") {
        resultSummary = "Cấu trúc mô/da bình thường. Không phát hiện bất thường rõ rệt trên diện tích hình ảnh được cung cấp.";
        recommendation = "Bệnh nhân có thể tự theo dõi thêm tại nhà. Không cần can thiệp y tế khẩn cấp.";
      } else if (riskLevel === "medium") {
        resultSummary = "Có dấu hiệu nhận diện của viêm nhiễm, tổn thương nhẹ hoặc rối loạn sắc tố cục bộ.";
        recommendation = "Cần bác sĩ Da liễu / Chẩn đoán hình ảnh đánh giá sâu hơn. Gợi ý sử dụng thuốc làm dịu vùng việm chờ kết luận bác sĩ.";
      } else {
        resultSummary = "Phát hiện cấu trúc bất thường dạng nốt sùi, thay đổi cấu trúc màng tế bào hoặc tổn thương sâu. Có khả năng chuyển biến xấu.";
        recommendation = "Cảnh báo khẩn! Bác sĩ ưu tiên đặt lịch khám trực tiếp (offline) sớm nhất có thể để thực hiện sinh thiết / test chuyên sâu.";
      }

      // Giả lập raw_response từ AI
      const rawAiResponse = {
        model: "Holora-Med-Vision-v1.2",
        latency_ms: delayMs,
        predictions: [
          { label: riskLevel === 'high' ? 'malignant_lesion' : (riskLevel === 'medium' ? 'inflammation' : 'benign'), score: confidenceScore },
        ]
      };

      resolve({
        confidenceScore,
        riskLevel,
        resultSummary,
        recommendation,
        rawResponse: JSON.stringify(rawAiResponse),
      });

    }, delayMs);
  });
};

module.exports = {
  mockAnalyzeImageAPI
};
