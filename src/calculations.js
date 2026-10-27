// Sarfy - Financial Calculation Engine
// يطبق القواعد الحاكمة والمعادلات الرياضية بدقة متناهية

import { getRelativeDate } from './data.js';

// المعادل الشهري للاشتراك: القيمة ÷ (كل كام × طول الوحدة بالأشهر)
export function calculateSubscriptionMonthly(sub) {
  const value = Number(sub.value) || 0;
  const interval = Number(sub.intervalValue) || 1;
  const unit = sub.intervalUnit || 'شهر';

  let unitLengthInMonths = 1;
  if (unit === 'يوم') {
    unitLengthInMonths = 1 / 30.44;
  } else if (unit === 'أسبوع') {
    unitLengthInMonths = 7 / 30.44;
  } else if (unit === 'شهر') {
    unitLengthInMonths = 1;
  } else if (unit === 'سنة') {
    unitLengthInMonths = 12;
  }

  const intervalInMonths = interval * unitLengthInMonths;
  if (intervalInMonths <= 0) return 0;
  return value / intervalInMonths;
}

// حساب الموعد القادم لزر "تمّت الآن"
export function calculateNextRenewalDate(intervalValue, intervalUnit) {
  const interval = Number(intervalValue) || 1;
  const unit = intervalUnit || 'شهر';

  let days = 30;
  if (unit === 'يوم') {
    days = Math.round(interval * 1);
  } else if (unit === 'أسبوع') {
    days = Math.round(interval * 7);
  } else if (unit === 'شهر') {
    days = Math.round(interval * 30.44);
  } else if (unit === 'سنة') {
    days = Math.round(interval * 365.25);
  }

  return getRelativeDate(days);
}

// حساب أرصدة الحسابات بدقة
export function calculateAccountBalances(state) {
  const accountsMap = {};

  (state.accounts || []).forEach(acc => {
    accountsMap[acc.id] = {
      ...acc,
      opening: Number(acc.opening) || 0,
      incomeReceived: 0,
      expensesPaid: 0,
      transfersIn: 0,
      transfersOut: 0,
      currentBalance: Number(acc.opening) || 0
    };
  });

  // 1. الدخل: يدخل في الرصيد إذا كانت حالته "مستلم" فقط
  (state.income || []).forEach(inc => {
    if (inc.status === 'مستلم' && accountsMap[inc.accountId]) {
      const amt = Number(inc.amount) || 0;
      accountsMap[inc.accountId].incomeReceived += amt;
    }
  });

  // 2. المصروفات: تُخصم من الرصيد إذا كانت حالتها "مدفوع" فقط
  (state.expenses || []).forEach(exp => {
    if (exp.status === 'مدفوع' && accountsMap[exp.accountId]) {
      const amt = Number(exp.amount) || 0;
      accountsMap[exp.accountId].expensesPaid += amt;
    }
  });

  // 3. التحويلات: تُحسب إذا كانت حالتها "مكتمل" فقط
  // الخارج من المصدر = المبلغ + الرسوم
  // الداخل للمستلم = المبلغ
  (state.transfers || []).forEach(tr => {
    if (tr.status === 'مكتمل') {
      const amt = Number(tr.amount) || 0;
      const fee = Number(tr.fee) || 0;

      if (accountsMap[tr.fromAccountId]) {
        accountsMap[tr.fromAccountId].transfersOut += amt + fee;
      }
      if (accountsMap[tr.toAccountId]) {
        accountsMap[tr.toAccountId].transfersIn += amt;
      }
    }
  });

  // حساب الرصيد الحالي النهائي
  Object.keys(accountsMap).forEach(id => {
    const acc = accountsMap[id];
    acc.currentBalance =
      acc.opening +
      acc.incomeReceived +
      acc.transfersIn -
      acc.expensesPaid -
      acc.transfersOut;
  });

  return accountsMap;
}

