/**
 * OmniWarp Engine & Context Synthesizer
 * 1ms Active View Serialization + <100ms SLM Intent Synthesis + Navigation Routing
 * Fully Unified with Prism Toss Pipeline & Registry
 */

import { OmniWarpContext, OmniWarpTarget, WarpPhase, WarpForceMetrics, BigBangCommitEventDetail } from './types';
import { forceToAiTemperature, RADIAL_WARP_APPS } from './forceSensor';
import { omniWarpAudio } from './omniWarpAudio';
import { triggerHaptic } from './omniWarpHaptics';
import { getTossRule, CHANNEL_TOSS_RULES } from '@/lib/prismTossRegistry';
import { sendPrismToss } from '@/lib/prismToss';
import {
  getRankedWormholeApps,
  getLowestRankedWormholeApp,
  getWhiteholeRecommendedApp,
  getBlackholeRecommendedApp,
  getWormholeAppByGauge,
} from './wormholeSpectrum';
import { getPrismRouteByPathOrId, resolveCanonicalPath } from '@/lib/prismRouteRegistry';
import {
  extractLatestDialogueContext,
  recordCrossAppDialogue,
  synthesizePersonaHandoffPrompt,
} from '@/lib/prismPersonaSync';

const OMNIWARP_STORAGE_KEY = 'prism_active_omniwarp_payload';

/**
 * 1단계: 인앱 뷰 직렬화 (1ms 내 완료)
 */
export function serializeCurrentView(activePath: string): OmniWarpContext {
  const normPath = (activePath || '/').toLowerCase();
  let title = '프롤로그 허브';
  let summary = '모든 채널의 영감과 여정이 교차하는 중심 허브';
  let primarySubject = '우주적 시선과 오늘의 상태';
  const sessionData: Record<string, any> = {};

  // 1. 최신 대화 맥락(유저 질문 + AI 페르소나 응답) 실시간 캡처 & 동기화
  const lastDialogue = extractLatestDialogueContext(activePath);
  if (lastDialogue) {
    sessionData.lastDialogue = lastDialogue;
    recordCrossAppDialogue(lastDialogue);
    if (lastDialogue.lastUserMessage) {
      summary = `[${lastDialogue.sourcePersonaName}] "${lastDialogue.lastUserMessage.slice(0, 60)}"`;
      primarySubject = `이전 대화 맥락: ${lastDialogue.lastUserMessage.slice(0, 40)}`;
    }
  }

  if (normPath.includes('trinity')) {
    title = '트리니티 오라클';
    summary = '내면아이 무의식과 3장의 타로 카드 상징';
    primarySubject = '운명과 무의식의 상징 탐색';
    try {
      const oracleItem = localStorage.getItem('prism_oracle_last_reading');
      if (oracleItem) sessionData.oracleReading = JSON.parse(oracleItem);
    } catch (_) {}
  } else if (normPath.includes('muse')) {
    title = '뮤즈 예술처방';
    summary = '명화·명시·명곡 3위 일체 예술적 공명';
    primarySubject = '감성과 심미적 카타르시스';
    try {
      const tossData = sessionStorage.getItem('prism_active_toss_payload');
      if (tossData) sessionData.artContext = JSON.parse(tossData);
    } catch (_) {}
  } else if (normPath.includes('orange')) {
    title = '오렌지 성찰 & 소원의 우물';
    summary = '불안과 감정을 성찰하고 소원의 우물에 소망을 띄우는 비밀의 숲';
    primarySubject = '내면 성찰과 소원의 우물';
  } else if (normPath.includes('heal')) {
    title = '호오포노포노 & 아우라 치유';
    summary = '미안·용서·감사·사랑 4마디 감정 정화 의식';
    primarySubject = '내면 상처 정화와 에너지 회복';
  } else if (normPath.includes('bluebird')) {
    title = '파랑새의 일상 행복';
    summary = '소소한 감사와 일상의 온기 기록';
    primarySubject = '감사와 평온';
  } else if (normPath.includes('epilogue')) {
    title = '에필로그 밤 서재';
    summary = '오늘의 영감과 감정을 한 편의 수필로 엮는 회고';
    primarySubject = '하루 마감과 영감의 정돈';
  } else if (normPath.includes('chat') || normPath.includes('lucy')) {
    title = '루시 1:1 심층 대화';
    summary = '영혼의 가이드 루시와의 지혜로운 공명';
    primarySubject = '내면의 고민과 깊은 치유 대화';
  } else if (normPath.includes('orb') || normPath.includes('crystal') || normPath.includes('gateway')) {
    title = '크리스탈 오브';
    summary = '마음속 질문을 투영하는 독립 직관 도구';
    primarySubject = '직관과 영적 해답 점술';
    try {
      const orbRaw = localStorage.getItem('prism_orb_latest_scrying');
      if (orbRaw) {
        const orb = JSON.parse(orbRaw);
        sessionData.orbInsight = orb;
        if (orb.keyTheme && orb.directAnswer) {
          summary = `[직관: ${orb.keyTheme}] ${orb.directAnswer.slice(0, 60)}`;
          primarySubject = `직관의 해답 (${orb.keyTheme}): ${orb.directAnswer.slice(0, 40)}`;
        }
      }
    } catch (_) {}
  }

  return {
    activeRoute: activePath,
    activeTitle: title,
    summary,
    primarySubject,
    sessionData,
    capturedAt: Date.now(),
  };
}

