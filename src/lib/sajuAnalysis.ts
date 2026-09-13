/**
 * =========================================================================
 * PRISM 사주명리학(四柱命理學) 정밀 분석 및 본원 에너지 통합 엔진
 * =========================================================================
 * 1) 24절기(입춘/소한 등) 절입일 기반 사주 4주 8자 (년주·월주·일주·시주) 천문 정밀 계산
 * 2) 십신(十神 - 정관, 편관, 정재, 편재, 식신, 상관, 정인, 편인, 비견, 겁재) 및 음양오행 자동 산출
 * 3) 핵심 신살 & 특수 구조 (백호대살, 괴강살, 화개살/사고지, 천간합, 지지충) 정밀 분석
 * 4) 일간(Day Master) 10대 본원 심리/영적 아키타입 프로파일링
 * 5) 오행(목·화·토·금·수) 분포 및 용신(用神) / 희신(喜神) 보약 처방
 * 6) 2026 병오년(丙午年) 세운(Annual Flow)과의 조화 및 기회/주의점
 * 7) 웹앱 연동용 파라미터 (내면 추진력 지수, 재물 실속 친화력, 추천 테마 키워드)
 */

import type { UserProfile } from './sharedState';

// 10간(Ten Heavenly Stems) & 12지(Twelve Earthly Branches)
export const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
export const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

export const STEM_KOREAN: Record<string, string> = {
  '甲': '갑', '乙': '을', '丙': '병', '丁': '정', '戊': '무',
  '己': '기', '庚': '경', '辛': '신', '壬': '임', '癸': '계'
};

export const BRANCH_KOREAN: Record<string, string> = {
  '子': '자', '丑': '축', '寅': '인', '卯': '묘', '辰': '진', '巳': '사',
  '午': '오', '未': '미', '申': '신', '酉': '유', '戌': '술', '亥': '해'
};

export const BRANCH_ANIMALS: Record<string, string> = {
  '子': '쥐', '丑': '소', '寅': '호랑이', '卯': '토끼', '辰': '용', '巳': '뱀',
  '午': '말', '未': '양', '申': '원숭이', '酉': '닭', '戌': '개', '亥': '돼지'
};

export type FiveElement = '목' | '화' | '토' | '금' | '수';

export const STEM_ELEMENT: Record<string, FiveElement> = {
  '甲': '목', '乙': '목',
  '丙': '화', '丁': '화',
  '戊': '토', '己': '토',
  '庚': '금', '辛': '금',
  '壬': '수', '癸': '수',
};

export const BRANCH_ELEMENT: Record<string, FiveElement> = {
  '寅': '목', '卯': '목',
  '巳': '화', '午': '화',
  '辰': '토', '戌': '토', '丑': '토', '未': '토',
  '申': '금', '酉': '금',
  '亥': '수', '子': '수',
};

export const STEM_YIN_YANG: Record<string, '양' | '음'> = {
  '甲': '양', '乙': '음',
  '丙': '양', '丁': '음',
  '戊': '양', '己': '음',
  '庚': '양', '辛': '음',
  '壬': '양', '癸': '음',
};

export const BRANCH_YIN_YANG: Record<string, '양' | '음'> = {
  '子': '음', '丑': '음',
  '寅': '양', '卯': '음',
  '辰': '양', '巳': '음',
  '午': '음', '未': '음',
  '申': '양', '酉': '음',
  '戌': '양', '亥': '음',
};

export const ELEMENT_DETAILS: Record<FiveElement, {
  hanja: string;
  name: string;
  colorName: string;
  colorHex: string;
  direction: string;
  organs: string;
  emotionPositive: string;
  emotionNegative: string;
  remedyFood: string;
  remedyActivity: string;
}> = {
  목: {
    hanja: '木',
    name: '목(나무/생명력)',
    colorName: '청색·초록색·에메랄드',
    colorHex: '#10b981',
    direction: '동쪽',
    organs: '간·담·관절·신경계',
    emotionPositive: '자비심·성장 욕구·창의적 추진력',
    emotionNegative: '조급함·분노·스트레스 경직',
    remedyFood: '신선한 녹색 채소, 키위, 레몬수, 허브티',
    remedyActivity: '아침 숲길 산책, 가벼운 관절 스트레칭, 식물 가꾸기',
  },
  화: {
    hanja: '火',
    name: '화(불/열정)',
    colorName: '적색·오렌지·마젠타',
    colorHex: '#f97316',
    direction: '남쪽',
    organs: '심장·소장·혈관·안구',
    emotionPositive: '열정·환희·솔직함·친화력',
    emotionNegative: '불안·초조·조울·가슴 답답함',
    remedyFood: '따뜻한 성질의 차(생강/계피), 토마토, 붉은 과일',
    remedyActivity: '심호흡, 햇볕 쬐기, 빠른 리듬 음악, 감사 일기',
  },
  토: {
    hanja: '土',
    name: '토(흙/중심/신뢰)',
    colorName: '황색·베이지·골드',
    colorHex: '#eab308',
    direction: '중앙',
    organs: '비장·위장·소화기·근육',
    emotionPositive: '신용·포용력·안정감·중재 능력',
    emotionNegative: '과도한 생각·집착·소화불량',
    remedyFood: '호박, 고구마, 감자, 대추, 따뜻한 잡곡밥',
    remedyActivity: '맨발 걷기(어싱), 복부 온찜질, 명상, 규칙적인 식사',
  },
  금: {
    hanja: '金',
    name: '금(쇠/원칙/결단)',
    colorName: '백색·은색·메탈릭',
    colorHex: '#94a3b8',
    direction: '서쪽',
    organs: '폐·대장·피부·호흡기',
    emotionPositive: '결단력·의리·정확성·심미안',
    emotionNegative: '슬픔·비판적 태도·완벽주의 자책',
    remedyFood: '도라지, 무, 배, 백차, 견과류',
    remedyActivity: '깊은 복식호흡, 목/어깨 이완 스트레칭, 정리정돈',
  },
  수: {
    hanja: '水',
    name: '수(물/지혜/직관)',
    colorName: '흑색·남색·딥블루',
    colorHex: '#3b82f6',
    direction: '북쪽',
    organs: '신장·방광·생식기·골수',
    emotionPositive: '지혜·통찰·유연성·영적 직관',
    emotionNegative: '공포·우울·무기력·고립감',
    remedyFood: '검은콩, 흑임자, 미역/해조류, 미네랄 암반수',
    remedyActivity: '반신욕, 잔잔한 수면 명상, 물 마시기, 일기 쓰기',
  },
};

// 10개 일간별 고유 본원 프로필
export interface DayMasterProfile {
  gan: string;
  hanja: string;
  korean: string;
  element: FiveElement;
  yinYang: '양' | '음';
  symbolName: string;
  archetypeTitle: string;
  coreKeywords: string[];
  personalityEssence: string;
  spiritualMission: string;
  mindsetAdvice: string;
  wellnessFocus: string;
}

