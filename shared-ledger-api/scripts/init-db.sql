-- =====================================================
-- 共享记账报销小程序 - MySQL 数据库初始化脚本
-- 数据库类型: MySQL 8.0
-- 字符集: utf8mb4
-- 存储引擎: InnoDB
-- =====================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO';

-- =====================================================
-- 1. 创建数据库
-- =====================================================
DROP DATABASE IF EXISTS `shared_ledger`;
CREATE DATABASE `shared_ledger`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_general_ci;

USE `shared_ledger`;

-- =====================================================
-- 2. users - 用户表
-- 存储用户基本信息，支持微信登录和手机号登录
-- =====================================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `openid` varchar(64) DEFAULT NULL COMMENT '微信openid，微信小程序用户唯一标识',
  `unionid` varchar(64) DEFAULT NULL COMMENT '微信unionid，微信开放平台唯一标识（跨应用）',
  `phone` varchar(20) DEFAULT NULL COMMENT '手机号，可用于手机号登录',
  `nickname` varchar(50) DEFAULT NULL COMMENT '用户昵称',
  `avatar` varchar(255) DEFAULT NULL COMMENT '用户头像URL',
  `status` tinyint unsigned NOT NULL DEFAULT '1' COMMENT '状态: 0-禁用, 1-正常',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_openid` (`openid`),
  UNIQUE KEY `uk_phone` (`phone`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='用户表';

-- =====================================================
-- 3. ledgers - 账本表
-- 存储账本信息，支持个人账本和报销账本类型
-- =====================================================
DROP TABLE IF EXISTS `ledgers`;
CREATE TABLE `ledgers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '账本ID',
  `name` varchar(50) NOT NULL COMMENT '账本名称',
  `description` varchar(200) DEFAULT NULL COMMENT '账本描述',
  `type` tinyint unsigned NOT NULL DEFAULT '1' COMMENT '类型: 1-个人账本, 2-报销账本',
  `invite_code` varchar(10) NOT NULL COMMENT '邀请码，6位随机字母数字组合，用于邀请他人加入',
  `creator_id` bigint unsigned NOT NULL COMMENT '创建者ID，关联users.id',
  `is_locked` tinyint unsigned NOT NULL DEFAULT '0' COMMENT '锁定状态: 0-未锁定, 1-已锁定，锁定后任何人无法修改或删除账目',
  `auto_lock_days` int unsigned DEFAULT NULL COMMENT '自动锁定天数(天)，可选值：7/30/90/180/NULL表示不自动锁定',
  `auto_lock_at` datetime DEFAULT NULL COMMENT '预计自动锁定时间，根据auto_lock_days自动计算',
  `locked_at` datetime DEFAULT NULL COMMENT '实际锁定时间，手动锁定或自动锁定时记录',
  `locked_by` bigint unsigned DEFAULT NULL COMMENT '锁定操作人ID',
  `status` tinyint unsigned NOT NULL DEFAULT '1' COMMENT '状态: 0-已删除, 1-正常',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_invite_code` (`invite_code`),
  KEY `idx_creator_id` (`creator_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_auto_lock_at` (`auto_lock_at`),
  CONSTRAINT `fk_ledgers_creator` FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='账本表';

-- =====================================================
-- 4. ledger_members - 账本成员关联表
-- 存储账本成员关系，一个用户可以在多个账本中拥有不同角色
-- =====================================================
DROP TABLE IF EXISTS `ledger_members`;
CREATE TABLE `ledger_members` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '成员记录ID',
  `ledger_id` bigint unsigned NOT NULL COMMENT '账本ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `role` tinyint unsigned NOT NULL DEFAULT '3' COMMENT '角色: 1-创建者, 2-管理员, 3-普通成员',
  `joined_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ledger_user` (`ledger_id`, `user_id`),
  KEY `idx_ledger_id` (`ledger_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_joined_at` (`joined_at`),
  CONSTRAINT `fk_members_ledger` FOREIGN KEY (`ledger_id`) REFERENCES `ledgers` (`id`),
  CONSTRAINT `fk_members_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='账本成员关联表';

