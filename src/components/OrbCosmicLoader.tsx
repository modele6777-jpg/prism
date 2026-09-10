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
 * 🔮 OrbCosmicLoader
 * Dedicated loading screen for Crystal Orb (오브 사이트)
 * Features a hyper-realistic 3D crystal scrying orb with rotating astral orbit rings,
 * pulsing singularity core, and celestial starlight nebulae.
 */
export function OrbCosmicLoader({
  message = "크리스탈 오브 차원 궤도 동기화 중...",
  subMessage = "ASTRAL SCRYING SPHERE & CONSCIOUSNESS",
  fullScreen = false,
  compact = false,
}: OrbCosmicLoaderProps) {
  const isXS = isIPhoneXSClass();
  const sphereSize = compact ? 120 : 180;

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
          ? "fixed inset-0 z-[9999] bg-[#030308] min-h-[100dvh] w-screen px-4"
          : "relative py-12 px-4 w-full"
      }`}
    >
      {/* Cosmic Nebula Glow Behind */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] sm:w-[460px] sm:h-[460px] rounded-full bg-gradient-to-tr from-cyan-500/15 via-purple-600/20 to-blue-600/10 pointer-events-none ${
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

      {/* Central 3D Crystal Orb & Astral Rings Stage */}
      <div className="relative flex items-center justify-center">
        <svg
          viewBox="0 0 280 280"
          style={{ width: sphereSize * 1.5, height: sphereSize * 1.5 }}
          className={`overflow-visible ${isXS ? "" : "filter drop-shadow-[0_0_35px_rgba(129,140,248,0.35)]"}`}
        >

          <defs>
            {/* 3D Glass Sphere Body Radial Gradient */}
            <radialGradient
              id="cosmic_sphere_grad"
              cx="35%"
              cy="28%"
              r="72%"
              fx="32%"
              fy="24%"
            >
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
              <stop offset="18%" stopColor="#a5f3fc" stopOpacity="0.9" />
              <stop offset="42%" stopColor="#38bdf8" stopOpacity="0.75" />
              <stop offset="70%" stopColor="#818cf8" stopOpacity="0.65" />
              <stop offset="88%" stopColor="#312e81" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#05050f" stopOpacity="1" />
            </radialGradient>

            {/* Core Singularity Core */}
            <radialGradient id="cosmic_core_singularity" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="30%" stopColor="#67e8f9" stopOpacity="0.9" />
              <stop offset="70%" stopColor="#c084fc" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </radialGradient>

            {/* Astral Orbit Ring 1 Gradient */}
            <linearGradient id="orbit_ring_grad_1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#c084fc" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.2" />
            </linearGradient>

            {/* Astral Orbit Ring 2 Gradient */}
            <linearGradient id="orbit_ring_grad_2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f472b6" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#818cf8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Outer Astral Orbit Ring 1 (Tilted Ellipse - Clockwise Rotation) */}
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
                stroke="url(#orbit_ring_grad_1)"
                strokeWidth="1.8"
                strokeDasharray="6 4 12 4"
                transform="rotate(-26)"
                className="opacity-80 filter drop-shadow-[0_0_8px_#38bdf8]"
              />
              {/* Planetary Orbit Nodes */}
              <circle cx="95" cy="-22" r="3.5" fill="#a5f3fc" className="shadow-[0_0_10px_#fff]" />
              <circle cx="-95" cy="22" r="2.5" fill="#e879f9" />
            </motion.g>
          </g>

          {/* Outer Astral Orbit Ring 2 (Counter-Clockwise Rotation) */}
          <g transform="translate(140, 140)">
            <motion.g
              animate={{ rotate: -360 }}
              transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            >
              <ellipse
                cx="0"
                cy="0"
                rx="122"
                ry="40"
                fill="none"
                stroke="url(#orbit_ring_grad_2)"
                strokeWidth="1.2"
                strokeDasharray="4 6"
                transform="rotate(32)"
                className="opacity-70 filter drop-shadow-[0_0_8px_#c084fc]"
              />
              <circle cx="-100" cy="-20" r="3" fill="#67e8f9" />
            </motion.g>
          </g>

          {/* 🔮 3D Crystal Orb Sphere Body */}
          <circle
            cx="140"
            cy="140"
            r="68"
            fill="url(#cosmic_sphere_grad)"
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth="1.2"
            className="filter drop-shadow-[0_0_20px_rgba(56,189,248,0.4)]"
          />

          {/* Inner Pulsing Singularity Core */}
          <motion.circle
            cx="140"
            cy="140"
            r="32"
            fill="url(#cosmic_core_singularity)"
            animate={{ scale: [0.85, 1.18, 0.85], opacity: [0.75, 1, 0.75] }}
            transition={{ duration: 2.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            className="mix-blend-screen"
          />

          {/* Glass Curved Specular Highlight (Top-Left) */}
          <ellipse
            cx="120"
            cy="108"
            rx="32"
            ry="18"
            fill="rgba(255, 255, 255, 0.85)"
            transform="rotate(-28 120 108)"
            className="filter blur-[1.2px]"
          />
          <circle cx="110" cy="100" r="5" fill="#ffffff" className="filter blur-[0.4px]" />

          {/* Bottom Curved Rim Glow (Reflection) */}
          <path
            d="M 100 180 A 68 68 0 0 0 178 180"
            fill="none"
            stroke="rgba(165, 243, 252, 0.6)"
            strokeWidth="3.5"
            strokeLinecap="round"
            className="filter blur-[2px]"
          />

          {/* Mystic Rune / Septagram Starlight Sigil Overlay */}
          <g transform="translate(140, 140)">
            <motion.g
              animate={{ rotate: 360 }}
              transition={{ duration: 24, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              className="opacity-40"
            >
              {[0, 51.4, 102.8, 154.2, 205.7, 257.1, 308.5].map((angle, i) => {
                const rad = (angle * Math.PI) / 180;
                const x = Math.cos(rad) * 48;
                const y = Math.sin(rad) * 48;
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="1.8"
                    fill="#ffffff"
                    className="shadow-[0_0_5px_#fff]"
                  />
                );
              })}
            </motion.g>
          </g>
        </svg>
      </div>

      {/* Crystal Orb Branding Title */}
      <div className="relative mt-5 sm:mt-6 text-center z-10 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xl sm:text-2xl font-black tracking-[0.32em] uppercase font-sans bg-gradient-to-r from-cyan-200 via-sky-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(56,189,248,0.5)]"
        >
          CRYSTAL ORB
        </motion.div>

        {/* Dynamic Status Message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.9 }}
          transition={{ delay: 0.15 }}
          className="mt-2 text-xs sm:text-sm font-medium text-cyan-100/80 tracking-wider flex items-center gap-1.5"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping inline-block" />
          {message}
        </motion.p>

        {/* Subtitle / Dimension Label */}
        {subMessage && (
          <p className="mt-1 text-[10px] font-mono tracking-[0.24em] text-purple-300/60 uppercase">
            {subMessage}
          </p>
        )}

        {/* Cosmic Energy Wave Loading Bar */}
        <div className="mt-5 w-44 sm:w-56 h-[3px] rounded-full bg-white/10 overflow-hidden relative border border-white/5">
          <motion.div
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              duration: 1.6,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            className="w-1/2 h-full bg-gradient-to-r from-transparent via-cyan-400 via-purple-400 to-transparent shadow-[0_0_10px_#38bdf8]"
          />
        </div>
      </div>
    </div>
  );
}
export default OrbCosmicLoader;
