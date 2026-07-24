-- Add cancellation policy fields to appointment table
ALTER TABLE appointment
ADD COLUMN cancellation_policy VARCHAR(255) DEFAULT NULL,
ADD COLUMN cancelled_at DATETIME DEFAULT NULL,
ADD COLUMN cancellation_reason VARCHAR(255) DEFAULT NULL,
ADD COLUMN cancellation_fee DECIMAL(10,2) DEFAULT NULL;