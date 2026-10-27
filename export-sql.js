import fs from 'fs';
import { createInitialData } from './src/data.js';

const data = createInitialData();

let sql = `-- ============================================================
-- Sarfy (صرفي) Financial Database Schema & Seed Data (MySQL)
-- الترميز: utf8mb4_unicode_ci
-- متوافق تماماً مع phpMyAdmin و HostArmada cPanel LiteSpeed / MySQL
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 0. جدول المستخدمين (المصادقة وإدارة الحسابات والأدوار)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(64) UNIQUE NOT NULL,
  email VARCHAR(128) UNIQUE NOT NULL,
  full_name VARCHAR(128) NOT NULL,
  currency VARCHAR(16) DEFAULT 'ج.م',
  pin_hash VARCHAR(255) NULL,
  password_hash VARCHAR(255) NULL,
  role VARCHAR(32) DEFAULT 'user',
  status VARCHAR(32) DEFAULT 'active',
  avatar_seed VARCHAR(16) DEFAULT 'ص',
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_u_email (email),
  INDEX idx_u_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 0.1 جدول الحالة الكاملة للتطبيق (المزامنة والنسخ الاحتياطي التلقائي)
CREATE TABLE IF NOT EXISTS user_app_state (
  user_id VARCHAR(64) PRIMARY KEY,
  state_json LONGTEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1. جدول الحسابات والمحافظ
CREATE TABLE IF NOT EXISTS accounts (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) DEFAULT 'user_1',
  name VARCHAR(128) NOT NULL,
  type VARCHAR(64) NOT NULL,
  opening DECIMAL(15,2) DEFAULT 0.00,
  status VARCHAR(32) DEFAULT 'نشط',
  notes TEXT,
  INDEX idx_acc_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. جدول الدخل
CREATE TABLE IF NOT EXISTS income (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) DEFAULT 'user_1',
  date DATE NOT NULL,
  source VARCHAR(128) NOT NULL,
  description TEXT,
  category VARCHAR(64) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  account_id VARCHAR(64),
  method VARCHAR(64),
  status VARCHAR(32) DEFAULT 'مستلم',
  expected_type VARCHAR(32) DEFAULT 'فعلي',
  expected_date DATE,
  notes TEXT,
  INDEX idx_inc_user (user_id),
  INDEX idx_inc_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. جدول المصروفات
CREATE TABLE IF NOT EXISTS expenses (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) DEFAULT 'user_1',
  date DATE NOT NULL,
  description VARCHAR(255) NOT NULL,
  main_cat VARCHAR(64) NOT NULL,
  sub_cat VARCHAR(64),
  amount DECIMAL(15,2) NOT NULL,
  account_id VARCHAR(64),
  method VARCHAR(64),
  necessity VARCHAR(32) DEFAULT 'ضروري',
  recurrence VARCHAR(32) DEFAULT 'متكرر',
  status VARCHAR(32) DEFAULT 'مدفوع',
  notes TEXT,
  INDEX idx_exp_user (user_id),
  INDEX idx_exp_date (date),
  INDEX idx_exp_cat (main_cat)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. جدول التحويلات
CREATE TABLE IF NOT EXISTS transfers (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) DEFAULT 'user_1',
  date DATE NOT NULL,
  from_account_id VARCHAR(64) NOT NULL,
  to_account_id VARCHAR(64) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  fee DECIMAL(15,2) DEFAULT 0.00,
  status VARCHAR(32) DEFAULT 'مكتمل',
  notes TEXT,
  INDEX idx_tr_user (user_id),
  INDEX idx_tr_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. جدول ديون عليّ للآخرين
CREATE TABLE IF NOT EXISTS debts_owed (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) DEFAULT 'user_1',
  person VARCHAR(128) NOT NULL,
  description TEXT,
  original DECIMAL(15,2) NOT NULL,
  paid DECIMAL(15,2) DEFAULT 0.00,
  start_date DATE,
  due_date DATE,
  status VARCHAR(32) DEFAULT 'مفتوح',
  account_id VARCHAR(64),
  notes TEXT,
  INDEX idx_debto_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. جدول مستحقات لي عند الآخرين
CREATE TABLE IF NOT EXISTS debts_receivable (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) DEFAULT 'user_1',
  person VARCHAR(128) NOT NULL,
  description TEXT,
  original DECIMAL(15,2) NOT NULL,
  received DECIMAL(15,2) DEFAULT 0.00,
  start_date DATE,
  due_date DATE,
  probability VARCHAR(32) DEFAULT 'متوسطة',
  status VARCHAR(32) DEFAULT 'مفتوح',
  notes TEXT,
  INDEX idx_debtr_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. جدول الاشتراكات الدورية
CREATE TABLE IF NOT EXISTS subscriptions (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) DEFAULT 'user_1',
  name VARCHAR(128) NOT NULL,
  type VARCHAR(64),
  value DECIMAL(15,2) NOT NULL,
  interval_value INT DEFAULT 1,
  interval_unit VARCHAR(32) DEFAULT 'شهر',
  start_date DATE,
  next_renewal DATE,
  account_id VARCHAR(64),
  auto_renew TINYINT(1) DEFAULT 1,
  status VARCHAR(32) DEFAULT 'نشط',
  last_payment DATE,
  notes TEXT,
  INDEX idx_sub_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. جدول الالتزامات القادمة
CREATE TABLE IF NOT EXISTS upcoming (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) DEFAULT 'user_1',
  name VARCHAR(128) NOT NULL,
  type VARCHAR(64),
  amount DECIMAL(15,2) NOT NULL,
  due_date DATE,
  account_id VARCHAR(64),
  priority VARCHAR(32) DEFAULT 'متوسطة',
  status VARCHAR(32) DEFAULT 'قادم',
  recurring TINYINT(1) DEFAULT 0,
  source VARCHAR(128),
  notes TEXT,
  INDEX idx_upc_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. جدول الدخل المتوقع
CREATE TABLE IF NOT EXISTS expected_income (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) DEFAULT 'user_1',
  source VARCHAR(128) NOT NULL,
  client VARCHAR(128),
  description TEXT,
  amount DECIMAL(15,2) NOT NULL,
  probability DECIMAL(4,2) DEFAULT 0.50,
  expected_date DATE,
  account_id VARCHAR(64),
  status VARCHAR(32) DEFAULT 'محتمل',
  actual_received DECIMAL(15,2),
  notes TEXT,
  INDEX idx_expinc_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. جدول الأهداف المالية
CREATE TABLE IF NOT EXISTS goals (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) DEFAULT 'user_1',
  name VARCHAR(128) NOT NULL,
  type VARCHAR(64),
  target DECIMAL(15,2) NOT NULL,
  current DECIMAL(15,2) DEFAULT 0.00,
  start_date DATE,
  target_date DATE,
  priority VARCHAR(32) DEFAULT 'متوسطة',
  status VARCHAR(32) DEFAULT 'قيد التنفيذ',
  account_id VARCHAR(64),
  notes TEXT,
  INDEX idx_goal_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- حسابات النظام الافتراضية المحفوظة في قاعدة البيانات (MySQL Users Credentials)
-- الحساب 1: مالك التطبيق (admin@sarfy.app) | كلمة المرور: demo1234 | الرمز السري: 1234
-- الحساب 2: عميل تجريبي (client@sarfy.app) | كلمة المرور: demo1234 | الرمز السري: 1234
-- ============================================================
INSERT INTO users (id, username, email, full_name, currency, pin_hash, password_hash, role, status, avatar_seed) 
VALUES 
  ('admin_1', 'admin', 'admin@sarfy.app', 'مالك التطبيق', 'ج.م', 'ecf66a0c932e3c4cd23c10c6ca881d8976bc240372714f5600970aca009fc7be', '17cd0f7a0f658c47e00a8150b0ca93c4a3792ca00fe5e8e5b09c27b762cf244f', 'owner', 'active', 'م'),
  ('user_1', 'client', 'client@sarfy.app', 'عميل تجريبي', 'ج.م', 'ecf66a0c932e3c4cd23c10c6ca881d8976bc240372714f5600970aca009fc7be', '17cd0f7a0f658c47e00a8150b0ca93c4a3792ca00fe5e8e5b09c27b762cf244f', 'user', 'active', 'ع')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), role = VALUES(role), email = VALUES(email);

`;

