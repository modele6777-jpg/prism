import React from "react";
import { motion } from "motion/react";
import { isIPhoneXSClass } from "@/lib/perfMode";

interface LucyAuraLoaderProps {
  message?: string;
  subMessage?: string;
  fullScreen?: boolean;
  compact?: boolean;
}

/**
 * 🍀 LucyAuraLoader
 * Dedicated four-leaf clover (네잎클로버) loading screen for Lucy Chat (루시 AI 챗 & 교감)
 * Features glowing emerald & golden aura, four organic heart-shaped clover leaves,
 * luminous golden dewdrops, rotating celestial luck orbits, and ambient fortune sparkles.
 */
export function LucyAuraLoader({
  message = "루시와 행운의 깊은 교감 조율 중...",
  subMessage = "FOUR-LEAF CLOVER · FORTUNE & INTUITION",
  fullScreen = false,
  compact = false,
}: LucyAuraLoaderProps) {
  const isXS = isIPhoneXSClass();
  const emblemSize = compact ? 120 : 180;

  const sparklesList = isXS
    ? [
        { top: "25%", left: "26%", delay: 0 },
        { top: "75%", left: "72%", delay: 1.1 },
      ]
    : [
        { top: "22%", left: "28%", delay: 0 },
        { top: "68%", left: "22%", delay: 0.9 },
        { top: "30%", left: "74%", delay: 0.4 },
        { top: "76%", left: "68%", delay: 1.3 },
        { top: "16%", left: "52%", delay: 0.7 },
      ];

  // Ambient floating micro-clovers
  const floatingClovers = isXS
    ? [
        { top: "35%", left: "18%", delay: 0.2, scale: 0.8 },
        { top: "62%", left: "80%", delay: 1.4, scale: 0.9 },
      ]
    : [
        { top: "28%", left: "16%", delay: 0.2, scale: 0.85 },
        { top: "65%", left: "18%", delay: 1.0, scale: 0.75 },
        { top: "34%", left: "82%", delay: 0.6, scale: 0.9 },
        { top: "72%", left: "78%", delay: 1.6, scale: 0.8 },
      ];

  return (
    <div
      className={`flex flex-col items-center justify-center select-none text-slate-100 overflow-hidden ${
        fullScreen
          ? "fixed inset-0 z-[9999] bg-[#070d0a] min-h-[100dvh] w-screen px-4"
          : "relative py-12 px-4 w-full"
      }`}
    >
      {/* 🌿 Luminous Forest Emerald & Golden Halo Background */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] sm:w-[500px] sm:h-[500px] rounded-full bg-gradient-to-tr from-emerald-600/20 via-teal-500/15 to-amber-400/15 pointer-events-none ${
          isXS ? "blur-xl opacity-30" : "blur-3xl animate-pulse"
        }`}
      />

      {/* Floating Gentle Sparkles */}
      <div className="absolute inset-0 pointer-events-none opacity-50 overflow-hidden">
        {sparklesList.map((sparkle, i) => (
          <motion.div
            key={`sparkle-${i}`}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [0.7, 1.4, 0.7],
              y: [-6, 6, -6],
            }}
            transition={{
              duration: 2.4 + i * 0.35,
              repeat: Number.POSITIVE_INFINITY,
              delay: sparkle.delay,
              ease: "easeInOut",
            }}
            className="absolute w-1.5 h-1.5 bg-emerald-200 rounded-full shadow-[0_0_12px_#34d399]"
            style={{ top: sparkle.top, left: sparkle.left }}
          />
        ))}

        {/* Ambient floating lucky mini-clovers */}
        {floatingClovers.map((clover, i) => (
          <motion.div
            key={`clover-${i}`}
            animate={{
              opacity: [0.15, 0.55, 0.15],
              y: [-12, 12, -12],
              rotate: [0, 15, -15, 0],
            }}
            transition={{
              duration: 4 + i * 0.5,
              repeat: Number.POSITIVE_INFINITY,
              delay: clover.delay,
              ease: "easeInOut",
            }}
            className="absolute text-sm text-emerald-300/60 pointer-events-none select-none drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]"
            style={{ top: clover.top, left: clover.left, transform: `scale(${clover.scale})` }}
          >
            🍀
          </motion.div>
        ))}
      </div>

      {/* 🍀 Central Sacred Four-Leaf Clover Emblem */}
      <div className="relative flex items-center justify-center">
        <svg
          viewBox="0 0 280 280"
          style={{ width: emblemSize * 1.5, height: emblemSize * 1.5 }}
          className={`overflow-visible ${isXS ? "" : "filter drop-shadow-[0_0_35px_rgba(16,185,129,0.35)]"}`}
        >
          <defs>
            {/* Emerald Leaf Deep Gradient */}
            <radialGradient id="lucy_clover_leaf_grad" cx="45%" cy="40%" r="65%">
              <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.98" />
              <stop offset="28%" stopColor="#34d399" stopOpacity="0.95" />
              <stop offset="60%" stopColor="#10b981" stopOpacity="0.92" />
              <stop offset="85%" stopColor="#047857" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#064e3b" stopOpacity="1" />
            </radialGradient>

            {/* Golden Edge Leaf Highlight Gradient */}
            <linearGradient id="lucy_clover_edge_gold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
              <stop offset="45%" stopColor="#6ee7b7" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.4" />
            </linearGradient>

            {/* Radiant Clover Center Dewdrop Core */}
            <radialGradient id="lucy_clover_dew_core" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="35%" stopColor="#fef08a" stopOpacity="0.95" />
              <stop offset="70%" stopColor="#34d399" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#065f46" stopOpacity="0" />
            </radialGradient>

            {/* Orbit Ring 1 (Emerald to Gold) */}
            <linearGradient id="lucy_clover_ring_1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#fef08a" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.25" />
            </linearGradient>

            {/* Orbit Ring 2 (Mint to Teal) */}
            <linearGradient id="lucy_clover_ring_2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#67e8f9" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#fef08a" stopOpacity="0.2" />
            </linearGradient>

            {/* Stem Gradient */}
            <linearGradient id="lucy_clover_stem" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#047857" />
              <stop offset="60%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#064e3b" />
            </linearGradient>
          </defs>

          {/* 🌟 Radiant Forest Spring Ripple 1 */}
          <motion.circle
            cx="140"
            cy="140"
            r="82"
            fill="none"
            stroke="rgba(52, 211, 153, 0.28)"
            strokeWidth="1.2"
            animate={{
              r: [74, 102, 74],
              opacity: [0.1, 0.45, 0.1],
            }}
            transition={{
              duration: 3,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />

          {/* 🌟 Radiant Forest Spring Ripple 2 */}
          <motion.circle
            cx="140"
            cy="140"
            r="108"
            fill="none"
            stroke="rgba(254, 240, 138, 0.2)"
            strokeWidth="1"
            strokeDasharray="4 6"
            animate={{
              r: [98, 126, 98],
              opacity: [0.08, 0.35, 0.08],
            }}
            transition={{
              duration: 3.6,
              repeat: Number.POSITIVE_INFINITY,
              delay: 0.5,
              ease: "easeInOut",
            }}
          />

          {/* Rotating Celestial Orbit Ring 1 (Emerald/Gold, Clockwise) */}
          <g transform="translate(140, 140)">
            <motion.g
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            >
              <ellipse
                cx="0"
                cy="0"
                rx="115"
                ry="44"
                fill="none"
                stroke="url(#lucy_clover_ring_1)"
                strokeWidth="1.6"
                strokeDasharray="6 3 10 3"
                transform="rotate(-20)"
                className="opacity-80 filter drop-shadow-[0_0_8px_#34d399]"
              />
              {/* Luminous Golden Dew Node */}
              <circle cx="96" cy="-22" r="3.5" fill="#fef08a" className="shadow-[0_0_10px_#fff]" />
              <circle cx="-96" cy="22" r="2.5" fill="#6ee7b7" />
            </motion.g>
          </g>

          {/* Rotating Celestial Orbit Ring 2 (Mint/Teal, Counter-Clockwise) */}
          <g transform="translate(140, 140)">
            <motion.g
              animate={{ rotate: -360 }}
              transition={{ duration: 11, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            >
              <ellipse
                cx="0"
                cy="0"
                rx="122"
                ry="38"
                fill="none"
                stroke="url(#lucy_clover_ring_2)"
                strokeWidth="1.2"
                strokeDasharray="4 5"
                transform="rotate(28)"
                className="opacity-75 filter drop-shadow-[0_0_8px_#10b981]"
              />
              <circle cx="-102" cy="-18" r="3" fill="#a7f3d0" />
            </motion.g>
          </g>

          {/* Glowing Backplate Aura */}
          <circle
            cx="140"
            cy="140"
            r="65"
            fill="url(#lucy_clover_dew_core)"
            className="filter blur-[12px] opacity-60 mix-blend-screen"
          />

          {/* 🍀 THE FOUR-LEAF CLOVER BODY */}
          <g transform="translate(140, 140)">
            {/* Graceful Curved Stem */}
            <motion.path
              d="M 0 4 C -6 28 -16 58 -8 86 C -4 98 6 106 14 110"
              fill="none"
              stroke="url(#lucy_clover_stem)"
              strokeWidth="3.6"
              strokeLinecap="round"
              animate={{
                d: [
                  "M 0 4 C -6 28 -16 58 -8 86 C -4 98 6 106 14 110",
                  "M 0 4 C -4 28 -12 58 -5 86 C -1 98 9 106 16 110",
                  "M 0 4 C -6 28 -16 58 -8 86 C -4 98 6 106 14 110",
                ],
              }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
              className="filter drop-shadow-[0_0_6px_rgba(5,150,105,0.6)]"
            />

            {/* Whole Clover Bloom Breathing Motion */}
            <motion.g
              animate={{
                scale: [0.95, 1.05, 0.95],
                rotate: [0, 2.5, 0, -2.5, 0],
              }}
              transition={{
                duration: 3.2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
              className="filter drop-shadow-[0_0_18px_rgba(16,185,129,0.7)]"
            >
              {/* Four Heart-Shaped Clover Leaves arranged at 0°, 90°, 180°, 270° */}
              {[0, 90, 180, 270].map((angle, idx) => (
                <g key={`petal-${angle}`} transform={`rotate(${angle})`}>
                  {/* Outer Leaf Glow & Body */}
                  <path
                    d="M 0 0 C -16 -18 -34 -32 -34 -52 C -34 -72 -12 -84 0 -64 C 12 -84 34 -72 34 -52 C 34 -32 16 -18 0 0 Z"
                    fill="url(#lucy_clover_leaf_grad)"
                    stroke="url(#lucy_clover_edge_gold)"
                    strokeWidth="1.4"
                    className="filter drop-shadow-[0_2px_8px_rgba(4,120,87,0.5)]"
                  />

                  {/* Inner Leaf Highlights & Depth Layer */}
                  <path
                    d="M 0 -2 C -11 -16 -24 -28 -24 -44 C -24 -60 -8 -68 0 -52 C 8 -68 24 -60 24 -44 C 24 -28 11 -16 0 -2 Z"
                    fill="rgba(255, 255, 255, 0.08)"
                    stroke="rgba(167, 243, 208, 0.4)"
                    strokeWidth="0.8"
                  />

                  {/* Central Leaf Main Vein */}
                  <path
                    d="M 0 -4 Q 0 -32 0 -58"
                    fill="none"
                    stroke="#a7f3d0"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    className="opacity-75"
                  />

                  {/* Leaf Branch Veins */}
                  <path
                    d="M 0 -26 Q -8 -33 -16 -39"
                    fill="none"
                    stroke="#a7f3d0"
                    strokeWidth="0.8"
                    strokeLinecap="round"
                    className="opacity-55"
                  />
                  <path
                    d="M 0 -26 Q 8 -33 16 -39"
                    fill="none"
                    stroke="#a7f3d0"
                    strokeWidth="0.8"
                    strokeLinecap="round"
                    className="opacity-55"
                  />
                  <path
                    d="M 0 -38 Q -7 -44 -12 -49"
                    fill="none"
                    stroke="#a7f3d0"
                    strokeWidth="0.8"
                    strokeLinecap="round"
                    className="opacity-45"
                  />
                  <path
                    d="M 0 -38 Q 7 -44 12 -49"
                    fill="none"
                    stroke="#a7f3d0"
                    strokeWidth="0.8"
                    strokeLinecap="round"
                    className="opacity-45"
                  />
                </g>
              ))}

              {/* Luminous Central Dewdrop Core */}
              <motion.circle
                cx="0"
                cy="0"
                r="13"
                fill="url(#lucy_clover_dew_core)"
                animate={{
                  scale: [0.85, 1.25, 0.85],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
                className="filter drop-shadow-[0_0_12px_#34d399]"
              />

              {/* Four-Pointed Golden Twinkle Star Flare */}
              <motion.path
                d="M 0 -16 Q 2 -2 16 0 Q 2 2 0 16 Q -2 2 -16 0 Q -2 -2 0 -16 Z"
                fill="#ffffff"
                animate={{
                  rotate: [0, 90, 180, 270, 360],
                  scale: [0.8, 1.2, 0.8],
                  opacity: [0.75, 1, 0.75],
                }}
                transition={{
                  duration: 4,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }}
                className="filter drop-shadow-[0_0_8px_#fef08a]"
              />

              {/* Tiny Center Pearl */}
              <circle cx="0" cy="0" r="3.5" fill="#ffffff" />
            </motion.g>
          </g>
        </svg>
      </div>

      {/* 🍀 Lucy Typography & Lucky Clover Branding */}
      <div className="relative mt-5 sm:mt-6 text-center z-10 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-2xl sm:text-3xl font-black tracking-[0.38em] uppercase font-sans bg-gradient-to-r from-emerald-200 via-teal-200 via-amber-200 to-emerald-300 bg-clip-text text-transparent drop-shadow-[0_0_18px_rgba(52,211,153,0.45)] flex items-center gap-2 justify-center"
        >
          <span>LUCY</span>
          <span className="text-xl sm:text-2xl not-italic">🍀</span>
        </motion.div>

        {/* Dynamic Status Message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.95 }}
          transition={{ delay: 0.15 }}
          className="mt-2 text-xs sm:text-sm font-medium text-emerald-100/90 tracking-wider flex items-center gap-1.5"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
          {message}
        </motion.p>

        {/* Subtitle / Persona Mode */}
        {subMessage && (
          <p className="mt-1 text-[10px] font-mono tracking-[0.22em] text-emerald-300/70 uppercase">
            {subMessage}
          </p>
        )}

        {/* Emerald & Golden Clover Loading Bar */}
        <div className="mt-5 w-44 sm:w-56 h-[3px] rounded-full bg-emerald-950/60 overflow-hidden relative border border-emerald-500/20 shadow-[0_0_10px_rgba(5,150,105,0.2)]">
          <motion.div
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              duration: 1.6,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            className="w-1/2 h-full bg-gradient-to-r from-transparent via-emerald-400 via-teal-300 via-amber-300 to-transparent shadow-[0_0_10px_#34d399]"
          />
        </div>
      </div>
    </div>
  );
}
export default LucyAuraLoader;
