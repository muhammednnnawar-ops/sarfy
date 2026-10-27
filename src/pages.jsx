// Sarfy - All 12 Full Application Pages
// تغطي جميع متطلبات الصفحات الاثنتي عشرة وتنسيق الموبايل 390px

import React, { useState } from 'react';
import { Icon } from './icons.jsx';
import {
  formatCurrency,
  formatNumber,
  formatDate,
  getRelativeDate,
  getUserInitials,
  DROPDOWNS,
  STREET_PRESETS
} from './data.js';
import { StatusBadge, UserAvatar } from './components.jsx';
import { VirtualCard } from './virtualCard.jsx';
import { adminGetUsers, adminToggleStatus, adminUpdateRole, adminDeleteUser, adminCreateClient } from './api.js';
import { hashPassword, hashPin } from './crypto.js';
import {
  IncomeExpenseBarChart,
  ExpenseDonutChart,
  TopExpenseHorizontalBarChart,
  BalanceLineChart,
  RadialArcMeter,
  HeroSparkline
} from './charts.jsx';
import {
  calculateAccountBalances,
  calculateDashboardMetrics,
  calculateAlerts,
  calculateCategoryBudgets,
  calculateMonthlyReports,
  calculateSubscriptionMonthly,
  calculateNextRenewalDate,
  calculateBalanceTimeline,
  calculateTransferFee,
  getDaysDiff
} from './calculations.js';
import {
  BankIconBadge,
  getBankOrWalletMeta,
  FINANCIAL_INSTITUTIONS_PRESETS
} from './bankLogos.jsx';

