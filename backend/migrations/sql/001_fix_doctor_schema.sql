-- Update doctor table to make user_id nullable
-- This allows doctors to be created without a linked user account

ALTER TABLE `doctor` 
MODIFY `user_id` bigint UNSIGNED NULL,
MODIFY `specialty_id` bigint UNSIGNED NULL;

-- Add unique constraint on license_number if not exists
ALTER TABLE `doctor` 
ADD CONSTRAINT `unique_license_number` UNIQUE KEY `uk_license_number` (`license_number`);

-- Add index on doctor_code for faster queries
ALTER TABLE `doctor` 
ADD INDEX `idx_doctor_code` (`doctor_code`);

-- Update status enum to include 'deleted' status if not exists
-- Note: This is for soft deletes
ALTER TABLE `doctor` 
MODIFY `status` enum('active','inactive','on_leave','deleted') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active';
