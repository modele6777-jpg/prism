import { acquireScreenWakeLock, releaseScreenWakeLock } from './wakeLock';

let sharedAudioCtx: AudioContext | null = null;
let masterBusInput: GainNode | null = null;
let masterBusLimiter: DynamicsCompressorNode | null = null;
let ambientBusInput: GainNode | null = null;
let activePCMSource: AudioBufferSourceNode | null = null;
let currentPlaybackId = 0;

function ensureMasterChain(ctx: AudioContext) {
  if (masterBusInput && masterBusLimiter && masterBusInput.context === ctx) return;

  masterBusInput = ctx.createGain();
  masterBusLimiter = ctx.createDynamicsCompressor();
  masterBusLimiter.threshold.setValueAtTime(-18, ctx.currentTime);
  masterBusLimiter.knee.setValueAtTime(12, ctx.currentTime);
  masterBusLimiter.ratio.setValueAtTime(2.5, ctx.currentTime);
  masterBusLimiter.attack.setValueAtTime(0.005, ctx.currentTime);
  masterBusLimiter.release.setValueAtTime(0.15, ctx.currentTime);
  masterBusInput.gain.setValueAtTime(1.0, ctx.currentTime);
  masterBusInput.connect(masterBusLimiter);
  masterBusLimiter.connect(ctx.destination);
}

/**
 * Utility to get or create a shared AudioContext singleton.
 * Call this during user interactions to ensure it's in a running state.
 */
export function getSharedAudioContext(): AudioContext {
  if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined' && typeof (window as any).webkitAudioContext === 'undefined') {
    throw new Error('AudioContext is only available in a browser with Web Audio support');
  }

  if (!sharedAudioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    try {
      sharedAudioCtx = new AudioContextClass({ latencyHint: 'playback' });
    } catch {
      // Older Safari versions may not accept constructor options.
      sharedAudioCtx = new AudioContextClass();
    }
    ensureMasterChain(sharedAudioCtx);
  }

  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(err => console.warn("[Audio] Failed to resume shared AudioContext:", err));
  }

  return sharedAudioCtx;
}

/** BgMusicPlayer master gain multiplier (user slider × this value). */
export const AMBIENT_MASTER_GAIN_SCALE = 1.6;

/** HTML5 audio element gain when routed through Web Audio (2× previous loudness). */
export const BGM_HTML_GAIN_SCALE = 2.0;

const AMBIENT_BUS_IDLE_GAIN = 1.0;

export function getMasterAudioBus(): GainNode {
  const ctx = getSharedAudioContext();
  ensureMasterChain(ctx);
  return masterBusInput!;
}

export function getAmbientAudioBus(): GainNode {
  const ctx = getSharedAudioContext();
  ensureMasterChain(ctx);
  if (!ambientBusInput || ambientBusInput.context !== ctx) {
    ambientBusInput = ctx.createGain();
    ambientBusInput.gain.setValueAtTime(
      AMBIENT_BUS_IDLE_GAIN,
      ctx.currentTime,
    );
    ambientBusInput.connect(masterBusInput!);
  }
  return ambientBusInput;
}

let isAmbientDucked = false;

/**
 * Smoothly ducks the ambient background music bus to 25% volume during TTS speech
 * and gently restores it to 100% when speech concludes.
 */
export function duckAmbientAudio(duck: boolean, durationSec: number = 0.35): void {
  try {
    if (typeof window === 'undefined') return;
    const ctx = getSharedAudioContext();
    const bus = getAmbientAudioBus();
    const now = ctx.currentTime;

    const targetGain = duck ? 0.25 : 1.0;
    isAmbientDucked = duck;

    bus.gain.cancelScheduledValues(now);
    bus.gain.setValueAtTime(bus.gain.value, now);
    bus.gain.linearRampToValueAtTime(targetGain, now + Math.max(0.1, durationSec));

    window.dispatchEvent(new CustomEvent('prism-audio-duck', { detail: { duck, targetGain } }));
  } catch (err) {
    // Non-critical audio warning
  }
}

export function isAmbientAudioDucked(): boolean {
  return isAmbientDucked;
}

export type NoiseColor = 'white' | 'pink' | 'brown';

export function createSeamlessNoiseBuffer(
  ctx: AudioContext,
  type: NoiseColor,
  seconds: number = 8,
): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const bufferSize = Math.floor(sampleRate * seconds);
  const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);

  if (type === 'white') {
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  } else if (type === 'pink') {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.055;
      b6 = white * 0.115926;
    }
  } else {
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.015 * white) / 1.015;
      lastOut = data[i];
      data[i] *= 2.8;
    }
  }

  const fadeSamples = Math.floor(sampleRate * 0.35);
  for (let i = 0; i < fadeSamples; i++) {
    const alpha = i / fadeSamples;
    const fadeCurve = alpha * alpha * (3 - 2 * alpha);
    data[i] = data[i] * fadeCurve + data[bufferSize - fadeSamples + i] * (1 - fadeCurve);
  }

  return buffer;
}

