/**
 * 🌀 웜홀 전 차원 룬 스펙트럼 (Wormhole Spectrum)
 * - PrismRouteRegistry(단일 진실 공급원)와 100% 연동
 * - 실존하는 유효 페이지/기능만 접근 허용하며 사라진 페이지는 원천 배제
 * - 신규 페이지/기능 추가 시 웜홀 스펙트럼 및 게이지 경로가 자동으로 확장 및 갱신됨
 */

import {
  getActivePrismRoutes,
  PrismRouteDefinition,
} from '@/lib/prismRouteRegistry';
import { getTossRule } from '@/lib/prismTossRegistry';

export interface WormholeAppInfo {
  id: string;
  name: string;
  subName: string;
  path: string;
  icon: string;
  runeSymbol: string;
  runeName: string;
  runeMeaning: string;
  description: string;
  themeColor: string;
  accentGlow: string;
  defaultGaugePercent: number;
}

export const DISALLOWED_WARP_IDS = new Set(['profile', 'handbook', 'library', 'omniwarp']);
export const DISALLOWED_WARP_PATHS = new Set(['/profile', '/handbook', '/library', '/omniwarp']);

/**
 * 라우트 정의를 WormholeAppInfo 규격으로 변환
 */
function routeToWormholeApp(route: PrismRouteDefinition, defaultPercent: number = 50): WormholeAppInfo {
  return {
    id: route.id,
    name: route.name,
    subName: route.subName,
    path: route.path,
    icon: route.icon,
    runeSymbol: route.runeSymbol,
    runeName: route.runeName,
    runeMeaning: route.runeMeaning,
    description: route.description,
    themeColor: route.themeColor,
    accentGlow: route.accentGlow,
    defaultGaugePercent: defaultPercent,
  };
}

/**
 * 현재 활성화된 모든 프리즘 사이트/기능의 웜홀 앱 목록 반환 (하위 호환성 및 동적 갱신 보장)
 * profile, handbook, library, omniwarp는 워프 이동 금지 대상이므로 제외
 */
export function getAllActiveWormholeApps(): WormholeAppInfo[] {
  const activeRoutes = getActivePrismRoutes().filter(
    (r) => !DISALLOWED_WARP_IDS.has(r.id) && !DISALLOWED_WARP_PATHS.has(r.path)
  );
  const total = activeRoutes.length;
  return activeRoutes.map((r, index) => {
    const percent = Math.round(15 + (index / Math.max(1, total - 1)) * 70);
    return routeToWormholeApp(r, percent);
  });
}

/** 하위 호환용 정적 참조 (초기 렌더링용) */
export const ALL_WORMHOLE_APPS: WormholeAppInfo[] = getAllActiveWormholeApps();

/**
 * 현재 페이지 및 맥락에 맞춰 프리즘의 실존 사이트/기능들을 지능형 랭킹하여
 * 웜홀 시공간 스펙트럼에 차례대로 고르게 매핑합니다.
 * (profile, handbook, library, omniwarp는 워프 이동 불가 대상으로 엄격 제외)
 */
