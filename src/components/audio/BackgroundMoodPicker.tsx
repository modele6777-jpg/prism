import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  X,
  Headphones,
  Sparkles,
  Waves,
  Wind,
  Check,
} from 'lucide-react';
import { useMoodSound } from '@/hooks/useMoodSound';
import { MoodSoundId } from '@/lib/moodSoundEngine';

interface EnvironmentAtmosphere {
  gradient: string;
  radialCore: string;
  secondaryColor: string;
  vignetteColor: string;
  particleGlow: string;
  keyword: string;
}

const ENVIRONMENT_ATMOSPHERES: Record<MoodSoundId, EnvironmentAtmosphere> = {
  rain: {
    gradient: 'linear-gradient(145deg, rgba(3, 105, 161, 0.42) 0%, rgba(12, 74, 110, 0.28) 45%, rgba(2, 6, 23, 0.88) 100%)',
    radialCore: 'radial-gradient(circle at 50% 18%, rgba(56, 189, 248, 0.4) 0%, rgba(14, 165, 233, 0.15) 50%, transparent 75%)',
    secondaryColor: '#0284c7',
    vignetteColor: 'rgba(3, 105, 161, 0.32)',
    particleGlow: 'rgba(56, 189, 248, 0.6)',
    keyword: '촉촉한 밤비의 잔향과 서늘한 청명함',
  },
  forest: {
    gradient: 'linear-gradient(145deg, rgba(5, 150, 105, 0.42) 0%, rgba(6, 78, 59, 0.28) 45%, rgba(2, 44, 34, 0.88) 100%)',
    radialCore: 'radial-gradient(circle at 50% 18%, rgba(52, 211, 153, 0.4) 0%, rgba(16, 185, 129, 0.15) 50%, transparent 75%)',
    secondaryColor: '#059669',
    vignetteColor: 'rgba(5, 150, 105, 0.3)',
    particleGlow: 'rgba(52, 211, 153, 0.6)',
    keyword: '햇살이 비치는 깊은 숲과 싱그러운 솔바람',
  },
  whitenoise: {
    gradient: 'linear-gradient(145deg, rgba(124, 58, 237, 0.38) 0%, rgba(76, 29, 149, 0.28) 45%, rgba(15, 23, 42, 0.88) 100%)',
    radialCore: 'radial-gradient(circle at 50% 18%, rgba(167, 139, 250, 0.38) 0%, rgba(139, 92, 246, 0.15) 50%, transparent 75%)',
    secondaryColor: '#7c3aed',
    vignetteColor: 'rgba(124, 58, 237, 0.28)',
    particleGlow: 'rgba(167, 139, 250, 0.6)',
    keyword: '잡념과 소음이 지워지는 고요한 벨벳 공간',
  },
  ocean: {
    gradient: 'linear-gradient(145deg, rgba(8, 145, 178, 0.42) 0%, rgba(21, 94, 117, 0.28) 45%, rgba(8, 51, 68, 0.88) 100%)',
    radialCore: 'radial-gradient(circle at 50% 18%, rgba(6, 182, 212, 0.4) 0%, rgba(14, 116, 144, 0.15) 50%, transparent 75%)',
    secondaryColor: '#0891b2',
    vignetteColor: 'rgba(8, 145, 178, 0.3)',
    particleGlow: 'rgba(6, 182, 212, 0.6)',
    keyword: '끝없이 밀려왔다 물러서는 밤바다의 숨결',
  },
  binaural: {
    gradient: 'linear-gradient(145deg, rgba(217, 119, 6, 0.42) 0%, rgba(180, 83, 9, 0.28) 45%, rgba(69, 26, 3, 0.88) 100%)',
    radialCore: 'radial-gradient(circle at 50% 18%, rgba(245, 158, 11, 0.4) 0%, rgba(217, 119, 6, 0.15) 50%, transparent 75%)',
    secondaryColor: '#d97706',
    vignetteColor: 'rgba(217, 119, 6, 0.3)',
    particleGlow: 'rgba(245, 158, 11, 0.6)',
    keyword: '432Hz 솔페지오 황금빛 공명과 내면의 조화',
  },
  fireplace: {
    gradient: 'linear-gradient(145deg, rgba(234, 88, 12, 0.42) 0%, rgba(154, 52, 18, 0.28) 45%, rgba(67, 20, 7, 0.88) 100%)',
    radialCore: 'radial-gradient(circle at 50% 18%, rgba(249, 115, 22, 0.4) 0%, rgba(234, 88, 12, 0.15) 50%, transparent 75%)',
    secondaryColor: '#ea580c',
    vignetteColor: 'rgba(234, 88, 12, 0.32)',
    particleGlow: 'rgba(249, 115, 22, 0.6)',
    keyword: '타오르는 장작의 따스한 온기와 타닥거림',
  },
};

