<?php
/**
 * ============================================================
 * Sarfy (صرفي) - Database Configuration File
 * إعدادات الاتصال بقاعدة بيانات MySQL (HostArmada Speed Reaper / cPanel)
 * ============================================================
 * يرجى تعديل المتغيرات أدناه بالبيانات التي قمت بإنشائها داخل cPanel:
 * 1. اسم قاعدة البيانات (DB_NAME)
 * 2. اسم المستخدم (DB_USER)
 * 3. كلمة المرور (DB_PASS)
 */

// خادم قاعدة البيانات (في استضافات cPanel الافتراضي دائماً localhost)
define('DB_HOST', 'localhost');

// منفذ الاتصال بـ MySQL (الافتراضي 3306)
define('DB_PORT', '3306');

// اسم قاعدة البيانات (مثال: cpaneluser_sarfy)
define('DB_NAME', 'sarfy_db');

// اسم مستخدم قاعدة البيانات (مثال: cpaneluser_admin)
define('DB_USER', 'sarfy_user');

// كلمة مرور مستخدم قاعدة البيانات
define('DB_PASS', 'your_password_here');

// ترميز النصوص ودعم اللغة العربية والإيموجي
define('DB_CHARSET', 'utf8mb4');

// مفتاح التشفير العسكري لقاعدة البيانات (AES-256-CBC Military-Grade Database Encryption Key)
// يتم تشفير كافة السجلات، العمليات المالية، المبالغ، والمحافظ داخل MySQL بهذا المفتاح
// يمكنك تخصيص هذا المفتاح بأي نص سري معقد تريده
define('DB_ENCRYPTION_KEY', 'sarfy_fintech_vault_aes256_super_secret_master_key_2026_hostarmada');

// تفعيل وضع التجربة والتصحيح (اجعله false في بيئة الإنتاج الحية)
define('APP_DEBUG', true);
