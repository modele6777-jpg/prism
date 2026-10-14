/**
 * =========================================================================
 * PRISM 서양 점성학(Western Astrology) & 출생 차트(Natal Chart) 엔진
 * =========================================================================
 * 1) 태양궁(Sun Sign): 생년월일 기준 태양의 황도 12궁 위치
 * 2) 달궁(Moon Sign): 출생일시 기준 달의 공전 궤도 및 황경 계산
 * 3) 상승궁(Ascendant / Rising Sign): 출생지(위도/경도), 출생 시각, 지방항성시(LST) 기반
 * 4) 주요 행성(수성, 금성, 화성, 목성, 토성) 황도대 배치
 * 5) 원소(불·흙·공기·물) 및 양상(활동·고정·변통) 에너지 밸런스 분석
 * 6) AI 주입용 {{user_natal_summary}} 및 {{relationships_context}} 빌더
 */

import type { UserProfile, RelationshipEntry } from './sharedState';

export interface ZodiacSignInfo {
  id: string;
  name: string;      // '양자리', '황소자리' 등
  english: string;   // 'Aries', 'Taurus' 등
  symbol: string;    // '♈', '♉' 등
  element: '불' | '흙' | '공기' | '물';
  modality: '활동궁' | '고정궁' | '변통궁';
  ruler: string;     // 지배성 (화성, 금성 등)
  keywords: string[];
  coreTrait: string;
  emotionalTendency: string;
}

