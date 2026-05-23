CREATE DATABASE IF NOT EXISTS `st_gabriel_church`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `st_gabriel_church`;

DROP PROCEDURE IF EXISTS `add_column_if_missing`;
DROP PROCEDURE IF EXISTS `add_index_if_missing`;
DROP PROCEDURE IF EXISTS `add_unique_email_if_missing`;
DROP PROCEDURE IF EXISTS `add_fk_if_missing`;

DELIMITER //

CREATE PROCEDURE `add_column_if_missing`(
  IN `p_table` VARCHAR(64),
  IN `p_column` VARCHAR(64),
  IN `p_definition` TEXT
)
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = `p_table`
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = `p_table`
      AND COLUMN_NAME = `p_column`
  ) THEN
    SET @ddl = CONCAT(
      'ALTER TABLE `',
      REPLACE(`p_table`, '`', '``'),
      '` ADD COLUMN `',
      REPLACE(`p_column`, '`', '``'),
      '` ',
      `p_definition`
    );
    PREPARE ddl_statement FROM @ddl;
    EXECUTE ddl_statement;
    DEALLOCATE PREPARE ddl_statement;
  END IF;
END//

CREATE PROCEDURE `add_index_if_missing`(
  IN `p_table` VARCHAR(64),
  IN `p_index` VARCHAR(64),
  IN `p_definition` TEXT
)
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = `p_table`
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = `p_table`
      AND INDEX_NAME = `p_index`
  ) THEN
    SET @ddl = CONCAT(
      'ALTER TABLE `',
      REPLACE(`p_table`, '`', '``'),
      '` ADD ',
      `p_definition`
    );
    PREPARE ddl_statement FROM @ddl;
    EXECUTE ddl_statement;
    DEALLOCATE PREPARE ddl_statement;
  END IF;
END//

CREATE PROCEDURE `add_unique_email_if_missing`(
  IN `p_table` VARCHAR(64),
  IN `p_index` VARCHAR(64)
)
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = `p_table`
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = `p_table`
      AND COLUMN_NAME = 'email'
      AND NON_UNIQUE = 0
  ) THEN
    SET @ddl = CONCAT(
      'ALTER TABLE `',
      REPLACE(`p_table`, '`', '``'),
      '` ADD UNIQUE INDEX `',
      REPLACE(`p_index`, '`', '``'),
      '` (`email`)'
    );
    PREPARE ddl_statement FROM @ddl;
    EXECUTE ddl_statement;
    DEALLOCATE PREPARE ddl_statement;
  END IF;
END//

CREATE PROCEDURE `add_fk_if_missing`(
  IN `p_table` VARCHAR(64),
  IN `p_constraint` VARCHAR(64),
  IN `p_definition` TEXT
)
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = `p_table`
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = `p_table`
      AND CONSTRAINT_NAME = `p_constraint`
  ) THEN
    SET @ddl = CONCAT(
      'ALTER TABLE `',
      REPLACE(`p_table`, '`', '``'),
      '` ADD CONSTRAINT `',
      REPLACE(`p_constraint`, '`', '``'),
      '` ',
      `p_definition`
    );
    PREPARE ddl_statement FROM @ddl;
    EXECUTE ddl_statement;
    DEALLOCATE PREPARE ddl_statement;
  END IF;
END//

DELIMITER ;