-- =====================================================
-- 5. ledger_permissions - 成员权限表
-- 存储成员的详细权限配置，创建者拥有所有权限不使用此表
-- 权限级别: 0-不允许, 1-全部, 2-仅自己创建的
-- =====================================================
DROP TABLE IF EXISTS `ledger_permissions`;
CREATE TABLE `ledger_permissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '权限记录ID',
  `ledger_id` bigint unsigned NOT NULL COMMENT '账本ID',
  `member_id` bigint unsigned NOT NULL COMMENT '成员ID，关联ledger_members.id',
  `can_add` tinyint unsigned NOT NULL DEFAULT '1' COMMENT '添加账目权限: 0-不允许, 1-全部',
  `can_edit` tinyint unsigned NOT NULL DEFAULT '2' COMMENT '修改账目权限: 0-不允许, 1-全部, 2-仅自己',
  `can_delete` tinyint unsigned NOT NULL DEFAULT '2' COMMENT '删除账目权限: 0-不允许, 1-全部, 2-仅自己',
  `can_reimburse` tinyint unsigned NOT NULL DEFAULT '2' COMMENT '修改报销状态权限: 0-不允许, 1-全部, 2-仅自己',
  `can_export` tinyint unsigned NOT NULL DEFAULT '1' COMMENT '导出报表权限: 0-不允许, 1-全部',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ledger_member` (`ledger_id`, `member_id`),
  KEY `idx_ledger_id` (`ledger_id`),
  KEY `idx_member_id` (`member_id`),
  CONSTRAINT `fk_perms_ledger` FOREIGN KEY (`ledger_id`) REFERENCES `ledgers` (`id`),
  CONSTRAINT `fk_perms_member` FOREIGN KEY (`member_id`) REFERENCES `ledger_members` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='成员权限表';

-- =====================================================
-- 6. virtual_members - 虚拟成员表
-- 存储虚拟成员信息，用于不方便加入账本的人（如领导、客户、外部合作方）
-- 记账时可选择虚拟成员作为收支人
-- =====================================================
DROP TABLE IF EXISTS `virtual_members`;
CREATE TABLE `virtual_members` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '虚拟成员ID',
  `ledger_id` bigint unsigned NOT NULL COMMENT '账本ID',
  `name` varchar(50) NOT NULL COMMENT '虚拟成员名称（如王总、李经理、客户A）',
  `avatar` varchar(255) DEFAULT NULL COMMENT '头像URL，可从预设头像中选择',
  `created_by` bigint unsigned NOT NULL COMMENT '创建人ID',
  `status` tinyint unsigned NOT NULL DEFAULT '1' COMMENT '状态: 0-已删除, 1-正常',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_ledger_id` (`ledger_id`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `fk_virtual_ledger` FOREIGN KEY (`ledger_id`) REFERENCES `ledgers` (`id`),
  CONSTRAINT `fk_virtual_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='虚拟成员表';

-- =====================================================
-- 7. categories - 分类表
-- 存储收支分类信息，支持系统预设分类和账本自定义分类
-- ledger_id=0表示系统预设分类，所有账本可用
-- =====================================================
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '分类ID',
  `ledger_id` bigint unsigned NOT NULL DEFAULT '0' COMMENT '账本ID，0表示系统预设分类',
  `name` varchar(20) NOT NULL COMMENT '分类名称',
  `icon` varchar(50) DEFAULT NULL COMMENT '图标名称',
  `type` tinyint unsigned NOT NULL DEFAULT '1' COMMENT '类型: 1-支出, 2-收入',
  `sort_order` int unsigned NOT NULL DEFAULT '0' COMMENT '排序顺序',
  `is_system` tinyint unsigned NOT NULL DEFAULT '0' COMMENT '是否系统预设: 0-否, 1-是',
  `status` tinyint unsigned NOT NULL DEFAULT '1' COMMENT '状态: 0-已删除, 1-正常',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_ledger_id` (`ledger_id`),
  KEY `idx_type` (`type`),
  KEY `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='分类表';