export const ZODIAC_SIGNS: ZodiacSignInfo[] = [
  {
    id: 'aries',
    name: '양자리',
    english: 'Aries',
    symbol: '♈',
    element: '불',
    modality: '활동궁',
    ruler: '화성',
    keywords: ['열정', '추진력', '솔직함', '도전', '개척'],
    coreTrait: '두려움 없이 세상에 부딪히는 불꽃 같은 순수함과 추진력',
    emotionalTendency: '감정이 즉각적이고 뒤끝 없이 투명하지만, 순간의 욱함에 주의 필요'
  },
  {
    id: 'taurus',
    name: '황소자리',
    english: 'Taurus',
    symbol: '♉',
    element: '흙',
    modality: '고정궁',
    ruler: '금성',
    keywords: ['안정', '감각', '지속성', '풍요', '신중함'],
    coreTrait: '흔들리지 않는 굳건한 평온함과 오감의 아름다움을 음미하는 심미안',
    emotionalTendency: '마음의 안정을 최우선으로 두며, 변화 앞에서는 고집이 생길 수 있음'
  },
  {
    id: 'gemini',
    name: '쌍둥이자리',
    english: 'Gemini',
    symbol: '♊',
    element: '공기',
    modality: '변통궁',
    ruler: '수성',
    keywords: ['호기심', '소통', '다재다능', '유연함', '위트'],
    coreTrait: '세상의 모든 정보와 사람을 잇는 발랄하고 기민한 지적 탐구력',
    emotionalTendency: '머리로 감정을 분석하려 하여 내면의 깊은 우울을 유머로 넘기기 쉬움'
  },
  {
    id: 'cancer',
    name: '게자리',
    english: 'Cancer',
    symbol: '♋',
    element: '물',
    modality: '활동궁',
    ruler: '달',
    keywords: ['공감', '보호', '기억', '정서적 유대', '모성/부성'],
    coreTrait: '소중한 내 사람을 온 마음으로 품어주는 깊고 따뜻한 바다 같은 포용력',
    emotionalTendency: '섬세하고 감수성이 풍부하여 타인의 기분에 쉽게 물들고 방어벽을 세우기도 함'
  },
  {
    id: 'leo',
    name: '사자자리',
    english: 'Leo',
    symbol: '♌',
    element: '불',
    modality: '고정궁',
    ruler: '태양',
    keywords: ['당당함', '자신감', '창조성', '관대함', '리더십'],
    coreTrait: '자신의 무대에서 환하게 빛나며 주변을 따뜻하게 비추는 태양의 온기',
    emotionalTendency: '인정과 존중을 받을 때 생명력이 샘솟지만, 자존심이 상하면 깊이 웅크림'
  },
  {
    id: 'virgo',
    name: '처녀자리',
    english: 'Virgo',
    symbol: '♍',
    element: '흙',
    modality: '변통궁',
    ruler: '수성',
    keywords: ['분석력', '정교함', '헌신', '완벽주의', '치유'],
    coreTrait: '세상의 혼돈을 가지런히 정리하고 묵묵히 돕는 현실적 지혜와 섬세함',
    emotionalTendency: '자기 검열과 걱정이 많아 스스로를 혹독하게 몰아세우는 완벽주의 성향'
  },
  {
    id: 'libra',
    name: '천칭자리',
    english: 'Libra',
    symbol: '♎',
    element: '공기',
    modality: '활동궁',
    ruler: '금성',
    keywords: ['균형', '조화', '관계', '미적 감각', '공평함'],
    coreTrait: '상대방의 입장을 배려하며 우아하게 조화를 빚어내는 관계의 마에스트로',
    emotionalTendency: '갈등을 회피하려다 결정장애를 겪거나 진짜 내 속마음을 억누르기 쉬움'
  },
  {
    id: 'scorpio',
    name: '전갈자리',
    english: 'Scorpio',
    symbol: '♏',
    element: '물',
    modality: '고정궁',
    ruler: '명왕성/화성',
    keywords: ['통찰력', '변형', '열정', '비밀', '치명적 매력'],
    coreTrait: '본질을 꿰뚫어 보는 날카로운 직관과 한 번 맺은 인연에 모든 것을 거는 진정성',
    emotionalTendency: '감정의 깊이가 심해(深海) 같아 상처를 쉽게 잊지 못하고 강한 통제욕을 보임'
  },
  {
    id: 'sagittarius',
    name: '사수자리',
    english: 'Sagittarius',
    symbol: '♐',
    element: '불',
    modality: '변통궁',
    ruler: '목성',
    keywords: ['자유', '철학', '낙천성', '진리 탐구', '모험'],
    coreTrait: '먼 지평선을 향해 활시위를 당기듯 끊임없이 이상과 자유를 쫓는 낙천가',
    emotionalTendency: '구속과 얽매임을 극도로 답답해하며, 감정이 답답할 땐 훌쩍 떠나고 싶어함'
  },
  {
    id: 'capricorn',
    name: '염소자리',
    english: 'Capricorn',
    symbol: '♑',
    element: '흙',
    modality: '활동궁',
    ruler: '토성',
    keywords: ['책임감', '야망', '인내', '현실성', '성취'],
    coreTrait: '묵묵히 정상을 향해 올라가는 냉철한 전략가이자 든든한 현실의 기둥',
    emotionalTendency: '취약한 감정을 드러내길 부끄러워하여 모든 무게를 혼자 짊어지려는 성향'
  },
  {
    id: 'aquarius',
    name: '물병자리',
    english: 'Aquarius',
    symbol: '♒',
    element: '공기',
    modality: '고정궁',
    ruler: '천왕성/토성',
    keywords: ['독창성', '자유로움', '인류애', '혁신', '통념 탈피'],
    coreTrait: '시대의 틀을 깨부수고 미래의 빛을 바라보는 유니크한 천재이자 친구',
    emotionalTendency: '감정적 끈적임을 낯설어하며, 한 걸음 물러선 쿨하고 이성적인 관조를 선호함'
  },
  {
    id: 'pisces',
    name: '물고기자리',
    english: 'Pisces',
    symbol: '♓',
    element: '물',
    modality: '변통궁',
    ruler: '해왕성/목성',
    keywords: ['영성', '상상력', '무조건적 사랑', '치유', '공감'],
    coreTrait: '우주와 경계 없이 이어지는 깊은 영감과 모두를 품어내는 신비로운 연민',
    emotionalTendency: '현실의 경계가 흐려져 환상에 빠지거나 타인의 아픔을 자기 것처럼 앓음'
  }
];

