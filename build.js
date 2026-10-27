// Sarfy - Single-File Bundler Script
// يدمج كافة الكود البرمجي وملفات التنسيق والأيقونات في ملف index.html واحد ومستقل بالكامل
// متوافق مع خوادم LiteSpeed / HostArmada Speed Reaper ويعمل بلا إنترنت 100%

import fs from 'fs';
import path from 'path';
import * as esbuild from 'esbuild';

async function build() {
  console.log('⚡ بدء بناء تطبيق محفظتي كملف مستقل واحد (Single Standalone HTML)...');

  // 1. حزم كود الواجهة عبر esbuild
  const result = await esbuild.build({
    entryPoints: ['./src/main.jsx'],
    bundle: true,
    minify: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    target: ['es2020'],
    define: {
      'process.env.NODE_ENV': '"production"'
    }
  });

  const bundledJs = result.outputFiles[0].text;
  console.log(`✅ تم حزم كود JavaScript بنجاح (الحجم: ${(bundledJs.length / 1024).toFixed(1)} KB)`);

  // 2. قراءة كود التنسيق CSS
  const css = fs.readFileSync('./src/styles.css', 'utf-8');
  console.log(`✅ تم قراءة كود CSS بنجاح (الحجم: ${(css.length / 1024).toFixed(1)} KB)`);

  // 3. أيقونة Apple Touch Icon بتنسيق Data URI مع شعار صرفي ثلاثي الأبعاد
  const appleTouchIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180">
    <defs>
      <linearGradient id="icon_bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0B132B" />
        <stop offset="50%" stopColor="#0A1D2D" />
        <stop offset="100%" stopColor="#042F2E" />
      </linearGradient>
      <linearGradient id="icon_border" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34D399" />
        <stop offset="50%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#06B6D4" />
      </linearGradient>
      <linearGradient id="icon_em" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#34D399" />
        <stop offset="50%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
      <linearGradient id="icon_cyan" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#06B6D4" />
        <stop offset="50%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#34D399" />
      </linearGradient>
      <linearGradient id="icon_gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFBEB" />
        <stop offset="40%" stopColor="#FCD34D" />
        <stop offset="80%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
    </defs>
    <rect width="180" height="180" rx="42" fill="url(#icon_bg)" stroke="url(#icon_border)" stroke-width="3"/>
    <g transform="translate(18, 18) scale(1.8)">
      <path d="M 23 43 C 23 30 35 23 48 23 C 62 23 66 30 66 37 C 66 44 58 47 46 47 L 20 47" stroke="url(#icon_em)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M 20 47 C 20 57 30 65 43 65 C 53 65 60 59 62 52" stroke="url(#icon_cyan)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <polygon points="46,28.5 51.5,35 46,41.5 40.5,35" fill="url(#icon_gold)"/>
      <circle cx="46" cy="35" r="1.8" fill="#FFFFFF"/>
      <circle cx="62" cy="52" r="2.5" fill="#38BDF8"/>
    </g>
  </svg>`;
  const appleTouchIconDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(appleTouchIconSvg)}`;

  // 4. إنشاء ملف HTML المستقل الواحد
  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>صرفي - نظام الإدارة المالية الذكي والتشفير الفينتك</title>
  <meta name="description" content="صرفي: تطبيق ويب ذكي لإدارة الأموال الشخصية، الدخل، المصروفات، والديون يعمل دون اتصال بتشفير AES-256">
  
  <!-- وسوم دعم iOS وتثبيت التطبيق على الآيفون PWA -->
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="صرفي">
  <meta name="application-name" content="صرفي">
  <meta name="theme-color" content="#0F172A">
  <link rel="apple-touch-icon" href="${appleTouchIconDataUri}">
  <link rel="icon" type="image/svg+xml" href="${appleTouchIconDataUri}">
  <link rel="manifest" href="./manifest.json">

  <!-- أنماط الهوية البصرية والتصميم المدمجة بالكامل -->
  <style>
${css}
  </style>
</head>
<body>
  <div id="root">
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background-color: #0A0F1D; font-family: 'Cairo', sans-serif; direction: rtl;">
      <div style="text-align: center; color: #F8FAFC;">
        <div style="width: 64px; height: 64px; border-radius: 18px; background: linear-gradient(135deg, #10B981 0%, #064E3B 100%); color: #fff; font-size: 34px; font-weight: bold; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; box-shadow: 0 0 25px rgba(16, 185, 129, 0.5);">ص</div>
        <div style="font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">صرفي</div>
        <div style="font-size: 13px; color: #94A3B8; margin-top: 6px;">جاري تشغيل الخزنة المالية المشفرة...</div>
      </div>
    </div>
  </div>

  <!-- تسجيل Service Worker عند العمل على خادم الويب (مثل HostArmada LiteSpeed) -->
  <script>
    if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
      });
    }
  </script>

  <!-- كود تطبيق React 18 المدمج بالكامل دون أي CDN خارجي -->
  <script>
${bundledJs}
  </script>
</body>
</html>`;

  fs.writeFileSync('./index.html', html, 'utf-8');
  console.log(`🎉 تم إنشاء ملف index.html بنجاح!`);
  console.log(`📦 الحجم الكلي للملف المستقل: ${(html.length / 1024).toFixed(1)} KB`);
}

build().catch(err => {
  console.error('❌ خطأ أثناء البناء:', err);
  process.exit(1);
});