export const ORB_SITE_RUNES: Record<string, { symbol: string; name: string; meaning: string }> = {
  lucy: { symbol: 'ᛞ', name: 'Dagaz', meaning: '새벽의 빛과 자각' },
  chat: { symbol: 'ᛞ', name: 'Dagaz', meaning: '새벽의 빛과 자각' },
  orb: { symbol: 'ᛟ', name: 'Othala', meaning: '직관의 성소' },
  crystal: { symbol: 'ᛟ', name: 'Othala', meaning: '직관의 성소' },
  gateway: { symbol: 'ᛟ', name: 'Othala', meaning: '직관의 성소' },
  orange: { symbol: 'ᛋ', name: 'Sowilo', meaning: '태양과 실행' },
  muse: { symbol: 'ᚹ', name: 'Wunjo', meaning: '예술과 기쁨' },
  oracle: { symbol: 'ᛈ', name: 'Pertho', meaning: '운명과 무의식' },
  trinity: { symbol: 'ᛈ', name: 'Pertho', meaning: '운명과 무의식' },
  hoponopono: { symbol: 'ᚷ', name: 'Gebo', meaning: '화해와 정화' },
  lettinggo: { symbol: 'ᛉ', name: 'Algiz', meaning: '보호와 내려놓음' },
  heal: { symbol: 'ᛉ', name: 'Algiz', meaning: '보호와 내려놓음' },
  bluebird: { symbol: 'ᛒ', name: 'Berkana', meaning: '치유와 안식' },
  epilogue: { symbol: 'ᚨ', name: 'Ansuz', meaning: '지혜와 마감' },
  handbook: { symbol: 'ᚱ', name: 'Raidho', meaning: '영혼의 여정과 바이블' },
  rebible: { symbol: 'ᚱ', name: 'Raidho', meaning: '영혼의 여정과 바이블' },
  library: { symbol: 'ᛗ', name: 'Mannaz', meaning: '영혼의 지식 도서관' },
  hub: { symbol: 'ᚠ', name: 'Fehu', meaning: '새로운 시작과 운명의 창조' },
  universe: { symbol: 'ᚠ', name: 'Fehu', meaning: '새로운 시작과 운명의 창조' },
};

export function getOrbRunicSigil(destId: string): { symbol: string; name: string; meaning: string } {
  const route = getPrismRouteByPathOrId(destId);
  if (route) {
    return { symbol: route.runeSymbol, name: route.runeName, meaning: route.runeMeaning };
  }
  const norm = (destId || '').toLowerCase().replace('/', '');
  return ORB_SITE_RUNES[norm] || { symbol: 'ᚲ', name: 'Kenaz', meaning: '프리즘 우주' };
}

export function isDisallowedWarpDestination(destIdOrPath: string): boolean {
  const norm = (destIdOrPath || '').toLowerCase().replace('/', '');
  return (
    norm === 'profile' ||
    norm === 'handbook' ||
    norm === 'library' ||
    norm === 'omniwarp' ||
    norm === 'bigbang'
  );
}

export interface QuantumDestination {
  id: string;
  name: string;
  subName: string;
  path: string;
  icon: string;
  runeSymbol: string;
  runeName: string;
  themeColor: string;
  accentGlow: string;
  description: string;
}

/**
 * 🌌 블랙홀 탭 시 무작위 불시착 가능한 프리즘 우주 실존 장소 및 활성 기능 풀 (9대 차원)
 * (삭제되거나 차단된 profile, handbook, library, omniwarp 등은 엄격 배제)
 */
