// Sarfy - Luxury 3D Interactive Bank Cards
// كروت بنكية تفاعلية ثلاثية الأبعاد تدعم الإمالة المنظورية (Parallax Tilt) والقلب ثلاثي الأبعاد (3D Flip)
import React, { useState, useRef } from 'react';
import { formatCurrency, formatNumber } from './data.js';
import { getBankOrWalletMeta } from './bankLogos.jsx';
import { Icon } from './icons.jsx';
import { playCardFlipSound, triggerHaptic } from './audio.js';

// مكون شعار شبكة البطاقة (Mastercard دوائر متداخلة حقيقية، VISA عريضة واضحة، ميزة)
function NetworkBadge({ network }) {
  if (network === 'Mastercard') {
    return (
      <svg
        width="34"
        height="22"
        viewBox="0 0 36 24"
        fill="none"
        style={{ flexShrink: 0 }}
        aria-label="Mastercard"
      >
        <circle cx="13" cy="12" r="9.5" fill="#EB001B" />
        <circle cx="23" cy="12" r="9.5" fill="#F79E1B" fillOpacity="0.92" />
        <path
          d="M18 5.8a9.4 9.4 0 0 1 2.9 6.2 9.4 9.4 0 0 1-2.9 6.2 9.4 9.4 0 0 1-2.9-6.2c0-2.4 1.1-4.5 2.9-6.2z"
          fill="#FF5F00"
        />
      </svg>
    );
  }

  if (network === 'VISA') {
    return (
      <span
        style={{
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontStyle: 'italic',
          fontWeight: 900,
          fontSize: '14px',
          letterSpacing: '1px',
          color: '#FFFFFF',
          textShadow: '0 1px 3px rgba(0,0,0,0.5)',
          lineHeight: 1,
          flexShrink: 0
        }}
      >
        VISA
      </span>
    );
  }

  if (network === 'ميزة' || network === 'Meeza') {
    return (
      <span
        style={{
          background: 'rgba(255,255,255,0.18)',
          border: '1px solid rgba(255,255,255,0.35)',
          borderRadius: '4px',
          padding: '2px 6px',
          fontSize: '11px',
          fontWeight: 800,
          color: '#FFFFFF',
          letterSpacing: '0.5px',
          flexShrink: 0
        }}
      >
        ميزة
      </span>
    );
  }

  return (
    <span
      className="card-network-badge"
      style={{
        fontSize: '11.5px',
        fontWeight: 700,
        color: '#FFFFFF',
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        flexShrink: 0
      }}
    >
      {network}
    </span>
  );
}

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

  // استخراج الهوية البصرية وشعار البنك أو المحفظة الإلكترونية الرسمية
  const meta = getBankOrWalletMeta(account?.name, account?.type);
  const cardStyle = meta?.cardTheme || 'card-theme-ahly';
  const cardNetwork = meta?.cardNetwork || 'VISA';
  const LogoComponent = meta?.logo;

  // توليد أرقام بطاقة واقعية
  const rawIdNum = String(account.opening || '4821').replace(/[^0-9]/g, '').padEnd(4, '7');
  const lastFour = rawIdNum.slice(-4);
  const cvv = String(Math.abs(Math.sin(Number(account.opening || 1)) * 900 + 100)).slice(0, 3);

  // استخراج مسمى توضيحي ذكي واحترافي بدون تكرار
  const cleanSubtitle = (() => {
    const accName = account?.name || '';
    const type = account?.type || '';

    // إذا كان نوع الحساب بنكي
    if (type === 'حساب بنكي' || type === 'bank') {
      if (
        accName.includes('بنك') ||
        accName.includes('الأهلي') ||
        accName.includes('اهلي') ||
        accName.includes('CIB') ||
        accName.includes('مصر') ||
        accName.includes('إسكندرية') ||
        accName.includes('قاهرة')
      ) {
        return 'حساب بنكي جاري';
      }
      return meta?.name || 'حساب بنكي';
    }

    // إذا كان محفظة إلكترونية
    if (type === 'محفظة إلكترونية' || type === 'محفظة' || type === 'wallet') {
      if (
        accName.includes('فودافون') ||
        accName.includes('كاش') ||
        accName.includes('اتصالات') ||
        accName.includes('أورنج') ||
        accName.includes('اورنج') ||
        accName.includes('وي') ||
        accName.includes('إنستاباي') ||
        accName.includes('انستاباي')
      ) {
        return 'محفظة إلكترونية ذكية';
      }
      return meta?.name || 'محفظة إلكترونية';
    }

    if (type === 'حساب توفير') return 'حساب ادخار وتوفير';
    if (type === 'بطاقة') return 'بطاقة ائتمانية';
    if (type === 'استثمار') return 'محفظة استثمارية';

    if (type === 'كاش' || type === 'cash') {
      return 'سيولة نقدية فورية';
    }

    return meta?.name || type || 'حساب نشط';
  })();

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
    // إذا ضغط المستخدم على زر تفاعلي داخلي لا نتدخل
    if (e.target.closest('.card-flip-btn') || e.target.closest('.card-return-btn')) return;

    if (isFlipped) {
      // عند النقر على ظهر البطاقة تعود فوراً للوجه الأمامي
      setIsFlipped(false);
      setRotate({ x: 0, y: 0 });
      playCardFlipSound();
      return;
    }

    if (allowFlip) {
      setIsFlipped(true);
      setRotate({ x: 0, y: 0 });
      playCardFlipSound();
    }
  };

  return (
    <div
      className="card-3d-scene"
      style={{
        perspective: '1200px'
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

          {/* الصف العلوي: الرقاقة الذهبية الذكية وشعار البنك وشعار الشبكة وزر القلب */}
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

            <div className="card-top-left-actions">
              {LogoComponent && (
                <div className="card-bank-logo-wrap">
                  <LogoComponent size={26} />
                </div>
              )}
              <NetworkBadge network={cardNetwork} />
              <button
                type="button"
                className="card-flip-btn"
                onClick={e => {
                  e.stopPropagation();
                  setIsFlipped(true);
                  playCardFlipSound();
                }}
                title="قلب البطاقة"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
              <span className="card-acc-name" title={account.name}>{account.name}</span>
              <span className="card-acc-type">{cleanSubtitle}</span>
            </div>
            <div className="card-masked-number">
              •••• {lastFour}
            </div>
          </div>
        </div>

        {/* ================= ظهر البطاقة الخلفي ثلاثي الأبعاد (Back Face) ================= */}
        <div className="card-face card-face-back">
          {/* شريط علوي أنيق مع زر القلب للرجوع للوجه الأمامي */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px 4px' }}>
            <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.6)', fontWeight: 700, letterSpacing: '0.5px' }}>SARFY VERIFIED CARD</span>
            <button
              type="button"
              className="card-flip-btn"
              onClick={e => {
                e.stopPropagation();
                setIsFlipped(false);
                playCardFlipSound();
              }}
              title="العودة للوجه الأمامي"
              aria-label="العودة للوجه الأمامي"
            >
              <Icon name="rotate" size={12} color="#FFFFFF" />
            </button>
          </div>

          {/* الشريط المغناطيسي الأسود */}
          <div className="card-magnetic-stripe" style={{ marginTop: 0 }}></div>

          {/* شريط التوقيع ومربع CVV */}
          <div className="card-back-details" style={{ padding: '10px 16px' }}>
            <div className="card-signature-panel">
              <div className="card-signature-lines">
                <span>AUTHORIZED SIGNATURE - NOT VALID UNLESS SIGNED</span>
              </div>
              <div className="card-cvv-box">{cvv}</div>
            </div>

            <div className="card-back-meta">
              <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>
                <div>IBAN: EG4200030000{lastFour}987654321</div>
                <div>Account ID: #{account.id}</div>
              </div>
              <div className="card-security-hologram">
                <span>SARFY</span>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: 6 }}>
              <button
                type="button"
                className="card-return-btn"
                onClick={e => {
                  e.stopPropagation();
                  setIsFlipped(false);
                  playCardFlipSound();
                }}
              >
                <Icon name="rotate" size={12} color="#FFFFFF" />
                <span>العودة للوجه الأمامي</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
