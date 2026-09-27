/**
 * Audio Haptic Feedback Engine
 * Procedural Web Audio synthesis providing subtle, high-grade tactile acoustic feedback
 * (card draws, snaps, shuffles, hovers, successful saves, light taps)
 * synchronized with optional device vibration (Vibration API).
 */

import { getSharedAudioContext, getMasterAudioBus } from './audio';

export type AudioHapticType =
  | 'card_draw'      // Drawing/picking a tarot or oracle card (paper friction sweep + warm body + celestial shimmer)
  | 'card_snap'      // Snapping card into slot or flipping (crisp tactile micro-click)
  | 'card_shuffle'   // Rapid deck flutter / riffle when shuffling or spinning
  | 'card_hover'     // Micro-tick when skimming across card wheels or carousels
  | 'save_success'   // Radiant celestial affirmation double-chime (A5 -> E6 chord with low-mid cushion)
  | 'save_auto'      // Ultra-soft discreet water droplet ping for background autosave
  | 'tap_light'      // Modern tactile micro-switch tick (modals, tags, pills)
  | 'tap_impact'     // Punchy impact for energy-infused actions (toss, talisman consecration)
  | 'delete_discard' // Muted wooden dull thud for removal / clearing
;

export interface AudioHapticOptions {
  volume?: number;         // Relative gain multiplier (0.0 to 1.5, default 1.0)
  skipVibration?: boolean; // If true, only play acoustic audio without device vibration
}

const STORAGE_KEY_ENABLED = 'prism_audio_haptics_enabled';
const STORAGE_KEY_VOLUME = 'prism_audio_haptics_volume';

// Shared master haptic gain node to route through master limiter safely
let hapticSubBus: GainNode | null = null;

// Reusable short noise buffer for tactile transients (avoids re-allocating Float32Arrays on every tap)
let cachedNoiseBuffer: AudioBuffer | null = null;

function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (cachedNoiseBuffer && cachedNoiseBuffer.sampleRate === ctx.sampleRate) {
    return cachedNoiseBuffer;
  }
  const sampleRate = ctx.sampleRate;
  const duration = 0.25; // 250ms of pink-weighted noise is plenty for all micro-transients
  const bufferSize = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);

  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    data[i] = (b0 + b1 + b2 + white * 0.5362) * 0.22;
  }

  cachedNoiseBuffer = buffer;
  return buffer;
}

function getHapticBus(ctx: AudioContext): GainNode {
  if (hapticSubBus && hapticSubBus.context === ctx) {
    return hapticSubBus;
  }
  const masterBus = getMasterAudioBus();
  hapticSubBus = ctx.createGain();
  const savedVol = getAudioHapticsVolume();
  hapticSubBus.gain.setValueAtTime(savedVol, ctx.currentTime);
  hapticSubBus.connect(masterBus);
  return hapticSubBus;
}

/**
 * Checks whether audio haptics are enabled in user settings. Defaults to true.
 */
export function isAudioHapticsEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const val = localStorage.getItem(STORAGE_KEY_ENABLED);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

/**
 * Toggles audio haptics on or off. Dispatches 'prism:audio_haptics_changed'.
 */
export function setAudioHapticsEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_ENABLED, enabled ? 'true' : 'false');
    window.dispatchEvent(
      new CustomEvent('prism:audio_haptics_changed', {
        detail: { enabled, volume: getAudioHapticsVolume() },
      })
    );
  } catch (e) {
    console.warn('[AudioHaptics] Failed to persist enabled state:', e);
  }
}

/**
 * Gets master audio haptic volume multiplier (0.0 to 1.0, default 0.65).
 */
export function getAudioHapticsVolume(): number {
  if (typeof window === 'undefined') return 0.65;
  try {
    const val = localStorage.getItem(STORAGE_KEY_VOLUME);
    if (val === null) return 0.65;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0.65 : Math.max(0, Math.min(1, parsed));
  } catch {
    return 0.65;
  }
}

/**
 * Sets master audio haptic volume multiplier.
 */
export function setAudioHapticsVolume(volume: number): void {
  if (typeof window === 'undefined') return;
  const clamped = Math.max(0, Math.min(1, volume));
  try {
    localStorage.setItem(STORAGE_KEY_VOLUME, clamped.toFixed(2));
    if (hapticSubBus) {
      const ctx = hapticSubBus.context as AudioContext;
      hapticSubBus.gain.setValueAtTime(clamped, ctx.currentTime);
    }
    window.dispatchEvent(
      new CustomEvent('prism:audio_haptics_changed', {
        detail: { enabled: isAudioHapticsEnabled(), volume: clamped },
      })
    );
  } catch (e) {
    console.warn('[AudioHaptics] Failed to persist volume:', e);
  }
}

/**
 * Executes matching device vibration pattern if supported by hardware and browser.
 */