// ==========================================
// 1. لوحة التحكم (Dashboard - Bento Grid & Fintech Reference Architecture)
// ==========================================
export function DashboardPage({
  state,
  mutate,
  setActivePage,
  onOpenQuickAdd,
  onManualSync = null,
  syncInProgress = false,
  lastSyncedAt = null,
  onClearTransactions = null
}) {
  const [hideAmounts, setHideAmounts] = useState(false);
  const [activitySearch, setActivitySearch] = useState('');
  const [activityFilter, setActivityFilter] = useState('all'); // 'all' | 'expense' | 'income'
  const [selectedGoalId, setSelectedGoalId] = useState(() => (state.goals?.[0]?.id || 'goal_1'));

  // حالة مصاريف الشارع السريعة (على الطريق)
  const [selectedStreetPreset, setSelectedStreetPreset] = useState(null);
  const [customStreetAmount, setCustomStreetAmount] = useState('');
  const [streetAccountId, setStreetAccountId] = useState(() => (state.accounts?.find(a => a.type === 'كاش')?.id || state.accounts?.[0]?.id || ''));
  const [streetNotice, setStreetNotice] = useState('');

  const handleQuickLogStreet = (preset, amt) => {
    const numAmt = Number(amt);
    if (!numAmt || numAmt <= 0) return;
    const today = new Date().toISOString().split('T')[0];
    const targetAccountId = streetAccountId || state.accounts?.find(a => a.type === 'كاش')?.id || state.accounts?.[0]?.id || 'acc_1';
    
    mutate(draft => {
      draft.expenses.unshift({
        id: 'ex_' + Date.now(),
        date: today,
        desc: preset.title,
        mainCat: preset.category,
        subCat: 'شارع / يومي',
        amount: numAmt,
        accountId: targetAccountId,
        method: 'كاش',
        necessity: 'ضروري',
        recurrence: 'مرة واحدة',
        status: 'مدفوع',
        notes: 'تسجيل سريع أثناء التواجد بالشارع'
      });
    });

    setStreetNotice(`✅ تم تسجيل ${numAmt} ${currency} (${preset.title}) بنجاح!`);
    setSelectedStreetPreset(null);
    setCustomStreetAmount('');
    setTimeout(() => setStreetNotice(''), 3500);
  };

  const metrics = calculateDashboardMetrics(state);
  const alerts = calculateAlerts(state);
  const budgets = calculateCategoryBudgets(state);
  const reports = calculateMonthlyReports(state);
  const currency = state.settings?.currency || 'ج.م';
  const accountsMap = metrics.accountBalances;

  // الهدف المالي النشط للقوس البياني
  const activeGoal = state.goals?.find(g => g.id === selectedGoalId) || state.goals?.[0] || {
    id: 'goal_1',
    name: 'صندوق الطوارئ',
    current: metrics.savings,
    target: 25000
  };
  const goalTarget = Number(activeGoal.target) || 1;
  const goalCurrent = Number(activeGoal.current) || 0;
  const goalPercent = Math.min(100, Math.round((goalCurrent / goalTarget) * 100));

  // دالة مساعدة لحجب الأرقام عند تفعيل وضع الخصوصية
  const showMoney = val => (hideAmounts ? '••••••' : formatCurrency(val, currency));
  const showNum = val => (hideAmounts ? '••••••' : formatNumber(val));

  // تجميع وتصفية المعاملات الحديثة
  const allTransactions = [
    ...(state.expenses || []).map(e => ({ ...e, txnType: 'expense' })),
    ...(state.income || []).map(i => ({ ...i, txnType: 'income' }))
  ].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const filteredTransactions = allTransactions.filter(t => {
    const matchesType = activityFilter === 'all' || t.txnType === activityFilter;
    const desc = (t.desc || t.source || '').toLowerCase();
    const cat = (t.mainCat || t.category || '').toLowerCase();
    const query = activitySearch.toLowerCase();
    const matchesSearch = !query || desc.includes(query) || cat.includes(query);
    return matchesType && matchesSearch;
  });

  // حساب نسب فئات المصروفات للشريط متعدد الألوان
  const expenseCatTotals = (state.expenses || [])
    .filter(e => e.status === 'مدفوع')
    .reduce((acc, e) => {
      acc[e.mainCat] = (acc[e.mainCat] || 0) + Number(e.amount || 0);
      return acc;
    }, {});
  const totalPaidExp = metrics.paidExpenses || 1;
  const expCategories = Object.entries(expenseCatTotals).sort((a, b) => b[1] - a[1]);
  const catColors = ['#10B981', '#F59E0B', '#EF4444', '#38BDF8', '#8B5CF6', '#EC4899'];

  // تصنيفات الدخل المستلم الفعلي
  const incomeCatTotals = (state.income || [])
    .filter(i => i.status === 'مستلم')
    .reduce((acc, i) => {
      const cat = i.category || 'أخرى';
      acc[cat] = (acc[cat] || 0) + Number(i.amount || 0);
      return acc;
    }, {});
  const incCategories = Object.entries(incomeCatTotals).sort((a, b) => b[1] - a[1]);

  // حساب تطور رصيد المستخدم الحقيقي والنمو الفعلي
  const totalOpening = (state.accounts || []).reduce((sum, a) => sum + (Number(a.opening) || 0), 0);
  const netGrowth = metrics.totalMoney - totalOpening;
  const growthPercent = totalOpening > 0 ? Math.abs(((netGrowth / totalOpening) * 100)).toFixed(1) : '0.0';
  const balanceTimeline = calculateBalanceTimeline(state);
  const hasDemoData = (state.income || []).some(i => i.id === 'inc_1') || (state.expenses || []).some(e => e.id === 'exp_1');

  return (
    <div className="page-dashboard">
      {/* صف الترحيب وشارة الأمان وزر الخصوصية اللحظي (Moneed & Fingoals Style) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, letterSpacing: '-0.3px', color: 'var(--text-primary)' }}>
            مرحباً، {state.userProfile?.fullName || 'بك في صرفي'} 👋
          </h2>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
            نظرة شاملة ومحدثة على أموالك ومحافظك الاستثمارية
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* زر التحديث اللحظي عبر AJAX دون إعادة تحميل الصفحة */}
          {onManualSync && (
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={onManualSync}
              disabled={syncInProgress}
              title="مزامنة وتحديث البيانات لحظياً من السيرفر عبر AJAX دون تسجيل خروج أو إعادة تحميل"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Icon name="refresh" size={14} className={syncInProgress ? 'spin-anim' : ''} />
              <span>{syncInProgress ? 'جارِ التحديث...' : 'تحديث لحظي'}</span>
            </button>
          )}

          {/* زر الخصوصية لإخفاء/إظهار الأرقام الحساسة بنقرة واحدة */}
          <button
            type="button"
            className="privacy-toggle-btn"
            onClick={() => setHideAmounts(prev => !prev)}
            title={hideAmounts ? 'إظهار المبالغ' : 'إخفاء المبالغ للخصوصية'}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Icon name={hideAmounts ? 'eye' : 'eye-off'} size={15} />
            <span>{hideAmounts ? 'إظهار الأرقام' : 'إخفاء للخصوصية'}</span>
          </button>

          <span className="live-badge" title={lastSyncedAt ? `آخر مزامنة ناجحة: ${lastSyncedAt}` : 'مزامنة حية نشطة'}>
            <span className="live-dot pulse-emerald"></span>
            مزامنة سحابية لحظية
          </span>
        </div>
      </div>

      {/* شريط اختياري للبدء من الصفر وتصفير الحركات التجريبية */}
      {hasDemoData && onClearTransactions && (
        <div style={{
          background: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: 12,
          padding: '12px 18px',
          marginBottom: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>💡</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 13.5, color: 'var(--cyan)' }}>
                ترغب في البدء من الصفر حرفياً بحساباتك الحقيقية فقط؟
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                يمكنك بنقرة واحدة تفريغ كافة الحركات الاسترشادية التجريبية والبدء بصفحة بيضاء نظيفة.
              </div>
            </div>
          </div>
          <button
            className="btn-secondary btn-sm"
            onClick={() => {
              if (window.confirm('هل أنت متأكد من تفريغ كافة الحركات والبدء من الصفر النظيف؟ ستظل حساباتك وأرصدتها كما هي.')) {
                onClearTransactions();
              }
            }}
            style={{ color: 'var(--cyan)', borderColor: 'rgba(56, 189, 248, 0.4)', fontWeight: 700 }}
          >
            🧹 تفريغ الحركات والبدء من الصفر الآن
          </button>
        </div>
      )}

      {/* 1. شبكة البنتو العلوية المتقدمة (Bento Hero Grid - Moneed & Fingoals Inspired) */}
      <div className="bento-hero-grid">
        {/* الكرت الرئيسي: إجمالي الأموال (Main Hero Card) */}
        <div className="total-money-card" style={{ margin: 0 }}>
          <div className="total-money-label" style={{ width: '100%', justifyContent: 'space-between' }}>
            <span>إجمالي الأرصدة والأموال</span>
            <span className="live-badge">
              <span className="live-dot"></span>
              مُحدّث لحظياً
            </span>
          </div>

          <div className="total-money-amount">
            <span className="currency-symbol">{currency}</span>{' '}
            <span className="money-number">{showNum(metrics.totalMoney)}</span>
          </div>
          <div className="total-money-underline"></div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            {netGrowth > 0 ? (
              <span className="bento-growth-tag growth-positive">
                +{growthPercent}% نمو إيجابي (+{showMoney(netGrowth)})
              </span>
            ) : netGrowth < 0 ? (
              <span className="bento-growth-tag growth-negative">
                -{growthPercent}% سحب من الرصيد (-{showMoney(Math.abs(netGrowth))})
              </span>
            ) : (
              <span className="bento-growth-tag" style={{ background: 'rgba(56, 189, 248, 0.12)', color: 'var(--cyan)', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                رصيد البداية جاهز ومستقر
              </span>
            )}
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>صافي {state.accounts?.length || 0} حسابات ومحافظ</span>
          </div>

          {/* المنحنى البياني النيون المدمج في الهيرو - مشتق 100% من بيانات وأرصدة المستخدم الفعلية */}
          <HeroSparkline
            data={balanceTimeline}
            currency={currency}
          />

          {/* أزرار الإجراءات السريعة الفاخرة */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12, width: '100%' }}>
            <button className="btn-primary" onClick={onOpenQuickAdd} style={{ flex: 1, minWidth: 130 }}>
              <Icon name="plus" size={15} /> إضافة سريعة
            </button>
            <button className="btn-secondary" onClick={() => setActivePage('transfers')}>
              <Icon name="transfers" size={15} /> تحويل بنكي
            </button>
            <button className="btn-secondary" onClick={() => setActivePage('upcoming')}>
              <Icon name="upcoming" size={15} /> التزام قادم
            </button>
          </div>
        </div>

        {/* الكرت الرفيق الأول: الدخل المستلم (Income Companion Bento) */}
        <div className="companion-bento-card">
          <div>
            <div className="bento-card-top">
              <div className="bento-card-badge">
                <div className="bento-icon-circle bento-icon-emerald">
                  <Icon name="income" size={18} />
                </div>
                <span style={{ fontWeight: 700, fontSize: 13.5 }}>الدخل المستلم</span>
              </div>
              {metrics.receivedIncome > 0 ? (
                <span className="bento-growth-tag growth-positive">
                  {Math.round((metrics.receivedIncome / (state.userProfile?.monthlyIncomeTarget || 25000)) * 100)}% من المستهدف
                </span>
              ) : (
                <span className="bento-growth-tag" style={{ background: 'rgba(148, 163, 184, 0.12)', color: 'var(--text-muted)' }}>
                  لا توجد حركات بعد
                </span>
              )}
            </div>

            <div className="bento-amount-val" style={{ color: 'var(--emerald)' }}>
              {showMoney(metrics.receivedIncome)}
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
              العمليات المؤكدة بحالة "مستلم" هذا الشهر
            </div>
          </div>

          <div className="bento-sub-tags">
            {incCategories.length > 0 ? (
              incCategories.slice(0, 2).map(([cat, amount]) => (
                <span key={cat} className="bento-sub-tag-item">
                  {cat}: {showMoney(amount)}
                </span>
              ))
            ) : (
              <span className="bento-sub-tag-item" style={{ opacity: 0.7 }}>
                بانتظار تسجيل أول حركة دخل
              </span>
            )}
          </div>
        </div>

        {/* الكرت الرفيق الثاني: المصروفات المدفوعة (Expense Companion Bento) */}
        <div className="companion-bento-card">
          <div>
            <div className="bento-card-top">
              <div className="bento-card-badge">
                <div className="bento-icon-circle bento-icon-coral">
                  <Icon name="expenses" size={18} />
                </div>
                <span style={{ fontWeight: 700, fontSize: 13.5 }}>المصروفات المدفوعة</span>
              </div>
              {metrics.paidExpenses > 0 ? (
                <span className="bento-growth-tag" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--coral)' }}>
                  {Math.round((metrics.paidExpenses / (state.userProfile?.monthlyBudgetTarget || 12000)) * 100)}% من الميزانية
                </span>
              ) : (
                <span className="bento-growth-tag growth-positive">
                  0% لم يتم الصرف
                </span>
              )}
            </div>

            <div className="bento-amount-val" style={{ color: 'var(--coral)' }}>
              {showMoney(metrics.paidExpenses)}
            </div>

            {/* شريط توزيع المصروفات المقسم متعدد الألوان (Moneed Pattern) */}
            {expCategories.length > 0 ? (
              <div className="segmented-category-bar">
                {expCategories.slice(0, 5).map(([cat, amount], i) => (
                  <div
                    key={cat}
                    className="category-bar-segment"
                    style={{
                      width: `${(amount / totalPaidExp) * 100}%`,
                      backgroundColor: catColors[i % catColors.length]
                    }}
                    title={`${cat}: ${formatCurrency(amount, currency)} (${Math.round((amount / totalPaidExp) * 100)}%)`}
                  />
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: '8px 0' }}>
                لا توجد مصروفات مسجلة حتى الآن
              </div>
            )}
          </div>

          <div className="bento-sub-tags">
            {expCategories.length > 0 ? (
              expCategories.slice(0, 2).map(([cat, amount]) => (
                <span key={cat} className="bento-sub-tag-item">
                  {cat}: {showMoney(amount)}
                </span>
              ))
            ) : (
              <span className="bento-sub-tag-item" style={{ opacity: 0.7 }}>
                المصروفات صفرية حتى الآن
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ويدجت مصاريف الشارع السريعة (على الطريق وأثناء التواجد بالخارج) */}
      <div className="street-expenses-card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>⚡</span>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>
                مصاريف الشارع السريعة (أثناء التواجد بالخارج)
              </h3>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                سجّل مصاريفك اللحظية (مواصلات، بنزين، كشك) بنقرة واحدة في ثانية دون انتظار
              </span>
            </div>
          </div>
          {streetNotice && (
            <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)', color: 'var(--emerald)', fontWeight: 700, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              {streetNotice}
            </span>
          )}
        </div>

        <div className="street-presets-grid">
          {STREET_PRESETS.map(preset => {
            const isSelected = selectedStreetPreset?.id === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                className={`street-preset-btn ${isSelected ? 'active' : ''}`}
                onClick={() => {
                  if (isSelected) setSelectedStreetPreset(null);
                  else setSelectedStreetPreset(preset);
                }}
              >
                <span className="preset-icon">{preset.icon}</span>
                <span className="preset-name">{preset.shortTitle}</span>
              </button>
            );
          })}
        </div>

        {/* لوحة تحديد المبلغ الفوري والمحفظة عند اختيار تصنيف */}
        {selectedStreetPreset && (
          <div className="street-amount-tray">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--emerald)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{selectedStreetPreset.icon}</span>
                <span>تسجيل {selectedStreetPreset.title}:</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>خصم من:</span>
                <select
                  className="form-select"
                  style={{ padding: '3px 8px', fontSize: 11.5, height: 'auto', width: 'auto' }}
                  value={streetAccountId}
                  onChange={e => setStreetAccountId(e.target.value)}
                >
                  {(state.accounts || []).map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
              اختر المبلغ المطلوب للتسجيل الفوري:
            </div>

            <div className="quick-amount-pills">
              {selectedStreetPreset.suggestedAmounts.map(val => (
                <button
                  key={val}
                  type="button"
                  className="quick-amount-pill"
                  onClick={() => handleQuickLogStreet(selectedStreetPreset, val)}
                >
                  {val} {currency}
                </button>
              ))}
            </div>

            {/* إدخال مبلغ مخصص */}
            <form
              onSubmit={e => {
                e.preventDefault();
                handleQuickLogStreet(selectedStreetPreset, customStreetAmount);
              }}
              style={{ display: 'flex', gap: 8, marginTop: 8 }}
            >
              <input
                type="number"
                step="any"
                className="form-input"
                style={{ maxWidth: 160, fontSize: 13, padding: '6px 10px' }}
                placeholder="مبلغ مخصص..."
                value={customStreetAmount}
                onChange={e => setCustomStreetAmount(e.target.value)}
              />
              <button type="submit" className="btn-primary btn-sm" disabled={!customStreetAmount}>
                تسجيل
              </button>
              <button type="button" className="btn-secondary btn-sm" onClick={() => setSelectedStreetPreset(null)}>
                إلغاء
              </button>
            </form>
          </div>
        )}
      </div>

      {/* 2. شريط الحسابات المصرفية والتحويل السريع (Lumin Reference Style) */}
      <div className="quick-accounts-strip-card" style={{ marginBottom: 20 }}>
        <div className="quick-strip-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="accounts" size={16} color="var(--cyan)" />
            <span style={{ fontWeight: 800, fontSize: 14 }}>حساباتك المصرفية والمحافظ (تحويل سريع)</span>
          </div>
          <button className="btn-link" onClick={() => setActivePage('transfers')}>
            تحويل بين الحسابات ←
          </button>
        </div>
        <div className="quick-accounts-scroll">
          {(state.accounts || []).map(acc => {
            const bal = accountsMap[acc.id]?.currentBalance ?? acc.opening;
            const isBank = acc.name.includes('الأهلي') || acc.type === 'حساب بنكي';
            const isWallet = acc.name.includes('فودافون') || acc.type === 'محفظة إلكترونية';
            return (
              <div
                key={acc.id}
                className="quick-acc-chip"
                onClick={() => setActivePage('transfers')}
                title={`انقر للتحويل من ${acc.name}`}
              >
                <div className="quick-acc-avatar" style={{ background: 'transparent', width: 32, height: 32 }}>
                  <BankIconBadge account={acc} size={30} />
                </div>
                <div className="quick-acc-details">
                  <div className="quick-acc-name">{acc.name}</div>
                  <div className="quick-acc-bal">{showMoney(bal)}</div>
                </div>
                <div className="quick-acc-action">
                  <Icon name="transfers" size={13} />
                </div>
              </div>
            );
          })}
          <div
            className="quick-acc-chip add-chip"
            onClick={() => setActivePage('accounts')}
            title="إضافة حساب أو محفظة جديدة"
          >
            <div className="quick-acc-avatar avatar-add">+</div>
            <div className="quick-acc-details">
              <div className="quick-acc-name" style={{ color: 'var(--cyan)' }}>حساب جديد</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>بنك أو محفظة</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. كارت مساعد صرفي المالي الذكي (AI Financial Copilot - Dropify Reference Style) */}
      <div className="ai-copilot-banner" style={{ marginBottom: 24 }}>
        <div className="ai-banner-top">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="ai-sparkle-icon">✨</span>
            <span className="ai-banner-title">مساعد صرفي المالي الذكي (AI Financial Insight)</span>
            <span className="ai-pill-live">تحليل حي</span>
          </div>
          <button className="btn-link" onClick={() => setActivePage('reports')}>
            عرض التحليلات ←
          </button>
        </div>
        <div className="ai-banner-content">
          <p className="ai-banner-text">
            صافي تدفقك النقدي هذا الشهر إيجابي بنسبة قياسية <strong>(+{showMoney(metrics.netCashFlow)})</strong>. لديك التزام استحقاق دوري خلال 3 أيام بقيمة <strong>{showMoney(150)}</strong> (موعد حلاقة)، وفائض مالي يسمح بتخصيص <strong>{showMoney(3000)}</strong> نحو <strong>صندوق الطوارئ</strong> للوصول لنسبة 80% من هدفك المالي دون التأثير على استقرارك.
          </p>
          <div className="ai-banner-btns">
            <button className="ai-btn-action primary" onClick={() => setActivePage('goals')}>
              🎯 توجيه الفائض للادخار
            </button>
            <button className="ai-btn-action" onClick={() => setActivePage('upcoming')}>
              📅 مراجعة جدول الالتزامات
            </button>
          </div>
        </div>
      </div>

      {/* 4. شريط الالتزامات والمواعيد القادمة السريعة (Pay Reference Style) */}
      <div style={{ marginBottom: 24 }}>
        <div className="section-header-row" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="upcoming" size={18} color="var(--amber)" />
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>الالتزامات والمواعيد القادمة (أولويات الدفع)</h3>
          </div>
          <button className="btn-link" onClick={() => setActivePage('upcoming')}>
            عرض الكل ({state.upcoming?.length || 0})
          </button>
        </div>

        <div className="upcoming-strip-container">
          {(state.upcoming || []).slice(0, 5).map(up => {
            const diff = getDaysDiff(up.dueDate);
            const isUrgent = diff !== null && diff <= 5 && diff >= 0;
            return (
              <div
                key={up.id}
                className="upcoming-payment-chip"
                onClick={() => setActivePage('upcoming')}
              >
                <div className="chip-icon-box" style={{ background: isUrgent ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: isUrgent ? '#EF4444' : 'var(--amber)' }}>
                  <Icon name={up.type === 'إيجار' ? 'wallet' : 'upcoming'} size={18} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{up.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--coral)', direction: 'ltr', textAlign: 'right' }}>
                    {showMoney(up.amount)}
                  </span>
                  <span style={{ fontSize: 10.5, color: isUrgent ? '#EF4444' : 'var(--text-muted)', fontWeight: 600 }}>
                    {diff === 0 ? 'مستحق اليوم ⚡' : diff > 0 ? `خلال ${diff} أيام` : 'متأخر'}
                  </span>
                </div>
              </div>
            );
          })}

          {/* شريحة الاشتراك الدوري القادم */}
          <div className="upcoming-payment-chip" onClick={() => setActivePage('subscriptions')}>
            <div className="chip-icon-box" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8' }}>
              <Icon name="subscriptions" size={18} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>الاشتراكات النشطة</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--emerald)', direction: 'ltr', textAlign: 'right' }}>
                {showMoney(metrics.activeSubscriptionsMonthly)} / شهر
              </span>
              <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>تجديد تلقائي</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. قسم بطاقات الحسابات البنكية 3D وقوس الأهداف المالية (3D Cards & Radial Arc Meter) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: 18, marginBottom: 24 }} className="cards-and-goals-grid">
        {/* أ. كروت البنوك والمحافظ ثلاثية الأبعاد */}
        <div className="card-box" style={{ padding: '22px', margin: 0 }}>
          <div className="section-header-row" style={{ marginBottom: 14 }}>
            <div>
              <h3 className="section-title">البطاقات والمحافظ</h3>
            </div>
            <button className="btn-link" onClick={() => setActivePage('accounts')}>
              إدارة الحسابات
            </button>
          </div>

          <div className="virtual-cards-carousel">
            {(state.accounts || []).map(acc => (
              <VirtualCard
                key={acc.id}
                account={acc}
                balance={accountsMap[acc.id]?.currentBalance ?? acc.opening}
                currency={currency}
                onClick={() => setActivePage('accounts')}
              />
            ))}
          </div>
        </div>

        {/* ب. بطاقة الأهداف المالية الفاخرة مع القوس النيون التفاعلي (Fingoals & Moneed Reference Style) */}
        <div className="goals-arc-card" style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="goals" size={18} color="var(--emerald)" />
              <span style={{ fontWeight: 800, fontSize: 15 }}>الأهداف المالية والادخار</span>
            </div>
            <span style={{ fontSize: 11, background: 'rgba(16, 185, 129, 0.2)', color: 'var(--emerald)', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
              {showMoney(metrics.savings)} مُدخرة
            </span>
          </div>

          {/* أزرار التبديل السريع بين الأهداف */}
          <div className="goal-switcher-pills" style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', paddingBottom: 4 }}>
            {(state.goals || []).map(g => (
              <button
                key={g.id}
                type="button"
                className={`goal-pill ${g.id === activeGoal.id ? 'active' : ''}`}
                onClick={e => {
                  e.stopPropagation();
                  setSelectedGoalId(g.id);
                }}
              >
                <span>{g.name}</span>
                <span className="goal-pill-pct">
                  {Math.min(100, Math.round(((Number(g.current) || 0) / (Number(g.target) || 1)) * 100))}%
                </span>
              </button>
            ))}
          </div>

          {/* القوس النيون النصف دائري */}
          <RadialArcMeter
            percent={goalPercent}
            label={activeGoal.name}
            current={goalCurrent}
            target={goalTarget}
            currency={currency}
            hideAmounts={hideAmounts}
          />

          {/* شريط الإنجاز التفصيلي للهدف النشط */}
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }} onClick={() => setActivePage('goals')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ fontWeight: 600 }}>{activeGoal.name}</span>
              <span style={{ color: 'var(--emerald)', fontWeight: 700 }}>{goalPercent}% مكتمل</span>
            </div>
            <div className="progress-track" style={{ height: 6 }}>
              <div className="progress-fill" style={{ width: `${goalPercent}%`, backgroundColor: 'var(--emerald)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* 4. بانر التنبيهات الذكي */}
      {alerts.length > 0 && (
        <div className="alerts-banner-card">
          <div className="alerts-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="alert" size={18} color="var(--rust)" />
              <span style={{ fontWeight: 700, fontSize: 14 }}>
                يحتاج انتباهك ({alerts.length})
              </span>
            </div>
          </div>
          <div className="alerts-list">
            {alerts.map(a => (
              <div
                key={a.id}
                className={`alert-item ${a.type === 'red' ? 'alert-red' : 'alert-yellow'}`}
              >
                <div style={{ fontWeight: 600, fontSize: 13 }}>{a.title}</div>
                <div style={{ fontSize: 12, opacity: 0.9 }}>{a.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. شبكة البطاقات العشر المعيارية (10 KPIs Preserved & Elevated) */}
      <div className="metric-cards-grid">
        {/* 1. الدخل المستلم */}
        <div className="metric-card card-emerald">
          <div className="metric-card-top-row">
            <div className="metric-icon-wrap"><Icon name="income" size={18} /></div>
            <span className="metric-pill pill-emerald">+9.1% نمو</span>
          </div>
          <div className="metric-label">الدخل المستلم</div>
          <div className="metric-value">{showMoney(metrics.receivedIncome)}</div>
          <div className="metric-footnote">العمليات بحالة "مستلم" فقط</div>
        </div>

        {/* 2. المصروفات المدفوعة */}
        <div className="metric-card card-rust">
          <div className="metric-card-top-row">
            <div className="metric-icon-wrap"><Icon name="expenses" size={18} /></div>
            <span className="metric-pill pill-coral">-15% من السقف</span>
          </div>
          <div className="metric-label">المصروفات المدفوعة</div>
          <div className="metric-value">{showMoney(metrics.paidExpenses)}</div>
          <div className="metric-footnote">العمليات بحالة "مدفوع" فقط</div>
        </div>

        {/* 3. صافي التدفق */}
        <div className="metric-card card-navy">
          <div className="metric-card-top-row">
            <div className="metric-icon-wrap"><Icon name="dashboard" size={18} /></div>
            <span className="metric-pill pill-emerald">فائض إيجابي</span>
          </div>
          <div className="metric-label">صافي التدفق</div>
          <div className="metric-value" style={{ color: metrics.netCashFlow >= 0 ? 'var(--emerald)' : 'var(--rust)' }}>
            {showMoney(metrics.netCashFlow)}
          </div>
          <div className="metric-footnote">الدخل المستلم − المصروفات المدفوعة</div>
        </div>

        {/* 4. ديون عليّ */}
        <div className="metric-card card-rust">
          <div className="metric-card-top-row">
            <div className="metric-icon-wrap"><Icon name="debts" size={18} /></div>
            <span className="metric-pill pill-coral">مجدولة</span>
          </div>
          <div className="metric-label">ديون عليّ</div>
          <div className="metric-value">{showMoney(metrics.debtsOwed)}</div>
          <div className="metric-footnote">المتبقي من الديون للغير</div>
        </div>

        {/* 5. مستحق لي */}
        <div className="metric-card card-ochre">
          <div className="metric-card-top-row">
            <div className="metric-icon-wrap"><Icon name="wallet" size={18} /></div>
            <span className="metric-pill pill-amber">متابعة تحصيل</span>
          </div>
          <div className="metric-label">مستحق لي</div>
          <div className="metric-value">{showMoney(metrics.debtsReceivable)}</div>
          <div className="metric-footnote">متبقي الديون عند الآخرين</div>
        </div>

        {/* 6. الاشتراكات الشهرية */}
        <div className="metric-card card-ochre">
          <div className="metric-card-top-row">
            <div className="metric-icon-wrap"><Icon name="subscriptions" size={18} /></div>
            <span className="metric-pill pill-cyan">نشطة شهرياً</span>
          </div>
          <div className="metric-label">الاشتراكات الشهرية</div>
          <div className="metric-value">{showMoney(metrics.activeSubscriptionsMonthly)}</div>
          <div className="metric-footnote">المعادل الشهري للاشتراكات النشطة</div>
        </div>

        {/* 7. الالتزامات القادمة */}
        <div className="metric-card card-ochre">
          <div className="metric-card-top-row">
            <div className="metric-icon-wrap"><Icon name="upcoming" size={18} /></div>
            <span className="metric-pill pill-amber">استحقاقات قادمة</span>
          </div>
          <div className="metric-label">الالتزامات القادمة</div>
          <div className="metric-value">{showMoney(metrics.upcomingObligations)}</div>
          <div className="metric-footnote">الالتزامات بحالة "قادم"</div>
        </div>

        {/* 8. الدخل المتوقع */}
        <div className="metric-card card-emerald">
          <div className="metric-card-top-row">
            <div className="metric-icon-wrap"><Icon name="expectedIncome" size={18} /></div>
            <span className="metric-pill pill-emerald">مرجّحة 70%</span>
          </div>
          <div className="metric-label">الدخل المتوقع</div>
          <div className="metric-value">{showMoney(metrics.expectedIncomeWeighted)}</div>
          <div className="metric-footnote">القيمة المرجّحة (المبلغ × الاحتمال)</div>
        </div>

        {/* 9. المدخرات */}
        <div className="metric-card card-emerald">
          <div className="metric-card-top-row">
            <div className="metric-icon-wrap"><Icon name="goals" size={18} /></div>
            <span className="metric-pill pill-emerald">68% من الهدف</span>
          </div>
          <div className="metric-label">المدخرات</div>
          <div className="metric-value">{showMoney(metrics.savings)}</div>
          <div className="metric-footnote">المبلغ الحالي في الأهداف المالية</div>
        </div>

        {/* 10. الحسابات النشطة */}
        <div className="metric-card card-navy">
          <div className="metric-card-top-row">
            <div className="metric-icon-wrap"><Icon name="accounts" size={18} /></div>
            <span className="metric-pill pill-cyan">جاهزة للتحويل</span>
          </div>
          <div className="metric-label">الحسابات النشطة</div>
          <div className="metric-value" style={{ fontSize: 20 }}>
            {state.accounts?.filter(a => a.status === 'نشط').length || 0} حسابات
          </div>
          <div className="metric-footnote">جاهزة للصرف والتحويل</div>
        </div>
      </div>

      {/* 6. الرسوم البيانية الأربعة */}
      <div className="charts-grid-dashboard">
        <div className="card-box chart-box">
          <h4 className="chart-title">الدخل مقابل المصروفات (آخر 6 أشهر)</h4>
          <IncomeExpenseBarChart data={reports} currency={currency} />
        </div>
        <div className="card-box chart-box">
          <h4 className="chart-title">توزيع المصروفات حسب التصنيف</h4>
          <ExpenseDonutChart expenses={state.expenses} currency={currency} />
        </div>
        <div className="card-box chart-box">
          <h4 className="chart-title">أعلى 8 تصنيفات إنفاقًا</h4>
          <TopExpenseHorizontalBarChart expenses={state.expenses} currency={currency} />
        </div>
        <div className="card-box chart-box">
          <h4 className="chart-title">تطور الرصيد لنهاية كل شهر</h4>
          <BalanceLineChart data={reports} currency={currency} />
        </div>
      </div>

      {/* 7. جدول المعاملات الحديثة الموحد مع البحث اللحظي والتصفية (Moneed Reference Style) */}
      <div className="card-box" style={{ marginBottom: 24 }}>
        <div className="section-header-row" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 className="section-title">سجل المعاملات والنشاط الأخير</h3>
            <p className="section-sub">بحث وتصفية سريعة في كافة مدفوعاتك ومداخيلك</p>
          </div>

          {/* محرك البحث اللحظي وأزرار التصفية */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: 200 }}>
              <input
                type="text"
                className="form-input"
                placeholder="🔍 بحث في المعاملات..."
                value={activitySearch}
                onChange={e => setActivitySearch(e.target.value)}
                style={{ height: 36, paddingRight: 10, fontSize: 12.5 }}
              />
            </div>

            <div className="auth-sub-switch" style={{ margin: 0, padding: 0, border: 'none' }}>
              <button
                type="button"
                className={`sub-switch-btn ${activityFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActivityFilter('all')}
              >
                الكل
              </button>
              <button
                type="button"
                className={`sub-switch-btn ${activityFilter === 'expense' ? 'active' : ''}`}
                onClick={() => setActivityFilter('expense')}
              >
                المصروفات
              </button>
              <button
                type="button"
                className={`sub-switch-btn ${activityFilter === 'income' ? 'active' : ''}`}
                onClick={() => setActivityFilter('income')}
              >
                الدخل
              </button>
            </div>
          </div>
        </div>

        {/* قائمة المعاملات الأنيقة */}
        <div className="mini-list" style={{ marginTop: 12 }}>
          {filteredTransactions.slice(0, 7).map(item => {
            const isExp = item.txnType === 'expense';
            return (
              <div key={item.id} className="mini-list-item" style={{ padding: '12px 8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className={`avatar-circle ${isExp ? 'avatar-coral' : 'avatar-emerald'}`}>
                    <Icon name={isExp ? 'expenses' : 'income'} size={17} />
                  </div>
                  <div className="mini-item-info">
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)' }}>
                      {item.desc || item.source}
                    </div>
                    <div className="mini-item-sub">
                      {formatDate(item.date)} · {item.mainCat || item.category} · {accountsMap[item.accountId]?.name || ''}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <div
                    style={{
                      fontWeight: 800,
                      color: isExp ? 'var(--coral)' : 'var(--emerald)',
                      fontVariantNumeric: 'tabular-nums',
                      direction: 'ltr',
                      fontSize: 14.5
                    }}
                  >
                    {isExp ? '-' : '+'}{showMoney(item.amount)}
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* ميزانية التصنيفات الشهرية */}
      {budgets.length > 0 && (
        <div className="dashboard-section card-box" style={{ marginBottom: 24 }}>
          <div className="section-header-row">
            <div>
              <h3 className="section-title">الميزانية الشهرية للتصنيفات (الشهر الحالي)</h3>
              <p className="section-sub">تُحسب من المصروفات المدفوعة في هذا الشهر فقط</p>
            </div>
            <button className="btn-link" onClick={() => setActivePage("settings")}>
              تعديل السقوف
            </button>
          </div>

          <div className="budgets-bars-list">
            {budgets.map(b => (
              <div key={b.category} className="budget-bar-item">
                <div className="budget-bar-labels">
                  <span style={{ fontWeight: 600 }}>{b.category}</span>
                  <span style={{ fontSize: 13, color: b.color, fontWeight: 700 }}>
                    {formatCurrency(b.spent, currency)} من أصل {formatCurrency(b.cap, currency)} ({b.percent}%)
                  </span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: Math.min(100, b.percent) + "%",
                      backgroundColor: b.color
                    }}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ink-soft)" }}>
                  <span>{b.statusText}</span>
                  <span>المتبقي: {formatCurrency(b.remaining, currency)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 2. الحسابات والأرصدة (Accounts)
// ==========================================
export function AccountsPage({
  state,
  onAdd,
  onEdit,
  onDelete,
  onManualSync = null,
  syncInProgress = false
}) {
  const currency = state.settings?.currency || 'ج.م';
  const balancesMap = calculateAccountBalances(state);

  return (
    <div className="page-wrapper">
      <div className="page-header-bar">
        <div>
          <h2 className="page-title">الحسابات والأرصدة</h2>
          <p className="page-subtitle">إدارة الحسابات البنكية والمحافظ النقدية والرصيد الحالي المحسوب تلقائيًا</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {onManualSync && (
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={onManualSync}
              disabled={syncInProgress}
              title="تحديث أرصدة الحسابات لحظياً من السيرفر"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Icon name="refresh" size={14} className={syncInProgress ? 'spin-anim' : ''} />
              <span>تحديث لحظي</span>
            </button>
          )}
          <button className="btn-primary" onClick={() => onAdd('accounts')}>
            <Icon name="plus" size={16} /> إضافة حساب جديد
          </button>
        </div>
      </div>

      <div className="table-card">
        <table className="responsive-table">
          <thead>
            <tr>
              <th>الحساب</th>
              <th>النوع</th>
              <th>الافتتاحي</th>
              <th>الدخل</th>
              <th>المصروفات</th>
              <th>التحويلات</th>
              <th>الرصيد الحالي</th>
              <th>الحالة</th>
              <th>ملاحظات</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {(state.accounts || []).map(acc => {
              const calc = balancesMap[acc.id] || acc;
              const isNegative = calc.currentBalance < 0;
              return (
                <tr key={acc.id}>
                  <td data-label="اسم الحساب" style={{ fontWeight: 600 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <BankIconBadge account={acc} size={24} />
                      <span>{acc.name}</span>
                    </div>
                  </td>
                  <td data-label="النوع">{acc.type}</td>
                  <td data-label="الرصيد الافتتاحي">{formatCurrency(acc.opening, currency)}</td>
                  <td data-label="الدخل المستلم" style={{ color: 'var(--emerald)' }}>
                    +{formatCurrency(calc.incomeReceived, currency)}
                  </td>
                  <td data-label="المصروفات المدفوعة" style={{ color: 'var(--rust)' }}>
                    -{formatCurrency(calc.expensesPaid, currency)}
                  </td>
                  <td data-label="التحويلات (+/-)">
                    <span style={{ color: 'var(--emerald)' }}>+{formatNumber(calc.transfersIn)}</span> /{' '}
                    <span style={{ color: 'var(--rust)' }}>-{formatNumber(calc.transfersOut)}</span>
                  </td>
                  <td
                    data-label="الرصيد الحالي"
                    style={{
                      fontWeight: 700,
                      fontSize: 15,
                      color: isNegative ? 'var(--rust)' : 'var(--emerald)',
                      fontVariantNumeric: 'tabular-nums'
                    }}
                  >
                    {formatCurrency(calc.currentBalance, currency)}
                  </td>
                  <td data-label="الحالة"><StatusBadge status={acc.status} /></td>
                  <td data-label="ملاحظات" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{acc.notes || '—'}</td>
                  <td data-label="الإجراءات" className="table-actions-cell">
                    <div className="table-actions-inner">
                      <button className="btn-icon-subtle" onClick={() => onEdit('accounts', acc)} title="تعديل">
                        <Icon name="edit" size={16} />
                      </button>
                      <button className="btn-icon-subtle delete" onClick={() => onDelete('accounts', acc.id, acc.name)} title="حذف">
                        <Icon name="trash" size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// 3. الدخل (Income)
// ==========================================
export function IncomePage({ state, onAdd, onEdit, onDelete }) {
  const currency = state.settings?.currency || 'ج.م';
  const accountsMap = calculateAccountBalances(state);
  const [filter, setFilter] = useState('all');

  const filtered = (state.income || [])
    .filter(inc => {
      if (filter === 'received') return inc.status === 'مستلم';
      if (filter === 'expected') return inc.status === 'متوقع';
      return true;
    })
    .slice()
    .reverse();

  return (
    <div className="page-wrapper">
      <div className="page-header-bar">
        <div>
          <h2 className="page-title">الدخل</h2>
          <p className="page-subtitle">تسجيل الإيرادات والرواتب مع فرز الأحدث أولاً</p>
        </div>
        <button className="btn-primary" onClick={() => onAdd('income')}>
          <Icon name="plus" size={16} /> إضافة دخل جديد
        </button>
      </div>

      <div className="filters-bar">
        <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
          الكل ({state.income?.length || 0})
        </button>
        <button className={`filter-btn ${filter === 'received' ? 'active' : ''}`} onClick={() => setFilter('received')}>
          مستلم ({state.income?.filter(i => i.status === 'مستلم').length || 0})
        </button>
        <button className={`filter-btn ${filter === 'expected' ? 'active' : ''}`} onClick={() => setFilter('expected')}>
          متوقع ({state.income?.filter(i => i.status === 'متوقع').length || 0})
        </button>
      </div>

      <div className="table-card">
        <table className="responsive-table">
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>المصدر</th>
              <th>الوصف</th>
              <th>التصنيف</th>
              <th>المبلغ</th>
              <th>الحساب المستلم</th>
              <th>طريقة الاستلام</th>
              <th>الحالة</th>
              <th>متوقع / فعلي</th>
              <th>ملاحظات</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(inc => (
              <tr key={inc.id}>
                <td data-label="التاريخ">{formatDate(inc.date)}</td>
                <td data-label="المصدر" style={{ fontWeight: 600 }}>{inc.source}</td>
                <td data-label="الوصف">{inc.desc || '—'}</td>
                <td data-label="التصنيف"><span className="chip-category">{inc.category}</span></td>
                <td data-label="المبلغ" style={{ fontWeight: 700, color: 'var(--emerald)', fontVariantNumeric: 'tabular-nums' }}>
                  +{formatCurrency(inc.amount, currency)}
                </td>
                <td data-label="الحساب المستلم">{accountsMap[inc.accountId]?.name || '—'}</td>
                <td data-label="طريقة الاستلام">{inc.method}</td>
                <td data-label="الحالة"><StatusBadge status={inc.status} /></td>
                <td data-label="متوقع / فعلي">
                  <StatusBadge status={inc.expectedType || 'فعلي'} />
                </td>
                <td data-label="ملاحظات" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{inc.notes || '—'}</td>
                <td data-label="الإجراءات" className="table-actions-cell">
                  <div className="table-actions-inner">
                    <button className="btn-icon-subtle" onClick={() => onEdit('income', inc)} title="تعديل">
                      <Icon name="edit" size={16} />
                    </button>
                    <button className="btn-icon-subtle delete" onClick={() => onDelete('income', inc.id, inc.source)} title="حذف">
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// 4. المصروفات (Expenses)
// ==========================================
export function ExpensesPage({ state, onAdd, onEdit, onDelete }) {
  const currency = state.settings?.currency || 'ج.م';
  const accountsMap = calculateAccountBalances(state);
  const [filter, setFilter] = useState('all');

  const filtered = (state.expenses || [])
    .filter(ex => {
      if (filter === 'paid') return ex.status === 'مدفوع';
      if (filter === 'due') return ex.status === 'مستحق';
      return true;
    })
    .slice()
    .reverse();

  return (
    <div className="page-wrapper">
      <div className="page-header-bar">
        <div>
          <h2 className="page-title">المصروفات</h2>
          <p className="page-subtitle">تسجيل وتصنيف النفقات اليومية والشهرية</p>
        </div>
        <button className="btn-primary" onClick={() => onAdd('expenses')}>
          <Icon name="plus" size={16} /> إضافة مصروف جديد
        </button>
      </div>

      <div className="filters-bar">
        <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
          الكل ({state.expenses?.length || 0})
        </button>
        <button className={`filter-btn ${filter === 'paid' ? 'active' : ''}`} onClick={() => setFilter('paid')}>
          مدفوع ({state.expenses?.filter(e => e.status === 'مدفوع').length || 0})
        </button>
        <button className={`filter-btn ${filter === 'due' ? 'active' : ''}`} onClick={() => setFilter('due')}>
          مستحق ({state.expenses?.filter(e => e.status === 'مستحق').length || 0})
        </button>
      </div>

      <div className="table-card">
        <table className="responsive-table">
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>الوصف</th>
              <th>التصنيف الرئيسي</th>
              <th>التصنيف الفرعي</th>
              <th>المبلغ</th>
              <th>الحساب المدفوع منه</th>
              <th>طريقة الدفع</th>
              <th>الضرورة</th>
              <th>التكرار</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(ex => (
              <tr key={ex.id}>
                <td data-label="التاريخ">{formatDate(ex.date)}</td>
                <td data-label="الوصف" style={{ fontWeight: 600 }}>{ex.desc}</td>
                <td data-label="التصنيف الرئيسي"><span className="chip-category">{ex.mainCat}</span></td>
                <td data-label="التصنيف الفرعي">{ex.subCat || '—'}</td>
                <td data-label="المبلغ" style={{ fontWeight: 700, color: 'var(--rust)', fontVariantNumeric: 'tabular-nums' }}>
                  -{formatCurrency(ex.amount, currency)}
                </td>
                <td data-label="الحساب المدفوع منه">{accountsMap[ex.accountId]?.name || '—'}</td>
                <td data-label="طريقة الدفع">{ex.method}</td>
                <td data-label="الضرورة">
                  <span style={{ fontSize: 12, color: ex.necessity === 'ضروري' ? 'var(--ink)' : 'var(--ink-soft)' }}>
                    {ex.necessity}
                  </span>
                </td>
                <td data-label="التكرار">{ex.recurrence}</td>
                <td data-label="الحالة"><StatusBadge status={ex.status} /></td>
                <td data-label="الإجراءات" className="table-actions-cell">
                  <div className="table-actions-inner">
                    <button className="btn-icon-subtle" onClick={() => onEdit('expenses', ex)} title="تعديل">
                      <Icon name="edit" size={16} />
                    </button>
                    <button className="btn-icon-subtle delete" onClick={() => onDelete('expenses', ex.id, ex.desc)} title="حذف">
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// 5. التحويلات بين الحسابات (Transfers)
// ==========================================
export function TransfersPage({ state, onAdd, onEdit, onDelete }) {
  const currency = state.settings?.currency || 'ج.م';
  const accountsMap = calculateAccountBalances(state);
  const accounts = state.accounts || [];

  // حالة الحاسبة الفورية لمصاريف التحويل
  const [calcFromId, setCalcFromId] = useState(() => accounts[0]?.id || '');
  const [calcToId, setCalcToId] = useState(() => accounts[1]?.id || accounts[0]?.id || '');
  const [calcAmount, setCalcAmount] = useState(1000);

  const calcFromAcc = accounts.find(a => a.id === calcFromId);
  const calcToAcc = accounts.find(a => a.id === calcToId);
  const feeInfo = calculateTransferFee(calcFromAcc, calcToAcc, calcAmount);

  return (
    <div className="page-wrapper">
      <div className="page-header-bar">
        <div>
          <h2 className="page-title">التحويلات بين الحسابات</h2>
          <p className="page-subtitle">التحويل ليس دخلاً ولا مصروفاً، ويؤثر في رصيد الحسابين عند اكتماله فقط مع خصم الرسوم الرسمية</p>
        </div>
        <button className="btn-primary" onClick={() => onAdd('transfers')}>
          <Icon name="plus" size={16} /> إضافة تحويل جديد
        </button>
      </div>

      {/* ويدجت حاسبة مصاريف التحويل الرسمية السريعة (إنستاباي ومحافظ الاتصالات والبنوك) */}
      <div className="table-card transfer-fee-calc-box" style={{ marginBottom: 20, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>⚡</span>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                حاسبة مصاريف التحويل الرسمية (إنستاباي • محافظ الاتصالات • البنوك)
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                حساب لحظي دقيق للرسوم طبقاً لتعليمات البنك المركزي المصري ولوائح شبكة المدفوعات اللحظية IPN
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-primary btn-sm"
            onClick={() => onAdd('transfers', {
              fromAccountId: calcFromId,
              toAccountId: calcToId,
              amount: calcAmount,
              fee: feeInfo.fee
            })}
            style={{ fontWeight: 700 }}
          >
            <Icon name="plus" size={14} /> تنفيذ هذا التحويل الآن
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, alignItems: 'center' }}>
          <div>
            <label className="form-label" style={{ fontSize: 11.5, marginBottom: 4 }}>من حساب (المصدر)</label>
            <select
              className="form-select"
              value={calcFromId}
              onChange={e => setCalcFromId(e.target.value)}
              style={{ fontSize: 12.5 }}
            >
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: 11.5, marginBottom: 4 }}>إلى حساب (المستلم)</label>
            <select
              className="form-select"
              value={calcToId}
              onChange={e => setCalcToId(e.target.value)}
              style={{ fontSize: 12.5 }}
            >
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: 11.5, marginBottom: 4 }}>مبلغ التحويل ({currency})</label>
            <input
              type="number"
              min="1"
              step="any"
              className="form-input"
              value={calcAmount}
              onChange={e => setCalcAmount(parseFloat(e.target.value) || 0)}
              style={{ fontSize: 13 }}
            />
          </div>

          <div style={{
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: 10,
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>الرسوم الرسمية:</span>
              <span style={{ fontSize: 16, fontWeight: 900, color: feeInfo.fee > 0 ? 'var(--amber)' : 'var(--emerald)' }}>
                {feeInfo.fee > 0 ? `${feeInfo.fee} ${currency}` : '0.00 (مجاناً)'}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--cyan)', fontWeight: 600 }}>
              {feeInfo.reason}
            </div>
          </div>
        </div>
      </div>

      <div className="table-card">
        <table className="responsive-table">
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>من حساب (المصدر)</th>
              <th>إلى حساب (المستلم)</th>
              <th>المبلغ</th>
              <th>رسوم التحويل</th>
              <th>الحالة</th>
              <th>ملاحظات</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {(state.transfers || []).slice().reverse().map(tr => {
              const isSameAccount = tr.fromAccountId && tr.fromAccountId === tr.toAccountId;
              return (
                <tr key={tr.id} className={isSameAccount ? 'row-alert-red' : ''}>
                  <td data-label="التاريخ">{formatDate(tr.date)}</td>
                  <td data-label="من حساب">
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <BankIconBadge account={accountsMap[tr.fromAccountId]} size={20} />
                      <span>{accountsMap[tr.fromAccountId]?.name || tr.fromAccountId}</span>
                    </div>
                  </td>
                  <td data-label="إلى حساب">
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <BankIconBadge account={accountsMap[tr.toAccountId]} size={20} />
                      <span>{accountsMap[tr.toAccountId]?.name || tr.toAccountId}</span>
                    </div>
                  </td>
                  <td data-label="المبلغ" style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                    {formatCurrency(tr.amount, currency)}
                  </td>
                  <td data-label="رسوم التحويل">
                    {tr.fee > 0 ? formatCurrency(tr.fee, currency) : 'بلا رسوم'}
                  </td>
                  <td data-label="الحالة"><StatusBadge status={tr.status} /></td>
                  <td data-label="ملاحظات" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                    {isSameAccount ? (
                      <span style={{ color: 'var(--rust)', fontWeight: 600 }}>تنبيه: الحساب المصدر والمستلم متطابقان!</span>
                    ) : (
                      tr.notes || '—'
                    )}
                  </td>
                  <td data-label="الإجراءات" className="table-actions-cell">
                    <div className="table-actions-inner">
                      <button className="btn-icon-subtle" onClick={() => onEdit('transfers', tr)} title="تعديل">
                        <Icon name="edit" size={16} />
                      </button>
                      <button className="btn-icon-subtle delete" onClick={() => onDelete('transfers', tr.id, `تحويل بمبلغ ${tr.amount}`)} title="حذف">
                        <Icon name="trash" size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// 6. الديون (ديون عليّ وفلوس لي) (Debts)
// ==========================================
export function DebtsPage({ state, onAdd, onEdit, onDelete }) {
  const currency = state.settings?.currency || 'ج.م';
  const accountsMap = calculateAccountBalances(state);

  return (
    <div className="page-wrapper">
      <div className="page-header-bar">
        <div>
          <h2 className="page-title">الديون والمستحقات</h2>
          <p className="page-subtitle">متابعة ما لك وما عليك مع تواريخ الاستحقاق والمتبقي</p>
        </div>
      </div>

      {/* القسم الأول: ديون عليّ */}
      <div className="card-box" style={{ marginBottom: 24 }}>
        <div className="section-header-row">
          <div>
            <h3 className="section-title">ديون عليّ (التزامات للغير)</h3>
            <p className="section-sub">المتبقي = المبلغ الأصلي − المبلغ المدفوع</p>
          </div>
          <button className="btn-secondary" onClick={() => onAdd('debtsOwed')}>
            <Icon name="plus" size={16} /> إضافة دين عليّ
          </button>
        </div>

        <div className="table-responsive-wrapper">
          <table className="responsive-table">
            <thead>
              <tr>
                <th>الشخص / الجهة</th>
                <th>الوصف</th>
                <th>الأصل</th>
                <th>المدفوع</th>
                <th>المتبقي</th>
                <th>تاريخ البدء</th>
                <th>الاستحقاق</th>
                <th>الحالة</th>
                <th>الحساب</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {(state.debtsOwed || []).map(d => {
                const orig = Number(d.original) || 0;
                const paid = Number(d.paid) || 0;
                const remaining = Math.max(0, orig - paid);
                const diff = getDaysDiff(d.dueDate);
                const isOverdue = diff !== null && diff < 0 && d.status !== 'مكتمل' && d.status !== 'ملغي';

                return (
                  <tr key={d.id} className={isOverdue ? 'row-alert-red' : ''}>
                    <td data-label="الشخص" style={{ fontWeight: 600 }}>{d.person}</td>
                    <td data-label="الوصف">{d.desc || '—'}</td>
                    <td data-label="المبلغ الأصلي">{formatCurrency(orig, currency)}</td>
                    <td data-label="المدفوع" style={{ color: 'var(--emerald)' }}>{formatCurrency(paid, currency)}</td>
                    <td data-label="المتبقي" style={{ fontWeight: 700, color: 'var(--rust)', fontVariantNumeric: 'tabular-nums' }}>
                      {formatCurrency(remaining, currency)}
                    </td>
                    <td data-label="تاريخ البدء">{formatDate(d.startDate)}</td>
                    <td data-label="تاريخ الاستحقاق">
                      {formatDate(d.dueDate)}{' '}
                      {isOverdue && (
                        <span style={{ color: 'var(--rust)', fontWeight: 600 }}>
                          (متأخر {Math.abs(diff)} يوم)
                        </span>
                      )}
                    </td>
                    <td data-label="الحالة"><StatusBadge status={d.status} /></td>
                    <td data-label="الحساب المسدد منه">{accountsMap[d.accountId]?.name || '—'}</td>
                    <td data-label="الإجراءات" className="table-actions-cell">
                      <div className="table-actions-inner">
                        <button className="btn-icon-subtle" onClick={() => onEdit('debtsOwed', d)} title="تعديل">
                          <Icon name="edit" size={16} />
                        </button>
                        <button className="btn-icon-subtle delete" onClick={() => onDelete('debtsOwed', d.id, `دين ${d.person}`)} title="حذف">
                          <Icon name="trash" size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* القسم الثاني: فلوس لي عند الآخرين */}
      <div className="card-box">
        <div className="section-header-row">
          <div>
            <h3 className="section-title">فلوس لي عند الآخرين</h3>
            <p className="section-sub">المتبقي = المبلغ الأصلي − المبلغ المستلم</p>
          </div>
          <button className="btn-secondary" onClick={() => onAdd('debtsReceivable')}>
            <Icon name="plus" size={16} /> إضافة مستحق لي
          </button>
        </div>

        <div className="table-responsive-wrapper">
          <table className="responsive-table">
            <thead>
              <tr>
                <th>الشخص المدين</th>
                <th>الوصف</th>
                <th>الأصل</th>
                <th>المستلم منه</th>
                <th>المتبقي</th>
                <th>الاستحقاق</th>
                <th>الاحتمالية</th>
                <th>الحالة</th>
                <th>ملاحظات</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {(state.debtsReceivable || []).map(d => {
                const orig = Number(d.original) || 0;
                const rec = Number(d.received) || 0;
                const remaining = Math.max(0, orig - rec);

                return (
                  <tr key={d.id}>
                    <td data-label="الشخص المدين" style={{ fontWeight: 600 }}>{d.person}</td>
                    <td data-label="الوصف">{d.desc || '—'}</td>
                    <td data-label="المبلغ الأصلي">{formatCurrency(orig, currency)}</td>
                    <td data-label="المستلم منه" style={{ color: 'var(--emerald)' }}>{formatCurrency(rec, currency)}</td>
                    <td data-label="المتبقي" style={{ fontWeight: 700, color: 'var(--emerald)', fontVariantNumeric: 'tabular-nums' }}>
                      {formatCurrency(remaining, currency)}
                    </td>
                    <td data-label="الاستحقاق المتوقع">{formatDate(d.dueDate)}</td>
                    <td data-label="احتمالية التحصيل">
                      <span className={`chip-priority priority-${d.probability === 'عالية' ? 'high' : d.probability === 'متوسطة' ? 'medium' : 'low'}`}>
                        {d.probability}
                      </span>
                    </td>
                    <td data-label="الحالة"><StatusBadge status={d.status} /></td>
                    <td data-label="ملاحظات" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{d.notes || '—'}</td>
                    <td data-label="الإجراءات" className="table-actions-cell">
                      <div className="table-actions-inner">
                        <button className="btn-icon-subtle" onClick={() => onEdit('debtsReceivable', d)} title="تعديل">
                          <Icon name="edit" size={16} />
                        </button>
                        <button className="btn-icon-subtle delete" onClick={() => onDelete('debtsReceivable', d.id, `مستحق ${d.person}`)} title="حذف">
                          <Icon name="trash" size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 7. الاشتراكات والمواعيد الدورية (Subscriptions)
// ==========================================
export function SubscriptionsPage({ state, mutate, onAdd, onEdit, onDelete }) {
  const currency = state.settings?.currency || 'ج.م';
  const accountsMap = calculateAccountBalances(state);

  const totalMonthlyActive = (state.subscriptions || [])
    .filter(s => s.status === 'نشط')
    .reduce((sum, s) => sum + calculateSubscriptionMonthly(s), 0);

  // الضغط على زر "تمّت الآن"
  const handleDoneNow = sub => {
    const today = getRelativeDate(0);
    const nextDate = calculateNextRenewalDate(sub.intervalValue, sub.intervalUnit);

    mutate(draft => {
      const item = draft.subscriptions.find(s => s.id === sub.id);
      if (item) {
        item.lastPayment = today;
        item.nextRenewal = nextDate;
      }
    });
  };

  return (
    <div className="page-wrapper">
      <div className="page-header-bar">
        <div>
          <h2 className="page-title">الاشتراكات والمواعيد الدورية</h2>
          <p className="page-subtitle">حساب المعادل الشهري الدقيق وتحديث مواعيد التجديد</p>
        </div>
        <button className="btn-primary" onClick={() => onAdd('subscriptions')}>
          <Icon name="plus" size={16} /> إضافة اشتراك جديد
        </button>
      </div>

      {/* بطاقة إجمالي المعادل الشهري */}
      <div className="metric-card card-ochre" style={{ maxWidth: 360, marginBottom: 20 }}>
        <div className="metric-label">إجمالي المعادل الشهري للاشتراكات النشطة</div>
        <div className="metric-value">{formatCurrency(totalMonthlyActive, currency)}</div>
        <div className="metric-footnote">اليوم 1/30.44 · الأسبوع 7/30.44 · السنة 12 شهرًا</div>
      </div>

      <div className="table-card">
        <table className="responsive-table">
          <thead>
            <tr>
              <th>الاشتراك</th>
              <th>النوع</th>
              <th>القيمة</th>
              <th>التكرار</th>
              <th>الموعد القادم</th>
              <th>الحساب</th>
              <th>تلقائي</th>
              <th>الحالة</th>
              <th>آخر دفعة</th>
              <th>المعادل الشهري</th>
              <th>سداد فوري</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {(state.subscriptions || []).map(sub => {
              const monthly = calculateSubscriptionMonthly(sub);
              const diff = getDaysDiff(sub.nextRenewal);
              const isPastDue = diff !== null && diff < 0 && sub.status === 'نشط';
              const isSoon = diff !== null && diff >= 0 && diff <= 7 && sub.status === 'نشط';

              return (
                <tr
                  key={sub.id}
                  className={isPastDue ? 'row-alert-red' : isSoon ? 'row-alert-yellow' : ''}
                >
                  <td data-label="الاشتراك" style={{ fontWeight: 600 }}>{sub.name}</td>
                  <td data-label="النوع">{sub.type}</td>
                  <td data-label="القيمة">{formatCurrency(sub.value, currency)}</td>
                  <td data-label="التكرار">كل {sub.intervalValue} {sub.intervalUnit}</td>
                  <td data-label="الموعد القادم">
                    <span style={{ fontWeight: 600, color: isPastDue ? 'var(--rust)' : isSoon ? 'var(--ochre)' : 'inherit' }}>
                      {formatDate(sub.nextRenewal)}
                    </span>
                    {isPastDue && <span style={{ fontSize: 11, display: 'block', color: 'var(--rust)' }}>فات موعده!</span>}
                    {isSoon && <span style={{ fontSize: 11, display: 'block', color: 'var(--ochre)' }}>خلال {diff} أيام</span>}
                  </td>
                  <td data-label="الحساب">{accountsMap[sub.accountId]?.name || '—'}</td>
                  <td data-label="تلقائي">{sub.autoRenew ? 'نعم' : 'لا'}</td>
                  <td data-label="الحالة"><StatusBadge status={sub.status} /></td>
                  <td data-label="آخر دفعة">{formatDate(sub.lastPayment) || '—'}</td>
                  <td data-label="المعادل الشهري" style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                    {formatCurrency(monthly, currency)}
                  </td>
                  <td data-label="سداد فوري">
                    <button
                      className="btn-secondary btn-sm"
                      style={{ whiteSpace: 'nowrap' }}
                      onClick={() => handleDoneNow(sub)}
                      title="تحديث تاريخ الدفع إلى اليوم وحساب الموعد القادم"
                    >
                      <Icon name="check" size={12} /> تمّت الآن
                    </button>
                  </td>
                  <td data-label="الإجراءات" className="table-actions-cell">
                    <div className="table-actions-inner">
                      <button className="btn-icon-subtle" onClick={() => onEdit('subscriptions', sub)} title="تعديل">
                        <Icon name="edit" size={14} />
                      </button>
                      <button className="btn-icon-subtle delete" onClick={() => onDelete('subscriptions', sub.id, sub.name)} title="حذف">
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// 8. الالتزامات القادمة (Upcoming Obligations)
// ==========================================
export function UpcomingPage({ state, onAdd, onEdit, onDelete }) {
  const currency = state.settings?.currency || 'ج.م';
  const accountsMap = calculateAccountBalances(state);

  // مرتبة بالأقرب استحقاقاً
  const sorted = [...(state.upcoming || [])].sort((a, b) =>
    (a.dueDate || '').localeCompare(b.dueDate || '')
  );

  return (
    <div className="page-wrapper">
      <div className="page-header-bar">
        <div>
          <h2 className="page-title">الالتزامات القادمة</h2>
          <p className="page-subtitle">متابعة الفواتير والأقساط والإيجارات مرتبة بالأقرب استحقاقاً</p>
        </div>
        <button className="btn-primary" onClick={() => onAdd('upcoming')}>
          <Icon name="plus" size={16} /> إضافة التزام جديد
        </button>
      </div>

      <div className="table-card">
        <table className="responsive-table">
          <thead>
            <tr>
              <th>اسم الالتزام</th>
              <th>النوع</th>
              <th>المبلغ</th>
              <th>تاريخ الاستحقاق</th>
              <th>الحساب المخصص</th>
              <th>الأولوية</th>
              <th>الحالة</th>
              <th>متكرر</th>
              <th>المصدر</th>
              <th>ملاحظات</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(up => {
              const diff = getDaysDiff(up.dueDate);
              const isPastDue = diff !== null && diff < 0 && up.status === 'قادم';
              const isSoon = diff !== null && diff >= 0 && diff <= 3 && up.status === 'قادم';

              return (
                <tr key={up.id} className={isPastDue ? 'row-alert-red' : isSoon ? 'row-alert-yellow' : ''}>
                  <td data-label="الاسم" style={{ fontWeight: 600 }}>{up.name}</td>
                  <td data-label="النوع">{up.type}</td>
                  <td data-label="المبلغ" style={{ fontWeight: 700, color: 'var(--rust)', fontVariantNumeric: 'tabular-nums' }}>
                    {formatCurrency(up.amount, currency)}
                  </td>
                  <td data-label="تاريخ الاستحقاق">
                    {formatDate(up.dueDate)}{' '}
                    {isSoon && (
                      <span style={{ color: 'var(--ochre)', fontWeight: 600, display: 'block', fontSize: 11 }}>
                        ({diff === 0 ? 'النهاردة' : `بعد ${diff} أيام`})
                      </span>
                    )}
                    {isPastDue && (
                      <span style={{ color: 'var(--rust)', fontWeight: 600, display: 'block', fontSize: 11 }}>
                        (فات بـ {Math.abs(diff)} يوم)
                      </span>
                    )}
                  </td>
                  <td data-label="الحساب">{accountsMap[up.accountId]?.name || '—'}</td>
                  <td data-label="الأولوية">
                    <span className={`chip-priority priority-${up.priority === 'عالية' ? 'high' : up.priority === 'متوسطة' ? 'medium' : 'low'}`}>
                      {up.priority}
                    </span>
                  </td>
                  <td data-label="الحالة"><StatusBadge status={up.status} /></td>
                  <td data-label="متكرر">{up.recurring ? 'نعم' : 'لا'}</td>
                  <td data-label="المصدر">{up.source || '—'}</td>
                  <td data-label="ملاحظات" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{up.notes || '—'}</td>
                  <td data-label="الإجراءات" className="table-actions-cell">
                    <div className="table-actions-inner">
                      <button className="btn-icon-subtle" onClick={() => onEdit('upcoming', up)} title="تعديل">
                        <Icon name="edit" size={16} />
                      </button>
                      <button className="btn-icon-subtle delete" onClick={() => onDelete('upcoming', up.id, up.name)} title="حذف">
                        <Icon name="trash" size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// 9. الدخل المتوقع (Expected Income)
// ==========================================
export function ExpectedIncomePage({ state, onAdd, onEdit, onDelete }) {
  const currency = state.settings?.currency || 'ج.م';
  const accountsMap = calculateAccountBalances(state);

  const totalWeighted = (state.expectedIncome || [])
    .filter(ei => ei.status !== 'ملغي')
    .reduce((sum, ei) => sum + (Number(ei.amount) || 0) * (Number(ei.probability) || 0), 0);

  return (
    <div className="page-wrapper">
      <div className="page-header-bar">
        <div>
          <h2 className="page-title">الدخل المتوقع</h2>
          <p className="page-subtitle">حساب القيمة المرجّحة للدخل حسب احتمالية الحصول عليه</p>
        </div>
        <button className="btn-primary" onClick={() => onAdd('expectedIncome')}>
          <Icon name="plus" size={16} /> إضافة دخل متوقع
        </button>
      </div>

      <div className="metric-card card-emerald" style={{ maxWidth: 360, marginBottom: 20 }}>
        <div className="metric-label">إجمالي القيمة المرجّحة للدخل المتوقع</div>
        <div className="metric-value">{formatCurrency(totalWeighted, currency)}</div>
        <div className="metric-footnote">مجموع (المبلغ × الاحتمال) للعمليات غير الملغية</div>
      </div>

      <div className="table-card">
        <table className="responsive-table">
          <thead>
            <tr>
              <th>المصدر</th>
              <th>العميل</th>
              <th>الوصف</th>
              <th>المتوقع</th>
              <th>الاحتمال</th>
              <th>التاريخ</th>
              <th>الحساب</th>
              <th>الحالة</th>
              <th>الفعلي</th>
              <th>الفرق</th>
              <th>المرجّحة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {(state.expectedIncome || []).map(ei => {
              const amt = Number(ei.amount) || 0;
              const prob = Number(ei.probability) || 0;
              const weighted = amt * prob;
              const actual = ei.actualReceived !== null && ei.actualReceived !== undefined ? Number(ei.actualReceived) : null;
              const diff = actual !== null ? actual - amt : null;

              return (
                <tr key={ei.id}>
                  <td data-label="المصدر" style={{ fontWeight: 600 }}>{ei.source}</td>
                  <td data-label="العميل">{ei.client || '—'}</td>
                  <td data-label="الوصف">{ei.desc || '—'}</td>
                  <td data-label="المبلغ المتوقع">{formatCurrency(amt, currency)}</td>
                  <td data-label="الاحتمال">{Math.round(prob * 100)}%</td>
                  <td data-label="التاريخ المتوقع">{formatDate(ei.expectedDate)}</td>
                  <td data-label="الحساب المتوقع">{accountsMap[ei.accountId]?.name || '—'}</td>
                  <td data-label="الحالة"><StatusBadge status={ei.status} /></td>
                  <td data-label="المبلغ الفعلي">{actual !== null ? formatCurrency(actual, currency) : 'لم يُستلم بعد'}</td>
                  <td data-label="الفرق">
                    {diff !== null ? (
                      <span style={{ color: diff >= 0 ? 'var(--emerald)' : 'var(--rust)', fontWeight: 600 }}>
                        {diff >= 0 ? `+${formatNumber(diff)}` : formatNumber(diff)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td data-label="القيمة المرجّحة" style={{ fontWeight: 700, color: 'var(--emerald)', fontVariantNumeric: 'tabular-nums' }}>
                    {formatCurrency(weighted, currency)}
                  </td>
                  <td data-label="الإجراءات" className="table-actions-cell">
                    <div className="table-actions-inner">
                      <button className="btn-icon-subtle" onClick={() => onEdit('expectedIncome', ei)} title="تعديل">
                        <Icon name="edit" size={16} />
                      </button>
                      <button className="btn-icon-subtle delete" onClick={() => onDelete('expectedIncome', ei.id, ei.source)} title="حذف">
                        <Icon name="trash" size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// 10. الأهداف المالية (Financial Goals)
// ==========================================
export function GoalsPage({ state, onAdd, onEdit, onDelete }) {
  const currency = state.settings?.currency || 'ج.م';
  const accountsMap = calculateAccountBalances(state);

  return (
    <div className="page-wrapper">
      <div className="page-header-bar">
        <div>
          <h2 className="page-title">الأهداف المالية</h2>
          <p className="page-subtitle">تتبع خطط الادخار، شراء الأصول، وصناديق الطوارئ مع أشرطة الإنجاز</p>
        </div>
        <button className="btn-primary" onClick={() => onAdd('goals')}>
          <Icon name="plus" size={16} /> إضافة هدف مالي
        </button>
      </div>

      <div className="table-card">
        <table className="responsive-table">
          <thead>
            <tr>
              <th>الهدف</th>
              <th>النوع</th>
              <th>المستهدف</th>
              <th>الحالي</th>
              <th>المتبقي</th>
              <th>الإنجاز</th>
              <th>البدء</th>
              <th>المستهدف</th>
              <th>الأولوية</th>
              <th>الحالة</th>
              <th>الحساب</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {(state.goals || []).map(g => {
              const target = Number(g.target) || 0;
              const current = Number(g.current) || 0;
              const remaining = Math.max(0, target - current);
              const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

              return (
                <tr key={g.id}>
                  <td data-label="الهدف" style={{ fontWeight: 600 }}>{g.name}</td>
                  <td data-label="النوع">{g.type}</td>
                  <td data-label="المستهدف">{formatCurrency(target, currency)}</td>
                  <td data-label="الحالي" style={{ color: 'var(--emerald)', fontWeight: 600 }}>
                    {formatCurrency(current, currency)}
                  </td>
                  <td data-label="المتبقي">{formatCurrency(remaining, currency)}</td>
                  <td data-label="الإنجاز" style={{ minWidth: 90 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress-track" style={{ flex: 1 }}>
                        <div
                          className="progress-fill"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: percent >= 100 ? 'var(--emerald)' : 'var(--navy)'
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>{percent}%</span>
                    </div>
                  </td>
                  <td data-label="تاريخ البدء">{formatDate(g.startDate)}</td>
                  <td data-label="التاريخ المستهدف">{formatDate(g.targetDate)}</td>
                  <td data-label="الأولوية">
                    <span className={`chip-priority priority-${g.priority === 'عالية' ? 'high' : g.priority === 'متوسطة' ? 'medium' : 'low'}`}>
                      {g.priority}
                    </span>
                  </td>
                  <td data-label="الحالة"><StatusBadge status={g.status} /></td>
                  <td data-label="الحساب المرتبط">{accountsMap[g.accountId]?.name || '—'}</td>
                  <td data-label="الإجراءات" className="table-actions-cell">
                    <div className="table-actions-inner">
                      <button className="btn-icon-subtle" onClick={() => onEdit('goals', g)} title="تعديل">
                        <Icon name="edit" size={16} />
                      </button>
                      <button className="btn-icon-subtle delete" onClick={() => onDelete('goals', g.id, g.name)} title="حذف">
                        <Icon name="trash" size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// 11. التقارير الشهرية (Monthly Reports)
// ==========================================
export function ReportsPage({ state }) {
  const currency = state.settings?.currency || 'ج.م';
  const reports = calculateMonthlyReports(state);

  return (
    <div className="page-wrapper">
      <div className="page-header-bar">
        <div>
          <h2 className="page-title">التقارير الشهرية (آخر 12 شهرًا)</h2>
          <p className="page-subtitle">
            ملخص مالي شامل شهرياً يحسب الدخل والمصروف وصافي التدفق ورصيد البداية والنهاية
          </p>
        </div>
      </div>

      {/* تنبيه خاص بالديون التراكمية */}
      <div className="alert-item alert-yellow" style={{ marginBottom: 20 }}>
        <Icon name="alert" size={18} color="var(--ochre)" />
        <div>
          <strong>ملاحظة هامة:</strong> أرقام الديون المدفوعة والمتبقية في الجدول هي أرقام تراكمية حتى اليوم (لأن نظام الديون لا يحفظ تاريخ كل دفعة منفردة).
        </div>
      </div>

      {/* الرسوم البيانية للتقارير */}
      <div className="charts-grid-dashboard" style={{ marginBottom: 24 }}>
        <div className="card-box chart-box">
          <h4 className="chart-title">مقارنة الدخل والمصروفات خلال الـ 12 شهرًا</h4>
          <IncomeExpenseBarChart data={reports} currency={currency} />
        </div>
        <div className="card-box chart-box">
          <h4 className="chart-title">منحنى رصيد نهاية الشهر</h4>
          <BalanceLineChart data={reports} currency={currency} />
        </div>
      </div>

      {/* جدول الـ 12 شهرًا التفصيلي */}
      <div className="table-card">
        <table className="responsive-table">
          <thead>
            <tr>
              <th>الشهر</th>
              <th>الدخل المستلم</th>
              <th>المصروفات المدفوعة</th>
              <th>الصافي</th>
              <th>نسبة الادخار</th>
              <th>أكبر تصنيف إنفاق</th>
              <th>إجمالي الاشتراكات</th>
              <th>رصيد البداية</th>
              <th>رصيد النهاية</th>
              <th>ديون مسددة (تراكمي)</th>
              <th>ديون متبقية (تراكمي)</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r, idx) => (
              <tr key={idx}>
                <td data-label="الشهر" style={{ fontWeight: 600 }}>{r.monthName}</td>
                <td data-label="الدخل المستلم" style={{ color: 'var(--emerald)' }}>
                  +{formatCurrency(r.income, currency)}
                </td>
                <td data-label="المصروفات المدفوعة" style={{ color: 'var(--rust)' }}>
                  -{formatCurrency(r.expenses, currency)}
                </td>
                <td
                  data-label="الصافي"
                  style={{
                    fontWeight: 700,
                    color: r.net >= 0 ? 'var(--emerald)' : 'var(--rust)',
                    fontVariantNumeric: 'tabular-nums'
                  }}
                >
                  {formatCurrency(r.net, currency)}
                </td>
                <td data-label="نسبة الادخار">{Math.round(r.savingsRate)}%</td>
                <td data-label="أكبر تصنيف إنفاق">
                  {r.topCat !== 'لا يوجد' ? `${r.topCat} (${formatNumber(r.topCatAmount)})` : '—'}
                </td>
                <td data-label="إجمالي الاشتراكات">{formatCurrency(r.subscriptionsTotal, currency)}</td>
                <td data-label="رصيد البداية">{formatCurrency(r.startBalance, currency)}</td>
                <td data-label="رصيد النهاية" style={{ fontWeight: 700 }}>
                  {formatCurrency(r.endBalance, currency)}
                </td>
                <td data-label="ديون مسددة">{formatCurrency(r.debtsPaid, currency)}</td>
                <td data-label="ديون متبقية">{formatCurrency(r.debtsRemaining, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// 12. الإعدادات والأمان (Settings & Security)
// ==========================================
export function SettingsPage({
  state,
  mutate,
  onResetData,
  onClearTransactions = null,
  onResetToZero = null,
  theme,
  onToggleTheme,
  hasPin,
  onSetPin,
  onRemovePin,
  onLockNow,
  onLogout,
  backendStatus = null,
  lastSyncedAt = null,
  onManualSync = null,
  onRefreshDbStatus = null,
  syncInProgress = false
}) {
  const [currency, setCurrency] = useState(state.settings?.currency || 'ج.م');
  const [userName, setUserName] = useState(state.userProfile?.fullName || '');
  const [userEmail, setUserEmail] = useState(state.userProfile?.email || '');
  const [profileSavedMsg, setProfileSavedMsg] = useState('');
  const [newIncomeCat, setNewIncomeCat] = useState('');
  const [newExpenseCat, setNewExpenseCat] = useState('');
  const [categoryBudgets, setCategoryBudgets] = useState(
    state.settings?.categoryBudgets || {}
  );

  // حالة الرمز السري الجديد
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [securityStatusMsg, setSecurityStatusMsg] = useState('');

  const handleSaveSettings = () => {
    mutate(draft => {
      draft.settings.currency = currency.trim() || 'ج.م';
      draft.settings.categoryBudgets = { ...categoryBudgets };
    });
    alert('تم حفظ الإعدادات بنجاح!');
  };

  const handleSavePin = e => {
    e.preventDefault();
    if (newPinInput.length < 4) {
      alert('الرمز السري يجب أن يتكون من 4 أرقام على الأقل');
      return;
    }
    if (newPinInput !== confirmPinInput) {
      alert('الرمز السري وتأكيده غير متطابقين!');
      return;
    }

    onSetPin(newPinInput);
    setNewPinInput('');
    setConfirmPinInput('');
    setSecurityStatusMsg('تم تفعيل التشفير وحفظ الرمز السري بنجاح!');
    setTimeout(() => setSecurityStatusMsg(''), 4000);
  };

  const handleDisablePin = () => {
    if (window.confirm('هل أنت متأكد من إلغاء قفل التطبيق؟ لن يُطلب رمز سري عند الفتح.')) {
      onRemovePin();
      setSecurityStatusMsg('تم إلغاء القفل بالرمز السري.');
      setTimeout(() => setSecurityStatusMsg(''), 4000);
    }
  };

  const handleAddIncomeCat = e => {
    e.preventDefault();
    if (!newIncomeCat.trim()) return;
    const cat = newIncomeCat.trim();
    if (state.settings?.incomeCats?.includes(cat)) {
      alert('هذا التصنيف موجود بالفعل');
      return;
    }
    mutate(draft => {
      draft.settings.incomeCats.push(cat);
    });
    setNewIncomeCat('');
  };

  const handleDeleteIncomeCat = cat => {
    mutate(draft => {
      draft.settings.incomeCats = draft.settings.incomeCats.filter(c => c !== cat);
    });
  };

  const handleAddExpenseCat = e => {
    e.preventDefault();
    if (!newExpenseCat.trim()) return;
    const cat = newExpenseCat.trim();
    if (state.settings?.expenseCats?.includes(cat)) {
      alert('هذا التصنيف موجود بالفعل');
      return;
    }
    mutate(draft => {
      draft.settings.expenseCats.push(cat);
    });
    setNewExpenseCat('');
  };

  const handleDeleteExpenseCat = cat => {
    mutate(draft => {
      draft.settings.expenseCats = draft.settings.expenseCats.filter(c => c !== cat);
      if (draft.settings.categoryBudgets[cat]) {
        delete draft.settings.categoryBudgets[cat];
      }
    });
  };

  const handleBudgetChange = (cat, val) => {
    const num = parseFloat(val) || 0;
    setCategoryBudgets(prev => ({ ...prev, [cat]: num }));
  };

  // تصدير نسخة احتياطية كملف JSON
  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `sarfy_backup_${getRelativeDate(0)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // استيراد نسخة احتياطية من ملف JSON
  const handleImportData = e => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const imported = JSON.parse(event.target.result);
        if (imported && imported.accounts && Array.isArray(imported.accounts)) {
          mutate(() => imported);
          alert('تم استيراد البيانات بنجاح!');
        } else {
          alert('ملف النسخة الاحتياطية غير صالح.');
        }
      } catch (err) {
        alert('حدث خطأ أثناء قراءة ملف JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleSaveProfile = e => {
    e.preventDefault();
    if (!userName.trim()) return;
    const initials = getUserInitials(userName.trim());
    mutate(draft => {
      if (!draft.userProfile) draft.userProfile = {};
      draft.userProfile.fullName = userName.trim();
      draft.userProfile.email = userEmail.trim();
      draft.userProfile.avatarSeed = initials;
    });
    try {
      const raw = localStorage.getItem('sarfy_user_meta');
      const meta = raw ? JSON.parse(raw) : {};
      meta.fullName = userName.trim();
      meta.email = userEmail.trim();
      meta.avatarSeed = initials;
      localStorage.setItem('sarfy_user_meta', JSON.stringify(meta));
    } catch {}
    setProfileSavedMsg('تم حفظ وتحديث بيانات الملف الشخصي بنجاح!');
    setTimeout(() => setProfileSavedMsg(''), 4000);
  };

  // رفع وتغيير صورة الحساب الشخصية مع ضغطها تلقائياً
  const handleAvatarUpload = e => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة صالح (JPG, PNG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      const img = new Image();
      img.onload = () => {
        // تحجيم ذكي للصورة لحفظ مساحة التخزين وسرعة التحميل
        const maxDimension = 320;
        let width = img.width;
        let height = img.height;
        if (width > height && width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

        mutate(draft => {
          if (!draft.userProfile) draft.userProfile = {};
          draft.userProfile.avatarImage = compressedDataUrl;
        });

        try {
          const raw = localStorage.getItem('sarfy_user_meta');
          const meta = raw ? JSON.parse(raw) : {};
          meta.avatarImage = compressedDataUrl;
          localStorage.setItem('sarfy_user_meta', JSON.stringify(meta));
        } catch {}

        setProfileSavedMsg('تم رفع وحفظ صورتك الشخصية بنجاح!');
        setTimeout(() => setProfileSavedMsg(''), 4000);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // حذف الصورة الشخصية واستعادة الحروف الأولى
  const handleRemoveAvatar = () => {
    if (!window.confirm('هل أنت متأكد من حذف صورتك الشخصية والعودة إلى الحروف الأولى؟')) return;
    mutate(draft => {
      if (draft.userProfile) {
        delete draft.userProfile.avatarImage;
      }
    });
    try {
      const raw = localStorage.getItem('sarfy_user_meta');
      const meta = raw ? JSON.parse(raw) : {};
      delete meta.avatarImage;
      localStorage.setItem('sarfy_user_meta', JSON.stringify(meta));
    } catch {}
    setProfileSavedMsg('تم حذف الصورة واستعادة الحروف الأولى بنجاح.');
    setTimeout(() => setProfileSavedMsg(''), 4000);
  };

  return (
    <div className="page-wrapper">
      <div className="page-header-bar">
        <div>
          <h2 className="page-title">الإعدادات والأمان</h2>
          <p className="page-subtitle">تخصيص الهوية، التشفير وحماية البيانات، الميزانيات، والنسخ الاحتياطي</p>
        </div>
      </div>

      <div className="settings-grid">
        {/* قسم الملف الشخصي والحساب */}
        <div className="card-box full-col">
          <div className="section-header-row" style={{ alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <UserAvatar
                  userProfile={{ ...state.userProfile, fullName: userName }}
                  size={58}
                  fontSize={19}
                  style={{ border: '2.5px solid var(--emerald)', boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)' }}
                />
                <label
                  htmlFor="avatar-file-input"
                  style={{
                    position: 'absolute',
                    bottom: -4,
                    left: -4,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: 'var(--emerald)',
                    color: '#05070D',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                    border: '2px solid #05070D',
                    fontSize: 12
                  }}
                  title="رفع أو تغيير صورتك الشخصية"
                >
                  📷
                </label>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 className="section-title" style={{ margin: 0 }}>الملف الشخصي والحساب</h3>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(56, 189, 248, 0.12)', color: 'var(--cyan)' }}>
                    الحروف: {getUserInitials(userName || state.userProfile?.fullName || '')}
                  </span>
                </div>
                <p className="section-sub" style={{ margin: '4px 0 0' }}>
                  أول حرف من الاسم الأول والاسم الأخير، أو صورتك الشخصية المخصصة
                </p>

                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  <label
                    htmlFor="avatar-file-input"
                    className="btn-secondary btn-sm"
                    style={{ cursor: 'pointer', margin: 0, fontSize: 11.5, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                  >
                    <span>📷 {state.userProfile?.avatarImage ? 'تغيير صورتك' : 'رفع صورة شخصية'}</span>
                  </label>
                  <input
                    id="avatar-file-input"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleAvatarUpload}
                  />
                  {state.userProfile?.avatarImage && (
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      onClick={handleRemoveAvatar}
                      style={{ fontSize: 11.5, color: 'var(--coral)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                      title="حذف الصورة الشخصية واستعادة الحروف الأولى"
                    >
                      🗑️ حذف الصورة
                    </button>
                  )}
                </div>
              </div>
            </div>

            {onLogout && (
              <button className="btn-secondary btn-sm" onClick={onLogout}>
                <Icon name="logout" size={14} /> تبديل الحساب / تسجيل خروج
              </button>
            )}
          </div>

          <form onSubmit={handleSaveProfile} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginTop: 14, alignItems: 'flex-end' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">الاسم بالكامل</label>
              <input
                type="text"
                className="form-input"
                value={userName}
                onChange={e => setUserName(e.target.value)}
                placeholder="اسم المستخدم..."
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">البريد الإلكتروني</label>
              <input
                type="email"
                className="form-input"
                value={userEmail}
                onChange={e => setUserEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>

            <button type="submit" className="btn-primary" style={{ height: 42 }}>
              حفظ التعديلات
            </button>
          </form>

          {profileSavedMsg && (
            <div style={{ marginTop: 10, color: 'var(--emerald)', fontWeight: 600, fontSize: 12.5 }}>
              ✅ {profileSavedMsg}
            </div>
          )}
        </div>

        {/* قسم الأمان وحماية الحساب */}
        <div className="card-box full-col security-card">
          <div className="section-header-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="security-icon-badge">
                <Icon name="shield" size={22} color="var(--emerald)" />
              </div>
              <div>
                <h3 className="section-title">مركز الأمان وحماية الحساب</h3>
                <p className="section-sub">حماية محفظتك برمز سري PIN للدخول السريع وقفل الشاشة</p>
              </div>
            </div>
            {hasPin && (
              <button className="btn-secondary btn-sm" onClick={onLockNow}>
                <Icon name="lock" size={14} /> قفل الشاشة فوراً
              </button>
            )}
          </div>

          <div style={{ margin: '14px 0', padding: 12, borderRadius: 8, background: 'var(--paper-alt)', border: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: 13 }}>حالة الحماية: </span>
                {hasPin ? (
                  <span className="status-stamp badge-green">🔒 القفل بالرمز السري مُفعّل</span>
                ) : (
                  <span className="status-stamp badge-yellow">⚠️ غير مقفل برمز سري</span>
                )}
              </div>
              {(state.userProfile?.role === 'owner' || state.userProfile?.role === 'admin') && (
                <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                  الصلاحية: <strong style={{ color: 'var(--emerald)' }}>{state.userProfile?.role === 'owner' ? '👑 مالك المنصة' : '🛡️ مدير النظام'}</strong>
                </div>
              )}
            </div>
            {securityStatusMsg && (
              <div style={{ marginTop: 8, color: 'var(--emerald)', fontWeight: 600, fontSize: 13 }}>
                {securityStatusMsg}
              </div>
            )}
          </div>

          {/* نموذج تعيين أو تغيير الرمز السري */}
          <form onSubmit={handleSavePin} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, alignItems: 'flex-end' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: 12 }}>
                {hasPin ? 'تعيين رمز سري جديد' : 'رمز سري جديد (4 أرقام فأكثر) *'}
              </label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                required
                className="form-input"
                placeholder="••••"
                value={newPinInput}
                onChange={e => setNewPinInput(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: 12 }}>تأكيد الرمز السري *</label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                required
                className="form-input"
                placeholder="••••"
                value={confirmPinInput}
                onChange={e => setConfirmPinInput(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                <Icon name="lock" size={16} /> {hasPin ? 'تحديث الرمز' : 'تفعيل القفل المشفر'}
              </button>
              {hasPin && (
                <button type="button" className="btn-danger btn-sm" onClick={handleDisablePin}>
                  إلغاء القفل
                </button>
              )}
            </div>
          </form>
        </div>

        {/* المظهر والوضع الليلي Dark Mode */}
        <div className="card-box">
          <h3 className="section-title">المظهر والوضع البصري</h3>
          <p className="section-sub">التبديل بين النمط الليلي المستقبلي والنمط الفاتح الورقي</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
            <div>
              <span style={{ fontWeight: 600 }}>الوضع الحالي: </span>
              <span style={{ color: 'var(--emerald)', fontWeight: 700 }}>
                {theme === 'dark' ? 'الوضع الليلي (Dark Mode 🌙)' : 'الوضع الفاتح (Light Mode ☀️)'}
              </span>
            </div>
            <button className="btn-secondary" onClick={onToggleTheme}>
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
              {theme === 'dark' ? 'تحويل للنهاري' : 'تحويل لليلي'}
            </button>
          </div>
        </div>

        {/* العملة */}
        <div className="card-box">
          <h3 className="section-title">العملة الافتراضية</h3>
          <p className="section-sub">الرمز أو النص الذي يظهر بجوار كافة المبالغ في التطبيق</p>
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <input
              type="text"
              className="form-input"
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              placeholder="مثال: ج.م / $ / SAR"
              style={{ maxWidth: 200 }}
            />
            <button className="btn-primary" onClick={handleSaveSettings}>
              حفظ العملة
            </button>
          </div>
        </div>

        {/* تصنيفات الدخل */}
        <div className="card-box">
          <h3 className="section-title">تصنيفات الدخل</h3>
          <p className="section-sub">تظهر كخيارات عند إضافة أي دخل جديد</p>
          <div className="chips-container" style={{ margin: '14px 0' }}>
            {(state.settings?.incomeCats || []).map(cat => (
              <span key={cat} className="chip-tag">
                {cat}
                <button
                  type="button"
                  className="chip-remove"
                  onClick={() => handleDeleteIncomeCat(cat)}
                  title="حذف"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <form onSubmit={handleAddIncomeCat} style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              className="form-input"
              placeholder="تصنيف دخل جديد..."
              value={newIncomeCat}
              onChange={e => setNewIncomeCat(e.target.value)}
            />
            <button type="submit" className="btn-secondary">
              إضافة
            </button>
          </form>
        </div>

        {/* تصنيفات المصروفات */}
        <div className="card-box">
          <h3 className="section-title">تصنيفات المصروفات</h3>
          <p className="section-sub">تظهر في قائمة المصروفات ورسوم التوزيع</p>
          <div className="chips-container" style={{ margin: '14px 0' }}>
            {(state.settings?.expenseCats || []).map(cat => (
              <span key={cat} className="chip-tag">
                {cat}
                <button
                  type="button"
                  className="chip-remove"
                  onClick={() => handleDeleteExpenseCat(cat)}
                  title="حذف"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <form onSubmit={handleAddExpenseCat} style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              className="form-input"
              placeholder="تصنيف مصروف جديد..."
              value={newExpenseCat}
              onChange={e => setNewExpenseCat(e.target.value)}
            />
            <button type="submit" className="btn-secondary">
              إضافة
            </button>
          </form>
        </div>

        {/* سقوف الميزانية الشهرية */}
        <div className="card-box full-col">
          <div className="section-header-row">
            <div>
              <h3 className="section-title">سقوف الميزانية الشهرية للتصنيفات</h3>
              <p className="section-sub">ضع 0 أو اترك الحقل فارغاً لتعطيل السقف</p>
            </div>
            <button className="btn-primary" onClick={handleSaveSettings}>
              حفظ السقوف
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 12,
              marginTop: 14
            }}
          >
            {(state.settings?.expenseCats || []).map(cat => (
              <div key={cat} className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: 13 }}>{cat}</label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  placeholder="0 (بلا سقف)"
                  value={categoryBudgets[cat] ?? ''}
                  onChange={e => handleBudgetChange(cat, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* القوائم الثابتة للقراءة فقط */}
        <div className="card-box full-col">
          <h3 className="section-title">القوائم الثابتة المدمجة (للقراءة فقط)</h3>
          <p className="section-sub">خيارات معيارية محددة وفق متطلبات النظام</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginTop: 14 }}>
            <div>
              <h4 style={{ fontSize: 13, margin: '0 0 6px', color: 'var(--ink)' }}>أنواع الحسابات:</h4>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
                {DROPDOWNS.accountTypes.join(' · ')}
              </div>
            </div>
            <div>
              <h4 style={{ fontSize: 13, margin: '0 0 6px', color: 'var(--ink)' }}>طرق الدفع:</h4>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
                {DROPDOWNS.paymentMethods.join(' · ')}
              </div>
            </div>
            <div>
              <h4 style={{ fontSize: 13, margin: '0 0 6px', color: 'var(--ink)' }}>مستويات الأولوية:</h4>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
                {DROPDOWNS.priorities.join(' · ')}
              </div>
            </div>
            <div>
              <h4 style={{ fontSize: 13, margin: '0 0 6px', color: 'var(--ink)' }}>وحدات التكرار:</h4>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
                {DROPDOWNS.intervalUnits.join(' · ')}
              </div>
            </div>
          </div>
        </div>

        {/* الربط والمزامنة السحابية المركزية */}
        <div className="card-box full-col">
          <div className="section-header-row">
            <div>
              <h3 className="section-title">المزامنة السحابية</h3>
              <p className="section-sub">تحديث وحفظ بياناتك وسجلاتك المالية تلقائياً عبر جميع أجهزتك</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {onRefreshDbStatus && (
                <button
                  className="btn-secondary btn-sm"
                  onClick={async () => {
                    const res = await onRefreshDbStatus();
                    alert(res?.connected ? 'الاتصال السحابي نشط ويعمل بنجاح!' : 'غير متصل بالسيرفر حالياً');
                  }}
                  title="إعادة فحص الاتصال"
                >
                  <Icon name="refresh" size={14} /> فحص الاتصال
                </button>
              )}
              {onManualSync && (
                <button
                  className="btn-primary btn-sm"
                  onClick={onManualSync}
                  disabled={syncInProgress || !backendStatus?.connected}
                  title={backendStatus?.connected ? 'حفظ ومزامنة فورية للبيانات' : 'الاتصال غير متاح حالياً'}
                >
                  <Icon name="cloud" size={14} /> {syncInProgress ? 'جارِ المزامنة...' : 'مزامنة فورية الآن'}
                </button>
              )}
            </div>
          </div>

          <div style={{
            margin: '14px 0',
            padding: '12px 16px',
            borderRadius: 10,
            background: backendStatus?.connected ? 'rgba(16, 185, 129, 0.06)' : 'rgba(245, 158, 11, 0.06)',
            border: backendStatus?.connected ? '1px solid rgba(16, 185, 129, 0.22)' : '1px solid rgba(245, 158, 11, 0.22)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  background: backendStatus?.connected ? '#10b981' : '#f59e0b',
                  boxShadow: backendStatus?.connected ? '0 0 8px #10b981' : 'none'
                }}></span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: backendStatus?.connected ? 'var(--emerald)' : 'var(--amber)' }}>
                    {backendStatus?.connected ? 'متصل الآن' : 'غير متصل (تخزين محلي مؤقت)'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {backendStatus?.connected ? 'بياناتك مشفرة ومحفوظة سحابياً وتتم مزامنتها تلقائياً' : 'البيانات تُحفظ مؤقتاً في المتصفح حتى إعادة الاتصال'}
                  </div>
                </div>
              </div>

              {backendStatus?.connected && lastSyncedAt && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>آخر مزامنة:</span>
                  <strong style={{ color: 'var(--emerald)', fontFamily: 'var(--font-numeric)' }}>{lastSyncedAt}</strong>
                </div>
              )}
            </div>

            {!backendStatus?.connected && (
              <div style={{
                marginTop: 10,
                padding: '8px 12px',
                borderRadius: 6,
                background: 'var(--bg-elevated)',
                border: '1px dashed var(--border-subtle)',
                fontSize: 11.5,
                color: 'var(--text-muted)'
              }}>
                💡 السيرفر غير متصل حالياً، يتم الحفظ محلياً على هذا الجهاز بأمان.
              </div>
            )}
          </div>
        </div>

        {/* النسخ الاحتياطي واستعادة البيانات */}
        <div className="card-box full-col">
          <h3 className="section-title">إدارة البيانات والبدء من الصفر والنسخ الاحتياطي</h3>
          <p className="section-sub">تفريغ الحركات للبدء من الصفر النظيف، تصفير الأرصدة، أو تصدير واستيراد النسخ الاحتياطية بأمان</p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 14 }}>
            {onClearTransactions && (
              <button
                className="btn-primary"
                onClick={() => {
                  if (window.confirm('هل ترغب في تفريغ كافة الحركات والبدء من الصفر؟ ستظل حساباتك وأرصدتها كما هي وسيتم مسح المعاملات المسجلة فقط.')) {
                    onClearTransactions();
                  }
                }}
                style={{ background: 'var(--cyan)', color: '#05070D', fontWeight: 800 }}
              >
                🧹 بدء من الصفر (تفريغ كافة الحركات)
              </button>
            )}

            {onResetToZero && (
              <button
                className="btn-secondary"
                onClick={() => {
                  if (window.confirm('⚠️ تحذير: هل أنت متأكد من تصفير شامل لكافة الحسابات والمعاملات؟ ستصبح أرصدتك 0.00 ج.م وتبدأ من الصفر التام.')) {
                    onResetToZero();
                  }
                }}
                style={{ borderColor: 'var(--coral)', color: 'var(--coral)' }}
              >
                🔄 تصفير شامل (0.00 ج.م)
              </button>
            )}

            <button className="btn-secondary" onClick={handleExportData}>
              <Icon name="download" size={16} /> تصدير نسخة احتياطية (JSON)
            </button>

            <label className="btn-secondary" style={{ cursor: 'pointer', margin: 0 }}>
              <Icon name="upload" size={16} /> استيراد نسخة احتياطية
              <input
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleImportData}
              />
            </label>

            <button
              className="btn-danger"
              onClick={() => {
                if (window.confirm('هل أنت متأكد من إعادة تعيين البيانات إلى البيانات التجريبية الأولية؟ سيتم مسح أي تعديلات غير محفوظة في نسخة احتياطية.')) {
                  onResetData();
                }
              }}
              style={{ opacity: 0.8 }}
            >
              <Icon name="refresh" size={16} /> استعادة البيانات التجريبية
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// 13. لوحة تحكم مالك التطبيق وإدارة العملاء (Owner / Admin Dashboard Page)
// =========================================================================
export function AdminDashboardPage({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total_users: 0, active_users: 0, total_transactions: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClient, setNewClient] = useState({
    fullName: '',
    email: '',
    password: '',
    pin: '1234',
    role: 'user',
    currency: 'ج.م'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');

  // جلب قائمة العملاء من السيرفر
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminGetUsers();
      if (res && res.success) {
        setUsers(res.users || []);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.error('فشل جلب العملاء:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchUsers();
    // تحديث تلقائي دوري كل 8 ثوانٍ دون الحاجة لتحديث الصفحة يدوياً
    const timer = setInterval(() => {
      adminGetUsers().then(res => {
        if (res && res.success) {
          setUsers(res.users || []);
          if (res.stats) setStats(res.stats);
        }
      }).catch(() => {});
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  // تغيير حالة العميل (تفعيل / تجميد)
  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    const actionWord = nextStatus === 'suspended' ? 'تجميد وتعليق' : 'تفعيل';
    if (!window.confirm(`هل أنت متأكد من ${actionWord} حساب العميل "${user.full_name}"؟`)) return;

    const res = await adminToggleStatus(user.id, nextStatus);
    if (res && res.success) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: nextStatus } : u));
      setAlertMsg(`تم ${actionWord} الحساب بنجاح.`);
      setTimeout(() => setAlertMsg(''), 4000);
    } else {
      alert('حدث خطأ أثناء تغيير الحالة: ' + (res?.error || 'تعذر الاتصال بالسيرفر'));
    }
  };

  // تغيير رتبة المستخدم (مشرف / عميل)
  const handleToggleRole = async (user) => {
    if (user.role === 'owner') {
      alert('لا يمكن تغيير رتبة مالك المنصة الأساسي.');
      return;
    }
    const nextRole = user.role === 'admin' ? 'user' : 'admin';
    const roleWord = nextRole === 'admin' ? 'ترقية لمشرف' : 'تخفيض لعميل عادي';
    if (!window.confirm(`هل أنت متأكد من ${roleWord} للمستخدم "${user.full_name}"؟`)) return;

    const res = await adminUpdateRole(user.id, nextRole);
    if (res && res.success) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: nextRole } : u));
      setAlertMsg(`تم تحديث رتبة المستخدم بنجاح.`);
      setTimeout(() => setAlertMsg(''), 4000);
    }
  };

  // حذف عميل وبياناته نهائياً
  const handleDeleteUser = async (user) => {
    if (user.role === 'owner') {
      alert('لا يمكن حذف حساب مالك التطبيق.');
      return;
    }
    if (!window.confirm(`⚠️ تحذير: هل أنت متأكد من حذف العميل "${user.full_name}" وكافة بياناته وحساباته من قاعدة البيانات نهائياً؟`)) return;

    const res = await adminDeleteUser(user.id);
    if (res && res.success) {
      setUsers(prev => prev.filter(u => u.id !== user.id));
      setAlertMsg('تم حذف العميل وكافة سجلاته بنجاح.');
      setTimeout(() => setAlertMsg(''), 4000);
    } else {
      alert('فشل الحذف: ' + (res?.error || ''));
    }
  };

  // إنشاء عميل جديد من النافذة
  const handleCreateClientSubmit = async (e) => {
    e.preventDefault();
    if (!newClient.fullName.trim() || !newClient.email.trim() || !newClient.password) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    setIsSubmitting(true);
    try {
      const pHash = await hashPin(newClient.pin || '1234');
      const wHash = await hashPassword(newClient.password);
      const res = await adminCreateClient({
        fullName: newClient.fullName.trim(),
        email: newClient.email.trim(),
        passwordHash: wHash,
        pinHash: pHash,
        role: newClient.role,
        currency: newClient.currency
      });
      if (res && res.success) {
        setShowAddModal(false);
        setNewClient({ fullName: '', email: '', password: '', pin: '1234', role: 'user', currency: 'ج.م' });
        setAlertMsg('تم إنشاء حساب العميل بنجاح في قاعدة البيانات.');
        fetchUsers();
        setTimeout(() => setAlertMsg(''), 4000);
      } else {
        alert('تعذر إنشاء العميل: ' + (res?.error || 'خطأ غير معروف'));
      }
    } catch (err) {
      alert('حدث خطأ: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // تصفية العملاء
  const filteredUsers = users.filter(u => {
    const matchesSearch = !searchQuery.trim() ||
      (u.full_name && u.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === 'all' ||
      (roleFilter === 'owner' && (u.role === 'owner' || u.role === 'admin')) ||
      (roleFilter === 'user' && u.role === 'user');
    return matchesSearch && matchesRole;
  });

  return (
    <div className="page-wrapper">
      {/* رأس الصفحة وأزرار التحكم */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 24 }}>👑</span>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: 'var(--text-primary)' }}>
              لوحة تحكم مالك التطبيق (إدارة المنصة والعملاء)
            </h2>
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            صلاحية وصول المالك: إدارة كافة العملاء، الصلاحيات، وحالة الحسابات المسجلة بالسيرفر
          </span>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary btn-sm" onClick={fetchUsers} title="تحديث القائمة من السيرفر">
            <Icon name="refresh" size={14} /> تحديث
          </button>
          <button className="btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
            <Icon name="plus" size={14} /> إضافة عميل جديد
          </button>
        </div>
      </div>

      {alertMsg && (
        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--emerald)', fontWeight: 600, fontSize: 13, marginBottom: 16 }}>
          ✅ {alertMsg}
        </div>
      )}

      {/* 4 كروت إحصائية فاخرة للمالك */}
      <div className="metrics-grid" style={{ marginBottom: 24 }}>
        <div className="metric-card card-navy">
          <div className="metric-card-top-row">
            <div className="metric-icon-wrap"><Icon name="users" size={18} /></div>
            <span className="metric-pill pill-cyan">إجمالي المسجلين</span>
          </div>
          <div className="metric-label">إجمالي العملاء</div>
          <div className="metric-value">{stats.total_users || users.length} عميل</div>
          <div className="metric-footnote">المستخدمين المسجلين بقاعدة البيانات</div>
        </div>

        <div className="metric-card card-emerald">
          <div className="metric-card-top-row">
            <div className="metric-icon-wrap"><Icon name="shield" size={18} /></div>
            <span className="metric-pill pill-emerald">جاهز للاستخدام</span>
          </div>
          <div className="metric-label">الحسابات النشطة</div>
          <div className="metric-value">{stats.active_users || users.filter(u => u.status === 'active').length} نشط</div>
          <div className="metric-footnote">حسابات مفعلة دون أي تعليق</div>
        </div>

        <div className="metric-card card-ochre">
          <div className="metric-card-top-row">
            <div className="metric-icon-wrap"><Icon name="expenses" size={18} /></div>
            <span className="metric-pill pill-amber">حركة المنصة</span>
          </div>
          <div className="metric-label">إجمالي العمليات</div>
          <div className="metric-value">{stats.total_transactions || 0} عملية</div>
          <div className="metric-footnote">معاملات، محافظ، ودخل للعملاء</div>
        </div>

        <div className="metric-card card-navy">
          <div className="metric-card-top-row">
            <div className="metric-icon-wrap"><Icon name="dashboard" size={18} /></div>
            <span className="metric-pill pill-cyan">LiteSpeed MySQL</span>
          </div>
          <div className="metric-label">خادم الاستضافة</div>
          <div className="metric-value" style={{ fontSize: 18 }}>HostArmada</div>
          <div className="metric-footnote">Speed Reaper cPanel متصل</div>
        </div>
      </div>

      {/* شريط البحث والتصفية */}
      <div className="card-box full-col" style={{ marginBottom: 20, padding: '14px 18px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 10, flex: 1, minWidth: 260 }}>
            <input
              type="text"
              className="form-input"
              placeholder="ابحث باسم العميل أو البريد الإلكتروني..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ margin: 0 }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>تصفية الصلاحية:</span>
            <select
              className="form-input"
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              style={{ margin: 0, width: 'auto', padding: '6px 12px' }}
            >
              <option value="all">جميع الحسابات ({users.length})</option>
              <option value="owner">المالك والمشرفين</option>
              <option value="user">العملاء العاديين</option>
            </select>
          </div>
        </div>
      </div>

      {/* جدول إدارة العملاء والمستخدمين */}
      <div className="card-box full-col table-container">
        <div className="section-header-row" style={{ marginBottom: 14 }}>
          <div>
            <h3 className="section-title">سجل حسابات العملاء والصلاحيات</h3>
            <p className="section-sub">قائمة تفصيلية بكافة الحسابات مع إمكانية التجميد أو الترقية أو الحذف</p>
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            العدد المعروض: {filteredUsers.length} من أصل {users.length}
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            جاري تحميل سجل العملاء من قاعدة البيانات...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            لا توجد حسابات تطابق معايير البحث.
          </div>
        ) : (
          <div className="table-responsive-wrapper">
            <table className="responsive-table fintech-table">
              <thead>
                <tr>
                  <th>العميل</th>
                  <th>الرتبة والصلاحية</th>
                  <th>حالة الحساب</th>
                  <th>المعاملات</th>
                  <th>تاريخ الانضمام</th>
                  <th>آخر دخول</th>
                  <th style={{ textAlign: 'center' }}>إجراءات الإدارة</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => {
                  const isOwner = user.role === 'owner';
                  const isAdmin = user.role === 'admin';
                  const isSuspended = user.status === 'suspended';

                  return (
                    <tr key={user.id} style={{ opacity: isSuspended ? 0.65 : 1 }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <UserAvatar userProfile={{ fullName: user.full_name, avatarImage: user.avatar_image }} size={34} fontSize={13} />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)' }}>
                              {user.full_name}
                            </div>
                            <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        {isOwner ? (
                          <span className="status-stamp badge-green" style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
                            👑 مالك المنصة
                          </span>
                        ) : isAdmin ? (
                          <span className="status-stamp badge-blue" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                            🛡️ مشرف
                          </span>
                        ) : (
                          <span className="status-stamp badge-navy">
                            👤 عميل
                          </span>
                        )}
                      </td>

                      <td>
                        {isSuspended ? (
                          <span className="status-stamp badge-red">
                            🔴 معلق ومجمد
                          </span>
                        ) : (
                          <span className="status-stamp badge-green">
                            🟢 نشط
                          </span>
                        )}
                      </td>

                      <td>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>
                          {user.accounts_count || 0} محافظ · {user.total_records || 0} عملية
                        </div>
                      </td>

                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {user.created_at ? user.created_at.split(' ')[0] : 'سابقاً'}
                      </td>

                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {user.last_login ? user.last_login.split(' ')[0] : 'لم يدخل بعد'}
                      </td>

                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          {!isOwner && (
                            <>
                              <button
                                className={`btn-sm ${isSuspended ? 'btn-secondary' : 'btn-danger'}`}
                                onClick={() => handleToggleStatus(user)}
                                title={isSuspended ? 'إلغاء التجميد وتفعيل الحساب' : 'تجميد وتعليق الحساب'}
                                style={{ padding: '3px 8px', fontSize: 11 }}
                              >
                                {isSuspended ? 'تفعيل' : 'تجميد'}
                              </button>

                              <button
                                className="btn-secondary btn-sm"
                                onClick={() => handleToggleRole(user)}
                                title={isAdmin ? 'تخفيض لعميل عادي' : 'ترقية لمشرف'}
                                style={{ padding: '3px 8px', fontSize: 11 }}
                              >
                                {isAdmin ? 'عميل' : 'ترقية'}
                              </button>

                              <button
                                className="btn-icon-subtle"
                                onClick={() => handleDeleteUser(user)}
                                title="حذف العميل نهائياً"
                                style={{ color: 'var(--rust)', padding: 4 }}
                              >
                                <Icon name="trash" size={14} />
                              </button>
                            </>
                          )}
                          {isOwner && (
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              الحساب الرئيسي
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* نافذة إنشاء عميل جديد من قِبل المالك */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3 className="modal-title">➕ إضافة حساب عميل جديد</h3>
              <button className="btn-icon" onClick={() => setShowAddModal(false)}>
                <Icon name="close" size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateClientSubmit} style={{ marginTop: 14 }}>
              <div className="form-group">
                <label className="form-label">الاسم بالكامل *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="اسم العميل الجديد"
                  value={newClient.fullName}
                  onChange={e => setNewClient({ ...newClient, fullName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">البريد الإلكتروني (لتسجيل الدخول) *</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  placeholder="client@example.com"
                  value={newClient.email}
                  onChange={e => setNewClient({ ...newClient, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">كلمة المرور الابتدائية *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="form-input"
                  placeholder="6 أحرف على الأقل..."
                  value={newClient.password}
                  onChange={e => setNewClient({ ...newClient, password: e.target.value })}
                />
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">الرمز السري السريع (PIN)</label>
                  <input
                    type="password"
                    maxLength={4}
                    className="form-input"
                    placeholder="1234"
                    value={newClient.pin}
                    onChange={e => setNewClient({ ...newClient, pin: e.target.value.replace(/\D/g, '') })}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">الصلاحية / الرتبة</label>
                  <select
                    className="form-input"
                    value={newClient.role}
                    onChange={e => setNewClient({ ...newClient, role: e.target.value })}
                  >
                    <option value="user">عميل عادي (مستخدم محفظة)</option>
                    <option value="admin">مشرف إداري (صلاحيات متابعة)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)} style={{ flex: 1 }}>
                  إلغاء
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ flex: 1.5 }}>
                  {isSubmitting ? 'جاري الإنشاء...' : 'حفظ وإنشاء الحساب'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