export function createLoopingNoiseSource(
  ctx: AudioContext,
  type: NoiseColor,
  seconds: number = 8,
): AudioBufferSourceNode {
  const source = ctx.createBufferSource();
  source.buffer = createSeamlessNoiseBuffer(ctx, type, seconds);
  source.loop = true;
  return source;
}

export function detectAudioFormat(bytes: Uint8Array): 'mp3' | 'wav' | 'ogg' | 'pcm' {
  if (!bytes || bytes.length < 4) return 'pcm';

  // WAV: 'RIFF' .... 'WAVE'
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
    return 'wav';
  }
  // MP3: 'ID3' header
  if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
    return 'mp3';
  }
  // MP3: Frame sync (11 consecutive 1s: 0xFF followed by 0xEx/0xFx)
  if (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) {
    return 'mp3';
  }
  // OGG: 'OggS'
  if (bytes[0] === 0x4f && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) {
    return 'ogg';
  }
  // FLAC: 'fLaC'
  if (bytes[0] === 0x66 && bytes[1] === 0x4c && bytes[2] === 0x61 && bytes[3] === 0x43) {
    return 'wav';
  }

  return 'pcm';
}

/**
 * Physically stops any currently playing raw PCM source.
 */
export function stopRawPCM() {
  currentPlaybackId++;
  if (activePCMSource) {
    try {
      activePCMSource.stop();
    } catch (e) {
      // already stopped or not started
    }
    activePCMSource = null;
  }
}

/**
 * Utility to play raw PCM 16-bit audio data at a specific sample rate.
 */
export async function playRawPCM(base64: string, sampleRate: number = 24000): Promise<void> {
  try {
    // Stop any existing PCM playback first
    stopRawPCM();
    const activePlaybackId = currentPlaybackId;

    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Auto-detect if caller passed encoded MP3/WAV/OGG instead of raw PCM to prevent screeching noise
    const detectedFormat = detectAudioFormat(bytes);
    if (detectedFormat !== 'pcm') {
      return playCompressedAudio(base64);
    }

    // Convert raw PCM 16-bit (little-endian) to float32 safely
    const int16Array = new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2));
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0;
    }

    // Use shared AudioContext to prevent autoplay restriction issues in async callbacks
    const audioCtx = getSharedAudioContext();
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }
    
    if (activePlaybackId !== currentPlaybackId) {
      return; // Aborted
    }
    
    const audioBuffer = audioCtx.createBuffer(1, float32Array.length, sampleRate);
    audioBuffer.getChannelData(0).set(float32Array);

    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);
    
    activePCMSource = source;
    
    return new Promise((resolve) => {
      let settled = false;
      const onEnded = () => {
        if (settled) return;
        settled = true;
        if (activePCMSource === source) {
          activePCMSource = null;
        }
        resolve();
      };
      source.onended = onEnded;

      // Safety timeout: If browser drops onended event, resolve cleanly after buffer duration
      const durationMs = ((float32Array.length / sampleRate) * 1000) + 250;
      setTimeout(() => {
        if (!settled) {
          onEnded();
        }
      }, durationMs);

      source.start();
    });
  } catch (error) {
    console.error('[AudioPlayer] Failed to play PCM:', error);
    throw error;
  }
}

export async function safeDecodeAudioData(
  audioCtx: AudioContext,
  arrayBuffer: ArrayBuffer
): Promise<AudioBuffer> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const onSuccess = (decoded: AudioBuffer) => {
      if (settled) return;
      settled = true;
      resolve(decoded);
    };
    const onError = (err: any) => {
      if (settled) return;
      settled = true;
      reject(err || new Error('decodeAudioData failed'));
    };

    try {
      const promise = audioCtx.decodeAudioData(arrayBuffer, onSuccess, onError);
      if (promise && typeof promise.then === 'function') {
        promise.then(onSuccess).catch(onError);
      }
    } catch (e) {
      onError(e);
    }
  });
}

/**
 * Utility to play base64 compressed audio (e.g. mp3) using the shared AudioContext.
 * This is 100% immune to browser autoplay restrictions that block HTMLAudioElement
 * when played asynchronously after a fetch request.
 */
