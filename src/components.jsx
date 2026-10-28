// Sarfy - Reusable Core Components
// شارات الأختام، شريط التنبيهات، القائمة الجانبية، والنافذة السريعة والنوافذ المنبثقة

import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './icons.jsx';
import { SarfyLogo } from './logo.jsx';
import { formatCurrency, formatNumber, DROPDOWNS, getRelativeDate, STREET_PRESETS, getUserInitials } from './data.js';

// مكون الأفاتار الشخصي الذكي (يعرض الصورة الشخصية المخصصة أو أيقونة مستخدم أحادية اللون)
export function UserAvatar({
  userProfile,
  size = 36,
  fontSize = 13,
  className = '',
  style = {},
  onClick = null
}) {
  const avatarImg = userProfile?.avatarImage || userProfile?.avatar_image || (() => {
    try {
      return localStorage.getItem('sarfy_user_avatar') || JSON.parse(localStorage.getItem('sarfy_user_meta') || '{}').avatarImage;
    } catch { return null; }
  })();
  const name = userProfile?.fullName || userProfile?.full_name || '';

  if (avatarImg) {
    return (
      <div
        className={`user-avatar-wrap ${className}`}
        onClick={onClick}
        style={{
          width: size,
          height: size,
          minWidth: size,
          borderRadius: '50%',
          overflow: 'hidden',
          flexShrink: 0,
          border: '2px solid var(--emerald)',
          boxShadow: '0 0 10px rgba(16, 185, 129, 0.25)',
          cursor: onClick ? 'pointer' : 'default',
          background: 'var(--bg-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...style
        }}
      >
        <img
          src={avatarImg}
          alt={name || 'صورة المستخدم'}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            borderRadius: '50%'
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`user-mini-avatar ${className}`}
      onClick={onClick}
      style={{
        width: size,
        height: size,
        minWidth: size,
        borderRadius: '50%',
        fontSize: fontSize,
        fontWeight: 800,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #059669 0%, #0D9488 100%)',
        color: '#FFFFFF',
        border: '2px solid rgba(16, 185, 129, 0.4)',
        boxShadow: '0 0 10px rgba(16, 185, 129, 0.2)',
        cursor: onClick ? 'pointer' : 'default',
        ...style
      }}
    >
      <Icon name="user" size={Math.round(size * 0.55)} color="#FFFFFF" />
    </div>
  );
}

