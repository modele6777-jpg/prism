import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'motion/react';
import { WarpPhase, OmniWarpTarget, OmniWarpContext } from '@/lib/omniWarp/types';
import { calculateWarpMetrics, forceToAiTemperature, RADIAL_WARP_APPS } from '@/lib/omniWarp/forceSensor';
import { serializeCurrentView, synthesizeWarpTarget, executeBigBangCommit, isDisallowedWarpDestination } from '@/lib/omniWarp/omniWarpEngine';
import {
  getWhiteholeRecommendedApp,
  getBlackholeRecommendedApp,
  getAllActiveWormholeApps,
} from '@/lib/omniWarp/wormholeSpectrum';
import { getTossRule } from '@/lib/prismTossRegistry';
import { omniWarpAudio } from '@/lib/omniWarp/omniWarpAudio';
import { triggerHaptic, startBlackHoleContinuousHaptic, stopBlackHoleContinuousHaptic } from '@/lib/omniWarp/omniWarpHaptics';
import { BigBangCircularMeter } from './BigBangCircularMeter';
import { PrismAppIcon } from './PrismAppIcon';
import {
  BigBangHorizonOverlay,
} from './BigBangHorizonOverlay';



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

  // 🎯 OmniWarp BigBang Controller 3대 홀 (화이트홀 · 미러홀 · 블랙홀) 상태
  const [activeHole, setActiveHole] = useState<'whitehole' | 'mirrorhole' | 'blackhole'>('whitehole');
  const lastHoleRef = useRef<'whitehole' | 'mirrorhole' | 'blackhole'>('whitehole');

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

    const deltaX = currentPointer ? currentPointer.clientX - start.x : 0;
    const deltaY = currentPointer ? currentPointer.clientY - start.y : 0;
    const dist = Math.hypot(deltaX, deltaY);

    // 🪞 홀드 시 3대 홀 순환 (화이트홀:빛비춤 -> 미러홀:유리 -> 블랙홀:어두움)
    const elapsed = now - start.time;
    let currentHole: 'whitehole' | 'mirrorhole' | 'blackhole' = 'whitehole';
    if (elapsed >= 300) {
      const cycle = Math.floor((elapsed - 300) / 650) % 3;
      currentHole = cycle === 0 ? 'whitehole' : cycle === 1 ? 'mirrorhole' : 'blackhole';
    }

    // 중요한 상태 변경(섹터, 페이즈, 어보트, 홀)이 발생했거나 약 33ms(30fps) 경과 시 상태 일괄 동기화
    const isSectorChanged = sectorIdx !== lastSectorRef.current;
    const isPhaseChanged = metrics.phase !== lastPhaseRef.current;
    const isAbortedChanged = metrics.isAborted !== isAborted;
    const isHoleChanged = currentHole !== lastHoleRef.current;
    const isGaugeSignificantlyChanged = Math.abs(metrics.virtualForce - lastUpdateGaugeRef.current) >= 0.04;
    const isTimeThrottled = now - lastStateUpdateTimeRef.current >= 32;

    if (isSectorChanged || isPhaseChanged || isAbortedChanged || isHoleChanged || isGaugeSignificantlyChanged || isTimeThrottled) {
      lastStateUpdateTimeRef.current = now;
      lastUpdateGaugeRef.current = metrics.virtualForce;

      setGauge(metrics.virtualForce);
      setDurationMs(metrics.durationMs);
      setAiTemp(temp);
      setActivePhase(metrics.phase);
      setCurrentTarget(target);
      setIsAborted(metrics.isAborted);
      setDragOffset({ x: metrics.dragOffsetX || 0, y: metrics.dragOffsetY || 0 });
      setDragDistance(dist);
      setDragAngleDeg(metrics.dragAngleDeg || 0);
      setRadialSectorIndex(sectorIdx);
      setActiveHole(currentHole);
    }

    // 🎯 7대 앱 방사형 조이스틱 각 앱 섹터 진입 시 기계식 마그네틱 틱 햅틱 진동
    if (sectorIdx !== -1 && sectorIdx !== lastSectorRef.current && !metrics.isAborted) {
      lastSectorRef.current = sectorIdx;
      triggerHaptic('whitehole');
    } else if (sectorIdx === -1) {
      lastSectorRef.current = -1;
    }

    // 🧲 홀 순환 전환 시 실시간 오디오 & 햅틱
    if (elapsed >= 300 && currentHole !== lastHoleRef.current && !metrics.isAborted) {
      lastHoleRef.current = currentHole;
      if (currentHole === 'whitehole') {
        omniWarpAudio.playWhiteHole();
        triggerHaptic('whitehole');
      } else if (currentHole === 'mirrorhole') {
        omniWarpAudio.playMirrorHole();
        triggerHaptic('mirrorhole');
      } else if (currentHole === 'blackhole') {
        omniWarpAudio.playBlackHole();
        triggerHaptic('blackhole');
      }
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
    lastHoleRef.current = 'whitehole';

    // 터치 시작 시 단 한 번만 직렬화하여 캐싱 (매 16ms마다 I/O 파싱 방지)
    const context = serializeCurrentView(location);
    cachedContextRef.current = context;

    setDragOffset({ x: 0, y: 0 });
    setDragDistance(0);
    setDragAngleDeg(0);
    setRadialSectorIndex(-1);
    setActiveHole('whitehole');
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
    const duration = now - start.time;
    const deltaX = e.clientX - start.x;
    const deltaY = e.clientY - start.y;
    const dist = Math.hypot(deltaX, deltaY);

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
    lastHoleRef.current = 'whitehole';
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

    // [1] 제자리 단순 탭 (300ms 미만 및 드래그 없음) -> 웜홀 (전체 앱 중 무작위 순간이동)
    if (duration < 300 && dist < 25) {
      const allActive = getAllActiveWormholeApps();
      const randomApp = allActive[Math.floor(Math.random() * allActive.length)] || allActive[0];
      const wormholeTarget: OmniWarpTarget = {
        id: randomApp.id,
        icon: randomApp.icon,
        phase: 'wormhole',
        gauge: 0.5,
        aiTemperature: 0.5,
        title: randomApp.name,
        actionType: 'omniwarp_wormhole_random',
        destinationPath: randomApp.path,
        previewLabel: `[웜홀 양자도약] 🌀 ${randomApp.name}`,
        previewDescription: `시공간 웜홀의 양자 요동을 타고 [${randomApp.name}] 차원으로 무작위 양자도약합니다.`,
        themeColor: randomApp.themeColor,
        accentGlow: randomApp.accentGlow,
        stageIndex: 1,
        runeSymbol: randomApp.runeSymbol,
        runeName: randomApp.runeName,
      };
      executeBigBangCommit(wormholeTarget, context, metrics);
      setActivePhase('idle');
      setGauge(0);
      setDurationMs(0);
      return;
    }

    // [2 & 3] 사건의 지평선 (7대 정규 앱 조준) 또는 3대 홀 (화이트홀 / 미러홀 / 블랙홀)
    // synthesizeWarpTarget가 7개 실존 앱과 3대 홀의 정규 목적지를 완벽하게 합성
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
    activeHole === 'whitehole' ||
    activePhase === 'whitehole' ||
    (activePhase === 'event_horizon' && currentTarget?.eventHorizonMode === 'whitehole');

  const isMirrorholeMode =
    activeHole === 'mirrorhole' ||
    activePhase === 'mirrorhole' ||
    (activePhase === 'event_horizon' && currentTarget?.eventHorizonMode === 'mirrorhole');

  const isBlackholeMode =
    activeHole === 'blackhole' ||
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
      {/* 🌌 사건의 지평선 오버레이 (7대 정규 앱 셉타그램 & 3대 홀 포털) */}
      <BigBangHorizonOverlay
        isVisible={isPressing && durationMs >= 300 && !isAborted}
        radialSectorIndex={radialSectorIndex}
        activeHole={activeHole}
        dragDistance={dragDistance}
        dragAngleDeg={dragAngleDeg}
      />

      {/* 🚀 Crystal Ball Big Bang Button (군더더기 없는 현대적이고 웅장한 대형 코스믹 아티팩트) */}
      <div
        className="fixed left-1/2 -translate-x-1/2 z-[350] pointer-events-none flex items-center justify-center select-none bottom-safe-fab"
      >
        <div
          className="group relative flex flex-col items-center justify-center pointer-events-auto select-none"
          onPointerEnter={() => setIsHovered(true)}
          onPointerLeave={() => setIsHovered(false)}
        >
          {/* 🎯 버튼 & 궤도 정밀 센터링 앵커 (대형 코스믹 아티팩트 규격 76~84px) */}
          <div className="relative w-[76px] h-[76px] sm:w-[84px] sm:h-[84px] flex items-center justify-center shrink-0">
            {/* 🌟 빅뱅 아케인 마법진 매트릭스 (하드웨어 가속, 상시 렌더링 및 누를 때 공명 가속) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
              <BigBangCircularMeter
                isPressing={isPressing}
                isHovered={isHovered}
                gauge={gauge}
                durationMs={durationMs}
                activePhase={activePhase}
                isAborted={isAborted}
              />
            </div>

            {/* Ambient Gravitational Ripple Waves */}
            {activePhase === 'idle' && (
              <>
                <div className="absolute -inset-2.5 rounded-full border border-cyan-400/25 animate-ping opacity-20 pointer-events-none" />
                <div className="absolute -inset-4 rounded-full border border-purple-400/15 animate-pulse opacity-30 pointer-events-none" />
              </>
            )}

            {/* 🎯 빅뱅 차원 수렴 인터랙션 (군더더기 없는 현대적이고 신비로운 코스믹 아케인 버튼) */}
            <motion.button
              ref={buttonRef}
              type="button"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                x: isPressing
                  ? isAborted
                    ? (dragDistance > 0 ? (dragOffset.x * Math.min(dragDistance * 0.7, 48)) / dragDistance : 0)
                    : (dragDistance > 0 ? (dragOffset.x * Math.min(dragDistance * 0.6, 40)) / dragDistance : 0)
                  : 0,
                y: isPressing
                  ? isAborted
                    ? (dragDistance > 0 ? (dragOffset.y * Math.min(dragDistance * 0.7, 48)) / dragDistance : 0)
                    : (dragDistance > 0 ? (dragOffset.y * Math.min(dragDistance * 0.6, 40)) / dragDistance : 0)
                  : 0,
                scale: isPressing
                  ? (1.04 + gauge * 0.08)
                  : 1.0,
              }}
              transition={{
                duration: 0.08,
              }}
              className={`w-[76px] h-[76px] sm:w-[84px] sm:h-[84px] rounded-full flex flex-col items-center justify-center shrink-0 cursor-pointer outline-none relative overflow-hidden transition-all duration-200 border will-change-transform ${
                isPressing && isAborted
                  ? 'opacity-70 border-red-500/70 shadow-[0_0_24px_rgba(239,68,68,0.5)]'
                  : isPressing && isWhiteholeMode
                  ? 'border-amber-100/95 shadow-[0_0_40px_rgba(255,255,255,0.95),0_0_28px_rgba(254,240,138,0.8),inset_0_0_24px_rgba(255,255,255,0.9)]'
                  : isPressing && isMirrorholeMode
                  ? 'border-white/90 shadow-[0_0_36px_rgba(224,242,254,0.9),0_0_22px_rgba(186,230,253,0.7),inset_0_0_22px_rgba(255,255,255,0.85)]'
                  : isPressing && isBlackholeMode
                  ? 'border-purple-900/90 shadow-[0_0_40px_rgba(0,0,0,1),0_0_22px_rgba(107,33,168,0.5),inset_0_0_28px_rgba(0,0,0,1)]'
                  : isPressing
                  ? 'border-cyan-300/80 shadow-[0_0_32px_rgba(56,189,248,0.45),inset_0_0_22px_rgba(56,189,248,0.35)]'
                  : 'border-cyan-400/40 hover:border-cyan-300/80 shadow-[0_0_24px_rgba(56,189,248,0.3)]'
              }`}
              style={{
                background: isPressing && isAborted
                  ? 'radial-gradient(circle at 40% 35%, #1f0b0f 0%, #0d0406 55%, #040102 100%)'
                  : isPressing && isWhiteholeMode
                  ? 'radial-gradient(circle at 40% 30%, #ffffff 0%, #fef3c7 35%, #fde68a 65%, #f59e0b 100%)'
                  : isPressing && isMirrorholeMode
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.75) 0%, rgba(224,242,254,0.4) 40%, rgba(186,230,253,0.3) 70%, rgba(255,255,255,0.6) 100%)'
                  : isPressing && isBlackholeMode
                  ? 'radial-gradient(circle at 50% 50%, #000000 0%, #040308 45%, #090514 80%, #020104 100%)'
                  : isPressing
                  ? 'radial-gradient(circle at 35% 30%, #171833 0%, #0e0f21 45%, #060712 80%, #020207 100%)'
                  : 'radial-gradient(circle at 35% 30%, #171833 0%, #0e0f21 45%, #060712 80%, #020207 100%)',
                boxShadow: isPressing && isAborted
                  ? 'inset 0 0 20px rgba(239, 68, 68, 0.4), 0 0 24px rgba(239, 68, 68, 0.5)'
                  : isPressing && isWhiteholeMode
                  ? 'inset 0 0 25px rgba(255, 255, 255, 0.95), 0 0 35px rgba(253, 230, 138, 0.9)'
                  : isPressing && isMirrorholeMode
                  ? 'inset 0 0 24px rgba(255, 255, 255, 0.8), inset 1px 1px 2px rgba(255, 255, 255, 1), 0 0 32px rgba(186, 230, 253, 0.75)'
                  : isPressing && isBlackholeMode
                  ? 'inset 0 0 30px rgba(0, 0, 0, 1), inset 0 0 15px rgba(88, 28, 135, 0.4), 0 0 36px rgba(0, 0, 0, 0.95)'
                  : isPressing
                  ? 'inset 0 0 22px rgba(56, 189, 248, 0.35), inset -6px -6px 18px rgba(0, 0, 0, 0.9), 0 0 30px rgba(56, 189, 248, 0.45)'
                  : 'inset 0 0 22px rgba(56, 189, 248, 0.25), inset -6px -6px 18px rgba(0, 0, 0, 0.9), 0 0 24px rgba(56, 189, 248, 0.3)',
              }}
              aria-label={`빅뱅 차원 도약 · 탭: 웜홀 양자도약, 홀드: 차원 수렴 도약`}
            >
              {/* 미러홀 유리 질감 광택 층 */}
              {isPressing && isMirrorholeMode && (
                <div
                  className="absolute inset-0 rounded-full pointer-events-none z-10 bg-gradient-to-tr from-white/20 via-sky-200/30 to-white/60 mix-blend-overlay backdrop-blur-md"
                />
              )}

              {/* 기본 대기 상태일 때의 은은한 회전 볼텍스 링 */}
              {!isPressing && (
                <div
                  className="absolute inset-0 rounded-full pointer-events-none z-10 transition-opacity duration-200 animate-[spin_12s_linear_infinite] opacity-40"
                  style={{
                    background:
                      'conic-gradient(from 0deg, rgba(168,85,247,0.6) 0deg, rgba(15,17,36,0.9) 120deg, rgba(192,132,252,0.5) 240deg, rgba(168,85,247,0.6) 360deg)',
                  }}
                />
              )}

              {/* Event Horizon Deep Singularity Core (크리스탈 구체의 코어 - 화이트홀/미러홀/블랙홀 반응) */}
              <div
                className="absolute inset-2.5 sm:inset-3 rounded-full z-15 pointer-events-none transition-all duration-200 overflow-hidden flex items-center justify-center"
                style={{
                  background: isPressing && isWhiteholeMode
                    ? 'radial-gradient(circle at 45% 35%, #ffffff 0%, #fef08a 45%, #f59e0b 100%)'
                    : isPressing && isMirrorholeMode
                    ? 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.9) 0%, rgba(224,242,254,0.6) 45%, rgba(186,230,253,0.3) 80%, rgba(255,255,255,0.5) 100%)'
                    : isPressing && isBlackholeMode
                    ? 'radial-gradient(circle at 50% 50%, #000000 0%, #020206 55%, #05040b 100%)'
                    : 'radial-gradient(circle at 45% 35%, #101228 0%, #090a1a 55%, #03030a 100%)',
                  boxShadow: isPressing && isWhiteholeMode
                    ? '0 0 20px rgba(255, 255, 255, 1), inset 0 0 10px rgba(255, 255, 255, 0.9)'
                    : isPressing && isMirrorholeMode
                    ? 'inset 0 0 16px rgba(255, 255, 255, 0.8), 0 0 15px rgba(224, 242, 254, 0.6)'
                    : isPressing && isBlackholeMode
                    ? 'inset 0 0 24px rgba(0, 0, 0, 1)'
                    : 'inset 0 0 16px rgba(0, 0, 0, 0.95)',
                }}
              />

              {/* 🎯 Big Bang Center: 목적지 정통 Lucide 벡터 아이콘 */}
              <div className="relative z-20 w-full h-full rounded-full flex items-center justify-center text-center select-none pointer-events-none">
                {isPressing ? (
                  <motion.div
                    key={`active-icon-${activeAppId}`}
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.12 }}
                    className="relative flex flex-col items-center justify-center"
                  >
                    {/* 은은한 앰비언트 글로우 오라 */}
                    <div
                      className="absolute -inset-3 rounded-full pointer-events-none blur-[8px] opacity-60"
                      style={{
                        background: isAborted
                          ? 'radial-gradient(circle, rgba(239,68,68,0.8) 0%, transparent 80%)'
                          : 'radial-gradient(circle, rgba(56,189,248,0.5) 0%, rgba(168,85,247,0.3) 50%, transparent 80%)',
                      }}
                    />

                    {/* 프리즘 메인 아이콘을 깔끔하고 선명하게 표시 */}
                    <div
                      className="relative z-10 flex items-center justify-center select-none"
                      title={activeAppName}
                    >
                      <PrismAppIcon
                        nameOrId={activeAppId}
                        size={32}
                        color={isAborted ? '#ef4444' : '#ffffff'}
                        className="text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.85)]"
                      />
                    </div>
                  </motion.div>
                ) : (
                  /* 대기 상태: 궤도 색감과 공명하는 은은한 싱귤래리티 코어 */
                  <div className="relative flex items-center justify-center pointer-events-none">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-300/80 blur-[1px] animate-pulse" />
                    <div className="absolute w-5 h-5 rounded-full border border-cyan-400/30 animate-ping opacity-40" />
                    <div className="absolute w-8 h-8 rounded-full border border-purple-400/20 animate-pulse opacity-30" />
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
