/**
 * CALM 40대 마음기법 40일 순환 셔플 엔진 (The 40-Day Technique Cycle Engine)
 * 
 * 규칙:
 * 1. 40개의 기법 중 매일 1개씩 고유하게 추천되는 "오늘의 두루마리"
 * 2. 40일 동안 중복 없이 매일 다른 기법이 셔플되어 나타남 (Day 1 ~ Day 40)
 * 3. 40일(한 사이클)이 완료되면 다시 예전 기법 두루마리가 순환되어 나타남
 * 4. 하루에 한 번씩만 추천되며, 당일에는 항상 동일한 기법이 유지됨
 * 5. 리스트의 맨 처음(인덱스 0)에 "오늘의 두루마리"가 배치되고, 나머지 39개 기법 두루마리가 순서대로 이어짐
 */

import { CALM_PRESCRIPTIONS, CalmPrescription, getCalmPrescription } from './calmPharmacopeia';
import { KeyArchiveItem } from './keyArchiveExtractor';
import { safeLocalStorage } from '../utils/safeStorage';
import { getTodayDateKey } from './dailyCache';

const CYCLE_ORDER_KEY = 'luckey_technique_cycle_order_v2';
const ANCHOR_DATE_KEY = 'luckey_technique_cycle_anchor_v2';
const TOTAL_TECHNIQUES = 40;

/**
 * 결정론적 시드 PRNG (Mulberry32)
 */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 1부터 40까지의 고유 번호를 시드로 셔플
 */
function generateSeededShuffle(seed: number): number[] {
  const arr: number[] = Array.from({ length: TOTAL_TECHNIQUES }, (_, i) => i + 1);
  const rand = mulberry32(seed);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}

/**
 * 영구 보관된 사용자 고유 40일 셔플 순서 반환 (없으면 초기 생성 후 보관)
 */
export function getPersistentCycleOrder(): number[] {
  const raw = safeLocalStorage.getItem(CYCLE_ORDER_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (
        Array.isArray(parsed) &&
        parsed.length === TOTAL_TECHNIQUES &&
        new Set(parsed).size === TOTAL_TECHNIQUES
      ) {
        return parsed;
      }
    } catch (_) {}
  }

  // 사용자 고유 첫 시드로 셔플 생성 및 저장 (기본 폴백 시드: 20260919)
  const seed = Math.floor(Date.now() / 1000) ^ 0x5a5a5a;
  const newOrder = generateSeededShuffle(seed > 0 ? seed : 20260919);
  safeLocalStorage.setItem(CYCLE_ORDER_KEY, JSON.stringify(newOrder));
  return newOrder;
}

/**
 * 40일 여정의 시작 앵커 날짜 반환 (없으면 오늘 날짜로 기록)
 */
export function getCycleAnchorDate(): string {
  const todayStr = getTodayDateKey();
  const savedAnchor = safeLocalStorage.getItem(ANCHOR_DATE_KEY);

  if (savedAnchor && /^\d{4}-\d{2}-\d{2}$/.test(savedAnchor)) {
    return savedAnchor;
  }

  safeLocalStorage.setItem(ANCHOR_DATE_KEY, todayStr);
  return todayStr;
}

export interface TechniqueCycleStatus {
  cycleNumber: number; // 1번째 사이클, 2번째 사이클 ...
  dayInCycle: number; // 0 ~ 39
  dayNumber: number; // 1 ~ 40
  totalDays: number; // 40
  todayGlobalIndex: number; // 오늘 추천된 기법의 제N호 번호 (1~40)
  todayPrescription: CalmPrescription;
  anchorDate: string;
  todayDate: string;
}

/**
 * 현재 날짜 기준 40일 사이클 진행 상태 계산
 */
