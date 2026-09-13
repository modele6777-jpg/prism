/**
 * selectionContextRecommender.ts
 * 선택된 텍스트의 맥락(감정·키워드·의도)을 실시간 감지하여
 * 프리즘 20가지 정규 메뉴 중 가장 적합한 추천 경로를 동적으로 산출하는 추천 엔진
 * "상시 다른 추천경로": 맥락 가중치 + 동적 회전 해시를 통해 매번 신선하고 다채로운 경로를 제안
 */

import { savePendingSelection } from './selectionBridge';
import { sendPrismToss } from './prismToss';

export interface PrismMenuDestination {
  id: string;
  name: string;
  subName: string;
  path: string;
  basePath: string;
  emoji: string;
  badge: string;
  themeColor: string;
  buttonClass: string;
  textClass: string;
  borderClass: string;
  keywords: string[];
  intentRegex: RegExp;
  contextReason: string;
  tossTargetId: string;
}

/**
 * 프리즘 20대 핵심 기능 및 메뉴 경로 정의
 */
export const PRISM_20_MENU_DESTINATIONS: PrismMenuDestination[] = [
  // 1. 트리니티 오라클 타로
  {
    id: 'trinity_oracle',
    name: '트리니티 오라클',
    subName: '3장 타로 & 무의식 신탁',
    path: '/trinity?tab=oracle',
    basePath: '/trinity',
    emoji: '🔮',
    badge: '운명 나침반',
    themeColor: '#c084fc',
    buttonClass: 'bg-purple-500/20 hover:bg-purple-500/35 text-purple-200 hover:text-purple-100',
    textClass: 'text-purple-300',
    borderClass: 'border-purple-400/40',
    keywords: ['타로', '오라클', '카드', '상징', '무의식', '운명', '미래', '예언', '점성', '비의', '나침반', '결정', '기로', '선택', '앞날'],
    intentRegex: /타로|오라클|카드|상징|운명|미래|예언|점성|나침반|기로|앞날|선택의 기로|결정/i,
    contextReason: '운명과 무의식 상징을 읽어내는 오라클 타로 추천',
    tossTargetId: 'trinity',
  },
  // 2. 사주 만세력 리포트
  {
    id: 'trinity_saju',
    name: '사주 만세력',
    subName: '음양오행 운명 리포트',
    path: '/trinity?tab=destiny',
    basePath: '/trinity',
    emoji: '📜',
    badge: '명리 만세력',
    themeColor: '#f59e0b',
    buttonClass: 'bg-amber-500/20 hover:bg-amber-500/35 text-amber-200 hover:text-amber-100',
    textClass: 'text-amber-300',
    borderClass: 'border-amber-400/40',
    keywords: ['사주', '만세력', '팔자', '오행', '목화토금수', '십신', '대운', '세운', '일간', '천간', '지지', '용신', '기운', '타고난', '명식'],
    intentRegex: /사주|만세력|팔자|오행|목화토금수|십신|대운|세운|일간|천간|지지|용신|명식/i,
    contextReason: '타고난 기운과 오행 대운을 짚어보는 사주 만세력 추천',
    tossTargetId: 'trinity',
  },
  // 3. 데일리 타로 스프레드
  {
    id: 'trinity_daily',
    name: '데일리 타로 덱',
    subName: '오늘의 78장 타로 휠',
    path: '/trinity?tab=tarot',
    basePath: '/trinity',
    emoji: '🃏',
    badge: '오늘의 덱',
    themeColor: '#eab308',
    buttonClass: 'bg-yellow-500/20 hover:bg-yellow-500/35 text-yellow-200 hover:text-yellow-100',
    textClass: 'text-yellow-300',
    borderClass: 'border-yellow-400/40',
    keywords: ['오늘', '하루', '데일리', '오늘의 운세', '일일', '카드 뽑기', '셔플', '행운', '럭키', '스프레드', '하루 기운'],
    intentRegex: /오늘|데일리|하루 운세|카드 뽑기|럭키|행운|스프레드|오늘 하루/i,
    contextReason: '오늘 하루의 행운과 에너지를 점치는 데일리 타로 추천',
    tossTargetId: 'trinity',
  },
  // 4. 뮤즈 예술처방
  {
    id: 'muse_art',
    name: '뮤즈 예술처방',
    subName: '명화·명시·명곡 삼위일체',
    path: '/muse',
    basePath: '/muse',
    emoji: '🎨',
    badge: '명작 처방',
    themeColor: '#a855f7',
    buttonClass: 'bg-indigo-500/20 hover:bg-indigo-500/35 text-indigo-200 hover:text-indigo-100',
    textClass: 'text-indigo-300',
    borderClass: 'border-indigo-400/40',
    keywords: ['예술', '명화', '그림', '화가', '명시', '시', '명곡', '음악', '선율', '아름다움', '심미', '감수성', '영감', '낭만', '작품', '색채'],
    intentRegex: /예술|명화|그림|화가|명시|명곡|음악|선율|아름다움|심미|감수성|영감|낭만|작품|미술/i,
    contextReason: '마음의 감성에 깊이 공명하는 명화·명시·명곡 예술처방 추천',
    tossTargetId: 'muse',
  },
  // 5. 뮤즈 오디오 도슨트
  {
    id: 'muse_docent',
    name: '뮤즈 도슨트',
    subName: '명작 심층 오디오 해설',
    path: '/muse?mode=docent',
    basePath: '/muse',
    emoji: '🎧',
    badge: '음성 도슨트',
    themeColor: '#818cf8',
    buttonClass: 'bg-violet-500/20 hover:bg-violet-500/35 text-violet-200 hover:text-violet-100',
    textClass: 'text-violet-300',
    borderClass: 'border-violet-400/40',
    keywords: ['도슨트', '해설', '오디오', '귀로 듣는', '갤러리', '미술관', '배경 이야기', '비하인드', '음성', '전시'],
    intentRegex: /도슨트|해설|오디오|귀로|갤러리|미술관|배경 이야기|음성 해설|전시회/i,
    contextReason: '거장의 화폭 뒤편 숨겨진 이야기를 듣는 오디오 도슨트 추천',
    tossTargetId: 'muse',
  },
  // 6. 오렌지 감정 성찰 & 연금술
  {
    id: 'orange_mind',
    name: '오렌지 마음 성찰',
    subName: '내면 아이 & 감정 연금술',
    path: '/orange',
    basePath: '/orange',
    emoji: '🍊',
    badge: '감정 성찰',
    themeColor: '#fb923c',
    buttonClass: 'bg-orange-500/20 hover:bg-orange-500/35 text-orange-200 hover:text-orange-100',
    textClass: 'text-orange-300',
    borderClass: 'border-orange-400/40',
    keywords: ['마음', '감정', '내면', '아이', '불안', '분노', '화', '질투', '두려움', '성찰', '연금술', '심리', '자존감', '멘탈', '외로움'],
    intentRegex: /마음|감정|내면|불안|분노|질투|두려움|성찰|연금술|심리|자존감|자책|속상/i,
    contextReason: '복잡한 감정을 마주하고 내면 아이를 보듬는 마음 성찰 추천',
    tossTargetId: 'orange',
  },
  // 7. 소원의 우물 & 확언
  {
    id: 'orange_well',
    name: '소원의 우물',
    subName: '시크릿 확언 & 소원 방생',
    path: '/orange?tab=wishingWell',
    basePath: '/orange',
    emoji: '💫',
    badge: '소원 확언',
    themeColor: '#f97316',
    buttonClass: 'bg-amber-600/20 hover:bg-amber-600/35 text-amber-200 hover:text-amber-100',
    textClass: 'text-amber-300',
    borderClass: 'border-amber-500/40',
    keywords: ['소원', '우물', '바람', '소망', '확언', '시크릿', '끌어당김', '기원', '기도', '이루어', '기적', '희망', '목표', '꿈'],
    intentRegex: /소원|우물|바람|소망|확언|시크릿|끌어당김|기원|기도|이루어|기적|희망|꼭 되게/i,
    contextReason: '간절한 소망을 우주에 띄우고 실시간 확언을 받는 소원의 우물 추천',
    tossTargetId: 'orange',
  },
  // 8. 아우라 신체 웰니스
  {
    id: 'heal_wellness',
    name: '아우라 신체 웰니스',
    subName: '1분 호흡 & 생체 에너지',
    path: '/heal?tab=oneMinute',
    basePath: '/heal',
    emoji: '🌿',
    badge: '호흡 & 이완',
    themeColor: '#10b981',
    buttonClass: 'bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-200 hover:text-emerald-100',
    textClass: 'text-emerald-300',
    borderClass: 'border-emerald-400/40',
    keywords: ['신체', '몸', '호흡', '숨', '피로', '스트레스', '긴장', '근육', '이완', '웰니스', '바디스캔', '휴식', '어깨', '목', '지침'],
    intentRegex: /신체|몸|호흡|숨쉬|피로|스트레스|긴장|근육|이완|바디스캔|휴식|지쳤|뻐근/i,
    contextReason: '몸의 긴장을 풀고 깊은 숨으로 생체 리듬을 회복하는 웰니스 추천',
    tossTargetId: 'heal',
  },
  // 9. 호오포노포노 정화
  {
    id: 'heal_hoponopono',
    name: '호오포노포노 정화',
    subName: '4마디 카르마 정화',
    path: '/heal?tab=meditation',
    basePath: '/heal',
    emoji: '🌊',
    badge: '에너지 정화',
    themeColor: '#06b6d4',
    buttonClass: 'bg-teal-500/20 hover:bg-teal-500/35 text-teal-200 hover:text-teal-100',
    textClass: 'text-teal-300',
    borderClass: 'border-teal-400/40',
    keywords: ['호오포노포노', '미안합니다', '용서하세요', '감사합니다', '사랑합니다', '정화', '카르마', '기억', '클리어링', '지우기', '무의식 청소', '원망'],
    intentRegex: /호오포노포노|미안|용서|정화|카르마|클리어링|원망|죄책감|기억 소거/i,
    contextReason: '잠재의식의 묵은 상처와 기억을 맑게 소거하는 호오포노포노 추천',
    tossTargetId: 'heal',
  },
  // 10. 세도나 릴리즈
  {
    id: 'heal_sedona',
    name: '세도나 릴리즈',
    subName: '감정 5단계 흘려보내기',
    path: '/heal?tab=meditation',
    basePath: '/heal',
    emoji: '🕊️',
    badge: '놓아보내기',
    themeColor: '#38bdf8',
    buttonClass: 'bg-sky-500/20 hover:bg-sky-500/35 text-sky-200 hover:text-sky-100',
    textClass: 'text-sky-300',
    borderClass: 'border-sky-400/40',
    keywords: ['흘려보내기', '놓아주기', '세도나', '집착', '내려놓음', '릴리즈', '자유', '비우기', '무거움', '해방', '미련'],
    intentRegex: /흘려보내|놓아주|세도나|집착|내려놓|릴리즈|비우기|무거워|털어내|미련/i,
    contextReason: '마음을 무겁게 짓누르는 집착을 홀가분하게 놓아주는 세도나 릴리즈 추천',
    tossTargetId: 'heal',
  },
  // 11. 파랑새의 성소
  {
    id: 'bluebird_sanctuary',
    name: '파랑새의 성소',
    subName: '영혼의 상처 치유 & 위로',
    path: '/bluebird',
    basePath: '/bluebird',
    emoji: '🐦',
    badge: '영혼 안식',
    themeColor: '#0ea5e9',
    buttonClass: 'bg-cyan-500/20 hover:bg-cyan-500/35 text-cyan-200 hover:text-cyan-100',
    textClass: 'text-cyan-300',
    borderClass: 'border-cyan-400/40',
    keywords: ['상처', '아픔', '치유', '위로', '눈물', '토닥토닥', '파랑새', '안식', '쉼', '외로움', '품', '온기', '슬픔'],
    intentRegex: /상처|아픔|치유|위로|눈물|토닥|파랑새|안식|외로|슬프|가슴 아파/i,
    contextReason: '지친 마음에 따스한 온기와 무조건적 위로를 건네는 파랑새의 성소 추천',
    tossTargetId: 'bluebird',
  },
  // 12. 일상 감사 일기
  {
    id: 'bluebird_gratitude',
    name: '일상 감사 일기',
    subName: '소소한 행복 & 감사의 온기',
    path: '/bluebird?tab=gratitude',
    basePath: '/bluebird',
    emoji: '🌻',
    badge: '감사와 온기',
    themeColor: '#facc15',
    buttonClass: 'bg-yellow-500/20 hover:bg-yellow-500/35 text-yellow-200 hover:text-yellow-100',
    textClass: 'text-yellow-300',
    borderClass: 'border-yellow-400/40',
    keywords: ['감사', '고마움', '행복', '일상', '소소한', '다행', '축복', '햇살', '미소', '따뜻한', '기쁨', '고마워'],
    intentRegex: /감사|고마|행복|일상|소소|다행|축복|햇살|미소|기쁨|고마워/i,
    contextReason: '일상의 소박한 축복과 감사를 마음 깊이 새기는 감사 일기 추천',
    tossTargetId: 'bluebird',
  },
  // 13. 에필로그 밤 서재
  {
    id: 'epilogue_journal',
    name: '에필로그 밤 서재',
    subName: '영감의 밤 서재 일기',
    path: '/epilogue',
    basePath: '/epilogue',
    emoji: '📖',
    badge: '서재 일기',
    themeColor: '#34d399',
    buttonClass: 'bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-200 hover:text-emerald-100',
    textClass: 'text-emerald-300',
    borderClass: 'border-emerald-500/40',
    keywords: ['서재', '일기', '밤', '저녁', '기록', '글쓰기', '사유', '문장', '생각 정리', '에필로그', '수필', '노트'],
    intentRegex: /서재|일기|밤|저녁|기록|글쓰기|사유|문장|생각 정리|에필로그|수필|메모/i,
    contextReason: '하루의 생각과 영감을 한 편의 수필처럼 고요히 담는 밤 서재 추천',
    tossTargetId: 'epilogue',
  },
  // 14. 영혼 결산 회고
  {
    id: 'epilogue_retrospect',
    name: '영혼 결산 회고',
    subName: '하루 여정 종합 결산',
    path: '/epilogue?tab=retrospect',
    basePath: '/epilogue',
    emoji: '🌌',
    badge: '하루 결산',
    themeColor: '#14b8a6',
    buttonClass: 'bg-teal-600/20 hover:bg-teal-600/35 text-teal-200 hover:text-teal-100',
    textClass: 'text-teal-300',
    borderClass: 'border-teal-500/40',
    keywords: ['회고', '결산', '마무리', '발자취', '여정', '매듭', '정리', '하루 끝', '반성', '성취', '매듭짓기'],
    intentRegex: /회고|결산|마무리|발자취|여정|매듭|정리|하루 끝|반성|성취|하루를 마치며/i,
    contextReason: '오늘의 발자취를 온전히 매듭짓고 결산하는 종합 에필로그 추천',
    tossTargetId: 'epilogue',
  },
  // 15. 지혜의 리바이블
  {
    id: 'handbook_bible',
    name: '지혜의 리바이블',
    subName: '영혼의 안내서 & 바이블',
    path: '/handbook',
    basePath: '/handbook',
    emoji: '🧭',
    badge: '지혜 바이블',
    themeColor: '#d97706',
    buttonClass: 'bg-amber-600/20 hover:bg-amber-600/35 text-amber-200 hover:text-amber-100',
    textClass: 'text-amber-300',
    borderClass: 'border-amber-500/40',
    keywords: ['성경', '말씀', '지혜', '바이블', '리바이블', '경전', '진리', '길', '철학', '성서', '구도', '가르침'],
    intentRegex: /성경|말씀|지혜|바이블|리바이블|경전|진리|구도|성서|교훈|가르침/i,
    contextReason: '삶의 혼란을 가라앉히고 바른 방향을 비추는 지혜의 바이블 추천',
    tossTargetId: 'handbook',
  },
  // 16. 오늘의 만나 잠언
  {
    id: 'handbook_manna',
    name: '오늘의 만나 잠언',
    subName: '생명의 지혜 한 구절',
    path: '/handbook?tab=manna',
    basePath: '/handbook',
    emoji: '🍞',
    badge: '오늘의 잠언',
    themeColor: '#b45309',
    buttonClass: 'bg-amber-700/20 hover:bg-amber-700/35 text-amber-200 hover:text-amber-100',
    textClass: 'text-amber-300',
    borderClass: 'border-amber-600/40',
    keywords: ['만나', '잠언', '격언', '명언', '아침', '교훈', '생명', '양식', '한 구절', '영적 양식'],
    intentRegex: /만나|잠언|격언|명언|교훈|한 구절|양식|마음의 양식/i,
    contextReason: '하루를 지탱하는 생명의 지혜 한 구절 오늘의 만나 추천',
    tossTargetId: 'handbook',
  },
  // 17. 영혼 프로필
  {
    id: 'soul_profile',
    name: '영혼 프로필 & 명식',
    subName: '내면 성향 & 성장 아카이브',
    path: '/profile',
    basePath: '/profile',
    emoji: '👤',
    badge: '성향 아카이브',
    themeColor: '#a78bfa',
    buttonClass: 'bg-indigo-600/20 hover:bg-indigo-600/35 text-indigo-200 hover:text-indigo-100',
    textClass: 'text-indigo-300',
    borderClass: 'border-indigo-500/40',
    keywords: ['프로필', '나', '자아', '성향', '정체성', '성장', '발자국', '기록', '아카이브', '히스토리', '내면 성향'],
    intentRegex: /프로필|자아|성향|정체성|나라는 사람|성장 기록|아카이브|내 모습/i,
    contextReason: '나만의 본질적 기질과 영혼의 성장 발자취를 비추는 프로필 추천',
    tossTargetId: 'profile',
  },
  // 18. 옴니워프 시공간 도약
  {
    id: 'omniwarp_portal',
    name: '옴니워프 유니버스',
    subName: '시공간 빅뱅 차원 도약',
    path: '/omniwarp',
    basePath: '/omniwarp',
    emoji: '🌀',
    badge: '빅뱅 차원도약',
    themeColor: '#00f0ff',
    buttonClass: 'bg-cyan-600/20 hover:bg-cyan-600/35 text-cyan-200 hover:text-cyan-100',
    textClass: 'text-cyan-300',
    borderClass: 'border-cyan-400/40',
    keywords: ['우주', '차원', '빅뱅', '웜홀', '도약', '화이트홀', '블랙홀', '시공간', '워프', '초월', '포털', '특이점'],
    intentRegex: /우주|차원|빅뱅|웜홀|도약|화이트홀|블랙홀|시공간|워프|초월|포털|특이점/i,
    contextReason: '시공간의 제약을 뛰어넘어 전 차원으로 도약하는 옴니워프 추천',
    tossTargetId: 'omniwarp',
  },
  // 19. 우주 시너지 허브
  {
    id: 'hub_synergy',
    name: '우주 시너지 허브',
    subName: '6채널 융합 & 공명',
    path: '/synergy',
    basePath: '/synergy',
    emoji: '🪐',
    badge: '6채널 시너지',
    themeColor: '#06b6d4',
    buttonClass: 'bg-sky-600/20 hover:bg-sky-600/35 text-sky-200 hover:text-sky-100',
    textClass: 'text-sky-300',
    borderClass: 'border-sky-500/40',
    keywords: ['시너지', '우주', '조화', '융합', '공명', '다채널', '허브', '프롤로그', '연결', '종합', '생태계'],
    intentRegex: /시너지|조화|융합|공명|다채널|허브|프롤로그|연결|전체/i,
    contextReason: '6대 프리즘 채널의 융합과 상호 공명을 조망하는 시너지 추천',
    tossTargetId: 'hub',
  },
  // 20. eCPR 생체 리듬
  {
    id: 'hub_ecpr',
    name: 'eCPR 생체 리듬',
    subName: '실시간 에너지 밸런스',
    path: '/ecpr',
    basePath: '/ecpr',
    emoji: '⚡',
    badge: '생체 밸런스',
    themeColor: '#38bdf8',
    buttonClass: 'bg-blue-600/20 hover:bg-blue-600/35 text-blue-200 hover:text-blue-100',
    textClass: 'text-blue-300',
    borderClass: 'border-blue-500/40',
    keywords: ['바이오', '리듬', '에너지', 'ecpr', '활력', '충전', '밸런스', '맥박', '파동', '컨디션', '생체', '생체신호'],
    intentRegex: /바이오|리듬|에너지|ecpr|활력|충전|밸런스|맥박|파동|컨디션|생체신호/i,
    contextReason: '현재 나의 실시간 생체 리듬과 에너지 파동을 조율하는 eCPR 추천',
    tossTargetId: 'hub',
  },
];

