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
import { getRandomWormholeDestination, resolveCanonicalPath } from '@/lib/prismRouteRegistry';
import { omniWarpAudio } from '@/lib/omniWarp/omniWarpAudio';
import { triggerHaptic, startBlackHoleContinuousHaptic, stopBlackHoleContinuousHaptic } from '@/lib/omniWarp/omniWarpHaptics';
import { safeSessionStorage } from '@/utils/safeStorage';
import { BigBangCircularMeter } from './BigBangCircularMeter';
import { PrismAppIcon } from './PrismAppIcon';

export function BigBangButton() {
  let location = '/';
  let navigate = (to: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = to;
    }
  };

  try {
    const [wouterLoc, wouterNav] = useLocation();
    location = wouterLoc;
    navigate = wouterNav;
  } catch (_) {
    if (typeof window !== 'undefined') {
      location = window.location.pathname;
    }
  }

  const isOrbSite =
    location === '/orb' ||
    location === '/gateway' ||
    location === '/crystal' ||
    (typeof window !== 'undefined' && window.location.pathname.includes('orb'));

  const isChatView =
    location === '/chat' ||
    location === '/lucy' ||
    (typeof window !== 'undefined' && window.location.pathname.includes('chat'));

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

  // 🎯 OmniWarp BigBang Controller: 화이트홀(빛비춤) · 블랙홀(어두운 심연) 상태
  const [activeHole, setActiveHole] = useState<'whitehole' | 'blackhole'>('whitehole');
  const lastHoleRef = useRef<'whitehole' | 'blackhole'>('whitehole');

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

    // 🪞 미러홀 제거: 250ms 미만은 화이트홀(빛비춤), 250ms 이상 홀드 시 블랙홀(어두운 심연)로 즉시 전환
    const elapsed = now - start.time;
    let currentHole: 'whitehole' | 'blackhole' = elapsed >= 250 ? 'blackhole' : 'whitehole';

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

    // 🧲 화이트홀 ➔ 블랙홀 전환 시 실시간 오디오 & 햅틱
    if (currentHole !== lastHoleRef.current && !metrics.isAborted) {
      lastHoleRef.current = currentHole;
      if (currentHole === 'whitehole') {
        omniWarpAudio.playWhiteHole();
        triggerHaptic('whitehole');
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

    // 🕳️ 블랙홀 단계 미세 진동 피드백 (홀드 지속 시 심연 럼블 - 웜홀 및 방사형 조이스틱 영역에서는 중단)
    if (metrics.phase === 'blackhole' && !metrics.isAborted && sectorIdx === -1) {
      startBlackHoleContinuousHaptic();
    } else {
      stopBlackHoleContinuousHaptic();
    }

    // Audio & Haptic triggers on phase transition
    if (metrics.phase !== lastPhaseRef.current && !metrics.isAborted) {
      if (metrics.phase === 'whitehole') {
        omniWarpAudio.playWhiteHole();
        triggerHaptic('whitehole');
      } else if (metrics.phase === 'wormhole') {
        omniWarpAudio.playWormhole();
        triggerHaptic('wormhole');
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
    lastPhaseRef.current = 'whitehole';
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
    setActivePhase('whitehole');
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

    // ☀️ 가벼운 탭 진입 시 화이트홀 빛비춤 햅틱 및 사운드
    omniWarpAudio.playWhiteHole();
    triggerHaptic('whitehole');

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

    // 버튼 영역 내부인지 정밀 판별 (버튼 bounding rect 기준)
    const isWithinButton = (() => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distFromCenter = Math.hypot(e.clientX - centerX, e.clientY - centerY);
        return distFromCenter <= (rect.width / 2) + 6;
      }
      return dist <= 44;
    })();

    // [1] 제자리 단순 탭 (250ms 미만 및 제자리 영역 dist < 20) -> 빛비춤(화이트홀) 효과 및 루시 채팅 켜기/끄기
    if (duration < 250 && dist < 20) {
      triggerHaptic('whitehole');
      omniWarpAudio.playWhiteHole();

      // ☀️ 제자리 탭: 빛비춤(화이트홀) 화면 이펙트 발동!
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('prism:bigbang_commit', {
            detail: {
              phase: 'whitehole',
              target: {
                id: 'lucy',
                name: '루시 1:1 대화',
                destinationPath: '/chat',
                themeColor: '#fde68a',
                eventHorizonMode: 'whitehole',
              },
              context,
              metrics,
              timestamp: Date.now(),
            },
          })
        );
      }

      setTimeout(() => {
        if (isChatView) {
          // 루시 채팅 끄기 (닫기) -> 이전 페이지로 복귀
          const returnPath = safeSessionStorage.getItem('prism_chat_return_path') || '/';
          safeSessionStorage.removeItem('prism_chat_return_path');
          if (returnPath.includes('orb')) {
            window.location.href = '/orb.html';
          } else {
            navigate(returnPath);
          }
        } else {
          // 루시 채팅 켜기 (열기) -> 현재 경로 저장 후 /chat 이동
          const currentPath = isOrbSite ? '/orb.html' : (location || '/');
          safeSessionStorage.setItem('prism_chat_return_path', currentPath);
          if (isOrbSite) {
            window.location.href = '/chat';
          } else {
            navigate('/chat');
          }
        }
      }, 160);

      setActivePhase('idle');
      setGauge(0);
      setDurationMs(0);
      return;
    }

    // [2] 홀드 (250ms 이상) 또는 드래그 릴리즈 분기
    // A. 만약 사용자가 버튼 바깥으로 드래그하여 특정 7대 룬 노드로 명확히 조준한 경우: 해당 앱으로 워프!
    if (!isWithinButton && radialSectorIndex >= 0 && dist > 44) {
      const target = synthesizeWarpTarget(context, metrics);
      if (!isDisallowedWarpDestination(target.id || '') && !isDisallowedWarpDestination(target.destinationPath || '')) {
        executeBigBangCommit(target, context, metrics);
        setActivePhase('idle');
        setGauge(0);
        setDurationMs(0);
        return;
      }
    }

    // B. 🌀 만약 사용자가 홀드하다가 버튼영역내(제자리영역 제외, dist >= 20 && isWithinButton)에서 뗀 경우:
    // -> <웜홀> 발동! 루시채팅과 오브사이트를 제외한 지금 앱 내부 실존 모든 페이지로 임의 도약!
    if (dist >= 20 && isWithinButton) {
      triggerHaptic('wormhole');
      omniWarpAudio.playWormhole();

      const randomDest = getRandomWormholeDestination(location);
      const safePath = resolveCanonicalPath(randomDest.path);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('prism:bigbang_commit', {
            detail: {
              phase: 'wormhole',
              target: {
                id: randomDest.id,
                name: randomDest.name,
                destinationPath: safePath,
                themeColor: randomDest.themeColor,
                icon: randomDest.icon,
                runeSymbol: randomDest.runeSymbol,
                runeName: randomDest.runeName,
                previewLabel: `[웜홀 임의 도약] 🌀 ${randomDest.runeSymbol} ${randomDest.name}`,
                previewDescription: `시공간 웜홀을 통과하여 [${randomDest.name} · ${randomDest.subName}]으로 차원 도약합니다.`,
              },
              context,
              metrics: { ...metrics, phase: 'wormhole' },
              timestamp: Date.now(),
            },
          })
        );
      }

      setTimeout(() => {
        if (isOrbSite) {
          window.location.href = safePath;
        } else {
          navigate(safePath);
          window.dispatchEvent(new CustomEvent('prism-navigate', { detail: { path: safePath } }));
          window.dispatchEvent(new CustomEvent('nav-click-active', { detail: { path: safePath } }));
        }
      }, 240);

      setActivePhase('idle');
      setGauge(0);
      setDurationMs(0);
      return;
    }

    // C. 제자리 홀드 후 떼기 (dist < 20): 어두운 심연(블랙홀) 효과 발동 및 크리스탈 오브 들어가기 / 나가기 토글!
    triggerHaptic('blackhole');
    omniWarpAudio.playBlackHole();

    // 🕳️ 제자리 홀드 후 떼기: 어두운 심연(블랙홀) 화면 이펙트 발동!
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('prism:bigbang_commit', {
          detail: {
            phase: 'blackhole',
            target: {
              id: 'orb',
              name: '크리스탈 오브',
              destinationPath: '/orb',
              themeColor: '#38bdf8',
              eventHorizonMode: 'blackhole',
            },
            context,
            metrics,
            timestamp: Date.now(),
          },
        })
      );
    }

    setTimeout(() => {
      if (isOrbSite) {
        // 오브 사이트 나가기 -> 프리즘 귀환
        const returnPath = safeSessionStorage.getItem('prism_orb_return_path') || '/';
        safeSessionStorage.removeItem('prism_orb_return_path');
        const finalDest = returnPath.includes('orb') ? '/' : returnPath;
        if (typeof window !== 'undefined' && window.location.pathname.includes('orb')) {
          window.location.href = finalDest;
        } else {
          navigate(finalDest);
        }
      } else {
        // 오브 사이트 들어가기 -> /orb.html 입장
        const currentPath = location || '/';
        safeSessionStorage.setItem('prism_orb_return_path', currentPath);
        if (typeof window !== 'undefined') {
          window.location.href = '/orb.html';
        } else {
          navigate('/orb');
        }
      }
    }, 240);

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

  // 🌟 위상 판별: 화이트홀(빛비춤), 블랙홀(어두운 심연) - 미러홀 완전 제거
  const isWhiteholeMode =
    activeHole === 'whitehole' ||
    activePhase === 'whitehole' ||
    (activePhase === 'event_horizon' && currentTarget?.eventHorizonMode === 'whitehole');

  const isBlackholeMode =
    activeHole === 'blackhole' ||
    activePhase === 'blackhole' ||
    (activePhase === 'event_horizon' && currentTarget?.eventHorizonMode === 'blackhole');

  // 🎯 현재 활성화된 목적지의 상징 아이콘 식별자 결정 (프리즘 메인 아이콘 규격)
  const activeAppId = (() => {
    if (isAborted) return 'aborted';
    // 🌀 웜홀 상태 (버튼영역내 제자리 제외): 옴니워프 유니버스 아이콘
    if (activePhase === 'wormhole') return 'omniwarp';
    // 🌌 사건의 지평선 상태 (조준 중): 해당 조준 채널의 아이콘을 최우선으로 표출!
    if (radialSectorIndex >= 0) return RADIAL_WARP_APPS[radialSectorIndex]?.id || 'hub';
    // 🪞 제자리 홀드 - 오브 사이트에서는 프리즘 홈 귀환
    if (isOrbSite) return 'hub';
    // 🔮 제자리 홀드 - 프리즘 페이지에서는 크리스탈 오브 입장
    return 'orb';
  })();

  const activeAppName = (() => {
    if (isAborted) return '취소';
    // 🌀 웜홀 상태: 임의 차원 도약 명칭 표출
    if (activePhase === 'wormhole') return '웜홀 시공간 도약 (임의 차원 전이)';
    // 🌌 사건의 지평선 상태 (조준 중): 해당 조준 채널 및 서브메뉴 명칭 표출
    if (radialSectorIndex >= 0) {
      const channel = RADIAL_WARP_APPS[radialSectorIndex];
      const subTitle = currentTarget?.title || '';
      return subTitle ? `${channel?.name || ''} · ${subTitle}` : (channel?.name || '');
    }
    // 🪞 제자리 홀드 - 오브 사이트에서는 프리즘 귀환
    if (isOrbSite) return '프리즘 귀환 (오브 나가기)';
    // 🔮 제자리 홀드 - 프리즘 페이지에서는 크리스탈 오브 입장
    return '크리스탈 오브 (입장)';
  })();

  return (
    <>
      {/* 🚀 Crystal Ball Big Bang Button (군더더기 없는 현대적이고 웅장한 대형 코스믹 아티팩트) */}
      <div
        className="fixed left-1/2 -translate-x-1/2 z-[350] pointer-events-none flex items-center justify-center select-none bottom-safe-fab"
      >
        <div
          className="group relative flex flex-col items-center justify-center pointer-events-auto select-none"
          onPointerEnter={() => setIsHovered(true)}
          onPointerLeave={() => setIsHovered(false)}
        >
          {/* 🌟 1. 상단 미니멀 HUD 캡슐 (화면 시야를 가리지 않고 버튼 바로 위에만 은은하게 표출) */}
          <AnimatePresence>
            {isPressing && durationMs >= 200 && !isAborted && (
              <motion.div
                key="bigbang-compact-hud"
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: -58, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                className="absolute pointer-events-none z-50 whitespace-nowrap"
              >
                <div
                  className="px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-md shadow-lg flex items-center gap-1.5 transition-all duration-200"
                  style={{
                    background: activePhase === 'wormhole'
                      ? 'rgba(4, 28, 18, 0.95)'
                      : radialSectorIndex >= 0 && RADIAL_WARP_APPS[radialSectorIndex]
                      ? 'rgba(10, 14, 28, 0.92)'
                      : isOrbSite
                      ? 'rgba(15, 23, 42, 0.94)'
                      : 'rgba(24, 10, 40, 0.94)',
                    borderColor: activePhase === 'wormhole'
                      ? 'rgba(52, 211, 153, 0.85)'
                      : radialSectorIndex >= 0 && RADIAL_WARP_APPS[radialSectorIndex]
                      ? RADIAL_WARP_APPS[radialSectorIndex].themeColor
                      : isOrbSite
                      ? 'rgba(56, 189, 248, 0.8)'
                      : 'rgba(168, 85, 247, 0.8)',
                    color: activePhase === 'wormhole'
                      ? '#ecfdf5'
                      : radialSectorIndex >= 0 && RADIAL_WARP_APPS[radialSectorIndex]
                      ? '#ffffff'
                      : isOrbSite
                      ? '#e0f2fe'
                      : '#f3e8ff',
                    boxShadow: activePhase === 'wormhole'
                      ? '0 0 16px rgba(52, 211, 153, 0.65)'
                      : radialSectorIndex >= 0 && RADIAL_WARP_APPS[radialSectorIndex]
                      ? `0 0 16px ${RADIAL_WARP_APPS[radialSectorIndex].accentGlow}`
                      : isOrbSite
                      ? '0 0 16px rgba(56, 189, 248, 0.5)'
                      : '0 0 16px rgba(168, 85, 247, 0.5)',
                  }}
                >
                  {activePhase === 'wormhole' ? (
                    <>
                      <span className="font-serif text-sm text-cyan-300 animate-spin">🌌</span>
                      <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-cyan-200 to-purple-300">사건의 지평선 웜홀</span>
                      <span className="opacity-90 text-[11px] text-cyan-200">· 빛과 심연의 차원 도약</span>
                    </>
                  ) : radialSectorIndex >= 0 && RADIAL_WARP_APPS[radialSectorIndex] ? (
                    <>
                      <span className="font-serif text-sm text-cyan-300">
                        {RADIAL_WARP_APPS[radialSectorIndex].runeSymbol}
                      </span>
                      <span className="font-semibold">{RADIAL_WARP_APPS[radialSectorIndex].name}</span>
                      <span className="opacity-70 text-[11px]">· {RADIAL_WARP_APPS[radialSectorIndex].title}</span>
                    </>
                  ) : isOrbSite ? (
                    <>
                      <span>🪞</span>
                      <span className="font-semibold text-cyan-200">프리즘 귀환</span>
                      <span className="opacity-80 text-[11px] text-cyan-300">· 오브 사이트 나가기</span>
                    </>
                  ) : (
                    <>
                      <span>🔮</span>
                      <span className="font-semibold text-purple-200">크리스탈 오브</span>
                      <span className="opacity-80 text-[11px] text-purple-300">· 직관 포털 들어가기</span>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 🎯 버튼 & 궤도 정밀 센터링 앵커 (대형 코스믹 아티팩트 규격 76~84px) */}
          <div className="relative w-[76px] h-[76px] sm:w-[84px] sm:h-[84px] flex items-center justify-center shrink-0">
            {/* 🌟 2. 마법진 배경 7대 앱 룬 노드 서클 (버튼 배경에만 나타나는 방사형 선택 휠) */}
            <AnimatePresence>
              {isPressing && durationMs >= 150 && !isAborted && (
                <motion.div
                  key="magic-circle-rune-nodes"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none z-25"
                >
                  {/* 중앙 레이저 연결선 (조준된 노드로 뻗는 빔) */}
                  {radialSectorIndex >= 0 && (
                    <svg className="absolute w-[200px] h-[200px] overflow-visible pointer-events-none">
                      {(() => {
                        const targetApp = RADIAL_WARP_APPS[radialSectorIndex];
                        const angleDeg = (radialSectorIndex * 360) / 7 - 90;
                        const angleRad = (angleDeg * Math.PI) / 180;
                        const r = 74;
                        const x2 = 100 + Math.cos(angleRad) * r;
                        const y2 = 100 + Math.sin(angleRad) * r;
                        return (
                          <line
                            x1={100}
                            y1={100}
                            x2={x2}
                            y2={y2}
                            stroke={targetApp ? targetApp.themeColor : '#38bdf8'}
                            strokeWidth={1.8}
                            strokeDasharray="3 3"
                            className="animate-pulse"
                            opacity={0.85}
                          />
                        );
                      })()}
                    </svg>
                  )}

                  {/* 7개 앱 룬 노드 (반경 74px 궤도 위에 배치) */}
                  {RADIAL_WARP_APPS.map((app, index) => {
                    const angleDeg = (index * 360) / 7 - 90;
                    const angleRad = (angleDeg * Math.PI) / 180;
                    const orbitR = 74; // 버튼 반경(40px) 바깥 마법진 궤도 링 위
                    const x = Math.cos(angleRad) * orbitR;
                    const y = Math.sin(angleRad) * orbitR;
                    const isSelected = radialSectorIndex === index;

                    return (
                      <div
                        key={`rune-node-${app.id}`}
                        className="absolute flex items-center justify-center transition-all duration-150 will-change-transform"
                        style={{
                          transform: `translate(${x}px, ${y}px) scale(${isSelected ? 1.28 : 1})`,
                          zIndex: isSelected ? 40 : 25,
                        }}
                      >
                        <div
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border transition-all duration-150 backdrop-blur-md shadow-md"
                          style={{
                            background: isSelected
                              ? 'radial-gradient(circle at 40% 35%, #181c38 0%, #0c0e1e 65%, #05060f 100%)'
                              : 'rgba(8, 10, 24, 0.85)',
                            borderColor: isSelected ? app.themeColor : 'rgba(255, 255, 255, 0.25)',
                            boxShadow: isSelected
                              ? `0 0 16px ${app.accentGlow}, inset 0 0 8px ${app.accentGlow}`
                              : '0 0 6px rgba(0, 0, 0, 0.6)',
                          }}
                        >
                          <span
                            className="font-serif text-sm transition-colors duration-150 select-none"
                            style={{
                              color: isSelected ? app.themeColor : 'rgba(255, 255, 255, 0.7)',
                              textShadow: isSelected ? `0 0 8px ${app.themeColor}` : 'none',
                            }}
                          >
                            {app.runeSymbol}
                          </span>
                        </div>

                        {/* 선택 시 아래에 나타나는 미니 이름 라벨 */}
                        {isSelected && (
                          <div
                            className="absolute -bottom-4 whitespace-nowrap text-[10px] font-semibold px-1.5 py-0.2 rounded-full border shadow-sm"
                            style={{
                              background: 'rgba(6, 8, 18, 0.95)',
                              borderColor: app.themeColor,
                              color: app.themeColor,
                            }}
                          >
                            {app.name}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {/* 🌟 빅뱅 아케인 마법진 매트릭스 (하드웨어 가속, 상시 렌더링 및 누를 때 공명 가속) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
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
                <div className="absolute -inset-2.5 rounded-full border border-cyan-400/25 animate-ping opacity-20 pointer-events-none z-0" />
                <div className="absolute -inset-4 rounded-full border border-purple-400/15 animate-pulse opacity-30 pointer-events-none z-0" />
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
              className={`w-[76px] h-[76px] sm:w-[84px] sm:h-[84px] rounded-full flex flex-col items-center justify-center shrink-0 cursor-pointer outline-none relative overflow-hidden transition-all duration-200 border will-change-transform z-30 ${
                isPressing && isAborted
                  ? 'opacity-70 border-red-500/70 shadow-[0_0_24px_rgba(239,68,68,0.5)]'
                  : isPressing && activePhase === 'wormhole'
                  ? 'border-emerald-300/90 shadow-[0_0_40px_rgba(52,211,153,0.9),0_0_24px_rgba(6,182,212,0.7),inset_0_0_26px_rgba(52,211,153,0.7)]'
                  : isPressing && isWhiteholeMode
                  ? 'border-amber-100/95 shadow-[0_0_40px_rgba(255,255,255,0.95),0_0_28px_rgba(254,240,138,0.8),inset_0_0_24px_rgba(255,255,255,0.9)]'
                  : isPressing && isBlackholeMode
                  ? 'border-purple-900/90 shadow-[0_0_40px_rgba(0,0,0,1),0_0_24px_rgba(147,51,234,0.6),inset_0_0_28px_rgba(0,0,0,1)]'
                  : isPressing
                  ? 'border-cyan-300/80 shadow-[0_0_32px_rgba(56,189,248,0.45),inset_0_0_22px_rgba(56,189,248,0.35)]'
                  : 'border-cyan-400/40 hover:border-cyan-300/80 shadow-[0_0_24px_rgba(56,189,248,0.3)]'
              }`}
              style={{
                background: isPressing && isAborted
                  ? 'radial-gradient(circle at 40% 35%, #1f0b0f 0%, #0d0406 55%, #040102 100%)'
                  : isPressing && activePhase === 'wormhole'
                  ? 'radial-gradient(circle at 50% 50%, #ffffff 0%, #38bdf8 20%, #a855f7 42%, #0e051e 68%, #000000 100%)'
                  : isPressing && isWhiteholeMode
                  ? 'radial-gradient(circle at 40% 30%, #ffffff 0%, #fef3c7 35%, #fde68a 65%, #f59e0b 100%)'
                  : isPressing && isBlackholeMode
                  ? 'radial-gradient(circle at 50% 50%, #000000 0%, #040308 45%, #090514 80%, #020104 100%)'
                  : isPressing
                  ? 'radial-gradient(circle at 35% 30%, #171833 0%, #0e0f21 45%, #060712 80%, #020207 100%)'
                  : 'radial-gradient(circle at 35% 30%, #171833 0%, #0e0f21 45%, #060712 80%, #020207 100%)',
                boxShadow: isPressing && isAborted
                  ? 'inset 0 0 20px rgba(239, 68, 68, 0.4), 0 0 24px rgba(239, 68, 68, 0.5)'
                  : isPressing && activePhase === 'wormhole'
                  ? 'inset 0 0 25px rgba(52, 211, 153, 0.9), 0 0 35px rgba(6, 182, 212, 0.85)'
                  : isPressing && isWhiteholeMode
                  ? 'inset 0 0 25px rgba(255, 255, 255, 0.95), 0 0 35px rgba(253, 230, 138, 0.9)'
                  : isPressing && isBlackholeMode
                  ? 'inset 0 0 30px rgba(0, 0, 0, 1), inset 0 0 15px rgba(88, 28, 135, 0.5), 0 0 40px rgba(0, 0, 0, 0.95)'
                  : isPressing
                  ? 'inset 0 0 22px rgba(56, 189, 248, 0.35), inset -6px -6px 18px rgba(0, 0, 0, 0.9), 0 0 30px rgba(56, 189, 248, 0.45)'
                  : 'inset 0 0 22px rgba(56, 189, 248, 0.25), inset -6px -6px 18px rgba(0, 0, 0, 0.9), 0 0 24px rgba(56, 189, 248, 0.3)',
              }}
              aria-label={
                isChatView
                  ? '빅뱅 버튼 · 탭: 루시 채팅 끄기, 홀드: 크리스탈 오브'
                  : isOrbSite
                  ? '빅뱅 버튼 · 탭: 루시 채팅 켜기, 홀드: 오브 사이트 나가기'
                  : '빅뱅 버튼 · 탭: 루시 채팅 켜기, 홀드: 크리스탈 오브 들어가기'
              }
              title={
                isChatView
                  ? '탭: 루시 채팅 끄기 · 홀드: 크리스탈 오브 · 웜홀: 임의 도약'
                  : isOrbSite
                  ? '탭: 루시 채팅 켜기 · 홀드: 오브 사이트 나가기 · 웜홀: 임의 도약'
                  : '탭: 루시 채팅 켜기 · 홀드: 크리스탈 오브 · 웜홀: 임의 도약'
              }
            >
              {/* 🌀 [웜홀] 빛비춤 + 어두운 심연 + 사건의 지평선 3원 동시 융합 전개 */}
              {isPressing && activePhase === 'wormhole' && (
                <>
                  {/* 🕳️ 심연: 외곽 암흑 흡입 파동 (Blackhole Suction) */}
                  <div className="absolute inset-0 rounded-full pointer-events-none bigbang-suction-wave-1 opacity-80 bg-[radial-gradient(circle_at_center,transparent_25%,rgba(147,51,234,0.45)_65%,black_100%)]" />
                  {/* ☀️ 빛비춤: 중심 찬란한 성광 회전 광선 (Whitehole Rays) */}
                  <div className="absolute inset-0 rounded-full pointer-events-none bigbang-rays-spin opacity-85 bg-[conic-gradient(from_0deg,rgba(255,255,255,0.95)_0deg,transparent_60deg,rgba(254,240,138,0.85)_120deg,transparent_180deg,rgba(255,255,255,0.95)_240deg,transparent_300deg,rgba(255,255,255,0.95)_360deg)]" />
                  {/* 🌌 사건의 지평선: 빛과 어둠이 교차하는 상대론적 소용돌이 (Event Horizon Accretion Vortex) */}
                  <div className="absolute inset-0 rounded-full pointer-events-none bigbang-wormhole-vortex opacity-90 bg-[conic-gradient(from_0deg,rgba(56,189,248,0.9)_0deg,transparent_45deg,rgba(168,85,247,0.85)_90deg,transparent_135deg,rgba(52,211,153,0.85)_180deg,transparent_225deg,rgba(255,255,255,0.95)_270deg,transparent_315deg,rgba(56,189,248,0.9)_360deg)]" />
                </>
              )}

              {/* 홀드 시 블랙홀 어두운 심연 흡입 파동 (Suction Waves) */}
              {isPressing && isBlackholeMode && (
                <>
                  <div className="absolute inset-0 rounded-full pointer-events-none bigbang-suction-wave-1 opacity-75 bg-[radial-gradient(circle_at_center,transparent_25%,rgba(147,51,234,0.35)_65%,black_100%)]" />
                  <div className="absolute inset-0 rounded-full pointer-events-none bigbang-suction-wave-2 opacity-65 bg-[radial-gradient(circle_at_center,transparent_15%,rgba(79,70,229,0.3)_60%,black_100%)]" />
                </>
              )}

              {/* 탭 시 화이트홀 찬란한 빛비춤 방사광 (Starlight Rays) */}
              {isPressing && isWhiteholeMode && (
                <div className="absolute inset-0 rounded-full pointer-events-none bigbang-rays-spin opacity-85 bg-[conic-gradient(from_0deg,rgba(255,255,255,0.95)_0deg,transparent_60deg,rgba(254,240,138,0.85)_120deg,transparent_180deg,rgba(255,255,255,0.95)_240deg,transparent_300deg,rgba(255,255,255,0.95)_360deg)]" />
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

              {/* Event Horizon Deep Singularity Core (크리스탈 구체의 코어 - 화이트홀/블랙홀/웜홀 반응) */}
              <div
                className="absolute inset-2.5 sm:inset-3 rounded-full z-15 pointer-events-none transition-all duration-200 overflow-hidden flex items-center justify-center"
                style={{
                  background: isPressing && activePhase === 'wormhole'
                    ? 'radial-gradient(circle at 45% 35%, #052e16 0%, #064e3b 50%, #022c22 100%)'
                    : isPressing && isWhiteholeMode
                    ? 'radial-gradient(circle at 45% 35%, #ffffff 0%, #fef08a 45%, #f59e0b 100%)'
                    : isPressing && isBlackholeMode
                    ? 'radial-gradient(circle at 50% 50%, #000000 0%, #020206 55%, #05040b 100%)'
                    : 'radial-gradient(circle at 45% 35%, #101228 0%, #090a1a 55%, #03030a 100%)',
                  boxShadow: isPressing && activePhase === 'wormhole'
                    ? '0 0 18px rgba(52, 211, 153, 0.8), inset 0 0 14px rgba(6, 182, 212, 0.7)'
                    : isPressing && isWhiteholeMode
                    ? '0 0 20px rgba(255, 255, 255, 1), inset 0 0 10px rgba(255, 255, 255, 0.9)'
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
