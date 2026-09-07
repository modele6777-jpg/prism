import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'motion/react';
import { WarpPhase, OmniWarpTarget, OmniWarpContext } from '@/lib/omniWarp/types';
import { calculateWarpMetrics, forceToAiTemperature, RADIAL_WARP_APPS } from '@/lib/omniWarp/forceSensor';
import { serializeCurrentView, synthesizeWarpTarget, executeBigBangCommit, isDisallowedWarpDestination } from '@/lib/omniWarp/omniWarpEngine';
import { getWhiteholeRecommendedApp, getBlackholeRecommendedApp } from '@/lib/omniWarp/wormholeSpectrum';
import { getTossRule } from '@/lib/prismTossRegistry';
import { omniWarpAudio } from '@/lib/omniWarp/omniWarpAudio';
import { triggerHaptic, startBlackHoleContinuousHaptic, stopBlackHoleContinuousHaptic } from '@/lib/omniWarp/omniWarpHaptics';
import { BigBangCircularMeter } from './BigBangCircularMeter';
import { PrismAppIcon } from './PrismAppIcon';



export function BigBangButton() {
  const [location] = useLocation();
  const [isPressing, setIsPressing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [activePhase, setActivePhase] = useState<WarpPhase>('idle');
  const [gauge, setGauge] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [aiTemp, setAiTemp] = useState(0);
  const [currentTarget, setCurrentTarget] = useState<OmniWarpTarget | null>(null);
  const [isAborted, setIsAborted] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragDistance, setDragDistance] = useState(0);
  const [dragAngleDeg, setDragAngleDeg] = useState(0);
  const [radialSectorIndex, setRadialSectorIndex] = useState<number>(-1);

  const lastSectorRef = useRef<number>(-1);
  const cachedContextRef = useRef<OmniWarpContext | null>(null);
  const lastUpdateGaugeRef = useRef<number>(0);
  const lastStateUpdateTimeRef = useRef<number>(0);

  // Active view context and next destination pre-vision (수정구슬 영시)
  const currentContext = serializeCurrentView(location);
  const normPath = location.replace('/', '') || 'hub';
  const tossRule = getTossRule(normPath, `${currentContext.summary} ${currentContext.primarySubject || ''}`);
  
  // profile, handbook, library, omniwarp 4대 페이지는 워프 이동 대상에서 엄격 배제
  const sanitizeDest = (dest: any) => {
    if (!dest || isDisallowedWarpDestination(dest.id) || isDisallowedWarpDestination(dest.path)) {
      return {
        id: 'hub',
        name: '프롤로그 허브',
        subName: '프리즘 우주의 중심',
        path: '/',
        icon: '🏛️',
        description: '모든 차원의 영감과 가능성이 수렴하는 우주의 시초 허브',
        themeColor: '#00f0ff',
      };
    }
    return dest;
  };

  const globalWhitehole = getWhiteholeRecommendedApp(location);
  const globalBlackhole = getBlackholeRecommendedApp(location);
  const whiteholeApp = sanitizeDest({
    id: globalWhitehole.id,
    name: globalWhitehole.name,
    subName: globalWhitehole.subName,
    path: globalWhitehole.path,
    icon: globalWhitehole.icon,
    description: globalWhitehole.description,
    themeColor: globalWhitehole.themeColor,
  });
  const blackholeApp = sanitizeDest({
    id: globalBlackhole.id,
    name: globalBlackhole.name,
    subName: globalBlackhole.subName,
    path: globalBlackhole.path,
    icon: globalBlackhole.icon,
    description: globalBlackhole.description,
    themeColor: globalBlackhole.themeColor,
  });
  const secondaryDest = sanitizeDest(tossRule.secondary);
  const tertiaryDest = sanitizeDest(tossRule.tertiary);

  // 🎯 도약 목적지가 루시 채팅 또는 크리스탈 오브인지 실시간 판별
  const targetDestPath = (currentTarget?.destinationPath || (
    activePhase === 'blackhole' ? blackholeApp.path :
    activePhase === 'whitehole' ? whiteholeApp.path :
    activePhase === 'event_horizon' ? secondaryDest.path :
    whiteholeApp.path
  )).toLowerCase();

  const targetDestId = (currentTarget?.id || (
    activePhase === 'blackhole' ? blackholeApp.id :
    activePhase === 'whitehole' ? whiteholeApp.id :
    activePhase === 'event_horizon' ? secondaryDest.id :
    whiteholeApp.id
  )).toLowerCase();

  const isTargetLucy = (
    targetDestPath.includes('/chat') ||
    targetDestPath.includes('/lucy') ||
    targetDestId === 'lucy' ||
    targetDestId === 'chat'
  );

  const isTargetOrb = (
    targetDestPath.includes('/orb') ||
    targetDestPath.includes('/crystal') ||
    targetDestPath.includes('/gateway') ||
    targetDestId === 'orb' ||
    targetDestId === 'crystal' ||
    targetDestId === 'gateway'
  );

  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const touchStartRef = useRef<{ time: number; x: number; y: number } | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastPhaseRef = useRef<WarpPhase>('idle');
  const lastEventHorizonModeRef = useRef<'whitehole' | 'mirrorhole' | 'blackhole' | undefined>(undefined);
  const currentPointerEventRef = useRef<React.PointerEvent | null>(null);
  const hasTriggeredBlackHolePeakRef = useRef<boolean>(false);
  const lastStageRef = useRef<number>(1);

  // Real-time animation loop while pressing (60fps 고성능 최적화: 캐싱 & 스로틀링)
  const updateLoop = useCallback(() => {
    if (!touchStartRef.current) return;

    const now = performance.now();
    const start = touchStartRef.current;
    const currentPointer = currentPointerEventRef.current;

    const metrics = calculateWarpMetrics(
      start.time,
      now,
      start.x,
      start.y,
      currentPointer ? currentPointer.clientX : start.x,
      currentPointer ? currentPointer.clientY : start.y,
      currentPointer || undefined
    );

    const context = cachedContextRef.current || serializeCurrentView(location);
    const target = synthesizeWarpTarget(context, metrics);
    const temp = forceToAiTemperature(metrics.virtualForce);
    const sectorIdx = metrics.radialSectorIndex !== undefined ? metrics.radialSectorIndex : -1;

    // 중요한 상태 변경(섹터, 페이즈, 어보트)이 발생했거나 약 33ms(30fps) 경과 시 상태 일괄 동기화
    const isSectorChanged = sectorIdx !== lastSectorRef.current;
    const isPhaseChanged = metrics.phase !== lastPhaseRef.current;
    const isAbortedChanged = metrics.isAborted !== isAborted;
    const isGaugeSignificantlyChanged = Math.abs(metrics.virtualForce - lastUpdateGaugeRef.current) >= 0.04;
    const isTimeThrottled = now - lastStateUpdateTimeRef.current >= 32;

    if (isSectorChanged || isPhaseChanged || isAbortedChanged || isGaugeSignificantlyChanged || isTimeThrottled) {
      lastStateUpdateTimeRef.current = now;
      lastUpdateGaugeRef.current = metrics.virtualForce;

      setGauge(metrics.virtualForce);
      setDurationMs(metrics.durationMs);
      setAiTemp(temp);
      setActivePhase(metrics.phase);
      setCurrentTarget(target);
      setIsAborted(metrics.isAborted);
      setDragOffset({ x: metrics.dragOffsetX || 0, y: metrics.dragOffsetY || 0 });
      setDragDistance(metrics.dragDistance || 0);
      setDragAngleDeg(metrics.dragAngleDeg || 0);
      setRadialSectorIndex(sectorIdx);
    }

    // 🎯 방사형 조이스틱 각 앱 섹터 진입 시 기계식 마그네틱 틱 햅틱 진동
    if (sectorIdx !== -1 && sectorIdx !== lastSectorRef.current && !metrics.isAborted) {
      lastSectorRef.current = sectorIdx;
      triggerHaptic('whitehole');
    } else if (sectorIdx === -1) {
      lastSectorRef.current = -1;
    }

    // 🧲 마그네틱 래칫 햅틱
    const currentStage = target.stageIndex || 1;
    if (sectorIdx === -1 && currentStage !== lastStageRef.current && !metrics.isAborted) {
      lastStageRef.current = currentStage;
      triggerHaptic('whitehole');
    }

    // 🕳️ 블랙홀 단계 미세 진동 피드백
    if (metrics.virtualForce >= 0.85 && !metrics.isAborted && sectorIdx === -1) {
      startBlackHoleContinuousHaptic();
    } else {
      stopBlackHoleContinuousHaptic();
    }

    // Audio & Haptic triggers on phase transition
    if (metrics.phase !== lastPhaseRef.current && !metrics.isAborted) {
      if (metrics.phase === 'whitehole') {
        omniWarpAudio.playWhiteHole();
        triggerHaptic('whitehole');
      } else if (metrics.phase === 'mirrorhole') {
        omniWarpAudio.playMirrorHole();
        triggerHaptic('mirrorhole');
      } else if (metrics.phase === 'event_horizon') {
        omniWarpAudio.playEventHorizon();
        triggerHaptic('event_horizon');
      } else if (metrics.phase === 'blackhole') {
        omniWarpAudio.playBlackHole();
        triggerHaptic('blackhole');
      }
      lastPhaseRef.current = metrics.phase;
    }

    // 🌌 사건의 지평선 조준 상태에서 4단계 순환(화이트홀·미러홀·블랙홀·미러홀) 모드 변경 시 실시간 공명 햅틱 & 오디오 피드백
    if (metrics.phase === 'event_horizon' && !metrics.isAborted && metrics.eventHorizonMode) {
      if (metrics.eventHorizonMode !== lastEventHorizonModeRef.current) {
        lastEventHorizonModeRef.current = metrics.eventHorizonMode;
        if (metrics.eventHorizonMode === 'whitehole') {
          omniWarpAudio.playWhiteHole();
          triggerHaptic('whitehole');
        } else if (metrics.eventHorizonMode === 'mirrorhole') {
          omniWarpAudio.playMirrorHole();
          triggerHaptic('mirrorhole');
        } else if (metrics.eventHorizonMode === 'blackhole') {
          omniWarpAudio.playBlackHole();
          triggerHaptic('blackhole');
        }
      }
    } else if (metrics.phase !== 'event_horizon') {
      lastEventHorizonModeRef.current = undefined;
    }

    if (metrics.isAborted && lastPhaseRef.current !== 'aborted') {
      omniWarpAudio.playAbort();
      triggerHaptic('abort');
      lastPhaseRef.current = 'aborted';
    }

    rafRef.current = requestAnimationFrame(updateLoop);
  }, [location, isAborted]);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}

    const now = performance.now();
    touchStartRef.current = {
      time: now,
      x: e.clientX,
      y: e.clientY,
    };
    currentPointerEventRef.current = e;
    lastPhaseRef.current = 'wormhole';
    lastEventHorizonModeRef.current = undefined;
    lastSectorRef.current = -1;
    lastStageRef.current = 1;
    lastUpdateGaugeRef.current = 0.08;
    lastStateUpdateTimeRef.current = now;

    // 터치 시작 시 단 한 번만 직렬화하여 캐싱 (매 16ms마다 I/O 파싱 방지)
    const context = serializeCurrentView(location);
    cachedContextRef.current = context;

    setDragOffset({ x: 0, y: 0 });
    setDragDistance(0);
    setDragAngleDeg(0);
    setRadialSectorIndex(-1);
    setIsPressing(true);
    setIsAborted(false);
    setActivePhase('wormhole');
    setGauge(0.08);
    setDurationMs(0);

    const initialMetrics = calculateWarpMetrics(
      now,
      now,
      e.clientX,
      e.clientY,
      e.clientX,
      e.clientY,
      e
    );
    const target = synthesizeWarpTarget(context, initialMetrics);
    setCurrentTarget(target);

    omniWarpAudio.playBlackHole();
    triggerHaptic('blackhole');

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(updateLoop);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isPressing || !touchStartRef.current) return;
    currentPointerEventRef.current = e;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isPressing || !touchStartRef.current) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const start = touchStartRef.current;
    const now = performance.now();
    const metrics = calculateWarpMetrics(
      start.time,
      now,
      start.x,
      start.y,
      e.clientX,
      e.clientY,
      e
    );

    setIsPressing(false);
    touchStartRef.current = null;
    currentPointerEventRef.current = null;
    cachedContextRef.current = null;
    lastStageRef.current = 1;
    lastSectorRef.current = -1;
    lastEventHorizonModeRef.current = undefined;
    stopBlackHoleContinuousHaptic();
    setDragOffset({ x: 0, y: 0 });
    setDragDistance(0);
    setDragAngleDeg(0);
    setRadialSectorIndex(-1);

    if (metrics.isAborted || isAborted) {
      omniWarpAudio.playAbort();
      triggerHaptic('abort');
      setActivePhase('idle');
      setGauge(0);
      setDurationMs(0);
      setIsAborted(false);
      return;
    }

    setIsAborted(false);

    const context = serializeCurrentView(location);
    const target = synthesizeWarpTarget(context, metrics);

    if (isDisallowedWarpDestination(target.id || '') || isDisallowedWarpDestination(target.destinationPath || '')) {
      omniWarpAudio.playAbort();
      triggerHaptic('abort');
      setActivePhase('idle');
      setGauge(0);
      setDurationMs(0);
      return;
    }

    executeBigBangCommit(target, context, metrics);

    setActivePhase('idle');
    setGauge(0);
    setDurationMs(0);
  };

  const handlePointerCancel = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    stopBlackHoleContinuousHaptic();
    setIsPressing(false);
    setIsAborted(false);
    touchStartRef.current = null;
    currentPointerEventRef.current = null;
    cachedContextRef.current = null;
    lastStageRef.current = 1;
    lastSectorRef.current = -1;
    setDragOffset({ x: 0, y: 0 });
    setDragDistance(0);
    setDragAngleDeg(0);
    setRadialSectorIndex(-1);
    setActivePhase('idle');
    setGauge(0);
    setDurationMs(0);
  };

  useEffect(() => {
    return () => {
      stopBlackHoleContinuousHaptic();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // 🌟 위상 판별: 화이트홀(빛비춤), 미러홀(유리테마), 블랙홀(어둠효과)
  const isWhiteholeMode =
    activePhase === 'whitehole' ||
    (activePhase === 'event_horizon' && currentTarget?.eventHorizonMode === 'whitehole');

  const isMirrorholeMode =
    activePhase === 'mirrorhole' ||
    (activePhase === 'event_horizon' && currentTarget?.eventHorizonMode === 'mirrorhole');

  const isBlackholeMode =
    activePhase === 'blackhole' ||
    (activePhase === 'event_horizon' && currentTarget?.eventHorizonMode === 'blackhole');

  // 🎯 현재 활성화된 목적지의 상징 아이콘 식별자 결정 (프리즘 메인 아이콘 규격)
  const activeAppId = (() => {
    if (isAborted) return 'aborted';
    // 🌌 사건의 지평선 상태 (조준 중): 해당 조준 채널의 아이콘을 최우선으로 표출!
    if (radialSectorIndex >= 0) return RADIAL_WARP_APPS[radialSectorIndex]?.id || 'hub';
    // 🪞 제자리 홀드 - 미러홀은 프리즘 세모 아이콘
    if (isMirrorholeMode) return 'mirrorhole';
    // 🕳️ 제자리 홀드 - 블랙홀은 크리스탈 오브
    if (isBlackholeMode || isTargetOrb) return 'orb';
    // ⚪ 제자리 홀드 - 화이트홀은 루시 채팅
    if (isWhiteholeMode || isTargetLucy) return 'lucy';
    return currentTarget?.id || 'hub';
  })();

  const activeAppName = (() => {
    if (isAborted) return '취소';
    // 🌌 사건의 지평선 상태 (조준 중): 해당 조준 채널 및 서브메뉴 명칭 표출
    if (radialSectorIndex >= 0) {
      const channel = RADIAL_WARP_APPS[radialSectorIndex];
      const subTitle = currentTarget?.title || '';
      return subTitle ? `${channel?.name || ''} · ${subTitle}` : (channel?.name || '');
    }
    // 🪞 제자리 홀드 - 미러홀은 프리즘 홈
    if (isMirrorholeMode) return '미러홀 (프리즘 홈)';
    // 🕳️ 제자리 홀드 - 블랙홀은 크리스탈 오브
    if (isBlackholeMode || isTargetOrb) return '블랙홀 (크리스탈 오브)';
    // ⚪ 제자리 홀드 - 화이트홀은 루시
    if (isWhiteholeMode || isTargetLucy) return '화이트홀 (루시 채팅)';
    if (activePhase === 'event_horizon') return currentTarget?.title || '사건의 지평선';
    return currentTarget?.title || '프리즘 워프';
  })();

  return (
    <>
      {/* 🚀 2. Crystal Ball Big Bang Button (전체페이지 효과 제거, 버튼 내부 레이더 집중) */}
      <div
        className="fixed left-1/2 -translate-x-1/2 z-[350] pointer-events-none flex items-center justify-center select-none bottom-safe-fab"
      >
        <div
          className="group relative flex flex-col items-center justify-center pointer-events-auto select-none"
          onPointerEnter={() => setIsHovered(true)}
          onPointerLeave={() => setIsHovered(false)}
        >
          {/* 🎯 버튼 & 궤도 정밀 센터링 앵커 */}
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center shrink-0">
            {/* 🌟 빅뱅 아케인 마법진 매트릭스 (하드웨어 가속) */}
            <AnimatePresence>
              {!isPressing && (
                <motion.div
                  key="circular-meter-track"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: isHovered ? 1 : 0.85,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
                >
                  <BigBangCircularMeter
                    isPressing={false}
                    isHovered={isHovered}
                    gauge={gauge}
                    durationMs={durationMs}
                    activePhase={activePhase}
                    isAborted={isAborted}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Ambient Gravitational Ripple Waves */}
            {activePhase === 'idle' && (
              <>
                <div className="absolute -inset-2 rounded-full border border-cyan-400/25 animate-ping opacity-20 pointer-events-none" />
                <div className="absolute -inset-3.5 rounded-full border border-purple-400/15 animate-pulse opacity-30 pointer-events-none" />
              </>
            )}

            {/* 🎯 7대 앱 무지개 돌림판 방사형 조이스틱 HUD (버튼 홀드 시 전개) */}
            <AnimatePresence>
              {isPressing && (
                <>
                  {/* 1) 🌈 7색 무지개 테마: 아스트롤라베 천체 크로매틱 성운 & 부유 크리스탈 젬 시길 */}
                  <motion.div
                    key="rainbow-roulette-wheel"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{
                      scale: 1,
                      opacity: isAborted ? 0.35 : 1,
                    }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[184px] h-[184px] pointer-events-none z-22 flex items-center justify-center select-none"
                  >
                    {/* A. 🌌 살아 숨쉬는 에테르 크로매틱 디스퍼전 성운 오라 */}
                    <div
                      className="absolute inset-0 rounded-full pointer-events-none animate-[spin_24s_linear_infinite]"
                      style={{
                        background:
                          'conic-gradient(from -90deg, rgba(239,68,68,0.45) 0deg, rgba(249,115,22,0.45) 51.4deg, rgba(234,179,8,0.45) 102.8deg, rgba(16,185,129,0.45) 154.2deg, rgba(14,165,233,0.45) 205.7deg, rgba(79,70,229,0.45) 257.1deg, rgba(168,85,247,0.45) 308.6deg, rgba(239,68,68,0.45) 360deg)',
                        maskImage: 'radial-gradient(circle, transparent 46px, black 52px, black 82px, transparent 92px)',
                        WebkitMaskImage: 'radial-gradient(circle, transparent 46px, black 52px, black 82px, transparent 92px)',
                        filter: 'blur(6px)',
                        opacity: radialSectorIndex >= 0 ? 0.95 : 0.75,
                      }}
                    />

                    {/* B. 정밀 천체 아스트롤라베 좌표 림 & 미세 눈금 링 */}
                    <div className="absolute inset-[24px] rounded-full border border-white/25 pointer-events-none shadow-[0_0_20px_rgba(255,255,255,0.15)]" />
                    <div className="absolute inset-[10px] rounded-full border border-white/10 pointer-events-none" />

                    {/* C. ⚡ 조준된 앱으로 뻗어 나가는 양자 포톤 레이저 브릿지 */}
                    {radialSectorIndex >= 0 && !isAborted && (() => {
                      const sectorAngle = 360 / RADIAL_WARP_APPS.length;
                      const angleDeg = radialSectorIndex * sectorAngle;
                      const angleRad = (angleDeg * Math.PI) / 180;
                      const targetX = 66 * Math.sin(angleRad);
                      const targetY = -66 * Math.cos(angleRad);
                      const targetedApp = RADIAL_WARP_APPS[radialSectorIndex];

                      return (
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-15 overflow-visible">
                          <defs>
                            <linearGradient id="quantum-laser-beam" x1="92" y1="92" x2={92 + targetX} y2={92 + targetY} gradientUnits="userSpaceOnUse">
                              <stop offset="0%" stopColor="#ffffff" stopOpacity={0.95} />
                              <stop offset="60%" stopColor={targetedApp.themeColor} stopOpacity={0.85} />
                              <stop offset="100%" stopColor={targetedApp.themeColor} stopOpacity={1} />
                            </linearGradient>
                            <filter id="laser-glow-filter" x="-20%" y="-20%" width="140%" height="140%">
                              <feGaussianBlur stdDeviation="3" result="glow" />
                              <feMerge>
                                <feMergeNode in="glow" />
                                <feMergeNode in="SourceGraphic" />
                              </feMerge>
                            </filter>
                          </defs>
                          {/* 외곽 글로우 레이저 */}
                          <line
                            x1={92}
                            y1={92}
                            x2={92 + targetX}
                            y2={92 + targetY}
                            stroke="url(#quantum-laser-beam)"
                            strokeWidth={3}
                            strokeLinecap="round"
                            filter="url(#laser-glow-filter)"
                          />
                          {/* 코어 순백 광자선 */}
                          <line
                            x1={92}
                            y1={92}
                            x2={92 + targetX}
                            y2={92 + targetY}
                            stroke="#ffffff"
                            strokeWidth={1.2}
                            strokeLinecap="round"
                          />
                        </svg>
                      );
                    })()}

                    {/* D. 💎 7대 앱 부유 크리스탈 젬 시길 노드 */}
                    {RADIAL_WARP_APPS.map((app, idx) => {
                      const sectorAngle = 360 / RADIAL_WARP_APPS.length;
                      const angleDeg = idx * sectorAngle;
                      const angleRad = (angleDeg * Math.PI) / 180;
                      // 궤도 반경 R = 66px
                      const nodeX = 66 * Math.sin(angleRad);
                      const nodeY = -66 * Math.cos(angleRad);
                      const isSelected = radialSectorIndex === idx && !isAborted;

                      return (
                        <motion.div
                          key={`crystal-node-${app.id}`}
                          animate={{
                            x: nodeX,
                            y: nodeY,
                            scale: isSelected ? 1.34 : 1.0,
                          }}
                          transition={{ type: 'spring', stiffness: 480, damping: 25 }}
                          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex flex-col items-center justify-center select-none pointer-events-none transition-all duration-200 ${
                            isSelected
                              ? 'bg-white/35 border-2 border-white backdrop-blur-2xl'
                              : 'bg-slate-950/80 border border-white/25 backdrop-blur-xl'
                          }`}
                          style={{
                            boxShadow: isSelected
                              ? `0 0 32px ${app.accentGlow}, 0 0 16px #ffffff, 0 8px 24px rgba(0,0,0,0.85)`
                              : `0 4px 16px rgba(0,0,0,0.7), inset 0 1px 1.5px rgba(255,255,255,0.3), 0 0 12px ${app.themeColor}33`,
                          }}
                        >
                          {/* 상단 다이아몬드 곡면 반사광 */}
                          <div
                            className="absolute top-0.5 left-1.5 w-4 h-1.5 rounded-full pointer-events-none -rotate-12"
                            style={{
                              background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.7) 0%, transparent 80%)',
                            }}
                          />

                          {/* 앱 아이콘 (순수 흰색 벡터) */}
                          <PrismAppIcon
                            nameOrId={app.id}
                            size={isSelected ? 19 : 16}
                            color="#ffffff"
                            className={
                              isSelected
                                ? 'text-white drop-shadow-[0_0_10px_#ffffff]'
                                : 'text-white/95 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]'
                            }
                          />

                          {/* 하단 영롱한 젬스톤 발광 도트 */}
                          <div
                            className={`w-1.5 h-1.5 rounded-full transition-all duration-150 mt-0.5 ${
                              isSelected ? 'scale-125' : 'opacity-85'
                            }`}
                            style={{
                              backgroundColor: app.themeColor,
                              boxShadow: isSelected
                                ? `0 0 10px ${app.themeColor}, 0 0 5px #ffffff`
                                : `0 0 5px ${app.themeColor}`,
                            }}
                          />
                        </motion.div>
                      );
                    })}

                    {/* E. 🛸 실시간 조준 홀로그램 타깃 배지 (앱 명칭 + 룬 상징) */}
                    {radialSectorIndex >= 0 && !isAborted && (() => {
                      const targetedApp = RADIAL_WARP_APPS[radialSectorIndex];
                      return (
                        <motion.div
                          key={`target-pill-${targetedApp.id}`}
                          initial={{ opacity: 0, y: 6, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.9 }}
                          transition={{ duration: 0.15 }}
                          className="absolute -top-11 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/90 border backdrop-blur-2xl pointer-events-none z-30 whitespace-nowrap shadow-[0_8px_30px_rgba(0,0,0,0.9)]"
                          style={{
                            borderColor: `${targetedApp.themeColor}99`,
                            boxShadow: `0 0 20px ${targetedApp.accentGlow}, 0 8px 30px rgba(0,0,0,0.9)`,
                          }}
                        >
                          <span className="text-xs font-mono font-bold" style={{ color: targetedApp.themeColor }}>
                            {targetedApp.runeSymbol}
                          </span>
                          <span className="text-xs font-semibold text-white tracking-wide">
                            {targetedApp.name}
                          </span>
                          <span className="text-[10px] text-white/70 font-medium">
                            {targetedApp.title.replace(targetedApp.name, '').trim()}
                          </span>
                        </motion.div>
                      );
                    })()}
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            <motion.button
              ref={buttonRef}
              type="button"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                x: isPressing
                  ? isAborted
                    ? (dragDistance > 0 ? (dragOffset.x * Math.min(dragDistance * 0.7, 44)) / dragDistance : 0)
                    : (dragDistance > 0 ? (dragOffset.x * Math.min(dragDistance * 0.65, 38)) / dragDistance : 0)
                  : 0,
                y: isPressing
                  ? isAborted
                    ? (dragDistance > 0 ? (dragOffset.y * Math.min(dragDistance * 0.7, 44)) / dragDistance : 0)
                    : (dragDistance > 0 ? (dragOffset.y * Math.min(dragDistance * 0.65, 38)) / dragDistance : 0)
                  : 0,
                scale: isPressing
                  ? (1.08 + gauge * 0.1)
                  : 1.0,
              }}
              transition={{
                duration: 0.08,
              }}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex flex-col items-center justify-center shrink-0 cursor-pointer outline-none relative overflow-hidden transition-all duration-200 border will-change-transform ${
                isPressing && isAborted
                  ? 'opacity-75 border-red-500/80 shadow-[0_0_25px_rgba(239,68,68,0.8)]'
                  : radialSectorIndex >= 0 && !isMirrorholeMode
                  ? 'border-white shadow-[0_0_30px_rgba(255,255,255,0.9)]'
                  : isWhiteholeMode
                  ? 'border-2 border-white/95 shadow-[0_0_45px_rgba(255,255,255,0.95),0_0_85px_rgba(251,191,36,0.85),0_0_140px_rgba(245,158,11,0.5)]'
                  : isMirrorholeMode
                  ? 'border border-white/90 shadow-[inset_0_2px_4px_rgba(255,255,255,0.95),inset_0_-2px_6px_rgba(56,189,248,0.4),0_0_35px_rgba(255,255,255,0.7),0_0_70px_rgba(56,189,248,0.45)] backdrop-blur-3xl'
                  : isBlackholeMode
                  ? 'border-2 border-cyan-300/95 shadow-[inset_0_0_25px_rgba(168,85,247,0.9),0_0_45px_rgba(0,240,255,0.85),0_0_90px_rgba(168,85,247,0.7),0_0_140px_rgba(56,189,248,0.4)] backdrop-blur-3xl'
                  : 'border-cyan-400/40 hover:border-cyan-300/80 shadow-[0_0_20px_rgba(56,189,248,0.3)]'
              }`}
              style={{
                background: !isPressing
                  ? 'radial-gradient(circle at 35% 30%, #15162c 0%, #0d0e1d 45%, #05060f 80%, #020207 100%)'
                  : isWhiteholeMode
                  ? 'radial-gradient(circle at 45% 35%, #ffffff 0%, #fffbeb 25%, #fef08a 55%, #f59e0b 90%, #d97706 100%)'
                  : isMirrorholeMode
                  ? 'radial-gradient(circle at 35% 25%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.08) 45%, rgba(14,165,233,0.15) 80%, rgba(168,85,247,0.2) 100%)'
                  : isBlackholeMode
                  ? 'radial-gradient(circle at 50% 50%, #000000 0%, #02030a 50%, #09081a 80%, #0b132b 100%)'
                  : radialSectorIndex >= 0
                  ? `radial-gradient(circle at 50% 50%, ${RADIAL_WARP_APPS[radialSectorIndex].themeColor}55 0%, #080918 80%)`
                  : '#080918',
                boxShadow: (isPressing && isAborted)
                  ? 'inset 0 0 16px rgba(239, 68, 68, 0.5), 0 0 20px rgba(239, 68, 68, 0.6)'
                  : radialSectorIndex >= 0 && !isMirrorholeMode
                  ? `inset 0 0 20px ${RADIAL_WARP_APPS[radialSectorIndex].themeColor}, 0 0 35px ${RADIAL_WARP_APPS[radialSectorIndex].accentGlow}`
                  : !isPressing
                  ? 'inset 0 0 18px rgba(56, 189, 248, 0.25), inset -5px -5px 14px rgba(0, 0, 0, 0.9), 0 0 25px rgba(56, 189, 248, 0.3)'
                  : isWhiteholeMode
                  ? 'inset 0 0 25px rgba(255, 255, 255, 1), 0 0 45px rgba(255, 255, 255, 0.95), 0 0 85px rgba(251, 191, 36, 0.85)'
                  : isMirrorholeMode
                  ? 'inset 0 2px 4px rgba(255, 255, 255, 0.95), inset 0 -2px 6px rgba(56, 189, 248, 0.4), 0 0 35px rgba(255, 255, 255, 0.7)'
                  : isBlackholeMode
                  ? 'inset 0 0 25px rgba(168, 85, 247, 0.9), 0 0 45px rgba(0, 240, 255, 0.85), 0 0 90px rgba(168, 85, 247, 0.7)'
                  : 'inset 0 0 18px rgba(168, 85, 247, 0.5), 0 0 25px rgba(168, 85, 247, 0.5)',
              }}
              aria-label={`빅뱅 차원 도약 · 탭: 웜홀 양자도약, 홀드: 화이트홀(빛) - 미러홀(유리) - 블랙홀(심연), 조준/튕기기: 사건의 지평선`}
            >
              {/* 📡 1. 버튼 내부 핵심 위상 효과 (화이트홀: 빛비춤 -> 미러홀: 유리 -> 블랙홀: 암흑) */}
              {isPressing && !isAborted && (
                <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none z-10">
                  {/* ☀️ 1-A. 화이트홀: 빛비춤 (천상의 태양 초신성 광휘 & 8축 아나모픽 스타버스트) */}
                  {isWhiteholeMode && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      {/* 부드러운 온기 품은 태양 중심 코어 광채 */}
                      <div
                        className="absolute inset-0 rounded-full animate-pulse pointer-events-none"
                        style={{
                          background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.98) 0%, rgba(254,243,199,0.85) 40%, rgba(251,146,60,0.45) 75%, transparent 100%)',
                        }}
                      />
                      {/* 회전하는 8축 천체 스타버스트 볼류메트릭 라이트 샤프트 */}
                      <div className="absolute inset-0 flex items-center justify-center animate-[spin_20s_linear_infinite] pointer-events-none">
                        {/* 십자 메인 라이트 빔 (부드러운 가우시안 폴오프) */}
                        <div className="absolute w-full h-3.5 bg-gradient-to-r from-transparent via-white/85 to-transparent blur-[1.5px]" />
                        <div className="absolute h-full w-3.5 bg-gradient-to-b from-transparent via-white/85 to-transparent blur-[1.5px]" />
                        {/* 45도 대각 앰버 보조 광선 */}
                        <div className="absolute w-full h-2.5 rotate-45 bg-gradient-to-r from-transparent via-amber-100/75 to-transparent blur-[1.2px]" />
                        <div className="absolute w-full h-2.5 -rotate-45 bg-gradient-to-r from-transparent via-amber-100/75 to-transparent blur-[1.2px]" />
                      </div>
                      {/* 팽창하는 태양 코로나 쇼크웨이브 링 */}
                      <div className="absolute inset-1.5 rounded-full border border-white/60 animate-ping opacity-30" />
                      {/* 중심 순백 다이아몬드 스파클 코어 */}
                      <div className="absolute w-4 h-4 rounded-full bg-white shadow-[0_0_16px_#ffffff,0_0_28px_#fde047] pointer-events-none" />
                    </div>
                  )}

                  {/* 🪞 1-B. 미러홀: 유리 (바카라·스와로브스키 급 광학 다이아몬드 프리즘 글래스 렌즈) */}
                  {isMirrorholeMode && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none backdrop-blur-3xl overflow-hidden">
                      {/* A. 렌즈 표면을 유려하게 훑고 지나가는 스페큘러 코스틱 라이트 스윕 */}
                      <div
                        className="absolute -inset-full w-[300%] h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -rotate-45 pointer-events-none animate-[pulse_2.5s_ease-in-out_infinite]"
                      />
                      {/* B. 좌상단 프리즘 크로매틱 디스퍼전 엣지 (온화한 앰버-골드 굴절광) */}
                      <div
                        className="absolute -top-1 -left-1 w-8 h-8 rounded-full pointer-events-none blur-[1px]"
                        style={{
                          background: 'radial-gradient(circle at 30% 30%, rgba(254,215,170,0.6) 0%, transparent 70%)',
                        }}
                      />
                      {/* C. 우하단 프리즘 크로매틱 디스퍼전 엣지 (신비로운 사이언-바이올렛 굴절광) */}
                      <div
                        className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full pointer-events-none blur-[1px]"
                        style={{
                          background: 'radial-gradient(circle at 70% 70%, rgba(168,85,247,0.5) 0%, rgba(56,189,248,0.4) 50%, transparent 80%)',
                        }}
                      />
                      {/* D. 기하학적 정밀 다이아몬드 컷 파셋 라인 */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
                        <line x1="20%" y1="35%" x2="80%" y2="35%" stroke="white" strokeWidth="0.8" strokeDasharray="2 3" />
                        <line x1="20%" y1="65%" x2="80%" y2="65%" stroke="white" strokeWidth="0.8" strokeDasharray="2 3" />
                        <circle cx="50%" cy="50%" r="42%" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
                      </svg>
                      {/* E. 럭셔리 사파이어 글래스 상단 곡면 반사광 */}
                      <div
                        className="absolute top-1 left-2 sm:left-3 w-8 h-3 rounded-full pointer-events-none -rotate-[22deg]"
                        style={{
                          background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.95) 0%, transparent 75%)',
                        }}
                      />
                    </div>
                  )}

                  {/* 🕳️ 1-C. 블랙홀: 암흑 (가르강튀아 급 상대론적 강착원반 플라즈마 & 사건의 지평선 특이점) */}
                  {isBlackholeMode && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none backdrop-blur-3xl overflow-hidden">
                      {/* A. 초고속 회전하는 상대론적 강착원반 플라즈마 보텍스 */}
                      <div
                        className="absolute inset-0.5 rounded-full pointer-events-none animate-[spin_3.5s_linear_infinite]"
                        style={{
                          background: 'conic-gradient(from 0deg, #00f0ff 0deg, #a855f7 90deg, #02030a 180deg, #00f0ff 270deg, #a855f7 360deg)',
                          maskImage: 'radial-gradient(circle, transparent 52%, black 58%, black 90%, transparent 98%)',
                          WebkitMaskImage: 'radial-gradient(circle, transparent 52%, black 58%, black 90%, transparent 98%)',
                          filter: 'blur(1.5px)',
                          opacity: 0.95,
                        }}
                      />
                      {/* B. 중력 렌즈 안쪽으로 빨려 들어가는 흡입 파동 (Gravitational Inward Contraction) */}
                      <div className="absolute inset-2 rounded-full border border-cyan-400/50 animate-ping opacity-25" />
                      <div className="absolute inset-3 rounded-full border border-purple-400/40 animate-pulse opacity-40" />
                      {/* C. 슈바르츠실트 포톤 스피어 초정밀 네온 림 */}
                      <div className="absolute inset-1.5 rounded-full border border-cyan-300/70 shadow-[inset_0_0_12px_rgba(0,240,255,0.8)] pointer-events-none" />
                      {/* D. 중심 심연 특이점 보이드 (순수 암흑 코어) */}
                      <div className="absolute inset-3 rounded-full bg-black shadow-[inset_0_0_15px_rgba(0,0,0,1)] pointer-events-none" />
                    </div>
                  )}
                </div>
              )}

              {/* 기본 대기 상태일 때의 은은한 회전 볼텍스 링 */}
              {!isPressing && (
                <div
                  className="absolute inset-0 rounded-full pointer-events-none z-10 transition-opacity duration-200 animate-[spin_10s_linear_infinite] opacity-50"
                  style={{
                    background:
                      'conic-gradient(from 0deg, rgba(168,85,247,0.7) 0deg, rgba(15,17,36,0.9) 120deg, rgba(192,132,252,0.6) 240deg, rgba(168,85,247,0.7) 360deg)',
                  }}
                />
              )}

              {/* Event Horizon Deep Singularity Core (대기 시 및 조준 시 내부 구체) */}
              <div
                className="absolute inset-2 sm:inset-2.5 rounded-full z-15 pointer-events-none transition-all duration-200 overflow-hidden flex items-center justify-center"
                style={{
                  background: isWhiteholeMode || isMirrorholeMode || isBlackholeMode
                    ? 'transparent'
                    : 'radial-gradient(circle at 45% 35%, #0f1124 0%, #080916 55%, #030309 100%)',
                  boxShadow: isWhiteholeMode || isMirrorholeMode || isBlackholeMode
                    ? 'none'
                    : 'inset 0 0 12px rgba(0, 0, 0, 0.95)',
                }}
              />

              {/* 🎯 Big Bang Center: 프리즘 메인 Lucide 아이콘 표출 (사건의 지평선 시 해당 조준 채널 아이콘) */}
              <div className="relative z-20 w-full h-full rounded-full flex items-center justify-center text-center select-none pointer-events-none">
                {isPressing ? (
                  <motion.div
                    key={`active-icon-${activeAppId}`}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.12 }}
                    className="relative flex flex-col items-center justify-center"
                  >
                    {/* 은은한 앰비언트 글로우 오라 */}
                    <div
                      className="absolute -inset-2 rounded-full pointer-events-none blur-[6px] opacity-80"
                      style={{
                        background: radialSectorIndex >= 0 && !isMirrorholeMode
                          ? `radial-gradient(circle, ${RADIAL_WARP_APPS[radialSectorIndex].themeColor} 0%, transparent 80%)`
                          : isAborted
                          ? 'radial-gradient(circle, rgba(239,68,68,0.8) 0%, transparent 80%)'
                          : isWhiteholeMode
                          ? 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(253,230,138,0.7) 50%, transparent 80%)'
                          : isMirrorholeMode || isBlackholeMode
                          ? 'transparent'
                          : 'radial-gradient(circle, rgba(168,85,247,0.8) 0%, transparent 80%)',
                      }}
                    />

                    {/* ✨ 프리즘 메인 아이콘을 선명하게 표시 (루시: 별빛 스파클, 오브: 크리스탈 오브 구체) */}
                    <div
                      className="relative z-10 flex items-center justify-center select-none"
                      title={activeAppName}
                    >
                      <PrismAppIcon
                        nameOrId={activeAppId}
                        size={isWhiteholeMode ? 24 : isMirrorholeMode ? 25 : 26}
                        color={
                          isAborted
                            ? '#ef4444'
                            : radialSectorIndex >= 0 && !isMirrorholeMode
                            ? RADIAL_WARP_APPS[radialSectorIndex]?.themeColor || '#ffffff'
                            : isWhiteholeMode
                            ? '#ffffff'
                            : isMirrorholeMode
                            ? '#38bdf8'
                            : isBlackholeMode
                            ? '#38bdf8'
                            : '#ffffff'
                        }
                        className={
                          isWhiteholeMode
                            ? 'text-white drop-shadow-[0_0_14px_#ffffff,0_0_28px_rgba(251,191,36,0.9)]'
                            : isMirrorholeMode
                            ? 'text-sky-200 drop-shadow-[0_0_14px_rgba(56,189,248,0.95),0_0_24px_rgba(255,255,255,0.8)]'
                            : isBlackholeMode
                            ? 'text-cyan-300 drop-shadow-[0_0_15px_#00f0ff,0_0_30px_rgba(168,85,247,0.9)]'
                            : 'drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]'
                        }
                      />
                    </div>
                  </motion.div>
                ) : (
                  /* 대기 상태: 궤도 색감과 공명하는 은은한 싱귤래리티 코어 */
                  <div className="relative flex items-center justify-center pointer-events-none">
                    <div className="w-2 h-2 rounded-full bg-cyan-300/60 blur-[1px] animate-pulse" />
                    <div className="absolute w-3.5 h-3.5 rounded-full border border-cyan-400/30 animate-ping opacity-40" />
                  </div>
                )}
              </div>
            </motion.button>
          </div>
        </div>
      </div>
    </>
  );
}
