import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "motion/react";
import {
  Volume2,
  VolumeX,
  Download,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { sacredAudio } from "@/lib/omniWarp/sacredAudio";
import { omniWarpAudio } from "@/lib/omniWarp/omniWarpAudio";
import { triggerHaptic } from "@/lib/omniWarp/omniWarpHaptics";
import { CrystalOrbIcon } from "@/components/icons/CrystalOrbIcon";
import { useNarrowPhone } from "@/hooks/useNarrowPhone";

interface StardustParticle {
  x: number;
  y: number;
  radius: number;
  angle: number;
  speed: number;
  dist: number;
  alpha: number;
  color: string;
}

export default function OrbGatewayPage() {
  const [, navigate] = useLocation();
  const narrow = useNarrowPhone();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isDroneOn, setIsDroneOn] = useState(false);
  const [isResonating, setIsResonating] = useState(false);
  const [resonanceCount, setResonanceCount] = useState(0);
  const [rippleKey, setRippleKey] = useState(0);

  // PWA Standalone Detection
  const [isStandalone, setIsStandalone] = useState(false);
  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(!!standalone);
  }, []);

  // Set Document Title & Manifest for Key PWA
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Key";

    const manifestTag = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
    const prevManifestHref = manifestTag ? manifestTag.getAttribute("href") : null;
    if (manifestTag) {
      manifestTag.setAttribute("href", "/manifest-orb.webmanifest");
    }

    return () => {
      document.title = prevTitle;
      if (manifestTag && prevManifestHref) {
        manifestTag.setAttribute("href", prevManifestHref);
      }
      try {
        sacredAudio.stopDrone();
      } catch (_) {}
    };
  }, []);

  // 🔮 Swirling Stardust Particle Simulation Canvas inside the Crystal Orb
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const width = (canvas.width = 300);
    const height = (canvas.height = 300);

    const colors = [
      "#ffffff",
      "#a5f3fc",
      "#38bdf8",
      "#c084fc",
      "#fef08a",
      "#818cf8",
      "#f472b6",
    ];

    const particleCount = 56;
    const particles: StardustParticle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: width / 2,
        y: height / 2,
        radius: Math.random() * 2.2 + 0.8,
        angle: Math.random() * Math.PI * 2,
        speed: (Math.random() * 0.012 + 0.004) * (Math.random() > 0.5 ? 1 : -1),
        dist: Math.random() * 125 + 10,
        alpha: Math.random() * 0.65 + 0.25,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Deep glowing refractive core
      const grad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        width / 2
      );
      grad.addColorStop(0, "rgba(96, 165, 250, 0.28)");
      grad.addColorStop(0.45, "rgba(168, 85, 247, 0.16)");
      grad.addColorStop(0.85, "rgba(6, 182, 212, 0.08)");
      grad.addColorStop(1, "rgba(2, 3, 10, 0.96)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, width / 2 - 4, 0, Math.PI * 2);
      ctx.fill();

      // Swirling Stardust Particles
      const speedMultiplier = isResonating ? 3.5 : 1.0;
      particles.forEach((p) => {
        p.angle += p.speed * speedMultiplier;
        const px = width / 2 + Math.cos(p.angle) * p.dist;
        const py = height / 2 + Math.sin(p.angle) * p.dist;

        ctx.beginPath();
        ctx.arc(px, py, p.radius * (isResonating ? 1.3 : 1.0), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha * (isResonating ? 0.95 : 0.75);
        ctx.shadowBlur = isResonating ? 12 : 6;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      ctx.globalAlpha = 1.0;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isResonating]);

  // 🔔 528Hz Solfeggio Healing Drone Toggle
  const handleToggleDrone = () => {
    const active = sacredAudio.toggleDrone();
    setIsDroneOn(active);
    triggerHaptic("whitehole");
  };

  // 🔮 Crystal Orb Tap: Cosmic Sacred Resonance
  const handleOrbTouch = () => {
    setIsResonating(true);
    setResonanceCount((c) => c + 1);
    setRippleKey((k) => k + 1);

    // Sacred audio chime & tactile haptics
    omniWarpAudio.playWhiteHole();
    sacredAudio.playSingingBowl(528);
    triggerHaptic("whitehole");

    setTimeout(() => {
      setIsResonating(false);
    }, 1200);
  };

  // Return to LucKey Home
  const handleGoHome = () => {
    triggerHaptic("whitehole");
    const returnPath = sessionStorage.getItem("prism_orb_return_path") || "/";
    sessionStorage.removeItem("prism_orb_return_path");
    const safePath = returnPath.includes("orb") ? "/" : returnPath;

    if (typeof window !== "undefined" && window.location.pathname.includes("orb")) {
      window.location.href = safePath;
    } else {
      navigate(safePath);
      window.dispatchEvent(new CustomEvent("prism-navigate", { detail: { path: safePath } }));
    }
  };

  return (
    <div className="relative w-full h-[100dvh] flex flex-col items-center justify-between overflow-hidden bg-[#020308] text-white select-none">
      {/* 🌌 Deep Space Ambient Glow Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden>
        {/* Soft Radial Ambient Nebulae */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[620px] h-[90vw] max-h-[620px] rounded-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.12)_0%,rgba(168,85,247,0.08)_45%,transparent_75%)] blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] max-w-[450px] h-[70vw] max-h-[450px] rounded-full bg-[radial-gradient(circle_at_center,rgba(253,230,138,0.08)_0%,transparent_60%)] blur-2xl pointer-events-none" />
      </div>

      {/* 🧭 Top Minimal Navigation Header */}
      <header className="relative z-40 w-full max-w-lg px-3 sm:px-5 pt-[calc(var(--sat)+0.75rem)] pb-2 flex items-center justify-between shrink-0">
        {/* Back to LucKey Home */}
        <button
          type="button"
          onClick={handleGoHome}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-xl transition-all active:scale-95 touch-manipulation cursor-pointer shadow-sm"
          title="LucKey 홈으로 이동"
        >
          <ArrowLeft size={13} className="text-cyan-300" />
          <span className="text-[11px] sm:text-xs">LucKey</span>
        </button>

        {/* Center Title: Key */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 backdrop-blur-xl shadow-lg">
          <CrystalOrbIcon size={14} className="shrink-0 text-cyan-300 animate-pulse" />
          <span className="text-xs sm:text-sm font-semibold tracking-wider text-cyan-200">
            Key
          </span>
        </div>

        {/* Controls: 528Hz Healing Sound & PWA Install */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {!isStandalone && (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("trigger-pwa-install"))}
              className="flex items-center gap-1 px-2.5 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-medium backdrop-blur-xl border border-cyan-400/40 bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/25 transition-all active:scale-95 shadow-[0_0_12px_rgba(6,182,212,0.25)] touch-manipulation cursor-pointer"
              title="Key 독립 앱 설치"
            >
              <Download size={12} className="text-cyan-300 shrink-0" />
              <span className="hidden sm:inline">앱 설치</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleToggleDrone}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-medium backdrop-blur-xl border transition-all active:scale-95 touch-manipulation cursor-pointer ${
              isDroneOn
                ? "bg-purple-500/20 text-purple-300 border-purple-400/40 shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                : "bg-white/5 text-slate-400 border-white/10 hover:text-white"
            }`}
            title="528Hz 솔페지오 주파수 사운드"
          >
            {isDroneOn ? (
              <Volume2 size={12} className="text-purple-400 animate-pulse shrink-0" />
            ) : (
              <VolumeX size={12} className="shrink-0" />
            )}
            <span className="text-[10px] sm:text-xs font-mono">528Hz</span>
          </button>
        </div>
      </header>

      {/* 🔮 Center Stage: Pure Mystical 3D Crystal Orb */}
      <main className="relative z-30 flex-1 flex flex-col items-center justify-center w-full max-w-lg px-4 my-auto min-h-0">
        <div
          className={`relative flex items-center justify-center transition-transform duration-500 origin-center my-auto shrink-0 ${
            narrow
              ? "w-72 h-72 scale-[0.92]"
              : "w-80 h-80 sm:w-96 sm:h-96 scale-100 sm:scale-105"
          }`}
        >
          {/* 🌟 1. Outer Concentric Arcane Magic Circle Matrix */}
          <div className="absolute inset-[-54px] sm:inset-[-74px] pointer-events-none flex items-center justify-center select-none z-0">
            {/* Pulsing Arcane Glow Corona */}
            <div
              className={`absolute inset-4 rounded-full pointer-events-none blur-3xl transition-all duration-700 ${
                isResonating
                  ? "bg-[radial-gradient(circle,rgba(56,189,248,0.5)_0%,rgba(168,85,247,0.4)_40%,rgba(251,191,36,0.25)_65%,transparent_85%)] scale-110"
                  : "bg-[radial-gradient(circle,rgba(56,189,248,0.22)_0%,rgba(168,85,247,0.18)_45%,transparent_75%)]"
              }`}
            />

            {/* 8-Fold Rotating Arcane Celestial Light Flares */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: isResonating ? 15 : 60, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-35"
            >
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                <div
                  key={`arcane-ray-${deg}`}
                  className="absolute w-0.5 h-full pointer-events-none"
                  style={{
                    transform: `rotate(${deg}deg)`,
                    background:
                      "linear-gradient(180deg, transparent 6%, rgba(56,189,248,0.6) 22%, transparent 45%, transparent 55%, rgba(168,85,247,0.6) 78%, transparent 94%)",
                  }}
                />
              ))}
            </motion.div>

            {/* Outer Celestial Zodiac Rim */}
            <svg
              viewBox="0 0 440 440"
              className="absolute inset-0 w-full h-full text-slate-400/30 pointer-events-none"
            >
              <circle cx="220" cy="220" r="216" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 6" />
              <circle cx="220" cy="220" r="212" fill="none" stroke="rgba(251,191,36,0.28)" strokeWidth="0.6" />
              {Array.from({ length: 24 }).map((_, i) => {
                const angle = (i * 15 * Math.PI) / 180;
                const x1 = 220 + 210 * Math.cos(angle);
                const y1 = 220 + 210 * Math.sin(angle);
                const x2 = 220 + 216 * Math.cos(angle);
                const y2 = 220 + 216 * Math.sin(angle);
                return (
                  <line
                    key={`celestial-tick-${i}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="currentColor"
                    strokeWidth={i % 6 === 0 ? "1.5" : "0.8"}
                    strokeOpacity={i % 6 === 0 ? 0.75 : 0.4}
                  />
                );
              })}
            </svg>

            {/* Concentric Celestial Orbit Rings */}
            <div className="absolute inset-8 rounded-full border border-cyan-500/20 pointer-events-none" />
            <div className="absolute inset-14 rounded-full border border-dashed border-purple-500/25 pointer-events-none" />
            <div className="absolute inset-20 rounded-full border border-amber-400/15 pointer-events-none" />
          </div>

          {/* 🌟 2. Interactive Resonance Waves (Triggered on Tap) */}
          <AnimatePresence>
            {isResonating && (
              <motion.div
                key={`ripple-${rippleKey}`}
                initial={{ opacity: 0.95, scale: 0.8 }}
                animate={{ opacity: 0, scale: 1.55 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.1, ease: "easeOut" }}
                className="absolute inset-0 rounded-full border-2 border-cyan-300 shadow-[0_0_35px_rgba(56,189,248,0.8),inset_0_0_25px_rgba(168,85,247,0.6)] pointer-events-none z-10"
              />
            )}
          </AnimatePresence>

          {/* 🌟 3. Glass Crystal Orb Outer Halos */}
          <div
            className={`absolute -inset-2 rounded-full border border-cyan-400/30 pointer-events-none transition-all duration-700 z-10 ${
              isResonating ? "scale-105 shadow-[0_0_50px_rgba(56,189,248,0.6)]" : "shadow-[0_0_25px_rgba(56,189,248,0.25)]"
            }`}
          />
          <div className="absolute -inset-4 rounded-full border border-purple-500/20 pointer-events-none animate-pulse z-10" />

          {/* 🌟 4. Pure Hyper-Realistic Glass Crystal Orb */}
          <div
            onClick={handleOrbTouch}
            className={`group relative rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 active:scale-95 overflow-hidden touch-manipulation z-20 ${
              narrow ? "w-56 h-56" : "w-64 h-64 sm:w-72 sm:h-72"
            }`}
            style={{
              background: isResonating
                ? "radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.4) 0%, rgba(168, 85, 247, 0.25) 45%, rgba(0, 0, 0, 0.92) 100%)"
                : "radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.04) 45%, rgba(0, 0, 0, 0.88) 100%)",
              boxShadow: isResonating
                ? "inset 0 0 45px rgba(56, 189, 248, 0.55), inset -10px -10px 25px rgba(0,0,0,0.95), 0 0 60px rgba(56, 189, 248, 0.5), 0 0 90px rgba(168, 85, 247, 0.35)"
                : "inset 0 0 32px rgba(255, 255, 255, 0.25), inset -10px -10px 25px rgba(0, 0, 0, 0.9), 0 0 35px rgba(56, 189, 248, 0.3)",
            }}
            title="크리스탈 오브를 터치하여 공명(Resonance)을 느껴보세요"
          >
            {/* Swirling Stardust Particle Simulation Canvas */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full rounded-full pointer-events-none z-10"
            />

            {/* Specular Glare Reflection on Glass Curved Surface */}
            <div
              className="absolute top-3 left-6 sm:top-5 sm:left-10 w-24 sm:w-32 h-9 sm:h-12 rounded-full pointer-events-none z-30 -rotate-[28deg]"
              style={{
                background: "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.8) 0%, transparent 75%)",
              }}
            />

            {/* Bottom Refraction Rim Glow */}
            <div
              className="absolute bottom-4 inset-x-8 h-8 rounded-full pointer-events-none z-25 opacity-70"
              style={{
                background: "radial-gradient(ellipse at center, rgba(56, 189, 248, 0.45) 0%, transparent 80%)",
              }}
            />

            {/* Core Sacred Singularity & Center Inscription */}
            <div className="relative z-20 flex flex-col items-center justify-center text-center pointer-events-none p-4 select-none">
              <motion.div
                animate={{
                  scale: isResonating ? [1, 1.15, 1] : [1, 1.04, 1],
                  opacity: isResonating ? 1 : 0.85,
                }}
                transition={{ repeat: Infinity, duration: isResonating ? 0.8 : 3.5, ease: "easeInOut" }}
                className="flex flex-col items-center"
              >
                <span className="text-cyan-200 text-lg sm:text-xl font-serif tracking-widest drop-shadow-[0_0_12px_rgba(56,189,248,0.9)]">
                  ✧ Key ✧
                </span>
                <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-cyan-300/70 mt-1">
                  ASTRAL SCRYING SPHERE
                </span>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      {/* 🌿 Minimal Bottom Guidance Banner */}
      <footer className="relative z-40 w-full max-w-lg px-4 pb-[calc(var(--sab)+2rem)] flex flex-col items-center shrink-0 text-center">
        <motion.div
          animate={{ opacity: [0.55, 0.9, 0.55] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="flex items-center gap-1.5 text-xs text-cyan-200/80 tracking-wide font-sans py-2 px-4 rounded-full bg-white/[0.03] border border-white/5 backdrop-blur-md"
        >
          <Sparkles size={12} className="text-cyan-300" />
          <span>수정구슬을 터치하여 신성한 공명(Resonance)을 경험하세요</span>
        </motion.div>
      </footer>
    </div>
  );
}
