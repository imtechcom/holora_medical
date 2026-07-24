-- 015_create_recurring_appointments.sql

CREATE TABLE recurring_appointments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    branch_id BIGINT,
    repeat_type ENUM('daily', 'weekly', 'monthly', 'custom') NOT NULL,
    repeat_interval INT DEFAULT 1, -- e.g. every 1 week
    repeat_days JSON NULL,         -- e.g. [1,3,5] for Mon/Wed/Fri (weekly)
    start_date DATE NOT NULL,
    end_date DATE NULL,
    status ENUM('active', 'paused', 'cancelled') DEFAULT 'active',
    note VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

ALTER TABLE appointments
  ADD COLUMN recurring_id BIGINT NULL,
  ADD CONSTRAINT fk_appointments_recurring FOREIGN KEY (recurring_id) REFERENCES recurring_appointments(id) ON DELETE SET NULL;
