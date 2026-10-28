// Sarfy - Audio & Haptics Engine (Web Audio API & Vibration API)
// يعمل 100% أوفلاين دون الحاجة لملفات صوت خارجية أو استهلاك للذاكرة

let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function isSoundEnabled() {
  if (typeof localStorage === 'undefined') return true;
  return localStorage.getItem('sarfy_sound_enabled') !== 'false';
}

export function setSoundEnabled(enabled) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('sarfy_sound_enabled', enabled ? 'true' : 'false');
  }
}

// 1. الاهتزاز اللمسي الذكي للهواتف (Haptic Feedback)
export function triggerHaptic(type = 'light') {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  try {
    switch (type) {
      case 'light':
        navigator.vibrate(12);
        break;
      case 'medium':
        navigator.vibrate(25);
        break;
      case 'success':
        navigator.vibrate([15, 30, 25]);
        break;
      case 'warning':
      case 'danger':
        navigator.vibrate([30, 50, 35]);
        break;
      default:
        navigator.vibrate(15);
    }
  } catch {}
}

// 2. صوت النقر الخفيف الناعم (Keypad / Tab Click)
export function playClickSound() {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.025);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.025);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.03);
  } catch {}
}

// 3. صوت قلب الكارت ثلاثي الأبعاد (Card 3D Flip Whoosh)
export function playCardFlipSound() {
  if (!isSoundEnabled()) return;
  try {
    triggerHaptic('medium');
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(420, ctx.currentTime + 0.07);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.09);
  } catch {}
}

// 4. نغمة إتمام العملية المالية بنجاح (Apple Pay / Revolut Fintech Chord)
export function playSuccessSound() {
  if (!isSoundEnabled()) return;
  try {
    triggerHaptic('success');
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // نغمة مزدوجة راقية وفاخرة (E5 -> G#5)
    [659.25, 830.61].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);
      gain.gain.setValueAtTime(0, now + idx * 0.09);
      gain.gain.linearRampToValueAtTime(0.06, now + idx * 0.09 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.23);
    });
  } catch {}
}

// 5. صوت المسح أو التراجع (Muted double tick)
export function playDeleteSound() {
  if (!isSoundEnabled()) return;
  try {
    triggerHaptic('warning');
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [320, 240].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);
      gain.gain.setValueAtTime(0.05, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.035);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.04);
    });
  } catch {}
}
