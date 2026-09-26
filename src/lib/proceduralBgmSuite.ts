/**
 * LucKey Flow Procedural BGM Suite (30 Premium Synthesized Tracks)
 * 100% Web Audio API procedural synthesis - no external audio files required.
 * Infinite, pristine, zero-latency looping with soothing acoustic & celestial soundscapes.
 */
import {
  createLoopingNoiseSource,
  type NoiseColor,
} from "./audio";

export interface BgmTrack {
  name: string;
  url: string;
  artist?: string;
  trackKey?: string;
  category?: string;
}

export interface ProceduralSynthUtils {
  createAutoPanner: (speedHz: number, panDepth: number) => any;
  createDelay: (delayTime: number, feedback: number, wet: number) => any;
  createNoiseNode: (ctx: AudioContext, color: NoiseColor) => AudioBufferSourceNode;
  registerDynamicVoice: (nodes: any[], stopDelaySeconds: number) => void;
  activeNodesRef: React.MutableRefObject<any[]>;
  synthIntervalRef: React.MutableRefObject<any>;
  secondarySynthIntervalRef: React.MutableRefObject<any>;
}

export type TrackPlayFn = (
  ctx: AudioContext,
  masterGain: GainNode,
  utils: ProceduralSynthUtils
) => void;

// Musical Scale Definitions
const PENTATONIC = [130.81, 146.83, 164.81, 196.00, 220.00, 261.63, 293.66, 329.63, 392.00, 440.00];
const SOLFEGGIO_FREQS = [396, 417, 432, 528, 639, 741, 852, 963];
const DORIAN_SCALE = [146.83, 164.81, 174.61, 196.00, 220.00, 246.94, 261.63, 293.66];
const LYDIAN_SCALE = [130.81, 146.83, 164.81, 185.00, 196.00, 220.00, 246.94, 261.63];

