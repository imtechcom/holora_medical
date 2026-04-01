import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AlertCircle, ArrowLeft, CheckCircle2, ImagePlus, Loader2, Send, Stethoscope, X } from "lucide-react";
import { consultationService } from "../services/consultationService";
import { uploadService } from "../services/uploadService";

const MAX_FILES = 5;

const PatientConsultationRequestPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({ chief_complaint: "", symptoms: "" });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Revoke blob URLs on unmount
  useEffect(() => {
    return () => previewUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [previewUrls]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedFiles.length > MAX_FILES) {
      setError(`Chỉ được đính kèm tối đa ${MAX_FILES} ảnh.`);
      return;
    }
    setError(null);
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setSelectedFiles((prev) => [...prev, ...files]);
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (idx) => {
    URL.revokeObjectURL(previewUrls[idx]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let attachmentUrls = [];
      if (selectedFiles.length > 0) {
        const uploadData = new FormData();
        selectedFiles.forEach((file) => uploadData.append("attachments", file));
        const uploadRes = await uploadService.uploadImages(uploadData);
        attachmentUrls = uploadRes.urls;
      }

      await consultationService.createRequest({ ...formData, attachments: attachmentUrls });
      setSuccess(true);
      setTimeout(() => navigate("/patient/consultations"), 1800);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Đã xảy ra lỗi, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-xl font-bold text-text-main">Gửi yêu cầu thành công!</h2>
        <p className="text-sm text-text-dim">Đang chuyển về trang lịch sử tư vấn...</p>
        <Loader2 className="h-5 w-5 animate-spin text-[#E06666]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-0 pb-10 sm:px-2">
      {/* Hero header */}
      <section className="overflow-hidden rounded-[24px] bg-gradient-to-br from-[#E06666] to-[#C04444] p-6 text-white shadow-lg sm:p-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-1.5 rounded-xl border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 transition hover:bg-white/20"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Quay lại
        </button>

        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <Stethoscope className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/70">
              {t("patient.zone") || "Patient Zone"}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Gửi Yêu Cầu Tư Vấn
            </h1>
            <p className="mt-1 text-sm text-white/80">
              Mô tả triệu chứng để bác sĩ hỗ trợ bạn kịp thời.
            </p>
          </div>
        </div>
      </section>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-900/15 dark:text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Chief complaint */}
        <div className="overflow-hidden rounded-2xl border border-border-main bg-bg-surface shadow-sm dark:bg-slate-800">
          <div className="border-b border-border-main bg-bg-app px-4 py-3 dark:bg-slate-900/50">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-dim">
              Bước 1 — Lý do khám
            </p>
          </div>
          <div className="p-4 sm:p-5">
            <label className="mb-1.5 block text-sm font-medium text-text-main">
              Tóm tắt lý do khám <span className="text-[#E06666]">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={200}
              value={formData.chief_complaint}
              onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })}
              placeholder="VD: Đau đầu dai dẳng, Sốt cao 3 ngày..."
              className="w-full rounded-xl border border-border-main bg-bg-app px-4 py-3 text-sm text-text-main outline-none transition placeholder:text-text-dim focus:ring-2 focus:ring-[#E06666]/50 dark:bg-slate-900"
            />
            <p className="mt-1.5 text-xs text-text-dim">{formData.chief_complaint.length}/200 ký tự</p>
          </div>
        </div>

        {/* Symptoms */}
        <div className="overflow-hidden rounded-2xl border border-border-main bg-bg-surface shadow-sm dark:bg-slate-800">
          <div className="border-b border-border-main bg-bg-app px-4 py-3 dark:bg-slate-900/50">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-dim">
              Bước 2 — Mô tả triệu chứng
            </p>
          </div>
          <div className="p-4 sm:p-5">
            <label className="mb-1.5 block text-sm font-medium text-text-main">
              Chi tiết triệu chứng <span className="text-[#E06666]">*</span>
            </label>
            <textarea
              required
              rows={5}
              value={formData.symptoms}
              onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
              placeholder="Vui lòng mô tả chi tiết: Đau ở đâu? Cơn đau thế nào? Đã dùng thuốc gì chưa?"
              className="w-full resize-none rounded-xl border border-border-main bg-bg-app px-4 py-3 text-sm text-text-main outline-none transition placeholder:text-text-dim focus:ring-2 focus:ring-[#E06666]/50 dark:bg-slate-900"
            />
          </div>
        </div>

        {/* Attachments */}
        <div className="overflow-hidden rounded-2xl border border-border-main bg-bg-surface shadow-sm dark:bg-slate-800">
          <div className="border-b border-border-main bg-bg-app px-4 py-3 dark:bg-slate-900/50">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-dim">
              Bước 3 — Đính kèm ảnh (tuỳ chọn, tối đa {MAX_FILES})
            </p>
          </div>
          <div className="p-4 sm:p-5">
            {/* Upload button */}
            <label className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-4 text-sm transition
              ${selectedFiles.length >= MAX_FILES
                ? "cursor-not-allowed border-border-main bg-bg-app opacity-50"
                : "border-[#E06666]/30 bg-[#FFF5F5] text-[#E06666] hover:border-[#E06666]/60 hover:bg-[#FFECEC] dark:bg-[#E06666]/5 dark:hover:bg-[#E06666]/10"
              }`}
            >
              <ImagePlus className="h-5 w-5" />
              <span className="font-medium">
                {selectedFiles.length >= MAX_FILES ? "Đã đạt giới hạn ảnh" : "Chọn ảnh từ thiết bị"}
              </span>
              <input
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                disabled={selectedFiles.length >= MAX_FILES}
                onChange={handleFileChange}
              />
            </label>

            {/* Previews */}
            {previewUrls.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
                {previewUrls.map((url, idx) => (
                  <div key={idx} className="group relative aspect-square overflow-hidden rounded-xl border border-border-main bg-bg-app shadow-sm">
                    <img src={url} alt={`preview-${idx}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white opacity-0 shadow transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {selectedFiles.length > 0 && (
              <p className="mt-2 text-xs text-text-dim">{selectedFiles.length}/{MAX_FILES} ảnh đã chọn</p>
            )}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#E06666] px-6 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#D55555] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang gửi yêu cầu...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Gửi Yêu Cầu Tư Vấn
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default PatientConsultationRequestPage;
