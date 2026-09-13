/**
 * 🌀 contextNavCycleEngine.ts
 * =========================================================================
 * 🎯 빅뱅 버튼 드래그 전용 맥락 감지 & 사이클 추천 엔진
 * -------------------------------------------------------------------------
 * - 텍스트 선택(스크롤)이 없는 상태에서 빅뱅 버튼을 드래그했을 때:
 *   현재 페이지 및 최근 활동/대화의 맥락(context)을 자동 분석하여
 *   "다음 메뉴가 어디가 좋을지" 자동 추천 1순위 메뉴로만 안내합니다.
 * - [사이클 방문 관리 (Cycle-Based History)]:
 *   이번 사이클에서 이미 방문했던 메뉴는 배제하고 남은 후보 중 최적 1위로 이동하며,
 *   전체 후보군을 모두 1회씩 방문하여 한 사이클이 끝나면 사이클 번호가 증가하고
 *   방문 이력이 리셋되어 다음 사이클에서 다시 진입할 수 있습니다.
 * =========================================================================
 */

import { safeLocalStorage } from '@/utils/safeStorage';
import {
  PRISM_ALL_APP_DESTINATIONS,
  PrismMenuDestination,
  isSameAppOrPage,
} from '@/lib/selectionContextRecommender';
import { serializeCurrentView } from './omniWarpEngine';
import { extractLatestDialogueContext } from '@/lib/prismPersonaSync';
import { isDisallowedWarpDestination } from './wormholeSpectrum';
import { resolveCanonicalPath } from '@/lib/prismRouteRegistry';

export interface ContextCycleStats {
  visitedCount: number;
  totalCount: number;
  remainingCount: number;
  cycleIndex: number;
  isFullCycleCompleted: boolean;
}

export interface ContextRecommendationCycleState {
  cycleIndex: number;
  visitedIds: string[];
  lastVisitedId: string | null;
  lastJumpTime: number;
}

export interface ContextNextMenuResult {
  menu: PrismMenuDestination;
  reason: string;
  score: number;
  safePath: string;
  stats: ContextCycleStats;
}

const CONTEXT_CYCLE_STORAGE_KEY = 'prism_drag_context_cycle_state_v1';

/**
 * 🧠 1. 현재 화면 및 직전 활동의 맥락 텍스트 종합 추출
 */
export function extractAutoContextText(currentPath: string): string {
  const parts: string[] = [];

  // 1-1. 각 채널/루시/오브의 최근 대화 맥락 추출
  const lastDialogue = extractLatestDialogueContext(currentPath);
  if (lastDialogue) {
    if (lastDialogue.lastUserMessage) parts.push(lastDialogue.lastUserMessage);
    if (lastDialogue.dominantEmotionOrTheme) parts.push(lastDialogue.dominantEmotionOrTheme);
    if (lastDialogue.summary) parts.push(lastDialogue.summary);
    if (lastDialogue.lastAssistantMessage) parts.push(lastDialogue.lastAssistantMessage.slice(0, 160));
  }

  // 1-2. 현재 인앱 뷰의 직렬화 정보 (타이틀, 주 주제, 요약)
  const view = serializeCurrentView(currentPath);
  if (view) {
    if (view.activeTitle) parts.push(view.activeTitle);
    if (view.primarySubject) parts.push(view.primarySubject);
    if (view.summary) parts.push(view.summary);
  }

  // 1-3. 브라우저 도큐먼트 타이틀 보강
  if (typeof document !== 'undefined' && document.title) {
    parts.push(document.title);
  }

  return parts.join(' ').trim();
}


/**
 * 📊 2. 가용한 목적지 후보군 필터링 및 맥락 점수 산출
 */
