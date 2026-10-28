<?php
// انسخ هذا الملف باسم config.local.php على السيرفر وضع فيه القيم الحقيقية.
// config.local.php مستثنى من Git، فلا تُرفع كلمات المرور ومفتاح التشفير على GitHub.
// تنبيه: DB_ENCRYPTION_KEY يجب أن يبقى نفس المفتاح المستخدم حالياً، وإلا تعذر فك تشفير البيانات المحفوظة.

define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'cpaneluser_sarfy');
define('DB_USER', 'cpaneluser_admin');
define('DB_PASS', 'كلمة_مرور_قاعدة_البيانات');
define('DB_ENCRYPTION_KEY', 'نفس_مفتاح_التشفير_الحالي_على_السيرفر');
define('APP_DEBUG', false);