export function getRankedWormholeApps(activeRoute: string): WormholeAppInfo[] {
  const norm = (activeRoute || '').replace('/', '').toLowerCase() || 'hub';
  const allActive = getAllActiveWormholeApps();

  // 기본 채널별 시너지 우선순위 템플릿 (profile, handbook, library, omniwarp 전면 배제)
  const priorityOrder: Record<string, string[]> = {
    trinity: ['muse', 'orb', 'orange', 'lucy', 'epilogue', 'bluebird', 'heal', 'hub'],
    oracle: ['muse', 'orb', 'orange', 'lucy', 'epilogue', 'bluebird', 'heal', 'hub'],
    muse: ['orange', 'epilogue', 'trinity', 'lucy', 'bluebird', 'orb', 'heal', 'hub'],
    orange: ['heal', 'bluebird', 'epilogue', 'muse', 'trinity', 'orb', 'lucy', 'hub'],
    heal: ['bluebird', 'orange', 'epilogue', 'muse', 'trinity', 'orb', 'lucy', 'hub'],
    bluebird: ['orange', 'muse', 'heal', 'epilogue', 'trinity', 'orb', 'lucy', 'hub'],
    epilogue: ['trinity', 'heal', 'bluebird', 'muse', 'orange', 'orb', 'lucy', 'hub'],
    profile: ['epilogue', 'trinity', 'lucy', 'orb', 'muse', 'orange', 'heal', 'bluebird', 'hub'],
    orb: ['lucy', 'trinity', 'muse', 'orange', 'heal', 'bluebird', 'epilogue', 'hub'],
    chat: ['orb', 'trinity', 'muse', 'orange', 'bluebird', 'heal', 'epilogue', 'hub'],
    lucy: ['orb', 'trinity', 'muse', 'orange', 'bluebird', 'heal', 'epilogue', 'hub'],
    handbook: ['lucy', 'orb', 'trinity', 'muse', 'epilogue', 'bluebird', 'orange', 'heal', 'hub'],
    library: ['lucy', 'orb', 'trinity', 'muse', 'epilogue', 'bluebird', 'orange', 'heal', 'hub'],
    omniwarp: ['orb', 'lucy', 'trinity', 'orange', 'muse', 'heal', 'bluebird', 'epilogue', 'hub'],
    hub: ['orb', 'lucy', 'trinity', 'muse', 'orange', 'bluebird', 'heal', 'epilogue'],
  };

  const currentOrder = priorityOrder[norm] || [
    'orb',
    'lucy',
    'trinity',
    'orange',
    'bluebird',
    'muse',
    'heal',
    'epilogue',
    'hub',
  ];

  const appMap = new Map(allActive.map((a) => [a.id, a]));
  const ranked: WormholeAppInfo[] = [];

  // 1. 현재 맥락에 맞는 우선순위 목록 순서대로 추가 (금지 대상 제외된 실존 활성 라우트만)
  for (const id of currentOrder) {
    if (DISALLOWED_WARP_IDS.has(id)) continue;
    const app = appMap.get(id);
    if (app && !ranked.some((r) => r.id === app.id)) {
      ranked.push(app);
    }
  }

  // 2. 신규 추가되었거나 누락된 신규 실존 기능/페이지가 있다면 자동으로 뒤에 추가 (금지 대상 제외)
  for (const app of allActive) {
    if (DISALLOWED_WARP_IDS.has(app.id) || DISALLOWED_WARP_PATHS.has(app.path)) continue;
    if (!ranked.some((r) => r.id === app.id)) {
      ranked.push(app);
    }
  }

  // 3. 웜홀 스펙트럼(15% ~ 85%)에 전체 실존 앱을 균등하게 비례 분할 배치
  const total = ranked.length;
  return ranked.map((app, index) => {
    const percent = Math.round(15 + (index / Math.max(1, total - 1)) * 70);
    return {
      ...app,
      defaultGaugePercent: percent,
    };
  });
}

// 🧠 전체 페이지 기준 좌뇌적·의식적·이성적 스펙트럼 순위 (화이트홀 0% 축)
export const GLOBAL_RATIONAL_PAGE_RANKING = [
  'trinity',   // 1위: 사주·점성 데이터 분석과 운명 나침반 (극 이성·체계)
  'epilogue',  // 2위: 영감의 밤 서재 일기 및 지적 회고 (언어·기록)
  'orange',    // 3위: 감정 성찰과 내면의 생각 정리 (성찰·인지)
  'bluebird',  // 4위: 일상의 감사와 마음의 안식 (평온·정돈)
  'heal',      // 5위: 호오포노포노 & 생체 에너지 정화 (신체·리듬)
  'lucy',      // 6위: 루시 1:1 심층 교감 대화 (정서적 유대)
  'muse',      // 7위: 명화·명시·명곡 삼위일체 예술 (예술적 감성)
  'orb',       // 8위: 크리스탈 오브 직관 점술 (극 무의식·초감각)
];