// حساب بطاقات لوحة التحكم الـ 10 + الرقم الكبير
export function calculateDashboardMetrics(state) {
  const accountBalances = calculateAccountBalances(state);

  // 1. الرقم الكبير: إجمالي الأموال = مجموع أرصدة الحسابات
  const totalMoney = Object.values(accountBalances).reduce(
    (sum, acc) => sum + acc.currentBalance,
    0
  );

  // 2. الدخل المستلم: مجموع الدخل بحالة "مستلم"
  const receivedIncome = (state.income || [])
    .filter(inc => inc.status === 'مستلم')
    .reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);

  // 3. المصروفات المدفوعة: مجموع المصروفات بحالة "مدفوع"
  const paidExpenses = (state.expenses || [])
    .filter(exp => exp.status === 'مدفوع')
    .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

  // 4. صافي التدفق: الدخل المستلم - المصروفات المدفوعة
  const netCashFlow = receivedIncome - paidExpenses;

  // 5. ديون عليّ: مجموع متبقيات ديون عليّ (حيث الحالة ليست ملغية)
  const debtsOwed = (state.debtsOwed || [])
    .filter(d => d.status !== 'ملغي')
    .reduce((sum, d) => {
      const orig = Number(d.original) || 0;
      const paid = Number(d.paid) || 0;
      return sum + Math.max(0, orig - paid);
    }, 0);

  // 6. مستحق لي: مجموع متبقيات ديون للآخرين (حيث الحالة ليست ملغية)
  const debtsReceivable = (state.debtsReceivable || [])
    .filter(d => d.status !== 'ملغي')
    .reduce((sum, d) => {
      const orig = Number(d.original) || 0;
      const rec = Number(d.received) || 0;
      return sum + Math.max(0, orig - rec);
    }, 0);

  // 7. الاشتراكات الشهرية: مجموع المعادل الشهري للنشط منها
  const activeSubscriptionsMonthly = (state.subscriptions || [])
    .filter(sub => sub.status === 'نشط')
    .reduce((sum, sub) => sum + calculateSubscriptionMonthly(sub), 0);

  // 8. الالتزامات القادمة: مجموع ما حالته "قادم"
  const upcomingObligations = (state.upcoming || [])
    .filter(up => up.status === 'قادم')
    .reduce((sum, up) => sum + (Number(up.amount) || 0), 0);

  // 9. الدخل المتوقع: مجموع القيم المرجّحة (المبلغ × الاحتمال)
  const expectedIncomeWeighted = (state.expectedIncome || [])
    .filter(ei => ei.status !== 'ملغي')
    .reduce((sum, ei) => {
      const amt = Number(ei.amount) || 0;
      const prob = Number(ei.probability) || 0;
      return sum + amt * prob;
    }, 0);

  // 10. المدخرات: مجموع "المبلغ الحالي" في الأهداف
  const savings = (state.goals || []).reduce(
    (sum, g) => sum + (Number(g.current) || 0),
    0
  );

  return {
    totalMoney,
    receivedIncome,
    paidExpenses,
    netCashFlow,
    debtsOwed,
    debtsReceivable,
    activeSubscriptionsMonthly,
    upcomingObligations,
    expectedIncomeWeighted,
    savings,
    accountBalances
  };
}

