// Sarfy - Egyptian & Regional Financial Institutions Directory & SVG Logos
// يحتوي على الشعارات الرسمية المتجهة (SVG) للبنوك المصرية، ومحافظ شركات الاتصالات، وشبكة إنستاباي

import React from 'react';
import BRAND_LOGO_SRC from './assets/banks/index.js';

// =========================================================================
// 1. لوجوهات شبكة المدفوعات اللحظية إنستاباي ومحافظ شركات الاتصالات (SVG)
// =========================================================================

// 1.1 شعار إنستاباي (InstaPay - شبكة المدفوعات اللحظية IPN)
export function InstaPayLogo({ size = 28, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <defs>
        <linearGradient id="instaBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4A154B" />
          <stop offset="50%" stopColor="#6B21A8" />
          <stop offset="100%" stopColor="#9333EA" />
        </linearGradient>
        <linearGradient id="instaBolt" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#EF4444" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#instaBg)" />
      {/* حرف i المميز ونبضة البرق اللحظية */}
      <circle cx="14" cy="13" r="2.8" fill="#FFFFFF" />
      <rect x="11.5" y="18" width="5" height="13" rx="2.5" fill="#FFFFFF" />
      {/* سهم السرعة والمدفوعات اللحظية البرتقالي */}
      <path d="M22 10L17 22H24L21 31L32 18H25L28 10H22Z" fill="url(#instaBolt)" filter="drop-shadow(0 0 3px rgba(245, 158, 11, 0.6))" />
    </svg>
  );
}

