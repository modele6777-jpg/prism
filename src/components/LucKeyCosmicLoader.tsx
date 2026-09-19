import React from 'react';
import { motion } from 'motion/react';
import { isIPhoneXSClass } from '@/lib/perfMode';

export interface LucKeyCosmicLoaderProps {
  message?: string;
  subMessage?: string;
  fullScreen?: boolean;
  compact?: boolean;
}

/**
 * 🍀 LucKeyCosmicLoader
 * LucKey의 고유 아이덴티티(Luck 네잎클로버 + Key 해답의 열쇠)를 형상화한
 * 성스러운 3D 크리스탈 클로버-키 및 코스믹 아스트랄 궤도 로딩 컴포넌트
 */
export function LucKeyCosmicLoader({
  message = '행운과 해답의 문을 여는 중...',
  subMessage = 'LUCKEY · SOUL SANCTUARY & CELESTIAL KEY',
  fullScreen = false,
  compact = false,
}: LucKeyCosmicLoaderProps) {
  const isXS = isIPhoneXSClass();
  const scale = compact ? 0.75 : 1.0;

  const stardustStars = isXS
    ? [
        { top: '22%', left: '28%', delay: 0, color: '#fde047' },
        { top: '68%', left: '72%', delay: 1.1, color: '#34d399' },
      ]
    : [
        { top: '20%', left: '25%', delay: 0, color: '#fde047' },
        { top: '72%', left: '22%', delay: 0.9, color: '#34d399' },
        { top: '30%', left: '78%', delay: 0.4, color: '#38bdf8' },
        { top: '78%', left: '70%', delay: 1.4, color: '#c084fc' },
        { top: '15%', left: '62%', delay: 0.7, color: '#fbbf24' },
      ];

  return (
    <div
      role="status"
      aria-label={message}
      className={`flex flex-col items-center justify-center select-none text-white overflow-hidden ${
        fullScreen
          ? 'fixed inset-0 z-[9999] bg-[#05060c] min-h-[100dvh] w-screen px-4 pt-safe pb-safe'
          : compact
          ? 'relative py-6 px-4 w-full'
          : 'relative min-h-[44vh] py-10 px-4 w-full'
      }`}
    >
      {/* 🌌 Background Cosmic Aurora Glow: Gold + Emerald + Cyan Aura */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
        {/* Pulsing Luck/Key Aura */}
        <motion.div
          animate={
            isXS
              ? { opacity: [0.25, 0.4, 0.25], scale: [0.96, 1.04, 0.96] }
              : {
                  scale: [0.94, 1.18, 0.94],
                  opacity: [0.3, 0.55, 0.3],
                  rotate: [0, 180, 360],
                }
          }
          transition={{
            duration: isXS ? 12 : 9,
            repeat: Number.POSITIVE_INFINITY,
            ease: 'linear',
          }}
          className={`absolute w-[340px] h-[340px] sm:w-[500px] sm:h-[500px] rounded-full ${
            isXS ? 'blur-xl opacity-30' : 'blur-[80px] opacity-40 mix-blend-screen'
          }`}
          style={{
            background:
              'radial-gradient(circle, rgba(251,191,36,0.22) 0%, rgba(16,185,129,0.25) 30%, rgba(6,182,212,0.22) 65%, rgba(168,85,247,0.18) 100%)',
          }}
        />

        {/* Ambient Dark Core for Key Contrast */}
        <div
          className={`absolute w-[220px] h-[220px] rounded-full bg-[#05060c]/80 ${
            isXS ? 'blur-lg' : 'blur-2xl'
          }`}
        />
      </div>

      {/* 🌟 Floating Stardust Particles */}
      <div className="absolute inset-0 pointer-events-none opacity-40 overflow-hidden">
        {stardustStars.map((star, i) => (
          <motion.div
            key={i}
            animate={{
              opacity: [0.2, 0.95, 0.2],
              scale: [0.7, 1.35, 0.7],
              y: [-6, 6, -6],
            }}
            transition={{
              duration: 2.6 + i * 0.4,
              repeat: Number.POSITIVE_INFINITY,
              delay: star.delay,
              ease: 'easeInOut',
            }}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              top: star.top,
              left: star.left,
              backgroundColor: star.color,
              boxShadow: `0 0 10px ${star.color}`,
            }}
          />
        ))}
      </div>

      {/* 🍀🗝️ Central Sacred LucKey Insignia Stage */}
      <motion.div
        animate={{ y: [-4, 4, -4] }}
        transition={{ duration: 3.8, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
        className="relative z-10 flex items-center justify-center"
        style={{ transform: `scale(${scale})` }}
      >
        <svg
          viewBox="0 0 300 320"
          style={{ width: 250, height: 268 }}
          className={`overflow-visible ${isXS ? '' : 'filter drop-shadow-[0_0_35px_rgba(16,185,129,0.35)]'}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* 1. Golden Emerald Prism Key Gradient */}
            <linearGradient id="luckeyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fffbeb" stopOpacity="0.98" />
              <stop offset="22%" stopColor="#fde047" stopOpacity="0.95" />
              <stop offset="48%" stopColor="#34d399" stopOpacity="0.92" />
              <stop offset="75%" stopColor="#38bdf8" stopOpacity="0.88" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.92" />
            </linearGradient>

            {/* 2. Four-Leaf Clover Emerald Facet Gradient */}
            <linearGradient id="cloverLeafGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6ee7b7" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#047857" stopOpacity="0.85" />
            </linearGradient>

            {/* 3. Gold Amber Trim Gradient */}
            <linearGradient id="goldTrimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.85" />
            </linearGradient>

            {/* 4. Solfeggio 528Hz Core Singularity */}
            <radialGradient id="solfeggioSingularity" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="30%" stopColor="#fef08a" stopOpacity="0.95" />
              <stop offset="65%" stopColor="#34d399" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </radialGradient>

            {/* 5. Astral Orbit Ring 1 (Gold to Emerald) */}
            <linearGradient id="orbitRing1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
              <stop offset="55%" stopColor="#34d399" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
            </linearGradient>

            {/* 6. Astral Orbit Ring 2 (Cyan to Violet) */}
            <linearGradient id="orbitRing2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#c084fc" stopOpacity="0.88" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.2" />
            </linearGradient>

            {/* 7. Key Shaft Metallic Gradient */}
            <linearGradient id="shaftGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="25%" stopColor="#fbbf24" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#34d399" stopOpacity="0.85" />
              <stop offset="85%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.85" />
            </linearGradient>

            {/* White/Gold Glow Filter */}
            <filter id="goldGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 🌟 1. Astral Orbit Rings around the Clover Head (Center: 150, 92) */}
          <g transform="translate(150, 92)">
            {/* Orbit Ring 1 (Gold-Emerald) */}
            <motion.g
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
            >
              <ellipse
                cx="0"
                cy="0"
                rx="88"
                ry="36"
                fill="none"
                stroke="url(#orbitRing1)"
                strokeWidth="1.6"
                strokeDasharray="6 3 12 3"
                transform="rotate(-24)"
                className="opacity-80 filter drop-shadow-[0_0_8px_#fde047]"
              />
              <circle cx="76" cy="-18" r="3" fill="#fef08a" className="filter drop-shadow-[0_0_6px_#fff]" />
              <circle cx="-76" cy="18" r="2.2" fill="#6ee7b7" />
            </motion.g>

            {/* Orbit Ring 2 (Cyan-Purple) */}
            <motion.g
              animate={{ rotate: -360 }}
              transition={{ duration: 13, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
            >
              <ellipse
                cx="0"
                cy="0"
                rx="86"
                ry="35"
                fill="none"
                stroke="url(#orbitRing2)"
                strokeWidth="1.4"
                strokeDasharray="4 4 8 4"
                transform="rotate(26)"
                className="opacity-75 filter drop-shadow-[0_0_8px_#38bdf8]"
              />
              <circle cx="-74" cy="-17" r="2.8" fill="#a5f3fc" className="filter drop-shadow-[0_0_6px_#38bdf8]" />
              <circle cx="74" cy="17" r="2.4" fill="#e879f9" />
            </motion.g>
          </g>

          {/* 🍀 2. The Sacred Four-Leaf Clover Key Head (Luck) */}
          {/* Subtle Ambient Glow Aura behind clover */}
          <circle cx="150" cy="92" r="48" fill="#10b981" fillOpacity="0.2" className="blur-[10px]" />
          <circle cx="150" cy="92" r="32" fill="#fbbf24" fillOpacity="0.15" className="blur-[6px]" />

          {/* Golden Outer Clover Frame / Filigree */}
          <g filter="url(#goldGlow)">
            {/* 4 Clover Petal Bulbs (Heart-shaped lobes) */}
            {/* Top Leaf */}
            <path
              d="M 150 92 C 138 68, 126 44, 150 42 C 174 44, 162 68, 150 92 Z"
              fill="url(#cloverLeafGrad)"
              stroke="url(#goldTrimGrad)"
              strokeWidth="2.2"
            />
            {/* Bottom Leaf */}
            <path
              d="M 150 92 C 138 116, 126 140, 150 142 C 174 140, 162 116, 150 92 Z"
              fill="url(#cloverLeafGrad)"
              stroke="url(#goldTrimGrad)"
              strokeWidth="2.2"
            />
            {/* Left Leaf */}
            <path
              d="M 150 92 C 126 80, 102 68, 100 92 C 102 116, 126 104, 150 92 Z"
              fill="url(#cloverLeafGrad)"
              stroke="url(#goldTrimGrad)"
              strokeWidth="2.2"
            />
            {/* Right Leaf */}
            <path
              d="M 150 92 C 174 80, 198 68, 200 92 C 198 116, 174 104, 150 92 Z"
              fill="url(#cloverLeafGrad)"
              stroke="url(#goldTrimGrad)"
              strokeWidth="2.2"
            />
          </g>

          {/* Inner Petal Veins & Prismatic Highlights */}
          <g opacity="0.65" stroke="#ffffff" strokeWidth="1" strokeLinecap="round">
            <line x1="150" y1="92" x2="150" y2="52" stroke="url(#goldTrimGrad)" />
            <line x1="150" y1="92" x2="150" y2="132" stroke="url(#goldTrimGrad)" />
            <line x1="150" y1="92" x2="110" y2="92" stroke="url(#goldTrimGrad)" />
            <line x1="150" y1="92" x2="190" y2="92" stroke="url(#goldTrimGrad)" />
          </g>

          {/* Central Sacred Singularity Ring (528Hz Solfeggio Core) */}
          <circle
            cx="150"
            cy="92"
            r="16"
            fill="#030712"
            stroke="url(#goldTrimGrad)"
            strokeWidth="2"
          />
          <motion.circle
            cx="150"
            cy="92"
            r="13"
            fill="url(#solfeggioSingularity)"
            animate={{ scale: [0.85, 1.25, 0.85], opacity: [0.75, 1, 0.75] }}
            transition={{ duration: 2.2, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
            className="mix-blend-screen"
          />

          {/* Central 8-Point Starlight Star of Awakening */}
          <path
            d="M 150 78 Q 150 92 164 92 Q 150 92 150 106 Q 150 92 136 92 Q 150 92 150 78 Z"
            fill="#ffffff"
            className="filter drop-shadow-[0_0_8px_#ffffff]"
          />
          <circle cx="150" cy="92" r="3.2" fill="#fffbeb" />

          {/* Top Spire Crown: Starlight Gem */}
          <path d="M 150 30 L 156 39 L 150 43 L 144 39 Z" fill="url(#goldTrimGrad)" />
          <circle cx="150" cy="30" r="2.5" fill="#fde047" className="filter drop-shadow-[0_0_6px_#fde047]" />

          {/* 🗝️ 3. Collar & Prismatic Fluted Key Shaft (Key) */}
          {/* Winged Collar (Connecting Clover Head & Shaft) */}
          <path
            d="M 124 138 C 136 133 144 131 150 131 C 156 131 164 133 176 138 C 164 144 156 146 150 146 C 144 146 136 144 124 138 Z"
            fill="url(#goldTrimGrad)"
            stroke="#ffffff"
            strokeWidth="0.8"
            className="filter drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
          />
          <circle cx="150" cy="138.5" r="2.2" fill="#10b981" />

          {/* Key Shaft Body (150, 146 down to 264) */}
          <rect
            x="145.5"
            y="146"
            width="9"
            height="118"
            rx="4.5"
            fill="url(#shaftGrad)"
            stroke="url(#goldTrimGrad)"
            strokeWidth="1.2"
            className="filter drop-shadow-[0_0_12px_rgba(16,185,129,0.3)]"
          />

          {/* High-Tech Prismatic Fluted Inlay Line */}
          <line
            x1="150"
            y1="149"
            x2="150"
            y2="260"
            stroke="#ffffff"
            strokeWidth="1.6"
            strokeOpacity="0.9"
            strokeLinecap="round"
          />

          {/* Cosmic Rune Nodes along the Shaft */}
          {/* Node 1: Fortune Ruby-Amber Gem */}
          <circle cx="150" cy="172" r="3.2" fill="#fbbf24" stroke="#ffffff" strokeWidth="0.8" />
          {/* Node 2: Emerald Healing Gem */}
          <circle cx="150" cy="202" r="3.4" fill="#34d399" stroke="#ffffff" strokeWidth="0.8" />
          {/* Node 3: Astral Wisdom Cyan Gem */}
          <circle cx="150" cy="232" r="3.2" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.8" />

          {/* 🗝️ 4. Matrix Key Bit (열쇠 날) - Expanding to the Right */}
          <g transform="translate(154.5, 218)">
            {/* Top Bit Wing */}
            <path
              d="M 0 0 L 22 0 C 25 0 27 2 27 5 L 27 10 L 16 10 L 16 18 L 26 18 C 28 18 29 20 29 22 L 29 32 C 29 34 27 36 25 36 L 0 36 Z"
              fill="url(#shaftGrad)"
              stroke="url(#goldTrimGrad)"
              strokeWidth="1.4"
              className="filter drop-shadow-[0_0_10px_rgba(56,189,248,0.4)]"
            />
            {/* Inner Sacred Matrix Teeth Cutouts */}
            <rect x="6" y="5" width="4" height="4" rx="1" fill="#030712" />
            <rect x="6" y="24" width="4" height="6" rx="1" fill="#030712" />
            <circle cx="19" cy="27" r="2.2" fill="#fde047" />
          </g>

          {/* 🗝️ 5. Terminal Base Crest Finial */}
          <g transform="translate(150, 268)">
            <ellipse
              cx="0"
              cy="0"
              rx="12"
              ry="7"
              fill="url(#goldTrimGrad)"
              stroke="#ffffff"
              strokeWidth="1"
            />
            <circle cx="0" cy="0" r="3" fill="#10b981" />
            {/* Bottom Starlight Needle */}
            <path d="M 0 7 L 3 16 L 0 20 L -3 16 Z" fill="url(#shaftGrad)" />
            <circle cx="0" cy="20" r="1.8" fill="#fde047" className="filter drop-shadow-[0_0_6px_#fde047]" />
          </g>
        </svg>
      </motion.div>

      {/* 🏷️ Typography & Brand Identity: LucKey */}
      <div className="relative z-10 flex flex-col items-center text-center mt-3 px-6">
        {/* Glowing LucKey Title */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative flex items-center justify-center"
        >
          <h1 className="font-display font-black text-3xl sm:text-4xl tracking-[0.26em] uppercase drop-shadow-[0_0_25px_rgba(251,191,36,0.35)]">
            <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-400 bg-clip-text text-transparent">
              Luc
            </span>
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
              Key
            </span>
          </h1>
        </motion.div>

        {/* Primary Message Indicator */}
        <motion.p
          animate={{ opacity: [0.65, 1, 0.65] }}
          transition={{ duration: 2.4, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
          className="text-xs sm:text-sm font-semibold tracking-wider text-emerald-100 font-sans mt-2.5 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]"
        >
          {message}
        </motion.p>

        {/* Subtitle / Universe Tagline */}
        {subMessage && (
          <p className="text-[10px] tracking-[0.24em] text-cyan-300/60 font-mono mt-1 uppercase">
            {subMessage}
          </p>
        )}

        {/* 🌈 Animated Cosmic Shimmer Progress Gauge */}
        <div className="w-48 sm:w-56 h-[3px] bg-white/10 rounded-full mt-5 overflow-hidden relative backdrop-blur-sm border border-white/5">
          <motion.div
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 1.9,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'easeInOut',
            }}
            className="w-full h-full rounded-full bg-gradient-to-r from-amber-400 via-emerald-400 via-cyan-400 to-purple-500 shadow-[0_0_12px_rgba(52,211,153,0.7)]"
          />
        </div>
      </div>
    </div>
  );
}

export default LucKeyCosmicLoader;