export async function playCompressedAudio(base64: string, playbackRate: number = 1.0, detune: number = 0): Promise<void> {
  try {
    // Stop any existing raw PCM source
    stopRawPCM();
    const activePlaybackId = ++currentPlaybackId;

    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const detectedFormat = detectAudioFormat(bytes);
    if (detectedFormat === 'pcm') {
      return playRawPCM(base64, 24000);
    }

    const audioCtx = getSharedAudioContext();
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }

    if (activePlaybackId !== currentPlaybackId) {
      return; // Aborted
    }

    // Decode the compressed audio (mp3/aac/etc) ArrayBuffer
    const decodedBuffer = await safeDecodeAudioData(audioCtx, bytes.buffer.slice(0));

    if (activePlaybackId !== currentPlaybackId) {
      return; // Aborted
    }

    const source = audioCtx.createBufferSource();
    source.buffer = decodedBuffer;
    if (playbackRate && playbackRate !== 1.0) {
      try {
        source.playbackRate.value = playbackRate;
      } catch (_) {}
    }
    if (detune && detune !== 0) {
      try {
        if ('detune' in source) {
          source.detune.value = detune;
        }
      } catch (_) {}
    }

    const masterBus = getMasterAudioBus();
    source.connect(masterBus);

    activePCMSource = source;

    return new Promise((resolve) => {
      let settled = false;
      const onEnded = () => {
        if (settled) return;
        settled = true;
        if (activePCMSource === source) {
          activePCMSource = null;
        }
        resolve();
      };
      source.onended = onEnded;

      // Safety timeout: If browser drops onended event, resolve cleanly after buffer duration
      const durationMs = (((decodedBuffer.duration || 1) * 1000) / (playbackRate || 1.0)) + 250;
      setTimeout(() => {
        if (!settled) {
          onEnded();
        }
      }, durationMs);

      source.start(0);
    });
  } catch (error) {
    console.error('[AudioPlayer] Failed to play compressed audio:', error);
    throw error;
  }
}

// --- TTS HTML5 Audio (continues when screen is locked / app backgrounded) ---

const SILENT_WAV_DATA_URI =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAA=';

let ttsAudioEl: HTMLAudioElement | null = null;
let ttsBlobUrl: string | null = null;
let ttsPlaybackId = 0;
let ttsShouldBePlaying = false;
let ttsKeepAliveEl: HTMLAudioElement | null = null;

function revokeTTSBlobUrl() {
  if (ttsBlobUrl) {
    URL.revokeObjectURL(ttsBlobUrl);
    ttsBlobUrl = null;
  }
}

function writeAscii(view: DataView, offset: number, text: string) {
  for (let i = 0; i < text.length; i++) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}

function pcm16ToWavBlob(bytes: Uint8Array, sampleRate: number): Blob {
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = bytes.length;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataSize, true);
  new Uint8Array(buffer, 44).set(bytes);

  return new Blob([buffer], { type: 'audio/wav' });
}

function base64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function startTTSKeepAlive() {
  if (typeof window === 'undefined') return;
  try {
    if (!ttsKeepAliveEl) {
      ttsKeepAliveEl = new Audio(SILENT_WAV_DATA_URI);
      ttsKeepAliveEl.loop = true;
      ttsKeepAliveEl.volume = 0.001;
      ttsKeepAliveEl.setAttribute('playsinline', 'true');
    }
    if (ttsKeepAliveEl.paused) {
      ttsKeepAliveEl.play().catch(() => {});
    }
  } catch {
    // best-effort iOS background keep-alive
  }
}

function stopTTSKeepAlive() {
  if (!ttsKeepAliveEl) return;
  try {
    ttsKeepAliveEl.pause();
    ttsKeepAliveEl.currentTime = 0;
  } catch {
    // ignore
  }
}

