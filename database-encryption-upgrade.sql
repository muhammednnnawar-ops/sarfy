-- ============================================================
-- Sarfy (صرفي) - Database Encryption Upgrade Script (phpMyAdmin)
-- قم بنسخ هذا الكود ولصقه داخل تبويب SQL في phpMyAdmin بقاعدة بياناتك
-- هذا السكربت يقوم بترقية وتوسيع أعمدة الجداول لتتسع لنصوص التشفير العسكري AES-256
-- دون حذف أو التأثير على أي بيانات موجودة مسبقاً (Zero Data Loss)
-- ============================================================

-- 0. ترقية جدول المستخدمين
ALTER TABLE users 
  MODIFY COLUMN full_name TEXT NOT NULL,
  MODIFY COLUMN avatar_seed VARCHAR(255) DEFAULT 'ص';

-- 1. ترقية جدول الحسابات والمحافظ
ALTER TABLE accounts 
  MODIFY COLUMN name TEXT NOT NULL,
  MODIFY COLUMN type VARCHAR(255) NOT NULL,
  MODIFY COLUMN notes TEXT;

-- 2. ترقية جدول الدخل
ALTER TABLE income 
  MODIFY COLUMN source TEXT NOT NULL,
  MODIFY COLUMN description TEXT,
  MODIFY COLUMN category VARCHAR(255) NOT NULL,
  MODIFY COLUMN method VARCHAR(255),
  MODIFY COLUMN notes TEXT;

-- 3. ترقية جدول المصروفات
ALTER TABLE expenses 
  MODIFY COLUMN description TEXT NOT NULL,
  MODIFY COLUMN main_cat VARCHAR(255) NOT NULL,
  MODIFY COLUMN sub_cat VARCHAR(255),
  MODIFY COLUMN method VARCHAR(255),
  MODIFY COLUMN notes TEXT;

-- 4. ترقية جدول التحويلات
ALTER TABLE transfers 
  MODIFY COLUMN notes TEXT;

-- 5. ترقية جدول ديون عليّ
ALTER TABLE debts_owed 
  MODIFY COLUMN person TEXT NOT NULL,
  MODIFY COLUMN description TEXT,
  MODIFY COLUMN notes TEXT;

-- 6. ترقية جدول مستحقات لي
ALTER TABLE debts_receivable 
  MODIFY COLUMN person TEXT NOT NULL,
  MODIFY COLUMN description TEXT,
  MODIFY COLUMN notes TEXT;

-- 7. ترقية جدول الاشتراكات الدورية
ALTER TABLE subscriptions 
  MODIFY COLUMN name TEXT NOT NULL,
  MODIFY COLUMN type VARCHAR(255),
  MODIFY COLUMN notes TEXT;

-- 8. ترقية جدول الالتزامات القادمة
ALTER TABLE upcoming 
  MODIFY COLUMN name TEXT NOT NULL,
  MODIFY COLUMN type VARCHAR(255),
  MODIFY COLUMN source TEXT,
  MODIFY COLUMN notes TEXT;

-- 9. ترقية جدول الدخل المتوقع
ALTER TABLE expected_income 
  MODIFY COLUMN source TEXT NOT NULL,
  MODIFY COLUMN client TEXT,
  MODIFY COLUMN description TEXT,
  MODIFY COLUMN notes TEXT;

-- 10. ترقية جدول الأهداف المالية
ALTER TABLE goals 
  MODIFY COLUMN name TEXT NOT NULL,
  MODIFY COLUMN type VARCHAR(255),
  MODIFY COLUMN notes TEXT;