export const QUANTUM_BLACKHOLE_DESTINATIONS: QuantumDestination[] = [
  {
    id: 'lucy',
    name: '루시 심층 상담',
    subName: '1:1 영혼의 가이드',
    path: '/chat',
    icon: '✨',
    runeSymbol: 'ᛞ',
    runeName: 'Dagaz',
    themeColor: '#c084fc',
    accentGlow: 'rgba(192, 132, 252, 0.85)',
    description: '루시와의 1:1 심층 대화 및 지혜로운 영혼의 조언',
  },
  {
    id: 'orb',
    name: '크리스탈 오브',
    subName: '마음의 질문과 직관 예지',
    path: '/orb',
    icon: '🔮',
    runeSymbol: 'ᛟ',
    runeName: 'Othala',
    themeColor: '#38bdf8',
    accentGlow: 'rgba(56, 189, 248, 0.85)',
    description: '마음속 깊은 고민을 비추는 3D 크리스탈 오브 직관 점술',
  },
  {
    id: 'orange',
    name: '오렌지 소원의 우물',
    subName: '감정 성찰과 소원의 우물',
    path: '/orange',
    icon: '🍊',
    runeSymbol: 'ᛋ',
    runeName: 'Sowilo',
    themeColor: '#f97316',
    accentGlow: 'rgba(249, 115, 22, 0.85)',
    description: '비밀의 숲 소원의 우물에 마음의 소망을 띄우는 감정 성찰',
  },
  {
    id: 'trinity',
    name: '트리니티 오라클',
    subName: '3장 타로 운명 나침반',
    path: '/trinity',
    icon: '🔺',
    runeSymbol: 'ᛈ',
    runeName: 'Pertho',
    themeColor: '#a855f7',
    accentGlow: 'rgba(168, 85, 247, 0.85)',
    description: '3장의 타로 카드와 사주 데이터로 무의식 상징 탐색',
  },
  {
    id: 'heal',
    name: '아우라 치유',
    subName: '호오포노포노 & 생체 에너지',
    path: '/heal',
    icon: '🌊',
    runeSymbol: 'ᛉ',
    runeName: 'Algiz',
    themeColor: '#06b6d4',
    accentGlow: 'rgba(6, 182, 212, 0.85)',
    description: '미안·용서·감사·사랑 4마디 감정 정화와 생체 에너지 회복',
  },
  {
    id: 'bluebird',
    name: '파랑새의 성소',
    subName: '영혼의 평온과 감사',
    path: '/bluebird',
    icon: '🐦',
    runeSymbol: 'ᛒ',
    runeName: 'Berkana',
    themeColor: '#38bdf8',
    accentGlow: 'rgba(56, 189, 248, 0.85)',
    description: '지친 마음에 일상의 평온과 행복, 따뜻한 감사의 온기 기록',
  },
  {
    id: 'muse',
    name: '뮤즈 예술처방',
    subName: '명화·명시·명곡 삼위일체',
    path: '/muse',
    icon: '🎨',
    runeSymbol: 'ᚹ',
    runeName: 'Wunjo',
    themeColor: '#ec4899',
    accentGlow: 'rgba(236, 72, 153, 0.85)',
    description: '고민과 감정에 공명하는 세계적 예술작품 삼위일체 심미 처방',
  },
  {
    id: 'epilogue',
    name: '에필로그 밤 서재',
    subName: '영감의 밤 서재 일기',
    path: '/epilogue',
    icon: '📖',
    runeSymbol: 'ᚨ',
    runeName: 'Ansuz',
    themeColor: '#34d399',
    accentGlow: 'rgba(52, 211, 153, 0.85)',
    description: '오늘의 영감과 감정을 한 편의 수필처럼 정리하는 회고',
  },
  {
    id: 'hub',
    name: '프롤로그 허브',
    subName: '우주의 시초와 중심',
    path: '/',
    icon: '🌌',
    runeSymbol: 'ᚲ',
    runeName: 'Kenaz',
    themeColor: '#00f0ff',
    accentGlow: 'rgba(0, 240, 255, 0.85)',
    description: '모든 차원의 영감과 가능성이 수렴하는 우주의 시초 허브',
  },
];

