/**
 * Orb Rituals: 크리스탈 오브 전용 4대 특수 신탁 의식 시스템
 * 1. 양자 결단 (Quantum Decision: Yes / No / Wait / Leap)
 * 2. 소울 오라 & 주파수 공명 (Touch Aura Resonance)
 * 3. 고대 룬 에테르 캐스팅 (Elder Futhark Rune Casting)
 * 4. 보이드 & 네뷸라 (고민 소멸 & 소원 방출)
 */

// ==========================================
// 1. 양자 결단 (Quantum Decision)
// ==========================================
export type QuantumVerdict = 'YES' | 'NO' | 'WAIT' | 'LEAP';

export interface QuantumDecisionResult {
  verdict: QuantumVerdict;
  symbol: string;
  title: string;
  subtitle: string;
  energyScore: number; // 0 ~ 100%
  color: string;
  glow: string;
  oracleMessage: string;
  cosmicGuidance: string;
}

export const QUANTUM_VERDICTS: Record<QuantumVerdict, {
  symbol: string;
  title: string;
  subtitle: string;
  color: string;
  glow: string;
  messages: { oracle: string; guidance: string }[];
}> = {
  YES: {
    symbol: '⚡',
    title: '강력한 추진 (YES)',
    subtitle: '에너지의 흐름이 열렸습니다. 망설이지 말고 실행하세요.',
    color: '#10b981',
    glow: 'rgba(16, 185, 129, 0.8)',
    messages: [
      {
        oracle: '모든 조건이 이 순간을 향해 수렴하고 있습니다.',
        guidance: '지금 첫 발걸음을 떼면 우주가 뒤이어 길을 놓아줍니다.'
      },
      {
        oracle: '당신의 직관이 가리키는 방향이 곧 가장 빠른 지름길입니다.',
        guidance: '두려움에 주저하지 말고 가슴이 뛰는 선택을 믿으세요.'
      },
      {
        oracle: '주변의 저항은 당신의 도약을 시험하는 바람일 뿐입니다.',
        guidance: '망설임을 끝내고 확실한 행동으로 추진력을 확보하세요.'
      }
    ]
  },
  NO: {
    symbol: '🛑',
    title: '멈춤과 보존 (NO)',
    subtitle: '지금은 나아갈 때가 아닙니다. 에너지를 지키고 철수하세요.',
    color: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.8)',
    messages: [
      {
        oracle: '흐름이 역방향으로 흐르고 있습니다. 무리한 돌파는 소모를 낳습니다.',
        guidance: '지금은 고집하기보다 물러서서 내면의 에너지를 지킬 때입니다.'
      },
      {
        oracle: '숨겨진 함정과 예상치 못한 변수가 도사리고 있습니다.',
        guidance: '승낙보다 지혜로운 거절이 당신을 더 큰 곤경에서 구합니다.'
      },
      {
        oracle: '당신의 본질에 맞지 않는 억지스러운 선택일 수 있습니다.',
        guidance: '과감하게 손을 털고 더 순수한 기회를 기다리세요.'
      }
    ]
  },
  WAIT: {
    symbol: '⏳',
    title: '관망과 무르익음 (WAIT)',
    subtitle: '결정을 유보하세요. 물결이 가라앉아야 바닥이 선명히 보입니다.',
    color: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.8)',
    messages: [
      {
        oracle: '안개가 아직 걷히지 않았습니다. 서두르면 방향을 잃습니다.',
        guidance: '3일 혹은 다음 보름달까지 상황의 추이를 고요히 지켜보세요.'
      },
      {
        oracle: '상대방이나 외부 환경의 핵심 정보가 아직 도착하지 않았습니다.',
        guidance: '행동하기보다 듣고 관찰하며 숨을 고르는 것이 최선입니다.'
      },
      {
        oracle: '씨앗이 땅속에서 발아하는 데는 보이지 않는 시간이 필요합니다.',
        guidance: '조급함을 내려놓고 일상의 호흡에 집중하세요.'
      }
    ]
  },
  LEAP: {
    symbol: '🌌',
    title: '차원 도약 (LEAP)',
    subtitle: '기존의 룰을 깨뜨리세요! 생각지도 못한 파격적 도약이 필요합니다.',
    color: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.9)',
    messages: [
      {
        oracle: '작은 타협 대신 판 자체를 뒤흔드는 대담한 결단이 요구됩니다.',
        guidance: '이전 방식에 얽매이지 말고 전혀 새로운 패러다임을 선택하세요.'
      },
      {
        oracle: '안전지대를 벗어날 때 당신의 잠재의식 속에 잠든 거인이 깨어납니다.',
        guidance: '모두가 예상하지 못한 과감한 한 수를 지금 던지세요.'
      },
      {
        oracle: '낡은 껍질을 깨고 날아오르는 비상의 시공간이 열렸습니다.',
        guidance: '과거의 나를 뒤로하고 새로운 정체성으로 도약하십시오.'
      }
    ]
  }
};