export const FLOW_AUDIO_TRACKS: BgmTrack[] = [
  // --- Suite 1: Tarot & Sacred Oracle ---
  { name: "1. 운명의 수레바퀴 528Hz (Wheel of Destiny 528Hz)", url: "flow-tarot-wheel528", artist: "LucKey Flow Suite", category: "Tarot" },
  { name: "2. 신성한 오라클 생추어리 (Sacred Oracle Sanctuary)", url: "flow-tarot-sanctuary", artist: "LucKey Flow Suite", category: "Tarot" },
  { name: "3. 대천사 가디언 엠브레이스 (Archangel Guardian Embrace)", url: "flow-tarot-archangel", artist: "LucKey Flow Suite", category: "Tarot" },
  { name: "4. 메이저 아르카나 미스틱 (Major Arcana Mystic Reverie)", url: "flow-tarot-major-arcana", artist: "LucKey Flow Suite", category: "Tarot" },
  { name: "5. 달의 여사제 고요한 성소 (High Priestess Lunar Shrine)", url: "flow-tarot-priestess", artist: "LucKey Flow Suite", category: "Tarot" },
  { name: "6. 켈틱 크로스 비밀 기도 (Celtic Cross Ancient Lore)", url: "flow-tarot-celtic-cross", artist: "LucKey Flow Suite", category: "Tarot" },

  // --- Suite 2: Solfeggio & Healing Frequencies ---
  { name: "7. 432Hz 우주적 평온 (432Hz Cosmic Harmony)", url: "flow-heal-432hz", artist: "LucKey Flow Suite", category: "Healing" },
  { name: "8. 528Hz DNA 변형의 울림 (528Hz Miracle Awakening)", url: "flow-heal-528hz", artist: "LucKey Flow Suite", category: "Healing" },
  { name: "9. 639Hz 심장 차크라 치유 (639Hz Heart Chakra Healing)", url: "flow-heal-639hz", artist: "LucKey Flow Suite", category: "Healing" },
  { name: "10. 741Hz 직관과 명료함 (741Hz Intuitive Clarity)", url: "flow-heal-741hz", artist: "LucKey Flow Suite", category: "Healing" },
  { name: "11. 852Hz 영적 회귀와 각성 (852Hz Spiritual Return)", url: "flow-heal-852hz", artist: "LucKey Flow Suite", category: "Healing" },
  { name: "12. 963Hz 순수 의식의 빛 (963Hz Crown Divine Light)", url: "flow-heal-963hz", artist: "LucKey Flow Suite", category: "Healing" },

  // --- Suite 3: Cosmic & Astral Odyssey ---
  { name: "13. 안드로메다 스타더스트 (Andromeda Stardust Drift)", url: "flow-cosmic-andromeda", artist: "LucKey Flow Suite", category: "Cosmic" },
  { name: "14. 실버문 에클립스 (Silver Moon Eclipse Trance)", url: "flow-cosmic-eclipse", artist: "LucKey Flow Suite", category: "Cosmic" },
  { name: "15. 황도 12궁 별자리 바람 (Zodiac Constellation Breeze)", url: "flow-cosmic-zodiac", artist: "LucKey Flow Suite", category: "Cosmic" },
  { name: "16. 플레이아데스 천상의 속삭임 (Pleiades Celestial Whispers)", url: "flow-cosmic-pleiades", artist: "LucKey Flow Suite", category: "Cosmic" },
  { name: "17. 딥 스페이스 보이드 (Deep Space Infinite Void)", url: "flow-cosmic-void", artist: "LucKey Flow Suite", category: "Cosmic" },
  { name: "18. 초신성 아우라 (Supernova Golden Dawn)", url: "flow-cosmic-supernova", artist: "LucKey Flow Suite", category: "Cosmic" },

  // --- Suite 4: Nature & Zen Sanctuary ---
  { name: "19. 자정의 숲속 빗소리 (Midnight Forest Soft Rain)", url: "flow-zen-softrain", artist: "LucKey Flow Suite", category: "Nature" },
  { name: "20. 대나무 숲 청명한 바람 (Bamboo Grove Zen Breeze)", url: "flow-zen-bamboo", artist: "LucKey Flow Suite", category: "Nature" },
  { name: "21. 고요한 심해 고래의 노래 (Deep Ocean Whale Harmonics)", url: "flow-zen-ocean", artist: "LucKey Flow Suite", category: "Nature" },
  { name: "22. 안개 낀 사찰의 목경 (Misty Temple Water Droplets)", url: "flow-zen-temple-drops", artist: "LucKey Flow Suite", category: "Nature" },
  { name: "23. 새벽 이슬 젖은 초원 (Morning Dew Sunrise Glow)", url: "flow-zen-morning-dew", artist: "LucKey Flow Suite", category: "Nature" },
  { name: "24. 티베트 설산의 크리스탈 볼 (Tibetan Snow Mountain Bowl)", url: "flow-zen-snow-bowls", artist: "LucKey Flow Suite", category: "Nature" },

  // --- Suite 5: Warm Lofi & Soulful Drift ---
  { name: "25. 촛불 켜진 다락방 타로살롱 (Candlelight Tarot Salon)", url: "flow-lofi-candle", artist: "LucKey Flow Suite", category: "Lofi" },
  { name: "26. 은하수 아래 피아노 여운 (Milky Way Piano Reverie)", url: "flow-lofi-milkyway", artist: "LucKey Flow Suite", category: "Lofi" },
  { name: "27. 따뜻한 밤의 허밍 (Warm Nocturne Humming)", url: "flow-lofi-humming", artist: "LucKey Flow Suite", category: "Lofi" },
  { name: "28. 기억의 서재 (Library of Ancient Souls)", url: "flow-lofi-library", artist: "LucKey Flow Suite", category: "Lofi" },
  { name: "29. 유성우 떨어지는 호수 (Meteor Shower Lake Reflection)", url: "flow-lofi-meteor", artist: "LucKey Flow Suite", category: "Lofi" },
];

/**
 * Per-track loudness calibration offsets to achieve consistent perceptual volume across all tracks.
 * Multi-oscillator dense choir/pad tracks are smoothly attenuated, and sparse solo-drone tracks are boosted.
 */
