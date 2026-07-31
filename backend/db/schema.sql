-- ============================================================
-- Lykos - schema de creation de la base de donnees
-- Application de suivi de lecture personnel
-- MySQL 8.x / InnoDB / utf8mb4
-- ============================================================

CREATE DATABASE lykos
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE lykos;


-- ------------------------------------------------------------
-- Table : user
-- Compte utilisateur. Aucune cle etrangere.
-- ------------------------------------------------------------
CREATE TABLE user (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email         VARCHAR(180) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_user_email (email)
) ENGINE = InnoDB;


-- ------------------------------------------------------------
-- Table : password_reset
-- Jetons de reinitialisation de mot de passe.
-- Le token stocke est le HASH du jeton envoye par email,
-- jamais le jeton en clair.
-- ------------------------------------------------------------
CREATE TABLE password_reset (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  token      CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at    DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_password_reset_token (token),
  KEY idx_password_reset_user (user_id),

  CONSTRAINT fk_password_reset_user
    FOREIGN KEY (user_id) REFERENCES user (id)
    ON DELETE CASCADE
) ENGINE = InnoDB;


-- ------------------------------------------------------------
-- Table : author
-- Auteurs. first_name nullable : certains auteurs n'ont
-- qu'un seul nom (Homere, Voltaire...).
-- ------------------------------------------------------------
CREATE TABLE author (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  first_name VARCHAR(100) NULL,
  last_name  VARCHAR(100) NOT NULL,

  PRIMARY KEY (id),
  KEY idx_author_last_name (last_name)
) ENGINE = InnoDB;


-- ------------------------------------------------------------
-- Table : book_series
-- Sagas. total_volumes nullable : saga en cours de parution
-- ou nombre de tomes inconnu.
-- ------------------------------------------------------------
CREATE TABLE book_series (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title         VARCHAR(150) NOT NULL,
  total_volumes SMALLINT UNSIGNED NULL,

  PRIMARY KEY (id)
) ENGINE = InnoDB;


-- ------------------------------------------------------------
-- Table : book
-- Table metier centrale. Porte les donnees descriptives du
-- livre ET le suivi de lecture de son proprietaire.
-- 3 cles etrangeres : user, author, book_series.
-- ------------------------------------------------------------
CREATE TABLE book (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id             INT UNSIGNED NOT NULL,
  author_id           INT UNSIGNED NOT NULL,
  series_id           INT UNSIGNED NULL,

  title               VARCHAR(200) NOT NULL,
  publication_year    SMALLINT UNSIGNED NULL,
  publisher           VARCHAR(120) NULL,
  page_count          SMALLINT UNSIGNED NULL,
  isbn                VARCHAR(20) NULL,
  cover_url           VARCHAR(500) NULL,
  summary             TEXT NULL,
  volume_number       SMALLINT UNSIGNED NULL,

  reading_status      ENUM('to_read', 'reading', 'read', 'abandoned')
                      NOT NULL DEFAULT 'to_read',
  rating              TINYINT UNSIGNED NULL,
  comment             TEXT NULL,

  wishlisted_at       DATE NULL,
  acquired_at         DATE NULL,
  started_reading_at  DATE NULL,
  finished_reading_at DATE NULL,

  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                      ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_book_user (user_id),
  KEY idx_book_author (author_id),
  KEY idx_book_series (series_id),
  KEY idx_book_user_status (user_id, reading_status),

  CONSTRAINT chk_book_rating
    CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),

  CONSTRAINT fk_book_user
    FOREIGN KEY (user_id) REFERENCES user (id)
    ON DELETE CASCADE,

  CONSTRAINT fk_book_author
    FOREIGN KEY (author_id) REFERENCES author (id)
    ON DELETE RESTRICT,

  CONSTRAINT fk_book_series
    FOREIGN KEY (series_id) REFERENCES book_series (id)
    ON DELETE SET NULL
) ENGINE = InnoDB;