export function calculateQuantumDecision(query: string = ''): QuantumDecisionResult {
  const hash = query.trim().length > 0
    ? query.split('').reduce((acc, c) => acc + c.charCodeAt(0) * 17, 0) + Date.now()
    : Date.now();

  const rand = Math.random();
  let verdict: QuantumVerdict = 'YES';
  if (rand < 0.35) verdict = 'YES';
  else if (rand < 0.60) verdict = 'NO';
  else if (rand < 0.82) verdict = 'WAIT';
  else verdict = 'LEAP';

  const data = QUANTUM_VERDICTS[verdict];
  const msgIdx = Math.abs(hash) % data.messages.length;
  const picked = data.messages[msgIdx];
  const energyScore = Math.floor(75 + Math.random() * 24); // 75 ~ 98%

  return {
    verdict,
    symbol: data.symbol,
    title: data.title,
    subtitle: data.subtitle,
    energyScore,
    color: data.color,
    glow: data.glow,
    oracleMessage: picked.oracle,
    cosmicGuidance: picked.guidance,
  };
}

// ==========================================
// 2. 소울 오라 & 주파수 공명 (Touch Aura Resonance)
// ==========================================
export interface SoulAuraProfile {
  id: string;
  name: string;
  tagline: string;
  element: '목(木)' | '화(火)' | '토(土)' | '금(金)' | '수(水)' | '에테르(靈)';
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  solfeggioHz: number;
  solfeggioName: string;
  chakra: string;
  energyLevel: number; // 70 ~ 100%
  description: string;
  healingAffirmation: string;
  luckyGuide: string;
}

export const SOUL_AURAS: SoulAuraProfile[] = [
  {
    id: 'indigo_violet',
    name: '심해의 코발트 & 바이올렛',
    tagline: '직관과 영적 통찰이 극대화되는 날',
    element: '에테르(靈)',
    primaryColor: '#8b5cf6',
    secondaryColor: '#38bdf8',
    glowColor: 'rgba(139, 92, 246, 0.85)',
    solfeggioHz: 852,
    solfeggioName: '852Hz (영적 직관과 순수한 통찰)',
    chakra: '제3의 눈 (아즈나)',
    energyLevel: 94,
    description: '눈에 보이는 현상 이면의 본질을 꿰뚫어 보는 지혜가 깨어납니다. 직관을 믿고 판단하세요.',
    healingAffirmation: '나는 내면의 깊은 지혜와 언제나 연결되어 있으며, 모든 길을 선명히 봅니다.',
    luckyGuide: '보라색 소품, 명상, 저녁 밤하늘 바라보기'
  },
  {
    id: 'emerald_jade',
    name: '생명의 에메랄드 옥빛',
    tagline: '치유와 자비, 회복의 부드러운 온기',
    element: '목(木)',
    primaryColor: '#10b981',
    secondaryColor: '#34d399',
    glowColor: 'rgba(16, 185, 129, 0.85)',
    solfeggioHz: 528,
    solfeggioName: '528Hz (기적의 주파수 & 세포 치유)',
    chakra: '심장 (아나하타)',
    energyLevel: 91,
    description: '지친 심신이 편안히 이완되고 관계의 상처가 눈 녹듯 정화됩니다. 자신을 너그럽게 안아주세요.',
    healingAffirmation: '나는 있는 그대로 온전하며, 무한한 사랑과 생명력으로 숨 쉽니다.',
    luckyGuide: '초록 식물과의 교감, 따뜻한 허브티, 가슴 호흡'
  },
  {
    id: 'solar_amber',
    name: '태양의 황금 앰버',
    tagline: '확신과 결단, 번영을 부르는 황금빛 불꽃',
    element: '토(土)',
    primaryColor: '#f59e0b',
    secondaryColor: '#fbbf24',
    glowColor: 'rgba(245, 158, 11, 0.85)',
    solfeggioHz: 639,
    solfeggioName: '639Hz (조화로운 관계와 소통, 풍요)',
    chakra: '태양신경총 (마니푸라)',
    energyLevel: 96,
    description: '자신감이 솟구치고 내가 원하는 것을 세상에 당당히 드러낼 수 있는 강력한 중심의 힘입니다.',
    healingAffirmation: '내 안에 원하는 것을 창조할 힘과 자원이 이미 충만합니다.',
    luckyGuide: '아침 햇살 쬐기, 금빛 액센트, 당당한 보행'
  },
  {
    id: 'celestial_cyan',
    name: '천상의 세룰리안 블루',
    tagline: '진실된 표현과 창조적 영감의 파동',
    element: '수(水)',
    primaryColor: '#06b6d4',
    secondaryColor: '#38bdf8',
    glowColor: 'rgba(6, 182, 212, 0.85)',
    solfeggioHz: 741,
    solfeggioName: '741Hz (독소 정화와 진실의 표현)',
    chakra: '목 (비슈다)',
    energyLevel: 89,
    description: '가슴속 묵혀둔 말들이 명료하고 우아한 언어로 정돈됩니다. 솔직한 대화가 기적을 엽니다.',
    healingAffirmation: '나의 목소리는 소중하며, 나는 내 진실을 평화롭게 표현합니다.',
    luckyGuide: '맑은 물 한 잔, 노래 흥얼거리기, 푸른색 노트'
  },
  {
    id: 'ruby_phoenix',
    name: '불사조의 루비 크림슨',
    tagline: '열정과 생명력, 강인한 대지 접지',
    element: '화(火)',
    primaryColor: '#f43f5e',
    secondaryColor: '#fb7185',
    glowColor: 'rgba(244, 63, 94, 0.85)',
    solfeggioHz: 396,
    solfeggioName: '396Hz (두려움 해방과 죄책감 정화)',
    chakra: '뿌리 (물라다라)',
    energyLevel: 97,
    description: '정체되었던 에너지가 활활 타오르며 장애물을 돌파할 역동적인 생명력이 솟아오릅니다.',
    healingAffirmation: '나는 안전하며, 대지의 굳건한 힘이 언제나 나를 떠받치고 있습니다.',
    luckyGuide: '맨발 걷기, 가벼운 스트레칭, 붉은색 음식'
  }
];