export function rankAvailableMenusByContext(
  contextText: string,
  currentPath: string = ''
): Array<{ menu: PrismMenuDestination; score: number; reason: string }> {
  const trimmed = (contextText || '').trim().toLowerCase();

  // (1) 현재 위치 및 워프 불가 목적지 엄격 배제 (현재 동일한 페이지는 100% 원천 배제)
  const validDestinations = PRISM_ALL_APP_DESTINATIONS.filter((menu) => {
    // 1) 워프 불가 ID 및 경로 제외 (프로필, 핸드북, 라이브러리, 오브 사이트, 루시 채팅 등)
    if (isDisallowedWarpDestination(menu.id) || isDisallowedWarpDestination(menu.path)) {
      return false;
    }
    if (menu.path === '/' || menu.path === '/universe') {
      return false;
    }

    // 2) 현재 머무르고 있는 페이지 배제 (자기 자신 및 동일 앱/채널로의 무의미한 재진입 원천 방지)
    if (isSameAppOrPage(menu.path, currentPath) || isSameAppOrPage(menu.basePath, currentPath)) {
      return false;
    }

    return true;
  });

  // 폴백이 필요한 경우에도 현재 동일한 페이지는 철저히 배제
  const nonCurrentPool = PRISM_ALL_APP_DESTINATIONS.filter(
    (m) =>
      !isDisallowedWarpDestination(m.id) &&
      !isDisallowedWarpDestination(m.path) &&
      m.path !== '/' &&
      m.path !== '/universe' &&
      !isSameAppOrPage(m.path, currentPath) &&
      !isSameAppOrPage(m.basePath, currentPath)
  );

  const pool = validDestinations.length > 0 ? validDestinations : nonCurrentPool;

  // (2) 맥락 점수 채점 (키워드 매칭 + 정규식 의도 + 감정/주제 시너지 가중치)
  const scored = pool.map((menu) => {
    let score = 5; // 기본 베이스 점수

    // 1. 키워드 매칭
    for (const kw of menu.keywords) {
      if (trimmed.includes(kw.toLowerCase())) {
        score += Math.max(kw.length * 3, 6);
      }
    }

    // 2. 정규식 의도 매칭
    if (menu.intentRegex.test(trimmed)) {
      score += 24;
    }

    // 3. 상황·감정별 시너지 가중치
    if (/슬프|눈물|괴로|힘들|외로|아파|상처|울적|우울/.test(trimmed)) {
      if (menu.id === 'bluebird_sanctuary' || menu.id === 'heal_hoponopono') score += 20;
      if (menu.id === 'orange_mind' || menu.id === 'muse_art' || menu.id === 'bluebird_forest') score += 15;
    }
    if (/바라|소원|성공|이루|하고 싶|꿈|목표|소망|희망/.test(trimmed)) {
      if (menu.id === 'orange_well' || menu.id === 'trinity_oracle') score += 20;
      if (menu.id === 'trinity_saju' || menu.id === 'orange_affirmation' || menu.id === 'epilogue_capsule') score += 16;
    }
    if (/돈|재물|금전|사업|투자|부자|직장|취업|월급|계약|이직/.test(trimmed)) {
      if (menu.id === 'trinity_wealth' || menu.id === 'trinity_saju') score += 26;
    }
    if (/사랑|연애|궁합|이성|남친|여친|인연|결혼|썸|헤어짐|이별/.test(trimmed)) {
      if (menu.id === 'trinity_relationship' || menu.id === 'trinity_oracle') score += 26;
    }
    if (/피곤|지쳤|숨|뻐근|목|어깨|스트레스|휴식|졸려|답답|불안/.test(trimmed)) {
      if (menu.id === 'heal_wellness' || menu.id === 'heal_breathing' || menu.id === 'hub_ecpr') score += 22;
      if (menu.id === 'heal_sedona' || menu.id === 'bluebird_sanctuary' || menu.id === 'heal_frequency') score += 16;
    }
    if (/차크라|에너지|오라|기운|명상|수련|생체/.test(trimmed)) {
      if (menu.id === 'heal_chakra' || menu.id === 'heal_frequency' || menu.id === 'hub_ecpr') score += 22;
    }
    if (/생각|정리|오늘|하루|마무리|기억|적어|일기|추억|밤/.test(trimmed)) {
      if (menu.id === 'epilogue_journal' || menu.id === 'epilogue_retrospect' || menu.id === 'epilogue_stars') score += 22;
      if (menu.id === 'trinity_daily' || menu.id === 'epilogue_diary') score += 16;
    }
    if (/노래|그림|시|글귀|예술|선율|아름다|감상|도슨트|음악/.test(trimmed)) {
      if (menu.id === 'muse_art' || menu.id === 'muse_docent' || menu.id === 'muse_poem' || menu.id === 'muse_music') score += 24;
    }
    if (/편지|전하고|메시지|우체통|글을 띄우|소통/.test(trimmed)) {
      if (menu.id === 'bluebird_letter' || menu.id === 'epilogue_capsule') score += 22;
    }

    return {
      menu,
      score,
      reason: menu.contextReason,
    };
  });

  // 점수 높은 순 정렬
  scored.sort((a, b) => b.score - a.score);

  return scored;
}

/**
 * 💾 3. 사이클 방문 상태 영구 보존 및 로드
 */
export function getContextCycleState(): ContextRecommendationCycleState {
  try {
    const raw = safeLocalStorage.getItem(CONTEXT_CYCLE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.cycleIndex === 'number' && Array.isArray(parsed.visitedIds)) {
        return parsed;
      }
    }
  } catch (_) {}

  return {
    cycleIndex: 1,
    visitedIds: [],
    lastVisitedId: null,
    lastJumpTime: 0,
  };
}

export function saveContextCycleState(state: ContextRecommendationCycleState): void {
  try {
    safeLocalStorage.setItem(CONTEXT_CYCLE_STORAGE_KEY, JSON.stringify(state));
  } catch (_) {}
}

/**
 * 🔒 터치 세션 동안 반복 I/O 및 프레임 흔들림 방지를 위한 활성 캐시
 */
let activeSessionResult: ContextNextMenuResult | null = null;

