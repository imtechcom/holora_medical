-- Migration: Fix doctor_id type in payment table to BIGINT UNSIGNED

ALTER TABLE `payment`
  MODIFY COLUMN `doctor_id` BIGINT UNSIGNED NOT NULL,
  MODIFY COLUMN `appointment_id` BIGINT UNSIGNED DEFAULT NULL;