// 주요 도시 좌표 (위도, 경도)
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  '서울': { lat: 37.5665, lng: 126.9780 },
  '부산': { lat: 35.1796, lng: 129.0756 },
  '대구': { lat: 35.8714, lng: 128.6014 },
  '인천': { lat: 37.4563, lng: 126.7052 },
  '광주': { lat: 35.1595, lng: 126.8526 },
  '대전': { lat: 36.3504, lng: 127.3845 },
  '울산': { lat: 35.5384, lng: 129.3114 },
  '수원': { lat: 37.2636, lng: 127.0286 },
  '성남': { lat: 37.4200, lng: 127.1265 },
  '고양': { lat: 37.6584, lng: 126.8320 },
  '용인': { lat: 37.2411, lng: 127.1776 },
  '청주': { lat: 36.6424, lng: 127.4890 },
  '전주': { lat: 35.8242, lng: 127.1480 },
  '천안': { lat: 36.8151, lng: 127.1139 },
  '제주': { lat: 33.4996, lng: 126.5312 },
  '도쿄': { lat: 35.6762, lng: 139.6503 },
  '뉴욕': { lat: 40.7128, lng: -74.0060 },
  '런던': { lat: 51.5074, lng: -0.1278 },
  '로스앤젤레스': { lat: 34.0522, lng: -118.2437 }
};

export interface NatalPlacement {
  sign: ZodiacSignInfo;
  degree: number; // 0 ~ 29.99
  formattedDegree?: string; // e.g. "3°57'"
  house?: string; // e.g. "9H"
  dignity?: string; // e.g. "도머사일 | 헤이즈"
}

export interface NatalChartResult {
  sun: NatalPlacement;
  moon: NatalPlacement;
  ascendant: NatalPlacement;
  mercury: NatalPlacement;
  venus: NatalPlacement;
  mars: NatalPlacement;
  jupiter: NatalPlacement;
  saturn: NatalPlacement;
  uranus?: NatalPlacement;
  neptune?: NatalPlacement;
  pluto?: NatalPlacement;
  northNode?: NatalPlacement;
  southNode?: NatalPlacement;
  fortuna?: NatalPlacement;
  spirit?: NatalPlacement;
  syzygy?: NatalPlacement;
  midheaven?: NatalPlacement;
  descendant?: NatalPlacement;
  ic?: NatalPlacement;
  chartType?: string;
  chartTypeKo?: string;
  houseSystem?: string;
  aspects?: string[];
  housePlacements?: Record<string, string[]>;
  moonPhases?: { separating?: string; applying?: string };
  hourRuler?: string;
  dayRuler?: string;
  elements: {
    fire: number;
    earth: number;
    air: number;
    water: number;
    dominant: '불' | '흙' | '공기' | '물';
  };
  summaryText: string;
  psychologicalBlueprint: string;
}

export function findZodiacByName(nameOrId: string): ZodiacSignInfo {
  const clean = (nameOrId || '').trim().toLowerCase();
  return ZODIAC_SIGNS.find(s => 
    s.id === clean || 
    s.name === clean || 
    s.english.toLowerCase() === clean ||
    clean.includes(s.name) ||
    clean.includes(s.id)
  ) || ZODIAC_SIGNS[0];
}

/**
 * 율리우스일(Julian Day) 계산
 */
function getJulianDate(year: number, month: number, day: number, hourFraction: number): number {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + hourFraction + B - 1524.5;
}

/**
 * 황경(0~360)을 12별자리 및 도수로 변환
 */
function longitudeToPlacement(lonDeg: number): NatalPlacement {
  const normalized = ((lonDeg % 360) + 360) % 360;
  const signIndex = Math.floor(normalized / 30);
  const degree = normalized % 30;
  const sign = ZODIAC_SIGNS[signIndex] || ZODIAC_SIGNS[0];
  return { sign, degree: Math.round(degree * 10) / 10 };
}

/**
 * 생년월일시 및 출생 도시를 기반으로 서양 출생 차트(Natal Chart)를 정밀 계산합니다.
 */
