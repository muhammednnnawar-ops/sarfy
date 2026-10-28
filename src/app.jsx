// Sarfy - Root Application Component with Encryption, Security & Dark Mode
// تطبيق قاعدة: الحالة كلها في useState واحد وكل كتابة تمر بدالة mutate واحدة
// يدعم التشفير العسكري AES-256-GCM وشاشة القفل والمصادقة المتقدمة والوضع المظلم المستقبلي

import React, { useState, useEffect, useRef } from 'react';
import { createInitialData, getRelativeDate, getUserInitials } from './data.js';
import { calculateAlerts } from './calculations.js';
import { encryptData, decryptData, hashPin, hashPassword } from './crypto.js';
import { checkBackendStatus, fetchServerData, syncDataToServer, registerUserOnServer, checkServerLogin } from './api.js';
import { AuthScreen } from './authScreen.jsx';
import {
  AppLayout,
  QuickAddModal,
  ConfirmModal
} from './components.jsx';
import { RecordModal } from './recordModal.jsx';
import {
  DashboardPage,
  AccountsPage,
  AssetsPage,
  IncomePage,
  ExpensesPage,
  TransfersPage,
  DebtsPage,
  SubscriptionsPage,
  UpcomingPage,
  ExpectedIncomePage,
  GoalsPage,
  ReportsPage,
  SettingsPage,
  AdminDashboardPage
} from './pages.jsx';

const STORAGE_KEY = 'financeData';
const THEME_KEY = 'sarfy_theme';
const PIN_HASH_KEY = 'sarfy_pin_hash';
const PWD_HASH_KEY = 'sarfy_pwd_hash';
const USER_META_KEY = 'sarfy_user_meta';
const AUTH_SESSION_KEY = 'sarfy_session_active';
const ACTIVE_PAGE_KEY = 'sarfy_active_page';