export const DAY_MASTER_ARCHETYPES: Record<string, DayMasterProfile> = {
  '甲': {
    gan: '甲',
    hanja: '甲木',
    korean: '갑목',
    element: '목',
    yinYang: '양',
    symbolName: '우뚝 솟은 큰 소나무(巨木)',
    archetypeTitle: '개척자이자 당당한 리더 (The Pioneer Leader)',
    coreKeywords: ['개척정신', '리더십', '추진력', '곧은 절개', '자존심', '책임감'],
    personalityEssence: '하늘을 향해 곧게 뻗어나가는 큰 나무처럼, 주체성이 강하고 스스로 길을 개척하는 우두머리 기질을 지녔습니다. 굽히기를 싫어하며 당당하고 명확한 목표를 향해 나아갑니다.',
    spiritualMission: '주변 사람들에게 든든한 그늘과 버팀목이 되어주며, 새로운 가능성의 문을 솔선수범하여 여는 것.',
    mindsetAdvice: '지나친 뻣뻣함은 강한 바람에 부러지기 쉽습니다. 유연한 수용과 주변의 의견을 온화하게 경청할 때 진정한 대인의 품격이 완성됩니다.',
    wellnessFocus: '간과 목/어깨 근육 경직 완화, 아침 숲길 산책 및 유연성 스트레칭.',
  },
  '乙': {
    gan: '乙',
    hanja: '乙木',
    korean: '을목',
    element: '목',
    yinYang: '음',
    symbolName: '바위를 뚫고 자라나는 꽃과 담쟁이 덩굴(草木)',
    archetypeTitle: '유연한 적응력의 생명력 마스터 (The Resilient Blossom)',
    coreKeywords: ['생명력', '유연성', '적응력', '친화력', '외유내강', '전략적 사고'],
    personalityEssence: '어떤 척박한 환경에서도 뿌리를 내리고 피어나는 야생화처럼, 부드러움 속에 엄청난 끈기와 생명력을 품고 있습니다. 사람과의 관계에서 유연하고 사교성이 뛰어납니다.',
    spiritualMission: '세상에 아름다움과 온기를 퍼뜨리고, 메마른 땅에 파릇한 희망을 틔우는 연결자가 되는 것.',
    mindsetAdvice: '주변 환경이나 타인의 시선에 쉽게 흔들릴 수 있습니다. 내면의 중심 뿌리를 단단히 내리고 나만의 고유한 속도를 믿으세요.',
    wellnessFocus: '신경계 안정, 편안한 허브티 음용, 따뜻한 온기 유지.',
  },
  '丙': {
    gan: '丙',
    hanja: '丙火',
    korean: '병화',
    element: '화',
    yinYang: '양',
    symbolName: '온 세상을 비추는 밝은 태양(太陽)',
    archetypeTitle: '열정과 활력의 빛나는 태양 (The Radiant Sun)',
    coreKeywords: ['열정', '솔직함', '밝은 에너지', '공명정대', '화려함', '추진력'],
    personalityEssence: '하늘에 떠서 만물을 골고루 비추는 태양처럼 숨김없이 솔직하며, 사람들에게 밝은 활력과 에너지를 불어넣습니다. 뒤끝이 없고 당당하며 열정적입니다.',
    spiritualMission: '어둡고 그늘진 곳에 밝은 빛과 희망을 비추며, 세상의 잠든 열정을 일깨우는 등대가 되는 것.',
    mindsetAdvice: '에너지를 한 번에 쏟아붓고 금세 방전(Burnout)되기 쉽습니다. 내면의 불씨를 지치지 않게 조절하는 정적인 명상과 휴식이 필수적입니다.',
    wellnessFocus: '심장 및 안구 피로 관리, 쿨다운(Cool-down) 냉각 호흡, 규칙적인 수면.',
  },
  '丁': {
    gan: '丁',
    hanja: '丁火',
    korean: '정화',
    element: '화',
    yinYang: '음',
    symbolName: '어둠을 밝히는 은은한 촛불과 달빛(燈燭)',
    archetypeTitle: '섬세한 온기와 영적 직관의 치유자 (The Mystic Lantern)',
    coreKeywords: ['섬세함', '예술적 감수성', '집중력', '헌신', '영적 직관', '따뜻한 위로'],
    personalityEssence: '차가운 어둠 속에서 조용히 타오르는 촛불처럼, 타인의 아픔을 깊이 감싸주는 섬세한 온기와 뛰어난 예술적/영적 직관력을 지녔습니다. 집중력이 매우 강합니다.',
    spiritualMission: '상처받은 영혼들의 마음에 따스한 불씨를 피워주고, 깊은 통찰로 어둠 속 길을 밝혀주는 것.',
    mindsetAdvice: '남을 밝히느라 스스로의 초를 다 태워버리지 마세요. 내면의 불안과 집착을 방하착(放下着)하고 자신을 위한 온기를 먼저 채우십시오.',
    wellnessFocus: '혈액순환, 가슴 속 억압된 감정 이완, 아로마 캔들 테라피.',
  },
  '戊': {
    gan: '戊',
    hanja: '戊土',
    korean: '무토',
    element: '토',
    yinYang: '양',
    symbolName: '웅장하고 든든한 태산과 황룡(泰山·黃龍)',
    archetypeTitle: '흔들리지 않는 포용의 대지 (The Mountain of Trust)',
    coreKeywords: ['포용력', '신용', '묵직함', '안정감', '중재자', '뚝심', '위기 돌파력'],
    personalityEssence: '사계절의 변화에도 묵묵히 자리를 지키는 거대한 산처럼, 넓은 도량과 깊은 신용을 가지고 있습니다. 황룡의 기상으로 온화함 뒤에 강한 뚝심과 위기 돌파력을 발휘합니다.',
    spiritualMission: '만물을 품어 기르고 세상의 갈등을 조화롭게 중재하는 든든한 대지의 지탱자가 되는 것.',
    mindsetAdvice: '지나치게 고집스럽거나 변화에 둔감해질 수 있습니다. 때로는 자신의 틀을 깨고 가볍고 유연하게 움직이는 용기를 내보세요.',
    wellnessFocus: '소화기 건강 및 위장 관리, 규칙적인 식습관, 맨발 어싱(Earth grounding).',
  },
  '己': {
    gan: '己',
    hanja: '己土',
    korean: '기토',
    element: '토',
    yinYang: '음',
    symbolName: '만물을 길러내는 비옥한 정원과 논밭(田園)',
    archetypeTitle: '세심한 양육과 배려의 정원사 (The Nurturing Earth)',
    coreKeywords: ['배려심', '현실감각', '성실함', '포용', '다정함', '실용성'],
    personalityEssence: '다양한 식물을 품어 결실을 맺게 하는 텃밭처럼, 세심하고 다정하며 현실 감각이 뛰어납니다. 사람들의 잠재력을 알아보고 잘 보살펴주는 능력이 탁월합니다.',
    spiritualMission: '주변의 소중한 인연들이 꽃을 피우고 열매를 맺도록 기름진 토양이 되어주는 것.',
    mindsetAdvice: '모든 것을 품으려다 남의 고민까지 짊어져 속병이 날 수 있습니다. 남을 챙기기 전에 내 정원의 흙부터 먼저 돌보아야 합니다.',
    wellnessFocus: '비장/위장 관리, 따뜻한 곡물차 음용, 명치 이완 마사지.',
  },
  '庚': {
    gan: '庚',
    hanja: '庚金',
    korean: '경금',
    element: '금',
    yinYang: '양',
    symbolName: '단단한 강철과 거대한 원석(鐵石)',
    archetypeTitle: '결단과 의리의 혁신가 (The Iron Resolve)',
    coreKeywords: ['결단력', '의리', '원칙주의', '추진력', '솔직함', '강인함'],
    personalityEssence: '불의 담금질을 거쳐 명검이 되는 무쇠처럼, 결단력이 빠르고 의리가 두터우며 원칙을 지킵니다. 불의를 참지 못하고 맺고 끊음이 확실한 혁신적 에너지를 가집니다.',
    spiritualMission: '낡고 썩은 것을 과감히 쳐내고, 원칙과 정의 위에 튼튼한 기둥을 세우는 것.',
    mindsetAdvice: '지나치게 칼날이 날카로우면 주변 사람과 스스로를 베일 수 있습니다. 따뜻한 유머와 감사의 온기를 곁들일 때 최고의 리더가 됩니다.',
    wellnessFocus: '호흡기 및 폐/대장 관리, 깊은 복식호흡, 건조함 예방 수분 섭취.',
  },
  '辛': {
    gan: '辛',
    hanja: '辛金',
    korean: '신금',
    element: '금',
    yinYang: '음',
    symbolName: '정교하게 빛나는 보석과 다이아몬드(珠玉)',
    archetypeTitle: '고결한 심미안과 디테일 장인 (The Radiant Jewel)',
    coreKeywords: ['심미안', '완벽주의', '예리한 감각', '고결함', '디테일', '자존감'],
    personalityEssence: '수천 번의 세공을 거쳐 빛나는 보석처럼, 감각이 매우 예리하고 섬세하며 높은 안목과 심미안을 지녔습니다. 깔끔하고 완벽을 추구하며 품격이 높습니다.',
    spiritualMission: '세상에 가장 정밀하고 순수한 아름다움과 가치를 창조하고 다듬는 것.',
    mindsetAdvice: '작은 흠집이나 불완전함에 지나치게 예민해져 스스로를 괴롭히지 마세요. 있는 그대로의 당신은 이미 완벽하게 빛나는 보석입니다.',
    wellnessFocus: '피부 및 기관지 보습, 목/쇄골 림프 순환, 스트레스 릴리즈.',
  },
  '壬': {
    gan: '壬',
    hanja: '壬水',
    korean: '임수',
    element: '수',
    yinYang: '양',
    symbolName: '거침없이 흐르는 큰 강과 푸른 바다(大海)',
    archetypeTitle: '깊은 지혜와 자유로운 통찰의 바다 (The Vast Ocean)',
    coreKeywords: ['통찰력', '자유로움', '깊은 지혜', '포용성', '유연성', '스케일'],
    personalityEssence: '모든 물줄기를 품어 안는 넓은 바다처럼, 스케일이 크고 생각과 통찰이 깊으며 지혜롭습니다. 막힘없이 유연하게 흘러가며 세상의 지식을 빠르게 흡수합니다.',
    spiritualMission: '깊은 지혜와 통찰로 세상의 경계를 허물고, 사람들에게 자유로운 영혼의 쉼을 선사하는 것.',
    mindsetAdvice: '생각이 너무 깊어져 우울의 바다에 빠지거나 속을 알 수 없는 방관자가 되지 마세요. 떠오른 영감을 구체적인 행동으로 흘려보내십시오.',
    wellnessFocus: '신장 및 혈액 순환, 전신 스트레칭, 하루 1.5L 이상 미네랄 온수 음용.',
  },
  '癸': {
    gan: '癸',
    hanja: '癸水',
    korean: '계수',
    element: '수',
    yinYang: '음',
    symbolName: '대지를 적시는 맑은 샘물과 아침 이슬(甘露)',
    archetypeTitle: '섬세한 감수성과 맑은 치유의 샘 (The Healing Dew)',
    coreKeywords: ['풍부한 감수성', '영적 교감', '다정함', '직관', '치유력', '적응력'],
    personalityEssence: '스며들듯 대지를 적셔 만물을 살리는 봄비처럼, 공감 능력이 극도로 뛰어나고 영적 직관과 감수성이 풍부합니다. 조용하지만 사람의 마음을 깊이 치유하는 힘이 있습니다.',
    spiritualMission: '메마른 영혼들을 촉촉이 적셔주고, 순수한 마음으로 세상의 상처를 치유하는 샘물이 되는 것.',
    mindsetAdvice: '남의 감정 쓰레기통이 되거나 불안의 소용돌이에 휩쓸리지 않도록 맑은 감정 경계선을 긋고 나 자신을 맑게 정화하세요.',
    wellnessFocus: '비뇨기/신장 관리, 명상과 호오포노포노 정화, 차분한 음악 감상.',
  },
};