CREATE TABLE IF NOT EXISTS `users` (
  `id` CHAR(36) NOT NULL,
  `fullName` VARCHAR(120) NOT NULL,
  `email` VARCHAR(160) NOT NULL,
  `phone` VARCHAR(40) NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('user', 'admin', 'editor') NOT NULL DEFAULT 'user',
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `emailVerified` TINYINT(1) NOT NULL DEFAULT 0,
  `lastLogin` DATETIME NULL,
  `failedLoginAttempts` INT UNSIGNED NOT NULL DEFAULT 0,
  `lockUntil` DATETIME NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_is_active` (`isActive`),
  KEY `idx_users_lock_until` (`lockUntil`),
  KEY `idx_users_created_at` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CALL `add_column_if_missing`('users', 'role', 'ENUM(''user'', ''admin'', ''editor'') NOT NULL DEFAULT ''user'' AFTER `password`');
CALL `add_column_if_missing`('users', 'emailVerified', 'TINYINT(1) NOT NULL DEFAULT 0 AFTER `isActive`');
CALL `add_column_if_missing`('users', 'failedLoginAttempts', 'INT UNSIGNED NOT NULL DEFAULT 0 AFTER `lastLogin`');
CALL `add_column_if_missing`('users', 'lockUntil', 'DATETIME NULL AFTER `failedLoginAttempts`');
CALL `add_unique_email_if_missing`('users', 'uq_users_email');
CALL `add_index_if_missing`('users', 'idx_users_role', 'INDEX `idx_users_role` (`role`)');
CALL `add_index_if_missing`('users', 'idx_users_lock_until', 'INDEX `idx_users_lock_until` (`lockUntil`)');
CALL `add_index_if_missing`('users', 'idx_users_created_at', 'INDEX `idx_users_created_at` (`createdAt`)');

UPDATE `users`
SET `role` = CASE
  WHEN LOWER(REPLACE(`role`, ' ', '_')) = 'admin' THEN 'admin'
  WHEN LOWER(REPLACE(`role`, ' ', '_')) = 'editor' THEN 'editor'
  ELSE 'user'
END
WHERE `role` IS NULL
   OR LOWER(REPLACE(`role`, ' ', '_')) NOT IN ('user', 'admin', 'editor');

ALTER TABLE `users`
  MODIFY COLUMN `role` ENUM('user', 'admin', 'editor') NOT NULL DEFAULT 'user',
  MODIFY COLUMN `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  MODIFY COLUMN `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS `admins` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(160) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('super_admin', 'admin', 'editor') NOT NULL DEFAULT 'admin',
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `lastLogin` DATETIME NULL,
  `failedLoginAttempts` INT UNSIGNED NOT NULL DEFAULT 0,
  `lockUntil` DATETIME NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_admins_email` (`email`),
  KEY `idx_admins_role` (`role`),
  KEY `idx_admins_is_active` (`isActive`),
  KEY `idx_admins_lock_until` (`lockUntil`),
  KEY `idx_admins_created_at` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CALL `add_column_if_missing`('admins', 'failedLoginAttempts', 'INT UNSIGNED NOT NULL DEFAULT 0 AFTER `lastLogin`');
CALL `add_column_if_missing`('admins', 'lockUntil', 'DATETIME NULL AFTER `failedLoginAttempts`');
CALL `add_unique_email_if_missing`('admins', 'uq_admins_email');
CALL `add_index_if_missing`('admins', 'idx_admins_role', 'INDEX `idx_admins_role` (`role`)');
CALL `add_index_if_missing`('admins', 'idx_admins_lock_until', 'INDEX `idx_admins_lock_until` (`lockUntil`)');
CALL `add_index_if_missing`('admins', 'idx_admins_created_at', 'INDEX `idx_admins_created_at` (`createdAt`)');

UPDATE `admins`
SET `role` = CASE
  WHEN LOWER(REPLACE(`role`, ' ', '_')) IN ('super_admin', 'superadmin') THEN 'super_admin'
  WHEN LOWER(`role`) = 'editor' THEN 'editor'
  ELSE 'admin'
END;

ALTER TABLE `admins`
  MODIFY COLUMN `role` ENUM('super_admin', 'admin', 'editor') NOT NULL DEFAULT 'admin';

SET @has_legacy_locked_until = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'admins'
    AND COLUMN_NAME = 'lockedUntil'
);
SET @copy_legacy_lock_sql = IF(
  @has_legacy_locked_until > 0,
  'UPDATE `admins` SET `lockUntil` = `lockedUntil` WHERE `lockUntil` IS NULL',
  'DO 0'
);
PREPARE copy_legacy_lock_statement FROM @copy_legacy_lock_sql;
EXECUTE copy_legacy_lock_statement;
DEALLOCATE PREPARE copy_legacy_lock_statement;

SET @drop_legacy_lock_sql = IF(
  @has_legacy_locked_until > 0,
  'ALTER TABLE `admins` DROP COLUMN `lockedUntil`',
  'DO 0'
);
PREPARE drop_legacy_lock_statement FROM @drop_legacy_lock_sql;
EXECUTE drop_legacy_lock_statement;
DEALLOCATE PREPARE drop_legacy_lock_statement;

