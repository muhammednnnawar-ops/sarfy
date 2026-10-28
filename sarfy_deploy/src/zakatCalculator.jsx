// Sarfy - Smart Zakat & Wealth Calculator
// حاسبة الزكاة الشرعية الذكية المعتمدة للأموال النقدية، الذهب، والشهادات الاستثمارية

import React, { useState } from 'react';
import { Icon } from './icons.jsx';
import { formatCurrency, formatNumber } from './data.js';
import { playSuccessSound, playClickSound, triggerHaptic } from './audio.js';
import { calculateAccountBalances } from './calculations.js';

export function ZakatCalculatorModal({
  isOpen,
  onClose,
  state,
  metrics,
  currency = 'ج.م',
  onRecordZakatExpense
}) {
  if (!isOpen) return null;

  // سعر جرام الذهب عيار 24 (افتراضياً بالسوق المصري/العربي ويمكن تعديله يدوياً)
  const [goldPrice24k, setGoldPrice24k] = useState(3850);
  const [excludeJewelry, setExcludeJewelry] = useState(true); // استثناء حلي الزينة الشخصية للمرأة
  const [selectedAccountId, setSelectedAccountId] = useState(state.accounts?.[0]?.id || '');
  const [recordedSuccess, setRecordedSuccess] = useState(false);

  // 1. حساب النصاب الشرعي (85 جرام ذهب عيار 24)
  const nisabGrams = 85;
  const nisabThreshold = nisabGrams * (Number(goldPrice24k) || 0);

  // 2. حساب الأموال النقدية السائلة — من الأرصدة الحية (الرصيد الحالي بعد الحركات) وليس النشوء فقط
  const accountBalances = calculateAccountBalances(state);
  const liquidCash = Object.values(accountBalances).reduce(
    (sum, acc) => sum + (acc.currentBalance > 0 ? acc.currentBalance : 0),
    0
  );

  // 3. حساب قيمة الذهب الاستثماري والسبائك
  const goldAssets = (state.assets || []).filter(a => 
    (a.type && a.type.includes('ذهب')) || 
    (a.name && a.name.includes('ذهب')) ||
    (a.category && a.category.includes('ذهب'))
  );
  
  const goldValue = goldAssets.reduce((sum, a) => {
    // إذا كان ذهب زينة شخصي والمستخدم اختار استثناءه
    if (excludeJewelry && (a.notes?.includes('زينة') || a.name?.includes('زينة'))) {
      return sum;
    }
    const val = Number(a.currentValue || a.value || a.amount) || 0;
    return sum + val;
  }, 0);

  // 4. حساب الشهادات والودائع والأرباح المستلمة
  const certAssets = (state.assets || []).filter(a => 
    (a.type && (a.type.includes('شهادة') || a.type.includes('وديعة') || a.type.includes('استثمار')))
  );
  const certsValue = certAssets.reduce((sum, a) => {
    return sum + (Number(a.currentValue || a.value) || 0);
  }, 0);

  // 5. حساب المستحقات لك (ديون لك ذات احتمالية عالية وغير المسددة أو الملغاة)
  const receivables = (state.debtsReceivable || []).filter(d => 
    d.status !== 'ملغي' && d.status !== 'مكتمل' && (d.probability === 'عالية' || !d.probability)
  ).reduce((sum, d) => sum + (Number(d.original - (d.received || 0)) || 0), 0);

  // 6. خصم الديون والالتزامات العاجلة التي عليك حالياً (غير المسددة بالكامل أو الملغاة)
  const shortTermDebts = (state.debtsOwed || []).filter(d => 
    d.status !== 'ملغي' && d.status !== 'مكتمل'
  ).reduce((sum, d) => sum + (Number(d.original - (d.paid || 0)) || 0), 0);

  // 7. صافي الوعاء الزكوي الخاضع للزكاة
  const zakatPool = Math.max(0, liquidCash + goldValue + certsValue + receivables - shortTermDebts);

  // 8. هل بلغ النصاب وحال عليه الحول؟
  const isNisabReached = zakatPool >= nisabThreshold && nisabThreshold > 0;
  
  // 9. مقدار الزكاة المستحقة (2.5% أو ربع العشر = 1 / 40)
  const zakatDue = isNisabReached ? Math.round(zakatPool * 0.025) : 0;

  // تسجيل الزكاة كمصروف رسمي
  const handleApplyZakatAsExpense = () => {
    if (zakatDue <= 0) return;
    if (onRecordZakatExpense) {
      onRecordZakatExpense({
        amount: zakatDue,
        accountId: selectedAccountId,
        category: 'هدايا وتبرعات',
        desc: `زكاة المال السنوية الشرعية (${formatCurrency(zakatDue, currency)})`,
        necessity: 'ضروري'
      });
      playSuccessSound();
      triggerHaptic('success');
      setRecordedSuccess(true);
      setTimeout(() => {
        setRecordedSuccess(false);
        onClose();
      }, 2000);
    }
  };

  return (
    <div className="crop-modal-overlay" onClick={onClose}>
      <div className="crop-modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 520, padding: 24 }}>
        {/* رأس النافذة */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, rgba(202, 138, 4, 0.25) 100%)',
              border: '1px solid rgba(234, 179, 8, 0.35)',
              color: '#FBBF24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Icon name="calculator" size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>
                حاسبة الزكاة الشرعية الذكية
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                احتساب ربع العشر (2.5%) للأموال والذهب والاستثمارات
              </p>
            </div>
          </div>
          <button className="btn-icon-subtle" onClick={onClose} title="إغلاق">
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* بطاقة النتيجة وحالة النصاب */}
        <div style={{
          padding: '16px 20px',
          borderRadius: 14,
          background: isNisabReached ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.22) 100%)' : 'rgba(234, 179, 8, 0.08)',
          border: `1.5px solid ${isNisabReached ? 'var(--emerald)' : 'rgba(234, 179, 8, 0.3)'}`,
          marginBottom: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600 }}>
              {isNisabReached ? 'مقدار الزكاة الشرعية الواجبة (2.5%):' : 'حالة النصاب الشرعي:'}
            </div>
            <div style={{
              fontSize: 26,
              fontWeight: 900,
              fontFamily: 'var(--font-numeric)',
              color: isNisabReached ? 'var(--emerald)' : 'var(--amber)',
              marginTop: 3
            }}>
              {isNisabReached ? formatCurrency(zakatDue, currency) : 'لم يبلغ النصاب بعد'}
            </div>
          </div>

          <div style={{
            fontSize: 12,
            padding: '5px 12px',
            borderRadius: 20,
            background: isNisabReached ? 'rgba(16, 185, 129, 0.2)' : 'rgba(234, 179, 8, 0.15)',
            color: isNisabReached ? '#34D399' : '#FBBF24',
            fontWeight: 800,
            border: `1px solid ${isNisabReached ? 'rgba(16, 185, 129, 0.4)' : 'rgba(234, 179, 8, 0.3)'}`
          }}>
            {isNisabReached ? 'واجبة الإخراج (فوق النصاب)' : 'دون حد النصاب'}
          </div>
        </div>

        {/* مدخلات التحكم بسعر الذهب */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
          padding: '12px 14px',
          borderRadius: 10,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          marginBottom: 16
        }}>
          <div>
            <label className="form-label" style={{ fontSize: 11.5 }}>
              سعر جرام الذهب عيار 24 ({currency}):
            </label>
            <input
              type="number"
              className="form-input"
              value={goldPrice24k}
              onChange={e => setGoldPrice24k(e.target.value)}
              placeholder="3850"
              style={{ fontSize: 13, padding: '7px 12px' }}
            />
          </div>
          <div>
            <div className="form-label" style={{ fontSize: 11.5 }}>حد النصاب (85 جرام عيار 24):</div>
            <div style={{
              fontSize: 14,
              fontWeight: 800,
              fontFamily: 'var(--font-numeric)',
              color: 'var(--cyan)',
              marginTop: 8
            }}>
              {formatCurrency(nisabThreshold, currency)}
            </div>
          </div>
        </div>

        {/* تفصيل الوعاء الزكوي */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>
            تفصيل الأموال والأصول الخاضعة للاحتساب:
          </div>
          <div style={{
            background: 'var(--bg-input)',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 12,
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>الأموال السائلة (البنوك والكاش):</span>
              <span style={{ fontWeight: 700, fontFamily: 'var(--font-numeric)' }}>{formatCurrency(liquidCash, currency)}</span>
            </div>
            {goldValue > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>الذهب والسبائك الاستثمارية:</span>
                <span style={{ fontWeight: 700, fontFamily: 'var(--font-numeric)', color: '#FBBF24' }}>{formatCurrency(goldValue, currency)}</span>
              </div>
            )}
            {certsValue > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>عوائد الشهادات والودائع:</span>
                <span style={{ fontWeight: 700, fontFamily: 'var(--font-numeric)' }}>{formatCurrency(certsValue, currency)}</span>
              </div>
            )}
            {receivables > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>ديون موثوقة مرجوة السداد لك:</span>
                <span style={{ fontWeight: 700, fontFamily: 'var(--font-numeric)', color: 'var(--emerald)' }}>+{formatCurrency(receivables, currency)}</span>
              </div>
            )}
            {shortTermDebts > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>ديون عاجلة عليك (تُخصم):</span>
                <span style={{ fontWeight: 700, fontFamily: 'var(--font-numeric)', color: 'var(--coral)' }}>-{formatCurrency(shortTermDebts, currency)}</span>
              </div>
            )}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: 6,
              borderTop: '1px solid var(--border-subtle)',
              fontWeight: 800
            }}>
              <span>صافي الوعاء الزكوي:</span>
              <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-numeric)' }}>{formatCurrency(zakatPool, currency)}</span>
            </div>
          </div>
        </div>

        {/* خيار استثناء حلي الزينة */}
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 12,
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          marginBottom: 18
        }}>
          <input
            type="checkbox"
            checked={excludeJewelry}
            onChange={e => setExcludeJewelry(e.target.checked)}
            style={{ accentColor: 'var(--emerald)' }}
          />
          <span>استثناء ذهب الحلي والزينة الشخصية المعتاد للمرأة (وفق جمهور الفقهاء)</span>
        </label>

        {/* خيار تسجيل الزكاة كمصروف */}
        {isNisabReached && onRecordZakatExpense && (
          <div style={{
            padding: '12px 14px',
            borderRadius: 10,
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            marginBottom: 16
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--emerald)', marginBottom: 6 }}>
              تسجيل الزكاة مباشرة في حركة المصروفات:
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <select
                className="form-select"
                value={selectedAccountId}
                onChange={e => setSelectedAccountId(e.target.value)}
                style={{ flex: 1, fontSize: 12, padding: '7px 10px' }}
              >
                {(state.accounts || []).map(a => (
                  <option key={a.id} value={a.id}>الخصم من: {a.name}</option>
                ))}
              </select>
              <button
                type="button"
                className="btn-primary"
                onClick={handleApplyZakatAsExpense}
                disabled={recordedSuccess}
                style={{ fontSize: 12, padding: '8px 14px', whiteSpace: 'nowrap' }}
              >
                {recordedSuccess ? 'تم تسجيل الزكاة بنجاح!' : 'تسجيل كمصروف الآن'}
              </button>
            </div>
          </div>
        )}

        {/* أزرار الإجراءات */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