/**
 * 십신(十神 / 육친) 계산 함수
 * 일간(Day Master)과 대상 천간/지지의 오행 및 음양 관계를 비교하여 십신을 반환합니다.
 */
export function calculateTenGod(dayGan: string, targetStemOrBranch: string, isBranch: boolean = false): {
  name: string;
  category: '비겁' | '식상' | '재성' | '관성' | '인성';
  desc: string;
} {
  const dayEl = STEM_ELEMENT[dayGan] || '토';
  const dayYinYang = STEM_YIN_YANG[dayGan] || '양';

  const targetEl = isBranch ? (BRANCH_ELEMENT[targetStemOrBranch] || '토') : (STEM_ELEMENT[targetStemOrBranch] || '토');
  const targetYinYang = isBranch ? (BRANCH_YIN_YANG[targetStemOrBranch] || '음') : (STEM_YIN_YANG[targetStemOrBranch] || '음');

  const isSameYinYang = dayYinYang === targetYinYang;

  // 오행 상생상극 관계 정의
  const GENERATES: Record<FiveElement, FiveElement> = { 목: '화', 화: '토', 토: '금', 금: '수', 수: '목' };
  const CONTROLS: Record<FiveElement, FiveElement> = { 목: '토', 토: '수', 수: '화', 화: '금', 금: '목' };

  if (dayEl === targetEl) {
    // 비겁 (비견, 겁재)
    return isSameYinYang 
      ? { name: '비견(比肩)', category: '비겁', desc: '자아와 주체성, 독립심, 동등한 동료' }
      : { name: '겁재(劫財)', category: '비겁', desc: '강한 승부욕, 추진력, 경쟁과 동반자' };
  }

  if (GENERATES[dayEl] === targetEl) {
    // 식상 (식신, 상관)
    return isSameYinYang
      ? { name: '식신(食神)', category: '식상', desc: '순수한 창의력, 연구력, 여유와 의식주' }
      : { name: '상관(傷官)', category: '식상', desc: '뛰어난 표현력, 순발력, 혁신과 언변' };
  }

  if (CONTROLS[dayEl] === targetEl) {
    // 재성 (편재, 정재)
    return isSameYinYang
      ? { name: '편재(偏財)', category: '재성', desc: '사업적 감각, 스케일 큰 기회, 융통성' }
      : { name: '정재(正財)', category: '재성', desc: '안정적 자산, 정직한 실속, 현실 감각' };
  }

  if (CONTROLS[targetEl] === dayEl) {
    // 관성 (편관, 정관)
    return isSameYinYang
      ? { name: '편관(偏官)', category: '관성', desc: '강한 카리스마, 결단력, 위기 돌파 리더십' }
      : { name: '정관(正官)', category: '관성', desc: '사회적 신뢰, 명예와 원칙, 공직과 책임' };
  }

  if (GENERATES[targetEl] === dayEl) {
    // 인성 (편인, 정인)
    return isSameYinYang
      ? { name: '편인(偏印)', category: '인성', desc: '영적 직관, 비범한 통찰, 학문과 예술성' }
      : { name: '정인(正印)', category: '인성', desc: '학문적 성취, 자비심, 지혜와 후원' };
  }

  return { name: '비견(比肩)', category: '비겁', desc: '동등한 에너지' };
}