export function BackgroundMoodPicker() {
  const {
    isPlaying,
    activeMood,
    volume,
    isPickerOpen,
    presets,
    currentPreset,
    togglePlay,
    setMood,
    setVolume,
    closePicker,
  } = useMoodSound();

  const atmosphere = useMemo(() => {
    return ENVIRONMENT_ATMOSPHERES[activeMood] || ENVIRONMENT_ATMOSPHERES.rain;
  }, [activeMood]);

  if (!isPickerOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 isolate">
        {/* Base Dark Dimmer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closePicker}
          className="absolute inset-0 bg-black/65 backdrop-blur-md"
        />

        {/* 🌟 Animated Atmospheric Backdrop Vignette (Cross-fades smoothly on mood change) */}
        <AnimatePresence mode="sync">
          <motion.div
            key={`backdrop-vignette-${activeMood}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 40%, ${atmosphere.vignetteColor} 0%, rgba(0, 0, 0, 0.85) 65%, #000000 100%)`,
            }}
          />
        </AnimatePresence>

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg rounded-3xl bg-zinc-950/90 border p-5 md:p-6 shadow-2xl backdrop-blur-2xl text-white space-y-5 overflow-hidden transition-colors duration-700"
          style={{
            borderColor: `${currentPreset.color}45`,
            boxShadow: `0 25px 60px -15px ${atmosphere.vignetteColor}, 0 0 30px ${atmosphere.vignetteColor}`,
          }}
        >
          {/* 🌈 Animated Environmental Background Layers inside Modal */}
          <AnimatePresence mode="sync">
            <motion.div
              key={`modal-env-${activeMood}`}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl"
            >
              {/* 1. Base Gradient Atmosphere */}
              <div
                className="absolute inset-0"
                style={{ background: atmosphere.gradient }}
              />

              {/* 2. Luminous Flowing Core Halo */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.4, 0.65, 0.4],
                  x: ['-5%', '5%', '-5%'],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute -top-20 left-1/2 -translate-x-1/2 w-[420px] h-[240px] blur-3xl rounded-full"
                style={{ background: atmosphere.radialCore }}
              />

              {/* 3. Secondary Flowing Light Cloud */}
              <motion.div
                animate={{
                  scale: [1.15, 0.9, 1.15],
                  opacity: [0.25, 0.45, 0.25],
                  y: ['-6%', '6%', '-6%'],
                }}
                transition={{
                  duration: 7.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute -bottom-16 -right-10 w-80 h-64 blur-3xl rounded-full"
                style={{ backgroundColor: atmosphere.secondaryColor }}
              />

              {/* 4. Environmental Watermark Glyph */}
              <div className="absolute top-4 right-5 text-8xl opacity-[0.06] select-none pointer-events-none filter blur-[1px]">
                {currentPreset.emoji}
              </div>

              {/* 5. Subtle Starlight / Droplet Texture Grid */}
              <div className="absolute inset-0 bg-[radial-gradient(#ffffff0f_1px,transparent_1px)] [background-size:22px_22px] opacity-40 mix-blend-overlay" />
            </motion.div>
          </AnimatePresence>

          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10 relative z-10">
            <div className="flex items-center gap-3">
              <motion.div
                key={`header-icon-${activeMood}`}
                initial={{ scale: 0.8, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                className="w-11 h-11 rounded-2xl flex items-center justify-center border shadow-lg transition-colors"
                style={{
                  backgroundColor: `${currentPreset.color}25`,
                  borderColor: `${currentPreset.color}55`,
                  color: currentPreset.color,
                  boxShadow: `0 0 16px ${atmosphere.particleGlow}`,
                }}
              >
                <Headphones size={22} className={isPlaying ? 'animate-pulse' : ''} />
              </motion.div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white tracking-tight">배경 무드 사운드 피커</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/70 font-semibold border border-white/10">
                    Ambient Moods
                  </span>
                </div>
                {/* Environmental Keyword Banner with Smooth Fade */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`desc-banner-${activeMood}`}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="flex items-center gap-1.5 text-xs text-white/70 mt-0.5"
                  >
                    <Sparkles size={11} style={{ color: currentPreset.color }} className="animate-spin shrink-0" />
                    <span className="line-clamp-1">{atmosphere.keyword}</span>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <button
              type="button"
              onClick={closePicker}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 transition-colors cursor-pointer"
              title="닫기"
            >
              <X size={16} />
            </button>
          </div>

          {/* Preset Sound Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[48vh] overflow-y-auto pr-1 custom-scrollbar relative z-10">
            {presets.map((preset) => {
              const isSelected = activeMood === preset.id;
              const isCurrentlyActiveAndPlaying = isSelected && isPlaying;
              const presetAtmosphere = ENVIRONMENT_ATMOSPHERES[preset.id];

              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      togglePlay();
                    } else {
                      setMood(preset.id);
                      if (!isPlaying) togglePlay(preset.id);
                    }
                  }}
                  className={`group relative p-3.5 rounded-2xl border text-left transition-all duration-300 cursor-pointer overflow-hidden ${
                    isSelected
                      ? 'bg-white/15 border-white/40 shadow-xl scale-[1.01]'
                      : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 hover:border-white/20'
                  }`}
                  style={
                    isSelected
                      ? {
                          borderColor: `${preset.color}80`,
                          boxShadow: `0 0 20px ${presetAtmosphere?.vignetteColor || 'transparent'}`,
                        }
                      : {}
                  }
                >
                  {/* Active selection glowing ambient sweep */}
                  {isSelected && (
                    <motion.div
                      layoutId="active-mood-glow"
                      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                      className="absolute inset-0 opacity-20 pointer-events-none"
                      style={{ backgroundColor: preset.color }}
                    />
                  )}

                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl transition-transform group-hover:scale-110 duration-200">
                        {preset.emoji}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white group-hover:text-white transition-colors">
                            {preset.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-white/45 block font-mono">
                          {preset.nameEn}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {isCurrentlyActiveAndPlaying ? (
                        <div className="flex items-center gap-0.5 px-2 py-1 rounded-full bg-emerald-500/25 border border-emerald-400/50 text-emerald-300 text-[10px] font-bold shadow-[0_0_10px_rgba(52,211,153,0.3)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-0.5" />
                          <span>재생 중</span>
                        </div>
                      ) : isSelected ? (
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors"
                          style={{
                            backgroundColor: `${preset.color}20`,
                            borderColor: `${preset.color}50`,
                            color: preset.color,
                          }}
                        >
                          선택됨
                        </span>
                      ) : (
                        <span className="text-[10px] text-white/40 px-1.5 py-0.5 rounded bg-white/5">
                          {preset.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-white/60 mt-2 line-clamp-2 leading-relaxed relative z-10">
                    {preset.description}
                  </p>

                  {/* Equalizer animation wave when playing */}
                  {isCurrentlyActiveAndPlaying && (
                    <div className="flex items-center gap-1 mt-2.5 pt-2 border-t border-white/10 relative z-10">
                      {[0.3, 0.7, 0.4, 0.9, 0.6, 0.8, 0.5, 0.7].map((height, i) => (
                        <motion.div
                          key={i}
                          animate={{
                            scaleY: [0.3, 1, 0.2, 0.9, 0.4],
                          }}
                          transition={{
                            duration: 0.8 + (i % 3) * 0.2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                            delay: i * 0.1,
                          }}
                          className="w-1 h-3 rounded-full origin-bottom"
                          style={{ backgroundColor: preset.color }}
                        />
                      ))}
                      <span className="text-[10px] text-white/60 ml-1.5 font-sans">
                        실시간 앰비언트 음향 합성 중
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Master Control & Volume Slider */}
          <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3 relative z-10 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              {/* Main Play / Pause Button */}
              <button
                type="button"
                onClick={() => togglePlay()}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer ${
                  isPlaying
                    ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/25'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Pause size={15} />
                    <span>사운드 일시정지</span>
                  </>
                ) : (
                  <>
                    <Play size={15} fill="currentColor" />
                    <span>{currentPreset.name} 재생하기</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 text-xs font-mono text-white/70">
                <span>{currentPreset.emoji}</span>
                <span className="font-bold text-white">{currentPreset.name}</span>
              </div>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-3 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => setVolume(volume > 0 ? 0 : 0.6)}
                className="text-white/60 hover:text-white transition-colors cursor-pointer"
                title={volume === 0 ? '음소거 해제' : '음소거'}
              >
                {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="flex-1 h-1.5 rounded-full bg-white/20 accent-emerald-400 cursor-pointer"
              />
              <span className="text-xs font-mono text-white/50 w-9 text-right">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>

          {/* Footer note */}
          <div className="flex items-center justify-between text-[11px] text-white/40 pt-1 relative z-10">
            <span>✨ 탭을 닫아도 배경에서 계속 재생됩니다.</span>
            <button
              type="button"
              onClick={closePicker}
              className="text-emerald-400 hover:underline font-medium cursor-pointer"
            >
              적용하고 닫기
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
