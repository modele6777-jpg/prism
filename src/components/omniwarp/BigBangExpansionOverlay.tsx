import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BigBangCommitEventDetail, WarpPhase } from '@/lib/omniWarp/types';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
}

export function BigBangExpansionOverlay() {
  const [activeCommit, setActiveCommit] = useState<BigBangCommitEventDetail | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const handleCommit = (e: any) => {
      const detail = e.detail as BigBangCommitEventDetail;
      if (detail) {
        setActiveCommit(detail);

        // Spawn Big Bang particles from crystal orb origin (bottom-center area)
        const canvas = canvasRef.current;
        const originX = window.innerWidth / 2;
        const originY = window.innerHeight - 90;
        const isBlackhole = detail.phase === 'blackhole';
        const isWormhole = detail.phase === 'wormhole';

        particlesRef.current = [];
        const count = 130;
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = isBlackhole ? (Math.random() * 12 + 4) : (Math.random() * 7 + 2);
          particlesRef.current.push({
            x: originX,
            y: originY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: Math.random() * 3.5 + 1.0,
            color: isBlackhole
              ? `hsl(${Math.random() * 40 + 280}, 100%, 65%)`
              : isWormhole
              ? `hsl(${Math.random() * 40 + 150}, 100%, 75%)`
              : `hsl(${Math.random() * 40 + 190}, 100%, 80%)`,
            alpha: 1.0,
            decay: Math.random() * 0.02 + 0.015,
          });
        }

        // Clear overlay after transition animation completes
        setTimeout(() => {
          setActiveCommit(null);
        }, 650);
      }
    };

    window.addEventListener('prism:bigbang_commit', handleCommit);
    return () => {
      window.removeEventListener('prism:bigbang_commit', handleCommit);
    };
  }, []);

  // Canvas particle render loop
  useEffect(() => {
    if (!activeCommit) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (particlesRef.current.length > 0) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [activeCommit]);

  if (!activeCommit) return null;

  const { target, phase } = activeCommit;

  return (
    <AnimatePresence>
      <motion.div
        key="bigbang-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.38, ease: 'easeOut' }}
        className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center overflow-hidden"
      >
        {/* Space Particle Canvas for Big Bang Burst */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-20" />

        {/* White Hole: Blinding Pure White / Cyan Supernova Flash */}
        {phase === 'whitehole' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.95, 0.3, 0] }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="absolute inset-0 bg-white z-0 pointer-events-none"
          />
        )}

        {/* Black Hole: Complete Obsidian Singularity Void Implosion */}
        {phase === 'blackhole' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.85, 0] }}
            transition={{ duration: 0.58, ease: 'easeInOut' }}
            className="absolute inset-0 bg-black z-0 pointer-events-none"
          />
        )}

        {/* Wormhole: Quantum Distortion Emerald Glow */}
        {phase === 'wormhole' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.9, 0.4, 0] }}
            transition={{ duration: 0.52, ease: 'easeOut' }}
            className="absolute inset-0 bg-emerald-950/50 z-0 pointer-events-none"
          />
        )}

        {/* 1. Backdrop Expansion Glow Layer */}
        <motion.div
          initial={{ scale: 0.1, opacity: 0 }}
          animate={{ scale: 38, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
          className={`w-16 h-16 rounded-full blur-2xl ${
            phase === 'whitehole'
              ? 'bg-[radial-gradient(circle,rgba(255,255,255,1)_0%,rgba(165,243,252,0.9)_50%,transparent_80%)]'
              : phase === 'wormhole'
              ? 'bg-[radial-gradient(circle,rgba(52,211,153,0.9)_0%,rgba(16,185,129,0.7)_50%,transparent_80%)]'
              : phase === 'event_horizon'
              ? 'bg-gradient-to-tr from-purple-600 via-indigo-500 to-pink-500'
              : 'bg-[radial-gradient(circle,rgba(168,85,247,0.9)_0%,rgba(15,23,42,0.95)_50%,black_80%)]'
          }`}
        />

        {/* 2. Central Shockwave Expansion Ring */}
        <motion.div
          initial={{ scale: 0.2, opacity: 1, borderWidth: 18 }}
          animate={{ scale: 26, opacity: 0, borderWidth: 1 }}
          transition={{ duration: 0.52, ease: 'easeOut' }}
          className={`absolute w-24 h-24 rounded-full border ${
            phase === 'whitehole'
              ? 'border-white shadow-[0_0_40px_rgba(255,255,255,1)]'
              : phase === 'wormhole'
              ? 'border-emerald-300 shadow-[0_0_40px_rgba(52,211,153,0.9)]'
              : phase === 'event_horizon'
              ? 'border-purple-300 shadow-[0_0_30px_rgba(168,85,247,0.8)]'
              : 'border-violet-400 shadow-[0_0_50px_rgba(168,85,247,1)]'
          }`}
        />

        {/* 3. Centered Teleportation Monogram & Title */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.35 }}
          className={`relative z-10 flex flex-col items-center gap-2 p-6 rounded-3xl backdrop-blur-2xl border shadow-2xl text-center max-w-xs mx-4 ${
            phase === 'whitehole'
              ? 'bg-slate-950/85 border-cyan-300/50 shadow-[0_0_45px_rgba(34,211,238,0.4)]'
              : phase === 'wormhole'
              ? 'bg-slate-950/85 border-emerald-400/50 shadow-[0_0_45px_rgba(52,211,153,0.4)]'
              : phase === 'event_horizon'
              ? 'bg-zinc-950/85 border-purple-400/50 shadow-[0_0_45px_rgba(168,85,247,0.4)]'
              : 'bg-black/95 border-violet-500/60 shadow-[0_0_60px_rgba(168,85,247,0.6)]'
          }`}
        >
          <div className="text-[10px] font-mono font-bold tracking-widest text-amber-300 uppercase">
            {phase === 'whitehole'
              ? 'WHITE HOLE · RADIANT EMISSION (화이트홀 광휘 방출)'
              : phase === 'wormhole'
              ? 'QUANTUM WORMHOLE · RANDOM JUMP (웜홀 자유 양자 도약)'
              : phase === 'event_horizon'
              ? target.eventHorizonMode === 'whitehole'
                ? 'EVENT HORIZON · RADIANT WARP (사건의 지평선 빛의 도약)'
                : 'EVENT HORIZON · SINGULARITY WARP (사건의 지평선 심연 도약)'
              : 'BLACK HOLE · GRAVITATIONAL SINGULARITY (블랙홀 특이점 도약)'}
          </div>
          <div className="text-base font-extrabold text-white">
            {target.title}
          </div>
          <div className="text-xs text-white/80 font-sans leading-relaxed">
            {target.previewLabel}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
