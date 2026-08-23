import confetti from 'canvas-confetti';
import successSoundUrl from '../assets/success.mp3';
import winSoundUrl from '../assets/win.mp3';

// App palette used across the UI
const CONFETTI_COLORS = [
  '#2563eb',
  '#4f46e5',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#22d3ee',
];

// ========== AUDIO (Web Audio API) ==========
let audioCtx = null;

const getAudioContext = () => {
  try {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      audioCtx = new Ctx();
    }
    return audioCtx;
  } catch {
    return null;
  }
};

// Locate where the actual chime begins/ends inside a sound file by scanning
// loudness, so leading silence/intro is skipped automatically.
const analyzeBuffer = (buf) => {
  try {
    const ch = buf.getChannelData(0);
    const sr = buf.sampleRate;
    const win = Math.floor(sr * 0.02); // 20ms windows
    const rms = [];
    let peak = 0;
    for (let i = 0; i + win <= ch.length; i += win) {
      let sum = 0;
      for (let j = i; j < i + win; j++) sum += ch[j] * ch[j];
      const v = Math.sqrt(sum / win);
      rms.push(v);
      if (v > peak) peak = v;
    }
    const threshold = Math.max(peak * 0.15, 0.01);
    let onsetIdx = rms.findIndex((v) => v >= threshold);
    if (onsetIdx === -1) onsetIdx = 0;

    // Sound ends at the first sustained quiet stretch after onset
    let endIdx = rms.length - 1;
    let quietRun = 0;
    for (let k = onsetIdx; k < rms.length; k++) {
      quietRun = rms[k] < threshold * 0.4 ? quietRun + 1 : 0;
      if (quietRun >= 5) {
        endIdx = k - quietRun;
        break;
      }
    }

    const start = Math.max(0, (onsetIdx * win) / sr - 0.012);
    const end = ((endIdx + 1) * win) / sr;
    return { start, duration: Math.min(end - start, buf.duration - start) };
  } catch {
    return { start: 0, duration: buf.duration };
  }
};

// Small player wrapper around one bundled MP3: lazy-decodes once, then plays
// trimmed segments with a fade-out tail.
const createSound = (url) => {
  let buffer = null;
  let range = null;
  let started = false;

  return {
    load: (ctx) => {
      if (started) return;
      started = true;
      fetch(url)
        .then((r) => r.arrayBuffer())
        .then((ab) => ctx.decodeAudioData(ab))
        .then((buf) => {
          range = analyzeBuffer(buf);
          buffer = buf;
        })
        .catch(() => {
          // Synth fallback keeps working when decoding fails
        });
    },
    play: ({ maxDuration, gain }) => {
      const ctx = getAudioContext();
      if (!ctx || ctx.state !== 'running' || !buffer || !range) return false;

      try {
        const total = Math.min(range.duration, maxDuration);
        const source = ctx.createBufferSource();
        source.buffer = buffer;

        const g = ctx.createGain();
        g.gain.value = gain;
        // Gentle fade on the tail so cuts never click
        const fadeStart = Math.max(0, total - 0.09);
        g.gain.setValueAtTime(g.gain.value, ctx.currentTime + fadeStart);
        g.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + total);

        source.connect(g);
        g.connect(ctx.destination);
        source.start(0, range.start, total);
        return true;
      } catch {
        return false;
      }
    },
  };
};

const successSound = createSound(successSoundUrl);
const winSound = createSound(winSoundUrl);

// Call synchronously inside a user gesture (click/tap) so mobile browsers
// allow playback and sounds start decoding early. Safe to repeat.
export const unlockAudio = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  successSound.load(ctx);
  winSound.load(ctx);
};

// Clean marimba-style "pluck" used as fallback if the MP3 can't load/decode.
const playPluck = (ctx, destination, freq, startAt, duration, peakGain) => {
  const now = ctx.currentTime + startAt;

  const gain = ctx.createGain();
  gain.connect(destination);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(peakGain, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  const fundamental = ctx.createOscillator();
  fundamental.type = 'sine';
  fundamental.frequency.setValueAtTime(freq, now);
  fundamental.connect(gain);

  // Fast-decaying harmonic gives the soft mallet attack
  const harmonic = ctx.createOscillator();
  harmonic.type = 'sine';
  harmonic.frequency.setValueAtTime(freq * 3, now);
  const harmonicGain = ctx.createGain();
  harmonicGain.gain.setValueAtTime(peakGain * 0.3, now);
  harmonicGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.3);
  harmonic.connect(harmonicGain);
  harmonicGain.connect(destination);

  fundamental.start(now);
  harmonic.start(now);
  fundamental.stop(now + duration + 0.05);
  harmonic.stop(now + duration + 0.05);
};

// Payment-success sound. Prefers the real Google Pay chime MP3 once decoded;
// falls back to synthesized plucks if the file can't load.
export const playSuccessSound = ({ grand = false } = {}) => {
  if (
    successSound.play({
      maxDuration: grand ? 2.2 : 1.15,
      gain: grand ? 0.6 : 0.5,
    })
  ) {
    return;
  }

  const ctx = getAudioContext();
  if (!ctx || ctx.state !== 'running') return;

  try {
    const master = ctx.createGain();
    master.gain.value = grand ? 0.26 : 0.24;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 6000;
    master.connect(lowpass);
    lowpass.connect(ctx.destination);

    if (grand) {
      playPluck(ctx, master, 659.25, 0, 0.22, 0.6);
      playPluck(ctx, master, 987.77, 0.1, 0.28, 0.7);
      playPluck(ctx, master, 1318.51, 0.2, 0.55, 0.8);
      playPluck(ctx, master, 1975.53, 0.2, 0.4, 0.18);
    } else {
      playPluck(ctx, master, 987.77, 0, 0.2, 0.65);
      playPluck(ctx, master, 1318.51, 0.11, 0.45, 0.8);
    }
  } catch {
    // Audio should never break the UX
  }
};

// Game-win fanfare for completing every goal of the day
export const playWinSound = () => {
  winSound.play({ maxDuration: 3.4, gain: 0.55 });
};

// ========== CONFETTI (canvas-confetti, respects prefers-reduced-motion) ====
const baseOpts = {
  colors: CONFETTI_COLORS,
  disableForReducedMotion: true,
  zIndex: 200,
};

// Small tidy burst for a single completed goal - gentle launch, long float
export const fireGoalConfetti = () => {
  confetti({
    ...baseOpts,
    particleCount: 60,
    spread: 65,
    startVelocity: 26,
    scalar: 0.9,
    ticks: 230,
    gravity: 0.6,
    origin: { x: 0.5, y: 0.6 },
  });
};

// Fuller celebration for completing every goal of the day. Two waves of
// side cannons + central pop, all with long-lived slowly falling pieces.
export const firePerfectDayConfetti = () => {
  confetti({
    ...baseOpts,
    particleCount: 100,
    spread: 75,
    startVelocity: 34,
    scalar: 0.95,
    ticks: 260,
    gravity: 0.6,
    origin: { x: 0.5, y: 0.55 },
  });

  const sideCanons = () => {
    confetti({
      ...baseOpts,
      particleCount: 40,
      angle: 60,
      spread: 55,
      startVelocity: 36,
      ticks: 250,
      gravity: 0.6,
      origin: { x: 0, y: 0.75 },
    });
    confetti({
      ...baseOpts,
      particleCount: 40,
      angle: 120,
      spread: 55,
      startVelocity: 36,
      ticks: 250,
      gravity: 0.6,
      origin: { x: 1, y: 0.75 },
    });
  };
  setTimeout(sideCanons, 200);
  setTimeout(sideCanons, 700);
};
