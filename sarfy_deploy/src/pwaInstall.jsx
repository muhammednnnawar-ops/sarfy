// Sarfy - PWA Install Banner & Interactive Walkthrough
// كاشف التثبيت السريع لتطبيق الهواتف الذكية مع دليل iOS و Android التفاعلي

import React, { useState, useEffect } from 'react';
import { Icon } from './icons.jsx';

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // 1. التحقق مما إذا كان التطبيق مثبتاً بالفعل ويعمل في وضع Standalone
    const isStandalone = (typeof window !== 'undefined') && (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    );
    if (isStandalone) return;

    // 2. التحقق من تجاهل المستخدم السابق للبانر خلال آخر 7 أيام
    const dismissedTime = localStorage.getItem('sarfy_pwa_dismissed');
    if (dismissedTime && Date.now() - Number(dismissedTime) < 7 * 24 * 60 * 60 * 1000) {
      return;
    }

    // 3. كشف نظام iOS (iPhone / iPad)
    const isIosDevice = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIos(isIosDevice);

    if (isIosDevice) {
      // إظهار البانر بعد 2 ثوانٍ لتجربة تصفح هادئة
      const timer = setTimeout(() => setShowBanner(true), 2500);
      return () => clearTimeout(timer);
    }

    // 4. التقاط حدث التثبيت في متصفحات أندرويد وكروم
    const handleBeforeInstall = e => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosModal(true);
    } else if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      setShowIosModal(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    try {
      localStorage.setItem('sarfy_pwa_dismissed', Date.now().toString());
    } catch {}
  };

  if (!showBanner) return null;

  return (
    <>
      <div style={{
        background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.4)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
        borderRadius: 14,
        padding: '12px 16px',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'var(--emerald)',
            color: '#05070D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Icon name="smartphone" size={20} />
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: '#FFFFFF' }}>
              ثبّت تطبيق صرفي على شاشتك الرئيسية
            </div>
            <div style={{ fontSize: 11.5, color: 'rgba(255, 255, 255, 0.75)', marginTop: 2 }}>
              يعمل كتطبيق هاتف أصلي بملء الشاشة، وبدون إنترنت 100% بتشفير محلي
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            className="btn-primary btn-sm"
            onClick={handleInstallClick}
            style={{ fontSize: 12, padding: '7px 14px', whiteWhite: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 5 }}
          >
            <Icon name="download" size={13} />
            <span>تثبيت التطبيق الآن</span>
          </button>
          <button
            type="button"
            className="btn-icon-subtle"
            onClick={handleDismiss}
            title="إخفاء مؤقتاً"
            style={{ width: 28, height: 28, color: 'rgba(255, 255, 255, 0.6)' }}
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      </div>

      {/* نافذة توضيح خطوات التثبيت لهواتف الآيفون وآيباد (iOS Walkthrough Modal) */}
      {showIosModal && (
        <div className="crop-modal-overlay" onClick={() => setShowIosModal(false)}>
          <div className="crop-modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 420, padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon name="smartphone" size={22} color="var(--emerald)" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>تثبيت صرفي على الآيفون (iOS)</h3>
              </div>
              <button className="btn-icon-subtle" onClick={() => setShowIosModal(false)}>
                <Icon name="close" size={18} />
              </button>
            </div>

            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--emerald)', color: '#05070D', fontWeight: 900, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  1
                </span>
                <div>
                  اضغط على أيقونة المشاركة <Icon name="share" size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> في شريط متصفح <strong>Safari</strong> أسفل الشاشة.
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--emerald)', color: '#05070D', fontWeight: 900, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  2
                </span>
                <div>
                  مرر القائمة لأسفل واختر <strong>"إضافة إلى الصفحة الرئيسية" (Add to Home Screen)</strong>.
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--emerald)', color: '#05070D', fontWeight: 900, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  3
                </span>
                <div>
                  اضغط على كلمة <strong>"إضافة" (Add)</strong> في أعلى يمين الشاشة، وستظهر أيقونة التطبيق فوراً على شاشتك الرئيسية!
                </div>
              </div>
            </div>

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-primary" onClick={() => setShowIosModal(false)} style={{ width: '100%', justifyContent: 'center' }}>
                فهمت ذلك، تم
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
