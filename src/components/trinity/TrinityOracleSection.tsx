import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Heart, Flame, Wind, Coins, BookOpen, Volume2, VolumeX,
  CheckCircle2, RotateCcw, Zap, Sun, Moon, Feather, Check, Palette, ArrowRight, Share2,
  Compass, Shield, User, Calendar, Clock, X, ChevronDown, ChevronUp, ChevronRight, ChevronLeft, Eye, Layers
} from 'lucide-react';
import { TAROT_DECK, TarotCard, getTarotCardImageUrl } from '@/data/tarotData';
import { TarotSpread, SelectedTarotCardEntry } from './TarotSpread';
import { invokeLLM } from '@/lib/ai';
import { playTTS, playTTSInChunks, stopTTS, useTTSActive, useTTSState, prepareNaturalSpeechText } from '@/utils/tts';
import { sendPrismToss } from '@/lib/prismToss';
import { MUSE_ART_CATALOG } from '@/lib/museDailyArt';
import { useApp, getPersistentUserProfile, setPersistentUserProfile } from '@/contexts/AppContext';
import {
  calculateDetailedSaju,
  ELEMENT_DETAILS,
  type SajuAnalysisResult,
  type FiveElement
} from '@/lib/sajuAnalysis';

// Local storage keys
const STORAGE_HEALING_TREASURES = 'prism_oracle_healing_treasures';
const STORAGE_GROWTH_LOGS = 'prism_oracle_growth_logs';

export interface CardInsight {
  card_name: string;
  position_name: string;
  core_meaning: string;
  saju_resonance?: string;
  personal_interpretation: string;
  action_guide?: string;
}

export interface SajuTarotSynergy {
  day_master_resonance: string;
  elemental_balance: {
    dominant_harmony: string;
    lacking_remedy: string;
  };
  destiny_flow_synthesis: string;
  saju_oracle_verdict: string;
}

export interface HealingResult {
  message: string;
  saju_tarot_synergy?: SajuTarotSynergy;
  card_insights?: CardInsight[];
  prescribed_art: {
    catalog_id?: string;
    artwork_title: string;
    art_quote: string;
  };
  micro_action: string;
  reward_item: {
    name: string;
    description: string;
    icon?: string;
  };
}

export interface GrowthResult {
  macro_focus: string;
  saju_tarot_synergy?: SajuTarotSynergy;
  card_insights?: CardInsight[];
  dominant_element: {
    element: 'Wands' | 'Cups' | 'Swords' | 'Pentacles';
    element_ko: string;
    theme_brief: string;
  };
  micro_mission: {
    title: string;
    action_tip: string;
  };
  evening_reflection: string;
  prescribed_art?: {
    catalog_id?: string;
    artwork_title: string;
    art_quote: string;
  };
}

export interface CollectedTreasure {
  id: string;
  name: string;
  description: string;
  date: string;
  cardNames: string[];
}


// Intelligent dynamic mapping of Tarot cards & Saju elements to MUSE_ART_CATALOG (56 masterpieces)
export function resolvePrescribedArtForCards(
  cards: TarotCard[],
  saju: SajuAnalysisResult | null,
  mode: 'healing' | 'growth'
): { artwork_title: string; art_quote: string; catalog_id: string } {
  if (!cards || cards.length === 0) {
    return {
      catalog_id: 'monet_water_lilies',
      artwork_title: '수련 (Water Lilies, 1916)',
      art_quote: '내가 수련을 그리는 것은 마음을 편안하게 만들기 위한 유일한 의식이다.',
    };
  }

  // Focus on 3rd card (Seed of Healing / Micro Trigger) or 1st card
  const anchorCard = cards[2] || cards[0];
  const cardId = (anchorCard.id || '').toLowerCase();
  const cardName = anchorCard.nameKo || '';

  // Specific Tarot Arcana mapping to MUSE_ART_CATALOG items
  const TAROT_CATALOG_MAP: Record<string, string> = {
    '0': 'chagall_paris_through_window', // 광대 -> 샤갈 창 너머의 파리
    'the_fool': 'chagall_paris_through_window',
    '1': 'kandinsky_composition_viii', // 마법사 -> 칸딘스키 구성 8
    'the_magician': 'kandinsky_composition_viii',
    '2': 'vermeer_girl_pearl_earring', // 여사제 -> 진주 귀걸이를 한 소녀
    'the_high_priestess': 'vermeer_girl_pearl_earring',
    '3': 'botticelli_birth_of_venus', // 여황제 -> 비너스의 탄생
    'the_empress': 'botticelli_birth_of_venus',
    '4': 'friedrich_wanderer', // 황제 -> 안개 바다 위의 방랑자
    'the_emperor': 'friedrich_wanderer',
    '5': 'raphael_school_of_athens', // 교황 -> 아테네 학당
    'the_hierophant': 'raphael_school_of_athens',
    '6': 'klimt_the_kiss', // 연인 -> 클림트 키스
    'the_lovers': 'klimt_the_kiss',
    '7': 'rosa_bonheur_horse_fair', // 전차 -> 로자 보뉴르 말 시장
    'the_chariot': 'rosa_bonheur_horse_fair',
    '8': 'lee_jung_seob_white_ox', // 힘 -> 이중섭 흰 소
    'strength': 'lee_jung_seob_white_ox',
    '9': 'hopper_nighthawks', // 은둔자 -> 호퍼 밤을 지새우는 사람들
    'the_hermit': 'hopper_nighthawks',
    '10': 'mondrian_composition_red_blue_yellow', // 운명의 수레바퀴 -> 몬드리안 빨강 파랑 노랑 구성
    'wheel_of_fortune': 'mondrian_composition_red_blue_yellow',
    '11': 'vermeer_the_milkmaid', // 정의 -> 페르메이르 우유 따르는 여인
    'justice': 'vermeer_the_milkmaid',
    '12': 'dali_persistence_of_memory', // 매달린 사람 -> 살바도르 달리 기억의 지속
    'the_hanged_man': 'dali_persistence_of_memory',
    '13': 'millais_ophelia', // 죽음 -> 밀레이 오필리아
    'death': 'millais_ophelia',
    '14': 'cezanne_mont_sainte_victoire', // 절제 -> 세잔 생트 빅투아르 산
    'temperance': 'cezanne_mont_sainte_victoire',
    '15': 'munch_the_scream', // 악마 -> 뭉크 절규
    'the_devil': 'munch_the_scream',
    '16': 'turner_rain_steam_speed', // 탑 -> 터너 비 증기 그리고 속도
    'the_tower': 'turner_rain_steam_speed',
    '17': 'gogh_starry_night', // 별 -> 반 고흐 별이 빛나는 밤
    'the_star': 'gogh_starry_night',
    '18': 'kitty_kielland_summer_night', // 달 -> 키티 킬란트 여름의 밤
    'the_moon': 'kitty_kielland_summer_night',
    '19': 'monet_impression_sunrise', // 태양 -> 모네 인상 해돋이
    'the_sun': 'monet_impression_sunrise',
    '20': 'caravaggio_calling_saint_matthew', // 심판 -> 카라바조 성 마태오의 소명
    'judgement': 'caravaggio_calling_saint_matthew',
    '21': 'matisse_the_dance', // 세계 -> 앙리 마티스 춤
    'the_world': 'matisse_the_dance',
  };

  let matchedId = TAROT_CATALOG_MAP[cardId] || TAROT_CATALOG_MAP[anchorCard.name.toLowerCase().replace(/\s+/g, '_')];

  // Minor Suit & Keywords fallback
  if (!matchedId) {
    if (cardName.includes('광대') || cardId.includes('fool')) matchedId = 'chagall_paris_through_window';
    else if (cardName.includes('마법사') || cardId.includes('magician')) matchedId = 'kandinsky_composition_viii';
    else if (cardName.includes('별') || cardId.includes('star')) matchedId = 'gogh_starry_night';
    else if (cardName.includes('태양') || cardId.includes('sun')) matchedId = 'monet_impression_sunrise';
    else if (cardName.includes('달') || cardId.includes('moon')) matchedId = 'kitty_kielland_summer_night';
    else if (cardName.includes('연인') || cardId.includes('lover')) matchedId = 'klimt_the_kiss';
    else if (cardName.includes('은둔자') || cardId.includes('hermit')) matchedId = 'hopper_nighthawks';
    else if (cardName.includes('전차') || cardId.includes('chariot')) matchedId = 'rosa_bonheur_horse_fair';
    else if (cardName.includes('힘') || cardId.includes('strength')) matchedId = 'lee_jung_seob_white_ox';
    else if (cardId.includes('wand') || cardName.includes('완드') || cardName.includes('지팡이')) {
      matchedId = mode === 'growth' ? 'rosa_bonheur_horse_fair' : 'gogh_cafe_terrace_night';
    } else if (cardId.includes('cup') || cardName.includes('컵')) {
      matchedId = 'monet_water_lilies';
    } else if (cardId.includes('sword') || cardName.includes('검') || cardName.includes('칼')) {
      matchedId = 'edward_hopper_automat';
    } else if (cardId.includes('pentacle') || cardName.includes('동전')) {
      matchedId = 'klimt_tree_of_life';
    }
  }

  // Saju Element resonance fallback
  if (!matchedId) {
    const dominant = saju?.elements?.dominant?.name;
    if (dominant === '목') matchedId = 'gogh_almond_blossoms';
    else if (dominant === '화') matchedId = 'monet_impression_sunrise';
    else if (dominant === '토') matchedId = 'millet_the_gleaners';
    else if (dominant === '금') matchedId = 'caillebotte_paris_street_rainy_day';
    else if (dominant === '수') matchedId = 'kroyer_summer_evening_skagen';
    else {
      const seed = cards.reduce((acc, c, idx) => acc + (c.nameKo.charCodeAt(0) || idx + 1), 0);
      const catalogIndex = seed % MUSE_ART_CATALOG.length;
      matchedId = MUSE_ART_CATALOG[catalogIndex].id;
    }
  }

  const catalogEntry = MUSE_ART_CATALOG.find((entry) => entry.id === matchedId) || MUSE_ART_CATALOG[0];

  return {
    catalog_id: catalogEntry.id,
    artwork_title: catalogEntry.title,
    art_quote: catalogEntry.quote,
  };
}

