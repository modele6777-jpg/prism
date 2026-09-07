import { WarpPhase, WarpForceMetrics } from './types';

export interface RadialWarpApp {
  id: string;
  name: string;
  title: string;
  path: string;
  icon: string;
  runeSymbol: string;
  runeName: string;
  runeMeaning: string;
  themeColor: string;
  accentGlow: string;
  description: string;
}

/**
 * 7대 정규 앱 시계방향 방사형 워프 맵 (12시 상단부터 시계 방향 배치)
 * 1. 프롤로그 (12시, 0°)
 * 2. 오렌지 (~51.4°)
 * 3. 트리니티 (~102.9°)
 * 4. 아우라 (~154.3°)
 * 5. 블루버드 (~205.7°)
 * 6. 뮤즈 (~257.1°)
 * 7. 에필로그 (~308.6°)
 */
export const RADIAL_WARP_APPS: RadialWarpApp[] = [
  {
    id: 'hub',
    name: '프롤로그',
    title: '프롤로그 허브',
    path: '/',
    icon: '🏛️',
    runeSymbol: 'ᚠ',
    runeName: 'Fehu',
    runeMeaning: '새로운 시작과 운명의 창조',
    themeColor: '#38bdf8',
    accentGlow: 'rgba(56, 189, 248, 0.65)',
    description: '모든 영감과 여정이 교차하는 중심 허브',
  },
  {
    id: 'orange',
    name: '오렌지',
    title: '오렌지 소원의 우물',
    path: '/orange',
    icon: '🍊',
    runeSymbol: 'ᛋ',
    runeName: 'Sowilo',
    runeMeaning: '태양과 소원',
    themeColor: '#f97316',
    accentGlow: 'rgba(249, 115, 22, 0.65)',
    description: '감정 성찰과 소원의 우물에 소망을 띄우는 비밀의 숲',
  },
  {
    id: 'trinity',
    name: '트리니티',
    title: '트리니티 오라클',
    path: '/trinity',
    icon: '🔺',
    runeSymbol: 'ᛈ',
    runeName: 'Pertho',
    runeMeaning: '운명과 무의식',
    themeColor: '#a855f7',
    accentGlow: 'rgba(168, 85, 247, 0.65)',
    description: '내면아이 무의식과 3장의 타로 카드 상징 탐색',
  },
  {
    id: 'heal',
    name: '아우라',
    title: '아우라 치유',
    path: '/heal',
    icon: '🔮',
    runeSymbol: 'ᛉ',
    runeName: 'Algiz',
    runeMeaning: '신성한 수호',
    themeColor: '#10b981',
    accentGlow: 'rgba(16, 185, 129, 0.65)',
    description: '호오포노포노와 심신 에너지 감정 정화 의식',
  },
  {
    id: 'bluebird',
    name: '블루버드',
    title: '블루버드 메신저',
    path: '/bluebird',
    icon: '🐦',
    runeSymbol: 'ᛒ',
    runeName: 'Berkana',
    runeMeaning: '치유와 안식',
    themeColor: '#0ea5e9',
    accentGlow: 'rgba(14, 165, 233, 0.65)',
    description: '소소한 감사와 일상의 온기 기록',
  },
  {
    id: 'muse',
    name: '뮤즈',
    title: '뮤즈 예술처방',
    path: '/muse',
    icon: '🎵',
    runeSymbol: 'ᚹ',
    runeName: 'Wunjo',
    runeMeaning: '예술과 기쁨',
    themeColor: '#ec4899',
    accentGlow: 'rgba(236, 72, 153, 0.65)',
    description: '명화·명시·명곡 3위 일체 심미적 카타르시스',
  },
  {
    id: 'epilogue',
    name: '에필로그',
    title: '에필로그 밤 서재',
    path: '/epilogue',
    icon: '📜',
    runeSymbol: 'ᚨ',
    runeName: 'Ansuz',
    runeMeaning: '지혜와 마감',
    themeColor: '#f59e0b',
    accentGlow: 'rgba(245, 158, 11, 0.65)',
    description: '오늘의 영감과 감정을 한 편의 수필로 엮는 회고',
  },
];

export interface ForceSensorOptions {
  abortDistanceThreshold?: number; // default 88px (범위 밖으로 벗어날 시 안전 취소)
  innerDeadzone?: number; // default 18px (중앙 제자리 압력 모드)
  maxDurationMs?: number; // duration to reach 100% force, default 1100ms
}

/**
 * Parses hardware and virtual touch force, mapping to the Warp Spectrum & Radial Joystick
 */
