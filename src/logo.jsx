// Sarfy - Modern Luxury Fintech Logo
// شعار مالي عصري فاخر يدمج حرف "ص" في تصميم نقي مستوحى من كبرى المنصات المصرفية العالمية
import React from 'react';

export function SarfyLogo({ size = 44, animated = false, className = '' }) {
  const uniqueId = `sarfy_logo_${size}_${Math.random().toString(36).substr(2, 4)}`;

  return (
    <div
      className={`sarfy-logo-wrap ${animated ? 'pulse-glow' : ''} ${className}`}
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        filter: 'drop-shadow(0 6px 16px rgba(16, 185, 129, 0.35))'
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
          {/* خلفية الدرع الفاخر */}
          <linearGradient id={`${uniqueId}_bg`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0B132B" />
            <stop offset="50%" stopColor="#0A1D2D" />
            <stop offset="100%" stopColor="#042F2E" />
          </linearGradient>

          {/* إطار الدرع المتدرج */}
          <linearGradient id={`${uniqueId}_border`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="50%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>

          {/* تدرج الزمرد الأساسي لحرف الصاد */}
          <linearGradient id={`${uniqueId}_emeraldStroke`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="50%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          {/* تدرج الكاسة الانسيابية السفلى */}
          <linearGradient id={`${uniqueId}_cyanStroke`} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="50%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>

          {/* تدرج ماسة الذهب الفاخرة */}
          <linearGradient id={`${uniqueId}_goldDiamond`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFBEB" />
            <stop offset="40%" stopColor="#FCD34D" />
            <stop offset="80%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          {/* انعكاس زجاجي ناعم */}
          <linearGradient id={`${uniqueId}_shine`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 1. الدرع الخارجي الدائري الملموم بنعومة فائقة */}
        <rect
          x="4"
          y="4"
          width="72"
          height="72"
          rx="22"
          fill={`url(#${uniqueId}_bg)`}
          stroke={`url(#${uniqueId}_border)`}
          strokeWidth="1.5"
        />

        {/* لمعة زجاجية علوية انسيابية */}
        <path
          d="M 12 12 Q 40 6 68 12 Q 40 26 12 12 Z"
          fill={`url(#${uniqueId}_shine)`}
        />

        {/* 2. رأس حرف الصاد (قبة الصاد المصرفية الحديثة) */}
        <path
          d="M 23 43 C 23 30 35 23 48 23 C 62 23 66 30 66 37 C 66 44 58 47 46 47 L 20 47"
          stroke={`url(#${uniqueId}_emeraldStroke)`}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 3. كاسة حرف الصاد المتدفقة بانسيابية صاعدة */}
        <path
          d="M 20 47 C 20 57 30 65 43 65 C 53 65 60 59 62 52"
          stroke={`url(#${uniqueId}_cyanStroke)`}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 4. جوهرة الصاد (ماسة ذهبية هندسية فاخرة ترمز لقيمة وتنامي الأموال) */}
        <g transform="translate(46, 35)">
          <polygon
            points="0,-6.5 5.5,0 0,6.5 -5.5,0"
            fill={`url(#${uniqueId}_goldDiamond)`}
          />
          {/* وميض النور المركزي */}
          <circle cx="0" cy="0" r="1.8" fill="#FFFFFF" opacity="0.95" />
        </g>

        {/* 5. وميض في طرف صعود الكاسة */}
        <circle cx="62" cy="52" r="2.5" fill="#38BDF8" />
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
            إدارة وتتبع الأموال الذكية
          </span>
        )}
      </div>
    </div>
  );
}