// 🎨 전체 페이지 기준 우뇌적·무의식적·감성적 스펙트럼 순위 (블랙홀 100% 축)
export const GLOBAL_EMOTIONAL_PAGE_RANKING = [
  'orb',       // 1위: 크리스탈 오브 무의식 비춤과 직관 점술 (극 무의식·초직관)
  'muse',      // 2위: 뮤즈 예술처방 명화·명시·명곡 감성 공명 (예술·감성 폭발)
  'lucy',      // 3위: 루시 1:1 심층 감성 대화 (무의식적 감정 토로)
  'heal',      // 4위: 호오포노포노 & 아우라 생체 에너지 정화 (무의식 신체 이완)
  'bluebird',  // 5위: 파랑새의 영혼 안식과 온기 (감성적 위로)
  'orange',    // 6위: 소원의 우물과 감정 투영 (정서적 소망)
  'epilogue',  // 7위: 밤 서재 회고 (이성적 정리)
  'trinity',   // 8위: 사주·점성 데이터 분석 (체계적 구조)
];

/**
 * 🌌 루시 유니버스 동적 차원 도약 생성기:
 * 웜홀, 화이트홀, 블랙홀, 사건의 지평선 그 어떤 것도 목적지나 기능을 사전에 고정해두지 않고,
 * 현재 위치를 제외한 모든 실존 차원 풀에서 자유롭고 유동적으로 도약 차원을 발현시킵니다.
 */