// حساب أيام الفرق بين تاريخين (target - today)
export function getDaysDiff(targetDateStr) {
  if (!targetDateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(targetDateStr);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

// حساب ميزانيات التصنيفات للشهر الميلادي الحالي
export function calculateCategoryBudgets(state) {
  const currentYearMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const budgets = state.settings?.categoryBudgets || {};
  const categories = Object.keys(budgets);

  // جمع المصروفات المدفوعة في هذا الشهر لكل تصنيف
  const spentByCat = {};
  (state.expenses || []).forEach(exp => {
    if (exp.status === 'مدفوع' && exp.date && exp.date.startsWith(currentYearMonth)) {
      const cat = exp.mainCat || 'أخرى';
      spentByCat[cat] = (spentByCat[cat] || 0) + (Number(exp.amount) || 0);
    }
  });

  return categories
    .map(cat => {
      const cap = Number(budgets[cat]) || 0;
      if (cap <= 0) return null; // صفر أو فارغ = بلا سقف
      const spent = spentByCat[cat] || 0;
      const ratio = spent / cap;
      const percent = Math.round(ratio * 100);

      let color = 'var(--emerald)';
      let statusText = 'ضمن الميزانية';
      let alertLevel = null;

      if (ratio >= 1.0) {
        color = 'var(--rust)';
        statusText = 'تجاوزت الميزانية';
        alertLevel = 'red';
      } else if (ratio >= 0.9) {
        color = 'var(--ochre)';
        statusText = 'قربت من حد الميزانية';
        alertLevel = 'yellow';
      }

      return {
        category: cat,
        cap,
        spent,
        remaining: Math.max(0, cap - spent),
        ratio,
        percent,
        color,
        statusText,
        alertLevel
      };
    })
    .filter(Boolean);
}

// حساب التنبيهات بدقة حسب القواعد الأربع
export function calculateAlerts(state) {
  const alerts = [];

  // القاعدة 1: دين عليّ تجاوز تاريخ استحقاقه ولم تكن حالته "مكتمل" أو "ملغي" -> أحمر بعدد أيام التأخر
  (state.debtsOwed || []).forEach(d => {
    if (d.status !== 'مكتمل' && d.status !== 'ملغي' && d.dueDate) {
      const diff = getDaysDiff(d.dueDate);
      if (diff !== null && diff < 0) {
        const overdueDays = Math.abs(diff);
        alerts.push({
          id: `debt_overdue_${d.id}`,
          type: 'red',
          title: `دين متأخر لـ ${d.person}`,
          message: `تجاوز تاريخ الاستحقاق بـ ${overdueDays} يوم (متبقي ${d.original - d.paid} ج.م)`,
          days: overdueDays
        });
      }
    }
  });

  // القاعدة 2: التزام حالته "قادم":
  // أصفر إن استحق خلال 0 إلى 3 أيام (مع "النهاردة" عند الصفر)، وأحمر إن فات
  (state.upcoming || []).forEach(up => {
    if (up.status === 'قادم' && up.dueDate) {
      const diff = getDaysDiff(up.dueDate);
      if (diff !== null) {
        if (diff < 0) {
          alerts.push({
            id: `upcoming_overdue_${up.id}`,
            type: 'red',
            title: `التزام فات موعده: ${up.name}`,
            message: `فات موعد الاستحقاق بـ ${Math.abs(diff)} يوم (المبلغ: ${up.amount} ج.م)`,
            days: diff
          });
        } else if (diff >= 0 && diff <= 3) {
          const timingText = diff === 0 ? 'النهاردة' : `بعد ${diff} ${diff === 1 ? 'يوم' : diff === 2 ? 'يومين' : 'أيام'}`;
          alerts.push({
            id: `upcoming_soon_${up.id}`,
            type: 'yellow',
            title: `التزام قادم: ${up.name}`,
            message: `مستحق ${timingText} بمبلغ ${up.amount} ج.م`,
            days: diff
          });
        }
      }
    }
  });

  // القاعدة 3: اشتراك أو موعد دوري "نشط" موعده القادم خلال 0 إلى 3 أيام -> تنبيه أصفر
  (state.subscriptions || []).forEach(sub => {
    if (sub.status === 'نشط' && sub.nextRenewal) {
      const diff = getDaysDiff(sub.nextRenewal);
      if (diff !== null && diff >= 0 && diff <= 3) {
        const timingText = diff === 0 ? 'النهاردة' : `بعد ${diff} ${diff === 1 ? 'يوم' : diff === 2 ? 'يومين' : 'أيام'}`;
        alerts.push({
          id: `sub_soon_${sub.id}`,
          type: 'yellow',
          title: `موعد ${sub.name} ${timingText}`,
          message: `اشتراك دوري متجدد بقيمة ${sub.value} ج.م`,
          days: diff
        });
      }
    }
  });

  // القاعدة 4: تصنيف بلغ إنفاقه 90% من سقفه
  // أصفر "قربت من حد الميزانية"، وعند 100% فأكثر أحمر "تجاوزت الميزانية"
  const budgetList = calculateCategoryBudgets(state);
  budgetList.forEach(b => {
    if (b.alertLevel === 'red') {
      alerts.push({
        id: `budget_exceeded_${b.category}`,
        type: 'red',
        title: `تجاوزت الميزانية لتصنيف ${b.category}`,
        message: `تم إنفاق ${b.spent} ج.م من أصل سقف ${b.cap} ج.م (${b.percent}%)`
      });
    } else if (b.alertLevel === 'yellow') {
      alerts.push({
        id: `budget_warning_${b.category}`,
        type: 'yellow',
        title: `قربت من حد الميزانية لتصنيف ${b.category}`,
        message: `تم إنفاق ${b.spent} ج.م من أصل سقف ${b.cap} ج.م (${b.percent}%)`
      });
    }
  });

  return alerts;
}

// حساب التقرير الشهري لآخر 12 شهرًا
export function calculateMonthlyReports(state) {
  // حساب الشهور الـ 12 السابقة حتى الشهر الحالي
  const months = [];
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthName = d.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
    months.push({ yearMonth, monthName });
  }

  // إجمالي الأرصدة الافتتاحية لكل الحسابات
  const totalOpening = (state.accounts || []).reduce(
    (sum, acc) => sum + (Number(acc.opening) || 0),
    0
  );

  // إجمالي الديون التراكمية حتى اليوم
  const cumulativeDebtsPaid = (state.debtsOwed || []).reduce(
    (sum, d) => sum + (Number(d.paid) || 0),
    0
  );
  const cumulativeDebtsRemaining = (state.debtsOwed || []).reduce(
    (sum, d) => sum + Math.max(0, (Number(d.original) || 0) - (Number(d.paid) || 0)),
    0
  );

  return months.map(({ yearMonth, monthName }) => {
    // 1. الدخل المستلم بتاريخ ذلك الشهر
    const incomeInMonth = (state.income || [])
      .filter(inc => inc.status === 'مستلم' && inc.date && inc.date.startsWith(yearMonth))
      .reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);

    // 2. المصروفات المدفوعة بتاريخ ذلك الشهر
    const expensesInMonthRows = (state.expenses || []).filter(
      exp => exp.status === 'مدفوع' && exp.date && exp.date.startsWith(yearMonth)
    );
    const expensesInMonth = expensesInMonthRows.reduce(
      (sum, exp) => sum + (Number(exp.amount) || 0),
      0
    );

    // 3. الصافي = الدخل المستلم - المصروفات المدفوعة
    const net = incomeInMonth - expensesInMonth;

    // 4. نسبة الادخار = الصافي ÷ الدخل (صفر إذا كان الدخل صفرًا)
    const savingsRate = incomeInMonth > 0 ? (net / incomeInMonth) * 100 : 0;

    // 5. أكبر تصنيف إنفاق
    const catTotals = {};
    expensesInMonthRows.forEach(exp => {
      const cat = exp.mainCat || 'أخرى';
      catTotals[cat] = (catTotals[cat] || 0) + (Number(exp.amount) || 0);
    });
    let topCat = 'لا يوجد';
    let topCatAmount = 0;
    Object.keys(catTotals).forEach(cat => {
      if (catTotals[cat] > topCatAmount) {
        topCatAmount = catTotals[cat];
        topCat = cat;
      }
    });

    // 6. إجمالي الاشتراكات التي "آخر مرة" لها في هذا الشهر
    const subsInMonth = (state.subscriptions || [])
      .filter(sub => sub.lastPayment && sub.lastPayment.startsWith(yearMonth))
      .reduce((sum, sub) => sum + (Number(sub.value) || 0), 0);

    // 7. رسوم التحويلات في ذلك الشهر
    const transferFeesInMonth = (state.transfers || [])
      .filter(tr => tr.status === 'مكتمل' && tr.date && tr.date.startsWith(yearMonth))
      .reduce((sum, tr) => sum + (Number(tr.fee) || 0), 0);

    // 8. تراكمي حتى نهاية هذا الشهر:
    // الدخل المستلم حتى نهاية الشهر
    const cumIncome = (state.income || [])
      .filter(inc => inc.status === 'مستلم' && inc.date && inc.date <= `${yearMonth}-31`)
      .reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);

    // المصروفات حتى نهاية الشهر
    const cumExpenses = (state.expenses || [])
      .filter(exp => exp.status === 'مدفوع' && exp.date && exp.date <= `${yearMonth}-31`)
      .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

    // رسوم التحويلات حتى نهاية الشهر
    const cumFees = (state.transfers || [])
      .filter(tr => tr.status === 'مكتمل' && tr.date && tr.date <= `${yearMonth}-31`)
      .reduce((sum, tr) => sum + (Number(tr.fee) || 0), 0);

    // رصيد النهاية = مجموع الأرصدة الافتتاحية + الدخل المستلم حتى نهاية الشهر - المصروفات المدفوعة - رسوم التحويلات
    const endBalance = totalOpening + cumIncome - cumExpenses - cumFees;

    // رصيد البداية = النهاية - الصافي
    const startBalance = endBalance - net;

    return {
      yearMonth,
      monthName,
      income: incomeInMonth,
      expenses: expensesInMonth,
      net,
      savingsRate,
      topCat,
      topCatAmount,
      subscriptionsTotal: subsInMonth,
      startBalance,
      endBalance,
      debtsPaid: cumulativeDebtsPaid,
      debtsRemaining: cumulativeDebtsRemaining
    };
  });
}