export function getTechniqueCycleStatus(customTodayStr?: string): TechniqueCycleStatus {
  const todayStr = customTodayStr || getTodayDateKey();
  const anchorStr = getCycleAnchorDate();
  const cycleOrder = getPersistentCycleOrder();

  // 날짜 차이 계산 (일 단위)
  const anchorTime = new Date(anchorStr).getTime();
  const todayTime = new Date(todayStr).getTime();
  const diffDays = Math.max(0, Math.floor((todayTime - anchorTime) / (1000 * 60 * 60 * 24)));

  const cycleNumber = Math.floor(diffDays / TOTAL_TECHNIQUES) + 1;
  const dayInCycle = diffDays % TOTAL_TECHNIQUES; // 0 ~ 39
  const dayNumber = dayInCycle + 1; // 1 ~ 40

  const todayGlobalIndex = cycleOrder[dayInCycle] || 1;
  const todayPrescription = getCalmPrescription(todayGlobalIndex) || CALM_PRESCRIPTIONS[0];

  return {
    cycleNumber,
    dayInCycle,
    dayNumber,
    totalDays: TOTAL_TECHNIQUES,
    todayGlobalIndex,
    todayPrescription,
    anchorDate: anchorStr,
    todayDate: todayStr,
  };
}

/**
 * 처방약 객체를 Key 두루마리(KeyArchiveItem) 규격으로 변환
 */
export function prescriptionToKeyArchiveItem(
  p: CalmPrescription,
  isToday: boolean,
  dayNumber: number,
  todayStr: string,
  indexOrder: number
): KeyArchiveItem {
  return {
    id: isToday ? `technique-today-${p.globalIndex}` : `technique-scroll-${p.globalIndex}`,
    category: 'pharmacy',
    categoryLabel: isToday
      ? `오늘의 두루마리 (Day ${dayNumber}/${TOTAL_TECHNIQUES})`
      : `제${p.globalIndex}호 기법 두루마리`,
    iconType: 'key',
    badgeColor: isToday
      ? 'text-amber-200 bg-amber-500/25 border-amber-300/60 ring-1 ring-amber-400/40 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
      : 'text-emerald-300 bg-emerald-500/15 border-emerald-400/40',
    glowColor: isToday ? 'rgba(251, 191, 36, 0.7)' : 'rgba(52, 211, 153, 0.45)',
    title: isToday
      ? `[오늘의 두루마리] 제${p.globalIndex}호 ${p.title}: ${p.subtitle}`
      : `제${p.globalIndex}호 ${p.title}: ${p.subtitle}`,
    keypoint: `"${p.affirmation}" — ${p.clinicalTip || p.purpose}`,
    fullText: `제${p.globalIndex}호 처방 기법 두루마리. ${p.title} (${p.subtitle}). 목적: ${p.purpose}. 실천 지침: ${p.clinicalTip}. 확언: ${p.affirmation}. 복약 가이드: ${p.prescriptionGuide}`,
    dateStr: todayStr,
    timeStr: `약효 ${p.timeEstimate}`,
    timestamp: Date.now() - indexOrder * 1000,
    sourceLabel: `CALM 40대 마음약전 (${p.chapterTitle})`,
    actionGuidance: `[처방 가이드] ${p.prescriptionGuide} [확언] "${p.affirmation}"`,
    tags: isToday
      ? ['#오늘의두루마리', `#Day${dayNumber}`, `#제${p.globalIndex}호`, `#${p.tag}`, `#${p.chapterTitle.replace(/\s+/g, '')}`]
      : [`#제${p.globalIndex}호`, `#${p.tag}`, `#${p.chapterTitle.replace(/\s+/g, '')}`],
  };
}

/**
 * 40대 기법 두루마리 전체 목록 반환
 * - 맨 처음(인덱스 0): 오늘의 두루마리 (하루 한 번 추천, 40일 셔플 매일 다른 기법)
 * - 인덱스 1 ~ 39: 나머지 기법 두루마리들이 40일 셔플 순서대로 정렬
 */
export function get40TechniqueScrolls(customTodayStr?: string): KeyArchiveItem[] {
  const status = getTechniqueCycleStatus(customTodayStr);
  const cycleOrder = getPersistentCycleOrder();
  const todayStr = status.todayDate;

  const items: KeyArchiveItem[] = [];

  // 1. 맨 처음에 배치되는 "오늘의 두루마리" (인덱스 0)
  items.push(
    prescriptionToKeyArchiveItem(
      status.todayPrescription,
      true,
      status.dayNumber,
      todayStr,
      0
    )
  );

  // 2. 나머지 39개 기법 두루마리를 셔플 순환 순서대로 배치
  for (let i = 1; i < TOTAL_TECHNIQUES; i++) {
    const nextIdx = (status.dayInCycle + i) % TOTAL_TECHNIQUES;
    const globalIndex = cycleOrder[nextIdx];
    const prescription = getCalmPrescription(globalIndex);
    if (prescription) {
      items.push(
        prescriptionToKeyArchiveItem(
          prescription,
          false,
          nextIdx + 1,
          todayStr,
          i
        )
      );
    }
  }

  return items;
}

