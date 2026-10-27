-- ============================================================
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

INSERT INTO user_app_state (user_id, state_json) VALUES ('user_1', '{"userProfile":{"fullName":"مستخدم صرفي","email":"user@sarfy.app","role":"user","currency":"ج.م","monthlyIncomeTarget":25000,"monthlyBudgetTarget":12000,"avatarSeed":"صر","createdAt":"2026-10-27","lastLogin":"2026-10-27","isRegistered":true},"accounts":[{"id":"acc_1","name":"محفظة كاش","type":"كاش","opening":3000,"status":"نشط","notes":"مصاريف نقدية يومية"},{"id":"acc_2","name":"حساب البنك الأهلي","type":"حساب بنكي","opening":25000,"status":"نشط","notes":"الحساب الرئيسي لتحويل الراتب"},{"id":"acc_3","name":"فودافون كاش","type":"محفظة إلكترونية","opening":1500,"status":"نشط","notes":"مدفوعات سريعة وفريلانس"}],"income":[{"id":"inc_1","date":"2026-10-02","source":"الأهلي","desc":"راتب شهري","category":"راتب","amount":18000,"accountId":"acc_2","method":"تحويل بنكي","status":"مستلم","expectedType":"فعلي","expectedDate":"2026-10-02","notes":"استلام راتب العمل"},{"id":"inc_2","date":"2026-10-17","source":"فودافون كاش","desc":"فريلانس تطوير واجهات","category":"عمل حر","amount":4000,"accountId":"acc_3","method":"محفظة إلكترونية","status":"مستلم","expectedType":"فعلي","expectedDate":"2026-10-17","notes":"دفعة مستلمة عن مشروع مستقل"},{"id":"inc_3","date":"2026-11-16","source":"الأهلي","desc":"راتب الشهر القادم","category":"راتب","amount":18000,"accountId":"acc_2","method":"تحويل بنكي","status":"متوقع","expectedType":"متوقع","expectedDate":"2026-11-16","notes":"مستحق في نهاية الشهر"}],"expenses":[{"id":"ex_1","date":"2026-10-07","desc":"إيجار السكن","mainCat":"منزل","subCat":"إيجار شهري","amount":4500,"accountId":"acc_2","method":"تحويل بنكي","necessity":"ضروري","recurrence":"متكرر","status":"مدفوع","notes":"تم الدفع للمالك"},{"id":"ex_2","date":"2026-10-12","desc":"مشتريات سوبر ماركت","mainCat":"طعام","subCat":"بقالة شهرية","amount":1200,"accountId":"acc_1","method":"كاش","necessity":"ضروري","recurrence":"متكرر","status":"مدفوع","notes":"خضار وفواكه ومؤن"},{"id":"ex_3","date":"2026-10-19","desc":"اشتراك نتفليكس","mainCat":"ترفيه","subCat":"اشتراك شهري","amount":250,"accountId":"acc_3","method":"محفظة إلكترونية","necessity":"غير ضروري","recurrence":"متكرر","status":"مدفوع","notes":"باقة العائلة"},{"id":"ex_4","date":"2026-10-22","desc":"تفويلة بنزين","mainCat":"مواصلات","subCat":"وقود السيارة","amount":600,"accountId":"acc_1","method":"كاش","necessity":"ضروري","recurrence":"متكرر","status":"مدفوع","notes":"بنزين 95"}],"transfers":[{"id":"tr_1","date":"2026-10-15","fromAccountId":"acc_2","toAccountId":"acc_1","amount":2000,"fee":0,"status":"مكتمل","notes":"سحب كاش من الـ ATM للمصروف"}],"debtsOwed":[{"id":"debto_1","person":"أحمد","desc":"سداد جزء من قرض شخصي","original":5000,"paid":2000,"startDate":"2026-09-27","dueDate":"2026-11-26","status":"مدفوع جزئيًا","accountId":"acc_2","notes":"المتبقي 3000 ج.م"}],"debtsReceivable":[{"id":"debtr_1","person":"مينا","desc":"سلفة مشروع عمل","original":1200,"received":0,"startDate":"2026-10-12","dueDate":"2026-11-11","status":"مفتوح","probability":"عالية","notes":"سيتم السداد منتصف الشهر"}],"subscriptions":[{"id":"sub_1","name":"نتفليكس","type":"ترفيه","value":250,"intervalValue":1,"intervalUnit":"شهر","startDate":"2026-08-28","nextRenewal":"2026-11-18","accountId":"acc_3","autoRenew":true,"status":"نشط","lastPayment":"2026-10-19","notes":"تجديد شهري تلقائي"},{"id":"sub_2","name":"حلاقة","type":"عناية شخصية","value":150,"intervalValue":3,"intervalUnit":"أسبوع","startDate":"2026-09-17","nextRenewal":"2026-10-30","accountId":"acc_1","autoRenew":false,"status":"نشط","lastPayment":"2026-10-09","notes":"صالون الحلاقة كل 3 أسابيع"},{"id":"sub_3","name":"iCloud","type":"تخزين سحابي","value":33,"intervalValue":1,"intervalUnit":"شهر","startDate":"2026-07-29","nextRenewal":"2026-11-11","accountId":"acc_2","autoRenew":true,"status":"نشط","lastPayment":"2026-10-12","notes":"مساحة تخزين 50 جيجا"},{"id":"sub_4","name":"تنظيف جير الأسنان","type":"صحة ورياضة","value":400,"intervalValue":6,"intervalUnit":"شهر","startDate":"2026-06-29","nextRenewal":"2026-12-26","accountId":"acc_2","autoRenew":false,"status":"نشط","lastPayment":"2026-06-29","notes":"متابعة دورية كل 6 أشهر"}],"upcoming":[{"id":"upc_1","name":"إيجار السكن القادم","type":"إيجار","amount":4500,"dueDate":"2026-11-06","accountId":"acc_2","priority":"عالية","status":"قادم","recurring":true,"source":"المالك","notes":"إيجار الشهر الجديد"},{"id":"upc_2","name":"قسط الموبايل","type":"قسط","amount":800,"dueDate":"2026-11-02","accountId":"acc_2","priority":"متوسطة","status":"قادم","recurring":false,"source":"فاليو","notes":"القسط الرابع"}],"expectedIncome":[{"id":"expinc_1","source":"شركة الأمل","client":"أ. طارق","desc":"مشروع تصميم هوية","amount":6000,"probability":0.6,"expectedDate":"2026-11-10","accountId":"acc_2","status":"محتمل","actualReceived":null,"notes":"بانتهاء مرحلة التسليم النهائي"}],"goals":[{"id":"goal_1","name":"صندوق الطوارئ","type":"صندوق طوارئ","target":30000,"current":9000,"startDate":"2026-07-29","targetDate":"2027-07-24","priority":"عالية","status":"جاري","accountId":"acc_2","notes":"تغطية مصاريف 6 أشهر"},{"id":"goal_2","name":"رحلة الساحل الشمالي","type":"سفر","target":8000,"current":8000,"startDate":"2026-08-28","targetDate":"2026-10-22","priority":"متوسطة","status":"مكتمل","accountId":"acc_1","notes":"اكتمل المبلغ بالكامل وتم السفر"}],"settings":{"currency":"ج.م","incomeCats":["راتب","عمل حر","مشروع","مكافأة","هدية","استثمار","بيع","أخرى"],"expenseCats":["طعام","مواصلات","منزل","فواتير","اتصالات وإنترنت","صحة","تعليم","ترفيه","تسوق","ملابس","عمل","هدايا","سفر","أخرى"],"categoryBudgets":{"طعام":2000,"ترفيه":500}}}') ON DUPLICATE KEY UPDATE state_json = VALUES(state_json);

