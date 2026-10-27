// Sarfy - Authentication & Registration Hub (Login, Register & 3D Vault)
// نظام المصادقة والتسجيل المشفر بالكامل مع مكونات 3D تفاعلية ومؤشر قوة كلمة المرور وحماية من التخمين
import React, { useState, useEffect, useRef } from 'react';
import { SarfyLogo } from './logo.jsx';
import { Icon } from './icons.jsx';
import { CURRENCIES } from './data.js';
import { checkPasswordStrength, getLockoutRemainingSeconds, recordFailedAttempt, resetLockout } from './crypto.js';

// =======================================================================
// 0. أيقونات إظهار وإخفاء كلمة المرور الأنيقة (Eye Icons SVG)
// =======================================================================
function EyeOpenIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeClosedIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

// =======================================================================
// 1. مكون الشعار والأيقونة الدائرية التفاعلية (Interactive Brand Emblem)
// =======================================================================
function Interactive3DVault({ isUnlocking = false, isError = false }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const vaultRef = useRef(null);

  const handleMouseMove = e => {
    if (!vaultRef.current) return;
    const rect = vaultRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setTilt({
      x: (y / (rect.height / 2)) * -10,
      y: (x / (rect.width / 2)) * 12
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div
      ref={vaultRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`vault-3d-stage ${isError ? 'shake-anim' : ''}`}
      style={{
        perspective: '800px',
        width: 104,
        height: 104,
        margin: '0 auto 16px',
        cursor: 'pointer'
      }}
    >
      <div
        className="vault-3d-cylinder"
        style={{
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: 'transform 0.15s ease-out',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* هالة الضوء المحيطية الناعمة */}
        <div
          style={{
            position: 'absolute',
            inset: -12,
            borderRadius: '50%',
            background: isError
              ? 'radial-gradient(circle, rgba(239, 68, 68, 0.35) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(16, 185, 129, 0.35) 0%, rgba(6, 182, 212, 0.15) 50%, transparent 75%)',
            filter: 'blur(16px)',
            pointerEvents: 'none'
          }}
        />

        {/* الحلقة الدائرية الفاخرة بدون أي تروس أو زوائد */}
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'linear-gradient(145deg, #0d1527 0%, #06181b 100%)',
            border: isError ? '2px solid #EF4444' : '2px solid rgba(16, 185, 129, 0.5)',
            boxShadow: isError
              ? '0 0 25px rgba(239, 68, 68, 0.4), inset 0 0 15px rgba(239, 68, 68, 0.2)'
              : '0 12px 28px -6px rgba(0, 0, 0, 0.7), 0 0 24px rgba(16, 185, 129, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: 'translateZ(10px)',
            position: 'relative'
          }}
        >
          {/* حلقة داخلية ناعمة تدور بسلاسة أثناء تسجيل الدخول */}
          <div
            className={isUnlocking ? 'vault-spinning' : ''}
            style={{
              width: 76,
              height: 76,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(6, 78, 59, 0.3) 100%)',
              border: '1.5px solid rgba(56, 189, 248, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: 'translateZ(14px)',
              boxShadow: 'inset 0 2px 4px rgba(255, 255, 255, 0.08), 0 4px 12px rgba(0,0,0,0.4)'
            }}
          >
            {/* الشعار الفاخر في قلب الدائرة */}
            <div style={{ transform: 'translateZ(10px)' }}>
              <SarfyLogo size={46} animated={!isError} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =======================================================================
// 2. المكون الرئيسي: نافذة الدخول والتسجيل (AuthScreen)
// =======================================================================
export function AuthScreen({
  mode: initialMode = 'login', // 'login' | 'register'
  initialAuthMethod = 'pin', // 'pin' | 'password'
  hasRegisteredUser = false,
  userMeta = null,
  onLoginPin,
  onLoginPassword,
  onRegister,
  onQuickDemo
}) {
  const [activeTab, setActiveTab] = useState(initialMode || (hasRegisteredUser ? 'login' : 'register'));
  const [authMethod, setAuthMethod] = useState(initialAuthMethod || (hasRegisteredUser && userMeta ? 'pin' : 'password'));

  useEffect(() => {
    if (initialAuthMethod) {
      setAuthMethod(initialAuthMethod);
      if (initialAuthMethod === 'password') {
        setEnteredPassword('');
      }
    }
  }, [initialAuthMethod]);

  // حالة تسجيل الدخول
  const [enteredIdentifier, setEnteredIdentifier] = useState(userMeta?.email || '');
  const [enteredPin, setEnteredPin] = useState('');
  const [enteredPassword, setEnteredPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  // تحديث حقل البريد عند تغير بيانات المستخدم
  useEffect(() => {
    if (userMeta?.email && !enteredIdentifier) {
      setEnteredIdentifier(userMeta.email);
    }
  }, [userMeta]);

  // حماية من التخمين Brute-Force Rate Limiting
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  // حالة استمارة التسجيل الجديد (Registration Form State)
  const [regStep, setRegStep] = useState(1);
  const [regData, setRegData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    pin: '',
    currency: 'ج.م',
    cashOpening: '3000',
    bankOpening: '35000',
    walletOpening: '5000',
    monthlyIncomeTarget: '25000',
    monthlyBudgetTarget: '12000',
    starterMode: 'demo' // 'demo' | 'clean'
  });
  const [regErrors, setRegErrors] = useState({});

  // فحص حالة الحظر عند التحميل
  useEffect(() => {
    const checkLockout = () => {
      const remaining = getLockoutRemainingSeconds();
      setLockoutRemaining(remaining);
    };
    checkLockout();
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, []);

  // معالجة إدخال أرقام الـ PIN
  const handleDigit = digit => {
    if (lockoutRemaining > 0 || isUnlocking) return;
    if (enteredPin.length < 4) {
      const next = enteredPin + digit;
      setEnteredPin(next);
      setErrorMsg('');

      if (next.length === 4) {
        attemptPinUnlock(next);
      }
    }
  };

  const handleDeleteDigit = () => {
    if (lockoutRemaining > 0) return;
    setEnteredPin(prev => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClearPin = () => {
    if (lockoutRemaining > 0) return;
    setEnteredPin('');
    setErrorMsg('');
  };

  // محاولة الفك عبر الرمز السري (يدعم التحقق محلياً وعبر السيرفر)
  const attemptPinUnlock = async pinToTest => {
    setIsUnlocking(true);
    try {
      const res = await onLoginPin(pinToTest, enteredIdentifier);
      const isOk = typeof res === 'object' ? res.success : !!res;
      if (isOk) {
        resetLockout();
      } else {
        const info = recordFailedAttempt();
        const msg = (typeof res === 'object' && res.error)
          ? res.error
          : (hasRegisteredUser
              ? 'الرمز السري غير صحيح!'
              : 'الرمز السري غير صحيح في قاعدة البيانات.');
        triggerError(msg);
        if (info.lockedUntil > Date.now()) {
          setLockoutRemaining(Math.ceil((info.lockedUntil - Date.now()) / 1000));
        }
      }
    } catch (err) {
      recordFailedAttempt();
      triggerError(err.message || 'فشل التحقق من الرمز');
    } finally {
      setIsUnlocking(false);
    }
  };

  // محاولة الفك عبر كلمة المرور الرئيسية
  const handlePasswordSubmit = async e => {
    e.preventDefault();
    if (!enteredPassword) return;
    if (lockoutRemaining > 0 || isUnlocking) return;

    setIsUnlocking(true);
    try {
      const res = await onLoginPassword(enteredPassword, enteredIdentifier);
      const isOk = typeof res === 'object' ? res.success : !!res;
      if (isOk) {
        resetLockout();
      } else {
        const info = recordFailedAttempt();
        const msg = (typeof res === 'object' && res.error)
          ? res.error
          : (hasRegisteredUser
              ? 'بيانات الدخول غير صحيحة (تحقق من البريد وكلمة المرور)'
              : 'بيانات الدخول غير صحيحة. يرجى التأكد من البريد وكلمة المرور.');
        triggerError(msg);
        if (info.lockedUntil > Date.now()) {
          setLockoutRemaining(Math.ceil((info.lockedUntil - Date.now()) / 1000));
        }
      }
    } catch (err) {
      recordFailedAttempt();
      triggerError(err.message || 'فشل التحقق');
    } finally {
      setIsUnlocking(false);
    }
  };

  const triggerError = msg => {
    setErrorMsg(msg);
    setIsError(true);
    setEnteredPin('');
    setTimeout(() => setIsError(false), 500);
  };

  // دعم لوحة مفاتيح الحاسوب في وضع الـ PIN
  useEffect(() => {
    if (activeTab !== 'login' || authMethod !== 'pin') return;
    const handleKeyDown = e => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDeleteDigit();
      } else if (e.key === 'Escape') {
        handleClearPin();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enteredPin, activeTab, authMethod, lockoutRemaining]);

  // التحقق من صحة خطوات التسجيل
  const validateStep1 = () => {
    const errors = {};
    if (!regData.fullName.trim()) {
      errors.fullName = 'يرجى إدخال اسمك بالكامل';
    } else if (regData.fullName.trim().length < 2) {
      errors.fullName = 'الاسم يجب أن يتكون من حرفين على الأقل';
    }

    if (!regData.email.trim()) {
      errors.email = 'يرجى إدخال البريد الإلكتروني';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regData.email.trim())) {
      errors.email = 'صيغة البريد الإلكتروني غير صحيحة (مثال: name@domain.com)';
    }

    if (!regData.password) {
      errors.password = 'يرجى تعيين كلمة مرور رئيسية';
    } else if (regData.password.length < 6) {
      errors.password = 'كلمة المرور يجب أن لا تقل عن 6 أحرف';
    }

    if (regData.password !== regData.confirmPassword) {
      errors.confirmPassword = 'كلمات المرور غير متطابقة';
    }

    if (!regData.pin || regData.pin.length !== 4) {
      errors.pin = 'الرمز السري يجب أن يتكون من 4 أرقام تماماً';
    }

    setRegErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (regStep === 1) {
      if (validateStep1()) setRegStep(2);
    } else if (regStep === 2) {
      setRegStep(3);
    }
  };

  // إرسال استمارة التسجيل النهائي
  const handleFinalRegister = async () => {
    setIsUnlocking(true);
    try {
      await onRegister({
        fullName: regData.fullName.trim(),
        email: regData.email.trim(),
        password: regData.password,
        pin: regData.pin,
        currency: regData.currency,
        cashOpening: Number(regData.cashOpening) || 0,
        bankOpening: Number(regData.bankOpening) || 0,
        walletOpening: Number(regData.walletOpening) || 0,
        monthlyIncomeTarget: Number(regData.monthlyIncomeTarget) || 25000,
        monthlyBudgetTarget: Number(regData.monthlyBudgetTarget) || 12000,
        cleanSlate: regData.starterMode === 'clean'
      });
      resetLockout();
    } catch (err) {
      setErrorMsg(err.message || 'فشل إنشاء وتشفير الحساب');
    } finally {
      setIsUnlocking(false);
    }
  };

  const pwdStrength = checkPasswordStrength(regData.password);

  return (
    <div className="authscreen-overlay">
      <div className="authscreen-container">
        {/* الخزنة ثلاثية الأبعاد التفاعلية */}
        <Interactive3DVault isUnlocking={isUnlocking} isError={isError} />

        {/* شريط التبديل بين تسجيل الدخول ومستخدم جديد */}
        <div className="auth-tabs-pill">
          <button
            type="button"
            className={`auth-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('login');
              setErrorMsg('');
            }}
          >
            <Icon name="lock" size={14} />
            <span>تسجيل الدخول</span>
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('register');
              setErrorMsg('');
            }}
          >
            <Icon name="plus" size={14} />
            <span>مستخدم جديد</span>
          </button>
        </div>

        {/* ===================================================================
            التبويب الأول: تسجيل الدخول (LOGIN VIEW)
            =================================================================== */}
        {activeTab === 'login' && (
          <div className="auth-card-body">
            {/* بطاقة المستخدم والترحيب */}
            <div className="login-user-header">
              {userMeta?.fullName && (
                <div className="user-avatar-3d">
                  {userMeta.avatarSeed || userMeta.fullName.slice(0, 2)}
                </div>
              )}
              <h2 className="auth-title">
                {userMeta?.fullName ? `مرحباً، ${userMeta.fullName}` : 'صرفي - تسجيل الدخول'}
              </h2>
              <p className="auth-subtitle">
                {userMeta?.email || 'منظومتك المتكاملة لإدارة وتتبع الأموال بأمان وخصوصية'}
              </p>
              {userMeta && (
                <button
                  type="button"
                  onClick={() => {
                    try {
                      localStorage.removeItem('sarfy_user_meta');
                      localStorage.removeItem('sarfy_pin_hash');
                      localStorage.removeItem('sarfy_pwd_hash');
                    } catch {}
                    window.location.reload();
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--emerald)',
                    fontSize: 12,
                    cursor: 'pointer',
                    marginTop: 6,
                    fontWeight: 600,
                    textDecoration: 'underline'
                  }}
                >
                  تسجيل الدخول بحساب آخر 🔄
                </button>
              )}
            </div>

            {/* تنبيه استرشادي في حال عدم وجود حساب مسجل بعد على هذا الجهاز */}
            {!hasRegisteredUser && (
              <div style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: 8,
                padding: '10px 14px',
                margin: '0 0 16px',
                fontSize: 12,
                lineHeight: 1.6,
                color: 'var(--text-main, #e2e8f0)',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <span style={{ fontSize: 16 }}>ℹ️</span>
                <div>
                  <strong>تسجيل الدخول من جهاز جديد؟</strong> استخدم البريد وكلمة المرور المسجلة سابقاً، أو اضغط <button type="button" onClick={() => { setActiveTab('register'); setErrorMsg(''); }} style={{ color: 'var(--emerald)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 700, textDecoration: 'underline' }}>إنشاء حساب جديد</button>.
                </div>
              </div>
            )}

            {/* مؤشر حظر المحاولات المؤقت */}
            {lockoutRemaining > 0 && (
              <div className="lockout-banner">
                <Icon name="alert" size={18} color="#EF4444" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>تم تجميد المحاولات لحماية الأمان</div>
                  <div style={{ fontSize: 12 }}>يرجى الانتظار {lockoutRemaining} ثانية لإعادة المحاولة</div>
                </div>
              </div>
            )}

            {/* طريقة المصادقة: رمز PIN أم كلمة المرور الرئيسية */}
            <div className="auth-sub-switch">
              <button
                type="button"
                className={`sub-switch-btn ${authMethod === 'pin' ? 'active' : ''}`}
                onClick={() => setAuthMethod('pin')}
              >
                الرمز السري (PIN)
              </button>
              <button
                type="button"
                className={`sub-switch-btn ${authMethod === 'password' ? 'active' : ''}`}
                onClick={() => setAuthMethod('password')}
              >
                كلمة المرور الرئيسية
              </button>
            </div>

            {/* 1. خيار الرمز السري PIN */}
            {authMethod === 'pin' && (
              <div className="pin-auth-section">
                {!hasRegisteredUser && (
                  <div style={{ marginBottom: 14 }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="البريد الإلكتروني (اختياري للتعرف على حسابك)"
                      value={enteredIdentifier}
                      onChange={e => {
                        setEnteredIdentifier(e.target.value);
                        setErrorMsg('');
                      }}
                      style={{ textAlign: 'center', fontSize: 13 }}
                    />
                  </div>
                )}
                {/* دوائر مؤشر الأرقام */}
                <div className="pin-dots-container">
                  {[0, 1, 2, 3].map(i => (
                    <div
                      key={i}
                      className={`pin-dot ${i < enteredPin.length ? 'filled' : ''} ${isError ? 'error-dot' : ''}`}
                    />
                  ))}
                </div>

                {errorMsg && <div className="auth-error-badge">{errorMsg}</div>}

                {/* لوحة المفاتيح السيبرانية */}
                <div className="cyber-keypad">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <button
                      key={num}
                      type="button"
                      className="keypad-btn"
                      onClick={() => handleDigit(String(num))}
                      disabled={lockoutRemaining > 0 || isUnlocking}
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="keypad-btn action-btn"
                    onClick={handleClearPin}
                    disabled={lockoutRemaining > 0 || isUnlocking}
                  >
                    مسح
                  </button>
                  <button
                    type="button"
                    className="keypad-btn"
                    onClick={() => handleDigit('0')}
                    disabled={lockoutRemaining > 0 || isUnlocking}
                  >
                    0
                  </button>
                  <button
                    type="button"
                    className="keypad-btn action-btn"
                    onClick={handleDeleteDigit}
                    disabled={lockoutRemaining > 0 || isUnlocking}
                  >
                    ⌫
                  </button>
                </div>
              </div>
            )}

            {/* 2. خيار كلمة المرور الرئيسية */}
            {authMethod === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="password-auth-form">
                <div className="input-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">البريد الإلكتروني أو اسم المستخدم</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={userMeta?.email || 'name@example.com أو user'}
                    value={enteredIdentifier}
                    onChange={e => {
                      setEnteredIdentifier(e.target.value);
                      setErrorMsg('');
                    }}
                    disabled={lockoutRemaining > 0 || isUnlocking}
                  />
                </div>

                <div className="input-group">
                  <label className="form-label">كلمة المرور الرئيسية للحساب</label>
                  <div className="password-input-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="أدخل كلمة المرور..."
                      value={enteredPassword}
                      onChange={e => {
                        setEnteredPassword(e.target.value);
                        setErrorMsg('');
                      }}
                      disabled={lockoutRemaining > 0 || isUnlocking}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="pwd-toggle-btn"
                      onClick={() => setShowPassword(prev => !prev)}
                      aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    >
                      {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                    </button>
                  </div>
                </div>

                {errorMsg && <div className="auth-error-badge">{errorMsg}</div>}

                <button
                  type="submit"
                  className="btn-primary full-width"
                  disabled={!enteredPassword || lockoutRemaining > 0 || isUnlocking}
                  style={{ marginTop: 14 }}
                >
                  {isUnlocking ? 'جاري التحقق وتسجيل الدخول...' : 'تسجيل الدخول للمحفظة 🚀'}
                </button>
              </form>
            )}

            {/* روابط مساعدة سريعة */}
            <div className="auth-footer-links">
              <button
                type="button"
                className="link-subtle"
                onClick={() => {
                  setActiveTab('register');
                  setErrorMsg('');
                }}
              >
                مستخدم جديد؟ إنشاء حساب جديد
              </button>
              {onQuickDemo && (
                <button
                  type="button"
                  className="link-subtle"
                  onClick={onQuickDemo}
                  style={{ color: 'var(--emerald)' }}
                >
                  استكشاف الحساب التجريبي فوراً 🚀
                </button>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================
            التبويب الثاني: مستخدم جديد (REGISTRATION ONBOARDING WIZARD)
            =================================================================== */}
        {activeTab === 'register' && (
          <div className="auth-card-body registration-body">
            {/* مؤشر الخطوات الاسترشادي */}
            <div className="reg-steps-stepper">
              <div className={`step-node ${regStep >= 1 ? 'completed' : ''}`}>1. الأمان والحساب</div>
              <div className="step-line" />
              <div className={`step-node ${regStep >= 2 ? 'completed' : ''}`}>2. الأرصدة والعملة</div>
              <div className="step-line" />
              <div className={`step-node ${regStep >= 3 ? 'completed' : ''}`}>3. البدء والتفعيل</div>
            </div>

            {/* الخطوة 1: الحساب والأمان */}
            {regStep === 1 && (
              <div className="reg-step-container">
                <h3 className="reg-step-title">بيانات الحساب والأمان</h3>
                <p className="reg-step-desc">حافظ على سرية كلمة المرور والرمز السري لضمان خصوصية وأمان حسابك المالي.</p>

                <div className="form-group-item">
                  <label className="form-label">الاسم بالكامل / اللقب *</label>
                  <input
                    type="text"
                    className={`form-input ${regErrors.fullName ? 'has-error' : ''}`}
                    placeholder="اكتب اسمك بالكامل"
                    value={regData.fullName}
                    onChange={e => setRegData({ ...regData, fullName: e.target.value })}
                  />
                  {regErrors.fullName && <span className="field-err">{regErrors.fullName}</span>}
                </div>

                <div className="form-group-item">
                  <label className="form-label">البريد الإلكتروني (لتسجيل الدخول والمصادقة) *</label>
                  <input
                    type="email"
                    className={`form-input ${regErrors.email ? 'has-error' : ''}`}
                    placeholder="name@example.com"
                    value={regData.email}
                    onChange={e => setRegData({ ...regData, email: e.target.value })}
                  />
                  {regErrors.email && <span className="field-err">{regErrors.email}</span>}
                </div>

                <div className="form-group-item">
                  <label className="form-label">كلمة المرور الرئيسية للحساب *</label>
                  <div className="password-input-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={`form-input ${regErrors.password ? 'has-error' : ''}`}
                      placeholder="6 أحرف على الأقل..."
                      value={regData.password}
                      onChange={e => setRegData({ ...regData, password: e.target.value })}
                    />
                    <button
                      type="button"
                      className="pwd-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    >
                      {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                    </button>
                  </div>
                  {/* مقياس قوة كلمة المرور */}
                  {regData.password && (
                    <div className="pwd-strength-container">
                      <div className="strength-bar-track">
                        <div
                          className="strength-bar-fill"
                          style={{
                            width: `${pwdStrength.percent}%`,
                            backgroundColor: pwdStrength.color
                          }}
                        />
                      </div>
                      <span className="strength-label" style={{ color: pwdStrength.color }}>
                        قوة كلمة المرور: {pwdStrength.label}
                      </span>
                    </div>
                  )}
                  {regErrors.password && <span className="field-err">{regErrors.password}</span>}
                </div>

                <div className="form-group-item">
                  <label className="form-label">تأكيد كلمة المرور *</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={`form-input ${regErrors.confirmPassword ? 'has-error' : ''}`}
                    placeholder="أعد إدخال كلمة المرور..."
                    value={regData.confirmPassword}
                    onChange={e => setRegData({ ...regData, confirmPassword: e.target.value })}
                  />
                  {regErrors.confirmPassword && <span className="field-err">{regErrors.confirmPassword}</span>}
                </div>

                <div className="form-group-item">
                  <label className="form-label">رمز سري سريع للموبايل (4 أرقام PIN) *</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    className={`form-input numeric-pin-field ${regErrors.pin ? 'has-error' : ''}`}
                    placeholder="مثال: 1234"
                    value={regData.pin}
                    onChange={e => setRegData({ ...regData, pin: e.target.value.replace(/[^0-9]/g, '') })}
                  />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    يستخدم لفتح المحفظة بنقرة واحدة من هاتفك دون الحاجة لكتابة كلمة المرور كل مرة
                  </span>
                  {regErrors.pin && <span className="field-err">{regErrors.pin}</span>}
                </div>

                <button
                  type="button"
                  className="btn-primary full-width"
                  onClick={handleNextStep}
                  style={{ marginTop: 16 }}
                >
                  المتابعة لضبط الأرصدة والعملة ←
                </button>
              </div>
            )}

            {/* الخطوة 2: العملة والأرصدة */}
            {regStep === 2 && (
              <div className="reg-step-container">
                <h3 className="reg-step-title">العملة والأرصدة الافتتاحية للمحافظ</h3>
                <p className="reg-step-desc">حدد العملة الأساسية ورصيدك الحالي في الكاش والبنك والمحفظة الذكية.</p>

                {/* اختيار العملة الأساسية */}
                <div className="form-group-item">
                  <label className="form-label">العملة الأساسية للحساب</label>
                  <div className="currency-selector-grid">
                    {CURRENCIES.map(curr => (
                      <button
                        key={curr.code}
                        type="button"
                        className={`currency-pill-btn ${regData.currency === curr.code ? 'selected' : ''}`}
                        onClick={() => setRegData({ ...regData, currency: curr.code })}
                      >
                        <span style={{ fontSize: 18 }}>{curr.country}</span>
                        <span style={{ fontWeight: 700 }}>{curr.code}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* الأرصدة الافتتاحية للمحافظ */}
                <div className="initial-balances-card">
                  <div className="form-group-item">
                    <label className="form-label">💵 رصيد الكاش الحالي (في جيبك / منزلك)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="0.00"
                      value={regData.cashOpening}
                      onChange={e => setRegData({ ...regData, cashOpening: e.target.value })}
                    />
                  </div>

                  <div className="form-group-item">
                    <label className="form-label">🏦 رصيد الحساب البنكي الرئيسي</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="0.00"
                      value={regData.bankOpening}
                      onChange={e => setRegData({ ...regData, bankOpening: e.target.value })}
                    />
                  </div>

                  <div className="form-group-item">
                    <label className="form-label">📱 رصيد المحفظة الإلكترونية (فودافون كاش / إنستاباي)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="0.00"
                      value={regData.walletOpening}
                      onChange={e => setRegData({ ...regData, walletOpening: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setRegStep(1)}
                  >
                    ← السابق
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ flex: 1 }}
                    onClick={handleNextStep}
                  >
                    متابعة لنمط البدء ←
                  </button>
                </div>
              </div>
            )}

            {/* الخطوة 3: نمط البدء وتأكيد الحساب */}
            {regStep === 3 && (
              <div className="reg-step-container">
                <h3 className="reg-step-title">اختر نمط بدء الحساب</h3>
                <p className="reg-step-desc">كيف تود أن تبدأ رحلتك المالية في صرفي؟</p>

                {/* كارت خيار 1: بيانات تجريبية استرشادية */}
                <div
                  className={`starter-option-card ${regData.starterMode === 'demo' ? 'selected' : ''}`}
                  onClick={() => setRegData({ ...regData, starterMode: 'demo' })}
                >
                  <div className="option-radio">
                    <div className="radio-inner" />
                  </div>
                  <div className="option-info">
                    <div className="option-badge">موصى به للاستكشاف ⭐</div>
                    <div className="option-title">البدء بحساب تجريبي متكامل</div>
                    <div className="option-desc">
                      يحتوي على معاملات نموذجية، أهداف ادخار، ورسوم بيانية جاهزة لتجربة واكتشاف كافة مزايا النظام فوراً.
                    </div>
                  </div>
                </div>

                {/* كارت خيار 2: صفحة بيضاء نظيفة */}
                <div
                  className={`starter-option-card ${regData.starterMode === 'clean' ? 'selected' : ''}`}
                  onClick={() => setRegData({ ...regData, starterMode: 'clean' })}
                >
                  <div className="option-radio">
                    <div className="radio-inner" />
                  </div>
                  <div className="option-info">
                    <div className="option-title">البدء بحساب نظيف تماماً (صفحة بيضاء)</div>
                    <div className="option-desc">
                      يبدأ فقط بأرصدتك الافتتاحية المدخلة وبدون أي معاملات سابقة لتدير أموالك خطوة بخطوة من الصفر.
                    </div>
                  </div>
                </div>

                {/* بطاقة تأكيد الأمان والحماية */}
                <div className="security-guarantee-box">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--emerald)', fontWeight: 700, fontSize: 13 }}>
                    <Icon name="shield" size={18} />
                    <span>ضمان الأمان وخصوصية بياناتك المالية</span>
                  </div>
                  <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: '6px 0 0', lineHeight: 1.5 }}>
                    نظام صرفي مصمم بأحدث معايير الحماية الرقمية لضمان سرية كافة معاملاتك وأرصدتك المالية وحساباتك وعدم وصول أي طرف غير مصرح له.
                  </p>
                </div>

                {errorMsg && <div className="auth-error-badge">{errorMsg}</div>}

                <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setRegStep(2)}
                    disabled={isUnlocking}
                  >
                    ← السابق
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ flex: 1 }}
                    onClick={handleFinalRegister}
                    disabled={isUnlocking}
                  >
                    {isUnlocking ? 'جاري إنشاء وتفعيل الحساب...' : 'إنشاء وتفعيل الحساب فوراً 🚀'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
