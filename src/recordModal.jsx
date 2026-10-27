// Sarfy - Dynamic Record Add/Edit Modal
// نموذج موحد ديناميكي ومريح لإضافة وتعديل السجلات في الجداول العشرة

import React, { useState, useEffect } from 'react';
import { Icon } from './icons.jsx';
import { DROPDOWNS, getRelativeDate } from './data.js';

export function RecordModal({
  isOpen,
  onClose,
  entityType,
  title,
  initialData,
  accounts = [],
  settings = {},
  onSave
}) {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData });
    } else {
      // إعداد القيم الافتراضية عند إضافة جديد
      const today = getRelativeDate(0);
      const defaults = {
        date: today,
        startDate: today,
        dueDate: getRelativeDate(30),
        nextRenewal: getRelativeDate(30),
        expectedDate: getRelativeDate(30),
        targetDate: getRelativeDate(180),
        accountId: accounts[0]?.id || '',
        status: 'مستلم',
        amount: '',
        original: '',
        paid: 0,
        received: 0,
        target: '',
        current: 0,
        probability: 0.5,
        fee: 0,
        intervalValue: 1,
        intervalUnit: 'شهر',
        autoRenew: true,
        recurring: false,
        necessity: 'ضروري',
        recurrence: 'متكرر'
      };

      if (entityType === 'accounts') {
        defaults.type = DROPDOWNS.accountTypes[0];
        defaults.status = 'نشط';
        defaults.opening = 0;
      } else if (entityType === 'expenses') {
        defaults.mainCat = settings.expenseCats?.[0] || 'أخرى';
        defaults.status = 'مدفوع';
        defaults.method = 'كاش';
      } else if (entityType === 'income') {
        defaults.category = settings.incomeCats?.[0] || 'راتب';
        defaults.status = 'مستلم';
        defaults.expectedType = 'فعلي';
        defaults.method = 'تحويل بنكي';
      } else if (entityType === 'transfers') {
        defaults.fromAccountId = accounts[0]?.id || '';
        defaults.toAccountId = accounts[1]?.id || accounts[0]?.id || '';
        defaults.status = 'مكتمل';
      } else if (entityType === 'debtsOwed') {
        defaults.status = 'مفتوح';
      } else if (entityType === 'debtsReceivable') {
        defaults.status = 'مفتوح';
        defaults.probability = 'عالية';
      } else if (entityType === 'subscriptions') {
        defaults.type = DROPDOWNS.subscriptionTypes[0];
        defaults.status = 'نشط';
      } else if (entityType === 'upcoming') {
        defaults.type = DROPDOWNS.upcomingTypes[0];
        defaults.status = 'قادم';
        defaults.priority = 'عالية';
      } else if (entityType === 'expectedIncome') {
        defaults.status = 'محتمل';
      } else if (entityType === 'goals') {
        defaults.type = DROPDOWNS.goalTypes[0];
        defaults.status = 'جاري';
        defaults.priority = 'عالية';
      }

      setFormData(defaults);
    }
  }, [initialData, entityType, accounts, settings]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{title}</h3>
          <button className="btn-icon" onClick={onClose}>
            <Icon name="close" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: 14 }}>
          <div className="form-grid">
            {/* 1. الحسابات */}
            {entityType === 'accounts' && (
              <>
                <div className="form-group">
                  <label className="form-label">اسم الحساب *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={formData.name || ''}
                    onChange={e => handleChange('name', e.target.value)}
                    placeholder="مثال: حساب البنك الأهلي"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">النوع *</label>
                  <select
                    className="form-select"
                    value={formData.type || DROPDOWNS.accountTypes[0]}
                    onChange={e => handleChange('type', e.target.value)}
                  >
                    {DROPDOWNS.accountTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">الرصيد الافتتاحي *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    className="form-input"
                    value={formData.opening ?? 0}
                    onChange={e => handleChange('opening', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">الحالة *</label>
                  <select
                    className="form-select"
                    value={formData.status || 'نشط'}
                    onChange={e => handleChange('status', e.target.value)}
                  >
                    {DROPDOWNS.accountStatuses.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group full-col">
                  <label className="form-label">ملاحظات</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    value={formData.notes || ''}
                    onChange={e => handleChange('notes', e.target.value)}
                  />
                </div>
              </>
            )}

            {/* 2. الدخل */}
            {entityType === 'income' && (
              <>
                <div className="form-group">
                  <label className="form-label">التاريخ *</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={formData.date || ''}
                    onChange={e => handleChange('date', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">المصدر *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="مثال: شركة العمل / عميل"
                    value={formData.source || ''}
                    onChange={e => handleChange('source', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">المبلغ *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0.01"
                    className="form-input"
                    placeholder="0.00"
                    value={formData.amount ?? ''}
                    onChange={e => handleChange('amount', parseFloat(e.target.value) || '')}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">الحساب المستلم عليه *</label>
                  <select
                    className="form-select"
                    value={formData.accountId || accounts[0]?.id}
                    onChange={e => handleChange('accountId', e.target.value)}
                    required
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">التصنيف *</label>
                  <select
                    className="form-select"
                    value={formData.category || (settings.incomeCats?.[0] || 'راتب')}
                    onChange={e => handleChange('category', e.target.value)}
                  >
                    {(settings.incomeCats || []).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">طريقة الاستلام *</label>
                  <select
                    className="form-select"
                    value={formData.method || 'كاش'}
                    onChange={e => handleChange('method', e.target.value)}
                  >
                    {DROPDOWNS.paymentMethods.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">الحالة *</label>
                  <select
                    className="form-select"
                    value={formData.status || 'مستلم'}
                    onChange={e => handleChange('status', e.target.value)}
                  >
                    {DROPDOWNS.incomeStatuses.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">فعلي أم متوقع *</label>
                  <select
                    className="form-select"
                    value={formData.expectedType || 'فعلي'}
                    onChange={e => handleChange('expectedType', e.target.value)}
                  >
                    {DROPDOWNS.incomeExpectedTypes.map(et => (
                      <option key={et} value={et}>{et}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">تاريخ الاستلام المتوقع</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.expectedDate || ''}
                    onChange={e => handleChange('expectedDate', e.target.value)}
                  />
                </div>
                <div className="form-group full-col">
                  <label className="form-label">الوصف والملاحظات</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="وصف إضافي للعملية"
                    value={formData.desc || ''}
                    onChange={e => handleChange('desc', e.target.value)}
                  />
                </div>
              </>
            )}

            {/* 3. المصروفات */}
            {entityType === 'expenses' && (
              <>
                <div className="form-group">
                  <label className="form-label">التاريخ *</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={formData.date || ''}
                    onChange={e => handleChange('date', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">الوصف *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="مثال: سوبر ماركت / بنزين"
                    value={formData.desc || ''}
                    onChange={e => handleChange('desc', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">المبلغ *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0.01"
                    className="form-input"
                    placeholder="0.00"
                    value={formData.amount ?? ''}
                    onChange={e => handleChange('amount', parseFloat(e.target.value) || '')}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">الحساب المدفوع منه *</label>
                  <select
                    className="form-select"
                    value={formData.accountId || accounts[0]?.id}
                    onChange={e => handleChange('accountId', e.target.value)}
                    required
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">التصنيف الرئيسي *</label>
                  <select
                    className="form-select"
                    value={formData.mainCat || (settings.expenseCats?.[0] || 'طعام')}
                    onChange={e => handleChange('mainCat', e.target.value)}
                  >
                    {(settings.expenseCats || []).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">التصنيف الفرعي (نص حر)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="مثال: بقالة / إيجار / وجبات"
                    value={formData.subCat || ''}
                    onChange={e => handleChange('subCat', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">طريقة الدفع *</label>
                  <select
                    className="form-select"
                    value={formData.method || 'كاش'}
                    onChange={e => handleChange('method', e.target.value)}
                  >
                    {DROPDOWNS.paymentMethods.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">الحالة *</label>
                  <select
                    className="form-select"
                    value={formData.status || 'مدفوع'}
                    onChange={e => handleChange('status', e.target.value)}
                  >
                    {DROPDOWNS.expenseStatuses.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">الضرورة *</label>
                  <select
                    className="form-select"
                    value={formData.necessity || 'ضروري'}
                    onChange={e => handleChange('necessity', e.target.value)}
                  >
                    {DROPDOWNS.necessityTypes.map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">التكرار *</label>
                  <select
                    className="form-select"
                    value={formData.recurrence || 'متكرر'}
                    onChange={e => handleChange('recurrence', e.target.value)}
                  >
                    {DROPDOWNS.recurrenceTypes.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group full-col">
                  <label className="form-label">ملاحظات</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.notes || ''}
                    onChange={e => handleChange('notes', e.target.value)}
                  />
                </div>
              </>
            )}

            {/* 4. التحويلات */}
            {entityType === 'transfers' && (
              <>
                <div className="form-group">
                  <label className="form-label">التاريخ *</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={formData.date || ''}
                    onChange={e => handleChange('date', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">المبلغ المحوّل *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0.01"
                    className="form-input"
                    placeholder="0.00"
                    value={formData.amount ?? ''}
                    onChange={e => handleChange('amount', parseFloat(e.target.value) || '')}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">من حساب (المصدر) *</label>
                  <select
                    className="form-select"
                    value={formData.fromAccountId || accounts[0]?.id}
                    onChange={e => handleChange('fromAccountId', e.target.value)}
                    required
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">إلى حساب (المستلم) *</label>
                  <select
                    className="form-select"
                    value={formData.toAccountId || accounts[1]?.id || accounts[0]?.id}
                    onChange={e => handleChange('toAccountId', e.target.value)}
                    required
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                {formData.fromAccountId && formData.fromAccountId === formData.toAccountId && (
                  <div className="alert-item alert-red full-col" style={{ fontSize: 12 }}>
                    تنبيه: الحساب المصدر والمستلم هو نفس الحساب!
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">رسوم التحويل</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    placeholder="0.00"
                    value={formData.fee ?? 0}
                    onChange={e => handleChange('fee', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">الحالة *</label>
                  <select
                    className="form-select"
                    value={formData.status || 'مكتمل'}
                    onChange={e => handleChange('status', e.target.value)}
                  >
                    {DROPDOWNS.transferStatuses.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group full-col">
                  <label className="form-label">ملاحظات</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.notes || ''}
                    onChange={e => handleChange('notes', e.target.value)}
                  />
                </div>
              </>
            )}

            {/* 5. ديون عليّ */}
            {entityType === 'debtsOwed' && (
              <>
                <div className="form-group">
                  <label className="form-label">الشخص أو الجهة *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="مثال: أحمد"
                    value={formData.person || ''}
                    onChange={e => handleChange('person', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">المبلغ الأصلي *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    className="form-input"
                    value={formData.original ?? ''}
                    onChange={e => handleChange('original', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">المبلغ المدفوع</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    value={formData.paid ?? 0}
                    onChange={e => handleChange('paid', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">الحساب الذي سيُدفع منه</label>
                  <select
                    className="form-select"
                    value={formData.accountId || accounts[0]?.id}
                    onChange={e => handleChange('accountId', e.target.value)}
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">تاريخ البداية</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.startDate || ''}
                    onChange={e => handleChange('startDate', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">تاريخ الاستحقاق *</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={formData.dueDate || ''}
                    onChange={e => handleChange('dueDate', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">الحالة *</label>
                  <select
                    className="form-select"
                    value={formData.status || 'مفتوح'}
                    onChange={e => handleChange('status', e.target.value)}
                  >
                    {DROPDOWNS.debtStatuses.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group full-col">
                  <label className="form-label">الوصف والملاحظات</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.desc || ''}
                    onChange={e => handleChange('desc', e.target.value)}
                  />
                </div>
              </>
            )}

            {/* 6. فلوس لي عند الآخرين */}
            {entityType === 'debtsReceivable' && (
              <>
                <div className="form-group">
                  <label className="form-label">اسم الشخص المدين *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="مثال: مينا"
                    value={formData.person || ''}
                    onChange={e => handleChange('person', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">المبلغ الأصلي *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    className="form-input"
                    value={formData.original ?? ''}
                    onChange={e => handleChange('original', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">المبلغ المستلم</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    value={formData.received ?? 0}
                    onChange={e => handleChange('received', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">احتمالية التحصيل *</label>
                  <select
                    className="form-select"
                    value={formData.probability || 'عالية'}
                    onChange={e => handleChange('probability', e.target.value)}
                  >
                    {DROPDOWNS.debtProbabilities.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">تاريخ البدء</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.startDate || ''}
                    onChange={e => handleChange('startDate', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">الاستحقاق المتوقع *</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={formData.dueDate || ''}
                    onChange={e => handleChange('dueDate', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">الحالة *</label>
                  <select
                    className="form-select"
                    value={formData.status || 'مفتوح'}
                    onChange={e => handleChange('status', e.target.value)}
                  >
                    {DROPDOWNS.debtStatuses.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group full-col">
                  <label className="form-label">الوصف والملاحظات</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.desc || ''}
                    onChange={e => handleChange('desc', e.target.value)}
                  />
                </div>
              </>
            )}

            {/* 7. الاشتراكات والمواعيد */}
            {entityType === 'subscriptions' && (
              <>
                <div className="form-group">
                  <label className="form-label">اسم الاشتراك *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="مثال: نتفليكس / حلاقة"
                    value={formData.name || ''}
                    onChange={e => handleChange('name', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">نوع الاشتراك *</label>
                  <select
                    className="form-select"
                    value={formData.type || DROPDOWNS.subscriptionTypes[0]}
                    onChange={e => handleChange('type', e.target.value)}
                  >
                    {DROPDOWNS.subscriptionTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">القيمة لكل مرة *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    className="form-input"
                    value={formData.value ?? ''}
                    onChange={e => handleChange('value', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', gap: 6 }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">كل كام *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      className="form-input"
                      value={formData.intervalValue ?? 1}
                      onChange={e => handleChange('intervalValue', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">الوحدة *</label>
                    <select
                      className="form-select"
                      value={formData.intervalUnit || 'شهر'}
                      onChange={e => handleChange('intervalUnit', e.target.value)}
                    >
                      {DROPDOWNS.intervalUnits.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">الحساب المرتبط</label>
                  <select
                    className="form-select"
                    value={formData.accountId || accounts[0]?.id}
                    onChange={e => handleChange('accountId', e.target.value)}
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">الموعد القادم *</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={formData.nextRenewal || ''}
                    onChange={e => handleChange('nextRenewal', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">آخر مرة دُفع</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.lastPayment || ''}
                    onChange={e => handleChange('lastPayment', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">الحالة *</label>
                  <select
                    className="form-select"
                    value={formData.status || 'نشط'}
                    onChange={e => handleChange('status', e.target.value)}
                  >
                    {DROPDOWNS.subscriptionStatuses.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group full-col">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                    <input
                      type="checkbox"
                      checked={!!formData.autoRenew}
                      onChange={e => handleChange('autoRenew', e.target.checked)}
                    />
                    تجديد تلقائي (Auto-Renew)
                  </label>
                </div>
              </>
            )}

            {/* 8. الالتزامات القادمة */}
            {entityType === 'upcoming' && (
              <>
                <div className="form-group">
                  <label className="form-label">اسم الالتزام *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="مثال: إيجار / قسط سيارة"
                    value={formData.name || ''}
                    onChange={e => handleChange('name', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">النوع *</label>
                  <select
                    className="form-select"
                    value={formData.type || DROPDOWNS.upcomingTypes[0]}
                    onChange={e => handleChange('type', e.target.value)}
                  >
                    {DROPDOWNS.upcomingTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">المبلغ *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    className="form-input"
                    value={formData.amount ?? ''}
                    onChange={e => handleChange('amount', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">تاريخ الاستحقاق *</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={formData.dueDate || ''}
                    onChange={e => handleChange('dueDate', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">الحساب المخصص للدفع</label>
                  <select
                    className="form-select"
                    value={formData.accountId || accounts[0]?.id}
                    onChange={e => handleChange('accountId', e.target.value)}
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">الأولوية *</label>
                  <select
                    className="form-select"
                    value={formData.priority || 'عالية'}
                    onChange={e => handleChange('priority', e.target.value)}
                  >
                    {DROPDOWNS.priorities.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">الحالة *</label>
                  <select
                    className="form-select"
                    value={formData.status || 'قادم'}
                    onChange={e => handleChange('status', e.target.value)}
                  >
                    {DROPDOWNS.upcomingStatuses.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">مصدر الالتزام</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="مثال: المالك / بنك مصر"
                    value={formData.source || ''}
                    onChange={e => handleChange('source', e.target.value)}
                  />
                </div>
                <div className="form-group full-col">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                    <input
                      type="checkbox"
                      checked={!!formData.recurring}
                      onChange={e => handleChange('recurring', e.target.checked)}
                    />
                    التزام متكرر دورياً
                  </label>
                </div>
              </>
            )}

            {/* 9. الدخل المتوقع */}
            {entityType === 'expectedIncome' && (
              <>
                <div className="form-group">
                  <label className="form-label">المصدر *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="مثال: شركة الأمل"
                    value={formData.source || ''}
                    onChange={e => handleChange('source', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">العميل</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="مثال: أ. طارق"
                    value={formData.client || ''}
                    onChange={e => handleChange('client', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">المبلغ المتوقع *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    className="form-input"
                    value={formData.amount ?? ''}
                    onChange={e => handleChange('amount', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">احتمال الحصول عليه (%) *</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    className="form-input"
                    placeholder="مثال: 60"
                    value={Math.round((formData.probability ?? 0.6) * 100)}
                    onChange={e => handleChange('probability', (parseFloat(e.target.value) || 0) / 100)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">التاريخ المتوقع *</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={formData.expectedDate || ''}
                    onChange={e => handleChange('expectedDate', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">الحساب المستلم عليه</label>
                  <select
                    className="form-select"
                    value={formData.accountId || accounts[0]?.id}
                    onChange={e => handleChange('accountId', e.target.value)}
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">الحالة *</label>
                  <select
                    className="form-select"
                    value={formData.status || 'محتمل'}
                    onChange={e => handleChange('status', e.target.value)}
                  >
                    {DROPDOWNS.expectedIncomeStatuses.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">المبلغ الفعلي المستلم (إن وُجد)</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    value={formData.actualReceived ?? ''}
                    onChange={e =>
                      handleChange(
                        'actualReceived',
                        e.target.value === '' ? null : parseFloat(e.target.value)
                      )
                    }
                  />
                </div>
                <div className="form-group full-col">
                  <label className="form-label">الوصف والملاحظات</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.desc || ''}
                    onChange={e => handleChange('desc', e.target.value)}
                  />
                </div>
              </>
            )}

            {/* 10. الأهداف المالية */}
            {entityType === 'goals' && (
              <>
                <div className="form-group">
                  <label className="form-label">اسم الهدف *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="مثال: صندوق الطوارئ"
                    value={formData.name || ''}
                    onChange={e => handleChange('name', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">نوع الهدف *</label>
                  <select
                    className="form-select"
                    value={formData.type || DROPDOWNS.goalTypes[0]}
                    onChange={e => handleChange('type', e.target.value)}
                  >
                    {DROPDOWNS.goalTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">المبلغ المستهدف (المطلوب) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    className="form-input"
                    value={formData.target ?? ''}
                    onChange={e => handleChange('target', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">المبلغ المجمّع الحالي</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    value={formData.current ?? 0}
                    onChange={e => handleChange('current', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">تاريخ البدء</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.startDate || ''}
                    onChange={e => handleChange('startDate', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">التاريخ المستهدف *</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={formData.targetDate || ''}
                    onChange={e => handleChange('targetDate', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">الأولوية *</label>
                  <select
                    className="form-select"
                    value={formData.priority || 'عالية'}
                    onChange={e => handleChange('priority', e.target.value)}
                  >
                    {DROPDOWNS.priorities.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">الحالة *</label>
                  <select
                    className="form-select"
                    value={formData.status || 'جاري'}
                    onChange={e => handleChange('status', e.target.value)}
                  >
                    {DROPDOWNS.goalStatuses.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">الحساب المرتبط</label>
                  <select
                    className="form-select"
                    value={formData.accountId || accounts[0]?.id}
                    onChange={e => handleChange('accountId', e.target.value)}
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group full-col">
                  <label className="form-label">ملاحظات</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.notes || ''}
                    onChange={e => handleChange('notes', e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              إلغاء
            </button>
            <button type="submit" className="btn-primary">
              حفظ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