export function scanSoulAura(): SoulAuraProfile {
  const hour = new Date().getHours();
  const day = new Date().getDay();
  const seed = (hour * 7 + day * 13 + Math.floor(Math.random() * 5)) % SOUL_AURAS.length;
  return SOUL_AURAS[seed];
}

// ==========================================
// 3. 고대 룬 에테르 캐스팅 (Elder Futhark)
// ==========================================
export interface ElderRune {
  symbol: string;
  name: string;
  koreanName: string;
  meaning: string;
  element: string;
  oracleMessage: string;
  keywords: string[];
  color: string;
}

export const ELDER_FUTHARK_RUNES: ElderRune[] = [
  { symbol: 'ᚠ', name: 'Fehu', koreanName: '페후', meaning: '풍요와 번영, 새로운 시작', element: '불/대지', oracleMessage: '노력의 결실이 손에 쥐어지는 순간입니다. 받은 축복을 아낌없이 순환시키세요.', keywords: ['풍요', '재물', '시작', '결실'], color: '#f59e0b' },
  { symbol: 'ᚢ', name: 'Uruz', koreanName: '우루즈', meaning: '야성의 활력, 강인한 건강', element: '대지', oracleMessage: '야생 황소의 꺾이지 않는 생명력이 당신을 감쌉니다. 체력과 의지를 회복하세요.', keywords: ['생명력', '야성', '인내', '돌파'], color: '#10b981' },
  { symbol: 'ᚦ', name: 'Thurisaz', koreanName: '수리사즈', meaning: '거인의 망치, 보호와 관문', element: '불', oracleMessage: '성급한 행동을 멈추고 문턱에 서서 상황을 점검하세요. 당신을 지키는 방패가 있습니다.', keywords: ['보호', '관문', '경계', '망치'], color: '#ef4444' },
  { symbol: 'ᚨ', name: 'Ansuz', koreanName: '안수즈', meaning: '오딘의 신성한 영감과 소통', element: '바람', oracleMessage: '지혜로운 전갈이나 영적인 조언이 찾아옵니다. 귀를 열고 경청하세요.', keywords: ['영감', '메시지', '지혜', '소통'], color: '#3b82f6' },
  { symbol: 'ᚱ', name: 'Raidho', koreanName: '라이도', meaning: '여행과 이동, 올바른 궤도', element: '바람', oracleMessage: '물리적이든 정신적이든 여정을 떠날 시간입니다. 우주의 리듬에 발을 맞추세요.', keywords: ['여정', '이동', '리듬', '질서'], color: '#6366f1' },
  { symbol: 'ᚲ', name: 'Kenaz', koreanName: '케나즈', meaning: '타오르는 횃불, 지식과 통찰', element: '불', oracleMessage: '어둠을 밝히는 등불이 켜졌습니다. 가려졌던 진실과 창작의 번뜩임이 찾아옵니다.', keywords: ['횃불', '지혜', '명료', '창작'], color: '#f97316' },
  { symbol: 'ᚷ', name: 'Gebo', koreanName: '게보', meaning: '선물과 동등한 동반자 관계', element: '바람', oracleMessage: '진실한 교류와 협력의 축복이 주어집니다. 베푸는 마음과 받는 기쁨이 균형을 이룹니다.', keywords: ['선물', '파트너십', '환대', '균형'], color: '#ec4899' },
  { symbol: 'ᚹ', name: 'Wunjo', koreanName: '운조', meaning: '환희와 조화, 소원 성취', element: '대지', oracleMessage: '고난의 밤이 지나고 순수한 기쁨과 안식이 찾아왔습니다. 축제를 즐기세요.', keywords: ['기쁨', '조화', '행복', '성취'], color: '#fbbf24' },
  { symbol: 'ᚺ', name: 'Hagalaz', koreanName: '하갈라즈', meaning: '우박과 파괴적 변혁, 정화', element: '얼음/물', oracleMessage: '통제할 수 없는 급변이 일어날 수 있으나, 이는 낡은 것을 부수고 새 터전을 닦는 정화입니다.', keywords: ['변혁', '우박', '정화', '해방'], color: '#06b6d4' },
  { symbol: 'ᚾ', name: 'Nauthiz', koreanName: '나우디즈', meaning: '필요와 결핍, 인내의 담금질', element: '불/얼음', oracleMessage: '지금의 제약은 당신의 영혼을 강철처럼 단련하는 도가니입니다. 본질에 집중하세요.', keywords: ['인내', '결핍', '단련', '필연'], color: '#64748b' },
  { symbol: 'ᛁ', name: 'Isa', koreanName: '이사', meaning: '얼음과 정지, 고요한 성찰', element: '얼음', oracleMessage: '겨울 호수처럼 모든 것이 얼어붙어 있습니다. 억지로 움직이지 말고 고요를 지키세요.', keywords: ['정지', '성찰', '보존', '겨울'], color: '#93c5fd' },
  { symbol: 'ᛃ', name: 'Jera', koreanName: '예라', meaning: '수확과 사계절의 순환', element: '대지', oracleMessage: '뿌린 대로 거두는 때입니다. 인내심을 갖고 꾸준히 돌본 결실이 눈앞에 익어갑니다.', keywords: ['수확', '순환', '결실', '시간'], color: '#84cc16' },
  { symbol: 'ᛇ', name: 'Eihwaz', koreanName: '에이와즈', meaning: '주목나무, 불굴의 생명과 변용', element: '모든원소', oracleMessage: '삶과 죽음, 고통을 초월하는 뿌리 깊은 생명력이 당신을 든든하게 지켜줍니다.', keywords: ['변용', '인내', '불멸', '회복'], color: '#15803d' },
  { symbol: 'ᛈ', name: 'Pertho', koreanName: '페르소', meaning: '주사위 잔, 운명과 비밀의 해독', element: '물', oracleMessage: '숨겨진 비밀이 드러나며 예상치 못한 행운의 동시성이 당신의 궤도에 진입합니다.', keywords: ['신비', '동시성', '운명', '직관'], color: '#a855f7' },
  { symbol: 'ᛉ', name: 'Algiz', koreanName: '알기즈', meaning: '엘크의 뿔, 절대적 신성 보호', element: '바람', oracleMessage: '하늘의 수호천사가 당신을 에워싸고 있습니다. 어떤 악영향도 당신을 해치지 못합니다.', keywords: ['수호', '신성보호', '직관', '안식'], color: '#38bdf8' },
  { symbol: 'ᛋ', name: 'Sowilo', koreanName: '소윌로', meaning: '태양의 승리, 온전한 성공', element: '태양/불', oracleMessage: '찬란한 승리의 태양이 떠올랐습니다. 모든 의심이 녹아내리고 영광이 깃듭니다.', keywords: ['승리', '성공', '명료', '치유'], color: '#eab308' },
  { symbol: 'ᛏ', name: 'Tiwaz', koreanName: '티와즈', meaning: '전사의 칼, 정의와 용기', element: '바람', oracleMessage: '올바름과 정의를 위해 당당히 맞설 용기입니다. 진실의 편에 서면 반드시 승리합니다.', keywords: ['정의', '용기', '명예', '리더십'], color: '#dc2626' },
  { symbol: 'ᛒ', name: 'Berkana', koreanName: '베르카나', meaning: '자작나무, 잉태와 새로운 탄생', element: '대지', oracleMessage: '새로운 프로젝트, 아이디어, 생명이 싹틉니다. 부드러운 보살핌으로 정성껏 키우세요.', keywords: ['탄생', '모성', '성장', '양육'], color: '#22c55e' },
  { symbol: 'ᛖ', name: 'Ehwaz', koreanName: '에와즈', meaning: '신성한 군마, 신뢰와 전진', element: '대지', oracleMessage: '믿음직한 파트너와 함께 앞으로 도약합니다. 신뢰와 상호 존중이 가속도를 붙입니다.', keywords: ['전진', '신뢰', '도약', '협력'], color: '#0284c7' },
  { symbol: 'ᛗ', name: 'Mannaz', koreanName: '만나즈', meaning: '인간성, 자아와 공동체의 조화', element: '바람', oracleMessage: '자신을 객관적으로 응시하고 타인과의 연대 속에서 더 큰 성숙을 이루는 시간입니다.', keywords: ['자아', '연대', '지성', '인간애'], color: '#818cf8' },
  { symbol: 'ᛚ', name: 'Laguz', koreanName: '라구즈', meaning: '흐르는 물, 무의식과 감정', element: '물', oracleMessage: '저항하지 말고 감정의 물결에 몸을 맡기세요. 무의식의 심연에서 영감이 솟아납니다.', keywords: ['직관', '감정', '흐름', '무의식'], color: '#0ea5e9' },
  { symbol: 'ᛝ', name: 'Ingwaz', koreanName: '잉과즈', meaning: '생명의 씨앗, 완성 후의 휴식', element: '대지/물', oracleMessage: '하나의 주기가 완성되었습니다. 씨앗이 땅속에서 쉬듯, 평화로운 안식을 취하세요.', keywords: ['완성', '씨앗', '휴식', '잠재력'], color: '#14b8a6' },
  { symbol: 'ᛞ', name: 'Dagaz', koreanName: '다가즈', meaning: '동이 트는 여명, 근본적 각성', element: '불/바람', oracleMessage: '기나긴 밤이 끝나고 눈부신 새벽빛이 비춥니다. 삶의 극적인 패러다임 전환이 일어납니다.', keywords: ['여명', '각성', '돌파', '희망'], color: '#f472b6' },
  { symbol: 'ᛟ', name: 'Othala', koreanName: '오살라', meaning: '조상의 영토, 영적 유산과 안식처', element: '대지', oracleMessage: '뿌리와 안식처를 되찾았습니다. 진정으로 당신에게 속한 소중한 것을 계승하고 지키세요.', keywords: ['유산', '안식처', '가족', '뿌리'], color: '#c084fc' },
];

export function castRunes(count: 1 | 3 = 1): ElderRune[] {
  const shuffled = [...ELDER_FUTHARK_RUNES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ==========================================
// 4. 보이드 & 네뷸라 (Void & Nebula)
// ==========================================
export interface CosmicWishRecord {
  id: string;
  type: 'void_purge' | 'nebula_wish';
  text: string;
  timestamp: number;
}

const STORAGE_KEY_COSMIC = 'prism_orb_cosmic_wishes';

export function saveCosmicRecord(type: 'void_purge' | 'nebula_wish', text: string): CosmicWishRecord {
  const record: CosmicWishRecord = {
    id: `cosmic-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type,
    text,
    timestamp: Date.now(),
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY_COSMIC);
    let list: CosmicWishRecord[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) list = [];
    list.unshift(record);
    if (list.length > 50) list = list.slice(0, 50);
    localStorage.setItem(STORAGE_KEY_COSMIC, JSON.stringify(list));
  } catch (_) {}

  return record;
}

export function getCosmicRecords(): CosmicWishRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COSMIC);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