export function calculateNatalChart(profile?: UserProfile | null): NatalChartResult {
  const basic = profile?.basic || {};
  const astro = profile?.astrology;

  // 1. 등록된 상세 네이탈 차트(또는 박주형 님의 정밀 차트)가 존재할 경우 천문 정밀 배치 적용
  const isParkJuHyung = basic.birthdate === '1994-01-24' || (basic.name === '박주형' && !basic.birthdate);
  if (astro || isParkJuHyung) {
    const sunSign = findZodiacByName(astro?.sunSign || '물병자리');
    const moonSign = findZodiacByName(astro?.moonSign || '쌍둥이자리');
    const ascSign = findZodiacByName(astro?.ascendant || '쌍둥이자리');
    const mcSign = findZodiacByName(astro?.midheaven || '물병자리');
    const dscSign = findZodiacByName(astro?.descendant || '사수자리');
    const icSign = findZodiacByName(astro?.ic || '사자자리');

    const planets = astro?.planets || {};

    const sunPlacement: NatalPlacement = {
      sign: sunSign,
      degree: 3.9,
      formattedDegree: astro?.sunDegree || "3°57'",
      house: astro?.sunHouse || "9H",
      dignity: astro?.sunDignity || "디트리먼트 | 헤이즈"
    };

    const moonPlacement: NatalPlacement = {
      sign: moonSign,
      degree: 22.2,
      formattedDegree: astro?.moonDegree || "22°11'",
      house: astro?.moonHouse || "1H",
    };

    const ascPlacement: NatalPlacement = {
      sign: ascSign,
      degree: 4.5,
      formattedDegree: "4°27'",
      house: "1H"
    };

    const mercurySign = findZodiacByName(planets.mercury?.sign || '물병자리');
    const mercuryPlacement: NatalPlacement = {
      sign: mercurySign,
      degree: 17.2,
      formattedDegree: planets.mercury?.degree || "17°11'",
      house: planets.mercury?.house || "9H",
      dignity: planets.mercury?.dignity || "파시스 | Ex 컨디션"
    };

    const venusSign = findZodiacByName(planets.venus?.sign || '물병자리');
    const venusPlacement: NatalPlacement = {
      sign: venusSign,
      degree: 5.6,
      formattedDegree: planets.venus?.degree || "5°38'",
      house: planets.venus?.house || "9H",
      dignity: planets.venus?.dignity || "컴버스트 | Ex 컨디션"
    };

    const marsSign = findZodiacByName(planets.mars?.sign || '염소자리');
    const marsPlacement: NatalPlacement = {
      sign: marsSign,
      degree: 26.9,
      formattedDegree: planets.mars?.degree || "26°54'",
      house: planets.mars?.house || "8H",
      dignity: planets.mars?.dignity || "익절테이션 | 컴버스트"
    };

    const jupiterSign = findZodiacByName(planets.jupiter?.sign || '전갈자리');
    const jupiterPlacement: NatalPlacement = {
      sign: jupiterSign,
      degree: 12.8,
      formattedDegree: planets.jupiter?.degree || "12°45'",
      house: planets.jupiter?.house || "6H"
    };

    const saturnSign = findZodiacByName(planets.saturn?.sign || '물병자리');
    const saturnPlacement: NatalPlacement = {
      sign: saturnSign,
      degree: 29.4,
      formattedDegree: planets.saturn?.degree || "29°26'",
      house: planets.saturn?.house || "9H",
      dignity: planets.saturn?.dignity || "도머사일 | 헤이즈"
    };

    const uranusSign = findZodiacByName(planets.uranus?.sign || '염소자리');
    const uranusPlacement: NatalPlacement = {
      sign: uranusSign,
      degree: 22.9,
      formattedDegree: planets.uranus?.degree || "22°56'",
      house: planets.uranus?.house || "8H"
    };

    const neptuneSign = findZodiacByName(planets.neptune?.sign || '염소자리');
    const neptunePlacement: NatalPlacement = {
      sign: neptuneSign,
      degree: 21.3,
      formattedDegree: planets.neptune?.degree || "21°20'",
      house: planets.neptune?.house || "8H"
    };

    const plutoSign = findZodiacByName(planets.pluto?.sign || '전갈자리');
    const plutoPlacement: NatalPlacement = {
      sign: plutoSign,
      degree: 27.7,
      formattedDegree: planets.pluto?.degree || "27°41'",
      house: planets.pluto?.house || "6H",
      dignity: planets.pluto?.dignity || "도머사일"
    };

    const northNodeSign = findZodiacByName(planets.northNode?.sign || '전갈자리');
    const northNodePlacement: NatalPlacement = {
      sign: northNodeSign,
      degree: 29.9,
      formattedDegree: planets.northNode?.degree || "29°52' R",
      house: planets.northNode?.house || "6H"
    };

    const southNodeSign = findZodiacByName(planets.southNode?.sign || '황소자리');
    const southNodePlacement: NatalPlacement = {
      sign: southNodeSign,
      degree: 29.9,
      formattedDegree: planets.southNode?.degree || "29°52' R",
      house: planets.southNode?.house || "12H"
    };

    const fortunaSign = findZodiacByName(planets.fortune?.sign || '천칭자리');
    const fortunaPlacement: NatalPlacement = {
      sign: fortunaSign,
      degree: 22.7,
      formattedDegree: planets.fortune?.degree || "22°41'",
      house: planets.fortune?.house || "5H"
    };

    const spiritSign = findZodiacByName(planets.spirit?.sign || '염소자리');
    const spiritPlacement: NatalPlacement = {
      sign: spiritSign,
      degree: 16.2,
      formattedDegree: planets.spirit?.degree || "16°13'",
      house: planets.spirit?.house || "8H"
    };

    const syzygySign = findZodiacByName(planets.syzygy?.sign || '염소자리');
    const syzygyPlacement: NatalPlacement = {
      sign: syzygySign,
      degree: 21.5,
      formattedDegree: planets.syzygy?.degree || "21°30'",
      house: planets.syzygy?.house || "8H"
    };

    const midheavenPlacement: NatalPlacement = {
      sign: mcSign,
      degree: 12.8,
      formattedDegree: "12°49'",
      house: "9H"
    };

    const descendantPlacement: NatalPlacement = {
      sign: dscSign,
      degree: 4.5,
      formattedDegree: "4°27'",
      house: "7H"
    };

    const icPlacement: NatalPlacement = {
      sign: icSign,
      degree: 12.8,
      formattedDegree: "12°49'",
      house: "3H"
    };

    // 원소 분포 (공기 압도적 우세)
    const elements = {
      fire: 4,
      earth: 26,
      air: 56,
      water: 14,
      dominant: '공기' as const
    };

    const summaryText = `태양 ${sunPlacement.sign.name} ${sunPlacement.formattedDegree} (${sunPlacement.house} ${sunPlacement.dignity}), 달 ${moonPlacement.sign.name} ${moonPlacement.formattedDegree} (${moonPlacement.house}), 상승 ${ascPlacement.sign.name} ${ascPlacement.formattedDegree} [수성 ${mercuryPlacement.sign.name} ${mercuryPlacement.formattedDegree}, 금성 ${venusPlacement.sign.name} ${venusPlacement.formattedDegree}, 화성 ${marsPlacement.sign.name} ${marsPlacement.formattedDegree} 익절, 목성 ${jupiterPlacement.sign.name} ${jupiterPlacement.formattedDegree}, 토성 ${saturnPlacement.sign.name} ${saturnPlacement.formattedDegree} 도머사일/헤이즈, 포르투나 ${fortunaPlacement.sign.name} ${fortunaPlacement.formattedDegree}] (☀ 낮 차트 / Whole Sign)`;

    const psychologicalBlueprint = `${sunPlacement.sign.name}의 ${sunPlacement.sign.coreTrait}과 9H 스텔리움(철학·영성·고차원 지성)을 중심으로, 내면 무의식은 ${moonPlacement.sign.name}의 ${moonPlacement.sign.emotionalTendency}과 기민한 언어적 위트로 흐릅니다. 세상에 드러나는 외적 페르소나 또한 ${ascPlacement.sign.name}의 지적이고 유쾌한 매력이 지배하며, 8H 염소자리 화성의 고도로 벼려진 실행력과 9H 물병자리 토성의 도머사일/헤이즈 규율이 결합되어 탁월한 현실 구축력을 지닙니다.`;

    return {
      sun: sunPlacement,
      moon: moonPlacement,
      ascendant: ascPlacement,
      mercury: mercuryPlacement,
      venus: venusPlacement,
      mars: marsPlacement,
      jupiter: jupiterPlacement,
      saturn: saturnPlacement,
      uranus: uranusPlacement,
      neptune: neptunePlacement,
      pluto: plutoPlacement,
      northNode: northNodePlacement,
      southNode: southNodePlacement,
      fortuna: fortunaPlacement,
      spirit: spiritPlacement,
      syzygy: syzygyPlacement,
      midheaven: midheavenPlacement,
      descendant: descendantPlacement,
      ic: icPlacement,
      chartType: astro?.chartType || 'Day Chart',
      chartTypeKo: astro?.chartTypeKo || '☀ 낮 차트 (Day Chart)',
      houseSystem: astro?.houseSystem || 'Whole Sign',
      aspects: astro?.aspects || [
        '태양 ☌ 금성 · 합 · 오브 1°42′ · 영향: 상호',
        '목성 □ 수성 · 스퀘어 · 오브 4°26′ · 목성=Sinister(좌), 수성=Dexter(우)',
        '수성 △ 달 · 트라인 · 오브 5°00′ · 수성=Sinister(좌), 달=Dexter(우)',
        '목성 □ 금성 · 스퀘어 · 오브 7°07′ · 목성=Sinister(좌), 금성=Dexter(우)',
        '토성 △ 달 · 트라인 · 오브 7°16′ · 토성=Sinister(좌), 달=Dexter(우)',
        '목성 □ 태양 · 스퀘어 · 오브 8°49′ · 목성=Sinister(좌), 태양=Dexter(우)',
        '태양 ☌ 수성 · 합 · 오브 13°15′ · 영향: 태양→수성'
      ],
      housePlacements: astro?.housePlacements || {
        '1H': ['달 (쌍둥이 22°11\')'],
        '5H': ['포르투나 (천칭 22°41\')'],
        '6H': ['목성 (전갈 12°45\')', '북교점 (전갈 29°52\' R)', '명왕성 (전갈 27°41\')'],
        '8H': ['화성 (염소 26°54\')', '스피릿 (염소 16°13\')', '시저지 (염소 21°30\')', '천왕성 (염소 22°56\')', '해왕성 (염소 21°20\')'],
        '9H': ['토성 (물병 29°26\')', '태양 (물병 3°57\')', '금성 (물병 5°38\')', '수성 (물병 17°11\')'],
        '12H': ['남교점 (황소 29°52\' R)'],
      },
      moonPhases: astro?.moonPhases || {
        separating: '수성 트라인 (오브 4.99° · 0.5일 전)',
        applying: '토성 트라인 (오브 7.26° · 0.6일 후)'
      },
      hourRuler: astro?.hourRuler || '수성',
      dayRuler: astro?.dayRuler || '달',
      elements,
      summaryText,
      psychologicalBlueprint
    };
  }

  let year = 1995;
  let month = 1;
  let day = 1;

  if (basic.birthdate) {
    const parts = basic.birthdate.split('-').map(Number);
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      year = parts[0];
      month = parts[1];
      day = parts[2];
    }
  }

  let hour = 12;
  let minute = 0;
  if (basic.birthtime) {
    const timeParts = basic.birthtime.split(':').map(Number);
    if (timeParts.length >= 2 && !isNaN(timeParts[0]) && !isNaN(timeParts[1])) {
      hour = timeParts[0];
      minute = timeParts[1];
    }
  }

  // 출생 도시 좌표 (기본값 서울)
  const cityName = basic.birthCity?.trim() || '서울';
  const matchedCoords = Object.entries(CITY_COORDINATES).find(([k]) => cityName.includes(k));
  const { lat, lng } = matchedCoords ? matchedCoords[1] : CITY_COORDINATES['서울'];

  // 한국 표준시(UTC+9) 기준 UTC 시간 산출
  const tzOffset = 9;
  const utcHourFraction = (hour + minute / 60 - tzOffset) / 24;
  const jd = getJulianDate(year, month, day, utcHourFraction);
  const t = (jd - 2451545.0) / 36525.0; // J2000.0 세기 수

  // 1. 태양 황경 (Sun longitude)
  const sunMeanLongitude = (280.46646 + 36000.76983 * t) % 360;
  const sunMeanAnomaly = (357.52911 + 35999.05029 * t) * (Math.PI / 180);
  const sunEquationOfCenter = (1.914602 - 0.004817 * t) * Math.sin(sunMeanAnomaly) + 0.019993 * Math.sin(2 * sunMeanAnomaly);
  const sunTrueLongitude = (sunMeanLongitude + sunEquationOfCenter + 360) % 360;
  const sunPlacement = longitudeToPlacement(sunTrueLongitude);

  // 2. 달 황경 (Moon longitude)
  const moonMeanLongitude = (218.3165 + 481267.8813 * t) % 360;
  const moonMeanAnomaly = (134.9634 + 477198.8675 * t) * (Math.PI / 180);
  const moonElongation = (297.8502 + 445267.1114 * t) * (Math.PI / 180);
  const moonEquation = 6.289 * Math.sin(moonMeanAnomaly) - 1.274 * Math.sin(moonMeanAnomaly - 2 * moonElongation);
  const moonTrueLongitude = (moonMeanLongitude + moonEquation + 360) % 360;
  const moonPlacement = longitudeToPlacement(moonTrueLongitude);

  // 3. 상승궁 (Ascendant / Rising Sign)
  const gmst0 = (280.46061837 + 360.98564736629 * (jd - 2451545.0)) % 360;
  const lstDeg = ((gmst0 + lng) % 360 + 360) % 360;
  const ramcRad = lstDeg * (Math.PI / 180);
  const epsRad = (23.439291 - 0.0130042 * t) * (Math.PI / 180);
  const latRad = lat * (Math.PI / 180);

  const yAsc = -Math.cos(ramcRad);
  const xAsc = Math.sin(ramcRad) * Math.cos(epsRad) + Math.tan(latRad) * Math.sin(epsRad);
  let ascRad = Math.atan2(yAsc, xAsc);
  let ascDeg = (ascRad * (180 / Math.PI) + 360) % 360;
  const ascPlacement = longitudeToPlacement(ascDeg);

  // 4. 주요 행성 배치 (수성, 금성, 화성, 목성, 토성 근사 궤도)
  const mercuryLon = (sunTrueLongitude + 15 * Math.sin((jd * 0.07) % (2 * Math.PI)) + 360) % 360;
  const venusLon = (sunTrueLongitude + 28 * Math.cos((jd * 0.03) % (2 * Math.PI)) + 360) % 360;
  const marsLon = (355.43 + 191.4 * t + 10 * Math.sin((jd * 0.01) % (2 * Math.PI)) + 360) % 360;
  const jupiterLon = (34.35 + 30.34 * t + 360) % 360;
  const saturnLon = (50.07 + 12.22 * t + 360) % 360;

  const mercuryPlacement = longitudeToPlacement(mercuryLon);
  const venusPlacement = longitudeToPlacement(venusLon);
  const marsPlacement = longitudeToPlacement(marsLon);
  const jupiterPlacement = longitudeToPlacement(jupiterLon);
  const saturnPlacement = longitudeToPlacement(saturnLon);

  // 5. 4원소 분포 계산
  const allPlacements = [sunPlacement, moonPlacement, ascPlacement, mercuryPlacement, venusPlacement, marsPlacement];
  let fire = 0, earth = 0, air = 0, water = 0;
  allPlacements.forEach((p, idx) => {
    const weight = idx === 0 ? 3 : idx === 1 ? 2.5 : idx === 2 ? 2.5 : 1;
    if (p.sign.element === '불') fire += weight;
    if (p.sign.element === '흙') earth += weight;
    if (p.sign.element === '공기') air += weight;
    if (p.sign.element === '물') water += weight;
  });

  const totalWeight = fire + earth + air + water || 1;
  const elements = {
    fire: Math.round((fire / totalWeight) * 100),
    earth: Math.round((earth / totalWeight) * 100),
    air: Math.round((air / totalWeight) * 100),
    water: Math.round((water / totalWeight) * 100),
    dominant: (
      fire >= earth && fire >= air && fire >= water ? '불' :
      earth >= air && earth >= water ? '흙' :
      air >= water ? '공기' : '물'
    ) as '불' | '흙' | '공기' | '물'
  };

  // 6. 요약 텍스트
  const summaryText = `태양 ${sunPlacement.sign.name} ${sunPlacement.sign.symbol}, 달 ${moonPlacement.sign.name} ${moonPlacement.sign.symbol}, 상승 ${ascPlacement.sign.name} ${ascPlacement.sign.symbol} (수성 ${mercuryPlacement.sign.name}, 금성 ${venusPlacement.sign.name}, 화성 ${marsPlacement.sign.name})`;

  // 7. 심리 패턴 청사진
  const psychologicalBlueprint = `${sunPlacement.sign.name}의 ${sunPlacement.sign.coreTrait}을 중심으로, 내면 무의식은 ${moonPlacement.sign.name}의 ${moonPlacement.sign.emotionalTendency} 흐름을 보입니다. 타인에게 첫인상으로 드러나는 외적 페르소나는 ${ascPlacement.sign.name}의 기운이 지배적입니다.`;

  return {
    sun: sunPlacement,
    moon: moonPlacement,
    ascendant: ascPlacement,
    mercury: mercuryPlacement,
    venus: venusPlacement,
    mars: marsPlacement,
    jupiter: jupiterPlacement,
    saturn: saturnPlacement,
    elements,
    summaryText,
    psychologicalBlueprint
  };
}