export const TRACK_NORMALIZATION_GAINS: Record<string, number> = {
  // Multi-voice choir / dense pad tracks (attenuated to match target level)
  "flow-tarot-archangel": 0.72,   // 8-oscillator dense angelic choir
  "flow-tarot-sanctuary": 0.78,   // 4-voice sustained chord with delay
  "flow-cosmic-andromeda": 0.82,  // 4-frequency astral sweep
  "flow-lofi-candle": 0.82,       // 4-note tape lofi pad
  "flow-zen-softrain": 0.85,      // Brown noise rain + chord
  "flow-zen-ocean": 0.85,         // Brown noise ocean + whale glide
  "flow-zen-bamboo": 0.88,        // Brown noise wind + chimes

  // Single-voice / sparse tracks (boosted to prevent sounding quiet)
  "flow-tarot-celtic-cross": 1.30, // 1 note melody every 5.5s
  "flow-tarot-major-arcana": 1.25, // Single triangle mystic drone
  "flow-cosmic-void": 1.30,        // Deep space sparse sub drone
  "flow-zen-temple-drops": 1.40,   // Discrete temple water droplets
  "flow-lofi-meteor": 1.25,        // High-frequency lake shimmer
  "flow-lofi-eternity": 1.20,      // Slow cradle lullaby

  // Naturally balanced reference tracks
  "flow-tarot-wheel528": 1.0,
  "flow-tarot-priestess": 1.0,
  "flow-heal-432hz": 0.95,
  "flow-heal-528hz": 1.0,
  "flow-heal-639hz": 1.05,
  "flow-heal-741hz": 1.05,
  "flow-heal-852hz": 1.0,
  "flow-heal-963hz": 1.05,
  "flow-cosmic-eclipse": 1.0,
  "flow-cosmic-zodiac": 1.0,
  "flow-cosmic-pleiades": 1.05,
  "flow-cosmic-supernova": 0.95,
  "flow-zen-morning-dew": 1.05,
  "flow-zen-snow-bowls": 0.95,
  "flow-lofi-milkyway": 1.0,
  "flow-lofi-humming": 0.95,
  "flow-lofi-library": 1.10,
};

export function getTrackNormalizationGain(trackUrl: string): number {
  return TRACK_NORMALIZATION_GAINS[trackUrl] ?? 1.0;
}

