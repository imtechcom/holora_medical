-- Migration: Fix payment table foreign keys and types

ALTER TABLE `payment`
  DROP FOREIGN KEY IF EXISTS `payment_ibfk_1`,
  DROP FOREIGN KEY IF EXISTS `payment_ibfk_2`;

ALTER TABLE `payment`
  MODIFY COLUMN `doctor_id` BIGINT UNSIGNED NOT NULL,
  MODIFY COLUMN `appointment_id` BIGINT UNSIGNED DEFAULT NULL;

ALTER TABLE `payment`
  ADD CONSTRAINT `fk_payment_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctor`(`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_payment_appointment` FOREIGN KEY (`appointment_id`) REFERENCES `appointment`(`id`) ON DELETE SET NULL;
