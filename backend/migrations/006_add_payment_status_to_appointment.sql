-- Add payment_status to appointment for mock payment tracking
ALTER TABLE `appointment` ADD COLUMN `payment_status` ENUM('unpaid','paid') NOT NULL DEFAULT 'unpaid';