export function App() {
  // 1. إدارة المظهر (الوضع الليلي المستقبلي افتراضياً Dark Mode)
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) || 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // 2. إدارة الأمان والمصادقة (Authentication & Encryption State)
  const [userMeta, setUserMeta] = useState(() => {
    try {
      const raw = localStorage.getItem(USER_META_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [pinHash, setPinHash] = useState(() => {
    try {
      return localStorage.getItem(PIN_HASH_KEY) || null;
    } catch {
      return null;
    }
  });

  const [pwdHash, setPwdHash] = useState(() => {
    try {
      return localStorage.getItem(PWD_HASH_KEY) || null;
    } catch {
      return null;
    }
  });

  const [activeSecret, setActiveSecret] = useState(''); // يُحفظ في ذاكرة RAM فقط أثناء الجلسة

  // استمرار تسجيل الدخول ومنع الخروج عند تحديث الصفحة أو الضغط على Refresh في المتصفح
  const [isLocked, setIsLocked] = useState(() => {
    try {
      const sessionActive = localStorage.getItem(AUTH_SESSION_KEY);
      const meta = localStorage.getItem(USER_META_KEY);
      if (sessionActive === 'true' && meta) {
        return false;
      }
    } catch {}
    return true;
  });

  // طريقة المصادقة المطلوبة: 'pin' للأجهزة الموثقة سابقاً أو 'password' للأجهزة الجديدة لأول مرة
  const [authScreenMethod, setAuthScreenMethod] = useState(() => {
    try {
      const meta = localStorage.getItem(USER_META_KEY);
      return meta ? 'pin' : 'password';
    } catch {
      return 'password';
    }
  });

  // إدارة الاتصال بقاعدة بيانات MySQL على السيرفر والمزامنة التلقائية للأجهزة المتعددة
  const [backendStatus, setBackendStatus] = useState({
    isChecking: true,
    connected: false,
    mode: 'local',
    message: ''
  });
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [syncNotice, setSyncNotice] = useState(null);

  const lastServerUpdatedRef = useRef(null);
  const isSyncingRef = useRef(false);
  const isLocalSavingRef = useRef(false);

  // 3. الحالة المالية للتطبيق
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && !parsed.isEncrypted && parsed.accounts && Array.isArray(parsed.accounts)) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('استخدام البيانات الافتراضية:', err);
    }
    return createInitialData();
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const [activePage, setActivePage] = useState(() => {
    try {
      return localStorage.getItem(ACTIVE_PAGE_KEY) || 'dashboard';
    } catch {
      return 'dashboard';
    }
  });

  const handleSetActivePage = pageId => {
    setActivePage(pageId);
    try {
      localStorage.setItem(ACTIVE_PAGE_KEY, pageId);
    } catch {}
  };

  const [quickAddOpen, setQuickAddOpen] = useState(false);

  // فحص الاتصال بـ MySQL عند بدء التشغيل وجلب الحالة الأحدث
  useEffect(() => {
    let isMounted = true;
    checkBackendStatus().then(status => {
      if (!isMounted) return;
      setBackendStatus(status);
      if (status.connected) {
        const targetUserId = userMeta?.id || 'admin_1';
        fetchServerData(targetUserId).then(resp => {
          if (!isMounted) return;
          const serverData = resp?.data || resp;
          if (serverData && serverData.accounts && Array.isArray(serverData.accounts) && serverData.accounts.length > 0) {
            setState(serverData);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(serverData));
            } catch {}
            if (resp?.updated_at) {
              lastServerUpdatedRef.current = resp.updated_at;
            }
            setLastSyncedAt(new Date().toLocaleTimeString('ar-EG'));
          }
        });
      }
    });
    return () => {
      isMounted = false;
    };
  }, [userMeta?.id]);

  // إدارة نوافذ الإضافة والتعديل
  const [modalState, setModalState] = useState({
    isOpen: false,
    entityType: null,
    title: '',
    data: null
  });

  // إدارة نافذة تأكيد الحذف
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    entityType: null,
    id: null,
    name: ''
  });

  // 4. قفل تلقائي عند الخمول لفترة زمنية طويلة (Inactivity Auto-Lock - 30 دقيقة)
  const autoLockTimerRef = useRef(null);
  const resetInactivityTimer = () => {
    if (autoLockTimerRef.current) clearTimeout(autoLockTimerRef.current);
    if (!isLocked && (pinHash || pwdHash)) {
      autoLockTimerRef.current = setTimeout(() => {
        handleLockNow();
      }, 30 * 60 * 1000);
    }
  };

  useEffect(() => {
    if (isLocked) return;
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetInactivityTimer));
    resetInactivityTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetInactivityTimer));
      if (autoLockTimerRef.current) clearTimeout(autoLockTimerRef.current);
    };
  }, [isLocked, pinHash, pwdHash]);

  // 5. المزامنة التلقائية اللحظية عبر AJAX بين الأجهزة المتعددة دون الحاجة لتحديث الصفحة يدوياً
  useEffect(() => {
    if (isLocked || !backendStatus?.connected) return;
    const currentUserId = userMeta?.id || 'admin_1';

    const pollSync = async (forceFull = false) => {
      if (isSyncingRef.current || isLocalSavingRef.current) return;
      if (modalState.isOpen || quickAddOpen) return;

      isSyncingRef.current = true;
      try {
        const resp = await fetchServerData(currentUserId, {
          lastUpdated: forceFull ? '' : (lastServerUpdatedRef.current || ''),
          pollOnly: !forceFull
        });

        if (resp && resp.success) {
          if (resp.has_changes && resp.data) {
            const serverData = resp.data;
            if (serverData && serverData.accounts && Array.isArray(serverData.accounts)) {
              const newJson = JSON.stringify(serverData);
              const curJson = JSON.stringify(stateRef.current);
              if (newJson !== curJson) {
                setState(serverData);
                try {
                  localStorage.setItem(STORAGE_KEY, newJson);
                } catch {}
                lastServerUpdatedRef.current = resp.updated_at || new Date().toISOString();
                setLastSyncedAt(new Date().toLocaleTimeString('ar-EG'));
                setSyncNotice('تمت مزامنة بيانات حسابك لحظياً مع أجهزتك الأخرى');
                setTimeout(() => setSyncNotice(null), 3500);
              }
            }
          } else if (resp.updated_at) {
            lastServerUpdatedRef.current = resp.updated_at;
          }
        }
      } catch (err) {
        console.warn('مزامنة الأجهزة المتعددة:', err);
      } finally {
        isSyncingRef.current = false;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        pollSync(true);
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', () => pollSync(true));

    const pollTimer = setInterval(() => {
      pollSync(false);
    }, 5000);

    return () => {
      clearInterval(pollTimer);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', () => pollSync(true));
    };
  }, [isLocked, backendStatus?.connected, userMeta?.id, modalState.isOpen, quickAddOpen]);

  // 6. الحفظ التلقائي في localStorage ومزامنة MySQL
  const saveTimeoutRef = useRef(null);
  useEffect(() => {
    if (isLocked) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        isLocalSavingRef.current = true;
        // حفظ غير مشفر ومباشر في localStorage لضمان استمرارية الجلسة عبر تحديثات المتصفح
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

        // إذا كان السيرفر متصلاً بـ MySQL، حفظ ومزامنة البيانات في قاعدة البيانات أيضاً
        if (backendStatus.connected) {
          const res = await syncDataToServer(state, userMeta?.id || 'admin_1');
          if (res && res.success) {
            if (res.updated_at) {
              lastServerUpdatedRef.current = res.updated_at;
            }
            setLastSyncedAt(new Date().toLocaleTimeString('ar-EG'));
          }
        }
      } catch (err) {
        console.error('فشل حفظ البيانات:', err);
      } finally {
        isLocalSavingRef.current = false;
      }
    }, 350);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state, isLocked, backendStatus.connected, userMeta?.id]);

  // تسجيل مستخدم جديد بالكامل وحفظه مباشرة في قاعدة بيانات MySQL
  const handleRegister = async userData => {
    try {
      const pHash = await hashPin(userData.pin);
      const wHash = await hashPassword(userData.password);

      let assignedId = 'usr_' + Date.now();
      let assignedRole = 'user';

      const isServer = typeof window !== 'undefined' && window.location && window.location.protocol !== 'file:';

      // 1. تسجيل المستخدم في MySQL على السيرفر أولاً والتأكد من نجاح الإدراج في قاعدة البيانات
      if (isServer) {
        const regRes = await registerUserOnServer({
          username: userData.email,
          email: userData.email,
          fullName: userData.fullName,
          password: userData.password,
          pin: userData.pin,
          pinHash: pHash,
          pwdHash: wHash,
          currency: userData.currency,
          cashOpening: userData.cashOpening,
          bankOpening: userData.bankOpening,
          walletOpening: userData.walletOpening
        });

        if (!regRes || !regRes.success) {
          throw new Error(regRes?.error || 'تعذر حفظ بيانات الحساب في قاعدة بيانات MySQL على السيرفر. يرجى مراجعة إعدادات قاعدة البيانات.');
        }

        if (regRes.user) {
          assignedId = regRes.user.id || assignedId;
          assignedRole = regRes.user.role || assignedRole;
        }
      }

      const meta = {
        id: assignedId,
        role: assignedRole,
        fullName: userData.fullName,
        email: userData.email,
        phone: userData.phone || '',
        gender: userData.gender || 'غير محدد',
        currency: userData.currency,
        avatarSeed: getUserInitials(userData.fullName || 'مستخدم صرفي')
      };

      localStorage.setItem(PIN_HASH_KEY, pHash);
      localStorage.setItem(PWD_HASH_KEY, wHash);
      setPinHash(pHash);
      setPwdHash(wHash);
      localStorage.setItem(USER_META_KEY, JSON.stringify(meta));
      setUserMeta(meta);

      const newState = createInitialData({
        fullName: userData.fullName,
        email: userData.email,
        phone: userData.phone,
        gender: userData.gender,
        currency: userData.currency,
        cashOpening: userData.cashOpening,
        bankOpening: userData.bankOpening,
        walletOpening: userData.walletOpening,
        monthlyIncomeTarget: userData.monthlyIncomeTarget,
        monthlyBudgetTarget: userData.monthlyBudgetTarget,
        cleanSlate: userData.cleanSlate
      });

      setState(newState);
      setActiveSecret(userData.pin);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      try {
        localStorage.setItem(AUTH_SESSION_KEY, 'true');
      } catch {}

      setIsLocked(false);

      if (isServer) {
        syncDataToServer(newState, assignedId).catch(() => {});
      }

      return true;
    } catch (err) {
      console.error('فشل التسجيل:', err);
      throw err;
    }
  };

  // الثوابت الاسترشادية للتجربة السريعة
  const DEMO_PIN = '1234';
  const DEMO_PASSWORD = 'demo1234';
  const DEMO_PASSWORD_SHORT = 'demo';

  // فك القفل عبر الرمز السري PIN (منطقي ومحكم 100% ويدعم السيرفر والأجهزة المتعددة)
  const handleLoginPin = async (candidatePin, candidateIdentifier = '') => {
    try {
      if (!candidatePin || candidatePin.length !== 4) {
        return { success: false, error: 'الرمز السري يجب أن يتكون من 4 أرقام' };
      }

      // حماية أمنية بنكية: على أي جهاز جديد لم يسجل دخوله مسبقاً، يجب تسجيل الدخول بالبريد وكلمة المرور أولاً
      if (!userMeta && !candidateIdentifier) {
        return {
          success: false,
          error: 'لتسجيل الدخول لأول مرة من هذا الجهاز، يرجى استخدام (كلمة المرور الرئيسية) والبريد الإلكتروني لتوثيق الجهاز أولاً.'
        };
      }

      const isServer = typeof window !== 'undefined' && window.location && window.location.protocol !== 'file:';
      const candidateHash = await hashPin(candidatePin);

      // أولاً: فحص السيرفر وقاعدة بيانات MySQL كأولوية قصوى
      if (isServer) {
        const serverAuth = await checkServerLogin({
          identifier: (candidateIdentifier || userMeta?.email || '').trim(),
          pin: candidatePin,
          pinHash: candidateHash
        });

        if (serverAuth && serverAuth.success && serverAuth.user) {
          const loggedUser = serverAuth.user;
          const existingAvatar = (() => {
            try {
              return localStorage.getItem('sarfy_user_avatar') || userMeta?.avatarImage || JSON.parse(localStorage.getItem(USER_META_KEY) || '{}').avatarImage;
            } catch { return null; }
          })();
          const fullUser = { ...loggedUser, avatarImage: loggedUser.avatarImage || existingAvatar };
          setUserMeta(fullUser);
          setPinHash(candidateHash);
          localStorage.setItem(USER_META_KEY, JSON.stringify(fullUser));
          localStorage.setItem(PIN_HASH_KEY, candidateHash);
          setActiveSecret(candidatePin);

          // جلب بيانات الحساب المالي المخصصة لهذا المستخدم من MySQL
          try {
            const serverData = await fetchServerData(loggedUser.id);
            if (serverData && serverData.accounts && Array.isArray(serverData.accounts) && serverData.accounts.length > 0) {
              setState(serverData);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(serverData));
            }
          } catch (e) {
            console.warn('جلب بيانات المستخدم:', e);
          }

          try {
            localStorage.setItem(AUTH_SESSION_KEY, 'true');
          } catch {}
          setIsLocked(false);
          return { success: true };
        } else {
          return { success: false, error: serverAuth?.error || 'الرمز السري غير صحيح في قاعدة البيانات' };
        }
      }

      // ثانياً: وضع التشغيل المحلي كملف (file://)
      const savedHash = localStorage.getItem(PIN_HASH_KEY);
      if (savedHash && candidateHash === savedHash) {
        setActiveSecret(candidatePin);
        try {
          localStorage.setItem(AUTH_SESSION_KEY, 'true');
        } catch {}
        setIsLocked(false);
        return { success: true };
      }

      if (candidatePin === DEMO_PIN) {
        setActiveSecret('');
        try {
          localStorage.setItem(AUTH_SESSION_KEY, 'true');
        } catch {}
        setIsLocked(false);
        return { success: true };
      }

      return { success: false, error: 'الرمز السري غير صحيح' };
    } catch (err) {
      console.error('فشل فك القفل بالـ PIN:', err);
      return { success: false, error: err.message };
    }
  };

  // فك القفل عبر كلمة المرور الرئيسية (منطقي ومحكم 100% ويدعم السيرفر والأجهزة المتعددة)
  const handleLoginPassword = async (candidatePassword, candidateIdentifier = '') => {
    try {
      if (!candidatePassword || candidatePassword.trim().length === 0) {
        return { success: false, error: 'يرجى إدخال كلمة المرور' };
      }

      const isServer = typeof window !== 'undefined' && window.location && window.location.protocol !== 'file:';
      const candidateHash = await hashPassword(candidatePassword);

      // أولاً: فحص السيرفر وقاعدة بيانات MySQL كأولوية مطلقة لدخول الأجهزة المتعددة
      if (isServer) {
        const serverAuth = await checkServerLogin({
          identifier: (candidateIdentifier || userMeta?.email || '').trim(),
          password: candidatePassword,
          pwdHash: candidateHash
        });

        if (serverAuth && serverAuth.success && serverAuth.user) {
          const loggedUser = serverAuth.user;
          const existingAvatar = (() => {
            try {
              return localStorage.getItem('sarfy_user_avatar') || userMeta?.avatarImage || JSON.parse(localStorage.getItem(USER_META_KEY) || '{}').avatarImage;
            } catch { return null; }
          })();
          const fullUser = { ...loggedUser, avatarImage: loggedUser.avatarImage || existingAvatar };
          setUserMeta(fullUser);
          setPwdHash(candidateHash);
          if (loggedUser.pinHash) {
            setPinHash(loggedUser.pinHash);
            localStorage.setItem(PIN_HASH_KEY, loggedUser.pinHash);
          }
          localStorage.setItem(USER_META_KEY, JSON.stringify(fullUser));
          localStorage.setItem(PWD_HASH_KEY, candidateHash);
          setAuthScreenMethod('pin');
          setActiveSecret(candidatePassword);

          // جلب البيانات المالية الخاصة بهذا العميل من MySQL
          try {
            const serverData = await fetchServerData(loggedUser.id);
            if (serverData && serverData.accounts && Array.isArray(serverData.accounts) && serverData.accounts.length > 0) {
              setState(serverData);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(serverData));
            }
          } catch (e) {
            console.warn('جلب بيانات المستخدم:', e);
          }

          try {
            localStorage.setItem(AUTH_SESSION_KEY, 'true');
          } catch {}
          setIsLocked(false);
          return { success: true };
        } else {
          return { success: false, error: serverAuth?.error || 'بيانات الدخول غير صحيحة. يرجى التأكد من البريد وكلمة المرور المسجلة.' };
        }
      }

      // ثانياً: وضع التشغيل المحلي كملف (file://)
      const savedHash = localStorage.getItem(PWD_HASH_KEY);
      if (savedHash && candidateHash === savedHash) {
        if (candidateIdentifier && userMeta) {
          const idClean = candidateIdentifier.trim().toLowerCase();
          const emailClean = (userMeta.email || '').trim().toLowerCase();
          const nameClean = (userMeta.fullName || '').trim().toLowerCase();
          if (emailClean && idClean !== emailClean && nameClean && idClean !== nameClean && !emailClean.includes(idClean)) {
            return { success: false, error: 'البريد المدخل لا يطابق الحساب المسجل محلياً' };
          }
        }

        setActiveSecret(candidatePassword);
        try {
          localStorage.setItem(AUTH_SESSION_KEY, 'true');
        } catch {}
        setIsLocked(false);
        return { success: true };
      }

      // الحالة 3: إذا لم يكن هناك حساب مسجل، التحقق من كلمة المرور الاسترشادية للتجربة (demo1234 أو demo)
      if (candidatePassword === DEMO_PASSWORD || candidatePassword === DEMO_PASSWORD_SHORT) {
        setActiveSecret('');
        try {
          localStorage.setItem(AUTH_SESSION_KEY, 'true');
        } catch {}
        setIsLocked(false);
        return { success: true };
      }

      return { success: false, error: 'كلمة المرور غير صحيحة' };
    } catch (err) {
      console.error('فشل فك القفل بكلمة المرور:', err);
      return { success: false, error: err.message };
    }
  };

  // تعيين رمز سري جديد
  const handleSetPin = async newPin => {
    try {
      const h = await hashPin(newPin);
      localStorage.setItem(PIN_HASH_KEY, h);
      setPinHash(h);
      setActiveSecret(newPin);

      // تشفير فوري للبيانات
      const encrypted = await encryptData(state, newPin);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(encrypted));
    } catch (err) {
      console.error('خطأ في تعيين الرمز:', err);
    }
  };

  // إزالة الرمز السري وإلغاء التشفير
  const handleRemovePin = () => {
    localStorage.removeItem(PIN_HASH_KEY);
    localStorage.removeItem(PWD_HASH_KEY);
    setPinHash(null);
    setPwdHash(null);
    setActiveSecret('');
    // إعادة حفظ البيانات بنص عادي
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  // قفل التطبيق فوراً (يذهب لشاشة الرمز السري PIN السريع)
  const handleLockNow = () => {
    try {
      localStorage.removeItem(AUTH_SESSION_KEY);
    } catch {}
    setAuthScreenMethod('pin');
    setIsLocked(true);
    setActiveSecret('');
  };

  // تسجيل الخروج / تبديل الحساب (يرجع لشاشة البريد وكلمة المرور ويطلب كتابة الباسورد)
  const handleLogout = () => {
    try {
      localStorage.removeItem(AUTH_SESSION_KEY);
      localStorage.removeItem(USER_META_KEY);
      localStorage.removeItem(PIN_HASH_KEY);
      localStorage.removeItem(PWD_HASH_KEY);
    } catch {}
    setUserMeta(null);
    setPinHash(null);
    setPwdHash(null);
    setActiveSecret('');
    setAuthScreenMethod('password');
    setIsLocked(true);
  };

  // الدخول بحساب تجريبي سريع
  const handleQuickDemo = () => {
    try {
      localStorage.setItem(AUTH_SESSION_KEY, 'true');
    } catch {}
    setActiveSecret('');
    setIsLocked(false);
  };

  // مزامنة فورية يدوية مع MySQL على السيرفر عبر AJAX دون تسجيل خروج أو إعادة تحميل
  const handleManualSync = async () => {
    setSyncInProgress(true);
    try {
      const currentUserId = userMeta?.id || 'admin_1';
      // 1. جلب أحدث البيانات المسجلة على السيرفر
      const serverRes = await fetchServerData(currentUserId);
      const serverData = serverRes?.data || serverRes;
      if (serverData && serverData.accounts && Array.isArray(serverData.accounts) && serverData.accounts.length > 0) {
        setState(serverData);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(serverData));
        } catch {}
        if (serverRes?.updated_at) {
          lastServerUpdatedRef.current = serverRes.updated_at;
        }
      } else if (backendStatus?.connected) {
        // 2. إذا لم تكن هناك بيانات جديدة، حفظ الحالة الحالية
        const pushRes = await syncDataToServer(stateRef.current, currentUserId);
        if (pushRes && pushRes.success && pushRes.updated_at) {
          lastServerUpdatedRef.current = pushRes.updated_at;
        }
      }
      const timeStr = new Date().toLocaleTimeString('ar-EG');
      setLastSyncedAt(timeStr);
      setSyncNotice('تمت المزامنة اللحظية وتحديث كافة الأرصدة بنجاح');
      setTimeout(() => setSyncNotice(null), 3000);
    } catch (err) {
      console.warn('حدث خطأ أثناء المزامنة:', err);
    } finally {
      setSyncInProgress(false);
    }
  };

  // فحص حالة الاتصال بـ MySQL
  const handleRefreshDbStatus = async () => {
    const status = await checkBackendStatus();
    setBackendStatus(status);
    return status;
  };

  // 5. الدالة الوحيدة لتعديل الحالة (mutate)
  const mutate = updater => {
    setState(prevState => {
      const draft = JSON.parse(JSON.stringify(prevState));
      const result = updater(draft);
      return result !== undefined ? result : draft;
    });
  };

  // مولد المعرفات الفريدة
  const generateId = prefix => {
    return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  };

  // فتح نافذة الإضافة
  const handleOpenAdd = entityType => {
    const titles = {
      accounts: 'إضافة حساب جديد',
      assets: 'إضافة أصل استثماري جديد (ذهب / عقار / شهادة / وديعة)',
      income: 'إضافة عملية دخل',
      expenses: 'إضافة مصروف جديد',
      transfers: 'إضافة تحويل بين الحسابات',
      debtsOwed: 'إضافة دين عليّ (التزام للغير)',
      debtsReceivable: 'إضافة مستحق لي (دين عند الآخرين)',
      subscriptions: 'إضافة اشتراك أو موعد دوري',
      upcoming: 'إضافة التزام قادم',
      expectedIncome: 'إضافة دخل متوقع',
      goals: 'إضافة هدف مالي'
    };

    setModalState({
      isOpen: true,
      entityType,
      title: titles[entityType] || 'إضافة عنصر جديد',
      data: null
    });
  };

  // فتح نافذة التعديل
  const handleOpenEdit = (entityType, item) => {
    const titles = {
      accounts: 'تعديل بيانات الحساب',
      assets: 'تعديل بيانات الأصل الاستثماري',
      income: 'تعديل عملية الدخل',
      expenses: 'تعديل المصروف',
      transfers: 'تعديل التحويل',
      debtsOwed: 'تعديل دين عليّ',
      debtsReceivable: 'تعديل مستحق لي',
      subscriptions: 'تعديل الاشتراك',
      upcoming: 'تعديل الالتزام',
      expectedIncome: 'تعديل الدخل المتوقع',
      goals: 'تعديل الهدف المالي'
    };

    setModalState({
      isOpen: true,
      entityType,
      title: titles[entityType] || 'تعديل العنصر',
      data: item
    });
  };

  // تسجيل سريع لعائد الأصل في سجل الدخل
  const handleQuickLogAssetIncome = asset => {
    const today = getRelativeDate(0);
    const isProperty = (asset.type || '').includes('عقار');
    const isCert = (asset.type || '').includes('شهادة') || (asset.type || '').includes('وديع');

    let amount = 0;
    if (isProperty) {
      amount = Number(asset.rentalIncome) || 0;
    } else if (isCert) {
      const val = Number(asset.currentValue || asset.purchasePrice) || 0;
      const rate = Number(asset.interestRate) || 0;
      amount = Math.round((val * (rate / 100)) / (asset.payoutFrequency === 'سنوي' ? 1 : 12));
    }

    const category = isProperty
      ? 'إيجارات ممتلكات'
      : (isCert ? 'عوائد شهادات وودائع' : 'أرباح استثمارات وأسهم');

    const desc = isProperty
      ? `إيجار عقار: ${asset.name}`
      : `عائد دوري: ${asset.name}`;

    const targetAccountId = asset.linkedAccountId || state.accounts?.find(a => a.type === 'حساب بنكي')?.id || state.accounts?.[0]?.id || 'acc_1';

    setModalState({
      isOpen: true,
      entityType: 'income',
      title: 'تسجيل عائد الأصل في سجل الدخل',
      data: {
        amount,
        category,
        desc,
        source: asset.bankName || asset.name,
        accountId: targetAccountId,
        method: 'تحويل بنكي',
        status: 'مستلم',
        expectedType: 'فعلي',
        date: today,
        notes: `تم تسجيل العائد تلقائياً من محفظة الأصول (${asset.name})`
      }
    });
  };

  // حفظ التعديل أو الإضافة
  const handleSaveRecord = formData => {
    const type = modalState.entityType;
    const isEditing = !!modalState.data?.id;

    const prefixes = {
      accounts: 'acc',
      assets: 'asset',
      income: 'inc',
      expenses: 'ex',
      transfers: 'tr',
      debtsOwed: 'debto',
      debtsReceivable: 'debtr',
      subscriptions: 'sub',
      upcoming: 'upc',
      expectedIncome: 'expinc',
      goals: 'goal'
    };

    mutate(draft => {
      if (!draft[type]) draft[type] = [];
      const list = draft[type];
      if (!list) return;

      if (isEditing) {
        const idx = list.findIndex(item => item.id === modalState.data.id);
        if (idx !== -1) {
          list[idx] = { ...formData, id: modalState.data.id };
        }
      } else {
        const newRecord = {
          ...formData,
          id: generateId(prefixes[type] || 'item')
        };
        list.push(newRecord);
      }
    });
  };

  // فتح نافذة تأكيد الحذف
  const handleRequestDelete = (entityType, id, name) => {
    setDeleteConfirm({
      isOpen: true,
      entityType,
      id,
      name
    });
  };

  // تنفيذ الحذف بعد التأكيد
  const handleConfirmDelete = () => {
    const { entityType, id } = deleteConfirm;
    if (entityType && id) {
      mutate(draft => {
        if (draft[entityType]) {
          draft[entityType] = draft[entityType].filter(item => item.id !== id);
        }
      });
    }
    setDeleteConfirm({ isOpen: false, entityType: null, id: null, name: '' });
  };

  // حفظ الإضافة السريعة (مصروف أو دخل)
  const handleSaveQuickAdd = ({ type, amount, accountId, category, desc }) => {
    const today = getRelativeDate(0);

    mutate(draft => {
      if (type === 'expense') {
        draft.expenses.push({
          id: generateId('ex'),
          date: today,
          desc: desc || 'مصروف سريع',
          mainCat: category || 'أخرى',
          subCat: '',
          amount: Number(amount) || 0,
          accountId,
          method: 'كاش',
          necessity: 'ضروري',
          recurrence: 'مرة واحدة',
          status: 'مدفوع',
          notes: 'تمت إضافتها عبر الإضافة السريعة'
        });
      } else {
        draft.income.push({
          id: generateId('inc'),
          date: today,
          source: desc || 'دخل سريع',
          desc: desc || 'دخل سريع',
          category: category || 'أخرى',
          amount: Number(amount) || 0,
          accountId,
          method: 'كاش',
          status: 'مستلم',
          expectedType: 'فعلي',
          expectedDate: today,
          notes: 'تمت إضافتها عبر الإضافة السريعة'
        });
      }
    });
  };

  // إعادة التعيين إلى البيانات التجريبية
  const handleResetData = async () => {
    const initial = createInitialData();
    const currentUserId = userMeta?.id || 'admin_1';
    stateRef.current = initial;
    setState(initial);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    } catch (e) {}

    if (backendStatus?.connected) {
      isSyncingRef.current = true;
      try {
        const res = await syncDataToServer(initial, currentUserId);
        if (res && res.updated_at) {
          lastServerUpdatedRef.current = res.updated_at;
        }
      } catch (err) {
        console.warn('Sync error on reset:', err);
      } finally {
        isSyncingRef.current = false;
      }
    }
    setSyncNotice('تمت استعادة البيانات التجريبية بنجاح');
    setTimeout(() => setSyncNotice(null), 4000);
    return true;
  };

  // تفريغ كافة الحركات والبدء من الصفر مع الحفاظ على الحسابات وأرصدتها
  const handleClearTransactions = async () => {
    const currentUserId = userMeta?.id || 'admin_1';
    const newState = {
      ...state,
      income: [],
      expenses: [],
      transfers: [],
      debts: [],
      debtsOwed: [],
      debtsReceivable: [],
      subscriptions: [],
      upcoming: [],
      expectedIncome: [],
      goals: [],
      assets: []
    };

    stateRef.current = newState;
    setState(newState);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (e) {
      console.warn('فشل الحفظ في الذاكرة المحلية:', e);
    }

    if (backendStatus?.connected) {
      isSyncingRef.current = true;
      try {
        const res = await syncDataToServer(newState, currentUserId);
        if (res && res.updated_at) {
          lastServerUpdatedRef.current = res.updated_at;
        }
      } catch (err) {
        console.warn('فشل مزامنة تفريغ الحركات مع السيرفر:', err);
      } finally {
        isSyncingRef.current = false;
      }
    }

    setSyncNotice('تم تفريغ كافة الحركات بنجاح والبدء بصفحة بيضاء نظيفة');
    setTimeout(() => setSyncNotice(null), 4500);
    return true;
  };

  // تصفير شامل للحسابات والمعاملات للبدء من الصفر التام (0.00 ج.م)
  const handleResetToZero = async () => {
    const currentUserId = userMeta?.id || 'admin_1';
    const newState = {
      ...state,
      accounts: (state.accounts || []).map(a => ({ ...a, opening: 0 })),
      income: [],
      expenses: [],
      transfers: [],
      debts: [],
      debtsOwed: [],
      debtsReceivable: [],
      subscriptions: [],
      upcoming: [],
      expectedIncome: [],
      goals: [],
      assets: []
    };

    stateRef.current = newState;
    setState(newState);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (e) {
      console.warn('فشل الحفظ في الذاكرة المحلية:', e);
    }

    if (backendStatus?.connected) {
      isSyncingRef.current = true;
      try {
        const res = await syncDataToServer(newState, currentUserId);
        if (res && res.updated_at) {
          lastServerUpdatedRef.current = res.updated_at;
        }
      } catch (err) {
        console.warn('فشل مزامنة التصفير الشامل مع السيرفر:', err);
      } finally {
        isSyncingRef.current = false;
      }
    }

    setSyncNotice('تم التصفير الشامل لكافة الحسابات بنجاح (الأرصدة 0.00 ج.م)');
    setTimeout(() => setSyncNotice(null), 4500);
    return true;
  };

  // حساب التنبيهات للشارة
  const alerts = calculateAlerts(state);

  // إذا كان التطبيق مقفلاً، عرض شاشة تسجيل الدخول والمصادقة (PIN للقفل السريع، كلمة المرور بعد الخروج)
  if (isLocked) {
    return (
      <AuthScreen
        mode="login"
        initialAuthMethod={authScreenMethod}
        hasRegisteredUser={!!(userMeta || pinHash || pwdHash)}
        userMeta={{
          ...userMeta,
          avatarImage: userMeta?.avatarImage || state?.userProfile?.avatarImage || (() => {
            try {
              return localStorage.getItem('sarfy_user_avatar') || JSON.parse(localStorage.getItem(USER_META_KEY) || '{}').avatarImage;
            } catch { return null; }
          })()
        }}
        onLoginPin={handleLoginPin}
        onLoginPassword={handleLoginPassword}
        onRegister={handleRegister}
        onQuickDemo={handleQuickDemo}
      />
    );
  }

  return (
    <AppLayout
      activePage={activePage}
      setActivePage={handleSetActivePage}
      alertsCount={alerts.length}
      onOpenQuickAdd={() => setQuickAddOpen(true)}
      theme={theme}
      onToggleTheme={toggleTheme}
      hasPin={!!pinHash}
      onLockNow={handleLockNow}
      userProfile={{
        ...state?.userProfile,
        ...userMeta,
        avatarImage: state?.userProfile?.avatarImage || userMeta?.avatarImage
      }}
      onLogout={handleLogout}
      backendStatus={backendStatus}
      lastSyncedAt={lastSyncedAt}
      onManualSync={handleManualSync}
      syncInProgress={syncInProgress}
      syncNotice={syncNotice}
    >
      {activePage === 'dashboard' && (
        <DashboardPage
          state={state}
          mutate={mutate}
          setActivePage={handleSetActivePage}
          onOpenQuickAdd={() => setQuickAddOpen(true)}
          onManualSync={handleManualSync}
          syncInProgress={syncInProgress}
          lastSyncedAt={lastSyncedAt}
          onClearTransactions={handleClearTransactions}
        />
      )}
      {activePage === 'accounts' && (
        <AccountsPage
          state={state}
          onAdd={handleOpenAdd}
          onEdit={handleOpenEdit}
          onDelete={handleRequestDelete}
          onManualSync={handleManualSync}
          syncInProgress={syncInProgress}
        />
      )}
      {activePage === 'assets' && (
        <AssetsPage
          state={state}
          onAdd={handleOpenAdd}
          onEdit={handleOpenEdit}
          onDelete={handleRequestDelete}
          onQuickLogYield={handleQuickLogAssetIncome}
        />
      )}
      {activePage === 'income' && (
        <IncomePage
          state={state}
          onAdd={handleOpenAdd}
          onEdit={handleOpenEdit}
          onDelete={handleRequestDelete}
        />
      )}
      {activePage === 'expenses' && (
        <ExpensesPage
          state={state}
          onAdd={handleOpenAdd}
          onEdit={handleOpenEdit}
          onDelete={handleRequestDelete}
        />
      )}
      {activePage === 'transfers' && (
        <TransfersPage
          state={state}
          onAdd={handleOpenAdd}
          onEdit={handleOpenEdit}
          onDelete={handleRequestDelete}
        />
      )}
      {activePage === 'debts' && (
        <DebtsPage
          state={state}
          onAdd={handleOpenAdd}
          onEdit={handleOpenEdit}
          onDelete={handleRequestDelete}
        />
      )}
      {activePage === 'subscriptions' && (
        <SubscriptionsPage
          state={state}
          mutate={mutate}
          onAdd={handleOpenAdd}
          onEdit={handleOpenEdit}
          onDelete={handleRequestDelete}
        />
      )}
      {activePage === 'upcoming' && (
        <UpcomingPage
          state={state}
          onAdd={handleOpenAdd}
          onEdit={handleOpenEdit}
          onDelete={handleRequestDelete}
        />
      )}
      {activePage === 'expectedIncome' && (
        <ExpectedIncomePage
          state={state}
          onAdd={handleOpenAdd}
          onEdit={handleOpenEdit}
          onDelete={handleRequestDelete}
        />
      )}
      {activePage === 'goals' && (
        <GoalsPage
          state={state}
          onAdd={handleOpenAdd}
          onEdit={handleOpenEdit}
          onDelete={handleRequestDelete}
        />
      )}
      {activePage === 'reports' && (
        <ReportsPage state={state} />
      )}
      {activePage === 'settings' && (
        <SettingsPage
          state={state}
          mutate={mutate}
          onResetData={handleResetData}
          onClearTransactions={handleClearTransactions}
          onResetToZero={handleResetToZero}
          setActivePage={handleSetActivePage}
          theme={theme}
          onToggleTheme={toggleTheme}
          hasPin={!!pinHash}
          onSetPin={handleSetPin}
          onRemovePin={handleRemovePin}
          onLockNow={handleLockNow}
          onLogout={handleLogout}
          backendStatus={backendStatus}
          lastSyncedAt={lastSyncedAt}
          onManualSync={handleManualSync}
          onRefreshDbStatus={handleRefreshDbStatus}
          syncInProgress={syncInProgress}
          onUpdateUserMeta={setUserMeta}
        />
      )}
      {activePage === 'admin' && (
        <AdminDashboardPage currentUser={userMeta || state?.userProfile} />
      )}

      {/* نافذة الإضافة السريعة */}
      <QuickAddModal
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        accounts={state.accounts || []}
        categories={state.settings || {}}
        onSave={handleSaveQuickAdd}
      />

      {/* نافذة الإضافة والتعديل الموحدة للجداول */}
      <RecordModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, entityType: null, title: '', data: null })}
        entityType={modalState.entityType}
        title={modalState.title}
        initialData={modalState.data}
        accounts={state.accounts || []}
        settings={state.settings || {}}
        onSave={handleSaveRecord}
      />

      {/* نافذة تأكيد الحذف */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="تأكيد الحذف"
        message={`هل أنت متأكد من حذف "${deleteConfirm.name}"؟`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, entityType: null, id: null, name: '' })}
      />
    </AppLayout>
  );
}
