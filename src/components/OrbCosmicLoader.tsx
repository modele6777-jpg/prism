import React from "react";
import { motion } from "motion/react";
import { isIPhoneXSClass } from "@/lib/perfMode";

interface OrbCosmicLoaderProps {
  message?: string;
  subMessage?: string;
  fullScreen?: boolean;
  compact?: boolean;
}

/**
 * 🔑 OrbCosmicLoader
 * Dedicated loading screen for Key (독립 Key 사이트 및 게이트웨이)
 * Features a majestic 3D crystal key with rotating celestial astral orbit rings,
 * 4-leaf clover crystal head, starlight singularity core, and prismatic shaft.
 */
export function OrbCosmicLoader({
  message = "Key 차원 궤도 동기화 중...",
  subMessage = "ASTRAL CRYSTAL KEY & CONSCIOUSNESS",
  fullScreen = false,
  compact = false,
}: OrbCosmicLoaderProps) {
  const isXS = isIPhoneXSClass();
  const keyScale = compact ? 0.75 : 1.0;

  const stardustStars = isXS
    ? [
        { top: "25%", left: "30%", delay: 0 },
        { top: "70%", left: "65%", delay: 1.2 },
      ]
    : [
        { top: "25%", left: "30%", delay: 0 },
        { top: "70%", left: "20%", delay: 1 },
        { top: "35%", left: "75%", delay: 0.5 },
        { top: "80%", left: "65%", delay: 1.5 },
        { top: "20%", left: "60%", delay: 0.8 },
      ];

  return (
    <div
      className={`flex flex-col items-center justify-center select-none text-white overflow-hidden ${
        fullScreen
          ? "fixed inset-0 z-[9999] bg-[#020308] min-h-[100dvh] w-screen px-4"
          : "relative py-12 px-4 w-full"
      }`}
    >
      {/* Cosmic Nebula Glow Behind */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] sm:w-[480px] sm:h-[480px] rounded-full bg-gradient-to-tr from-cyan-500/15 via-purple-600/20 to-emerald-500/10 pointer-events-none ${
          isXS ? "blur-xl opacity-25" : "blur-3xl animate-pulse"
        }`}
      />

      {/* Floating Stardust Points */}
      <div className="absolute inset-0 pointer-events-none opacity-40 overflow-hidden">
        {stardustStars.map((star, i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.2, 0.9, 0.2], scale: [0.8, 1.3, 0.8] }}
            transition={{ duration: 2.5 + i * 0.4, repeat: Number.POSITIVE_INFINITY, delay: star.delay, ease: "easeInOut" }}
            className="absolute w-1 h-1 bg-cyan-200 rounded-full shadow-[0_0_8px_#38bdf8]"
            style={{ top: star.top, left: star.left }}
          />
        ))}
      </div>

      {/* Central 3D Crystal Key & Astral Orbit Rings Stage */}
      <motion.div
        animate={{ y: [-4, 4, -4] }}
        transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        className="relative flex items-center justify-center"
        style={{ transform: `scale(${keyScale})` }}
      >
        <svg
          viewBox="0 0 280 320"
          style={{ width: 240, height: 274 }}
          className={`overflow-visible ${isXS ? "" : "filter drop-shadow-[0_0_35px_rgba(56,189,248,0.35)]"}`}
        >
          <defs>
            {/* Crystal Gradient: Cyan -> Emerald -> Violet */}
            <linearGradient id="loaderKeyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
              <stop offset="25%" stopColor="#67e8f9" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#34d399" stopOpacity="0.9" />
              <stop offset="78%" stopColor="#38bdf8" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.9" />
            </linearGradient>

            {/* Core Singularity Radial Gradient */}
            <radialGradient id="loaderCoreSingularity" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="35%" stopColor="#67e8f9" stopOpacity="0.95" />
              <stop offset="70%" stopColor="#c084fc" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </radialGradient>

            {/* Astral Orbit Ring 1 Gradient */}
            <linearGradient id="loaderOrbitRing1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#c084fc" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.2" />
            </linearGradient>

            {/* Astral Orbit Ring 2 Gradient */}
            <linearGradient id="loaderOrbitRing2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#818cf8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.2" />
            </linearGradient>

            {/* Shaft Gradient */}
            <linearGradient id="loaderShaftGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="35%" stopColor="#67e8f9" stopOpacity="0.92" />
              <stop offset="70%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.85" />
            </linearGradient>
          </defs>

          {/* 🌟 1. Outer Astral Orbit Rings around the Key Head (Center: 140, 85) */}
          <g transform="translate(140, 85)">
            <motion.g
              animate={{ rotate: 360 }}
              transition={{ duration: 9, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            >
              <ellipse
                cx="0"
                cy="0"
                rx="85"
                ry="34"
                fill="none"
                stroke="url(#loaderOrbitRing1)"
                strokeWidth="1.6"
                strokeDasharray="5 3 10 3"
                transform="rotate(-22)"
                className="opacity-75 filter drop-shadow-[0_0_8px_#38bdf8]"
              />
              <circle cx="72" cy="-16" r="3" fill="#a5f3fc" className="shadow-[0_0_8px_#fff]" />
              <circle cx="-72" cy="16" r="2.2" fill="#e879f9" />
            </motion.g>

            <motion.g
              animate={{ rotate: -360 }}
              transition={{ duration: 13, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            >
              <ellipse
                cx="0"
                cy="0"
                rx="92"
                ry="32"
                fill="none"
                stroke="url(#loaderOrbitRing2)"
                strokeWidth="1.2"
                strokeDasharray="4 5"
                transform="rotate(28)"
                className="opacity-65 filter drop-shadow-[0_0_8px_#34d399]"
              />
              <circle cx="-76" cy="-14" r="2.5" fill="#67e8f9" />
            </motion.g>
          </g>

          {/* 🔑 2. The 3D Crystal Key Body */}
          {/* Key Head Glow Aura */}
          <circle cx="140" cy="85" r="44" fill="#38bdf8" fillOpacity="0.16" className="blur-[8px]" />

          {/* Key Head: Outer Crystal Ring (Bow) */}
          <circle
            cx="140"
            cy="85"
            r="38"
            fill="url(#loaderCoreSingularity)"
            stroke="url(#loaderKeyGrad)"
            strokeWidth="3.5"
            className="filter drop-shadow-[0_0_18px_rgba(56,189,248,0.5)]"
          />

          {/* Inner Scrying Dark Cavity */}
          <circle cx="140" cy="85" r="28" fill="#030514" />
          <motion.circle
            cx="140"
            cy="85"
            r="24"
            fill="url(#loaderCoreSingularity)"
            animate={{ scale: [0.85, 1.15, 0.85], opacity: [0.75, 1, 0.75] }}
            transition={{ duration: 2.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            className="mix-blend-screen"
          />

          {/* 🍀 4-Leaf Clover Crystal Petals */}
          <g opacity="0.85">
            {/* Top Petal */}
            <path d="M 140 85 C 132 72 132 58 140 56 C 148 58 148 72 140 85 Z" fill="#34d399" />
            {/* Bottom Petal */}
            <path d="M 140 85 C 132 98 132 112 140 114 C 148 112 148 98 140 85 Z" fill="#c084fc" />
            {/* Left Petal */}
            <path d="M 140 85 C 127 77 113 77 111 85 C 113 93 127 93 140 85 Z" fill="#67e8f9" />
            {/* Right Petal */}
            <path d="M 140 85 C 153 77 167 77 169 85 C 167 93 153 93 140 85 Z" fill="#34d399" />
          </g>

          {/* Center 4-Point Starlight Singularity */}
          <path
            d="M 140 68 Q 140 85 157 85 Q 140 85 140 102 Q 140 85 123 85 Q 140 85 140 68 Z"
            fill="#ffffff"
            opacity="0.95"
            className="filter drop-shadow-[0_0_8px_#ffffff]"
          />
          <circle cx="140" cy="85" r="3.2" fill="#ffffff" />

          {/* Top Crown Spire Gem */}
          <path d="M 140 40 L 146 50 L 140 55 L 134 50 Z" fill="#ffffff" opacity="0.9" />
          <circle cx="140" cy="40" r="2.2" fill="#67e8f9" className="shadow-[0_0_6px_#67e8f9]" />

          {/* 3. Crossguard / Wing Collar (Connecting Head and Stem) */}
          <path
            d="M 112 126 C 124 122 133 120 140 120 C 147 120 156 122 168 126 C 156 131 147 133 140 133 C 133 133 124 131 112 126 Z"
            fill="url(#loaderKeyGrad)"
            stroke="#ffffff"
            strokeWidth="0.8"
          />
          <circle cx="140" cy="126" r="3.5" fill="#ffffff" />

          {/* 4. Crystal Shaft (Vertical Column) */}
          <rect
            x="132"
            y="130"
            width="16"
            height="105"
            rx="8"
            fill="url(#loaderShaftGrad)"
            stroke="#ffffff"
            strokeWidth="1.4"
            strokeOpacity="0.85"
            className="filter drop-shadow-[0_0_12px_rgba(56,189,248,0.4)]"
          />
          {/* Central Conduit Light Ray */}
          <line x1="140" y1="134" x2="140" y2="230" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.9" />

          {/* 5. Middle Shaft Runic Bead Node */}
          <ellipse cx="140" cy="172" rx="12" ry="5.5" fill="#ffffff" opacity="0.9" />
          <circle cx="140" cy="172" r="2.5" fill="#67e8f9" />

          {/* 6. Key Bit (Faceted Arcane Teeth on Right Side) */}
          <path
            d="M 148 185 L 168 185 L 174 191 L 174 199 L 166 203 L 148 203 Z"
            fill="url(#loaderKeyGrad)"
            stroke="#ffffff"
            strokeWidth="1.2"
          />
          <path
            d="M 148 208 L 178 208 L 185 215 L 185 224 L 176 230 L 162 230 L 157 224 L 148 224 Z"
            fill="url(#loaderKeyGrad)"
            stroke="#ffffff"
            strokeWidth="1.2"
          />

          {/* 7. Bottom Spire Tip */}
          <path d="M 132 233 L 140 252 L 148 233 Z" fill="url(#loaderShaftGrad)" stroke="#ffffff" strokeWidth="1" />
          <circle cx="140" cy="252" r="2.8" fill="#ffffff" className="shadow-[0_0_8px_#fff]" />

          {/* Curved Specular Glint on Top-Left Head */}
          <ellipse
            cx="126"
            cy="72"
            rx="14"
            ry="7"
            fill="rgba(255, 255, 255, 0.85)"
            transform="rotate(-26 126 72)"
            className="filter blur-[1px]"
          />
          <circle cx="120" cy="67" r="2" fill="#ffffff" />
        </svg>
      </motion.div>

      {/* Key Branding Title & Typography */}
      <div className="relative mt-5 sm:mt-6 text-center z-10 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xl sm:text-2xl font-black tracking-[0.36em] uppercase font-sans bg-gradient-to-r from-cyan-200 via-emerald-300 via-sky-300 to-purple-300 bg-clip-text text-transparent drop-shadow-[0_0_16px_rgba(56,189,248,0.55)]"
        >
          KEY
        </motion.div>

        {/* Dynamic Status Message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.95 }}
          transition={{ delay: 0.15 }}
          className="mt-2 text-xs sm:text-sm font-medium text-cyan-100/90 tracking-wider flex items-center gap-1.5"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping inline-block" />
          {message}
        </motion.p>

        {/* Subtitle / Dimension Label */}
        {subMessage && (
          <p className="mt-1 text-[10px] font-mono tracking-[0.24em] text-cyan-300/60 uppercase">
            {subMessage}
          </p>
        )}

        {/* Progress Glow Line */}
        <div className="w-40 sm:w-48 h-0.5 bg-white/10 rounded-full mt-4 overflow-hidden relative">
          <motion.div
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            className="w-full h-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
          />
        </div>
      </div>
    </div>
  );
}
