import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BigBangCommitEventDetail } from '@/lib/omniWarp/types';

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
        const isBlackhole = detail.phase === 'blackhole' || (detail.phase === 'event_horizon' && detail.target?.eventHorizonMode === 'blackhole');
        const isWormhole = detail.phase === 'wormhole';

        particlesRef.current = [];
        const count = isWhitehole ? 170 : isBlackhole ? 160 : 130;
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = isBlackhole
            ? (Math.random() * 14 + 5)
            : isWhitehole
            ? (Math.random() * 12 + 4)
            : (Math.random() * 8 + 3);

          let particleColor = `hsl(${Math.random() * 40 + 190}, 100%, 80%)`;
          if (isWhitehole) {
            // ☀️ 화이트홀 빛비춤: 눈부신 순백광, 황금빛, 시안 광자
            const pType = Math.random();
            if (pType < 0.45) {
              particleColor = `rgba(255, 255, 255, 0.98)`;
            } else if (pType < 0.75) {
              particleColor = `hsl(${Math.random() * 25 + 190}, 100%, 85%)`; // 눈부신 하늘빛/시안
            } else {
              particleColor = `hsl(${Math.random() * 30 + 45}, 100%, 80%)`; // 은은한 성스러운 골드
            }
          } else if (isBlackhole) {
            // 🕳️ 블랙홀 어두운 심연: 딥 바이올렛, 흑요석 암흑, 마젠타 특이점
            const pType = Math.random();
            if (pType < 0.5) {
              particleColor = `hsl(${Math.random() * 40 + 270}, 100%, 65%)`; // 딥 바이올렛
            } else if (pType < 0.8) {
              particleColor = `hsl(${Math.random() * 30 + 310}, 100%, 60%)`; // 마젠타 특이점
            } else {
              particleColor = `rgba(10, 5, 20, 0.95)`; // 칠흑 같은 암흑 물질
            }
          } else if (isWormhole) {
            particleColor = `hsl(${Math.random() * 40 + 150}, 100%, 75%)`;
          }

          particlesRef.current.push({
            x: originX,
            y: originY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: isWhitehole ? (Math.random() * 4 + 1.2) : (Math.random() * 3.8 + 1.0),
            color: particleColor,
            alpha: 1.0,
            decay: isWhitehole ? (Math.random() * 0.024 + 0.012) : (Math.random() * 0.02 + 0.015),
          });
        }

        // Clear overlay after transition animation completes
        setTimeout(() => {
          setActiveCommit(null);
        }, 720);
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
  const isWhitehole = phase === 'whitehole' || (phase === 'event_horizon' && target?.eventHorizonMode === 'whitehole');
  const isBlackhole = phase === 'blackhole' || (phase === 'event_horizon' && target?.eventHorizonMode === 'blackhole');
  const isWormhole = phase === 'wormhole';

  return (
    <AnimatePresence>
      <motion.div
        key="bigbang-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center overflow-hidden"
      >
        {/* ☀️ 1. 화이트홀 빛비춤 효과: 화면 전체를 채우는 찬란한 광휘 & 빛의 폭발 */}
        {isWhitehole && (
          <>
            {/* 눈부신 백색광 플래시 & 래디언스 필드 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0, 0.95, 0.4, 0], scale: [0.8, 1.3, 1.6, 2.0] }}
              transition={{ duration: 0.65, ease: 'easeOut' }}
              className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.98)_0%,rgba(224,242,254,0.85)_30%,rgba(56,189,248,0.5)_60%,transparent_100%)]"
            />
            {/* 회전하는 성스러운 스타라이트 광선 (Starlight Rays) */}
            <div className="absolute inset-[-40%] pointer-events-none bigbang-rays-spin opacity-75 bg-[conic-gradient(from_0deg,rgba(255,255,255,0.85)_0deg,transparent_45deg,rgba(56,189,248,0.7)_90deg,transparent_135deg,rgba(254,240,138,0.8)_180deg,transparent_225deg,rgba(56,189,248,0.7)_270deg,transparent_315deg,rgba(255,255,255,0.85)_360deg)] blur-[1px]" />
          </>
        )}

        {/* 🕳️ 2. 블랙홀 어두운 심연 효과: 칠흑 같은 암흑 중력장 흡입 & 보이드 왜곡 */}
        {isBlackhole && (
          <>
            {/* 화면 전체를 암전시키는 딥 보이드 비네트 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.92, 0.85, 0] }}
              transition={{ duration: 0.68, ease: 'easeInOut' }}
              className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.98)_0%,rgba(13,4,24,0.92)_55%,rgba(2,1,5,0.98)_100%)]"
            />
            {/* 중심으로 빨려들어가는 암흑 흡입 파동 (Darkness Suction Waves) */}
            <div className="absolute inset-[-20%] pointer-events-none bigbang-suction-wave-1 opacity-80 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(147,51,234,0.4)_55%,rgba(0,0,0,0.95)_90%)]" />
            <div className="absolute inset-[-20%] pointer-events-none bigbang-suction-wave-2 opacity-70 bg-[radial-gradient(circle_at_center,transparent_10%,rgba(79,70,229,0.35)_45%,rgba(0,0,0,0.9)_85%)]" />
          </>
        )}

        {/* Space Particle Canvas for Big Bang Burst */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-20" />

        {/* Central Shockwave Expansion Ring (순간적인 파동 링) */}
        <motion.div
          initial={{ scale: 0.15, opacity: 0.95, borderWidth: 10 }}
          animate={{ scale: 22, opacity: 0, borderWidth: 1 }}
          transition={{ duration: 0.52, ease: 'easeOut' }}
          className={`absolute w-24 h-24 rounded-full pointer-events-none border ${
            isWhitehole
              ? 'border-white shadow-[0_0_50px_rgba(255,255,255,1),0_0_30px_rgba(56,189,248,0.9)]'
              : isBlackhole
              ? 'border-violet-500 shadow-[0_0_50px_rgba(168,85,247,0.9),inset_0_0_30px_rgba(0,0,0,0.95)]'
              : isWormhole
              ? 'border-emerald-300 shadow-[0_0_35px_rgba(52,211,153,0.85)]'
              : 'border-purple-300 shadow-[0_0_35px_rgba(168,85,247,0.85)]'
          }`}
        />
      </motion.div>
    </AnimatePresence>
  );
}