function triggerVibrationForType(type: AudioHapticType): void {
  if (typeof window === 'undefined' || typeof navigator === 'undefined' || !('vibrate' in navigator)) {
    return;
  }
  try {
    switch (type) {
      case 'card_draw':
        navigator.vibrate?.([14, 18, 12]);
        break;
      case 'card_snap':
        navigator.vibrate?.(12);
        break;
      case 'card_shuffle':
        navigator.vibrate?.([8, 14, 10, 18, 12]);
        break;
      case 'card_hover':
        navigator.vibrate?.(6);
        break;
      case 'save_success':
        navigator.vibrate?.([20, 35, 30]);
        break;
      case 'save_auto':
        navigator.vibrate?.(8);
        break;
      case 'tap_light':
        navigator.vibrate?.(10);
        break;
      case 'tap_impact':
        navigator.vibrate?.([25, 20, 25]);
        break;
      case 'delete_discard':
        navigator.vibrate?.([25, 30]);
        break;
    }
  } catch (_) {
    // Ignore vibration restrictions
  }
}

/**
 * Primary API: Synthesizes and plays high-quality audio haptic feedback immediately.
 * Zero asset loading latency, perfectly fluid and non-blocking.
 */
export function playAudioHaptic(type: AudioHapticType, options?: AudioHapticOptions): void {
  if (typeof window === 'undefined') return;

  // Check user toggle
  const enabled = isAudioHapticsEnabled();
  if (!enabled) return;

  // 1. Trigger synchronized tactile vibration if enabled
  if (!options?.skipVibration) {
    triggerVibrationForType(type);
  }

  // 2. Synthesize audio haptic via Web Audio
  try {
    const ctx = getSharedAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const bus = getHapticBus(ctx);
    const now = ctx.currentTime;
    const volScale = (options?.volume ?? 1.0);

    switch (type) {
      case 'card_draw': {
        // --- 1. Tactile Paper Friction Glide ("쉬-익") ---
        const noise = ctx.createBufferSource();
        noise.buffer = getNoiseBuffer(ctx);

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1550, now);
        filter.frequency.exponentialRampToValueAtTime(520, now + 0.08);
        filter.Q.setValueAtTime(3.2, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.0001, now);
        noiseGain.gain.linearRampToValueAtTime(0.14 * volScale, now + 0.008);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(bus);

        noise.start(now);
        noise.stop(now + 0.095);

        // --- 2. Low-mid Card Body Weight ("톡-") ---
        const bodyOsc = ctx.createOscillator();
        const bodyGain = ctx.createGain();
        bodyOsc.type = 'sine';
        bodyOsc.frequency.setValueAtTime(190, now);
        bodyOsc.frequency.exponentialRampToValueAtTime(80, now + 0.045);

        bodyGain.gain.setValueAtTime(0.0001, now);
        bodyGain.gain.linearRampToValueAtTime(0.10 * volScale, now + 0.004);
        bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

        bodyOsc.connect(bodyGain);
        bodyGain.connect(bus);

        bodyOsc.start(now);
        bodyOsc.stop(now + 0.055);

        // --- 3. Subtle Ethereal Air Shimmer Bloom ---
        const shimmerOsc = ctx.createOscillator();
        const shimmerGain = ctx.createGain();
        shimmerOsc.type = 'sine';
        shimmerOsc.frequency.setValueAtTime(2093, now); // C7

        shimmerGain.gain.setValueAtTime(0.0001, now);
        shimmerGain.gain.linearRampToValueAtTime(0.038 * volScale, now + 0.015);
        shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

        shimmerOsc.connect(shimmerGain);
        shimmerGain.connect(bus);

        shimmerOsc.start(now);
        shimmerOsc.stop(now + 0.15);
        break;
      }

      case 'card_snap': {
        // Micro-transient tactile snap
        const noise = ctx.createBufferSource();
        noise.buffer = getNoiseBuffer(ctx);

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(2800, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.12 * volScale, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.016);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(bus);

        noise.start(now);
        noise.stop(now + 0.02);

        // Mechanical body tick
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.018);

        oscGain.gain.setValueAtTime(0.14 * volScale, now);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.022);

        osc.connect(oscGain);
        oscGain.connect(bus);

        osc.start(now);
        osc.stop(now + 0.025);
        break;
      }

      case 'card_shuffle': {
        // Multi-card fluttering ruffle (4 quick staggered glides)
        const times = [0, 0.028, 0.056, 0.088];
        const freqs = [1420, 1680, 1280, 1850];

        times.forEach((offset, idx) => {
          const t = now + offset;
          const noise = ctx.createBufferSource();
          noise.buffer = getNoiseBuffer(ctx);

          const filter = ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(freqs[idx], t);
          filter.frequency.exponentialRampToValueAtTime(450, t + 0.045);
          filter.Q.setValueAtTime(3.5, t);

          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.0001, t);
          gain.gain.linearRampToValueAtTime((0.08 + idx * 0.015) * volScale, t + 0.005);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);

          noise.connect(filter);
          filter.connect(gain);
          gain.connect(bus);

          noise.start(t);
          noise.stop(t + 0.055);
        });
        break;
      }

      case 'card_hover': {
        // Ultra-delicate micro-tick when skimming across card wheels (feels like digital crown)
        const noise = ctx.createBufferSource();
        noise.buffer = getNoiseBuffer(ctx);

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1950, now);
        filter.Q.setValueAtTime(4.0, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.028 * volScale, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.008);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(bus);

        noise.start(now);
        noise.stop(now + 0.01);
        break;
      }

      case 'save_success': {
        // Pure luminous affirmation double chime chord (A5 -> E6 with rich overtones)
        // 1. Warm grounding foundation
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(220, now);
        subGain.gain.setValueAtTime(0.0001, now);
        subGain.gain.linearRampToValueAtTime(0.08 * volScale, now + 0.015);
        subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
        subOsc.connect(subGain);
        subGain.connect(bus);
        subOsc.start(now);
        subOsc.stop(now + 0.24);

        // 2. Note 1: A5 (880 Hz)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, now);
        gain1.gain.setValueAtTime(0.0001, now);
        gain1.gain.linearRampToValueAtTime(0.18 * volScale, now + 0.008);
        gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
        osc1.connect(gain1);
        gain1.connect(bus);
        osc1.start(now);
        osc1.stop(now + 0.45);

        // Harmonic overtone 1760 Hz
        const overtone1 = ctx.createOscillator();
        const overGain1 = ctx.createGain();
        overtone1.type = 'sine';
        overtone1.frequency.setValueAtTime(1760, now);
        overGain1.gain.setValueAtTime(0.0001, now);
        overGain1.gain.linearRampToValueAtTime(0.045 * volScale, now + 0.008);
        overGain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
        overtone1.connect(overGain1);
        overGain1.connect(bus);
        overtone1.start(now);
        overtone1.stop(now + 0.3);

        // 3. Note 2: E6 (1318.5 Hz) - delayed by 75ms
        const t2 = now + 0.075;
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1318.51, t2);
        gain2.gain.setValueAtTime(0.0001, t2);
        gain2.gain.linearRampToValueAtTime(0.22 * volScale, t2 + 0.008);
        gain2.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.55);
        osc2.connect(gain2);
        gain2.connect(bus);
        osc2.start(t2);
        osc2.stop(t2 + 0.58);

        // Harmonic overtone 2637 Hz
        const overtone2 = ctx.createOscillator();
        const overGain2 = ctx.createGain();
        overtone2.type = 'sine';
        overtone2.frequency.setValueAtTime(2637, t2);
        overGain2.gain.setValueAtTime(0.0001, t2);
        overGain2.gain.linearRampToValueAtTime(0.05 * volScale, t2 + 0.008);
        overGain2.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.38);
        overtone2.connect(overGain2);
        overGain2.connect(bus);
        overtone2.start(t2);
        overtone2.stop(t2 + 0.4);
        break;
      }

      case 'save_auto': {
        // Discrete water droplet bell ping (C6 1046.5 Hz)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1046.5, now);
        osc.frequency.exponentialRampToValueAtTime(980, now + 0.1);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.045 * volScale, now + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

        osc.connect(gain);
        gain.connect(bus);

        osc.start(now);
        osc.stop(now + 0.13);
        break;
      }

      case 'tap_light': {
        // Modern tactile mechanical micro-switch tick
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1150, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.012);

        gain.gain.setValueAtTime(0.06 * volScale, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.014);

        osc.connect(gain);
        gain.connect(bus);

        osc.start(now);
        osc.stop(now + 0.016);
        break;
      }

      case 'tap_impact': {
        // Substantial tactile impact for energy actions (toss, talisman blessing)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(290, now);
        osc.frequency.exponentialRampToValueAtTime(75, now + 0.06);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.18 * volScale, now + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

        osc.connect(gain);
        gain.connect(bus);

        osc.start(now);
        osc.stop(now + 0.075);

        // Air burst shimmer
        const noise = ctx.createBufferSource();
        noise.buffer = getNoiseBuffer(ctx);
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1800, now);
        filter.Q.setValueAtTime(2.5, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.08 * volScale, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(bus);

        noise.start(now);
        noise.stop(now + 0.05);
        break;
      }

      case 'delete_discard': {
        // Low muted wooden dull tap for removal / clearing
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(130, now);
        osc.frequency.exponentialRampToValueAtTime(55, now + 0.06);

        gain.gain.setValueAtTime(0.10 * volScale, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

        osc.connect(gain);
        gain.connect(bus);

        osc.start(now);
        osc.stop(now + 0.075);
        break;
      }
    }
  } catch (err) {
    // Non-critical audio warning
    console.warn('[AudioHaptics] Synthesis error:', err);
  }
}