export function getTTSAudioElement(): HTMLAudioElement {
  if (typeof window === 'undefined') {
    throw new Error('HTMLAudioElement is only available in the browser');
  }
  if (!ttsAudioEl) {
    ttsAudioEl = new Audio();
    ttsAudioEl.preload = 'auto';
    ttsAudioEl.setAttribute('playsinline', 'true');
    ttsAudioEl.setAttribute('webkit-playsinline', 'true');
    ttsAudioEl.setAttribute('x-webkit-airplay', 'allow');
  }
  return ttsAudioEl;
}

  /**
   * Unlock every playback path from the same user gesture.
   * Mobile Safari and Chrome require both a running Web Audio context and a
   * media element that has successfully started during the gesture.
   */
  export function unlockAudioPlayback(): void {
    if (typeof window === 'undefined') return;
    try {
      const audioCtx = getSharedAudioContext();
      const unlockSource = audioCtx.createBufferSource();
      // A measurable 1ms silent buffer is required by iOS Safari to unlock output.
      unlockSource.buffer = audioCtx.createBuffer(1, Math.max(1, Math.ceil(audioCtx.sampleRate * 0.001)), audioCtx.sampleRate);
      unlockSource.connect(masterBusInput ?? audioCtx.destination);
      unlockSource.start(0);
      unlockSource.stop(audioCtx.currentTime + 0.001);
      const resumePromise = audioCtx.resume();
      resumePromise.catch((error) => {
        console.error('[AudioUnlock] AudioContext.resume() rejected:', error);
      });
    } catch (error) {
      console.warn('[AudioUnlock] Web Audio unlock failed:', error);
    }
  }

  /** Call synchronously during a user gesture before async TTS fetch. */
  export function primeTTSAudioElement(): void {
  if (typeof window === 'undefined') return;
  try {
    // Mobile Safari/Chrome only unlocks Web Audio when a source is started
    // synchronously from the user's tap. Resuming alone is not sufficient.
    const audioCtx = getSharedAudioContext();
    const unlockSource = audioCtx.createBufferSource();
    unlockSource.buffer = audioCtx.createBuffer(1, Math.max(1, Math.ceil(audioCtx.sampleRate * 0.001)), audioCtx.sampleRate);
    unlockSource.connect(audioCtx.destination);
    unlockSource.start(0);
    unlockSource.stop(audioCtx.currentTime + 0.001);
    audioCtx.resume().catch((error) => {
      console.error('[AudioUnlock] TTS AudioContext.resume() rejected:', error);
    });

    const audio = getTTSAudioElement();
    if (!audio.src || audio.src === window.location.href) {
      // Keep the same media element playing a silent loop until the async TTS
      // request finishes. Mobile Safari/Chrome may revoke the autoplay grant
      // when the priming element is immediately paused after the tap.
      audio.src = SILENT_WAV_DATA_URI;
      audio.loop = true;
      audio.volume = 0.001;
      audio.play().catch(() => {});
    }
  } catch {
    // ignore priming failures
  }
}

export function isTTSAudioPlaying(): boolean {
  return ttsShouldBePlaying && !!ttsAudioEl && !ttsAudioEl.paused && !ttsAudioEl.ended;
}

export function pauseTTSAudio(): void {
  ttsShouldBePlaying = false;
  stopTTSKeepAlive();
  releaseScreenWakeLock().catch(() => {});
  if (ttsAudioEl && !ttsAudioEl.paused) {
    try {
      ttsAudioEl.pause();
    } catch {
      // ignore
    }
  }
  try {
    const ctx = getSharedAudioContext();
    if (ctx.state === 'running') {
      ctx.suspend().catch(() => {});
    }
  } catch {}
}

export function resumeTTSAudio(): void {
  try {
    const ctx = getSharedAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  } catch {}

  // Only resume if playback was explicitly requested and not stopped
  if (ttsShouldBePlaying && ttsAudioEl && ttsAudioEl.paused && !ttsAudioEl.ended && ttsAudioEl.src) {
    startTTSKeepAlive();
    acquireScreenWakeLock().catch(() => {});
    ttsAudioEl.play().catch((err) => console.warn('[Audio] Failed to resume TTS audio:', err));
  }
}

export function stopTTSAudio(): void {
  ttsPlaybackId++;
  ttsShouldBePlaying = false;
  stopTTSKeepAlive();
  releaseScreenWakeLock().catch(() => {});
  revokeTTSBlobUrl();

  if (ttsAudioEl) {
    try {
      ttsAudioEl.pause();
      ttsAudioEl.currentTime = 0;
      ttsAudioEl.playbackRate = 1.0;
      ttsAudioEl.removeAttribute('src');
      ttsAudioEl.load();
    } catch {
      // ignore
    }
  }
}

/** Stops both HTML5 TTS playback and legacy Web Audio TTS sources. */
export function stopTTSPlayback(): void {
  stopTTSAudio();
  stopRawPCM();
  releaseScreenWakeLock().catch(() => {});
}

export type TTSEmotionType =
  | 'joy'        // 기쁨, 축하, 설렘, 활기 (밝고 살짝 빠른 톤)
  | 'calm'       // 평온, 이완, 호흡, 명상, 방하착 (차분하고 부드러운 느린 템포)
  | 'comfort'    // 위로, 공감, 다독임, 따뜻함, 치유 (온화하고 포근하며 여유로운 톤)
  | 'emphasis'   // 강조, 결의, 확신, 통찰, 1원칙 전략 (명료하고 당찬 표준 템포)
  | 'sadness'    // 슬픔, 눈물, 애도, 비움
  | 'mystic'     // 신비, 오라클, 우주, 영혼, 타로, 사주 (깊이 있고 신비로운 여운)
  | 'vitality'   // 생체활력, 역동, 에너지, 실천 (생기발랄하고 역동적인 템포)
  | 'friendly'   // 다정한 친구, 친근한 일상 대화
  | 'neutral';   // 기본, 중립

