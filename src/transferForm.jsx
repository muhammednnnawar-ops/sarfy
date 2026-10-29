// Sarfy - Quick Transfer Form
// نموذج تحويل سريع بين الحسابات مع الحساب الآلي للرسوم الرسمية (صفحة التحويلات + زر التحويل من الحساب)

import React, { useState } from 'react';
import { Icon } from './icons.jsx';
import { formatCurrency, getRelativeDate, getCurrentTime } from './data.js';
import { calculateTransferFee, calculateAccountBalances } from './calculations.js';
import { BankIconBadge } from './bankLogos.jsx';
import { playSuccessSound, triggerHaptic } from './audio.js';

// تسجيل تحويل مكتمل في الحالة
export function addCompletedTransfer(mutate, transfer) {
  mutate(draft => {
    if (!draft.transfers) draft.transfers = [];
    draft.transfers.push({
      ...transfer,
      id: `tr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      status: 'مكتمل',
      notes: ''
    });
  });
}

export function QuickTransferForm({ state, initialFromId = '', onSubmit, onCancel = null, submitLabel = 'تنفيذ التحويل' }) {
  const accounts = state.accounts || [];
  const currency = state.settings?.currency || 'ج.م';
  const balances = calculateAccountBalances(state);

  const firstFromId = accounts.some(a => a.id === initialFromId) ? initialFromId : (accounts[0]?.id || '');
  const [fromId, setFromId] = useState(firstFromId);
  const [toId, setToId] = useState(() => accounts.find(a => a.id !== firstFromId)?.id || '');
  const [amount, setAmount] = useState('');
  // الرسوم تتبع الحاسبة تلقائياً حتى يعدّلها المستخدم بنفسه
  const [feeOverride, setFeeOverride] = useState(null);
  const [date, setDate] = useState(() => getRelativeDate(0));
  const [time, setTime] = useState(() => getCurrentTime());
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  // الحسابات المختارة يُتحقق منها دائماً مقابل الحسابات الحالية
  const fromAcc = accounts.find(a => a.id === fromId) || accounts[0] || null;
  const toAcc = accounts.find(a => a.id === toId) || accounts.find(a => a.id !== fromAcc?.id) || null;
  const feeInfo = calculateTransferFee(fromAcc, toAcc, amount);
  const fee = feeOverride === null ? feeInfo.fee : feeOverride;
  const numAmount = Number(amount) || 0;
  const totalOut = numAmount + (Number(fee) || 0);
  const fromBalance = fromAcc ? (balances[fromAcc.id]?.currentBalance ?? 0) : 0;

  const handleFromChange = id => {
    setFromId(id);
    if (id === toAcc?.id) setToId(accounts.find(a => a.id !== id)?.id || '');
    setFeeOverride(null);
  };

  const handleSwap = () => {
    if (!fromAcc || !toAcc) return;
    setFromId(toAcc.id);
    setToId(fromAcc.id);
    setFeeOverride(null);
  };

  const handleSubmit = e => {
    e.preventDefault();
    setError('');
    if (!fromAcc || !toAcc) return setError('أضف حسابين على الأقل لتتمكن من التحويل بينهما.');
    if (fromAcc.id === toAcc.id) return setError('الحساب المصدر والمستلم هو نفس الحساب.');
    if (numAmount <= 0) return setError('أدخل مبلغ التحويل.');

    onSubmit({
      date: date || getRelativeDate(0),
      time,
      fromAccountId: fromAcc.id,
      toAccountId: toAcc.id,
      amount: numAmount,
      fee: Number(fee) || 0
    });
    playSuccessSound();
    triggerHaptic('success');
    setDone(`تم تحويل ${formatCurrency(numAmount, currency)} من ${fromAcc.name} إلى ${toAcc.name}`);
    setAmount('');
    setFeeOverride(null);
    setTime(getCurrentTime());
  };

  if (accounts.length < 2) {
    return (
      <div className="quick-transfer-empty">
        <Icon name="alert" size={14} />
        <span>أضف حسابين على الأقل لتتمكن من التحويل بينهما.</span>
      </div>
    );
  }

  return (
    <form className="quick-transfer-form" onSubmit={handleSubmit}>
      <div className="quick-transfer-grid">
        <div className="quick-transfer-accounts">
          <div className="form-group">
            <label className="form-label quick-transfer-label">
              <span>من حساب (المصدر)</span>
              {fromAcc && <BankIconBadge account={fromAcc} size={18} />}
            </label>
            <select className="form-select" value={fromAcc?.id || ''} onChange={e => handleFromChange(e.target.value)}>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
              ))}
            </select>
            {fromAcc && (
              <span className="quick-transfer-hint">الرصيد المتاح: {formatCurrency(fromBalance, currency)}</span>
            )}
          </div>

          <button
            type="button"
            className="quick-transfer-swap"
            onClick={handleSwap}
            title="تبديل الحساب المصدر والمستلم"
            aria-label="تبديل الحساب المصدر والمستلم"
          >
            <Icon name="transfers" size={16} />
          </button>

          <div className="form-group">
            <label className="form-label quick-transfer-label">
              <span>إلى حساب (المستلم)</span>
              {toAcc && <BankIconBadge account={toAcc} size={18} />}
            </label>
            <select
              className="form-select"
              value={toAcc?.id || ''}
              onChange={e => {
                setToId(e.target.value);
                setFeeOverride(null);
              }}
            >
              {accounts.filter(a => a.id !== fromAcc?.id).map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">المبلغ المحوّل *</label>
          <input
            type="number"
            inputMode="decimal"
            step="any"
            min="0.01"
            required
            className="form-input"
            placeholder="0.00"
            value={amount}
            onChange={e => {
              setAmount(e.target.value);
              setFeeOverride(null);
              setDone('');
            }}
          />
        </div>

        <div className="form-group">
          <label className="form-label quick-transfer-label">
            <span>رسوم التحويل</span>
            <span className="quick-transfer-calc">المحسوب: {feeInfo.fee} {currency}</span>
          </label>
          <input
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            className="form-input"
            placeholder="0"
            value={fee === 0 && feeOverride === null ? '' : fee}
            onChange={e => setFeeOverride(e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0))}
          />
        </div>

        <div className="form-group quick-transfer-wide">
          <label className="form-label">التاريخ والوقت *</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="date"
              required
              className="form-input"
              style={{ flex: 1.3, minWidth: 0 }}
              value={date}
              onChange={e => setDate(e.target.value)}
            />
            <input
              type="time"
              className="form-input"
              style={{ flex: 1, minWidth: 0 }}
              aria-label="الوقت"
              value={time}
              onChange={e => setTime(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="quick-transfer-fee-note">
        <Icon name="check" size={12} color="var(--emerald)" />
        <span>{feeInfo.reason}</span>
        {feeOverride !== null && Number(fee) !== feeInfo.fee && (
          <button type="button" onClick={() => setFeeOverride(null)}>
            الرجوع للرسوم الرسمية ({feeInfo.fee})
          </button>
        )}
      </div>

      {error && <div className="quick-transfer-msg is-error">{error}</div>}
      {done && !error && <div className="quick-transfer-msg is-ok">{done}</div>}

      <div className="quick-transfer-footer">
        <div className="quick-transfer-total">
          {numAmount > 0 ? (
            <>سيُخصم <strong>{formatCurrency(totalOut, currency)}</strong> من {fromAcc?.name}{Number(fee) > 0 ? ' (شامل الرسوم)' : ''}</>
          ) : (
            'التحويل ليس دخلاً ولا مصروفاً، ويغيّر رصيد الحسابين فقط'
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {onCancel && (
            <button type="button" className="btn-secondary" onClick={onCancel}>إغلاق</button>
          )}
          <button type="submit" className="btn-primary" disabled={numAmount <= 0}>
            <Icon name="transfers" size={15} /> {submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}

// نافذة تحويل سريعة تُفتح من زر التحويل بجانب الحساب
export function QuickTransferModal({ state, fromAccountId, onSubmit, onClose }) {
  const fromAcc = (state.accounts || []).find(a => a.id === fromAccountId);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
            تحويل من {fromAcc?.name || 'الحساب'}
          </h3>
          <button className="btn-icon" onClick={onClose}>
            <Icon name="close" size={20} />
          </button>
        </div>
        <div style={{ marginTop: 14 }}>
          <QuickTransferForm
            state={state}
            initialFromId={fromAccountId}
            onSubmit={transfer => {
              onSubmit(transfer);
              onClose();
            }}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}
