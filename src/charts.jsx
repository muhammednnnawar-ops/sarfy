// Sarfy - World-Class Next-Gen SVG Charts
// رسوم بيانية تفاعلية يدوية فائقة النقاء مستوحاة من Stripe و TradingView و Apple Health

import React, { useState } from 'react';
import { formatCurrency, formatNumber } from './data.js';

// 1. مسر أعمدة للدخل مقابل المصروفات (آخر 6 أشهر)
export function IncomeExpenseBarChart({ data, currency = 'ج.م' }) {
  const [tooltip, setTooltip] = useState(null);

  const chartData = (data || []).slice(-6);
  if (!chartData.length) {
    return <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد بيانات كافية</div>;
  }

  const maxVal = Math.max(
    ...chartData.map(d => Math.max(d.income || 0, d.expenses || 0)),
    1000
  );

  const height = 220;
  const padding = { top: 25, right: 20, bottom: 45, left: 20 };
  const chartHeight = height - padding.top - padding.bottom;
  const barWidth = 14;

  return (
    <div className="chart-container" style={{ position: 'relative', width: '100%' }}>
      <svg viewBox={`0 0 500 ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
        <defs>
          <linearGradient id="emeraldBarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--emerald)" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="coralBarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--coral)" />
            <stop offset="100%" stopColor="#E11D48" />
          </linearGradient>
        </defs>

        {/* خطوط الشبكة الأفقية الناعمة */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padding.top + chartHeight * (1 - ratio);
          return (
            <line
              key={i}
              x1={padding.left}
              y1={y}
              x2={500 - padding.right}
              y2={y}
              stroke="var(--border-subtle)"
              strokeDasharray="4 4"
              strokeWidth="1"
            />
          );
        })}

        {/* الأعمدة المزدوجة */}
        {chartData.map((d, idx) => {
          const groupCenter =
            padding.left +
            (idx + 0.5) * ((500 - padding.left - padding.right) / chartData.length);

          const incomeH = ((d.income || 0) / maxVal) * chartHeight;
          const expenseH = ((d.expenses || 0) / maxVal) * chartHeight;

          const incX = groupCenter - barWidth - 3;
          const incY = padding.top + chartHeight - incomeH;

          const expX = groupCenter + 3;
          const expY = padding.top + chartHeight - expenseH;

          return (
            <g key={idx}>
              {/* عمود الدخل (زمردي نيون) */}
              <rect
                x={incX}
                y={incY}
                width={barWidth}
                height={Math.max(3, incomeH)}
                rx="6"
                fill="url(#emeraldBarGrad)"
                style={{ cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
                onMouseEnter={() => {
                  setTooltip({
                    title: d.monthName,
                    text: `دخل مستلم: ${formatCurrency(d.income, currency)}`,
                    color: 'var(--emerald)',
                    x: groupCenter,
                    y: incY
                  });
                }}
                onMouseLeave={() => setTooltip(null)}
                onTouchStart={() =>
                  setTooltip({
                    title: d.monthName,
                    text: `دخل مستلم: ${formatCurrency(d.income, currency)}`,
                    color: 'var(--emerald)',
                    x: groupCenter,
                    y: incY
                  })
                }
              />

              {/* عمود المصروفات (كورال نيون) */}
              <rect
                x={expX}
                y={expY}
                width={barWidth}
                height={Math.max(3, expenseH)}
                rx="6"
                fill="url(#coralBarGrad)"
                style={{ cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
                onMouseEnter={() => {
                  setTooltip({
                    title: d.monthName,
                    text: `مصروفات: ${formatCurrency(d.expenses, currency)}`,
                    color: 'var(--coral)',
                    x: groupCenter,
                    y: expY
                  });
                }}
                onMouseLeave={() => setTooltip(null)}
                onTouchStart={() =>
                  setTooltip({
                    title: d.monthName,
                    text: `مصروفات: ${formatCurrency(d.expenses, currency)}`,
                    color: 'var(--coral)',
                    x: groupCenter,
                    y: expY
                  })
                }
              />

              {/* اسم الشهر أسفل الأعمدة */}
              <text
                x={groupCenter}
                y={height - 12}
                textAnchor="middle"
                fontSize="12"
                fontWeight="500"
                fill="var(--text-muted)"
                fontFamily="inherit"
              >
                {d.monthName ? d.monthName.split(' ')[0] : d.yearMonth}
              </text>
            </g>
          );
        })}
      </svg>

      {/* دليل الألوان السفلي */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 10 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--text-secondary)' }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--emerald)', boxShadow: 'var(--emerald-glow)' }}></span>
          الدخل المستلم
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--text-secondary)' }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--coral)', boxShadow: 'var(--coral-glow)' }}></span>
          المصروفات المدفوعة
        </span>
      </div>

      {/* Tooltip تفاعلي زجاجي */}
      {tooltip && (
        <div
          style={{
            position: 'absolute',
            top: 6,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--bg-card-solid)',
            border: '1px solid var(--border-glass)',
            color: 'var(--text-primary)',
            padding: '8px 16px',
            borderRadius: '10px',
            fontSize: '13px',
            pointerEvents: 'none',
            zIndex: 10,
            boxShadow: 'var(--shadow-md)',
            textAlign: 'center',
            backdropFilter: 'blur(16px)'
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 11.5, color: 'var(--text-muted)' }}>{tooltip.title}</div>
          <div style={{ color: tooltip.color, fontWeight: 700, marginTop: 2 }}>{tooltip.text}</div>
        </div>
      )}
    </div>
  );
}

// 2. مسر دائري لتوزيع المصروفات (Donut / Pie Chart)
export function ExpenseDonutChart({ expenses, currency = 'ج.م' }) {
  const [activeItem, setActiveItem] = useState(null);

  const catTotals = {};
  (expenses || []).forEach(exp => {
    if (exp.status === 'مدفوع') {
      const cat = exp.mainCat || 'أخرى';
      catTotals[cat] = (catTotals[cat] || 0) + (Number(exp.amount) || 0);
    }
  });

  const categories = Object.keys(catTotals);
  const total = categories.reduce((sum, c) => sum + catTotals[c], 0);

  if (total <= 0) {
    return <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد مصروفات مدفوعة لعرض توزيعها</div>;
  }

  // لوحة ألوان نيون سيبرانية حديثة
  const palette = [
    '#F43F5E', // Coral
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#6366F1', // Indigo
    '#06B6D4', // Cyan
    '#EC4899', // Pink
    '#8B5CF6', // Purple
    '#14B8A6'  // Teal
  ];

  let cumulativeAngle = 0;
  const slices = categories.map((cat, idx) => {
    const val = catTotals[cat];
    const fraction = val / total;
    const startAngle = cumulativeAngle;
    const angle = fraction * 360;
    cumulativeAngle += angle;
    const endAngle = cumulativeAngle;
    const color = palette[idx % palette.length];

    return {
      cat,
      val,
      fraction,
      percent: Math.round(fraction * 100),
      startAngle,
      endAngle,
      color
    };
  });

  const size = 190;
  const center = size / 2;
  const radius = 74;
  const innerRadius = 48;

  function polarToCartesian(cx, cy, r, angleInDegrees) {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: cx + r * Math.cos(angleInRadians),
      y: cy + r * Math.sin(angleInRadians)
    };
  }

  function describeDonutSlice(cx, cy, r, ir, startAngle, endAngle) {
    const isFullCircle = endAngle - startAngle >= 359.99;
    const adjustedEnd = isFullCircle ? startAngle + 359.99 : endAngle;

    const startOuter = polarToCartesian(cx, cy, r, adjustedEnd);
    const endOuter = polarToCartesian(cx, cy, r, startAngle);
    const startInner = polarToCartesian(cx, cy, ir, startAngle);
    const endInner = polarToCartesian(cx, cy, ir, adjustedEnd);

    const largeArcFlag = adjustedEnd - startAngle <= 180 ? '0' : '1';

    return [
      `M ${startOuter.x} ${startOuter.y}`,
      `A ${r} ${r} 0 ${largeArcFlag} 0 ${endOuter.x} ${endOuter.y}`,
      `L ${startInner.x} ${startInner.y}`,
      `A ${ir} ${ir} 0 ${largeArcFlag} 1 ${endInner.x} ${endInner.y}`,
      'Z'
    ].join(' ');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', height: '100%' }}>
          {slices.map((slice, i) => (
            <path
              key={i}
              d={describeDonutSlice(center, center, radius, innerRadius, slice.startAngle, slice.endAngle)}
              fill={slice.color}
              stroke="var(--bg-card-solid)"
              strokeWidth="2.5"
              style={{
                cursor: 'pointer',
                opacity: activeItem && activeItem.cat !== slice.cat ? 0.45 : 1,
                transform: activeItem && activeItem.cat === slice.cat ? 'scale(1.03)' : 'scale(1)',
                transformOrigin: `${center}px ${center}px`,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={() => setActiveItem(slice)}
              onMouseLeave={() => setActiveItem(null)}
              onTouchStart={() => setActiveItem(slice)}
            />
          ))}
          {/* النص الأوسط */}
          <text
            x={center}
            y={center - 5}
            textAnchor="middle"
            fontSize="11"
            fill="var(--text-muted)"
            fontFamily="inherit"
          >
            الإجمالي
          </text>
          <text
            x={center}
            y={center + 14}
            textAnchor="middle"
            fontSize="14"
            fontWeight="800"
            fill="var(--text-primary)"
            fontFamily="var(--font-numeric)"
          >
            {formatNumber(total)}
          </text>
        </svg>
      </div>

      {/* تفاصيل العنصر النشط */}
      <div style={{ margin: '10px 0 6px', minHeight: 24, textAlign: 'center' }}>
        {activeItem ? (
          <span style={{ fontSize: 13.5, fontWeight: 700, color: activeItem.color }}>
            {activeItem.cat}: {formatCurrency(activeItem.val, currency)} ({activeItem.percent}%)
          </span>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            المس أي شريحة لمعرفة التفاصيل
          </span>
        )}
      </div>

      {/* قائمة وسيلة الإيضاح */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
          gap: '8px 12px',
          width: '100%',
          marginTop: 6
        }}
      >
        {slices.slice(0, 8).map((s, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12.5,
              cursor: 'pointer',
              padding: '4px 6px',
              borderRadius: 6,
              background: activeItem && activeItem.cat === s.cat ? 'var(--bg-elevated)' : 'transparent',
              transition: 'background 0.15s ease'
            }}
            onClick={() => setActiveItem(s)}
          >
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: s.color, flexShrink: 0, boxShadow: `0 0 8px ${s.color}` }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
              {s.cat} ({s.percent}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 3. أعمدة أفقية لأعلى 8 تصنيفات إنفاقًا
export function TopExpenseHorizontalBarChart({ expenses, currency = 'ج.م' }) {
  const catTotals = {};
  (expenses || []).forEach(exp => {
    if (exp.status === 'مدفوع') {
      const cat = exp.mainCat || 'أخرى';
      catTotals[cat] = (catTotals[cat] || 0) + (Number(exp.amount) || 0);
    }
  });

  const sorted = Object.entries(catTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  if (!sorted.length) {
    return <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد مصروفات مدفوعة</div>;
  }

  const maxVal = sorted[0][1] || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {sorted.map(([cat, amt], idx) => {
        const percent = Math.round((amt / maxVal) * 100);
        return (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cat}</span>
              <span style={{ fontWeight: 700, color: 'var(--coral)', direction: 'ltr', fontFamily: 'var(--font-numeric)' }}>
                {formatCurrency(amt, currency)}
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: 8,
                background: 'var(--bg-elevated)',
                borderRadius: 4,
                overflow: 'hidden',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div
                style={{
                  width: `${percent}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--coral) 0%, #E11D48 100%)',
                  borderRadius: 4,
                  boxShadow: 'var(--coral-glow)',
                  transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// 4. خط لتطور الرصيد (TradingView / Apple Style Line Chart)
export function BalanceLineChart({ data, currency = 'ج.م' }) {
  const [tooltip, setTooltip] = useState(null);

  const chartData = (data || []).slice(-8);
  if (!chartData.length) return null;

  const balances = chartData.map(d => d.endBalance || 0);
  const minBal = Math.min(...balances, 0);
  const maxBal = Math.max(...balances, 1000);
  const range = maxBal - minBal || 1;

  const width = 500;
  const height = 190;
  const padding = { top: 20, right: 20, bottom: 35, left: 20 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = chartData.map((d, idx) => {
    const x = padding.left + (idx / (chartData.length - 1 || 1)) * chartW;
    const y = padding.top + chartH - ((d.endBalance - minBal) / range) * chartH;
    return { x, y, data: d };
  });

  const pathD = points.reduce(
    (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`,
    ''
  );

  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
        <defs>
          <linearGradient id="balanceAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--indigo)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--indigo)" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* المساحة المعبأة تحت المنحنى */}
        <path d={areaD} fill="url(#balanceAreaGrad)" />

        {/* المنحنى الرئيسي المتوهج */}
        <path
          d={pathD}
          fill="none"
          stroke="var(--indigo)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: 'drop-shadow(0 0 6px var(--indigo))' }}
        />

        {/* نقاط البيانات */}
        {points.map((pt, i) => (
          <g key={i}>
            <circle
              cx={pt.x}
              cy={pt.y}
              r="5"
              fill="var(--bg-card-solid)"
              stroke="var(--indigo)"
              strokeWidth="2.5"
              style={{ cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
              onMouseEnter={() =>
                setTooltip({
                  x: pt.x,
                  y: pt.y,
                  month: pt.data.monthName,
                  bal: pt.data.endBalance
                })
              }
              onMouseLeave={() => setTooltip(null)}
              onTouchStart={() =>
                setTooltip({
                  x: pt.x,
                  y: pt.y,
                  month: pt.data.monthName,
                  bal: pt.data.endBalance
                })
              }
            />
            {/* عنوان الشهر */}
            <text
              x={pt.x}
              y={height - 8}
              textAnchor="middle"
              fontSize="11"
              fill="var(--text-muted)"
              fontWeight="500"
            >
              {pt.data.monthName ? pt.data.monthName.split(' ')[0] : pt.data.yearMonth}
            </text>
          </g>
        ))}
      </svg>

      {/* Tooltip زجاجي */}
      {tooltip && (
        <div
          style={{
            position: 'absolute',
            top: 4,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--bg-card-solid)',
            border: '1px solid var(--indigo-border)',
            color: 'var(--text-primary)',
            padding: '6px 14px',
            borderRadius: 10,
            fontSize: 12.5,
            zIndex: 10,
            pointerEvents: 'none',
            textAlign: 'center',
            boxShadow: 'var(--indigo-glow)',
            backdropFilter: 'blur(16px)'
          }}
        >
          <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{tooltip.month}</div>
          <div style={{ fontWeight: 800, color: 'var(--indigo)', marginTop: 2, fontFamily: 'var(--font-numeric)' }}>
            رصيد النهاية: {formatCurrency(tooltip.bal, currency)}
          </div>
        </div>
      )}
    </div>
  );
}

// 5. مسر نصف دائري نيون للأهداف المالية (Radial Arc Meter) مستوحى من Moneed و Fingoals
export function RadialArcMeter({
  percent = 68,
  label = 'صندوق الطوارئ',
  current = 17000,
  target = 25000,
  currency = 'ج.م',
  hideAmounts = false
}) {
  const cleanPercent = Math.min(100, Math.max(0, Math.round(percent)));
  const cx = 130;
  const cy = 114;
  const radius = 84;
  const stroke = 9.5;
  const arcLength = Math.PI * radius; // ~263.89
  const strokeDashoffset = arcLength * (1 - cleanPercent / 100);

  // حساب دقيق لموقع نقطة النهاية المتوهجة (مطابقة 100% لنهاية المسار الملون)
  const t = cleanPercent / 100;
  const dotX = cx - radius * Math.cos(t * Math.PI);
  const dotY = cy - radius * Math.sin(t * Math.PI);

  const startX = cx - radius; // 46
  const endX = cx + radius;   // 214

  // تحجيم خط المبلغ بذكاء لمنع أي تداخل مع القوس مع توفير هامش أمان متسع (> 24px)
  const numStr = String(Math.round(current));
  const amountFontSize = numStr.length >= 7 ? 16.5 : numStr.length >= 6 ? 18 : 20;

  return (
    <div
      className="radial-arc-meter-wrap"
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 270,
        margin: '0 auto',
        textAlign: 'center'
      }}
    >
      <svg
        className="radial-arc-svg"
        viewBox="0 0 260 126"
        style={{ width: '100%', overflow: 'visible', display: 'block' }}
      >
        <defs>
          <linearGradient id="arcMeterGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="50%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>
          <filter id="arcGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#10B981" floodOpacity="0.5" />
          </filter>
          <filter id="dotGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#38BDF8" floodOpacity="0.8" />
          </filter>
        </defs>

        {/* المسار الخلفي الرمادي الباهت */}
        <path
          d={`M ${startX} ${cy} A ${radius} ${radius} 0 0 1 ${endX} ${cy}`}
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />

        {/* مسار النيون المتوهج المكتمل */}
        <path
          d={`M ${startX} ${cy} A ${radius} ${radius} 0 0 1 ${endX} ${cy}`}
          fill="none"
          stroke="url(#arcMeterGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={arcLength}
          strokeDashoffset={strokeDashoffset}
          filter="url(#arcGlow)"
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />

        {/* نقطة النهاية المتوهجة المضيئة المطابقة تماماً لنهاية القوس */}
        {cleanPercent > 1 && (
          <g filter="url(#dotGlow)">
            <circle
              cx={dotX}
              cy={dotY}
              r={stroke / 2 + 1.5}
              fill="#FFFFFF"
              stroke="#10B981"
              strokeWidth="2"
              style={{ transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
            />
            <circle
              cx={dotX}
              cy={dotY}
              r={stroke / 2 - 1.5}
              fill="#06B6D4"
            />
          </g>
        )}
      </svg>

      {/* المحتوى في قلب القوس محاذى لأسفل مع أول القوس لتوفير تناسق بصري فائق */}
      <div
        style={{
          position: 'absolute',
          bottom: '3px',
          left: '20px',
          right: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          textAlign: 'center',
          pointerEvents: 'none'
        }}
      >
        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 2 }}>
          {label}
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'baseline',
            justifyContent: 'center',
            gap: 5,
            fontFamily: 'var(--font-numeric)',
            fontWeight: 900,
            color: 'var(--text-primary)',
            direction: 'ltr',
            margin: '2px 0 3px'
          }}
        >
          {hideAmounts ? (
            <span style={{ fontSize: 18, letterSpacing: '2px' }}>••••••</span>
          ) : (
            <>
              <span style={{ fontSize: amountFontSize, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.3px', lineHeight: 1 }}>
                {formatNumber(current)}
              </span>
              <span style={{ fontSize: 11.5, color: 'var(--emerald)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                {currency}
              </span>
            </>
          )}
        </div>

        <div style={{ fontSize: 11, color: 'var(--emerald)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <span style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '1px 6px', borderRadius: 6 }}>{cleanPercent}%</span>
          <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: 10.5 }}>
            من {hideAmounts ? '••••••' : formatCurrency(target, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}

// 6. منحنى بياني نيون مدمج في كارت الهيرو (Hero Sparkline Wave - Lumin Reference Style)
export function HeroSparkline({ data = [28500, 31000, 32800, 37400, 41200, 44950], currency = 'ج.م' }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const width = 500;
  const height = 90;
  const paddingX = 16;
  const paddingY = 14;

  const minVal = Math.min(...data) * 0.95;
  const maxVal = Math.max(...data) * 1.05;
  const range = maxVal - minVal || 1;

  // تحويل النقاط إلى إحداثيات X, Y
  const points = data.map((val, i) => {
    const x = paddingX + (i / (data.length - 1)) * (width - paddingX * 2);
    const y = height - paddingY - ((val - minVal) / range) * (height - paddingY * 2);
    return { x, y, val };
  });

  // حساب مسار Bézier ناعم ومستمر
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  // مسار التعبئة المتدرجة للأسفل
  const fillD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <div className="hero-sparkline-wrap" style={{ position: 'relative', width: '100%', height: 90, marginTop: 10 }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: '100%', overflow: 'visible' }}
        preserveAspectRatio="none"
      >
        <defs>
          {/* تدرج خط النيون */}
          <linearGradient id="heroSparkStroke" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>

          {/* تدرج هالة الخلفية */}
          <linearGradient id="heroSparkFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
            <stop offset="60%" stopColor="#06B6D4" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
          </linearGradient>

          {/* فلتر التوهج النيون */}
          <filter id="sparkGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#10B981" floodOpacity="0.6" />
          </filter>
        </defs>

        {/* مساحة التعبئة */}
        <path d={fillD} fill="url(#heroSparkFill)" />

        {/* خط المسار الرئيسي المتوهج */}
        <path
          d={pathD}
          fill="none"
          stroke="url(#heroSparkStroke)"
          strokeWidth="3.2"
          strokeLinecap="round"
          filter="url(#sparkGlow)"
        />

        {/* نقاط المسار التفاعلية */}
        {points.map((pt, i) => {
          const isLast = i === points.length - 1;
          const isHovered = hoverIndex === i;
          return (
            <g
              key={i}
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isHovered ? 6 : isLast ? 5 : 3.5}
                fill={isLast || isHovered ? '#FFFFFF' : '#10B981'}
                stroke="#05070D"
                strokeWidth={isHovered ? 3 : 2}
                filter={isLast || isHovered ? 'drop-shadow(0 0 8px #10B981)' : undefined}
              />
            </g>
          );
        })}
      </svg>

      {/* شارة القيمة عند التمرير */}
      {hoverIndex !== null && (
        <div
          style={{
            position: 'absolute',
            top: points[hoverIndex].y - 32,
            left: `${(points[hoverIndex].x / width) * 100}%`,
            transform: 'translateX(-50%)',
            background: 'rgba(9, 13, 24, 0.95)',
            border: '1px solid var(--emerald-border)',
            padding: '3px 9px',
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 800,
            color: 'var(--emerald)',
            whiteSpace: 'nowrap',
            boxShadow: 'var(--shadow-sm)',
            pointerEvents: 'none'
          }}
        >
          {formatCurrency(points[hoverIndex].val, currency)}
        </div>
      )}
    </div>
  );
}
