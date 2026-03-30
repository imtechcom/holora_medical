import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { consultationService } from "../services/consultationService";
import { uploadService } from "../services/uploadService";

const PatientConsultationRequestPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    chief_complaint: "",
    symptoms: "",
  });
  
  // Trạng thái giữ các File object thật
  const [selectedFiles, setSelectedFiles] = useState([]);
  // Trạng thái preview URL (để hiện thị ngay lập tức)
  const [previewUrls, setPreviewUrls] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Giới hạn max 5 file
    if (files.length + selectedFiles.length > 5) {
      alert("Chỉ được tải lên tối đa 5 file.");
      return;
    }

    const newPreviewUrls = files.map(file => URL.createObjectURL(file));

    setSelectedFiles([...selectedFiles, ...files]);
    setPreviewUrls([...previewUrls, ...newPreviewUrls]);
  };

  const removeFile = (indexToRemove) => {
    // Giải phóng bộ nhớ Blob URL
    URL.revokeObjectURL(previewUrls[indexToRemove]);
    
    setSelectedFiles(selectedFiles.filter((_, index) => index !== indexToRemove));
    setPreviewUrls(previewUrls.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let attachmentUrls = [];

      // 1. Upload ảnh trước (nếu có)
      if (selectedFiles.length > 0) {
        const uploadData = new FormData();
        selectedFiles.forEach((file) => {
          uploadData.append("attachments", file); // key phải trùng với uploadConfig.array("attachments") ở backend
        });

        const uploadRes = await uploadService.uploadImages(uploadData);
        attachmentUrls = uploadRes.urls; // backend trả về array các URL
      }

      // 2. Gửi request tạo ca tư vấn
      const payload = {
        ...formData,
        attachments: attachmentUrls,
      };

      const res = await consultationService.createRequest(payload);
      alert("Gửi yêu cầu thành công!");
      navigate(`/doctor/consultations/${res.consultation_id}`); 
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Đã xảy ra lỗi");
    } finally {
      setLoading(false);
    }
  };

  // Dọn dẹp memory leak sau khi gửi form xong (không bắt buộc nhưng khuyên dùng)
  React.useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Gửi Yêu Cầu Tư Vấn Mới</h1>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6 whitespace-pre-line">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lý do khám bệnh (Tóm tắt) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            className="w-full border border-gray-300 rounded-md p-3 focus:ring-blue-500 focus:border-blue-500"
            placeholder="VD: Đau đầu dai dẳng, Sốt cao 3 ngày..."
            value={formData.chief_complaint}
            onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mô tả chi tiết triệu chứng <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows="5"
            className="w-full border border-gray-300 rounded-md p-3 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Vui lòng mô tả chi tiết: Đau ở đâu? Cơn đau thế nào? Đã dùng thuốc gì chưa?..."
            value={formData.symptoms}
            onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
          ></textarea>
        </div>

        <div>
           <label className="block text-sm font-medium text-gray-700 mb-2">
            Đính kèm Hình ảnh Y tế / Xét nghiệm (Tối đa 5 file)
          </label>
          <div className="flex gap-4 items-center mb-4">
            <label className="px-4 py-2 border border-gray-300 bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-blue-500">
              <span className="font-medium">+ Chọn Ảnh Từ Thiết Bị</span>
              <input 
                type="file" 
                multiple 
                accept="image/png, image/jpeg, image/webp" 
                className="hidden" 
                onChange={handleFileChange}
              />
            </label>
            <span className="text-sm text-gray-500">
              {selectedFiles.length} file đã chọn.
            </span>
          </div>
          
          {previewUrls.length > 0 && (
            <div className="flex flex-wrap gap-4 p-4 border border-dashed rounded-lg bg-gray-50">
              {previewUrls.map((url, idx) => (
                <div key={idx} className="relative w-28 h-28 flex-shrink-0 group overflow-hidden rounded-md border shadow-sm">
                  <img src={url} alt={`Preview ${idx}`} className="object-cover w-full h-full" />
                  <button 
                    type="button" 
                    onClick={() => removeFile(idx)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs shadow"
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 border-t">
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors flex justify-center items-center
              ${loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}
            `}
          >
            {loading ? (
              <>
               <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang tải dữ liệu...
              </>
            ) : "Gửi Yêu Cầu Tư Vấn"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientConsultationRequestPage;
