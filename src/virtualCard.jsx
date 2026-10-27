// Sarfy - Luxury 3D Interactive Bank Cards
// كروت بنكية تفاعلية ثلاثية الأبعاد تدعم الإمالة المنظورية (Parallax Tilt) والقلب ثلاثي الأبعاد (3D Flip)
import React, { useState, useRef } from 'react';
import { formatCurrency, formatNumber } from './data.js';

export function VirtualCard({
  account,
  balance,
  currency = 'ج.م',
  isActive = false,
  onClick,
  allowFlip = true
}) {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const [isFlipped, setIsFlipped] = useState(false);
  const cardRef = useRef(null);

  // أنماط التصميم والشبكة بحسب نوع الحساب
  let cardStyle = 'card-theme-dark';
  let cardNetwork = 'VISA';
  let issuer = 'صرفي المصرفية';

  if (account.name.includes('الأهلي') || account.type === 'حساب بنكي') {
    cardStyle = 'card-theme-ahly';
    cardNetwork = 'Mastercard';
    issuer = 'البنك الأهلي المصري';
  } else if (account.name.includes('فودافون') || account.type === 'محفظة إلكترونية') {
    cardStyle = 'card-theme-vodafone';
    cardNetwork = 'Pay';
    issuer = 'Vodafone Smart Cash';
  } else if (account.type === 'كاش') {
    cardStyle = 'card-theme-cash';
    cardNetwork = 'CASH';
    issuer = 'محفظة النقدية الفورية';
  }

  // توليد أرقام بطاقة واقعية
  const rawIdNum = String(account.opening || '4821').replace(/[^0-9]/g, '').padEnd(4, '7');
  const lastFour = rawIdNum.slice(-4);
  const cvv = String(Math.abs(Math.sin(Number(account.opening || 1)) * 900 + 100)).slice(0, 3);

  // معالجة حركة الماوس للإمالة ثلاثية الأبعاد (3D Parallax Tilt)
  const handleMouseMove = e => {
    if (isFlipped || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -12; // أقصى إمالة 12 درجة
    const rotateY = ((x - centerX) / centerX) * 14;

    setRotate({ x: rotateX, y: rotateY });
    setGlare({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.7
    });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
    setGlare(prev => ({ ...prev, opacity: 0 }));
  };

  // معالجة اللمس للهواتف الذكية
  const handleTouchMove = e => {
    if (isFlipped || !cardRef.current || !e.touches[0]) return;
    const touch = e.touches[0];
    const rect = cardRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    setRotate({
      x: ((y - centerY) / centerY) * -8,
      y: ((x - centerX) / centerX) * 10
    });
  };

  const handleTouchEnd = () => {
    setRotate({ x: 0, y: 0 });
  };

  const handleCardClick = e => {
    // إذا ضغط المستخدم على زر تفاعلي داخلي لا نقلب
    if (e.target.closest('.card-flip-btn')) return;

    if (allowFlip) {
      setIsFlipped(prev => !prev);
      setRotate({ x: 0, y: 0 });
    }
    if (onClick) onClick(e);
  };

  return (
    <div
      className="card-3d-scene"
      style={{
        perspective: '1200px',
        display: 'inline-block',
        width: '100%',
        maxWidth: 360
      }}
    >
      <div
        ref={cardRef}
        className={`virtual-bank-card ${cardStyle} ${isActive ? 'is-active' : ''} ${isFlipped ? 'flipped' : ''}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleCardClick}
        style={{
          transform: isFlipped
            ? 'rotateY(180deg)'
            : `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale3d(${rotate.x || rotate.y ? 1.025 : 1}, ${rotate.x || rotate.y ? 1.025 : 1}, 1)`,
          transformStyle: 'preserve-3d',
          transition: isFlipped ? 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)' : 'transform 0.12s ease-out'
        }}
        title="انقر لقلب البطاقة ومشاهدة التفاصيل"
      >
        {/* ================= وجه البطاقة الأمامي (Front Face) ================= */}
        <div className="card-face card-face-front">
          {/* لمعة الهولوجرام التفاعلية الديناميكية */}
          <div
            className="card-dynamic-glare"
            style={{
              background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.05) 50%, transparent 80%)`,
              opacity: glare.opacity
            }}
          />

          {/* الصف العلوي: الرقاقة ثلاثية الأبعاد وشعار الشبكة */}
          <div className="card-top-row" style={{ transform: 'translateZ(26px)' }}>
            <div className="card-chip-container">
              <svg className="card-chip" viewBox="0 0 36 28" fill="none">
                <rect width="36" height="28" rx="4" fill="url(#chipGrad3D)" />
                <path d="M0 10h12m0 8H0m36-8H24m12 8H24m-12 10V18m0-8V0m12 28V18m0-8V0" stroke="#78350F" strokeWidth="1" opacity="0.65" />
                <defs>
                  <linearGradient id="chipGrad3D" x1="0" y1="0" x2="36" y2="28" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FDE68A" />
                    <stop offset="0.4" stopColor="#F59E0B" />
                    <stop offset="1" stopColor="#B45309" />
                  </linearGradient>
                </defs>
              </svg>
              <svg className="contactless-waves" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M8.5 16.5a5 5 0 0 1 0-7" />
                <path d="M12 19a8.5 8.5 0 0 0 0-14" />
                <path d="M15.5 21.5a12 12 0 0 0 0-19" />
              </svg>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="card-network-badge">{cardNetwork}</span>
              <button
                type="button"
                className="card-flip-btn"
                onClick={e => {
                  e.stopPropagation();
                  setIsFlipped(true);
                }}
                title="قلب البطاقة"
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M4 12a8 8 0 0 1 14.93-4" />
                  <polyline points="20 4 20 10 14 10" />
                  <path d="M20 12a8 8 0 0 1-14.93 4" />
                  <polyline points="4 20 4 14 10 14" />
                </svg>
              </button>
            </div>
          </div>

          {/* رصيد البطاقة البارز للأمام بتقنية 3D Depth */}
          <div className="card-balance-block" style={{ transform: 'translateZ(32px)' }}>
            <span className="card-balance-label">الرصيد المتاح</span>
            <div className="card-balance-val">
              <span className="card-curr">{currency}</span>
              <span className="card-num">{formatNumber(balance)}</span>
            </div>
          </div>

          {/* الصف السفلي: اسم الحساب ورقم البطاقة المقنع */}
          <div className="card-bottom-row" style={{ transform: 'translateZ(22px)' }}>
            <div className="card-holder-info">
              <span className="card-acc-name">{account.name}</span>
              <span className="card-acc-type">{issuer}</span>
            </div>
            <div className="card-masked-number">
              •••• {lastFour}
            </div>
          </div>
        </div>

        {/* ================= ظهر البطاقة الخلفي ثلاثي الأبعاد (Back Face) ================= */}
        <div className="card-face card-face-back">
          {/* الشريط المغناطيسي الأسود */}
          <div className="card-magnetic-stripe"></div>

          {/* شريط التوقيع ومربع CVV */}
          <div className="card-back-details">
            <div className="card-signature-panel">
              <div className="card-signature-lines">
                <span>AUTHORIZED SIGNATURE - NOT VALID UNLESS SIGNED</span>
              </div>
              <div className="card-cvv-box">{cvv}</div>
            </div>

            <div className="card-back-meta">
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>
                <div>IBAN: EG4200030000{lastFour}987654321</div>
                <div>Account ID: #{account.id}</div>
              </div>
              <div className="card-security-hologram">
                <span>SARFY</span>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: 10 }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                🔄 انقر للرجوع للوجه الأمامي
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
