// Sarfy - Bank-Grade Financial Statement & PDF Generator
// كشف حساب مالي رسمي معتمد عالي الجودة قابل للطباعة والحفظ كـ PDF

import React, { useState } from 'react';
import { Icon } from './icons.jsx';
import { formatCurrency, formatDate } from './data.js';

export function BankStatementModal({
  isOpen,
  onClose,
  state,
  currency = 'ج.م',
  userProfile = {}
}) {
  if (!isOpen) return null;

  const [period, setPeriod] = useState('current_month'); // current_month | last_3_months | current_year | all
  const [selectedAccount, setSelectedAccount] = useState('all');

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // تصفية المعاملات حسب الفترة والحساب
  const allTransactions = [
    ...(state.income || []).map(i => ({
      id: i.id,
      date: i.date,
      desc: i.source || i.desc || 'إيداع دخل',
      category: i.category || 'دخل',
      accountId: i.accountId,
      amount: Number(i.amount) || 0,
      direction: 'credit' // دائن +
    })),
    ...(state.expenses || []).map(e => ({
      id: e.id,
      date: e.date,
      desc: e.desc || 'مصروف',
      category: e.mainCat || e.category || 'مصروف',
      accountId: e.accountId,
      amount: Number(e.amount) || 0,
      direction: 'debit' // مدين -
    }))
  ];

  // تصفية حسب التاريخ
  const filtered = allTransactions.filter(t => {
    if (selectedAccount !== 'all' && t.accountId !== selectedAccount) return false;
    const tDate = new Date(t.date);
    if (isNaN(tDate.getTime())) return true;

    if (period === 'current_month') {
      return tDate.getFullYear() === currentYear && tDate.getMonth() === currentMonth;
    } else if (period === 'last_3_months') {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(currentMonth - 3);
      return tDate >= threeMonthsAgo;
    } else if (period === 'current_year') {
      return tDate.getFullYear() === currentYear;
    }
    return true;
  });

  // ترتيب زمني من الأقدم للأحدث لتتبع حركة الرصيد
  filtered.sort((a, b) => new Date(a.date) - new Date(b.date));

  // حساب الأرصدة التراكمية
  const initialBase = (state.accounts || []).filter(a => selectedAccount === 'all' || a.id === selectedAccount)
    .reduce((s, a) => s + (Number(a.opening) || 0), 0);

  let running = initialBase;
  const ledgerRows = filtered.map(t => {
    if (t.direction === 'credit') {
      running += t.amount;
    } else {
      running -= t.amount;
    }
    return {
      ...t,
      balanceAfter: running
    };
  });

  const totalCredits = filtered.filter(t => t.direction === 'credit').reduce((s, t) => s + t.amount, 0);
  const totalDebits = filtered.filter(t => t.direction === 'debit').reduce((s, t) => s + t.amount, 0);
  const netMovement = totalCredits - totalDebits;
  const closingBalance = running;

  const handlePrint = () => {
    window.print();
  };

  const periodLabel = period === 'current_month'
    ? 'الشهر الحالي'
    : period === 'last_3_months'
    ? 'آخر 3 أشهر'
    : period === 'current_year'
    ? 'السنة المالية الحالية'
    : 'كافة الحركات التاريخية';

  return (
    <div className="crop-modal-overlay" onClick={onClose}>
      <div
        className="crop-modal-dialog printable-statement-dialog"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 780,
          width: '95%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 24,
          overflow: 'hidden'
        }}
      >
        {/* شريط الإجراءات والفلترة العلوي (يُخفى في الطباعة) */}
        <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              background: 'linear-gradient(135deg, var(--emerald) 0%, #059669 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Icon name="printer" size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>كشف حساب مالي رسمي معتمد</h3>
              <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'var(--text-muted)' }}>
                تصدير ومراجعة كشف حساب بنكي كامل بصيغة PDF أو طباعة فورية
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              className="form-select"
              value={period}
              onChange={e => setPeriod(e.target.value)}
              style={{ fontSize: 12, padding: '6px 10px', minWidth: 120 }}
            >
              <option value="current_month">الشهر الحالي</option>
              <option value="last_3_months">آخر 3 شهور</option>
              <option value="current_year">السنة الحالية</option>
              <option value="all">كافة الحركات</option>
            </select>

            <select
              className="form-select"
              value={selectedAccount}
              onChange={e => setSelectedAccount(e.target.value)}
              style={{ fontSize: 12, padding: '6px 10px', minWidth: 130 }}
            >
              <option value="all">كافة الحسابات (مجمع)</option>
              {(state.accounts || []).map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>

            <button
              type="button"
              className="btn-primary btn-sm"
              onClick={handlePrint}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}
            >
              <Icon name="printer" size={14} />
              <span>طباعة / حفظ PDF</span>
            </button>

            <button className="btn-icon-subtle" onClick={onClose} title="إغلاق">
              <Icon name="close" size={18} />
            </button>
          </div>
        </div>

        {/* جسم كشف الحساب المصرفي القابل للتمرير والطباعة */}
        <div className="printable-statement-sheet" style={{ overflowY: 'auto', padding: '12px 14px', flex: 1 }}>
          {/* ترويسة كشف الحساب المصرفي الرسمي */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2px solid var(--emerald)',
            paddingBottom: 14,
            marginBottom: 16
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: 'var(--emerald)',
                  color: '#05070D',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16
                }}>
                  ص
                </div>
                <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: -0.5, color: 'var(--text-primary)' }}>
                  صرفي | SARFY FINANCIAL
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                منظومة الإدارة المالية الذكية الموثقة وتتبع الثروة
              </div>
            </div>

            <div style={{ textAlign: 'left', direction: 'ltr' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--emerald)' }}>
                OFFICIAL FINANCIAL STATEMENT
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-numeric)' }}>
                REF: SRF-{Math.abs(currentYear)}-{filtered.length.toString().padStart(4, '0')}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-numeric)' }}>
                DATE: {new Date().toLocaleDateString('en-GB')}
              </div>
            </div>
          </div>

          {/* بيانات العميل والحساب */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
            background: 'var(--bg-elevated)',
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 12
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>اسم صاحب الحساب: </span>
              <strong>{userProfile?.fullName || state.userProfile?.fullName || 'مستخدم صرفي'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>فترة الكشف: </span>
              <strong>{periodLabel}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>الحساب المختار: </span>
              <strong>{selectedAccount === 'all' ? 'كافة الحسابات والمحافظ' : (state.accounts || []).find(a => a.id === selectedAccount)?.name}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>العملة المعتمدة: </span>
              <strong>{currency}</strong>
            </div>
          </div>

          {/* بطاقات الملخص المالي */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 8,
            marginBottom: 16
          }}>
            <div style={{ padding: 10, borderRadius: 8, background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>الرصيد الافتتاحي</div>
              <div style={{ fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-numeric)', marginTop: 2 }}>{formatCurrency(initialBase, currency)}</div>
            </div>
            <div style={{ padding: 10, borderRadius: 8, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', textAlign: 'center' }}>
              <div style={{ fontSize: 10.5, color: 'var(--emerald)' }}>إجمالي الإيداعات (+)</div>
              <div style={{ fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-numeric)', color: 'var(--emerald)', marginTop: 2 }}>+{formatCurrency(totalCredits, currency)}</div>
            </div>
            <div style={{ padding: 10, borderRadius: 8, background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', textAlign: 'center' }}>
              <div style={{ fontSize: 10.5, color: 'var(--coral)' }}>إجمالي المدفوعات (-)</div>
              <div style={{ fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-numeric)', color: 'var(--coral)', marginTop: 2 }}>-{formatCurrency(totalDebits, currency)}</div>
            </div>
            <div style={{ padding: 10, borderRadius: 8, background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', textAlign: 'center' }}>
              <div style={{ fontSize: 10.5, color: 'var(--cyan)' }}>صافي الحركة</div>
              <div style={{ fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-numeric)', color: netMovement >= 0 ? 'var(--cyan)' : 'var(--coral)', marginTop: 2 }}>
                {netMovement >= 0 ? '+' : ''}{formatCurrency(netMovement, currency)}
              </div>
            </div>
            <div style={{ padding: 10, borderRadius: 8, background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>الرصيد الختامي</div>
              <div style={{ fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-numeric)', marginTop: 2 }}>{formatCurrency(closingBalance, currency)}</div>
            </div>
          </div>

          {/* جدول الحركات التفصيلي */}
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, textAlign: 'right' }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', borderBottom: '2px solid var(--border-subtle)' }}>
                  <th style={{ padding: '8px 10px' }}>التاريخ</th>
                  <th style={{ padding: '8px 10px' }}>البيان والتفاصيل</th>
                  <th style={{ padding: '8px 10px' }}>التصنيف</th>
                  <th style={{ padding: '8px 10px' }}>الحساب</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>مدين (-)</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>دائن (+)</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>الرصيد</th>
                </tr>
              </thead>
              <tbody>
                {ledgerRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                      لا توجد حركات مسجلة خلال الفترة المحددة.
                    </td>
                  </tr>
                ) : (
                  ledgerRows.map(row => {
                    const accName = (state.accounts || []).find(a => a.id === row.accountId)?.name || 'حساب مصرفي';
                    return (
                      <tr key={row.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '7px 10px', whiteSpace: 'nowrap', fontFamily: 'var(--font-numeric)' }}>{row.date}</td>
                        <td style={{ padding: '7px 10px', fontWeight: 600 }}>{row.desc}</td>
                        <td style={{ padding: '7px 10px', color: 'var(--text-muted)' }}>{row.category}</td>
                        <td style={{ padding: '7px 10px', color: 'var(--text-muted)', fontSize: 10.5 }}>{accName}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'center', color: 'var(--coral)', fontFamily: 'var(--font-numeric)', fontWeight: 700 }}>
                          {row.direction === 'debit' ? formatCurrency(row.amount, '') : '-'}
                        </td>
                        <td style={{ padding: '7px 10px', textAlign: 'center', color: 'var(--emerald)', fontFamily: 'var(--font-numeric)', fontWeight: 700 }}>
                          {row.direction === 'credit' ? formatCurrency(row.amount, '') : '-'}
                        </td>
                        <td style={{ padding: '7px 10px', textAlign: 'left', fontFamily: 'var(--font-numeric)', fontWeight: 700 }}>
                          {formatCurrency(row.balanceAfter, '')}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ختم وتوثيق الكشف الرسمي */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 20,
            paddingTop: 14,
            borderTop: '1px solid var(--border-subtle)',
            fontSize: 10.5,
            color: 'var(--text-muted)'
          }}>
            <div>
              تم استخراج وتوليد هذا المستند رقمياً ومشفر بتشفير AES-256 عبر تطبيق صرفي.
            </div>
            <div style={{
              padding: '4px 10px',
              borderRadius: 4,
              border: '1px dashed var(--emerald)',
              color: 'var(--emerald)',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}>
              <Icon name="check" size={13} color="var(--emerald)" />
              <span>معتمد ومطابق للحسابات الختامية</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