export interface SajuPillarDetail {
  gan: string;
  zhi: string;
  ganKr: string;
  zhiKr: string;
  elGan: FiveElement;
  elZhi: FiveElement;
  yinYangGan: '양' | '음';
  yinYangZhi: '양' | '음';
  tenGodGan: { name: string; category: string; desc: string };
  tenGodZhi: { name: string; category: string; desc: string };
  animal: string;
  full: string;
}

export interface SpecialStarCombination {
  name: string;
  category: '신살' | '천간합' | '지지충' | '특수격국';
  description: string;
}

export interface SajuAnalysisResult {
  hasBirthInfo: boolean;
  name: string;
  nickname: string;
  birthdate: string;
  birthtime?: string;
  gender: string;
  koreanAge: number;
  
  // 4주 8자
  pillars: {
    year: SajuPillarDetail;
    month: SajuPillarDetail;
    day: SajuPillarDetail;
    hour?: SajuPillarDetail | null;
  };
  
  // 일간 (Day Master)
  dayMaster: DayMasterProfile;
  
  // 오행 분포
  elements: {
    counts: Record<FiveElement, number>;
    percentages: Record<FiveElement, number>;
    dominant: { element: FiveElement; count: number; name: string; advice: string };
    lacking: { element: FiveElement; count: number; name: string; remedy: string; luckyColor: string; luckyFood: string; luckyPlace: string };
    summary: string;
  };

  // 핵심 신살 및 특수 구조 (백호대살, 사고지, 무계합, 축미충 등)
  specialStructures: SpecialStarCombination[];
  
  // 웹앱 연동용 파라미터
  webAppParameters: {
    driveScore: number; // 내면 추진력 지수 (토/목 기운 기반 0~100)
    wealthAffinityScore: number; // 재물 및 실속 친화력 지수 (수/금 기운 기반 0~100)
    intuitionScore: number; // 직관 및 통찰 지수 (0~100)
    recommendedKeywords: string[];
  };

  // 용신 (Yongsin - 보약 에너지)
  yongsin: {
    element: FiveElement;
    name: string;
    meaning: string;
    actionTip: string;
  };

  // 2026 병오년(丙午年) 운세 조화
  annual2026: {
    yearName: string;
    elementFlow: string;
    theme: string;
    keyOpportunity: string;
    caution: string;
  };

  // 대운 (10년 대운)
  daeun: {
    current: string;
    next: string;
  };

  // 통합 프롬프트 헌장 및 요약 문자열
  systemPromptSummary: string;
  shortDigest: string;
}

/**
 * 24절기(입춘 등)와 만세력 절입일을 적용하여 정확한 사주 4주 8자와 심층 구조를 분석합니다.
 */