export const FLOW_TRACK_GENERATORS: Record<string, TrackPlayFn> = {
  // 1. 운명의 수레바퀴 528Hz
  "flow-tarot-wheel528": (ctx, masterGain, { createDelay, createAutoPanner, registerDynamicVoice, synthIntervalRef, activeNodesRef }) => {
    const delay = createDelay(1.2, 0.48, 0.32);
    const panner = createAutoPanner(0.04, 0.5);

    const playWheel = () => {
      const now = ctx.currentTime;
      const root = 528.0;
      const harmonics = [root, root * 1.5, root * 0.5, root * 2.0];
      const freq = harmonics[Math.floor(Math.random() * harmonics.length)];

      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(650, now);

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(freq * 1.002, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.016, now + 3.0);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 12.0);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(filter);
      filter.connect(delay);
      filter.connect(panner);

      osc.start(now);
      osc2.start(now);
      osc.stop(now + 12.5);
      osc2.stop(now + 12.5);
      registerDynamicVoice([osc, osc2, gain, filter], 12.5);
    };

    playWheel();
    synthIntervalRef.current = setInterval(playWheel, 6500);
  },

  // 2. 신성한 오라클 생추어리
  "flow-tarot-sanctuary": (ctx, masterGain, { createDelay, registerDynamicVoice, synthIntervalRef }) => {
    const delay = createDelay(0.9, 0.52, 0.28);
    const chords = [
      [220.0, 261.63, 329.63, 392.0], // Am7
      [174.61, 220.0, 261.63, 329.63], // Fmaj7
      [196.0, 246.94, 293.66, 392.0],  // G
      [164.81, 196.0, 246.94, 329.63]  // Em7
    ];
    let step = 0;

    const playChord = () => {
      const now = ctx.currentTime;
      const chord = chords[step % chords.length];
      step++;

      chord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0, now + idx * 0.15);
        gain.gain.linearRampToValueAtTime(0.012, now + 2.5 + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 8.5);

        osc.connect(gain);
        gain.connect(delay);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + 9.0);
        registerDynamicVoice([osc, gain], 9.0);
      });
    };

    playChord();
    synthIntervalRef.current = setInterval(playChord, 7000);
  },

  // 3. 대천사 가디언 엠브레이스
  "flow-tarot-archangel": (ctx, masterGain, { createAutoPanner, registerDynamicVoice, synthIntervalRef }) => {
    const panner = createAutoPanner(0.03, 0.6);

    const playChoir = () => {
      const now = ctx.currentTime;
      const choirFreqs = [261.63, 329.63, 392.0, 523.25]; // C major open choir

      choirFreqs.forEach((freq) => {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(420, now);

        osc1.type = "sine";
        osc1.frequency.setValueAtTime(freq, now);
        osc1.detune.setValueAtTime(-6, now);

        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(freq, now);
        osc2.detune.setValueAtTime(6, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.014, now + 4.0);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 13.0);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(panner);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 13.5);
        osc2.stop(now + 13.5);
        registerDynamicVoice([osc1, osc2, filter, gain], 13.5);
      });
    };

    playChoir();
    synthIntervalRef.current = setInterval(playChoir, 9500);
  },

  // 4. 메이저 아르카나 미스틱
  "flow-tarot-major-arcana": (ctx, masterGain, { createDelay, registerDynamicVoice, synthIntervalRef }) => {
    const delay = createDelay(1.3, 0.55, 0.35);

    const playArcana = () => {
      const now = ctx.currentTime;
      const droneNote = 110.0; // A2 deep mystic drone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(droneNote, now);
      osc.frequency.linearRampToValueAtTime(droneNote * 1.5, now + 5.0);
      osc.frequency.linearRampToValueAtTime(droneNote, now + 11.0);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.02, now + 3.0);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 12.0);

      osc.connect(gain);
      gain.connect(delay);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 12.2);
      registerDynamicVoice([osc, gain], 12.2);
    };

    playArcana();
    synthIntervalRef.current = setInterval(playArcana, 10000);
  },

  // 5. 달의 여사제 고요한 성소
  "flow-tarot-priestess": (ctx, masterGain, { createDelay, registerDynamicVoice, synthIntervalRef, secondarySynthIntervalRef }) => {
    const delay = createDelay(0.75, 0.45, 0.25);

    const playPad = () => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(220.0, now); // A3

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.015, now + 3.5);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 11.0);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 11.2);
      registerDynamicVoice([osc, gain], 11.2);
    };

    const playCrystalDrop = () => {
      const now = ctx.currentTime;
      const bellFreqs = [880, 1046.5, 1318.5, 1567.98];
      const freq = bellFreqs[Math.floor(Math.random() * bellFreqs.length)];

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);

      osc.connect(gain);
      gain.connect(delay);

      osc.start(now);
      osc.stop(now + 4.8);
      registerDynamicVoice([osc, gain], 4.8);
    };

    playPad();
    synthIntervalRef.current = setInterval(playPad, 8000);
    secondarySynthIntervalRef.current = setInterval(playCrystalDrop, 3200);
  },

  // 6. 켈틱 크로스 비밀 기도
  "flow-tarot-celtic-cross": (ctx, masterGain, { createDelay, registerDynamicVoice, synthIntervalRef }) => {
    const delay = createDelay(0.85, 0.48, 0.3);

    const playCelticPhrase = () => {
      const now = ctx.currentTime;
      const notes = [DORIAN_SCALE[0], DORIAN_SCALE[2], DORIAN_SCALE[4], DORIAN_SCALE[6]];
      const note = notes[Math.floor(Math.random() * notes.length)];

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(note, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.015, now + 2.0);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 7.5);

      osc.connect(gain);
      gain.connect(delay);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 7.8);
      registerDynamicVoice([osc, gain], 7.8);
    };

    playCelticPhrase();
    synthIntervalRef.current = setInterval(playCelticPhrase, 5500);
  },

  // 7. 432Hz 우주적 평온
  "flow-heal-432hz": (ctx, masterGain, { createAutoPanner, registerDynamicVoice, synthIntervalRef }) => {
    const panner = createAutoPanner(0.025, 0.5);

    const play432Hz = () => {
      const now = ctx.currentTime;
      const base = 432.0;
      const freqs = [base * 0.5, base, base * 1.5]; // 216Hz, 432Hz, 648Hz

      freqs.forEach((f) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.014, now + 4.5);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 14.0);

        osc.connect(gain);
        gain.connect(panner);

        osc.start(now);
        osc.stop(now + 14.5);
        registerDynamicVoice([osc, gain], 14.5);
      });
    };

    play432Hz();
    synthIntervalRef.current = setInterval(play432Hz, 9000);
  },

  // 8. 528Hz DNA 변형의 울림
  "flow-heal-528hz": (ctx, masterGain, { createDelay, registerDynamicVoice, synthIntervalRef }) => {
    const delay = createDelay(1.1, 0.45, 0.28);

    const play528Hz = () => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const oscSub = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(528.0, now);
      oscSub.type = "sine";
      oscSub.frequency.setValueAtTime(264.0, now); // Octave below

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.016, now + 3.5);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 12.0);

      osc.connect(gain);
      oscSub.connect(gain);
      gain.connect(delay);
      gain.connect(masterGain);

      osc.start(now);
      oscSub.start(now);
      osc.stop(now + 12.5);
      oscSub.stop(now + 12.5);
      registerDynamicVoice([osc, oscSub, gain], 12.5);
    };

    play528Hz();
    synthIntervalRef.current = setInterval(play528Hz, 8500);
  },

  // 9. 639Hz 심장 차크라 치유
  "flow-heal-639hz": (ctx, masterGain, { createDelay, registerDynamicVoice, synthIntervalRef }) => {
    const delay = createDelay(1.25, 0.5, 0.3);

    const play639Hz = () => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(639.0, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.015, now + 3.0);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 10.0);

      osc.connect(gain);
      gain.connect(delay);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 10.5);
      registerDynamicVoice([osc, gain], 10.5);
    };

    play639Hz();
    synthIntervalRef.current = setInterval(play639Hz, 7500);
  },

  // 10. 741Hz 직관과 명료함
  "flow-heal-741hz": (ctx, masterGain, { createDelay, registerDynamicVoice, synthIntervalRef }) => {
    const delay = createDelay(1.0, 0.52, 0.32);

    const play741Hz = () => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(741.0, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.012, now + 2.5);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 8.5);

      osc.connect(gain);
      gain.connect(delay);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 9.0);
      registerDynamicVoice([osc, gain], 9.0);
    };

    play741Hz();
    synthIntervalRef.current = setInterval(play741Hz, 6500);
  },

  // 11. 852Hz 영적 회귀와 각성
  "flow-heal-852hz": (ctx, masterGain, { createAutoPanner, registerDynamicVoice, synthIntervalRef }) => {
    const panner = createAutoPanner(0.035, 0.55);

    const play852Hz = () => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(852.0, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.013, now + 3.0);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 11.0);

      osc.connect(gain);
      gain.connect(panner);

      osc.start(now);
      osc.stop(now + 11.5);
      registerDynamicVoice([osc, gain], 11.5);
    };

    play852Hz();
    synthIntervalRef.current = setInterval(play852Hz, 8000);
  },

  // 12. 963Hz 순수 의식의 빛
  "flow-heal-963hz": (ctx, masterGain, { createDelay, registerDynamicVoice, synthIntervalRef }) => {
    const delay = createDelay(1.4, 0.55, 0.35);

    const play963Hz = () => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(963.0, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.011, now + 3.5);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 12.0);

      osc.connect(gain);
      gain.connect(delay);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 12.5);
      registerDynamicVoice([osc, gain], 12.5);
    };

    play963Hz();
    synthIntervalRef.current = setInterval(play963Hz, 8500);
  },

  // 13. 안드로메다 스타더스트
  "flow-cosmic-andromeda": (ctx, masterGain, { createAutoPanner, createDelay, registerDynamicVoice, synthIntervalRef }) => {
    const panner = createAutoPanner(0.05, 0.7);
    const delay = createDelay(1.2, 0.5, 0.3);

    const playStardust = () => {
      const now = ctx.currentTime;
      const freqs = [164.81, 246.94, 329.63, 493.88]; // Em9
      const freq = freqs[Math.floor(Math.random() * freqs.length)];

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.015, now + 3.0);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 10.0);

      osc.connect(gain);
      gain.connect(panner);
      gain.connect(delay);

      osc.start(now);
      osc.stop(now + 10.5);
      registerDynamicVoice([osc, gain], 10.5);
    };

    playStardust();
    synthIntervalRef.current = setInterval(playStardust, 6000);
  },

  // 14. 실버문 에클립스
  "flow-cosmic-eclipse": (ctx, masterGain, { createDelay, registerDynamicVoice, synthIntervalRef }) => {
    const delay = createDelay(1.5, 0.52, 0.3);

    const playEclipse = () => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(200, now);
      filter.frequency.linearRampToValueAtTime(700, now + 5.0);
      filter.frequency.exponentialRampToValueAtTime(200, now + 12.0);

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(130.81, now); // C3

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.012, now + 4.0);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 12.0);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(delay);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 12.5);
      registerDynamicVoice([osc, filter, gain], 12.5);
    };

    playEclipse();
    synthIntervalRef.current = setInterval(playEclipse, 9000);
  },

  // 15. 황도 12궁 별자리 바람
  "flow-cosmic-zodiac": (ctx, masterGain, { createNoiseNode, createDelay, registerDynamicVoice, synthIntervalRef, activeNodesRef }) => {
    const breeze = createNoiseNode(ctx, "brown");
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(260, ctx.currentTime);
    filter.Q.setValueAtTime(2.0, ctx.currentTime);

    gain.gain.setValueAtTime(0.008, ctx.currentTime);

    breeze.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    breeze.start();
    activeNodesRef.current.push(breeze, filter, gain);

    const delay = createDelay(0.8, 0.45, 0.25);
    const playZodiacChime = () => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33 + Math.random() * 400, now);

      chimeGain.gain.setValueAtTime(0.0001, now);
      chimeGain.gain.linearRampToValueAtTime(0.008, now + 0.1);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 4.0);

      osc.connect(chimeGain);
      chimeGain.connect(delay);

      osc.start(now);
      osc.stop(now + 4.2);
      registerDynamicVoice([osc, chimeGain], 4.2);
    };

    synthIntervalRef.current = setInterval(playZodiacChime, 3800);
  },

  // 16. 플레이아데스 천상의 속삭임
  "flow-cosmic-pleiades": (ctx, masterGain, { createDelay, registerDynamicVoice, synthIntervalRef }) => {
    const delay = createDelay(1.0, 0.5, 0.35);

    const playPleiades = () => {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C
      const note = notes[Math.floor(Math.random() * notes.length)];

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(note, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.012, now + 1.5);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 6.0);

      osc.connect(gain);
      gain.connect(delay);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 6.2);
      registerDynamicVoice([osc, gain], 6.2);
    };

    playPleiades();
    synthIntervalRef.current = setInterval(playPleiades, 4500);
  },

  // 17. 딥 스페이스 보이드
  "flow-cosmic-void": (ctx, masterGain, { createDelay, registerDynamicVoice, synthIntervalRef }) => {
    const delay = createDelay(1.6, 0.55, 0.35);

    const playVoid = () => {
      const now = ctx.currentTime;
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();

      subOsc.type = "sine";
      subOsc.frequency.setValueAtTime(65.41, now); // C2 deep sub

      subGain.gain.setValueAtTime(0, now);
      subGain.gain.linearRampToValueAtTime(0.022, now + 4.0);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + 14.0);

      subOsc.connect(subGain);
      subGain.connect(delay);
      subGain.connect(masterGain);

      subOsc.start(now);
      subOsc.stop(now + 14.5);
      registerDynamicVoice([subOsc, subGain], 14.5);
    };

    playVoid();
    synthIntervalRef.current = setInterval(playVoid, 9500);
  },

  // 18. 초신성 아우라
  "flow-cosmic-supernova": (ctx, masterGain, { createDelay, createAutoPanner, registerDynamicVoice, synthIntervalRef }) => {
    const delay = createDelay(1.2, 0.5, 0.3);
    const panner = createAutoPanner(0.04, 0.5);

    const playSupernova = () => {
      const now = ctx.currentTime;
      const root = 196.0; // G3
      const freqs = [root, root * 1.25, root * 1.5, root * 1.875]; // Gmaj7

      freqs.forEach((f) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.013, now + 3.0);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 11.0);

        osc.connect(gain);
        gain.connect(delay);
        gain.connect(panner);

        osc.start(now);
        osc.stop(now + 11.5);
        registerDynamicVoice([osc, gain], 11.5);
      });
    };

    playSupernova();
    synthIntervalRef.current = setInterval(playSupernova, 8000);
  },

  // 19. 자정의 숲속 빗소리
  "flow-zen-softrain": (ctx, masterGain, { createNoiseNode, createDelay, registerDynamicVoice, synthIntervalRef, activeNodesRef }) => {
    const rain = createNoiseNode(ctx, "brown");
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(380, ctx.currentTime);
    gain.gain.setValueAtTime(0.018, ctx.currentTime);

    rain.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    rain.start();
    activeNodesRef.current.push(rain, filter, gain);

    const delay = createDelay(0.65, 0.4, 0.2);
    const playRainChord = () => {
      const now = ctx.currentTime;
      const notes = [220, 261.63, 329.63];
      const osc = ctx.createOscillator();
      const cGain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(notes[Math.floor(Math.random() * notes.length)], now);

      cGain.gain.setValueAtTime(0, now);
      cGain.gain.linearRampToValueAtTime(0.01, now + 1.8);
      cGain.gain.exponentialRampToValueAtTime(0.0001, now + 6.0);

      osc.connect(cGain);
      cGain.connect(delay);
      cGain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 6.2);
      registerDynamicVoice([osc, cGain], 6.2);
    };

    synthIntervalRef.current = setInterval(playRainChord, 5000);
  },

  // 20. 대나무 숲 청명한 바람
  "flow-zen-bamboo": (ctx, masterGain, { createNoiseNode, createDelay, registerDynamicVoice, synthIntervalRef, activeNodesRef }) => {
    const wind = createNoiseNode(ctx, "brown");
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(220, ctx.currentTime);
    gain.gain.setValueAtTime(0.012, ctx.currentTime);

    wind.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    wind.start();
    activeNodesRef.current.push(wind, filter, gain);

    const delay = createDelay(0.7, 0.45, 0.25);
    const playBambooChime = () => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      const note = PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)];

      osc.type = "sine";
      osc.frequency.setValueAtTime(note * 2, now);

      chimeGain.gain.setValueAtTime(0.0001, now);
      chimeGain.gain.linearRampToValueAtTime(0.011, now + 0.05);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);

      osc.connect(chimeGain);
      chimeGain.connect(delay);

      osc.start(now);
      osc.stop(now + 4.0);
      registerDynamicVoice([osc, chimeGain], 4.0);
    };

    synthIntervalRef.current = setInterval(playBambooChime, 3400);
  },

  // 21. 고요한 심해 고래의 노래
  "flow-zen-ocean": (ctx, masterGain, { createNoiseNode, createDelay, registerDynamicVoice, synthIntervalRef, activeNodesRef }) => {
    const ocean = createNoiseNode(ctx, "brown");
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(140, ctx.currentTime);
    gain.gain.setValueAtTime(0.02, ctx.currentTime);

    ocean.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    ocean.start();
    activeNodesRef.current.push(ocean, filter, gain);

    const delay = createDelay(1.4, 0.52, 0.35);
    const playWhaleSong = () => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const wGain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 3.0);
      osc.frequency.exponentialRampToValueAtTime(120, now + 7.0);

      wGain.gain.setValueAtTime(0, now);
      wGain.gain.linearRampToValueAtTime(0.016, now + 2.5);
      wGain.gain.exponentialRampToValueAtTime(0.0001, now + 8.5);

      osc.connect(wGain);
      wGain.connect(delay);
      wGain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 8.8);
      registerDynamicVoice([osc, wGain], 8.8);
    };

    synthIntervalRef.current = setInterval(playWhaleSong, 8500);
  },

  // 22. 안개 낀 사찰의 목경
  "flow-zen-temple-drops": (ctx, masterGain, { createDelay, registerDynamicVoice, synthIntervalRef }) => {
    const delay = createDelay(0.9, 0.5, 0.35);

    const playWaterDrop = () => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const baseFreq = 400 + Math.random() * 500;

      osc.type = "sine";
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.08);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.014, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

      osc.connect(gain);
      gain.connect(delay);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 2.8);
      registerDynamicVoice([osc, gain], 2.8);
    };

    synthIntervalRef.current = setInterval(playWaterDrop, 2600);
  },

  // 23. 새벽 이슬 젖은 초원
  "flow-zen-morning-dew": (ctx, masterGain, { createDelay, registerDynamicVoice, synthIntervalRef }) => {
    const delay = createDelay(0.8, 0.45, 0.25);

    const playMorning = () => {
      const now = ctx.currentTime;
      const notes = [261.63, 329.63, 392.0, 440.0, 523.25]; // C Pentatonic
      const note = notes[Math.floor(Math.random() * notes.length)];

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(note, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.013, now + 2.0);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 7.0);

      osc.connect(gain);
      gain.connect(delay);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 7.2);
      registerDynamicVoice([osc, gain], 7.2);
    };

    playMorning();
    synthIntervalRef.current = setInterval(playMorning, 4800);
  },

  // 24. 티베트 설산의 크리스탈 볼
  "flow-zen-snow-bowls": (ctx, masterGain, { createDelay, registerDynamicVoice, synthIntervalRef }) => {
    const delay = createDelay(1.3, 0.52, 0.3);

    const playBowl = () => {
      const now = ctx.currentTime;
      const base = 216.0; // Sacred 432 / 2
      const overtones = [base, base * 2.76, base * 5.4];

      overtones.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.015 / (idx + 1), now + 3.0);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 12.0);

        osc.connect(gain);
        gain.connect(delay);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + 12.5);
        registerDynamicVoice([osc, gain], 12.5);
      });
    };

    playBowl();
    synthIntervalRef.current = setInterval(playBowl, 9500);
  },

  // 25. 촛불 켜진 다락방 타로살롱
  "flow-lofi-candle": (ctx, masterGain, { createDelay, registerDynamicVoice, synthIntervalRef }) => {
    const delay = createDelay(0.7, 0.42, 0.26);

    const playLofiChords = () => {
      const now = ctx.currentTime;
      const chords = [
        [174.61, 220.0, 261.63, 329.63], // Fmaj7
        [164.81, 196.0, 246.94, 329.63], // Em7
        [146.83, 174.61, 220.0, 261.63], // Dm7
        [196.0, 246.94, 293.66, 349.23]   // G7
      ];
      const chord = chords[Math.floor(Math.random() * chords.length)];

      chord.forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(450, now); // Lofi tape warmth

        osc.type = "triangle";
        osc.frequency.setValueAtTime(note, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.012, now + 1.2);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 5.5);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(delay);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + 5.8);
        registerDynamicVoice([osc, filter, gain], 5.8);
      });
    };

    playLofiChords();
    synthIntervalRef.current = setInterval(playLofiChords, 5200);
  },

  // 26. 은하수 아래 피아노 여운
  "flow-lofi-milkyway": (ctx, masterGain, { createDelay, registerDynamicVoice, synthIntervalRef }) => {
    const delay = createDelay(1.1, 0.5, 0.32);

    const playPianoNote = () => {
      const now = ctx.currentTime;
      const notes = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
      const note = notes[Math.floor(Math.random() * notes.length)];

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(note, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.014, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 6.0);

      osc.connect(gain);
      gain.connect(delay);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 6.2);
      registerDynamicVoice([osc, gain], 6.2);
    };

    playPianoNote();
    synthIntervalRef.current = setInterval(playPianoNote, 3200);
  },

  // 27. 따뜻한 밤의 허밍
  "flow-lofi-humming": (ctx, masterGain, { createAutoPanner, registerDynamicVoice, synthIntervalRef }) => {
    const panner = createAutoPanner(0.03, 0.45);

    const playHumming = () => {
      const now = ctx.currentTime;
      const note = 220.0; // A3

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(320, now);

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(note, now);
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(note * 1.5, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.015, now + 3.0);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 9.0);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(panner);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 9.5);
      osc2.stop(now + 9.5);
      registerDynamicVoice([osc1, osc2, filter, gain], 9.5);
    };

    playHumming();
    synthIntervalRef.current = setInterval(playHumming, 7000);
  },

  // 28. 기억의 서재
  "flow-lofi-library": (ctx, masterGain, { createDelay, registerDynamicVoice, synthIntervalRef }) => {
    const delay = createDelay(1.0, 0.45, 0.25);

    const playStudy = () => {
      const now = ctx.currentTime;
      const notes = [130.81, 164.81, 196.0]; // C E G
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(notes[Math.floor(Math.random() * notes.length)], now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.014, now + 2.5);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 8.0);

      osc.connect(gain);
      gain.connect(delay);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 8.2);
      registerDynamicVoice([osc, gain], 8.2);
    };

    playStudy();
    synthIntervalRef.current = setInterval(playStudy, 6000);
  },

  // 29. 유성우 떨어지는 호수
  "flow-lofi-meteor": (ctx, masterGain, { createDelay, registerDynamicVoice, synthIntervalRef }) => {
    const delay = createDelay(0.75, 0.52, 0.35);

    const playMeteorShimmer = () => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const freq = 600 + Math.random() * 600;

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.012, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);

      osc.connect(gain);
      gain.connect(delay);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 4.8);
      registerDynamicVoice([osc, gain], 4.8);
    };

    playMeteorShimmer();
    synthIntervalRef.current = setInterval(playMeteorShimmer, 3000);
  },

  // 30. 영원한 안식의 요람
  "flow-lofi-eternity": (ctx, masterGain, { createDelay, registerDynamicVoice, synthIntervalRef }) => {
    const delay = createDelay(1.5, 0.55, 0.35);

    const playLullaby = () => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(110.0, now); // A2 soft cradle
      osc.frequency.linearRampToValueAtTime(164.81, now + 5.0);
      osc.frequency.linearRampToValueAtTime(110.0, now + 12.0);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.016, now + 4.0);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 13.0);

      osc.connect(gain);
      gain.connect(delay);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 13.5);
      registerDynamicVoice([osc, gain], 13.5);
    };

    playLullaby();
    synthIntervalRef.current = setInterval(playLullaby, 10000);
  },
};
