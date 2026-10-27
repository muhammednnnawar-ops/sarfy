// Sarfy - Futuristic 3D Cyber Emblem Logo
// شعار ثلاثي الأبعاد فائق الفخامة يدمج حرف "ص" في تصميم مصرفي سيبراني مشفر
import React from 'react';

export function SarfyLogo({ size = 40, animated = false, className = '' }) {
  const uniqueId = `sarfy_logo_${size}_${Math.random().toString(36).substr(2, 4)}`;

  return (
    <div
      className={`sarfy-logo-3d-wrap ${animated ? 'pulse-glow' : ''} ${className}`}
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        filter: 'drop-shadow(0 6px 14px rgba(16, 185, 129, 0.35))'
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* تدرج الدرع الخارجي ثلاثي الأبعاد */}
          <linearGradient id={`${uniqueId}_shield`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="50%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#064E3B" />
          </linearGradient>

          {/* تدرج الإطار الزمردي المتوهج */}
          <linearGradient id={`${uniqueId}_emeraldBorder`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="50%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>

          {/* تدرج الذهب الخاص بنقطة وقفل الأمان في بطن الصاد */}
          <linearGradient id={`${uniqueId}_goldGem`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>

          {/* تدرج حلقة الطاقة السيبرانية */}
          <linearGradient id={`${uniqueId}_cyanTrail`} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>

          {/* لمعة زجاجية علوية Reflection */}
          <linearGradient id={`${uniqueId}_glassShine`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 1. درع الحماية الأيزومتري ثلاثي الأبعاد */}
        <rect
          x="6"
          y="6"
          width="68"
          height="68"
          rx="20"
          fill={`url(#${uniqueId}_shield)`}
          stroke={`url(#${uniqueId}_emeraldBorder)`}
          strokeWidth="2"
        />

        {/* 2. شريط اللمعة الزجاجية العلوية */}
        <path
          d="M 12 12 Q 40 6 68 12 Q 40 28 12 12 Z"
          fill={`url(#${uniqueId}_glassShine)`}
        />

        {/* 3. حلقة أمان نيون داخلية */}
        <rect
          x="10"
          y="10"
          width="60"
          height="60"
          rx="16"
          fill="none"
          stroke="rgba(16, 185, 129, 0.15)"
          strokeWidth="1"
          strokeDasharray="4 3"
        />

        {/* 4. رأس حرف "ص" المجسم (قبة الصاد الأيزومترية) */}
        <path
          d="M 23 44 C 23 31 34 25 48 25 C 60 25 64 32 64 38 C 64 45 57 48 45 48 L 23 48"
          stroke={`url(#${uniqueId}_emeraldBorder)`}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* قلب القبة بلون زمردي أعمق */}
        <path
          d="M 28 44 C 28 35 36 29 48 29 C 56 29 59 34 59 38 C 59 42 54 44 45 44 Z"
          fill="#065F46"
          opacity="0.85"
        />

        {/* 5. نقطة وقفل الصاد الذهبي ثلاثي الأبعاد (جوهرة التشفير) */}
        <g transform="translate(46, 36.5)">
          <circle cx="0" cy="0" r="4.5" fill={`url(#${uniqueId}_goldGem)`} />
          {/* قفل ميكرو داخل النقطة */}
          <circle cx="0" cy="-0.5" r="1.8" fill="#1C1917" />
          <rect x="-1.4" y="-0.5" width="2.8" height="2.2" rx="0.6" fill="#1C1917" />
        </g>

        {/* 6. كاسة حرف "ص" الملتفة بانسيابية ثلاثية الأبعاد (Sweeping Cyber Tail) */}
        <path
          d="M 23 48 C 23 58 32 65 43 65 C 52 65 58 59 58 53"
          stroke={`url(#${uniqueId}_cyanTrail)`}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 7. نقطة ضوء متوهجة في طرف الكاسة */}
        <circle cx="58" cy="53" r="2.5" fill="#38BDF8" />
        <circle cx="58" cy="53" r="4" fill="none" stroke="#38BDF8" strokeWidth="1" opacity="0.6" />
      </svg>
    </div>
  );
}

// ويدجت هوية العلامة التجارية الكاملة (الشعار + اسم صرفي)
export function SarfyBrand({ size = 'md', subtitle = true }) {
  const iconSizes = { sm: 30, md: 38, lg: 48, xl: 60 };
  const iconSize = iconSizes[size] || 38;

  return (
    <div className={`sarfy-brand-block brand-size-${size}`} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <SarfyLogo size={iconSize} animated={true} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="sarfy-brand-title" style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: size === 'sm' ? 16 : size === 'lg' ? 24 : 19, letterSpacing: '-0.3px', color: 'var(--text-primary)' }}>
            صرفي
          </span>
          <span style={{ fontSize: 9.5, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: 'rgba(16, 185, 129, 0.15)', color: 'var(--emerald)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            PRO
          </span>
        </div>
        {subtitle && (
          <span className="sarfy-brand-tagline" style={{ fontSize: size === 'sm' ? 10 : 11, color: 'var(--text-muted)', fontWeight: 600 }}>
            إدارة الأموال المشفرة
          </span>
        )}
      </div>
    </div>
  );
}
