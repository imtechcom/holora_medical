-- Migration: Create payment table for doctor earnings

CREATE TABLE IF NOT EXISTS `payment` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `doctor_id` INT UNSIGNED NOT NULL,
  `appointment_id` INT UNSIGNED DEFAULT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `currency` VARCHAR(8) DEFAULT 'VND',
  `type` VARCHAR(32) DEFAULT 'consultation', -- consultation, service, refund, bonus, etc.
  `status` VARCHAR(16) DEFAULT 'paid',        -- paid, pending, refunded, cancelled
  `note` VARCHAR(255) DEFAULT NULL,
  `paid_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`doctor_id`) REFERENCES `doctor`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`appointment_id`) REFERENCES `appointment`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
