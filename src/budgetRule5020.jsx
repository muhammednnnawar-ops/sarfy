// Sarfy - Smart 50/30/20 Budget Allocator
// ويدجت التوزيع المالي الذكي المستند إلى قاعدة 50/30/20 العالمية

import React from 'react';
import { Icon } from './icons.jsx';
import { formatCurrency } from './data.js';

export function BudgetRule5020Widget({
  state,
  metrics,
  currency = 'ج.م'
}) {
  // إجمالي الدخل المستلم الفعلي هذا الشهر
  const incomeTotal = metrics?.receivedIncome || (state.income || []).reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const safeIncome = incomeTotal > 0 ? incomeTotal : 20000; // قيمة تقديرية في حال لم يُسجل دخل بعد

  // أهداف القاعدة الثلاثة
  const needsTarget = safeIncome * 0.50; // 50% احتياجات أساسية
  const wantsTarget = safeIncome * 0.30; // 30% رغبات ومرونة
  const savingsTarget = safeIncome * 0.20; // 20% ادخار واستثمار

  // تصنيف المصروفات الفعلية
  const needsCategories = ['طعام ومشروبات', 'فواتير ومرافق', 'سكن وإيجار', 'مواصلات وبنزين', 'صحة وعلاج', 'أقساط', 'تعليم', 'ضروري'];
  const wantsCategories = ['تسوق وملابس', 'ترفيه وخروجات', 'كافيهات ومطاعم', 'سفر وسياحة', 'هدايا وتبرعات', 'تحسينات', 'غير ضروري', 'أخرى'];

  let actualNeeds = 0;
  let actualWants = 0;

  (state.expenses || []).forEach(e => {
    const amt = Number(e.amount) || 0;
    const cat = e.mainCat || e.category || '';
    const nec = e.necessity || '';

    if (nec === 'ضروري' || needsCategories.some(c => cat.includes(c))) {
      actualNeeds += amt;
    } else {
      actualWants += amt;
    }
  });

  // المدخرات الفعلية = صافي التدفق الإيجابي + مدخرات الأهداف
  const netSaved = Math.max(0, incomeTotal - (actualNeeds + actualWants));
  const actualSavings = netSaved + (metrics?.savings || 0);

  // حساب النسب المئوية الفعلية
  const needsPct = Math.round((actualNeeds / safeIncome) * 100);
  const wantsPct = Math.round((actualWants / safeIncome) * 100);
  const savingsPct = Math.round((actualSavings / safeIncome) * 100);

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
        <span>
          {wantsPct > 35
            ? 'تنبيه ذكي: مصاريف الرغبات والترفيه تجاوزت النسبة المثالية (30%). يُنصح بضبط نفقات الكافيهات والتسوق لرفع وتيرة الادخار.'
            : needsPct > 55
            ? 'تنبيه ذكي: مصاريف الالتزامات الأساسية مرتفعة نسبياً مقارنة بالدخل. راجع الاشتراكات الدورية والفواتير لتخفيف العبء الشهري.'
            : 'توزيعك المالي هذا الشهر متوازن وصحي للغاية ومطابق لأفضل الممارسات المالية العالمية!'}
        </span>
      </div>
    </div>
  );
}
