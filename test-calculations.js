import { createInitialData } from './src/data.js';
import {
  calculateAccountBalances,
  calculateDashboardMetrics,
  calculateAlerts,
  calculateCategoryBudgets,
  calculateSubscriptionMonthly
} from './src/calculations.js';

function assertEqual(actual, expected, message) {
  const diff = Math.abs(Number(actual) - Number(expected));
  if (diff > 0.01) {
    console.error(`❌ FAIL: ${message} -> Expected: ${expected}, Got: ${actual}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message} (= ${actual})`);
  }
}

console.log('--- تشغيل اختبارات معايير القبول لتطبيق محفظتي ---');

const state = createInitialData();
const metrics = calculateDashboardMetrics(state);
const balances = metrics.accountBalances;

// 1. فحص أرصدة الحسابات الثلاثة
assertEqual(balances['acc_1'].currentBalance, 3200, 'رصيد الكاش');
assertEqual(balances['acc_2'].currentBalance, 36500, 'رصيد البنك الأهلي');
assertEqual(balances['acc_3'].currentBalance, 5250, 'رصيد فودافون كاش');

// 2. إجمالي الأموال الحالية
assertEqual(metrics.totalMoney, 44950, 'إجمالي الأموال الحالية');

// 3. الدخل والمصروفات والتدفق
assertEqual(metrics.receivedIncome, 22000, 'الدخل المستلم');
assertEqual(metrics.paidExpenses, 6550, 'المصروفات المدفوعة');
assertEqual(metrics.netCashFlow, 15450, 'صافي التدفق');

// 4. الديون
assertEqual(metrics.debtsOwed, 3000, 'ديون عليّ');
assertEqual(metrics.debtsReceivable, 1200, 'مستحق لي');

// 5. الاشتراكات الشهرية
assertEqual(metrics.activeSubscriptionsMonthly, 567.10, 'الاشتراكات الشهرية (المعادل)');

// 6. الالتزامات والدخل المتوقع والمدخرات
assertEqual(metrics.upcomingObligations, 5300, 'الالتزامات القادمة');
assertEqual(metrics.expectedIncomeWeighted, 3600, 'الدخل المتوقع المرجّح');
assertEqual(metrics.savings, 17000, 'المدخرات');

// 7. بانر التنبيهات
const alerts = calculateAlerts(state);
console.log('التنبيهات المحسوبة:', alerts);
assertEqual(alerts.length, 1, 'عدد التنبيهات في البانر');
if (alerts.length > 0 && alerts[0].title.includes('حلاقة')) {
  console.log(`✅ PASS: نص التنبيه دقيق (${alerts[0].title} - ${alerts[0].message})`);
} else {
  console.error('❌ FAIL: التنبيه غير مطابق لموعد الحلاقة!');
  process.exit(1);
}

// 8. فحص قاعدة: إضافة مصروف "مستحق" لا يغير أي رصيد
const stateWithDueExpense = JSON.parse(JSON.stringify(state));
stateWithDueExpense.expenses.push({
  id: 'ex_test_due',
  date: '2026-10-27',
  desc: 'مصروف مستحق للاختبار',
  amount: 1000,
  accountId: 'acc_1',
  status: 'مستحق'
});
const metricsDue = calculateDashboardMetrics(stateWithDueExpense);
assertEqual(metricsDue.accountBalances['acc_1'].currentBalance, 3200, 'الرصيد لا يتغير عند إضافة مصروف مستحق');
assertEqual(metricsDue.paidExpenses, 6550, 'المصروفات المدفوعة لا تتغير للمستحق');

// وعند تحويله إلى مدفوع
stateWithDueExpense.expenses[stateWithDueExpense.expenses.length - 1].status = 'مدفوع';
const metricsPaid = calculateDashboardMetrics(stateWithDueExpense);
assertEqual(metricsPaid.accountBalances['acc_1'].currentBalance, 2200, 'الرصيد يُخصم عند التحويل إلى مدفوع');
assertEqual(metricsPaid.paidExpenses, 7550, 'المصروفات المدفوعة تزداد عند الدفع');

// 9. فحص قاعدة: إضافة تحويل "مكتمل" لا يغير إجمالي الأموال
const stateWithTransfer = JSON.parse(JSON.stringify(state));
stateWithTransfer.transfers.push({
  id: 'tr_test',
  date: '2026-10-27',
  fromAccountId: 'acc_2',
  toAccountId: 'acc_1',
  amount: 500,
  fee: 0,
  status: 'مكتمل'
});
const metricsTransfer = calculateDashboardMetrics(stateWithTransfer);
assertEqual(metricsTransfer.totalMoney, 44950, 'إجمالي الأموال يبقى ثابتاً بعد التحويل');
assertEqual(metricsTransfer.accountBalances['acc_2'].currentBalance, 36000, 'رصيد الحساب المحوّل منه ينقص');
assertEqual(metricsTransfer.accountBalances['acc_1'].currentBalance, 3700, 'رصيد الحساب المحوّل إليه يزداد');

// 10. فحص إضافة سريعة بمبلغ 75
const stateQuickAdd = JSON.parse(JSON.stringify(state));
stateQuickAdd.expenses.push({
  id: 'ex_quick',
  date: '2026-10-27',
  desc: 'إضافة سريعة',
  mainCat: 'أخرى',
  amount: 75,
  accountId: 'acc_1',
  status: 'مدفوع'
});
const metricsQuick = calculateDashboardMetrics(stateQuickAdd);
assertEqual(metricsQuick.accountBalances['acc_1'].currentBalance, 3125, 'الرصيد يخصم 75 كاش بعد الإضافة السريعة');
assertEqual(metricsQuick.paidExpenses, 6625, 'المصروفات تزداد بـ 75 بعد الإضافة السريعة');

console.log('\n🎉 جميع اختبارات القبول والحسابات نجحت بنسبة 100%!');
