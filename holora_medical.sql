-- MySQL dump 10.13  Distrib 8.0.45, for Linux (x86_64)
--
-- Host: localhost    Database: holora_medical
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `ai_analysis_request`
--

DROP TABLE IF EXISTS `ai_analysis_request`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_analysis_request` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `consultation_id` bigint unsigned NOT NULL,
  `consultation_image_id` bigint unsigned DEFAULT NULL,
  `requested_by` bigint unsigned DEFAULT NULL,
  `model_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `request_type` enum('image_analysis','symptom_analysis','risk_assessment','diagnosis_support') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `input_payload` json DEFAULT NULL,
  `status` enum('queued','processing','completed','failed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'queued',
  `requested_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` datetime DEFAULT NULL,
  `error_message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `fk_ai_analysis_request_consultation_image` (`consultation_image_id`),
  KEY `fk_ai_analysis_request_requested_by` (`requested_by`),
  KEY `idx_ai_analysis_request_consultation_id` (`consultation_id`),
  KEY `idx_ai_analysis_request_status` (`status`),
  KEY `idx_ai_analysis_request_model_name` (`model_name`),
  CONSTRAINT `fk_ai_analysis_request_consultation` FOREIGN KEY (`consultation_id`) REFERENCES `consultation` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ai_analysis_request_consultation_image` FOREIGN KEY (`consultation_image_id`) REFERENCES `consultation_image` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ai_analysis_request_requested_by` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ai_analysis_request`
--

LOCK TABLES `ai_analysis_request` WRITE;
/*!40000 ALTER TABLE `ai_analysis_request` DISABLE KEYS */;
/*!40000 ALTER TABLE `ai_analysis_request` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ai_analysis_result`
--

DROP TABLE IF EXISTS `ai_analysis_result`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_analysis_result` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `request_id` bigint unsigned NOT NULL,
  `result_summary` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `result_payload` json DEFAULT NULL,
  `confidence_score` decimal(5,2) DEFAULT NULL,
  `risk_level` enum('low','medium','high','critical') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recommendation` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `reviewed_by_doctor_id` bigint unsigned DEFAULT NULL,
  `doctor_review_status` enum('pending_review','approved','approved_watch','not_standard','revoked') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending_review',
  `shared_with_patient` tinyint(1) NOT NULL DEFAULT '0',
  `review_note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `reviewed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ai_analysis_result_request_id` (`request_id`),
  KEY `idx_ai_analysis_result_risk_level` (`risk_level`),
  KEY `idx_ai_analysis_result_reviewed_by_doctor_id` (`reviewed_by_doctor_id`),
  CONSTRAINT `fk_ai_analysis_result_request` FOREIGN KEY (`request_id`) REFERENCES `ai_analysis_request` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ai_analysis_result_reviewed_by_doctor` FOREIGN KEY (`reviewed_by_doctor_id`) REFERENCES `doctor` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ai_analysis_result`
--

LOCK TABLES `ai_analysis_result` WRITE;
/*!40000 ALTER TABLE `ai_analysis_result` DISABLE KEYS */;
/*!40000 ALTER TABLE `ai_analysis_result` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `appointment`
--

DROP TABLE IF EXISTS `appointment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appointment` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `patient_id` bigint unsigned NOT NULL,
  `doctor_id` bigint unsigned NOT NULL,
  `specialty_id` bigint unsigned DEFAULT NULL,
  `branch_id` bigint unsigned DEFAULT NULL,
  `recurring_id` bigint unsigned DEFAULT NULL,
  `appointment_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `appointment_date` date NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `appointment_type` enum('online','offline','video') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'online',
  `reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` enum('scheduled','confirmed','checked_in','in_progress','completed','cancelled','no_show') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'scheduled',
  `cancellation_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `fee` decimal(12,2) NOT NULL DEFAULT '0.00',
  `created_by` bigint unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `appointment_code` (`appointment_code`),
  KEY `fk_appointment_created_by` (`created_by`),
  KEY `idx_appointment_patient_id` (`patient_id`),
  KEY `idx_appointment_doctor_id` (`doctor_id`),
  KEY `idx_appointment_specialty_id` (`specialty_id`),
  KEY `idx_appointment_date` (`appointment_date`),
  KEY `idx_appointment_status` (`status`),
  KEY `idx_appointment_start_time` (`start_time`),
  KEY `idx_appointment_branch_id` (`branch_id`),
  KEY `idx_appointment_recurring_id` (`recurring_id`),
  CONSTRAINT `fk_appointment_branch` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_appointment_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_appointment_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctor` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_appointment_patient` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_appointment_recurring` FOREIGN KEY (`recurring_id`) REFERENCES `recurring_appointments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_appointment_specialty` FOREIGN KEY (`specialty_id`) REFERENCES `specialty` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointment`
--

LOCK TABLES `appointment` WRITE;
/*!40000 ALTER TABLE `appointment` DISABLE KEYS */;
INSERT INTO `appointment` VALUES (1,2,6,1,3,NULL,'APP61798061','2026-04-01','2026-04-01 08:30:00','2026-04-01 09:00:00','offline','Test','scheduled',NULL,0.00,NULL,'2026-03-31 12:56:38','2026-03-31 12:56:38'),(2,2,3,1,3,NULL,'APP32006031','2026-04-02','2026-04-02 19:30:00','2026-04-02 20:00:00','offline','Test','completed',NULL,0.00,NULL,'2026-04-02 12:13:26','2026-04-02 12:49:55'),(3,2,3,1,3,NULL,'APP33234937','2026-04-02','2026-04-02 18:00:00','2026-04-02 18:30:00','online','Kh?Ìm','scheduled',NULL,0.00,NULL,'2026-04-02 12:33:54','2026-04-02 12:33:54'),(4,2,3,1,3,NULL,'APP99643024','2026-04-03','2026-04-03 14:00:00','2026-04-03 14:30:00','online','Test','scheduled',NULL,0.00,NULL,'2026-04-03 07:00:43','2026-04-03 07:00:43');
/*!40000 ALTER TABLE `appointment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_log`
--

DROP TABLE IF EXISTS `audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_log` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned DEFAULT NULL,
  `action` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `module_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entity_id` bigint unsigned DEFAULT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_log_user_id` (`user_id`),
  KEY `idx_audit_log_action` (`action`),
  KEY `idx_audit_log_module_name` (`module_name`),
  KEY `idx_audit_log_entity` (`entity_type`,`entity_id`),
  KEY `idx_audit_log_created_at` (`created_at`),
  CONSTRAINT `fk_audit_log_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_log`
--

LOCK TABLES `audit_log` WRITE;
/*!40000 ALTER TABLE `audit_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` bigint unsigned DEFAULT NULL,
  `details` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_user` (`user_id`),
  KEY `idx_audit_action` (`action`),
  KEY `idx_audit_entity` (`entity_type`,`entity_id`),
  KEY `idx_audit_created` (`created_at`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,NULL,'AUTH_LOGOUT','user',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-04 05:32:31'),(2,NULL,'AUTH_LOGIN','user',15,'{\"email\": \"nguyentienlinh@holoramed.com\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-04 05:32:35'),(3,NULL,'AUTH_LOGOUT','user',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-04 05:32:54'),(4,NULL,'AUTH_LOGIN','user',4,'{\"email\": \"patient@holora.com\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-04 05:32:56'),(5,NULL,'AUTH_LOGOUT','user',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-04 12:27:21'),(6,NULL,'AUTH_LOGIN','user',15,'{\"email\": \"nguyentienlinh@holoramed.com\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-04 12:27:27'),(7,NULL,'AUTH_LOGOUT','user',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-04 12:27:38'),(8,NULL,'AUTH_LOGIN','user',15,'{\"email\": \"nguyentienlinh@holoramed.com\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-04 12:27:40'),(9,NULL,'AUTH_LOGOUT','user',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-04 12:50:06'),(10,NULL,'AUTH_LOGIN','user',15,'{\"email\": \"nguyentienlinh@holoramed.com\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-04 12:50:09'),(11,NULL,'AUTH_LOGIN','user',15,'{\"email\": \"nguyentienlinh@holoramed.com\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-05 11:38:16'),(12,NULL,'AUTH_LOGOUT','user',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-05 11:39:32'),(13,NULL,'AUTH_LOGIN','user',4,'{\"email\": \"patient@holora.com\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-05 11:39:38'),(14,NULL,'AUTH_LOGOUT','user',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-05 11:40:40'),(15,NULL,'AUTH_LOGIN','user',15,'{\"email\": \"nguyentienlinh@holoramed.com\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-05 11:40:46'),(16,NULL,'AUTH_LOGOUT','user',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-05 11:41:29'),(17,NULL,'AUTH_LOGIN','user',1,'{\"email\": \"sadmin@holora.com\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-05 11:41:33'),(18,NULL,'AUTH_LOGOUT','user',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-05 11:43:11'),(19,NULL,'AUTH_LOGIN','user',4,'{\"email\": \"patient@holora.com\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-05 11:43:20'),(20,NULL,'AUTH_LOGOUT','user',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-05 11:43:37'),(21,NULL,'AUTH_LOGIN','user',15,'{\"email\": \"nguyentienlinh@holoramed.com\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-05 11:43:40'),(22,15,'CONSULTATION_RESPONSE','consultation',3,'{\"complete\": true, \"response_type\": \"prescription_note\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-05 11:44:29'),(23,NULL,'AUTH_LOGOUT','user',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-06 02:46:00'),(24,NULL,'AUTH_LOGIN','user',1,'{\"email\": \"sadmin@holora.com\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-06 02:46:03'),(25,NULL,'AUTH_LOGOUT','user',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-06 03:20:57'),(26,NULL,'AUTH_LOGIN','user',4,'{\"email\": \"patient@holora.com\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-06 03:21:01'),(27,NULL,'AUTH_LOGOUT','user',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-06 03:22:01'),(28,NULL,'AUTH_LOGIN','user',15,'{\"email\": \"nguyentienlinh@holoramed.com\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-06 03:22:04'),(29,NULL,'AUTH_LOGOUT','user',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-06 03:24:09'),(30,NULL,'AUTH_LOGIN','user',4,'{\"email\": \"patient@holora.com\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-06 03:24:12'),(31,NULL,'AUTH_LOGIN','user',4,'{\"email\": \"patient@holora.com\"}','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-06 12:18:10');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `branch`
--

DROP TABLE IF EXISTS `branch`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `branch` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner_user_id` bigint unsigned DEFAULT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_branch_code` (`code`),
  KEY `idx_branch_status` (`status`),
  KEY `idx_branch_deleted_at` (`deleted_at`),
  KEY `idx_branch_owner_user` (`owner_user_id`),
  CONSTRAINT `fk_branch_owner_user` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `branch`
--

LOCK TABLES `branch` WRITE;
/*!40000 ALTER TABLE `branch` DISABLE KEYS */;
INSERT INTO `branch` VALUES (1,'Ph??ng Kh?Ìm Nha Khoa Quﬂ?°n 7','HLR_MED_31032026_0000001',14,'0981819143','it@nhakhoavietmy.com.vn','1298 Huﬂ??nh Tﬂ?—n Ph?Ìt, Ph?? Mﬂ??, Quﬂ?°n 7, TP Hﬂ?Ù Ch?° Minh','TP HCM',NULL,'active','2026-03-29 15:32:39','2026-03-31 03:37:18',NULL),(2,'Ph??ng Kh?Ìm Nha Khoa Quﬂ?°n 8','HLR_MED_31032026_0000002',14,'0386040080','ongdienfood@gmail.com','21 Hai B?· Tr??ng','Th?·nh phﬂ?Ê Thﬂ?∫ Dﬂ?∫u Mﬂ?÷t',NULL,'active','2026-03-30 00:08:26','2026-03-31 03:37:44',NULL),(3,'Ph??ng Kh?Ìm Nha Khoa B?ºnh Thﬂ?Ình','HLR_MED_31032026_0000003',14,'0981819143','binhthanh@holoramed.com','1298 Huﬂ??nh Tﬂ?—n Ph?Ìt, Ph?? Mﬂ??, Quﬂ?°n 7, TP Hﬂ?Ù Ch?° Minh','TP Hﬂ?Ù Ch?° Minh','Ph??ng Kh?Ìm Nha Khoa B?ºnh Thﬂ?Ình','active','2026-03-30 08:14:37','2026-03-31 06:41:28',NULL),(4,'Clinic Branch 1774859319','CLINIC_1774859319',16,'0900000002','branch1774859319@example.com','123 Test Street','HCM','E2E branch','active','2026-03-30 08:28:39','2026-03-30 08:28:39',NULL),(5,'Ph??ng Kh?Ìm Nha Khoa Mﬂ?? Tho','HLR_MED_31032026_BR0001',14,'0981819143','mytho@holoramed.com','1298 Huﬂ??nh Tﬂ?—n Ph?Ìt, Ph?? Mﬂ??, Quﬂ?°n 7, TP Hﬂ?Ù Ch?° Minh','TP Hﬂ?Ù Ch?° Minh','Ph??ng kh?Ìm nha khoa khu vﬂ??c Mﬂ?? Tho - ?…ﬂ?Ùng Th?Ìp','active','2026-03-31 06:39:45','2026-03-31 06:39:45',NULL);
/*!40000 ALTER TABLE `branch` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultation`
--

DROP TABLE IF EXISTS `consultation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultation` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `patient_id` bigint unsigned NOT NULL,
  `doctor_id` bigint unsigned DEFAULT NULL,
  `appointment_id` bigint unsigned DEFAULT NULL,
  `consultation_type` enum('text','image','video','hybrid') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'text',
  `chief_complaint` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `symptoms` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` enum('pending','in_progress','completed','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `priority` enum('low','normal','high','urgent') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'normal',
  `started_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_consultation_patient_id` (`patient_id`),
  KEY `idx_consultation_doctor_id` (`doctor_id`),
  KEY `idx_consultation_status` (`status`),
  KEY `idx_consultation_priority` (`priority`),
  KEY `idx_consultation_created_at` (`created_at`),
  KEY `fk_consultation_appointment` (`appointment_id`),
  CONSTRAINT `fk_consultation_appointment` FOREIGN KEY (`appointment_id`) REFERENCES `appointment` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_consultation_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctor` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_consultation_patient` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultation`
--

LOCK TABLES `consultation` WRITE;
/*!40000 ALTER TABLE `consultation` DISABLE KEYS */;
INSERT INTO `consultation` VALUES (1,1,6,NULL,'text','T??i bﬂ?Ô ?Êau r?‚ng','?…au r?‚ng sﬂ?Ê 8',NULL,'in_progress','normal','2026-04-01 03:06:31',NULL,'2026-03-29 06:12:56','2026-04-01 03:06:31'),(2,2,NULL,NULL,'text','Test','Test',NULL,'pending','normal',NULL,NULL,'2026-03-29 07:37:11','2026-03-29 07:37:11'),(3,2,3,NULL,'text','This is test feature','This is test feature: Symtom details',NULL,'completed','normal','2026-04-02 08:35:07','2026-04-05 11:44:29','2026-04-02 06:50:29','2026-04-05 11:44:29'),(4,2,3,3,'text','Test','Test',NULL,'pending','normal',NULL,NULL,'2026-04-02 13:11:06','2026-04-02 13:11:06');
/*!40000 ALTER TABLE `consultation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultation_image`
--

DROP TABLE IF EXISTS `consultation_image`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultation_image` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `consultation_id` bigint unsigned NOT NULL,
  `uploaded_by` bigint unsigned DEFAULT NULL,
  `response_id` bigint unsigned DEFAULT NULL,
  `image_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_type` enum('symptom','lab_report','xray','prescription','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'other',
  `caption` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mime_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_size` bigint unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_consultation_image_uploaded_by` (`uploaded_by`),
  KEY `idx_consultation_image_response_id` (`response_id`),
  KEY `idx_consultation_image_consultation_id` (`consultation_id`),
  KEY `idx_consultation_image_type` (`image_type`),
  CONSTRAINT `fk_consultation_image_consultation` FOREIGN KEY (`consultation_id`) REFERENCES `consultation` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_consultation_image_uploaded_by` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultation_image`
--

LOCK TABLES `consultation_image` WRITE;
/*!40000 ALTER TABLE `consultation_image` DISABLE KEYS */;
INSERT INTO `consultation_image` (`id`, `consultation_id`, `uploaded_by`, `response_id`, `image_url`, `image_type`, `caption`, `file_name`, `mime_type`, `file_size`, `created_at`) VALUES (1,1,5,NULL,'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=300','symptom',NULL,NULL,NULL,NULL,'2026-03-29 13:12:56'),(2,2,4,NULL,'http://localhost:5000/public/uploads/attachments-1774769831886-360672272.png','symptom',NULL,NULL,NULL,NULL,'2026-03-29 14:37:12'),(3,3,4,NULL,'http://localhost:5000/public/uploads/attachments-1775112629562-248331293.png','symptom',NULL,NULL,NULL,NULL,'2026-04-02 13:50:30'),(4,4,4,NULL,'http://localhost:5000/public/uploads/attachments-1775135466116-794057544.png','symptom',NULL,NULL,NULL,NULL,'2026-04-02 20:11:06');
/*!40000 ALTER TABLE `consultation_image` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultation_response`
--
--

DROP TABLE IF EXISTS `consultation_response`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultation_response` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `consultation_id` bigint unsigned NOT NULL,
  `responder_user_id` bigint unsigned NOT NULL,
  `response_type` enum('message','diagnosis','recommendation','prescription_note','follow_up') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'message',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_from_ai` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_consultation_response_consultation_id` (`consultation_id`),
  KEY `idx_consultation_response_responder_user_id` (`responder_user_id`),
  KEY `idx_consultation_response_type` (`response_type`),
  CONSTRAINT `fk_consultation_response_consultation` FOREIGN KEY (`consultation_id`) REFERENCES `consultation` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_consultation_response_responder` FOREIGN KEY (`responder_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultation_response`
--

LOCK TABLES `consultation_response` WRITE;
/*!40000 ALTER TABLE `consultation_response` DISABLE KEYS */;
INSERT INTO `consultation_response` VALUES (1,1,5,'message','Xin ch?·o',0,'2026-03-29 06:13:20','2026-03-29 06:13:20'),(2,1,19,'message','Trﬂ?˙ lﬂ?•i',0,'2026-04-01 03:06:31','2026-04-01 03:06:31'),(3,3,15,'message','Xin ch?·o',0,'2026-04-02 08:35:07','2026-04-02 08:35:07'),(4,3,4,'message','Ch?·o b?Ìc s??',0,'2026-04-02 08:35:44','2026-04-02 08:35:44'),(5,3,15,'diagnosis','Bﬂ?Ìn ho?·n to?·n khﬂ?≈e mﬂ?Ình',0,'2026-04-02 08:36:55','2026-04-02 08:36:55'),(6,3,15,'recommendation','Bﬂ?Ìn n?¨n vﬂ?¸ ngﬂ?∫\n',0,'2026-04-02 09:18:10','2026-04-02 09:18:10'),(7,3,15,'prescription_note','?…?Ûy l?· toa thuﬂ?Êc\n',0,'2026-04-02 09:48:39','2026-04-02 09:48:39'),(8,3,4,'message','What your doctor name?\n',0,'2026-04-02 09:53:03','2026-04-02 09:53:03'),(9,3,15,'message','Kﬂ??t th??c cuﬂ?÷c tr?? chuyﬂ?Án',0,'2026-04-02 09:54:22','2026-04-02 09:54:22'),(10,3,15,'prescription_note','tee',0,'2026-04-05 11:44:29','2026-04-05 11:44:29');
/*!40000 ALTER TABLE `consultation_response` ENABLE KEYS */;
UNLOCK TABLES;

ALTER TABLE `consultation_image` ADD CONSTRAINT `fk_consultation_image_response` FOREIGN KEY (`response_id`) REFERENCES `consultation_response` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Table structure for table `doctor`
--

DROP TABLE IF EXISTS `doctor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `doctor` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned DEFAULT NULL,
  `created_by_user_id` bigint unsigned DEFAULT NULL,
  `specialty_id` bigint unsigned DEFAULT NULL,
  `doctor_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `license_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qualification` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `experience_years` int unsigned NOT NULL DEFAULT '0',
  `consultation_fee` decimal(12,2) NOT NULL DEFAULT '0.00',
  `bio` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `avatar_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','inactive','on_leave','deleted') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `doctor_code` (`doctor_code`),
  UNIQUE KEY `uk_doctor_code` (`doctor_code`),
  UNIQUE KEY `uk_license_number` (`license_number`),
  KEY `fk_doctor_user` (`user_id`),
  KEY `idx_doctor_specialty_id` (`specialty_id`),
  KEY `idx_doctor_full_name` (`full_name`),
  KEY `idx_doctor_status` (`status`),
  KEY `idx_doctor_license_number` (`license_number`),
  KEY `idx_doctor_code` (`doctor_code`),
  KEY `idx_doctor_created_by_user` (`created_by_user_id`),
  CONSTRAINT `fk_doctor_created_by_user` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_doctor_specialty` FOREIGN KEY (`specialty_id`) REFERENCES `specialty` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_doctor_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doctor`
--

LOCK TABLES `doctor` WRITE;
/*!40000 ALTER TABLE `doctor` DISABLE KEYS */;
INSERT INTO `doctor` VALUES (1,NULL,NULL,24,'DOCTOR000001','Ho?·ng V?‚n Linh','+84981819143','it@holora.com','2022','',0,0.00,NULL,NULL,'active','2026-03-29 02:42:28','2026-03-30 07:23:29'),(2,12,1,1,'DOCTOR000002','Ho?·ng Linh','+84981819143','it@holoramind.com','2023','',0,0.00,NULL,NULL,'active','2026-03-30 07:03:38','2026-03-30 07:23:53'),(3,15,14,1,'DOCTOR000003','Nguyﬂ?‡n Tiﬂ??n Linh','+84981819143','nguyentienlinh@holoramed.com','LIC-0001','',0,0.00,NULL,NULL,'active','2026-03-30 08:16:14','2026-03-30 08:16:14'),(4,17,16,10,'DOCTOR000004','Doctor Test 1774859319','0900000003','doctor1774859319@example.com','LIC1774859319','MBBS',3,200000.00,'E2E doctor',NULL,'active','2026-03-30 08:28:39','2026-03-30 08:28:39'),(6,19,14,1,'HLR_MED_31032026_DT0001','Ho?·ng V?‚n Linh','+84981819143','linhhv@holoramed.com','LIC-HVL-2027','Implant',0,0.00,NULL,NULL,'active','2026-03-31 06:44:14','2026-03-31 06:44:14');
/*!40000 ALTER TABLE `doctor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `doctor_branch`
--

DROP TABLE IF EXISTS `doctor_branch`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `doctor_branch` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `doctor_id` bigint unsigned NOT NULL,
  `branch_id` bigint unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_doctor_branch` (`doctor_id`,`branch_id`),
  KEY `idx_doctor_branch_doctor` (`doctor_id`),
  KEY `idx_doctor_branch_branch` (`branch_id`),
  KEY `idx_doctor_branch_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_doctor_branch_branch` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_doctor_branch_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctor` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doctor_branch`
--

LOCK TABLES `doctor_branch` WRITE;
/*!40000 ALTER TABLE `doctor_branch` DISABLE KEYS */;
INSERT INTO `doctor_branch` VALUES (2,1,1,'2026-03-30 14:23:30','2026-03-30 14:23:30',NULL),(3,2,2,'2026-03-30 14:23:53','2026-03-30 14:23:53',NULL),(4,3,3,'2026-03-30 15:16:15','2026-03-30 15:16:15',NULL),(5,4,4,'2026-03-30 15:28:40','2026-03-30 15:28:40',NULL),(8,6,3,'2026-03-31 13:44:14','2026-03-31 13:44:14',NULL);
/*!40000 ALTER TABLE `doctor_branch` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `doctor_invite`
--

DROP TABLE IF EXISTS `doctor_invite`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `doctor_invite` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `doctor_id` bigint unsigned NOT NULL,
  `email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `token_hash` char(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `created_by_user_id` bigint unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_doctor_invite_token_hash` (`token_hash`),
  KEY `idx_doctor_invite_user` (`user_id`),
  KEY `idx_doctor_invite_doctor` (`doctor_id`),
  KEY `idx_doctor_invite_email` (`email`),
  KEY `idx_doctor_invite_expiry` (`expires_at`),
  KEY `fk_doctor_invite_creator` (`created_by_user_id`),
  CONSTRAINT `fk_doctor_invite_creator` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_doctor_invite_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctor` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_doctor_invite_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doctor_invite`
--

LOCK TABLES `doctor_invite` WRITE;
/*!40000 ALTER TABLE `doctor_invite` DISABLE KEYS */;
/*!40000 ALTER TABLE `doctor_invite` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `doctor_schedule`
--

DROP TABLE IF EXISTS `doctor_schedule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `doctor_schedule` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `doctor_id` bigint unsigned NOT NULL,
  `work_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `slot_duration` int NOT NULL DEFAULT '30',
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `doctor_id` (`doctor_id`),
  CONSTRAINT `doctor_schedule_ibfk_1` FOREIGN KEY (`doctor_id`) REFERENCES `doctor` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doctor_schedule`
--

LOCK TABLES `doctor_schedule` WRITE;
/*!40000 ALTER TABLE `doctor_schedule` DISABLE KEYS */;
INSERT INTO `doctor_schedule` VALUES (1,1,'2026-04-01','08:00:00','12:00:00',30,'active','2026-03-31 11:46:38','2026-03-31 11:46:38'),(2,1,'2026-04-01','13:00:00','17:00:00',30,'active','2026-03-31 11:46:38','2026-03-31 11:46:38'),(3,1,'2026-04-02','08:00:00','12:00:00',30,'active','2026-03-31 11:46:38','2026-03-31 11:46:38'),(5,6,'2026-04-01','08:00:00','20:00:00',30,'active','2026-03-31 11:54:53','2026-03-31 11:54:53'),(6,6,'2026-04-02','08:00:00','20:00:00',30,'active','2026-03-31 11:56:27','2026-03-31 11:56:27'),(7,3,'2026-04-02','08:00:00','20:00:00',30,'active','2026-04-02 08:44:20','2026-04-02 08:44:20'),(8,3,'2026-04-03','08:00:00','23:00:00',30,'active','2026-04-02 12:11:58','2026-04-03 07:00:28');
/*!40000 ALTER TABLE `doctor_schedule` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `holora_mind_chats`
--

DROP TABLE IF EXISTS `holora_mind_chats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `holora_mind_chats` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Cuﬂ?÷c tr?? chuyﬂ?Án mﬂ?¢i',
  `model_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'HoloraMind-v1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_holora_mind_chat_user` (`user_id`),
  CONSTRAINT `fk_holora_mind_chat_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `holora_mind_chats`
--

LOCK TABLES `holora_mind_chats` WRITE;
/*!40000 ALTER TABLE `holora_mind_chats` DISABLE KEYS */;
INSERT INTO `holora_mind_chats` VALUES (1,1,'Checklist tr??ﬂ?¢c buﬂ?Úi kh?Ìm tﬂ?Úng','HoloraMind-v1','2026-03-30 16:00:34','2026-03-30 16:00:34',NULL),(2,1,'Khi n?·o cﬂ?∫n ?Êi cﬂ?—p cﬂ??u nﬂ??u kh??','HoloraMind-v1','2026-03-30 16:01:13','2026-03-30 16:01:13',NULL),(3,1,'T??i bﬂ?Ô sﬂ?Êt 38.8 v?· ?Êau hﬂ?Ïng, c','HoloraMind-v1','2026-03-30 16:03:35','2026-03-30 16:03:35',NULL);
/*!40000 ALTER TABLE `holora_mind_chats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `holora_mind_messages`
--

DROP TABLE IF EXISTS `holora_mind_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `holora_mind_messages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `chat_id` bigint unsigned NOT NULL,
  `role` enum('user','assistant') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_holora_mind_msg_chat` (`chat_id`),
  CONSTRAINT `fk_holora_mind_msg_chat` FOREIGN KEY (`chat_id`) REFERENCES `holora_mind_chats` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `holora_mind_messages`
--

LOCK TABLES `holora_mind_messages` WRITE;
/*!40000 ALTER TABLE `holora_mind_messages` DISABLE KEYS */;
INSERT INTO `holora_mind_messages` VALUES (1,1,'user','Checklist tr??ﬂ?¢c buﬂ?Úi kh?Ìm tﬂ?Úng qu?Ìt','2026-03-30 16:00:34'),(2,1,'assistant','T??i ?Ê?˙ ghi nhﬂ?°n nﬂ?÷i dung cﬂ?∫a bﬂ?Ìn. ?…?Ûy l?· mﬂ?÷t th??ng tin quan trﬂ?Ïng. Bﬂ?Ìn c?? muﬂ?Ên ?Êi s?Ûu v?·o chi tiﬂ??t n?·o kh??ng? (T??i ?Êang trong giai ?Êoﬂ?Ìn ph?Ìt triﬂ?‚n v?· sﬂ?? sﬂ?¢m th??ng minh h?Ìn!)','2026-03-30 16:00:34'),(3,2,'user','Khi n?·o cﬂ?∫n ?Êi cﬂ?—p cﬂ??u nﬂ??u kh?? thﬂ?f?','2026-03-30 16:01:13'),(4,2,'assistant','T??i ?Ê?˙ ghi nhﬂ?°n nﬂ?÷i dung cﬂ?∫a bﬂ?Ìn. ?…?Ûy l?· mﬂ?÷t th??ng tin quan trﬂ?Ïng. Bﬂ?Ìn c?? muﬂ?Ên ?Êi s?Ûu v?·o chi tiﬂ??t n?·o kh??ng? (T??i ?Êang trong giai ?Êoﬂ?Ìn ph?Ìt triﬂ?‚n v?· sﬂ?? sﬂ?¢m th??ng minh h?Ìn!)','2026-03-30 16:01:13'),(5,3,'user','T??i bﬂ?Ô sﬂ?Êt 38.8 v?· ?Êau hﬂ?Ïng, cﬂ?∫n theo d??i g?º?','2026-03-30 16:03:35'),(6,3,'assistant','T??i ?Ê?˙ ghi nhﬂ?°n nﬂ?÷i dung cﬂ?∫a bﬂ?Ìn. ?…?Ûy l?· mﬂ?÷t th??ng tin quan trﬂ?Ïng. Bﬂ?Ìn c?? muﬂ?Ên ?Êi s?Ûu v?·o chi tiﬂ??t n?·o kh??ng? (T??i ?Êang trong giai ?Êoﬂ?Ìn ph?Ìt triﬂ?‚n v?· sﬂ?? sﬂ?¢m th??ng minh h?Ìn!)','2026-03-30 16:03:35');
/*!40000 ALTER TABLE `holora_mind_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification`
--

DROP TABLE IF EXISTS `notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `notification_type` enum('system','appointment','consultation','video','billing','review','security') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'system',
  `reference_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_id` bigint unsigned DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `read_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notification_user_id` (`user_id`),
  KEY `idx_notification_type` (`notification_type`),
  KEY `idx_notification_is_read` (`is_read`),
  KEY `idx_notification_reference` (`reference_type`,`reference_id`),
  CONSTRAINT `fk_notification_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification`
--

LOCK TABLES `notification` WRITE;
/*!40000 ALTER TABLE `notification` DISABLE KEYS */;
/*!40000 ALTER TABLE `notification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patient`
--

DROP TABLE IF EXISTS `patient`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `patient` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned DEFAULT NULL,
  `patient_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` enum('male','female','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `blood_group` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `allergies` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `medical_history` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `emergency_contact_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emergency_contact_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','inactive','blocked') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `patient_code` (`patient_code`),
  UNIQUE KEY `uk_patient_code` (`patient_code`),
  KEY `fk_patient_user` (`user_id`),
  KEY `idx_patient_full_name` (`full_name`),
  KEY `idx_patient_phone` (`phone`),
  KEY `idx_patient_email` (`email`),
  KEY `idx_patient_status` (`status`),
  KEY `idx_patient_code` (`patient_code`),
  KEY `idx_patient_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_patient_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patient`
--

LOCK TABLES `patient` WRITE;
/*!40000 ALTER TABLE `patient` DISABLE KEYS */;
INSERT INTO `patient` VALUES (1,5,'PAT000005','Linh Ho?·ng','','hoangvanlinhuit@gmail.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active','2026-03-28 15:07:41','2026-03-28 15:07:41',NULL),(2,4,'PAT000004','Patient User','0900000003','patient@holora.com','male','1991-12-03','1298 Huﬂ??nh Tﬂ?—n Ph?Ìt, Ph?? Mﬂ??, Quﬂ?°n 7, TP Hﬂ?Ù Ch?° Minh','','','','','',NULL,'active','2026-03-29 07:36:48','2026-03-30 00:09:07',NULL),(3,6,'PAT000006','Patient One','0123456789','patient1@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active','2026-03-30 01:18:59','2026-03-30 01:18:59',NULL),(4,7,'PAT000007','Tester One','0987654321','tester1@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active','2026-03-30 01:20:48','2026-03-30 01:20:48',NULL);
/*!40000 ALTER TABLE `patient` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patient_branch`
--

DROP TABLE IF EXISTS `patient_branch`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `patient_branch` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `patient_id` bigint unsigned NOT NULL,
  `branch_id` bigint unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_patient_branch` (`patient_id`,`branch_id`),
  KEY `idx_patient_branch_patient` (`patient_id`),
  KEY `idx_patient_branch_branch` (`branch_id`),
  KEY `idx_patient_branch_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_patient_branch_branch` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_patient_branch_patient` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patient_branch`
--

LOCK TABLES `patient_branch` WRITE;
/*!40000 ALTER TABLE `patient_branch` DISABLE KEYS */;
/*!40000 ALTER TABLE `patient_branch` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment`
--

DROP TABLE IF EXISTS `payment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `doctor_id` bigint unsigned NOT NULL,
  `appointment_id` bigint unsigned DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL,
  `currency` varchar(8) DEFAULT 'VND',
  `type` varchar(32) DEFAULT 'consultation',
  `status` varchar(16) DEFAULT 'paid',
  `note` varchar(255) DEFAULT NULL,
  `paid_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `doctor_id` (`doctor_id`),
  KEY `appointment_id` (`appointment_id`),
  CONSTRAINT `payment_ibfk_1` FOREIGN KEY (`doctor_id`) REFERENCES `doctor` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payment_ibfk_2` FOREIGN KEY (`appointment_id`) REFERENCES `appointment` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment`
--

LOCK TABLES `payment` WRITE;
/*!40000 ALTER TABLE `payment` DISABLE KEYS */;
/*!40000 ALTER TABLE `payment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_order`
--

DROP TABLE IF EXISTS `payment_order`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_order` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `plan_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `scope_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'account',
  `months` tinyint unsigned NOT NULL DEFAULT '1',
  `amount_cents` int unsigned NOT NULL,
  `currency` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'VND',
  `payment_method` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','paid','failed','expired') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `token` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_number` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payment_token` (`token`),
  UNIQUE KEY `uq_invoice_number` (`invoice_number`),
  KEY `idx_user_status` (`user_id`,`status`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_order`
--

LOCK TABLES `payment_order` WRITE;
/*!40000 ALTER TABLE `payment_order` DISABLE KEYS */;
INSERT INTO `payment_order` VALUES (1,14,'HOLORA_PLUS','account',1,299000,'VND','momo','paid','01c03f0b7198d7ae1b515e628904555ef40a3d68009c309d8630e2e708ce71be',NULL,NULL,NULL,'2026-03-31 13:45:17','2026-03-31 06:30:17','2026-03-31 06:30:19'),(2,14,'HOLORA_PLUS','account',1,299000,'VND','momo','pending','76efabb32daa57c8719f48300daa7f3e039b00c469d442146961c65431b2d4a4',NULL,NULL,NULL,'2026-04-03 21:25:31','2026-04-03 14:10:31','2026-04-03 14:10:31'),(3,14,'HOLORA_PLUS','account',1,299000,'VND','bank_transfer','pending','d84bbe85089e274a8d92959f36caa6780c6ddf3a32fbf2a99a497781f22c18a4',NULL,NULL,NULL,'2026-04-03 21:25:48','2026-04-03 14:10:47','2026-04-03 14:10:47');
/*!40000 ALTER TABLE `payment_order` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permission`
--

DROP TABLE IF EXISTS `permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permission` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `module_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_permission_module` (`module_name`),
  KEY `idx_permission_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=65 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permission`
--

LOCK TABLES `permission` WRITE;
/*!40000 ALTER TABLE `permission` DISABLE KEYS */;
INSERT INTO `permission` VALUES (1,'Manage Users','user.manage','user','To?·n quyﬂ?¸n quﬂ?˙n l?? ng??ﬂ?•i d??ng','active','2026-03-28 09:52:25','2026-04-03 02:11:42'),(2,'Manage Roles','role.manage','rbac','To?·n quyﬂ?¸n quﬂ?˙n l?? vai tr??','active','2026-03-28 09:52:25','2026-04-03 02:11:42'),(3,'Manage Permissions','permission.manage','rbac','To?·n quyﬂ?¸n quﬂ?˙n l?? ph?Ûn quyﬂ?¸n','active','2026-03-28 09:52:25','2026-04-03 02:11:42'),(4,'Manage Patients','patient.manage','patient','To?·n quyﬂ?¸n quﬂ?˙n l?? bﬂ?Ánh nh?Ûn','active','2026-03-28 09:52:25','2026-04-03 02:11:42'),(5,'Manage Doctors','doctor.manage','doctor','To?·n quyﬂ?¸n quﬂ?˙n l?? b?Ìc s??','active','2026-03-28 09:52:25','2026-04-03 02:11:42'),(6,'Manage Consultations','consultation.manage','consultation','To?·n quyﬂ?¸n quﬂ?˙n l?? ca t?? vﬂ?—n','active','2026-03-28 09:52:25','2026-04-03 02:11:42'),(7,'Manage AI Analysis','ai.manage','ai','To?·n quyﬂ?¸n quﬂ?˙n l?? ph?Ûn t?°ch AI','active','2026-03-28 09:52:25','2026-04-03 02:11:42'),(8,'Manage Appointments','appointment.manage','appointment','To?·n quyﬂ?¸n quﬂ?˙n l?? lﬂ?Ôch hﬂ??n','active','2026-03-28 09:52:25','2026-04-03 02:11:42'),(9,'Manage Video Sessions','video.manage','video','Quﬂ?˙n l?? phi?¨n t?? vﬂ?—n video','active','2026-03-28 09:52:25','2026-03-28 09:52:25'),(10,'Manage Reviews','review.manage','review','Quﬂ?˙n l?? ?Ê?Ình gi?Ì','active','2026-03-28 09:52:25','2026-03-28 09:52:25'),(11,'Manage Notifications','notification.manage','notification','Quﬂ?˙n l?? th??ng b?Ìo','active','2026-03-28 09:52:25','2026-03-28 09:52:25'),(12,'View Audit Logs','audit.view','audit','Xem nhﬂ?°t k?? hﬂ?Á thﬂ?Êng','active','2026-03-28 09:52:25','2026-03-28 09:52:25'),(13,'Access Dashboard','dashboard.access','dashboard','Truy cﬂ?°p bﬂ?˙ng ?Êiﬂ?¸u khiﬂ?‚n tﬂ?Úng quan','active','2026-03-28 14:55:40','2026-04-03 02:11:42'),(14,'View Users','user.view','user','Xem danh s?Ìch v?· th??ng tin ng??ﬂ?•i d??ng','active','2026-03-28 14:55:40','2026-04-03 02:11:42'),(15,'Create User','user.create','user','Tﬂ?Ìo t?·i khoﬂ?˙n ng??ﬂ?•i d??ng mﬂ?¢i','active','2026-03-28 14:55:40','2026-04-03 02:11:42'),(16,'Update User','user.update','user','Cﬂ?°p nhﬂ?°t th??ng tin ng??ﬂ?•i d??ng','active','2026-03-28 14:55:40','2026-04-03 02:11:42'),(17,'Delete User','user.delete','user','X??a t?·i khoﬂ?˙n ng??ﬂ?•i d??ng','active','2026-03-28 14:55:40','2026-04-03 02:11:42'),(18,'View Patients','patient.view','patient','Xem danh s?Ìch v?· hﬂ?Ù s?Ì bﬂ?Ánh nh?Ûn','active','2026-03-28 14:55:40','2026-04-03 02:11:42'),(19,'Create Patient','patient.create','patient','Th?¨m hﬂ?Ù s?Ì bﬂ?Ánh nh?Ûn mﬂ?¢i','active','2026-03-28 14:55:40','2026-04-03 02:11:42'),(20,'Update Patient','patient.update','patient','Cﬂ?°p nhﬂ?°t hﬂ?Ù s?Ì bﬂ?Ánh nh?Ûn','active','2026-03-28 14:55:40','2026-04-03 02:11:42'),(21,'View Appointments','appointment.view','appointment','Xem lﬂ?Ôch hﬂ??n cﬂ?∫a m?ºnh','active','2026-03-28 14:55:40','2026-04-03 02:11:42'),(22,'Create Appointment','appointment.create','appointment','?…ﬂ??t lﬂ?Ôch hﬂ??n mﬂ?¢i','active','2026-03-28 14:55:40','2026-04-03 02:11:42'),(23,'Update Appointment Status','appointment.update','appointment','Cﬂ?°p nhﬂ?°t trﬂ?Ìng th?Ìi lﬂ?Ôch hﬂ??n','active','2026-03-28 14:55:40','2026-04-03 02:11:42'),(24,'View Consultations','consultation.view','consultation','Xem ca t?? vﬂ?—n cﬂ?∫a m?ºnh','active','2026-03-28 14:55:40','2026-04-03 02:11:42'),(25,'Respond to Consultation','consultation.respond','consultation','Phﬂ?˙n hﬂ?Ùi / chﬂ??n ?Êo?Ìn ca t?? vﬂ?—n','active','2026-03-28 14:55:40','2026-04-03 02:11:42'),(26,'View Analytics','dashboard.analytics','dashboard','Xem b?Ìo c?Ìo thﬂ?Êng k?¨ ph?Ûn t?°ch','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(27,'Assign Role to User','user.assign_role','user','G?Ìn hoﬂ??c gﬂ?Ì vai tr?? khﬂ?≈i ng??ﬂ?•i d??ng','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(28,'View Roles','role.view','rbac','Xem danh s?Ìch vai tr??','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(29,'Create Role','role.create','rbac','Tﬂ?Ìo vai tr?? mﬂ?¢i','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(30,'Update Role','role.update','rbac','Cﬂ?°p nhﬂ?°t vai tr??','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(31,'Delete Role','role.delete','rbac','X??a vai tr??','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(32,'View Permissions','permission.view','rbac','Xem danh s?Ìch ph?Ûn quyﬂ?¸n','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(33,'Create Permission','permission.create','rbac','Tﬂ?Ìo ph?Ûn quyﬂ?¸n mﬂ?¢i','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(34,'Update Permission','permission.update','rbac','Cﬂ?°p nhﬂ?°t ph?Ûn quyﬂ?¸n','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(35,'Delete Permission','permission.delete','rbac','X??a ph?Ûn quyﬂ?¸n','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(36,'Delete Patient','patient.delete','patient','X??a hﬂ?Ù s?Ì bﬂ?Ánh nh?Ûn','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(37,'View Doctors','doctor.view','doctor','Xem danh s?Ìch v?· hﬂ?Ù s?Ì b?Ìc s??','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(38,'Create Doctor','doctor.create','doctor','Th?¨m hﬂ?Ù s?Ì b?Ìc s?? mﬂ?¢i','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(39,'Update Doctor','doctor.update','doctor','Cﬂ?°p nhﬂ?°t hﬂ?Ù s?Ì b?Ìc s??','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(40,'Delete Doctor','doctor.delete','doctor','X??a hﬂ?Ù s?Ì b?Ìc s??','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(41,'Manage Branches','branch.manage','branch','To?·n quyﬂ?¸n quﬂ?˙n l?? chi nh?Ình','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(42,'View Branches','branch.view','branch','Xem danh s?Ìch v?· th??ng tin chi nh?Ình','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(43,'Create Branch','branch.create','branch','Th?¨m chi nh?Ình mﬂ?¢i','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(44,'Update Branch','branch.update','branch','Cﬂ?°p nhﬂ?°t th??ng tin chi nh?Ình','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(45,'Delete Branch','branch.delete','branch','X??a chi nh?Ình','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(46,'View All Appointments','appointment.admin','appointment','Xem tﬂ?—t cﬂ?˙ lﬂ?Ôch hﬂ??n trong hﬂ?Á thﬂ?Êng (admin)','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(47,'Delete Appointment','appointment.delete','appointment','Hﬂ?∫y / x??a lﬂ?Ôch hﬂ??n','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(48,'Create Consultation','consultation.create','consultation','Gﬂ?°i y?¨u cﬂ?∫u t?? vﬂ?—n mﬂ?¢i','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(49,'Reopen Consultation','consultation.reopen','consultation','Mﬂ?f lﬂ?Ìi ca t?? vﬂ?—n ?Ê?˙ ho?·n th?·nh','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(50,'View Schedules','schedule.view','schedule','Xem lﬂ?Ôch l?·m viﬂ?Ác cﬂ?∫a b?Ìc s??','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(51,'Create Schedule','schedule.create','schedule','Tﬂ?Ìo ca l?·m viﬂ?Ác mﬂ?¢i','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(52,'Update Schedule','schedule.update','schedule','Cﬂ?°p nhﬂ?°t ca l?·m viﬂ?Ác','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(53,'Delete Schedule','schedule.delete','schedule','X??a ca l?·m viﬂ?Ác','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(54,'View Specialties','specialty.view','specialty','Xem danh mﬂ?—c chuy?¨n khoa','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(55,'Create Specialty','specialty.create','specialty','Th?¨m chuy?¨n khoa mﬂ?¢i','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(56,'Update Specialty','specialty.update','specialty','Cﬂ?°p nhﬂ?°t chuy?¨n khoa','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(57,'Delete Specialty','specialty.delete','specialty','X??a chuy?¨n khoa','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(58,'Request AI Analysis','ai.analyze','ai','Gﬂ?°i y?¨u cﬂ?∫u AI ph?Ûn t?°ch ﬂ?˙nh ca kh?Ìm','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(59,'View AI Results','ai.view','ai','Xem kﬂ??t quﬂ?˙ ph?Ûn t?°ch AI','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(60,'Review AI Results','ai.review','ai','B?Ìc s?? ?Ê?Ình gi?Ì v?· kiﬂ?‚m so?Ìt kﬂ??t quﬂ?˙ AI','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(61,'View Subscriptions','subscription.view','subscription','Xem g??i dﬂ?Ôch vﬂ?— v?· trﬂ?Ìng th?Ìi ?Ê?‚ng k??','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(62,'Activate Subscription','subscription.activate','subscription','K?°ch hoﬂ?Ìt g??i dﬂ?Ôch vﬂ?—','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(63,'Manage Subscriptions','subscription.manage','subscription','Quﬂ?˙n l?? thanh to?Ìn v?· x?Ìc nhﬂ?°n ?Ê?‚ng k??','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(64,'Upload Files','upload.file','upload','Tﬂ?˙i ﬂ?˙nh / tﬂ?Áp ?Ê?°nh k?øm l?¨n hﬂ?Á thﬂ?Êng','active','2026-04-03 02:11:42','2026-04-03 02:11:42');
/*!40000 ALTER TABLE `permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prescription`
--

DROP TABLE IF EXISTS `prescription`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prescription` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `consultation_id` bigint unsigned DEFAULT NULL,
  `appointment_id` bigint unsigned DEFAULT NULL,
  `doctor_id` bigint unsigned NOT NULL,
  `patient_id` bigint unsigned NOT NULL,
  `prescription_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `diagnosis` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` enum('draft','issued','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `issued_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_prescription_code` (`prescription_code`),
  KEY `idx_prescription_consultation` (`consultation_id`),
  KEY `idx_prescription_appointment` (`appointment_id`),
  KEY `idx_prescription_doctor` (`doctor_id`),
  KEY `idx_prescription_patient` (`patient_id`),
  KEY `idx_prescription_status` (`status`),
  CONSTRAINT `fk_prescription_appointment` FOREIGN KEY (`appointment_id`) REFERENCES `appointment` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_prescription_consultation` FOREIGN KEY (`consultation_id`) REFERENCES `consultation` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_prescription_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctor` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_prescription_patient` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prescription`
--

LOCK TABLES `prescription` WRITE;
/*!40000 ALTER TABLE `prescription` DISABLE KEYS */;
/*!40000 ALTER TABLE `prescription` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prescription_item`
--

DROP TABLE IF EXISTS `prescription_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prescription_item` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `prescription_id` bigint unsigned NOT NULL,
  `medication_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dosage` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `frequency` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duration` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quantity` int unsigned DEFAULT NULL,
  `unit` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `route` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `instructions` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `sort_order` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_item_prescription` (`prescription_id`),
  CONSTRAINT `fk_item_prescription` FOREIGN KEY (`prescription_id`) REFERENCES `prescription` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prescription_item`
--

LOCK TABLES `prescription_item` WRITE;
/*!40000 ALTER TABLE `prescription_item` DISABLE KEYS */;
/*!40000 ALTER TABLE `prescription_item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `provider_subscription`
--

DROP TABLE IF EXISTS `provider_subscription`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `provider_subscription` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `plan_id` bigint unsigned NOT NULL,
  `scope_type` enum('doctor','branch','account') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `scope_id` bigint unsigned NOT NULL,
  `owner_user_id` bigint unsigned NOT NULL,
  `status` enum('trialing','active','past_due','cancelled','expired') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'trialing',
  `starts_at` datetime NOT NULL,
  `ends_at` datetime DEFAULT NULL,
  `trial_ends_at` datetime DEFAULT NULL,
  `auto_renew` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_provider_subscription_scope` (`scope_type`,`scope_id`),
  KEY `idx_provider_subscription_owner` (`owner_user_id`),
  KEY `idx_provider_subscription_status` (`status`),
  KEY `idx_provider_subscription_deleted` (`deleted_at`),
  KEY `fk_provider_subscription_plan` (`plan_id`),
  CONSTRAINT `fk_provider_subscription_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_provider_subscription_plan` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plan` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `provider_subscription`
--

LOCK TABLES `provider_subscription` WRITE;
/*!40000 ALTER TABLE `provider_subscription` DISABLE KEYS */;
INSERT INTO `provider_subscription` VALUES (1,3,'branch',3,14,'trialing','2026-03-30 08:16:14','2026-04-29 08:16:14','2026-04-29 08:16:14',0,'2026-03-30 08:16:14','2026-03-30 08:16:14',NULL),(2,3,'branch',4,16,'trialing','2026-03-30 08:28:39','2026-04-29 08:28:39','2026-04-29 08:28:39',0,'2026-03-30 08:28:39','2026-03-30 08:28:39',NULL),(3,10,'account',14,14,'active','2026-03-31 13:30:19',NULL,NULL,1,'2026-03-31 06:30:19','2026-03-31 06:30:19',NULL);
/*!40000 ALTER TABLE `provider_subscription` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recurring_appointments`
--

DROP TABLE IF EXISTS `recurring_appointments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recurring_appointments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `patient_id` bigint unsigned NOT NULL,
  `doctor_id` bigint unsigned NOT NULL,
  `branch_id` bigint unsigned NOT NULL,
  `repeat_type` enum('daily','weekly','monthly') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `repeat_interval` int unsigned DEFAULT '1',
  `repeat_days` json DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_recurring_patient` (`patient_id`),
  KEY `idx_recurring_doctor` (`doctor_id`),
  KEY `idx_recurring_branch` (`branch_id`),
  CONSTRAINT `fk_recurring_branch` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_recurring_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctor` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_recurring_patient` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recurring_appointments`
--

LOCK TABLES `recurring_appointments` WRITE;
/*!40000 ALTER TABLE `recurring_appointments` DISABLE KEYS */;
/*!40000 ALTER TABLE `recurring_appointments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refresh_tokens`
--

DROP TABLE IF EXISTS `refresh_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refresh_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `revoked_at` datetime DEFAULT NULL,
  `replaced_by_hash` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_rt_token_hash` (`token_hash`),
  KEY `idx_rt_user_id` (`user_id`),
  KEY `idx_rt_expires` (`expires_at`),
  CONSTRAINT `refresh_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refresh_tokens`
--

LOCK TABLES `refresh_tokens` WRITE;
/*!40000 ALTER TABLE `refresh_tokens` DISABLE KEYS */;
INSERT INTO `refresh_tokens` VALUES (1,1,'2ea0a614e1e75f0a45b9b925ea41946408e9621a6187f33ba0ea463bf7dffa70','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-11 10:10:55','2026-04-04 03:10:55','2026-04-04 05:32:31',NULL),(2,15,'65b8d1dfc968f975fb104bf2d9e5c91891bade0b128faac229c1e366fd9fed39','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-11 12:32:35','2026-04-04 05:32:35','2026-04-04 05:32:54',NULL),(3,4,'879180766111ce884df35bc70fa6896db3756ccfa2b5a3d4941d08400b4125cd','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-11 12:32:57','2026-04-04 05:32:56','2026-04-04 06:59:04','c9d46475cdcce08036bb32eb36012647ede19433d84c9a76d32d2be87fa72c24'),(4,4,'c9d46475cdcce08036bb32eb36012647ede19433d84c9a76d32d2be87fa72c24','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-11 13:59:04','2026-04-04 06:59:04','2026-04-04 07:15:10','de22d6e35b254b7d02cca9b167f2f7e6030d19a4f6f9444c08aa1e3d78a42d03'),(5,4,'de22d6e35b254b7d02cca9b167f2f7e6030d19a4f6f9444c08aa1e3d78a42d03','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-11 14:15:10','2026-04-04 07:15:10','2026-04-04 12:27:21',NULL),(6,15,'17f8856092841f5a90f657b567fac266870fd34db4cdc4b47c6037cd4c5ddef2','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-11 19:27:27','2026-04-04 12:27:27','2026-04-04 12:27:38',NULL),(7,15,'d52d4f2147cbccc4651a10fffe7c621a3bcfc2fd2337eba73bc8639120655eb3','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-11 19:27:41','2026-04-04 12:27:40','2026-04-04 12:48:50','0abc3e03d0dda7b1a40f9665536832ab24c78cc3765c23d22671440c57cb4b53'),(8,15,'0abc3e03d0dda7b1a40f9665536832ab24c78cc3765c23d22671440c57cb4b53','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-11 19:48:50','2026-04-04 12:48:50','2026-04-04 12:50:06',NULL),(9,15,'da1f98403b90ce92d72e01279c99176ee29923d0a99d9df36c0e6ecd4adf2998','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-11 19:50:09','2026-04-04 12:50:09','2026-04-04 14:31:47','b5c77f489eb890dba860f6c599838c5baabe098d0eb077c58b4ba4d152dc1aca'),(10,15,'b5c77f489eb890dba860f6c599838c5baabe098d0eb077c58b4ba4d152dc1aca','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-11 21:31:47','2026-04-04 14:31:47',NULL,NULL),(11,15,'5d39d27d4636af1e3fb00b0bba3fbe2a6b25546dcca0e8bc338f77378c19c509','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-12 18:38:17','2026-04-05 11:38:16','2026-04-05 11:39:32',NULL),(12,4,'79acfd3ae1893f330f1c0eef3aa33604b34f7b5c89acacfe350c97db6553e072','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-12 18:39:38','2026-04-05 11:39:38','2026-04-05 11:40:40',NULL),(13,15,'c077039fef2374718e1d8b27e17d12ca610f5a3710dfeff590e01210ef68270e','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-12 18:40:47','2026-04-05 11:40:46','2026-04-05 11:41:29',NULL),(14,1,'5ca34101889b30495d6e873caf87e379d5250c5637b67ab9324de5bf72b32f7b','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-12 18:41:34','2026-04-05 11:41:33','2026-04-05 11:43:11',NULL),(15,4,'926ec9e3e75348aa4728798c0f41e01e4cab1a74b1391741f0e02a9ded35fd40','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-12 18:43:20','2026-04-05 11:43:20','2026-04-05 11:43:37',NULL),(16,15,'632273951232e00ac8121b6c3d9427fab2971326e6d603f88cddb5dda524284d','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-12 18:43:40','2026-04-05 11:43:40','2026-04-06 01:38:21','a086fd398f23828dbfad55b288da077122bae22fdd6c10b000dbe8e7159eb9c9'),(17,15,'a086fd398f23828dbfad55b288da077122bae22fdd6c10b000dbe8e7159eb9c9','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-13 08:38:22','2026-04-06 01:38:22','2026-04-06 01:53:25','182e6f161540c6a7d323ea644619e5c94bd278127d5ddabc462f2d9985170685'),(18,15,'182e6f161540c6a7d323ea644619e5c94bd278127d5ddabc462f2d9985170685','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-13 08:53:26','2026-04-06 01:53:26','2026-04-06 01:53:26','ecf1f47ca63a6afd93276b095f79ef388cf3c690ad2326f1045329a6d0b326ed'),(19,15,'ecf1f47ca63a6afd93276b095f79ef388cf3c690ad2326f1045329a6d0b326ed','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-13 08:53:27','2026-04-06 01:53:26','2026-04-06 02:13:30','67f54887d855ae22ac39583d29f871a5aea54c1c260829cce0d56c4c2e641557'),(20,15,'32e2e9faa84e1c3264188ed4c9ccb8b2a11227e49243a7ebede1ac1e5b8c27b7','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-13 09:13:30','2026-04-06 02:13:30',NULL,NULL),(21,15,'67f54887d855ae22ac39583d29f871a5aea54c1c260829cce0d56c4c2e641557','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-13 09:13:30','2026-04-06 02:13:30','2026-04-06 02:46:00',NULL),(22,1,'96ec6fe36851b36b814e953140608d175d1a37ba415f055b9d242ad84628617d','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-13 09:46:03','2026-04-06 02:46:03','2026-04-06 03:08:30','cb85cbb285283473e5982794302b2279e04d36664dd8a9cebb18b42b76f87c66'),(23,1,'cb85cbb285283473e5982794302b2279e04d36664dd8a9cebb18b42b76f87c66','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-13 10:08:30','2026-04-06 03:08:30','2026-04-06 03:20:57',NULL),(24,4,'4df85a3e6b229a52a012dd71dcf3f086f9ea342c3b0fe80151a5f0a0c092b93d','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-13 10:21:01','2026-04-06 03:21:01','2026-04-06 03:22:01',NULL),(25,15,'60e702650d7d4341219a5823fdc9e3249e55208322eb6d108e43c2ec7cc0ebc6','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-13 10:22:04','2026-04-06 03:22:04','2026-04-06 03:24:08',NULL),(26,4,'6c29f8480895564d9a03fe2ff813fed95c43667058bab78e0af43188489e261b','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-13 10:24:12','2026-04-06 03:24:12',NULL,NULL),(27,4,'8004420bfa5ccd1560da9ceead514d3ecdd4c12879ade9ba48e34ab377be7f10','::ffff:172.19.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','2026-04-13 12:18:10','2026-04-06 12:18:10',NULL,NULL);
/*!40000 ALTER TABLE `refresh_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `review`
--

DROP TABLE IF EXISTS `review`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `review` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `patient_id` bigint unsigned NOT NULL,
  `doctor_id` bigint unsigned NOT NULL,
  `appointment_id` bigint unsigned DEFAULT NULL,
  `rating` tinyint unsigned NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `comment` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_anonymous` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('pending','approved','rejected','hidden') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_review_patient_id` (`patient_id`),
  KEY `idx_review_doctor_id` (`doctor_id`),
  KEY `idx_review_appointment_id` (`appointment_id`),
  KEY `idx_review_status` (`status`),
  KEY `idx_review_rating` (`rating`),
  CONSTRAINT `fk_review_appointment` FOREIGN KEY (`appointment_id`) REFERENCES `appointment` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_review_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctor` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_review_patient` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `review`
--

LOCK TABLES `review` WRITE;
/*!40000 ALTER TABLE `review` DISABLE KEYS */;
/*!40000 ALTER TABLE `review` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role`
--

DROP TABLE IF EXISTS `role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_system_role` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_role_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role`
--

LOCK TABLES `role` WRITE;
/*!40000 ALTER TABLE `role` DISABLE KEYS */;
INSERT INTO `role` VALUES (1,'Super Admin','super_admin','To?·n quyﬂ?¸n hﬂ?Á thﬂ?Êng',1,'active','2026-03-28 09:52:25','2026-03-28 09:52:25'),(2,'Admin','admin','Quﬂ?˙n trﬂ?Ô hﬂ?Á thﬂ?Êng',1,'active','2026-03-28 09:52:25','2026-03-28 09:52:25'),(3,'Doctor','doctor','B?Ìc s??',1,'active','2026-03-28 09:52:25','2026-03-28 09:52:25'),(4,'Patient','patient','Bﬂ?Ánh nh?Ûn',1,'active','2026-03-28 09:52:25','2026-03-28 09:52:25'),(5,'Clinic Owner','clinic_owner','Owner of clinic/provider account',0,'active','2026-03-30 04:20:47','2026-04-06 03:27:31'),(6,'Branch Manager','branch_manager','Manager of a specific branch',0,'active','2026-03-30 04:20:47','2026-04-06 03:27:31');
/*!40000 ALTER TABLE `role` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permission`
--

DROP TABLE IF EXISTS `role_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permission` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `role_id` bigint unsigned NOT NULL,
  `permission_id` bigint unsigned NOT NULL,
  `granted_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `granted_by` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_permission` (`role_id`,`permission_id`),
  KEY `fk_role_permission_granted_by` (`granted_by`),
  KEY `idx_role_permission_permission_id` (`permission_id`),
  CONSTRAINT `fk_role_permission_granted_by` FOREIGN KEY (`granted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_role_permission_permission` FOREIGN KEY (`permission_id`) REFERENCES `permission` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_role_permission_role` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=58 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permission`
--

LOCK TABLES `role_permission` WRITE;
/*!40000 ALTER TABLE `role_permission` DISABLE KEYS */;
INSERT INTO `role_permission` VALUES (1,1,1,'2026-03-28 14:55:55',NULL),(2,1,2,'2026-03-28 14:55:55',NULL),(3,1,3,'2026-03-28 14:55:55',NULL),(4,1,4,'2026-03-28 14:55:55',NULL),(5,1,5,'2026-03-28 14:55:55',NULL),(6,1,6,'2026-03-28 14:55:55',NULL),(7,1,7,'2026-03-28 14:55:55',NULL),(8,1,8,'2026-03-28 14:55:55',NULL),(9,1,9,'2026-03-28 14:55:55',NULL),(10,1,10,'2026-03-28 14:55:55',NULL),(11,1,11,'2026-03-28 14:55:55',NULL),(12,1,12,'2026-03-28 14:55:55',NULL),(13,1,13,'2026-03-28 14:55:55',NULL),(14,1,14,'2026-03-28 14:55:55',NULL),(15,1,15,'2026-03-28 14:55:55',NULL),(16,1,16,'2026-03-28 14:55:55',NULL),(17,1,17,'2026-03-28 14:55:55',NULL),(18,1,18,'2026-03-28 14:55:55',NULL),(19,1,19,'2026-03-28 14:55:55',NULL),(20,1,20,'2026-03-28 14:55:55',NULL),(21,1,21,'2026-03-28 14:55:55',NULL),(22,1,22,'2026-03-28 14:55:55',NULL),(23,1,23,'2026-03-28 14:55:55',NULL),(24,1,24,'2026-03-28 14:55:55',NULL),(25,1,25,'2026-03-28 14:55:55',NULL),(32,2,22,'2026-03-28 14:56:13',NULL),(33,2,23,'2026-03-28 14:56:13',NULL),(34,2,21,'2026-03-28 14:56:13',NULL),(35,2,24,'2026-03-28 14:56:13',NULL),(36,2,13,'2026-03-28 14:56:13',NULL),(37,2,19,'2026-03-28 14:56:13',NULL),(38,2,20,'2026-03-28 14:56:13',NULL),(39,2,18,'2026-03-28 14:56:13',NULL),(40,2,15,'2026-03-28 14:56:13',NULL),(41,2,16,'2026-03-28 14:56:13',NULL),(42,2,14,'2026-03-28 14:56:13',NULL),(47,3,23,'2026-03-28 14:56:28',NULL),(48,3,21,'2026-03-28 14:56:28',NULL),(49,3,25,'2026-03-28 14:56:28',NULL),(50,3,24,'2026-03-28 14:56:28',NULL),(51,3,13,'2026-03-28 14:56:28',NULL),(52,3,18,'2026-03-28 14:56:28',NULL),(54,4,22,'2026-03-28 14:56:46',NULL),(55,4,21,'2026-03-28 14:56:46',NULL);
/*!40000 ALTER TABLE `role_permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `specialty`
--

DROP TABLE IF EXISTS `specialty`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `specialty` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `parent_id` bigint unsigned DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `doctor_count` int unsigned DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `code` (`code`),
  UNIQUE KEY `uk_specialty_code` (`code`),
  KEY `idx_specialty_code` (`code`),
  KEY `idx_specialty_status` (`status`),
  KEY `idx_specialty_deleted_at` (`deleted_at`),
  KEY `idx_specialty_parent_id` (`parent_id`),
  CONSTRAINT `fk_specialty_parent` FOREIGN KEY (`parent_id`) REFERENCES `specialty` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `specialty`
--

LOCK TABLES `specialty` WRITE;
/*!40000 ALTER TABLE `specialty` DISABLE KEYS */;
INSERT INTO `specialty` VALUES (1,'R?‚ng H?·m Mﬂ??t','S000001',NULL,'R?‚ng H?·m Mﬂ??t','active','2026-03-29 05:33:04','2026-04-06 03:23:58',NULL,3),(2,'Nﬂ?÷i khoa','INTERNAL_MEDICINE',NULL,'?…iﬂ?¸u trﬂ?Ô bﬂ?Ánh bﬂ??ng thuﬂ?Êc','active','2026-03-30 07:08:37','2026-04-06 03:27:32',NULL,0),(3,'Ngoﬂ?Ìi khoa','SURGERY',NULL,'?…iﬂ?¸u trﬂ?Ô bﬂ?Ánh bﬂ??ng phﬂ?Ωu thuﬂ?°t','active','2026-03-30 07:08:57','2026-04-06 03:27:32',NULL,0),(4,'Sﬂ?˙n phﬂ?— khoa','S000004',NULL,'Sﬂ?˙n phﬂ?— khoa','active','2026-03-30 07:09:16','2026-03-30 07:09:16',NULL,0),(5,'Nhi khoa','S000005',NULL,'Nhi khoa','active','2026-03-30 07:09:37','2026-03-30 07:09:37',NULL,0),(6,'Y tﬂ?? c??ng cﬂ?÷ng/Y hﬂ?Ïc dﬂ?? ph??ng','S000006',NULL,'Y tﬂ?? c??ng cﬂ?÷ng/Y hﬂ?Ïc dﬂ?? ph??ng','active','2026-03-30 07:10:14','2026-03-30 07:10:14',NULL,0),(7,'D??ﬂ?˙c hﬂ?Ïc','S000007',NULL,'D??ﬂ?˙c hﬂ?Ïc','active','2026-03-30 07:10:31','2026-03-30 07:10:31',NULL,0),(8,'?…iﬂ?¸u d??ﬂ?Ìng/Hﬂ?÷ sinh','S000008',NULL,'?…iﬂ?¸u d??ﬂ?Ìng/Hﬂ?÷ sinh','active','2026-03-30 07:10:46','2026-03-30 07:10:46',NULL,0),(9,'Chuy?¨n khoa gi?Ìc quan/da','S000009',NULL,'Chuy?¨n khoa gi?Ìc quan/da','active','2026-03-30 07:11:10','2026-03-30 07:11:10',NULL,0),(10,'Chuy?¨n khoa chﬂ??c n?‚ng/hﬂ?˘ trﬂ?˙','S000010',NULL,'Chuy?¨n khoa chﬂ??c n?‚ng/hﬂ?˘ trﬂ?˙','active','2026-03-30 07:11:29','2026-04-06 03:23:58',NULL,1),(11,'Chuy?¨n khoa ?Êﬂ??c th??','S000011',NULL,'Chuy?¨n khoa ?Êﬂ??c th??','active','2026-03-30 07:11:44','2026-03-30 07:11:44',NULL,0),(13,'Tim mﬂ?Ìch','CARDIOLOGY',2,NULL,'active','2026-03-30 07:16:17','2026-04-06 03:27:32',NULL,0),(14,'Ti?¨u h??a','GASTROENTEROLOGY',2,NULL,'active','2026-03-30 07:16:17','2026-04-06 03:27:32',NULL,0),(15,'H?? hﬂ?—p','RESPIRATORY',2,NULL,'active','2026-03-30 07:16:17','2026-04-06 03:27:32',NULL,0),(16,'Nﬂ?÷i tiﬂ??t','ENDOCRINOLOGY',2,NULL,'active','2026-03-30 07:16:17','2026-04-06 03:27:32',NULL,0),(17,'Thﬂ?°n - Tiﬂ??t niﬂ?Áu','NEPHRO_UROLOGY',2,NULL,'active','2026-03-30 07:16:17','2026-04-06 03:27:32',NULL,0),(18,'X???Ìng khﬂ?¢p','RHEUMATOLOGY',2,NULL,'active','2026-03-30 07:16:17','2026-04-06 03:27:32',NULL,0),(19,'Huyﬂ??t hﬂ?Ïc','HEMATOLOGY',2,NULL,'active','2026-03-30 07:16:17','2026-04-06 03:27:32',NULL,0),(20,'Truyﬂ?¸n nhiﬂ?‡m/Nhiﬂ?Át ?Êﬂ?¢i','INFECTIOUS_DISEASE',2,NULL,'active','2026-03-30 07:16:17','2026-04-06 03:27:32',NULL,0),(21,'Ngoﬂ?Ìi tﬂ?Úng qu?Ìt','GENERAL_SURGERY',3,NULL,'active','2026-03-30 07:16:17','2026-04-06 03:27:32',NULL,0),(22,'Ngoﬂ?Ìi thﬂ?∫n kinh','NEUROSURGERY',3,NULL,'active','2026-03-30 07:16:17','2026-04-06 03:27:32',NULL,0),(23,'Ngoﬂ?Ìi lﬂ?Ùng ngﬂ??c','THORACIC_SURGERY',3,NULL,'active','2026-03-30 07:16:17','2026-04-06 03:27:32',NULL,0),(24,'Chﬂ?—n th???Ìng chﬂ?Înh h?ºnh','ORTHOPEDIC_TRAUMA',3,NULL,'active','2026-03-30 07:16:17','2026-04-06 03:27:32',NULL,1),(25,'Ngoﬂ?Ìi nhi','PEDIATRIC_SURGERY',3,NULL,'active','2026-03-30 07:16:17','2026-04-06 03:27:32',NULL,0);
/*!40000 ALTER TABLE `specialty` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscription_entitlement`
--

DROP TABLE IF EXISTS `subscription_entitlement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscription_entitlement` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `plan_id` bigint unsigned NOT NULL,
  `feature_code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `limit_value` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_plan_feature` (`plan_id`,`feature_code`),
  KEY `idx_entitlement_feature` (`feature_code`),
  CONSTRAINT `fk_entitlement_plan` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plan` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscription_entitlement`
--

LOCK TABLES `subscription_entitlement` WRITE;
/*!40000 ALTER TABLE `subscription_entitlement` DISABLE KEYS */;
INSERT INTO `subscription_entitlement` VALUES (1,4,'branch.manage',1,NULL,'2026-03-30 03:24:55','2026-04-06 03:27:33'),(2,3,'branch.manage',1,NULL,'2026-03-30 03:24:55','2026-04-06 03:27:33'),(3,2,'branch.manage',1,NULL,'2026-03-30 03:24:55','2026-04-06 03:27:33'),(4,1,'branch.manage',1,NULL,'2026-03-30 03:24:55','2026-04-06 03:27:33'),(8,4,'doctor.manage',1,NULL,'2026-03-30 03:24:55','2026-04-06 03:27:33'),(9,3,'doctor.manage',1,NULL,'2026-03-30 03:24:55','2026-04-06 03:27:33'),(10,2,'doctor.manage',1,3,'2026-03-30 03:24:55','2026-04-06 03:27:33'),(11,1,'doctor.manage',1,1,'2026-03-30 03:24:55','2026-04-06 03:27:33'),(15,4,'appointment.receive',1,NULL,'2026-03-30 03:24:55','2026-04-06 03:27:33'),(16,3,'appointment.receive',1,NULL,'2026-03-30 03:24:55','2026-04-06 03:27:33'),(17,2,'appointment.receive',1,NULL,'2026-03-30 03:24:55','2026-04-06 03:27:33'),(18,1,'appointment.receive',1,NULL,'2026-03-30 03:24:55','2026-04-06 03:27:33'),(25,9,'branch.manage',1,3,'2026-03-30 09:04:45','2026-04-06 03:27:33'),(26,9,'doctor.manage',1,3,'2026-03-30 09:04:45','2026-04-06 03:27:33'),(27,10,'branch.manage',1,NULL,'2026-03-30 09:04:45','2026-04-06 03:27:33'),(28,10,'doctor.manage',1,NULL,'2026-03-30 09:04:45','2026-04-06 03:27:33');
/*!40000 ALTER TABLE `subscription_entitlement` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscription_plan`
--

DROP TABLE IF EXISTS `subscription_plan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscription_plan` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `scope_type` enum('doctor','branch','account') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `billing_cycle` enum('monthly','yearly') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'monthly',
  `price_cents` int unsigned NOT NULL DEFAULT '0',
  `currency` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'VND',
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_subscription_plan_code` (`code`),
  KEY `idx_subscription_plan_scope` (`scope_type`),
  KEY `idx_subscription_plan_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscription_plan`
--

LOCK TABLES `subscription_plan` WRITE;
/*!40000 ALTER TABLE `subscription_plan` DISABLE KEYS */;
INSERT INTO `subscription_plan` VALUES (1,'DOCTOR_TRIAL_14D','Doctor Trial 14 Days','doctor','monthly',0,'VND','active','2026-03-30 03:24:55','2026-04-06 03:27:33',NULL),(2,'DOCTOR_PRO_MONTHLY','Doctor Pro Monthly','doctor','monthly',299000,'VND','active','2026-03-30 03:24:55','2026-04-06 03:27:33',NULL),(3,'BRANCH_TRIAL_30D','Branch Trial 30 Days','branch','monthly',0,'VND','active','2026-03-30 03:24:55','2026-04-06 03:27:33',NULL),(4,'BRANCH_GROWTH_MONTHLY','Branch Growth Monthly','branch','monthly',999000,'VND','active','2026-03-30 03:24:55','2026-04-06 03:27:33',NULL),(9,'HOLORA_FREE','Holora Free','account','monthly',0,'VND','active','2026-03-30 09:04:45','2026-04-06 03:27:33',NULL),(10,'HOLORA_PLUS','Holora Plus','account','monthly',299000,'VND','active','2026-03-30 09:04:45','2026-04-06 03:27:33',NULL);
/*!40000 ALTER TABLE `subscription_plan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_role`
--

DROP TABLE IF EXISTS `user_role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_role` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `role_id` bigint unsigned NOT NULL,
  `assigned_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `assigned_by` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_role` (`user_id`,`role_id`),
  KEY `fk_user_role_assigned_by` (`assigned_by`),
  KEY `idx_user_role_role_id` (`role_id`),
  CONSTRAINT `fk_user_role_assigned_by` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_user_role_role` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_user_role_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_role`
--

LOCK TABLES `user_role` WRITE;
/*!40000 ALTER TABLE `user_role` DISABLE KEYS */;
INSERT INTO `user_role` VALUES (1,1,1,'2026-03-28 14:57:13',NULL),(3,2,2,'2026-03-28 15:01:06',NULL),(4,3,3,'2026-03-28 15:01:06',NULL),(5,4,4,'2026-03-28 15:01:06',NULL),(6,5,4,'2026-03-28 15:07:41',NULL),(7,6,4,'2026-03-30 01:18:59',NULL),(8,7,4,'2026-03-30 01:20:47',NULL),(9,8,4,'2026-03-30 03:05:43',NULL),(10,9,4,'2026-03-30 04:15:22',NULL),(11,10,5,'2026-03-30 04:21:09',NULL),(12,11,3,'2026-03-30 07:03:02',NULL),(13,12,3,'2026-03-30 07:03:38',NULL),(14,14,5,'2026-03-30 07:26:06',NULL),(15,15,3,'2026-03-30 08:16:14',NULL),(16,16,5,'2026-03-30 08:28:39',NULL),(17,17,3,'2026-03-30 08:28:39',NULL),(19,19,3,'2026-03-31 06:44:14',NULL);
/*!40000 ALTER TABLE `user_role` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `full_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `auth_provider` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'local',
  `google_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reset_password_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reset_password_expires` datetime DEFAULT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` enum('male','female','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `status` enum('active','inactive','suspended','deleted') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `email_verified_at` datetime DEFAULT NULL,
  `last_login_at` datetime DEFAULT NULL,
  `remember_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_user_full_name` (`full_name`),
  KEY `idx_user_phone` (`phone`),
  KEY `idx_user_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Super Admin','sadmin','sadmin@holora.com','$2b$10$vRRxYLE/b6cZcc.F3w/KW.ZL1tgge1xCfCGSNQFFIMYaHcX7QjVVG','local',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,NULL,'2026-03-28 10:29:08','2026-03-28 10:29:08',NULL),(2,'Admin User','admin','admin@holora.com','$2b$10$vRRxYLE/b6cZcc.F3w/KW.ZL1tgge1xCfCGSNQFFIMYaHcX7QjVVG','local',NULL,NULL,NULL,'0900000001',NULL,NULL,NULL,'active',NULL,NULL,NULL,'2026-03-28 15:00:40','2026-03-28 15:00:40',NULL),(3,'Doctor User','doctor','doctor@holora.com','$2b$10$vRRxYLE/b6cZcc.F3w/KW.ZL1tgge1xCfCGSNQFFIMYaHcX7QjVVG','local',NULL,NULL,NULL,'0900000002',NULL,NULL,NULL,'active',NULL,NULL,NULL,'2026-03-28 15:00:40','2026-03-28 15:00:40',NULL),(4,'Patient User','patient','patient@holora.com','$2b$10$vRRxYLE/b6cZcc.F3w/KW.ZL1tgge1xCfCGSNQFFIMYaHcX7QjVVG','local',NULL,NULL,NULL,'0900000003',NULL,NULL,NULL,'active',NULL,NULL,NULL,'2026-03-28 15:00:40','2026-03-28 15:00:40',NULL),(5,'Linh Ho?·ng','sadmin@holora.com','hoangvanlinhuit@gmail.com','$2b$10$uePpdVkxfpVEAMEdJf7/fe4R8oBzWiryPxfYB7PKw.nUcnHnrR/6S','local',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,NULL,'2026-03-28 15:07:41','2026-03-29 06:58:23',NULL),(6,'Patient One','patient1','patient1@example.com','$2b$10$5sRWNN5SxgVzdbRe.LfqCeMgcMIHPox0AeIN3XZRJaHhuEKJ0NT1m','local',NULL,NULL,NULL,'0123456789',NULL,NULL,NULL,'active',NULL,NULL,NULL,'2026-03-30 01:18:59','2026-03-30 01:18:59',NULL),(7,'Tester One','tester1','tester1@example.com','$2b$10$iC.mjH41lCHi9zHTvwL81.1TSAU.HwS.KnG15ygzHk/Uh6/DOQ4te','local',NULL,NULL,NULL,'0987654321',NULL,NULL,NULL,'active',NULL,NULL,NULL,'2026-03-30 01:20:47','2026-03-30 01:20:47',NULL),(8,'App Dentor','dentorvn_942976','dentor.vn@gmail.com','$2b$10$j54XbWDvME9v7/KBzHY7DOUuHnSLBj6y0Zg2.dYSyI8lczUWb6cEG','local',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active','2026-03-30 03:05:43',NULL,NULL,'2026-03-30 03:05:43','2026-03-30 03:05:43',NULL),(9,'Farm ?ˆng ?…iﬂ?¸n','ongdienfarm_122345','ongdienfarm@gmail.com','$2b$10$AA5v4xAw1qRFsGQzfDhOiuW9MCrve0bJuC0L6cOOtCswnawWDbl5e','local',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active','2026-03-30 04:15:22',NULL,NULL,'2026-03-30 04:15:22','2026-03-30 04:15:22',NULL),(10,'Provider Test','provider_6593','provider_8044@example.com','$2b$10$dJfcIctPkMDlwzLEOKDaUeFgE.xWw9iY3wUm5J7Yhs79CuSypaeOu','local',NULL,NULL,NULL,'0900000000',NULL,NULL,NULL,'active',NULL,NULL,NULL,'2026-03-30 04:21:09','2026-03-30 04:21:09',NULL),(11,'Ho?·ng Linh','it@holoramind.com.vn','it@holoramind.com.vn','$2b$10$qmQqse/.YWmdXGIrn7Fbt.yF7wpIxXActnC0Zqo1rGagIHwYEyud2','local',NULL,NULL,NULL,'+84981819143',NULL,NULL,NULL,'active',NULL,NULL,NULL,'2026-03-30 07:03:02','2026-03-30 07:03:02',NULL),(12,'Ho?·ng Linh','it@holoramind.com','it@holoramind.com','$2b$10$U0H6BR86NAoY2aYdS/WiXuWSNoGcniflX7BCtG31ikSVha/xTiu8q','local',NULL,NULL,NULL,'+84981819143',NULL,NULL,NULL,'active',NULL,NULL,NULL,'2026-03-30 07:03:38','2026-03-30 07:03:38',NULL),(14,'Nguyﬂ?‡n Ho?·ng ?…ﬂ??c','ducnh','ongdienfood@gmail.com','$2b$10$dICGZnislRyI0fBwgriNj.yMhl2NfcayY8F/RmEGlGliU8nBGgfv2','local',NULL,NULL,NULL,'0386040080',NULL,NULL,NULL,'active',NULL,NULL,NULL,'2026-03-30 07:26:06','2026-03-30 07:26:06',NULL),(15,'Nguyﬂ?‡n Tiﬂ??n Linh','ongdienfood@gmail.com','nguyentienlinh@holoramed.com','$2b$10$L4PqwmyEIkxhxQgVz21uk..huGQ7ygkIHOAC2IMDgA/avZV55q.RS','local',NULL,NULL,NULL,'+84981819143',NULL,NULL,NULL,'active',NULL,NULL,NULL,'2026-03-30 08:16:14','2026-03-30 08:16:14',NULL),(16,'Provider Test','provider1774859319','provider1774859319@example.com','$2b$10$a/ZPcFOkTpX8IcNuyEY1QO0kT1QKZy4dvr3Ct3eRjuUDh35dWIqNW','local',NULL,NULL,NULL,'0900000001',NULL,NULL,NULL,'active',NULL,NULL,NULL,'2026-03-30 08:28:39','2026-03-30 08:28:39',NULL),(17,'Doctor Test 1774859319','doctor1774859319','doctor1774859319@example.com','$2b$10$zpX48n4g1FbA1Ssr2cDbNO8ZHrYIIL02hUa8kQZ7alUwUwYJDk7V6','local',NULL,NULL,NULL,'0900000003',NULL,NULL,NULL,'active',NULL,NULL,NULL,'2026-03-30 08:28:39','2026-03-30 08:28:39',NULL),(19,'Ho?·ng V?‚n Linh','linhhv@holoramed.com','linhhv@holoramed.com','$2b$10$tig6VmX.6TpZMa2JKfJTru/sP3cU7YICs8JBL5uOVnQPt7JUo6QXS','local',NULL,NULL,NULL,'+84981819143',NULL,NULL,NULL,'active',NULL,NULL,NULL,'2026-03-31 06:44:14','2026-03-31 06:44:14',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `video_consultation_session`
--

DROP TABLE IF EXISTS `video_consultation_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `video_consultation_session` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `appointment_id` bigint unsigned NOT NULL,
  `consultation_id` bigint unsigned DEFAULT NULL,
  `room_code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `provider` enum('agora','twilio','google_meet','zoom','custom_webrtc') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'custom_webrtc',
  `session_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `join_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `started_at` datetime DEFAULT NULL,
  `ended_at` datetime DEFAULT NULL,
  `duration_minutes` int unsigned DEFAULT NULL,
  `status` enum('scheduled','live','ended','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'scheduled',
  `recording_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `room_code` (`room_code`),
  KEY `idx_video_session_appointment_id` (`appointment_id`),
  KEY `idx_video_session_consultation_id` (`consultation_id`),
  KEY `idx_video_session_status` (`status`),
  CONSTRAINT `fk_video_session_appointment` FOREIGN KEY (`appointment_id`) REFERENCES `appointment` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_video_session_consultation` FOREIGN KEY (`consultation_id`) REFERENCES `consultation` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `video_consultation_session`
--

LOCK TABLES `video_consultation_session` WRITE;
/*!40000 ALTER TABLE `video_consultation_session` DISABLE KEYS */;
/*!40000 ALTER TABLE `video_consultation_session` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-06 12:21:00
