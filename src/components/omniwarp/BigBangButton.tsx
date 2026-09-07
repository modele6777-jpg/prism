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
      } else if (metrics.phase === 'event_horizon') {
        omniWarpAudio.playEventHorizon();
        triggerHaptic('event_horizon');
      } else if (metrics.phase === 'blackhole') {
        omniWarpAudio.playBlackHole();
        triggerHaptic('blackhole');
      }
      lastPhaseRef.current = metrics.phase;
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

  // 🎯 현재 활성화된 목적지의 상징 아이콘 결정
  const activeAppIcon = (() => {
    if (isAborted) return '🛑';
    if (currentTarget?.icon) return currentTarget.icon;
    if (radialSectorIndex >= 0) return RADIAL_WARP_APPS[radialSectorIndex]?.icon || '✨';
    if (isTargetLucy) return '💬';
    if (isTargetOrb) return '🔮';
    if (activePhase === 'blackhole') return blackholeApp.icon;
    if (activePhase === 'whitehole') return whiteholeApp.icon;
    if (activePhase === 'event_horizon') return currentTarget?.icon || '🌌';
    return currentTarget?.icon || whiteholeApp.icon || '🌌';
  })();

  const activeAppName = (() => {
    if (isAborted) return '취소';
    if (currentTarget?.title) return currentTarget.title;
    if (radialSectorIndex >= 0) return RADIAL_WARP_APPS[radialSectorIndex]?.name || '';
    if (isTargetLucy) return '루시 1:1 대화';
    if (isTargetOrb) return '크리스탈 오브';
    if (activePhase === 'blackhole') return blackholeApp.name;
    if (activePhase === 'whitehole') return whiteholeApp.name;
    if (activePhase === 'event_horizon') return currentTarget?.title || '사건의 지평선';
    return currentTarget?.title || whiteholeApp.name;
  })();

  return (
    <>
      {/* 🌟 1. Environmental Atmospheric Field */}
      <AnimatePresence>
        {isPressing && !isAborted && (
          <>
            {activePhase === 'event_horizon' && (
              <motion.div
                key="event-horizon-bridge-field"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 pointer-events-none z-[330]"
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'radial-gradient(ellipse at bottom, rgba(168,85,247,0.4) 0%, rgba(99,102,241,0.2) 50%, transparent 80%)',
                  }}
                />
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>

      {/* 🚀 2. Crystal Ball Big Bang Button */}
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

            {/* 💥 터치 시 원형 궤도 외곽 부드러운 오로라 & 흡입 효과 */}
            <AnimatePresence>
              {isPressing && (
                <motion.div
                  key="outer-orbital-effects"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 will-change-transform"
                >
                  {/* 1. 화이트홀/홀드: 정돈된 오로라 코로나 림 */}
                  {activePhase === 'whitehole' && (
                    <div
                      className="absolute rounded-full border border-cyan-300/80 transition-transform duration-200"
                      style={{
                        width: 104,
                        height: 104,
                        boxShadow: '0 0 20px rgba(0,240,255,0.7), inset 0 0 10px rgba(255,255,255,0.6)',
                        background: 'radial-gradient(circle, transparent 46px, rgba(56,189,248,0.2) 50px, transparent 65px)',
                      }}
                    />
                  )}

                  {/* 2. 블랙홀/탭: 칠흑의 심연 중력 수축 링 */}
                  {activePhase === 'blackhole' && (
                    <div
                      className="absolute rounded-full border border-black transition-transform duration-200"
                      style={{
                        width: 106,
                        height: 106,
                        boxShadow: '0 0 24px #000000, inset 0 0 16px #000000',
                        background: 'radial-gradient(circle, transparent 44px, rgba(0,0,0,0.85) 52px, #000000 68px)',
                      }}
                    />
                  )}
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

            {/* White Hole Photon Glow */}
            {activePhase === 'whitehole' && (
              <div
                className="absolute -inset-5 rounded-full pointer-events-none transition-opacity duration-200"
                style={{
                  background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(56,189,248,0.4) 50%, transparent 75%)',
                  opacity: Math.min(1, 0.6 + gauge * 0.4),
                }}
              />
            )}

            {/* 🎯 7대 앱 방사형 조이스틱 HUD (버튼 누르고 움직일 때 전개) */}
            <AnimatePresence>
              {isPressing && (
                <>
                  {/* 1) 유효 조작 반경 경계 링 */}
                  <motion.div
                    key="radial-boundary-ring"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{
                      scale: 1,
                      opacity: 1,
                      borderColor: isAborted
                        ? 'rgba(239, 68, 68, 0.85)'
                        : radialSectorIndex >= 0
                        ? RADIAL_WARP_APPS[radialSectorIndex]?.themeColor || 'rgba(56, 189, 248, 0.6)'
                        : 'rgba(56, 189, 248, 0.35)',
                      boxShadow: isAborted
                        ? '0 0 20px rgba(239, 68, 68, 0.4)'
                        : radialSectorIndex >= 0
                        ? `0 0 20px ${RADIAL_WARP_APPS[radialSectorIndex]?.accentGlow}`
                        : '0 0 10px rgba(56, 189, 248, 0.15)',
                    }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[176px] h-[176px] rounded-full border-2 border-dashed pointer-events-none z-25"
                  />

                  {/* 2) 7대 앱 궤도 노드: 룬문자 대신 '해당 어플의 아이콘' 배치! */}
                  {RADIAL_WARP_APPS.map((app, idx) => {
                    const sectorAngle = 360 / RADIAL_WARP_APPS.length;
                    const angleDeg = idx * sectorAngle;
                    const angleRad = (angleDeg * Math.PI) / 180;
                    // 12시 방향이 0도: x = R * sin, y = -R * cos (반지름 72px)
                    const nodeX = 72 * Math.sin(angleRad);
                    const nodeY = -72 * Math.cos(angleRad);
                    const isSelected = radialSectorIndex === idx && !isAborted;

                    return (
                      <motion.div
                        key={app.id}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{
                          scale: isSelected ? 1.35 : 0.95,
                          opacity: isAborted ? 0.25 : isSelected ? 1 : 0.85,
                          x: nodeX,
                          y: nodeY,
                        }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30 flex items-center justify-center select-none"
                      >
                        {/* 🌟 노드 원형 뱃지 (어플 고유 아이콘 및 하이라이트 글로우) */}
                        <div
                          className={`w-8.5 h-8.5 rounded-full flex items-center justify-center shadow-lg transition-all duration-150 border ${
                            isSelected
                              ? 'border-white ring-2 ring-white/90 font-bold scale-110'
                              : 'border-white/30 bg-black/85 text-white/90'
                          }`}
                          style={{
                            background: isSelected
                              ? `radial-gradient(circle, ${app.themeColor} 0%, #050612 100%)`
                              : 'rgba(5, 6, 18, 0.9)',
                            boxShadow: isSelected
                              ? `0 0 18px ${app.accentGlow}, inset 0 0 6px rgba(255,255,255,0.7)`
                              : '0 0 6px rgba(0, 0, 0, 0.7)',
                          }}
                        >
                          <span
                            className={`leading-none select-none transition-transform duration-150 ${
                              isSelected ? 'text-lg sm:text-xl scale-115' : 'text-sm sm:text-base'
                            }`}
                          >
                            {app.icon}
                          </span>
                        </div>
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
                  : radialSectorIndex >= 0
                  ? 'scale-110 border-white shadow-[0_0_25px_rgba(255,255,255,0.8)]'
                  : activePhase === 'whitehole'
                  ? 'scale-115 border-white shadow-[0_0_30px_#ffffff]'
                  : activePhase === 'event_horizon'
                  ? 'scale-110 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.5)]'
                  : activePhase === 'blackhole'
                  ? 'scale-105 border-zinc-800 shadow-[0_0_20px_rgba(0,0,0,0.95)]'
                  : 'border-cyan-400/40 hover:border-cyan-300/80 shadow-[0_0_20px_rgba(56,189,248,0.3)]'
              }`}
              style={{
                background: !isPressing
                  ? 'radial-gradient(circle at 35% 30%, #15162c 0%, #0d0e1d 45%, #05060f 80%, #020207 100%)'
                  : activePhase === 'whitehole'
                  ? 'radial-gradient(circle at 50% 50%, #ffffff 0%, #e0f2fe 45%, #7dd3fc 85%, #0284c7 100%)'
                  : '#04030a',
                boxShadow: (isPressing && isAborted)
                  ? 'inset 0 0 16px rgba(239, 68, 68, 0.5), 0 0 20px rgba(239, 68, 68, 0.6)'
                  : radialSectorIndex >= 0
                  ? `inset 0 0 18px ${RADIAL_WARP_APPS[radialSectorIndex].themeColor}, 0 0 28px ${RADIAL_WARP_APPS[radialSectorIndex].accentGlow}`
                  : !isPressing
                  ? 'inset 0 0 18px rgba(56, 189, 248, 0.25), inset -5px -5px 14px rgba(0, 0, 0, 0.9), 0 0 25px rgba(56, 189, 248, 0.3)'
                  : activePhase === 'whitehole'
                  ? 'inset 0 0 25px rgba(255, 255, 255, 1), 0 0 28px rgba(56, 189, 248, 0.8)'
                  : activePhase === 'event_horizon'
                  ? 'inset 0 0 18px rgba(168, 85, 247, 0.5), 0 0 25px rgba(168, 85, 247, 0.5)'
                  : 'inset 0 0 20px #000000, 0 0 20px rgba(0, 0, 0, 0.95)',
              }}
              aria-label={`빅뱅 차원 도약 · 탭: 웜홀 양자도약, 홀드: 화이트홀(빛) & 블랙홀(심연), 조준/튕기기: 사건의 지평선`}
            >
              {/* 회전 볼텍스 링 (GPU CSS 회전으로 부드럽게) */}
              <div
                className={`absolute inset-0 rounded-full pointer-events-none z-10 transition-opacity duration-200 ${
                  isPressing ? 'animate-[spin_4s_linear_infinite]' : 'animate-[spin_10s_linear_infinite]'
                }`}
                style={{
                  opacity: isPressing ? 0.75 : 0.5,
                  background:
                    activePhase === 'blackhole'
                      ? 'conic-gradient(from 0deg, rgba(20,10,5,0.7) 0deg, rgba(0,0,0,0.95) 180deg, rgba(20,10,5,0.7) 360deg)'
                      : activePhase === 'whitehole'
                      ? 'conic-gradient(from 0deg, rgba(255,255,255,0.9) 0deg, rgba(56,189,248,0.75) 120deg, rgba(168,85,247,0.6) 240deg, rgba(255,255,255,0.9) 360deg)'
                      : 'conic-gradient(from 0deg, rgba(168,85,247,0.7) 0deg, rgba(15,17,36,0.9) 120deg, rgba(192,132,252,0.6) 240deg, rgba(168,85,247,0.7) 360deg)',
                }}
              />

              {/* Event Horizon Deep Singularity Core */}
              <div
                className="absolute inset-2 sm:inset-2.5 rounded-full z-15 pointer-events-none transition-all duration-200 overflow-hidden flex items-center justify-center"
                style={{
                  background: activePhase === 'whitehole'
                    ? 'radial-gradient(circle at 50% 50%, #ffffff 0%, #e0f2fe 50%, #38bdf8 100%)'
                    : 'radial-gradient(circle at 45% 35%, #0f1124 0%, #080916 55%, #030309 100%)',
                  boxShadow: activePhase === 'whitehole'
                    ? 'inset 0 0 12px rgba(255, 255, 255, 1), 0 0 10px rgba(255, 255, 255, 0.8)'
                    : 'inset 0 0 12px rgba(0, 0, 0, 0.95)',
                }}
              >
                {/* ☀️ 화이트홀 내부 백색광 */}
                {isPressing && activePhase === 'whitehole' && (
                  <div
                    className="absolute inset-0 rounded-full pointer-events-none z-10 animate-pulse"
                    style={{
                      background: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(56,189,248,0.5) 80%, transparent 100%)',
                    }}
                  />
                )}
              </div>

              {/* 🎯 Big Bang Center: 룬문자 대신 '해당 어플의 아이콘' 표출 */}
              <div className="relative z-20 w-full h-full rounded-full flex items-center justify-center text-center select-none pointer-events-none">
                {isPressing ? (
                  <motion.div
                    key={`active-icon-${activeAppIcon}`}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.12 }}
                    className="relative flex flex-col items-center justify-center"
                  >
                    {/* 은은한 앰비언트 글로우 오라 */}
                    <div
                      className="absolute -inset-2 rounded-full pointer-events-none blur-[4px] opacity-80"
                      style={{
                        background: radialSectorIndex >= 0
                          ? `radial-gradient(circle, ${RADIAL_WARP_APPS[radialSectorIndex].themeColor} 0%, transparent 80%)`
                          : isAborted
                          ? 'radial-gradient(circle, rgba(239,68,68,0.8) 0%, transparent 80%)'
                          : activePhase === 'whitehole'
                          ? 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(56,189,248,0.6) 60%, transparent 80%)'
                          : 'radial-gradient(circle, rgba(168,85,247,0.8) 0%, transparent 80%)',
                      }}
                    />

                    {/* ✨ 룬문자 대신 해당 어플의 대표 아이콘을 선명하게 표시 */}
                    <span
                      className="relative z-10 text-2xl sm:text-3xl leading-none select-none drop-shadow-md"
                      title={activeAppName}
                    >
                      {activeAppIcon}
                    </span>
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
