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

const R_ROULETTE_OUTER = 88;
const R_ROULETTE_INNER = 28;
const ROULETTE_SECTOR_ANGLE = 360 / 7; // ~51.42857°

function getRainbowRouletteSectorPath(
  index: number,
  rIn = R_ROULETTE_INNER,
  rOut = R_ROULETTE_OUTER,
  gapDeg = 2.4
): string {
  const midDeg = index * ROULETTE_SECTOR_ANGLE;
  const halfSpan = (ROULETTE_SECTOR_ANGLE - gapDeg) / 2;
  const startDeg = midDeg - halfSpan;
  const endDeg = midDeg + halfSpan;
  const startRad = (startDeg * Math.PI) / 180;
  const endRad = (endDeg * Math.PI) / 180;

  // 12 o'clock is 0°
  const xOut1 = rOut * Math.sin(startRad);
  const yOut1 = -rOut * Math.cos(startRad);
  const xOut2 = rOut * Math.sin(endRad);
  const yOut2 = -rOut * Math.cos(endRad);

  const xIn1 = rIn * Math.sin(startRad);
  const yIn1 = -rIn * Math.cos(startRad);
  const xIn2 = rIn * Math.sin(endRad);
  const yIn2 = -rIn * Math.cos(endRad);

  return `M ${xIn1.toFixed(2)} ${yIn1.toFixed(2)} L ${xOut1.toFixed(2)} ${yOut1.toFixed(2)} A ${rOut} ${rOut} 0 0 1 ${xOut2.toFixed(2)} ${yOut2.toFixed(2)} L ${xIn2.toFixed(2)} ${yIn2.toFixed(2)} A ${rIn} ${rIn} 0 0 0 ${xIn1.toFixed(2)} ${yIn1.toFixed(2)} Z`;
}