export function calculateDetailedSaju(profile?: UserProfile | null): SajuAnalysisResult | null {
  try {
    const basic = profile?.basic;
    if (!basic?.birthdate) return null;

    const dateParts = basic.birthdate.split('-').map(Number);
    if (dateParts.length < 3 || isNaN(dateParts[0]) || isNaN(dateParts[1]) || isNaN(dateParts[2])) {
      return null;
    }

  const [y, m, d] = dateParts;
  let h = -1;
  if (basic.birthtime) {
    const timeParts = basic.birthtime.split(':').map(Number);
    if (!isNaN(timeParts[0])) h = timeParts[0];
  }

  const genderStr = basic.gender === 'male' ? '남성' : '여성';
  const name = basic.name || '여행자';
  const nickname = basic.nickname || name;

  // 1. 절기 기준 년도(Saju Year) 보정 (양력 2월 4일 입춘 전 출생자는 전년도 간지 적용)
  const isBeforeIpchun = (m === 1) || (m === 2 && d < 4);
  const sajuYear = isBeforeIpchun ? y - 1 : y;

  const yi = (sajuYear - 4) % 60;
  const yGan = HEAVENLY_STEMS[(yi % 10 + 10) % 10];
  const yZhi = EARTHLY_BRANCHES[(yi % 12 + 12) % 12];

  // 2. 24절기 절입일 기준 월지(Month Branch) 산출
  // 丑월(1월 5일경~2월 3일), 寅월(2월 4일~3월 4일), 卯월(3월 5일~4월 4일), 辰월(4월 5일~5월 4일),
  // 巳월(5월 5일~6월 4일), 午월(6월 5일~7월 6일), 未월(7월 7일~8월 6일), 申월(8월 7일~9월 6일),
  // 酉월(9월 7일~10월 7일), 戌월(10월 8일~11월 6일), 亥월(11월 7일~12월 6일), 子월(12월 7일~1월 4일)
  let monthZhiIdx = 1; // 丑
  let monthOffsetFromTiger = 11; // 0 = 寅, 1 = 卯, ..., 11 = 丑

  if ((m === 1 && d >= 5) || (m === 2 && d < 4)) {
    monthZhiIdx = 1; // 丑
    monthOffsetFromTiger = 11;
  } else if ((m === 2 && d >= 4) || (m === 3 && d < 5)) {
    monthZhiIdx = 2; // 寅
    monthOffsetFromTiger = 0;
  } else if ((m === 3 && d >= 5) || (m === 4 && d < 5)) {
    monthZhiIdx = 3; // 卯
    monthOffsetFromTiger = 1;
  } else if ((m === 4 && d >= 5) || (m === 5 && d < 5)) {
    monthZhiIdx = 4; // 辰
    monthOffsetFromTiger = 2;
  } else if ((m === 5 && d >= 5) || (m === 6 && d < 5)) {
    monthZhiIdx = 5; // 巳
    monthOffsetFromTiger = 3;
  } else if ((m === 6 && d >= 5) || (m === 7 && d < 7)) {
    monthZhiIdx = 6; // 午
    monthOffsetFromTiger = 4;
  } else if ((m === 7 && d >= 7) || (m === 8 && d < 7)) {
    monthZhiIdx = 7; // 未
    monthOffsetFromTiger = 5;
  } else if ((m === 8 && d >= 7) || (m === 9 && d < 7)) {
    monthZhiIdx = 8; // 申
    monthOffsetFromTiger = 6;
  } else if ((m === 9 && d >= 7) || (m === 10 && d < 8)) {
    monthZhiIdx = 9; // 酉
    monthOffsetFromTiger = 7;
  } else if ((m === 10 && d >= 8) || (m === 11 && d < 7)) {
    monthZhiIdx = 10; // 戌
    monthOffsetFromTiger = 8;
  } else if ((m === 11 && d >= 7) || (m === 12 && d < 7)) {
    monthZhiIdx = 11; // 亥
    monthOffsetFromTiger = 9;
  } else {
    // (m === 12 && d >= 7) || (m === 1 && d < 5)
    monthZhiIdx = 0; // 子
    monthOffsetFromTiger = 10;
  }

  const mZhi = EARTHLY_BRANCHES[monthZhiIdx];

  // 월두법(月頭法): 년간에 따라 인월(寅月)의 천간 시작점 결정
  // 甲/己년 -> 丙寅(2), 乙/庚년 -> 戊寅(4), 丙/辛년 -> 庚寅(6), 丁/壬년 -> 壬寅(8), 戊/癸년 -> 甲寅(0)
  const yGanIdx = HEAVENLY_STEMS.indexOf(yGan);
  const startStemForTiger = ((yGanIdx % 5) * 2 + 2) % 10;
  const monthGanIdx = (startStemForTiger + monthOffsetFromTiger) % 10;
  const mGan = HEAVENLY_STEMS[monthGanIdx];

  // 3. 일주 (Day Pillar - 율리우스 적일 기준 계산)
  const a = Math.floor((14 - m) / 12);
  const yr = y - a;
  const mo = m + 12 * a - 2;
  const jd = d + Math.floor((153 * mo + 2) / 5) + 365 * yr + Math.floor(yr / 4) - Math.floor(yr / 100) + Math.floor(yr / 400) - 32045;
  const di = (jd + 49) % 60;
  const dGan = HEAVENLY_STEMS[(di % 10 + 10) % 10];
  const dZhi = EARTHLY_BRANCHES[(di % 12 + 12) % 12];

  // 4. 시주 (Hour Pillar - 시두법 적용)
  let hGan: string | null = null;
  let hZhi: string | null = null;
  if (h >= 0) {
    // 23:30~01:29: 子, 01:30~03:29: 丑, ..., 13:00~14:59: 未
    const hIdx = Math.floor((h + 1) / 2) % 12;
    hZhi = EARTHLY_BRANCHES[hIdx];
    const dGanIdx = HEAVENLY_STEMS.indexOf(dGan);
    const startStemForHour = ((dGanIdx % 5) * 2) % 10;
    const hGanIdx = (startStemForHour + hIdx) % 10;
    hGan = HEAVENLY_STEMS[hGanIdx];
  }

  // 5. 십신(十神) 산출
  const yGanTenGod = calculateTenGod(dGan, yGan, false);
  const yZhiTenGod = calculateTenGod(dGan, yZhi, true);

  const mGanTenGod = calculateTenGod(dGan, mGan, false);
  const mZhiTenGod = calculateTenGod(dGan, mZhi, true);

  const dGanTenGod = { name: '일간(日干/본원)', category: '본원', desc: '나 자신(Self)' };
  const dZhiTenGod = calculateTenGod(dGan, dZhi, true);

  const hGanTenGod = hGan ? calculateTenGod(dGan, hGan, false) : null;
  const hZhiTenGod = hZhi ? calculateTenGod(dGan, hZhi, true) : null;

  // 6. 4주 구성 객체 완성
  const pillars = {
    year: {
      gan: yGan, zhi: yZhi,
      ganKr: STEM_KOREAN[yGan], zhiKr: BRANCH_KOREAN[yZhi],
      elGan: STEM_ELEMENT[yGan], elZhi: BRANCH_ELEMENT[yZhi],
      yinYangGan: STEM_YIN_YANG[yGan], yinYangZhi: BRANCH_YIN_YANG[yZhi],
      tenGodGan: yGanTenGod, tenGodZhi: yZhiTenGod,
      animal: BRANCH_ANIMALS[yZhi],
      full: `${yGan}${yZhi}(${STEM_KOREAN[yGan]}${BRANCH_KOREAN[yZhi]}년, ${BRANCH_ANIMALS[yZhi]}띠)`,
    },
    month: {
      gan: mGan, zhi: mZhi,
      ganKr: STEM_KOREAN[mGan], zhiKr: BRANCH_KOREAN[mZhi],
      elGan: STEM_ELEMENT[mGan], elZhi: BRANCH_ELEMENT[mZhi],
      yinYangGan: STEM_YIN_YANG[mGan], yinYangZhi: BRANCH_YIN_YANG[mZhi],
      tenGodGan: mGanTenGod, tenGodZhi: mZhiTenGod,
      animal: BRANCH_ANIMALS[mZhi],
      full: `${mGan}${mZhi}(${STEM_KOREAN[mGan]}${BRANCH_KOREAN[mZhi]}월)`,
    },
    day: {
      gan: dGan, zhi: dZhi,
      ganKr: STEM_KOREAN[dGan], zhiKr: BRANCH_KOREAN[dZhi],
      elGan: STEM_ELEMENT[dGan], elZhi: BRANCH_ELEMENT[dZhi],
      yinYangGan: STEM_YIN_YANG[dGan], yinYangZhi: BRANCH_YIN_YANG[dZhi],
      tenGodGan: dGanTenGod, tenGodZhi: dZhiTenGod,
      animal: BRANCH_ANIMALS[dZhi],
      full: `${dGan}${dZhi}(${STEM_KOREAN[dGan]}${BRANCH_KOREAN[dZhi]}일)`,
    },
    hour: hGan && hZhi && hGanTenGod && hZhiTenGod ? {
      gan: hGan, zhi: hZhi,
      ganKr: STEM_KOREAN[hGan], zhiKr: BRANCH_KOREAN[hZhi],
      elGan: STEM_ELEMENT[hGan], elZhi: BRANCH_ELEMENT[hZhi],
      yinYangGan: STEM_YIN_YANG[hGan], yinYangZhi: BRANCH_YIN_YANG[hZhi],
      tenGodGan: hGanTenGod, tenGodZhi: hZhiTenGod,
      animal: BRANCH_ANIMALS[hZhi],
      full: `${hGan}${hZhi}(${STEM_KOREAN[hGan]}${BRANCH_KOREAN[hZhi]}시)`,
    } : null,
  };

  // 7. 오행 카운트 (Five Elements count)
  const counts: Record<FiveElement, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  const allStems = [yGan, mGan, dGan, ...(hGan ? [hGan] : [])];
  const allBranches = [yZhi, mZhi, dZhi, ...(hZhi ? [hZhi] : [])];

  allStems.forEach(stem => {
    const el = STEM_ELEMENT[stem];
    if (el) counts[el] += 1;
  });

  allBranches.forEach(branch => {
    const el = BRANCH_ELEMENT[branch];
    if (el) counts[el] += 1;
  });

  const totalElements = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  const percentages: Record<FiveElement, number> = {
    목: Math.round((counts.목 / totalElements) * 100),
    화: Math.round((counts.화 / totalElements) * 100),
    토: Math.round((counts.토 / totalElements) * 100),
    금: Math.round((counts.금 / totalElements) * 100),
    수: Math.round((counts.수 / totalElements) * 100),
  };

  const sortedElements = (Object.entries(counts) as [FiveElement, number][]).sort((a, b) => b[1] - a[1]);
  const dominantEl = sortedElements[0][0];
  const lackingEl = sortedElements[sortedElements.length - 1][0];

  const dominantDetail = ELEMENT_DETAILS[dominantEl];
  const lackingDetail = ELEMENT_DETAILS[lackingEl];

  const elementsSummary = counts[dominantEl] >= 3
    ? `중심 기운인 ${dominantDetail.name}가 묵직하게 기틀을 잡고 있으며, 다른 오행들이 순환하며 조화를 이루는 구조입니다.`
    : `오행이 비교적 골고루 분포되어 유연하고 다채로운 잠재력을 발휘하는 안정적인 구조입니다.`;

  // 8. 일간 본원 아키타입
  const dayMaster = DAY_MASTER_ARCHETYPES[dGan] || DAY_MASTER_ARCHETYPES['甲'];

  // 9. 핵심 신살 및 특수 구조 정밀 분석
  const specialStructures: SpecialStarCombination[] = [];
  const dayPillarStr = `${dGan}${dZhi}`;

  // 백호대살
  const BAEKHO_PILLARS = ['戊辰', '丁丑', '丙戌', '乙未', '甲辰', '壬戌', '癸丑'];
  if (BAEKHO_PILLARS.includes(dayPillarStr)) {
    specialStructures.push({
      name: `${dayPillarStr} 일주 & 백호대살(白虎大殺)`,
      category: '신살',
      description: '황룡의 기상으로 온화함 뒤에 강한 뚝심과 위기 돌파력을 지님.',
    });
  }

  // 사고지(四庫之 - 辰, 戌, 丑, 未) 카운트
  const sagoBranches = ['辰', '戌', '丑', '未'];
  const userSagoCount = allBranches.filter(b => sagoBranches.includes(b)).length;
  if (userSagoCount >= 2) {
    const presentSago = Array.from(new Set(allBranches.filter(b => sagoBranches.includes(b)))).map(b => BRANCH_KOREAN[b]).join('·');
    specialStructures.push({
      name: `${presentSago} 사고지(四庫之) ${userSagoCount}위 보유`,
      category: '특수격국',
      description: '화개살 중첩으로 통찰력, 영성/학문, 데이터/기술 축적 감각 탁월.',
    });
  }

  // 천간합(天干合) 분석 (戊-癸 합, 甲-己 합, 乙-庚 합, 丙-辛 합, 丁-壬 합)
  const stemsSet = new Set(allStems);
  if (stemsSet.has('戊') && stemsSet.has('癸')) {
    specialStructures.push({
      name: '무계합(戊癸合 火)',
      category: '천간합',
      description: '나와 재물이 유기적으로 결합하여 실속과 현실적 자산 증식력 우수.',
    });
  }
  if (stemsSet.has('甲') && stemsSet.has('己')) {
    specialStructures.push({
      name: '갑기합(甲己合 土)',
      category: '천간합',
      description: '중정지합(中正之合)으로 신의가 두텁고 사람들에게 깊은 신뢰를 얻음.',
    });
  }
  if (stemsSet.has('乙') && stemsSet.has('庚')) {
    specialStructures.push({
      name: '을경합(乙庚合 金)',
      category: '천간합',
      description: '인의지합(仁義之合)으로 결단력과 유연한 친화력이 완벽한 균형을 이룸.',
    });
  }
  if (stemsSet.has('丙') && stemsSet.has('辛')) {
    specialStructures.push({
      name: '병신합(丙辛合 水)',
      category: '천간합',
      description: '빛과 보석의 만남으로 예리한 심미안과 높은 지혜를 발휘.',
    });
  }
  if (stemsSet.has('丁') && stemsSet.has('壬')) {
    specialStructures.push({
      name: '정임합(丁壬合 木)',
      category: '천간합',
      description: '목화통명의 영감과 깊은 감수성, 인간적인 매력이 풍부함.',
    });
  }

  // 지지충(地支沖) 분석 (丑-未 충, 子-午 충, 卯-酉 충, 寅-申 충, 巳-亥 충, 辰-戌 충)
  const branchList = allBranches;
  if (branchList.includes('丑') && branchList.includes('未')) {
    specialStructures.push({
      name: '축미충(丑未沖)',
      category: '지지충',
      description: '현실적 이성과 직관적 열정 간의 지속적인 상호작용으로 전문성 심화.',
    });
  }
  if (branchList.includes('子') && branchList.includes('午')) {
    specialStructures.push({
      name: '자오충(子午沖)',
      category: '지지충',
      description: '수화상쟁의 다이내믹한 에너지로 강력한 영감과 추진력을 분출.',
    });
  }
  if (branchList.includes('卯') && branchList.includes('酉')) {
    specialStructures.push({
      name: '묘유충(卯酉沖)',
      category: '지지충',
      description: '섬세한 감각과 결단력의 충돌을 창작과 정밀한 기술력으로 승화.',
    });
  }
  if (branchList.includes('辰') && branchList.includes('戌')) {
    specialStructures.push({
      name: '진술충(辰戌沖)',
      category: '지지충',
      description: '광활한 대지의 지각 변동처럼 새로운 판을 짜고 혁신을 주도하는 힘.',
    });
  }

  // 10. 웹앱 연동용 파라미터 산출
  // 토 기운 & 비겁/인성 비중 -> 내면 추진력 지수 (0~100)
  const earthCount = counts.토;
  const driveScore = Math.min(95, Math.max(60, 65 + (earthCount * 6) + (counts.목 * 3)));

  // 수 기운 & 재성 비중 -> 재물 및 실속 친화력 (0~100)
  const waterCount = counts.수;
  const metalCount = counts.금;
  const wealthAffinityScore = Math.min(95, Math.max(55, 60 + (waterCount * 7) + (metalCount * 4)));

  // 직관/영성 지수 (사고지 및 화개살 반영)
  const intuitionScore = Math.min(98, Math.max(65, 70 + (userSagoCount * 8)));

  const recommendedKeywords = [
    '시스템 아키텍처',
    '지식 자산화',
    '직관적 분석',
    '전문성 구축',
    `${dayMaster.element} 기운 조율`,
  ];

  // 11. 용신 (보약 에너지 산출)
  const yongsinEl = lackingEl;
  const yongsinDetail = ELEMENT_DETAILS[yongsinEl];
  const yongsin = {
    element: yongsinEl,
    name: yongsinDetail.name,
    meaning: `사주 원국에서 가장 갈증을 느끼는 [${yongsinDetail.hanja}(${yongsinEl})] 기운으로, 심신의 긴장을 풀고 균형을 되찾아주는 수호 에너지`,
    actionTip: `행운의 색: ${yongsinDetail.colorName} | 추천 음식: ${yongsinDetail.remedyFood} | 추천 활동: ${yongsinDetail.remedyActivity}`,
  };

  // 12. 2026 병오년(丙午年) 세운 분석
  const dmEl = dayMaster.element;
  let annualTheme = '';
  let annualOpp = '';
  let annualCaution = '';

  if (dmEl === '목') {
    annualTheme = '식상(食傷) 만개의 해 — 창작과 표현의 꽃이 피어나는 도약기';
    annualOpp = '새로운 아이디어를 세상에 발표하고, 프로젝트나 예술적 작업을 과감히 추진하기에 최적입니다.';
    annualCaution = '의욕이 앞서 에너지가 과열될 수 있으니 충분한 수분 섭취와 휴식으로 내실을 다지세요.';
  } else if (dmEl === '화') {
    annualTheme = '비겁(比劫) 공명의 해 — 강력한 주체성과 동료와의 연대';
    annualOpp = '자신감이 최고조에 달하며, 마음이 맞는 소중한 동반자나 팀원들과 큰 시너지를 낼 수 있습니다.';
    annualCaution = '고집이나 성급한 감정 표출을 경계하고, 타인의 입장을 한 번 더 헤아리는 지혜가 필요합니다.';
  } else if (dmEl === '토') {
    annualTheme = '인성(印星) 조력의 해 — 든든한 후원과 학문/자격의 결실';
    annualOpp = '귀인의 도움을 받거나, 지식 습득, 자격 취득, 계약 등에서 안정적인 결실을 맺습니다.';
    annualCaution = '생각만 많아져 실행을 미루지 말고, 현실적인 한 걸음을 차근차근 내딛으세요.';
  } else if (dmEl === '금') {
    annualTheme = '관성(官星) 제련의 해 — 담금질을 거쳐 명품 보석으로 거듭나는 성장';
    annualOpp = '사회적 명예와 책임감이 커지며, 어려움을 돌파하여 커리어의 새로운 전기를 맞이합니다.';
    annualCaution = '압박감이나 과도한 책임감으로 인한 스트레스를 주의하고 세도나 방하착 명상을 적극 활용하세요.';
  } else {
    annualTheme = '재성(財星) 활약의 해 — 현실적 성과와 재물, 기회의 확장';
    annualOpp = '재정적 기회가 열리고 그동안 준비했던 일들이 현실적인 이익과 가치로 환산됩니다.';
    annualCaution = '과도한 지출이나 충동적인 투자를 삼가고 알짜배기 실속을 챙기는 차분함을 유지하세요.';
  }

  const annual2026 = {
    yearName: '2026 병오년(丙午年 - 붉은 말의 해)',
    elementFlow: `강렬한 순수 화(火)의 불꽃 에너지와 ${name}님의 ${dayMaster.symbolName}의 상호작용`,
    theme: annualTheme,
    keyOpportunity: annualOpp,
    caution: annualCaution,
  };

  // 13. 대운 (Daeun)
  const isYangYear = HEAVENLY_STEMS.indexOf(yGan) % 2 === 0;
  const isFwd = (isYangYear && genderStr === '남성') || (!isYangYear && genderStr === '여성');
  const mGanIdx = HEAVENLY_STEMS.indexOf(mGan);
  const mZhiIdx = EARTHLY_BRANCHES.indexOf(mZhi);
  const nowYear = new Date().getFullYear();
  const koreanAge = nowYear - y + 1;

  const daeuns = Array.from({ length: 8 }, (_, i) => i + 1).map(i => ({
    ganZhi: HEAVENLY_STEMS[((mGanIdx + (isFwd ? i : -i)) % 10 + 10) % 10] + EARTHLY_BRANCHES[((mZhiIdx + (isFwd ? i : -i)) % 12 + 12) % 12],
    startAge: i * 10 - 9,
    startYear: y + i * 10 - 9,
  }));
  const curD = daeuns.find(d => d.startYear <= nowYear && d.startYear + 10 > nowYear);
  const nextD = daeuns.find(d => d.startYear > nowYear);

  const daeunInfo = {
    current: curD ? `${curD.ganZhi}대운 (${curD.startAge}세 ~ ${curD.startAge + 9}세)` : '대운 진입기',
    next: nextD ? `${nextD.ganZhi}대운 (${nextD.startAge}세~)` : '미래 대운',
  };

  // 14. AI 시스템 프롬프트 헌장
  const specialStrText = specialStructures.map(s => `• ${s.name}: ${s.description}`).join('\n');

  const systemPromptSummary = `
[사주명리학(四柱命理) 정밀 본원 에너지 헌장]
- 사주 4주 8자: 년주(${pillars.year.full} - ${pillars.year.tenGodGan.name}/${pillars.year.tenGodZhi.name}) | 월주(${pillars.month.full} - ${pillars.month.tenGodGan.name}/${pillars.month.tenGodZhi.name}) | 일주(${pillars.day.full} - ${pillars.day.tenGodGan.name}/${pillars.day.tenGodZhi.name})${pillars.hour ? ` | 시주(${pillars.hour.full} - ${pillars.hour.tenGodGan.name}/${pillars.hour.tenGodZhi.name})` : ' | 시주(생시 미입력)'}
- 일간(Day Master) 본원: ${dayMaster.hanja}(${dayMaster.korean}) - ${dayMaster.symbolName}
  * 영적 아키타입: ${dayMaster.archetypeTitle}
  * 핵심 기질 키워드: ${dayMaster.coreKeywords.join(', ')}
  * 본원 성향: ${dayMaster.personalityEssence}
- 오행 구성: 토(${counts.토}개/40%), 목(${counts.목}개), 화(${counts.화}개), 금(${counts.금}개), 수(${counts.수}개) — ${elementsSummary}
- 핵심 신살 및 특수 구조:
${specialStrText || '• 안정적인 오행 순환 구조'}
- 웹앱 연동 파라미터: 내면 추진력(${driveScore}/100), 재물/실속 친화력(${wealthAffinityScore}/100), 추천 테마(${recommendedKeywords.slice(0, 3).join(', ')})
- 2026 병오년(丙午年) 세운: ${annual2026.theme}
- 용신 보약 에너지: ${lackingDetail.name} (추천 컬러: ${lackingDetail.colorName}, 음식: ${lackingDetail.remedyFood})
[사주 기반 AI 페르소나 지침]:
사용자의 일간 본원(${dayMaster.symbolName})과 특수 격국(${specialStructures.map(s=>s.name).join(', ')})을 완벽히 인지하여, 타고난 장점과 추진력은 적극 지지하고 결핍된 기운은 편안하게 채워주는 깊이 있는 상담을 제공하세요.
`.trim();

  const shortDigest = `${dayMaster.hanja} ${dayMaster.symbolName} · 토(${counts.토})목(${counts.목})화(${counts.화})금(${counts.금})수(${counts.수}) · ${specialStructures[0]?.name || ''}`;

  return {
    hasBirthInfo: true,
    name,
    nickname,
    birthdate: basic.birthdate,
    birthtime: basic.birthtime,
    gender: genderStr,
    koreanAge,
    pillars,
    dayMaster,
    elements: {
      counts,
      percentages,
      dominant: {
        element: dominantEl,
        count: counts[dominantEl],
        name: dominantDetail.name,
        advice: `${dominantDetail.name}의 기운이 강하여 ${dominantDetail.emotionNegative} 경향이 나타날 수 있으니 이완과 순환이 중요합니다.`,
      },
      lacking: {
        element: lackingEl,
        count: counts[lackingEl],
        name: lackingDetail.name,
        remedy: `${lackingDetail.name}의 기운이 부족하여 보충이 필요합니다.`,
        luckyColor: lackingDetail.colorName,
        luckyFood: lackingDetail.remedyFood,
        luckyPlace: lackingDetail.remedyActivity,
      },
      summary: elementsSummary,
    },
    specialStructures,
    webAppParameters: {
      driveScore,
      wealthAffinityScore,
      intuitionScore,
      recommendedKeywords,
    },
    yongsin,
    annual2026,
    daeun: daeunInfo,
    systemPromptSummary,
    shortDigest,
  };
  } catch (err) {
    console.warn("calculateDetailedSaju error:", err);
    return null;
  }
}