export interface TTSEmotionProfile {
  emotion: TTSEmotionType;
  playbackRate: number;      // 0.85 ~ 1.15
  detune: number;            // Cents (-1200 ~ +1200)
  pitchHzOffset: number;     // Edge TTS / API 호환용
  preservesPitch: boolean;   // HTMLAudio preservesPitch
  label: string;
}

export const TTS_EMOTION_PROFILES: Record<TTSEmotionType, TTSEmotionProfile> = {
  joy: {
    emotion: 'joy',
    playbackRate: 1.05,
    detune: 90,
    pitchHzOffset: 1.5,
    preservesPitch: true,
    label: '기쁨과 환희',
  },
  calm: {
    emotion: 'calm',
    playbackRate: 0.92,
    detune: -50,
    pitchHzOffset: -1.2,
    preservesPitch: true,
    label: '평온과 이완',
  },
  comfort: {
    emotion: 'comfort',
    playbackRate: 0.93,
    detune: -40,
    pitchHzOffset: -1.0,
    preservesPitch: true,
    label: '다정한 위로',
  },
  emphasis: {
    emotion: 'emphasis',
    playbackRate: 1.02,
    detune: 30,
    pitchHzOffset: 0.8,
    preservesPitch: true,
    label: '확신과 결단',
  },
  sadness: {
    emotion: 'sadness',
    playbackRate: 0.90,
    detune: -90,
    pitchHzOffset: -2,
    preservesPitch: true,
    label: '슬픔과 위로',
  },
  mystic: {
    emotion: 'mystic',
    playbackRate: 0.94,
    detune: -20,
    pitchHzOffset: -0.8,
    preservesPitch: true,
    label: '신비와 통찰',
  },
  vitality: {
    emotion: 'vitality',
    playbackRate: 1.06,
    detune: 80,
    pitchHzOffset: 1.2,
    preservesPitch: true,
    label: '활력과 생기',
  },
  friendly: {
    emotion: 'friendly',
    playbackRate: 1.00,
    detune: 15,
    pitchHzOffset: 0.4,
    preservesPitch: true,
    label: '친근한 대화',
  },
  neutral: {
    emotion: 'neutral',
    playbackRate: 1.00,
    detune: 0,
    pitchHzOffset: 0,
    preservesPitch: true,
    label: '자연스러운 기본',
  },
};

/**
 * Analyzes text semantics or explicit emotion tags to determine speed (rate) and pitch adjustments.
 */
export function analyzeTextEmotion(text: string, explicitEmotion?: string): TTSEmotionProfile {
  if (explicitEmotion) {
    const norm = explicitEmotion.toLowerCase().trim();
    if (norm.includes('joy') || norm.includes('기쁨') || norm.includes('환희') || norm.includes('행복') || norm.includes('축하') || norm.includes('happy')) {
      return TTS_EMOTION_PROFILES.joy;
    }
    if (norm.includes('comfort') || norm.includes('위로') || norm.includes('공감') || norm.includes('따뜻') || norm.includes('토닥') || norm.includes('empathy')) {
      return TTS_EMOTION_PROFILES.comfort;
    }
    if (norm.includes('calm') || norm.includes('평온') || norm.includes('안식') || norm.includes('이완') || norm.includes('치유') || norm.includes('호흡') || norm.includes('peace') || norm.includes('relax')) {
      return TTS_EMOTION_PROFILES.calm;
    }
    if (norm.includes('emphasis') || norm.includes('강조') || norm.includes('확신') || norm.includes('결단') || norm.includes('1원칙') || norm.includes('전략') || norm.includes('focus') || norm.includes('insight')) {
      return TTS_EMOTION_PROFILES.emphasis;
    }
    if (norm.includes('sad') || norm.includes('슬픔') || norm.includes('비움') || norm.includes('grief')) {
      return TTS_EMOTION_PROFILES.sadness;
    }
    if (norm.includes('mystic') || norm.includes('신비') || norm.includes('오라클') || norm.includes('우주') || norm.includes('타로') || norm.includes('사주') || norm.includes('oracle') || norm.includes('tarot')) {
      return TTS_EMOTION_PROFILES.mystic;
    }
    if (norm.includes('vitality') || norm.includes('활력') || norm.includes('생기') || norm.includes('에너지') || norm.includes('energy')) {
      return TTS_EMOTION_PROFILES.vitality;
    }
    if (norm.includes('friendly') || norm.includes('다정') || norm.includes('친근') || norm.includes('친구') || norm.includes('반말')) {
      return TTS_EMOTION_PROFILES.friendly;
    }
    if (norm in TTS_EMOTION_PROFILES) {
      return TTS_EMOTION_PROFILES[norm as TTSEmotionType];
    }
  }

  return detectLucyResponseEmotion(text);
}