/**
 * 임상 키워드 및 상황 사전 맵핑 (한국어 감정·신체 증상·상황 맞춤)
 */
const CLINICAL_SITUATION_MAP: Record<string, number[]> = {
  // 불안/패닉/공황/신체 긴장
  발표: [14, 13, 15, 25, 17, 18],
  면접: [14, 13, 15, 25, 17, 18],
  시험: [13, 14, 15, 11, 22, 36],
  긴장: [13, 15, 21, 14, 18, 20],
  심장: [13, 14, 17, 20, 15],
  두근: [13, 14, 17, 20, 15],
  공황: [14, 13, 17, 18, 21, 20],
  패닉: [14, 13, 17, 18, 21, 20],
  불안: [1, 14, 13, 6, 7, 10, 27],
  초조: [13, 14, 15, 21, 18],
  식은땀: [13, 14, 17, 20],
  떨림: [13, 15, 21, 14],
  숨: [13, 14, 15, 21],
  호흡: [13, 14, 15, 21],

  // 생각 과다/꼬리를 무는 걱정/토끼굴
  걱정: [1, 3, 4, 10, 11, 34, 36],
  생각: [5, 6, 7, 10, 11, 31, 39],
  잡념: [5, 6, 7, 10, 11, 31],
  꼬리: [10, 11, 1, 3, 36],
  토끼굴: [10, 11, 1, 3, 36],
  미래: [36, 10, 11, 1, 39],
  예측: [36, 10, 11, 1, 39],
  불확실: [27, 36, 10, 11],
  계획: [22, 30, 37, 40],

  // 수면/불면/새벽 뒤척임
  잠: [20, 13, 12, 11, 21, 38],
  수면: [20, 13, 12, 11, 21, 38],
  불면: [20, 13, 12, 11, 21, 38],
  밤: [20, 13, 12, 11, 38],
  새벽: [20, 13, 12, 11, 38],

  // 자책/후회/자기비판/완벽주의
  자책: [9, 2, 6, 23, 31, 32],
  후회: [9, 2, 6, 23, 31],
  비판: [9, 2, 31, 23],
  내탓: [9, 2, 31, 23],
  자괴감: [9, 2, 23, 31],
  실수: [9, 2, 23, 32, 39],
  완벽: [37, 39, 40, 9, 2],
  부족: [9, 23, 32, 2],

  // 인간관계/타인의 시선/가면 증후군
  시선: [25, 26, 32, 4, 23],
  남: [25, 26, 32, 4],
  타인: [25, 26, 32, 4],
  비교: [25, 26, 32, 9, 37],
  눈치: [25, 26, 32, 23],
  가면: [32, 23, 25, 26],
  거절: [23, 26, 25, 24],
  관계: [25, 26, 4, 23],
  친구: [25, 26, 4, 23],
  직장: [22, 25, 26, 29, 35],
  상사: [25, 26, 29, 35],

  // 번아웃/피로/무기력
  번아웃: [12, 29, 38, 40, 37],
  피로: [12, 20, 38, 40, 21],
  지침: [12, 38, 40, 20],
  무기력: [37, 38, 12, 19, 40],
  의욕: [37, 38, 12, 19, 40],
  과로: [12, 29, 38, 40],
  바쁨: [29, 22, 30, 40, 12],
  쉼: [38, 12, 20, 40],
  휴식: [38, 12, 20, 40],

  // 분노/짜증/답답함
  화: [5, 8, 24, 28, 33],
  분노: [5, 8, 24, 28, 33],
  짜증: [5, 8, 24, 28, 33],
  억울: [5, 8, 24, 28],
  답답: [13, 14, 15, 24],

  // 우울/슬픔/공허
  우울: [23, 19, 9, 13, 37],
  슬픔: [23, 24, 19, 9],
  눈물: [23, 24, 19],
  외로움: [23, 19, 25],
};