function getRainbowRouletteOuterArc(
  index: number,
  rOut = R_ROULETTE_OUTER,
  gapDeg = 2.4
): string {
  const midDeg = index * ROULETTE_SECTOR_ANGLE;
  const halfSpan = (ROULETTE_SECTOR_ANGLE - gapDeg) / 2;
  const startDeg = midDeg - halfSpan;
  const endDeg = midDeg + halfSpan;
  const startRad = (startDeg * Math.PI) / 180;
  const endRad = (endDeg * Math.PI) / 180;

  const xOut1 = rOut * Math.sin(startRad);
  const yOut1 = -rOut * Math.cos(startRad);
  const xOut2 = rOut * Math.sin(endRad);
  const yOut2 = -rOut * Math.cos(endRad);

  return `M ${xOut1.toFixed(2)} ${yOut1.toFixed(2)} A ${rOut} ${rOut} 0 0 1 ${xOut2.toFixed(2)} ${yOut2.toFixed(2)}`;
}

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
                  {/* 1) 🌈 7색 무지개 돌림판 (Sleek Prismatic Smoked Glass & Neon Laser Arc HUD) */}
                  <motion.div
                    key="rainbow-roulette-wheel"
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{
                      scale: 1,
                      opacity: isAborted ? 0.35 : 1,
                    }}
                    exit={{ scale: 0.7, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[184px] h-[184px] pointer-events-none z-22 flex items-center justify-center select-none"
                  >
                    <svg
                      width="184"
                      height="184"
                      viewBox="-92 -92 184 184"
                      className="w-full h-full drop-shadow-[0_0_24px_rgba(0,0,0,0.8)]"
                    >
                      {/* 7개 무지개 섹션 슬라이스 (빨·주·노·초·파·남·보 스모크 글래스 & 네온 림) */}
                      {RADIAL_WARP_APPS.map((app, idx) => {
                        const isSelected = radialSectorIndex === idx && !isAborted;
                        const sectorPath = getRainbowRouletteSectorPath(idx, 29, 87, 2.4);
                        const outerArc = getRainbowRouletteOuterArc(idx, 87, 2.4);

                        return (
                          <g key={`roulette-sector-${app.id}`}>
                            {/* 베이스 흑요석 스모크 글래스 섹터 바디 */}
                            <path
                              d={sectorPath}
                              fill="rgba(10, 14, 28, 0.75)"
                              stroke="rgba(255, 255, 255, 0.12)"
                              strokeWidth={0.8}
                              className="transition-all duration-150"
                            />

                            {/* 세련된 무지개 스펙트럼 틴트 & 액티브 글로우 */}
                            <path
                              d={sectorPath}
                              fill={app.themeColor}
                              fillOpacity={isSelected ? 0.45 : 0.14}
                              stroke={isSelected ? '#ffffff' : 'transparent'}
                              strokeWidth={isSelected ? 2 : 0}
                              className="transition-all duration-150"
                              style={{
                                filter: isSelected
                                  ? `drop-shadow(0 0 14px ${app.accentGlow}) drop-shadow(0 0 4px #ffffff)`
                                  : undefined,
                              }}
                            />

                            {/* ⚡ 외곽 네온 레이저 아크 림 (유치하지 않은 샤프한 엣지 라인) */}
                            <path
                              d={outerArc}
                              fill="none"
                              stroke={isSelected ? '#ffffff' : app.themeColor}
                              strokeWidth={isSelected ? 3.2 : 1.8}
                              strokeLinecap="round"
                              className="transition-all duration-150"
                              style={{
                                filter: isSelected
                                  ? `drop-shadow(0 0 10px ${app.accentGlow}) drop-shadow(0 0 6px #ffffff)`
                                  : `drop-shadow(0 0 4px ${app.accentGlow})`,
                              }}
                            />
                          </g>
                        );
                      })}

                      {/* 🎛️ 하이엔드 크로노그래프 스타일 정밀 HUD 외곽 림 */}
                      <circle
                        cx="0"
                        cy="0"
                        r="90.5"
                        fill="none"
                        stroke={
                          isAborted
                            ? 'rgba(239, 68, 68, 0.85)'
                            : radialSectorIndex >= 0
                            ? 'rgba(255, 255, 255, 0.65)'
                            : 'rgba(255, 255, 255, 0.25)'
                        }
                        strokeWidth="0.8"
                        strokeDasharray={radialSectorIndex >= 0 ? undefined : '2 3'}
                        className="transition-colors duration-150"
                      />

                      {/* 7개 경계부 정밀 틱 마크 (외곽 방사형 레이저 눈금) */}
                      {RADIAL_WARP_APPS.map((_, idx) => {
                        const angleDeg = (idx + 0.5) * ROULETTE_SECTOR_ANGLE;
                        const rad = (angleDeg * Math.PI) / 180;
                        const x1 = 88.5 * Math.sin(rad);
                        const y1 = -88.5 * Math.cos(rad);
                        const x2 = 91.5 * Math.sin(rad);
                        const y2 = -91.5 * Math.cos(rad);
                        return (
                          <line
                            key={`tick-${idx}`}
                            x1={x1.toFixed(2)}
                            y1={y1.toFixed(2)}
                            x2={x2.toFixed(2)}
                            y2={y2.toFixed(2)}
                            stroke="rgba(255, 255, 255, 0.4)"
                            strokeWidth="1"
                          />
                        );
                      })}

                      {/* 돌림판 안쪽 미세 정밀 림 */}
                      <circle
                        cx="0"
                        cy="0"
                        r="27.5"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.35)"
                        strokeWidth="1"
                      />
                    </svg>
                  </motion.div>

                  {/* 2) 7대 앱 아이콘: 동그라미 배경 없이 순수 하얀색 아이콘으로 표출 */}
                  {RADIAL_WARP_APPS.map((app, idx) => {
                    const sectorAngle = 360 / RADIAL_WARP_APPS.length;
                    const angleDeg = idx * sectorAngle;
                    const angleRad = (angleDeg * Math.PI) / 180;
                    // 돌림판 슬라이스 정중앙 반경 (29 + 87)/2 = 58px
                    const nodeX = 58 * Math.sin(angleRad);
                    const nodeY = -58 * Math.cos(angleRad);
                    const isSelected = radialSectorIndex === idx && !isAborted;

                    return (
                      <motion.div
                        key={app.id}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{
                          scale: isSelected ? 1.35 : 1.0,
                          opacity: isAborted ? 0.3 : isSelected ? 1 : 0.92,
                          x: nodeX,
                          y: nodeY,
                        }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30 flex items-center justify-center select-none"
                      >
                        <PrismAppIcon
                          nameOrId={app.id}
                          size={isSelected ? 22 : 18}
                          color="#ffffff"
                          className={
                            isSelected
                              ? 'text-white drop-shadow-[0_0_12px_#ffffff] transition-transform'
                              : 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] transition-transform'
                          }
                        />
                      </motion.div>
                    );
                  })}
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
              }}
              transition={{
                duration: 0.08,
              }}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex flex-col items-center justify-center shrink-0 cursor-pointer outline-none relative overflow-hidden transition-all duration-200 border will-change-transform ${
                isPressing && isAborted
                  ? 'opacity-75 border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.7)]'
                  : radialSectorIndex >= 0 && !isMirrorholeMode
                  ? 'scale-110 border-white shadow-[0_0_25px_rgba(255,255,255,0.8)]'
                  : isWhiteholeMode
                  ? 'scale-110 border-white shadow-[0_0_30px_rgba(255,255,255,1),0_0_50px_rgba(56,189,248,0.8)]'
                  : isMirrorholeMode
                  ? 'scale-110 border-white/80 shadow-[0_0_22px_rgba(255,255,255,0.6)] backdrop-blur-md'
                  : isBlackholeMode
                  ? 'scale-110 border-cyan-400/80 shadow-[0_0_25px_rgba(56,189,248,0.5),0_0_40px_rgba(168,85,247,0.45)] backdrop-blur-md'
                  : 'border-cyan-400/40 hover:border-cyan-300/80 shadow-[0_0_20px_rgba(56,189,248,0.3)]'
              }`}
              style={{
                background: !isPressing
                  ? 'radial-gradient(circle at 35% 30%, #15162c 0%, #0d0e1d 45%, #05060f 80%, #020207 100%)'
                  : isWhiteholeMode
                  ? 'radial-gradient(circle at 50% 50%, #ffffff 0%, #f0fdf4 25%, #e0f2fe 55%, #38bdf8 90%, #0284c7 100%)'
                  : isMirrorholeMode || isBlackholeMode
                  ? 'transparent'
                  : '#080918',
                boxShadow: (isPressing && isAborted)
                  ? 'inset 0 0 16px rgba(239, 68, 68, 0.5), 0 0 20px rgba(239, 68, 68, 0.6)'
                  : radialSectorIndex >= 0 && !isMirrorholeMode
                  ? `inset 0 0 18px ${RADIAL_WARP_APPS[radialSectorIndex].themeColor}, 0 0 28px ${RADIAL_WARP_APPS[radialSectorIndex].accentGlow}`
                  : !isPressing
                  ? 'inset 0 0 18px rgba(56, 189, 248, 0.25), inset -5px -5px 14px rgba(0, 0, 0, 0.9), 0 0 25px rgba(56, 189, 248, 0.3)'
                  : isWhiteholeMode
                  ? 'inset 0 0 25px rgba(255, 255, 255, 1), 0 0 35px rgba(56, 189, 248, 0.9)'
                  : isMirrorholeMode
                  ? 'inset 0 0 12px rgba(255, 255, 255, 0.5), 0 0 20px rgba(255, 255, 255, 0.4)'
                  : isBlackholeMode
                  ? 'inset 0 0 12px rgba(56, 189, 248, 0.4), 0 0 22px rgba(168, 85, 247, 0.45)'
                  : 'inset 0 0 18px rgba(168, 85, 247, 0.5), 0 0 25px rgba(168, 85, 247, 0.5)',
              }}
              aria-label={`빅뱅 차원 도약 · 탭: 웜홀 양자도약, 홀드: 화이트홀(빛) - 미러홀(유리) - 블랙홀(심연), 조준/튕기기: 사건의 지평선`}
            >
              {/* 📡 1. 버튼 내부 레이더 스위프 효과 (화이트홀: 빛비춤 -> 미러홀: 유리 -> 블랙홀: 어두움) */}
              {isPressing && !isAborted && (
                <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none z-10">
                  {/* ☀️ 1-A. 화이트홀 빛비춤 레이더 (심플하고 화려한 엣지 렌즈 플레어 & 레이저 스위프) */}
                  {isWhiteholeMode && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      {/* 정밀 동심 광학 링 3단계 (초슬림 헤어라인) */}
                      <div className="absolute inset-1 rounded-full border-[0.75px] border-white/60 pointer-events-none" />
                      <div className="absolute inset-2.5 rounded-full border-[0.5px] border-cyan-100/40 pointer-events-none" />
                      <div className="absolute inset-4 rounded-full border-[0.75px] border-white/75 pointer-events-none" />

                      {/* 엣지있는 아나모픽 십자 렌즈 플레어 (초미세 수평/수직 레이저 광선) */}
                      <div className="absolute w-full h-[0.75px] bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none drop-shadow-[0_0_4px_#ffffff]" />
                      <div className="absolute h-full w-[0.75px] bg-gradient-to-b from-transparent via-white to-transparent pointer-events-none drop-shadow-[0_0_4px_#ffffff]" />

                      {/* 45도 다이아몬드 스파이크 레이저 광선 */}
                      <div className="absolute w-10 h-[0.5px] rotate-45 bg-gradient-to-r from-transparent via-cyan-100/90 to-transparent pointer-events-none" />
                      <div className="absolute w-10 h-[0.5px] -rotate-45 bg-gradient-to-r from-transparent via-cyan-100/90 to-transparent pointer-events-none" />

                      {/* 360도 초정밀 레이저 비콘 스위프 빔 (섬세하고 화려한 광휘) */}
                      <div
                        className="absolute inset-0 rounded-full animate-[spin_0.9s_linear_infinite] pointer-events-none"
                        style={{
                          background:
                            'conic-gradient(from 0deg, transparent 0deg, transparent 240deg, rgba(255,255,255,0.15) 300deg, rgba(186,230,253,0.7) 345deg, rgba(255,255,255,1) 360deg)',
                        }}
                      />

                      {/* 중심부 다이아몬드 포톤 스파클 글린트 */}
                      <div
                        className="absolute w-2.5 h-2.5 rotate-45 bg-white shadow-[0_0_12px_#ffffff,0_0_24px_rgba(56,189,248,0.9)] animate-pulse pointer-events-none"
                      />
                    </div>
                  )}

                  {/* 🪞 1-B. 미러홀 투명유리 (엣지있는 다이아몬드 컷팅 글래스 & 프리즘 카우스틱 반사광) */}
                  {isMirrorholeMode && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none backdrop-blur-sm">
                      {/* 크리스탈 컷팅 베벨 링 (초정밀 글래스 림) */}
                      <div className="absolute inset-1 rounded-full border-[0.8px] border-white/80 shadow-[inset_0_0_8px_rgba(255,255,255,0.6)] pointer-events-none" />
                      <div className="absolute inset-2.5 rounded-full border-[0.5px] border-cyan-100/40 pointer-events-none" />
                      <div className="absolute inset-4 rounded-full border-[0.8px] border-white/60 pointer-events-none" />

                      {/* 4분면 크리스탈 틱 노치 (12, 3, 6, 9시) */}
                      <div className="absolute top-1 w-1 h-[2px] bg-white/90 rounded-full pointer-events-none" />
                      <div className="absolute bottom-1 w-1 h-[2px] bg-white/90 rounded-full pointer-events-none" />
                      <div className="absolute left-1 h-1 w-[2px] bg-white/90 rounded-full pointer-events-none" />
                      <div className="absolute right-1 h-1 w-[2px] bg-white/90 rounded-full pointer-events-none" />

                      {/* 사선 다이아몬드 거울 글린트 (듀얼 글래스 스펙큘러 레이) */}
                      <div className="absolute w-12 h-[0.75px] -rotate-45 -translate-y-2.5 bg-gradient-to-r from-transparent via-white/95 to-transparent pointer-events-none drop-shadow-[0_0_4px_#ffffff]" />
                      <div className="absolute w-8 h-[0.5px] -rotate-45 translate-y-2.5 bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none" />

                      {/* 360도 스펙트럼 카우스틱 굴절 스위프 (맑고 투명한 레인보우 프리즘 빔) */}
                      <div
                        className="absolute inset-0 rounded-full animate-[spin_1.1s_linear_infinite] pointer-events-none"
                        style={{
                          background:
                            'conic-gradient(from 0deg, transparent 0deg, transparent 230deg, rgba(255,255,255,0.08) 280deg, rgba(56,189,248,0.35) 325deg, rgba(168,85,247,0.5) 350deg, rgba(255,255,255,0.95) 360deg)',
                        }}
                      />

                      {/* 중심부 투명 글래스 옵틱 링 */}
                      <div
                        className="absolute w-5 h-5 rounded-full border-[0.75px] border-white/60 shadow-[0_0_8px_rgba(255,255,255,0.4)] pointer-events-none"
                      />
                    </div>
                  )}

                  {/* 🔮 1-C. 블랙홀/오브 어둠효과 (엣지있는 상대론적 강착원반 레이저 & 시안-바이올렛 지평선 림) */}
                  {isBlackholeMode && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none backdrop-blur-sm">
                      {/* 상대론적 사건의 지평선 링 (네온 시안 & 바이올렛 듀얼 림) */}
                      <div className="absolute inset-1 rounded-full border-[0.8px] border-cyan-300/60 shadow-[inset_0_0_10px_rgba(56,189,248,0.4)] pointer-events-none" />
                      <div className="absolute inset-2.5 rounded-full border-[0.5px] border-purple-400/35 pointer-events-none" />
                      <div className="absolute inset-4 rounded-full border-[0.8px] border-cyan-300/70 pointer-events-none" />

                      {/* 초미세 중력 렌즈 크로스헤어 (중심부로 갈수록 집광되는 엣지 레이저 라인) */}
                      <div className="absolute w-full h-[0.75px] bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent pointer-events-none drop-shadow-[0_0_4px_rgba(56,189,248,0.8)]" />
                      <div className="absolute h-full w-[0.75px] bg-gradient-to-b from-transparent via-cyan-300/80 to-transparent pointer-events-none drop-shadow-[0_0_4px_rgba(56,189,248,0.8)]" />

                      {/* 360도 초고속 나선 강착원반 레이저 스위프 (심플하고 화려한 볼텍스 빔) */}
                      <div
                        className="absolute inset-0 rounded-full animate-[spin_0.85s_linear_infinite] pointer-events-none"
                        style={{
                          background:
                            'conic-gradient(from 0deg, transparent 0deg, transparent 230deg, rgba(168,85,247,0.2) 280deg, rgba(56,189,248,0.6) 335deg, rgba(103,232,249,1) 360deg)',
                        }}
                      />

                      {/* 중심부 투명 특이점 옵틱 링 (3D 오브를 완벽히 투영) */}
                      <div
                        className="absolute w-5 h-5 rounded-full border-[0.75px] border-cyan-300/60 shadow-[0_0_10px_rgba(56,189,248,0.5)] pointer-events-none"
                      />
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
                  background: isWhiteholeMode
                    ? 'radial-gradient(circle at 50% 50%, #ffffff 0%, #e0f2fe 50%, #38bdf8 100%)'
                    : isMirrorholeMode || isBlackholeMode
                    ? 'transparent'
                    : 'radial-gradient(circle at 45% 35%, #0f1124 0%, #080916 55%, #030309 100%)',
                  boxShadow: isWhiteholeMode
                    ? 'inset 0 0 12px rgba(255, 255, 255, 1), 0 0 10px rgba(255, 255, 255, 0.8)'
                    : isMirrorholeMode || isBlackholeMode
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
                      className="absolute -inset-2 rounded-full pointer-events-none blur-[4px] opacity-80"
                      style={{
                        background: radialSectorIndex >= 0 && !isMirrorholeMode
                          ? `radial-gradient(circle, ${RADIAL_WARP_APPS[radialSectorIndex].themeColor} 0%, transparent 80%)`
                          : isAborted
                          ? 'radial-gradient(circle, rgba(239,68,68,0.8) 0%, transparent 80%)'
                          : isWhiteholeMode
                          ? 'radial-gradient(circle, rgba(253,230,138,0.9) 0%, rgba(244,114,182,0.6) 50%, transparent 80%)'
                          : isMirrorholeMode || isBlackholeMode
                          ? 'transparent'
                          : 'radial-gradient(circle, rgba(168,85,247,0.8) 0%, transparent 80%)',
                      }}
                    />

                    {/* ✨ 프리즘 메인 아이콘을 선명하게 표시 (루시: 원래 루시 스파클, 오브: 원래 크리스탈 오브) */}
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
                            ? '#fde68a'
                            : isMirrorholeMode
                            ? '#38bdf8'
                            : isBlackholeMode
                            ? '#38bdf8'
                            : '#ffffff'
                        }
                        className={
                          isWhiteholeMode
                            ? 'text-amber-200 drop-shadow-[0_0_8px_rgba(244,114,182,0.9)]'
                            : isMirrorholeMode
                            ? 'drop-shadow-[0_0_12px_rgba(56,189,248,0.95)]'
                            : isBlackholeMode
                            ? 'drop-shadow-[0_0_10px_rgba(56,189,248,0.9)]'
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
