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
    <rect width="180" height="180" rx="42" fill="#0A0F1D"/>
    <rect x="8" y="8" width="164" height="164" rx="36" fill="none" stroke="#10B981" stroke-width="3" stroke-opacity="0.4"/>
    <path d="M 52 98 C 52 70 76 56 108 56 C 134 56 144 72 144 86 C 144 100 130 108 102 108 L 52 108" stroke="#10B981" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <circle cx="106" cy="82" r="10" fill="#F59E0B"/>
    <path d="M 52 108 C 52 130 72 144 96 144 C 116 144 130 132 130 118" stroke="#38BDF8" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
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