export function TrinityOracleSection() {
  const [, setLocation] = useLocation();
  const { sharedState } = useApp();
  const userProfile = sharedState?.userProfile || getPersistentUserProfile();

  // 사주 명리 정밀 계산 (기본값 내장으로 미입력 시에도 완벽한 명식 및 오행 분석 보장)
  const saju = useMemo(() => {
    if (userProfile?.basic?.birthdate) {
      return calculateDetailedSaju(userProfile);
    }
    return calculateDetailedSaju({
      basic: {
        name: userProfile?.basic?.name || '여행자',
        nickname: userProfile?.basic?.nickname || '여행자',
        birthdate: '1995-05-15',
        birthtime: '12:00',
        gender: (userProfile?.basic?.gender as any) || 'female',
      },
    });
  }, [userProfile]);

  // 사주 정보 빠른 수정 모달 상태
  const [showSajuModal, setShowSajuModal] = useState<boolean>(false);
  const [editName, setEditName] = useState(userProfile?.basic?.name || '여행자');
  const [editBirthdate, setEditBirthdate] = useState(userProfile?.basic?.birthdate || '1995-05-15');
  const [editBirthtime, setEditBirthtime] = useState(userProfile?.basic?.birthtime || '12:00');
  const [editGender, setEditGender] = useState<'male' | 'female'>(
    userProfile?.basic?.gender === 'male' ? 'male' : 'female'
  );

  const handleSaveSajuProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updatedProfile = {
      ...(userProfile || {}),
      basic: {
        ...(userProfile?.basic || {}),
        name: editName.trim() || '여행자',
        birthdate: editBirthdate,
        birthtime: editBirthtime,
        gender: editGender,
      },
    };
    setPersistentUserProfile(updatedProfile);
    setShowSajuModal(false);
  };

  // 1. Dual Mode State ('healing' | 'growth')
  const [oracleMode, setOracleMode] = useState<'healing' | 'growth'>('healing');

  // 2. Card Draw Stage State ('spread' | 'result')
  const [stage, setStage] = useState<'spread' | 'result'>('spread');
  const [drawnCards, setDrawnCards] = useState<TarotCard[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 3. Results State
  const [healingResult, setHealingResult] = useState<HealingResult | null>(null);
  const [growthResult, setGrowthResult] = useState<GrowthResult | null>(null);

  // 4. Mission Completion & Rewards State
  const [isHealingCompleted, setIsHealingCompleted] = useState<boolean>(false);
  const [isGrowthCompleted, setIsGrowthCompleted] = useState<boolean>(false);
  const [treasures, setTreasures] = useState<CollectedTreasure[]>([]);
  const [showTreasureModal, setShowTreasureModal] = useState<boolean>(false);
  const [streakCount, setStreakCount] = useState<number>(1);

  // Card tab view state & matrix accordion
  const [selectedCardIdx, setSelectedCardIdx] = useState<number>(0);
  const [showAllCardsTogether, setShowAllCardsTogether] = useState<boolean>(true);
  const [isMatrixOpen, setIsMatrixOpen] = useState<boolean>(true);

  // TTS State
  const isTTSActive = useTTSActive();
  const ttsState = useTTSState();

  // Load collected treasures and growth records on mount
  useEffect(() => {
    try {
      const savedTreasures = localStorage.getItem(STORAGE_HEALING_TREASURES);
      if (savedTreasures) {
        setTreasures(JSON.parse(savedTreasures));
      }
      const savedGrowth = localStorage.getItem(STORAGE_GROWTH_LOGS);
      if (savedGrowth) {
        const parsed = JSON.parse(savedGrowth);
        setStreakCount(parsed.streak || 1);
        const todayStr = new Date().toISOString().split('T')[0];
        if (parsed.lastDate === todayStr && parsed.completed) {
          setIsGrowthCompleted(true);
        }
      }
    } catch (e) {
      console.warn('Failed to parse oracle local storage', e);
    }
  }, []);

  // Filtered decks according to mode
  const majorDeck = useMemo(() => TAROT_DECK.filter((c) => c.type === 'major'), []);
  const fullDeck = useMemo(() => TAROT_DECK, []);

  const activeDeckSource = oracleMode === 'healing' ? majorDeck : fullDeck;

  const slotPositions = useMemo(() => {
    if (oracleMode === 'healing') {
      return ['내면의 무의식', '지금의 마음', '치유의 씨앗'];
    }
    return ['거시적 마인드셋', '4원소 현실 영역', '1줄 마이크로 실행'];
  }, [oracleMode]);

  // Handle mode switch
  const handleModeSwitch = (mode: 'healing' | 'growth') => {
    if (oracleMode === mode) return;
    setOracleMode(mode);
    setStage('spread');
    setDrawnCards([]);
    setHealingResult(null);
    setGrowthResult(null);
    setIsHealingCompleted(false);
    setSelectedCardIdx(0);
    setShowAllCardsTogether(true);
    stopTTS();
  };

  // Run AI analysis after 3 cards are drawn (All upright in Oracle section)
  const handleCardsComplete = async (cards: SelectedTarotCardEntry[]) => {
    const uprightCards = cards.map((c) => ({ ...c, reversed: false }));
    setDrawnCards(uprightCards);
    setStage('result');
    setIsLoading(true);
    stopTTS();

    const cardDescriptions = cards
      .map((c, i) => `${i + 1}번 슬롯 [${slotPositions[i]}]: ${c.nameKo} (${c.name}) - 유형: ${c.type}, 핵심 키워드: [${c.keywords.join(', ')}]`)
      .join('\n');

    // Dynamically determine candidate masterpiece matching these specific 3 cards from MUSE_ART_CATALOG
    const dynamicPrescribedArt = resolvePrescribedArtForCards(uprightCards, saju, oracleMode);

    const sajuContextPrompt = saju
      ? `
# 질문자의 사주명리학(四柱命理) 정밀 원국:
- 이름 및 성별: ${saju.name} (${saju.gender})
- 일간(Day Master) 본원: ${saju.dayMaster.hanja}(${saju.dayMaster.korean}) — ${saju.dayMaster.symbolName}
  * 영적 아키타입: ${saju.dayMaster.archetypeTitle}
  * 핵심 기질 키워드: ${saju.dayMaster.coreKeywords.join(', ')}
  * 본원 성향: ${saju.dayMaster.personalityEssence}
- 사주 4주 8자: 년주(${saju.pillars.year.full}) | 월주(${saju.pillars.month.full}) | 일주(${saju.pillars.day.full})${saju.pillars.hour ? ` | 시주(${saju.pillars.hour.full})` : ''}
- 오행 구성: 목(${saju.elements.counts.목}개) · 화(${saju.elements.counts.화}개) · 토(${saju.elements.counts.토}개) · 금(${saju.elements.counts.금}개) · 수(${saju.elements.counts.수}개)
- 최강 우세 오행: ${saju.elements.dominant.name} (${saju.elements.dominant.advice})
- 결핍 오행 및 용신 보약: ${saju.elements.lacking.name} (용신: ${saju.yongsin.name} - ${saju.yongsin.actionTip})
- 2026 병오년(丙午年) 세운 흐름: ${saju.annual2026.theme} (${saju.annual2026.keyOpportunity})
`
      : '';

    try {
      if (oracleMode === 'healing') {
        // [HEALING MODE] Deep Saju-Tarot blended reflective prompts
        const systemPrompt = `당신의 이름은 '제제(Zezé)'입니다.
당신은 마음 치유 루틴 '파랑새' 안에서 사용자의 사주명리학(四柱) 본원 에너지와 타로(Tarot)의 무의식 상징을 융합하여 보듬어주는 '내면아이(Inner Child)'이자 다정한 비밀 친구입니다.

# Tone & Voice
- 조심스럽고 다정하며, 시적이고 따뜻한 반말(해체)을 사용합니다. ("~했어?", "~해볼까?", "~해도 괜찮아", "~일지도 몰라")
- 인터넷 유행어, 줄임말, 과도한 느낌표는 절대 쓰지 않습니다.
- 섣부른 훈계나 "힘내" 같은 상투적인 클리셰를 쓰지 말고, 감정을 온전히 알아차려 주는 깊은 호흡의 문장을 씁니다.
- '화이트홀', '블랙홀', '웜홀', '손끝 물리량', '파동 측정' 등의 인위적/공상과학 용어는 절대 사용하지 않습니다.

# Core Mission Rule: 사주(四柱)와 타로(Tarot)의 필연적 융합(Synthesis) 리딩
질문자가 타고난 사주 일간 본원(${saju?.dayMaster.symbolName || '본원 기운'})과 오행 균형, 용신 보약 에너지를 바탕으로, 오늘 뽑은 3장의 메이저 타로 카드가 사주의 흐름과 어떻게 상생·상극 공명하고 조화를 이루는지 깊이 있게 융합(Synthesis)하여 해석해야 합니다.

1. saju_tarot_synergy (사주 × 타로 운명 융합 매트릭스):
- day_master_resonance: 질문자의 사주 일간 본원(${saju?.dayMaster.hanja || ''} ${saju?.dayMaster.symbolName || ''})과 3장의 타로 카드가 만났을 때 일어나는 기운의 파동과 상생(相生)·상극(相剋) 심층 공명 분석 (3~4문장).
- elemental_balance:
  * dominant_harmony: 사주의 강한 ${saju?.elements.dominant.name || '우세'} 기운과 타로 카드가 조화를 이루는 중심축 (2~3문장).
  * lacking_remedy: 사주에서 결핍된 ${saju?.elements.lacking.name || '부족'} 오행 및 용신(${saju?.yongsin.name || '보약'}) 에너지를 타로 카드가 어떻게 보완하고 처방하는지 (2~3문장).
- destiny_flow_synthesis: 2026 병오년의 불꽃 같은 흐름 속에서 3장의 카드가 제시하는 내면아이의 쉼과 현실 타이밍 (2~3문장).
- saju_oracle_verdict: 사주와 타로가 하나로 결합하여 내리는 단 하나의 명쾌하고 울림 있는 최종 오라클 계시 (1~2문장).

2. card_insights (카드별 상세 심층 해설):
- core_meaning: 정통 타로 도상과 원형 상징 본래 뜻 (2~3문장).
- saju_resonance: 이 카드가 질문자의 사주 일간(${saju?.dayMaster.hanja || ''}) 및 오행 에너지와 상호작용하는 구체적인 공명 (2~3문장).
- personal_interpretation: 사주와 타로가 결합된 제제의 다정하고 깊은 1:1 심층 위로 리딩 (3~4문장).
- action_guide: 오늘 마음에 품을 실천 팁 (1~2문장).

3. message (제제의 편지):
질문자의 사주 일간 본원 기운(예: ${saju?.dayMaster.symbolName || '따뜻한 온기'})과 3장의 타로 카드를 편지 속에 자연스럽게 녹여내며 마음을 안아주는 제제의 편지 (350~450자 내외).

반드시 마크다운 코드블록 없이 순수 JSON 형식으로만 응답해야 합니다:
{
  "saju_tarot_synergy": {
    "day_master_resonance": "사주 일간 본원과 3장 타로 카드의 상생 공명 분석 (3~4문장)",
    "elemental_balance": {
      "dominant_harmony": "사주 우세 오행과 타로 카드의 조화 (2~3문장)",
      "lacking_remedy": "사주 결핍 오행 및 용신 에너지를 타로 카드가 보완하는 처방 (2~3문장)"
    },
    "destiny_flow_synthesis": "2026 병오년 흐름 속 현실 타이밍 및 마음가짐 (2~3문장)",
    "saju_oracle_verdict": "사주와 타로가 입을 모아 건네는 단 하나의 결정적 오라클 계시 (1~2문장)"
  },
  "card_insights": [
    {
      "card_name": "카드 한글명 (예: 광대)",
      "position_name": "내면의 무의식",
      "core_meaning": "이 카드가 정통 타로에서 지닌 본질적 도상과 상징, 철학적 뜻 (2~3문장)",
      "saju_resonance": "이 카드가 질문자의 사주 일간 본원 및 오행과 빚어내는 구체적인 공명 작용 (2~3문장)",
      "personal_interpretation": "오늘 내 무의식 속에 숨겨진 감정에 건네는 제제의 깊고 다정한 심층 리딩 (3~4문장)",
      "action_guide": "이 카드의 빛을 내 것으로 품을 수 있는 오늘 마음가짐 팁 (1~2문장)"
    },
    {
      "card_name": "카드 한글명 (예: 은둔자)",
      "position_name": "지금의 마음",
      "core_meaning": "이 카드의 본래 도상과 상징, 뜻 (2~3문장)",
      "saju_resonance": "사주 일간 본원과의 상호작용 및 오행적 반응 (2~3문장)",
      "personal_interpretation": "오늘 지친 내 마음에 이 카드가 비춰주는 공감과 위로의 심층 해설 (3~4문장)",
      "action_guide": "지금 현실의 피로를 다정하게 흘려보내는 팁 (1~2문장)"
    },
    {
      "card_name": "카드 한글명 (예: 별)",
      "position_name": "치유의 씨앗",
      "core_meaning": "이 카드가 안내하는 회복의 도상과 본래 뜻 (2~3문장)",
      "saju_resonance": "사주 부족 오행(용신)을 치유하는 타로 카드의 보약 기운 (2~3문장)",
      "personal_interpretation": "이 카드가 안내하는 가장 안전한 회복의 단서와 다정한 제제의 해설 (3~4문장)",
      "action_guide": "오늘 마음속에 피워낼 작은 희망 실천 가이드 (1~2문장)"
    }
  ],
  "message": "질문자의 사주 일간 기운과 3장의 카드 서사를 따뜻하게 엮어낸 제제의 편지 (350~450자 내외)",
  "prescribed_art": {
    "artwork_title": "${dynamicPrescribedArt.artwork_title}",
    "art_quote": "${dynamicPrescribedArt.art_quote}"
  },
  "micro_action": "3번 치유의 씨앗 카드가 제안하는, 지금 자리에서 1~2분 안에 실천할 수 있는 구체적인 신체/감각 행동 1가지",
  "reward_item": {
    "name": "오늘의 마음 보물 아이템 이름 (예: 민들레 홀씨, 작은 솔방울, 따뜻한 찻잔, 푸른 깃털)",
    "description": "이 아이템이 상징하는 치유의 의미 (한 줄)"
  }
}`;

        const prompt = `${sajuContextPrompt}\n\n사용자가 뽑은 3장의 카드:\n${cardDescriptions}\n\n위 질문자의 사주 명리학 원국과 뽑힌 3장의 타로 카드 상징을 긴밀하게 '교차 융합'하여, 사주×타로 시너지 매트릭스(saju_tarot_synergy)와 카드별 심층 리딩(card_insights), 제제의 다정한 마음 처방을 JSON으로 생성해 줘.`;
        const res = await invokeLLM({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          responseFormat: { type: 'json_object' },
        });
        const clean = res.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed: HealingResult = JSON.parse(clean);
        // Ensure catalog_id is bound
        if (!parsed.prescribed_art || !parsed.prescribed_art.artwork_title || parsed.prescribed_art.artwork_title.includes('클로드 모네')) {
          parsed.prescribed_art = dynamicPrescribedArt;
        } else {
          // Look up catalog ID from title
          const cat = MUSE_ART_CATALOG.find(m => m.title.includes(parsed.prescribed_art.artwork_title) || parsed.prescribed_art.artwork_title.includes(m.title));
          parsed.prescribed_art.catalog_id = cat ? cat.id : dynamicPrescribedArt.catalog_id;
        }
        setHealingResult(parsed);
      } else {
        // [GROWTH MODE] Deep Saju-Tarot behavioral prompts
        const systemPrompt = `당신은 현대인을 위한 초정밀 멘탈 트레이너이자 라이프 코치 '오라클 루시'입니다.
우리는 질문자의 사주명리학(四柱) 일간 본원의 추진력과 타로(Tarot) 4원소 프레임워크를 정밀 결합하여, 100% 실행 자아효능감을 높이는 '행동 마인드셋 툴킷'을 도출합니다.
'화이트홀', '블랙홀', '웜홀', '손끝 물리량', '파동 측정' 등의 인위적/공상과학 용어는 절대 언급하지 마십시오.

# Core Mission Rule: 사주(四柱)와 타로(Tarot)의 현실 실행력 융합
질문자의 사주 일간 본원 기질(${saju?.dayMaster.symbolName || ''})과 결핍 오행 보충법을, 4원소 타로 카드의 현실 영역과 직접 결합하여 초정밀 마인드셋과 실행 과제를 도출하세요.

1. saju_tarot_synergy (사주 × 타로 실행 융합 매트릭스):
- day_master_resonance: 사주 일간 본원의 추진력과 3장의 타로 카드가 맞물려 발휘되는 실행 모멘텀 (3~4문장).
- elemental_balance: 사주 오행 밸런스와 타로 4원소(완드/컵/소드/펜타클)의 현실 조화 및 결핍 보완 전략 (2~3문장).
- destiny_flow_synthesis: 2026 병오년 세운의 타이밍과 타로 카드가 가리키는 구체적 현실 기회 (2~3문장).
- saju_oracle_verdict: 사주와 타로가 일치하여 가리키는 단 하나의 명쾌한 실행 계시 (1~2문장).

2. card_insights:
- core_meaning: 이 카드가 지닌 본질적 원형과 상징.
- saju_resonance: 질문자의 사주 본원 기질과 결합하여 발휘되는 구체적 실행 태도 (2~3문장).
- personal_interpretation: 오늘 하루 현실에서 바로 취해야 할 구체적 마인드셋 (2~3문장).

반드시 순수 JSON 형식으로 응답하세요:
{
  "saju_tarot_synergy": {
    "day_master_resonance": "사주 본원 추진력과 타로 카드의 실행 모멘텀 분석 (3~4문장)",
    "elemental_balance": {
      "dominant_harmony": "사주 우세 오행과 타로 4원소의 조화 (2~3문장)",
      "lacking_remedy": "사주 결핍 오행/용신을 보완하는 현실 루틴 (2~3문장)"
    },
    "destiny_flow_synthesis": "2026 세운 흐름 속 결정적 실행 타이밍 (2~3문장)",
    "saju_oracle_verdict": "사주와 타로가 내리는 단 하나의 핵심 실행 계시 (1~2문장)"
  },
  "card_insights": [
    {
      "card_name": "카드 한글명 (예: 황제)",
      "position_name": "거시적 마인드셋",
      "core_meaning": "이 카드가 지닌 본질적 원형과 중심 철학 (1~2줄)",
      "saju_resonance": "사주 본원과 결합하여 이끌어내는 주도적 실행 태도 (2~3문장)",
      "personal_interpretation": "오늘 하루 전체를 통제하기 위해 취해야 할 구체적 태도 (2~3문장)"
    },
    {
      "card_name": "카드 한글명 (예: 지팡이 3)",
      "position_name": "4원소 현실 영역",
      "core_meaning": "이 카드의 슈트와 숫자가 상징하는 본래 의미 (1~2줄)",
      "saju_resonance": "사주 오행 흐름 속에서 이 카드가 점검하게 하는 영역 (2~3문장)",
      "personal_interpretation": "오늘 내 일상 현실에서 주목하고 점검해야 할 구체적 초점 (2~3문장)"
    },
    {
      "card_name": "카드 한글명 (예: 칼 에이스)",
      "position_name": "1줄 마이크로 실행",
      "core_meaning": "이 카드가 지닌 결단과 돌파의 상징 (1~2줄)",
      "saju_resonance": "사주 용신 보약 에너지를 행동으로 깨우는 트리거 (2~3문장)",
      "personal_interpretation": "망설임을 걷어내고 즉시 통제권을 잡을 수 있는 행동의 근거 (2~3문장)"
    }
  ],
  "macro_focus": "질문자의 사주 기질과 3장의 카드가 가리키는 오늘의 거시 마인드셋 종합 브리핑 (2~3문장)",
  "dominant_element": {
    "element": "Wands",
    "element_ko": "완드 (불) - 커리어 & 프로젝트 추진력",
    "theme_brief": "오늘 가장 집중해야 할 핵심 현실 일상 영역 한 줄 해설"
  },
  "micro_mission": {
    "title": "3번 실행 카드의 상징에 기반하여, 5~10분 안에 즉시 실행할 수 있는 초정밀 1줄 실천 과제",
    "action_tip": "실행 시 머뭇거림을 없애주는 단단한 조언"
  },
  "evening_reflection": "오늘 저녁 나의 행동을 돌아보는 1줄 성찰 질문"
}`;

        const prompt = `${sajuContextPrompt}\n\n사용자가 뽑은 3장의 카드:\n${cardDescriptions}\n\n위 질문자의 사주 기질과 타로 3장의 원소적 상징을 융합하여, 사주×타로 시너지 매트릭스(saju_tarot_synergy), 카드별 심층 리딩(card_insights), 마인드셋 브리핑, 1줄 마이크로 미션을 JSON으로 도출해 줘.`;
        const res = await invokeLLM({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          responseFormat: { type: 'json_object' },
        });
        const clean = res.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed: GrowthResult = JSON.parse(clean);
        parsed.prescribed_art = dynamicPrescribedArt;
        setGrowthResult(parsed);
      }
    } catch (err) {
      console.error('Oracle AI error:', err);
      // Fallbacks with rich Saju-Tarot blended meanings
      const sajuNameStr = saju?.name || '내담자';
      const dayMasterStr = saju ? `${saju.dayMaster.hanja}(${saju.dayMaster.symbolName})` : '본원 기운';
      const domElStr = saju?.elements.dominant.name || '우세 오행';
      const lackElStr = saju?.elements.lacking.name || '결핍 오행';
      const yongsinStr = saju?.yongsin.name || '용신 보약';

      if (oracleMode === 'healing') {
        setHealingResult({
          saju_tarot_synergy: {
            day_master_resonance: `${sajuNameStr}님의 타고난 사주 본원인 ${dayMasterStr}의 파동과 오늘 뽑힌 [${cards.map(c => c.nameKo).join(', ')}] 타로 카드가 만나, 억눌렸던 감정을 풀고 고유한 내면의 빛을 회복하는 강력한 치유 공명을 일으킵니다.`,
            elemental_balance: {
              dominant_harmony: `사주에서 강한 ${domElStr}의 추진력이 타로 카드의 상징과 결합하여 흔들리지 않는 내면의 중심축을 지탱해 줍니다.`,
              lacking_remedy: `사주에서 채워주어야 할 ${lackElStr}과 ${yongsinStr}의 에너지를 3번 치유 카드가 따뜻하게 보완해 영혼의 균형을 완성합니다.`
            },
            destiny_flow_synthesis: `2026 병오년의 불꽃 같은 변화 속에서, 이번 타로 카드들은 조급함을 내려놓고 자신의 고유한 호흡과 타이밍을 믿으라는 결정적 조언을 건넵니다.`,
            saju_oracle_verdict: `사주가 타고난 그릇이라면 타로는 지금 당신의 손에 쥐어진 열쇠입니다. 내면의 소리에 귀 기울이세요.`
          },
          card_insights: cards.map((c, i) => ({
            card_name: c.nameKo,
            position_name: slotPositions[i],
            core_meaning: `${c.nameKo} 카드는 [${c.keywords.slice(0, 3).join(', ')}]의 원형적 상징과 도상을 품고 있으며, 무의식의 깊은 빛과 치유 에너지를 상징합니다.`,
            saju_resonance: `질문자의 ${dayMasterStr}과 결합하여, 내면의 불안을 잠재우고 타고난 지혜를 일깨우는 오행적 완충재 역할을 수행합니다.`,
            personal_interpretation: `${slotPositions[i]}의 자리에서 당신에게 서두르지 말고 자신의 내면아이를 따뜻하게 보듬어주라는 다정한 메시지를 전합니다.`,
            action_guide: `오늘 하루, ${c.keywords[0] || '평온'}의 마음으로 가슴에 손을 얹고 깊은 심호흡을 3회 반복해보세요.`,
          })),
          message: `안녕 ${sajuNameStr}... 오늘 네가 품은 [${dayMasterStr}]의 기운과 3장의 마음 조각 [${cards.map(c => c.nameKo).join(', ')}]을 가만히 모아봤어. 남들 기준에 맞추느라 참 많이 지쳤지? 오늘은 나랑 같이 따뜻한 온기만 챙겨보자.`,
          prescribed_art: dynamicPrescribedArt,
          micro_action: '창문을 열고 시원한 공기를 들이마시며 3번 천천히 심호흡하기',
          reward_item: {
            name: '따뜻한 찻잔',
            description: '차갑게 얼어붙었던 나를 녹여주는 다정한 위로의 온기'
          }
        });
      } else {
        setGrowthResult({
          saju_tarot_synergy: {
            day_master_resonance: `${sajuNameStr}님의 사주 본원 [${dayMasterStr}]의 강한 결단력과 오늘 타로 [${cards.map(c => c.nameKo).join(' · ')}]의 현실 원소가 결합하여 즉각적인 실행 착수 동력을 형성합니다.`,
            elemental_balance: {
              dominant_harmony: `사주 ${domElStr}의 실행력이 타로 4원소와 정렬되어 불필요한 에너지 소모를 방지합니다.`,
              lacking_remedy: `부족한 ${lackElStr}과 ${yongsinStr}의 에너지를 1줄 마이크로 루틴으로 채워 지속 가능한 성과를 만듭니다.`
            },
            destiny_flow_synthesis: `2026 병오년의 활기찬 모멘텀 속에서, 미뤄왔던 핵심 과제를 바로 착수할 최적의 타이밍입니다.`,
            saju_oracle_verdict: `생각이 많아질수록 실행은 멀어집니다. 5분 안에 첫 발을 내딛으십시오.`
          },
          card_insights: cards.map((c, i) => ({
            card_name: c.nameKo,
            position_name: slotPositions[i],
            core_meaning: `${c.nameKo} 카드는 [${c.keywords.slice(0, 2).join(', ')}]의 실행 원리를 상징합니다.`,
            saju_resonance: `질문자의 ${dayMasterStr}과 상응하여, 주저함을 걷어내고 실행 자아효능감을 즉시 극대화합니다.`,
            personal_interpretation: `${slotPositions[i]}의 축으로서, 불필요한 망설임을 지우고 즉각적인 행동 착수로 연결하는 기준점을 제공합니다.`,
          })),
          macro_focus: `[${dayMasterStr}]의 본원 기상과 [${cards.map(c => c.nameKo).join(' · ')}]의 원소 흐름에 따라, 오늘은 불필요한 망설임을 걷어내고 내가 통제할 수 있는 최소 단위의 행동에 집중할 때입니다. 착수는 당신의 몫입니다.`,
          dominant_element: {
            element: 'Wands',
            element_ko: '완드 (불) - 실행력 & 프로젝트 추진력',
            theme_brief: '미뤄둔 업무를 5분 안에 착수하여 실행 모멘텀을 형성하는 날'
          },
          micro_mission: {
            title: "미뤄두었던 핵심 서류/메일 1개를 열고 5분간 집중 처리하기",
            action_tip: "완벽하게 끝내려 하지 말고, 단 5분만 손을 대보는 것에 의의를 두세요."
          },
          evening_reflection: '오늘 나는 결과에 끌려다니지 않고 내 하루의 통제권을 쥐었는가?',
          prescribed_art: dynamicPrescribedArt,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Complete 1-min healing micro-action and unlock treasure
  const handleCompleteHealing = () => {
    if (!healingResult) return;
    setIsHealingCompleted(true);
    const newTreasure: CollectedTreasure = {
      id: 'treasure_' + Date.now(),
      name: healingResult.reward_item.name,
      description: healingResult.reward_item.description,
      date: new Date().toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
      cardNames: drawnCards.map((c) => c.nameKo),
    };

    const updated = [newTreasure, ...treasures];
    setTreasures(updated);
    try {
      localStorage.setItem(STORAGE_HEALING_TREASURES, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save treasure', e);
    }
  };

  // Complete growth micro-mission
  const handleToggleGrowth = () => {
    const next = !isGrowthCompleted;
    setIsGrowthCompleted(next);
    if (next) {
      const nextStreak = streakCount + 1;
      setStreakCount(nextStreak);
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        localStorage.setItem(
          STORAGE_GROWTH_LOGS,
          JSON.stringify({ streak: nextStreak, lastDate: todayStr, completed: true })
        );
      } catch (e) {
        console.warn('Failed to save growth log', e);
      }
    }
  };

  // Oracle TTS Speech Text Generation (Full Substantial Saju-Tarot Fusion)
  const oracleSpeechText = useMemo(() => {
    if (oracleMode === 'healing' && healingResult) {
      const parts: string[] = [];
      const verdict = healingResult.saju_tarot_synergy?.saju_oracle_verdict || '';
      if (verdict) parts.push(`오라클 타로의 최종 계시입니다. ${verdict}`);

      const resonance = healingResult.saju_tarot_synergy?.day_master_resonance || '';
      if (resonance) parts.push(`사주 본원과 타로의 파동 공명입니다. ${resonance}`);

      const remedy = healingResult.saju_tarot_synergy?.elemental_balance?.lacking_remedy || '';
      if (remedy) parts.push(`오행 균형과 용신 보약 처방입니다. ${remedy}`);

      const flow = healingResult.saju_tarot_synergy?.destiny_flow_synthesis || '';
      if (flow) parts.push(`2026년 세운의 흐름입니다. ${flow}`);

      const action = healingResult.micro_action ? `오늘 나를 위한 1분 실천 처방은 ${healingResult.micro_action}입니다.` : '';
      if (action) parts.push(action);

      return prepareNaturalSpeechText(parts.join('. '));
    } else if (oracleMode === 'growth' && growthResult) {
      const parts: string[] = [];
      const verdict = growthResult.saju_tarot_synergy?.saju_oracle_verdict || growthResult.macro_focus || '';
      if (verdict) parts.push(`오라클 타로의 현실 실행 브리핑입니다. ${verdict}`);

      const resonance = growthResult.saju_tarot_synergy?.day_master_resonance || '';
      if (resonance) parts.push(`사주 본원과 타로의 실행 모멘텀입니다. ${resonance}`);

      const remedy = growthResult.saju_tarot_synergy?.elemental_balance?.lacking_remedy || '';
      if (remedy) parts.push(`오행 균형과 용신 보완 전략입니다. ${remedy}`);

      const flow = growthResult.saju_tarot_synergy?.destiny_flow_synthesis || '';
      if (flow) parts.push(`2026년 세운 속 실행 타이밍입니다. ${flow}`);

      const mission = growthResult.micro_mission
        ? `오늘의 1줄 실행 미션은 ${growthResult.micro_mission.title}이며, 실행 팁은 ${growthResult.micro_mission.action_tip}입니다.`
        : '';
      if (mission) parts.push(mission);

      return prepareNaturalSpeechText(parts.join('. '));
    }
    return '';
  }, [oracleMode, healingResult, growthResult]);

  const isOracleTTSActive = useMemo(() => {
    if (!isTTSActive || !oracleSpeechText) return false;
    const cleanSpeech = prepareNaturalSpeechText(oracleSpeechText);
    return ttsState.activeFullText === cleanSpeech;
  }, [isTTSActive, oracleSpeechText, ttsState.activeFullText]);

  // TTS Toggle Handler using smooth chunked playback
  const handleToggleTTS = async () => {
    if (isOracleTTSActive) {
      stopTTS();
      return;
    }
    if (oracleSpeechText) {
      await playTTSInChunks(oracleSpeechText, 'Kore', 250, '신비');
    }
  };

  // Executive Summary Card (Substantial Saju-Tarot Synthesis + TTS Audio Player)
  const renderExecutiveSummaryCard = () => {
    const synergy = oracleMode === 'healing' ? healingResult?.saju_tarot_synergy : growthResult?.saju_tarot_synergy;
    const verdict = synergy?.saju_oracle_verdict || (oracleMode === 'healing' ? healingResult?.message : growthResult?.macro_focus);
    const resonance = synergy?.day_master_resonance;
    const flow = synergy?.destiny_flow_synthesis;
    const remedy = synergy?.elemental_balance?.lacking_remedy;
    const actionTip =
      oracleMode === 'healing'
        ? healingResult?.micro_action
        : growthResult?.micro_mission
          ? `${growthResult.micro_mission.title} — ${growthResult.micro_mission.action_tip}`
          : '';

    if (!verdict && !resonance) return null;

    return (
      <div className="glass p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-amber-500/15 via-yellow-500/10 to-purple-950/20 border border-yellow-500/40 shadow-2xl space-y-5 backdrop-blur-xl relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Bar: Title & TTS Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-yellow-500/20 relative z-10">
          <div className="flex items-center gap-2.5 text-yellow-300 font-bold text-sm sm:text-base font-serif">
            <div className="w-8 h-8 rounded-xl bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center text-yellow-300 shadow-sm shrink-0">
              <Sparkles size={16} className="text-yellow-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-yellow-400 uppercase tracking-widest block">
                  SAJU × TAROT EXECUTIVE FUSION REPORT
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-200 font-bold border border-yellow-400/30">
                  마스터 융합 리포트
                </span>
              </div>
              <h3 className="text-white text-sm sm:text-base font-bold">
                사주 ✕ 타로 융합 종합 마스터 브리핑
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleToggleTTS}
              className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 ${
                isOracleTTSActive
                  ? "bg-yellow-400/30 text-yellow-200 border border-yellow-400/60 ring-2 ring-yellow-400/30 animate-pulse"
                  : "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 hover:from-yellow-500/30 hover:to-amber-500/30 text-yellow-200 border border-yellow-400/40"
              }`}
              title={isOracleTTSActive ? "낭독 중지" : "사주 융합 오라클 전체 계시 음성으로 듣기"}
            >
              {isOracleTTSActive ? (
                <>
                  <VolumeX size={15} className="text-yellow-300" />
                  <span>낭독 중지</span>
                  <span className="flex gap-0.5 ml-1">
                    <span className="w-1 h-3 bg-yellow-300 rounded-full animate-bounce" />
                    <span className="w-1 h-4 bg-yellow-200 rounded-full animate-bounce [animation-delay:0.15s]" />
                    <span className="w-1 h-2 bg-yellow-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                  </span>
                </>
              ) : (
                <>
                  <Volume2 size={15} className="text-yellow-400" />
                  <span>오라클 음성 듣기</span>
                  <span className="text-[10px] opacity-75 font-mono">(약 1분)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Master Verdict Quote Box */}
        {verdict && (
          <div className="p-4 sm:p-5 rounded-2xl bg-black/50 border border-yellow-400/35 relative z-10 shadow-inner">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono text-yellow-400 uppercase tracking-widest flex items-center gap-1">
                <span>👑</span> FINAL ORACLE VERDICT (최종 오라클 계시)
              </span>
              <span className="text-[10px] text-zinc-400 font-sans">
                {saju?.name}님의 본원 [{saju?.dayMaster.symbolName}] ✕ 3장의 타로
              </span>
            </div>
            <p className="text-sm sm:text-base font-serif font-bold text-yellow-100 leading-relaxed">
              "{verdict}"
            </p>
          </div>
        )}

        {/* 4 Core Fusion Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10">
          {resonance && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/25 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold font-serif">
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-400/20 text-amber-200 border border-amber-400/30">
                  사주 ✕ 타로 공명
                </span>
                <span>본원 기운과 카드의 결합</span>
              </div>
              <p className="text-xs text-zinc-200 leading-relaxed font-sans pt-0.5">
                {resonance}
              </p>
            </div>
          )}

          {flow && (
            <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-400/25 space-y-1">
              <div className="flex items-center gap-1.5 text-purple-300 text-xs font-bold font-serif">
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-400/20 text-purple-200 border border-purple-400/30">
                  2026 세운 흐름
                </span>
                <span>올해의 현실 타이밍</span>
              </div>
              <p className="text-xs text-zinc-200 leading-relaxed font-sans pt-0.5">
                {flow}
              </p>
            </div>
          )}

          {remedy && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-400/25 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-300 text-xs font-bold font-serif">
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                  오행 ✕ 용신 보약
                </span>
                <span>결핍 기운 치유 처방</span>
              </div>
              <p className="text-xs text-zinc-200 leading-relaxed font-sans pt-0.5">
                {remedy}
              </p>
            </div>
          )}

          {actionTip && (
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/15 space-y-1">
              <div className="flex items-center gap-1.5 text-yellow-300 text-xs font-bold font-serif">
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-yellow-400/20 text-yellow-200 border border-yellow-400/30">
                  오늘의 처방
                </span>
                <span>지금 실천할 현실 행동</span>
              </div>
              <p className="text-xs text-zinc-200 leading-relaxed font-sans pt-0.5">
                {actionTip}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render Jeje's Saju-Tarot Fusion Healing Letter
  const renderFusionLetterSection = (message?: string) => {
    if (!message) return null;

    return (
      <div className="glass p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-950/20 via-zinc-950/90 to-purple-950/30 border border-amber-400/35 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between pb-4 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-md shrink-0">
              <Feather size={22} className="text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block">
                  ZEZÉ'S SACRED LETTER
                </span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/30">
                  사주 ✕ 타로 융합 치유 서한
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold font-serif text-white mt-0.5">
                제제가 {saju?.name || '너'}에게 보내는 다정한 치유 편지
              </h3>
            </div>
          </div>

          <span className="text-xs text-amber-300/80 font-serif italic hidden sm:inline-block">
            "네 마음에 꼭 맞는 온기를 전할게"
          </span>
        </div>

        <div className="mt-4 p-5 sm:p-6 rounded-2xl bg-black/40 border border-white/5 relative z-10 space-y-3 shadow-inner">
          <p className="text-xs sm:text-sm text-zinc-200 font-serif leading-relaxed whitespace-pre-line">
            {message}
          </p>
        </div>
      </div>
    );
  };

  // Render Growth Mode Macro Focus & Reflection
  const renderGrowthMacroSection = (macroFocus?: string) => {
    if (!macroFocus) return null;

    return (
      <div className="glass p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-orange-950/25 via-zinc-950/90 to-amber-950/20 border border-orange-400/35 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="flex items-center gap-3 pb-4 border-b border-white/10 relative z-10">
          <div className="w-11 h-11 rounded-2xl bg-orange-500/20 border border-orange-400/40 flex items-center justify-center text-amber-400 shadow-md shrink-0">
            <Zap size={22} className="text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-orange-400 uppercase tracking-widest block">
                MACRO MINDSET SYNTHESIS
              </span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-amber-200 border border-orange-400/30">
                거시 마인드셋
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold font-serif text-white mt-0.5">
              사주 기질과 타로 4원소의 거시 실행 브리핑
            </h3>
          </div>
        </div>

        <div className="mt-4 p-5 rounded-2xl bg-black/40 border border-white/5 relative z-10 shadow-inner">
          <p className="text-xs sm:text-sm text-zinc-200 font-sans leading-relaxed">
            {macroFocus}
          </p>
        </div>
      </div>
    );
  };

  // Render Evening Reflection Card
  const renderEveningReflectionSection = (reflection?: string) => {
    if (!reflection) return null;

    return (
      <div className="glass p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-indigo-950/30 via-purple-950/20 to-black/50 border border-indigo-400/30 shadow-xl relative overflow-hidden">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shrink-0 shadow-md">
            <Moon size={18} className="text-indigo-400" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-indigo-300 uppercase tracking-widest">
                EVENING REFLECTION PROMPT
              </span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                오늘 밤 성찰 질문
              </span>
            </div>
            <h4 className="text-sm sm:text-base font-serif font-bold text-indigo-100">
              "{reflection}"
            </h4>
          </div>
        </div>
      </div>
    );
  };

  // Toss inspiration to Muse Art Recommendation (Dynamic Art Prescription)
  const handleTossToMuse = () => {
    const activeResult = oracleMode === 'healing' ? healingResult : growthResult;
    if (!activeResult) return;

    const prescribed =
      activeResult.prescribed_art ||
      resolvePrescribedArtForCards(drawnCards, saju, oracleMode);

    sendPrismToss({
      sourceApp: 'oracle',
      targetApp: 'muse',
      actionType: 'art_prescription',
      cards: drawnCards.map((c, i) => {
        const insight = activeResult.card_insights?.[i];
        return {
          id: c.id,
          name: c.name,
          nameKo: c.nameKo,
          keywords: c.keywords,
          keyword: c.keywords[0],
          cardName: c.nameKo,
          cardIndex: i,
          description: insight ? `${insight.core_meaning} - ${insight.personal_interpretation}` : c.keywords.join(', '),
        };
      }),
      anchorArtworkTitle: prescribed.artwork_title,
      anchorArtworkCatalogId: prescribed.catalog_id,
      anchorArtQuote: prescribed.art_quote,
      contextMessage: oracleMode === 'healing' ? healingResult?.message : growthResult?.macro_focus,
      tossedAt: Date.now(),
    });

    window.dispatchEvent(new CustomEvent('nav-click-active', { detail: { path: '/muse' } }));
    setLocation('/muse');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Render Saju & Tarot Destiny Synergy Matrix Section (Collapsible Accordion)
  const renderSajuTarotSynergySection = (synergy?: SajuTarotSynergy) => {
    if (!synergy) return null;

    return (
      <div className="glass rounded-3xl bg-gradient-to-br from-purple-950/40 via-zinc-950/90 to-amber-950/30 border border-amber-400/30 shadow-xl overflow-hidden backdrop-blur-xl">
        {/* Accordion Toggle Header */}
        <button
          type="button"
          onClick={() => setIsMatrixOpen(!isMatrixOpen)}
          className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left transition-colors hover:bg-white/[0.02] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-md shrink-0">
              <Compass size={18} className="text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block">
                  SAJU × TAROT ALCHEMY MATRIX
                </span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/30">
                  심층 융합
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold font-serif text-white">
                사주 명리학과 타로 카드의 운명 융합 매트릭스
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 text-amber-300 text-xs font-sans">
            <span className="hidden sm:inline-block text-[11px] text-zinc-400">
              {isMatrixOpen ? '상세 접기' : '상세 펼치기'}
            </span>
            {isMatrixOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {isMatrixOpen && (
          <div className="p-5 sm:p-6 pt-0 space-y-3.5 border-t border-white/5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
              {/* 1. Day Master & Tarot Resonance */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-amber-400/25 space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs sm:text-sm font-serif">
                  <span>☯️</span>
                  <span>사주 본원(日干)과 타로 카드의 파동 공명</span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-sans">
                  {synergy.day_master_resonance}
                </p>
              </div>

              {/* 2. Elemental Balance & Remedy */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-purple-400/25 space-y-2">
                <div className="flex items-center gap-2 text-purple-300 font-bold text-xs sm:text-sm font-serif">
                  <span>🌿</span>
                  <span>오행 균형 및 용신(用神) 보약 상생</span>
                </div>
                <div className="space-y-1 text-xs text-zinc-200 leading-relaxed font-sans">
                  <p>
                    <strong className="text-emerald-300">우세 기운:</strong> {synergy.elemental_balance?.dominant_harmony}
                  </p>
                  <p>
                    <strong className="text-yellow-300">결핍 기운:</strong> {synergy.elemental_balance?.lacking_remedy}
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Destiny Flow */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-transparent border border-amber-400/25 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs font-serif">
                  <span>🧭</span>
                  <span>2026 병오년(丙午年) 세운 속 현실 타이밍</span>
                </div>
                <span className="text-[10px] font-mono text-amber-300/70">2026 ANNUAL FLOW</span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-sans">
                {synergy.destiny_flow_synthesis}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render Card-by-Card Deep Reading Section (Tabbed 1-Card Focus + 3-Cards Unified View)
  const renderCardInsightsSection = (insights?: CardInsight[]) => {
    if (!insights || insights.length === 0) return null;

    const currentCard = drawnCards[selectedCardIdx] || drawnCards[0];
    const currentInsight = insights[selectedCardIdx] || insights[0];

    const renderCardCard = (card: TarotCard, insight: CardInsight, idx: number) => (
      <div className="p-5 sm:p-6 rounded-3xl bg-white/[0.03] border border-white/10 space-y-4 shadow-lg backdrop-blur-sm">
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-20 rounded-xl overflow-hidden border border-amber-400/40 shadow-md shrink-0">
              <img
                src={getTarotCardImageUrl(card)}
                alt={card.nameKo}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold border border-amber-400/30">
                  #{idx + 1} {slotPositions[idx]}
                </span>
                <span className="text-[9px] font-mono text-zinc-400 uppercase">
                  {card.type === 'major' ? 'MAJOR ARCANA' : card.type.toUpperCase()}
                </span>
              </div>
              <h4 className="text-base sm:text-lg font-bold text-white font-serif mt-1">
                {card.nameKo} <span className="text-xs text-zinc-400 font-sans font-normal italic">({card.name})</span>
              </h4>
              <div className="flex flex-wrap gap-1 mt-1">
                {card.keywords.slice(0, 3).map((kw) => (
                  <span key={kw} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-300 border border-white/10">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 4 Pillars in clean harmonized grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insight.core_meaning && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/20 text-xs text-amber-100 leading-relaxed font-sans">
              <span className="font-bold text-amber-300 block mb-1 text-[11px] flex items-center gap-1.5">
                <span>🏛️</span> 카드의 본질적 도상 & 상징
              </span>
              {insight.core_meaning}
            </div>
          )}

          {insight.saju_resonance && (
            <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-400/20 text-xs text-purple-100 leading-relaxed font-sans">
              <span className="font-bold text-purple-300 block mb-1 text-[11px] flex items-center gap-1.5">
                <span>☯️</span> 사주 본원 및 오행 공명
              </span>
              {insight.saju_resonance}
            </div>
          )}

          {insight.personal_interpretation && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 text-xs text-emerald-100 leading-relaxed font-sans md:col-span-2">
              <span className="font-bold text-emerald-300 block mb-1 text-[11px] flex items-center gap-1.5">
                <span>🌿</span> {oracleMode === 'healing' ? '제제의 심층 맞춤 리딩' : '마인드셋 심층 분석'}
              </span>
              {insight.personal_interpretation}
            </div>
          )}

          {insight.action_guide && (
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/15 text-xs text-zinc-200 leading-relaxed font-sans md:col-span-2">
              <span className="font-bold text-yellow-300 block mb-1 text-[11px] flex items-center gap-1.5">
                <span>💡</span> 오늘 마음에 품을 실천 팁
              </span>
              {insight.action_guide}
            </div>
          )}
        </div>
      </div>
    );

    return (
      <div className="glass p-5 sm:p-7 rounded-3xl bg-white/[0.02] border border-amber-400/25 shadow-xl space-y-4 backdrop-blur-xl">
        {/* Header & View Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold font-serif text-white">
                {oracleMode === 'healing'
                  ? '3장의 카드별 심층 리딩 & 치유'
                  : '3장의 카드별 현실 실행 툴킷'}
              </h3>
              <span className="text-[10px] text-zinc-400 font-sans">
                카드를 하나씩 선택하여 상징과 사주 공명을 집중 탐색해 보세요
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAllCardsTogether(!showAllCardsTogether)}
            className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-[11px] text-amber-300 font-medium flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
          >
            {showAllCardsTogether ? <Eye size={13} /> : <Layers size={13} />}
            <span>{showAllCardsTogether ? '카드 한 장씩 집중보기' : '3장 전체 펼쳐보기'}</span>
          </button>
        </div>

        {/* Card Tab Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            type="button"
            onClick={() => setShowAllCardsTogether(true)}
            className={`px-3.5 py-2 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              showAllCardsTogether
                ? 'bg-amber-500/25 text-amber-200 border-amber-400/50 shadow-md ring-1 ring-amber-400/30'
                : 'bg-white/5 hover:bg-white/10 text-zinc-400 border-white/10 hover:text-white'
            }`}
          >
            <Layers size={13} />
            <span>3장 전체</span>
          </button>
          {drawnCards.map((c, i) => {
            const isSelected = !showAllCardsTogether && selectedCardIdx === i;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setShowAllCardsTogether(false);
                  setSelectedCardIdx(i);
                }}
                className={`flex-1 min-w-[110px] px-3 py-2 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shrink-0 ${
                  isSelected
                    ? 'bg-amber-500/25 text-amber-200 border-amber-400/50 shadow-md ring-1 ring-amber-400/30'
                    : 'bg-white/5 hover:bg-white/10 text-zinc-400 border-white/10 hover:text-white'
                }`}
              >
                <span className="text-[10px] opacity-70 font-mono">#{i + 1}</span>
                <span className="truncate">{c.nameKo}</span>
              </button>
            );
          })}
        </div>

        {/* View Mode Switch */}
        {showAllCardsTogether ? (
          <div className="space-y-4">
            {drawnCards.map((c, i) => (
              <div key={c.id}>
                {renderCardCard(c, insights[i], i)}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {renderCardCard(currentCard, currentInsight, selectedCardIdx)}
            {/* Step navigation buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                disabled={selectedCardIdx === 0}
                onClick={() => setSelectedCardIdx(selectedCardIdx - 1)}
                className={`px-3.5 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
                  selectedCardIdx === 0
                    ? 'opacity-30 border-white/5 cursor-not-allowed text-zinc-500'
                    : 'bg-white/5 hover:bg-white/10 border-white/15 text-zinc-300 hover:text-white cursor-pointer'
                }`}
              >
                <ChevronLeft size={14} />
                <span>이전 카드</span>
              </button>
              <span className="text-xs text-zinc-500 font-mono">
                {selectedCardIdx + 1} / {drawnCards.length}
              </span>
              <button
                type="button"
                disabled={selectedCardIdx === drawnCards.length - 1}
                onClick={() => setSelectedCardIdx(selectedCardIdx + 1)}
                className={`px-3.5 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
                  selectedCardIdx === drawnCards.length - 1
                    ? 'opacity-30 border-white/5 cursor-not-allowed text-zinc-500'
                    : 'bg-white/5 hover:bg-white/10 border-white/15 text-zinc-300 hover:text-white cursor-pointer'
                }`}
              >
                <span>다음 카드</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-12 text-white">
      {/* 1. Header & Segment Controller */}
      <div className="glass relative p-5 sm:p-7 rounded-3xl bg-white/[0.04] border border-amber-400/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl overflow-hidden">
        {/* Ambient cosmic glows */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-amber-500/10 blur-[90px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-indigo-500/10 blur-[90px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-[10px] sm:text-xs font-mono text-amber-300 mb-2 uppercase tracking-widest">
              <Sparkles size={12} className="text-amber-400 animate-pulse" />
              DESTINY ✕ TAROT FUSION
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-black tracking-tight text-white flex items-center justify-center md:justify-start gap-2">
              오라클 타로 <span className="text-amber-400/90 font-light text-lg sm:text-xl">· 사주 명리 ✕ 타로 융합</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300/80 mt-1 font-sans">
              <strong>사주 만세력</strong>의 일간·오행 에너지와 <strong>타로 리딩</strong>의 천상 상징을 융합한 시너지 오라클
            </p>
          </div>

          {/* Dual Mode Switcher */}
          <div className="flex items-center p-1 rounded-2xl bg-black/50 border border-white/10 shadow-inner shrink-0">
            <button
              onClick={() => handleModeSwitch('healing')}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 ${
                oracleMode === 'healing'
                  ? 'text-yellow-200 font-bold shadow-lg'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {oracleMode === 'healing' && (
                <motion.div
                  layoutId="oracle-mode-pill"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-600/50 via-yellow-600/40 to-indigo-600/40 border border-yellow-400/40"
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                />
              )}
              <Heart size={14} className="relative z-10 text-rose-300" />
              <span className="relative z-10">힐링 (22장 메이저)</span>
            </button>

            <button
              onClick={() => handleModeSwitch('growth')}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 ${
                oracleMode === 'growth'
                  ? 'text-yellow-200 font-bold shadow-lg'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {oracleMode === 'growth' && (
                <motion.div
                  layoutId="oracle-mode-pill"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-600/50 via-yellow-600/40 to-indigo-600/40 border border-yellow-400/40"
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                />
              )}
              <Zap size={14} className="relative z-10 text-amber-400" />
              <span className="relative z-10">자기계발 (78장 풀덱)</span>
            </button>
          </div>
        </div>

        {/* Saju Alignment Status Bar */}
        <div className="relative z-10 mt-4 pt-3.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 font-medium shadow-sm">
              <Compass size={13} className="text-amber-400" />
              <span>사주 융합 연동:</span>
              <strong className="text-white font-bold">{saju?.name || '여행자'}</strong>
              <span className="text-amber-200">[{saju?.dayMaster.hanja}({saju?.dayMaster.korean}) · {saju?.dayMaster.symbolName}]</span>
            </span>

            {saju && (
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">木 {saju.elements.counts.목}</span>
                <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30">火 {saju.elements.counts.화}</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">土 {saju.elements.counts.토}</span>
                <span className="px-2 py-0.5 rounded-md bg-zinc-400/15 text-zinc-200 border border-zinc-400/30">金 {saju.elements.counts.금}</span>
                <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/30">水 {saju.elements.counts.수}</span>
                <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-200 border border-purple-400/30 font-sans font-bold">용신: {saju.yongsin.name}</span>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowSajuModal(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-[11px] text-zinc-300 hover:text-white transition-colors"
          >
            <User size={12} className="text-amber-400" />
            <span>생년월일(사주) 수정</span>
          </button>
        </div>

        {/* Quick Toolbar */}
        <div className="relative z-10 mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-300">
          <div className="flex items-center gap-3">
            {oracleMode === 'healing' ? (
              <button
                onClick={() => setShowTreasureModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-amber-300 transition-colors"
              >
                <Feather size={13} className="text-amber-400" />
                <span>제제의 보물상자 ({treasures.length})</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-amber-300">
                <Flame size={13} className="text-orange-400" />
                <span>실행 스트릭 {streakCount}일차</span>
              </div>
            )}
          </div>

          {stage === 'result' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleTTS}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
                  isOracleTTSActive
                    ? 'bg-amber-400/30 text-amber-200 border border-amber-400/50 animate-pulse'
                    : 'bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30 text-amber-300'
                }`}
                title={isOracleTTSActive ? "오라클 낭독 중지" : "오라클 종합 계시 듣기"}
              >
                {isOracleTTSActive ? <VolumeX size={13} /> : <Volume2 size={13} />}
                <span>{isOracleTTSActive ? '낭독 중지' : '오라클 듣기'}</span>
              </button>
              <button
                onClick={() => {
                  setStage('spread');
                  setDrawnCards([]);
                  setHealingResult(null);
                  setGrowthResult(null);
                  stopTTS();
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white/90 text-xs font-medium transition-all cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>다시 뽑기</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Stage Area */}
      <AnimatePresence mode="wait">
        {stage === 'spread' ? (
          /* SPREAD CARD DRAW INTERACTION */
          <motion.div
            key="oracle-draw-stage"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="w-full relative"
          >
            <div className="glass p-4 sm:p-6 rounded-3xl bg-zinc-950/70 border border-amber-400/20 shadow-2xl relative overflow-hidden">
              <div className="text-center mb-2">
                <span className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-amber-400/80">
                  {oracleMode === 'healing' ? 'Inner Child Oracle • 22 Major Arcana' : 'Mindset Toolkit • 78 Full Deck'}
                </span>
                <h3 className="text-lg sm:text-xl font-bold font-serif text-white mt-0.5">
                  {oracleMode === 'healing' ? '내면의 숨결을 마주할 3장의 카드' : '오늘의 마인드셋을 이끌 3장의 카드'}
                </h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                  {oracleMode === 'healing'
                    ? '카드를 손가락이나 마우스로 굴려 마음이 이끄는 3장을 천천히 선택해 보세요.'
                    : '4원소(불·물·공기·흙)의 현실 실행력을 깨울 3장의 도구를 선택해 주세요.'}
                </p>
              </div>

              {/* Native TarotSpread Component Integration with Oracle Card Back */}
              <div className="w-full min-h-[440px] md:min-h-[480px] relative">
                <TarotSpread
                  key={`oracle-spread-${oracleMode}`}
                  maxCards={3}
                  positions={slotPositions}
                  deckSource={activeDeckSource}
                  cardBackVariant="oracle"
                  allowReversed={false}
                  spreadName={oracleMode === 'healing' ? '내면아이 쉼 스프레드' : '4원소 마인드셋 스프레드'}
                  onComplete={handleCardsComplete}
                  onCancel={() => {}}
                />
              </div>
            </div>
          </motion.div>
        ) : (
          /* RESULT PRESENTATION AREA */
          <motion.div
            key="oracle-result-stage"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* 3 Drawn Cards Mini Banner */}
            <div className="glass p-4 sm:p-5 rounded-3xl bg-white/[0.03] border border-amber-400/25 flex flex-wrap items-center justify-around gap-3 backdrop-blur-xl">
              {drawnCards.map((card, idx) => (
                <div key={card.id} className="flex items-center gap-3">
                  <div className="w-12 h-18 sm:w-14 sm:h-20 rounded-lg overflow-hidden border border-amber-400/40 shadow-md relative shrink-0">
                    <img
                      src={getTarotCardImageUrl(card)}
                      alt={card.nameKo}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-amber-400/80 block uppercase tracking-wider">
                      {slotPositions[idx]}
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-white font-serif">{card.nameKo}</h4>
                    <span className="text-[11px] text-zinc-400">{card.keywords.slice(0, 2).join(' · ')}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Loading Indicator */}
            {isLoading ? (
              <div className="glass p-12 rounded-3xl bg-zinc-950/60 border border-amber-400/20 text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
                <p className="text-sm font-serif text-amber-200 animate-pulse">
                  {oracleMode === 'healing'
                    ? '3장의 마음 조각을 다정하게 엮어 오라클을 조율 중입니다...'
                    : '4원소 현실 실행 툴킷과 마인드셋 브리핑을 조율 중입니다...'}
                </p>
              </div>
            ) : oracleMode === 'healing' && healingResult ? (
              /* [HEALING RESULT VIEW] */
              <div className="space-y-6">
                {/* 핵심 3줄 요약 & 오라클 TTS */}
                {renderExecutiveSummaryCard()}

                {/* 0. 사주 × 타로 운명 융합 매트릭스 (Saju & Tarot Alchemy Matrix) */}
                {renderSajuTarotSynergySection(healingResult.saju_tarot_synergy)}

                {/* 3 Cards Deep Insights Reading (내면아이 성찰 메시지 제외, 카드 고유 뜻과 상징만 표기) */}
                {renderCardInsightsSection(healingResult.card_insights)}

                {/* 제제의 사주·타로 융합 치유 서한 */}
                {renderFusionLetterSection(healingResult.message)}

                {/* 2. Prescribed Art -> Toss to Muse Art Sanctuary */}
                <div
                  onClick={handleTossToMuse}
                  className="glass p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-black/60 border border-purple-400/40 hover:border-purple-400/80 shadow-2xl relative overflow-hidden cursor-pointer group transition-all duration-300"
                >
                  <div className="absolute top-0 right-0 w-56 h-56 bg-purple-500/15 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/25 transition-all" />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600/30 to-indigo-600/30 border border-purple-400/50 flex items-center justify-center text-purple-200 group-hover:scale-110 transition-transform shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                        <Palette size={24} className="text-purple-300 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono text-purple-300 uppercase tracking-widest flex items-center gap-1">
                            <Sparkles size={11} className="text-purple-400" />
                            PRISM TOSS PIPELINE
                          </span>
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 font-bold border border-purple-400/40 shadow-inner">
                            뮤즈로 토스(Toss)
                          </span>
                        </div>
                        <h4 className="text-sm sm:text-base font-bold font-serif text-white group-hover:text-purple-200 transition-colors flex items-center gap-1.5">
                          <span>이 영감을 뮤즈의 예술추천으로 '토스'하기</span>
                        </h4>
                        <p className="text-xs text-zinc-300/90 mt-1 font-serif italic">
                          "{healingResult.prescribed_art.artwork_title}" — {healingResult.prescribed_art.art_quote}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600/40 to-indigo-600/40 group-hover:from-purple-600/60 group-hover:to-indigo-600/60 border border-purple-400/50 text-xs font-bold text-purple-100 shrink-0 transition-all self-end sm:self-center shadow-lg">
                      <span>뮤즈로 토스</span>
                      <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform text-purple-300" />
                    </div>
                  </div>
                </div>

                {/* 3. 1-Minute Micro-Action & Reward */}
                <div className="glass p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-950/20 via-yellow-950/10 to-transparent border border-yellow-400/30 relative">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block">
                        TODAY'S 1-MINUTE SELF-CARE ACTION
                      </span>
                      <h4 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                        <Feather size={18} className="text-amber-400" />
                        {healingResult.micro_action}
                      </h4>
                      <p className="text-xs text-zinc-400">
                        지금 자리에서 가볍게 실천하고 제제에게 보물을 선물해 주세요.
                      </p>
                    </div>

                    <button
                      onClick={handleCompleteHealing}
                      disabled={isHealingCompleted}
                      className={`px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shrink-0 ${
                        isHealingCompleted
                          ? 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 cursor-default'
                          : 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:brightness-110'
                      }`}
                    >
                      {isHealingCompleted ? (
                        <>
                          <CheckCircle2 size={16} className="text-emerald-400" />
                          <span>쉼 완료 · 보물 획득!</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          <span>1분 쉼 실천하고 보물받기</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Reward preview if completed */}
                  {isHealingCompleted && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-5 pt-4 border-t border-white/10 flex items-center gap-3 text-xs text-amber-200"
                    >
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300 shrink-0">
                        🎁
                      </div>
                      <div>
                        <span className="font-bold text-yellow-300">[{healingResult.reward_item.name}]</span>이(가)
                        제제의 보물상자에 고이 담겼습니다.
                        <p className="text-[11px] text-zinc-400 mt-0.5">{healingResult.reward_item.description}</p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            ) : oracleMode === 'growth' && growthResult ? (
              /* [GROWTH RESULT VIEW] */
              <div className="space-y-6">
                {/* 핵심 3줄 요약 & 오라클 TTS */}
                {renderExecutiveSummaryCard()}

                {/* 0. 사주 × 타로 운명 융합 매트릭스 (Saju & Tarot Alchemy Matrix) */}
                {renderSajuTarotSynergySection(growthResult.saju_tarot_synergy)}

                {/* 3 Cards Deep Insights Reading (내면아이 성찰 메시지 제외, 카드 고유 뜻과 상징만 표기) */}
                {renderCardInsightsSection(growthResult.card_insights)}

                {/* 거시 마인드셋 종합 브리핑 */}
                {renderGrowthMacroSection(growthResult.macro_focus)}

                {/* 2. Prescribed Art -> Toss to Muse Art Sanctuary */}
                {growthResult.prescribed_art && (
                  <div
                    onClick={handleTossToMuse}
                    className="glass p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-black/60 border border-purple-400/40 hover:border-purple-400/80 shadow-2xl relative overflow-hidden cursor-pointer group transition-all duration-300"
                  >
                    <div className="absolute top-0 right-0 w-56 h-56 bg-purple-500/15 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/25 transition-all" />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600/30 to-indigo-600/30 border border-purple-400/50 flex items-center justify-center text-purple-200 group-hover:scale-110 transition-transform shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                          <Palette size={24} className="text-purple-300 animate-pulse" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono text-purple-300 uppercase tracking-widest flex items-center gap-1">
                              <Sparkles size={11} className="text-purple-400" />
                              PRISM TOSS PIPELINE
                            </span>
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 font-bold border border-purple-400/40 shadow-inner">
                              뮤즈로 토스(Toss)
                            </span>
                          </div>
                          <h4 className="text-sm sm:text-base font-bold font-serif text-white group-hover:text-purple-200 transition-colors flex items-center gap-1.5">
                            <span>이 실행 영감을 뮤즈의 예술추천으로 '토스'하기</span>
                          </h4>
                          <p className="text-xs text-zinc-300/90 mt-1 font-serif italic">
                            "{growthResult.prescribed_art.artwork_title}" — {growthResult.prescribed_art.art_quote}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600/40 to-indigo-600/40 group-hover:from-purple-600/60 group-hover:to-indigo-600/60 border border-purple-400/50 text-xs font-bold text-purple-100 shrink-0 transition-all self-end sm:self-center shadow-lg">
                        <span>뮤즈로 토스</span>
                        <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform text-purple-300" />
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Dominant Element & Focus Area */}
                <div className="glass p-5 rounded-3xl bg-white/[0.02] border border-white/10 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
                    {growthResult.dominant_element.element === 'Wands' ? (
                      <Flame size={24} className="text-amber-500" />
                    ) : growthResult.dominant_element.element === 'Cups' ? (
                      <Heart size={24} className="text-blue-400" />
                    ) : growthResult.dominant_element.element === 'Swords' ? (
                      <Wind size={24} className="text-purple-400" />
                    ) : (
                      <Coins size={24} className="text-yellow-400" />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">
                      DOMINANT 4-ELEMENT REALITY
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-white">
                      {growthResult.dominant_element.element_ko}
                    </h4>
                    <p className="text-xs text-zinc-300 mt-0.5">{growthResult.dominant_element.theme_brief}</p>
                  </div>
                </div>

                {/* 3. Actionable Micro-Mission Card */}
                <div className="glass p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-orange-950/25 via-amber-950/15 to-transparent border border-orange-400/30 relative">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono text-orange-400 uppercase tracking-widest block">
                        TODAY'S ACTIONABLE MICRO-MISSION
                      </span>
                      <h4 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                        <Zap size={18} className="text-amber-400 shrink-0" />
                        {growthResult.micro_mission.title}
                      </h4>
                      <p className="text-xs text-zinc-300/90 leading-relaxed font-sans">
                        💡 <strong>실행 팁:</strong> {growthResult.micro_mission.action_tip}
                      </p>
                    </div>

                    <button
                      onClick={handleToggleGrowth}
                      className={`px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-xl shrink-0 ${
                        isGrowthCompleted
                          ? 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-300'
                          : 'bg-gradient-to-r from-orange-500 to-amber-500 text-black hover:brightness-110'
                      }`}
                    >
                      {isGrowthCompleted ? (
                        <>
                          <CheckCircle2 size={16} className="text-emerald-400" />
                          <span>오늘의 미션 완료됨</span>
                        </>
                      ) : (
                        <>
                          <Check size={16} />
                          <span>오늘 실천 완료 체크</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Evening reflection prompt */}
                  <div className="mt-5 pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-zinc-400">
                    <Moon size={14} className="text-indigo-400 shrink-0" />
                    <span>
                      <strong>저녁 성찰 질문:</strong> "{growthResult.evening_reflection}"
                    </span>
                  </div>
                </div>

                {/* 오늘 저녁 성찰 질문 */}
                {renderEveningReflectionSection(growthResult.evening_reflection)}
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Zeze's Treasure Box Modal */}
      <AnimatePresence>
        {showTreasureModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass w-full max-w-md p-6 rounded-3xl bg-zinc-950 border border-amber-400/30 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2">
                  <Feather size={18} className="text-amber-400" />
                  <h3 className="text-lg font-serif font-bold text-white">제제의 마음 보물상자</h3>
                </div>
                <button
                  onClick={() => setShowTreasureModal(false)}
                  className="text-xs text-zinc-400 hover:text-white px-2.5 py-1 rounded-lg bg-white/5"
                >
                  닫기
                </button>
              </div>

              {treasures.length === 0 ? (
                <div className="text-center py-12 text-zinc-400 text-xs">
                  <p>아직 수집된 마음 보물이 없어요.</p>
                  <p className="mt-1 text-zinc-500">힐링 모드에서 1분 쉼을 실천하고 제제에게 보물을 받아보세요!</p>
                </div>
              ) : (
                <div className="max-h-[340px] overflow-y-auto no-scrollbar space-y-3">
                  {treasures.map((t) => (
                    <div
                      key={t.id}
                      className="p-3.5 rounded-2xl bg-white/[0.04] border border-amber-400/20 flex items-start gap-3"
                    >
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-lg shrink-0">
                        ✨
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-yellow-200">{t.name}</h4>
                          <span className="text-[10px] font-mono text-zinc-400">{t.date}</span>
                        </div>
                        <p className="text-xs text-zinc-300 mt-0.5">{t.description}</p>
                        <div className="text-[10px] text-zinc-400 mt-1.5 flex items-center gap-1">
                          <span>연계 카드:</span>
                          <span className="text-amber-400/80">{t.cardNames.join(', ')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Saju Profile Edit Modal */}
      <AnimatePresence>
        {showSajuModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass w-full max-w-md p-6 rounded-3xl bg-zinc-950 border border-amber-400/40 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2">
                  <Compass size={18} className="text-amber-400" />
                  <h3 className="text-lg font-serif font-bold text-white">사주 명식 정보 설정</h3>
                </div>
                <button
                  onClick={() => setShowSajuModal(false)}
                  className="text-xs text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveSajuProfile} className="space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">성명 (호칭)</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white focus:border-amber-400 focus:outline-none"
                    placeholder="이름을 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">생년월일 (양력)</label>
                  <input
                    type="date"
                    value={editBirthdate}
                    onChange={(e) => setEditBirthdate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-300 font-medium mb-1">태어난 시간</label>
                    <input
                      type="time"
                      value={editBirthtime}
                      onChange={(e) => setEditBirthtime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-300 font-medium mb-1">성별</label>
                    <select
                      value={editGender}
                      onChange={(e) => setEditGender(e.target.value as 'male' | 'female')}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/15 text-white focus:border-amber-400 focus:outline-none"
                    >
                      <option value="female">여성</option>
                      <option value="male">남성</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-400/20 text-amber-200/90 text-[11px] leading-relaxed">
                  💡 사주 정보를 변경하면 타로 카드 뽑기 시 사용자의 사주 일간(본원) 및 오행 구성, 용신 보약 데이터가 타로 해석에 실시간 자동 융합됩니다.
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSajuModal(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold hover:brightness-110"
                  >
                    저장 및 사주 반영
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