/**
 * 💡 루시(Lucy) 답변 텍스트의 감정과 맥락을 정밀 분석하여
 * 가장 알맞은 목소리 톤(pitch)과 속도(rate)를 자동 도출합니다.
 */
export function detectLucyResponseEmotion(text: string, currentChannel?: string): TTSEmotionProfile {
  if (!text || typeof text !== 'string') {
    return TTS_EMOTION_PROFILES.friendly;
  }

  // 1. 명시적 감정 태그 검사: [EMOTION: xxx] 또는 {EMOTION: xxx}
  const explicitMatch = text.match(/[\[{]EMOTION:\s*([a-zA-Z가-힣_\s]+)[\]}]/i);
  if (explicitMatch) {
    return analyzeTextEmotion('', explicitMatch[1]);
  }

  const clean = text.toLowerCase();

  let comfortScore = 0;
  let calmScore = 0;
  let joyScore = 0;
  let emphasisScore = 0;
  let mysticScore = 0;
  let vitalityScore = 0;
  let friendlyScore = 1; // 기본 친근한 다정함 점수

  // A. 깊은 위로, 공감, 정화 (Bluebird 및 감정 케어)
  const comfortKeywords = [
    '힘들었', '속상', '마음 아파', '괜찮아', '토닥', '안아줄', '위로', '외로', '눈물', '울어도',
    '지쳤', '버거', '상처', '마음고생', '안쓰러', '따뜻한 온기', '내가 곁에', '함께할게', '호오포노포노',
    '미안해', '사랑해', '고마워', '용서'
  ];
  comfortKeywords.forEach(k => { if (clean.includes(k)) comfortScore += 2; });

  // B. 호흡, 명상, 신체 이완, 평온, 방하착 (Aura 및 Key 신체 감각 연습)
  const calmKeywords = [
    '호흡', '숨을', '내쉬', '들이쉬', '풍선 호흡', '복식호흡', '방하착', '내려놓', '이완',
    '눈을 감', '천천히', '고요', '대지의 중심', '발바닥', '보디 스캔', '바디 스캔', '쉼표',
    '근육을 풀', '어깨를 낮', '편안하게 머물', '감각에 집중', '오감'
  ];
  calmKeywords.forEach(k => { if (clean.includes(k)) calmScore += 2; });

  // C. 축하, 기쁨, 칭찬, 환희 (반가움, 설렘, 성취)
  const joyKeywords = [
    '축하', '기뻐', '환희', '대단해', '멋져', '최고야', '신나', '반가워', '웃음', '설레',
    '좋은 소식', '뿌듯', '자랑스러', '와아', '대박', '행복', '빛나', '짝짝', '화이팅'
  ];
  joyKeywords.forEach(k => { if (clean.includes(k)) joyScore += 2; });

  // D. 1원칙, 전략, 확신, 결단, 우선순위 (Orange 채널 및 실행 지침)
  const emphasisKeywords = [
    '1원칙', '전략', '핵심', '결단', '우선순위', '목표', '분석', '확신', '실행해', '도전',
    '명심', '선택과 집중', '로드맵', '원인 규명', '방향성', '행동해야', '확실히'
  ];
  emphasisKeywords.forEach(k => { if (clean.includes(k)) emphasisScore += 2; });

  // E. 신비, 타로, 사주, 오라클, 영혼 (Trinity 채널 및 운명 통찰)
  const mysticKeywords = [
    '타로', '사주', '대운', '운명', '오라클', '우주', '동시성', '원국', '카드', '카르마',
    '별자리', '무의식', '신비', '영혼', '시공간', '차원', '성좌', '점괘'
  ];
  mysticKeywords.forEach(k => { if (clean.includes(k)) mysticScore += 2; });

  // F. 활력, 운동, 생체 에너지
  const vitalityKeywords = [
    '활력', '에너지', '생기', '움직여', '스트레칭', '달리기', '파워', '기운 내', '기지개'
  ];
  vitalityKeywords.forEach(k => { if (clean.includes(k)) vitalityScore += 2; });

  // 감탄부호 및 이모지 보너스
  if (text.includes('!!') || text.includes('! ✨') || text.includes('🎉') || text.includes('👏')) {
    joyScore += 1.5;
    vitalityScore += 1;
  }

  // 2. 현재 대화 채널과의 연속성 가중치
  if (currentChannel) {
    const ch = currentChannel.toLowerCase();
    if (ch.includes('aura') || ch.includes('heal')) calmScore += 1.5;
    else if (ch.includes('bluebird')) comfortScore += 1.5;
    else if (ch.includes('trinity')) mysticScore += 1.5;
    else if (ch.includes('orange')) emphasisScore += 1.5;
    else if (ch.includes('muse')) joyScore += 1.0;
  }

  const scores = [
    { type: 'comfort' as TTSEmotionType, score: comfortScore },
    { type: 'calm' as TTSEmotionType, score: calmScore },
    { type: 'joy' as TTSEmotionType, score: joyScore },
    { type: 'emphasis' as TTSEmotionType, score: emphasisScore },
    { type: 'mystic' as TTSEmotionType, score: mysticScore },
    { type: 'vitality' as TTSEmotionType, score: vitalityScore },
    { type: 'friendly' as TTSEmotionType, score: friendlyScore },
  ];

  scores.sort((a, b) => b.score - a.score);

  if (scores[0].score >= 2) {
    return TTS_EMOTION_PROFILES[scores[0].type];
  }

  return TTS_EMOTION_PROFILES.friendly;
}

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(
      navigator.userAgent
    ) ||
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0
  );
}

