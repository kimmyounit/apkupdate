// Web Audio API Synthesizer helper for TAMVESTA Quiz & In-App Events
// Respects device volume, provides in-app volume slider, and handles browser autoplay policies cleanly.

const VOLUME_STORAGE_KEY = 'tamvesta_quiz_volume';
const MUTE_STORAGE_KEY = 'tamvesta_quiz_muted';

let globalAppVolume = 0.85; // Default app volume 85%
let isAppMuted = false;
let sharedAudioCtx: AudioContext | null = null;

// Initialize from localStorage if available
try {
  if (typeof localStorage !== 'undefined') {
    const savedVol = localStorage.getItem(VOLUME_STORAGE_KEY);
    if (savedVol !== null) {
      const parsed = parseFloat(savedVol);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
        globalAppVolume = parsed;
      }
    }
    const savedMute = localStorage.getItem(MUTE_STORAGE_KEY);
    if (savedMute !== null) {
      isAppMuted = savedMute === 'true';
    }
  }
} catch (_) {}

/**
 * Pastikan AudioContext aktif dan siap memutar suara.
 * Ditangani dengan aman sesuai kebijakan autoplay browser modern (Android, iOS, Desktop).
 */
export function ensureAudioContext(): AudioContext | null {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioContextClass();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch (err) {
    return null;
  }
}

/**
 * Ambil volume suara aplikasi saat ini (0.0 sampai 1.0)
 */
export function getAppVolume(): number {
  return isAppMuted ? 0 : globalAppVolume;
}

/**
 * Atur volume suara aplikasi secara bebas (0.0 sampai 1.0)
 * Pengguna bebas menaikkan atau menurunkan volume tanpa dikunci.
 */
export function setAppVolume(newVol: number): number {
  const clamped = Math.min(1, Math.max(0, newVol));
  globalAppVolume = clamped;
  if (clamped > 0 && isAppMuted) {
    isAppMuted = false;
  }
  try {
    localStorage.setItem(VOLUME_STORAGE_KEY, clamped.toString());
    localStorage.setItem(MUTE_STORAGE_KEY, isAppMuted.toString());
  } catch (_) {}
  return clamped;
}

/**
 * Cek status bisu (mute)
 */
export function isMuted(): boolean {
  return isAppMuted;
}

/**
 * Toggle mute suara aplikasi
 */
export function toggleMute(): boolean {
  isAppMuted = !isAppMuted;
  try {
    localStorage.setItem(MUTE_STORAGE_KEY, isAppMuted.toString());
  } catch (_) {}
  return isAppMuted;
}

// Kompatibilitas alias tanpa pemaksaan lock
export function lockMaxVolumeForQuiz(): void {
  ensureAudioContext();
}

export function setAppVolumeDuringQuiz(newVol: number): { allowed: boolean; currentVolume: number } {
  const vol = setAppVolume(newVol);
  return { allowed: true, currentVolume: vol };
}

export function resetAppVolumeLock(): void {
  // Tidak mengunci apa pun
}

/**
 * Helper internal untuk membuat master gain berdasarkan volume aplikasi
 */
function createMasterGain(ctx: AudioContext): GainNode | null {
  const vol = getAppVolume();
  if (vol <= 0.001) return null; // Sedang mute / volume nol
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.connect(ctx.destination);
  return gain;
}

/**
 * 1. Suara penanda saat Quiz Dimulai
 * Nada harmonis naik (C5 - E5 - G5 - C6) yang jelas dan menyenangkan
 */
export function playQuizStartSound(): void {
  try {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    const masterGain = createMasterGain(ctx);
    if (!masterGain) return;

    const now = ctx.currentTime;
    const notes = [
      { freq: 523.25, start: 0.00, dur: 0.12 }, // C5
      { freq: 659.25, start: 0.10, dur: 0.12 }, // E5
      { freq: 783.99, start: 0.20, dur: 0.12 }, // G5
      { freq: 1046.50, start: 0.30, dur: 0.35 }, // C6
    ];

    notes.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0.7, now + start);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now + start);
      osc.stop(now + start + dur);
    });

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(80); } catch (_) {}
    }
  } catch (err) {
    console.warn('Audio start sound error:', err);
  }
}

/**
 * 2. Suara penanda saat ada Peringatan Waktu (misal: 1 Menit Terakhir)
 * Double-beep alert (880Hz, 880Hz) yang jelas sebagai pengingat waktu
 */
export function playQuizTimerWarningSound(): void {
  try {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    const masterGain = createMasterGain(ctx);
    if (!masterGain) return;

    const now = ctx.currentTime;
    const beeps = [
      { start: 0.00, dur: 0.12, freq: 880 },
      { start: 0.18, dur: 0.18, freq: 880 },
    ];

    beeps.forEach(({ start, dur, freq }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0.8, now + start);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now + start);
      osc.stop(now + start + dur);
    });

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate([100, 80, 100]); } catch (_) {}
    }
  } catch (err) {
    console.warn('Audio timer warning error:', err);
  }
}

/**
 * 3. Suara penanda ketika Siswa Memilih Jawaban
 * Tick lembut responsif
 */
export function playQuizSelectOptionSound(): void {
  try {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    const masterGain = createMasterGain(ctx);
    if (!masterGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(640, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.06);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.06);
  } catch (_) {}
}

/**
 * 4. Suara penanda saat Quiz Berhasil Diserahkan / Selesai
 * Fanfare perayaan keberhasilan
 */
export function playQuizSubmitSuccessSound(): void {
  try {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    const masterGain = createMasterGain(ctx);
    if (!masterGain) return;

    const now = ctx.currentTime;
    const chords = [
      { freq: 523.25, start: 0.00, dur: 0.15 },
      { freq: 659.25, start: 0.12, dur: 0.15 },
      { freq: 783.99, start: 0.24, dur: 0.20 },
      { freq: 1046.50, start: 0.38, dur: 0.45 },
    ];

    chords.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0.6, now + start);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now + start);
      osc.stop(now + start + dur);
    });

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate([150, 100, 200]); } catch (_) {}
    }
  } catch (err) {
    console.warn('Audio submit success error:', err);
  }
}

/**
 * 5. Suara penanda peringatan ketika siswa mencoba keluar dari halaman Quiz
 */
export function playQuizExitAlertSound(): void {
  try {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    const masterGain = createMasterGain(ctx);
    if (!masterGain) return;

    const now = ctx.currentTime;
    const beeps = [
      { start: 0.00, dur: 0.18, freq: 1050, type: 'square' as OscillatorType },
      { start: 0.22, dur: 0.18, freq: 1050, type: 'square' as OscillatorType },
      { start: 0.44, dur: 0.22, freq: 1250, type: 'square' as OscillatorType },
      { start: 0.70, dur: 0.35, freq: 1450, type: 'sawtooth' as OscillatorType },
    ];

    beeps.forEach(({ start, dur, freq, type }) => {
      const osc = ctx.createOscillator();
      const toneGain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + start);

      toneGain.gain.setValueAtTime(0.85, now + start);
      toneGain.gain.setValueAtTime(0.85, now + start + dur - 0.03);
      toneGain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

      osc.connect(toneGain);
      toneGain.connect(masterGain);

      osc.start(now + start);
      osc.stop(now + start + dur);
    });

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate([300, 100, 300, 100, 500]); } catch (_) {}
    }
  } catch (err) {
    console.warn('Audio exit alert error:', err);
  }
}