// حساب خط سير وتطور رصيد المستخدم الحقيقي عبر الزمن بناءً على الأرصدة الافتتاحية والعمليات الفعلية
export function calculateBalanceTimeline(state) {
  const accounts = state.accounts || [];
  const totalOpening = accounts.reduce((sum, a) => sum + (Number(a.opening) || 0), 0);

  // جمع كافة العمليات المالية المؤثرة على الأرصدة الفعلية مع تواريخها
  const events = [];

  (state.income || []).forEach(inc => {
    if (inc.status === 'مستلم' && inc.date) {
      events.push({
        date: inc.date,
        delta: Number(inc.amount) || 0,
        title: inc.desc || inc.category || 'دخل مستلم'
      });
    }
  });

  (state.expenses || []).forEach(exp => {
    if (exp.status === 'مدفوع' && exp.date) {
      events.push({
        date: exp.date,
        delta: -(Number(exp.amount) || 0),
        title: exp.desc || exp.category || 'مصروف مدفوع'
      });
    }
  });

  (state.transfers || []).forEach(tr => {
    if (tr.status === 'مكتمل' && tr.date && Number(tr.fee) > 0) {
      events.push({
        date: tr.date,
        delta: -(Number(tr.fee) || 0),
        title: 'رسوم تحويل'
      });
    }
  });

  // ترتيب زمني تصاعدي
  events.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  // إذا لم توجد أي حركات فعلية بعد، يتم عرض رصيد البداية الحقيقي بدقة ونقاء تامين
  if (events.length === 0) {
    return [
      { val: totalOpening, label: 'رصيد البداية', date: 'بداية الحساب' },
      { val: totalOpening, label: 'الرصيد الحالي', date: 'الآن' }
    ];
  }

  // تتبع مسار الرصيد التراكمي
  let running = totalOpening;
  const points = [
    { val: totalOpening, label: 'رصيد البداية', date: events[0]?.date || 'البداية' }
  ];

  events.forEach(evt => {
    running += evt.delta;
    points.push({
      val: Math.round(running * 100) / 100,
      label: evt.title,
      date: evt.date
    });
  });

  // في حال وجود عدد قليل من الحركات، تأكد من وجود نقطة ختامية تمثل الرصيد الحالي
  if (points.length < 3) {
    points.push({
      val: Math.round(running * 100) / 100,
      label: 'الرصيد الحالي',
      date: 'الآن'
    });
  }

  // إذا كان عدد النقاط أكبر من 12 نقطة، نأخذ عينة متوازنة للحفاظ على انسيابية المنحنى
  if (points.length > 12) {
    const sampled = [points[0]];
    const step = (points.length - 1) / 10;
    for (let i = 1; i < 10; i++) {
      sampled.push(points[Math.round(i * step)]);
    }
    sampled.push(points[points.length - 1]);
    return sampled;
  }

  return points;
}
