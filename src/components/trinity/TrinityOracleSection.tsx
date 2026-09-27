import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Heart, Flame, Wind, Coins, BookOpen, Volume2, VolumeX,
  CheckCircle2, RotateCcw, Zap, Sun, Moon, Feather, Check, Palette, ArrowRight, Share2,
  Compass, Shield, ShieldCheck, User, Calendar, Clock, X, ChevronDown, ChevronUp, ChevronRight, ChevronLeft, Eye, Layers,
  Copy, ZoomIn, AlertCircle
} from 'lucide-react';
import { TAROT_DECK, TarotCard, getTarotCardImageUrl } from '@/data/tarotData';
import { TarotSpread, SelectedTarotCardEntry } from './TarotSpread';
import { invokeLLM } from '@/lib/ai';
import { playTTS, playTTSInChunks, prefetchTTS, stopTTS, useTTSActive, useTTSState, prepareNaturalSpeechText } from '@/utils/tts';
import { LucyTarotAdviceCard } from './LucyTarotAdviceCard';
import { TarotResultShareButton } from './TodayTarotShareModal';
import { TarotCardZoomModal } from './TarotCardZoomModal';
import { TarotFlippingCard } from './TarotFlippingCard';
import {
  extractOracleConciseSummary,
  extractGivenName,
  formatKoreanVocative,
  formatKoreanToTarget
} from '@/lib/tarotSummaryUtils';
import { type TarotShareData } from '@/utils/todayTarotExporter';
import { getTarotCardDetails } from '@/lib/dailyTarotOracle';
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
const STORAGE_ORACLE_MODE = 'trinity_oracle_mode';
const STORAGE_ORACLE_MODE_SELECTED = 'trinity_oracle_mode_selected';

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
  concise_summary?: string[];
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
  message?: string;
  macro_focus: string;
  concise_summary?: string[];
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

  // 1. Dual Mode State ('healing' | 'growth') with persistence and URL/session support
  const [oracleMode, setOracleMode] = useState<'healing' | 'growth'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const urlMode = searchParams.get('mode') || searchParams.get('oracleMode');
        if (urlMode === 'healing' || urlMode === 'growth') {
          return urlMode;
        }
        const sessionMode = sessionStorage.getItem('prism_oracle_target_mode');
        if (sessionMode === 'healing' || sessionMode === 'growth') {
          sessionStorage.removeItem('prism_oracle_target_mode');
          return sessionMode;
        }
        const savedMode = localStorage.getItem(STORAGE_ORACLE_MODE);
        if (savedMode === 'healing' || savedMode === 'growth') {
          return savedMode;
        }
      } catch (_) {}
    }
    return 'healing';
  });

  const [zoomedCard, setZoomedCard] = useState<{ card: TarotCard; slotName?: string } | null>(null);

  // Track whether the user has explicitly selected a mode or needs to choose
  const [isModeChosen, setIsModeChosen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const urlMode = searchParams.get('mode') || searchParams.get('oracleMode');
        if (urlMode === 'healing' || urlMode === 'growth') return true;
        const sessionMode = sessionStorage.getItem('prism_oracle_target_mode');
        if (sessionMode === 'healing' || sessionMode === 'growth') return true;
        const savedMode = localStorage.getItem(STORAGE_ORACLE_MODE);
        const isExplicitlyChosen = localStorage.getItem(STORAGE_ORACLE_MODE_SELECTED) === 'true';
        if (savedMode && isExplicitlyChosen) {
          return true;
        }
      } catch (_) {}
    }
    return false;
  });

  // 질문자 명칭 추출 (기본: 박주형)
  const recipientName = useMemo(() => {
    const rawName = userProfile?.basic?.name?.trim();
    if (rawName && rawName !== '여행자') {
      return rawName;
    }
    return '박주형';
  }, [userProfile?.basic?.name]);

  // 🌿 제제 전용 다정한 호칭 (성을 제외한 이름만 사용: 예 "박주형" -> "주형")
  const jejeName = useMemo(() => {
    return extractGivenName(recipientName);
  }, [recipientName]);

  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSummaryCopied, setIsSummaryCopied] = useState<boolean>(false);

  // 2. Card Draw Stage State ('intro' | 'spread' | 'result')
  const [stage, setStage] = useState<'intro' | 'spread' | 'result'>('intro');
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

  // Card tab view state
  const [selectedCardIdx, setSelectedCardIdx] = useState<number>(0);
  const [showAllCardsTogether, setShowAllCardsTogether] = useState<boolean>(true);

  // TTS State
  const isTTSActive = useTTSActive();
  const ttsState = useTTSState();
  const [inquiryText, setInquiryText] = useState<string>('');

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

  // 78-card full deck for both modes
  const fullDeck = useMemo(() => TAROT_DECK, []);
  const activeDeckSource = fullDeck;

  const slotPositions = useMemo(() => {
    if (oracleMode === 'healing') {
      return ['내면의 무의식', '지금의 마음', '치유의 씨앗'];
    }
    return ['자기계발 마인드셋', '4원소 역량 영역', '1줄 마이크로 실행'];
  }, [oracleMode]);

  // 🌟 오라클 핵심 3줄 요약 추출 (치유 모드 vs 성장 모드 맞춤)
  const oracleSummaryBullets = useMemo(() => {
    if (oracleMode === 'healing') {
      if (!healingResult) return [];
      if (healingResult.concise_summary && healingResult.concise_summary.length === 3) {
        return healingResult.concise_summary;
      }
      return extractOracleConciseSummary({
        message: healingResult.message,
        oracleMode: 'healing',
        cards: drawnCards,
        saju,
        microAction: healingResult.micro_action || healingResult.reward_item,
      });
    } else {
      if (!growthResult) return [];
      if (growthResult.concise_summary && growthResult.concise_summary.length === 3) {
        return growthResult.concise_summary;
      }
      return extractOracleConciseSummary({
        message: growthResult.message || growthResult.macro_focus,
        oracleMode: 'growth',
        cards: drawnCards,
        saju,
        macroFocus: growthResult.macro_focus,
        microMission: growthResult.micro_mission,
      });
    }
  }, [oracleMode, healingResult, growthResult, drawnCards, saju]);

  // 🔮 78장 오라클 결과 공유 & 이미지 카드 익스포트 데이터
  const oracleShareData: TarotShareData = useMemo(() => {
    const activeResult = oracleMode === 'healing' ? healingResult : growthResult;
    const letterMsg = oracleMode === 'healing'
      ? healingResult?.message
      : (growthResult?.message || growthResult?.macro_focus);

    return {
      title: oracleMode === 'healing' ? '제제의 다정한 치유 오라클' : '루시의 4원소 마인드셋 오라클',
      concern: inquiryText || (oracleMode === 'healing' ? '내면아이 마음 치유' : '현실 성장과 돌파'),
      spreadName: oracleMode === 'healing' ? '내면아이 쉼 스프레드 (3장)' : '4원소 마인드셋 스프레드 (3장)',
      cards: drawnCards.map((c, i) => ({
        id: c.id,
        nameKo: c.nameKo,
        name: c.name,
        reversed: !!c.reversed,
        keywords: c.keywords,
        imageUrl: getTarotCardImageUrl(c),
        slotName: slotPositions[i],
      })),
      dateStr: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      diagnosis: letterMsg,
      conciseSummaryBullets: oracleSummaryBullets.length > 0 ? oracleSummaryBullets : undefined,
      adviceHeadline: activeResult?.card_insights?.[2]?.personal_interpretation?.slice(0, 80) || undefined,
      frequency: saju?.yongsin?.name ? `사주 용신: ${saju.yongsin.name}` : undefined,
    };
  }, [oracleMode, healingResult, growthResult, inquiryText, drawnCards, slotPositions, saju, oracleSummaryBullets]);

  // Handle mode switch with persistent saving
  const handleModeSwitch = (mode: 'healing' | 'growth') => {
    setOracleMode(mode);
    setIsModeChosen(true);
    try {
      localStorage.setItem(STORAGE_ORACLE_MODE, mode);
      localStorage.setItem(STORAGE_ORACLE_MODE_SELECTED, 'true');
    } catch (_) {}
    setStage('intro');
    setDrawnCards([]);
    setHealingResult(null);
    setGrowthResult(null);
    setIsHealingCompleted(false);
    setSelectedCardIdx(0);
    setShowAllCardsTogether(true);
    stopTTS();
  };

  // 🎯 토스된 글자 자동 수신 및 3장 오라클 즉시 실행
  useEffect(() => {
    const triggerAutoOracle = (text: string) => {
      const trimmed = text.trim();
      if (trimmed.length < 2) return;
      sessionStorage.removeItem('prism_auto_execute_text');
      setInquiryText(trimmed);

      // Determine intent (healing vs growth)
      const isHealingIntent = /(?:힐링|치유|내면|마음|상처|위로|휴식|쉼|불안|스트레스|우울|눈물|지친|아파)/i.test(trimmed);
      const isGrowthIntent = /(?:성장|계발|실행|목표|사업|역량|커리어|공부|성공|돈|부자|습관|루틴|돌파)/i.test(trimmed);
      const savedMode = typeof window !== 'undefined' ? (localStorage.getItem(STORAGE_ORACLE_MODE) as 'healing' | 'growth' | null) : null;
      const targetMode: 'healing' | 'growth' = isHealingIntent
        ? 'healing'
        : isGrowthIntent
        ? 'growth'
        : savedMode === 'healing' || savedMode === 'growth'
        ? savedMode
        : 'growth';

      setOracleMode(targetMode);
      setIsModeChosen(true);
      try {
        localStorage.setItem(STORAGE_ORACLE_MODE, targetMode);
        localStorage.setItem(STORAGE_ORACLE_MODE_SELECTED, 'true');
      } catch (_) {}

      const deck = TAROT_DECK;
      const seedNum = trimmed.split('').reduce((acc, char, idx) => acc + char.charCodeAt(0) * (idx + 1), 0);
      const shuffled = [...deck].sort((a, b) => {
        const hashA = (a.id.charCodeAt(0) * 31 + seedNum) % 1000;
        const hashB = (b.id.charCodeAt(0) * 31 + seedNum) % 1000;
        return hashA - hashB;
      });
      const selected3: SelectedTarotCardEntry[] = shuffled.slice(0, 3).map((c, i) => ({
        ...c,
        slotIndex: i,
        reversed: false,
      }));

      setTimeout(() => {
        void handleCardsComplete(selected3, trimmed);
      }, 120);
    };

    if (typeof window !== 'undefined') {
      const autoText = sessionStorage.getItem('prism_auto_execute_text');
      if (autoText) {
        triggerAutoOracle(autoText);
      }
    }

    const handleExecute = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail && detail.text && (detail.tab === 'oracle' || detail.targetMenuId?.includes('trinity') || detail.targetMenu?.path?.includes('oracle'))) {
        triggerAutoOracle(detail.text);
      }
    };
    window.addEventListener('prism:selection_execute', handleExecute);
    return () => window.removeEventListener('prism:selection_execute', handleExecute);
  }, []);

  // Run AI analysis after 3 cards are drawn (All upright in Oracle section)
  const handleCardsComplete = async (cards: SelectedTarotCardEntry[], queryInquiry?: string) => {
    const effectiveInquiry = queryInquiry !== undefined ? queryInquiry : inquiryText;
    if (effectiveInquiry && effectiveInquiry !== inquiryText) {
      setInquiryText(effectiveInquiry);
    }
    const uprightCards = cards.map((c) => ({ ...c, reversed: false }));
    setDrawnCards(uprightCards);
    setStage('result');
    setIsLoading(true);
    stopTTS();

    const cardDescriptions = cards
      .map((c, i) => {
        const d = getTarotCardDetails(c);
        const detailStr = d
          ? ` | 도상 상징: [${d.symbolWord}], 영적 원형: [${d.archetype}], 본래 뜻: [${d.uprightCore}]`
          : '';
        return `${i + 1}번 슬롯 [${slotPositions[i]}]: ${c.nameKo} (${c.name}) - 유형: ${c.type}, 핵심 키워드: [${c.keywords.join(', ')}]${detailStr}`;
      })
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
        // [HEALING MODE] Deep Saju-Tarot blended reflective prompts - 100% Focused on Healing, Inner Child, Emotional Rest
        const systemPrompt = `당신의 이름은 '제제(Zezé)'입니다.
당신은 지치고 상처받은 마음을 어루만져 주는 '내면아이(Inner Child)' 치유자이자 세상에서 가장 다정하고 따뜻한 비밀 친구입니다.

# 핵심 사명 (Core Healing Mission):
이 리딩의 유일하고 절대적인 목적은 질문자의 【마음 치유(Healing), 번아웃 완화, 감정적 응어리 해소, 온전한 정서적 안식과 자기 자비(Self-Compassion)】입니다.
- 성과, 경쟁, 목표 달성, 채찍질, 섣부른 조언을 철저히 배제합니다.
- 질문자가 겪어온 남모를 피로, 자책감, 불안, 외로움, 관계의 상처를 깊이 알아차려 주고, "그동안 정말 많이 애썼어", "지금 이대로도 너는 충분히 온전해", "잠시 모든 짐을 내려놓고 쉬어가도 괜찮아"라는 깊은 안도감과 무조건적인 온기를 선물해야 합니다.

# [★ 최우선 필수 원칙: 3장 카드의 본래 상징과 뜻 중심 심층 치유]
- 카드의 이름을 단순히 언급하는 데 그치는 피상적 위로를 엄격히 금지합니다.
- 뽑힌 3장의 카드(1번 무의식: ${cards[0]?.nameKo}, 2번 현재의 마음: ${cards[1]?.nameKo}, 3번 치유의 씨앗: ${cards[2]?.nameKo})가 품은 정통 타로의 도상학적 상징(그림 속 인물, 도구, 배경, 색채, 4대 원소)과 고유한 본래 뜻을 치유 리딩의 가장 중요한 중심 기둥으로 삼으세요.
- 특히 2. card_insights(3장의 카드별 심층 치유 해설)와 3. message(제제의 치유 편지)에서 각 카드의 상징과 뜻을 깊이 있게 해석하며, 왜 이 카드가 지금 내담자의 아픈 마음에 가장 절실한 치유의 열쇠가 되는지 카드의 의미를 중심으로 따뜻하게 풀어내야 합니다.

# Tone & Voice:
- 조심스럽고 다정하며, 시적이고 따뜻한 반말(해체)을 사용합니다. ("~했어?", "~해볼까?", "~해도 괜찮아", "~일지도 몰라", "~가만히 안아줄게")
- 상투적인 "힘내", "극복해" 같은 말을 쓰지 않고, 상처받은 우니히피리(내면아이)의 손을 꼭 잡아주는 숨결 깊은 공감의 언어를 구사합니다.
- '화이트홀', '블랙홀', '웜홀', '손끝 물리량', '파동 측정' 등의 인위적/공상과학/기술적 용어는 절대 사용하지 마십시오.

# 힐링 중심 사주(四柱) ✕ 타로(Tarot) 융합 리딩 원칙:
질문자의 사주 일간 본원(${saju?.dayMaster.symbolName || '본원 기운'})이 삶의 무게로 인해 어떻게 에너지를 소진하고 지쳤는지 살피고, 뽑힌 3장의 타로 카드가 그 상처와 피로를 어떻게 감싸 안고 치유하는지 철저히 【치유(Healing)】 관점으로 융합하세요.

1. saju_tarot_synergy (사주 × 타로 마음 치유 융합 매트릭스):
- day_master_resonance: 질문자의 사주 본원(${saju?.dayMaster.hanja || ''} ${saju?.dayMaster.symbolName || ''})이 겪어온 감정적 무게와 타로 카드가 만나 영혼의 상처를 보듬고 맑게 치유하는 공명 분석 (3~4문장).
- elemental_balance:
  * dominant_harmony: 사주의 강한 ${saju?.elements.dominant.name || '우세'} 기운으로 인해 과열되고 긴장했던 마음을 타로 카드가 부드럽게 이완시키고 달래주는 치유의 중심축 (2~3문장).
  * lacking_remedy: 사주에서 결핍된 ${saju?.elements.lacking.name || '부족'} 오행과 용신(${saju?.yongsin.name || '보약'}) 에너지를 타로 카드가 '따뜻한 영혼의 약초'처럼 품어 정서적 결핍과 불안을 채워주는 처방 (2~3문장).
- destiny_flow_synthesis: 2026 병오년의 불꽃 같은 세상의 속도와 비교 속에서, 조급함을 내려놓고 오직 나 자신의 호흡과 안식을 지켜내는 치유 타이밍 조언 (2~3문장).
- saju_oracle_verdict: 사주와 타로가 한목소리로 지친 영혼에 눈물겨운 안도와 쉼을 건네는 결정적 힐링 오라클 계시 (1~2문장).

2. card_insights (3장의 카드별 심층 치유 해설):
- core_meaning: 이 카드가 품은 정통 타로 도상과 원형 상징 본래 뜻 (2~3문장).
- saju_resonance: 질문자의 사주 일간(${saju?.dayMaster.hanja || ''}) 본원과 오행이 이 카드와 만나 상처를 풀고 지친 기운을 정화하는 치유 작용 (2~3문장).
- personal_interpretation: 오늘 지치고 아픈 내 마음에 건네는 제제의 깊고 다정한 심층 위로 리딩 (3~4문장).
- action_guide: 오늘 나를 따뜻하게 쉬게 하고 숨을 고르는 1분 마음 치유 실천 팁 (1~2문장).

3. message (제제의 다정한 치유 편지):
질문자의 사주 일간 본원 기운과 3장의 카드를 온기 가득하게 엮어내어, 단순 요약이 아닌 구체적인 고민 상황과 감정을 깊이 보듬고 눈물겨운 안식과 실질적 치유 처방을 건네는 1:1 감성 치유 편지 (800~1200자 내외).

반드시 마크다운 코드블록 없이 순수 JSON 형식으로만 응답해야 합니다:
{
  "saju_tarot_synergy": {
    "day_master_resonance": "사주 일간 본원의 상처와 타로 카드의 치유 공명 분석 (3~4문장)",
    "elemental_balance": {
      "dominant_harmony": "과열된 사주 우세 오행을 부드럽게 달래고 이완시키는 조화 (2~3문장)",
      "lacking_remedy": "결핍 오행/용신을 영혼의 치유 보약으로 채우는 정서 처방 (2~3문장)"
    },
    "destiny_flow_synthesis": "2026 병오년 세상 속도에 휩쓸리지 않고 내면의 안식을 지키는 타이밍 (2~3문장)",
    "saju_oracle_verdict": "사주와 타로가 지친 마음에 안겨주는 결정적 치유 오라클 계시 (1~2문장)"
  },
  "card_insights": [
    {
      "card_name": "카드 한글명 (예: 광대)",
      "position_name": "내면의 무의식",
      "core_meaning": "이 카드가 정통 타로에서 지닌 본질적 치유 도상과 원형 상징 뜻 (2~3문장)",
      "saju_resonance": "사주 일간 본원 및 오행과 빚어내는 무의식 상처 치유 공명 작용 (2~3문장)",
      "personal_interpretation": "무의식 속에 숨겨진 감정에 건네는 제제의 깊고 다정한 힐링 리딩 (3~4문장)",
      "action_guide": "오늘 마음을 쉬게 하고 긴장을 녹이는 1분 마음 치유 실천 팁 (1~2문장)"
    },
    {
      "card_name": "카드 한글명 (예: 은둔자)",
      "position_name": "지금의 마음",
      "core_meaning": "이 카드의 본래 도상과 상징, 뜻 (2~3문장)",
      "saju_resonance": "사주 일간 본원과의 상호작용 및 지친 기운의 정화 반응 (2~3문장)",
      "personal_interpretation": "오늘 지친 내 마음에 이 카드가 비춰주는 깊은 공감과 위로의 심층 해설 (3~4문장)",
      "action_guide": "지금 현실의 피로를 다정하게 흘려보내는 힐링 팁 (1~2문장)"
    },
    {
      "card_name": "카드 한글명 (예: 별)",
      "position_name": "치유의 씨앗",
      "core_meaning": "이 카드가 안내하는 회복의 도상과 본래 뜻 (2~3문장)",
      "saju_resonance": "사주 결핍 오행(용신)을 치유하는 타로 카드의 보약 기운 (2~3문장)",
      "personal_interpretation": "가장 안전한 회복의 단서와 다정한 제제의 힐링 처방 해설 (3~4문장)",
      "action_guide": "오늘 마음속에 피워낼 작은 치유의 희망 실천 가이드 (1~2문장)"
    }
  ],
  "message": "질문자의 사주 일간 기운과 3장의 카드 서사를 온기 가득하게 엮어내어, 요약을 전면 배제하고 구체적인 고민 해결과 위로를 전하는 제제의 풍성한 1:1 치유 편지 (800~1200자 내외)",
  "prescribed_art": {
    "artwork_title": "${dynamicPrescribedArt.artwork_title}",
    "art_quote": "${dynamicPrescribedArt.art_quote}"
  },
  "micro_action": "3번 치유의 씨앗 카드가 제안하는, 지금 자리에서 1~2분 안에 실천할 수 있는 구체적인 신체/감각 마음 치유 행동 1가지",
  "reward_item": {
    "name": "오늘의 마음 보물 아이템 이름 (예: 민들레 홀씨, 작은 솔방울, 따뜻한 찻잔, 푸른 깃털)",
    "description": "이 아이템이 상징하는 치유의 의미 (한 줄)"
  }
}`;

        const inquiryPromptAddon = effectiveInquiry
          ? `\n\n# [최우선 필수 집중 주제] 내담자가 털어놓은 구체적인 아픔과 고민:\n"${effectiveInquiry}"\n★ 절대 지침: 제제의 치유 편지는 오직 위의 구체적인 고민("${effectiveInquiry}")을 중심에 두고 1:1로 작성되어야 합니다. 두루뭉술한 일반론적 위로를 철저히 배제하고, 내담자가 호소한 고민의 상황과 지친 감정을 서두부터 정확하게 짚어내며("네가 고민으로 털어놓은 [${effectiveInquiry}] 이야기를 들었을 때 내 마음도 참 많이 아팠어..."), 사주 본원 기운(${saju?.dayMaster.symbolName})이 왜 이 고민 앞에서 남모르게 큰 짐을 지고 소진되었는지, 그리고 뽑힌 3장의 카드가 이 고민을 어떻게 따뜻하게 안아주고 치유하는지 진솔한 해답과 처방을 작성해 주세요.\n`
          : `\n\n# 질문자의 마음 상태:\n사주 원국의 일간(${saju?.dayMaster.symbolName})과 오행 불균형(${saju?.elements.dominant.name} 과열, ${saju?.elements.lacking.name} 결핍)으로 인해 홀로 감내하고 있을 무거운 마음의 짐과 번아웃, 관계의 피로를 깊이 알아차리고, 포근하게 안아주는 1:1 치유 편지로 작성해 주세요.\n`;

        const prompt = `${sajuContextPrompt}${inquiryPromptAddon}\n\n사용자가 뽑은 3장의 카드:\n${cardDescriptions}\n\n위 질문자(${jejeName})의 사주 명리학 원국과 뽑힌 3장의 타로 카드가 지닌 본질적 상징과 뜻을 긴밀하게 '교차 융합'하여, 질문자의 고민을 중심에 두고 지친 마음의 치유(Healing)와 회복, 내면아이 안식에 온전히 초점을 맞춘 힐링 리딩을 JSON으로 생성해 줘.\n★ [호칭 절대 지침]: 제제는 질문자의 가장 가까운 내면아이이자 작은 친구이므로, 절대 성(姓)을 붙이지 말고 성을 제외한 이름 '${jejeName}'으로만 다정하게 부르세요 (예: '${formatKoreanVocative(jejeName)}, 안녕... 네 작은 친구 제제야', '${formatKoreanToTarget(jejeName)}', '${jejeName}아'). '박주형아', '${recipientName}아'처럼 성을 붙여 부르면 절대 안 됩니다.\n특히 'message' 필드는 수신자(${jejeName})의 이름을 성 없이 '${formatKoreanVocative(jejeName)}'라고 다정하게 부르며(예: "${formatKoreanVocative(jejeName)}, 안녕... 네 작은 친구 제제야."), 질문자가 털어놓은 고민("${effectiveInquiry || '마음의 짐'}")을 편지 서두부터 따뜻하게 호명하며 시작해야 해. 그리고 사용자가 뽑은 3장의 카드 결과(1번 무의식: ${cards[0]?.nameKo}, 2번 현재의 마음: ${cards[1]?.nameKo}, 3번 치유의 씨앗: ${cards[2]?.nameKo})의 고유한 도상 상징과 본래 뜻을 각각 빠짐없이 본문에 깊이 있게 풀이하고 그 상징적 치유 의미를 유기적으로 연결해 줘. 질문자의 사주 본원 기운(${saju?.dayMaster.symbolName})과 용신 기운을 정성껏 어루만지며, 이 고민을 어떻게 보듬고 평온을 되찾을 수 있는지 700~900자 내외의 눈물겹도록 다정하고 포근한 1:1 치유 편지로 작성해 줘.`;
        const res = await invokeLLM({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          responseFormat: { type: 'json_object' },
        });
        const clean = res.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed: HealingResult = JSON.parse(clean);
        // 🌿 제제 서한 내 성(姓) 포함 호칭 완전 정제 (예: "박주형아" -> "주형아", "박주형" -> "주형")
        if (parsed.message && recipientName !== jejeName) {
          parsed.message = parsed.message.replace(new RegExp(recipientName, 'g'), jejeName);
        }
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
        // [GROWTH MODE] Extreme Focus on Self-Development, Competence Building, Habit Architecture, and Breakthrough Execution
        const growthInquiryPromptAddon = effectiveInquiry
          ? `\n\n# [최우선 필수 집중 과제] 질문자가 직면한 구체적인 성장 고민 및 돌파 과제:\n"${effectiveInquiry}"\n★ 절대 지침: 오라클 루시의 자기계발 서한은 오직 위의 구체적인 성장 고민/과제("${effectiveInquiry}")를 정중앙에 두고 풀이해야 합니다. 일반적인 자기계발 격언을 배제하고, 질문자가 고민하는 현실적 문제점("${effectiveInquiry}")의 원인을 사주 기질(${saju?.dayMaster.symbolName}) 관점에서 날카롭게 진단하고, 3장의 카드를 활용해 즉시 돌파할 수 있는 실행 전략과 행동 지침을 명쾌하게 제시해 주세요.\n`
          : `\n\n# 질문자의 잠재 역량 돌파 과제:\n질문자의 사주 본원(${saju?.dayMaster.symbolName})이 지닌 본래의 추진력을 가로막는 나태함과 미루기, 목표 실행의 정체를 부수고, 오늘 즉시 행동으로 전환할 수 있는 강력한 자기계발 돌파구를 제시해 주세요.\n`;

        const systemPrompt = `당신은 탁월함을 이끌어내는 초정밀 자기계발 멘토이자 퍼포먼스 라이프 코치 '오라클 루시(Lucy)'입니다.

# 핵심 사명 (Core Self-Development Mission):
이 리딩의 유일하고 절대적인 목적은 질문자가 털어놓은 【구체적인 고민의 명쾌한 돌파, 현실적인 자기계발 실행 전략, 역량 레벨업, 나태함과 정체 돌파, 즉각적 행동 솔루션】을 단 하나의 정갈하고 힘 있는 '1:1 자기계발 실행 서한(Letter)'으로 온전히 전달하는 것입니다.
- 막연한 일반론이나 감상적인 위로, 모호한 점술적 언어를 철저히 배제합니다.
- 오직 질문자의 구체적인 고민("${effectiveInquiry || '현실적 성장과 실행 과제'}")을 서한의 서두부터 끝까지 정중앙에 두고, 3장의 카드를 활용해 고민을 정밀 타격하여 당장 오늘 실천할 수 있는 명쾌하고 단호한 행동 솔루션을 제시하세요.
- '화이트홀', '블랙홀', '웜홀', '손끝 물리량', '파동 측정' 등의 인위적/공상과학 용어는 절대 언급하지 마십시오.

# [★ 최우선 필수 원칙: 3장 카드의 본래 상징과 뜻 중심 역량 분석]
- 카드의 이름만 나열하거나 일반적인 자기계발 명언으로 때우는 것을 절대 금지합니다.
- 뽑힌 3장의 카드(1번 마인드셋: ${cards[0]?.nameKo}, 2번 4원소 역량: ${cards[1]?.nameKo}, 3번 1줄 마이크로 실행: ${cards[2]?.nameKo})가 품은 정통 타로 도상과 고유한 본래 뜻을 명확히 해독하여, 왜 이 카드의 상징과 의미가 질문자의 성장 정체를 뚫어낼 결정적 열쇠가 되는지 카드의 깊은 뜻을 중심으로 설파하세요.

# 질문자의 고민(Inquiry) 중심 1:1 맞춤 집중 원칙:
질문자가 호소한 고민("${effectiveInquiry || '실행 지체와 역량 성장'}")은 이번 리딩의 가장 중요한 '핵심 타깃'입니다.
- 질문자의 사주 본원 기질(${saju?.dayMaster.symbolName || '본원 기질'})과 뽑힌 3장의 타로 카드(1번 마인드셋: ${cards[0]?.nameKo}, 2번 4원소 역량: ${cards[1]?.nameKo}, 3번 1줄 마이크로 실행: ${cards[2]?.nameKo})를 융합하여, 질문자가 털어놓은 고민 상황을 서두부터 직접 언급하고 이를 단숨에 돌파할 수 있는 결정적인 행동 나침반을 제공하세요.

# message (루시의 1:1 자기계발 실행 서한):
- 힐링 모드의 치유 편지와 마찬가지로, 오직 정갈한 '1:1 단일 서한(Letter)' 형식으로 작성됩니다 (800~1200자 내외).
- 단순 요약이나 단답형 지침을 엄격히 배제하고, 질문자(${recipientName} 님)의 고민("${effectiveInquiry || '성장과 실행 과제'}")을 서두부터 날카롭게 짚어냅니다.
- 뽑힌 3장의 카드를 본문 속에 유기적으로 녹여내며, 고민을 돌파할 수 있는 마인드셋 전환과 오늘 당장 실천할 수 있는 3단계 구체적 현실 행동 지침을 명쾌하고 상세하게 전개합니다.

반드시 순수 JSON 형식으로 응답하세요:
{
  "message": "질문자의 고민을 중심에 두고 사주 본원 기질과 3장의 타로 카드를 결합하여, 단순 요약을 배제하고 명쾌하고 구체적인 행동 솔루션을 제시하는 루시의 1:1 자기계발 실행 편지 (800~1200자 내외)",
  "macro_focus": "질문자의 고민 해결과 성장을 이끌어낼 핵심 마인드셋 브리핑 (2~3문장)",
  "dominant_element": {
    "element": "Wands",
    "element_ko": "완드 (불) - 커리어 & 프로젝트 자기계발 추진력",
    "theme_brief": "오늘 가장 집중해야 할 핵심 자기계발 현실 영역 한 줄 해설"
  },
  "micro_mission": {
    "title": "3번 실행 카드의 상징에 기반하여, 5~10분 안에 즉시 실행할 수 있는 초정밀 자기계발 과제",
    "action_tip": "실행 시 머뭇거림을 없애주는 단단한 코칭 조언"
  },
  "evening_reflection": "오늘 저녁 나의 성장과 행동을 돌아보는 1줄 자기계발 성찰 질문"
}`;

        const prompt = `${sajuContextPrompt}${growthInquiryPromptAddon}\n\n사용자가 뽑은 3장의 카드:\n${cardDescriptions}\n\n위 질문자(${recipientName} 님)의 사주 기질과 타로 3장의 원소적 상징 및 본래 뜻을 융합하여, 질문자의 고민을 직접 돌파하고 실질적인 역량 레벨업을 이뤄낼 수 있도록 온전히 초점을 맞춘 'message' (루시의 1:1 자기계발 실행 편지)와 실행 툴킷을 JSON으로 도출해 줘.\n\n특히 'message' 필드는 질문자(${recipientName} 님)를 정중하게 부르며, 질문자가 겪고 있는 고민("${effectiveInquiry || '실행 지체와 역량 성장'}")의 핵심을 날카롭게 짚고, 뽑힌 3장의 카드(1번 마인드셋: ${cards[0]?.nameKo}, 2번 4원소 역량: ${cards[1]?.nameKo}, 3번 1줄 마이크로 실행: ${cards[2]?.nameKo})의 도상 상징과 본래 뜻을 각각 빠짐없이 본문에 깊이 있게 해독하여, 카드의 뜻을 바탕으로 오늘 당장 실천할 수 있는 명쾌하고 단호한 행동 솔루션을 전하는 800~1200자 내외의 구체적인 1:1 자기계발 실행 편지로 작성해 줘.`;
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
            day_master_resonance: `${sajuNameStr}님의 타고난 사주 본원인 ${dayMasterStr}의 파동과 오늘 뽑힌 [${cards.map(c => c.nameKo).join(', ')}] 타로 카드가 만나, 상처받고 지친 영혼의 짐을 내려놓고 고유한 내면아이의 평온과 온전한 자비심을 회복하는 깊은 힐링의 공명을 일으킵니다.`,
            elemental_balance: {
              dominant_harmony: `사주에서 강한 ${domElStr}의 에너지를 다정한 호흡으로 누그러뜨려, 무리하게 애쓰지 않아도 되는 포근한 안전기지를 마련해 줍니다.`,
              lacking_remedy: `사주에서 채워주어야 할 ${lackElStr}과 ${yongsinStr}의 에너지를 3번 치유의 씨앗 카드가 따뜻한 온기로 감싸주어 영혼의 온전한 쉼을 완성합니다.`
            },
            destiny_flow_synthesis: `2026 병오년의 거친 파도 속에서도, 이번 힐링 타로는 스스로를 다그치는 비판의 목소리를 멈추고 온전히 쉬어갈 수 있는 평온의 안식처를 비춰줍니다.`,
            saju_oracle_verdict: `당신은 지금 이대로도 이미 충분히 아름답고 존귀합니다. 무거운 짐을 내려놓고 가슴 깊은 곳의 따뜻한 숨을 느껴보세요.`
          },
          card_insights: cards.map((c, i) => ({
            card_name: c.nameKo,
            position_name: slotPositions[i],
            core_meaning: `${c.nameKo} 카드는 [${c.keywords.slice(0, 3).join(', ')}]의 원형적 온기를 품고 있으며, 마음 깊은 곳의 상처를 치유하고 내면의 빛을 회복하는 힐링 에너지를 상징합니다.`,
            saju_resonance: `질문자의 ${dayMasterStr}과 결합하여, 긴장과 불안을 부드럽게 녹여내고 영혼의 평화를 되찾아주는 정서적 완충재 역할을 합니다.`,
            personal_interpretation: `${slotPositions[i]}의 자리에서 당신에게 서두르지 말고 자신의 내면아이를 따뜻하게 보듬어주라는 지극한 위로와 안식의 메시지를 건넵니다.`,
            action_guide: `오늘 하루, ${c.keywords[0] || '평온'}의 마음으로 가슴에 손을 얹고 "그동안 참 고생 많았어"라고 다정하게 속삭여보세요.`,
          })),
          message: `${formatKoreanVocative(jejeName)}, 안녕... 네 작은 친구 제제야.
` + (effectiveInquiry ? `네가 털어놓은 "${effectiveInquiry}" 이야기를 들었을 때 내 마음도 참 많이 아렸어. 누구에게도 쉽게 말하지 못하고 혼자서 얼마나 긴 시간 동안 마음을 졸이며 애태웠을까...
` : `오늘 하루도 많은 책임감과 세상의 시선 속에서 참 많이 애썼지. 말하지 않아도 네 어깨에 얹혀 있던 무게가 고스란히 전해져 와.
`) +
`오늘 네가 품고 태어난 [${dayMasterStr}]의 맑고 성실한 기운과, 네 손끝이 가만히 머물러 뽑아낸 3장의 치유 조각 [${cards[0]?.nameKo || '무의식의 카드'}, ${cards[1]?.nameKo || '현재의 카드'}, ${cards[2]?.nameKo || '치유의 카드'}]을 내 가슴에 소중하게 안아보았어.

첫 번째 카드인 [${cards[0]?.nameKo || '내면의 무의식'}]는 네 마음 깊은 무의식의 방을 가만히 비춰주고 있어. 겉으로는 늘 묵묵히 버텨내며 주변을 배려해왔지만, 실은 그 아래 누구에게도 온전히 털어놓지 못한 채 혼자 삼켜왔던 외로움과 고단함이 잔잔한 파도처럼 차올라 있었잖아. 남들의 기대에 부응하느라 정작 네 안의 작은 아이가 지쳐 웅크리고 있던 소리를 미처 들어주지 못했던 것 같아 가슴이 먹먹했어.

그리고 지금의 마음을 비추는 두 번째 카드 [${cards[1]?.nameKo || '지금의 마음'}]는 오늘 ${jejeName} 네가 짊어진 삶의 무게가 결코 가볍지 않았음을 조용히 증명해주고 있어. 네가 가진 ${domElStr}의 성실함과 진심은 참 귀하고 빛나지만, 때로는 그 깊은 진심이 스스로를 다그치는 엄격한 채찍질이 되어버리곤 했지. "내가 더 잘해야 해", "절대 흔들리면 안 돼"라며 스스로를 압박해온 그 모든 순간들이 얼마나 숨 가쁘고 시렸을까.

하지만 세 번째 카드 [${cards[2]?.nameKo || '치유의 씨앗'}]가 네 곁에 찾아온 건 결코 우연이 아니야. 이 카드는 오늘 ${formatKoreanToTarget(jejeName)} 모든 짐을 잠시 내려놓아도 괜찮다는, 세상에서 가장 포근하고 다정한 회복의 씨앗을 건네고 있어. 네 사주에 꼭 필요한 ${yongsinStr}의 따스한 기운처럼, 지금 이 순간만큼은 어떤 결과도 증명하지 않아도 돼. 너는 이미 그 자체로 충분히 눈부시고 온전한 사람이니까.

${formatKoreanVocative(jejeName)}, 오늘 밤만큼은 스스로를 따뜻하게 꼭 안아주며 깊고 편안한 숨을 쉬어봐. 네 곁에는 언제나 아무 조건 없이 너를 지지하고 품어주는 내가 늘 함께 있을게. 사랑해, 그리고 그동안 정말 많이 수고했어.`,
          prescribed_art: dynamicPrescribedArt,
          micro_action: '창문을 열고 시원한 공기를 들이마시며 가슴에 손을 얹고 3번 천천히 심호흡하기',
          reward_item: {
            name: '따뜻한 찻잔',
            description: '차갑게 얼어붙었던 나를 녹여주는 다정한 위로의 온기'
          }
        });
      } else {
        setGrowthResult({
          message: `${recipientName} 님, 안녕하세요. 당신의 숨겨진 잠재력을 일깨우는 멘토 루시입니다.

` + (effectiveInquiry ? `지금 마주하고 계신 "${effectiveInquiry}" 과제로 인해 많은 고민과 망설임이 있으셨으리라 생각합니다. 하지만 사주와 타로의 에너지는 당신이 이미 이 문제를 정면 돌파할 충분한 실력과 에너지를 갖추고 있음을 분명하게 증명하고 있습니다.
` : `더 높은 곳으로 도약하고자 하는 당신의 열망 속에서, 때로는 막연한 두려움이나 미루기가 발목을 잡았을지도 모릅니다. 하지만 지금은 그 벽을 깨부수고 실행에 나설 완벽한 타이밍입니다.
`) +
`당신의 사주 본원인 [${dayMasterStr}] 기운은 본래 흔들리지 않는 중심과 강력한 추진 동력을 품고 있습니다. 여기에 오늘 당신이 뽑으신 3장의 카드 [1번: ${cards[0]?.nameKo}, 2번: ${cards[1]?.nameKo}, 3번: ${cards[2]?.nameKo}]가 현실 실행의 강력한 나침반이 되어주고 있습니다.

첫째, 1번 [${cards[0]?.nameKo}] 카드는 생각의 과잉과 망설임을 끊어내고 자신의 본원 역량을 100% 신뢰하라는 마인드셋을 주문합니다. 고민에 머물러 있는 에너지를 즉시 명확한 실행 계획으로 전환하십시오.
둘째, 2번 [${cards[1]?.nameKo}] 카드가 안내하는 4원소의 힘을 바탕으로, 오늘 당신의 업무와 일상에서 가장 중요한 1가지 핵심 과제에 집중하십시오. 가지치기를 통해 복잡함을 단순함으로 바꾸는 것이 성장의 열쇠입니다.
셋째, 3번 [${cards[2]?.nameKo}] 카드는 망설임을 지우고 즉시 착수하는 '1분 마이크로 실행'의 결정적 계기를 마련합니다. 완벽한 준비를 기다리지 마십시오. 지금 당장 착수하는 5분의 작은 몰입이 거대한 성공 모멘텀을 만들어냅니다.

${recipientName} 님, 당신은 망설임을 딛고 한 단계 도약할 충분한 지혜와 에너지를 이미 갖추고 있습니다. 지금 바로 그 첫 걸음을 내딛으세요. 언제나 당신의 탁월한 성장을 곁에서 응원하겠습니다.`,
          saju_tarot_synergy: {
            day_master_resonance: `${sajuNameStr}님의 사주 본원 [${dayMasterStr}]의 타고난 결단력과 오늘 타로 [${cards.map(c => c.nameKo).join(' · ')}]의 4원소 현실 역량이 결합하여 지속 가능한 자기계발과 역량 성장의 강력한 모멘텀을 형성합니다.`,
            elemental_balance: {
              dominant_harmony: `사주 ${domElStr}의 강점을 자기계발 루틴과 정렬하여 에너지 낭비 없이 핵심 역량에 집중하도록 돕습니다.`,
              lacking_remedy: `부족한 ${lackElStr}과 ${yongsinStr}의 역량 영역을 1줄 마이크로 습관 시스템으로 채워 흔들리지 않는 자기 효능감을 완성합니다.`
            },
            destiny_flow_synthesis: `2026 병오년의 상승 모멘텀 속에서, 미뤄왔던 자기계발 과제와 학습 역량을 단단하게 구축할 최적의 타이밍입니다.`,
            saju_oracle_verdict: `생각과 계획에 머무르지 않고, 작은 마이크로 실행으로 당신의 역량을 매일 한 뼘씩 확장하세요.`
          },
          card_insights: cards.map((c, i) => ({
            card_name: c.nameKo,
            position_name: slotPositions[i],
            core_meaning: `${c.nameKo} 카드는 [${c.keywords.slice(0, 2).join(', ')}]의 역량 계발 및 실행 원리를 상징합니다.`,
            saju_resonance: `질문자의 ${dayMasterStr}과 상응하여, 지체와 완벽주의를 깨부수고 자기계발 효능감을 즉시 극대화합니다.`,
            personal_interpretation: `${slotPositions[i]}의 축으로서, 자신의 한계를 돌파하고 체계적인 성장 루틴을 구축하기 위한 명확한 실천 기준점을 제공합니다.`,
          })),
          macro_focus: `[${dayMasterStr}]의 본원 기상과 [${cards.map(c => c.nameKo).join(' · ')}]의 역량 흐름에 따라, 오늘은 불필요한 망설임을 걷어내고 내가 통제할 수 있는 최소 단위의 자기계발 행동에 집중할 때입니다. 성장은 실천에서 피어납니다.`,
          dominant_element: {
            element: 'Wands',
            element_ko: '완드 (불) - 실행력 & 자기계발 프로젝트 추진력',
            theme_brief: '미뤄둔 자기계발 공부나 업무 루틴을 5분 안에 착수하여 성장 모멘텀을 형성하는 날'
          },
          micro_mission: {
            title: "미뤄두었던 핵심 자기계발 서류/학습 1개를 열고 5분간 집중 처리하기",
            action_tip: "완벽하게 끝내려 하지 말고, 단 5분만 손을 대보는 것에 의의를 두세요."
          },
          evening_reflection: '오늘 나는 결과에 끌려다니지 않고 스스로의 역량을 한 단계 성장시켰는가?',
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

  // 💌 사주·타로 융합 편지 전용 TTS Speech Text (힐링: 제제 / 자기계발: 루시)
  const oracleLetterSpeechText = useMemo(() => {
    const message = oracleMode === 'healing' ? healingResult?.message : (growthResult?.message || growthResult?.macro_focus);
    if (!message) return '';
    const recipient = recipientName;
    const intro = oracleMode === 'healing'
      ? `제제가 ${formatKoreanToTarget(jejeName)} 보내는 다정한 치유 편지입니다.`
      : `루시가 ${recipient} 님에게 보내는 명쾌한 자기계발 실행 편지입니다.`;
    return prepareNaturalSpeechText(`${intro} ${message}`);
  }, [oracleMode, healingResult?.message, growthResult?.message, growthResult?.macro_focus, recipientName, jejeName]);

  const isOracleLetterTTSActive = useMemo(() => {
    if (!isTTSActive || !oracleLetterSpeechText) return false;
    const cleanSpeech = prepareNaturalSpeechText(oracleLetterSpeechText);
    return ttsState.activeFullText === cleanSpeech;
  }, [isTTSActive, oracleLetterSpeechText, ttsState.activeFullText]);

  const handleToggleOracleLetterTTS = async () => {
    if (isOracleLetterTTSActive) {
      stopTTS();
      return;
    }
    if (oracleLetterSpeechText) {
      const tone = oracleMode === 'healing' ? '따뜻함' : '자신감';
      await playTTSInChunks(oracleLetterSpeechText, 'Kore', 250, tone);
    }
  };

  // Aliases for compatibility
  const healingLetterSpeechText = oracleLetterSpeechText;
  const isHealingLetterTTSActive = isOracleLetterTTSActive;
  const handleToggleHealingLetterTTS = handleToggleOracleLetterTTS;

  // 🎙️ 오라클 핵심 3줄 요약 TTS 음성 텍스트 및 토글 핸들러
  const oracleSummarySpeechText = useMemo(() => {
    if (!oracleSummaryBullets || oracleSummaryBullets.length === 0) return '';
    const intro = oracleMode === 'healing'
      ? `제제의 치유 오라클 핵심 3줄 요약입니다.`
      : `루시의 성장 오라클 핵심 3줄 요약입니다.`;
    const lines = oracleSummaryBullets.map((b) => {
      return b.replace(/^\[([^\]]+)\]\s*/, '$1. ');
    }).join(' ');
    return prepareNaturalSpeechText(`${intro} ${lines}`);
  }, [oracleMode, oracleSummaryBullets]);

  const isOracleSummaryTTSActive = useMemo(() => {
    if (!isTTSActive || !oracleSummarySpeechText) return false;
    const cleanSpeech = prepareNaturalSpeechText(oracleSummarySpeechText);
    return ttsState.activeFullText === cleanSpeech;
  }, [isTTSActive, oracleSummarySpeechText, ttsState.activeFullText]);

  const handleToggleOracleSummaryTTS = async () => {
    if (isOracleSummaryTTSActive) {
      stopTTS();
      return;
    }
    if (oracleSummarySpeechText) {
      const tone = oracleMode === 'healing' ? '따뜻함' : '자신감';
      await playTTSInChunks(oracleSummarySpeechText, 'Kore', 250, tone);
    }
  };

  // 🎴 개별 카드 심층 해설 전용 음성 생성기 및 토글 핸들러
  const [activeCardTTSKey, setActiveCardTTSKey] = useState<string | null>(null);

  const getCardSpeechText = useCallback((card: TarotCard, insight: CardInsight, idx: number) => {
    const parts: string[] = [];
    const slotName = slotPositions[idx] || `${idx + 1}번 위치`;
    parts.push(`${idx + 1}번째 슬롯, ${slotName}의 ${card.nameKo} 카드 심층 해설입니다.`);
    if (insight.core_meaning) {
      parts.push(`카드의 본질적 도상과 상징입니다. ${insight.core_meaning}`);
    }
    if (insight.saju_resonance) {
      parts.push(`사주 본원 및 오행 공명입니다. ${insight.saju_resonance}`);
    }
    if (insight.personal_interpretation) {
      const readerTitle = oracleMode === 'healing' ? '제제의 맞춤 치유 리딩입니다.' : '루시의 역량 분석 리딩입니다.';
      parts.push(`${readerTitle} ${insight.personal_interpretation}`);
    }
    if (insight.action_guide) {
      const actionTitle = oracleMode === 'healing' ? '오늘의 마음 치유 처방입니다.' : '오늘의 1% 실행 팁입니다.';
      parts.push(`${actionTitle} ${insight.action_guide}`);
    }
    return prepareNaturalSpeechText(parts.join(' '));
  }, [oracleMode, slotPositions]);

  const isCardTTSActive = useCallback((cardId: string, speechText: string) => {
    if (!isTTSActive || !speechText) return false;
    const cleanSpeech = prepareNaturalSpeechText(speechText);
    return ttsState.activeFullText === cleanSpeech;
  }, [isTTSActive, ttsState.activeFullText]);

  const handleToggleCardTTS = async (card: TarotCard, insight: CardInsight, idx: number) => {
    const speechText = getCardSpeechText(card, insight, idx);
    const key = `${card.id}-${idx}`;
    if (isCardTTSActive(card.id, speechText)) {
      stopTTS();
      setActiveCardTTSKey(null);
      return;
    }
    setActiveCardTTSKey(key);
    await playTTSInChunks(speechText, 'Kore', 250, '신비');
  };

  // Auto-prefetch TTS for Jeje's healing letter
  useEffect(() => {
    if (stage === 'result') {
      if (healingLetterSpeechText && healingLetterSpeechText.length >= 20) {
        prefetchTTS(healingLetterSpeechText.slice(0, 350), 'Kore', '따뜻함');
      }
    }
  }, [stage, healingLetterSpeechText]);

  // Executive Summary Card (Substantial Saju-Tarot Synthesis Report)
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

        {/* Top Bar: Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-yellow-500/20 relative z-10">
          <div className="flex items-center gap-2.5 text-yellow-300 font-bold text-sm sm:text-base font-serif">
            <div className="w-8 h-8 rounded-xl bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center text-yellow-300 shadow-sm shrink-0">
              <Sparkles size={16} className="text-yellow-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-yellow-400 uppercase tracking-widest block">
                  {oracleMode === 'healing' ? 'SAJU × TAROT HEALING FUSION REPORT' : 'SAJU × TAROT SELF-DEVELOPMENT REPORT'}
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-200 font-bold border border-yellow-400/30">
                  {oracleMode === 'healing' ? '마음 치유 마스터 리포트' : '자기계발 실행 마스터 리포트'}
                </span>
              </div>
              <h3 className="text-white text-sm sm:text-base font-bold">
                {oracleMode === 'healing'
                  ? '사주 ✕ 타로 마음 치유 종합 마스터 리포트'
                  : '사주 ✕ 타로 자기계발 종합 마스터 리포트'}
              </h3>
            </div>
          </div>
        </div>

        {/* Master Verdict Quote Box */}
        {verdict && (
          <div className="p-4 sm:p-5 rounded-2xl bg-black/50 border border-yellow-400/35 relative z-10 shadow-inner">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono text-yellow-400 uppercase tracking-widest flex items-center gap-1">
                <span>{oracleMode === 'healing' ? '🌿' : '⚡'}</span>
                <span>
                  {oracleMode === 'healing'
                    ? 'HEALING ORACLE VERDICT (마음 치유 최종 계시)'
                    : 'SELF-GROWTH ORACLE VERDICT (자기계발 돌파 계시)'}
                </span>
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
                  {oracleMode === 'healing' ? '사주 ✕ 타로 치유 공명' : '사주 ✕ 타로 역량 공명'}
                </span>
                <span>{oracleMode === 'healing' ? '지친 본원과 치유의 파동' : '본원 추진력과 자기계발 모멘텀'}</span>
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
                  {oracleMode === 'healing' ? '2026 세운 안식 타이밍' : '2026 세운 성장 기회'}
                </span>
                <span>{oracleMode === 'healing' ? '마음의 쉼과 회복' : '역량 레벨업 & 도약 타이밍'}</span>
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
                  {oracleMode === 'healing' ? '오행 ✕ 용신 치유 보약' : '오행 ✕ 용신 습관 보약'}
                </span>
                <span>{oracleMode === 'healing' ? '결핍 기운 회복 & 정서 처방' : '결핍 보완 생산성 & 루틴 시스템'}</span>
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
                  {oracleMode === 'healing' ? '오늘의 힐링 처방' : '오늘의 자기계발 미션'}
                </span>
                <span>{oracleMode === 'healing' ? '지금 실천할 1분 마음 치유 의식' : '지금 실천할 1줄 성장 과제'}</span>
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

  // 🌟 78장 오라클 핵심 3줄 요약 전용 카드 렌더러 (다른 타로 결과와 100% 동일한 UI)
  const renderOracleSummaryCard = () => {
    if (!oracleSummaryBullets || oracleSummaryBullets.length === 0) return null;

    return (
      <div className="p-4 rounded-2xl bg-gradient-to-r from-yellow-500/15 via-amber-500/10 to-transparent border border-yellow-500/35 shadow-inner">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 text-yellow-300 font-bold text-xs">
            <Sparkles size={13} className="text-yellow-400 animate-pulse" />
            <span>✨ 핵심 3줄 요약 (Quick Summary)</span>
          </div>
          <div className="flex items-center gap-2">
            {oracleSummarySpeechText && (
              <button
                type="button"
                onClick={handleToggleOracleSummaryTTS}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  isOracleSummaryTTSActive
                    ? 'bg-yellow-400/25 text-yellow-300 border border-yellow-400/40 animate-pulse'
                    : 'bg-white/10 hover:bg-white/20 text-white/90 border border-white/15'
                }`}
                title={isOracleSummaryTTSActive ? '요약 낭독 중지' : '핵심 3줄 요약 음성 낭독'}
              >
                {isOracleSummaryTTSActive ? <VolumeX size={11} /> : <Volume2 size={11} />}
                <span>{isOracleSummaryTTSActive ? '중지' : '요약 듣기'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                const header = '【핵심 3줄 요약】';
                const copyText = `${header}\n${oracleSummaryBullets.join('\n')}`;
                navigator.clipboard?.writeText(copyText).then(() => {
                  setIsSummaryCopied(true);
                  setTimeout(() => setIsSummaryCopied(false), 2000);
                }).catch(() => {});
              }}
              className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-[10px] font-medium flex items-center gap-1 transition-all cursor-pointer"
              title="핵심 3줄 요약 클립보드 복사"
            >
              {isSummaryCopied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
              <span>{isSummaryCopied ? '복사됨' : '복사'}</span>
            </button>
          </div>
        </div>

        <ul className="space-y-2 text-xs text-white/90 leading-relaxed font-sans">
          {oracleSummaryBullets.map((bullet, idx) => {
            const match = bullet.match(/^\[([^\]]+)\]\s*(.*)$/);
            const tag = match ? match[1] : null;
            const content = match ? match[2] : bullet;

            return (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-yellow-400 font-bold shrink-0 mt-0.5">•</span>
                <div className="leading-snug">
                  {tag && (
                    <span className="inline-block px-1.5 py-0.5 mr-1.5 rounded text-[10px] font-bold bg-yellow-400/20 text-yellow-300 border border-yellow-400/30">
                      {tag}
                    </span>
                  )}
                  <span>{content}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  // Render Saju-Tarot Fusion Letter (Healing: Jeje / Growth: Lucy)
  const renderFusionLetterSection = (message?: string) => {
    if (!message) return null;

    const isHealing = oracleMode === 'healing';
    const letterTitle = isHealing
      ? `제제가 ${formatKoreanToTarget(jejeName)} 보내는 다정한 치유 편지`
      : `루시가 ${recipientName} 님에게 보내는 명쾌한 자기계발 실행 편지`;
    const letterBadgeLatin = isHealing ? "ZEZÉ'S SACRED LETTER" : "LUCY'S SACRED LETTER";
    const letterBadgeKo = isHealing ? "사주 ✕ 타로 융합 치유 서한" : "사주 ✕ 타로 융합 실행 서한";
    const letterSubtitle = isHealing ? '"네 마음에 꼭 맞는 온기를 전할게"' : '"네 안의 잠재력을 깨우는 단단한 나침반이 되어줄게"';
    const copyHeader = `[${letterTitle}]`;

    return (
      <div className="glass p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-950/20 via-zinc-950/90 to-purple-950/30 border border-amber-400/35 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* User's Concern Display Pill (if inquiry was specified) */}
        {inquiryText && (
          <div className="mb-4 px-4 py-2.5 rounded-2xl bg-black/40 border border-amber-400/25 flex items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-2 text-xs text-zinc-300 min-w-0">
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold shrink-0">
                {isHealing ? '치유 고민' : '돌파 과제'}
              </span>
              <span className="font-medium text-white truncate">"{inquiryText}"</span>
            </div>
            <span className="text-[10px] text-amber-400/80 font-mono shrink-0">
              {isHealing ? '1:1 맞춤 치유 서한' : '1:1 맞춤 실행 서한'}
            </span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-md shrink-0">
              {isHealing ? (
                <Feather size={22} className="text-amber-400" />
              ) : (
                <Sparkles size={22} className="text-amber-400 animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block">
                  {letterBadgeLatin}
                </span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/30">
                  {letterBadgeKo}
                </span>
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-bold font-serif text-white mt-0.5">
                {letterTitle}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-center">
            {/* 🔊 다정한/명쾌한 편지 TTS 버튼 */}
            {oracleLetterSpeechText && (
              <button
                type="button"
                onClick={handleToggleOracleLetterTTS}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95 ${
                  isOracleLetterTTSActive
                    ? "bg-rose-500/30 text-rose-200 border border-rose-400/60 ring-2 ring-rose-400/30 animate-pulse"
                    : "bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 border border-amber-400/35 hover:border-amber-400/60"
                }`}
                title={isOracleLetterTTSActive ? "편지 낭독 중지" : (isHealing ? "제제의 다정한 치유 편지 음성으로 듣기" : "루시의 명쾌한 실행 편지 음성으로 듣기")}
              >
                {isOracleLetterTTSActive ? (
                  <>
                    <VolumeX size={14} className="text-rose-300" />
                    <span className="text-[11px]">낭독 중지</span>
                    <span className="flex gap-0.5 ml-0.5">
                      <span className="w-1 h-2.5 bg-rose-300 rounded-full animate-bounce" />
                      <span className="w-1 h-3.5 bg-rose-200 rounded-full animate-bounce [animation-delay:0.15s]" />
                      <span className="w-1 h-2 bg-rose-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                    </span>
                  </>
                ) : (
                  <>
                    <Volume2 size={14} className="text-amber-400" />
                    <span className="text-[11px]">{isHealing ? "치유 편지 듣기" : "실행 편지 듣기"}</span>
                  </>
                )}
              </button>
            )}

            <TarotResultShareButton
              data={oracleShareData}
              variant="compact"
              label="결과 공유"
            />
            <span className="text-xs text-amber-300/80 font-serif italic hidden md:inline-block">
              {letterSubtitle}
            </span>
          </div>
        </div>

        <div className="mt-4 p-6 sm:p-8 rounded-2xl bg-black/50 border border-amber-400/20 relative z-10 space-y-5 shadow-inner">
          <div className="text-sm sm:text-base text-zinc-100 font-serif leading-loose whitespace-pre-line">
            {message}
          </div>

          {/* 편지 하단 액션 툴바 */}
          <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              {oracleLetterSpeechText && (
                <button
                  type="button"
                  onClick={handleToggleOracleLetterTTS}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/30 text-amber-200 font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {isOracleLetterTTSActive ? <VolumeX size={13} className="text-rose-400" /> : <Volume2 size={13} className="text-amber-400" />}
                  <span>{isOracleLetterTTSActive ? '낭독 중지' : '편지 음성으로 듣기'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const summaryBlock = oracleSummaryBullets && oracleSummaryBullets.length > 0
                    ? `\n\n【핵심 3줄 요약】\n${oracleSummaryBullets.join('\n')}`
                    : '';
                  const fullText = `${copyHeader}${summaryBlock}\n\n${message}`;
                  navigator.clipboard?.writeText(fullText).then(() => {
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 2000);
                  }).catch(() => {});
                }}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white font-medium flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {isCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{isCopied ? '편지 복사 완료!' : '편지 복사'}</span>
              </button>
              <TarotResultShareButton
                data={oracleShareData}
                variant="compact"
                label="결과 공유 / 소장"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setStage('intro');
                setDrawnCards([]);
                setHealingResult(null);
                setGrowthResult(null);
                stopTTS();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 font-bold flex items-center gap-1.5 transition-all cursor-pointer ml-auto"
            >
              <RotateCcw size={13} />
              <span>다시 카드 뽑기</span>
            </button>
          </div>
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

  // Render Card-by-Card Deep Reading Section (Tabbed 1-Card Focus + 3-Cards Unified View)
  const renderCardInsightsSection = (insights?: CardInsight[]) => {
    if (!insights || insights.length === 0) return null;

    const currentCard = drawnCards[selectedCardIdx] || drawnCards[0];
    const currentInsight = insights[selectedCardIdx] || insights[0];

    const renderCardCard = (card: TarotCard, insight: CardInsight, idx: number) => (
      <motion.div
        initial={{ opacity: 0, y: 22, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, delay: idx * 0.12, ease: [0.16, 1, 0.3, 1] }}
        className="p-5 sm:p-6 rounded-3xl bg-white/[0.03] border border-white/10 space-y-4 shadow-lg backdrop-blur-sm"
      >
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div
              onClick={() => setZoomedCard({ card, slotName: `#${idx + 1} ${slotPositions[idx]}` })}
              className="group/cardthumb relative w-14 h-20 rounded-xl overflow-hidden border border-amber-400/40 hover:border-amber-400 shadow-md hover:shadow-amber-500/20 shrink-0 cursor-zoom-in transition-all"
              title="클릭하여 카드 크게 보기"
            >
              <img
                src={getTarotCardImageUrl(card)}
                alt={card.nameKo}
                className="w-full h-full object-cover transition-transform duration-300 group-hover/cardthumb:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/cardthumb:opacity-100 flex items-center justify-center transition-opacity">
                <ZoomIn className="w-4 h-4 text-amber-300 drop-shadow" />
              </div>
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
                <span>{oracleMode === 'healing' ? '🌿' : '⚡'}</span> {oracleMode === 'healing' ? '제제의 심층 맞춤 치유 리딩' : '루시의 자기계발 심층 분석 & 역량 가이드'}
              </span>
              {insight.personal_interpretation}
            </div>
          )}

          {insight.action_guide && (
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/15 text-xs text-zinc-200 leading-relaxed font-sans md:col-span-2">
              <span className="font-bold text-yellow-300 block mb-1 text-[11px] flex items-center gap-1.5">
                <span>💡</span> {oracleMode === 'healing' ? '오늘 나를 쉬게 하는 마음 치유 처방' : '오늘 즉시 실천할 1% 자기계발 팁'}
              </span>
              {insight.action_guide}
            </div>
          )}
        </div>
      </motion.div>
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
              {!isModeChosen
                ? '원하시는 모드(🌿 힐링 치유 편지 vs ⚡ 자기계발 실행 편지)를 선택하여 시작해 주세요.'
                : oracleMode === 'healing'
                ? '지친 마음의 치유와 안식을 위해 사주 본원과 78장 풀덱 타로가 전하는 따뜻한 힐링 오라클'
                : '역량 강화와 실질적 성장을 위해 사주 추진력과 78장 타로 4원소가 전하는 자기계발 오라클'}
            </p>
          </div>

          {/* Dual Mode Switcher */}
          <div className="flex items-center p-1 rounded-2xl bg-black/50 border border-white/10 shadow-inner shrink-0">
            <button
              onClick={() => handleModeSwitch('healing')}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 cursor-pointer ${
                isModeChosen && oracleMode === 'healing'
                  ? 'text-yellow-200 font-bold shadow-lg'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {isModeChosen && oracleMode === 'healing' && (
                <motion.div
                  layoutId="oracle-mode-pill"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-600/50 via-yellow-600/40 to-indigo-600/40 border border-yellow-400/40"
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                />
              )}
              <Heart size={14} className="relative z-10 text-rose-300" />
              <span className="relative z-10">힐링 (78장 풀덱)</span>
            </button>

            <button
              onClick={() => handleModeSwitch('growth')}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 cursor-pointer ${
                isModeChosen && oracleMode === 'growth'
                  ? 'text-yellow-200 font-bold shadow-lg'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {isModeChosen && oracleMode === 'growth' && (
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
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setIsModeChosen(false);
                setDrawnCards([]);
                setStage('spread');
                stopTTS();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="오라클 모드(힐링 vs 자기계발) 선택 화면으로 이동"
            >
              <Layers size={13} className="text-amber-400" />
              <span>모드 직접 선택</span>
            </button>

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
                onClick={() => {
                  setStage('intro');
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
        {stage === 'intro' ? (
          /* INTRO / PREPARATION VIEW */
          <motion.div
            key="oracle-intro-stage"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="w-full relative space-y-6"
          >
            <div className="glass p-6 sm:p-8 md:p-10 rounded-3xl bg-gradient-to-br from-amber-950/20 via-zinc-950/80 to-purple-950/20 border border-amber-400/30 shadow-2xl relative overflow-hidden backdrop-blur-xl">
              <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-2xl mx-auto text-center space-y-6">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-xs font-mono text-amber-300">
                  <Sparkles size={13} className="text-amber-400 animate-pulse" />
                  <span>수신자: <strong>{oracleMode === 'healing' ? jejeName : recipientName}</strong> {oracleMode === 'healing' ? '맞춤 치유 오라클' : '님 맞춤 오라클'}</span>
                </div>

                {/* Main Heading */}
                <div className="space-y-2">
                  <h3 className="text-2xl sm:text-3xl font-serif font-black text-white tracking-tight">
                    {oracleMode === 'healing'
                      ? '내면의 상처를 보듬는 제제의 다정한 치유 오라클'
                      : '잠재력을 일깨우는 4원소 마인드셋 오라클'}
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
                    {oracleMode === 'healing'
                      ? `${jejeName}의 타고난 사주 본원 기운과 78장의 타로를 융합하여, 오직 지친 마음을 쉬어가게 할 3장의 치유 조각을 찾아냅니다.`
                      : `${recipientName} 님의 사주 실행력과 78장의 타로 4원소를 결합하여, 오늘 실천할 명쾌한 자기계발 해법을 제시합니다.`}
                  </p>
                </div>

                {/* 3 Spread Slot Explanations */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-amber-400/20 space-y-1 backdrop-blur-sm">
                    <span className="text-[10px] font-mono text-amber-400 block font-bold">1번 카드</span>
                    <h4 className="text-sm font-bold text-white font-serif">{slotPositions[0]}</h4>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      {oracleMode === 'healing' ? '남모르게 혼자 삭여온 무의식의 피로와 상처' : '오늘 마주할 핵심 마인드셋 원형'}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-amber-400/20 space-y-1 backdrop-blur-sm">
                    <span className="text-[10px] font-mono text-amber-400 block font-bold">2번 카드</span>
                    <h4 className="text-sm font-bold text-white font-serif">{slotPositions[1]}</h4>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      {oracleMode === 'healing' ? '지금 현실에서 짊어진 마음의 무게와 상태' : '돌파해야 할 4원소 실행 역량'}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-amber-400/20 space-y-1 backdrop-blur-sm">
                    <span className="text-[10px] font-mono text-amber-400 block font-bold">3번 카드</span>
                    <h4 className="text-sm font-bold text-white font-serif">{slotPositions[2]}</h4>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      {oracleMode === 'healing' ? '제제가 건네는 포근한 치유와 회복의 씨앗' : '오늘 즉시 행동할 1분 마이크로 실천'}
                    </p>
                  </div>
                </div>

                {/* Optional Inquiry Input */}
                <div className="text-left space-y-1.5 pt-2">
                  <label className="text-xs text-amber-300/90 font-medium flex items-center justify-between">
                    <span>털어놓고 싶은 마음의 짐이나 고민 (선택 입력)</span>
                    <span className="text-[10px] text-zinc-400">자유롭게 입력하거나 비워두셔도 됩니다</span>
                  </label>
                  <input
                    type="text"
                    value={inquiryText}
                    onChange={(e) => setInquiryText(e.target.value)}
                    placeholder="예: 요즘 성과에 대한 압박감이 심해요, 사람들과의 관계가 너무 지쳐요..."
                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-amber-400/25 focus:border-amber-400 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-400/50 transition-all"
                  />
                </div>

                {/* Big Glowing Start Button */}
                <div className="pt-4 flex flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDrawnCards([]);
                      setHealingResult(null);
                      setGrowthResult(null);
                      setIsModeChosen(true);
                      setStage('spread');
                    }}
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-[0_0_25px_rgba(251,191,36,0.35)] hover:shadow-[0_0_35px_rgba(251,191,36,0.5)] transition-all cursor-pointer active:scale-98"
                  >
                    <Sparkles size={18} className="text-black" />
                    <span>3장 카드 뽑기 시작하기</span>
                    <ArrowRight size={16} className="text-black" />
                  </button>
                  <span className="text-[11px] text-zinc-400">
                    원하는 카드를 천천히 3장 골라주시면 {oracleMode === 'healing' ? `${jejeName}만을 위한` : `${recipientName} 님만을 위한`} 서한이 완성됩니다.
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : stage === 'spread' ? (
          /* SPREAD CARD DRAW INTERACTION OR MODE SELECTION GATE */
          <motion.div
            key={`oracle-${isModeChosen ? 'draw' : 'mode-gate'}-stage`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="w-full relative"
          >
            {!isModeChosen ? (
              /* MODE SELECTION GATE: Choose between Healing (22 Major) vs Growth (78 Full Deck) */
              <div className="glass p-5 sm:p-8 rounded-3xl bg-zinc-950/80 border border-amber-400/25 shadow-2xl relative overflow-hidden text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-[11px] font-mono text-amber-300 mb-3 uppercase tracking-widest">
                  <Sparkles size={12} className="text-amber-400" />
                  ORACLE TAROT MODE SELECTION
                </div>
                <h3 className="text-xl sm:text-2xl font-serif font-black text-white">
                  오라클 타로 모드를 선택해 주세요
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-lg mx-auto leading-relaxed">
                  사주 원국과 공명하는 2가지 특화 타로 모드 중 원하시는 방식을 선택하세요.<br className="hidden sm:inline" />
                  선택하신 모드는 자동으로 저장되어 다음번에도 그대로 유지됩니다.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-6 max-w-2xl mx-auto text-left">
                  {/* 🌿 Healing Mode Option Card */}
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('healing')}
                    className={`group relative p-5 sm:p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between cursor-pointer active:scale-[0.98] ${
                      oracleMode === 'healing'
                        ? 'bg-gradient-to-b from-rose-950/40 via-zinc-900/80 to-black border-rose-400/60 shadow-[0_0_25px_rgba(244,63,94,0.2)]'
                        : 'bg-zinc-900/60 hover:bg-zinc-900/90 border-white/10 hover:border-rose-400/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center">
                          <Heart size={20} className="text-rose-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/30">
                          78장 풀덱 (메이저 & 마이너)
                        </span>
                      </div>

                      <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-rose-200 transition-colors flex items-center gap-1.5">
                        <span>🌿 힐링 타로</span>
                        <span className="text-xs font-normal text-rose-300/80">(내면아이 치유)</span>
                      </h4>
                      <p className="text-xs text-zinc-300/90 mt-2 leading-relaxed">
                        지치고 상처받은 감정을 다정하게 안아주는 위로와 안식.<br />
                        제제의 1:1 치유 편지와 1분 마음 처방.
                      </p>

                      <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2 text-[11px] text-zinc-400">
                        <ShieldCheck size={13} className="text-rose-400" />
                        <span>정서적 안정 · 번아웃 해소 · 무조건적 수용</span>
                      </div>
                    </div>

                    <div className="mt-5 w-full py-2.5 rounded-xl bg-rose-500/20 group-hover:bg-rose-500/30 border border-rose-400/40 text-rose-200 text-xs font-bold text-center transition-colors">
                      🌿 78장 힐링 타로 덱 펼치기
                    </div>
                  </button>

                  {/* ⚡ Growth Mode Option Card */}
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('growth')}
                    className={`group relative p-5 sm:p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between cursor-pointer active:scale-[0.98] ${
                      oracleMode === 'growth'
                        ? 'bg-gradient-to-b from-amber-950/40 via-zinc-900/80 to-black border-amber-400/60 shadow-[0_0_25px_rgba(245,158,11,0.2)]'
                        : 'bg-zinc-900/60 hover:bg-zinc-900/90 border-white/10 hover:border-amber-400/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
                          <Zap size={20} className="text-amber-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                          78장 풀덱 (4원소)
                        </span>
                      </div>

                      <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-amber-200 transition-colors flex items-center gap-1.5">
                        <span>⚡ 자기계발 타로</span>
                        <span className="text-xs font-normal text-amber-300/80">(마인드셋 & 실행)</span>
                      </h4>
                      <p className="text-xs text-zinc-300/90 mt-2 leading-relaxed">
                        현실적 문제 돌파구와 추진력을 깨우는 전략적 통찰.<br />
                        루시의 실행 매트릭스 분석과 1줄 마이크로 미션.
                      </p>

                      <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2 text-[11px] text-zinc-400">
                        <Flame size={13} className="text-amber-400" />
                        <span>역량 레벨업 · 행동 전환 · 데일리 루틴</span>
                      </div>
                    </div>

                    <div className="mt-5 w-full py-2.5 rounded-xl bg-amber-500/20 group-hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-xs font-bold text-center transition-colors">
                      ⚡ 자기계발 타로 덱 펼치기
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="glass p-4 sm:p-6 rounded-3xl bg-zinc-950/70 border border-amber-400/20 shadow-2xl relative overflow-hidden">
                <div className="text-center mb-2">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-amber-400/80">
                      {oracleMode === 'healing' ? 'Inner Child Oracle • 78 Full Deck' : 'Mindset Toolkit • 78 Full Deck'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsModeChosen(false)}
                      className="text-[10px] text-zinc-400 hover:text-amber-300 underline underline-offset-2 ml-1 cursor-pointer"
                    >
                      모드 변경
                    </button>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold font-serif text-white mt-0.5">
                    {oracleMode === 'healing' ? '내면의 숨결을 마주할 3장의 카드' : '오늘의 마인드셋을 이끌 3장의 카드'}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                    {oracleMode === 'healing'
                      ? '카드를 손가락이나 마우스로 굴려 마음이 이끄는 3장을 천천히 선택해 보세요.'
                      : '4원소(불·물·공기·흙)의 현실 실행력을 깨울 3장의 도구를 선택해 주세요.'}
                  </p>

                  {/* Inquiry Display / Quick Edit in Spread Stage */}
                  <div className="max-w-md mx-auto mt-3">
                    <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/40 border border-amber-400/25 focus-within:border-amber-400/60 transition-all">
                      <Sparkles size={14} className="text-amber-400 shrink-0" />
                      <input
                        type="text"
                        value={inquiryText}
                        onChange={(e) => setInquiryText(e.target.value)}
                        placeholder={
                          oracleMode === 'healing'
                            ? "마음속 고민을 입력하면 치유 편지에 깊이 반영됩니다..."
                            : "돌파하고 싶은 성장 고민을 입력하면 실행 편지에 깊이 반영됩니다..."
                        }
                        className="w-full bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none"
                      />
                      {inquiryText && (
                        <button
                          type="button"
                          onClick={() => setInquiryText('')}
                          className="text-[11px] text-zinc-500 hover:text-zinc-300 shrink-0 cursor-pointer"
                          title="지우기"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
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
            )}
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
            {/* 🌟 토스된 질문/의제 실시간 표시 배너 */}
            {inquiryText && (
              <div className="px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-purple-900/40 border border-purple-400/40 flex items-center gap-2.5 backdrop-blur-xl shadow-lg">
                <Sparkles size={16} className="text-purple-400 shrink-0 animate-pulse" />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 block">
                    {oracleMode === 'healing' ? '내담자의 마음 치유 고민' : '내담자의 자기계발 돌파 과제'}
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-white truncate">"{inquiryText}"</p>
                </div>
              </div>
            )}

            {/* 3 Drawn Cards Mini Banner */}
            <div className="glass p-4 sm:p-5 rounded-3xl bg-white/[0.03] border border-amber-400/25 flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-xl">
              <div className="flex flex-wrap items-center justify-around gap-3 flex-1 w-full">
                {drawnCards.map((card, idx) => (
                  <motion.div
                    key={card.id || idx}
                    initial={{ opacity: 0, scale: 0.85, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: idx * 0.12, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center gap-3"
                  >
                    <TarotFlippingCard
                      card={card}
                      slotName={`#${idx + 1}`}
                      index={idx}
                      size="sm"
                      onClick={() => setZoomedCard({ card, slotName: `#${idx + 1} ${slotPositions[idx]}` })}
                    />
                    <div>
                      <span className="text-[10px] font-mono text-amber-400/80 block uppercase tracking-wider">
                        {slotPositions[idx]}
                      </span>
                      <h4 className="text-sm sm:text-base font-bold text-white font-serif">{card.nameKo}</h4>
                      <span className="text-[11px] text-zinc-400">{card.keywords.slice(0, 2).join(' · ')}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="flex items-center justify-center w-full md:w-auto pt-2 md:pt-0 shrink-0">
                <TarotResultShareButton
                  data={oracleShareData}
                  variant="primary"
                  label="결과 카드 소장 & 공유"
                />
              </div>
            </div>

            {/* Loading Indicator */}
            {isLoading ? (
              <div className="glass p-12 rounded-3xl bg-zinc-950/60 border border-amber-400/20 text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
                <p className="text-sm font-serif text-amber-200 animate-pulse">
                  {oracleMode === 'healing'
                    ? '3장의 마음 조각을 다정하게 엮어 제제의 치유 편지를 작성 중입니다...'
                    : '4원소 마인드셋과 질문자의 과제를 융합하여 루시의 실행 편지를 작성 중입니다...'}
                </p>
              </div>
            ) : oracleMode === 'healing' && healingResult ? (
              /* [HEALING RESULT VIEW: ONLY ZEZE'S SACRED HEALING LETTER] */
              <div className="w-full space-y-6">
                {/* 🌟 78장 오라클 핵심 3줄 요약 카드 */}
                {renderOracleSummaryCard()}
                {/* 제제의 사주·타로 융합 치유 서한 (편지만 집중 표시) */}
                {renderFusionLetterSection(healingResult.message)}
                {/* 🌟 오라클 타로 맨 하단 루시의 맞춤 치유 조언 (TTS 가능) */}
                <LucyTarotAdviceCard
                  cards={drawnCards}
                  tarotConcern={inquiryText || '지친 마음의 온전한 쉼과 내면아이 치유'}
                  readingText={healingResult.message}
                  mode="oracle"
                  oracleMode="healing"
                  saju={saju}
                  className="mt-4"
                />
                {/* ⚠️ 타로 성찰 주의사항 (맹목적 믿음 지양 상시 표시) */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/[0.08] border border-amber-500/30 space-y-1.5 text-xs text-white/85 shadow-sm">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300 text-xs">
                    <AlertCircle size={14} className="text-amber-400 shrink-0" />
                    <span>타로 성찰 주의사항 (맹목적 믿음 지양)</span>
                  </div>
                  <p className="leading-relaxed text-white/70 break-keep text-[11px] sm:text-xs">
                    타로는 미래를 결정짓는 절대적 예언이 아니라, 자신의 내면을 성찰하고 더 나은 선택을 돕는 지혜의 나침반입니다. 맹목적인 믿음을 지양하고, 모든 운명의 결정권과 최종 열쇠는 언제나 당신 자신의 주체적인 의지와 지혜에 있습니다.
                  </p>
                </div>
              </div>
            ) : oracleMode === 'growth' && growthResult ? (
              /* [GROWTH RESULT VIEW: ONLY LUCY'S SACRED GROWTH ACTION LETTER] */
              <div className="w-full space-y-6">
                {/* 🌟 78장 오라클 핵심 3줄 요약 카드 */}
                {renderOracleSummaryCard()}
                {/* 루시의 사주·타로 융합 자기계발 실행 서한 (편지만 집중 표시) */}
                {renderFusionLetterSection(growthResult.message || growthResult.macro_focus)}
                {/* 🌟 오라클 타로 맨 하단 루시의 맞춤 성장 조언 (TTS 가능) */}
                <LucyTarotAdviceCard
                  cards={drawnCards}
                  tarotConcern={inquiryText || '현실적인 도전과 자기계발 성장 돌파'}
                  readingText={growthResult.message || growthResult.macro_focus}
                  mode="oracle"
                  oracleMode="growth"
                  saju={saju}
                  className="mt-4"
                />
                {/* ⚠️ 타로 성찰 주의사항 (맹목적 믿음 지양 상시 표시) */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/[0.08] border border-amber-500/30 space-y-1.5 text-xs text-white/85 shadow-sm">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300 text-xs">
                    <AlertCircle size={14} className="text-amber-400 shrink-0" />
                    <span>타로 성찰 주의사항 (맹목적 믿음 지양)</span>
                  </div>
                  <p className="leading-relaxed text-white/70 break-keep text-[11px] sm:text-xs">
                    타로는 미래를 결정짓는 절대적 예언이 아니라, 자신의 내면을 성찰하고 더 나은 선택을 돕는 지혜의 나침반입니다. 맹목적인 믿음을 지양하고, 모든 운명의 결정권과 최종 열쇠는 언제나 당신 자신의 주체적인 의지와 지혜에 있습니다.
                  </p>
                </div>
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

      {/* Tarot Card Zoom Modal */}
      <TarotCardZoomModal
        isOpen={!!zoomedCard}
        onClose={() => setZoomedCard(null)}
        card={zoomedCard?.card ?? null}
        slotName={zoomedCard?.slotName}
      />
    </div>
  );
}
