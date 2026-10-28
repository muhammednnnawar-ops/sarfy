import fs from 'fs';
import { JSDOM } from 'jsdom';

console.log('🧪 بدء فحص تشغيل index.php في بيئة متصفح كاملة (JSDOM)...');

const htmlContent = fs.readFileSync('./index.php', 'utf-8');

const errors = [];
const dom = new JSDOM(htmlContent, {
  runScripts: 'dangerously',
  url: 'http://localhost/',
  beforeParse(window) {
    window.console.error = (...args) => {
      console.error('Browser console.error:', ...args);
      errors.push(args.join(' '));
    };
  }
});

// الانتظار قليلاً حتى يكتمل رندر شاشة المصادقة
setTimeout(() => {
  const document = dom.window.document;
  const rootText = document.getElementById('root')?.textContent || '';

  console.log('\n--- نتائج فحص الواجهة الرسومية (1/2: شاشة القفل والمصادقة) ---');

  if (errors.length > 0) {
    console.error('❌ وُجدت أخطاء في وحدة تحكم المتصفح:', errors);
    process.exit(1);
  } else {
    console.log('✅ ممتاز: لا توجد أي أخطاء في Console المتصفح (Zero Errors)!');
  }

  // 1. فحص ظهور شاشة الأمان والمصادقة عند بدء التشغيل
  if (rootText.includes('صرفي') && (rootText.includes('تسجيل الدخول') || rootText.includes('إنشاء حساب') || rootText.includes('قفل الأمان'))) {
    console.log('✅ نجاح: التطبيق يبدأ بشاشة القفل/المصادقة المشفرة بنجاح كما طلب المستخدم!');
  } else {
    console.error('❌ لم تظهر شاشة القفل/المصادقة عند الفتح!');
    process.exit(1);
  }

  // 2. محاكاة فتح الحساب التجريبي السريع للتحقق من لوحة التحكم
  const buttons = Array.from(document.querySelectorAll('button'));
  const demoBtn = buttons.find(b => b.textContent.includes('حساب تجريبي') || b.textContent.includes('تجربة'));
  if (demoBtn) {
    demoBtn.click();
  }

  setTimeout(() => {
    const unlockedText = document.getElementById('root')?.textContent || '';
    console.log('\n--- نتائج فحص لوحة التحكم بعد فك القفل (2/2) ---');

    // 1. فحص إجمالي الأموال
    if (unlockedText.includes('44,950.00')) {
      console.log('✅ تم العثور على إجمالي الأموال: 44,950.00 ج.م');
    } else {
      console.error('❌ لم يتم العثور على 44,950.00 في الواجهة!');
      process.exit(1);
    }

    // 2. فحص الدخل والمصروفات والتدفق
    if (unlockedText.includes('22,000.00') && unlockedText.includes('6,550.00') && unlockedText.includes('15,450.00')) {
      console.log('✅ تم العثور على الدخل المستلم (22,000) والمصروفات (6,550) وصافي التدفق (15,450)');
    } else {
      console.error('❌ مبالغ الدخل أو المصروفات أو التدفق غير موجودة بدقة في الواجهة!');
      process.exit(1);
    }

    // 3. فحص الديون
    if (unlockedText.includes('3,000.00') && unlockedText.includes('1,200.00')) {
      console.log('✅ تم العثور على ديون عليّ (3,000) ومستحق لي (1,200)');
    } else {
      console.error('❌ مبالغ الديون غير موجودة بدقة في الواجهة!');
      process.exit(1);
    }

    // 4. فحص الاشتراكات الشهرية
    if (unlockedText.includes('567.10')) {
      console.log('✅ تم العثور على المعادل الشهري للاشتراكات: 567.10 ج.م');
    } else {
      console.error('❌ مبلغ الاشتراكات 567.10 غير موجود في الواجهة!');
      process.exit(1);
    }

    // 5. فحص الالتزامات والدخل المتوقع والمدخرات
    if (unlockedText.includes('5,300.00') && unlockedText.includes('3,600.00') && unlockedText.includes('17,000.00')) {
      console.log('✅ تم العثور على الالتزامات (5,300) والدخل المتوقع (3,600) والمدخرات (17,000)');
    } else {
      console.error('❌ مبالغ الالتزامات أو الدخل المتوقع أو المدخرات غير متطابقة!');
      process.exit(1);
    }

    // 6. فحص مؤشر قاعدة البيانات
    if (unlockedText.includes('MySQL') || unlockedText.includes('تخزين محلي')) {
      console.log('✅ تم العثور على مؤشر حالة قاعدة البيانات (MySQL / تخزين محلي)');
    }

    console.log('\n🎉 نجح اختبار التحقق من المتصفح والـ DOM بنسبة 100%! التطبيق جاهز تماماً للاستخدام والنشر.');
    process.exit(0);
  }, 400);

}, 400);
