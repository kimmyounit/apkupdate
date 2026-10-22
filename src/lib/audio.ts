// Synthesized audio helper for Quiz exit warning and system alerts using Web Audio API

let globalAppVolume = 0.8; // App volume between 0 and 1
let maxAppVolumeSetDuringQuiz = 0.8; // Track highest volume set during quiz to prevent lowering

export function getAppVolume(): number {
  return globalAppVolume;
}

export function setAppVolumeDuringQuiz(newVol: number): { allowed: boolean; currentVolume: number } {
  // If volume was increased, student cannot decrease it during quiz
  if (newVol < maxAppVolumeSetDuringQuiz) {
    return { allowed: false, currentVolume: globalAppVolume };
  }
  globalAppVolume = Math.min(1, Math.max(0, newVol));
  maxAppVolumeSetDuringQuiz = globalAppVolume;
  return { allowed: true, currentVolume: globalAppVolume };
}

export function resetAppVolumeLock() {
  maxAppVolumeSetDuringQuiz = 0.8;
  globalAppVolume = 0.8;
}

export function playQuizExitAlertSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Siren / Buzzer oscillation
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sawtooth';
    // Frequency oscillation between 440Hz and 880Hz to mimic high alert alarm
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.linearRampToValueAtTime(880, now + 0.15);
    osc.frequency.linearRampToValueAtTime(440, now + 0.3);
    osc.frequency.linearRampToValueAtTime(880, now + 0.45);
    osc.frequency.linearRampToValueAtTime(440, now + 0.6);

    const actualVol = Math.max(0.2, globalAppVolume);
    gainNode.gain.setValueAtTime(actualVol, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.75);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.75);
  } catch (err) {
    console.warn('Audio playback prevented or unsupported:', err);
  }
}
