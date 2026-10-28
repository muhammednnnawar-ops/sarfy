<?php
/**
 * Sarfy - نقطة الدخول الرئيسية للمجلد
 * تُقدّم التطبيق (index.html) عند فتح الرابط https://novelallin.com/sarfy/ مباشرة
 * دون الحاجة لكتابة index.html في العنوان
 */
if (is_file(__DIR__ . '/index.html')) {
    header('Content-Type: text/html; charset=UTF-8');
    // لا تخزين طويل للتطبيق نفسه حتى تصلك التحديثات بسرعة (الخدمة تعمل offline عبر Service Worker)
    header('Cache-Control: no-store, max-age=0');
    readfile(__DIR__ . '/index.html');
    exit;
}

http_response_code(404);
header('Content-Type: text/html; charset=UTF-8');
echo '<!doctype html><meta charset="utf-8"><p style="font-family:sans-serif;text-align:center;margin-top:40px">لم يتم العثور على ملف التطبيق index.html</p>';