export function getDynamicUniverseApp(
  activeRoute?: string,
  entropyOffset: number = 0,
  seedTime?: number
): WormholeAppInfo {
  const allActive = getAllActiveWormholeApps();
  const normCurrent = (activeRoute || '/').toLowerCase().split('?')[0].replace(/\/$/, '') || '/';
  const normCurrentId = normCurrent.replace('/', '') || 'hub';

  // 현재 머물고 있는 장소를 배제하여 항상 새로운 차원으로 도약 가능하게 필터링
  const available = allActive.filter((a) => {
    const normPath = a.path.toLowerCase().split('?')[0].replace(/\/$/, '') || '/';
    return normPath !== normCurrent && a.id !== normCurrentId;
  });

  const pool = available.length > 0 ? available : allActive;
  const time = seedTime ?? (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const hash = Math.floor((time + entropyOffset * 3571) * 1000) ^ 0x5bd1e995;
  const index = Math.abs(hash) % pool.length;
  return pool[index];
}

/**
 * ☀️ 화이트홀:
 * 좌뇌적·의식적·이성적 스펙트럼 1순위 추천 차원을 도약지로 배정합니다.
 * 현재 머무는 장소를 배제하여 항상 상위 1순위 이성 차원(트리니티 오라클 데이터 분석, 에필로그 밤 서재 회고 등)으로 방출합니다.
 */
export function getWhiteholeRecommendedApp(activeRoute?: string, contextHint?: any, seedTime?: number): WormholeAppInfo {
  const allActive = getAllActiveWormholeApps();
  const normCurrent = (activeRoute || '/').toLowerCase().split('?')[0].replace(/\/$/, '') || '/';
  const normCurrentId = normCurrent.replace('/', '') || 'hub';

  const appMap = new Map(allActive.map((a) => [a.id, a]));
  for (const id of GLOBAL_RATIONAL_PAGE_RANKING) {
    if (id === normCurrentId) continue;
    const target = appMap.get(id);
    if (target && target.path.replace(/\/$/, '') !== normCurrent) {
      return target;
    }
  }
  return allActive[0] || ALL_WORMHOLE_APPS[0];
}

/**
 * 🪞 미러홀 (유리테마):
 * 화이트홀과 블랙홀 사이에 위치하며, 기능은 항시 프리즘 홈(/)으로 귀환합니다.
 */
export function getMirrorholeRecommendedApp(activeRoute?: string): WormholeAppInfo {
  const allActive = getAllActiveWormholeApps();
  const hubApp = allActive.find((a) => a.id === 'hub' || a.path === '/');
  if (hubApp) {
    return {
      ...hubApp,
      name: '프리즘 홈',
      subName: '모든 영감의 시초 허브',
      description: '투명하고 영롱한 크리스탈 유리 거울 면을 통과하여 항시 프리즘 홈으로 연결됩니다.',
      themeColor: '#38bdf8',
      accentGlow: 'rgba(255, 255, 255, 0.95)',
    };
  }
  return {
    id: 'hub',
    name: '프리즘 홈',
    subName: '모든 영감의 시초 허브',
    path: '/',
    icon: '🌌',
    runeSymbol: '🪞',
    runeName: 'Mirror',
    runeMeaning: '진실의 거울과 프리즘 홈',
    description: '투명하고 영롱한 크리스탈 유리 거울 면을 통과하여 항시 프리즘 홈으로 연결됩니다.',
    themeColor: '#38bdf8',
    accentGlow: 'rgba(255, 255, 255, 0.95)',
    defaultGaugePercent: 50,
  };
}

/**
 * 🕳️ 블랙홀:
 * 우뇌적·무의식적·감성적 스펙트럼 1순위 추천 차원을 도약지로 배정합니다.
 * 현재 머무는 장소를 배제하여 항상 상위 1순위 감성·무의식 차원(크리스탈 오브 직관 점술, 뮤즈 예술처방 등)으로 전이합니다.
 */
export function getBlackholeRecommendedApp(activeRoute?: string, contextHint?: any, seedTime?: number): WormholeAppInfo {
  const allActive = getAllActiveWormholeApps();
  const normCurrent = (activeRoute || '/').toLowerCase().split('?')[0].replace(/\/$/, '') || '/';
  const normCurrentId = normCurrent.replace('/', '') || 'hub';

  const appMap = new Map(allActive.map((a) => [a.id, a]));
  for (const id of GLOBAL_EMOTIONAL_PAGE_RANKING) {
    if (id === normCurrentId) continue;
    const target = appMap.get(id);
    if (target && target.path.replace(/\/$/, '') !== normCurrent) {
      return target;
    }
  }
  return allActive[allActive.length - 1] || ALL_WORMHOLE_APPS[1];
}

/**
 * 🕳️ 블랙홀 전용 (하위 호환 래퍼)
 */
export function getLowestRankedWormholeApp(activeRoute: string, contextHint?: any): WormholeAppInfo {
  return getBlackholeRecommendedApp(activeRoute, contextHint);
}

/**
 * 게이지 값(0.0 ~ 1.0)에 따라 현재 웜홀 구간에서 활성화된 앱을 정밀 매핑합니다.
 * 웜홀 구간(0.18 ~ 0.82)을 유저가 지정한 모든 프리즘 실존 차원에 균등 분할 배정
 */
export function getWormholeAppByGauge(
  gauge: number,
  rankedApps: WormholeAppInfo[]
): { app: WormholeAppInfo; index: number; targetPercent: number } {
  const count = rankedApps.length;
  if (count === 0) {
    const fallbackApps = getAllActiveWormholeApps();
    return {
      app: fallbackApps[0] || ALL_WORMHOLE_APPS[0],
      index: 0,
      targetPercent: 50,
    };
  }

  // 웜홀 구간 [0.18, 0.82] 정규화
  const clampedGauge = Math.max(0.18, Math.min(0.82, gauge));
  const normalized = (clampedGauge - 0.18) / (0.82 - 0.18);
  const rawIndex = Math.floor(normalized * count);
  const index = Math.min(count - 1, Math.max(0, rawIndex));

  const app = rankedApps[index] || rankedApps[0];
  return { app, index, targetPercent: app.defaultGaugePercent };
}