export function getEmotionProfile(emotion: string | TTSEmotionType): TTSEmotionProfile {
  return analyzeTextEmotion('', emotion);
}

export async function playTTSAudio(
  base64: string,
  encoding: string = 'mp3',
  sampleRate: number = 24000,
  emotionOrText?: string | TTSEmotionProfile,
  isSequenceChunk: boolean = false,
): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('TTS playback is only available in the browser');
  }

  // Pre-wake shared WebAudio context on all devices
  try {
    const audioCtx = getSharedAudioContext();
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }
  } catch (_) {}

  // Increment playback ID to supersede any older speech
  ttsPlaybackId++;
  const activePlaybackId = ttsPlaybackId;
  revokeTTSBlobUrl();

  const profile: TTSEmotionProfile =
    typeof emotionOrText === 'object' && emotionOrText !== null && 'playbackRate' in emotionOrText
      ? emotionOrText
      : analyzeTextEmotion(typeof emotionOrText === 'string' ? emotionOrText : '');

  // Acquire screen wake lock during playback to prevent screen sleep
  acquireScreenWakeLock().catch(() => {});

  // On iOS devices (iPhone/iPad), Web Audio decodeAudioData is 100% immune to
  // HTMLAudioElement blob autoplay locks that occur after async fetch.
  const isIOS = typeof navigator !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

  const bytes = base64ToBytes(base64);
  const detectedFormat = detectAudioFormat(bytes);
  const isCompressed = detectedFormat !== 'pcm' || encoding === 'mp3';

  ttsShouldBePlaying = true;
  startTTSKeepAlive();

  // Web Audio decodeAudioData is 100% immune to HTMLAudioElement blob autoplay locks,
  // URL revoke race conditions, and premature ended events across all devices (Desktop, iOS, Android).
  try {
    if (!isCompressed && encoding === 'pcm') {
      await playRawPCM(base64, sampleRate);
    } else {
      await playCompressedAudio(base64, profile.playbackRate || 1.0, profile.detune || 0);
    }
    if (activePlaybackId === ttsPlaybackId && !isSequenceChunk) {
      ttsShouldBePlaying = false;
      stopTTSKeepAlive();
      releaseScreenWakeLock().catch(() => {});
    }
    return;
  } catch (webAudioErr) {
    console.warn('[Audio] Direct WebAudio playback failed, falling back to HTMLAudio:', webAudioErr);
  }

  // Fallback playback engine: HTML5 Audio element
  let mimeType = 'audio/mpeg';
  if (detectedFormat === 'wav') {
    mimeType = 'audio/wav';
  } else if (detectedFormat === 'ogg') {
    mimeType = 'audio/ogg';
  }

  const blob =
    !isCompressed && encoding === 'pcm'
      ? pcm16ToWavBlob(bytes, sampleRate)
      : new Blob([bytes], { type: mimeType });

  if (activePlaybackId !== ttsPlaybackId) return;

  revokeTTSBlobUrl();
  ttsBlobUrl = URL.createObjectURL(blob);

  const audio = getTTSAudioElement();
  audio.loop = false;
  audio.volume = 1;
  audio.src = ttsBlobUrl;

  try {
    audio.playbackRate = profile.playbackRate || 1.0;
    audio.defaultPlaybackRate = profile.playbackRate || 1.0;
    if ('preservesPitch' in audio) {
      (audio as any).preservesPitch = true;
    }
    if ('mozPreservesPitch' in audio) {
      (audio as any).mozPreservesPitch = true;
    }
    if ('webkitPreservesPitch' in audio) {
      (audio as any).webkitPreservesPitch = true;
    }
  } catch (err) {
    console.warn('[Audio] Failed to set playback rate on audio element:', err);
  }

  ttsShouldBePlaying = true;
  startTTSKeepAlive();

  try {
    await new Promise<void>((resolve, reject) => {
      let isSettled = false;
      const cleanup = () => {
        audio.removeEventListener('ended', onEnded);
        audio.removeEventListener('error', onError);
      };

      const finish = () => {
        if (isSettled) return;
        isSettled = true;
        if (activePlaybackId !== ttsPlaybackId) return;
        if (!isSequenceChunk) {
          ttsShouldBePlaying = false;
          stopTTSKeepAlive();
          releaseScreenWakeLock().catch(() => {});
        }
        cleanup();
        resolve();
      };

      const onEnded = () => finish();

      const onError = (e?: any) => {
        if (isSettled) return;
        isSettled = true;
        if (activePlaybackId !== ttsPlaybackId) return;
        if (!isSequenceChunk) {
          ttsShouldBePlaying = false;
          stopTTSKeepAlive();
          releaseScreenWakeLock().catch(() => {});
        }
        cleanup();
        reject(e || new Error('[AudioPlayer] HTMLAudioElement playback failed'));
      };

      audio.addEventListener('ended', onEnded);
      audio.addEventListener('error', onError);

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          onError(err);
        });
      }
    });
  } catch (htmlErr) {
    console.warn('[AudioPlayer] HTML5 Audio fallback to WebAudio:', htmlErr);
    if (activePlaybackId !== ttsPlaybackId) return;

    try {
      if (!isCompressed && encoding === 'pcm') {
        await playRawPCM(base64, sampleRate);
      } else {
        await playCompressedAudio(base64, 1.0);
      }
    } finally {
      if (activePlaybackId === ttsPlaybackId && !isSequenceChunk) {
        releaseScreenWakeLock().catch(() => {});
      }
    }
  }
}