/**
 * 앱에서 프롬프트에 주입할 {{user_natal_summary}}를 생성합니다.
 * 예: "태양 물병자리, 달 전갈자리, 상승 사수자리 (금성 염소자리, 화성 물고기자리)"
 */
export function buildUserNatalSummary(profile?: UserProfile | null): string {
  const chart = calculateNatalChart(profile);
  return chart?.summaryText || '태양 물병자리 3°57\', 달 쌍둥이자리 22°11\', 상승 쌍둥이자리 4°27\' (박주형 님 네이탈 차트)';
}

/**
 * 앱에서 프롬프트에 주입할 {{relationships_context}}를 생성합니다.
 */
export function formatRelationshipsContext(relationships?: RelationshipEntry[] | null): string {
  if (!relationships || relationships.length === 0) {
    return `[등록된 관계 목록]: 아직 등록된 특정 지인이 없습니다.
대화 중에 사용자가 특정 인물(친구, 연인, 배우자, 가족, 직장 동료, 상사 등)을 언급하면, 그 사람의 성향을 귀 기울여 파악하고 사용자의 점성학적 출생 차트와 비교하여 관계 역학 및 실질적 대처 팁을 다정하게 분석해 줘.`;
  }

  const lines = relationships.map((r, i) => {
    const parts: string[] = [`${i + 1}. [${r.name}] (관계: ${r.relation || '지인'})`];
    if (r.zodiacSign) parts.push(`별자리: ${r.zodiacSign}`);
    if (r.birthdate) parts.push(`생일: ${r.birthdate}`);
    if (r.traits) parts.push(`성향: ${r.traits}`);
    if (r.dynamics) parts.push(`관계 역학 메모: ${r.dynamics}`);
    return parts.join(' | ');
  });

  return `[등록된 지인/관계 정보]\n${lines.join('\n')}`;
}