-- =====================================================
-- 8. transactions - 账目表
-- 存储账目记录，支持收支类型和报销状态管理
-- =====================================================
DROP TABLE IF EXISTS `transactions`;
CREATE TABLE `transactions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '账目ID',
  `ledger_id` bigint unsigned NOT NULL COMMENT '账本ID',
  `user_id` bigint unsigned NOT NULL COMMENT '记录人ID（操作人）',
  `category_id` bigint unsigned NOT NULL COMMENT '分类ID',
  `amount` decimal(12,2) NOT NULL COMMENT '金额',
  `type` tinyint unsigned NOT NULL DEFAULT '1' COMMENT '类型: 1-支出, 2-收入',
  `transaction_date` date NOT NULL COMMENT '交易日期',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注说明',
  `payee_id` bigint unsigned DEFAULT NULL COMMENT '收支人ID，关联users.id或virtual_members.id',
  `is_virtual_payee` tinyint unsigned NOT NULL DEFAULT '0' COMMENT '收支人是否为虚拟成员: 0-否, 1-是',
  `reimburse_status` tinyint unsigned NOT NULL DEFAULT '0' COMMENT '报销状态: 0-不适用, 1-未报销, 2-已报销',
  `reimbursed_at` datetime DEFAULT NULL COMMENT '报销时间',
  `reimbursed_by` bigint unsigned DEFAULT NULL COMMENT '操作报销的用户ID',
  `status` tinyint unsigned NOT NULL DEFAULT '1' COMMENT '状态: 0-已删除, 1-正常',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_ledger_id` (`ledger_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_transaction_date` (`transaction_date`),
  KEY `idx_reimburse_status` (`reimburse_status`),
  KEY `idx_payee` (`payee_id`, `is_virtual_payee`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_trans_ledger` FOREIGN KEY (`ledger_id`) REFERENCES `ledgers` (`id`),
  CONSTRAINT `fk_trans_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_trans_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='账目表';

-- =====================================================
-- 9. transaction_images - 账目图片关联表
-- 存储账目关联的图片，支持最多6张发票/收据图片
-- =====================================================
DROP TABLE IF EXISTS `transaction_images`;
CREATE TABLE `transaction_images` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '图片记录ID',
  `transaction_id` bigint unsigned NOT NULL COMMENT '账目ID',
  `image_url` varchar(500) NOT NULL COMMENT '图片URL',
  `sort_order` int unsigned NOT NULL DEFAULT '0' COMMENT '排序顺序',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_transaction_id` (`transaction_id`),
  KEY `idx_sort_order` (`sort_order`),
  CONSTRAINT `fk_images_transaction` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='账目图片关联表';

-- =====================================================
-- 10. exports - 导出记录表
-- 存储导出记录，文件有效期7天，过期后自动清理
-- =====================================================
DROP TABLE IF EXISTS `exports`;
CREATE TABLE `exports` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '导出记录ID',
  `ledger_id` bigint unsigned NOT NULL COMMENT '账本ID',
  `user_id` bigint unsigned NOT NULL COMMENT '操作用户ID',
  `file_name` varchar(100) NOT NULL COMMENT '文件名',
  `file_url` varchar(500) NOT NULL COMMENT '文件下载URL',
  `file_size` int unsigned DEFAULT NULL COMMENT '文件大小(字节)',
  `start_date` date DEFAULT NULL COMMENT '导出开始日期',
  `end_date` date DEFAULT NULL COMMENT '导出结束日期',
  `filter_status` tinyint unsigned DEFAULT NULL COMMENT '筛选状态: 1-未报销, 2-已报销, NULL-全部',
  `status` tinyint unsigned NOT NULL DEFAULT '1' COMMENT '状态: 0-已过期, 1-有效',
  `expired_at` datetime NOT NULL COMMENT '过期时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_ledger_id` (`ledger_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_exports_ledger` FOREIGN KEY (`ledger_id`) REFERENCES `ledgers` (`id`),
  CONSTRAINT `fk_exports_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='导出记录表';

-- =====================================================
-- 11. 插入系统预设分类数据
-- =====================================================

-- 支出分类
INSERT INTO `categories` (`ledger_id`, `name`, `icon`, `type`, `sort_order`, `is_system`) VALUES
(0, '餐饮', 'food', 1, 1, 1),
(0, '交通', 'transport', 1, 2, 1),
(0, '住宿', 'hotel', 1, 3, 1),
(0, '办公用品', 'office', 1, 4, 1),
(0, '通讯', 'phone', 1, 5, 1),
(0, '差旅', 'travel', 1, 6, 1),
(0, '其他', 'other', 1, 7, 1);

-- 收入分类
INSERT INTO `categories` (`ledger_id`, `name`, `icon`, `type`, `sort_order`, `is_system`) VALUES
(0, '工资', 'salary', 2, 1, 1),
(0, '报销', 'reimburse', 2, 2, 1),
(0, '其他收入', 'other_income', 2, 3, 1);

-- =====================================================
-- 12. 创建索引优化查询性能
-- =====================================================

-- 为频繁查询场景创建复合索引

-- transactions表：按账本和时间范围查询
ALTER TABLE `transactions` ADD INDEX `idx_ledger_date` (`ledger_id`, `transaction_date`);

-- transactions表：按账本和报销状态查询
ALTER TABLE `transactions` ADD INDEX `idx_ledger_reimburse` (`ledger_id`, `reimburse_status`);

-- transactions表：按账本和分类查询统计
ALTER TABLE `transactions` ADD INDEX `idx_ledger_category` (`ledger_id`, `category_id`);

-- ledger_members表：查询用户参与的所有账本
ALTER TABLE `ledger_members` ADD INDEX `idx_user_ledger` (`user_id`, `ledger_id`);

-- =====================================================
-- 13. 创建事件调度器用于自动锁定检查（可选）
-- =====================================================

SET GLOBAL event_scheduler = ON;

DELIMITER $$

DROP EVENT IF EXISTS `auto_lock_ledgers`$$
CREATE EVENT `auto_lock_ledgers`
ON SCHEDULE EVERY 1 MINUTE
STARTS CURRENT_TIMESTAMP
DO
BEGIN
  UPDATE `ledgers`
  SET `is_locked` = 1,
      `locked_at` = NOW(),
      `locked_by` = creator_id
  WHERE `is_locked` = 0
    AND `auto_lock_at` IS NOT NULL
    AND `auto_lock_at` <= NOW()
    AND `status` = 1;
END$$

DELIMITER ;

-- =====================================================
-- 14. 恢复外键检查
-- =====================================================
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- 初始化完成
-- =====================================================
