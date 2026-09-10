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
 * ✨ LucyAuraLoader
 * Dedicated loading screen for Lucy (루시 / AI 페르소나 챗 & 지혜의 교감)
 * Features warm golden-amber and rose-pink consciousness aura,
 * central 8-pointed luminous Stella, counter-rotating intuition rings,
 * and brainwave synaptic pulse waves.
 */
export function LucyAuraLoader({
  message = "루시와 깊은 교감 조율 중...",
  subMessage = "CONSCIOUSNESS SYNERGY & INTUITION",
  fullScreen = false,
  compact = false,
}: LucyAuraLoaderProps) {
  const isXS = isIPhoneXSClass();
  const emblemSize = compact ? 120 : 180;

  const sparklesList = isXS
    ? [
        { top: "28%", left: "28%", delay: 0 },
        { top: "76%", left: "70%", delay: 1.1 },
      ]
    : [
        { top: "28%", left: "28%", delay: 0 },
        { top: "68%", left: "24%", delay: 0.9 },
        { top: "32%", left: "72%", delay: 0.4 },
        { top: "76%", left: "70%", delay: 1.3 },
        { top: "18%", left: "54%", delay: 0.7 },
      ];

  return (
    <div
      className={`flex flex-col items-center justify-center select-none text-slate-100 overflow-hidden ${
        fullScreen
          ? "fixed inset-0 z-[9999] bg-[#0c0c12] min-h-[100dvh] w-screen px-4"
          : "relative py-12 px-4 w-full"
      }`}
    >
      {/* Warm Golden & Rose Consciousness Halo Background */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] sm:w-[480px] sm:h-[480px] rounded-full bg-gradient-to-tr from-amber-500/15 via-rose-500/15 to-purple-600/15 pointer-events-none ${
          isXS ? "blur-xl opacity-25" : "blur-3xl animate-pulse"
        }`}
      />

      {/* Floating Gentle Sparkles */}
      <div className="absolute inset-0 pointer-events-none opacity-40 overflow-hidden">
        {sparklesList.map((sparkle, i) => (
          <motion.div
            key={i}
            animate={{
              opacity: [0.15, 0.9, 0.15],
              scale: [0.7, 1.35, 0.7],
            }}
            transition={{
              duration: 2.2 + i * 0.35,
              repeat: Number.POSITIVE_INFINITY,
              delay: sparkle.delay,
              ease: "easeInOut",
            }}
            className="absolute w-1.5 h-1.5 bg-amber-200 rounded-full shadow-[0_0_10px_#f59e0b]"
            style={{ top: sparkle.top, left: sparkle.left }}
          />
        ))}
      </div>

      {/* Central Lucy Sacred Consciousness Emblem */}
      <div className="relative flex items-center justify-center">
        <svg
          viewBox="0 0 280 280"
          style={{ width: emblemSize * 1.5, height: emblemSize * 1.5 }}
          className={`overflow-visible ${isXS ? "" : "filter drop-shadow-[0_0_35px_rgba(245,158,11,0.3)]"}`}
        >

          <defs>
            {/* Core Stella Golden Star Gradient */}
            <radialGradient id="lucy_stella_grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="25%" stopColor="#fef08a" stopOpacity="0.95" />
              <stop offset="55%" stopColor="#fbbf24" stopOpacity="0.85" />
              <stop offset="82%" stopColor="#f43f5e" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#9333ea" stopOpacity="0" />
            </radialGradient>

            {/* Inner Core Heart Glow */}
            <radialGradient id="lucy_heart_core" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="45%" stopColor="#fef08a" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#f472b6" stopOpacity="0" />
            </radialGradient>

            {/* Intuition Ring 1 Gradient (Amber to Rose) */}
            <linearGradient id="lucy_ring_1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#f472b6" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#e879f9" stopOpacity="0.2" />
            </linearGradient>

            {/* Wisdom Ring 2 Gradient (Rose to Violet) */}
            <linearGradient id="lucy_ring_2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#c084fc" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.25" />
            </linearGradient>
          </defs>

          {/* 🌟 Synaptic Brainwave Ripple 1 */}
          <motion.circle
            cx="140"
            cy="140"
            r="82"
            fill="none"
            stroke="rgba(251, 191, 36, 0.25)"
            strokeWidth="1.2"
            animate={{
              r: [74, 98, 74],
              opacity: [0.1, 0.45, 0.1],
            }}
            transition={{
              duration: 3,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />

          {/* 🌟 Synaptic Brainwave Ripple 2 */}
          <motion.circle
            cx="140"
            cy="140"
            r="104"
            fill="none"
            stroke="rgba(244, 114, 182, 0.2)"
            strokeWidth="1"
            strokeDasharray="4 6"
            animate={{
              r: [96, 120, 96],
              opacity: [0.08, 0.35, 0.08],
            }}
            transition={{
              duration: 3.5,
              repeat: Number.POSITIVE_INFINITY,
              delay: 0.5,
              ease: "easeInOut",
            }}
          />

          {/* Rotating Intuition Orbit Ring 1 (Amber, Clockwise) */}
          <g transform="translate(140, 140)">
            <motion.g
              animate={{ rotate: 360 }}
              transition={{ duration: 7, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            >
              <ellipse
                cx="0"
                cy="0"
                rx="110"
                ry="42"
                fill="none"
                stroke="url(#lucy_ring_1)"
                strokeWidth="1.6"
                strokeDasharray="6 3 10 3"
                transform="rotate(-22)"
                className="opacity-80 filter drop-shadow-[0_0_8px_#fbbf24]"
              />
              {/* Consciousness Orb Node */}
              <circle cx="92" cy="-20" r="3.5" fill="#fef08a" className="shadow-[0_0_10px_#fff]" />
              <circle cx="-92" cy="20" r="2.5" fill="#f472b6" />
            </motion.g>
          </g>

          {/* Rotating Wisdom Orbit Ring 2 (Rose/Violet, Counter-Clockwise) */}
          <g transform="translate(140, 140)">
            <motion.g
              animate={{ rotate: -360 }}
              transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            >
              <ellipse
                cx="0"
                cy="0"
                rx="118"
                ry="38"
                fill="none"
                stroke="url(#lucy_ring_2)"
                strokeWidth="1.2"
                strokeDasharray="4 5"
                transform="rotate(28)"
                className="opacity-75 filter drop-shadow-[0_0_8px_#c084fc]"
              />
              <circle cx="-98" cy="-18" r="3" fill="#fbcfe8" />
            </motion.g>
          </g>

          {/* Glowing Aura Halo Backplate */}
          <circle
            cx="140"
            cy="140"
            r="60"
            fill="url(#lucy_stella_grad)"
            className="filter blur-[10px] opacity-60 mix-blend-screen"
          />

          {/* ✨ 8-Pointed Consciousness Stella (루시의 영혼 별) */}
          <g transform="translate(140, 140)">
            {/* Pulsing Core Star */}
            <motion.path
              d="M 0 -58 Q 6 -12 58 0 Q 6 12 0 58 Q -6 12 -58 0 Q -6 -12 0 -58 Z"
              fill="url(#lucy_stella_grad)"
              stroke="rgba(255, 255, 255, 0.85)"
              strokeWidth="1.2"
              animate={{
                scale: [0.92, 1.08, 0.92],
                rotate: [0, 4, 0, -4, 0],
              }}
              transition={{
                duration: 2.8,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
              className="filter drop-shadow-[0_0_16px_rgba(251,191,36,0.7)]"
            />

            {/* Diagonal Secondary 4-Point Star */}
            <motion.path
              d="M 0 -38 Q 4 -8 38 0 Q 4 8 0 38 Q -4 8 -38 0 Q -4 -8 0 -38 Z"
              fill="rgba(255, 255, 255, 0.45)"
              stroke="rgba(254, 240, 138, 0.8)"
              strokeWidth="1"
              transform="rotate(45)"
              animate={{
                scale: [1.05, 0.88, 1.05],
                opacity: [0.5, 0.9, 0.5],
              }}
              transition={{
                duration: 2.8,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />

            {/* Central Heart Singularity Core */}
            <motion.circle
              cx="0"
              cy="0"
              r="14"
              fill="url(#lucy_heart_core)"
              animate={{
                scale: [0.85, 1.25, 0.85],
              }}
              transition={{
                duration: 1.8,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
              className="filter drop-shadow-[0_0_12px_#ffffff]"
            />
            <circle cx="0" cy="0" r="4.5" fill="#ffffff" />
          </g>
        </svg>
      </div>

      {/* Lucy Typography & Branding */}
      <div className="relative mt-5 sm:mt-6 text-center z-10 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-2xl sm:text-3xl font-black tracking-[0.38em] uppercase font-sans bg-gradient-to-r from-amber-200 via-rose-300 via-pink-300 to-purple-300 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(251,191,36,0.45)]"
        >
          LUCY
        </motion.div>

        {/* Dynamic Status Message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.9 }}
          transition={{ delay: 0.15 }}
          className="mt-2 text-xs sm:text-sm font-medium text-amber-100/85 tracking-wider flex items-center gap-1.5"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping inline-block" />
          {message}
        </motion.p>

        {/* Subtitle / Persona Mode */}
        {subMessage && (
          <p className="mt-1 text-[10px] font-mono tracking-[0.22em] text-rose-300/70 uppercase">
            {subMessage}
          </p>
        )}

        {/* Warm Golden-Rose Loading Bar */}
        <div className="mt-5 w-44 sm:w-56 h-[3px] rounded-full bg-white/10 overflow-hidden relative border border-white/5">
          <motion.div
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              duration: 1.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            className="w-1/2 h-full bg-gradient-to-r from-transparent via-amber-400 via-rose-400 to-transparent shadow-[0_0_10px_#fbbf24]"
          />
        </div>
      </div>
    </div>
  );
}
export default LucyAuraLoader;
