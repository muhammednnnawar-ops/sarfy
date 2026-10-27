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

export const CURRENCIES = [
  { code: 'ج.م', name: 'جنيه مصري (EGP)', symbol: 'ج.م', country: '🇪🇬' },
  { code: 'ر.س', name: 'ريال سعودي (SAR)', symbol: 'ر.س', country: '🇸🇦' },
  { code: '$', name: 'دولار أمريكي (USD)', symbol: '$', country: '🇺🇸' },
  { code: 'د.إ', name: 'درهم إماراتي (AED)', symbol: 'د.إ', country: '🇦🇪' },
  { code: '€', name: 'يورو أوروبي (EUR)', symbol: '€', country: '🇪🇺' },
  { code: 'د.ك', name: 'دينار كويتي (KWD)', symbol: 'د.ك', country: '🇰🇼' }
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
  goalStatuses: ['جاري', 'مكتمل', 'متوقف', 'ملغي']
};

export function createInitialData(options = {}) {
  const currency = options.currency || 'ج.م';
  const userProfile = {
    fullName: options.fullName || 'مستخدم صرفي',
    email: options.email || 'user@sarfy.app',
    role: options.role || 'user',
    currency: currency,
    monthlyIncomeTarget: Number(options.monthlyIncomeTarget) || 25000,
    monthlyBudgetTarget: Number(options.monthlyBudgetTarget) || 12000,
    avatarSeed: (options.fullName || 'صرفي').slice(0, 2),
    createdAt: new Date().toISOString().split('T')[0],
    lastLogin: new Date().toISOString().split('T')[0],
    isRegistered: options.isRegistered !== undefined ? options.isRegistered : true
  };

  // إذا اختار المستخدم بدء صفحة بيضاء نظيفة تماماً بأرصدته المخصصة
  if (options.cleanSlate) {
    return {
      userProfile,
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
      settings: {
        currency: currency,
        incomeCats: [
          'راتب',
          'عمل حر',
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
    settings: {
      currency: 'ج.م',
      incomeCats: [
        'راتب',
        'عمل حر',
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
