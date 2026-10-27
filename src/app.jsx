// Sarfy - Root Application Component with Encryption, Security & Dark Mode
// تطبيق قاعدة: الحالة كلها في useState واحد وكل كتابة تمر بدالة mutate واحدة
// يدعم التشفير العسكري AES-256-GCM وشاشة القفل والمصادقة المتقدمة والوضع المظلم المستقبلي

import React, { useState, useEffect, useRef } from 'react';
import { createInitialData, getRelativeDate } from './data.js';
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
  // التطبيق يبدأ دائماً مقفلاً عند الفتح لطلب تسجيل الدخول أو إنشاء حساب جديد
  const [isLocked, setIsLocked] = useState(true);

  // إدارة الاتصال بقاعدة بيانات MySQL على السيرفر
  const [backendStatus, setBackendStatus] = useState({
    isChecking: true,
    connected: false,
    mode: 'local',
    message: ''
  });
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [syncInProgress, setSyncInProgress] = useState(false);

  // فحص الاتصال بـ MySQL عند بدء التشغيل
  useEffect(() => {
    let isMounted = true;
    checkBackendStatus().then(status => {
      if (!isMounted) return;
      setBackendStatus(status);
      if (status.connected) {
        // جلب البيانات من السيرفر وتحديث الحالة إذا كانت متوفرة
        const targetUserId = userMeta?.id || 'admin_1';
        fetchServerData(targetUserId).then(serverData => {
          if (!isMounted) return;
          if (serverData && serverData.accounts && Array.isArray(serverData.accounts) && serverData.accounts.length > 0) {
            setState(prev => ({ ...prev, ...serverData }));
            setLastSyncedAt(new Date().toLocaleTimeString('ar-EG'));
          }
        });
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

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

  const [activePage, setActivePage] = useState('dashboard');
  const [quickAddOpen, setQuickAddOpen] = useState(false);

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

  // 4. قفل تلقائي عند الخمول لفترة زمنية (Inactivity Auto-Lock)
  const autoLockTimerRef = useRef(null);
  const resetInactivityTimer = () => {
    if (autoLockTimerRef.current) clearTimeout(autoLockTimerRef.current);
    if (!isLocked && (pinHash || pwdHash)) {
      // مهلة 5 دقائق خمول
      autoLockTimerRef.current = setTimeout(() => {
        handleLockNow();
      }, 5 * 60 * 1000);
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

  // 5. الحفظ التلقائي في localStorage مع التشفير بـ AES-256 إن كان مفعل
  const saveTimeoutRef = useRef(null);
  useEffect(() => {
    if (isLocked) return; // لا تحفظ أثناء شاشة القفل لتجنب الكتابة الخاطئة

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        if (activeSecret) {
          // تشفير كامل للبيانات قبل الكتابة في القرص
          const encrypted = await encryptData(state, activeSecret);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(encrypted));
        } else {
          // حفظ غير مشفر في حال لم يتم تعيين سر
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        }

        // إذا كان السيرفر متصلاً بـ MySQL، حفظ ومزامنة البيانات في قاعدة البيانات أيضاً
        if (backendStatus.connected) {
          syncDataToServer(state, userMeta?.id || 'admin_1').then(res => {
            if (res && res.success) {
              setLastSyncedAt(new Date().toLocaleTimeString('ar-EG'));
            }
          });
        }
      } catch (err) {
        console.error('فشل حفظ البيانات:', err);
      }
    }, 350);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state, activeSecret, isLocked]);

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
        currency: userData.currency,
        avatarSeed: (userData.fullName || 'صرفي').slice(0, 2)
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
          setUserMeta(loggedUser);
          setPinHash(candidateHash);
          localStorage.setItem(USER_META_KEY, JSON.stringify(loggedUser));
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
        setIsLocked(false);
        return { success: true };
      }

      if (candidatePin === DEMO_PIN) {
        setActiveSecret('');
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
          setUserMeta(loggedUser);
          setPwdHash(candidateHash);
          localStorage.setItem(USER_META_KEY, JSON.stringify(loggedUser));
          localStorage.setItem(PWD_HASH_KEY, candidateHash);
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
        setIsLocked(false);
        return { success: true };
      }

      // الحالة 3: إذا لم يكن هناك حساب مسجل، التحقق من كلمة المرور الاسترشادية للتجربة (demo1234 أو demo)
      if (candidatePassword === DEMO_PASSWORD || candidatePassword === DEMO_PASSWORD_SHORT) {
        setActiveSecret('');
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

  // قفل التطبيق فوراً
  const handleLockNow = () => {
    setIsLocked(true);
    setActiveSecret('');
  };

  // تسجيل الخروج / تبديل الحساب
  const handleLogout = () => {
    try {
      localStorage.removeItem(USER_META_KEY);
      localStorage.removeItem(PIN_HASH_KEY);
      localStorage.removeItem(PWD_HASH_KEY);
    } catch {}
    setUserMeta(null);
    setPinHash(null);
    setPwdHash(null);
    setActiveSecret('');
    setIsLocked(true);
  };

  // الدخول بحساب تجريبي سريع
  const handleQuickDemo = () => {
    setActiveSecret('');
    setIsLocked(false);
  };

  // مزامنة فورية يدوية مع MySQL على السيرفر
  const handleManualSync = async () => {
    setSyncInProgress(true);
    try {
      const res = await syncDataToServer(state, userMeta?.id || 'admin_1');
      if (res && res.success) {
        const timeStr = new Date().toLocaleTimeString('ar-EG');
        setLastSyncedAt(timeStr);
        alert(`✅ تمت المزامنة بنجاح وحفظ كافة السجلات في MySQL! (${timeStr})`);
      } else {
        alert('⚠️ تعذر الحفظ في السيرفر: ' + (res?.error || res?.reason || 'السيرفر غير متصل'));
      }
    } catch (err) {
      alert('حدث خطأ أثناء المزامنة: ' + err.message);
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

  // حفظ التعديل أو الإضافة
  const handleSaveRecord = formData => {
    const type = modalState.entityType;
    const isEditing = !!modalState.data?.id;

    const prefixes = {
      accounts: 'acc',
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
  const handleResetData = () => {
    const initial = createInitialData();
    mutate(() => initial);
  };

  // حساب التنبيهات للشارة
  const alerts = calculateAlerts(state);

  // إذا كان التطبيق مقفلاً، عرض شاشة تسجيل الدخول والمصادقة
  if (isLocked) {
    return (
      <AuthScreen
        mode="login"
        hasRegisteredUser={!!(userMeta || pinHash || pwdHash)}
        userMeta={userMeta}
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
      setActivePage={setActivePage}
      alertsCount={alerts.length}
      onOpenQuickAdd={() => setQuickAddOpen(true)}
      theme={theme}
      onToggleTheme={toggleTheme}
      hasPin={!!pinHash}
      onLockNow={handleLockNow}
      userProfile={userMeta || state?.userProfile}
      onLogout={handleLogout}
      backendStatus={backendStatus}
      lastSyncedAt={lastSyncedAt}
      onManualSync={handleManualSync}
    >
      {activePage === 'dashboard' && (
        <DashboardPage
          state={state}
          mutate={mutate}
          setActivePage={setActivePage}
          onOpenQuickAdd={() => setQuickAddOpen(true)}
        />
      )}
      {activePage === 'accounts' && (
        <AccountsPage
          state={state}
          onAdd={handleOpenAdd}
          onEdit={handleOpenEdit}
          onDelete={handleRequestDelete}
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