ALTER TABLE `admins`
  MODIFY COLUMN `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  MODIFY COLUMN `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS `site_settings` (
  `id` TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `maintenanceMode` TINYINT(1) NOT NULL DEFAULT 0,
  `maintenanceTitle` VARCHAR(180) NOT NULL DEFAULT 'Website temporarily unavailable',
  `maintenanceMessage` TEXT NOT NULL,
  `maintenanceExpectedBack` DATETIME NULL,
  `allowUserLogin` TINYINT(1) NOT NULL DEFAULT 1,
  `allowRegistration` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `chk_site_settings_singleton` CHECK (`id` = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `site_settings` (
  `id`,
  `maintenanceMode`,
  `maintenanceTitle`,
  `maintenanceMessage`,
  `allowUserLogin`,
  `allowRegistration`
) VALUES (
  1,
  0,
  'Website temporarily unavailable',
  'We are making a few updates. Please check back soon.',
  1,
  1
) ON DUPLICATE KEY UPDATE
  `updatedAt` = `updatedAt`;

CREATE TABLE IF NOT EXISTS `button_controls` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `buttonKey` ENUM(
    'donate_now',
    'view_mass_times',
    'contact_us',
    'prayer_request',
    'newsletter_subscribe'
  ) NOT NULL,
  `buttonLabel` VARCHAR(120) NOT NULL,
  `isEnabled` TINYINT(1) NOT NULL DEFAULT 1,
  `disabledReason` VARCHAR(255) NULL,
  `updatedBy` CHAR(36) NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_button_controls_button_key` (`buttonKey`),
  KEY `idx_button_controls_button_key` (`buttonKey`),
  KEY `idx_button_controls_is_enabled` (`isEnabled`),
  KEY `idx_button_controls_updated_by` (`updatedBy`),
  KEY `idx_button_controls_created_at` (`createdAt`),
  CONSTRAINT `fk_button_controls_updated_by`
    FOREIGN KEY (`updatedBy`) REFERENCES `admins` (`id`)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `button_controls` (`buttonKey`, `buttonLabel`, `isEnabled`, `disabledReason`) VALUES
  ('donate_now', 'Donate Now', 1, NULL),
  ('view_mass_times', 'View Mass Times', 1, NULL),
  ('contact_us', 'Contact Us', 1, NULL),
  ('prayer_request', 'Prayer Request', 1, NULL),
  ('newsletter_subscribe', 'Newsletter Subscribe', 1, NULL)
ON DUPLICATE KEY UPDATE
  `buttonLabel` = VALUES(`buttonLabel`);

CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `actorType` ENUM('admin', 'user', 'system', 'public') NOT NULL DEFAULT 'system',
  `actorId` CHAR(36) NULL,
  `actorEmail` VARCHAR(160) NULL,
  `action` VARCHAR(120) NOT NULL,
  `module` VARCHAR(80) NOT NULL DEFAULT 'system',
  `description` VARCHAR(500) NULL,
  `entity` VARCHAR(80) NULL,
  `entityId` VARCHAR(80) NULL,
  `ipAddress` VARCHAR(64) NULL,
  `userAgent` VARCHAR(500) NULL,
  `metadata` JSON NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_logs_actor_type` (`actorType`),
  KEY `idx_audit_logs_actor_id` (`actorId`),
  KEY `idx_audit_logs_actor_email` (`actorEmail`),
  KEY `idx_audit_logs_action` (`action`),
  KEY `idx_audit_logs_module` (`module`),
  KEY `idx_audit_logs_ip_address` (`ipAddress`),
  KEY `idx_audit_logs_created_at` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CALL `add_column_if_missing`('audit_logs', 'module', 'VARCHAR(80) NOT NULL DEFAULT ''system'' AFTER `action`');
CALL `add_column_if_missing`('audit_logs', 'description', 'VARCHAR(500) NULL AFTER `module`');
CALL `add_index_if_missing`('audit_logs', 'idx_audit_logs_action', 'INDEX `idx_audit_logs_action` (`action`)');
CALL `add_index_if_missing`('audit_logs', 'idx_audit_logs_ip_address', 'INDEX `idx_audit_logs_ip_address` (`ipAddress`)');
CALL `add_index_if_missing`('audit_logs', 'idx_audit_logs_created_at', 'INDEX `idx_audit_logs_created_at` (`createdAt`)');

ALTER TABLE `audit_logs`
  MODIFY COLUMN `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  MODIFY COLUMN `action` VARCHAR(120) NOT NULL,
  MODIFY COLUMN `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  MODIFY COLUMN `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS `security_events` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `eventType` VARCHAR(120) NOT NULL,
  `email` VARCHAR(160) NULL,
  `ipAddress` VARCHAR(64) NULL,
  `userAgent` VARCHAR(500) NULL,
  `details` JSON NULL,
  `severity` ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'low',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_security_events_event_type` (`eventType`),
  KEY `idx_security_events_email` (`email`),
  KEY `idx_security_events_ip_address` (`ipAddress`),
  KEY `idx_security_events_severity` (`severity`),
  KEY `idx_security_events_created_at` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CALL `add_column_if_missing`('contact_messages', 'userId', 'CHAR(36) NULL AFTER `id`');
CALL `add_index_if_missing`('contact_messages', 'idx_contact_messages_user_id', 'INDEX `idx_contact_messages_user_id` (`userId`)');
CALL `add_fk_if_missing`(
  'contact_messages',
  'fk_contact_messages_user_id',
  'FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE SET NULL'
);

CALL `add_column_if_missing`('prayer_requests', 'userId', 'CHAR(36) NULL AFTER `id`');
CALL `add_index_if_missing`('prayer_requests', 'idx_prayer_requests_user_id', 'INDEX `idx_prayer_requests_user_id` (`userId`)');
CALL `add_fk_if_missing`(
  'prayer_requests',
  'fk_prayer_requests_user_id',
  'FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE SET NULL'
);

CALL `add_column_if_missing`('donations', 'userId', 'CHAR(36) NULL AFTER `id`');
CALL `add_index_if_missing`('donations', 'idx_donations_user_id', 'INDEX `idx_donations_user_id` (`userId`)');
CALL `add_fk_if_missing`(
  'donations',
  'fk_donations_user_id',
  'FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE SET NULL'
);

DROP PROCEDURE IF EXISTS `add_column_if_missing`;
DROP PROCEDURE IF EXISTS `add_index_if_missing`;
DROP PROCEDURE IF EXISTS `add_unique_email_if_missing`;
DROP PROCEDURE IF EXISTS `add_fk_if_missing`;
