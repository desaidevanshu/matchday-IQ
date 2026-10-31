/**
 * MATCHDAY IQ — Web Audio Synthesizer for Stadium Atmosphere
 * Generates dynamic cricket crowd cheers, wicket sirens, and gasps using Web Audio oscillators.
 * 100% standalone, zero network requests, instant playback.
 */

let audioCtx = null;
let isMuted = false;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function setAudioMuted(muted) {
  isMuted = muted;
}

export function getAudioMuted() {
  return isMuted;
}

/**
 * Crowd Roar / Boundary Cheer
 */
export function playCrowdCheer() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const bufferSize = ctx.sampleRate * 1.5;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  // Pink noise approximation for crowd roar
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99 * b0 + white * 0.05;
    b1 = 0.95 * b1 + white * 0.1;
    b2 = 0.85 * b2 + white * 0.25;
    data[i] = (b0 + b1 + b2) * 0.35;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(450, now);
  filter.frequency.exponentialRampToValueAtTime(1400, now + 0.4);
  filter.frequency.exponentialRampToValueAtTime(300, now + 1.4);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.01, now);
  gain.gain.linearRampToValueAtTime(0.4, now + 0.3);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start(now);
  noise.stop(now + 1.5);
}

/**
 * Crowd Gasp (Near-miss, appeal, dot ball)
 */
export function playCrowdGasp() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(380, now);
  osc.frequency.exponentialRampToValueAtTime(180, now + 0.45);

  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.5);
}

/**
 * Wicket Siren / Out Alarm
 */
export function playWicketSiren() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  // Siren pitch oscillation
  osc.frequency.setValueAtTime(500, now);
  osc.frequency.linearRampToValueAtTime(880, now + 0.15);
  osc.frequency.linearRampToValueAtTime(440, now + 0.3);
  osc.frequency.linearRampToValueAtTime(880, now + 0.45);
  osc.frequency.linearRampToValueAtTime(440, now + 0.6);

  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.75);

  // Follow with a small gasp/cheer
  setTimeout(() => playCrowdCheer(), 200);
}

/**
 * Boundary Crack sound (bat hitting ball)
 */
export function playBoundaryCrack() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(120, now);
  osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

  gain.gain.setValueAtTime(0.4, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.2);

  setTimeout(() => playCrowdCheer(), 80);
}

