import crypto from 'crypto';

if (typeof window === 'undefined') {
  globalThis.window = { crypto: crypto.webcrypto };
}

import { hashPin, hashPassword } from './src/crypto.js';

console.log('🧪 بدء اختبار منطقية تسجيل الدخول والتسجيل...');

// محاكاة منطق التحقق في handleLoginPin
async function verifyPin(candidatePin, savedHash) {
  if (!candidatePin || candidatePin.length !== 4) return false;
  const candidateHash = await hashPin(candidatePin);

  if (savedHash) {
    if (candidateHash !== savedHash) return false;
    return true;
  }

  // إذا لم يكن هناك حساب مسجل
  if (candidatePin === '1234') return true;
  return false;
}

// محاكاة منطق التحقق في handleLoginPassword
async function verifyPassword(candidatePassword, savedHash, candidateIdentifier = '', userMeta = null) {
  if (!candidatePassword || candidatePassword.trim().length === 0) return false;
  const candidateHash = await hashPassword(candidatePassword);

  if (savedHash) {
    if (candidateHash !== savedHash) return false;
    if (candidateIdentifier && userMeta) {
      const idClean = candidateIdentifier.trim().toLowerCase();
      const emailClean = (userMeta.email || '').trim().toLowerCase();
      const nameClean = (userMeta.fullName || '').trim().toLowerCase();
      if (emailClean && idClean !== emailClean && nameClean && idClean !== nameClean && !emailClean.includes(idClean)) {
        return false;
      }
    }
    return true;
  }

  // إذا لم يكن هناك حساب مسجل
  if (candidatePassword === 'demo1234' || candidatePassword === 'demo') return true;
  return false;
}

async function runTests() {
  // اختبار 1: إدخال رمز عشوائي في غياب حساب مسجل
  const test1 = await verifyPin('9999', null);
  if (!test1) {
    console.log('✅ نجاح: الرمز العشوائي 9999 تم رفضه بأمان عند عدم وجود حساب مسجل.');
  } else {
    console.error('❌ فشل: تم قبول الرمز العشوائي 9999!');
    process.exit(1);
  }

  // اختبار 2: إدخال كلمة مرور عشوائية في غياب حساب مسجل
  const test2 = await verifyPassword('random_word', null);
  if (!test2) {
    console.log('✅ نجاح: كلمة المرور العشوائية تم رفضها بأمان.');
  } else {
    console.error('❌ فشل: تم قبول كلمة مرور عشوائية!');
    process.exit(1);
  }

  // اختبار 3: إدخال الرمز التجريبي 1234
  const test3 = await verifyPin('1234', null);
  if (test3) {
    console.log('✅ نجاح: الرمز التجريبي 1234 تم قبوله بنجاح.');
  } else {
    console.error('❌ فشل: تم رفض الرمز التجريبي 1234!');
    process.exit(1);
  }

  // اختبار 4: مستخدم مسجل برمز 5678 وكلمة مرور MySecret123
  const myPinHash = await hashPin('5678');
  const myPwdHash = await hashPassword('MySecret123');
  const myMeta = { fullName: 'أحمد علي', email: 'ahmed@example.com' };

  // محاولة الدخول برمز خاطئ لمستخدم مسجل
  const test4 = await verifyPin('1234', myPinHash);
  if (!test4) {
    console.log('✅ نجاح: مستخدم مسجل تم رفض رمز مختلف عنه (حتى 1234 تم رفضه لأن للمستخدم رمز خاص به).');
  } else {
    console.error('❌ فشل: تم قبول رمز خاطئ لمستخدم مسجل!');
    process.exit(1);
  }

  // محاولة الدخول بالرمز الصحيح للمستخدم المسجل
  const test5 = await verifyPin('5678', myPinHash);
  if (test5) {
    console.log('✅ نجاح: تم قبول رمز المستخدم الصحيح 5678.');
  } else {
    console.error('❌ فشل: تم رفض رمز المستخدم الصحيح 5678!');
    process.exit(1);
  }

  // محاولة الدخول بكلمة مرور خاطئة
  const test6 = await verifyPassword('wrongPass', myPwdHash, 'ahmed@example.com', myMeta);
  if (!test6) {
    console.log('✅ نجاح: تم رفض كلمة المرور الخاطئة لمستخدم مسجل.');
  } else {
    console.error('❌ فشل: تم قبول كلمة مرور خاطئة!');
    process.exit(1);
  }

  // محاولة الدخول بكلمة المرور الصحيحة
  const test7 = await verifyPassword('MySecret123', myPwdHash, 'ahmed@example.com', myMeta);
  if (test7) {
    console.log('✅ نجاح: تم قبول كلمة المرور الصحيحة والبريد المطابق.');
  } else {
    console.error('❌ فشل: تم رفض كلمة المرور الصحيحة!');
    process.exit(1);
  }

  console.log('\n🎉 جميع اختبارات الأمان ومنطقية الدخول والتسجيل نجحت بنسبة 100%!');
}

runTests();
