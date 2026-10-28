// Sarfy - Core Data Models and Demo Data
// متوافق مع مواصفات "برومبت بناء تطبيق محفظتي"

export function getRelativeDate(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '0.00';
  return Number(num).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export function formatCurrency(num, currency = 'ج.م') {
  return `${currency} ${formatNumber(num)}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    // DD/MM/YYYY
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

// استخراج أول حرف من الاسم الأول وأول حرف من الاسم الأخير للأفاتار (مثل: م ن)
export function getUserInitials(name) {
  if (!name || typeof name !== 'string') return 'ص';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'ص';
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  const first = parts[0].charAt(0).toUpperCase();
  const last = parts[parts.length - 1].charAt(0).toUpperCase();
  const isArabic = /[\u0600-\u06FF]/.test(name);
  return isArabic ? `${first} ${last}` : `${first}${last}`;
}

export const CURRENCIES = [
  { code: 'ج.م', name: 'جنيه مصري (EGP)', symbol: 'ج.م', country: 'EG' },
  { code: 'ر.س', name: 'ريال سعودي (SAR)', symbol: 'ر.س', country: 'SA' },
  { code: '$', name: 'دولار أمريكي (USD)', symbol: '$', country: 'US' },
  { code: 'د.إ', name: 'درهم إماراتي (AED)', symbol: 'د.إ', country: 'AE' },
  { code: '€', name: 'يورو أوروبي (EUR)', symbol: '€', country: 'EU' },
  { code: 'د.ك', name: 'دينار كويتي (KWD)', symbol: 'د.ك', country: 'KW' }
];

// تصنيفات مصاريف الشارع السريعة (أثناء التواجد بالخارج)
export const STREET_PRESETS = [
  {
    id: 'transport',
    title: 'مواصلات وأجرة',
    shortTitle: 'مواصلات',
    icon: 'car',
    category: 'مواصلات',
    suggestedAmounts: [10, 15, 20, 30, 50, 100],
    defaultAmount: 20
  },
  {
    id: 'gas',
    title: 'بنزين ووقود',
    shortTitle: 'بنزين',
    icon: 'fuel',
    category: 'مواصلات',
    suggestedAmounts: [100, 200, 300, 500, 800],
    defaultAmount: 200
  },
  {
    id: 'kiosk',
    title: 'مشتريات من الكشك',
    shortTitle: 'كشك',
    icon: 'store',
    category: 'طعام',
    suggestedAmounts: [10, 15, 25, 40, 50, 100],
    defaultAmount: 25
  },
  {
    id: 'coffee',
    title: 'قهوة ومشروبات',
    shortTitle: 'قهوة',
    icon: 'coffee',
    category: 'طعام',
    suggestedAmounts: [15, 25, 35, 50, 75],
    defaultAmount: 30
  },
  {
    id: 'food',
    title: 'أكل سريع / وجبة',
    shortTitle: 'أكل سريع',
    icon: 'food',
    category: 'طعام',
    suggestedAmounts: [30, 50, 75, 100, 150],
    defaultAmount: 50
  },
  {
    id: 'petty',
    title: 'فكة ونثريات',
    shortTitle: 'فكة ونثريات',
    icon: 'coin',
    category: 'أخرى',
    suggestedAmounts: [5, 10, 20, 50],
    defaultAmount: 10
  }
];

export const DROPDOWNS = {
  accountTypes: [
    'كاش',
    'حساب بنكي',
    'محفظة إلكترونية',
    'بطاقة',
    'حساب توفير',
    'استثمار',
    'حساب آخر'
  ],
  accountStatuses: ['نشط', 'مغلق'],
  paymentMethods: [
    'كاش',
    'بطاقة',
    'تحويل بنكي',
    'محفظة إلكترونية',
    'خصم مباشر',
    'أخرى'
  ],
  incomeStatuses: ['مستلم', 'متوقع', 'مؤجل', 'ملغي'],
  incomeExpectedTypes: ['فعلي', 'متوقع'],
  expenseStatuses: ['مدفوع', 'مستحق', 'مؤجل', 'ملغي'],
  necessityTypes: ['ضروري', 'غير ضروري'],
  recurrenceTypes: ['متكرر', 'مرة واحدة'],
  transferStatuses: ['مكتمل', 'معلق', 'ملغي'],
  debtStatuses: ['مفتوح', 'مدفوع جزئيًا', 'مكتمل', 'متأخر', 'ملغي'],
  debtProbabilities: ['عالية', 'متوسطة', 'منخفضة'],
  subscriptionStatuses: ['نشط', 'متوقف', 'ملغي', 'قادم'],
  intervalUnits: ['يوم', 'أسبوع', 'شهر', 'سنة'],
  subscriptionTypes: [
    'ترفيه',
    'عمل',
    'تعليم',
    'صحة ورياضة',
    'عناية شخصية',
    'تخزين سحابي',
    'أخرى'
  ],
  upcomingTypes: [
    'إيجار',
    'فاتورة',
    'قسط',
    'دين',
    'اشتراك',
    'مصروف متوقع',
    'أخرى'
  ],
  upcomingStatuses: ['قادم', 'مدفوع', 'مؤجل', 'ملغي'],
  priorities: ['عالية', 'متوسطة', 'منخفضة'],
  expectedIncomeStatuses: ['محتمل', 'مؤكد', 'مستلم', 'مؤجل', 'ملغي'],
  goalTypes: [
    'ادخار',
    'شراء',
    'صندوق طوارئ',
    'سفر',
    'استثمار',
    'سداد دين',
    'هدف آخر'
  ],
  goalStatuses: ['جاري', 'مكتمل', 'متوقف', 'ملغي'],
  assetTypes: [
    'ذهب وسبائك',
    'عقارات وأملاك',
    'شهادات بنكية',
    'ودائع لأجل',
    'أسهم واستثمارات',
    'أصول أخرى'
  ],
  goldKarats: [
    'عيار 24 (سبائك)',
    'عيار 21 (ذهب مصري)',
    'عيار 18',
    'جنيه دهب (8 جرام عيار 21)'
  ],
  propertyTypes: [
    'شقة سكنية',
    'محل تجاري',
    'أرض',
    'مكتب / إداري',
    'فيلا / عمارة',
    'أخرى'
  ],
  payoutFrequencies: [
    'شهري',
    'ربع سنوي',
    'نصف سنوي',
    'سنوي',
    'في نهاية المدة'
  ],
  assetStatuses: ['نشط', 'مؤجر', 'تم البيع', 'مستحق / منتهي'],
  genders: ['ذكر', 'أنثى', 'غير محدد']
};

// طرق الدفع/الاستلام المتاحة حسب نوع الحساب (الأولى هي الافتراضية عند اختيار الحساب)
const ACCOUNT_METHODS = {
  expenses: {
    'كاش': ['كاش'],
    'حساب بنكي': ['تحويل بنكي', 'بطاقة', 'خصم مباشر', 'أخرى'],
    'حساب توفير': ['تحويل بنكي', 'بطاقة', 'خصم مباشر', 'أخرى'],
    'محفظة إلكترونية': ['محفظة إلكترونية', 'خصم مباشر', 'أخرى'],
    'بطاقة': ['بطاقة', 'خصم مباشر', 'أخرى'],
    'استثمار': ['تحويل بنكي', 'أخرى']
  },
  income: {
    'كاش': ['كاش'],
    'حساب بنكي': ['تحويل بنكي', 'أخرى'],
    'حساب توفير': ['تحويل بنكي', 'أخرى'],
    'محفظة إلكترونية': ['محفظة إلكترونية', 'أخرى'],
    'بطاقة': ['بطاقة', 'تحويل بنكي', 'أخرى'],
    'استثمار': ['تحويل بنكي', 'أخرى']
  }
};

export function getMethodsForAccount(accountType, kind = 'expenses') {
  return ACCOUNT_METHODS[kind]?.[accountType] || DROPDOWNS.paymentMethods;
}

// الطريقة المناسبة للحساب: تُبقي الطريقة الحالية إن كانت متاحة له، وإلا تختار الافتراضية
export function resolveMethodForAccount(accountType, currentMethod, kind = 'expenses') {
  const allowed = getMethodsForAccount(accountType, kind);
  return allowed.includes(currentMethod) ? currentMethod : allowed[0];
}

export function createInitialData(options = {}) {
  const currency = options.currency || 'ج.م';
  const userProfile = {
    fullName: options.fullName || 'مستخدم صرفي',
    email: options.email || 'user@sarfy.app',
    phone: options.phone || '01012345678',
    gender: options.gender || 'ذكر',
    jobTitle: options.jobTitle || 'مهندس برمجيات واستثمار حر',
    city: options.city || 'القاهرة، مصر',
    birthDate: options.birthDate || '1995-05-15',
    financialGoal: options.financialGoal || 'تحقيق الاستقلال المالي وبناء محفظة أصول متنوعة',
    nationalId: options.nationalId || '',
    role: options.role || 'user',
    currency: currency,
    monthlyIncomeTarget: Number(options.monthlyIncomeTarget) || 25000,
    monthlyBudgetTarget: Number(options.monthlyBudgetTarget) || 12000,
    avatarSeed: getUserInitials(options.fullName || 'مستخدم صرفي'),
    avatarImage: options.avatarImage || null,
    createdAt: new Date().toISOString().split('T')[0],
    lastLogin: new Date().toISOString().split('T')[0],
    isRegistered: options.isRegistered !== undefined ? options.isRegistered : true
  };

  // إذا اختار المستخدم بدء صفحة بيضاء نظيفة تماماً بأرصدته المخصصة
  if (options.cleanSlate) {
    return {
      userProfile: {
        ...userProfile,
        fullName: options.fullName || 'مستخدم جديد',
        email: options.email || '',
        phone: options.phone || '',
        gender: options.gender || 'غير محدد',
        jobTitle: options.jobTitle || '',
        city: options.city || '',
        birthDate: options.birthDate || '',
        financialGoal: options.financialGoal || '',
        nationalId: options.nationalId || ''
      },
      accounts: [
        {
          id: 'acc_1',
          name: 'محفظة كاش',
          type: 'كاش',
          opening: Number(options.cashOpening) || 0,
          status: 'نشط',
          notes: 'النقدية اليدوية واليومية'
        },
        {
          id: 'acc_2',
          name: options.bankName || 'حساب البنك الرئيسي',
          type: 'حساب بنكي',
          opening: Number(options.bankOpening) || 0,
          status: 'نشط',
          notes: 'الحساب المصرفي الأساسي'
        },
        {
          id: 'acc_3',
          name: options.walletName || 'محفظة إلكترونية (فودافون كاش / إنستاباي)',
          type: 'محفظة إلكترونية',
          opening: Number(options.walletOpening) || 0,
          status: 'نشط',
          notes: 'المحفظة الذكية للمدفوعات السريعة'
        }
      ],
      income: [],
      expenses: [],
      transfers: [],
      debts: [],
      subscriptions: [],
      upcoming: [],
      expectedIncome: [],
      goals: [],
      assets: [],
      settings: {
        currency: currency,
        incomeCats: [
          'راتب',
          'عمل حر',
          'عوائد شهادات وودائع',
          'إيجارات ممتلكات',
          'فوائد حسابات بنكية',
          'أرباح استثمارات وأسهم',
          'مشروع',
          'مكافأة',
          'هدية',
          'استثمار',
          'بيع',
          'أخرى'
        ],
        expenseCats: [
          'طعام',
          'مواصلات',
          'منزل',
          'فواتير',
          'اتصالات وإنترنت',
          'صحة',
          'تعليم',
          'ترفيه',
          'تسوق',
          'ملابس',
          'عمل',
          'هدايا',
          'سفر',
          'أخرى'
        ],
        categoryBudgets: {
          طعام: 2000,
          ترفيه: 500
        }
      }
    };
  }

  // الوضع الافتراضي الإرشادي (يطابق معايير القبول الحسابية بنسبة 100%)
  return {
    userProfile,
    accounts: [
      {
        id: 'acc_1',
        name: 'محفظة كاش',
        type: 'كاش',
        opening: 3000,
        status: 'نشط',
        notes: 'مصاريف نقدية يومية'
      },
      {
        id: 'acc_2',
        name: 'حساب البنك الأهلي',
        type: 'حساب بنكي',
        opening: 25000,
        status: 'نشط',
        notes: 'الحساب الرئيسي لتحويل الراتب'
      },
      {
        id: 'acc_3',
        name: 'فودافون كاش',
        type: 'محفظة إلكترونية',
        opening: 1500,
        status: 'نشط',
        notes: 'مدفوعات سريعة وفريلانس'
      }
    ],
    income: [
      {
        id: 'inc_1',
        date: getRelativeDate(-25),
        source: 'الأهلي',
        desc: 'راتب شهري',
        category: 'راتب',
        amount: 18000,
        accountId: 'acc_2',
        method: 'تحويل بنكي',
        status: 'مستلم',
        expectedType: 'فعلي',
        expectedDate: getRelativeDate(-25),
        notes: 'استلام راتب العمل'
      },
      {
        id: 'inc_2',
        date: getRelativeDate(-10),
        source: 'فودافون كاش',
        desc: 'فريلانس تطوير واجهات',
        category: 'عمل حر',
        amount: 4000,
        accountId: 'acc_3',
        method: 'محفظة إلكترونية',
        status: 'مستلم',
        expectedType: 'فعلي',
        expectedDate: getRelativeDate(-10),
        notes: 'دفعة مستلمة عن مشروع مستقل'
      },
      {
        id: 'inc_3',
        date: getRelativeDate(20),
        source: 'الأهلي',
        desc: 'راتب الشهر القادم',
        category: 'راتب',
        amount: 18000,
        accountId: 'acc_2',
        method: 'تحويل بنكي',
        status: 'متوقع',
        expectedType: 'متوقع',
        expectedDate: getRelativeDate(20),
        notes: 'مستحق في نهاية الشهر'
      }
    ],
    expenses: [
      {
        id: 'ex_1',
        date: getRelativeDate(-20),
        desc: 'إيجار السكن',
        mainCat: 'منزل',
        subCat: 'إيجار شهري',
        amount: 4500,
        accountId: 'acc_2',
        method: 'تحويل بنكي',
        necessity: 'ضروري',
        recurrence: 'متكرر',
        status: 'مدفوع',
        notes: 'تم الدفع للمالك'
      },
      {
        id: 'ex_2',
        date: getRelativeDate(-15),
        desc: 'مشتريات سوبر ماركت',
        mainCat: 'طعام',
        subCat: 'بقالة شهرية',
        amount: 1200,
        accountId: 'acc_1',
        method: 'كاش',
        necessity: 'ضروري',
        recurrence: 'متكرر',
        status: 'مدفوع',
        notes: 'خضار وفواكه ومؤن'
      },
      {
        id: 'ex_3',
        date: getRelativeDate(-8),
        desc: 'اشتراك نتفليكس',
        mainCat: 'ترفيه',
        subCat: 'اشتراك شهري',
        amount: 250,
        accountId: 'acc_3',
        method: 'محفظة إلكترونية',
        necessity: 'غير ضروري',
        recurrence: 'متكرر',
        status: 'مدفوع',
        notes: 'باقة العائلة'
      },
      {
        id: 'ex_4',
        date: getRelativeDate(-5),
        desc: 'تفويلة بنزين',
        mainCat: 'مواصلات',
        subCat: 'وقود السيارة',
        amount: 600,
        accountId: 'acc_1',
        method: 'كاش',
        necessity: 'ضروري',
        recurrence: 'متكرر',
        status: 'مدفوع',
        notes: 'بنزين 95'
      }
    ],
    transfers: [
      {
        id: 'tr_1',
        date: getRelativeDate(-12),
        fromAccountId: 'acc_2',
        toAccountId: 'acc_1',
        amount: 2000,
        fee: 0,
        status: 'مكتمل',
        notes: 'سحب كاش من الـ ATM للمصروف'
      }
    ],
    debtsOwed: [
      {
        id: 'debto_1',
        person: 'أحمد',
        desc: 'سداد جزء من قرض شخصي',
        original: 5000,
        paid: 2000,
        startDate: getRelativeDate(-30),
        dueDate: getRelativeDate(30),
        status: 'مدفوع جزئيًا',
        accountId: 'acc_2',
        notes: 'المتبقي 3000 ج.م'
      }
    ],
    debtsReceivable: [
      {
        id: 'debtr_1',
        person: 'مينا',
        desc: 'سلفة مشروع عمل',
        original: 1200,
        received: 0,
        startDate: getRelativeDate(-15),
        dueDate: getRelativeDate(15),
        status: 'مفتوح',
        probability: 'عالية',
        notes: 'سيتم السداد منتصف الشهر'
      }
    ],
    subscriptions: [
      {
        id: 'sub_1',
        name: 'نتفليكس',
        type: 'ترفيه',
        value: 250,
        intervalValue: 1,
        intervalUnit: 'شهر',
        startDate: getRelativeDate(-60),
        nextRenewal: getRelativeDate(22),
        accountId: 'acc_3',
        autoRenew: true,
        status: 'نشط',
        lastPayment: getRelativeDate(-8),
        notes: 'تجديد شهري تلقائي'
      },
      {
        id: 'sub_2',
        name: 'حلاقة',
        type: 'عناية شخصية',
        value: 150,
        intervalValue: 3,
        intervalUnit: 'أسبوع',
        startDate: getRelativeDate(-40),
        nextRenewal: getRelativeDate(3),
        accountId: 'acc_1',
        autoRenew: false,
        status: 'نشط',
        lastPayment: getRelativeDate(-18),
        notes: 'صالون الحلاقة كل 3 أسابيع'
      },
      {
        id: 'sub_3',
        name: 'iCloud',
        type: 'تخزين سحابي',
        value: 33,
        intervalValue: 1,
        intervalUnit: 'شهر',
        startDate: getRelativeDate(-90),
        nextRenewal: getRelativeDate(15),
        accountId: 'acc_2',
        autoRenew: true,
        status: 'نشط',
        lastPayment: getRelativeDate(-15),
        notes: 'مساحة تخزين 50 جيجا'
      },
      {
        id: 'sub_4',
        name: 'تنظيف جير الأسنان',
        type: 'صحة ورياضة',
        value: 400,
        intervalValue: 6,
        intervalUnit: 'شهر',
        startDate: getRelativeDate(-120),
        nextRenewal: getRelativeDate(60),
        accountId: 'acc_2',
        autoRenew: false,
        status: 'نشط',
        lastPayment: getRelativeDate(-120),
        notes: 'متابعة دورية كل 6 أشهر'
      }
    ],
    upcoming: [
      {
        id: 'upc_1',
        name: 'إيجار السكن القادم',
        type: 'إيجار',
        amount: 4500,
        dueDate: getRelativeDate(10),
        accountId: 'acc_2',
        priority: 'عالية',
        status: 'قادم',
        recurring: true,
        source: 'المالك',
        notes: 'إيجار الشهر الجديد'
      },
      {
        id: 'upc_2',
        name: 'قسط الموبايل',
        type: 'قسط',
        amount: 800,
        dueDate: getRelativeDate(6),
        accountId: 'acc_2',
        priority: 'متوسطة',
        status: 'قادم',
        recurring: false,
        source: 'فاليو',
        notes: 'القسط الرابع'
      }
    ],
    expectedIncome: [
      {
        id: 'expinc_1',
        source: 'شركة الأمل',
        client: 'أ. طارق',
        desc: 'مشروع تصميم هوية',
        amount: 6000,
        probability: 0.6,
        expectedDate: getRelativeDate(14),
        accountId: 'acc_2',
        status: 'محتمل',
        actualReceived: null,
        notes: 'بانتهاء مرحلة التسليم النهائي'
      }
    ],
    goals: [
      {
        id: 'goal_1',
        name: 'صندوق الطوارئ',
        type: 'صندوق طوارئ',
        target: 30000,
        current: 9000,
        startDate: getRelativeDate(-90),
        targetDate: getRelativeDate(270),
        priority: 'عالية',
        status: 'جاري',
        accountId: 'acc_2',
        notes: 'تغطية مصاريف 6 أشهر'
      },
      {
        id: 'goal_2',
        name: 'رحلة الساحل الشمالي',
        type: 'سفر',
        target: 8000,
        current: 8000,
        startDate: getRelativeDate(-60),
        targetDate: getRelativeDate(-5),
        priority: 'متوسطة',
        status: 'مكتمل',
        accountId: 'acc_1',
        notes: 'اكتمل المبلغ بالكامل وتم السفر'
      }
    ],
    assets: [
      {
        id: 'asset_1',
        name: 'سبيكة ذهب BTC عيار 24 (20 جرام)',
        type: 'ذهب وسبائك',
        category: 'ذهب',
        weightGrams: 20,
        karat: 'عيار 24 (سبائك)',
        purchasePrice: 70000,
        currentValue: 84000,
        purchaseDate: getRelativeDate(-180),
        status: 'نشط',
        notes: 'سبيكة مغلفة BTC معتمدة عيار 24 للاستثمار والادخار طويل الأجل'
      },
      {
        id: 'asset_2',
        name: 'شقة سكنية بالنرجس (مؤجرة)',
        type: 'عقارات وأملاك',
        category: 'عقار',
        propertyType: 'شقة سكنية',
        location: 'حي النرجس، التجمع الخامس، القاهرة الجديدة',
        purchasePrice: 2400000,
        currentValue: 3200000,
        isRented: true,
        rentalIncome: 15000,
        rentalFrequency: 'شهري',
        rentalTenant: 'م. طارق عبد الرحمن',
        linkedAccountId: 'acc_2',
        purchaseDate: getRelativeDate(-720),
        status: 'نشط',
        notes: 'عقد إيجار سنوي مجدد، إيجار شهري 15,000 ج.م يُصرف في أول كل شهر'
      },
      {
        id: 'asset_3',
        name: 'شهادة البنك الأهلي البلاتينية السنوية',
        type: 'شهادات بنكية',
        category: 'شهادة',
        bankName: 'البنك الأهلي المصري',
        purchasePrice: 100000,
        currentValue: 100000,
        interestRate: 23.5,
        payoutFrequency: 'شهري',
        maturityDate: getRelativeDate(365),
        linkedAccountId: 'acc_2',
        purchaseDate: getRelativeDate(-120),
        status: 'نشط',
        notes: 'عائد سنوي 23.5% يُصرف شهرياً (~1,958 ج.م) على الحساب الجاري بالبنك الأهلي'
      },
      {
        id: 'asset_4',
        name: 'وديعة بنك مصر السداسية',
        type: 'ودائع لأجل',
        category: 'وديعة',
        bankName: 'بنك مصر',
        purchasePrice: 50000,
        currentValue: 50000,
        interestRate: 18.0,
        payoutFrequency: 'نصف سنوي',
        maturityDate: getRelativeDate(90),
        linkedAccountId: 'acc_2',
        purchaseDate: getRelativeDate(-90),
        status: 'نشط',
        notes: 'وديعة 6 أشهر بعائد ثابت 18%'
      }
    ],
    settings: {
      currency: 'ج.م',
      incomeCats: [
        'راتب',
        'عمل حر',
        'عوائد شهادات وودائع',
        'إيجارات ممتلكات',
        'فوائد حسابات بنكية',
        'أرباح استثمارات وأسهم',
        'مشروع',
        'مكافأة',
        'هدية',
        'استثمار',
        'بيع',
        'أخرى'
      ],
      expenseCats: [
        'طعام',
        'مواصلات',
        'منزل',
        'فواتير',
        'اتصالات وإنترنت',
        'صحة',
        'تعليم',
        'ترفيه',
        'تسوق',
        'ملابس',
        'عمل',
        'هدايا',
        'سفر',
        'أخرى'
      ],
      categoryBudgets: {
        طعام: 2000,
        ترفيه: 500
      }
    }
  };
}
