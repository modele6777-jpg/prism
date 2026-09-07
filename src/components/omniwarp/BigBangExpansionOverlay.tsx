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
        const isWhitehole = detail.phase === 'whitehole' || (detail.phase === 'event_horizon' && detail.target?.eventHorizonMode === 'whitehole');
        const isMirrorhole = detail.phase === 'mirrorhole' || (detail.phase === 'event_horizon' && detail.target?.eventHorizonMode === 'mirrorhole');
        const isBlackhole = detail.phase === 'blackhole' || (detail.phase === 'event_horizon' && detail.target?.eventHorizonMode === 'blackhole');
        const isWormhole = detail.phase === 'wormhole';

        particlesRef.current = [];
        const count = 130;
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = isBlackhole ? (Math.random() * 12 + 4) : isMirrorhole ? (Math.random() * 9 + 3) : (Math.random() * 7 + 2);
          particlesRef.current.push({
            x: originX,
            y: originY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: Math.random() * 3.5 + 1.0,
            color: isBlackhole
              ? `hsl(${Math.random() * 40 + 280}, 100%, 65%)`
              : isMirrorhole
              ? `hsl(${Math.random() * 30 + 195}, 90%, 92%)`
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

        {/* Central Shockwave Expansion Ring (순간적인 파동 링) */}
        <motion.div
          initial={{ scale: 0.2, opacity: 0.9, borderWidth: 8 }}
          animate={{ scale: 18, opacity: 0, borderWidth: 1 }}
          transition={{ duration: 0.48, ease: 'easeOut' }}
          className={`absolute w-20 h-20 rounded-full pointer-events-none border ${
            phase === 'whitehole'
              ? 'border-cyan-300 shadow-[0_0_30px_rgba(56,189,248,0.8)]'
              : phase === 'wormhole'
              ? 'border-emerald-300 shadow-[0_0_30px_rgba(52,211,153,0.8)]'
              : phase === 'event_horizon'
              ? 'border-purple-300 shadow-[0_0_30px_rgba(168,85,247,0.8)]'
              : 'border-violet-400 shadow-[0_0_30px_rgba(168,85,247,0.8)]'
          }`}
        />
      </motion.div>
    </AnimatePresence>
  );
}
