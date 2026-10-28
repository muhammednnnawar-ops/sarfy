// Sarfy - Smart 50/30/20 Budget Allocator
// ويدجت التوزيع المالي الذكي المستند إلى قاعدة 50/30/20 العالمية

import React, { useState } from 'react';
import { Icon } from './icons.jsx';
import { formatCurrency } from './data.js';

const TIP_EXPANDED_KEY = 'sarfy_5020_tip_expanded';

// variant='tip': نصيحة اختيارية مطوية في لوحة التحكم، والتفاصيل تظهر عند الطلب
// variant='full': العرض الكامل (صفحة التقارير)
export function BudgetRule5020Widget({
  state,
  metrics,
  currency = 'ج.م',
  variant = 'full'
}) {
  const [tipExpanded, setTipExpanded] = useState(() => {
    try {
      return localStorage.getItem(TIP_EXPANDED_KEY) === '1';
    } catch {
      return false;
    }
  });
  const toggleTip = () => {
    setTipExpanded(prev => {
      try {
        localStorage.setItem(TIP_EXPANDED_KEY, prev ? '0' : '1');
      } catch {}
      return !prev;
    });
  };
  // الدخل المستلم هذا الشهر (يتحول للتراكمي الكلي إن لم يُسجل دخل هذا الشهر بعد)
  const currentYearMonth = new Date().toISOString().slice(0, 7);
  const monthIncome = (state.income || [])
    .filter(i => i.status === 'مستلم' && i.date && i.date.startsWith(currentYearMonth))
    .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const incomeTotal = monthIncome > 0 ? monthIncome : (metrics?.receivedIncome || (state.income || []).reduce((sum, i) => sum + (Number(i.amount) || 0), 0));
  const safeIncome = incomeTotal; // لا نستخدم قيمة وهمية: دون دخل مسجل تظهر النسب صفراً بدقة

  // أهداف القاعدة الثلاثة
  const needsTarget = safeIncome * 0.50; // 50% احتياجات أساسية
  const wantsTarget = safeIncome * 0.30; // 30% رغبات ومرونة
  const savingsTarget = safeIncome * 0.20; // 20% ادخار واستثمار

  // تصنيف المصروفات الفعلية — المدفوعة فقط هذا الشهر (لا عدّ للفواتير غير المدفوعة)
  const needsCategories = ['طعام ومشروبات', 'فواتير ومرافق', 'سكن وإيجار', 'مواصلات وبنزين', 'صحة وعلاج', 'أقساط', 'تعليم', 'ضروري'];
  const wantsCategories = ['تسوق وملابس', 'ترفيه وخروجات', 'كافيهات ومطاعم', 'سفر وسياحة', 'هدايا وتبرعات', 'تحسينات', 'غير ضروري', 'أخرى'];

  let actualNeeds = 0;
  let actualWants = 0;

  (state.expenses || []).forEach(e => {
    if (e.status !== 'مدفوع') return; // غير المدفوع لا يدخل في التوزيع الفعلي
    if (!e.date || !e.date.startsWith(currentYearMonth)) return; // نطاق الشهر الحالي لمطابقة أساس الدخل الشهري
    const amt = Number(e.amount) || 0;
    const cat = e.mainCat || e.category || '';
    const nec = e.necessity || '';

    if (nec === 'ضروري' || needsCategories.some(c => cat.includes(c))) {
      actualNeeds += amt;
    } else {
      actualWants += amt;
    }
  });

  // المدخرات الفعلية = صافي التدفق الإيجابي هذا الشهر + مدخرات الأهداف
  const netSaved = Math.max(0, incomeTotal - (actualNeeds + actualWants));
  const actualSavings = netSaved + (metrics?.savings || 0);

  // حساب النسب المئوية الفعلية (حماية من القسمة على صفر)
  const denom = safeIncome > 0 ? safeIncome : 1;
  const needsPct = Math.round((actualNeeds / denom) * 100);
  const wantsPct = Math.round((actualWants / denom) * 100);
  const savingsPct = Math.round((actualSavings / denom) * 100);

  const recommendation = wantsPct > 35
    ? 'مصاريف الرغبات والترفيه تجاوزت النسبة المقترحة (30%). ضبط نفقات الكافيهات والتسوق يرفع وتيرة الادخار.'
    : needsPct > 55
    ? 'مصاريف الالتزامات الأساسية مرتفعة نسبياً مقارنة بالدخل. مراجعة الاشتراكات والفواتير تخفف العبء الشهري.'
    : 'توزيعك المالي هذا الشهر متوازن ومطابق للقاعدة المقترحة.';

  if (variant === 'tip' && !tipExpanded) {
    const chip = (label, pct, color) => (
      <span style={{
        fontSize: 11,
        fontWeight: 800,
        padding: '2px 8px',
        borderRadius: 12,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        color
      }}>
        {label} {pct}%
      </span>
    );
    return (
      <div className="card-box" style={{ marginBottom: 24, padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Icon name="lightbulb" size={18} color="var(--amber)" />
          <div style={{ flex: '1 1 240px', minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
              نصيحة: قاعدة 50/30/20 لتوزيع الدخل <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>(اختيارية)</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>
              {safeIncome > 0 ? recommendation : 'سجّل دخلك هذا الشهر لتعرف كيف يتوزع على الاحتياجات والرغبات والادخار.'}
            </div>
          </div>
          {safeIncome > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {chip('احتياجات', needsPct, needsPct > 55 ? 'var(--coral)' : 'var(--cyan)')}
              {chip('رغبات', wantsPct, wantsPct > 35 ? 'var(--coral)' : '#FBBF24')}
              {chip('ادخار', savingsPct, 'var(--emerald)')}
            </div>
          )}
          <button type="button" className="btn-link" onClick={toggleTip} style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
            عرض التفاصيل
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card-box" style={{ marginBottom: 24, padding: '20px 22px' }}>
      <div className="section-header-row" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(14, 165, 233, 0.25) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            color: 'var(--cyan)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Icon name="pie-chart" size={18} />
          </div>
          <div>
            <h3 className="section-title" style={{ margin: 0, fontSize: 16 }}>
              توزيع الميزانية الذكي (قاعدة 50/30/20)
            </h3>
            <p className="section-sub" style={{ margin: '2px 0 0', fontSize: 11.5 }}>
              المعيار المالي العالمي لتوزيع الدخل الشهري بين الاحتياجات، الرغبات، وبناء الثروة
            </p>
          </div>
        </div>

        <span style={{
          fontSize: 11.5,
          fontWeight: 800,
          padding: '4px 10px',
          borderRadius: 20,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-secondary)'
        }}>
          أساس الدخل: <strong style={{ color: 'var(--emerald)' }}>{formatCurrency(safeIncome, currency)}</strong>
        </span>
        {variant === 'tip' && (
          <button type="button" className="btn-link" onClick={toggleTip} style={{ fontSize: 12 }}>
            إخفاء التفاصيل
          </button>
        )}
      </div>

      {/* الأعمدة الثلاثة التفاعلية */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        {/* 1. الاحتياجات الأساسية (50%) */}
        <div style={{
          padding: 14,
          borderRadius: 12,
          background: 'var(--bg-elevated)',
          border: `1.5px solid ${needsPct > 55 ? 'var(--coral)' : 'rgba(56, 189, 248, 0.3)'}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>الاحتياجات الأساسية (50%)</span>
            <span style={{
              fontSize: 11,
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 12,
              background: needsPct > 55 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(56, 189, 248, 0.15)',
              color: needsPct > 55 ? 'var(--coral)' : 'var(--cyan)'
            }}>
              {needsPct}% / 50%
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 8 }}>
            <span style={{ color: 'var(--text-muted)' }}>الفعلي: <strong>{formatCurrency(actualNeeds, currency)}</strong></span>
            <span style={{ color: 'var(--text-muted)' }}>الهدف: <strong>{formatCurrency(needsTarget, currency)}</strong></span>
          </div>

          <div className="progress-bar-bg" style={{ height: 7, borderRadius: 4 }}>
            <div
              className="progress-bar-fill"
              style={{
                width: `${Math.min(100, (actualNeeds / needsTarget) * 100)}%`,
                background: needsPct > 55 ? 'var(--coral)' : 'var(--cyan)'
              }}
            ></div>
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 8 }}>
            سكن، فواتير، بقالة، مواصلات، علاج، وأقساط
          </div>
        </div>

        {/* 2. الرغبات والمرونة (30%) */}
        <div style={{
          padding: 14,
          borderRadius: 12,
          background: 'var(--bg-elevated)',
          border: `1.5px solid ${wantsPct > 35 ? 'var(--coral)' : 'rgba(234, 179, 8, 0.3)'}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>الرغبات والمرونة (30%)</span>
            <span style={{
              fontSize: 11,
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 12,
              background: wantsPct > 35 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(234, 179, 8, 0.15)',
              color: wantsPct > 35 ? 'var(--coral)' : '#FBBF24'
            }}>
              {wantsPct}% / 30%
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 8 }}>
            <span style={{ color: 'var(--text-muted)' }}>الفعلي: <strong>{formatCurrency(actualWants, currency)}</strong></span>
            <span style={{ color: 'var(--text-muted)' }}>الهدف: <strong>{formatCurrency(wantsTarget, currency)}</strong></span>
          </div>

          <div className="progress-bar-bg" style={{ height: 7, borderRadius: 4 }}>
            <div
              className="progress-bar-fill"
              style={{
                width: `${Math.min(100, (actualWants / wantsTarget) * 100)}%`,
                background: wantsPct > 35 ? 'var(--coral)' : '#FBBF24'
              }}
            ></div>
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 8 }}>
            مطاعم، كافيهات، تسوق، ترفيه، وهدايا
          </div>
        </div>

        {/* 3. الادخار والمستقبل (20%) */}
        <div style={{
          padding: 14,
          borderRadius: 12,
          background: 'var(--bg-elevated)',
          border: '1.5px solid rgba(16, 185, 129, 0.35)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>الادخار والمستقبل (20%)</span>
            <span style={{
              fontSize: 11,
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 12,
              background: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--emerald)'
            }}>
              {savingsPct}% / 20%
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 8 }}>
            <span style={{ color: 'var(--text-muted)' }}>المحقق: <strong>{formatCurrency(actualSavings, currency)}</strong></span>
            <span style={{ color: 'var(--text-muted)' }}>الهدف: <strong>{formatCurrency(savingsTarget, currency)}</strong></span>
          </div>

          <div className="progress-bar-bg" style={{ height: 7, borderRadius: 4 }}>
            <div
              className="progress-bar-fill"
              style={{
                width: `${Math.min(100, (actualSavings / savingsTarget) * 100)}%`,
                background: 'var(--emerald)'
              }}
            ></div>
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 8 }}>
            صناديق طوارئ، ذهب، شهادات، وبناء أصول
          </div>
        </div>
      </div>

      {/* التوصية المالية التلقائية */}
      <div style={{
        marginTop: 12,
        padding: '10px 14px',
        borderRadius: 8,
        background: 'rgba(56, 189, 248, 0.06)',
        border: '1px solid rgba(56, 189, 248, 0.2)',
        fontSize: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        color: 'var(--text-secondary)'
      }}>
        <Icon name="lightbulb" size={16} color="var(--amber)" />
        <span>{recommendation}</span>
      </div>
    </div>
  );
}
