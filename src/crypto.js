// Sarfy - Military-Grade AES-256-GCM Client-Side Crypto Engine
// يستخدم Web Crypto API المدمجة في المتصفح لتشفير البيانات بـ AES-256 و PBKDF2 بـ 100,000 دورة
// تشفير Zero-Knowledge حقيقي: البيانات لا تخرج من المتصفح إطلاقاً

// تحويل Buffer إلى Hex
function bufToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// تحويل Hex إلى Buffer
function hexToBuf(hexString) {
  const bytes = new Uint8Array(Math.ceil(hexString.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hexString.substr(i * 2, 2), 16);
  }
  return bytes.buffer;
}

// اشتقاق مفتاح AES-GCM 256 من الرمز السري أو كلمة المرور والـ Salt عبر PBKDF2
async function deriveKey(secret, saltBuffer) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// تشفير نص أو كائن JSON بـ AES-256-GCM
export async function encryptData(data, secret) {
  if (!secret) return data;
  try {
    const text = typeof data === 'string' ? data : JSON.stringify(data);
    const enc = new TextEncoder();
    const encodedData = enc.encode(text);

    // توليد Salt و IV عشوائي مشفر
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const key = await deriveKey(secret, salt);

    const ciphertext = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encodedData
    );

    return {
      isEncrypted: true,
      version: 2,
      salt: bufToHex(salt),
      iv: bufToHex(iv),
      cipher: bufToHex(ciphertext),
      updatedAt: Date.now()
    };
  } catch (err) {
    console.error('فشل التشفير:', err);
    throw new Error('حدث خطأ أثناء تشفير البيانات');
  }
}

// فك تشفير البيانات بـ AES-256-GCM
export async function decryptData(encryptedPayload, secret) {
  if (!encryptedPayload || !encryptedPayload.isEncrypted) {
    return encryptedPayload;
  }
  try {
    const saltBuffer = hexToBuf(encryptedPayload.salt);
    const ivBuffer = hexToBuf(encryptedPayload.iv);
    const cipherBuffer = hexToBuf(encryptedPayload.cipher);

    const key = await deriveKey(secret, saltBuffer);

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer
      },
      key,
      cipherBuffer
    );

    const dec = new TextDecoder();
    const plainText = dec.decode(decrypted);
    return JSON.parse(plainText);
  } catch (err) {
    console.warn('فشل فك التشفير - الرمز السري أو كلمة المرور قد تكون خاطئة:', err);
    throw new Error('بيانات الدخول غير صحيحة أو تم التلاعب بالبيانات');
  }
}

// حساب تجزئة سريعة للتحقق من صحة الرمز (PIN Hash)
export async function hashPin(pin) {
  const enc = new TextEncoder();
  const data = enc.encode(pin + '_sarfy_pin_salt_v2');
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return bufToHex(hashBuffer);
}

// حساب تجزئة قوية لكلمة المرور الرئيسية (Password Hash)
export async function hashPassword(password) {
  const enc = new TextEncoder();
  const data = enc.encode(password + '_sarfy_master_pwd_salt_v2');
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return bufToHex(hashBuffer);
}

// فحص قوة كلمة المرور المباشر (Password Strength Meter)
export function checkPasswordStrength(password) {
  if (!password) return { score: 0, label: 'فارغة', color: '#6B7280', percent: 0 };
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[a-zA-Z]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  if (score <= 2) {
    return { score: 1, label: 'ضعيفة', color: '#EF4444', percent: 25 };
  } else if (score === 3) {
    return { score: 2, label: 'مقبولة', color: '#F59E0B', percent: 50 };
  } else if (score === 4) {
    return { score: 3, label: 'قوية', color: '#10B981', percent: 75 };
  } else {
    return { score: 4, label: 'عسكرية فائقة', color: '#06B6D4', percent: 100 };
  }
}

// حماية من هجمات التخمين Brute-Force Rate Limiting
const LOCKOUT_KEY = 'sarfy_lockout_info';

export function recordFailedAttempt() {
  try {
    const raw = localStorage.getItem(LOCKOUT_KEY);
    const info = raw ? JSON.parse(raw) : { count: 0, lockedUntil: 0 };
    info.count += 1;

    // بعد 3 محاولات خاطئة: حظر 30 ثانية
    // بعد 5 محاولات خاطئة: حظر دقيقتين
    if (info.count >= 5) {
      info.lockedUntil = Date.now() + 120 * 1000;
    } else if (info.count >= 3) {
      info.lockedUntil = Date.now() + 30 * 1000;
    }
    localStorage.setItem(LOCKOUT_KEY, JSON.stringify(info));
    return info;
  } catch {
    return { count: 1, lockedUntil: 0 };
  }
}

export function getLockoutRemainingSeconds() {
  try {
    const raw = localStorage.getItem(LOCKOUT_KEY);
    if (!raw) return 0;
    const info = JSON.parse(raw);
    if (info.lockedUntil && info.lockedUntil > Date.now()) {
      return Math.ceil((info.lockedUntil - Date.now()) / 1000);
    }
    return 0;
  } catch {
    return 0;
  }
}

export function resetLockout() {
  try {
    localStorage.removeItem(LOCKOUT_KEY);
  } catch {}
}