export interface TopRankedMenu {
  rank: 1 | 2 | 3;
  menu: PrismMenuDestination;
  contextReason: string;
  matchScore: number;
}

export interface RecommendedMenuResult {
  menu: PrismMenuDestination;
  contextReason: string;
  matchScore: number;
  allRankedMenus: Array<{ menu: PrismMenuDestination; score: number; reason: string }>;
  currentIndex: number;
  totalCandidates: number;
  top3: TopRankedMenu[];
}

/**
 * 텍스트 단순 해시 생성기
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * 텍스트 맥락 감지 및 20가지 메뉴 중 최적의 동적 추천 경로 도출
 * - 현재 위치한 페이지는 추천 대상에서 자동 배제
 * - 텍스트의 키워드, 감정, 의도를 감지하여 가중치 채점
 * - "상시 다른 추천경로": 동일하거나 유사한 텍스트라도 매 세션/시간대/사이클에 따라
 *   상위 적합 후보군 중 다양한 경로를 동적으로 순환 제안
 */
export function getRecommendedMenu(
  text: string,
  currentPath: string = '',
  cycleOffset: number = 0
): RecommendedMenuResult {
  const normCurrentPath = (currentPath || '').toLowerCase();
  const trimmed = (text || '').trim().toLowerCase();

  // 1. 현재 머무르고 있는 페이지/모듈 제외 (자기 자신으로의 무의미한 토스 원천 방지)
  const availableMenus = PRISM_20_MENU_DESTINATIONS.filter((menu) => {
    const normBase = menu.basePath.toLowerCase();
    if (normBase === '/' && normCurrentPath === '/') return false;
    if (normBase !== '/' && normCurrentPath.startsWith(normBase)) return false;
    // 호환 별칭 경로 배제
    if (normBase === '/handbook' && normCurrentPath.startsWith('/rebible')) return false;
    if (normBase === '/omniwarp' && normCurrentPath.startsWith('/bigbang')) return false;
    return true;
  });

  const candidatesToScore = availableMenus.length > 0 ? availableMenus : PRISM_20_MENU_DESTINATIONS;

  // 2. 맥락 채점 (Keyword + Regex Intent + Sentiment Boosters)
  const scored = candidatesToScore.map((menu) => {
    let score = 1; // 기본 점수

    // (1) 키워드 매칭 (키워드 길이에 따른 가중치)
    for (const kw of menu.keywords) {
      if (trimmed.includes(kw.toLowerCase())) {
        score += Math.max(kw.length * 4, 8);
      }
    }

    // (2) 정규식 의도 매칭 (+25점)
    if (menu.intentRegex.test(trimmed)) {
      score += 25;
    }

    // (3) 감정 및 상황별 시너지 보정
    // 슬픔/상처/외로움 감정 맥락
    if (/슬프|눈물|괴로|힘들|외로|아파|상처|울적/.test(trimmed)) {
      if (menu.id === 'bluebird_sanctuary' || menu.id === 'heal_hoponopono') score += 20;
      if (menu.id === 'orange_mind' || menu.id === 'muse_art') score += 15;
    }
    // 소망/바람/미래 계획 맥락
    if (/바라|소원|성공|이루|하고 싶|꿈|목표|소망/.test(trimmed)) {
      if (menu.id === 'orange_well' || menu.id === 'trinity_oracle') score += 22;
      if (menu.id === 'trinity_saju' || menu.id === 'epilogue_journal') score += 14;
    }
    // 피로/신체 스트레스 맥락
    if (/피곤|지쳤|숨|뻐근|목|어깨|스트레스|휴식|졸려/.test(trimmed)) {
      if (menu.id === 'heal_wellness' || menu.id === 'hub_ecpr') score += 22;
      if (menu.id === 'heal_sedona' || menu.id === 'bluebird_sanctuary') score += 14;
    }
    // 기록/생각 정리/저녁 맥락
    if (/생각|정리|오늘|하루|마무리|기억|적어|일기/.test(trimmed)) {
      if (menu.id === 'epilogue_journal' || menu.id === 'epilogue_retrospect') score += 20;
      if (menu.id === 'trinity_daily' || menu.id === 'handbook_bible') score += 14;
    }
    // 예술/음악/감수성 맥락
    if (/노래|그림|시|글귀|예술|선율|아름다|감상/.test(trimmed)) {
      if (menu.id === 'muse_art' || menu.id === 'muse_docent') score += 25;
    }

    return {
      menu,
      score,
      reason: menu.contextReason,
    };
  });

  // 점수 내림차순 정렬
  scored.sort((a, b) => b.score - a.score);

  const maxScore = scored[0]?.score || 1;
  const hasStrongMatch = maxScore >= 12;

  // 상위 적합 후보군 추출
  // 강한 매칭이 있는 경우: 최고 점수의 60% 이상인 후보군(또는 상위 4개)
  // 중립 텍스트인 경우: 가용한 전체 후보군 순환
  const topTier = hasStrongMatch
    ? scored.filter((item) => item.score >= Math.max(maxScore * 0.6, 8)).slice(0, 5)
    : scored;

  // "상시 다른 추천경로" 동적 회전 계산:
  // 텍스트 해시 + 분 단위 슬롯 + cycleOffset 조합으로 매 선택마다 고유하면서도 신선한 추천 산출
  const textHash = simpleHash(trimmed);
  const timeSlot = Math.floor(Date.now() / (1000 * 20)); // 20초마다 주기적 회전 슬라이스
  const candidateIndex = Math.abs(textHash + timeSlot + cycleOffset) % topTier.length;

  // 🌟 상위 1순위, 2순위, 3순위 고유 추천 경로 산출 (중복 원천 방지)
  const usedIds = new Set<string>();
  const pickCandidate = (offset: number) => {
    for (let i = 0; i < topTier.length; i++) {
      const idx = (candidateIndex + offset + i) % topTier.length;
      const candidate = topTier[idx];
      if (candidate && !usedIds.has(candidate.menu.id)) {
        usedIds.add(candidate.menu.id);
        return candidate;
      }
    }
    for (const item of scored) {
      if (!usedIds.has(item.menu.id)) {
        usedIds.add(item.menu.id);
        return item;
      }
    }
    return scored[0];
  };

  const firstCandidate = pickCandidate(0);
  const secondCandidate = pickCandidate(1);
  const thirdCandidate = pickCandidate(2);

  const top3: TopRankedMenu[] = [
    { rank: 1, menu: firstCandidate.menu, contextReason: firstCandidate.reason, matchScore: firstCandidate.score },
    { rank: 2, menu: secondCandidate.menu, contextReason: secondCandidate.reason, matchScore: secondCandidate.score },
    { rank: 3, menu: thirdCandidate.menu, contextReason: thirdCandidate.reason, matchScore: thirdCandidate.score },
  ];

  const chosen = firstCandidate;

  return {
    menu: chosen.menu,
    contextReason: chosen.reason,
    matchScore: chosen.score,
    allRankedMenus: scored,
    currentIndex: candidateIndex,
    totalCandidates: topTier.length,
    top3,
  };
}