let ttsLifecycleInitialized = false;

export function initTTSAudioLifecycle(): void {
  if (ttsLifecycleInitialized || typeof window === 'undefined') return;
  ttsLifecycleInitialized = true;

  const handleResume = () => {
    if (document.visibilityState === 'hidden') return;
    try {
      const ctx = getSharedAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume().catch((error) => {
          console.error('[AudioLifecycle] AudioContext resume after visibility change rejected:', error);
        });
      }
    } catch (error) {
      console.error('[AudioLifecycle] Failed to restore AudioContext:', error);
    }
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      handleResume();
    }
  });
  window.addEventListener('pageshow', handleResume);
  window.addEventListener('focus', handleResume);
}

/**
 * Authentic Web Audio synthesized water droplet & splash sound ("퐁당~")
 * for the Wishing Well (소원의 우물) and water-based healing interactions.
 */
export function playWishingWellPlopSound(): void {
  if (typeof window === 'undefined') return;
  try {
    const ctx = getSharedAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // 1. Primary Well Water Impact ("퐁")
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';

    // Pitch envelope: fast rising bubble then gentle settling
    osc1.frequency.setValueAtTime(320, now);
    osc1.frequency.exponentialRampToValueAtTime(1420, now + 0.06);
    osc1.frequency.exponentialRampToValueAtTime(680, now + 0.28);

    gain1.gain.setValueAtTime(0.0001, now);
    gain1.gain.linearRampToValueAtTime(0.42, now + 0.015);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.35);

    // 2. Secondary Droplet Ripple ("당~")
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';

    const t2 = now + 0.09;
    osc2.frequency.setValueAtTime(650, t2);
    osc2.frequency.exponentialRampToValueAtTime(1780, t2 + 0.05);
    osc2.frequency.exponentialRampToValueAtTime(940, t2 + 0.26);

    gain2.gain.setValueAtTime(0.0001, t2);
    gain2.gain.linearRampToValueAtTime(0.28, t2 + 0.018);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.38);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(t2);
    osc2.stop(t2 + 0.42);

    // 3. Low-end Deep Well Resonance (우물 속 깊은 울림)
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(180, now);
    subOsc.frequency.exponentialRampToValueAtTime(90, now + 0.45);

    subGain.gain.setValueAtTime(0.0001, now);
    subGain.gain.linearRampToValueAtTime(0.22, now + 0.03);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);

    subOsc.start(now);
    subOsc.stop(now + 0.55);

    // 4. Subtle Splash Noise Burst (물방울 튀는 소리)
    const sampleRate = ctx.sampleRate;
    const noiseLength = Math.floor(sampleRate * 0.06);
    const noiseBuffer = ctx.createBuffer(1, noiseLength, sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseLength; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * 0.015));
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, now);
    filter.Q.setValueAtTime(4.0, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.16, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

    noiseSource.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noiseSource.start(now);
    noiseSource.stop(now + 0.07);
  } catch (err) {
    console.warn('[Audio] Failed to play wishing well plop sound:', err);
  }
}