export function pickRandomQuantumDestination(
  currentRoute: string,
  seedTime?: number
): QuantumDestination {
  const normCurrent = (currentRoute || '/').toLowerCase().split('?')[0].replace(/\/$/, '') || '/';
  
  // 현재 머물고 있는 장소 및 삭제/차단된 장소를 완벽히 배제
  const candidates = QUANTUM_BLACKHOLE_DESTINATIONS.filter((d) => {
    if (isDisallowedWarpDestination(d.id) || isDisallowedWarpDestination(d.path)) return false;
    const normDest = d.path.toLowerCase().replace(/\/$/, '') || '/';
    return normDest !== normCurrent;
  });

  const validPool = QUANTUM_BLACKHOLE_DESTINATIONS.filter(
    (d) => !isDisallowedWarpDestination(d.id) && !isDisallowedWarpDestination(d.path)
  );

  const pool = candidates.length > 0 ? candidates : validPool;
  const time = seedTime ?? (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const hash = Math.floor(time * 1000) ^ (Math.floor(time) * 1103515245) ^ 0x5bd1e995;
  const idx = Math.abs(hash) % pool.length;
  return pool[idx];
}

/**
 * 2단계: 터치 압력/온도 기반 온디바이스 SLM 맥락 합성 (<100ms)
 * - 블랙홀 (탭): 시공간 특이점에 빨려 들어가 임의의 장소나 기능으로 양자 도약
 * - 화이트홀 (홀드): 제자리에서 꾹 누를 시 1순위 연계 정규 차원으로 다이렉트 방출
 * - 사건의 지평선 (드래그): 버튼을 밀어 7개 앱을 직접 조준 워프
 */
export function synthesizeWarpTarget(context: OmniWarpContext, metrics: WarpForceMetrics): OmniWarpTarget {
  const norm = context.activeRoute.replace('/', '') || 'hub';
  const rule = getTossRule(norm, context.sessionData);
  const T = forceToAiTemperature(metrics.virtualForce);

  // 워프 불가 목적지 필터링
  const sanitizeDest = (dest: any) => {
    if (!dest || isDisallowedWarpDestination(dest.id) || isDisallowedWarpDestination(dest.path)) {
      return {
        id: 'hub',
        name: '프롤로그 허브',
        subName: '프리즘 우주의 중심',
        path: '/',
        icon: '🌌',
        description: '모든 차원의 영감과 가능성이 수렴하는 우주의 시초 허브',
        themeColor: '#00f0ff',
      };
    }
    return dest;
  };

  // 🎯 0단계: 7대 앱 방사형 조이스틱 튕기기 = 사건의 지평선 (Event Horizon)
  // 🌌 사건의 지평선: 목적지나 기능을 정해두지 않고, 경계면의 시공간 왜곡 속에서 자유롭게 열리는 차원 도약
  if (
    metrics.radialSectorIndex !== undefined &&
    metrics.radialSectorIndex >= 0 &&
    metrics.radialSectorIndex < RADIAL_WARP_APPS.length &&
    !metrics.isAborted
  ) {
    const radialApp = RADIAL_WARP_APPS[metrics.radialSectorIndex];
    const isWhiteholeMode = metrics.eventHorizonMode === 'whitehole' || metrics.phase === 'whitehole';
    const seed = (metrics.startTime || Date.now()) + metrics.radialSectorIndex * 137;

    // 목적지나 기능을 사전에 고정해두지 않고, 경계면 파동에 따라 자유롭게 차원 연결
    const rawDest = isWhiteholeMode
      ? getWhiteholeRecommendedApp(context.activeRoute, context.sessionData, seed)
      : getBlackholeRecommendedApp(context.activeRoute, context.sessionData, seed + 883);

    const dest = sanitizeDest(rawDest);
    const safePath = resolveCanonicalPath(dest.path);
    const rune = getOrbRunicSigil(dest.id);

    return {
      id: dest.id,
      icon: dest.icon || radialApp.icon,
      phase: 'event_horizon',
      eventHorizonMode: isWhiteholeMode ? 'whitehole' : 'blackhole',
      gauge: Math.max(0.35, metrics.virtualForce),
      aiTemperature: T,
      title: dest.name,
      actionType: `event_horizon_${isWhiteholeMode ? 'radiant' : 'singularity'}_${dest.id}`,
      destinationPath: safePath,
      previewLabel: `[사건의 지평선] 🌌 ${radialApp.name} ➔ ${dest.name}`,
      previewDescription: `사건의 지평선 경계면 왜곡을 뚫고 [${dest.name} · ${dest.subName}] 차원으로 전이합니다.`,
      themeColor: dest.themeColor || radialApp.themeColor || '#a855f7',
      accentGlow: isWhiteholeMode ? 'rgba(56, 189, 248, 0.75)' : 'rgba(168, 85, 247, 0.85)',
      stageIndex: metrics.radialSectorIndex + 1,
      runeSymbol: rune.symbol || radialApp.runeSymbol,
      runeName: rune.name || radialApp.runeName,
    };
  }

  // 1. 탭하면 웜홀 (목적지나 기능이 정해져 있지 않은 자유 양자 도약)
  if (metrics.phase === 'wormhole') {
    const dest = pickRandomQuantumDestination(context.activeRoute, metrics.startTime);
    const safePath = resolveCanonicalPath(dest.path);
    return {
      id: dest.id,
      icon: dest.icon,
      phase: 'wormhole',
      gauge: metrics.virtualForce,
      aiTemperature: T,
      title: dest.name,
      actionType: `wormhole_quantum_${dest.id}`,
      destinationPath: safePath,
      previewLabel: `[웜홀 도약] 🌀 ${dest.runeSymbol} ${dest.name}`,
      previewDescription: `시공간 웜홀의 양자 요동을 타고 [${dest.name} · ${dest.subName}] 차원으로 자유롭게 도약합니다.`,
      themeColor: dest.themeColor || '#38bdf8',
      accentGlow: dest.accentGlow || 'rgba(56, 189, 248, 0.65)',
      stageIndex: 1,
      runeSymbol: dest.runeSymbol,
      runeName: dest.runeName,
    };
  }

  // 2. 홀드 중 빛이면 화이트홀 (목적지나 기능이 정해져 있지 않은 빛의 차원 방출)
  if (metrics.phase === 'whitehole') {
    const rawDest = getWhiteholeRecommendedApp(context.activeRoute, context.sessionData, metrics.startTime);
    const dest = sanitizeDest(rawDest);
    const rune = getOrbRunicSigil(dest.id);
    const safePath = resolveCanonicalPath(dest.path);
    return {
      id: dest.id,
      icon: dest.icon,
      phase: 'whitehole',
      gauge: metrics.virtualForce,
      aiTemperature: T,
      title: dest.name,
      actionType: 'omniwarp_whitehole',
      destinationPath: safePath,
      previewLabel: `[화이트홀 방출] ☀️ ${rune.symbol} ${dest.name}`,
      previewDescription: `화이트홀의 강력한 빛 에너지를 타고 [${dest.name} · ${dest.subName}] 차원으로 방출됩니다.`,
      themeColor: dest.themeColor || '#38bdf8',
      accentGlow: 'rgba(56, 189, 248, 0.55)',
      stageIndex: 9,
      runeSymbol: rune.symbol,
      runeName: rune.name,
    };
  }

  // 3. 홀드 중 어둠이면 블랙홀 (목적지나 기능이 정해져 있지 않은 심연 특이점 전이)
  const rawBlackhole = getBlackholeRecommendedApp(context.activeRoute, context.sessionData, metrics.startTime);
  const blackholeDest = sanitizeDest(rawBlackhole);
  const rune = getOrbRunicSigil(blackholeDest.id);
  const safePath = resolveCanonicalPath(blackholeDest.path);
  return {
    id: blackholeDest.id,
    icon: blackholeDest.icon,
    phase: 'blackhole',
    gauge: metrics.virtualForce,
    aiTemperature: T,
    title: blackholeDest.name,
    actionType: 'omniwarp_blackhole',
    destinationPath: safePath,
    previewLabel: `[블랙홀 흡수] 🕳️ ${rune.symbol} ${blackholeDest.name}`,
    previewDescription: `블랙홀의 무한한 중력 특이점에 이끌려 [${blackholeDest.name} · ${blackholeDest.subName}] 차원으로 전이합니다.`,
    themeColor: blackholeDest.themeColor || '#a855f7',
    accentGlow: 'rgba(168, 85, 247, 0.75)',
    stageIndex: 2,
    runeSymbol: rune.symbol,
    runeName: rune.name,
  };
}

/**
 * 3단계: 빅뱅 커밋 (Big Bang Commit) 실행 및 내비게이션 라우팅
 * 원터치 자동 발화(Auto-Trigger) 및 통합 토스 엔진(sendPrismToss)과 100% 동기화
 */
export function executeBigBangCommit(
  target: OmniWarpTarget,
  context: OmniWarpContext,
  metrics: WarpForceMetrics
): void {
  // 워프 불가 4대 목적지(profile, handbook, library, omniwarp) 원천 차단 가드
  if (isDisallowedWarpDestination(target.id || '') || isDisallowedWarpDestination(target.destinationPath || '')) {
    console.warn(`[OmniWarp Guard] Prohibited warp destination blocked: ${target.id} (${target.destinationPath})`);
    omniWarpAudio.playAbort();
    triggerHaptic('abort');
    return;
  }

  // 1. Audio & Haptic Impact Kick
  omniWarpAudio.playBigBang();
  triggerHaptic('bigbang');

  // 2. 통합 토스 페이로드 전송 (타깃 앱에서 getPendingPrismToss로 즉시 수신 및 자동 발화)
  const sourceApp = context.activeRoute.replace('/', '') || 'hub';
  const targetApp = target.destinationPath.replace('/', '') || 'hub';

  // AI 원터치 자동 발화 및 페르소나 상태 동기화 프롬프트(autoPrompt) 지능형 합성
  const lastDialogue = context.sessionData?.lastDialogue || extractLatestDialogueContext(context.activeRoute);
  let autoPrompt = synthesizePersonaHandoffPrompt(lastDialogue, targetApp);

  const orb = context.sessionData?.orbInsight;
  const oracle = context.sessionData?.oracleReading;
  const art = context.sessionData?.artContext;

  if (orb?.keyTheme && orb?.directAnswer && (targetApp.includes('lucy') || targetApp.includes('chat'))) {
    autoPrompt = `루시야, 방금 크리스탈 오브에서 [${orb.keyTheme}] 직관 해답을 마주했어:\n• 나의 질문: "${orb.query}"\n• 직관의 해답: "${orb.directAnswer}"\n• 실천 가이드: "${orb.actionSolution}"\n\n이 해답의 깊은 의미를 풀이해주고, 오늘 내가 당장 실천에 옮길 수 있는 구체적인 행동 가이드를 들려줘.`;
  } else if (oracle?.cards && oracle.cards.length > 0 && (targetApp.includes('lucy') || targetApp.includes('chat'))) {
    const cardNames = oracle.cards.map((c: any) => c.nameKo || c.name).join(', ');
    autoPrompt = `루시야, 방금 오라클 타로에서 [${cardNames}] 카드를 마주했어. 내 무의식의 상징과 현재 운의 흐름을 풀이해주고, 오늘 내가 취해야 할 마음가짐을 가이드해줘.`;
  } else if (art?.anchorArtworkTitle && (targetApp.includes('lucy') || targetApp.includes('chat'))) {
    autoPrompt = `루시야, 방금 뮤즈에서 명작 "${art.anchorArtworkTitle}"의 예술 처방을 감상했어. 이 예술적 울림과 영감을 바탕으로 내 마음에 힘이 되는 이야기를 들려줘.`;
  }

  sendPrismToss({
    sourceApp,
    targetApp,
    actionType: `omniwarp_${target.phase}`,
    contextMessage: `[옴니워프 ${target.phase === 'whitehole' ? '화이트홀' : target.phase === 'event_horizon' ? '사건의 지평선' : target.phase === 'wormhole' ? '웜홀' : '블랙홀'}] ${context.primarySubject || context.activeTitle}`,
    cards: context.sessionData?.oracleReading?.cards,
    anchorArtworkTitle: context.sessionData?.artContext?.anchorArtworkTitle,
    anchorArtQuote: context.sessionData?.artContext?.anchorArtQuote,
    autoTrigger: true,
    autoPrompt,
    personaDialogue: lastDialogue,
    orbInsight: orb,
    tossedAt: Date.now(),
  });

  // 3. Serialize OmniWarp Specific Payload
  const payload: BigBangCommitEventDetail = {
    phase: target.phase,
    target,
    context,
    metrics,
    timestamp: Date.now(),
  };

  try {
    sessionStorage.setItem(OMNIWARP_STORAGE_KEY, JSON.stringify(payload));
    localStorage.setItem(OMNIWARP_STORAGE_KEY, JSON.stringify(payload));
  } catch (_) {}

  // 4. Dispatch Big Bang Expansion Screen Event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('prism:bigbang_commit', {
        detail: payload,
      })
    );

    // 5. Smooth Navigation Routing with cosmological timing
    const safePath = resolveCanonicalPath(target.destinationPath);
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent('prism-navigate', {
          detail: { path: safePath },
        })
      );
      window.dispatchEvent(
        new CustomEvent('nav-click-active', {
          detail: { path: safePath },
        })
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 280);
  }
}
