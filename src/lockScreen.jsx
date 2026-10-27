// Sarfy - Futuristic Cyber Security Lock Screen
// شاشة قفل مستقبلية مزودة بلوحة أرقام تفاعلية وتأثيرات ضوئية لحماية البيانات

import React, { useState, useEffect } from 'react';
import { Icon } from './icons.jsx';

export function LockScreen({ onUnlock, pinLength = 4 }) {
  const [enteredPin, setEnteredPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const handleDigit = digit => {
    if (enteredPin.length < 8) {
      const next = enteredPin + digit;
      setEnteredPin(next);
      setErrorMsg('');

      // التحقق التلقائي عند اكتمال الطول المتوقع
      if (next.length === pinLength) {
        attemptUnlock(next);
      }
    }
  };

  const handleDelete = () => {
    setEnteredPin(prev => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    setEnteredPin('');
    setErrorMsg('');
  };

  const attemptUnlock = async pinToTest => {
    setIsUnlocking(true);
    try {
      const success = await onUnlock(pinToTest);
      if (!success) {
        triggerError('الرمز السري غير صحيح');
      }
    } catch (err) {
      triggerError(err.message || 'فشل فك التشفير');
    } finally {
      setIsUnlocking(false);
    }
  };

  const triggerError = msg => {
    setErrorMsg(msg);
    setIsShaking(true);
    setEnteredPin('');
    setTimeout(() => setIsShaking(false), 500);
  };

  // دعم لوحة مفاتيح الكمبيوتر الفيزيائية
  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        handleClear();
      } else if (e.key === 'Enter' && enteredPin.length > 0) {
        attemptUnlock(enteredPin);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enteredPin, pinLength]);

  return (
    <div className="lockscreen-overlay">
      <div className={`lockscreen-card ${isShaking ? 'shake-anim' : ''}`}>
        <div className="lockscreen-icon-glow">
          <div className="lockscreen-shield-badge">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <circle cx="12" cy="11" r="2" />
              <path d="M12 13v2" />
            </svg>
          </div>
        </div>

        <h2 className="lockscreen-title">محفظتي المشفرة</h2>
        <p className="lockscreen-subtitle">البيانات محمية بتشفير الأجهزة العسكري AES-256-GCM</p>

        {/* مؤشرات الأرقام المدخلة */}
        <div className="pin-dots-container">
          {Array.from({ length: Math.max(pinLength, enteredPin.length) }).map((_, i) => (
            <div
              key={i}
              className={`pin-dot ${i < enteredPin.length ? 'filled' : ''}`}
            />
          ))}
        </div>

        {errorMsg ? (
          <div className="lockscreen-error">{errorMsg}</div>
        ) : (
          <div className="lockscreen-hint">أدخل الرمز السري لفتح المحفظة</div>
        )}

        {/* لوحة الأرقام الرقمية المستقبلية */}
        <div className="cyber-keypad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              type="button"
              className="keypad-btn"
              onClick={() => handleDigit(String(num))}
              disabled={isUnlocking}
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            className="keypad-btn action-btn"
            onClick={handleClear}
            disabled={isUnlocking}
          >
            مسح
          </button>
          <button
            type="button"
            className="keypad-btn"
            onClick={() => handleDigit('0')}
            disabled={isUnlocking}
          >
            0
          </button>
          <button
            type="button"
            className="keypad-btn action-btn"
            onClick={handleDelete}
            disabled={isUnlocking}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
              <line x1="18" y1="9" x2="12" y2="15" />
              <line x1="12" y1="9" x2="18" y2="15" />
            </svg>
          </button>
        </div>

        <div className="lockscreen-footer">
          <span>🔒 Zero-Knowledge Security · تشفير محلي 100%</span>
        </div>
      </div>
    </div>
  );
}