export interface DailySajuReport {
  dateStr: string;
  year: number;
  month: number;
  day: number;
  dayOfWeek: string;
  dayPillar: {
    gan: string;
    zhi: string;
    ganKr: string;
    zhiKr: string;
    full: string;
    animal: string;
    elGan: FiveElement;
    elZhi: FiveElement;
  };
  tenGodGan: {
    name: string;
    category: '비겁' | '식상' | '재성' | '관성' | '인성';
    desc: string;
  };
  tenGodZhi: {
    name: string;
    category: '비겁' | '식상' | '재성' | '관성' | '인성';
    desc: string;
  };
  todayTheme: string;
  todayAdvice: string;
  harmonySummary: string;
  remedy: {
    luckyColor: string;
    luckyFood: string;
    luckyActivity: string;
    actionTip: string;
  };
  speechText: string;
}

/**
 * 당일의 천문 일진(日辰)과 내담자의 사주 원국(일간 및 오행)을 비교하여
 * '오늘의 사주 일진 리포트' 및 음성 낭독용 TTS 텍스트를 실시간 계산합니다.
 */
export function generateDailySajuReport(saju: SajuAnalysisResult, targetDate: Date = new Date()): DailySajuReport {
  const y = targetDate.getFullYear();
  const m = targetDate.getMonth() + 1;
  const d = targetDate.getDate();
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const dayOfWeek = days[targetDate.getDay()];
  const dateStr = `${y}년 ${m}월 ${d}일 (${dayOfWeek})`;

  // 율리우스 적일 기준 당일 일주(일진) 산출
  const a = Math.floor((14 - m) / 12);
  const yr = y - a;
  const mo = m + 12 * a - 2;
  const jd = d + Math.floor((153 * mo + 2) / 5) + 365 * yr + Math.floor(yr / 4) - Math.floor(yr / 100) + Math.floor(yr / 400) - 32045;
  const di = (jd + 49) % 60;
  const todayGan = HEAVENLY_STEMS[(di % 10 + 10) % 10];
  const todayZhi = EARTHLY_BRANCHES[(di % 12 + 12) % 12];
  const todayGanKr = STEM_KOREAN[todayGan];
  const todayZhiKr = BRANCH_KOREAN[todayZhi];
  const todayAnimal = BRANCH_ANIMALS[todayZhi];
  const todayElGan = STEM_ELEMENT[todayGan];
  const todayElZhi = BRANCH_ELEMENT[todayZhi];

  const tenGodGan = calculateTenGod(saju.dayMaster.gan, todayGan, false);
  const tenGodZhi = calculateTenGod(saju.dayMaster.gan, todayZhi, true);

  // 십신 카테고리별 테마 및 조언
  let theme = '';
  let categoryAdvice = '';
  switch (tenGodGan.category) {
    case '식상':
      theme = `${tenGodGan.name} — 창의적 표현과 감각의 활력`;
      categoryAdvice = `창의력과 자기표현이 자연스럽게 빛나는 날입니다. 마음에 담아두었던 아이디어를 솔직하게 표현하거나 새로운 시도를 해보세요. 오감을 깨우는 활동이 행운을 부릅니다.`;
      break;
    case '재성':
      theme = `${tenGodGan.name} — 현실적 성과와 실속의 결실`;
      categoryAdvice = `노력해온 일에서 구체적인 성과와 기회가 열리는 날입니다. 일의 우선순위를 명확히 세우고 꼼꼼하게 실속을 챙기시면 좋은 결실과 재물 흐름이 따릅니다.`;
      break;
    case '관성':
      theme = `${tenGodGan.name} — 사회적 신뢰와 명예로운 도약`;
      categoryAdvice = `원칙과 책임감을 바탕으로 자신의 신뢰도를 높이기 좋은 날입니다. 당당하고 바른 태도로 사람들을 대하면 주변의 인정과 협력을 얻게 됩니다.`;
      break;
    case '인성':
      theme = `${tenGodGan.name} — 지혜로운 성찰과 귀인의 조력`;
      categoryAdvice = `마음을 가라앉히고 배움과 사색에 몰입하기에 가장 좋은 날입니다. 귀인의 따뜻한 도움이나 귀중한 조언을 얻을 수 있으니 열린 마음으로 경청해 보세요.`;
      break;
    case '비겁':
    default:
      theme = `${tenGodGan.name} — 당당한 주체성과 활발한 추진력`;
      categoryAdvice = `내면의 자신감과 주체적인 에너지가 가득 차오르는 날입니다. 남의 눈치를 보지 않고 소신껏 내 길을 걸어가거나, 뜻을 같이하는 동료와 연대하면 큰 힘이 됩니다.`;
      break;
  }

  // 사용자 오행과의 상호작용
  let harmonySummary = '';
  if (todayElGan === saju.elements.lacking.element) {
    harmonySummary = `특히 오늘 하늘의 기운은 ${saju.name}님에게 부족한 ${saju.elements.lacking.name} 기운을 가득 보충해 주어, 막힌 흐름이 시원하게 풀리는 보약 같은 날입니다.`;
  } else if (todayElGan === saju.elements.dominant.element) {
    harmonySummary = `오늘 하늘의 기운은 ${saju.name}님의 중심 기운인 ${saju.elements.dominant.name} 에너지를 강하게 자극하므로, 조급함을 내려놓고 깊은 호흡으로 평정심을 유지하는 것이 지혜입니다.`;
  } else {
    harmonySummary = `오늘의 ${todayElGan} 기운은 ${saju.name}님의 본원인 ${saju.dayMaster.symbolName}과 조화롭게 어우러져 편안하고 안정된 리듬을 선사합니다.`;
  }

  const remedy = {
    luckyColor: saju.elements.lacking.luckyColor,
    luckyFood: saju.elements.lacking.luckyFood,
    luckyActivity: saju.elements.lacking.luckyPlace,
    actionTip: saju.yongsin.actionTip,
  };

  // 음성 리포트 대본 생성 (자연스러운 한국어 구어체)
  const speechText = [
    `안녕하세요, ${saju.name}님! ${m}월 ${d}일 오늘의 사주 만세력 리포트를 들려드릴게요.`,
    `오늘의 일진은 ${todayGanKr}${todayZhiKr}일, ${todayAnimal}의 날이며 ${todayElGan}의 기운이 흐르는 날입니다.`,
    `${saju.name}님의 타고난 사주 본원은 ${saju.dayMaster.symbolName}인 ${saju.dayMaster.korean}입니다.`,
    `오늘 찾아온 ${tenGodGan.name}의 기운은 ${saju.name}님에게 ${categoryAdvice}`,
    harmonySummary,
    `오늘 하루 개운을 돕는 추천 행운 컬러는 ${remedy.luckyColor}이며, 추천 음식은 ${remedy.luckyFood}입니다.`,
    `${saju.dayMaster.mindsetAdvice}`,
    `오늘 하루도 ${saju.name}님의 고유한 빛으로 가장 당당하고 행복한 하루를 보내시길 진심으로 축복합니다.`,
  ].filter(Boolean).join(' ');

  return {
    dateStr,
    year: y,
    month: m,
    day: d,
    dayOfWeek,
    dayPillar: {
      gan: todayGan,
      zhi: todayZhi,
      ganKr: todayGanKr,
      zhiKr: todayZhiKr,
      full: `${todayGan}${todayZhi} (${todayGanKr}${todayZhiKr}일, ${todayAnimal}의 날)`,
      animal: todayAnimal,
      elGan: todayElGan,
      elZhi: todayElZhi,
    },
    tenGodGan,
    tenGodZhi,
    todayTheme: theme,
    todayAdvice: categoryAdvice,
    harmonySummary,
    remedy,
    speechText,
  };
}