/**
 * 선택된 텍스트를 추천된 메뉴로 즉각 토스(Toss) & 이동
 */
export function tossSelectionToMenu(
  text: string,
  menu: PrismMenuDestination,
  currentPath: string,
  navigate: (path: string) => void
): void {
  if (!text || text.trim().length < 2) return;
  const trimmed = text.trim();

  try {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.(45);
    }
  } catch (_) {}

  // 1. 세션 스토리지에 드래그 선택 컨텍스트 저장
  savePendingSelection(trimmed, menu.id, currentPath, {
    targetMenuId: menu.id,
    targetPath: menu.path,
    contextReason: menu.contextReason,
  });

  // 2. 통합 프리즘 토스 파이프라인 전송 (타깃 앱 수신용)
  sendPrismToss({
    sourceApp: currentPath || 'selection_bridge',
    targetApp: menu.tossTargetId,
    actionType: 'smart_toss',
    contextMessage: trimmed,
    autoPrompt: trimmed,
    tossedAt: Date.now(),
  });

  // 3. 브라우저 커스텀 이벤트 발행 (탭 전환 등 연동 지원)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('prism:selection_tossed', {
        detail: {
          text: trimmed,
          targetMenu: menu,
          sourcePath: currentPath,
        },
      })
    );

    // 쿼리 파라미터가 포함된 경우 tab 이벤트 발생
    if (menu.path.includes('?')) {
      try {
        const url = new URL(menu.path, 'http://localhost');
        const tab = url.searchParams.get('tab');
        if (tab) {
          window.dispatchEvent(new CustomEvent('prism-tab-change', { detail: { tab } }));
        }
      } catch (_) {}
    }

    window.dispatchEvent(new CustomEvent('nav-click-active', { detail: { path: menu.path } }));
  }

  // 4. 경로 이동 실행
  navigate(menu.path);
}
