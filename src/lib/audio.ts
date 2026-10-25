// Synthesized audio helper for Quiz exit warning and anti-cheat system alerts using Web Audio API

let globalAppVolume = 1.0; // Default app volume at max 1.0
let maxAppVolumeSetDuringQuiz = 1.0; // Track highest volume set during quiz to prevent lowering
let isQuizVolumeLocked = false;
let sharedAudioCtx: AudioContext | null = null;

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

export function getAppVolume(): number {
  return globalAppVolume;
}

export function lockMaxVolumeForQuiz(): void {
  isQuizVolumeLocked = true;
  globalAppVolume = 1.0; // 100% Volume
  maxAppVolumeSetDuringQuiz = 1.0;
  ensureAudioContext();
}

export function setAppVolumeDuringQuiz(newVol: number): { allowed: boolean; currentVolume: number } {
  // If quiz is active, volume is locked at maximum and cannot be decreased
  if (isQuizVolumeLocked || newVol < maxAppVolumeSetDuringQuiz) {
    return { allowed: false, currentVolume: 1.0 };
  }
  globalAppVolume = Math.min(1, Math.max(0, newVol));
  maxAppVolumeSetDuringQuiz = Math.max(maxAppVolumeSetDuringQuiz, globalAppVolume);
  return { allowed: true, currentVolume: globalAppVolume };
}

export function resetAppVolumeLock(): void {
  isQuizVolumeLocked = false;
  maxAppVolumeSetDuringQuiz = 0.8;
  globalAppVolume = 0.8;
}

/**
 * Play a very loud, sharp piercing alarm sound ("beep gede")
 * Uses dual-harmonic high-gain square & sawtooth oscillators and mobile vibration
 */
export function playQuizExitAlertSound(): void {
  try {
    const ctx = ensureAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Master gain set to full 1.0 for loud alert
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(1.0, now);
    masterGain.connect(ctx.destination);

    // Dynamic compressor to prevent distortion while maximizing audible punch
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-12, now);
    compressor.knee.setValueAtTime(10, now);
    compressor.ratio.setValueAtTime(12, now);
    compressor.attack.setValueAtTime(0.003, now);
    compressor.release.setValueAtTime(0.15, now);
    compressor.connect(masterGain);

    // Sequence of 4 loud, piercing high-alert security beeps (BEEP - BEEP - BEEP - BEEEEEP)
    const beeps = [
      { start: 0.00, dur: 0.22, freq: 1100, type: 'square' as OscillatorType },
      { start: 0.28, dur: 0.22, freq: 1100, type: 'square' as OscillatorType },
      { start: 0.56, dur: 0.22, freq: 1350, type: 'square' as OscillatorType },
      { start: 0.84, dur: 0.50, freq: 1650, type: 'sawtooth' as OscillatorType },
    ];

    beeps.forEach(({ start, dur, freq, type }) => {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const toneGain = ctx.createGain();

      osc1.type = type;
      osc1.frequency.setValueAtTime(freq, now + start);

      // Higher harmonic octave for aggressive piercing sound that cuts through mobile speakers
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(freq * 1.5, now + start);

      toneGain.gain.setValueAtTime(1.0, now + start);
      toneGain.gain.setValueAtTime(1.0, now + start + dur - 0.02);
      toneGain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

      osc1.connect(toneGain);
      osc2.connect(toneGain);
      toneGain.connect(compressor);

      osc1.start(now + start);
      osc1.stop(now + start + dur);
      osc2.start(now + start);
      osc2.stop(now + start + dur);
    });

    // Mobile hardware vibration for alarm feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([400, 120, 400, 120, 400, 120, 800]);
      } catch (e) {
        // Ignore vibration errors if blocked by browser policy
      }
    }
  } catch (err) {
    console.warn('Audio playback error:', err);
  }
}
