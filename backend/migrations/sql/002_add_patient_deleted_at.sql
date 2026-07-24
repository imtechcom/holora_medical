-- Migration: Add deleted_at column to patient table for soft-delete support
-- This column was missing but referenced by patient.controller.js queries

ALTER TABLE `patient`
  ADD COLUMN `deleted_at` datetime DEFAULT NULL AFTER `updated_at`;

-- Add index for soft-delete filtering
ALTER TABLE `patient`
  ADD INDEX `idx_patient_deleted_at` (`deleted_at`);