// إضافة إدراج الحالة الكاملة في user_app_state
const stateEscaped = JSON.stringify(data).replace(/'/g, "\\'");
sql += `INSERT INTO user_app_state (user_id, state_json) VALUES ('user_1', '${stateEscaped}') ON DUPLICATE KEY UPDATE state_json = VALUES(state_json);\n\n`;

data.accounts.forEach(a => {
  sql += `INSERT INTO accounts VALUES ('${a.id}', 'user_1', '${a.name}', '${a.type}', ${a.opening}, '${a.status}', '${a.notes || ''}') ON DUPLICATE KEY UPDATE name=VALUES(name);\n`;
});

data.income.forEach(i => {
  sql += `INSERT INTO income VALUES ('${i.id}', 'user_1', '${i.date}', '${i.source}', '${i.desc || ''}', '${i.category}', ${i.amount}, '${i.accountId}', '${i.method}', '${i.status}', '${i.expectedType}', ${i.expectedDate ? "'" + i.expectedDate + "'" : 'NULL'}, '${i.notes || ''}') ON DUPLICATE KEY UPDATE source=VALUES(source);\n`;
});

data.expenses.forEach(e => {
  sql += `INSERT INTO expenses VALUES ('${e.id}', 'user_1', '${e.date}', '${e.desc}', '${e.mainCat}', '${e.subCat || ''}', ${e.amount}, '${e.accountId}', '${e.method}', '${e.necessity}', '${e.recurrence}', '${e.status}', '${e.notes || ''}') ON DUPLICATE KEY UPDATE description=VALUES(description);\n`;
});

data.transfers.forEach(t => {
  sql += `INSERT INTO transfers VALUES ('${t.id}', 'user_1', '${t.date}', '${t.fromAccountId}', '${t.toAccountId}', ${t.amount}, ${t.fee || 0}, '${t.status}', '${t.notes || ''}') ON DUPLICATE KEY UPDATE amount=VALUES(amount);\n`;
});

data.subscriptions.forEach(s => {
  sql += `INSERT INTO subscriptions VALUES ('${s.id}', 'user_1', '${s.name}', '${s.type}', ${s.value}, ${s.intervalValue}, '${s.intervalUnit}', '${s.startDate || s.lastPayment}', '${s.nextRenewal}', '${s.accountId}', ${s.autoRenew ? 1 : 0}, '${s.status}', '${s.lastPayment}', '${s.notes || ''}') ON DUPLICATE KEY UPDATE name=VALUES(name);\n`;
});

data.debtsOwed.forEach(d => {
  sql += `INSERT INTO debts_owed VALUES ('${d.id}', 'user_1', '${d.person}', '${d.desc || ''}', ${d.original}, ${d.paid || 0}, '${d.startDate}', '${d.dueDate}', '${d.status}', '${d.accountId}', '${d.notes || ''}') ON DUPLICATE KEY UPDATE person=VALUES(person);\n`;
});

data.debtsReceivable.forEach(d => {
  sql += `INSERT INTO debts_receivable VALUES ('${d.id}', 'user_1', '${d.person}', '${d.desc || ''}', ${d.original}, ${d.received || 0}, '${d.startDate || d.dueDate}', '${d.dueDate}', '${d.probability}', '${d.status}', '${d.notes || ''}') ON DUPLICATE KEY UPDATE person=VALUES(person);\n`;
});

data.upcoming.forEach(u => {
  sql += `INSERT INTO upcoming VALUES ('${u.id}', 'user_1', '${u.name}', '${u.type}', ${u.amount}, '${u.dueDate}', '${u.accountId}', '${u.priority}', '${u.status}', ${u.recurring ? 1 : 0}, '${u.source || ''}', '${u.notes || ''}') ON DUPLICATE KEY UPDATE name=VALUES(name);\n`;
});

data.expectedIncome.forEach(ei => {
  sql += `INSERT INTO expected_income VALUES ('${ei.id}', 'user_1', '${ei.source}', '${ei.client || ''}', '${ei.desc || ''}', ${ei.amount}, ${ei.probability}, '${ei.expectedDate}', '${ei.accountId}', '${ei.status}', ${ei.actualReceived !== null ? ei.actualReceived : 'NULL'}, '${ei.notes || ''}') ON DUPLICATE KEY UPDATE source=VALUES(source);\n`;
});

data.goals.forEach(g => {
  sql += `INSERT INTO goals VALUES ('${g.id}', 'user_1', '${g.name}', '${g.type}', ${g.target}, ${g.current || 0}, '${g.startDate}', '${g.targetDate}', '${g.priority}', '${g.status}', '${g.accountId}', '${g.notes || ''}') ON DUPLICATE KEY UPDATE name=VALUES(name);\n`;
});

sql += `\nSET FOREIGN_KEY_CHECKS = 1;\n`;

fs.writeFileSync('sarfy-database.sql', sql, 'utf-8');
console.log('✅ sarfy-database.sql generated successfully with users, state, and 10 tables!');
