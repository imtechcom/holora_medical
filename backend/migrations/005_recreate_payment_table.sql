-- Migration: Clean up and recreate payment table with correct types and constraints

DROP TABLE IF EXISTS `payment`;

CREATE TABLE IF NOT EXISTS `payment` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `doctor_id` BIGINT UNSIGNED NOT NULL,
  `appointment_id` BIGINT UNSIGNED DEFAULT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `currency` VARCHAR(8) DEFAULT 'VND',
  `type` VARCHAR(32) DEFAULT 'consultation',
  `status` VARCHAR(16) DEFAULT 'paid',
  `note` VARCHAR(255) DEFAULT NULL,
  `paid_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`doctor_id`) REFERENCES `doctor`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`appointment_id`) REFERENCES `appointment`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
