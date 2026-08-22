-- MySQL dump 10.13  Distrib 8.4.3, for Win64 (x86_64)
--
-- Host: localhost    Database: Lykos
-- ------------------------------------------------------
-- Server version	8.4.3

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
-- Current Database: `Lykos`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `Lykos` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `Lykos`;

--
-- Table structure for table `author`
--

DROP TABLE IF EXISTS `author`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `author` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_author_last_name` (`last_name`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `author`
--

LOCK TABLES `author` WRITE;
/*!40000 ALTER TABLE `author` DISABLE KEYS */;
INSERT INTO `author` VALUES (1,'Pierce','Brown'),(2,NULL,'Saint-Exupéry'),(3,NULL,'Herbert'),(4,NULL,'Camus'),(5,'Albert','Camus'),(6,NULL,'Test-Edge'),(7,'Kazuo','Ishiguro'),(8,'Patrick','Rothfuss');
/*!40000 ALTER TABLE `author` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `book`
--

DROP TABLE IF EXISTS `book`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `book` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `author_id` int unsigned NOT NULL,
  `series_id` int unsigned DEFAULT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `publication_year` smallint unsigned DEFAULT NULL,
  `publisher` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `page_count` smallint unsigned DEFAULT NULL,
  `isbn` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cover_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `summary` text COLLATE utf8mb4_unicode_ci,
  `volume_number` smallint unsigned DEFAULT NULL,
  `reading_status` enum('to_read','reading','read','abandoned') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'to_read',
  `rating` tinyint unsigned DEFAULT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci,
  `wishlisted_at` date DEFAULT NULL,
  `acquired_at` date DEFAULT NULL,
  `started_reading_at` date DEFAULT NULL,
  `finished_reading_at` date DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_book_user` (`user_id`),
  KEY `idx_book_author` (`author_id`),
  KEY `idx_book_series` (`series_id`),
  KEY `idx_book_user_status` (`user_id`,`reading_status`),
  CONSTRAINT `fk_book_author` FOREIGN KEY (`author_id`) REFERENCES `author` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_book_series` FOREIGN KEY (`series_id`) REFERENCES `book_series` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_book_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_book_rating` CHECK (((`rating` is null) or (`rating` between 1 and 5)))
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `book`
--

LOCK TABLES `book` WRITE;
/*!40000 ALTER TABLE `book` DISABLE KEYS */;
INSERT INTO `book` VALUES (2,1,1,1,'Golden Son',NULL,NULL,NULL,NULL,NULL,NULL,2,'to_read',NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-29 12:49:13','2026-07-29 12:49:13'),(3,1,2,NULL,'Le Petit Prince',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'read',NULL,NULL,'2024-01-01','2024-01-05','2024-01-06','2024-01-08','2026-07-29 12:49:13','2026-07-29 12:49:13'),(4,1,3,NULL,'Dune',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'read',NULL,NULL,'2024-01-01','2024-01-05','2024-01-06','2024-01-08','2026-07-29 12:58:49','2026-07-29 12:58:49'),(5,3,4,NULL,'Livre minimal',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'to_read',NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-31 10:54:51','2026-07-31 10:54:51'),(6,3,5,2,'L\'Étranger',1942,NULL,186,'9782070360024','https://example.com/etranger.jpg','Un roman sur l\'absurde.',1,'read',NULL,'Excellent.','2026-01-01','2026-01-05','2026-01-10',NULL,'2026-07-31 10:55:12','2026-07-31 13:17:54'),(7,3,6,NULL,'Tome sans saga',NULL,NULL,NULL,NULL,NULL,NULL,5,'to_read',NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-31 10:55:12','2026-07-31 10:55:12'),(8,3,7,NULL,'Le Vent se lève',NULL,NULL,NULL,NULL,'https://example.com/covers/vent-se-leve.jpg',NULL,NULL,'reading',NULL,NULL,NULL,'2026-02-01',NULL,NULL,'2026-07-31 10:56:19','2026-07-31 10:56:19'),(9,3,7,NULL,'Les Vestiges du jour',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'abandoned',NULL,NULL,NULL,'2026-01-15',NULL,NULL,'2026-07-31 10:56:19','2026-07-31 10:56:19'),(10,3,8,3,'Le Nom du vent',NULL,NULL,NULL,NULL,NULL,NULL,1,'to_read',NULL,NULL,'2026-03-01',NULL,NULL,NULL,'2026-07-31 10:56:19','2026-07-31 10:56:19'),(11,3,8,3,'La Peur du sage',NULL,NULL,NULL,NULL,NULL,NULL,2,'to_read',NULL,NULL,NULL,'2026-03-10',NULL,NULL,'2026-07-31 10:56:19','2026-07-31 10:56:19');
/*!40000 ALTER TABLE `book` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `book_series`
--

DROP TABLE IF EXISTS `book_series`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `book_series` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_volumes` smallint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `book_series`
--

LOCK TABLES `book_series` WRITE;
/*!40000 ALTER TABLE `book_series` DISABLE KEYS */;
INSERT INTO `book_series` VALUES (1,'Red Rising Saga',NULL),(2,'Cycle de l\'absurde',NULL),(3,'Chronique du tueur de roi',NULL);
/*!40000 ALTER TABLE `book_series` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset`
--

DROP TABLE IF EXISTS `password_reset`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `token` char(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_password_reset_token` (`token`),
  KEY `idx_password_reset_user` (`user_id`),
  CONSTRAINT `fk_password_reset_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset`
--

LOCK TABLES `password_reset` WRITE;
/*!40000 ALTER TABLE `password_reset` DISABLE KEYS */;
INSERT INTO `password_reset` VALUES (1,1,'f4990b77f2d0bee6d9ec2d041d0e381a6430daeebc98c7fc0c88deea181e2a54','2026-07-29 13:59:58',NULL,'2026-07-29 12:59:58'),(2,1,'4557173f695ca88a49810a254cf353fe4cf60f3d337f353881f8df2de9e5b83d','2026-07-29 14:00:24','2026-07-29 13:00:37','2026-07-29 13:00:23'),(3,3,'febc19223d437d94f8445aa18448ede40f2301555dc8cf0e3c2e42b5abe1c8e5','2026-07-31 11:52:28',NULL,'2026-07-31 10:52:27'),(4,3,'f8b3715e3b4298e70dc184dd19bf10a058f0de66b510765eaebc935d0ca31889','2026-07-31 12:09:17',NULL,'2026-07-31 11:09:16');
/*!40000 ALTER TABLE `password_reset` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('user','admin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (1,'test-books@example.com','$2b$12$oQOSh7xxxspprAFTBLMB/.FMQbxyiVGV63wd355RN0mZCR.pKloiK','user','2026-07-29 12:48:48','2026-07-29 13:01:10'),(2,'autre-user@example.com','$2b$12$vwbTInOlNBa56nXfanJiD.lTSrtZS0ufckSq8.lXEtzOBySG/QzcO','user','2026-07-29 12:50:13','2026-07-29 12:50:13'),(3,'recette.f11@lykos.test','$2b$12$q0NPqUwiD8vCibbkJVuhSuBqfLuWUIsLISWzjyk5w26PqgmSctsCu','admin','2026-07-31 10:52:07','2026-07-31 14:47:55'),(4,'non-admin.f14@lykos.test','$2b$12$Ie1pDok4J4WJD19KfLlbMuatoP09grrRksDeNuouPHKw0WI3MXMOC','user','2026-07-31 14:48:41','2026-07-31 14:48:41');
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-22 11:57:49