// 1.2 شعار فودافون كاش (Vodafone Cash)
export function VodafoneCashLogo({ size = 28, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <defs>
        <linearGradient id="vodaBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E60000" />
          <stop offset="100%" stopColor="#990000" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#vodaBg)" />
      {/* علامة الاقتباس الأيقونية لفودافون (Vodafone Speech Mark) */}
      <path
        d="M20 9C14.48 9 10 13.48 10 19C10 23.82 13.41 27.84 18 28.77V22.5C16.89 21.89 16.14 20.73 16.14 19.38C16.14 17.26 17.86 15.54 19.98 15.54C22.1 15.54 23.82 17.26 23.82 19.38C23.82 20.73 23.07 21.89 21.96 22.5V30.95C26.54 30.43 30 26.56 30 21.86C30 14.76 24.24 9 20 9Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

// 1.3 شعار أورنج كاش (Orange Money / Orange Cash)
export function OrangeCashLogo({ size = 28, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <defs>
        <linearGradient id="orangeBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF7900" />
          <stop offset="100%" stopColor="#D95F00" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#orangeBg)" />
      {/* مربع أورنج الأسود الشهير ورمز المحفظة النقدية */}
      <rect x="8" y="8" width="24" height="24" rx="4" fill="#000000" opacity="0.15" />
      <path d="M14 14H26V26H14V14Z" fill="#FFFFFF" />
      <rect x="17" y="18" width="6" height="4" rx="1" fill="#FF7900" />
    </svg>
  );
}

// 1.4 شعار اتصالات كاش (Etisalat Cash / e& money)
export function EtisalatCashLogo({ size = 28, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <defs>
        <linearGradient id="etisalatBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E3A2F" />
          <stop offset="100%" stopColor="#0B1A13" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#etisalatBg)" />
      {/* دوامة اتصالات الخضراء الليمونية وحرف e& المميز */}
      <circle cx="20" cy="20" r="12" stroke="#78BE20" strokeWidth="3" strokeDasharray="18 6" />
      <circle cx="20" cy="20" r="7" fill="#78BE20" />
      <circle cx="24" cy="16" r="3" fill="#EF4444" />
    </svg>
  );
}

// 1.5 شعار وي باي (WE Pay - المصرية للاتصالات Telecom Egypt)
export function WePayLogo({ size = 28, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <defs>
        <linearGradient id="weBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5B2D86" />
          <stop offset="100%" stopColor="#3C1A5C" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#weBg)" />
      {/* حرفي we الشهيرين باللون الأبيض الصافي والخط الانسيابي */}
      <text x="20" y="25" textAnchor="middle" fill="#FFFFFF" fontSize="16" fontWeight="900" fontFamily="sans-serif">
        we
      </text>
      <circle cx="29" cy="15" r="2.5" fill="#E11D48" />
    </svg>
  );
}

// =========================================================================
// 2. لوجوهات البنوك المصرية الكبرى (Major Egyptian Banks)
// =========================================================================

// 2.1 البنك الأهلي المصري (National Bank of Egypt - NBE)
export function NbeLogo({ size = 28, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <defs>
        <linearGradient id="nbeBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#005A36" />
          <stop offset="100%" stopColor="#003822" />
        </linearGradient>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#D4AF37" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#nbeBg)" />
      {/* سنبلة ونسر البنك الأهلي المصري الذهبي والأخضر */}
      <path d="M20 7L27 15C27 23 20 32 20 32C20 32 13 23 13 15L20 7Z" fill="url(#goldGrad)" opacity="0.9" />
      <path d="M20 11V28M16 16L20 20L24 16M16 22L20 25L24 22" stroke="#003822" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 2.2 بنك مصر (Banque Misr)
export function BanqueMisrLogo({ size = 28, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <defs>
        <linearGradient id="misrBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B1D2C" />
          <stop offset="100%" stopColor="#4A0E17" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#misrBg)" />
      {/* تاج وأهرامات بنك مصر العريق */}
      <circle cx="20" cy="20" r="12" stroke="#FDE68A" strokeWidth="2" opacity="0.6" />
      <path d="M20 11L28 26H12L20 11Z" fill="#FDE68A" opacity="0.9" />
      <path d="M20 16L24 26H16L20 16Z" fill="#8B1D2C" />
      <circle cx="20" cy="14" r="1.5" fill="#FFFFFF" />
    </svg>
  );
}

// 2.3 البنك التجاري الدولي (CIB - Commercial International Bank)
export function CibLogo({ size = 28, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <defs>
        <linearGradient id="cibBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0A2540" />
          <stop offset="100%" stopColor="#051221" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#cibBg)" />
      {/* أحرف CIB الهندسية بالأزرق الداكن والبرتقالي الساطع */}
      <path d="M12 14C9.8 14 8 15.8 8 18V22C8 24.2 9.8 26 12 26H14V22.5H11.5V17.5H14V14H12Z" fill="#FFFFFF" />
      <rect x="17" y="14" width="4" height="12" rx="1" fill="#FF6B00" />
      <path d="M24 14H29C30.6 14 32 15.3 32 17C32 18.1 31.3 19.1 30.3 19.6C31.5 20.1 32.3 21.2 32.3 22.5C32.3 24.4 30.7 26 28.8 26H24V14ZM27.5 18.5H28.5C29.1 18.5 29.5 18 29.5 17.5C29.5 17 29.1 16.5 28.5 16.5H27.5V18.5ZM27.5 23.5H29C29.6 23.5 30 23 30 22.5C30 22 29.6 21.5 29 21.5H27.5V23.5Z" fill="#FFFFFF" />
    </svg>
  );
}

// 2.4 بنك الإسكندرية (Bank of Alexandria / Intesa Sanpaolo)
export function AlexBankLogo({ size = 28, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <defs>
        <linearGradient id="alexBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#002D62" />
          <stop offset="100%" stopColor="#001633" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#alexBg)" />
      {/* أقواس إنتيسا سان باولو وأهرامات الإسكندرية */}
      <path d="M10 26C10 17.16 17.16 10 26 10H30V15H26C19.92 15 15 19.92 15 26V30H10V26Z" fill="#F4A900" />
      <circle cx="24" cy="22" r="5" fill="#FFFFFF" />
    </svg>
  );
}

// 2.5 بنك القاهرة (Banque du Caire)
export function BanqueDuCaireLogo({ size = 28, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <defs>
        <linearGradient id="cairoBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0C2340" />
          <stop offset="100%" stopColor="#061221" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#cairoBg)" />
      {/* شمس بنك القاهرة البرتقالية والخط النيلي */}
      <circle cx="20" cy="20" r="10" stroke="#FF7900" strokeWidth="2.5" />
      <path d="M20 14V26M14 20H26M16 16L24 24M24 16L16 24" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// 2.6 بنك QNB الأهلي (QNB AlAhli)
export function QnbLogo({ size = 28, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <defs>
        <linearGradient id="qnbBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7B113A" />
          <stop offset="100%" stopColor="#3A081C" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#qnbBg)" />
      {/* شريط QNB العنابي المميز والخط المائل */}
      <circle cx="20" cy="20" r="10" stroke="#FFFFFF" strokeWidth="3" />
      <path d="M20 10V30" stroke="#FDE68A" strokeWidth="2.5" />
      <path d="M25 24L30 30" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// 2.7 مصرف أبوظبي الإسلامي (ADIB Egypt)
export function AdibLogo({ size = 28, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <defs>
        <linearGradient id="adibBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#003B73" />
          <stop offset="100%" stopColor="#001D3A" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#adibBg)" />
      {/* موجة الأزرق الفيروزي والزرقة الإسلامية */}
      <path d="M10 24C15 16 25 16 30 24C25 32 15 32 10 24Z" fill="#00A3E0" />
      <circle cx="20" cy="24" r="4" fill="#FFFFFF" />
    </svg>
  );
}

// 2.8 بنك فيصل الإسلامي المصري (Faisal Islamic Bank)
export function FaisalBankLogo({ size = 28, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <defs>
        <linearGradient id="faisalBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#005C2B" />
          <stop offset="100%" stopColor="#002D15" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#faisalBg)" />
      {/* الخط الكوفي الدائري والزخرفة الإسلامية الذهبية */}
      <circle cx="20" cy="20" r="12" stroke="#D4AF37" strokeWidth="2" strokeDasharray="3 3" />
      <rect x="15" y="15" width="10" height="10" rx="2" transform="rotate(45 20 20)" fill="#D4AF37" opacity="0.85" />
      <circle cx="20" cy="20" r="3" fill="#FFFFFF" />
    </svg>
  );
}

// 2.9 البنك العربي الإفريقي الدولي (AAIB)
export function AaibLogo({ size = 28, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <defs>
        <linearGradient id="aaibBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#003366" />
          <stop offset="100%" stopColor="#001A33" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#aaibBg)" />
      {/* سهم AAIB المتداخل الأزرق والتركواز */}
      <path d="M12 25L20 13L28 25H22L20 20L18 25H12Z" fill="#00A896" />
      <path d="M17 26H23L20 22L17 26Z" fill="#FFFFFF" />
    </svg>
  );
}

// 2.10 بنك HSBC مصر
export function HsbcLogo({ size = 28, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <defs>
        <linearGradient id="hsbcBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1C1917" />
          <stop offset="100%" stopColor="#0C0A09" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#hsbcBg)" />
      {/* سداسي HSBC الأحمر والأبيض المتماثل */}
      <path d="M12 20L20 12L28 20L20 28L12 20Z" fill="#FFFFFF" />
      <path d="M12 20L20 12V28L12 20Z" fill="#DB0011" />
      <path d="M28 20L20 12V28L28 20Z" fill="#DB0011" />
    </svg>
  );
}

// 2.11 بنك البركة مصر (Al Baraka Bank)
export function AlBarakaLogo({ size = 28, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <defs>
        <linearGradient id="barakaBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0D3B66" />
          <stop offset="100%" stopColor="#051829" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#barakaBg)" />
      <circle cx="20" cy="20" r="11" stroke="#38BDF8" strokeWidth="2.2" />
      <path d="M15 20C15 17.2 17.2 15 20 15C22.8 15 25 17.2 25 20C25 22.8 22.8 25 20 25" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// 2.12 بنك قناة السويس (Suez Canal Bank)
export function SuezCanalBankLogo({ size = 28, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <defs>
        <linearGradient id="scbBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#002B49" />
          <stop offset="100%" stopColor="#001424" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#scbBg)" />
      <path d="M12 26C16 23 24 23 28 26" stroke="#00A896" strokeWidth="3" strokeLinecap="round" />
      <path d="M15 21C18 19 22 19 25 21" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
      <polygon points="20,11 23,17 17,17" fill="#FFFFFF" />
    </svg>
  );
}

// 2.13 المصرف المتحد (The United Bank)
export function UnitedBankLogo({ size = 28, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <defs>
        <linearGradient id="ubBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0A3A40" />
          <stop offset="100%" stopColor="#041B1F" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#ubBg)" />
      <circle cx="20" cy="20" r="10" stroke="#10B981" strokeWidth="2" />
      <path d="M16 16L24 24M24 16L16 24" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// 2.14 ميزة (Meeza - الشبكة القومية المصرية للمدفوعات)
export function MeezaLogo({ size = 28, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <defs>
        <linearGradient id="meezaBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#064E3B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#meezaBg)" />
      {/* الدائرتان الخضراء والزرقاء المتداخلتان لكارت ميزة */}
      <circle cx="16" cy="20" r="8" fill="#00843D" opacity="0.9" />
      <circle cx="24" cy="20" r="8" fill="#003865" opacity="0.85" />
      <circle cx="20" cy="20" r="4.5" fill="#FFFFFF" opacity="0.3" />
    </svg>
  );
}

// 2.15 محفظة النقدية الفورية (كاش)
export function CashLogo({ size = 28, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <defs>
        <linearGradient id="cashBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#065F46" />
          <stop offset="100%" stopColor="#022C22" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#cashBg)" />
      <rect x="10" y="14" width="20" height="12" rx="3" stroke="#34D399" strokeWidth="2" fill="rgba(16, 185, 129, 0.2)" />
      <circle cx="20" cy="20" r="3.5" fill="#34D399" />
    </svg>
  );
}

// =========================================================================
// 3. دليل المؤسسات المالية والمحافظ (Financial Directory & Metadata Engine)
// =========================================================================

export const FINANCIAL_INSTITUTIONS_PRESETS = [
  // أ. شبكة المدفوعات اللحظية
  {
    id: 'instapay',
    category: 'instapay',
    categoryLabel: 'شبكة المدفوعات اللحظية',
    name: 'إنستاباي (InstaPay)',
    fullName: 'حساب إنستاباي (شبكة المدفوعات اللحظية IPN)',
    type: 'محفظة إلكترونية',
    brandColor: '#7C3AED',
    gradient: 'linear-gradient(135deg, #4A154B 0%, #6B21A8 50%, #9333EA 100%)',
    cardTheme: 'card-theme-instapay',
    cardNetwork: 'IPN',
    issuer: 'شبكة المدفوعات اللحظية IPN',
    logo: InstaPayLogo,
    feeDesc: '0.1% بحد أدنى 0.50 ج.م وأقصى 20 ج.م (معفي حالياً)'
  },

  // ب. محافظ شركات الاتصالات
  {
    id: 'vodafone_cash',
    category: 'telecom',
    categoryLabel: 'محافظ شركات الاتصالات',
    name: 'فودافون كاش',
    fullName: 'محفظة فودافون كاش (Vodafone Cash)',
    type: 'محفظة إلكترونية',
    brandColor: '#E60000',
    gradient: 'linear-gradient(135deg, #E60000 0%, #990000 100%)',
    cardTheme: 'card-theme-vodafone',
    cardNetwork: 'Cash',
    issuer: 'Vodafone Smart Cash',
    logo: VodafoneCashLogo,
    feeDesc: '1 ج.م لنفس المحفظة | 0.5% لأخرى (أقصى 15 ج.م)'
  },
  {
    id: 'orange_cash',
    category: 'telecom',
    categoryLabel: 'محافظ شركات الاتصالات',
    name: 'أورنج كاش',
    fullName: 'محفظة أورنج كاش (Orange Money)',
    type: 'محفظة إلكترونية',
    brandColor: '#FF7900',
    gradient: 'linear-gradient(135deg, #FF7900 0%, #D95F00 50%, #1A1A1A 100%)',
    cardTheme: 'card-theme-orange',
    cardNetwork: 'Orange',
    issuer: 'Orange Money Egypt',
    logo: OrangeCashLogo,
    feeDesc: '1 ج.م لنفس المحفظة | 0.5% لأخرى (أقصى 15 ج.م)'
  },
  {
    id: 'etisalat_cash',
    category: 'telecom',
    categoryLabel: 'محافظ شركات الاتصالات',
    name: 'اتصالات كاش',
    fullName: 'محفظة اتصالات كاش (e& money)',
    type: 'محفظة إلكترونية',
    brandColor: '#78BE20',
    gradient: 'linear-gradient(135deg, #1E3A2F 0%, #0B1A13 100%)',
    cardTheme: 'card-theme-etisalat',
    cardNetwork: 'e&',
    issuer: 'Etisalat e& Cash',
    logo: EtisalatCashLogo,
    feeDesc: '1 ج.م لنفس المحفظة | 0.5% لأخرى (أقصى 15 ج.م)'
  },
  {
    id: 'we_pay',
    category: 'telecom',
    categoryLabel: 'محافظ شركات الاتصالات',
    name: 'وي باي (WE Pay)',
    fullName: 'محفظة وي باي (المصرية للاتصالات WE Pay)',
    type: 'محفظة إلكترونية',
    brandColor: '#5B2D86',
    gradient: 'linear-gradient(135deg, #5B2D86 0%, #3C1A5C 100%)',
    cardTheme: 'card-theme-we',
    cardNetwork: 'WE Pay',
    issuer: 'Telecom Egypt WE Pay',
    logo: WePayLogo,
    feeDesc: '1 ج.م لنفس المحفظة | 0.5% لأخرى (أقصى 15 ج.م)'
  },

  // ج. البنوك المصرية الكبرى
  {
    id: 'nbe',
    category: 'banks',
    categoryLabel: 'البنوك المصرية',
    name: 'البنك الأهلي المصري',
    fullName: 'حساب البنك الأهلي المصري (NBE)',
    type: 'حساب بنكي',
    brandColor: '#005A36',
    gradient: 'linear-gradient(135deg, #005A36 0%, #003822 60%, #111827 100%)',
    cardTheme: 'card-theme-ahly',
    cardNetwork: 'Mastercard',
    issuer: 'البنك الأهلي المصري NBE',
    logo: NbeLogo,
    feeDesc: 'مجاناً لنفس البنك أو عبر إنستاباي'
  },
  {
    id: 'banque_misr',
    category: 'banks',
    categoryLabel: 'البنوك المصرية',
    name: 'بنك مصر',
    fullName: 'حساب بنك مصر (Banque Misr)',
    type: 'حساب بنكي',
    brandColor: '#8B1D2C',
    gradient: 'linear-gradient(135deg, #8B1D2C 0%, #4A0E17 60%, #1A0509 100%)',
    cardTheme: 'card-theme-misr',
    cardNetwork: 'Mastercard',
    issuer: 'بنك مصر Banque Misr',
    logo: BanqueMisrLogo,
    feeDesc: 'مجاناً لنفس البنك أو عبر إنستاباي'
  },
  {
    id: 'cib',
    category: 'banks',
    categoryLabel: 'البنوك المصرية',
    name: 'البنك التجاري الدولي (CIB)',
    fullName: 'حساب CIB البنك التجاري الدولي',
    type: 'حساب بنكي',
    brandColor: '#0A2540',
    gradient: 'linear-gradient(135deg, #0A2540 0%, #1E293B 60%, #051221 100%)',
    cardTheme: 'card-theme-cib',
    cardNetwork: 'VISA',
    issuer: 'Commercial International Bank (CIB)',
    logo: CibLogo,
    feeDesc: 'مجاناً لنفس البنك أو عبر إنستاباي'
  },
  {
    id: 'alex_bank',
    category: 'banks',
    categoryLabel: 'البنوك المصرية',
    name: 'بنك الإسكندرية',
    fullName: 'حساب بنك الإسكندرية (Intesa Sanpaolo)',
    type: 'حساب بنكي',
    brandColor: '#002D62',
    gradient: 'linear-gradient(135deg, #002D62 0%, #0369A1 60%, #001633 100%)',
    cardTheme: 'card-theme-alexbank',
    cardNetwork: 'VISA',
    issuer: 'Bank of Alexandria',
    logo: AlexBankLogo,
    feeDesc: 'مجاناً لنفس البنك أو عبر إنستاباي'
  },
  {
    id: 'banque_du_caire',
    category: 'banks',
    categoryLabel: 'البنوك المصرية',
    name: 'بنك القاهرة',
    fullName: 'حساب بنك القاهرة (Banque du Caire)',
    type: 'حساب بنكي',
    brandColor: '#0C2340',
    gradient: 'linear-gradient(135deg, #0C2340 0%, #1E3A8A 60%, #061221 100%)',
    cardTheme: 'card-theme-cairo',
    cardNetwork: 'Mastercard',
    issuer: 'Banque du Caire',
    logo: BanqueDuCaireLogo,
    feeDesc: 'مجاناً لنفس البنك أو عبر إنستاباي'
  },
  {
    id: 'qnb',
    category: 'banks',
    categoryLabel: 'البنوك المصرية',
    name: 'بنك QNB الأهلي',
    fullName: 'حساب بنك QNB الأهلي مصر',
    type: 'حساب بنكي',
    brandColor: '#7B113A',
    gradient: 'linear-gradient(135deg, #7B113A 0%, #701A75 60%, #3A081C 100%)',
    cardTheme: 'card-theme-qnb',
    cardNetwork: 'VISA',
    issuer: 'QNB AlAhli Egypt',
    logo: QnbLogo,
    feeDesc: 'مجاناً لنفس البنك أو عبر إنستاباي'
  },
  {
    id: 'adib',
    category: 'banks',
    categoryLabel: 'البنوك المصرية',
    name: 'مصرف أبوظبي الإسلامي (ADIB)',
    fullName: 'حساب مصرف أبوظبي الإسلامي مصر (ADIB)',
    type: 'حساب بنكي',
    brandColor: '#003B73',
    gradient: 'linear-gradient(135deg, #003B73 0%, #0E7490 60%, #001D3A 100%)',
    cardTheme: 'card-theme-adib',
    cardNetwork: 'Mastercard',
    issuer: 'ADIB Egypt',
    logo: AdibLogo,
    feeDesc: 'مجاناً لنفس البنك أو عبر إنستاباي'
  },
  {
    id: 'faisal',
    category: 'banks',
    categoryLabel: 'البنوك المصرية',
    name: 'بنك فيصل الإسلامي',
    fullName: 'حساب بنك فيصل الإسلامي المصري',
    type: 'حساب بنكي',
    brandColor: '#005C2B',
    gradient: 'linear-gradient(135deg, #005C2B 0%, #065F46 60%, #002D15 100%)',
    cardTheme: 'card-theme-faisal',
    cardNetwork: 'Meeza',
    issuer: 'Faisal Islamic Bank',
    logo: FaisalBankLogo,
    feeDesc: 'مجاناً لنفس البنك أو عبر إنستاباي'
  },
  {
    id: 'aaib',
    category: 'banks',
    categoryLabel: 'البنوك المصرية',
    name: 'البنك العربي الإفريقي (AAIB)',
    fullName: 'حساب البنك العربي الإفريقي الدولي',
    type: 'حساب بنكي',
    brandColor: '#003366',
    gradient: 'linear-gradient(135deg, #003366 0%, #0D9488 60%, #001A33 100%)',
    cardTheme: 'card-theme-aaib',
    cardNetwork: 'VISA',
    issuer: 'Arab African International Bank',
    logo: AaibLogo,
    feeDesc: 'مجاناً لنفس البنك أو عبر إنستاباي'
  },
  {
    id: 'hsbc',
    category: 'banks',
    categoryLabel: 'البنوك المصرية',
    name: 'بنك HSBC مصر',
    fullName: 'حساب بنك HSBC مصر',
    type: 'حساب بنكي',
    brandColor: '#DB0011',
    gradient: 'linear-gradient(135deg, #1C1917 0%, #27272A 60%, #0C0A09 100%)',
    cardTheme: 'card-theme-hsbc',
    cardNetwork: 'VISA',
    issuer: 'HSBC Bank Egypt',
    logo: HsbcLogo,
    feeDesc: 'مجاناً لنفس البنك أو عبر إنستاباي'
  },
  {
    id: 'albaraka',
    category: 'banks',
    categoryLabel: 'البنوك المصرية',
    name: 'بنك البركة مصر',
    fullName: 'حساب بنك البركة مصر',
    type: 'حساب بنكي',
    brandColor: '#0D3B66',
    gradient: 'linear-gradient(135deg, #0D3B66 0%, #0E7490 60%, #051829 100%)',
    cardTheme: 'card-theme-qnb',
    cardNetwork: 'VISA',
    issuer: 'Al Baraka Bank Egypt',
    logo: AlBarakaLogo,
    feeDesc: 'مجاناً لنفس البنك أو عبر إنستاباي'
  },
  {
    id: 'suez_canal',
    category: 'banks',
    categoryLabel: 'البنوك المصرية',
    name: 'بنك قناة السويس',
    fullName: 'حساب بنك قناة السويس',
    type: 'حساب بنكي',
    brandColor: '#002B49',
    gradient: 'linear-gradient(135deg, #002B49 0%, #00A896 60%, #001424 100%)',
    cardTheme: 'card-theme-aaib',
    cardNetwork: 'VISA',
    issuer: 'Suez Canal Bank',
    logo: SuezCanalBankLogo,
    feeDesc: 'مجاناً لنفس البنك أو عبر إنستاباي'
  },
  {
    id: 'united_bank',
    category: 'banks',
    categoryLabel: 'البنوك المصرية',
    name: 'المصرف المتحد',
    fullName: 'حساب المصرف المتحد (The United Bank)',
    type: 'حساب بنكي',
    brandColor: '#0A3A40',
    gradient: 'linear-gradient(135deg, #0A3A40 0%, #10B981 60%, #041B1F 100%)',
    cardTheme: 'card-theme-cash',
    cardNetwork: 'VISA',
    issuer: 'The United Bank',
    logo: UnitedBankLogo,
    feeDesc: 'مجاناً لنفس البنك أو عبر إنستاباي'
  },
  {
    id: 'meeza',
    category: 'cards',
    categoryLabel: 'بطاقات الدفع الوطنية',
    name: 'بطاقة ميزة الوطنية',
    fullName: 'بطاقة ميزة الوطنية للدفع الإلكتروني',
    type: 'بطاقة',
    brandColor: '#00843D',
    gradient: 'linear-gradient(135deg, #064E3B 0%, #1E3A8A 60%, #0F172A 100%)',
    cardTheme: 'card-theme-meeza',
    cardNetwork: 'Meeza',
    issuer: 'Meeza National Scheme',
    logo: MeezaLogo,
    feeDesc: 'بطاقة الدفع الوطنية المصرية'
  },
  {
    id: 'cash_wallet',
    category: 'cash',
    categoryLabel: 'النقدية والمحافظ اليدوية',
    name: 'محفظة كاش',
    fullName: 'محفظة النقدية الفورية (كاش)',
    type: 'كاش',
    brandColor: '#10B981',
    gradient: 'linear-gradient(135deg, #065F46 0%, #047857 60%, #022C22 100%)',
    cardTheme: 'card-theme-cash',
    cardNetwork: 'CASH',
    issuer: 'محفظة النقدية الفورية',
    logo: CashLogo,
    feeDesc: 'نقدية يدوية بدون أي رسوم'
  }
];

// =========================================================================
// 3.1 الشعارات الأصلية للبنوك والمحافظ (صور رسمية مدمجة)
// تُعرض داخل مربع أبيض أنيق بزوايا دائرية، مع الرجوع للشعار المتجه عند تعذر التحميل
// =========================================================================
function withBrandImage(id, FallbackLogo) {
  const src = BRAND_LOGO_SRC[id];
  if (!src) return FallbackLogo;

  function BrandLogo({ size = 28, className = '' }) {
    const [failed, setFailed] = React.useState(false);
    if (failed) return <FallbackLogo size={size} className={className} />;
    return (
      <span
        className={`brand-logo-tile ${className}`}
        style={{
          width: size,
          height: size,
          borderRadius: Math.max(6, Math.round(size * 0.28)),
          padding: Math.max(2, Math.round(size * 0.12))
        }}
      >
        <img src={src} alt="" draggable={false} onError={() => setFailed(true)} />
      </span>
    );
  }
  BrandLogo.displayName = `BrandLogo(${id})`;
  return BrandLogo;
}

FINANCIAL_INSTITUTIONS_PRESETS.forEach(preset => {
  preset.vectorLogo = preset.logo;
  preset.logo = withBrandImage(preset.id, preset.logo);
});

// ترتيب فئات الدليل للعرض المجمّع في القوائم
export const INSTITUTION_CATEGORIES = [
  { id: 'instapay', label: 'شبكة المدفوعات اللحظية' },
  { id: 'telecom', label: 'محافظ شركات الاتصالات' },
  { id: 'banks', label: 'البنوك المصرية' },
  { id: 'cards', label: 'بطاقات الدفع الوطنية' },
  { id: 'cash', label: 'النقدية' }
];

// دالة المطابقة الذكية للتعرف على البنك أو المحفظة من اسم الحساب أو نوعه
export function getBankOrWalletMeta(accountName = '', accountType = '') {
  const name = (accountName || '').toLowerCase();
  const type = (accountType || '').toLowerCase();

  // 1. إنستاباي
  if (name.includes('إنستاباي') || name.includes('انستاباي') || name.includes('instapay') || name.includes('ipn')) {
    return FINANCIAL_INSTITUTIONS_PRESETS.find(p => p.id === 'instapay');
  }

  // 2. فودافون كاش
  if (name.includes('فودافون') || name.includes('vodafone')) {
    return FINANCIAL_INSTITUTIONS_PRESETS.find(p => p.id === 'vodafone_cash');
  }

  // 3. أورنج كاش
  if (name.includes('أورنج') || name.includes('اورنج') || name.includes('orange')) {
    return FINANCIAL_INSTITUTIONS_PRESETS.find(p => p.id === 'orange_cash');
  }

  // 4. اتصالات كاش
  if (name.includes('اتصالات') || name.includes('etisalat') || name.includes('e&')) {
    return FINANCIAL_INSTITUTIONS_PRESETS.find(p => p.id === 'etisalat_cash');
  }

  // 5. وي باي
  if (/(^|\s)وي(\s|$)/.test(name) || name.includes('وي باي') || /\bwe\b/.test(name) || name.includes('telecom egypt')) {
    return FINANCIAL_INSTITUTIONS_PRESETS.find(p => p.id === 'we_pay');
  }

  // 5.1 بنوك إضافية (قبل المطابقات العامة مثل "مصر")
  if (name.includes('البركة') || name.includes('baraka')) {
    return FINANCIAL_INSTITUTIONS_PRESETS.find(p => p.id === 'albaraka');
  }
  if (name.includes('قناة السويس') || name.includes('suez')) {
    return FINANCIAL_INSTITUTIONS_PRESETS.find(p => p.id === 'suez_canal');
  }
  if (name.includes('المصرف المتحد') || name.includes('united bank')) {
    return FINANCIAL_INSTITUTIONS_PRESETS.find(p => p.id === 'united_bank');
  }

  // 6. البنك الأهلي المصري
  if (name.includes('أهلي') || name.includes('اهلي') || name.includes('nbe')) {
    return FINANCIAL_INSTITUTIONS_PRESETS.find(p => p.id === 'nbe');
  }

  // 7. بنك مصر
  if (name.includes('مصر') || name.includes('misr')) {
    return FINANCIAL_INSTITUTIONS_PRESETS.find(p => p.id === 'banque_misr');
  }

  // 8. CIB
  if (name.includes('cib') || name.includes('تجاري دولي')) {
    return FINANCIAL_INSTITUTIONS_PRESETS.find(p => p.id === 'cib');
  }

  // 9. بنك الإسكندرية
  if (name.includes('إسكندرية') || name.includes('اسكندرية') || name.includes('alex')) {
    return FINANCIAL_INSTITUTIONS_PRESETS.find(p => p.id === 'alex_bank');
  }

  // 10. بنك القاهرة
  if (name.includes('قاهرة') || name.includes('caire') || name.includes('cairo')) {
    return FINANCIAL_INSTITUTIONS_PRESETS.find(p => p.id === 'banque_du_caire');
  }

  // 11. QNB
  if (name.includes('qnb') || name.includes('قطر الوطني')) {
    return FINANCIAL_INSTITUTIONS_PRESETS.find(p => p.id === 'qnb');
  }

  // 12. أبوظبي الإسلامي
  if (name.includes('أبوظبي') || name.includes('ابوظبي') || name.includes('adib')) {
    return FINANCIAL_INSTITUTIONS_PRESETS.find(p => p.id === 'adib');
  }

  // 13. فيصل الإسلامي
  if (name.includes('فيصل') || name.includes('faisal')) {
    return FINANCIAL_INSTITUTIONS_PRESETS.find(p => p.id === 'faisal');
  }

  // 14. العربي الإفريقي
  if (name.includes('عربي إفريقي') || name.includes('عربي افريقي') || name.includes('aaib')) {
    return FINANCIAL_INSTITUTIONS_PRESETS.find(p => p.id === 'aaib');
  }

  // 15. HSBC
  if (name.includes('hsbc')) {
    return FINANCIAL_INSTITUTIONS_PRESETS.find(p => p.id === 'hsbc');
  }

  // 16. ميزة
  if (name.includes('ميزة') || name.includes('meeza')) {
    return FINANCIAL_INSTITUTIONS_PRESETS.find(p => p.id === 'meeza');
  }

  // 17. كاش
  if (name.includes('كاش') || type === 'كاش') {
    return FINANCIAL_INSTITUTIONS_PRESETS.find(p => p.id === 'cash_wallet');
  }

  // المطابقة بحسب النوع الافتراضي إذا لم يُحدد الاسم
  if (type === 'محفظة إلكترونية') {
    return FINANCIAL_INSTITUTIONS_PRESETS.find(p => p.id === 'vodafone_cash');
  }

  if (type === 'حساب بنكي' || type === 'حساب توفير' || type === 'استثمار') {
    return FINANCIAL_INSTITUTIONS_PRESETS.find(p => p.id === 'nbe');
  }

  // افتراضي
  return FINANCIAL_INSTITUTIONS_PRESETS.find(p => p.id === 'cash_wallet');
}

// مكون شارة أيقونة البنك/المحفظة الصغير المدمج (للقوائم، الجداول، الرقائق)
export function BankIconBadge({ account, size = 26, showName = false, className = '' }) {
  const meta = getBankOrWalletMeta(account?.name, account?.type);
  const LogoComponent = meta?.logo || CashLogo;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }} className={className}>
      <div style={{ flexShrink: 0, width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LogoComponent size={size} />
      </div>
      {showName && (
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
          {account?.name || meta?.name}
        </span>
      )}
    </div>
  );
}
