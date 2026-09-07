import React, { useId } from 'react';
import { motion } from 'motion/react';
import { WarpPhase } from '@/lib/omniWarp/types';

interface BigBangCircularMeterProps {
  /** 사용자가 누르고 있는지 여부 */
  isPressing: boolean;
  /** 마우스 호버 여부 */
  isHovered?: boolean;
  /** 실시간 가상 압력 (0.0 ~ 1.0) */
  gauge?: number;
  /** 누르고 있는 시간 (ms) */
  durationMs?: number;
  /** 현재 감지된 워프 위상 */
  activePhase?: WarpPhase;
  /** 취소(어보트) 대기 상태 */
  isAborted?: boolean;
  /** 무한 반복 대기 사이클 타이밍 값 (선택적) */
  idleCycleProgress?: number;
}

/**
 * 🔮 빅뱅 아케인 마법진 매트릭스 (BigBang Arcane Magic Circle)
 * - GPU 하드웨어 가속 기반 초경량 60fps 무부하 렌더링
 * - 버튼 중심 아이콘을 코어로 삼는 신비롭고 정교한 마법진 룬 서클 시스템
 */
export const BigBangCircularMeter = React.memo(function BigBangCircularMeter({
  isPressing,
  isHovered = false,
  gauge = 0,
  durationMs = 0,
  activePhase = 'idle',
  isAborted = false,
  idleCycleProgress,
}: BigBangCircularMeterProps) {
  const gradientId = useId();

  // 버튼(56px) 외곽을 자연스럽고 고급스럽게 감싸는 최적의 마법진 직경 (104px)
  const size = 104;
  const center = size / 2; // 52px
  const rArc = 42;
  const circumferenceArc = 2 * Math.PI * rArc;

  return (
    <div
      className="relative flex items-center justify-center pointer-events-none select-none shrink-0 transition-transform duration-300 will-change-transform"
      style={{
        width: size,
        height: size,
        transform: isPressing ? 'scale(1.15)' : isHovered ? 'scale(1.15)' : 'scale(1)',
      }}
    >
      {/* 🌟 1. 마법진 앰비언트 글로우 오라 */}
      <div
        className="absolute inset-2 rounded-full pointer-events-none transition-opacity duration-300"
        style={{
          background: isPressing
            ? 'radial-gradient(circle, rgba(56,189,248,0.28) 0%, rgba(168,85,247,0.25) 50%, transparent 75%)'
            : isHovered
            ? 'radial-gradient(circle, rgba(56,189,248,0.22) 0%, rgba(168,85,247,0.2) 50%, transparent 75%)'
            : 'radial-gradient(circle, rgba(56,189,248,0.12) 0%, rgba(168,85,247,0.1) 50%, transparent 75%)',
          opacity: isPressing ? 1 : isHovered ? 0.9 : 0.6,
        }}
      />

      {/* 🌟 2. 정밀 아케인 SVG 벡터 마법진 베이스 & 동적 에너지 아크 */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 overflow-visible"
      >
        <defs>
          <linearGradient id={`${gradientId}-magic-gradient`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.95} />
            <stop offset="30%" stopColor="#00f0ff" stopOpacity={0.9} />
            <stop offset="70%" stopColor="#c084fc" stopOpacity={0.85} />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.9} />
          </linearGradient>
        </defs>

        {/* 베이스 궤도 가이드 링 */}
        <circle
          cx={center}
          cy={center}
          r={46}
          fill="none"
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth={0.8}
        />
        <circle
          cx={center}
          cy={center}
          r={38}
          fill="none"
          stroke="rgba(0, 240, 255, 0.2)"
          strokeWidth={0.6}
        />

        {/* 실시간 타이밍 오로라 아크 진행선 (누를 때 실시간 압력 게이지 연동) */}
        <g style={{ transformOrigin: `${center}px ${center}px` }} className={isPressing ? 'animate-[spin_2s_linear_infinite]' : 'animate-[spin_3.6s_linear_infinite]'}>
          <circle
            cx={center}
            cy={center}
            r={rArc}
            fill="none"
            stroke={`url(#${gradientId}-magic-gradient)`}
            strokeWidth={isPressing ? 2.2 : isHovered ? 2 : 1.5}
            strokeDasharray={
              isPressing
                ? `${circumferenceArc * Math.max(0.15, Math.min(1.0, gauge))} ${circumferenceArc * (1 - Math.max(0.15, Math.min(1.0, gauge)))}`
                : `${circumferenceArc * 0.45} ${circumferenceArc * 0.55}`
            }
            strokeLinecap="round"
            opacity={isPressing ? 1 : 0.85}
          />
        </g>
      </svg>

      {/* 🌟 3. 외곽 정방향 회전 룬 서클 (누를 때 고속 공명) */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={`absolute inset-0 text-cyan-400/60 pointer-events-none will-change-transform ${
          isPressing
            ? 'animate-[spin_6s_linear_infinite]'
            : isHovered
            ? 'animate-[spin_12s_linear_infinite]'
            : 'animate-[spin_24s_linear_infinite]'
        }`}
      >
        <circle
          cx={center}
          cy={center}
          r={48}
          fill="none"
          stroke="currentColor"
          strokeWidth={0.8}
          strokeDasharray="2 4"
          className="opacity-60"
        />

        {/* 12방위 눈금 */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          const x1 = center + 44 * Math.cos(angle);
          const y1 = center + 44 * Math.sin(angle);
          const x2 = center + 48 * Math.cos(angle);
          const y2 = center + 48 * Math.sin(angle);
          return (
            <line
              key={`rune-line-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth={0.8}
              className="opacity-50"
            />
          );
        })}

        {/* 4 방위 룬 보석 */}
        <circle cx={center} cy={4} r={1.8} fill="#38bdf8" />
        <circle cx={center} cy={size - 4} r={1.8} fill="#c084fc" />
        <circle cx={4} cy={center} r={1.8} fill="#38bdf8" />
        <circle cx={size - 4} cy={center} r={1.8} fill="#c084fc" />
      </svg>

      {/* 🌟 4. 내부 역방향 회전 신성기하학 마법진 (CSS spin-reverse, 누를 때 가속) */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={`absolute inset-0 text-purple-400/60 pointer-events-none will-change-transform ${
          isPressing
            ? 'animate-[spin_8s_linear_infinite_reverse]'
            : isHovered
            ? 'animate-[spin_16s_linear_infinite_reverse]'
            : 'animate-[spin_28s_linear_infinite_reverse]'
        }`}
      >
        <circle
          cx={center}
          cy={center}
          r={35}
          fill="none"
          stroke="currentColor"
          strokeWidth={0.6}
          strokeDasharray="4 6"
          className="opacity-70"
        />

        {/* 교차 삼각성 */}
        <polygon
          points={`${center},17 ${center + 26},61 ${center - 26},61`}
          fill="none"
          stroke="currentColor"
          strokeWidth={0.6}
          strokeDasharray="2 3"
          className="opacity-40"
        />
        <polygon
          points={`${center},87 ${center - 26},43 ${center + 26},43`}
          fill="none"
          stroke="#fbbf24"
          strokeWidth={0.6}
          strokeDasharray="2 3"
          className="opacity-40"
        />
      </svg>
    </div>
  );
});