/**
 * 사용자의 고민이나 상황(질문)에 가장 적합한 기법 두루마리 검색 및 순위 정렬
 * (대화창에 입력 시 다른 잡답변 없이 오직 40개 기법 두루마리 중 맞춤 기법만 도출)
 */
export function searchPrescriptionsByConcern(query: string, customTodayStr?: string): KeyArchiveItem[] {
  const trimmed = (query || '').trim();
  if (!trimmed) {
    return get40TechniqueScrolls(customTodayStr);
  }

  const todayStr = customTodayStr || getTodayDateKey();
  const lowerQuery = trimmed.toLowerCase();

  // 각 40개 처방약의 점수 계산
  const scores: { prescription: CalmPrescription; score: number }[] = CALM_PRESCRIPTIONS.map((p) => {
    let score = 0;

    // 1. 임상 사전 키워드 맵 가중치
    for (const [kw, indices] of Object.entries(CLINICAL_SITUATION_MAP)) {
      if (lowerQuery.includes(kw)) {
        const foundRank = indices.indexOf(p.globalIndex);
        if (foundRank !== -1) {
          score += (indices.length - foundRank) * 25;
        }
      }
    }

    // 2. 어휘 및 내용 매칭 가중치
    const corpus = [
      p.title,
      p.subtitle,
      p.tag,
      p.chapterTitle,
      p.purpose,
      p.clinicalTip,
      p.affirmation,
      p.prescriptionGuide,
    ].join(' ').toLowerCase();

    // 단어 분할 매칭
    const queryTokens = lowerQuery.split(/\s+/).filter((t) => t.length >= 2);
    for (const token of queryTokens) {
      if (corpus.includes(token)) {
        score += 20;
      }
      if (p.title.toLowerCase().includes(token)) score += 30;
      if (p.tag.toLowerCase().includes(token)) score += 25;
      if (p.subtitle.toLowerCase().includes(token)) score += 20;
    }

    // 완전 일치 보너스
    if (corpus.includes(lowerQuery)) score += 40;

    return { prescription: p, score };
  });

  // 점수 높은 순 정렬
  scores.sort((a, b) => b.score - a.score);

  // 최고 점수 처방약(1위)을 선두로 배치하여 40개 두루마리 리스트 생성
  return scores.map((item, index) => {
    const p = item.prescription;
    const isTop = index === 0;
    return {
      id: isTop ? `technique-today-${p.globalIndex}` : `technique-scroll-${p.globalIndex}`,
      category: 'pharmacy',
      categoryLabel: isTop
        ? `상황 맞춤 처방 (추천 1위)`
        : `제${p.globalIndex}호 기법 두루마리`,
      iconType: 'key',
      badgeColor: isTop
        ? 'text-amber-200 bg-amber-500/25 border-amber-300/60 ring-1 ring-amber-400/40 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
        : 'text-emerald-300 bg-emerald-500/15 border-emerald-400/40',
      glowColor: isTop ? 'rgba(251, 191, 36, 0.7)' : 'rgba(52, 211, 153, 0.45)',
      title: isTop
        ? `[상황 맞춤] 제${p.globalIndex}호 ${p.title}: ${p.subtitle}`
        : `제${p.globalIndex}호 ${p.title}: ${p.subtitle}`,
      keypoint: `"${p.affirmation}" — ${p.clinicalTip || p.purpose}`,
      fullText: `상황 맞춤 제${p.globalIndex}호 처방 기법 두루마리. ${p.title} (${p.subtitle}). 목적: ${p.purpose}. 실천 지침: ${p.clinicalTip}. 확언: ${p.affirmation}. 복약 가이드: ${p.prescriptionGuide}`,
      dateStr: todayStr,
      timeStr: `약효 ${p.timeEstimate}`,
      timestamp: Date.now() - index * 1000,
      sourceLabel: `CALM 40대 마음약전 (${p.chapterTitle})`,
      actionGuidance: `[처방 가이드] ${p.prescriptionGuide} [확언] "${p.affirmation}"`,
      tags: isTop
        ? ['#상황맞춤처방', `#제${p.globalIndex}호`, `#${p.tag}`, `#${p.chapterTitle.replace(/\s+/g, '')}`]
        : [`#제${p.globalIndex}호`, `#${p.tag}`, `#${p.chapterTitle.replace(/\s+/g, '')}`],
    };
  });
}
