CREATE DATABASE IF NOT EXISTS `st_gabriel_church`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `st_gabriel_church`;

CREATE TABLE IF NOT EXISTS `admins` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(160) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) NOT NULL DEFAULT 'admin',
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `lastLogin` DATETIME NULL,
  `failedLoginAttempts` INT UNSIGNED NOT NULL DEFAULT 0,
  `lockedUntil` DATETIME NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_admins_email` (`email`),
  KEY `idx_admins_role` (`role`),
  KEY `idx_admins_is_active` (`isActive`),
  KEY `idx_admins_locked_until` (`lockedUntil`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `users` (
  `id` CHAR(36) NOT NULL,
  `fullName` VARCHAR(120) NOT NULL,
  `email` VARCHAR(160) NOT NULL,
  `phone` VARCHAR(40) NULL,
  `password` VARCHAR(255) NOT NULL,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `lastLogin` DATETIME NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `idx_users_is_active` (`isActive`),
  KEY `idx_users_created_at` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `actorType` ENUM('admin', 'user', 'system', 'public') NOT NULL DEFAULT 'system',
  `actorId` VARCHAR(80) NULL,
  `actorEmail` VARCHAR(160) NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity` VARCHAR(80) NULL,
  `entityId` VARCHAR(80) NULL,
  `ipAddress` VARCHAR(64) NULL,
  `userAgent` VARCHAR(500) NULL,
  `metadata` TEXT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_logs_actor_type` (`actorType`),
  KEY `idx_audit_logs_actor_email` (`actorEmail`),
  KEY `idx_audit_logs_action` (`action`),
  KEY `idx_audit_logs_entity` (`entity`),
  KEY `idx_audit_logs_created_at` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `failed_login_attempts` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `scope` ENUM('admin', 'user') NOT NULL,
  `email` VARCHAR(160) NOT NULL,
  `ipAddress` VARCHAR(64) NULL,
  `userAgent` VARCHAR(500) NULL,
  `reason` VARCHAR(120) NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_failed_login_scope` (`scope`),
  KEY `idx_failed_login_email` (`email`),
  KEY `idx_failed_login_ip` (`ipAddress`),
  KEY `idx_failed_login_created_at` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `website_settings` (
  `settingKey` VARCHAR(80) NOT NULL,
  `settingValue` TEXT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`settingKey`),
  UNIQUE KEY `uq_website_settings_setting_key` (`settingKey`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id` CHAR(36) NOT NULL,
  `fullName` VARCHAR(120) NOT NULL,
  `email` VARCHAR(160) NOT NULL,
  `phone` VARCHAR(40) NULL,
  `subject` VARCHAR(180) NOT NULL DEFAULT 'Website inquiry',
  `message` TEXT NOT NULL,
  `status` ENUM('unread', 'read', 'replied') NOT NULL DEFAULT 'unread',
  `adminNotes` TEXT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_contact_messages_email` (`email`),
  KEY `idx_contact_messages_full_name` (`fullName`),
  KEY `idx_contact_messages_status` (`status`),
  KEY `idx_contact_messages_created_at` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `prayer_requests` (
  `id` CHAR(36) NOT NULL,
  `fullName` VARCHAR(120) NOT NULL,
  `contact` VARCHAR(160) NOT NULL,
  `category` ENUM('Healing', 'Family', 'Thanksgiving', 'Guidance', 'Loss', 'Private Request', 'Other') NOT NULL DEFAULT 'Private Request',
  `message` TEXT NOT NULL,
  `isPrivate` TINYINT(1) NOT NULL DEFAULT 1,
  `status` ENUM('pending', 'prayed', 'archived') NOT NULL DEFAULT 'pending',
  `adminNotes` TEXT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_prayer_requests_category` (`category`),
  KEY `idx_prayer_requests_status` (`status`),
  KEY `idx_prayer_requests_is_private` (`isPrivate`),
  KEY `idx_prayer_requests_created_at` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `newsletter_subscribers` (
  `id` CHAR(36) NOT NULL,
  `email` VARCHAR(160) NOT NULL,
  `fullName` VARCHAR(120) NULL,
  `isSubscribed` TINYINT(1) NOT NULL DEFAULT 1,
  `source` VARCHAR(80) NOT NULL DEFAULT 'website',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_newsletter_subscribers_email` (`email`),
  KEY `idx_newsletter_subscribers_is_subscribed` (`isSubscribed`),
  KEY `idx_newsletter_subscribers_created_at` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `announcements` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(180) NOT NULL,
  `slug` VARCHAR(220) NOT NULL,
  `category` ENUM('Important', 'Mass Update', 'Youth', 'Charity', 'Parish News') NOT NULL DEFAULT 'Parish News',
  `summary` VARCHAR(500) NOT NULL,
  `content` TEXT NOT NULL,
  `imageUrl` VARCHAR(500) NULL,
  `isPublished` TINYINT(1) NOT NULL DEFAULT 0,
  `publishedAt` DATETIME NULL,
  `createdBy` CHAR(36) NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_announcements_slug` (`slug`),
  KEY `idx_announcements_category` (`category`),
  KEY `idx_announcements_is_published` (`isPublished`),
  KEY `idx_announcements_published_at` (`publishedAt`),
  KEY `idx_announcements_created_by` (`createdBy`),
  CONSTRAINT `fk_announcements_created_by`
    FOREIGN KEY (`createdBy`) REFERENCES `admins` (`id`)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `events` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(180) NOT NULL,
  `slug` VARCHAR(220) NOT NULL,
  `description` TEXT NOT NULL,
  `eventDate` DATE NOT NULL,
  `startTime` VARCHAR(20) NOT NULL,
  `endTime` VARCHAR(20) NULL,
  `location` VARCHAR(180) NOT NULL,
  `category` ENUM('Mass', 'Youth', 'Charity', 'Bible Study', 'Parish', 'Special') NOT NULL DEFAULT 'Parish',
  `imageUrl` VARCHAR(500) NULL,
  `isFeatured` TINYINT(1) NOT NULL DEFAULT 0,
  `isPublished` TINYINT(1) NOT NULL DEFAULT 0,
  `createdBy` CHAR(36) NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_events_slug` (`slug`),
  KEY `idx_events_event_date` (`eventDate`),
  KEY `idx_events_category` (`category`),
  KEY `idx_events_is_published` (`isPublished`),
  KEY `idx_events_is_featured` (`isFeatured`),
  KEY `idx_events_created_by` (`createdBy`),
  CONSTRAINT `fk_events_created_by`
    FOREIGN KEY (`createdBy`) REFERENCES `admins` (`id`)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `donations` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `donorName` VARCHAR(120) NOT NULL,
  `phone` VARCHAR(40) NOT NULL,
  `email` VARCHAR(160) NULL,
  `amount` DECIMAL(12, 2) NOT NULL,
  `purpose` ENUM('Tithe', 'Church Development', 'Charity', 'Youth Ministry', 'Mass Offering', 'Other') NOT NULL,
  `paymentMethod` ENUM('M-Pesa', 'Card', 'Bank Transfer') NOT NULL,
  `status` ENUM('pending', 'completed', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
  `transactionCode` VARCHAR(100) NOT NULL,
  `checkoutRequestId` VARCHAR(120) NULL,
  `mpesaReceiptNumber` VARCHAR(100) NULL,
  `message` TEXT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_donations_transaction_code` (`transactionCode`),
  KEY `idx_donations_checkout_request_id` (`checkoutRequestId`),
  KEY `idx_donations_mpesa_receipt_number` (`mpesaReceiptNumber`),
  KEY `idx_donations_purpose` (`purpose`),
  KEY `idx_donations_payment_method` (`paymentMethod`),
  KEY `idx_donations_status` (`status`),
  KEY `idx_donations_created_at` (`createdAt`),
  CONSTRAINT `chk_donations_amount_positive` CHECK (`amount` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