export function calculateWarpMetrics(
  startTime: number,
  currentTime: number,
  startX: number,
  startY: number,
  currentX: number,
  currentY: number,
  pointerEvent?: PointerEvent | React.PointerEvent,
  options: ForceSensorOptions = {}
): WarpForceMetrics {
  const abortThreshold = options.abortDistanceThreshold ?? 88;
  const innerDeadzone = options.innerDeadzone ?? 18;

  const durationMs = Math.max(0, currentTime - startTime);
  const deltaX = currentX - startX;
  const deltaY = currentY - startY;
  const dist = Math.hypot(deltaX, deltaY);

  // 12시 방향을 0°로 하여 시계 방향으로 0°~360° 각도 산출
  let dragAngleDeg = (Math.atan2(deltaY, deltaX) * 180 / Math.PI) + 90;
  if (dragAngleDeg < 0) dragAngleDeg += 360;

  // 7개 앱 균등 분할 (~51.43° 단위)
  const sectorCount = RADIAL_WARP_APPS.length;
  const sectorSize = 360 / sectorCount;
  const normalizedDeg = (dragAngleDeg + sectorSize / 2) % 360;
  const calculatedSectorIndex = Math.floor(normalizedDeg / sectorSize);

  // 거리 판정:
  // 1) dist > 88px: 유효 조작 반경을 벗어남 -> 취소(isAborted)
  // 2) 18px <= dist <= 88px: 유효 방사형 조이스틱 영역 -> 해당 섹터 앱 조준
  // 3) dist < 18px: 중앙 코어 영역 -> 중립(radialSectorIndex = -1, 제자리 압력 모드)
  const isAborted = dist > abortThreshold;
  const radialSectorIndex = (dist >= innerDeadzone && !isAborted) ? calculatedSectorIndex : -1;

  // 1. Hardware Pressure check
  let hwPressure = 0;
  if (pointerEvent && typeof pointerEvent.pressure === 'number') {
    hwPressure = pointerEvent.pressure;
  }

  // 2. Touch Contact Area check
  let touchArea = 1.0;
  if (pointerEvent) {
    const w = pointerEvent.width || 1;
    const h = pointerEvent.height || 1;
    touchArea = Math.min(3.0, Math.max(1.0, (w * h) / 100));
  }

  // 3. 무한 양방향 호흡 진동 사이클 (Endless Bidirectional Breathing Cycle)
  const cyclePeriod = 1500;
  const cycleProgress = (durationMs % cyclePeriod) / cyclePeriod;
  const triangleOscillation = cycleProgress < 0.5 
    ? (cycleProgress * 2) 
    : ((1 - cycleProgress) * 2);

  const smoothedFactor = (1 - Math.cos(triangleOscillation * Math.PI)) / 2;
  let timeForce = 0.08 + smoothedFactor * 0.92;

  if (hwPressure > 0.4) {
    timeForce = Math.max(timeForce, hwPressure);
  }

  const virtualForce = Math.min(1.0, Math.max(0.08, timeForce));

  let phase: WarpPhase = 'wormhole';
  let eventHorizonMode: 'whitehole' | 'blackhole' | undefined = undefined;

  if (isAborted) {
    phase = 'aborted';
  } else if (radialSectorIndex >= 0) {
    // 🌌 7대 앱으로 튕기거나 조준하는 기능 = 사건의 지평선 (Event Horizon)
    phase = 'event_horizon';
    // ☯️ 사건의 지평선: 빛과 어둠의 호흡에 따라 열리는 자유로운 지평선 차원 전이
    if (durationMs < 250) {
      eventHorizonMode = 'whitehole';
    } else {
      const holdDuration = durationMs - 250;
      const cycleState = Math.floor(holdDuration / 650) % 2;
      eventHorizonMode = cycleState === 0 ? 'whitehole' : 'blackhole';
    }
  } else if (durationMs < 250) {
    // 🌀 제자리에서 가볍게 터치(탭) = 웜홀 (Wormhole: 자유 양자 도약)
    phase = 'wormhole';
  } else {
    // ☯️ 제자리 홀드 유지: 빛(화이트홀)과 어둠(블랙홀)이 실시간으로 교차
    // 250ms 이후부터 650ms 주기로 빛 ⟷ 어둠 영구 교차
    const holdDuration = durationMs - 250;
    const cycleState = Math.floor(holdDuration / 650) % 2; // 0: 빛(화이트홀), 1: 어둠(블랙홀)
    if (cycleState === 0) {
      // ☀️ 빛: 화이트홀 (빛의 차원 방출)
      phase = 'whitehole';
    } else {
      // 🕳️ 어둠: 블랙홀 (심연 차원 흡수)
      phase = 'blackhole';
    }
  }

  return {
    startTime,
    hardwarePressure: hwPressure,
    touchArea,
    durationMs,
    virtualForce,
    isAborted,
    phase,
    dragOffsetX: deltaX,
    dragOffsetY: deltaY,
    dragDistance: dist,
    dragAngleDeg,
    radialSectorIndex,
    eventHorizonMode,
  };
}

/**
 * Maps virtual force (0.0 ~ 1.0) to AI Temperature T (0.0 ~ 1.5)
 */
export function forceToAiTemperature(force: number): number {
  if (force < 0.45) {
    // White Hole: 0.0 ~ 0.25
    return Number((force * (0.25 / 0.45)).toFixed(2));
  }
  if (force < 0.75) {
    // Event Horizon / Wormhole: 0.3 ~ 0.7
    const ratio = (force - 0.45) / 0.30;
    return Number((0.3 + ratio * 0.4).toFixed(2));
  }
  // Black Hole: 0.8 ~ 1.5
  const ratio = (force - 0.75) / 0.25;
  return Number((0.8 + ratio * 0.7).toFixed(2));
}
