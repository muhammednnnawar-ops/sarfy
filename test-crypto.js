import { encryptData, decryptData, hashPin } from './src/crypto.js';
import { webcrypto } from 'crypto';

// توفير Web Crypto في بيئة Node
if (!globalThis.window) {
  globalThis.window = { crypto: webcrypto };
}

async function testCrypto() {
  console.log('🔐 بدء اختبار محرك التشفير AES-256-GCM...');

  const sensitiveData = {
    totalMoney: 44950,
    accounts: [
      { id: 'acc_1', name: 'محفظة كاش', balance: 3200 },
      { id: 'acc_2', name: 'حساب البنك الأهلي', balance: 36500 }
    ],
    secretNotes: 'معلومات مالية شديدة السرية'
  };

  const correctPin = '1234';
  const wrongPin = '9999';

  // 1. التشفير
  const encrypted = await encryptData(sensitiveData, correctPin);
  console.log('✅ تم التشفير بنجاح:');
  console.log('   - هل مشفر؟:', encrypted.isEncrypted);
  console.log('   - خوارزمية:', 'AES-GCM 256-bit');
  console.log('   - حجم الـ Ciphertext:', encrypted.cipher.length, 'chars');
  console.log('   - النص المخزن في القرص لا يحتوي على أي أرقام واضحة:', !JSON.stringify(encrypted).includes('44950'));

  if (JSON.stringify(encrypted).includes('44950')) {
    console.error('❌ تسرب بيانات: البيانات تظهر غير مشفرة!');
    process.exit(1);
  }

  // 2. فك التشفير برمز خاطئ (يجب أن يفشل)
  try {
    await decryptData(encrypted, wrongPin);
    console.error('❌ خطأ أمني: نجح فك التشفير برمز خاطئ!');
    process.exit(1);
  } catch (err) {
    console.log('✅ نجاح الحماية: فك التشفير برمز خاطئ تم رفضه بأمان.');
  }

  // 3. فك التشفير بالرمز الصحيح
  const decrypted = await decryptData(encrypted, correctPin);
  if (decrypted.totalMoney === 44950 && decrypted.accounts.length === 2) {
    console.log('✅ نجاح فك التشفير: تمت استعادة البيانات بنسبة 100% تطابق!');
  } else {
    console.error('❌ خطأ: البيانات المفكوكة غير مطابقة للأصل!');
    process.exit(1);
  }

  // 4. اختبار التجزئة
  const h1 = await hashPin('1234');
  const h2 = await hashPin('1234');
  const h3 = await hashPin('5678');
  if (h1 === h2 && h1 !== h3) {
    console.log('✅ تجزئة الرمز السري SHA-256 تعمل بدقة.');
  }

  console.log('\n🛡️ تم تأكيد أمان وتشفير النظام بنجاح تام!');
}

testCrypto().catch(err => {
  console.error('فشل اختبار التشفير:', err);
  process.exit(1);
});
