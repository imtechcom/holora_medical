-- 002_ai_analysis_review.sql
-- Thêm cột đánh giá bác sĩ vào bảng ai_analysis_result
-- Trạng thái: pending_review | approved | approved_watch | not_standard | revoked
-- shared_with_patient: 1 = bệnh nhân được xem, 0 = chưa chia sẻ

ALTER TABLE `ai_analysis_result`
  ADD COLUMN `doctor_review_status` ENUM('pending_review','approved','approved_watch','not_standard','revoked')
    NOT NULL DEFAULT 'pending_review'
    AFTER `reviewed_by_doctor_id`,
  ADD COLUMN `shared_with_patient` TINYINT(1) NOT NULL DEFAULT 0
    AFTER `doctor_review_status`,
  ADD COLUMN `reviewed_at` DATETIME DEFAULT NULL
    AFTER `review_note`;
