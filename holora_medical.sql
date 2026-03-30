-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: mysql
-- Generation Time: Mar 29, 2026 at 02:59 AM
-- Server version: 8.0.45
-- PHP Version: 8.3.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `holora_medical`
--

-- --------------------------------------------------------

--
-- Table structure for table `ai_analysis_request`
--

CREATE TABLE `ai_analysis_request` (
  `id` bigint UNSIGNED NOT NULL,
  `consultation_id` bigint UNSIGNED NOT NULL,
  `consultation_image_id` bigint UNSIGNED DEFAULT NULL,
  `requested_by` bigint UNSIGNED DEFAULT NULL,
  `model_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `request_type` enum('image_analysis','symptom_analysis','risk_assessment','diagnosis_support') COLLATE utf8mb4_unicode_ci NOT NULL,
  `input_payload` json DEFAULT NULL,
  `status` enum('queued','processing','completed','failed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'queued',
  `requested_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` datetime DEFAULT NULL,
  `error_message` text COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ai_analysis_result`
--

CREATE TABLE `ai_analysis_result` (
  `id` bigint UNSIGNED NOT NULL,
  `request_id` bigint UNSIGNED NOT NULL,
  `result_summary` text COLLATE utf8mb4_unicode_ci,
  `result_payload` json DEFAULT NULL,
  `confidence_score` decimal(5,2) DEFAULT NULL,
  `risk_level` enum('low','medium','high','critical') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recommendation` text COLLATE utf8mb4_unicode_ci,
  `reviewed_by_doctor_id` bigint UNSIGNED DEFAULT NULL,
  `review_note` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `appointment`
--

CREATE TABLE `appointment` (
  `id` bigint UNSIGNED NOT NULL,
  `patient_id` bigint UNSIGNED NOT NULL,
  `doctor_id` bigint UNSIGNED NOT NULL,
  `specialty_id` bigint UNSIGNED DEFAULT NULL,
  `branch_id` bigint UNSIGNED DEFAULT NULL,
  `appointment_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `appointment_date` date NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `appointment_type` enum('online','offline','video') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'online',
  `reason` text COLLATE utf8mb4_unicode_ci,
  `status` enum('scheduled','confirmed','checked_in','in_progress','completed','cancelled','no_show') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'scheduled',
  `cancellation_reason` text COLLATE utf8mb4_unicode_ci,
  `fee` decimal(12,2) NOT NULL DEFAULT '0.00',
  `created_by` bigint UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `audit_log`
--

CREATE TABLE `audit_log` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED DEFAULT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `module_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entity_id` bigint UNSIGNED DEFAULT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `consultation`
--

CREATE TABLE `consultation` (
  `id` bigint UNSIGNED NOT NULL,
  `patient_id` bigint UNSIGNED NOT NULL,
  `doctor_id` bigint UNSIGNED DEFAULT NULL,
  `appointment_id` bigint UNSIGNED DEFAULT NULL,
  `consultation_type` enum('text','image','video','hybrid') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'text',
  `chief_complaint` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `symptoms` text COLLATE utf8mb4_unicode_ci,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `status` enum('pending','in_progress','completed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `priority` enum('low','normal','high','urgent') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'normal',
  `started_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `consultation_image`
--

CREATE TABLE `consultation_image` (
  `id` bigint UNSIGNED NOT NULL,
  `consultation_id` bigint UNSIGNED NOT NULL,
  `uploaded_by` bigint UNSIGNED DEFAULT NULL,
  `image_url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_type` enum('symptom','lab_report','xray','prescription','other') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'other',
  `caption` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mime_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_size` bigint UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `consultation_response`
--

CREATE TABLE `consultation_response` (
  `id` bigint UNSIGNED NOT NULL,
  `consultation_id` bigint UNSIGNED NOT NULL,
  `responder_user_id` bigint UNSIGNED NOT NULL,
  `response_type` enum('message','diagnosis','recommendation','prescription_note','follow_up') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'message',
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_from_ai` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `doctor`
--

CREATE TABLE `doctor` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED DEFAULT NULL,
  `specialty_id` bigint UNSIGNED DEFAULT NULL,
  `doctor_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `license_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qualification` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `experience_years` int UNSIGNED NOT NULL DEFAULT '0',
  `consultation_fee` decimal(12,2) NOT NULL DEFAULT '0.00',
  `bio` text COLLATE utf8mb4_unicode_ci,
  `avatar_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','inactive','on_leave','deleted') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `doctor`
--

INSERT INTO `doctor` (`id`, `user_id`, `specialty_id`, `doctor_code`, `full_name`, `phone`, `email`, `license_number`, `qualification`, `experience_years`, `consultation_fee`, `bio`, `avatar_url`, `status`, `created_at`, `updated_at`) VALUES
(1, NULL, NULL, 'DOCTOR000001', 'Hoàng Văn Linh', '+84981819143', 'it@holora.com', '2022', '', 0, 0.00, NULL, NULL, 'active', '2026-03-29 02:42:28', '2026-03-29 02:42:56');

-- --------------------------------------------------------

--
-- Table structure for table `notification`
--

CREATE TABLE `notification` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `notification_type` enum('system','appointment','consultation','video','billing','review','security') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'system',
  `reference_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_id` bigint UNSIGNED DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `read_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `patient`
--

CREATE TABLE `patient` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED DEFAULT NULL,
  `patient_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` enum('male','female','other') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `blood_group` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `allergies` text COLLATE utf8mb4_unicode_ci,
  `medical_history` text COLLATE utf8mb4_unicode_ci,
  `emergency_contact_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emergency_contact_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','inactive','blocked') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `patient`
--

INSERT INTO `patient` (`id`, `user_id`, `patient_code`, `full_name`, `phone`, `email`, `gender`, `date_of_birth`, `address`, `blood_group`, `allergies`, `medical_history`, `emergency_contact_name`, `emergency_contact_phone`, `status`, `created_at`, `updated_at`) VALUES
(1, 5, 'PAT000005', 'Linh Hoàng', '', 'hoangvanlinhuit@gmail.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', '2026-03-28 15:07:41', '2026-03-28 15:07:41');

-- --------------------------------------------------------

--
-- Table structure for table `permission`
--

CREATE TABLE `permission` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `module_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `permission`
--

INSERT INTO `permission` (`id`, `name`, `code`, `module_name`, `description`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Manage Users', 'user.manage', 'user', 'Quản lý người dùng', 'active', '2026-03-28 09:52:25', '2026-03-28 09:52:25'),
(2, 'Manage Roles', 'role.manage', 'rbac', 'Quản lý vai trò', 'active', '2026-03-28 09:52:25', '2026-03-28 09:52:25'),
(3, 'Manage Permissions', 'permission.manage', 'rbac', 'Quản lý quyền', 'active', '2026-03-28 09:52:25', '2026-03-28 09:52:25'),
(4, 'Manage Patients', 'patient.manage', 'patient', 'Quản lý bệnh nhân', 'active', '2026-03-28 09:52:25', '2026-03-28 09:52:25'),
(5, 'Manage Doctors', 'doctor.manage', 'doctor', 'Quản lý bác sĩ', 'active', '2026-03-28 09:52:25', '2026-03-28 09:52:25'),
(6, 'Manage Consultations', 'consultation.manage', 'consultation', 'Quản lý tư vấn', 'active', '2026-03-28 09:52:25', '2026-03-28 09:52:25'),
(7, 'Manage AI Analysis', 'ai.manage', 'ai', 'Quản lý phân tích AI', 'active', '2026-03-28 09:52:25', '2026-03-28 09:52:25'),
(8, 'Manage Appointments', 'appointment.manage', 'appointment', 'Quản lý lịch hẹn', 'active', '2026-03-28 09:52:25', '2026-03-28 09:52:25'),
(9, 'Manage Video Sessions', 'video.manage', 'video', 'Quản lý phiên tư vấn video', 'active', '2026-03-28 09:52:25', '2026-03-28 09:52:25'),
(10, 'Manage Reviews', 'review.manage', 'review', 'Quản lý đánh giá', 'active', '2026-03-28 09:52:25', '2026-03-28 09:52:25'),
(11, 'Manage Notifications', 'notification.manage', 'notification', 'Quản lý thông báo', 'active', '2026-03-28 09:52:25', '2026-03-28 09:52:25'),
(12, 'View Audit Logs', 'audit.view', 'audit', 'Xem nhật ký hệ thống', 'active', '2026-03-28 09:52:25', '2026-03-28 09:52:25'),
(13, 'Access Dashboard', 'dashboard.access', NULL, NULL, 'active', '2026-03-28 14:55:40', '2026-03-28 14:55:40'),
(14, 'View Users', 'user.view', NULL, NULL, 'active', '2026-03-28 14:55:40', '2026-03-28 14:55:40'),
(15, 'Create User', 'user.create', NULL, NULL, 'active', '2026-03-28 14:55:40', '2026-03-28 14:55:40'),
(16, 'Update User', 'user.update', NULL, NULL, 'active', '2026-03-28 14:55:40', '2026-03-28 14:55:40'),
(17, 'Delete User', 'user.delete', NULL, NULL, 'active', '2026-03-28 14:55:40', '2026-03-28 14:55:40'),
(18, 'View Patients', 'patient.view', NULL, NULL, 'active', '2026-03-28 14:55:40', '2026-03-28 14:55:40'),
(19, 'Create Patient', 'patient.create', NULL, NULL, 'active', '2026-03-28 14:55:40', '2026-03-28 14:55:40'),
(20, 'Update Patient', 'patient.update', NULL, NULL, 'active', '2026-03-28 14:55:40', '2026-03-28 14:55:40'),
(21, 'View Appointments', 'appointment.view', NULL, NULL, 'active', '2026-03-28 14:55:40', '2026-03-28 14:55:40'),
(22, 'Create Appointment', 'appointment.create', NULL, NULL, 'active', '2026-03-28 14:55:40', '2026-03-28 14:55:40'),
(23, 'Update Appointment', 'appointment.update', NULL, NULL, 'active', '2026-03-28 14:55:40', '2026-03-28 14:55:40'),
(24, 'View Consultations', 'consultation.view', NULL, NULL, 'active', '2026-03-28 14:55:40', '2026-03-28 14:55:40'),
(25, 'Respond Consultation', 'consultation.respond', NULL, NULL, 'active', '2026-03-28 14:55:40', '2026-03-28 14:55:40');

-- --------------------------------------------------------

--
-- Table structure for table `review`
--

CREATE TABLE `review` (
  `id` bigint UNSIGNED NOT NULL,
  `patient_id` bigint UNSIGNED NOT NULL,
  `doctor_id` bigint UNSIGNED NOT NULL,
  `appointment_id` bigint UNSIGNED DEFAULT NULL,
  `rating` tinyint UNSIGNED NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci,
  `is_anonymous` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('pending','approved','rejected','hidden') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ;

-- --------------------------------------------------------

--
-- Table structure for table `role`
--

CREATE TABLE `role` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_system_role` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `role`
--

INSERT INTO `role` (`id`, `name`, `code`, `description`, `is_system_role`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Super Admin', 'super_admin', 'Toàn quyền hệ thống', 1, 'active', '2026-03-28 09:52:25', '2026-03-28 09:52:25'),
(2, 'Admin', 'admin', 'Quản trị hệ thống', 1, 'active', '2026-03-28 09:52:25', '2026-03-28 09:52:25'),
(3, 'Doctor', 'doctor', 'Bác sĩ', 1, 'active', '2026-03-28 09:52:25', '2026-03-28 09:52:25'),
(4, 'Patient', 'patient', 'Bệnh nhân', 1, 'active', '2026-03-28 09:52:25', '2026-03-28 09:52:25');

-- --------------------------------------------------------

--
-- Table structure for table `role_permission`
--

CREATE TABLE `role_permission` (
  `id` bigint UNSIGNED NOT NULL,
  `role_id` bigint UNSIGNED NOT NULL,
  `permission_id` bigint UNSIGNED NOT NULL,
  `granted_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `granted_by` bigint UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `role_permission`
--

INSERT INTO `role_permission` (`id`, `role_id`, `permission_id`, `granted_at`, `granted_by`) VALUES
(1, 1, 1, '2026-03-28 14:55:55', NULL),
(2, 1, 2, '2026-03-28 14:55:55', NULL),
(3, 1, 3, '2026-03-28 14:55:55', NULL),
(4, 1, 4, '2026-03-28 14:55:55', NULL),
(5, 1, 5, '2026-03-28 14:55:55', NULL),
(6, 1, 6, '2026-03-28 14:55:55', NULL),
(7, 1, 7, '2026-03-28 14:55:55', NULL),
(8, 1, 8, '2026-03-28 14:55:55', NULL),
(9, 1, 9, '2026-03-28 14:55:55', NULL),
(10, 1, 10, '2026-03-28 14:55:55', NULL),
(11, 1, 11, '2026-03-28 14:55:55', NULL),
(12, 1, 12, '2026-03-28 14:55:55', NULL),
(13, 1, 13, '2026-03-28 14:55:55', NULL),
(14, 1, 14, '2026-03-28 14:55:55', NULL),
(15, 1, 15, '2026-03-28 14:55:55', NULL),
(16, 1, 16, '2026-03-28 14:55:55', NULL),
(17, 1, 17, '2026-03-28 14:55:55', NULL),
(18, 1, 18, '2026-03-28 14:55:55', NULL),
(19, 1, 19, '2026-03-28 14:55:55', NULL),
(20, 1, 20, '2026-03-28 14:55:55', NULL),
(21, 1, 21, '2026-03-28 14:55:55', NULL),
(22, 1, 22, '2026-03-28 14:55:55', NULL),
(23, 1, 23, '2026-03-28 14:55:55', NULL),
(24, 1, 24, '2026-03-28 14:55:55', NULL),
(25, 1, 25, '2026-03-28 14:55:55', NULL),
(32, 2, 22, '2026-03-28 14:56:13', NULL),
(33, 2, 23, '2026-03-28 14:56:13', NULL),
(34, 2, 21, '2026-03-28 14:56:13', NULL),
(35, 2, 24, '2026-03-28 14:56:13', NULL),
(36, 2, 13, '2026-03-28 14:56:13', NULL),
(37, 2, 19, '2026-03-28 14:56:13', NULL),
(38, 2, 20, '2026-03-28 14:56:13', NULL),
(39, 2, 18, '2026-03-28 14:56:13', NULL),
(40, 2, 15, '2026-03-28 14:56:13', NULL),
(41, 2, 16, '2026-03-28 14:56:13', NULL),
(42, 2, 14, '2026-03-28 14:56:13', NULL),
(47, 3, 23, '2026-03-28 14:56:28', NULL),
(48, 3, 21, '2026-03-28 14:56:28', NULL),
(49, 3, 25, '2026-03-28 14:56:28', NULL),
(50, 3, 24, '2026-03-28 14:56:28', NULL),
(51, 3, 13, '2026-03-28 14:56:28', NULL),
(52, 3, 18, '2026-03-28 14:56:28', NULL),
(54, 4, 22, '2026-03-28 14:56:46', NULL),
(55, 4, 21, '2026-03-28 14:56:46', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `specialty`
--

CREATE TABLE `specialty` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint UNSIGNED NOT NULL,
  `full_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` enum('male','female','other') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `status` enum('active','inactive','suspended','deleted') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `email_verified_at` datetime DEFAULT NULL,
  `last_login_at` datetime DEFAULT NULL,
  `remember_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `full_name`, `username`, `email`, `password_hash`, `phone`, `avatar_url`, `gender`, `date_of_birth`, `status`, `email_verified_at`, `last_login_at`, `remember_token`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'Super Admin', 'sadmin', 'sadmin@holora.com', '$2b$10$vRRxYLE/b6cZcc.F3w/KW.ZL1tgge1xCfCGSNQFFIMYaHcX7QjVVG', NULL, NULL, NULL, NULL, 'active', NULL, NULL, NULL, '2026-03-28 10:29:08', '2026-03-28 10:29:08', NULL),
(2, 'Admin User', 'admin', 'admin@holora.com', '$2b$10$vRRxYLE/b6cZcc.F3w/KW.ZL1tgge1xCfCGSNQFFIMYaHcX7QjVVG', '0900000001', NULL, NULL, NULL, 'active', NULL, NULL, NULL, '2026-03-28 15:00:40', '2026-03-28 15:00:40', NULL),
(3, 'Doctor User', 'doctor', 'doctor@holora.com', '$2b$10$vRRxYLE/b6cZcc.F3w/KW.ZL1tgge1xCfCGSNQFFIMYaHcX7QjVVG', '0900000002', NULL, NULL, NULL, 'active', NULL, NULL, NULL, '2026-03-28 15:00:40', '2026-03-28 15:00:40', NULL),
(4, 'Patient User', 'patient', 'patient@holora.com', '$2b$10$vRRxYLE/b6cZcc.F3w/KW.ZL1tgge1xCfCGSNQFFIMYaHcX7QjVVG', '0900000003', NULL, NULL, NULL, 'active', NULL, NULL, NULL, '2026-03-28 15:00:40', '2026-03-28 15:00:40', NULL),
(5, 'Linh Hoàng', 'sadmin@holora.com', 'hoangvanlinhuit@gmail.com', '$2b$10$uePpdVkxfpVEAMEdJf7/fe4R8oBzWiryPxfYB7PKw.nUcnHnrR/6S', NULL, NULL, NULL, NULL, 'active', NULL, NULL, NULL, '2026-03-28 15:07:41', '2026-03-28 15:07:41', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_role`
--

CREATE TABLE `user_role` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `role_id` bigint UNSIGNED NOT NULL,
  `assigned_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `assigned_by` bigint UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_role`
--

INSERT INTO `user_role` (`id`, `user_id`, `role_id`, `assigned_at`, `assigned_by`) VALUES
(1, 1, 1, '2026-03-28 14:57:13', NULL),
(3, 2, 2, '2026-03-28 15:01:06', NULL),
(4, 3, 3, '2026-03-28 15:01:06', NULL),
(5, 4, 4, '2026-03-28 15:01:06', NULL),
(6, 5, 4, '2026-03-28 15:07:41', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `video_consultation_session`
--

CREATE TABLE `video_consultation_session` (
  `id` bigint UNSIGNED NOT NULL,
  `appointment_id` bigint UNSIGNED NOT NULL,
  `consultation_id` bigint UNSIGNED DEFAULT NULL,
  `room_code` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `provider` enum('agora','twilio','google_meet','zoom','custom_webrtc') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'custom_webrtc',
  `session_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `join_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `started_at` datetime DEFAULT NULL,
  `ended_at` datetime DEFAULT NULL,
  `duration_minutes` int UNSIGNED DEFAULT NULL,
  `status` enum('scheduled','live','ended','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'scheduled',
  `recording_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `ai_analysis_request`
--
ALTER TABLE `ai_analysis_request`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_ai_analysis_request_consultation_image` (`consultation_image_id`),
  ADD KEY `fk_ai_analysis_request_requested_by` (`requested_by`),
  ADD KEY `idx_ai_analysis_request_consultation_id` (`consultation_id`),
  ADD KEY `idx_ai_analysis_request_status` (`status`),
  ADD KEY `idx_ai_analysis_request_model_name` (`model_name`);

--
-- Indexes for table `ai_analysis_result`
--
ALTER TABLE `ai_analysis_result`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_ai_analysis_result_request_id` (`request_id`),
  ADD KEY `idx_ai_analysis_result_risk_level` (`risk_level`),
  ADD KEY `idx_ai_analysis_result_reviewed_by_doctor_id` (`reviewed_by_doctor_id`);

--
-- Indexes for table `appointment`
--
ALTER TABLE `appointment`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `appointment_code` (`appointment_code`),
  ADD KEY `fk_appointment_created_by` (`created_by`),
  ADD KEY `idx_appointment_patient_id` (`patient_id`),
  ADD KEY `idx_appointment_doctor_id` (`doctor_id`),
  ADD KEY `idx_appointment_specialty_id` (`specialty_id`),
  ADD KEY `idx_appointment_branch_id` (`branch_id`),
  ADD KEY `idx_appointment_date` (`appointment_date`),
  ADD KEY `idx_appointment_status` (`status`),
  ADD KEY `idx_appointment_start_time` (`start_time`);

--
-- Indexes for table `audit_log`
--
ALTER TABLE `audit_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_audit_log_user_id` (`user_id`),
  ADD KEY `idx_audit_log_action` (`action`),
  ADD KEY `idx_audit_log_module_name` (`module_name`),
  ADD KEY `idx_audit_log_entity` (`entity_type`,`entity_id`),
  ADD KEY `idx_audit_log_created_at` (`created_at`);

--
-- Indexes for table `consultation`
--
ALTER TABLE `consultation`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_consultation_patient_id` (`patient_id`),
  ADD KEY `idx_consultation_doctor_id` (`doctor_id`),
  ADD KEY `idx_consultation_status` (`status`),
  ADD KEY `idx_consultation_priority` (`priority`),
  ADD KEY `idx_consultation_created_at` (`created_at`),
  ADD KEY `fk_consultation_appointment` (`appointment_id`);

--
-- Indexes for table `consultation_image`
--
ALTER TABLE `consultation_image`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_consultation_image_uploaded_by` (`uploaded_by`),
  ADD KEY `idx_consultation_image_consultation_id` (`consultation_id`),
  ADD KEY `idx_consultation_image_type` (`image_type`);

--
-- Indexes for table `consultation_response`
--
ALTER TABLE `consultation_response`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_consultation_response_consultation_id` (`consultation_id`),
  ADD KEY `idx_consultation_response_responder_user_id` (`responder_user_id`),
  ADD KEY `idx_consultation_response_type` (`response_type`);

--
-- Indexes for table `doctor`
--
ALTER TABLE `doctor`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `doctor_code` (`doctor_code`),
  ADD UNIQUE KEY `uk_license_number` (`license_number`),
  ADD KEY `fk_doctor_user` (`user_id`),
  ADD KEY `idx_doctor_specialty_id` (`specialty_id`),
  ADD KEY `idx_doctor_full_name` (`full_name`),
  ADD KEY `idx_doctor_status` (`status`),
  ADD KEY `idx_doctor_license_number` (`license_number`),
  ADD KEY `idx_doctor_code` (`doctor_code`);

--
-- Indexes for table `notification`
--
ALTER TABLE `notification`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notification_user_id` (`user_id`),
  ADD KEY `idx_notification_type` (`notification_type`),
  ADD KEY `idx_notification_is_read` (`is_read`),
  ADD KEY `idx_notification_reference` (`reference_type`,`reference_id`);

--
-- Indexes for table `patient`
--
ALTER TABLE `patient`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `patient_code` (`patient_code`),
  ADD KEY `fk_patient_user` (`user_id`),
  ADD KEY `idx_patient_full_name` (`full_name`),
  ADD KEY `idx_patient_phone` (`phone`),
  ADD KEY `idx_patient_email` (`email`),
  ADD KEY `idx_patient_status` (`status`);

--
-- Indexes for table `permission`
--
ALTER TABLE `permission`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_permission_module` (`module_name`),
  ADD KEY `idx_permission_status` (`status`);

--
-- Indexes for table `review`
--
ALTER TABLE `review`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_review_patient_id` (`patient_id`),
  ADD KEY `idx_review_doctor_id` (`doctor_id`),
  ADD KEY `idx_review_appointment_id` (`appointment_id`),
  ADD KEY `idx_review_status` (`status`),
  ADD KEY `idx_review_rating` (`rating`);

--
-- Indexes for table `role`
--
ALTER TABLE `role`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_role_status` (`status`);

--
-- Indexes for table `role_permission`
--
ALTER TABLE `role_permission`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_role_permission` (`role_id`,`permission_id`),
  ADD KEY `fk_role_permission_granted_by` (`granted_by`),
  ADD KEY `idx_role_permission_permission_id` (`permission_id`);

--
-- Indexes for table `specialty`
--
ALTER TABLE `specialty`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_user_full_name` (`full_name`),
  ADD KEY `idx_user_phone` (`phone`),
  ADD KEY `idx_user_status` (`status`);

--
-- Indexes for table `user_role`
--
ALTER TABLE `user_role`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_user_role` (`user_id`,`role_id`),
  ADD KEY `fk_user_role_assigned_by` (`assigned_by`),
  ADD KEY `idx_user_role_role_id` (`role_id`);

--
-- Indexes for table `video_consultation_session`
--
ALTER TABLE `video_consultation_session`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `room_code` (`room_code`),
  ADD KEY `idx_video_session_appointment_id` (`appointment_id`),
  ADD KEY `idx_video_session_consultation_id` (`consultation_id`),
  ADD KEY `idx_video_session_status` (`status`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `ai_analysis_request`
--
ALTER TABLE `ai_analysis_request`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ai_analysis_result`
--
ALTER TABLE `ai_analysis_result`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `appointment`
--
ALTER TABLE `appointment`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `audit_log`
--
ALTER TABLE `audit_log`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `consultation`
--
ALTER TABLE `consultation`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `consultation_image`
--
ALTER TABLE `consultation_image`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `consultation_response`
--
ALTER TABLE `consultation_response`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `doctor`
--
ALTER TABLE `doctor`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `notification`
--
ALTER TABLE `notification`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `patient`
--
ALTER TABLE `patient`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `permission`
--
ALTER TABLE `permission`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `review`
--
ALTER TABLE `review`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `role`
--
ALTER TABLE `role`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `role_permission`
--
ALTER TABLE `role_permission`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=58;

--
-- AUTO_INCREMENT for table `specialty`
--
ALTER TABLE `specialty`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `user_role`
--
ALTER TABLE `user_role`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `video_consultation_session`
--
ALTER TABLE `video_consultation_session`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `ai_analysis_request`
--
ALTER TABLE `ai_analysis_request`
  ADD CONSTRAINT `fk_ai_analysis_request_consultation` FOREIGN KEY (`consultation_id`) REFERENCES `consultation` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ai_analysis_request_consultation_image` FOREIGN KEY (`consultation_image_id`) REFERENCES `consultation_image` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ai_analysis_request_requested_by` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `ai_analysis_result`
--
ALTER TABLE `ai_analysis_result`
  ADD CONSTRAINT `fk_ai_analysis_result_request` FOREIGN KEY (`request_id`) REFERENCES `ai_analysis_request` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ai_analysis_result_reviewed_by_doctor` FOREIGN KEY (`reviewed_by_doctor_id`) REFERENCES `doctor` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `appointment`
--
ALTER TABLE `appointment`
  ADD CONSTRAINT `fk_appointment_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_appointment_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctor` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_appointment_patient` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_appointment_branch` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_appointment_specialty` FOREIGN KEY (`specialty_id`) REFERENCES `specialty` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `audit_log`
--
ALTER TABLE `audit_log`
  ADD CONSTRAINT `fk_audit_log_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `consultation`
--
ALTER TABLE `consultation`
  ADD CONSTRAINT `fk_consultation_appointment` FOREIGN KEY (`appointment_id`) REFERENCES `appointment` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_consultation_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctor` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_consultation_patient` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `consultation_image`
--
ALTER TABLE `consultation_image`
  ADD CONSTRAINT `fk_consultation_image_consultation` FOREIGN KEY (`consultation_id`) REFERENCES `consultation` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_consultation_image_uploaded_by` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `consultation_response`
--
ALTER TABLE `consultation_response`
  ADD CONSTRAINT `fk_consultation_response_consultation` FOREIGN KEY (`consultation_id`) REFERENCES `consultation` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_consultation_response_responder` FOREIGN KEY (`responder_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `doctor`
--
ALTER TABLE `doctor`
  ADD CONSTRAINT `fk_doctor_specialty` FOREIGN KEY (`specialty_id`) REFERENCES `specialty` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_doctor_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `notification`
--
ALTER TABLE `notification`
  ADD CONSTRAINT `fk_notification_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `patient`
--
ALTER TABLE `patient`
  ADD CONSTRAINT `fk_patient_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `review`
--
ALTER TABLE `review`
  ADD CONSTRAINT `fk_review_appointment` FOREIGN KEY (`appointment_id`) REFERENCES `appointment` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_review_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctor` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_review_patient` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `role_permission`
--
ALTER TABLE `role_permission`
  ADD CONSTRAINT `fk_role_permission_granted_by` FOREIGN KEY (`granted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_role_permission_permission` FOREIGN KEY (`permission_id`) REFERENCES `permission` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_role_permission_role` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `user_role`
--
ALTER TABLE `user_role`
  ADD CONSTRAINT `fk_user_role_assigned_by` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_user_role_role` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_user_role_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `video_consultation_session`
--
ALTER TABLE `video_consultation_session`
  ADD CONSTRAINT `fk_video_session_appointment` FOREIGN KEY (`appointment_id`) REFERENCES `appointment` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_video_session_consultation` FOREIGN KEY (`consultation_id`) REFERENCES `consultation` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