INSERT INTO accounts VALUES ('acc_1', 'user_1', 'محفظة كاش', 'كاش', 3000, 'نشط', 'مصاريف نقدية يومية') ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO accounts VALUES ('acc_2', 'user_1', 'حساب البنك الأهلي', 'حساب بنكي', 25000, 'نشط', 'الحساب الرئيسي لتحويل الراتب') ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO accounts VALUES ('acc_3', 'user_1', 'فودافون كاش', 'محفظة إلكترونية', 1500, 'نشط', 'مدفوعات سريعة وفريلانس') ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO income VALUES ('inc_1', 'user_1', '2026-10-02', 'الأهلي', 'راتب شهري', 'راتب', 18000, 'acc_2', 'تحويل بنكي', 'مستلم', 'فعلي', '2026-10-02', 'استلام راتب العمل') ON DUPLICATE KEY UPDATE source=VALUES(source);
INSERT INTO income VALUES ('inc_2', 'user_1', '2026-10-17', 'فودافون كاش', 'فريلانس تطوير واجهات', 'عمل حر', 4000, 'acc_3', 'محفظة إلكترونية', 'مستلم', 'فعلي', '2026-10-17', 'دفعة مستلمة عن مشروع مستقل') ON DUPLICATE KEY UPDATE source=VALUES(source);
INSERT INTO income VALUES ('inc_3', 'user_1', '2026-11-16', 'الأهلي', 'راتب الشهر القادم', 'راتب', 18000, 'acc_2', 'تحويل بنكي', 'متوقع', 'متوقع', '2026-11-16', 'مستحق في نهاية الشهر') ON DUPLICATE KEY UPDATE source=VALUES(source);
INSERT INTO expenses VALUES ('ex_1', 'user_1', '2026-10-07', 'إيجار السكن', 'منزل', 'إيجار شهري', 4500, 'acc_2', 'تحويل بنكي', 'ضروري', 'متكرر', 'مدفوع', 'تم الدفع للمالك') ON DUPLICATE KEY UPDATE description=VALUES(description);
INSERT INTO expenses VALUES ('ex_2', 'user_1', '2026-10-12', 'مشتريات سوبر ماركت', 'طعام', 'بقالة شهرية', 1200, 'acc_1', 'كاش', 'ضروري', 'متكرر', 'مدفوع', 'خضار وفواكه ومؤن') ON DUPLICATE KEY UPDATE description=VALUES(description);
INSERT INTO expenses VALUES ('ex_3', 'user_1', '2026-10-19', 'اشتراك نتفليكس', 'ترفيه', 'اشتراك شهري', 250, 'acc_3', 'محفظة إلكترونية', 'غير ضروري', 'متكرر', 'مدفوع', 'باقة العائلة') ON DUPLICATE KEY UPDATE description=VALUES(description);
INSERT INTO expenses VALUES ('ex_4', 'user_1', '2026-10-22', 'تفويلة بنزين', 'مواصلات', 'وقود السيارة', 600, 'acc_1', 'كاش', 'ضروري', 'متكرر', 'مدفوع', 'بنزين 95') ON DUPLICATE KEY UPDATE description=VALUES(description);
INSERT INTO transfers VALUES ('tr_1', 'user_1', '2026-10-15', 'acc_2', 'acc_1', 2000, 0, 'مكتمل', 'سحب كاش من الـ ATM للمصروف') ON DUPLICATE KEY UPDATE amount=VALUES(amount);
INSERT INTO subscriptions VALUES ('sub_1', 'user_1', 'نتفليكس', 'ترفيه', 250, 1, 'شهر', '2026-08-28', '2026-11-18', 'acc_3', 1, 'نشط', '2026-10-19', 'تجديد شهري تلقائي') ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO subscriptions VALUES ('sub_2', 'user_1', 'حلاقة', 'عناية شخصية', 150, 3, 'أسبوع', '2026-09-17', '2026-10-30', 'acc_1', 0, 'نشط', '2026-10-09', 'صالون الحلاقة كل 3 أسابيع') ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO subscriptions VALUES ('sub_3', 'user_1', 'iCloud', 'تخزين سحابي', 33, 1, 'شهر', '2026-07-29', '2026-11-11', 'acc_2', 1, 'نشط', '2026-10-12', 'مساحة تخزين 50 جيجا') ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO subscriptions VALUES ('sub_4', 'user_1', 'تنظيف جير الأسنان', 'صحة ورياضة', 400, 6, 'شهر', '2026-06-29', '2026-12-26', 'acc_2', 0, 'نشط', '2026-06-29', 'متابعة دورية كل 6 أشهر') ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO debts_owed VALUES ('debto_1', 'user_1', 'أحمد', 'سداد جزء من قرض شخصي', 5000, 2000, '2026-09-27', '2026-11-26', 'مدفوع جزئيًا', 'acc_2', 'المتبقي 3000 ج.م') ON DUPLICATE KEY UPDATE person=VALUES(person);
INSERT INTO debts_receivable VALUES ('debtr_1', 'user_1', 'مينا', 'سلفة مشروع عمل', 1200, 0, '2026-10-12', '2026-11-11', 'عالية', 'مفتوح', 'سيتم السداد منتصف الشهر') ON DUPLICATE KEY UPDATE person=VALUES(person);
INSERT INTO upcoming VALUES ('upc_1', 'user_1', 'إيجار السكن القادم', 'إيجار', 4500, '2026-11-06', 'acc_2', 'عالية', 'قادم', 1, 'المالك', 'إيجار الشهر الجديد') ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO upcoming VALUES ('upc_2', 'user_1', 'قسط الموبايل', 'قسط', 800, '2026-11-02', 'acc_2', 'متوسطة', 'قادم', 0, 'فاليو', 'القسط الرابع') ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO expected_income VALUES ('expinc_1', 'user_1', 'شركة الأمل', 'أ. طارق', 'مشروع تصميم هوية', 6000, 0.6, '2026-11-10', 'acc_2', 'محتمل', NULL, 'بانتهاء مرحلة التسليم النهائي') ON DUPLICATE KEY UPDATE source=VALUES(source);
INSERT INTO goals VALUES ('goal_1', 'user_1', 'صندوق الطوارئ', 'صندوق طوارئ', 30000, 9000, '2026-07-29', '2027-07-24', 'عالية', 'جاري', 'acc_2', 'تغطية مصاريف 6 أشهر') ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO goals VALUES ('goal_2', 'user_1', 'رحلة الساحل الشمالي', 'سفر', 8000, 8000, '2026-08-28', '2026-10-22', 'متوسطة', 'مكتمل', 'acc_1', 'اكتمل المبلغ بالكامل وتم السفر') ON DUPLICATE KEY UPDATE name=VALUES(name);

SET FOREIGN_KEY_CHECKS = 1;