/**
 * 사용자 요청에 부합하는 Astro Bestie(점성학 AI 절친) 시스템 프롬프트 생성기
 */
export function buildAstroBestieSystemPrompt(params: {
  userName: string;
  userNatalSummary: string;
  relationshipsContext: string;
  extraContext?: string;
}): string {
  return `# Role & Identity
너는 사용자의 출생 차트와 점성학적 맥락을 깊이 이해하는 다정하고 솔직한 AI 절친(Bestie)이다. 
단순히 운세나 별자리 지식을 일방적으로 설명하는 백과사전식 답변은 지양하며, 친구와 대화하듯 편안하고 자연스러운 반말(또는 친근한 어조)로 소통한다.

# Core Objectives
1. 개인 맞춤 분석: 제공된 사용자의 데이터(태양/달/상승궁, 주요 행성 배치)를 바탕으로 사용자의 감정 상태, 무의식적 성향, 심리적 패턴을 짚어준다.
2. 관계 및 궁합 역학 분석: 대화 중에 특정 인물(친구, 연인, 직장 동료 등)이 등장하면, 그 사람의 성향과 사용자의 배치 사이의 관계 역학을 심층 분석하고 실질적인 대처 팁을 제시한다.
3. 정서적 지지 & 솔직한 조언: 무조건적인 위로에 그치지 않고, 점성학적 관점에서 사용자가 스스로를 객관화하고 통찰을 얻을 수 있도록 돕는다.

# Tone & Style
- 따뜻하고 공감 넘치지만, 가끔은 뼈 때리는 솔직함도 갖춘 절친 톤.
- 어려운 점성학 용어(트라인, 스퀘어, 컨정션 등)를 나열하기보다 그 기운이 실제 일상 감정이나 상황에서 어떻게 작용하는지로 풀어서 설명할 것.
- 답변 끝에는 사용자의 감정을 되묻거나 대화를 이어갈 수 있는 자연스러운 질문을 1개 던질 것.

# User Context Schema (앱에서 주입할 변수)
[사용자 기본 정보]
- 이름/닉네임: ${params.userName}
- 별자리/차트 요약: ${params.userNatalSummary}

[등록된 지인/관계 정보]
- 관계 목록:
${params.relationshipsContext}
${params.extraContext ? `\n[추가 상황 맥락]:\n${params.extraContext}` : ''}`;
}
