-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: mysql
-- Generation Time: Apr 03, 2026 at 07:02 AM
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
  `doctor_review_status` enum('pending_review','approved','approved_watch','not_standard','revoked') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending_review',
  `shared_with_patient` tinyint(1) NOT NULL DEFAULT '0',
  `review_note` text COLLATE utf8mb4_unicode_ci,
  `reviewed_at` datetime DEFAULT NULL,
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

--
-- Dumping data for table `appointment`
--

-- Operational rows removed from public history.


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
-- Table structure for table `branch`
--

CREATE TABLE `branch` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner_user_id` bigint UNSIGNED DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `branch`
--

-- Operational rows removed from public history.


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

--
-- Dumping data for table `consultation`
--

-- Operational rows removed from public history.


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

--
-- Dumping data for table `consultation_image`
--

-- Operational rows removed from public history.


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

--
-- Dumping data for table `consultation_response`
--

-- Operational rows removed from public history.


-- --------------------------------------------------------

--
-- Table structure for table `doctor`
--

CREATE TABLE `doctor` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED DEFAULT NULL,
  `created_by_user_id` bigint UNSIGNED DEFAULT NULL,
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

-- Operational rows removed from public history.


-- --------------------------------------------------------

--
-- Table structure for table `doctor_branch`
--

CREATE TABLE `doctor_branch` (
  `id` bigint UNSIGNED NOT NULL,
  `doctor_id` bigint UNSIGNED NOT NULL,
  `branch_id` bigint UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `doctor_branch`
--

-- Operational rows removed from public history.


-- --------------------------------------------------------

--
-- Table structure for table `doctor_invite`
--

CREATE TABLE `doctor_invite` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `doctor_id` bigint UNSIGNED NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token_hash` char(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `created_by_user_id` bigint UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `doctor_schedule`
--

CREATE TABLE `doctor_schedule` (
  `id` bigint UNSIGNED NOT NULL,
  `doctor_id` bigint UNSIGNED NOT NULL,
  `work_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `slot_duration` int NOT NULL DEFAULT '30',
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `doctor_schedule`
--

-- Operational rows removed from public history.


-- --------------------------------------------------------

--
-- Table structure for table `holora_mind_chats`
--

CREATE TABLE `holora_mind_chats` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'Cuộc trò chuyện mới',
  `model_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'HoloraMind-v1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `holora_mind_chats`
--

-- Operational rows removed from public history.


-- --------------------------------------------------------

--
-- Table structure for table `holora_mind_messages`
--

CREATE TABLE `holora_mind_messages` (
  `id` bigint UNSIGNED NOT NULL,
  `chat_id` bigint UNSIGNED NOT NULL,
  `role` enum('user','assistant') COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `holora_mind_messages`
--

-- Operational rows removed from public history.


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

-- Operational rows removed from public history.


-- --------------------------------------------------------

--
-- Table structure for table `payment_order`
--

CREATE TABLE `payment_order` (
  `id` int UNSIGNED NOT NULL,
  `user_id` int UNSIGNED NOT NULL,
  `plan_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `scope_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'account',
  `months` tinyint UNSIGNED NOT NULL DEFAULT '1',
  `amount_cents` int UNSIGNED NOT NULL,
  `currency` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'VND',
  `payment_method` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','paid','failed','expired') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payment_order`
--

-- Operational rows removed from public history.


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
(1, 'Manage Users', 'user.manage', 'user', 'Toàn quyền quản lý người dùng', 'active', '2026-03-28 09:52:25', '2026-04-03 02:11:42'),
(2, 'Manage Roles', 'role.manage', 'rbac', 'Toàn quyền quản lý vai trò', 'active', '2026-03-28 09:52:25', '2026-04-03 02:11:42'),
(3, 'Manage Permissions', 'permission.manage', 'rbac', 'Toàn quyền quản lý phân quyền', 'active', '2026-03-28 09:52:25', '2026-04-03 02:11:42'),
(4, 'Manage Patients', 'patient.manage', 'patient', 'Toàn quyền quản lý bệnh nhân', 'active', '2026-03-28 09:52:25', '2026-04-03 02:11:42'),
(5, 'Manage Doctors', 'doctor.manage', 'doctor', 'Toàn quyền quản lý bác sĩ', 'active', '2026-03-28 09:52:25', '2026-04-03 02:11:42'),
(6, 'Manage Consultations', 'consultation.manage', 'consultation', 'Toàn quyền quản lý ca tư vấn', 'active', '2026-03-28 09:52:25', '2026-04-03 02:11:42'),
(7, 'Manage AI Analysis', 'ai.manage', 'ai', 'Toàn quyền quản lý phân tích AI', 'active', '2026-03-28 09:52:25', '2026-04-03 02:11:42'),
(8, 'Manage Appointments', 'appointment.manage', 'appointment', 'Toàn quyền quản lý lịch hẹn', 'active', '2026-03-28 09:52:25', '2026-04-03 02:11:42'),
(9, 'Manage Video Sessions', 'video.manage', 'video', 'Quản lý phiên tư vấn video', 'active', '2026-03-28 09:52:25', '2026-03-28 09:52:25'),
(10, 'Manage Reviews', 'review.manage', 'review', 'Quản lý đánh giá', 'active', '2026-03-28 09:52:25', '2026-03-28 09:52:25'),
(11, 'Manage Notifications', 'notification.manage', 'notification', 'Quản lý thông báo', 'active', '2026-03-28 09:52:25', '2026-03-28 09:52:25'),
(12, 'View Audit Logs', 'audit.view', 'audit', 'Xem nhật ký hệ thống', 'active', '2026-03-28 09:52:25', '2026-03-28 09:52:25'),
(13, 'Access Dashboard', 'dashboard.access', 'dashboard', 'Truy cập bảng điều khiển tổng quan', 'active', '2026-03-28 14:55:40', '2026-04-03 02:11:42'),
(14, 'View Users', 'user.view', 'user', 'Xem danh sách và thông tin người dùng', 'active', '2026-03-28 14:55:40', '2026-04-03 02:11:42'),
(15, 'Create User', 'user.create', 'user', 'Tạo tài khoản người dùng mới', 'active', '2026-03-28 14:55:40', '2026-04-03 02:11:42'),
(16, 'Update User', 'user.update', 'user', 'Cập nhật thông tin người dùng', 'active', '2026-03-28 14:55:40', '2026-04-03 02:11:42'),
(17, 'Delete User', 'user.delete', 'user', 'Xóa tài khoản người dùng', 'active', '2026-03-28 14:55:40', '2026-04-03 02:11:42'),
(18, 'View Patients', 'patient.view', 'patient', 'Xem danh sách và hồ sơ bệnh nhân', 'active', '2026-03-28 14:55:40', '2026-04-03 02:11:42'),
(19, 'Create Patient', 'patient.create', 'patient', 'Thêm hồ sơ bệnh nhân mới', 'active', '2026-03-28 14:55:40', '2026-04-03 02:11:42'),
(20, 'Update Patient', 'patient.update', 'patient', 'Cập nhật hồ sơ bệnh nhân', 'active', '2026-03-28 14:55:40', '2026-04-03 02:11:42'),
(21, 'View Appointments', 'appointment.view', 'appointment', 'Xem lịch hẹn của mình', 'active', '2026-03-28 14:55:40', '2026-04-03 02:11:42'),
(22, 'Create Appointment', 'appointment.create', 'appointment', 'Đặt lịch hẹn mới', 'active', '2026-03-28 14:55:40', '2026-04-03 02:11:42'),
(23, 'Update Appointment Status', 'appointment.update', 'appointment', 'Cập nhật trạng thái lịch hẹn', 'active', '2026-03-28 14:55:40', '2026-04-03 02:11:42'),
(24, 'View Consultations', 'consultation.view', 'consultation', 'Xem ca tư vấn của mình', 'active', '2026-03-28 14:55:40', '2026-04-03 02:11:42'),
(25, 'Respond to Consultation', 'consultation.respond', 'consultation', 'Phản hồi / chẩn đoán ca tư vấn', 'active', '2026-03-28 14:55:40', '2026-04-03 02:11:42'),
(26, 'View Analytics', 'dashboard.analytics', 'dashboard', 'Xem báo cáo thống kê phân tích', 'active', '2026-04-03 02:11:42', '2026-04-03 02:11:42'),
(27, 'Assign Role to User', 'user.assign_role', 'user', 'Gán hoặc gỡ vai trò khỏi người dùng', 'active', '2026-04-03 02:11:42', '2026-04-03 02:11:42'),
(28, 'View Roles', 'role.view', 'rbac', 'Xem danh sách vai trò', 'active', '2026-04-03 02:11:42', '2026-04-03 02:11:42'),
(29, 'Create Role', 'role.create', 'rbac', 'Tạo vai trò mới', 'active', '2026-04-03 02:11:42', '2026-04-03 02:11:42'),
(30, 'Update Role', 'role.update', 'rbac', 'Cập nhật vai trò', 'active', '2026-04-03 02:11:42', '2026-04-03 02:11:42'),
(31, 'Delete Role', 'role.delete', 'rbac', 'Xóa vai trò', 'active', '2026-04-03 02:11:42', '2026-04-03 02:11:42'),
(32, 'View Permissions', 'permission.view', 'rbac', 'Xem danh sách phân quyền', 'active', '2026-04-03 02:11:42', '2026-04-03 02:11:42'),
(33, 'Create Permission', 'permission.create', 'rbac', 'Tạo phân quyền mới', 'active', '2026-04-03 02:11:42', '2026-04-03 02:11:42'),
(34, 'Update Permission', 'permission.update', 'rbac', 'Cập nhật phân quyền', 'active', '2026-04-03 02:11:42', '2026-04-03 02:11:42'),
(35, 'Delete Permission', 'permission.delete', 'rbac', 'Xóa phân quyền', 'active', '2026-04-03 02:11:42', '2026-04-03 02:11:42'),
(36, 'Delete Patient', 'patient.delete', 'patient', 'Xóa hồ sơ bệnh nhân', 'active', '2026-04-03 02:11:42', '2026-04-03 02:11:42'),
(37, 'View Doctors', 'doctor.view', 'doctor', 'Xem danh sách và hồ sơ bác sĩ', 'active', '2026-04-03 02:11:42', '2026-04-03 02:11:42'),
(38, 'Create Doctor', 'doctor.create', 'doctor', 'Thêm hồ sơ bác sĩ mới', 'active', '2026-04-03 02:11:42', '2026-04-03 02:11:42'),
(39, 'Update Doctor', 'doctor.update', 'doctor', 'Cập nhật hồ sơ bác sĩ', 'active', '2026-04-03 02:11:42', '2026-04-03 02:11:42'),
(40, 'Delete Doctor', 'doctor.delete', 'doctor', 'Xóa hồ sơ bác sĩ', 'active', '2026-04-03 02:11:42', '2026-04-03 02:11:42'),
(41, 'Manage Branches', 'branch.manage', 'branch', 'Toàn quyền quản lý chi nhánh', 'active', '2026-04-03 02:11:42', '2026-04-03 02:11:42'),
(42, 'View Branches', 'branch.view', 'branch', 'Xem danh sách và thông tin chi nhánh', 'active', '2026-04-03 02:11:42', '2026-04-03 02:11:42'),
(43, 'Create Branch', 'branch.create', 'branch', 'Thêm chi nhánh mới', 'active', '2026-04-03 02:11:42', '2026-04-03 02:11:42'),
(44, 'Update Branch', 'branch.update', 'branch', 'Cập nhật thông tin chi nhánh', 'active', '2026-04-03 02:11:42', '2026-04-03 02:11:42'),
(45, 'Delete Branch', 'branch.delete', 'branch', 'Xóa chi nhánh', 'active', '2026-04-03 02:11:42', '2026-04-03 02:11:42'),
(46, 'View All Appointments', 'appointment.admin', 'appointment', 'Xem tất cả lịch hẹn trong hệ thống (admin)', 'active', '2026-04-03 02:11:42', '2026-04-03 02:11:42'),
(47, 'Delete Appointment', 'appointment.delete', 'appointment', 'Hủy / xóa lịch hẹn', 'active', '2026-04-03 02:11:42', '2026-04-03 02:11:42'),
(48, 'Create Consultation', 'consultation.create', 'consultation', 'Gửi yêu cầu tư vấn mới', 'active', '2026-04-03 02:11:42', '2026-04-03 02:11:42'),
(49, 'Reopen Consultation', 'consultation.reopen', 'consultation', 'Mở lại ca tư vấn đã hoàn thành', 'active', '2026-04-03 02:11:42', '2026-04-03 02:11:42'),
(50, 'View Schedules', 'schedule.view', 'schedule', 'Xem lịch làm việc của bác sĩ', 'active', '2026-04-03 02:11:42', '2026-04-03 02:11:42'),
(51, 'Create Schedule', 'schedule.create', 'schedule', 'Tạo ca làm việc mới', 'active', '2026-04-03 02:11:42', '2026-04-03 02:11:42'),
(52, 'Update Schedule', 'schedule.update', 'schedule', 'Cập nhật ca làm việc', 'active', '2026-04-03 02:11:42', '2026-04-03 02:11:42'),
(53, 'Delete Schedule', 'schedule.delete', 'schedule', 'Xóa ca làm việc', 'active', '2026-04-03 02:11:42', '2026-04-03 02:11:42'),
(54, 'View Specialties', 'specialty.view', 'specialty', 'Xem danh mục chuyên khoa', 'active', '2026-04-03 02:11:42', '2026-04-03 02:11:42'),
(55, 'Create Specialty', 'specialty.create', 'specialty', 'Thêm chuyên khoa mới', 'active', '2026-04-03 02:11:42', '2026-04-03 02:11:42'),
(56, 'Update Specialty', 'specialty.update', 'specialty', 'Cập nhật chuyên khoa', 'active', '2026-04-03 02:11:42', '2026-04-03 02:11:42'),
(57, 'Delete Specialty', 'specialty.delete', 'specialty', 'Xóa chuyên khoa', 'active', '2026-04-03 02:11:42', '2026-04-03 02:11:42'),
(58, 'Request AI Analysis', 'ai.analyze', 'ai', 'Gửi yêu cầu AI phân tích ảnh ca khám', 'active', '2026-04-03 02:11:42', '2026-04-03 02:11:42'),
(59, 'View AI Results', 'ai.view', 'ai', 'Xem kết quả phân tích AI', 'active', '2026-04-03 02:11:42', '2026-04-03 02:11:42'),
(60, 'Review AI Results', 'ai.review', 'ai', 'Bác sĩ đánh giá và kiểm soát kết quả AI', 'active', '2026-04-03 02:11:42', '2026-04-03 02:11:42'),
(61, 'View Subscriptions', 'subscription.view', 'subscription', 'Xem gói dịch vụ và trạng thái đăng ký', 'active', '2026-04-03 02:11:42', '2026-04-03 02:11:42'),
(62, 'Activate Subscription', 'subscription.activate', 'subscription', 'Kích hoạt gói dịch vụ', 'active', '2026-04-03 02:11:42', '2026-04-03 02:11:42'),
(63, 'Manage Subscriptions', 'subscription.manage', 'subscription', 'Quản lý thanh toán và xác nhận đăng ký', 'active', '2026-04-03 02:11:42', '2026-04-03 02:11:42'),
(64, 'Upload Files', 'upload.file', 'upload', 'Tải ảnh / tệp đính kèm lên hệ thống', 'active', '2026-04-03 02:11:42', '2026-04-03 02:11:42');

-- --------------------------------------------------------

--
-- Table structure for table `provider_subscription`
--

CREATE TABLE `provider_subscription` (
  `id` bigint UNSIGNED NOT NULL,
  `plan_id` bigint UNSIGNED NOT NULL,
  `scope_type` enum('doctor','branch','account') COLLATE utf8mb4_unicode_ci NOT NULL,
  `scope_id` bigint UNSIGNED NOT NULL,
  `owner_user_id` bigint UNSIGNED NOT NULL,
  `status` enum('trialing','active','past_due','cancelled','expired') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'trialing',
  `starts_at` datetime NOT NULL,
  `ends_at` datetime DEFAULT NULL,
  `trial_ends_at` datetime DEFAULT NULL,
  `auto_renew` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `provider_subscription`
--

-- Operational rows removed from public history.


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
(4, 'Patient', 'patient', 'Bệnh nhân', 1, 'active', '2026-03-28 09:52:25', '2026-03-28 09:52:25'),
(5, 'Clinic Owner', 'clinic_owner', 'Owner of clinic/provider account', 0, 'active', '2026-03-30 04:20:47', '2026-03-30 04:20:47'),
(6, 'Branch Manager', 'branch_manager', 'Manager of a specific branch', 0, 'active', '2026-03-30 04:20:47', '2026-03-30 04:20:47');

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
  `parent_id` bigint UNSIGNED DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `doctor_count` int UNSIGNED DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `specialty`
--

INSERT INTO `specialty` (`id`, `name`, `code`, `parent_id`, `description`, `status`, `created_at`, `updated_at`, `deleted_at`, `doctor_count`) VALUES
(1, 'Răng Hàm Mặt', 'S000001', NULL, 'Răng Hàm Mặt', 'active', '2026-03-29 05:33:04', '2026-03-30 07:09:56', NULL, 0),
(2, 'Nội khoa', 'INTERNAL_MEDICINE', NULL, 'Điều trị bệnh bằng thuốc', 'active', '2026-03-30 07:08:37', '2026-03-30 07:16:17', NULL, 0),
(3, 'Ngoại khoa', 'SURGERY', NULL, 'Điều trị bệnh bằng phẫu thuật', 'active', '2026-03-30 07:08:57', '2026-03-30 07:16:17', NULL, 0),
(4, 'Sản phụ khoa', 'S000004', NULL, 'Sản phụ khoa', 'active', '2026-03-30 07:09:16', '2026-03-30 07:09:16', NULL, 0),
(5, 'Nhi khoa', 'S000005', NULL, 'Nhi khoa', 'active', '2026-03-30 07:09:37', '2026-03-30 07:09:37', NULL, 0),
(6, 'Y tế công cộng/Y học dự phòng', 'S000006', NULL, 'Y tế công cộng/Y học dự phòng', 'active', '2026-03-30 07:10:14', '2026-03-30 07:10:14', NULL, 0),
(7, 'Dược học', 'S000007', NULL, 'Dược học', 'active', '2026-03-30 07:10:31', '2026-03-30 07:10:31', NULL, 0),
(8, 'Điều dưỡng/Hộ sinh', 'S000008', NULL, 'Điều dưỡng/Hộ sinh', 'active', '2026-03-30 07:10:46', '2026-03-30 07:10:46', NULL, 0),
(9, 'Chuyên khoa giác quan/da', 'S000009', NULL, 'Chuyên khoa giác quan/da', 'active', '2026-03-30 07:11:10', '2026-03-30 07:11:10', NULL, 0),
(10, 'Chuyên khoa chức năng/hỗ trợ', 'S000010', NULL, 'Chuyên khoa chức năng/hỗ trợ', 'active', '2026-03-30 07:11:29', '2026-03-30 07:11:29', NULL, 0),
(11, 'Chuyên khoa đặc thù', 'S000011', NULL, 'Chuyên khoa đặc thù', 'active', '2026-03-30 07:11:44', '2026-03-30 07:11:44', NULL, 0),
(13, 'Tim mạch', 'CARDIOLOGY', 2, NULL, 'active', '2026-03-30 07:16:17', '2026-03-30 07:16:17', NULL, 0),
(14, 'Tiêu hóa', 'GASTROENTEROLOGY', 2, NULL, 'active', '2026-03-30 07:16:17', '2026-03-30 07:16:17', NULL, 0),
(15, 'Hô hấp', 'RESPIRATORY', 2, NULL, 'active', '2026-03-30 07:16:17', '2026-03-30 07:16:17', NULL, 0),
(16, 'Nội tiết', 'ENDOCRINOLOGY', 2, NULL, 'active', '2026-03-30 07:16:17', '2026-03-30 07:16:17', NULL, 0),
(17, 'Thận - Tiết niệu', 'NEPHRO_UROLOGY', 2, NULL, 'active', '2026-03-30 07:16:17', '2026-03-30 07:16:17', NULL, 0),
(18, 'Xương khớp', 'RHEUMATOLOGY', 2, NULL, 'active', '2026-03-30 07:16:17', '2026-03-30 07:16:17', NULL, 0),
(19, 'Huyết học', 'HEMATOLOGY', 2, NULL, 'active', '2026-03-30 07:16:17', '2026-03-30 07:16:17', NULL, 0),
(20, 'Truyền nhiễm/Nhiệt đới', 'INFECTIOUS_DISEASE', 2, NULL, 'active', '2026-03-30 07:16:17', '2026-03-30 07:16:17', NULL, 0),
(21, 'Ngoại tổng quát', 'GENERAL_SURGERY', 3, NULL, 'active', '2026-03-30 07:16:17', '2026-03-30 07:16:17', NULL, 0),
(22, 'Ngoại thần kinh', 'NEUROSURGERY', 3, NULL, 'active', '2026-03-30 07:16:17', '2026-03-30 07:16:17', NULL, 0),
(23, 'Ngoại lồng ngực', 'THORACIC_SURGERY', 3, NULL, 'active', '2026-03-30 07:16:17', '2026-03-30 07:16:17', NULL, 0),
(24, 'Chấn thương chỉnh hình', 'ORTHOPEDIC_TRAUMA', 3, NULL, 'active', '2026-03-30 07:16:17', '2026-03-30 07:16:17', NULL, 0),
(25, 'Ngoại nhi', 'PEDIATRIC_SURGERY', 3, NULL, 'active', '2026-03-30 07:16:17', '2026-03-30 07:16:17', NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `subscription_entitlement`
--

CREATE TABLE `subscription_entitlement` (
  `id` bigint UNSIGNED NOT NULL,
  `plan_id` bigint UNSIGNED NOT NULL,
  `feature_code` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `limit_value` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subscription_entitlement`
--

INSERT INTO `subscription_entitlement` (`id`, `plan_id`, `feature_code`, `is_enabled`, `limit_value`, `created_at`, `updated_at`) VALUES
(1, 4, 'branch.manage', 1, NULL, '2026-03-30 03:24:55', '2026-03-30 08:24:44'),
(2, 3, 'branch.manage', 1, NULL, '2026-03-30 03:24:55', '2026-03-30 08:24:44'),
(3, 2, 'branch.manage', 1, NULL, '2026-03-30 03:24:55', '2026-03-30 08:24:44'),
(4, 1, 'branch.manage', 1, NULL, '2026-03-30 03:24:55', '2026-03-30 08:24:44'),
(8, 4, 'doctor.manage', 1, NULL, '2026-03-30 03:24:55', '2026-03-30 08:24:44'),
(9, 3, 'doctor.manage', 1, NULL, '2026-03-30 03:24:55', '2026-03-30 08:24:44'),
(10, 2, 'doctor.manage', 1, 3, '2026-03-30 03:24:55', '2026-03-30 08:24:44'),
(11, 1, 'doctor.manage', 1, 1, '2026-03-30 03:24:55', '2026-03-30 08:24:44'),
(15, 4, 'appointment.receive', 1, NULL, '2026-03-30 03:24:55', '2026-03-30 08:24:44'),
(16, 3, 'appointment.receive', 1, NULL, '2026-03-30 03:24:55', '2026-03-30 08:24:44'),
(17, 2, 'appointment.receive', 1, NULL, '2026-03-30 03:24:55', '2026-03-30 08:24:44'),
(18, 1, 'appointment.receive', 1, NULL, '2026-03-30 03:24:55', '2026-03-30 08:24:44'),
(25, 9, 'branch.manage', 1, 3, '2026-03-30 09:04:45', '2026-03-30 09:04:45'),
(26, 9, 'doctor.manage', 1, 3, '2026-03-30 09:04:45', '2026-03-30 09:04:45'),
(27, 10, 'branch.manage', 1, NULL, '2026-03-30 09:04:45', '2026-03-30 09:04:45'),
(28, 10, 'doctor.manage', 1, NULL, '2026-03-30 09:04:45', '2026-03-30 09:04:45');

-- --------------------------------------------------------

--
-- Table structure for table `subscription_plan`
--

CREATE TABLE `subscription_plan` (
  `id` bigint UNSIGNED NOT NULL,
  `code` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `scope_type` enum('doctor','branch','account') COLLATE utf8mb4_unicode_ci NOT NULL,
  `billing_cycle` enum('monthly','yearly') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'monthly',
  `price_cents` int UNSIGNED NOT NULL DEFAULT '0',
  `currency` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'VND',
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subscription_plan`
--

INSERT INTO `subscription_plan` (`id`, `code`, `name`, `scope_type`, `billing_cycle`, `price_cents`, `currency`, `status`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'DOCTOR_TRIAL_14D', 'Doctor Trial 14 Days', 'doctor', 'monthly', 0, 'VND', 'active', '2026-03-30 03:24:55', '2026-03-30 08:24:44', NULL),
(2, 'DOCTOR_PRO_MONTHLY', 'Doctor Pro Monthly', 'doctor', 'monthly', 299000, 'VND', 'active', '2026-03-30 03:24:55', '2026-03-30 08:24:44', NULL),
(3, 'BRANCH_TRIAL_30D', 'Branch Trial 30 Days', 'branch', 'monthly', 0, 'VND', 'active', '2026-03-30 03:24:55', '2026-03-30 08:24:44', NULL),
(4, 'BRANCH_GROWTH_MONTHLY', 'Branch Growth Monthly', 'branch', 'monthly', 999000, 'VND', 'active', '2026-03-30 03:24:55', '2026-03-30 08:24:44', NULL),
(9, 'HOLORA_FREE', 'Holora Free', 'account', 'monthly', 0, 'VND', 'active', '2026-03-30 09:04:45', '2026-03-30 09:04:45', NULL),
(10, 'HOLORA_PLUS', 'Holora Plus', 'account', 'monthly', 299000, 'VND', 'active', '2026-03-30 09:04:45', '2026-03-30 09:04:45', NULL);

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
  `reset_password_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reset_password_expires` datetime DEFAULT NULL,
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

-- Operational rows removed from public history.


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

-- Operational rows removed from public history.


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
  ADD KEY `idx_appointment_date` (`appointment_date`),
  ADD KEY `idx_appointment_status` (`status`),
  ADD KEY `idx_appointment_start_time` (`start_time`),
  ADD KEY `idx_appointment_branch_id` (`branch_id`);

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
-- Indexes for table `branch`
--
ALTER TABLE `branch`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_branch_code` (`code`),
  ADD KEY `idx_branch_status` (`status`),
  ADD KEY `idx_branch_deleted_at` (`deleted_at`),
  ADD KEY `idx_branch_owner_user` (`owner_user_id`);

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
  ADD UNIQUE KEY `uk_doctor_code` (`doctor_code`),
  ADD UNIQUE KEY `uk_license_number` (`license_number`),
  ADD KEY `fk_doctor_user` (`user_id`),
  ADD KEY `idx_doctor_specialty_id` (`specialty_id`),
  ADD KEY `idx_doctor_full_name` (`full_name`),
  ADD KEY `idx_doctor_status` (`status`),
  ADD KEY `idx_doctor_license_number` (`license_number`),
  ADD KEY `idx_doctor_code` (`doctor_code`),
  ADD KEY `idx_doctor_created_by_user` (`created_by_user_id`);

--
-- Indexes for table `doctor_branch`
--
ALTER TABLE `doctor_branch`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_doctor_branch` (`doctor_id`,`branch_id`),
  ADD KEY `idx_doctor_branch_doctor` (`doctor_id`),
  ADD KEY `idx_doctor_branch_branch` (`branch_id`),
  ADD KEY `idx_doctor_branch_deleted_at` (`deleted_at`);

--
-- Indexes for table `doctor_invite`
--
ALTER TABLE `doctor_invite`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_doctor_invite_token_hash` (`token_hash`),
  ADD KEY `idx_doctor_invite_user` (`user_id`),
  ADD KEY `idx_doctor_invite_doctor` (`doctor_id`),
  ADD KEY `idx_doctor_invite_email` (`email`),
  ADD KEY `idx_doctor_invite_expiry` (`expires_at`),
  ADD KEY `fk_doctor_invite_creator` (`created_by_user_id`);

--
-- Indexes for table `doctor_schedule`
--
ALTER TABLE `doctor_schedule`
  ADD PRIMARY KEY (`id`),
  ADD KEY `doctor_id` (`doctor_id`);

--
-- Indexes for table `holora_mind_chats`
--
ALTER TABLE `holora_mind_chats`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_holora_mind_chat_user` (`user_id`);

--
-- Indexes for table `holora_mind_messages`
--
ALTER TABLE `holora_mind_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_holora_mind_msg_chat` (`chat_id`);

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
  ADD UNIQUE KEY `uk_patient_code` (`patient_code`),
  ADD KEY `fk_patient_user` (`user_id`),
  ADD KEY `idx_patient_full_name` (`full_name`),
  ADD KEY `idx_patient_phone` (`phone`),
  ADD KEY `idx_patient_email` (`email`),
  ADD KEY `idx_patient_status` (`status`),
  ADD KEY `idx_patient_code` (`patient_code`);

--
-- Indexes for table `payment_order`
--
ALTER TABLE `payment_order`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_payment_token` (`token`),
  ADD KEY `idx_user_status` (`user_id`,`status`);

--
-- Indexes for table `permission`
--
ALTER TABLE `permission`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_permission_module` (`module_name`),
  ADD KEY `idx_permission_status` (`status`);

--
-- Indexes for table `provider_subscription`
--
ALTER TABLE `provider_subscription`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_provider_subscription_scope` (`scope_type`,`scope_id`),
  ADD KEY `idx_provider_subscription_owner` (`owner_user_id`),
  ADD KEY `idx_provider_subscription_status` (`status`),
  ADD KEY `idx_provider_subscription_deleted` (`deleted_at`),
  ADD KEY `fk_provider_subscription_plan` (`plan_id`);

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
  ADD UNIQUE KEY `code` (`code`),
  ADD UNIQUE KEY `uk_specialty_code` (`code`),
  ADD KEY `idx_specialty_code` (`code`),
  ADD KEY `idx_specialty_status` (`status`),
  ADD KEY `idx_specialty_deleted_at` (`deleted_at`),
  ADD KEY `idx_specialty_parent_id` (`parent_id`);

--
-- Indexes for table `subscription_entitlement`
--
ALTER TABLE `subscription_entitlement`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_plan_feature` (`plan_id`,`feature_code`),
  ADD KEY `idx_entitlement_feature` (`feature_code`);

--
-- Indexes for table `subscription_plan`
--
ALTER TABLE `subscription_plan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_subscription_plan_code` (`code`),
  ADD KEY `idx_subscription_plan_scope` (`scope_type`),
  ADD KEY `idx_subscription_plan_status` (`status`);

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
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `audit_log`
--
ALTER TABLE `audit_log`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `branch`
--
ALTER TABLE `branch`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `consultation`
--
ALTER TABLE `consultation`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `consultation_image`
--
ALTER TABLE `consultation_image`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `consultation_response`
--
ALTER TABLE `consultation_response`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `doctor`
--
ALTER TABLE `doctor`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `doctor_branch`
--
ALTER TABLE `doctor_branch`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `doctor_invite`
--
ALTER TABLE `doctor_invite`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `doctor_schedule`
--
ALTER TABLE `doctor_schedule`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `holora_mind_chats`
--
ALTER TABLE `holora_mind_chats`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `holora_mind_messages`
--
ALTER TABLE `holora_mind_messages`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `notification`
--
ALTER TABLE `notification`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `patient`
--
ALTER TABLE `patient`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `payment_order`
--
ALTER TABLE `payment_order`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `permission`
--
ALTER TABLE `permission`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=65;

--
-- AUTO_INCREMENT for table `provider_subscription`
--
ALTER TABLE `provider_subscription`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `review`
--
ALTER TABLE `review`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `role`
--
ALTER TABLE `role`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `role_permission`
--
ALTER TABLE `role_permission`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=58;

--
-- AUTO_INCREMENT for table `specialty`
--
ALTER TABLE `specialty`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `subscription_entitlement`
--
ALTER TABLE `subscription_entitlement`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `subscription_plan`
--
ALTER TABLE `subscription_plan`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `user_role`
--
ALTER TABLE `user_role`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

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
  ADD CONSTRAINT `fk_appointment_branch` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_appointment_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_appointment_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctor` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_appointment_patient` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_appointment_specialty` FOREIGN KEY (`specialty_id`) REFERENCES `specialty` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `audit_log`
--
ALTER TABLE `audit_log`
  ADD CONSTRAINT `fk_audit_log_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `branch`
--
ALTER TABLE `branch`
  ADD CONSTRAINT `fk_branch_owner_user` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

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
  ADD CONSTRAINT `fk_doctor_created_by_user` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_doctor_specialty` FOREIGN KEY (`specialty_id`) REFERENCES `specialty` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_doctor_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `doctor_branch`
--
ALTER TABLE `doctor_branch`
  ADD CONSTRAINT `fk_doctor_branch_branch` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_doctor_branch_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctor` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `doctor_invite`
--
ALTER TABLE `doctor_invite`
  ADD CONSTRAINT `fk_doctor_invite_creator` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_doctor_invite_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctor` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_doctor_invite_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `doctor_schedule`
--
ALTER TABLE `doctor_schedule`
  ADD CONSTRAINT `doctor_schedule_ibfk_1` FOREIGN KEY (`doctor_id`) REFERENCES `doctor` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `holora_mind_chats`
--
ALTER TABLE `holora_mind_chats`
  ADD CONSTRAINT `fk_holora_mind_chat_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `holora_mind_messages`
--
ALTER TABLE `holora_mind_messages`
  ADD CONSTRAINT `fk_holora_mind_msg_chat` FOREIGN KEY (`chat_id`) REFERENCES `holora_mind_chats` (`id`) ON DELETE CASCADE;

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
-- Constraints for table `provider_subscription`
--
ALTER TABLE `provider_subscription`
  ADD CONSTRAINT `fk_provider_subscription_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_provider_subscription_plan` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plan` (`id`);

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
-- Constraints for table `specialty`
--
ALTER TABLE `specialty`
  ADD CONSTRAINT `fk_specialty_parent` FOREIGN KEY (`parent_id`) REFERENCES `specialty` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `subscription_entitlement`
--
ALTER TABLE `subscription_entitlement`
  ADD CONSTRAINT `fk_entitlement_plan` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plan` (`id`) ON DELETE CASCADE;

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