export function resetActiveContextPeek(): void {
  activeSessionResult = null;
}

/**
 * 🔮 4. 다음 추천 1위 메뉴 미리보기 (Preview / Peek)
 * - 상태를 변경하지 않고 현재 사이클의 다음 최우선 추천 1위 메뉴를 반환합니다.
 * - 이미 들어갔던 메뉴(!visitedIds.includes)는 건너뛰고, 미방문 후보 중 1순위를 선택합니다.
 * - 모든 메뉴를 순회한 경우 자동으로 한 사이클을 완주 처리하여 새 사이클의 1순위를 안내합니다.
 */
export function peekNextRecommendedMenuByCycle(currentLocation?: string): ContextNextMenuResult {
  const curr = currentLocation || (typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/');

  if (activeSessionResult) {
    // 🛡️ 만약 캐시된 결과가 현재 페이지와 동일하다면 캐시 무효화
    if (isSameAppOrPage(activeSessionResult.menu.path, curr) || isSameAppOrPage(activeSessionResult.menu.basePath, curr)) {
      activeSessionResult = null;
    } else {
      return activeSessionResult;
    }
  }
  const contextText = extractAutoContextText(curr);
  const ranked = rankAvailableMenusByContext(contextText, curr);
  const totalCount = ranked.length;

  const state = getContextCycleState();
  let isFullCycleCompleted = false;

  // 1. 이번 사이클에서 아직 방문하지 않은 후보군 추출
  let unvisited = ranked.filter((item) => !state.visitedIds.includes(item.menu.id));

  // 2. 만약 모든 후보군을 이미 다 방문했다면 ("한 사이클 완주!")
  //    -> 사이클 완료 플래그 활성화 및 전체 후보군을 다시 추천 풀로 리셋
  if (unvisited.length === 0 && ranked.length > 0) {
    isFullCycleCompleted = true;
    unvisited = ranked;
  }

  // 3. 미방문 후보군 중 맥락 점수가 가장 높은 1순위 메뉴 선택
  const chosen = unvisited[0] || ranked[0];

  const safePath = resolveCanonicalPath(chosen.menu.path);
  const visitedCount = isFullCycleCompleted ? 1 : state.visitedIds.length + 1;
  const remainingCount = Math.max(0, totalCount - visitedCount);

  const result: ContextNextMenuResult = {
    menu: chosen.menu,
    reason: chosen.reason,
    score: chosen.score,
    safePath,
    stats: {
      visitedCount,
      totalCount,
      remainingCount,
      cycleIndex: state.cycleIndex + (isFullCycleCompleted ? 1 : 0),
      isFullCycleCompleted,
    },
  };

  activeSessionResult = result;
  return result;
}

/**
 * 🚀 5. 다음 추천 1위 메뉴 도약 확정 및 사이클 방문 기록 (Commit & Advance)
 * - 사용자가 빅뱅 버튼을 드래그하다 손을 뗐을 때 호출됩니다.
 * - 선택된 1위 메뉴를 이번 사이클의 방문 목록(visitedIds)에 기록합니다.
 * - 모든 풀을 1바퀴 완주한 경우 사이클 번호를 올리고 방문 목록을 비워 다음 사이클을 시작합니다.
 */
export function commitNextRecommendedMenuByCycle(currentLocation?: string): ContextNextMenuResult {
  const result = peekNextRecommendedMenuByCycle(currentLocation);
  const state = getContextCycleState();

  // 한 사이클 완주 여부에 따른 방문 목록 갱신
  if (result.stats.isFullCycleCompleted) {
    state.cycleIndex += 1;
    state.visitedIds = [result.menu.id];
  } else {
    if (!state.visitedIds.includes(result.menu.id)) {
      state.visitedIds.push(result.menu.id);
    }
  }

  state.lastVisitedId = result.menu.id;
  state.lastJumpTime = Date.now();
  saveContextCycleState(state);

  // 글로벌 이벤트 발행
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('prism:context_cycle_jump', {
        detail: {
          destination: result.menu,
          visitedCount: result.stats.visitedCount,
          totalCount: result.stats.totalCount,
          cycleIndex: state.cycleIndex,
          isFullCycleCompleted: result.stats.isFullCycleCompleted,
        },
      })
    );
  }

  resetActiveContextPeek();
  return result;
}

/**
 * 📈 6. 현재 사이클 진행 통계 조회
 */
export function getContextCycleStats(currentLocation?: string): ContextCycleStats {
  const state = getContextCycleState();
  const curr = currentLocation || (typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/');
  const ranked = rankAvailableMenusByContext('', curr);
  const totalCount = ranked.length;
  const visitedCount = state.visitedIds.length;
  const remainingCount = Math.max(0, totalCount - visitedCount);

  return {
    visitedCount,
    totalCount,
    remainingCount,
    cycleIndex: state.cycleIndex,
    isFullCycleCompleted: visitedCount >= totalCount,
  };
}
