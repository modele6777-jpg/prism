import React from 'react';
import { motion } from 'motion/react';
import { isIPhoneXSClass } from '@/lib/perfMode';

interface PrismRainbowLoaderProps {
  fullScreen?: boolean;
  message?: string;
  subMessage?: string;
  compact?: boolean;
}

export function PrismRainbowLoader({
  fullScreen = false,
  message = '프리즘 스펙트럼 조율 중...',
  subMessage = 'SPECTRUM OF LIGHT & CONSCIOUSNESS',
  compact = false,
}: PrismRainbowLoaderProps) {
  const isXS = isIPhoneXSClass();

  return (
    <div
      className={`relative flex flex-col items-center justify-center select-none overflow-hidden ${
        fullScreen
          ? 'fixed inset-0 z-[9999] h-dvh w-screen bg-[#07070d] text-white pt-safe pb-safe'
          : compact
          ? 'py-6 w-full'
          : 'min-h-[42vh] py-12 w-full'
      }`}
    >
      {/* Background Chromatic Aurora Glow */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
        {/* Pulsing rainbow aura */}
        <motion.div
          animate={
            isXS
              ? { opacity: [0.25, 0.45, 0.25], scale: [0.98, 1.05, 0.98] }
              : {
                  scale: [0.95, 1.25, 0.95],
                  opacity: [0.35, 0.65, 0.35],
                  rotate: [0, 180, 360],
                }
          }
          transition={{
            duration: isXS ? 14 : 10,
            repeat: Infinity,
            ease: 'linear',
          }}
          className={`absolute w-[320px] h-[320px] sm:w-[480px] sm:h-[480px] rounded-full ${
            isXS ? 'blur-xl opacity-30' : 'blur-[75px] opacity-40 mix-blend-screen'
          }`}
          style={{
            background:
              'radial-gradient(circle, rgba(255,0,128,0.25) 0%, rgba(255,140,0,0.2) 20%, rgba(255,230,0,0.18) 40%, rgba(0,230,118,0.2) 60%, rgba(0,180,255,0.22) 80%, rgba(186,85,211,0.25) 100%)',
          }}
        />

        {/* Ambient deep dark center to enhance prism contrast */}
        <div className={`absolute w-[220px] h-[220px] rounded-full bg-[#07070d]/80 ${isXS ? 'blur-lg' : 'blur-2xl'}`} />
      </div>

      {/* Main Prism & Rainbow Graphic Area */}
      <div className={`relative z-10 flex items-center justify-center ${compact ? 'scale-75' : 'scale-100'}`}>
        <svg
          viewBox="0 0 420 280"
          className={`w-[320px] sm:w-[380px] h-[210px] sm:h-[250px] overflow-visible ${
            isXS ? '' : 'drop-shadow-[0_0_25px_rgba(0,0,0,0.8)]'
          }`}
          xmlns="http://www.w3.org/2000/svg"
        >

          <defs>
            {/* White beam gradient */}
            <linearGradient id="whiteBeamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="40%" stopColor="#d8f0ff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
            </linearGradient>

            {/* Glowing White Core Filter */}
            <filter id="whiteGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Rainbow Beam Filter */}
            <filter id="rainbowGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Triangle Face Reflections */}
            <linearGradient id="glassFaceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
              <stop offset="40%" stopColor="rgba(120,200,255,0.06)" />
              <stop offset="70%" stopColor="rgba(255,100,255,0.06)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.12)" />
            </linearGradient>

            {/* Rainbow Spectrum Linear Gradient for main fanned beam */}
            <linearGradient id="rainbowFanGrad" x1="0%" y1="0%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="18%" stopColor="#ff1744" stopOpacity="0.95" />
              <stop offset="35%" stopColor="#ff9100" stopOpacity="0.95" />
              <stop offset="52%" stopColor="#ffea00" stopOpacity="0.95" />
              <stop offset="68%" stopColor="#00e676" stopOpacity="0.95" />
              <stop offset="84%" stopColor="#00b0ff" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#d500f9" stopOpacity="0.95" />
            </linearGradient>

            {/* Internal Dispersion Gradient */}
            <linearGradient id="internalDispersion" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="30%" stopColor="#ffe600" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#00e5ff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ff00a0" stopOpacity="0.85" />
            </linearGradient>
          </defs>

          {/* 1. Incident White Light Ray (Incoming from left) */}
          <g>
            {/* Outer beam blur */}
            <line
              x1="20"
              y1="165"
              x2="152"
              y2="135"
              stroke="#ffffff"
              strokeWidth="5"
              strokeOpacity="0.4"
              filter="url(#whiteGlow)"
            />
            {/* Core intense beam */}
            <line
              x1="20"
              y1="165"
              x2="152"
              y2="135"
              stroke="url(#whiteBeamGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Animated traveling photons along the white beam */}
            <motion.circle
              r="2.5"
              fill="#ffffff"
              filter="url(#whiteGlow)"
              animate={{
                cx: [20, 152],
                cy: [165, 135],
                opacity: [0, 1, 0.9, 0],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </g>

          {/* 2. Glass Prism Triangle (Centered at ~185) */}
          <g>
            {/* Soft backdrop glow behind prism */}
            <polygon
              points="185,50 115,195 255,195"
              fill="rgba(255,255,255,0.03)"
              filter="url(#whiteGlow)"
            />

            {/* Inner refraction light path inside triangle */}
            <polygon
              points="152,135 220,118 226,148"
              fill="url(#internalDispersion)"
              opacity="0.8"
            />

            {/* Glass body */}
            <polygon
              points="185,50 115,195 255,195"
              fill="url(#glassFaceGrad)"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1.5"
              style={{ backdropFilter: 'blur(4px)' }}
            />

            {/* High-contrast crystalline edge highlights */}
            {/* Left face edge */}
            <line
              x1="185"
              y1="50"
              x2="115"
              y2="195"
              stroke="#ffffff"
              strokeWidth="2"
              strokeOpacity="0.85"
              strokeLinecap="round"
            />
            {/* Right face edge (where dispersion happens) */}
            <line
              x1="185"
              y1="50"
              x2="255"
              y2="195"
              stroke="#ffffff"
              strokeWidth="2"
              strokeOpacity="0.7"
              strokeLinecap="round"
            />
            {/* Bottom facet line */}
            <line
              x1="115"
              y1="195"
              x2="255"
              y2="195"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="1.2"
            />

            {/* Crystal vertex apex gleams */}
            <circle cx="185" cy="50" r="3" fill="#ffffff" filter="url(#whiteGlow)" />
            <circle cx="115" cy="195" r="2" fill="#ffffff" opacity="0.8" />
            <circle cx="255" cy="195" r="2.5" fill="#ffffff" opacity="0.8" />
          </g>

          {/* 3. The Vibrant Pride Rainbow Beam & Dispersion Fan (Right side) */}
          <g filter="url(#rainbowGlow)">
            {/* Fanned out Rainbow Body with vibrant layered ribbons */}
            {/* Red Ribbon */}
            <motion.path
              d="M 220,118 L 410,132 L 410,147 L 222,123 Z"
              fill="#ff0055"
              animate={{ opacity: [0.85, 1, 0.85] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Orange Ribbon */}
            <motion.path
              d="M 222,123 L 410,147 L 410,162 L 223,129 Z"
              fill="#ff6d00"
              animate={{ opacity: [0.85, 1, 0.85] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }}
            />

            {/* Yellow Ribbon */}
            <motion.path
              d="M 223,129 L 410,162 L 410,177 L 224,135 Z"
              fill="#ffd600"
              animate={{ opacity: [0.9, 1, 0.9] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
            />

            {/* Green Ribbon */}
            <motion.path
              d="M 224,135 L 410,177 L 410,192 L 225,141 Z"
              fill="#00e676"
              animate={{ opacity: [0.85, 1, 0.85] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.45 }}
            />

            {/* Cyan / Sky Ribbon */}
            <motion.path
              d="M 225,141 L 410,192 L 410,207 L 226,146 Z"
              fill="#00b0ff"
              animate={{ opacity: [0.85, 1, 0.85] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
            />

            {/* Royal Indigo Blue Ribbon */}
            <motion.path
              d="M 226,146 L 410,207 L 410,222 L 227,151 Z"
              fill="#3d5afe"
              animate={{ opacity: [0.85, 1, 0.85] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.75 }}
            />

            {/* Violet / Pride Purple Ribbon */}
            <motion.path
              d="M 227,151 L 410,222 L 410,238 L 228,156 Z"
              fill="#d500f9"
              animate={{ opacity: [0.85, 1, 0.85] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.9 }}
            />

            {/* Soft blended overall fanned overlay for cinematic dispersion */}
            <polygon
              points="220,118 410,132 410,238 228,156"
              fill="url(#rainbowFanGrad)"
              opacity="0.3"
              style={{ mixBlendMode: 'screen' }}
            />
          </g>

          {/* 4. Floating Sparkling Pride Star Particles */}
          <g>
            {/* Sparkle 1: Gold */}
            <motion.circle
              cx="290"
              cy="148"
              r="2"
              fill="#ffe600"
              filter="url(#whiteGlow)"
              animate={{
                scale: [0.5, 1.8, 0.5],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Sparkle 2: Emerald */}
            <motion.circle
              cx="330"
              cy="185"
              r="2.5"
              fill="#00ff88"
              filter="url(#whiteGlow)"
              animate={{
                scale: [0.7, 2, 0.7],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            />

            {/* Sparkle 3: Violet / Magenta */}
            <motion.circle
              cx="360"
              cy="215"
              r="2"
              fill="#ff00e5"
              filter="url(#whiteGlow)"
              animate={{
                scale: [0.5, 1.9, 0.5],
                opacity: [0.3, 0.95, 0.3],
              }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
            />

            {/* Sparkle 4: Pure White Apex Sparkle */}
            <motion.path
              d="M 185,42 L 187,48 L 193,50 L 187,52 L 185,58 L 183,52 L 177,50 L 183,48 Z"
              fill="#ffffff"
              filter="url(#whiteGlow)"
              animate={{
                scale: [0.6, 1.25, 0.6],
                rotate: [0, 90, 180],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformOrigin: '185px 50px' }}
            />
          </g>
        </svg>
      </div>

      {/* Typography & Aesthetic Rainbow Shimmer */}
      <div className="relative z-10 flex flex-col items-center text-center mt-2 px-6">
        {/* Glowing Brand Title with Continuous Animated Rainbow Gradient */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative flex items-center justify-center"
        >
          <h1 className="font-display font-black text-3xl sm:text-4xl tracking-[0.3em] uppercase bg-gradient-to-r from-[#ff0055] via-[#ff9100] via-[#ffd600] via-[#00e676] via-[#00b0ff] via-[#d500f9] to-[#ff0055] bg-[length:300%_auto] animate-rainbow-wave bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(255,255,255,0.25)]">
            PRISM
          </h1>
        </motion.div>

        {/* Message Indicator */}
        <motion.p
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          className="text-xs sm:text-sm font-semibold tracking-wider text-white/90 font-sans mt-3"
        >
          {message}
        </motion.p>

        {/* Subtitle / Dimension Status */}
        {subMessage && (
          <p className="text-[10px] tracking-[0.25em] text-white/40 font-mono mt-1 uppercase">
            {subMessage}
          </p>
        )}

        {/* Animated Radiant Rainbow Progress Bar */}
        <div className="w-48 sm:w-56 h-[3px] bg-white/10 rounded-full mt-5 overflow-hidden relative backdrop-blur-sm">
          <motion.div
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="w-full h-full rounded-full bg-gradient-to-r from-[#ff0055] via-[#ff9100] via-[#ffd600] via-[#00e676] via-[#00b0ff] to-[#d500f9] shadow-[0_0_12px_rgba(255,255,255,0.6)]"
          />
        </div>
      </div>
    </div>
  );
}
