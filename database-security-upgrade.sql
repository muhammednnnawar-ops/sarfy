-- ============================================================
-- Sarfy (صرفي) - ترقية أمان قاعدة البيانات (تُنفَّذ مرة واحدة من phpMyAdmin)
-- آمنة على البيانات الحالية: لا تحذف أي بيانات مستخدمين
-- ============================================================

-- 1) حد محاولات الدخول الفاشلة لكل حساب (10 محاولات / 15 دقيقة)
--    الكود يعمل بدونها، لكنها تفعّل الحماية لكل حساب بالإضافة لحماية الـ IP.
--    إن ظهر خطأ "Table doesn't exist" فلا مشكلة: الجدول سيُنشأ تلقائياً بالعمود الجديد.
--    إن ظهر خطأ "Duplicate column name" فالعمود موجود بالفعل.
ALTER TABLE login_attempts
  ADD COLUMN identifier VARCHAR(190) NULL AFTER ip_address,
  ADD KEY idx_identifier_time (identifier, attempted_at);


-- 2) فحص (قراءة فقط): هل توجد حسابات التجربة ذات كلمات المرور المعروفة؟
SELECT id, email, role, status, created_at, last_login
FROM users
WHERE LOWER(email) IN ('admin@sarfy.app', 'client@sarfy.app');

-- 3) فحص (قراءة فقط): من يملك صلاحيات المالك أو المشرف حالياً؟
SELECT id, email, role, status, created_at, last_login
FROM users
WHERE role IN ('owner', 'admin')
ORDER BY created_at;

-- 4) إيقاف حسابات التجربة — نفّذه فقط إذا أظهر الاستعلام (2) حسابات لا يستخدمها أحد فعلياً
--    (كلمة مرورها demo1234 والرمز 1234 منشوران في README). الإيقاف لا يحذف بياناتها ويمكن التراجع عنه.
-- UPDATE users SET status = 'suspended' WHERE LOWER(email) IN ('admin@sarfy.app', 'client@sarfy.app');

-- 5) اختياري: تسجيل خروج الجلسات الأقدم من 30 يوماً فوراً (الكود يفعل ذلك تلقائياً مع الوقت)
-- DELETE FROM user_sessions WHERE created_at < (NOW() - INTERVAL 30 DAY);