// نافذة متطورة لقص وتوسيط الصورة الشخصية داخل الدائرة (Interactive Drag, Pan & Zoom Avatar Cropper)
export function AvatarCropModal({
  isOpen,
  imageSrc,
  onClose,
  onSave,
  onChangeImage
}) {
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [imgNaturalSize, setImgNaturalSize] = useState({ width: 1, height: 1 });
  const [imgLoaded, setImgLoaded] = useState(false);

  const dragStartRef = useRef({ x: 0, y: 0 });

  const stageSize = 280;
  const circleDiameter = 200;

  useEffect(() => {
    if (!imageSrc || !isOpen) {
      setZoom(1);
      setPanX(0);
      setPanY(0);
      setImgLoaded(false);
      return;
    }
    const img = new Image();
    img.onload = () => {
      setImgNaturalSize({
        width: img.naturalWidth || img.width || 1,
        height: img.naturalHeight || img.height || 1
      });
      setImgLoaded(true);
      setZoom(1);
      setPanX(0);
      setPanY(0);
    };
    img.src = imageSrc;
  }, [imageSrc, isOpen]);

  if (!isOpen || !imageSrc) return null;

  const baseScale = Math.max(
    circleDiameter / imgNaturalSize.width,
    circleDiameter / imgNaturalSize.height
  );
  const currentScale = baseScale * zoom;
  const renderedWidth = imgNaturalSize.width * currentScale;
  const renderedHeight = imgNaturalSize.height * currentScale;

  // سحب بالفأرة
  const handleMouseDown = e => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - panX, y: e.clientY - panY };
  };

  const handleMouseMove = e => {
    if (!isDragging) return;
    setPanX(e.clientX - dragStartRef.current.x);
    setPanY(e.clientY - dragStartRef.current.y);
  };

  const handleMouseUp = () => setIsDragging(false);

  // سحب باللمس للهواتف
  const handleTouchStart = e => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX - panX,
        y: e.touches[0].clientY - panY
      };
    }
  };

  const handleTouchMove = e => {
    if (!isDragging || e.touches.length !== 1) return;
    setPanX(e.touches[0].clientX - dragStartRef.current.x);
    setPanY(e.touches[0].clientY - dragStartRef.current.y);
  };

  const handleTouchEnd = () => setIsDragging(false);

  // تصدير الصورة المقصوصة بدقة عالية على Canvas
  const handleApplyCrop = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const img = new Image();
    img.onload = () => {
      const scaleRatio = 256 / circleDiameter;
      const finalW = imgNaturalSize.width * currentScale * scaleRatio;
      const finalH = imgNaturalSize.height * currentScale * scaleRatio;
      const finalX = (256 / 2) - (finalW / 2) + (panX * scaleRatio);
      const finalY = (256 / 2) - (finalH / 2) + (panY * scaleRatio);

      ctx.drawImage(img, finalX, finalY, finalW, finalH);
      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
      onSave(croppedDataUrl);
    };
    img.src = imageSrc;
  };

  return (
    <div className="crop-modal-overlay" onClick={onClose}>
      <div className="crop-modal-dialog" onClick={e => e.stopPropagation()}>
        {/* رأس النافذة */}
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
              ضبط وتوسيط صورتك الشخصية
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
              اسحب الصورة داخل الدائرة لتوسيط وجهك بدقة
            </p>
          </div>
          <button className="btn-icon-subtle" onClick={onClose} title="إلغاء">
            <Icon name="close" size={16} />
          </button>
        </div>

        {/* مساحة السحب والتحريك التفاعلية */}
        <div
          className="crop-stage-container"
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {imgLoaded && (
            <img
              src={imageSrc}
              alt="معاينة القص"
              draggable={false}
              style={{
                position: 'absolute',
                left: `calc(50% + ${panX}px)`,
                top: `calc(50% + ${panY}px)`,
                transform: 'translate(-50%, -50%)',
                width: `${renderedWidth}px`,
                height: `${renderedHeight}px`,
                maxWidth: 'none',
                maxHeight: 'none',
                userSelect: 'none',
                pointerEvents: 'none'
              }}
            />
          )}

          {/* القناع الدائري الداكن مع حدود زمردية وخطوط إرشادية خفيفة */}
          <div className="crop-mask-circle">
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 20,
              height: 20,
              pointerEvents: 'none',
              opacity: 0.3
            }}>
              <div style={{ position: 'absolute', top: 9, left: 0, right: 0, height: 2, background: 'var(--emerald)' }}></div>
              <div style={{ position: 'absolute', left: 9, top: 0, bottom: 0, width: 2, background: 'var(--emerald)' }}></div>
            </div>
          </div>
        </div>

        {/* شريط التحكم بالتقريب Zoom */}
        <div style={{ width: '100%', marginTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon name="search" size={13} />
              <span>التحكم في التقريب (Zoom):</span>
            </span>
            <span style={{ fontWeight: 800, color: 'var(--emerald)', fontFamily: 'var(--font-numeric)' }}>{zoom.toFixed(1)}x</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => setZoom(prev => Math.max(1, prev - 0.15))}
              style={{ padding: '6px 12px', fontSize: 13 }}
              title="تصغير"
              aria-label="تصغير"
            >
              <Icon name="minus" size={13} />
            </button>
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={e => setZoom(parseFloat(e.target.value))}
              className="crop-zoom-slider"
            />
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => setZoom(prev => Math.min(3, prev + 0.15))}
              style={{ padding: '6px 12px', fontSize: 13 }}
              title="تكبير"
              aria-label="تكبير"
            >
              <Icon name="plus" size={13} />
            </button>
          </div>
        </div>

        {/* زر إعادة التوسيط السريع */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: 8 }}>
          <button
            type="button"
            className="btn-link"
            onClick={() => { setPanX(0); setPanY(0); setZoom(1); }}
            style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Icon name="rotate" size={13} />
            <span>إعادة ضبط الموضع والتقريب للوسط</span>
          </button>
        </div>

        {/* أزرار الإجراءات في الأسفل */}
        <div style={{ width: '100%', display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={handleApplyCrop}
            style={{ flex: 1, minWidth: 140, justifyContent: 'center', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Icon name="check" size={15} />
            <span>حفظ وتطبيق الصورة</span>
          </button>
          {onChangeImage && (
            <button
              type="button"
              className="btn-secondary"
              onClick={onChangeImage}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              title="اختيار ملف صورة آخر من جهازك"
            >
              <Icon name="camera" size={14} />
              <span>اختيار صورة أخرى</span>
            </button>
          )}
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

// 1. شارة الحالة بتصميم فينتك عصري فاخر (Modern Fintech Status Pill)
export function StatusBadge({ status }) {
  if (!status) return null;

  // تصنيف الحالات وربطها بالأيقونات والألوان الفاخرة
  const greenStatuses = ['مستلم', 'مدفوع', 'مكتمل', 'نشط', 'جاري', 'مؤكد', 'فعلي'];
  const yellowStatuses = ['متوقع', 'مستحق', 'قادم', 'محتمل', 'مدفوع جزئيًا'];
  const redStatuses = ['ملغي', 'متأخر'];
  const navyStatuses = ['مؤجل', 'متوقف'];

  let type = 'navy';
  if (greenStatuses.includes(status)) type = 'green';
  else if (yellowStatuses.includes(status)) type = 'yellow';
  else if (redStatuses.includes(status)) type = 'red';
  else if (navyStatuses.includes(status)) type = 'navy';

  return (
    <span className={`fintech-pill pill-${type}`} title={status}>
      {/* نقطة مضيئة ناعمة Micro LED Glow */}
      <span className="pill-dot"></span>

      {/* أيقونة مصغرة فائقة النقاء حسب نوع الحالة */}
      {type === 'green' && (
        <svg className="pill-icon" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="2.5 6 4.8 8.5 9.5 3.5" />
        </svg>
      )}

      {type === 'yellow' && (
        <svg className="pill-icon" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="6" r="4.5" />
          <polyline points="6 3.5 6 6 7.5 7" />
        </svg>
      )}

      {type === 'red' && (
        <svg className="pill-icon" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="6" r="4.5" />
          <line x1="6" y1="4" x2="6" y2="6.5" />
          <circle cx="6" cy="8.2" r="0.5" fill="currentColor" />
        </svg>
      )}

      {type === 'navy' && (
        <svg className="pill-icon" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="6" r="4.5" />
          <line x1="4.5" y1="6" x2="7.5" y2="6" />
        </svg>
      )}

      <span className="pill-text">{status}</span>
    </span>
  );
}

// 2. بانر التنبيهات أعلى لوحة التحكم
export function AlertsBanner({ alerts }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="alerts-banner-card">
      <div className="alerts-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="alert" size={18} color="var(--rust)" />
          <span style={{ fontWeight: 700, fontSize: 14 }}>
            يحتاج انتباهك ({alerts.length})
          </span>
        </div>
      </div>
      <div className="alerts-list">
        {alerts.map(alert => (
          <div
            key={alert.id}
            className={`alert-item ${alert.type === 'red' ? 'alert-red' : 'alert-yellow'}`}
          >
            <div style={{ fontWeight: 600, fontSize: 13 }}>{alert.title}</div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>{alert.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 3. شريط التنقل العلوي والقائمة الجانبية
export function AppLayout({
  activePage,
  setActivePage,
  alertsCount,
  children,
  onOpenQuickAdd,
  theme = 'dark',
  onToggleTheme,
  hasPin = false,
  onLockNow,
  userProfile = null,
  onLogout,
  backendStatus = null,
  lastSyncedAt = null,
  onManualSync = null,
  syncInProgress = false,
  syncNotice = null
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // منع التمرير الخلفي عند فتح القائمة على الهواتف لمنع الاهتزاز والتشوه
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [mobileMenuOpen]);

  // تحديد صلاحية المالك أو المشرف
  const isOwnerOrAdmin = userProfile?.role === 'owner' || userProfile?.role === 'admin';

  // تنظيم القائمة في أقسام مصرفية عصرية ومرتبة مع فصل صلاحية المالك
  const menuGroups = [
    {
      title: 'الرئيسية والمعاملات',
      items: [
        { id: 'dashboard', label: 'لوحة التحكم', icon: 'dashboard', badge: alertsCount },
        { id: 'accounts', label: 'المحافظ والحسابات', icon: 'accounts' },
        { id: 'assets', label: 'الأصول والممتلكات', icon: 'assets' },
        { id: 'expenses', label: 'سجل المصروفات', icon: 'expenses' },
        { id: 'income', label: 'سجل الدخل', icon: 'income' },
        { id: 'transfers', label: 'التحويلات المالية', icon: 'transfers' }
      ]
    },
    {
      title: 'الالتزامات والتخطيط',
      items: [
        { id: 'debts', label: 'الديون والمستحقات', icon: 'debts' },
        { id: 'subscriptions', label: 'الاشتراكات الدورية', icon: 'subscriptions' },
        { id: 'upcoming', label: 'الالتزامات القادمة', icon: 'upcoming' },
        { id: 'expectedIncome', label: 'الدخل المتوقع', icon: 'expectedIncome' },
        { id: 'goals', label: 'الأهداف المالية', icon: 'goals' }
      ]
    },
    {
      title: 'التقارير والإعدادات',
      items: [
        { id: 'reports', label: 'التقارير المالية', icon: 'reports' },
        { id: 'settings', label: 'الإعدادات والأمان', icon: 'settings' }
      ]
    },
    ...(isOwnerOrAdmin ? [{
      title: 'إدارة المنصة (المالك)',
      items: [
        { id: 'admin', label: 'إدارة التطبيق والعملاء', icon: 'users', badge: 0 }
      ]
    }] : [])
  ];

  // قائمة مفرودة للاستخدام المباشر
  const menuItems = menuGroups.flatMap(g => g.items);
  const currentPageObj = menuItems.find(m => m.id === activePage) || menuItems[0];
  const isSecondaryPage = !['dashboard', 'expenses', 'income', 'accounts'].includes(activePage);

  return (
    <div className="app-container">
      {/* الشريط الجانبي للشاشات الكبيرة (> 980px) بتنظيم أقسام واضح وأنيق */}
      <aside className="desktop-sidebar">
        <div className="sidebar-brand">
          <SarfyLogo size={30} animated={true} />
          <div className="brand-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="brand-name">صرفي</span>
              <span style={{ fontSize: 9.5, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: 'rgba(16, 185, 129, 0.15)', color: 'var(--emerald)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>PRO</span>
            </div>
            <span className="brand-sub">إدارة وتتبع الأموال الذكية</span>
          </div>
        </div>

        {/* بطاقة المستخدم الشخصية في الشريط الجانبي (تظهر الرتبة للمالك والمدير فقط دون كتابة عميل المنصة) */}
        {userProfile && (
          <div className="sidebar-user-card" onClick={() => setActivePage('settings')} style={{ cursor: 'pointer' }} title="انقر لإدارة الملف الشخصي والصورة">
            <UserAvatar userProfile={userProfile} size={38} fontSize={14} />
            <div className="user-mini-info">
              <div className="user-mini-name">{userProfile.fullName || 'المستخدم'}</div>
              {(userProfile.role === 'owner' || userProfile.role === 'admin') && (
                <div className="user-mini-status">
                  {userProfile.role === 'owner' ? 'مالك التطبيق' : 'مدير النظام'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* القائمة الجانبية المنظمة في مجموعات واضحة ومنسقة */}
        <nav className="sidebar-nav">
          {menuGroups.map(group => (
            <div key={group.title} className="sidebar-group">
              <div className="sidebar-group-title">{group.title}</div>
              <div className="sidebar-group-items">
                {group.items.map(item => (
                  <button
                    key={item.id}
                    className={`nav-link ${activePage === item.id ? 'active' : ''}`}
                    onClick={() => setActivePage(item.id)}
                  >
                    <Icon name={item.icon} size={17} />
                    <span className="nav-label">{item.label}</span>
                    {item.badge > 0 && (
                      <span className="nav-badge-alert">{item.badge}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 10 }}>
            {/* زر تبديل الوضع الليلي / الفاتح */}
            <button
              className="theme-toggle-btn"
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع المظلم'}
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
              <span style={{ fontSize: 12 }}>{theme === 'dark' ? 'نهاري' : 'ليلي'}</span>
            </button>

            {/* زر القفل السريع إن كان الرمز السري مفعل */}
            {hasPin && (
              <button
                className="lock-quick-btn"
                onClick={onLockNow}
                title="قفل التطبيق الآن"
              >
                <Icon name="lock" size={15} />
                <span style={{ fontSize: 12 }}>قفل</span>
              </button>
            )}

            {/* زر تسجيل الخروج / التبديل */}
            {onLogout && (
              <button
                className="btn-icon-subtle"
                onClick={onLogout}
                title="تسجيل الخروج / تبديل الحساب"
              >
                <Icon name="logout" size={15} />
              </button>
            )}
          </div>

          <div style={{ fontSize: 11, color: 'var(--ink-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <Icon name="shield" size={13} color="var(--emerald)" />
            <span>حماية متكاملة للحساب</span>
          </div>

          {/* شارة حالة قاعدة البيانات MySQL والمزامنة اللحظية للأجهزة */}
          <div style={{
            marginTop: 8,
            padding: '8px 10px',
            borderRadius: 8,
            background: backendStatus?.connected ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
            border: backendStatus?.connected ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(245, 158, 11, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4
          }} title={backendStatus?.message || ''}>
            <div style={{
              fontSize: 11,
              fontWeight: 600,
              color: backendStatus?.connected ? 'var(--emerald)' : 'var(--amber)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 5
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: backendStatus?.connected ? '#10b981' : '#f59e0b',
                  boxShadow: backendStatus?.connected ? '0 0 6px #10b981' : 'none'
                }}></span>
                <span>{backendStatus?.connected ? 'متصل الآن' : 'غير متصل'}</span>
              </div>
              {onManualSync && (
                <button
                  type="button"
                  onClick={onManualSync}
                  disabled={syncInProgress}
                  title="تحديث ومزامنة فورية الآن عبر AJAX"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--emerald)',
                    cursor: 'pointer',
                    padding: '2px 4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Icon name="refresh" size={13} className={syncInProgress ? 'spin-anim' : ''} />
                </button>
              )}
            </div>
            {lastSyncedAt && (
              <span style={{ fontSize: 9.5, color: 'var(--ink-faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                آخر مزامنة: {lastSyncedAt}
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* القائمة الجانبية المنزلقة للموبايل Drawer بتصميم iOS Glassmorphism الفاخر */}
      {mobileMenuOpen && (
        <div
          className="mobile-drawer-overlay"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="mobile-drawer"
            onClick={e => e.stopPropagation()}
          >
            <div className="drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <SarfyLogo size={34} animated={true} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 800, fontSize: 16 }}>صرفي</span>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 4px', borderRadius: 4, background: 'rgba(16, 185, 129, 0.15)', color: 'var(--emerald)' }}>PRO</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>نظام الإدارة المالية الذكي</span>
                </div>
              </div>
              <button
                className="btn-icon"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="إغلاق القائمة"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            {/* بطاقة المستخدم في الـ Drawer */}
            {userProfile && (
              <div className="drawer-user-pill" onClick={() => { setActivePage('settings'); setMobileMenuOpen(false); }} style={{ cursor: 'pointer' }} title="إدارة الملف الشخصي">
                <UserAvatar userProfile={userProfile} size={36} fontSize={13} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{userProfile.fullName || 'المستخدم'}</span>
                  <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                    {userProfile.role === 'owner' ? 'مالك التطبيق' : (userProfile.email || 'حساب آمن')}
                  </span>
                </div>
              </div>
            )}

            <nav className="drawer-nav">
              {menuGroups.map(group => (
                <div key={group.title} className="drawer-group">
                  <div className="drawer-section-title">{group.title}</div>
                  {group.items.map(item => (
                    <button
                      key={item.id}
                      className={`drawer-link ${activePage === item.id ? 'active' : ''}`}
                      onClick={() => {
                        setActivePage(item.id);
                        setMobileMenuOpen(false);
                      }}
                    >
                      <div className="drawer-link-icon-box">
                        <Icon name={item.icon} size={18} />
                      </div>
                      <span className="drawer-link-label">{item.label}</span>
                      {item.badge > 0 && (
                        <span className="nav-badge-alert">{item.badge}</span>
                      )}
                      <span className="drawer-chevron">
                        <Icon name="chevron-left" size={14} />
                      </span>
                    </button>
                  ))}
                </div>
              ))}
            </nav>

            <div className="drawer-footer">
              <div className="drawer-footer-actions">
                <button className="theme-toggle-btn" onClick={onToggleTheme} style={{ flex: 1 }}>
                  <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
                  <span>{theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الليلي'}</span>
                </button>
                {hasPin && (
                  <button className="lock-quick-btn" onClick={onLockNow} title="قفل التطبيق">
                    <Icon name="lock" size={16} />
                    <span>قفل</span>
                  </button>
                )}
                {onLogout && (
                  <button className="btn-icon-subtle" onClick={onLogout} title="تسجيل الخروج">
                    <Icon name="logout" size={16} />
                  </button>
                )}
              </div>
              <div className="drawer-footer-security">
                <Icon name="shield" size={13} color="var(--emerald)" />
                <span>بياناتك المالية محمية ومحفوظة بأمان</span>
              </div>
              <div style={{
                marginTop: 6,
                padding: '6px 10px',
                borderRadius: 6,
                background: backendStatus?.connected ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                border: backendStatus?.connected ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(245, 158, 11, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 11
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: backendStatus?.connected ? 'var(--emerald)' : 'var(--amber)', fontWeight: 600 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: backendStatus?.connected ? '#10b981' : '#f59e0b' }}></span>
                  <span>{backendStatus?.connected ? 'متصل الآن' : 'غير متصل'}</span>
                </div>
                {lastSyncedAt && (
                  <span style={{ fontSize: 9.5, color: 'var(--ink-faint)' }}>{lastSyncedAt}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* المحتوى الرئيسي وشريط الموبايل العلوي */}
      <div className="main-wrapper">
        <header className="mobile-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="hamburger-btn"
              onClick={() => setMobileMenuOpen(prev => !prev)}
              aria-label="فتح القائمة"
            >
              <Icon name="menu" size={22} />
            </button>
            <div className="mobile-header-title">
              <span style={{ fontWeight: 700, fontSize: 15 }}>{currentPageObj.label}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {onManualSync && (
              <button
                className="btn-icon-subtle"
                onClick={onManualSync}
                disabled={syncInProgress}
                title="تحديث البيانات فورياً عبر AJAX"
              >
                <Icon name="refresh" size={17} className={syncInProgress ? 'spin-anim' : ''} />
              </button>
            )}

            <button
              className="btn-icon-subtle"
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'فاتح' : 'مظلم'}
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
            </button>

            {hasPin && (
              <button
                className="btn-icon-subtle"
                onClick={onLockNow}
                title="قفل التطبيق"
              >
                <Icon name="lock" size={17} />
              </button>
            )}

            <button
              className="header-quick-add-btn"
              onClick={onOpenQuickAdd}
              title="إضافة سريعة"
            >
              <Icon name="plus" size={18} color="#fff" />
            </button>
          </div>
        </header>

        <main className="page-content">{children}</main>

        {/* شريط التنقل السفلي للأجهزة المحمولة (iOS Native Feel) */}
        <nav className="mobile-bottom-nav">
          <button
            className={`bottom-nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActivePage('dashboard')}
          >
            <Icon name="dashboard" size={20} />
            <span>الرئيسية</span>
          </button>
          <button
            className={`bottom-nav-item ${activePage === 'expenses' ? 'active' : ''}`}
            onClick={() => setActivePage('expenses')}
          >
            <Icon name="expenses" size={20} />
            <span>المصروفات</span>
          </button>
          <button
            className={`bottom-nav-item ${activePage === 'income' ? 'active' : ''}`}
            onClick={() => setActivePage('income')}
          >
            <Icon name="income" size={20} />
            <span>الدخل</span>
          </button>
          <button
            className={`bottom-nav-item ${activePage === 'accounts' ? 'active' : ''}`}
            onClick={() => setActivePage('accounts')}
          >
            <Icon name="accounts" size={20} />
            <span>الحسابات</span>
          </button>
          <button
            className={`bottom-nav-item ${isSecondaryPage || mobileMenuOpen ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(prev => !prev)}
            aria-label="المزيد من الخيارات"
          >
            <Icon name="menu" size={20} />
            <span>المزيد</span>
            {alertsCount > 0 && !['dashboard'].includes(activePage) && (
              <span className="nav-badge-alert" style={{ position: 'absolute', top: 4, right: 14 }}>
                {alertsCount}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* زر الإضافة السريعة العائم (أسفل يسار الشاشة دائماً) */}
      <button
        className="floating-quick-add-btn"
        onClick={onOpenQuickAdd}
        title="إضافة سريعة (مصروف أو دخل)"
      >
        <Icon name="plus" size={24} color="#ffffff" />
      </button>

      {/* إشعار المزامنة اللحظية بين الأجهزة */}
      {syncNotice && (
        <div className="sync-toast-banner">
          <Icon name="zap" size={13} color="var(--emerald)" />
          <span>{syncNotice}</span>
        </div>
      )}
    </div>
  );
}

// 4. نافذة الإضافة السريعة المنبثقة من الأسفل (Bottom Sheet)
export function QuickAddModal({
  isOpen,
  onClose,
  accounts,
  categories,
  onSave
}) {
  if (!isOpen) return null;

  const [type, setType] = useState('expense'); // expense | income
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [category, setCategory] = useState('');
  const [desc, setDesc] = useState('');

  const catOptions = type === 'expense' ? categories.expenseCats : categories.incomeCats;

  const handleSubmit = e => {
    e.preventDefault();
    const numAmt = parseFloat(amount);
    if (!numAmt || numAmt <= 0) {
      alert('يرجى إدخال مبلغ صحيح أكبر من الصفر');
      return;
    }
    if (!accountId) {
      alert('يرجى اختيار الحساب');
      return;
    }

    onSave({
      type,
      amount: numAmt,
      accountId,
      category: category.trim() || 'أخرى',
      desc: desc.trim() || (type === 'expense' ? 'مصروف سريع' : 'دخل سريع')
    });

    // إعادة الضبط والإغلاق
    setAmount('');
    setDesc('');
    setCategory('');
    onClose();
  };

  return (
    <div className="bottom-sheet-overlay" onClick={onClose}>
      <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
        <div className="bottom-sheet-handle"></div>

        <div className="modal-header">
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>إضافة سريعة</h3>
          <button className="btn-icon" onClick={onClose}>
            <Icon name="close" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: 14 }}>
          {/* محول دخل / مصروف */}
          <div className="type-toggle">
            <button
              type="button"
              className={`toggle-option ${type === 'expense' ? 'active expense' : ''}`}
              onClick={() => {
                setType('expense');
                setCategory('');
              }}
            >
              مصروف
            </button>
            <button
              type="button"
              className={`toggle-option ${type === 'income' ? 'active income' : ''}`}
              onClick={() => {
                setType('income');
                setCategory('');
              }}
            >
              دخل
            </button>
          </div>

          {/* تصنيفات الشارع السريعة (أثناء التواجد بالخارج) */}
          {type === 'expense' && (
            <div style={{ marginTop: 12, marginBottom: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Icon name="zap" size={12} color="var(--amber)" />
                <span>مصاريف الشارع السريعة (اختر للتعبئة الفورية):</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {STREET_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setDesc(preset.title);
                      setCategory(preset.category);
                      const cashAcc = accounts.find(a => a.type === 'كاش');
                      if (cashAcc) setAccountId(cashAcc.id);
                    }}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 16,
                      background: desc === preset.title ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-input)',
                      border: desc === preset.title ? '1px solid var(--emerald)' : '1px solid var(--border-subtle)',
                      color: desc === preset.title ? 'var(--emerald)' : 'var(--text-primary)',
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <span>{preset.icon}</span>
                    <span>{preset.shortTitle}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* المبلغ */}
          <div className="form-group" style={{ marginTop: 12 }}>
            <label className="form-label">المبلغ المطلوب *</label>
            <input
              type="number"
              step="any"
              required
              className="form-input text-lg"
              placeholder="0.00"
              autoFocus
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>

          {/* مبالغ سريعة بنقرة واحدة */}
          <div className="quick-amount-pills">
            {[10, 20, 50, 100, 200, 500].map(val => (
              <button
                key={val}
                type="button"
                className={`quick-amount-pill ${Number(amount) === val ? 'active' : ''}`}
                onClick={() => setAmount(String(val))}
              >
                {val} ج.م
              </button>
            ))}
          </div>

          {/* الحساب */}
          <div className="form-group">
            <label className="form-label">الحساب *</label>
            <select
              className="form-select"
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              required
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.type})
                </option>
              ))}
            </select>
          </div>

          {/* التصنيف */}
          <div className="form-group">
            <label className="form-label">التصنيف</label>
            <select
              className="form-select"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              <option value="">(افتراضي: أخرى)</option>
              {catOptions.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* الوصف (اختياري) */}
          <div className="form-group">
            <label className="form-label">الوصف (اختياري)</label>
            <input
              type="text"
              className="form-input"
              placeholder="وصف مختصر للعملية"
              value={desc}
              onChange={e => setDesc(e.target.value)}
            />
          </div>

          <div style={{ marginTop: 20 }}>
            <button type="submit" className="btn-primary full-width">
              حفظ العملية الآن
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 5. نافذة تأكيد الحذف
export function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--rust)', marginBottom: 12 }}>
          <Icon name="alert" size={24} color="var(--rust)" />
          <h3 style={{ margin: 0, fontSize: 16 }}>{title || 'تأكيد الحذف'}</h3>
        </div>
        <p style={{ margin: '0 0 20px', color: 'var(--ink-soft)', fontSize: 14 }}>
          {message || 'هل أنت متأكد من رغبتك في حذف هذا العنصر نهائياً؟ لا يمكن التراجع عن هذه الخطوة.'}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="btn-secondary" onClick={onCancel}>
            إلغاء
          </button>
          <button className="btn-danger" onClick={onConfirm}>
            نعم، احذف
          </button>
        </div>
      </div>
    </div>
  );
}
