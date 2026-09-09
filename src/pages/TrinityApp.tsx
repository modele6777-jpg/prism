import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Sparkles,
  Send,
  Volume2,
  VolumeX,
  Star,
  Moon,
  Sun,
  RefreshCw,
  ChevronDown,
  Zap,
  Eye,
  MessageCircle,
  ImageIcon,
  BarChart2,
  Copy,
  Check,
  X,
  Shuffle,
  History,
  LayoutGrid,
  Brain,
  Users,
  ChevronLeft,
  ChevronRight,
  Activity,
  Music,
  TreeDeciduous,
  Bird,
  Home,
  Settings,
  ShieldCheck,
  Database,
  Stars as LucideStars,
  User,
  Layout,
  Palette,
  Library,
  Wind,
  Heart,
  Feather,
  Layers,
  Link,
  BookOpen,
  Camera,
  Wand2,
  Headphones,
  Compass,
  Flame,
  Coins,
  Lock,
  Trash2,
} from "lucide-react";
import { useLocation } from "wouter";
import { useApp, getPersistentUserProfile, setPersistentUserProfile } from "@/contexts/AppContext";
import { mergeUserProfiles, type UserProfile } from "@/lib/sharedState";
import { calculateDetailedSaju } from "@/lib/sajuAnalysis";
import { trpc } from "@/lib/trpc";
import {
  invokeLLM,
  invokeLLMStream,
  invokeLLMStructured,
  PERSONAS,
  textToSpeech,
  poeQuickInsight,
  buildDeepSynapseContext,

} from "@/lib/ai";
import { playRawPCM } from "@/lib/audio";
import { recordPrismFeature, recordDailyOracleResult } from "@/lib/prismOmniSync";
import { Streamdown } from "@/components/Streamdown";
import { TTSButton } from "@/components/TTSButton";
import { StatusBarDashboard } from "@/components/StatusBarDashboard";
import { CalendarView } from "@/components/CalendarView";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, LineChart, Line, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import NoticeModal from "@/components/NoticeModal";

import { TarotBible } from "@/components/trinity/TarotBible";
import { TrinityDailyLuckyView } from "@/components/trinity/TrinityDailyLuckyView";
import { TrinityOracleSection } from "@/components/trinity/TrinityOracleSection";
import { AcimHandbookModal } from "@/components/trinity/AcimHandbookModal";
import { useBinauralBeat } from "@/hooks/useBinauralBeat";
import { TarotSpread } from "@/components/trinity/TarotSpread";
import { TarotSpreadSelectionModal } from "@/components/trinity/TarotSpreadSelectionModal";
import { TarotCard, TAROT_DECK, getTarotCardImageUrl } from "@/data/tarotData";
import { shuffleCardDeck } from "@/lib/cardShuffle";
import { playTTS, playTTSInChunks, playConversation, stopTTS, useTTSActive } from "@/utils/tts";
import { z } from "zod";
import {
  getTodayDateKey,
  pickDailySeededItem,
  findTodayOracleInSources,
  resolveOracleVisionResult,
  isTimestampToday,
  markDailyAutoRan,
  getDailyAutoRanKey,
  getTrinityDailyResultKey,
  markOracleModalSeen,
} from "@/lib/dailyCache";
import { useScrollToTopOnChange } from "@/hooks/useScrollToTopOnChange";
import { resetAppScroll } from "@/utils/scrollToTop";
import { useDailyOracleFirstVisit } from "@/hooks/useDailyOracleFirstVisit";
import {
  buildOracleDeepInsightSystemContext,
  buildOracleDeepInsightUserMessage,
  type OracleDeepInsightSendOpts,
} from "@/lib/oracleDeepInsight";
import { DailyOracleLoadingOverlay } from "@/components/DailyOracleLoadingOverlay";

const TAROT_HEALTHY_GUIDE_TEXT = "건강한 타로 활용 안내: 타로는 정해진 미래를 맹신하거나 과도하게 의존하기 위한 도구가 아닌, 현재 내면의 무의식을 비추고 더 나은 선택을 돕는 마음의 나침반입니다. 삶을 창조하는 진정한 힘과 최종 결정권은 언제나 당신 자신의 용기 있는 실천과 자유의지에 있습니다.";

const EnergyAnalysisSchema = z.object({
  luckScore: z
    .union([z.string(), z.number()])
    .transform((v) => (typeof v === "string" ? parseFloat(v) : v)),
  loveScore: z
    .union([z.string(), z.number()])
    .transform((v) => (typeof v === "string" ? parseFloat(v) : v)),
  wealthScore: z
    .union([z.string(), z.number()])
    .transform((v) => (typeof v === "string" ? parseFloat(v) : v)),
  healthScore: z
    .union([z.string(), z.number()])
    .transform((v) => (typeof v === "string" ? parseFloat(v) : v)),
  luckyColor: z.string().optional(),
  luckyNumber: z
    .union([z.string(), z.number()])
    .transform((v) => String(v))
    .optional(),
  luckyItem: z.string().optional(),
  cosmicAspect: z.string().optional(),
  deepSyncLevel: z.string().optional(),
  guidance: z.string(),
});

import { buildSpecificTarotDailyOracle } from '@/lib/dailyTarotOracle';

function buildLocalTrinityDailyOracle(card: any, mode: string = "oracle") {
  if (card && (card.id || card.nameKo || card.name)) {
    return buildSpecificTarotDailyOracle(card, mode);
  }
  const cardName = card?.nameKo || card?.name || "우주의 조율자";
  const cardEn = card?.name || "";
  const cardType = card?.type === "major" ? "메이저 아르카나" : "마이너 아르카나";
  const keywords = (card?.keywords || []).join(", ") || "직관, 통찰, 균형";
  const isReversed = !!card?.reversed;
  const orientation = isReversed ? "역방향 (Reversed)" : "정방향 (Upright)";

  const diagnosis = `### 🌟 오늘 하루의 기운: [${cardName}${cardEn ? ` (${cardEn})` : ''}] (${orientation})
오늘 하루는 **${keywords}**의 에너지가 중심 흐름을 이끕니다. 서두르지 말고 자신의 페이스를 편안하게 유지하세요.

### 💡 오늘 챙길 포인트
- **오늘의 조언**: 오늘 해야 할 작은 일부터 차분히 매듭지으며 나아가세요.
- **주의할 점**: 사소한 일이나 타인의 말에 감정을 소모하지 마세요.

### 🍀 오늘의 초간단 개운 행동
물 한 잔을 마시며 깊은 심호흡 3번으로 머릿속을 맑게 비워보세요.`;

  return {
    diagnosis,
    luckyNumber: "7",
    luckyColor: "황금빛 골드 (Celestial Gold)",
    remedy: `오늘 하루, [${cardName}] 카드의 조화로운 에너지를 기억하며 가볍게 심호흡하기`,
    symbol: card?.keywords?.[0] || "운명의 빛",
    frequency: "528Hz",
    spiritualEnergy: `[${cardName}] 카드가 오늘 하루 당신에게 든든한 안정감과 명료함을 선사합니다.`,
    blessingMessage: `오늘 하루 당신의 모든 발걸음 위에 [${cardName}] 카드의 밝은 행운이 함께하길 축복합니다.`,
    focusPlaylist: "528Hz Solfeggio Resonance",
  };
}

const QuickInsightSchema = z.object({
  diagnosis: z.string().default("오늘 하루 당신의 에너지는 맑고 평온한 균형을 향해 나아가고 있습니다."),
  luckyNumber: z.union([z.string(), z.number()]).transform((v) => String(v)).optional().default("7"),
  luckyColor: z.string().optional().default("황금빛 골드"),
  remedy: z.string().optional().default("마음의 중심을 잡고 깊은 호흡으로 하루를 시작하기"),
  symbol: z.string().optional().default("운명의 수레바퀴"),
  frequency: z.union([z.string(), z.number()]).transform((v) => String(v)).optional().default("528Hz"),
  spiritualEnergy: z
    .string()
    .describe("현재 사용자에게 가장 필요한 영적 에너지에 대한 심층 분석")
    .optional()
    .default("우주의 주파수가 당신의 내면과 공명하여 깊은 직관과 통찰을 깨웁니다."),
  blessingMessage: z
    .string()
    .describe(
      "운명을 비추는 빛처럼 사용자를 위한 긍정적이고 따뜻한 축복 메시지",
    )
    .optional()
    .default("당신이 내딛는 모든 발걸음에 우주의 은총과 평온이 함께하기를 축복합니다."),
});

import {
  calcSaju,
  calcAstro,
  parseAstro,
  drawCards,
  LUCKY_EXAMPLES,
  analyzeTarotConcern,
  isDailyTarotConcern,
  buildSpreadForTheme,
  buildLocalTarotReading,
  buildTarotBinaryChoicePromptAddon,
  buildTarotSpreadPromptAddon,
  buildTarotContextPromptAddon,
  isTarotStreamFailure,
  POPULAR_TAROT_SPREAD_PRESETS,
  type TarotSpreadRecommendation,
  type TarotConcernAnalysis,
  type TarotConcernKind,
} from "@/lib/trinity/utils";
import {
  type TarotPhysicalMetadata,
  defaultTarotTouchAnalyzer,
} from "@/lib/trinity/tarotTouchAnalyzer";
import {
  auth,
  db,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  getDocs,
  limit,
  doc,
  getDoc,
  setDoc,
} from "@/lib/firebase";
import { InsightCharts } from "@/components/trinity/InsightCharts";

import { SpecialFeatureFabGroup, SpecialFeatureButton, HandbookFabButton } from '@/components/SpecialFeatureFab';
import {
  SPECIAL_FEATURE_CHROME_HIDDEN_CLASS,
  SpecialFeatureOverlay,
  SpecialFeaturePanel,
  useSpecialFeatureChromeHidden,
} from '@/components/SpecialFeaturePanel';

const THEME_COLOR = "oklch(0.85 0.15 90)";
const BG = "oklch(0.10 0.02 60)";

type Stage =
  | "analysis"
  | "daily"
  | "vision"
  | "stat"
  | "lucy_chat"
  | "daily_oracle"
  | "lucy_room"
  | "history"
  | "memory"
  | "relation"
  | "simple"
  | "landing"
  | "onboarding"
  | "soul";

interface ProfileForm {
  name: string;
  birthdate: string;
  birthtime: string;
  gender: string;
  nickname: string;
  city: string;
}

interface Message {
  id: string;
  role: "user" | "model";
  content: string;
  emotion?: string;
  timestamp: number;
}
interface Memory {
  memorySummary: string;
  relationships: Array<{ name: string; description: string; pattern?: string }>;
  userPreferences: string;
  currentVibe: string;
}
interface HistoryItem {
  id: string;
  type: string;
  createdAt: number;
  text?: string;
  content?: string;
  cards?: TarotCard[];
  sajuData?: string;
  data?: any;
  metadata?: any;
}

const TYPE_LABELS: Record<string, string> = {
  energy_analysis: "에너지 분석",
  vision_reading: "비전 리딩",
  daily_reading: "오늘의 조언",
  oracle: "운명 오라클",
  "oracle-vision": "오라클 비전",
  lucy_chat: "루시 대화",
};



const TarotCardIcon = ({
  size = 24,
  className = "",
}: {
  size?: number | string;
  className?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect
      x="3"
      y="1"
      width="14"
      height="20"
      rx="2"
      ry="2"
      transform="rotate(-6 10 11)"
      opacity="0.3"
    />
    <rect
      x="5"
      y="2"
      width="14"
      height="20"
      rx="2"
      ry="2"
      fill="currentColor"
      fillOpacity="0.05"
    />
    <rect
      x="7"
      y="4"
      width="10"
      height="16"
      rx="1"
      ry="1"
      strokeWidth="1"
      strokeOpacity="0.6"
    />
    <path
      d="M12 6 L13.5 9.5 L17 11 L13.5 12.5 L12 16 L10.5 12.5 L7 11 L10.5 9.5 Z"
      fill="currentColor"
      fillOpacity="0.2"
    />
    <circle cx="12" cy="11" r="1.5" fill="currentColor" />
    <path d="M9 17 H15" strokeWidth="1" strokeOpacity="0.6" />
  </svg>
);

// High-dimension Trinity Aura Oracle Cards restored to 22 Major Tarot Cards for Daily Oracle
export const TRINITY_CARDS: TarotCard[] = TAROT_DECK.filter(c => c.type === "major");

const getTarotCardVisual = (card: TarotCard | null | undefined) => {
  if (!card) {
    return { icon: Sparkles, color: "text-yellow-400" };
  }

  if (card.id && card.id.startsWith("trinity_")) {
    switch (card.id) {
      case "trinity_01_source": return { icon: Eye, color: "text-indigo-400" };
      case "trinity_02_geometry": return { icon: RefreshCw, color: "text-cyan-400" };
      case "trinity_03_ascension": return { icon: Sparkles, color: "text-yellow-400" };
      case "trinity_04_mirror": return { icon: Activity, color: "text-zinc-400" };
      case "trinity_05_logos": return { icon: Sun, color: "text-amber-400" };
      case "trinity_06_alignment": return { icon: Compass, color: "text-yellow-400" };
      case "trinity_07_eye": return { icon: Eye, color: "text-purple-400" };
      case "trinity_08_shaman": return { icon: Sparkles, color: "text-rose-400" };
      case "trinity_09_cube": return { icon: ShieldCheck, color: "text-blue-400" };
      case "trinity_10_trinity": return { icon: Sparkles, color: "text-yellow-500" };
      default: return { icon: Sparkles, color: "text-yellow-400" };
    }
  }

  if (card.id) {
    if (card.id.startsWith("wands_")) {
      return { icon: Flame, color: "text-amber-500" };
    }
    if (card.id.startsWith("cups_")) {
      return { icon: Heart, color: "text-blue-400" };
    }
    if (card.id.startsWith("swords_")) {
      return { icon: Wind, color: "text-purple-450" };
    }
    if (card.id.startsWith("pent_")) {
      return { icon: Coins, color: "text-yellow-400" };
    }
  }

  switch (card.id) {
    case "major_0": return { icon: Eye, color: "text-zinc-400" }; // The Fool
    case "major_1": return { icon: Sparkles, color: "text-amber-400" }; // The Magician
    case "major_2": return { icon: Eye, color: "text-indigo-400" }; // The High Priestess
    case "major_3": return { icon: Heart, color: "text-rose-400" }; // The Empress
    case "major_4": return { icon: ShieldCheck, color: "text-yellow-500" }; // The Emperor
    case "major_5": return { icon: BookOpen, color: "text-blue-400" }; // The Hierophant
    case "major_6": return { icon: Heart, color: "text-pink-400" }; // The Lovers
    case "major_7": return { icon: Zap, color: "text-yellow-400" }; // The Chariot
    case "major_8": return { icon: ShieldCheck, color: "text-amber-500" }; // Strength
    case "major_9": return { icon: Eye, color: "text-amber-400" }; // The Hermit
    case "major_10": return { icon: RefreshCw, color: "text-cyan-400" }; // Wheel of Fortune
    case "major_11": return { icon: Activity, color: "text-yellow-400" }; // Justice
    case "major_12": return { icon: RefreshCw, color: "text-violet-400" }; // The Hanged Man
    case "major_13": return { icon: Activity, color: "text-purple-600" }; // Death
    case "major_14": return { icon: Wind, color: "text-cyan-300" }; // Temperance
    case "major_15": return { icon: Zap, color: "text-red-500" }; // The Devil
    case "major_16": return { icon: Zap, color: "text-orange-500" }; // The Tower
    case "major_17": return { icon: Star, color: "text-yellow-300" }; // The Star
    case "major_18": return { icon: Moon, color: "text-blue-300" }; // The Moon
    case "major_19": return { icon: Sun, color: "text-orange-400" }; // The Sun
    case "major_20": return { icon: Sparkles, color: "text-purple-400" }; // Judgement
    case "major_21": return { icon: Sparkles, color: "text-indigo-500" }; // The World
    default: return { icon: Sparkles, color: "text-yellow-400" };
  }
};

function StatBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="w-full min-w-0">
      <div className="flex justify-between gap-2 text-[10px] mb-1.5 px-1 uppercase tracking-widest font-bold text-white/30">
        <span className="min-w-0 break-words">{label}</span>
        <span style={{ color }} className="shrink-0">{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

// --- Modal Components ---

function Modal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 glass backdrop-blur-3xl"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-lg glass border border-white/10 rounded-[48px] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-sm font-bold tracking-widest text-white/40 uppercase">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="p-3 text-white/20 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-8 max-h-[70vh] overflow-y-auto no-scrollbar scroll-smooth">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function LucyMemoryModal({
  isOpen,
  onClose,
  memory,
}: {
  isOpen: boolean;
  onClose: () => void;
  memory?: string;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Soul Memory">
      <div className="space-y-4">
        <div className="p-8 rounded-[32px] bg-yellow-500/5 border border-yellow-500/10">
          <h4 className="text-[10px] font-bold text-white/20 mb-4 uppercase tracking-widest flex items-center gap-2">
            <Database size={14} /> Universe Context
          </h4>
          <p className="text-sm text-white/50 leading-relaxed font-sans">
            {memory || "전체 유니버스의 공명이 아직 동기화되지 않았습니다."}
          </p>
        </div>
        <p className="text-[10px] text-white/20  text-center">
          트리니티는 당신의 운명과 이전 대화의 큰 흐름을 이 컨텍스트에 담아
          관리합니다.
        </p>
      </div>
    </Modal>
  );
}

function LucyRelationshipsModal({
  isOpen,
  onClose,
  sajuData,
  astroCard,
}: {
  isOpen: boolean;
  onClose: () => void;
  sajuData?: string;
  astroCard?: string;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Relationship Resonance">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-6 rounded-[32px] bg-indigo-500/5 border border-indigo-500/10 text-center">
            <p className="text-[10px] text-white/40 uppercase mb-2">Harmony</p>
            <p className="text-2xl font-display text-indigo-400">88%</p>
          </div>
          <div className="p-6 rounded-[32px] bg-indigo-500/5 border border-indigo-500/10 text-center">
            <p className="text-[10px] text-white/40 uppercase mb-2">
              Attraction
            </p>
            <p className="text-2xl font-display text-indigo-400">High</p>
          </div>
        </div>
        <div className="p-8 rounded-[40px] bg-indigo-500/5 border border-indigo-500/10">
          <div className="flex items-center gap-3 mb-6">
            <Users size={18} className="text-indigo-400" />
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
              인연의 주파수
            </span>
          </div>
          <div className="space-y-5 font-sans">
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/30">사주 오행 조화</span>
              <span className="text-indigo-400 font-bold">
                {sajuData ? "동기화 완료" : "데이터 분석 중"}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/30">점성학적 끌림</span>
              <span className="text-indigo-400 font-bold">
                {astroCard ? "활성 상태" : "관찰 중"}
              </span>
            </div>
            <div className="h-[1px] bg-indigo-500/10" />
            <p className="text-[13px] text-white/70 leading-relaxed">
              "현재 당신의 에너지는 따뜻하고 포용적인 기운을 가진 인연과 강하게
              반응합니다. 갈등보다는 이해를 선택하는 시기입니다."
            </p>
          </div>
        </div>
        <p className="text-[10px] text-white/20  text-center">
          루시는 당신의 타고난 기운과 하늘의 지도를 대조하여 인연의 결을
          읽어냅니다.
        </p>
      </div>
    </Modal>
  );
}

function LucyHistoryModal({
  isOpen,
  onClose,
  localHistory,
}: {
  isOpen: boolean;
  onClose: () => void;
  localHistory: any[];
}) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const filteredHistory = useMemo(() => {
    if (!selectedDate) return localHistory;
    return localHistory.filter((h) => {
      const d = new Date(h.createdAt);
      return (
        d.getDate() === selectedDate.getDate() &&
        d.getMonth() === selectedDate.getMonth() &&
        d.getFullYear() === selectedDate.getFullYear()
      );
    });
  }, [localHistory, selectedDate]);

  const highlightDates = useMemo(() => {
    return localHistory.map((h) => new Date(h.createdAt));
  }, [localHistory]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="The Chronicle of Destiny">
      <div className="space-y-8">
        <CalendarView
          onDateSelect={setSelectedDate}
          selectedDate={selectedDate}
          highlightDates={highlightDates}
          color={THEME_COLOR}
        />

        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">
              {selectedDate
                ? `${selectedDate.toLocaleDateString()} 기록`
                : "최근 영적 흔적"}
            </h4>
            {selectedDate && (
              <span className="text-[10px] text-yellow-400/60 font-mono ">
                {filteredHistory.length} logs
              </span>
            )}
          </div>

          <div className="space-y-4">
            {filteredHistory.length === 0 ? (
              <p className="border border-dashed border-white/5 rounded-[32px] p-12 text-center text-white/20 text-xs  font-sans">
                {selectedDate
                  ? "이 날짜의 기록이 없습니다."
                  : "아직 새겨진 역사가 없습니다."}
              </p>
            ) : (
              filteredHistory.slice(0, 10).map((h, i) => (
                <div
                  key={h.id || `hist-${i}`}
                  className="p-6 rounded-[32px] bg-white/[0.03] border border-white/5 hover:border-yellow-500/20 transition-all"
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[9px] font-black text-yellow-500/60 uppercase tracking-[0.2em] bg-yellow-500/5 px-2.5 py-1 rounded-lg border border-yellow-500/10">
                      {TYPE_LABELS[h.type] ||
                        h.type?.replace("_", " ") ||
                        "기록"}
                    </span>
                    <span className="text-[9px] text-white/20 font-mono ">
                      {new Date(h.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[13px] text-white/70 font-sans leading-relaxed whitespace-pre-wrap ">
                    {h.text || h.content || "운명 분석 완료"}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function NoticeBox({
  title,
  message,
  color = "#facc15",
}: {
  title: string;
  message: string;
  color?: string;
}) {
  return (
    <div className="p-6 rounded-[32px] bg-white/[0.03] border border-white/5 space-y-2">
      <h4
        className="text-[10px] font-bold uppercase tracking-widest"
        style={{ color }}
      >
        {title}
      </h4>
      <p className="text-xs text-white/40 leading-relaxed">{message}</p>
    </div>
  );
}

const translateEnglishValue = (val: string) => {
  if (!val) return '';
  const dict: Record<string, string> = {
    'cyan blue': '청청색 (시안 블루)',
    'blue feather': '푸른 깃털',
    'optimal': '최적 지향 (OPTIMAL)',
    'blue': '푸른색',
    'cyan': '시안 청록색',
    'sky blue': '하늘색',
    'crystal': '투명 정수정 원광 (크리스탈)',
    'feather': '푸른 깃털',
    'sapphire': '블루 사파이어',
    'aquamarine': '해람석 (아쿠아마린)',
    'silver': '은빛 보주',
    'water': '심청 정화수',
    'mirror': '성운 거울',
    'indigo': '남색 (인디고)',
    'red': '붉은 적색',
    'orange': '오렌지 주황색',
    'yellow': '황금 노란색',
    'green': '초록 녹색',
    'purple': '보랏빛 자색',
    'pink': '분홍빛 홍색',
    'violet': '제비꽃색',
    'gold': '황금색',
    'white': '순백색',
    'black': '칠흑색',
    'magenta': '진홍색 (마젠타)',
    'stable': '안정화 상태',
    'high': '고공 공명',
    'resonance': '공명 상태',
    'amethyst': '자수정',
    'ruby': '루비',
    'emerald': '에메랄드',
    'diamond': '다이아몬드',
    'obsidian': '흑요석 (옵시디언)',
    'stone': '에너지 원석',
    'ring': '공명 반지',
    'bell': '정화 청동종',
    'candle': '아로마 촛불',
    'incense': '치유 인센스 스ティック',
    'potion': '에너지 비약',
    'scroll': '고대 성서 레시피',
    'key': '통합의 열쇠',
    'emerald green': '에메랄드 녹색',
    'ruby red': '루비 적색'
  };
  const lower = val.toLowerCase().trim();
  if (lower.endsWith('.')) {
    const withoutDot = lower.slice(0, -1).trim();
    if (dict[withoutDot]) return dict[withoutDot];
  }
  if (dict[lower]) return dict[lower];
  return val;
};

function getInitialTrinityDailyResult(uid?: string) {
  try {
    const today = getTodayDateKey();
    const candidateKeys = [
      `trinity_daily_result_${uid || "guest"}_${today}`,
      `trinity_daily_result_guest_${today}`,
      `prism_daily_oracle_trinity_${today}`,
    ];
    for (const key of candidateKeys) {
      const cached = localStorage.getItem(key);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.diagnosis || parsed?.summary || parsed?.prescription) {
          if (parsed.dateKey && parsed.dateKey !== today) continue;
          return parsed;
        }
      }
    }
  } catch (_) {}
  return null;
}

export default function TrinityApp() {
  const [, navigate] = useLocation();
  const isTTSActive = useTTSActive();
  const { firebaseUser, sharedState, updateSharedState, isChatOpen, setIsChatOpen, sendUnifiedMessage, openLucyChat, personaMessages, isGenerating } = useApp();
  const lucyMessages = personaMessages.lucy || [];
  const isSpecialFeatureChromeHidden = useSpecialFeatureChromeHidden();
  const { isCurrentAppPlaying: isBinauralPlaying, toggle: toggleBinaural } = useBinauralBeat('trinity');

  const [activeDailyMode, setActiveDailyMode] = useState<
    "oracle" | "refine" | "combine"
  >("refine");
  const [dailyMode, setDailyMode] = useState<string>("analyze");
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<
    "simple" | "daily" | "soul" | "bible" | "history" | "tarot" | "synergy" | "oracle"
  >(() => {
    if (typeof window !== 'undefined') {
      const urlTab = new URLSearchParams(window.location.search).get('tab');
      const sessionTab = sessionStorage.getItem('prism_target_tab');
      const tab = urlTab || sessionTab;
      if (tab === 'daily' || tab === 'oracle' || tab === 'tarot' || tab === 'synergy') {
        sessionStorage.removeItem('prism_target_tab');
        return tab as any;
      }
    }
    return 'daily';
  });
  useScrollToTopOnChange([activeMode]);
  const [lastNonTarotMode, setLastNonTarotMode] = useState<string>("daily");
  useEffect(() => {
    if (activeMode !== "tarot") {
      setLastNonTarotMode(activeMode);
    }
  }, [activeMode]);

  const [lastNonDailyMode, setLastNonDailyMode] = useState<string>("tarot");
  useEffect(() => {
    if (activeMode !== "daily") {
      setLastNonDailyMode(activeMode);
    }
  }, [activeMode]);

  useEffect(() => {
    const applyTargetTab = (tab: string | null | undefined) => {
      if (!tab) return;
      if (tab === 'daily' || tab === 'oracle' || tab === 'tarot' || tab === 'synergy') {
        setActiveMode(tab as any);
        setShowEmblemModal(false);
        setShowDailyModal(false);
        setShowDashboard(false);
        setShowTarot(false);
        resetAppScroll();
        sessionStorage.removeItem('prism_target_tab');
      }
    };

    const handleTabChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      applyTargetTab(customEvent.detail?.tab);
    };

    const handleNavClick = (e: Event) => {
      const customEvent = e as CustomEvent;
      const path = customEvent.detail?.path || '';
      if (path.startsWith('/trinity')) {
        let tab = customEvent.detail?.tab;
        if (!tab && path.includes('?')) {
          try {
            const url = new URL(path, 'http://localhost');
            tab = url.searchParams.get('tab');
          } catch (_) {}
        }
        if (tab) {
          applyTargetTab(tab);
        } else if (path === '/trinity') {
          setActiveMode('daily');
          setShowEmblemModal(false);
          setShowDailyModal(false);
          setShowDashboard(false);
          setShowTarot(false);
          resetAppScroll();
        }
      }
    };

    window.addEventListener('prism-tab-change', handleTabChange);
    window.addEventListener('nav-click-active', handleNavClick);
    return () => {
      window.removeEventListener('prism-tab-change', handleTabChange);
      window.removeEventListener('nav-click-active', handleNavClick);
    };
  }, []);
  const [stage, setStage] = useState<
    | "landing"
    | "analysis"
    | "station"
    | "history"
    | "onboarding"
    | "soul"
    | "lucky"
  >("landing");
  const [isMeasuringInsight, setIsMeasuringInsight] = useState(false);
  const [isDailyOracleLoading, setIsDailyOracleLoading] = useState(false);
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [limitModalInfo, setLimitModalInfo] = useState<{ open: boolean; type: 'daily' | 'soul'; dapp: string } | null>(null);
  const [dailyResult, setDailyResult] = useState<any>(() => getInitialTrinityDailyResult());
  const dailyResultRef = useRef<any>(dailyResult);
  useEffect(() => {
    dailyResultRef.current = dailyResult;
  }, [dailyResult]);
  const dailyRestoreGuardRef = useRef<string | null>(null);

  // States for Daily Tarot Card Picking
  const dailyDeckScrollRef = useRef<HTMLDivElement>(null);
  const [dailyDeckCompact, setDailyDeckCompact] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768,
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setDailyDeckCompact(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  const [dailyDrawnCard, setDailyDrawnCard] = useState<TarotCard | null>(() => {
    const init = getInitialTrinityDailyResult();
    return (init?.drawnCard as TarotCard) || null;
  });
  const [selectedCardIdx, setSelectedCardIdx] = useState<number | null>(() => {
    const init = getInitialTrinityDailyResult();
    if (init?.drawnCard) {
      const idx = TRINITY_CARDS.findIndex((c) => c.id === init.drawnCard.id);
      return idx >= 0 ? idx : 0;
    }
    return null;
  });
  const [shuffledTrinityCards, setShuffledTrinityCards] = useState(() => shuffleCardDeck(TRINITY_CARDS));
  const [dailyOffsets, setDailyOffsets] = useState<{ xOff: number; yOff: number; rotOff: number }[]>(() =>
    Array.from({ length: 22 }).map(() => ({
      xOff: 0,
      yOff: 0,
      rotOff: 0,
    }))
  );
  useEffect(() => {
    const uid = firebaseUser?.uid || "guest";
    const limitKey = `limit_daily_trinity_${uid}_${getTodayDateKey()}`;
    if (activeMode === "daily" && !dailyDrawnCard && !localStorage.getItem(limitKey) && !localStorage.getItem(`limit_daily_trinity_guest_${getTodayDateKey()}`)) {
      setShuffledTrinityCards(shuffleCardDeck(TRINITY_CARDS));
      setDailyOffsets(
        Array.from({ length: TRINITY_CARDS.length }).map(() => ({
          xOff: 0,
          yOff: 0,
          rotOff: 0,
        }))
      );
    }
  }, [activeMode, dailyDrawnCard, firebaseUser?.uid]);

  const centerDailyDeckScroll = useCallback(() => {
    const el = dailyDeckScrollRef.current;
    if (!el || el.offsetWidth <= 0 || el.offsetHeight <= 0) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) return;
    el.scrollLeft = maxScroll / 2;
  }, []);

  useEffect(() => {
    if (activeMode !== "daily" || dailyDrawnCard) return;
    const run = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(centerDailyDeckScroll);
      });
    };
    run();
    const timers = [120, 350, 700, 1100].map((ms) => window.setTimeout(centerDailyDeckScroll, ms));
    const observed = dailyDeckScrollRef.current ? [dailyDeckScrollRef.current] : [];
    const resizeObserver = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(centerDailyDeckScroll)
      : null;
    observed.forEach((node) => resizeObserver?.observe(node!));
    window.addEventListener("resize", centerDailyDeckScroll);
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      resizeObserver?.disconnect();
      window.removeEventListener("resize", centerDailyDeckScroll);
    };
  }, [activeMode, dailyDrawnCard, shuffledTrinityCards, dailyDeckCompact, centerDailyDeckScroll]);

  const [sessionComfortLevel, setSessionComfortLevel] = useState<number>(() => {
    try {
      const dateStr = new Date().toLocaleDateString('sv');
      const saved = localStorage.getItem('trinity_daily_level_' + dateStr);
      return saved ? parseInt(saved) : 3;
    } catch (_) { return 3; }
  });
  const [sessionLevelCheckedIn, setSessionLevelCheckedIn] = useState<boolean>(() => {
    try {
      const dateStr = new Date().toLocaleDateString('sv');
      const saved = localStorage.getItem('trinity_daily_checked_' + dateStr);
      return saved === 'true';
    } catch (_) { return false; }
  });
  const [isDeckSpreaded, setIsDeckSpreaded] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [isFlipped, setIsFlipped] = useState<boolean>(() => {
    const init = getInitialTrinityDailyResult();
    return !!init?.drawnCard;
  });
  const [isDailyOracleProcessing, setIsDailyOracleProcessing] = useState(false);

  const resetDailyDeckUI = () => {
    setDailyDrawnCard(null);
    setSelectedCardIdx(null);
    setIsFlipped(false);
    setIsDailyOracleLoading(false);
    setShuffledTrinityCards(shuffleCardDeck(TRINITY_CARDS));
  };

  const selectDailyTarotCard = (card: TarotCard, idx: number) => {
    const uid = firebaseUser?.uid || "guest";
    const today = getTodayDateKey();
    const limitKey = `limit_daily_trinity_${uid}_${today}`;
    const guestLimitKey = `limit_daily_trinity_guest_${today}`;
    if (localStorage.getItem(limitKey) || localStorage.getItem(guestLimitKey) || dailyResult || dailyDrawnCard) {
      return;
    }
    // Mobile tactile haptic vibration
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([25, 45, 30]);
      }
    } catch (_) {}
    try {
      const sampleRate = 8000;
      const duration = 0.8;
      const numSamples = sampleRate * duration;
      const buffer = new Float32Array(numSamples);
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        buffer[i] = (Math.sin(2 * Math.PI * 528 * t) + 0.5 * Math.sin(2 * Math.PI * 792 * t)) * 0.25 * Math.exp(-4 * t);
      }
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = audioCtx.createBuffer(1, buffer.length, sampleRate);
      audioBuffer.getChannelData(0).set(buffer);
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      source.start();
    } catch (e) {}
    window.dispatchEvent(new Event("unlock-bgm-audio"));
    setSelectedCardIdx(idx);
    setDailyDrawnCard(card);
    setIsFlipped(true);
  };

  const computeFanDeckWidth = (
    spread: number,
    cardWidthPx: number,
    cardHeightPx: number,
    rotMult: number,
    edgePad = 64,
  ) => {
    const maxRotDeg = Math.abs(0.5 * rotMult);
    const rotRad = (maxRotDeg * Math.PI) / 180;
    const rotatedSpan =
      cardWidthPx * Math.abs(Math.cos(rotRad)) + cardHeightPx * Math.abs(Math.sin(rotRad));
    return Math.ceil(spread + rotatedSpan + edgePad * 2);
  };

  const getFanDeckConfig = (variant: "page" | "modal", compact: boolean) => {
    if (compact) {
      return variant === "page"
        ? {
            spread: 340,
            yMult: 82,
            rotMult: 38,
            deckWidth: computeFanDeckWidth(340, 60, 100, 38, 48),
            heightClass: "h-52",
            cardClass:
              "absolute w-[3.75rem] h-[6.25rem] bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-950 border border-yellow-500/30 rounded-2xl shadow-xl flex items-center justify-center cursor-pointer hover:border-yellow-300 hover:ring-1 hover:ring-yellow-400/50 hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] active:scale-95 group/card",
            cardPos: { left: "calc(50% - 1.875rem)", top: "calc(50% - 3.125rem)" },
          }
        : {
            spread: 300,
            yMult: 68,
            rotMult: 32,
            deckWidth: computeFanDeckWidth(300, 56, 96, 32, 44),
            heightClass: "h-48",
            cardClass:
              "absolute w-14 h-24 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-950 border border-yellow-500/30 rounded-2xl shadow-xl flex items-center justify-center cursor-pointer hover:border-yellow-300 hover:ring-1 hover:ring-yellow-400/50 hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] active:scale-95 group/card",
            cardPos: { left: "calc(50% - 1.75rem)", top: "calc(50% - 3rem)" },
          };
    }

    return variant === "page"
      ? {
          spread: 620,
          yMult: 140,
          rotMult: 42,
          deckWidth: Math.max(computeFanDeckWidth(620, 72, 120, 42, 68), 960),
          heightClass: "h-56 md:h-60",
          cardClass:
            "absolute w-[4.5rem] h-[7.5rem] bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-950 border border-yellow-500/30 rounded-2xl shadow-xl flex items-center justify-center cursor-pointer hover:border-yellow-300 hover:ring-1 hover:ring-yellow-400/50 hover:shadow-[0_0_24px_rgba(234,179,8,0.45)] active:scale-95 group/card",
          cardPos: { left: "calc(50% - 2.25rem)", top: "calc(50% - 3.75rem)" },
        }
      : {
          spread: 560,
          yMult: 110,
          rotMult: 36,
          deckWidth: Math.max(computeFanDeckWidth(560, 64, 112, 36, 64), 880),
          heightClass: "h-56 md:h-60",
          cardClass:
            "absolute w-16 h-28 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-950 border border-yellow-500/30 rounded-2xl shadow-xl flex items-center justify-center cursor-pointer hover:border-yellow-300 hover:ring-1 hover:ring-yellow-400/50 hover:shadow-[0_0_24px_rgba(234,179,8,0.45)] active:scale-95 group/card",
          cardPos: { left: "calc(50% - 2rem)", top: "calc(50% - 3.5rem)" },
        };
  };

  const renderDailyCardBack = (variant: "page" | "modal") => {
    const iconSize = variant === "page" ? 14 : 12;
    const iconWrap = variant === "page" ? "w-8 h-8" : "w-7 h-7";
    return (
      <>
        <div className="absolute inset-1 border border-yellow-500/10 rounded-xl pointer-events-none" />
        <div className="absolute inset-1 border border-yellow-500/20 rounded-xl flex flex-col items-center justify-center bg-yellow-500/5 group-hover/card:bg-yellow-500/15 transition-all shadow-inner">
          <div className={`${iconWrap} rounded-full border border-yellow-500/20 flex items-center justify-center bg-black/40 shadow-md group-hover/card:border-yellow-400/40 transition-all`}>
            <Sparkles size={iconSize} className="text-yellow-400 group-hover/card:scale-115 group-hover/card:text-yellow-200 transition-all shadow-[0_0_10px_rgba(234,179,8,0.8)] animate-pulse" />
          </div>
        </div>
      </>
    );
  };

  const renderFanDailyDeck = (keyPrefix = "trinity-deck", variant: "page" | "modal" = "page") => {
    const { spread, yMult, rotMult, deckWidth, heightClass, cardClass, cardPos } =
      getFanDeckConfig(variant, dailyDeckCompact);

    return (
      <div
        className={`relative ${heightClass} shrink-0 select-none overflow-visible py-4`}
        style={{ width: deckWidth, minWidth: deckWidth, perspective: "1000px" }}
      >
        {shuffledTrinityCards.map((card, idx) => {
          const total = shuffledTrinityCards.length;
          const progress = total > 1 ? idx / (total - 1) - 0.5 : 0;
          const offset = dailyOffsets[idx] || { xOff: 0, yOff: 0, rotOff: 0 };
          const xOffset = progress * spread + offset.xOff;
          const yOffset = progress * progress * yMult + offset.yOff;
          const rotateZ = progress * rotMult + offset.rotOff;
          const zIndex = Math.round((0.5 - Math.abs(progress)) * 100) + 10;
          const spreadDelay = Math.abs(progress) * 0.08;

          return (
            <motion.button
              type="button"
              key={`${keyPrefix}-fan-${card.id}-${idx}`}
              initial={{ x: 0, y: 24, opacity: 0, scale: 0.42, rotateZ: 0 }}
              animate={{ x: xOffset, y: yOffset, rotateZ, scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 105,
                damping: 17,
                delay: spreadDelay,
              }}
              whileHover={{
                y: yOffset - 16,
                scale: 1.08,
                rotateZ: rotateZ * 0.3,
                zIndex: 500,
                transition: { type: "spring", stiffness: 350, damping: 20 },
              }}
              whileTap={{
                y: yOffset - 24,
                scale: 1.10,
                rotateZ: 0,
                zIndex: 600,
                transition: { type: "spring", stiffness: 450, damping: 15 },
              }}
              onTouchStart={() => {
                try {
                  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                    navigator.vibrate(15);
                  }
                } catch (_) {}
              }}
              onClick={() => selectDailyTarotCard(card, idx)}
              className={cardClass}
              style={{ ...cardPos, transformOrigin: "bottom center", zIndex }}
              aria-label={`데일리 타로 카드 ${idx + 1} 선택`}
            >
              {renderDailyCardBack(variant)}
            </motion.button>
          );
        })}
      </div>
    );
  };

  const renderDailyCardDeck = (keyPrefix: string, variant: "page" | "modal") => {
    const { deckWidth } = getFanDeckConfig(variant, dailyDeckCompact);

    return (
      <div className="relative w-full max-w-full overflow-visible">
        {!dailyDeckCompact && (
          <>
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 z-5 w-8 sm:w-10 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 z-5 w-8 sm:w-10 bg-gradient-to-l from-zinc-950 via-zinc-950/80 to-transparent" />
          </>
        )}
        <div
          ref={dailyDeckScrollRef}
          className="w-full overflow-x-auto overflow-y-visible premium-scroll scrollbar-none touch-pan-x overscroll-x-contain scroll-smooth py-2 px-6 sm:px-10"
        >
          <div
            className="flex items-end justify-center mx-auto py-2"
            style={{ width: deckWidth, minWidth: deckWidth }}
          >
            {renderFanDailyDeck(keyPrefix, variant)}
          </div>
        </div>
        <p className="text-center text-[10px] text-white/35 mt-1 tracking-wide">
          {dailyDeckCompact ? "부채꼴 덱을 좌우로 넘기며 카드를 선택하세요" : "카드를 탭해 선택하세요"}
        </p>
      </div>
    );
  };

  const resetTarotSession = useCallback((preserveDailyIfUnfinished = true) => {
    setDrawnCards(null);
    setTarotResult(null);
    setTarotSubMessages([]);
    setTarotVirtualMode(false);
    setSmartTarotQuestions([]);
    setIsTarotGenerating(false);
    setStage("landing");
    const uid = firebaseUser?.uid || "guest";
    const today = getTodayDateKey();
    const limitGuest = localStorage.getItem(`limit_daily_trinity_guest_${today}`);
    const limitUser = localStorage.getItem(`limit_daily_trinity_${uid}_${today}`);
    const init = getInitialTrinityDailyResult(uid);
    const isDone = !!limitGuest || !!limitUser || !!init || !!dailyResult;
    if (!isDone && preserveDailyIfUnfinished) {
      setTarotConcern("오늘의 타로");
    } else {
      setTarotConcern("");
    }
  }, [dailyResult, firebaseUser?.uid]);

  const [form, setForm] = useState<ProfileForm>(() => {
    const p = getPersistentUserProfile()?.basic;
    return {
      name: p?.name || "",
      birthdate: p?.birthdate || "",
      birthtime: p?.birthtime || "",
      gender: p?.gender === "male" ? "남성" : "여성",
      nickname: p?.nickname || "",
      city: p?.birthCity || "서울",
    };
  });
  const [sajuData, setSajuData] = useState("");
  const [astroData, setAstroData] = useState("");
  const [visionConcern, setVisionConcern] = useState("");



  const ALL_TAROT_SUGGESTIONS = [
    "올해 신년운세와 사계절 동안 찾아올 대운의 흐름은?",
    "내 타고난 사주 기운과 어우러진 올해의 성취와 운명선은?",
    "상대방은 지금 나를 어떻게 생각하고 있나요?",
    "제가 지금 진행중인 일의 최종 결과는 어떻게 될까요?",
    "올 한 해 동안 꼭 잡아야 할 가장 큰 기회와 조언은?",
    "사주팔자의 오행 흐름과 결합한 직업 및 재물 대운은?",
    "저의 연애운의 현재 상황과 다가올 미래의 흐름을 보여주세요.",
    "새로운 도전을 고민하고 있는데, 도전한다면 결과가 좋을까요?",
    "현재 직장에서의 이직이나 부서 이동 등의 운은 어떤가요?",
    "가까운 시일 내에 저에게 찾아올 가장 긍정적인 행운은?",
    "금전적인 흐름과 재물운을 좋게 만들려면 어떻게 해야 할까요?",
    "최근 인간관계에서 느끼는 스트레스를 해결할 수 있는 조언은?",
    "올해 저에게 가장 크게 다가올 변화는 무엇인가요?",
    "망설이고 있는 결정이 있는데, 어느 쪽을 선택하는 것이 지혜로울까요?",
    "현재 나와 상대방 사이에 가로막혀 있는 장애물은 무엇인가요?",
    "내 안에 잠재된 능력을 최고로 끌어올리는 방법은 무엇일까요?",
    "과거의 미련에서 벗어나 온전히 나의 미래에 집중하기 위한 길잡이는?",
    "솔로 탈출을 위해 내가 지금 당장 시작해야 할 일은 무엇일까요?",
    "이번 달 조심해야 할 대인관계 갈등 예방 팁은?"
  ];

  const [tarotSuggestions, setTarotSuggestions] = useState<string[]>(() => {
    const shuffled = [...ALL_TAROT_SUGGESTIONS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4);
  });

  const handleRefreshTarotSuggestions = () => {
    const shuffled = [...ALL_TAROT_SUGGESTIONS].sort(() => 0.5 - Math.random());
    setTarotSuggestions(shuffled.slice(0, 4));
  };

  const ALL_TRINITY_SUGGESTIONS = [
    "현재 나의 가장 큰 장애물은 무엇인가요?",
    "어떻게 하면 다음 단계로 나아갈 수 있을까요?",
    "우주가 나에게 지금 주려는 지혜는 무엇일까요?",
    "나의 진정한 목표를 찾기 위한 질문을 던져주세요.",
    "내가 버려야 할 오래된 습관은 무엇인가요?",
    "새로운 기회를 맞이하기 위해 준비할 것은?",
    "나의 잠재력을 완전히 발휘하기 위한 영적 조언은 무엇인가요?",
    "지금 나에게 필요한 긍정적 에너지를 채우는 명상법을 알려주세요.",
    "관계에서의 스트레스를 해결하기 위한 근본적인 갈등 해소 방안은?",
    "앞으로 3개월간 저에게 찾아올 가장 긍정적인 운명적 흐름은?",
    "정체된 생각과 감정에서 벗어나 행동력을 극대화할 수 있는 비결은?",
    "내 영혼의 깊은 상처를 스스로 치유할 수 있는 자기 자비의 첫걸음은?"
  ];

  const [trinitySuggestions, setTrinitySuggestions] = useState<string[]>(() => {
    const shuffled = [...ALL_TRINITY_SUGGESTIONS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4);
  });

  const handleRefreshTrinitySuggestions = () => {
    const shuffled = [...ALL_TRINITY_SUGGESTIONS].sort(() => 0.5 - Math.random());
    setTrinitySuggestions(shuffled.slice(0, 4));
  };

  const [showEmblemModal, setShowEmblemModal] = useState(false);

  const [soulData, setSoulData] = useState({
    coreValue: "영적 통찰과 운명적 흐름",
    unconsciousPattern: "운명에 대한 불안과 완벽주의",
    preference: "신비롭고 꿰뚫어보는 어조",
    stats: [
      { subject: '영성', A: 95, fullMark: 100 },
      { subject: '직관력', A: 90, fullMark: 100 },
      { subject: '통찰력', A: 85, fullMark: 100 },
      { subject: '수용성', A: 80, fullMark: 100 },
      { subject: '초월성', A: 85, fullMark: 100 },
    ],
    energyFlow: [
      { time: '월', value: 80 }, { time: '화', value: 85 }, { time: '수', value: 70 }, { time: '목', value: 90 }, { time: '금', value: 95 }, { time: '토', value: 100 }, { time: '일', value: 85 }
    ],
    emotions: [
      { name: '깨달음', value: 40 }, { name: '불안', value: 20 }, { name: '신비함', value: 30 }, { name: '순응', value: 10 }
    ]
  });

  useEffect(() => {
    if (!firebaseUser) return;
    const isDev = localStorage.getItem('developer_bypass') === 'true';
    if (isDev) {
      try {
        const saved = localStorage.getItem('soul_mirror_trinity');
        if (saved) {
          setSoulData(JSON.parse(saved));
        }
      } catch (_) {}
      return;
    }
    const loadSoulMirrorData = async () => {
      try {
        const docRef = doc(db, 'soul_mirror', firebaseUser.uid, 'dapps', 'trinity');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setSoulData(snap.data() as any);
        } else {
          const saved = localStorage.getItem('soul_mirror_trinity');
          if (saved) {
            setSoulData(JSON.parse(saved));
          }
        }
      } catch (e) {
        console.warn("[Trinity] Error loading persisted soul data from cloud, falling back to local storage:", e);
        try {
          const saved = localStorage.getItem('soul_mirror_trinity');
          if (saved) {
            setSoulData(JSON.parse(saved));
          }
        } catch (_) {}
      }
    };
    loadSoulMirrorData();
  }, [firebaseUser]);
  const [showTarot, setShowTarot] = useState(false);

  useEffect(() => {
    if (showTarot) {
      handleRefreshTarotSuggestions();
    }
  }, [showTarot]);

  const [tarotVirtualMode, setTarotVirtualMode] = useState(false);
  const [tarotResult, setTarotResult] = useState<string | null>(null);
  const [drawnCards, setDrawnCards] = useState<TarotCard[] | null>(null);
  const [hideTarotPopup, setHideTarotPopup] = useState(false);
  const [tarotSubMessages, setTarotSubMessages] = useState<
    { role: "user" | "model"; content: string }[]
  >([]);
  const [tarotChatInput, setTarotChatInput] = useState("");
  const [isTarotSubChatGenerating, setIsTarotSubChatGenerating] =
    useState(false);
  const [dailySubMessages, setDailySubMessages] = useState<
    { role: "user" | "model"; content: string }[]
  >([]);
  const [dailyChatInput, setDailyChatInput] = useState("");
  const [isDailySubChatGenerating, setIsDailySubChatGenerating] =
    useState(false);
  const [tarotConcern, setTarotConcern] = useState<string>(() => {
    const today = getTodayDateKey();
    const guestLimit = typeof window !== "undefined" ? localStorage.getItem(`limit_daily_trinity_guest_${today}`) : null;
    const init = getInitialTrinityDailyResult();
    if (!init && !guestLimit) {
      return "오늘의 타로";
    }
    return "";
  });
  const [customSpread, setCustomSpread] = useState<TarotSpreadRecommendation | null>(null);
  const [isSpreadModalOpen, setIsSpreadModalOpen] = useState(false);
  const tarotConcernAnalysis: TarotConcernAnalysis = useMemo(() => {
    const base = analyzeTarotConcern(tarotConcern);
    if (customSpread) {
      const kind: TarotConcernKind = customSpread.theme === 'binary_choice' ? 'binary_choice' : 'open';
      return {
        ...base,
        kind,
        theme: customSpread.theme,
        spread: customSpread,
      };
    }
    return base;
  }, [tarotConcern, customSpread]);
  const tarotSpreadRecommendation = tarotConcernAnalysis.spread;
  const isAutoRecommended = !customSpread;
  const [isTarotGenerating, setIsTarotGenerating] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [luckyMode, setLuckyMode] = useState<"saju" | "tarot" | "astro">(
    "saju",
  );
  const [insightResult, setInsightResult] = useState<any>(null);
  const [poeInsight, setPoeInsight] = useState<{
    insight: string;
    category: string;
  } | null>(null);
  const [isInsightCollapsed, setIsInsightCollapsed] = useState(false);
  const [notice, setNotice] = useState<{
    open: boolean;
    title: string;
    message: string;
  }>({ open: false, title: "", message: "" });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [localHistory, setLocalHistory] = useState<HistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  const [smartTarotQuestions, setSmartTarotQuestions] = useState<string[]>([]);

  useEffect(() => {
    const concern = tarotConcern.trim();
    if (concern.length < 8) {
      setSmartTarotQuestions([]);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setIsGeneratingQuestions(true);
      try {
        const resText = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                '사용자 고민에 맞는 타로 질문 3개를 한국어로 생성하세요. JSON만 출력: { "questions": ["질문1", "질문2", "질문3"] }. 각 질문은 20~60자, 구체적이고 결정 가능해야 합니다.',
            },
            { role: "user", content: concern },
          ],
          responseFormat: { type: "json_object" },
        });
        if (cancelled) return;
        const parsed = JSON.parse(resText || "{}");
        if (Array.isArray(parsed.questions)) {
          setSmartTarotQuestions(
            parsed.questions.filter((q: unknown) => typeof q === "string").slice(0, 3),
          );
        }
      } catch {
        if (!cancelled) setSmartTarotQuestions([]);
      } finally {
        if (!cancelled) setIsGeneratingQuestions(false);
      }
    }, 900);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [tarotConcern]);
  const [isSending, setIsSending] = useState(false);
  const [showTarotModal, setShowTarotModal] = useState(false);
  const [tarotModalTab, setTarotModalTab] = useState<"daily" | "tarot">("tarot");
  const [showDashboard, setShowDashboard] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const isSendingRef = useRef(false);

  // Dispatch custom event to notify global shell only when modal or full-screen virtual mode is active
  useEffect(() => {
    const isShowingTarot = showTarotModal || tarotVirtualMode;
    const evName = isShowingTarot ? "tarot-active" : "tarot-inactive";
    window.dispatchEvent(new CustomEvent(evName));
    return () => {
      window.dispatchEvent(new CustomEvent("tarot-inactive"));
    };
  }, [showTarotModal, tarotVirtualMode]);

  // Sync Profile with Shared State
  useEffect(() => {
    const fbProfile = sharedState?.userProfile?.basic || getPersistentUserProfile()?.basic;
    if (!fbProfile) return;

    setForm((prev) => ({
      name: fbProfile.name || prev.name,
      nickname: fbProfile.nickname || prev.nickname,
      birthdate: fbProfile.birthdate || prev.birthdate,
      birthtime: fbProfile.birthtime || prev.birthtime,
      gender: fbProfile.gender === "male" ? "남성" : (fbProfile.gender === "female" ? "여성" : prev.gender),
      city: fbProfile.birthCity || prev.city || "서울",
    }));

    if (fbProfile.birthdate) {
      const [y, m, d] = fbProfile.birthdate.split("-").map(Number);
      const h = fbProfile.birthtime
        ? parseInt(fbProfile.birthtime.split(":")[0])
        : -1;
      const saju = calcSaju(
        y,
        m,
        d,
        h,
        fbProfile.gender === "male" ? "남성" : "여성",
      );
      const astro = calcAstro(y, m, d, h, fbProfile.birthCity || "서울");
      setSajuData(saju);
      setAstroData(astro);
    }
  }, [sharedState?.userProfile?.basic]);

  // Sync History from Firebase
  useEffect(() => {
    if (!firebaseUser) {
      setIsHistoryLoading(false);
      return;
    }
    const isDev = localStorage.getItem('developer_bypass') === 'true';
    if (isDev) {
      setIsHistoryLoading(false);
      return;
    }

    setIsHistoryLoading(true);

    let unsub: (() => void) | null = null;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;

    const subscribe = () => {
      const q = query(
        collection(db, "trinity_history", firebaseUser.uid, "entries"),
        orderBy("createdAt", "desc"),
      );
      unsub = onSnapshot(q, (snap) => {
        const docs = snap.docs
          .map((d) => ({
            id: d.id,
            ...d.data(),
            createdAt: (d.data() as any).createdAt?.toMillis?.() || Date.now(),
          }))
          .filter((d: any) => d.type !== 'chat');
        setLocalHistory(docs as HistoryItem[]);
        setIsHistoryLoading(false);
      }, (error) => {
        const msg = error?.message || '';
        if (msg.includes('INTERNAL ASSERTION FAILED')) {
          console.warn('[Trinity] Firestore 내부 오류 — 5초 후 재연결합니다.');
          retryTimeout = setTimeout(subscribe, 5000);
        } else if (msg.includes('Quota') || msg.includes('quota') || msg.includes('resource-exhausted')) {
          console.warn('[Trinity] Firestore 할당량 한도 도달 — 로컬 캐시를 사용합니다.');
          setIsHistoryLoading(false);
        } else {
          console.warn('[Trinity] onSnapshot notice:', error?.message || error);
          setIsHistoryLoading(false);
        }
      });
    };

    subscribe();
    return () => {
      unsub?.();
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [firebaseUser]);


  const trinityOracleHistory = useMemo(
    () => [...(sharedState?.trinityHistory || []), ...localHistory],
    [sharedState?.trinityHistory, localHistory],
  );

  const isTrinityDailyLockedToday = useCallback(() => {
    return false;
  }, []);

  const applyDailyResultState = useCallback((result: any) => {
    if (!result) return;
    setDailyResult(result);
    if (result.drawnCard) {
      const restoredCard = result.drawnCard as TarotCard;
      setDailyDrawnCard(restoredCard);
      const idx = TRINITY_CARDS.findIndex((c) => c.id === restoredCard.id);
      setSelectedCardIdx(idx >= 0 ? idx : null);
      setIsFlipped(true);
    }
  }, []);

  const restoreTodayDailyResult = useCallback((): boolean => {
    const uid = firebaseUser?.uid || "guest";
    const today = getTodayDateKey();

    // Check sharedState from Firestore first (cross-device source of truth)
    if (sharedState?.todayOracles?.[today]?.trinity) {
      const oracle = sharedState.todayOracles[today].trinity;
      if (oracle?.diagnosis || oracle?.summary || oracle?.prescription || (oracle as any)?.reading) {
        applyDailyResultState(oracle);
        return true;
      }
    }
    if (sharedState?.latestDailyOracles?.trinity) {
      const latest = sharedState.latestDailyOracles.trinity;
      if (latest.dateKey === today && (latest.diagnosis || latest.summary || latest.prescription)) {
        applyDailyResultState(latest);
        return true;
      }
    }

    try {
      const candidateKeys = [
        getTrinityDailyResultKey(uid),
        getTrinityDailyResultKey("guest"),
        `trinity_daily_result_${uid}_${today}`,
        `trinity_daily_result_guest_${today}`,
        `prism_daily_oracle_trinity_${today}`,
      ];
      for (const key of candidateKeys) {
        const cached = localStorage.getItem(key);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.diagnosis || parsed?.summary || parsed?.prescription) {
            if (parsed.dateKey && parsed.dateKey !== today) continue;
            applyDailyResultState(parsed);
            return true;
          }
        }
      }
    } catch (_) {}

    const entry = findTodayOracleInSources(trinityOracleHistory, ["oracle-vision"]);
    const resolved = entry ? resolveOracleVisionResult(entry) : null;
    if (resolved && (resolved.diagnosis || resolved.summary || resolved.prescription)) {
      applyDailyResultState(resolved);
      try {
        localStorage.setItem(getTrinityDailyResultKey(uid), JSON.stringify(resolved));
        localStorage.setItem(getTrinityDailyResultKey("guest"), JSON.stringify(resolved));
      } catch (_) {}
      return true;
    }

    return false;
  }, [firebaseUser?.uid, sharedState?.todayOracles, sharedState?.latestDailyOracles, trinityOracleHistory, applyDailyResultState]);

  // Listen for real-time daily oracle updates across devices
  useEffect(() => {
    const handleDailyOracleUpdated = () => {
      restoreTodayDailyResult();
    };
    window.addEventListener('prism:daily_oracle_updated', handleDailyOracleUpdated);
    return () => {
      window.removeEventListener('prism:daily_oracle_updated', handleDailyOracleUpdated);
    };
  }, [restoreTodayDailyResult]);

  // Reactive restore on mount or sharedState update when in daily mode
  useEffect(() => {
    if (activeMode === "daily" && !dailyResult) {
      restoreTodayDailyResult();
    }
  }, [activeMode, dailyResult, restoreTodayDailyResult, sharedState?.todayOracles, sharedState?.latestDailyOracles]);

  const enterDailyMode = useCallback(() => {
    const isLocked = isTrinityDailyLockedToday();
    const existing = getInitialTrinityDailyResult(firebaseUser?.uid);
    if (isLocked || existing) {
      restoreTodayDailyResult();
      setShowDailyModal(true);
    } else {
      resetTarotSession(true);
      setActiveMode("tarot");
    }
  }, [isTrinityDailyLockedToday, restoreTodayDailyResult, firebaseUser?.uid, resetTarotSession]);

  const isDailyOracleAlreadyDone = false;

  const isDailyTarotBlocked = false;

  useEffect(() => {
    const todayKey = getTodayDateKey();

    if (isTrinityDailyLockedToday() || getInitialTrinityDailyResult(firebaseUser?.uid)) {
      if (!dailyResultRef.current && dailyRestoreGuardRef.current !== todayKey) {
        dailyRestoreGuardRef.current = todayKey;
        restoreTodayDailyResult();
      }
    }
  }, [sharedState, isTrinityDailyLockedToday, restoreTodayDailyResult, firebaseUser?.uid]);

  useEffect(() => {
    if (localHistory && localHistory.length > 0) {
      const latestSoul = localHistory.find((h: any) => h.type === "energy_analysis");
      if (latestSoul) {
        setInsightResult(latestSoul.data || latestSoul);
      }
    }
  }, [localHistory]);

  useEffect(() => {
    if (dailyResult?.drawnCard && !dailyDrawnCard) {
      const card = dailyResult.drawnCard as TarotCard;
      setDailyDrawnCard(card);
      const idx = TRINITY_CARDS.findIndex((c) => c.id === card.id);
      setSelectedCardIdx(idx >= 0 ? idx : null);
      setIsFlipped(true);
    }
  }, [dailyResult, dailyDrawnCard]);

  const handleSend = async (customMsg?: string, sendOpts?: OracleDeepInsightSendOpts) => {
    const userMsg = (customMsg || chatInput).trim();
    if (!sendOpts?.force && ((!userMsg && !selectedImage) || isSendingRef.current || isGenerating.lucy)) return;
    if (!userMsg && !selectedImage) return;

    isSendingRef.current = true;
    setIsSending(true);
    if (!customMsg) setChatInput("");
    const userImage = selectedImage;
    setSelectedImage(null);
    openLucyChat('trinity');

    poeQuickInsight(userMsg, lucyMessages as any)
      .then((res: any) => {
        if (res && res.insight) {
          setPoeInsight({ insight: res.insight, category: res.category });
          setIsInsightCollapsed(false);
          if (res.themeColor || res.currentVibe) {
            updateSharedState({
              ...(res.themeColor ? { themeColor: res.themeColor } : {}),
              ...(res.currentVibe ? { currentVibe: res.currentVibe } : {})
            }, 'TRINITY');
          }
        }
      })
      .catch(console.error);

    try {
      const profile = sharedState?.userProfile;
      let deepCoreInfo = buildDeepSynapseContext(profile);
      const soulMirrorInfo = `\n[영혼의 거울]\n- 핵심 가치: ${soulData.coreValue}\n- 무의식적 패턴: ${soulData.unconsciousPattern}\n- 취향 및 선호: ${soulData.preference}\n이 데이터를 바탕으로 사용자의 방향성을 교정하여 ���칭에 반영할 것. 또한, 이번 대화를 바탕으로 이 영혼의 거울 데이터(핵심 가치, 패턴, 취향, stats, energyFlow, emotions 등)를 갱신해야 한다면 응답의 가장 마지막에 오직 다음 포맷으로만 업데이트 내용을 출력하세요: [SOUL_UPDATE: {"coreValue":"...","unconsciousPattern":"...","preference":"...","stats":[{"subject":"...","A":85,"fullMark":100}],"energyFlow":[{"time":"...","value":80}],"emotions":[{"name":"...","value":40}]}]`;
      deepCoreInfo += "\n" + soulMirrorInfo;

      const oracleCtx = sendOpts?.oracleContext ? `\n${sendOpts.oracleContext}` : '';
      await sendUnifiedMessage(userMsg || "이 이미지 분석하고 해설해줘!", 'trinity', userImage || undefined, {
        extraSystemContext: `${deepCoreInfo}${oracleCtx}`,
        systemSuffix: undefined,
        onFinish: async (finalResponse, sentText) => {

          const soulMatch = finalResponse.match(/\[SOUL_UPDATE:\s*({[\s\S]*?})\]/);
          if (soulMatch) {
            try {
              const parsed = JSON.parse(soulMatch[1]);
              setSoulData(prev => {
                const updated = { ...prev, ...parsed };
                if (firebaseUser) {
                  const isDev = localStorage.getItem('developer_bypass') === 'true';
                  if (isDev) {
                    localStorage.setItem('soul_mirror_trinity', JSON.stringify(updated));
                  } else {
                    setDoc(doc(db, 'soul_mirror', firebaseUser.uid, 'dapps', 'trinity'), updated)
                      .catch(e => console.error("Error writing updated soul data:", e));
                  }
                }
                return updated;
              });
            } catch (e) {
              console.error("Soul update parse error", e);
            }
          }

          if (firebaseUser && localStorage.getItem('developer_bypass') !== 'true') {
            try {
              const cleanTextForSave = finalResponse
                .replace(/\[EMOTION:\s*[^\]]*\]/gi, "")
                .replace(/\[EMOTION:[\s\S]*?$/, "")
                .replace(/\[SUGGESTIONS:.*?\]/g, "")
                .replace(/\[SOUL_UPDATE:[\s\S]*$/, "")
                .trim();
              await addDoc(collection(db, "trinity_history", firebaseUser.uid, "entries"), {
                type: "chat",
                title: `우주 교감: ${sentText.slice(0, 20)}${sentText.length > 20 ? '...' : ''}`,
                content: `질문: "${sentText}"\n\n조율 메시지:\n${cleanTextForSave}`,
                createdAt: serverTimestamp(),
                metadata: {
                  question: sentText,
                  reply: cleanTextForSave
                }
              });
            } catch (error) {
              console.error("Error saving Trinity chat log:", error);
            }
          }
        },
      });
    } catch (err) {
      console.error(err);
    } finally {
      isSendingRef.current = false;
      setIsSending(false);
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

    const handleUnifiedReading = async (
    type: "daily" | "tarot",
    params?: {
      selectedCards?: TarotCard[];
      selectedCard?: TarotCard;
      autoRun?: boolean;
      touchMetadata?: TarotPhysicalMetadata | null;
    },
  ) => {
    if (type === "daily") {
      const card = params?.selectedCard;
      const selectedCard = card || dailyDrawnCard;
      if (!selectedCard) {
        if (!params?.autoRun) {
          setNotice({
            open: true,
            title: "카드 선택 필요",
            message: "22장의 메이저 타로 카드 중 오늘의 카드를 먼저 선택해 주세요.",
          });
        }
        return;
      }
      if (dailyResult) {
        if (!params?.autoRun) {
          setShowDailyModal(true);
        }
        return;
      }
      if (isDailyOracleLoading) return;

      setIsDailyOracleLoading(true);

      try {
        let data: any = null;

        // Try fast dedicated server endpoint first
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 12000);

          const profile = sharedState?.userProfile || getPersistentUserProfile();
          const apiRes = await fetch("/api/ai/daily-tarot", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              card: selectedCard,
              mode: dailyMode,
              comfortLevel: sessionComfortLevel,
              profile,
            }),
          });
          clearTimeout(timer);

          if (apiRes.ok) {
            const parsed = await apiRes.json();
            if (parsed && (parsed.diagnosis || parsed.summary)) {
              data = parsed;
            }
          }
        } catch (fetchErr) {
          console.warn("[Trinity Daily Tarot] Dedicated API fetch failed/timed out, using local specialized oracle engine:", fetchErr);
        }

        // Fallback to rich card-specific local engine if server response is unavailable
        if (!data || !data.diagnosis) {
          data = buildLocalTrinityDailyOracle(selectedCard, dailyMode);
        }

        const resultWithCard = {
          ...data,
          drawnCard: selectedCard,
          dateKey: getTodayDateKey(),
        };

        setDailyResult(resultWithCard);
        setDailyDrawnCard(selectedCard);
        setIsFlipped(true);
        if (!params?.autoRun) {
          setShowDailyModal(true);
        }
        try {
          localStorage.setItem(getTrinityDailyResultKey("guest"), JSON.stringify(resultWithCard));
          localStorage.setItem(`trinity_daily_result_guest_${getTodayDateKey()}`, JSON.stringify(resultWithCard));
        } catch (_) {}

        recordDailyOracleResult({
          app: 'trinity',
          featureName: '오늘의 데일리 타로',
          cardName: `${selectedCard.nameKo} (${selectedCard.name})`,
          cardKeywords: selectedCard.keywords,
          drawnCard: selectedCard,
          diagnosis: data.diagnosis || data.summary || '',
          remedy: data.remedy || '',
          spiritualEnergy: data.spiritualEnergy || '',
          blessingMessage: data.blessingMessage || '',
          frequency: data.frequency || '528Hz',
          symbol: data.symbol || selectedCard.keywords[0] || '',
          dateKey: getTodayDateKey(),
        });

        // Background non-blocking sync to cloud
        try {
          const todayK = getTodayDateKey();
          updateSharedState({
            lastTrinityDailySync: Date.now(),
            todayOracles: {
              ...(sharedState?.todayOracles || {}),
              [todayK]: {
                ...(sharedState?.todayOracles?.[todayK] || {}),
                trinity: resultWithCard,
              },
            },
            latestDailyOracles: {
              ...(sharedState?.latestDailyOracles || {}),
              trinity: resultWithCard,
            },
          }, "TRINITY");
        } catch (_) {}

        if (firebaseUser && localStorage.getItem("developer_bypass") !== "true") {
          void addDoc(collection(db, "trinity_history", firebaseUser.uid, "entries"), {
            type: "oracle-vision",
            title: `데일리 오라클: ${selectedCard.nameKo}`,
            content: `오라클 비전:\n${data.diagnosis || data.summary || data.prescription}`,
            createdAt: serverTimestamp(),
            data: resultWithCard,
            metadata: {
              card: selectedCard.name,
              comfortLevel: sessionComfortLevel,
            },
          }).catch((err) => console.error("Daily Oracle save error:", err));
        }
      } catch (e: any) {
        console.warn("[Trinity Daily Tarot] Exception caught:", e);
        const fallbackData = buildLocalTrinityDailyOracle(selectedCard, dailyMode);
        const resultWithCard = {
          ...fallbackData,
          drawnCard: selectedCard,
          dateKey: getTodayDateKey(),
        };
        setDailyResult(resultWithCard);
        setDailyDrawnCard(selectedCard);
        setIsFlipped(true);
        if (!params?.autoRun) {
          setShowDailyModal(true);
        }
      } finally {
        setIsDailyOracleLoading(false);
      }
    } else {
      // Detailed Tarot Reading Tab
      const selectedCards = params?.selectedCards;
      if (!tarotConcern.trim()) {
        setNotice({
          open: true,
          title: "주제 입력 필요",
          message: "타로점의 목적이나 질문을 입력해주세요.",
        });
        return;
      }

      // 🌟 Check if this is the 1-card Daily Oracle flow from Tarot special feature
      if (isDailyTarotConcern(tarotConcern)) {
        if (!selectedCards || selectedCards.length === 0) {
          setTarotVirtualMode(true);
          return;
        }
        // Seamlessly register daily result in the background so today's daily record is saved without jumping modes
        try {
          const uid = firebaseUser?.uid || "guest";
          const today = getTodayDateKey();
          const card = selectedCards[0];
          const localDaily = buildLocalTrinityDailyOracle(card, "oracle");
          const dailyWithCard = {
            ...localDaily,
            drawnCard: card,
            dateKey: today,
          };
          setDailyResult(dailyWithCard);
          setDailyDrawnCard(card);
          setIsFlipped(true);
          localStorage.setItem(`limit_daily_trinity_${uid}_${today}`, "true");
          localStorage.setItem(`limit_daily_trinity_guest_${today}`, "true");
          localStorage.setItem(getTrinityDailyResultKey(uid), JSON.stringify(dailyWithCard));
          localStorage.setItem(getTrinityDailyResultKey("guest"), JSON.stringify(dailyWithCard));
        } catch (_) {}
      }

      if (!selectedCards) {
        setTarotVirtualMode(true);
        return;
      }

      setIsTarotGenerating(true);
      setTarotResult("");

      try {
        const concernAnalysis = tarotConcernAnalysis;
        const binaryChoicePromptAddon = buildTarotBinaryChoicePromptAddon(concernAnalysis);
        const dailyCard = dailyResult?.drawnCard || null;
        const dailyCardContext = dailyCard
          ? {
              ...dailyCard,
              diagnosis: dailyResult?.diagnosis || dailyResult?.summary || '',
              summary: dailyResult?.summary || '',
            }
          : null;
        const profile = sharedState?.userProfile || getPersistentUserProfile();
        const sajuInfo = calculateDetailedSaju(profile);
        const sajuData = sajuInfo?.systemPromptSummary || "";
        const astroData = profile?.basic?.birthdate
          ? `생년월일: ${profile.basic.birthdate} (${profile.basic.lunarSolar === 'lunar' ? '음력' : '양력'})${profile.basic.birthtime ? ` ${profile.basic.birthtime}` : ''}${profile.basic.birthCity ? ` / 출생지: ${profile.basic.birthCity}` : ''}`
          : "";
        const contextPromptAddon = buildTarotContextPromptAddon({
          profile,
          sajuData,
          astroData,
          cards: selectedCards || undefined,
          dailyCard: dailyCardContext,
        });
        const spreadPromptAddon = buildTarotSpreadPromptAddon(
          concernAnalysis.spread,
          selectedCards,
        );
        const decisionHint =
          concernAnalysis.kind === "binary_choice"
            ? " [양자택일 질문입니다. 두 선택지 중 반드시 한쪽만 명확히 골라 주세요.]"
            : concernAnalysis.kind === "yes_no"
              ? " [예/아니오 결정 질문입니다. 우회 없이 YES 또는 NO로 못 박아 주세요.]"
              : "";
        const spreadHint = ` [자동 적용 배열법: ${concernAnalysis.spread.name} — ${concernAnalysis.spread.positions.join(", ")}]`;
        const dailyAnchorHint = dailyCard
          ? ` [오늘의 지배 카드(배경 에너지): ${dailyCard.nameKo} (${dailyCard.name})${dailyCard.reversed ? ' (역방향)' : ''}]`
          : "";

        const invokeContent: any[] = [
          {
            type: "text",
            text: `나의 고민: ${tarotConcern}. 카드를 바탕으로 해석해주세요.${decisionHint}${spreadHint}${dailyAnchorHint}`,
          },
        ];

        let systemPrompt = "";
        if (selectedCards) {
          const cardNames = selectedCards
            .map((c, i) => {
              const pos = concernAnalysis.spread.positions[i] || `${i + 1}번`;
              const orient = c.reversed ? " [역방향]" : "";
              return `${pos}: ${c.nameKo} (${c.name})${orient}`;
            })
            .join(", ");
          const dailyCardDirective = dailyCard
            ? `\n오늘의 지배 카드 (배경 에너지): ${dailyCard.nameKo} (${dailyCard.name})${dailyCard.reversed ? ' [역방향]' : ''}\n-> 이번 고민 리딩 시 오늘 하루를 이끄는 [${dailyCard.nameKo}]의 파동과 상호작용을 1단계(마음과 현재 에너지)와 4단계(실천 처방)에 필히 융합하여 서술하십시오.`
            : '';

          // 손끝 물리적 터치/파동 메타데이터 반영
          const touchMeta = params?.touchMetadata || (selectedCards as any[])?.[0]?.touchMetadata || null;
          const touchPhysicalDirective = touchMeta
            ? `\n\n[🖐️ 질문자의 손끝 물리 파동 및 심층 체류 지표 (실측치)]
- 공명 깊이/모드: ${touchMeta.depthMode}
- 터치 체류 시간: ${touchMeta.durationMs}ms (집중도 및 영적 체류 시간)
- 손끝 미세 떨림/망설임 지수: ${touchMeta.jitterScore} (점수가 높을수록 내면의 복잡한 번뇌와 갈등이 큼)
- 해석 어조 가이드: ${touchMeta.tonePrompt}
-> **필수 반영 규칙**: 1단계(카드가 비추는 당신의 마음과 현재 에너지)의 첫 시작 문단에서 반드시 내담자가 카드를 뽑을 때 감지된 손끝의 물리적 체류(${touchMeta.durationMs}ms)와 번뇌/집중도(${touchMeta.depthMode.split(' ')[0]})의 파동을 신비롭게 짚어주며 리딩을 여십시오.`
            : '';

          systemPrompt = `당신은 질문자의 가슴 깊은 고민을 꿰뚫어보고, 따뜻한 공감과 날카로운 직관으로 운명의 길을 밝혀주는 신비롭고 영험한 전문 타로 마스터 '트리니티'입니다.
실제 1:1 타로 상담실에서 촛불을 켜고 내담자의 눈을 마주 보며 카드를 한 장씩 넘겨 리딩해 주듯, 살아 숨 쉬는 생생한 대화형 어조(정중하고 기품 있는 해요체·하십시오체)로 깊은 울림을 선사하십시오.

[상담 개요]
- 내담자 고민: "${tarotConcern}"
- 적용 배열법: ${concernAnalysis.spread.name} (${concernAnalysis.spread.cardCount}장)
- 펼쳐진 카드: [${cardNames}]${dailyCardDirective}${touchPhysicalDirective}

[🔮 타로 마스터 리딩 원칙 — 보고서형 어투 절대 금지]
1. **생생한 상담실 대화체**: 딱딱한 기획서·보고서·수치 나열형(예: '성공률 80%, 실패율 20%', '1단계: 진단' 등 사무적 어투)은 절대 지양하십시오. 대신 "카드를 가만히 마주하니...", "가장 먼저 눈에 밟히는 카드는...", "이 카드가 당신께 이렇게 속삭이고 있네요"처럼 실제 타로 마스터의 생동감 넘치는 호흡으로 이야기하듯 서술하십시오.
2. **깊은 공감과 날카로운 팩트폭행의 조화**: 내담자가 겪고 있는 혼란과 불안을 따뜻하게 안아주되, 카드가 경고하는 현실적 맹점이나 피해야 할 악수는 숨김없이 명쾌하고 솔직하게 짚어주십시오.
3. **스토리텔링 식 카드 융합 해독**: 카드를 개별 사전식으로 분리해 나열하지 말고, 각 위치의 상징들이 서로 인과관계를 맺으며 어떻게 흘러가는지 하나의 흥미진진한 운명의 드라마처럼 유기적으로 엮어내십시오.
4. **명확하고 흔들림 없는 결론**: 애매하게 얼버무리거나 "상황에 따라 다릅니다" 같은 회피는 금지합니다. 카드의 기운이 가리키는 방향을 마스터의 확신 있는 어조로 단호하게 선언하십시오.

[✨ 리딩 구성 형식 — 아래 5단계 마크다운 구조로 감동적이고 흡입력 있게 전개하세요]

### 🕯️ 1. 카드가 비추는 당신의 마음과 현재 에너지
- 질문자님의 고민("${tarotConcern}")을 마주했을 때 전해져 오는 내면의 파동과 말 못 할 갈등, 현재 상황의 숨은 진실을 마스터의 깊은 직관으로 짚어주며 깊은 공감대를 형성하십시오. ${dailyCard ? `(오늘의 배경을 이끄는 [${dailyCard.nameKo}] 카드의 기운과 맞물려 지금 어떤 국면에 서 있는지 함께 짚어주세요.)` : ''}${touchMeta ? ` (손끝에서 전해진 ${touchMeta.depthMode.split(' ')[0]}의 파동을 첫 문장에 깃들여주세요.)` : ''}

### 🎴 2. 펼쳐진 카드들이 들려주는 이야기
- **${concernAnalysis.spread.name}**의 각 위치에 놓인 카드들([${cardNames}])을 한 장씩 짚어가며, 카드의 상징 그림과 위치 의미를 생생하게 해독하십시오.
- 각 카드마다 단순히 키워드를 읊는 것이 아니라, 카드 속 인물·상징이 내담자의 실제 현실에서 어떤 사건, 감정, 인물로 나타나고 있는지 생생한 묘사로 풀어내십시오.

### 🔮 3. 트리니티 마스터의 직관적 결단 & 방향성
- 내담자의 질문("${tarotConcern}")에 대해 카드가 내린 최종 판정을 명확히 짚어주십시오.
- **[확실한 YES / 결단이 필요한 YES / 단호한 NO / 신중한 전환 필요]** (또는 양자택일 시 **[최종 선택: OO]**)를 굵은 글씨로 선언하고, 왜 이 방향으로 나아가야 하는지 그 필연적 이유를 확신에 찬 목소리로 들려주십시오.

### 🌿 4. 운의 흐름을 바꿀 마스터의 실천 처방 (개운 가이드)
- 머리로만 아는 것은 운을 바꾸지 못합니다. 내담자가 오늘부터 즉시 행운을 끌어당기고 액운을 피할 수 있는 현실적이고 구체적인 행동 처방(마음가짐, 소통 방식, 피해야 할 행동, 행운의 행동 등)을 다정하면서도 명확하게 짚어주십시오.

### ✨ 5. 당신의 길을 축복하는 영혼의 한마디
- 타로는 정해진 굴레가 아니라 운명을 개척하는 등불입니다. 내담자가 두려움을 떨치고 스스로의 운명을 주도할 수 있도록, 가슴 깊이 간직할 지혜와 따뜻한 용기의 축복을 마스터의 서명처럼 건네며 마무리하십시오.${binaryChoicePromptAddon}${spreadPromptAddon}${contextPromptAddon}`;
        }

        let finalResponse = "";
        try {
          await invokeLLMStream({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: invokeContent as any },
            ],
            timeoutMs: 40000,
            onChunk: (chunk) => {
              finalResponse += chunk;
              setTarotResult(finalResponse);
            },
          });
        } catch (streamErr) {
          console.warn("[Tarot] Stream failed, using local reading fallback:", streamErr);
        }

        if (isTarotStreamFailure(finalResponse)) {
          finalResponse = buildLocalTarotReading(
            tarotConcern,
            selectedCards,
          );
          setTarotResult(finalResponse);
        }

        if (finalResponse.trim()) {
          recordPrismFeature({
            app: 'trinity',
            featureName: '타로 스프레드 리딩',
            summary: `질문: "${tarotConcern}", 배열법: ${concernAnalysis.spread.name}, 선택 카드: [${selectedCards ? selectedCards.map(c => `${c.nameKo}${c.reversed ? '(역)' : ''}`).join(', ') : '카드'}], 리딩 결과: ${finalResponse.slice(0, 160)}...`,
            details: {
              concern: tarotConcern,
              spread: concernAnalysis.spread.name,
              cards: selectedCards?.map(c => c.nameKo),
              response: finalResponse,
            },
          });
        }

        if (firebaseUser && finalResponse.trim() && localStorage.getItem('developer_bypass') !== 'true') {
          void addDoc(
            collection(db, "trinity_history", firebaseUser.uid, "entries"),
            {
              type: "tarot_reading",
              title: `타로 리딩: ${tarotConcern}`,
              content: `질문 고민 내용: "${tarotConcern}"\n\n타로 마스터 트리니티 리딩:\n${finalResponse}`,
              createdAt: serverTimestamp(),
              metadata: {
                concern: tarotConcern,
                spread: concernAnalysis.spread.name,
                spreadPositions: concernAnalysis.spread.positions,
                cards: selectedCards
                  ? selectedCards.map((c) => `${c.nameKo}${c.reversed ? "(역)" : ""}`)
                  : [],
                reversed: selectedCards?.map((c) => !!c.reversed),
                touchMetadata: params?.touchMetadata || (selectedCards as any[])?.[0]?.touchMetadata || null,
              }
            }
          ).catch((err) => {
            console.error("Tarot save error:", err);
          });
        }

      } catch (e: any) {
        setNotice({
          open: true,
          title: "통찰 실패",
          message: e.message || "타로 리딩 중 오류가 발생했습니다.",
        });
      } finally {
        setIsTarotGenerating(false);
      }
    }
  };

  const handleOracleDeepInsight = useCallback(() => {
    let targetResult = dailyResult;
    if (!targetResult) {
      try {
        const uid = firebaseUser?.uid || "guest";
        const cached = localStorage.getItem(getTrinityDailyResultKey(uid)) || localStorage.getItem("trinity_daily_result_guest");
        if (cached) {
          targetResult = JSON.parse(cached);
        }
      } catch (_) {}
    }
    if (!targetResult && dailyDrawnCard) {
      targetResult = {
        drawnCard: dailyDrawnCard,
        diagnosis: "오늘 하루 운명의 파동과 조율",
        remedy: "내면의 평정심을 지키고 직관을 신뢰하세요.",
        spiritualEnergy: "빛의 파동 동조",
      };
    }
    if (!targetResult) return;

    void handleSend(buildOracleDeepInsightUserMessage("trinity", targetResult), {
      force: true,
      oracleContext: buildOracleDeepInsightSystemContext(targetResult, "trinity"),
    });
  }, [dailyResult, dailyDrawnCard, firebaseUser, handleSend]);

  useDailyOracleFirstVisit({
    appPrefix: "trinity",
    featureKey: "trinity_oracle",
    appLockPrefix: "trinity",
    limitKeyPrefix: "limit_daily_trinity",
    uid: firebaseUser?.uid,
    enabled: !!sharedState,
    lastSync: sharedState?.lastTrinityDailySync,
    dailyResult,
    setDailyResult,
    isLoading: isDailyOracleLoading,
    historySources: trinityOracleHistory,
    oracleTypes: ["oracle-vision"],
    setShowDailyModal,
    onPrepare: () => {
      const uid = firebaseUser?.uid || "guest";
      const limitKey = `limit_daily_trinity_${uid}_${getTodayDateKey()}`;
      if (localStorage.getItem(limitKey) || isTrinityDailyLockedToday()) {
        restoreTodayDailyResult();
        return true;
      }
      return false;
    },
    runOracle: (opts) => {
      if (isTrinityDailyLockedToday()) {
        restoreTodayDailyResult();
        return Promise.resolve();
      }
      const card = pickDailySeededItem(TRINITY_CARDS, "trinity_oracle");
      setDailyDrawnCard(card);
      const idx = TRINITY_CARDS.findIndex((c) => c.id === card.id);
      setSelectedCardIdx(idx >= 0 ? idx : null);
      setIsFlipped(true);
      return handleUnifiedReading("daily", { selectedCard: card, autoRun: true });
    },
  });


  const handleTarotSubChatSubmit = async () => {
    if (!tarotChatInput.trim() || isTarotSubChatGenerating) return;

    const userMessage = tarotChatInput.trim();
    setTarotChatInput("");
    setTarotSubMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage },
    ]);
    setIsTarotSubChatGenerating(true);

    try {
      const followUpAnalysis = analyzeTarotConcern(userMessage);
      const baseConcernAnalysis = analyzeTarotConcern(tarotConcern);
      const activeDecisionAnalysis =
        followUpAnalysis.kind !== "open" ? followUpAnalysis : baseConcernAnalysis;
      const followUpDecisionAddon = buildTarotBinaryChoicePromptAddon(activeDecisionAnalysis);
      const profile = sharedState?.userProfile || getPersistentUserProfile();
      const profileContext = profile ? `\n\n${buildDeepSynapseContext(profile)}` : "";

      const messagesForLLM = [
        {
          role: "system",
          content:
            `당신은 이전에 내려진 타로 리딩 결과를 기반으로, 질문자의 추가 질문이나 가려운 곳을 명쾌하고 직접적으로 긁어주는 타로 마스터 '트리니티'입니다.\n\n[답변 규정]\n1. 모호한 혼잣말이나 뜬구름 잡는 위로, 우주적 상징주의 같은 지루하고 추상적인 장설은 완전히 지양하십시오.\n2. 질문자의 질문에 대해서만 다이렉트로 답변하여 신속하고 똑부러지게 핵심 해결책을 짚어 주십시오.\n3. 질문자의 사주 본원 및 프로필 배경지식을 바탕으로 가장 현실적이며 직관적인 조언을 해 주십시오.${followUpDecisionAddon}${profileContext}`,
        },
        {
          role: "user",
          content: `나의 고민: ${tarotConcern}\n타로 리딩 결과: ${tarotResult}`,
        },
      ];

      tarotSubMessages.forEach((msg) => messagesForLLM.push(msg));
      messagesForLLM.push({ role: "user", content: userMessage });

      let currentResponse = "";
      setTarotSubMessages((prev) => [...prev, { role: "model", content: "" }]);

      await invokeLLMStream({
        messages: messagesForLLM as any,
        onChunk: (chunk) => {
          currentResponse += chunk;
          setTarotSubMessages((prev) => {
            const newArray = [...prev];
            newArray[newArray.length - 1] = {
              role: "model",
              content: currentResponse,
            };
            return newArray;
          });
        },
      });
    } catch (err: any) {
      setNotice({
        open: true,
        title: "오류",
        message: err.message || "답변을 가져오는 중 오류가 발생했습니다.",
      });
    } finally {
      setIsTarotSubChatGenerating(false);
    }
  };

  const handleDailySubChatSubmit = async () => {
    if (!dailyChatInput.trim() || isDailySubChatGenerating) return;

    const userMessage = dailyChatInput.trim();
    setDailyChatInput("");
    setDailySubMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage },
    ]);
    setIsDailySubChatGenerating(true);

    try {
      const drawn = dailyResult?.drawnCard || dailyDrawnCard;
      const cardName = drawn
        ? `${drawn.nameKo} (${drawn.name})${drawn.reversed ? " [역방향]" : " [정방향]"}`
        : "오늘의 오라클 카드";
      const diagnosisContent =
        dailyResult?.diagnosis || dailyResult?.summary || "";

      const followUpAnalysis = analyzeTarotConcern(userMessage);
      const followUpDecisionAddon = buildTarotBinaryChoicePromptAddon(followUpAnalysis);
      const profile = sharedState?.userProfile || getPersistentUserProfile();
      const profileContext = profile ? `\n\n${buildDeepSynapseContext(profile)}` : "";

      const messagesForLLM = [
        {
          role: "system",
          content: `당신은 질문자가 뽑은 오늘의 타로 카드 [${cardName}]와 그에 따른 오늘의 인과관계 비전 해독 결과를 기반으로, 질문자의 추가 질문이나 궁금증을 명쾌하고 직접적으로 짚어주는 초정밀 타로 마스터 '트리니티'입니다.\n\n[답변 규정]\n1. 모호한 혼잣말이나 뜬구름 잡는 위로, 추상적인 우주 상징주의 같은 지루한 장설은 완전히 지양하십시오.\n2. 질문자가 뽑은 [${cardName}]의 에너지 및 사주 본원/프로필 배경지식과 연계하여, 질문자의 질문에 대해 다이렉트로 현실적이고 실천 가능한 직관적 조언을 해주십시오.\n3. 말을 돌리지 않고 핵심 해결책을 단도직입적으로 짚어 주십시오.${followUpDecisionAddon}${profileContext}`,
        },
        {
          role: "user",
          content: `오늘 뽑은 카드: ${cardName}\n오늘의 비전 해독 결과: ${diagnosisContent}`,
        },
      ];

      dailySubMessages.forEach((msg) => messagesForLLM.push(msg));
      messagesForLLM.push({ role: "user", content: userMessage });

      let currentResponse = "";
      setDailySubMessages((prev) => [...prev, { role: "model", content: "" }]);

      await invokeLLMStream({
        messages: messagesForLLM as any,
        onChunk: (chunk) => {
          currentResponse += chunk;
          setDailySubMessages((prev) => {
            const newArray = [...prev];
            newArray[newArray.length - 1] = {
              role: "model",
              content: currentResponse,
            };
            return newArray;
          });
        },
      });
    } catch (err: any) {
      setNotice({
        open: true,
        title: "오류",
        message: err.message || "답변을 가져오는 중 오류가 발생했습니다.",
      });
    } finally {
      setIsDailySubChatGenerating(false);
    }
  };

  const handleEnergyAnalysis = async () => {
    setIsMeasuringInsight(true);
    setInsightResult(null);

    const userProfileStr = sharedState?.userProfile
      ? JSON.stringify(sharedState.userProfile)
      : JSON.stringify(form);
    const recentMemory =
      sharedState?.trinityMemory ||
      sharedState?.globalMemory ||
      "최근 기록 없음";
    const dailyContext = dailyResult
      ? `오늘의 Daily 진단: ${dailyResult.diagnosis || dailyResult.summary || dailyResult.prescription}`
      : "오늘의 Daily 진단 데이터 없음";

    try {
      const data = await invokeLLMStructured({
        messages: [
          {
            role: "system",
            content: `당신은 최고 수준의 운명 오라클 마스터 트리니티입니다. 사용자의 프로필, 자아 성향, 생년월일, 태어난 시간 및 오늘의 데일리 상징을 종합하여 실시간 우주적 에너지 흐름과 운명 점수(Luck, Love, Wealth, Health)를 고도화된 마이크로 분석 리포트로 리턴하십시오. [데이터 가이드: 프로필(${userProfileStr}), 최근상태(${recentMemory}), 데일리진단(${dailyContext})]\n각 스코어는 0-100 사이 숫자로 반환할 것.`,
          },
          {
            role: "user",
            content: `이름: ${form.name || sharedState?.userProfile?.basic?.name}, 닉네임: ${form.nickname || sharedState?.userProfile?.basic?.nickname}, 생년월일: ${form.birthdate || sharedState?.userProfile?.basic?.birthdate}, 성별: ${form.gender}. 현재 내 영적 오라클 ���파수와 에너지 레벨, 연애운, 재물운, 소울 상태를 심도 있게 통찰하고 처방을 내려줘.`,
          },
        ],
        schema: EnergyAnalysisSchema as any,
      });

      setInsightResult(data);
      updateSharedState({ lastTrinitySoulSync: Date.now() }, "TRINITY");

      if (firebaseUser && localStorage.getItem("developer_bypass") !== "true") {
        try {
          await addDoc(collection(db, "trinity_history", firebaseUser.uid, "entries"), {
            type: "SOUL_PROFILE",
            ...data,
            createdAt: serverTimestamp(),
            title: "Soul Energy Analysis",
          });
        } catch (err) {
          console.error("Soul analysis save error:", err);
        }
      }
    } catch (err: any) {
      console.error(err);
      setNotice({
        open: true,
        title: "통찰 실패",
        message: err.message || "에너지 심층 처방 분석 중 우주적 연결 오류가 발생했습니다.",
      });
    } finally {
      setIsMeasuringInsight(false);
    }
  };

  const handleSaveProfile = async () => {
    const existingProfile = sharedState?.userProfile || getPersistentUserProfile() || {};
    const profile: UserProfile = mergeUserProfiles(existingProfile, {
      basic: {
        ...(form.name ? { name: form.name } : {}),
        ...(form.nickname ? { nickname: form.nickname } : {}),
        ...(form.birthdate ? { birthdate: form.birthdate } : {}),
        ...(form.birthtime ? { birthtime: form.birthtime } : {}),
        ...(form.gender ? { gender: form.gender === "남성" ? "male" : "female" } : {}),
        ...(form.city ? { birthCity: form.city } : {}),
      },
    });
    try {
      await updateSharedState({ userProfile: profile }, "TRINITY");
      setPersistentUserProfile(profile);
      setIsEditingProfile(false);
      handleEnergyAnalysis();
    } catch (err: any) {
      setNotice({
        open: true,
        title: "저장 실패",
        message: "프로필 저장 중 오류가 발생했습니다.",
      });
    }
  };

  return (
    <div className="h-app-full w-full flex flex-col relative overflow-hidden font-sans bg-transparent">

      {/* Top Left Branding */}
      <div className={`fixed top-safe-2 left-2 sm:left-4 md:top-safe-4 md:left-6 pointer-events-auto z-[110] transition-all duration-300 ${isSpecialFeatureChromeHidden ? SPECIAL_FEATURE_CHROME_HIDDEN_CLASS : 'opacity-100'}`}>
         <div className="flex items-center gap-2.5 sm:gap-3">
            <div 
              className="relative w-11 h-11 rounded-full border border-white/10 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.05)] group backdrop-blur-md cursor-pointer transition-transform active:scale-95 shrink-0" 
              onClick={() => toggleBinaural('trinity')}
              title={isBinauralPlaying ? "트리니티 바이노럴 비트 끄기" : "트리니티 바이노럴 비트 재생하기"}
            >
               <motion.div 
                 animate={{ rotate: 360 }} 
                 transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }} 
                 className={`absolute inset-0 rounded-full border ${isBinauralPlaying ? 'border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)]' : 'border-dashed border-white/30'}`} 
               />
               <div className={`absolute inset-[3px] rounded-full border flex items-center justify-center transition-all ${isBinauralPlaying ? 'bg-yellow-500/20 border-yellow-400/50' : 'border-white/5 bg-white/5'}`}>
                  <Sparkles size={20} className={`relative z-10 text-yellow-400 drop-shadow-[0_0_12px_currentColor] transition-transform group-hover:scale-110 duration-500 ${isBinauralPlaying ? 'animate-bounce' : 'animate-pulse'}`} strokeWidth={1.5} />
               </div>
            </div>
            <div className="cursor-pointer flex flex-col justify-center select-none" onClick={() => navigate('/')}>
               <h1 className="text-lg md:text-xl font-display font-black text-white uppercase tracking-tighter leading-tight">PRISM</h1>
               <p className="text-[8px] md:text-[9px] text-white/40 uppercase tracking-widest font-bold font-sans leading-none mt-0.5">TRINITY • CELESTIAL ORACLE</p>
            </div>
         </div>
      </div>

      {/* Trinity Navigation Menu - Top Navigation */}
      <nav className={`prism-xs-subnav fixed top-safe-nav md:top-safe-nav-md left-1/2 -translate-x-1/2 z-[100] flex items-center gap-1 p-1 rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl max-w-[95vw] overflow-x-auto no-scrollbar md:max-w-fit md:overflow-visible transition-all duration-300 ${isSpecialFeatureChromeHidden ? SPECIAL_FEATURE_CHROME_HIDDEN_CLASS : 'opacity-100'}`}>
        {[
          { id: "daily", icon: Sparkles, label: "Lucky" },
          { id: "oracle", icon: Sparkles, label: "ORACLE" },
          { id: "tarot", icon: TarotCardIcon as any, label: "TAROT" },
        ].map((item) => {
          const isActive = activeMode === item.id;
          return (
            <button
               key={item.id}
              onClick={() => {
                if (item.id === "tarot") {
                  resetTarotSession(true);
                  setActiveMode("tarot");
                  setIsChatOpen(false);
                  return;
                }
                setActiveMode(item.id as any);
              }}
              className={`prism-subnav-btn flex shrink-0 whitespace-nowrap items-center gap-2 md:gap-3 px-4 md:px-5 py-2.5 md:py-3 rounded-2xl transition-all duration-300 group ${
                isActive
                  ? "bg-yellow-600 text-white shadow-lg shadow-yellow-500/20 border border-yellow-500/30"
                  : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              <item.icon size={16} className={isActive ? "animate-pulse" : ""} />
              <span
                className={`text-[10px] font-black uppercase tracking-widest ${
                  isActive
                    ? "opacity-100"
                    : "opacity-0 w-0 overflow-hidden group-hover:opacity-100 group-hover:w-auto transition-all"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <SpecialFeatureFabGroup>
        <HandbookFabButton
          theme="trinity"
          tooltipLabel="ReBible"
        />
      </SpecialFeatureFabGroup>

      {/* Main Layout Area */}
      <main data-app-scroll-root className="flex-1 w-full pt-page pb-page md:pt-page-md md:pb-page-md flex flex-col relative z-10 overflow-y-auto no-scrollbar scroll-smooth text-white">
        <div className="max-w-5xl w-full mx-auto px-3 sm:px-6 prism-xs-pad flex-1 flex flex-col min-w-0">
          <AnimatePresence mode="wait">
            {activeMode === "oracle" || activeMode === "synergy" ? (
              <motion.div
                key="trinity-oracle"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full pb-8 sm:pb-12"
              >
                <TrinityOracleSection />
              </motion.div>
            ) : activeMode === "tarot" ? (
              <motion.div
                key="tarot"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-4xl mx-auto space-y-8 pb-8 sm:pb-12"
              >
                <div className="glass relative w-full p-5 sm:p-8 md:p-10 rounded-[32px] sm:rounded-[40px] bg-white/[0.04] sm:bg-white/[0.06] border border-yellow-400/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col my-4 backdrop-blur-2xl">
                  {/* Subtle starlight gold specular glow */}
                  <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-yellow-500/10 blur-[100px] pointer-events-none" />
                  <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-amber-500/10 blur-[100px] pointer-events-none" />

                  {/* Header */}
                  <div className="relative z-10 flex items-center justify-between pb-6 border-b border-white/10 mb-6 shrink-0 bg-white/[0.02] -mx-5 -mt-5 sm:-mx-8 sm:-mt-8 md:-mx-10 md:-mt-10 px-5 pt-5 sm:px-8 sm:pt-8 md:px-10 md:pt-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                        <TarotCardIcon size={20} className="text-yellow-400 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-bold text-white tracking-tight">Tarot Reading (78장 타로 오라클)</h2>
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-yellow-500/15 text-yellow-300 border border-yellow-400/30 uppercase tracking-wider">
                            TRINITY 특수기능
                          </span>
                        </div>
                        <p className="text-xs text-white/60 font-sans">
                          천상의 78장 타로 휠 · 심층 AI 오라클 리딩
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="relative w-full">
                  {tarotVirtualMode && (
                    <TarotSpread
                      maxCards={tarotSpreadRecommendation.cardCount}
                      positions={tarotSpreadRecommendation.positions}
                      spreadName={tarotSpreadRecommendation.name}
                      spreadReason={tarotSpreadRecommendation.reason}
                      concern={tarotConcern}
                      onCancel={() => setTarotVirtualMode(false)}
                      onComplete={(cards, touchMetadata) => {
                        setTarotVirtualMode(false);
                        setDrawnCards(cards);
                        setHideTarotPopup(false);
                        handleUnifiedReading("tarot", { selectedCards: cards, touchMetadata });
                      }}
                    />
                  )}
                  <div className="relative z-10 w-full scroll-smooth flex flex-col">
                      <div className="space-y-6 flex-1 flex flex-col justify-between w-full">
                        {!drawnCards &&
                        !tarotResult &&
                        !isTarotGenerating ? (
                          <div className="space-y-4 flex-1 flex flex-col justify-between w-full">
                            {/* 🌟 Cosmic Anchor Badge (Today's Ruling Card Background Energy - ONLY if today's reading is completed and not currently doing daily tarot concern) */}
                            {dailyResult?.drawnCard && !isDailyTarotConcern(tarotConcern) && (
                              <div className="rounded-2xl border border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-transparent p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-inner">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-9 h-9 rounded-xl bg-yellow-500/20 border border-yellow-400/40 flex items-center justify-center text-yellow-300 shrink-0 shadow-[0_0_10px_rgba(234,179,8,0.3)]">
                                    <Sparkles size={16} className="animate-pulse" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-yellow-400">
                                        오늘의 지배 카드 (Cosmic Anchor)
                                      </span>
                                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-200 border border-yellow-400/30">
                                        배경 에너지 활성화
                                      </span>
                                    </div>
                                    <p className="text-xs text-white/90 font-medium truncate mt-0.5">
                                      ✨ {dailyResult.drawnCard.nameKo} ({dailyResult.drawnCard.name}) {dailyResult.drawnCard.reversed ? "· 역방향" : "· 정방향"}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    restoreTodayDailyResult();
                                    setShowDailyModal(true);
                                  }}
                                  className="shrink-0 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-yellow-500/20 text-[10px] text-yellow-300 font-bold transition-all hover:border-yellow-400/40 active:scale-95 cursor-pointer"
                                >
                                  오늘의 결과 보기
                                </button>
                              </div>
                            )}

                            <div className="space-y-3 text-left w-full overflow-hidden">
                              <div className="flex items-center justify-between pl-2">
                                <label className="text-xs text-white/50 font-bold uppercase tracking-widest block">
                                  Your Concern
                                </label>
                                <button
                                  type="button"
                                  onClick={() => setIsSpreadModalOpen(true)}
                                  className="text-[11px] text-yellow-300 hover:text-yellow-200 font-bold font-sans flex items-center gap-1.5 px-3 py-1 rounded-xl bg-yellow-500/15 hover:bg-yellow-500/25 border border-yellow-500/30 transition-all cursor-pointer shadow-sm active:scale-95 group"
                                  title="타로 배열법 직접 선택 모달 열기"
                                >
                                  <Layers size={13} className="text-yellow-400 group-hover:rotate-12 transition-transform" />
                                  <span>배열법 선택</span>
                                  <ChevronRight size={13} className="text-yellow-400/70 group-hover:translate-x-0.5 transition-transform" />
                                </button>
                              </div>

                              {/* Popular Spread Preset Pills */}
                              <div className="flex items-center gap-1.5 overflow-x-auto select-none pb-1 scroll-smooth [scrollbar-width:none]">
                                <button
                                  type="button"
                                  onClick={() => setIsSpreadModalOpen(true)}
                                  className="flex-none px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-yellow-500/20 border-yellow-500/40 text-yellow-300 hover:border-yellow-400 hover:bg-yellow-500/30"
                                  title="전체 타로 배열법 검색 및 직접 선택 모달 열기"
                                >
                                  <Layers size={12} className="text-yellow-400" />
                                  <span>🎴 전체 배열법 선택</span>
                                </button>
                                {POPULAR_TAROT_SPREAD_PRESETS.map((preset) => {
                                  const isSelected = tarotSpreadRecommendation.theme === preset.theme;
                                  return (
                                    <button
                                      key={preset.theme}
                                      type="button"
                                      onClick={() => {
                                        setTarotConcern(preset.defaultPrompt);
                                        setCustomSpread(buildSpreadForTheme(preset.theme, { kind: 'open' }));
                                      }}
                                      className={`flex-none px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-sm ${
                                        isSelected
                                          ? 'bg-yellow-500/25 border-yellow-400/60 text-yellow-300 shadow-[0_0_12px_rgba(234,179,8,0.3)]'
                                          : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                                      }`}
                                      title={preset.desc}
                                    >
                                      <span>{preset.name}</span>
                                    </button>
                                  );
                                })}
                              </div>

                              <textarea
                                value={tarotConcern}
                                onChange={(e) => setTarotConcern(e.target.value)}
                                placeholder="타로에게 물어보고 싶은 고민을 상세히 적어주세요..."
                                className="w-full h-36 bg-black/30 border border-white/10 rounded-2xl p-5 text-white font-sans focus:outline-none focus:border-yellow-500/50 transition-all resize-none placeholder:text-white/20 leading-relaxed text-sm"
                              />

                              {/* Clickable Tarot Spread Recommendation / Custom Spread Card */}
                              <div
                                onClick={() => setIsSpreadModalOpen(true)}
                                className="rounded-2xl border border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 via-black/40 to-yellow-500/5 hover:border-yellow-400/60 hover:bg-yellow-500/15 p-4 transition-all cursor-pointer group shadow-md active:scale-[0.99] relative overflow-hidden text-left"
                                title="클릭하여 타로 배열법 직접 선택 / 변경하기"
                              >
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-400 font-mono flex items-center gap-1">
                                      <Sparkles size={11} className="text-yellow-400" />
                                      <span>{isAutoRecommended ? 'AI 자동 추천 배열법' : '직접 선택한 배열법'}</span>
                                    </span>
                                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 font-bold font-mono">
                                      {tarotSpreadRecommendation.cardCount}장
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 text-[11px] text-yellow-300/90 group-hover:text-yellow-200 font-bold transition-colors">
                                    <Layers size={13} className="text-yellow-400" />
                                    <span>배열법 선택 / 변경</span>
                                    <ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform" />
                                  </div>
                                </div>
                                <p className="text-sm text-white font-bold group-hover:text-yellow-200 transition-colors">
                                  {tarotSpreadRecommendation.name}
                                </p>
                                <p className="text-[11px] text-white/60 mt-1 leading-relaxed break-keep">
                                  {tarotSpreadRecommendation.reason}
                                </p>
                                <div className="flex flex-wrap items-center gap-1 mt-2.5">
                                  {tarotSpreadRecommendation.positions.map((pos, pIdx) => (
                                    <span
                                      key={pIdx}
                                      className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-black/50 border border-white/10 text-white/70"
                                    >
                                      {pos}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {(smartTarotQuestions.length > 0 || isGeneratingQuestions) && (
                              <div className="space-y-2 mt-2 w-full text-left">
                                <span className="text-[10px] text-yellow-400/90 font-bold uppercase tracking-wider pl-2 flex items-center gap-1">
                                  <Wand2 size={10} /> AI 맞춤 질문
                                  {isGeneratingQuestions && <RefreshCw size={8} className="animate-spin text-yellow-400" />}
                                </span>
                                <div 
                                  onWheel={(e) => {
                                    if (e.currentTarget) {
                                      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
                                      e.currentTarget.scrollLeft += delta * 1.5;
                                    }
                                  }}
                                  className="flex items-center gap-2 overflow-x-auto select-none px-1 pb-2 scroll-smooth [scrollbar-width:thin] [scrollbar-color:rgba(234,179,8,0.3)_transparent]"
                                >
                                  {smartTarotQuestions.map((q, idx) => (
                                    <button
                                      key={`smart-${idx}`}
                                      type="button"
                                      onClick={() => {
                                        setTarotConcern(q);
                                        setCustomSpread(null);
                                      }}
                                      className="flex-none px-4 py-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-200/90 hover:bg-yellow-500/20 hover:border-yellow-400/40 active:scale-[0.98] transition-all font-sans whitespace-nowrap cursor-pointer shadow-sm"
                                    >
                                      {q}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {!tarotConcern.trim() && (
                              <div className="space-y-2 mt-2 w-full text-left">
                                <div className="flex items-center justify-between pl-2 pr-1">
                                  <span className="text-[10px] text-yellow-500/80 font-bold uppercase tracking-wider flex items-center gap-1 font-sans">
                                    <Sparkles size={10} className="animate-pulse" /> 맞춤 고민 질문 예시
                                  </span>
                                  <button
                                    type="button"
                                    onClick={handleRefreshTarotSuggestions}
                                    className="flex items-center gap-1.5 text-[10px] text-yellow-500/60 hover:text-yellow-400 font-bold transition-all cursor-pointer bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-full border border-yellow-500/10 hover:border-yellow-500/30 active:scale-95"
                                  >
                                    <RefreshCw size={8} className="animate-pulse" /> 다른 우주 고민 보기
                                  </button>
                                </div>
                                <div 
                                  onWheel={(e) => {
                                    if (e.currentTarget) {
                                      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
                                      e.currentTarget.scrollLeft += delta * 1.5;
                                    }
                                  }}
                                  className="flex items-center gap-2 overflow-x-auto select-none px-1 pb-2 scroll-smooth [scrollbar-width:thin] [scrollbar-color:rgba(234,179,8,0.3)_transparent]"
                                >
                                  {tarotSuggestions.map((q, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => {
                                        setTarotConcern(q);
                                        setCustomSpread(null);
                                      }}
                                      className="flex-none px-4 py-2.5 rounded-xl bg-white/5 border border-yellow-500/15 text-xs text-yellow-500/90 hover:bg-yellow-500/15 hover:border-yellow-500/30 hover:text-yellow-300 active:scale-[0.98] transition-all font-sans whitespace-nowrap cursor-pointer shadow-sm"
                                    >
                                      {q}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="mt-4 flex flex-col gap-3 w-full">
                              <button
                                onClick={() => handleUnifiedReading("tarot")}
                                disabled={isTarotGenerating || !tarotConcern.trim()}
                                className="w-full py-3.5 rounded-2xl bg-yellow-600 hover:bg-yellow-500 text-white font-bold tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:hover:bg-yellow-600 shadow-[0_0_30px_rgba(234,179,8,0.3)] cursor-pointer text-xs uppercase"
                              >
                                {isTarotGenerating ? (
                                  <RefreshCw className="animate-spin" size={18} />
                                ) : (
                                  <>
                                    <TarotCardIcon size={18} />
                                    {tarotSpreadRecommendation.cardCount === 1
                                      ? "오늘의 타로 1장 뽑기 (DRAW 1 CARD)"
                                      : `78장 타로 휠 펼치기 (DRAW ${tarotSpreadRecommendation.cardCount} CARDS)`}
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col overflow-hidden relative w-full text-left">
                            <div className="flex-1 overflow-y-auto no-scrollbar space-y-5 pb-6">
                              {drawnCards && (
                                <div className="space-y-2">
                                  <p className="text-center text-[10px] text-yellow-500/70 font-bold uppercase tracking-widest">
                                    {tarotSpreadRecommendation.name}
                                  </p>
                                  <div className="flex gap-3 flex-wrap justify-center p-3 max-w-full">
                                  {drawnCards.map((c, i) => {
                                    const visual = getTarotCardVisual(c);
                                    const positionLabel = tarotSpreadRecommendation.positions[i] || `${i + 1}번`;
                                    return (
                                      <div
                                        key={i}
                                        className="w-20 min-h-[7.5rem] bg-zinc-900 border border-yellow-500/50 rounded-2xl flex flex-col items-center justify-between p-2 text-center shadow-[0_0_20px_rgba(234,179,8,0.2)] relative overflow-hidden group hover:border-yellow-400 hover:shadow-[0_0_25px_rgba(234,179,8,0.4)] transition-all duration-300 cursor-pointer"
                                      >
                                        <img 
                                          src={getTarotCardImageUrl(c)} 
                                          alt={c.name}
                                          style={{ transform: c.reversed ? "rotate(180deg)" : undefined }}
                                          className="absolute inset-0 w-full h-full object-cover z-0 opacity-80 group-hover:opacity-100 transition-opacity duration-300" 
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/60 z-10 pointer-events-none" />
                                        
                                        <div className="flex justify-between items-center w-full z-20 shrink-0 text-[6px] font-mono text-yellow-500/60">
                                          <span className="truncate max-w-[70%]">{positionLabel}</span>
                                          <Sparkles size={6} className="text-yellow-400 shrink-0" />
                                        </div>

                                        <div className="w-7 h-7 rounded-full bg-black/60 border border-yellow-500/20 flex items-center justify-center text-yellow-400 z-20 transition-all duration-300 group-hover:scale-110 shadow-inner">
                                          {React.createElement(visual.icon, { size: 14, className: visual.color })}
                                        </div>

                                        <div className="text-center z-20 flex flex-col gap-0.5 w-full bg-black/60 py-1 rounded-lg border border-yellow-500/10 backdrop-blur-[1px] select-none">
                                          <span className="font-bold text-yellow-300 text-[9px] leading-tight truncate px-1 font-sans">
                                            {c.nameKo}
                                          </span>
                                          <span className="text-[6px] text-white/50 uppercase tracking-widest leading-none truncate px-1 font-mono">
                                            {c.reversed ? "역방향" : c.name}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                  </div>
                                </div>
                              )}

                              {(tarotResult || isTarotGenerating) && (
                                <div className="glass p-5 rounded-2xl border border-yellow-500/30 shadow-2xl flex flex-col relative overflow-hidden">
                                  <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-500/5 blur-[60px] pointer-events-none rounded-full" />
                                  <div className="flex justify-between items-center mb-4 shrink-0 relative z-10 w-full font-sans">
                                    <div className="flex items-center gap-2 text-yellow-400">
                                      <Sparkles size={16} />
                                      <h4 className="text-xs font-bold tracking-widest uppercase">
                                        Trinity's Insight
                                      </h4>
                                    </div>
                                    <button
                                      onClick={async () => {
                                        if (isTTSActive) {
                                          stopTTS();
                                        } else if (tarotResult) {
                                          await playTTSInChunks(tarotResult, 'Kore', 220, '신비');
                                        }
                                      }}
                                      className={`p-1.5 rounded-full transition-all ${isTTSActive ? "bg-yellow-500/20 text-yellow-400 animate-pulse" : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10"}`}
                                      title={isTTSActive ? "낭독 중지하기" : "음성으로 듣기"}
                                    >
                                      {isTTSActive ? <VolumeX size={14} /> : <Volume2 size={14} />}
                                    </button>
                                  </div>

                                  <div
                                    className="text-white/80 text-sm leading-relaxed relative z-10 w-full font-sans"
                                    style={{ wordBreak: "keep-all" }}
                                  >
                                    {isTarotGenerating && !tarotResult?.trim() ? (
                                      <div className="flex flex-col items-center justify-center py-8 gap-4 text-white/40">
                                        <RefreshCw
                                          className="animate-spin text-yellow-500/50"
                                          size={28}
                                        />
                                        <p className="font-sans text-xs tracking-widest uppercase animate-pulse">
                                          우주의 메시지 해독 중...
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="space-y-3">
                                        <Streamdown>{tarotResult || ""}</Streamdown>
                                        {isTarotGenerating && (
                                          <p className="text-[10px] text-yellow-400/60 uppercase tracking-widest animate-pulse text-center">
                                            리딩 수신 중...
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                            </div>

                            {/* Tarot Result Bottom Actions: Deep Insight with Lucy + Redraw */}
                            {tarotResult && !isTarotGenerating && (
                              <div className="pt-3 border-t border-white/10 flex flex-col gap-3 w-full shrink-0">
                                {/* Tarot Dependency Prevention & Healthy Mindfulness Disclaimer Card */}
                                <div className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex items-start gap-3 text-left">
                                  <div className="w-7 h-7 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-300 shrink-0 mt-0.5">
                                    <Compass size={15} />
                                  </div>
                                  <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                                      <ShieldCheck size={13} className="text-amber-400" />
                                      <span>건강한 타로 활용 안내 (Mindful Tarot & Free Will)</span>
                                    </div>
                                    <p className="text-[11px] text-white/65 font-sans leading-relaxed">
                                      타로는 정해진 미래를 맹신하거나 과도하게 의존하기 위한 도구가 아닌, 현재 내면의 무의식을 비추고 더 나은 선택을 돕는 <strong className="text-amber-200/90 font-semibold">‘마음의 나침반’</strong>입니다. 삶을 창조하는 진정한 힘과 최종 결정권은 언제나 당신 자신의 용기 있는 실천과 자유의지(Free Will)에 있습니다.
                                    </p>
                                  </div>
                                </div>

                                {/* Redraw Button */}
                                <div className="flex justify-center pt-1">
                                  <button
                                    onClick={() => {
                                      resetTarotSession(false);
                                    }}
                                    className="text-yellow-400/85 hover:text-yellow-300 hover:bg-yellow-500/10 transition-all text-[11px] uppercase tracking-widest font-bold flex items-center gap-2 py-2 px-6 rounded-full bg-yellow-500/5 border border-yellow-500/20 hover:border-yellow-500/40 cursor-pointer active:scale-95 duration-200"
                                  >
                                    <RefreshCw size={11} />
                                    <span>새로운 리딩 (Redraw)</span>
                                  </button>
                                </div>

                                {/* Lucy Deep Insight Card */}
                                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-yellow-500/15 via-black/70 to-purple-500/15 border border-yellow-500/30 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                                  <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-1.5 text-yellow-300 font-bold text-xs sm:text-sm">
                                      <Sparkles size={15} className="text-yellow-400 animate-pulse shrink-0" />
                                      <span>루시와 1:1 심층 상담 (Deep Insight)</span>
                                    </div>
                                    <p className="text-[11px] text-white/70 font-sans leading-relaxed">
                                      방금 나온 타로 마스터의 리딩 결과를 바탕으로, 루시와 함께 마음속 깊은 심층 통찰과 영적 대화를 이어가세요.
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const dailyCard = dailyResult?.drawnCard || null;
                                      const cardSummary = drawnCards
                                        ? drawnCards.map((c) => `${c.nameKo}${c.reversed ? '(역방향)' : ''}`).join(', ')
                                        : '';
                                      const deepContext = `[🔮 78장 타로 마스터 리딩 심층 연계]\n- 질문 고민: "${tarotConcern}"\n- 적용 배열법: ${tarotSpreadRecommendation.name} (${tarotSpreadRecommendation.cardCount}장)\n- 펼쳐진 카드: [${cardSummary}]\n${dailyCard ? `- 오늘의 지배 카드: ${dailyCard.nameKo}\n` : ''}\n- 트리니티 마스터 리딩 결과:\n${tarotResult.slice(0, 900)}`;
                                      void handleSend(
                                        `트리니티 타로 마스터에게 받은 "${tarotConcern}" 리딩 결과에 대해 루시와 심층 상담(Deep Insight)을 나누고 싶어.\n\n[타로 리딩 요약]\n- 배열법: ${tarotSpreadRecommendation.name} (${tarotSpreadRecommendation.cardCount}장)\n- 카드: ${cardSummary}\n\n이 리딩 내용을 바탕으로 내 무의식과 앞으로의 방향성을 더 깊이 통찰해줘.`,
                                        {
                                          force: true,
                                          oracleContext: deepContext,
                                        },
                                      );
                                    }}
                                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(234,179,8,0.4)] active:scale-95 cursor-pointer shrink-0"
                                  >
                                    <Sparkles size={14} />
                                    <span>루시와 심층 상담하기</span>
                                    <ChevronRight size={14} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : activeMode === "bible" ? (
              <motion.div key="bible" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12 pb-8 sm:pb-12 pt-4 sm:pt-6">
                 <div className="space-y-10">
                    <TarotBible 
                      onConsult={(text) => { openLucyChat('trinity'); handleSend(text); }} 
                    />
                 </div>
              </motion.div>
            ) : activeMode === "simple" ? (
              <motion.div
                key="simple"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 flex flex-col items-center justify-center pt-8 pb-6"
              >
                <div className="w-full max-w-2xl glass p-5 md:p-12 rounded-[28px] md:rounded-[64px] border border-yellow-500/30 shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-yellow-500/10 blur-[100px] rounded-full scale-110 group-hover:scale-125 transition-transform" />
                  <div className="relative z-10 space-y-6 md:space-y-12 text-white">
                    <div className="flex flex-col items-center gap-4 md:gap-6 text-center">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-[32px] bg-yellow-500/20 flex items-center justify-center text-yellow-400 border border-yellow-500/30 shadow-2xl animate-pulse">
                        <Sparkles size={32} className="md:w-10 md:h-10" />
                      </div>
                      <h3 className="text-2xl md:text-5xl font-sans text-white font-bold tracking-tighter text-center">
                        Flux Consultation
                      </h3>
                      <p className="text-[10px] md:text-sm text-yellow-500/60 uppercase tracking-[0.25em] md:tracking-[0.4em] font-sans font-black text-center">
                        우주적 지혜와의 실시간 동기화
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        "나의 영적 진화 단계는 어디인가요?",
                        "오늘의 우주적 에너지를 어떻게 활용할까요?",
                        "내면의 갈등을 해결할 수 있는 지혜 한 줄",
                        "타인과의 관계에서 필요한 영적 조언",
                        "성공과 성장을 위한 영혼의 메시지",
                        "명상 중에 떠오른 의문을 풀고 싶어요",
                        "내 영혼이 진정으로 원하는 삶의 목적을 찾는 방법",
                        "부정적인 에너지를 차단하고 내 주파수를 높이는 법",
                        "반복되는 문제 속에서 배워야 할 카르마적 교훈",
                        "직관력을 높이고 우주의 신호를 더 잘 읽어내는 방법"
                      ].map((q) => (
                        <button
                          key={q}
                          onClick={() => handleSend(q)}
                          className="px-6 py-6 rounded-[28px] bg-white/5 hover:bg-white/15 border border-white/10 transition-all text-sm sm:text-base text-left text-white/80 hover:text-white flex items-start justify-between gap-3 group/btn font-sans font-bold shadow-xl backdrop-blur-md"
                        >
                          <span className="leading-tight">"{q}"</span>
                          <ChevronRight
                            size={20}
                            className="mt-0.5 shrink-0 opacity-0 group-hover/btn:opacity-100 transition-all -translate-x-3 group-hover/btn:translate-x-0 text-yellow-400"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : activeMode === "daily" ? (
              <motion.div
                key="daily"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full pb-8 sm:pb-12"
              >
                <TrinityDailyLuckyView
                  onConsult={(text) => {
                    openLucyChat('trinity');
                    handleSend(text);
                  }}
                />
              </motion.div>
            ) : activeMode === "soul" ? (
              <motion.div
                key="soul"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-12"
              >
                {isEditingProfile ? (
                  <div className="max-w-2xl mx-auto glass p-12 rounded-[60px] border border-yellow-500/20 shadow-2xl space-y-10">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-display text-white ">
                        Soul Profile Configuration
                      </h3>
                      <button
                        onClick={() => setIsEditingProfile(false)}
                        className="p-2 hover:bg-white/5 rounded-full text-white/20 hover:text-white"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-3 block">
                          Name
                        </label>
                        <input
                          className="w-full bg-white/5 border border-white/10 rounded-[24px] px-6 py-4 text-sm focus:outline-none focus:border-yellow-500/50 text-white"
                          value={form.name}
                          onChange={(e) =>
                            setForm({ ...form, name: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-3 block">
                          Nickname
                        </label>
                        <input
                          className="w-full bg-white/5 border border-white/10 rounded-[24px] px-6 py-4 text-sm focus:outline-none focus:border-yellow-500/50 text-white"
                          value={form.nickname}
                          onChange={(e) =>
                            setForm({ ...form, nickname: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-3 block">
                          Birth Date
                        </label>
                        <input
                          type="date"
                          className="w-full bg-white/5 border border-white/10 rounded-[24px] px-6 py-4 text-sm focus:outline-none focus:border-yellow-500/50 text-white invert-calendar"
                          value={form.birthdate}
                          onChange={(e) =>
                            setForm({ ...form, birthdate: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-3 block">
                          Birth Time
                        </label>
                        <input
                          type="time"
                          className="w-full bg-white/5 border border-white/10 rounded-[24px] px-6 py-4 text-sm focus:outline-none focus:border-yellow-500/50 text-white invert-calendar"
                          value={form.birthtime}
                          onChange={(e) =>
                            setForm({ ...form, birthtime: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-3 block">
                          City
                        </label>
                        <input
                          className="w-full bg-white/5 border border-white/10 rounded-[24px] px-6 py-4 text-sm focus:outline-none focus:border-yellow-500/50 text-white"
                          placeholder="e.g. Seoul"
                          value={form.city}
                          onChange={(e) =>
                            setForm({ ...form, city: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-3 block">
                          Gender
                        </label>
                        <div className="flex gap-2 p-1 bg-white/5 rounded-[24px] border border-white/10">
                          {["여성", "남성"].map((g) => (
                            <button
                              key={g}
                              onClick={() => setForm({ ...form, gender: g })}
                              className={`flex-1 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all ${form.gender === g ? "bg-yellow-600 text-white shadow-lg shadow-yellow-500/20" : "text-white/30 hover:text-white"}`}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleSaveProfile}
                      className="w-full py-5 rounded-[28px] bg-yellow-600 text-white font-black uppercase tracking-[0.3em] shadow-xl shadow-yellow-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      Update Destiny Soul
                    </button>
                  </div>
                ) : insightResult ? (
                  <div className="w-full max-w-4xl mx-auto glass p-10 mt-10 rounded-[60px] border border-yellow-500/30 shadow-[0_0_100px_rgba(234,179,8,0.1)]">
                    <div className="flex items-center justify-between mb-10">
                      <div className="flex items-center gap-3">
                        <Zap size={22} className="text-yellow-400" />
                        <span className="text-sm font-bold text-yellow-500 tracking-[0.4em] uppercase ">
                          The Destiny Decree
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                      <StatBar
                        label="Soul Luck"
                        value={insightResult.luckScore || 0}
                        color="#eab308"
                      />
                      <StatBar
                        label="Harmony"
                        value={insightResult.loveScore || 0}
                        color="#f472b6"
                      />
                      <StatBar
                        label="Abundance"
                        value={insightResult.wealthScore || 0}
                        color="#4ade80"
                      />
                      <StatBar
                        label="Vitality"
                        value={insightResult.healthScore || 0}
                        color="#60a5fa"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 font-sans font-medium uppercase tracking-tight">
                      {[
                        {
                          label: "동기화 상태",
                          v: translateEnglishValue(insightResult.deepSyncLevel || "OPTIMAL"),
                          c: "text-yellow-400",
                        },
                        {
                          label: "파워 아이템",
                          v: translateEnglishValue(insightResult.luckyItem),
                          c: "text-yellow-300",
                        },
                        {
                          label: "집중 색상",
                          v: translateEnglishValue(insightResult.luckyColor),
                          c: "text-yellow-200",
                        },
                      ].map((i, idx) => (
                        <div
                          key={idx}
                          className="p-6 bg-white/[0.03] border border-white/5 rounded-[40px] flex flex-col items-center justify-center"
                        >
                          <span className="text-[10px] text-white/30 uppercase tracking-widest mb-2 font-sans font-bold">
                            {i.label}
                          </span>
                          <span className={`text-base text-center ${i.c}`}>
                            {i.v}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-6 text-left">
                      <div className="p-8 bg-yellow-500/10 border border-yellow-500/20 rounded-[48px] shadow-inner font-sans">
                        <div className="flex items-center gap-3 mb-4">
                           <Sparkles size={18} className="text-yellow-400 animate-pulse" />
                           <div className="flex flex-col text-left">
                             <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-widest leading-none">Master's Guidance</span>
                             <span className="text-[9px] text-white/40 font-sans mt-1 leading-none">오늘 하루의 구체적 행동 지침과 따뜻한 심리 멘토링 조언입니다.</span>
                           </div>
                         </div>
                        <div className="text-base sm:text-lg text-white/90 font-sans leading-relaxed [&>h3]:text-yellow-300 [&>h3]:text-xl [&>h3]:mb-2 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-4 [&>p]:mb-4">
                          <Streamdown>{insightResult.guidance}</Streamdown>
                        </div>
                        <div className="flex justify-end mt-4">
                          <TTSButton text={insightResult.guidance} voice="Kore" className="shrink-0" />
                        </div>
                      </div>
                      <div className="p-10 bg-yellow-500/5 rounded-[54px] border border-yellow-500/20 font-sans text-white/70 leading-relaxed relative overflow-hidden backdrop-blur-md shadow-[0_4px_30px_rgba(234,179,8,0.05)] text-left">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none"></div>
                         <div className="flex items-center gap-3 mb-4">
                           <div className="p-2 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
                             <Sparkles size={18} className="animate-pulse" />
                           </div>
                           <div className="flex flex-col">
                             <span className="text-xs font-bold text-yellow-400 uppercase tracking-widest">Spiritual Blueprint & Metaphysical Core</span>
                             <span className="text-[10px] text-white/40 mt-0.5 font-sans">영적 청사진과 형이상학적 본질 분석</span>
                           </div>
                         </div>
                         <p className="text-[11px] text-white/50 bg-white/[0.02] border border-white/5 rounded-2xl px-4 py-2.5 mb-4 leading-relaxed font-sans font-medium">
                           ✨ 몸, 마음, 정신의 세 축이 오늘의 거대한 근원적 우주 청사진과 어떻게 연결되고 공명하는지 밝혀내는 다차원적 분석입니다.
                         </p>
                         <div className="text-base sm:text-lg text-white/90 font-sans leading-relaxed text-left">
                           <Streamdown>{insightResult.cosmicAspect}</Streamdown>
                         </div>
                       </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-8 max-w-md mx-auto text-center mt-20">
                    <div className="w-20 h-20 rounded-[28px] bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                      <Zap size={40} className="text-yellow-500" />
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-3xl font-display text-white font-bold tracking-tight uppercase">
                        Energy Analysis
                      </h3>
                      <p className="text-sm text-white/40 font-sans leading-relaxed">
                        "현재 당신의 영적 주파수와 운명의 흐름을 다차원적으로 분석합니다. 트리니티의 연금술과 결합하여 오늘의 운명 선언문을 발행하세요."
                      </p>
                    </div>
                    <div className="flex flex-col gap-4 w-full">
                      <button
                        onClick={handleEnergyAnalysis}
                        disabled={isMeasuringInsight}
                        className="w-full px-10 py-5 rounded-[32px] bg-yellow-500 text-black font-black uppercase tracking-[0.3em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-yellow-500/20 flex items-center justify-center"
                      >
                        {isMeasuringInsight ? (
                          <RefreshCw className="animate-spin" size={20} />
                        ) : (
                          "분석 시작하기"
                        )}
                      </button>
                      <button
                        onClick={() => setIsEditingProfile(true)}
                        className="text-[10px] text-white/30 hover:text-white font-bold uppercase tracking-widest transition-all mt-2"
                      >
                        Config Soul Profile
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : activeMode === "history" ? (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-12 pb-6"
              >

                  <div className="glass p-10 rounded-[60px] border border-yellow-500/20 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-400 border border-yellow-500/20">
                        <Library size={28} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-display text-white">
                          Oracle Library
                        </h3>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="mb-8">
                      <CalendarView
                        selectedDate={selectedDate}
                        onDateSelect={setSelectedDate}
                        highlightDates={localHistory.map(
                          (h: any) =>
                            new Date(h.createdAt || h.timestamp || Date.now()),
                        )}
                        color={"#eab308"}
                      />
                    </div>

                    {/* Category Filter */}
                    {localHistory.length > 0 &&
                      Array.from(
                        new Set(
                          localHistory.map((h: any) => h.type || "RECORD"),
                        ),
                      ).length > 1 && (
                        <div className="flex flex-wrap gap-2 mb-6">
                          <button
                            onClick={() => setCategoryFilter("all")}
                            className={`px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all ${categoryFilter === "all" ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" : "bg-white/5 text-white/20 border border-white/5 hover:text-white/40"}`}
                          >
                            All Categories
                          </button>
                          {Array.from(
                            new Set(
                              localHistory.map((h: any) => h.type || "RECORD"),
                            ),
                          ).map((cat: any) => (
                            <button
                              key={cat}
                              onClick={() => setCategoryFilter(cat)}
                              className={`px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all ${categoryFilter === cat ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" : "bg-white/5 text-white/20 border border-white/5 hover:text-white/40"}`}
                            >
                              {TYPE_LABELS[cat] || cat}
                            </button>
                          ))}
                        </div>
                      )}

                    {localHistory.filter(
                      (h: any) =>
                        (!selectedDate ||
                          new Date(
                            h.createdAt || h.timestamp || Date.now(),
                          ).toDateString() === selectedDate.toDateString()) &&
                        (categoryFilter === "all" ||
                          (h.type || "RECORD") === categoryFilter),
                    ).length > 0 ? (
                      localHistory
                        .filter(
                          (h: any) =>
                            (!selectedDate ||
                              new Date(
                                h.createdAt || h.timestamp || Date.now(),
                              ).toDateString() ===
                                selectedDate.toDateString()) &&
                            (categoryFilter === "all" ||
                              (h.type || "RECORD") === categoryFilter),
                        )
                        .map((h: any, i: number) => (
                          <div
                            key={h.id || i}
                            className="p-6 rounded-3xl glass border border-white/10 hover:border-yellow-400/40 shadow-2xl hover:bg-white/[0.08] transition-all text-left"
                          >
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">
                                {TYPE_LABELS[h.type] || h.type || "RECORD"}
                              </span>
                              <span className="text-[10px] text-white/20 font-mono ">
                                {new Date(
                                  h.createdAt || Date.now(),
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-white/70 font-sans">
                              "{h.content || h.text || "분석 완료 데이터"}"
                            </p>
                          </div>
                        ))
                    ) : (
                      <p className="text-center text-white/20  py-20">
                        아직 우주의 기록이 비어있습니다.
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </main>

      {/* Loading & Status Overlays */}
      <AnimatePresence>
        {isMeasuringInsight && !insightResult && (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] glass backdrop-blur-3xl flex flex-col items-center justify-center p-8 text-center space-y-12"
          >
            <div className="relative w-48 h-48">
              <div className="absolute inset-0 bg-yellow-500/30 blur-[100px] animate-pulse rounded-full" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="w-full h-full border-t-2 border-r-2 border-yellow-500/40 rounded-full relative"
              >
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full shadow-[0_0_20px_rgba(234,179,8,0.8)]" />
              </motion.div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Zap size={64} className="text-yellow-400 animate-bounce" />
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-2xl font-display font-black text-white  tracking-widest uppercase">
                Measuring Souls
              </h3>
              <div className="flex justify-center gap-1.5 h-6">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ height: [4, 24, 4] }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      delay: i * 0.1,
                    }}
                    className="w-1.5 bg-yellow-500/60 rounded-full"
                  />
                ))}
              </div>
              <p className="text-[10px] text-white/30 font-sans uppercase tracking-[0.4em]">
                Synching with the universal frequency...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <DailyOracleLoadingOverlay isLoading={isDailyOracleLoading} theme="yellow" />
      <NoticeModal
        isOpen={notice.open}
        onClose={() => setNotice((p) => ({ ...p, open: false }))}
        title={notice.title}
        message={notice.message}
      />

      {/* Today's Ruling Card / Daily Result Modal */}
      <AnimatePresence>
        {showDailyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[250] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
            onClick={() => setShowDailyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.98, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.98, y: 10 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl bg-[#0e0e14] border border-yellow-500/30 p-5 sm:p-7 rounded-[28px] shadow-2xl text-white max-h-[88vh] overflow-y-auto space-y-5"
            >
              <button
                type="button"
                onClick={() => setShowDailyModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="닫기"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-yellow-400 font-mono">
                <Sparkles size={13} className="text-yellow-400" />
                <span>오늘의 데일리 타로 결과 (Today&apos;s Daily Oracle)</span>
              </div>

              {dailyResult ? (
                <div className="space-y-5">
                  {/* Card showcase */}
                  {dailyResult.drawnCard && (
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-yellow-500/15 via-amber-500/10 to-yellow-950/20 border border-yellow-500/30 shadow-md">
                      <div className="w-20 h-32 rounded-xl overflow-hidden border border-yellow-400/40 bg-zinc-900 shadow-lg shrink-0">
                        <img
                          src={getTarotCardImageUrl(dailyResult.drawnCard)}
                          alt={`${dailyResult.drawnCard.nameKo} 타로 카드`}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      </div>
                      <div className="space-y-1.5 text-center sm:text-left flex-1 min-w-0">
                        <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                          <span className="text-[10px] font-mono uppercase tracking-widest text-yellow-400/80">
                            COSMIC ANCHOR
                          </span>
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-200 border border-yellow-400/30 font-semibold">
                            {dailyResult.drawnCard.reversed ? '역방향 (Reversed)' : '정방향 (Upright)'}
                          </span>
                        </div>
                        <h4 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                          {dailyResult.drawnCard.nameKo} <span className="text-xs text-white/50 font-mono font-normal">({dailyResult.drawnCard.name})</span>
                        </h4>
                        {dailyResult.drawnCard.keywords?.length > 0 && (
                          <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap pt-1">
                            {dailyResult.drawnCard.keywords.slice(0, 4).map((kw: string) => (
                              <span key={kw} className="text-[9px] px-2 py-0.5 rounded-full bg-white/10 text-yellow-300/90 border border-white/10">
                                {kw}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Reading Interpretation */}
                  <div className="space-y-2 text-left">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                        <Sparkles size={13} /> 오늘의 심층 비전 해독
                      </span>
                      <TTSButton
                        text={`${dailyResult.diagnosis || dailyResult.summary || ''}\n\n${TAROT_HEALTHY_GUIDE_TEXT}`}
                        voice="Kore"
                        className="text-yellow-400 border-yellow-500/20 text-xs py-1 scale-90"
                      />
                    </div>
                    <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 text-stone-200 text-sm leading-relaxed space-y-3 shadow-inner max-h-64 overflow-y-auto">
                      <Streamdown>{dailyResult.diagnosis || dailyResult.summary || '오늘의 타로 리딩 결과를 불러오는 중입니다.'}</Streamdown>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowDailyModal(false);
                        setActiveMode('tarot');
                        setTarotConcern('오늘의 타로');
                        setStage('landing');
                      }}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 hover:text-yellow-200 border border-yellow-400/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                      <TarotCardIcon size={14} />
                      <span>오늘의 타로 보기</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDailyModal(false);
                        handleOracleDeepInsight();
                      }}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(250,204,21,0.3)] active:scale-95 cursor-pointer"
                    >
                      <Sparkles size={13} />
                      <span>루시와 지배 카드 심층 상담하기</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDailyModal(false)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 hover:text-white text-xs font-bold transition-all cursor-pointer"
                    >
                      닫기
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-8 px-4 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400 mx-auto">
                    <Sparkles size={24} className="animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-white">오늘의 타로 카드가 아직 없습니다</h4>
                    <p className="text-xs text-white/50 max-w-sm mx-auto leading-relaxed">
                      오늘 하루의 우주적 기운과 배경 에너지를 담은 데일리 타로 카드를 아직 뽑지 않았습니다.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDailyModal(false);
                      setActiveMode('tarot');
                      setTarotConcern('오늘의 타로');
                      setStage('landing');
                      setTarotVirtualMode(true);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold text-xs flex items-center justify-center gap-2 mx-auto shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <Sparkles size={14} />
                    <span>오늘의 타로 보기 (1장 뽑기)</span>
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>



      

      <AnimatePresence>
        {showEmblemModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 sm:bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto font-sans select-none pointer-events-auto"
            onClick={() => setShowEmblemModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg bg-[#0c0c12] border border-yellow-500/30 p-6 sm:p-10 text-center flex flex-col gap-6 overflow-y-auto rounded-[28px] sm:rounded-[42px] shadow-2xl relative z-10 no-scrollbar select-none text-white font-sans overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 blur-[100px] -mr-32 -mt-32 rounded-full pointer-events-none" />

              <button
                onClick={() => setShowEmblemModal(false)}
                className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full text-white/20 hover:text-white transition-all cursor-pointer z-50 unique-close-btn"
              >
                <X size={18} />
              </button>

              <div className="mx-auto w-20 h-20 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                <Sparkles className="text-yellow-400 animate-pulse" size={40} />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold font-sans text-white tracking-tight uppercase">Trinity Sanctuary Lore</h3>
                <p className="text-[10px] text-yellow-400 font-bold uppercase tracking-[0.3em]">운명과 오라클 인과율</p>
              </div>

              <p className="text-sm text-yellow-100/70 leading-relaxed font-sans text-left break-keep bg-white/5 p-6 rounded-3xl border border-yellow-500/10">
                <strong>TRINITY</strong>는 우주의 거대한 인과율과 운명의 흐름을 꿰뚫는 신비로운 예언의 제단입니다. 세 장의 특수 오라클 운명 카드를 통하여 당신의 삶의 과거, 현재, 미래를 파악하고, 운명을 긍정적으로 제조하고 초월해 나가는 영적인 치유와 빛을 선사합니다.
              </p>

              <div className="space-y-4">
                {[
                  { label: 'Destiny Alignment Harmony', val: 95, color: 'from-yellow-400 to-amber-500' },
                  { label: 'Causal Flow Intelligence', val: 91, color: 'from-amber-400 to-orange-400' },
                  { label: 'Spiritual Coherence Density', val: 94, color: 'from-yellow-500 to-yellow-600' }
                ].map(spec => (
                  <div key={spec.label} className="space-y-1 text-left">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-white/60">{spec.label}</span>
                      <span className="text-yellow-400 font-bold">{spec.val}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${spec.val}%` }} 
                        transition={{ duration: 1.2, ease: "easeOut" }} 
                        className={`h-full bg-gradient-to-r ${spec.color}`} 
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowEmblemModal(false)}
                className="w-full py-4 rounded-[20px] bg-yellow-600 text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-yellow-500/20 hover:scale-[1.02] active:scale-95 transition-all text-xs"
              >
                Sync Complete 🌀
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>



      {/* global portal for tarot reading popup modal overlay */}
      <AnimatePresence>
        {showTarotModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[200] bg-[#07080f] overflow-y-auto w-full h-full flex flex-col font-sans no-scrollbar select-none text-white pointer-events-auto"
            onClick={() => setShowTarotModal(false)}
          >
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-5xl mx-auto flex flex-col flex-1 p-4 sm:p-8 md:p-12 gap-6 sm:gap-8 text-left pointer-events-auto min-h-screen"
              style={{
                paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.25rem)',
                paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)',
                paddingLeft: 'calc(env(safe-area-inset-left, 0px) + 1rem)',
                paddingRight: 'calc(env(safe-area-inset-right, 0px) + 1rem)',
              }}
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 blur-[100px] -mr-32 -mt-32 rounded-full pointer-events-none" />
              
              {/* Header */}
              <div className="flex items-center justify-between relative z-10 border-b border-white/5 pb-4 shrink-0">
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                          <Sparkles size={18} className="text-yellow-400 animate-pulse" />
                       </div>
                       <div>
                          <span className="text-[9px] font-black text-yellow-500/55 uppercase tracking-[0.3em] block leading-none mb-1 font-mono">TAROT ORACLE</span>
                          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">아스트랄 타로 차원 (Celeste Tarot)</span>
                       </div>
                    </div>
                 </div>

                 {/* Top Close Button */}
                 <button
                    type="button"
                    onClick={() => setShowTarotModal(false)}
                    className="px-3.5 py-1.5 min-h-[40px] rounded-full border border-white/15 bg-white/5 hover:bg-white/10 active:scale-95 text-xs text-white/70 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                    aria-label="닫기"
                 >
                    <span>닫기</span>
                 </button>
              </div>

              {/* Tarot Forge Workspace (Modal Edition) */}
              <div className="relative z-10 w-full overflow-x-hidden flex flex-col">
                <div className="w-full flex flex-col relative">
                  {tarotVirtualMode && (
                    <TarotSpread
                      maxCards={tarotSpreadRecommendation.cardCount}
                      positions={tarotSpreadRecommendation.positions}
                      spreadName={tarotSpreadRecommendation.name}
                      spreadReason={tarotSpreadRecommendation.reason}
                      concern={tarotConcern}
                      onCancel={() => setTarotVirtualMode(false)}
                      onComplete={(cards, touchMetadata) => {
                        setTarotVirtualMode(false);
                        setDrawnCards(cards);
                        setHideTarotPopup(false);
                        handleUnifiedReading("tarot", { selectedCards: cards, touchMetadata });
                      }}
                    />
                  )}
                  {/* Premium Subtle Auric Background Glows - Purely elegant light fields with no basic icons */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                    <div className="absolute -top-[30%] -left-[20%] w-[85%] h-[85%] rounded-full bg-[oklch(0.75_0.15_85)]/5 mix-blend-screen filter blur-[140px]" />
                    <div className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-purple-500/[0.04] mix-blend-screen filter blur-[120px]" />
                    <div className="absolute top-[35%] left-[25%] w-[50%] h-[50%] rounded-full bg-amber-500/[0.02] mix-blend-screen filter blur-[100px]" />
                    {/* Thin elegant golden celestial starry grid pattern for a high-jewelry luxury feel */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(234,179,8,0.06)_1px,transparent_1px)] bg-[size:32px_32px]" />
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:64px_64px]" />
                  </div>
                  {/* Modal-Only Active Content */}
                  <div className="hidden p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-yellow-500/10 relative z-10 bg-white/10 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
                        <TarotCardIcon size={20} />
                      </div>
                      <div>
                        <h2 className="text-yellow-400 uppercase tracking-[0.3em] text-xs font-bold font-sans">
                          ASTRAL TAROT WORKSPACE
                        </h2>
                      </div>
                    </div>

                    {/* Modal-Only Merged sub-tabs selection */}
                    <div className="flex gap-1 p-1 rounded-2xl bg-black/40 border border-yellow-500/10 shadow-inner w-full sm:w-auto">
                      <button
                        onClick={() => {
                          setStage('landing');
                          setTarotModalTab('daily');
                        }}
                        className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest font-bold transition-all duration-300 cursor-pointer ${
                          tarotModalTab === 'daily'
                            ? 'bg-yellow-600/90 text-white shadow-md shadow-yellow-500/10 border border-yellow-500/20'
                            : 'text-white/40 hover:text-white/80'
                        }`}
                      >
                        Daily Oracle
                      </button>
                      <button
                        onClick={() => {
                          setStage('landing');
                          setTarotModalTab('tarot');
                        }}
                        className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest font-bold transition-all duration-300 cursor-pointer ${
                          tarotModalTab === 'tarot'
                            ? 'bg-yellow-600/90 text-white shadow-md shadow-yellow-500/10 border border-yellow-500/20'
                            : 'text-white/40 hover:text-white/80'
                        }`}
                      >
                        Tarot Reading
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 p-6 relative z-10 w-full scroll-smooth flex flex-col overflow-y-auto no-scrollbar max-h-[60vh]">
                    {tarotModalTab === 'daily' ? (
                      <div className="space-y-6 flex-1 flex flex-col justify-between w-full">
                        {!dailyResult ? (
                          <div className="space-y-6">
                            <div className="space-y-2 text-center">
                              <span className="text-[9px] text-yellow-400 font-bold uppercase tracking-[0.3em] font-mono block">
                                우주적 기호와의 공명 (Oracle Alignment)
                              </span>
                              <h4 className="text-xl sm:text-2xl font-display text-white tracking-widest uppercase">
                                {selectedCardIdx === null ? "Draw Your Daily Card" : "Your Chosen Oracle"}
                              </h4>
                              {selectedCardIdx === null && (
                                <p className="text-[11px] text-white/45 max-w-md mx-auto leading-relaxed">
                                  오늘 당신의 기운과 가장 비밀스럽게 반짝이는 우주 오라클 카드 1장을 아래 덱에서 선택하십시오.
                                </p>
                              )}
                            </div>

                            {/* Modal-Only Card Arena */}
                            {/* Modal-Only Card Arena Started */}
                            <div className="relative w-full min-h-[12.5rem] md:min-h-[220px] flex items-center justify-center select-none overflow-visible py-2 md:py-4 my-2 -mx-1 sm:mx-0">
                              {!dailyDrawnCard ? (
                                renderDailyCardDeck("trinity-deck-modal", "modal")
                              ) : dailyDrawnCard ? (
                                <motion.div
                                  initial={{ opacity: 0, y: 50 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ type: "spring", stiffness: 55, damping: 16 }}
                                  className="flex flex-col md:flex-row items-center justify-center gap-8 w-full max-w-2xl mx-auto block"
                                >
                                  {/* 3D Flip Card */}
                                  <div className="w-36 h-60 cursor-pointer relative shrink-0" style={{ perspective: "1000px" }} onClick={() => setIsFlipped(!isFlipped)}>
                                    <motion.div
                                      className="w-full h-full relative"
                                      style={{ transformStyle: "preserve-3d" }}
                                      animate={{ rotateY: isFlipped ? 180 : 0 }}
                                      transition={{ type: "spring", stiffness: 100, damping: 15 }}
                                    >
                                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-950 border border-yellow-500/40 flex items-center justify-center p-3 shadow-2xl group/card" style={{ transform: "rotateY(0deg)", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
                                        <div className="absolute inset-1.5 border border-yellow-500/20 rounded-xl flex flex-col items-center justify-center bg-yellow-500/5 group-hover/card:bg-yellow-500/10 transition-all shadow-inner">
                                          <div className="w-10 h-10 rounded-full border border-yellow-500/20 flex items-center justify-center bg-black/40 shadow-md">
                                            <Sparkles size={20} className="text-yellow-400 transition-all shadow-[0_0_8px_rgba(234,179,8,0.6)] animate-pulse" strokeWidth={1.5} />
                                          </div>
                                          <span className="absolute bottom-3 text-[10px] font-mono text-yellow-500/45 tracking-widest uppercase">TRINITY</span>
                                        </div>
                                      </div>
                                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-amber-950/30 border border-yellow-500/60 flex flex-col justify-between p-4 shadow-[0_0_30px_rgba(234,179,8,0.25)] overflow-hidden" style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
                                        <div className="absolute inset-1.5 border border-yellow-500/10 rounded-xl pointer-events-none" />
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 pointer-events-none opacity-[0.04] z-0 flex items-center justify-center">
                                          <Sparkles size={112} className="text-yellow-400" />
                                        </div>
                                        <div className="flex justify-between items-center text-[9px] font-mono text-yellow-500/60 z-10">
                                          <span>TRINITY ORACLE</span>
                                          <Sparkles size={10} className="text-yellow-400/60" />
                                        </div>
                                        <div className="w-12 h-12 mx-auto rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 drop-shadow-[0_0_12px_rgba(234,179,8,0.4)] z-10">
                                          {React.createElement(getTarotCardVisual(dailyDrawnCard).icon, { size: 24 })}
                                        </div>
                                        <div className="text-center font-bold z-10">
                                          <span className="text-sm font-bold font-sans text-yellow-300 block leading-tight">{dailyDrawnCard.nameKo}</span>
                                          <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest block">{dailyDrawnCard.name}</span>
                                        </div>
                                        <div className="flex flex-wrap justify-center gap-1.5 z-10">
                                          {dailyDrawnCard.keywords.slice(0, 3).map((kw) => (
                                            <span key={kw} className="text-[8px] font-sans px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400/80">{kw}</span>
                                          ))}
                                        </div>
                                      </div>
                                    </motion.div>
                                  </div>

                                  {/* Right column: Description */}
                                  <div className="flex-1 space-y-3 text-left md:pl-6 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0">
                                    <p className="text-xs text-white/50 leading-relaxed font-sans">
                                      {!isFlipped 
                                        ? "카드를 탭하여 은하의 기호와 숨겨진 은총을 뒤집어 보세요." 
                                        : `오늘의 기운 카드는 [${dailyDrawnCard.nameKo}]입니다.`}
                                    </p>

                                     {isFlipped && (
                                      <div className="space-y-3 bg-white/[0.02] border border-white/5 p-4 rounded-2xl animate-fade-in text-left">
                                        <div className="space-y-1">
                                          <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-widest font-mono">영성 상징 해석</span>
                                          <h5 className="text-sm font-bold text-white leading-snug">{dailyDrawnCard.nameKo}</h5>
                                        </div>
                                        <div className="text-xs text-white/70 leading-relaxed bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                                          오늘 당신의 우주적 에너지 파동과 가장 깊게 공명한 은하의 오라클 상징 기조입니다. 하단 가이드 해독 버튼을 가동하여 비전을 즉각 확인해 보십시오.
                                          <div className="mt-1.5 text-[10px] text-yellow-400 font-medium">
                                            키워드: {dailyDrawnCard.keywords.join(', ')}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              ) : null}
                            </div>
                          </div>
                        ) : (
                          // Show structured dailyResult inside the tarot panel
                          <div className="space-y-6 text-left animate-fade-in">
                            <div className="flex flex-col md:flex-row gap-6 items-start justify-between border-b border-white/10 pb-4">
                              <div className="space-y-2">
                                <span className="text-[9px] text-yellow-400 font-bold uppercase tracking-[0.3em] font-mono block font-sans">
                                  Oracle Alignment Complete
                                </span>
                                <h4 className="text-2xl font-display text-white tracking-widest uppercase">
                                  Delivered Daily Oracle
                                </h4>
                                <p className="text-xs text-white/50 leading-relaxed font-sans">
                                  오늘 당신의 기운에 맞춤화된 심층 통찰입니다.
                                </p>
                              </div>

                              {dailyResult.drawnCard && (
                                <div className="p-3 rounded-xl bg-white/5 border border-yellow-500/20 flex items-center gap-3 shrink-0">
                                  <div className="w-16 h-24 rounded-lg overflow-hidden border border-yellow-500/30 bg-zinc-900 shadow-lg">
                                    <img
                                      src={getTarotCardImageUrl(dailyResult.drawnCard)}
                                      alt={`${dailyResult.drawnCard.nameKo} 타로 카드 미리보기`}
                                      className="w-full h-full object-cover"
                                      onError={(event) => {
                                        event.currentTarget.style.display = "none";
                                      }}
                                    />
                                  </div>
                                  <div className="text-left">
                                    <span className="text-[8px] uppercase tracking-widest text-white/40 block">DRAWN CARD</span>
                                    <span className="text-xs font-bold text-yellow-300 block">{dailyResult.drawnCard.nameKo}</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-xs uppercase tracking-wider text-yellow-500 font-bold flex items-center gap-1 font-sans">
                                <Sparkles size={14} /> 심층 인과 관계식 비전 해독
                              </span>
                              <TTSButton text={dailyResult.diagnosis} voice="Kore" className="text-yellow-400 border-yellow-500/20 text-xs py-1.5 scale-90" />
                            </div>

                            <div className="p-6 md:p-8 rounded-3xl bg-white/[0.03] border border-white/10 text-stone-200 text-sm md:text-[15px] font-sans leading-loose space-y-4 shadow-xl">
                              <Streamdown>{dailyResult.diagnosis}</Streamdown>
                            </div>

                            {/* 🌟 루시와 1:1 심층 상담 (Deep Insight) Banner */}
                            <div className="relative overflow-hidden rounded-2xl border border-yellow-500/30 bg-gradient-to-r from-yellow-500/15 via-amber-500/10 to-yellow-950/20 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
                              <div className="space-y-1 text-left">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-lg bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center text-yellow-300 shadow-[0_0_8px_rgba(250,204,21,0.3)]">
                                    <Sparkles size={13} className="animate-pulse" />
                                  </div>
                                  <span className="text-xs sm:text-sm font-bold text-yellow-200">
                                    루시와 1:1 심층 상담 (Deep Insight)
                                  </span>
                                </div>
                                <p className="text-[11px] text-white/70 font-sans leading-relaxed">
                                  오늘 뽑은 데일리 타로 카드와 비전 진단을 바탕으로, 루시와 함께 마음속 깊은 통찰과 영적 대화를 이어가세요.
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={handleOracleDeepInsight}
                                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(250,204,21,0.35)] active:scale-95 cursor-pointer shrink-0"
                              >
                                <Sparkles size={13} />
                                <span>루시와 심층 상담하기</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Button triggering action when card chosen but dailyResult is not filled yet */}
                        {!dailyResult && selectedCardIdx !== null && dailyDrawnCard && isFlipped && (
                          <div className="pt-4 border-t border-white/5">
                            <motion.button 
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                handleUnifiedReading("daily", { selectedCard: dailyDrawnCard });
                              }}
                              disabled={isDailyOracleLoading}
                              className="w-full relative group overflow-hidden rounded-2xl p-1 bg-yellow-600 hover:bg-yellow-500 text-white font-bold tracking-widest py-3 uppercase text-xs z-10 transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                              {isDailyOracleLoading ? (
                                <div className="flex items-center gap-2">
                                  <motion.div
                                    animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                                    className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                                  />
                                  <span>Consulting Oracle...</span>
                                </div>
                              ) : (
                                <>
                                  <Sparkles size={16} />
                                  <span>Check Daily Vision</span>
                                </>
                              )}
                            </motion.button>
                          </div>
                        )}
                      </div>
                    ) : (
                      // Detailed Tarot Reading Tab
                      <div className="space-y-6 flex-1 flex flex-col justify-between w-full">
                        {!drawnCards &&
                        !tarotResult &&
                        !isTarotGenerating ? (
                          <div className="space-y-4 flex-1 flex flex-col justify-between w-full">
                            <div className="space-y-3 text-left w-full overflow-hidden">
                              <div className="flex items-center justify-between pl-2">
                                <label className="text-xs text-white/50 font-bold uppercase tracking-widest block">
                                  Your Concern
                                </label>
                                <button
                                  type="button"
                                  onClick={() => setIsSpreadModalOpen(true)}
                                  className="text-[11px] text-yellow-300 hover:text-yellow-200 font-bold font-sans flex items-center gap-1.5 px-3 py-1 rounded-xl bg-yellow-500/15 hover:bg-yellow-500/25 border border-yellow-500/30 transition-all cursor-pointer shadow-sm active:scale-95 group"
                                  title="타로 배열법 직접 선택 모달 열기"
                                >
                                  <Layers size={13} className="text-yellow-400 group-hover:rotate-12 transition-transform" />
                                  <span>배열법 선택</span>
                                  <ChevronRight size={13} className="text-yellow-400/70 group-hover:translate-x-0.5 transition-transform" />
                                </button>
                              </div>

                              {/* Popular Spread Preset Pills */}
                              <div className="flex items-center gap-1.5 overflow-x-auto select-none pb-1 scroll-smooth [scrollbar-width:none]">
                                <button
                                  type="button"
                                  onClick={() => setIsSpreadModalOpen(true)}
                                  className="flex-none px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-yellow-500/20 border-yellow-500/40 text-yellow-300 hover:border-yellow-400 hover:bg-yellow-500/30"
                                  title="전체 타로 배열법 검색 및 직접 선택 모달 열기"
                                >
                                  <Layers size={12} className="text-yellow-400" />
                                  <span>🎴 전체 배열법 선택</span>
                                </button>
                                {POPULAR_TAROT_SPREAD_PRESETS.map((preset) => {
                                  const isSelected = tarotSpreadRecommendation.theme === preset.theme;
                                  return (
                                    <button
                                      key={preset.theme}
                                      type="button"
                                      onClick={() => {
                                        setTarotConcern(preset.defaultPrompt);
                                        setCustomSpread(buildSpreadForTheme(preset.theme, { kind: 'open' }));
                                      }}
                                      className={`flex-none px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-sm ${
                                        isSelected
                                          ? 'bg-yellow-500/25 border-yellow-400/60 text-yellow-300 shadow-[0_0_12px_rgba(234,179,8,0.3)]'
                                          : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                                      }`}
                                      title={preset.desc}
                                    >
                                      <span>{preset.name}</span>
                                    </button>
                                  );
                                })}
                              </div>

                              <textarea
                                value={tarotConcern}
                                onChange={(e) => setTarotConcern(e.target.value)}
                                placeholder="타로에게 물어보고 싶은 고민을 상세히 적어주세요..."
                                className="w-full h-36 bg-black/30 border border-white/10 rounded-2xl p-5 text-white font-sans focus:outline-none focus:border-yellow-500/50 transition-all resize-none placeholder:text-white/20 leading-relaxed text-sm"
                              />

                              {/* Clickable Tarot Spread Recommendation / Custom Spread Card */}
                              <div
                                onClick={() => setIsSpreadModalOpen(true)}
                                className="rounded-2xl border border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 via-black/40 to-yellow-500/5 hover:border-yellow-400/60 hover:bg-yellow-500/15 p-4 transition-all cursor-pointer group shadow-md active:scale-[0.99] relative overflow-hidden text-left"
                                title="클릭하여 타로 배열법 직접 선택 / 변경하기"
                              >
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-400 font-mono flex items-center gap-1">
                                      <Sparkles size={11} className="text-yellow-400" />
                                      <span>{isAutoRecommended ? 'AI 자동 추천 배열법' : '직접 선택한 배열법'}</span>
                                    </span>
                                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 font-bold font-mono">
                                      {tarotSpreadRecommendation.cardCount}장
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 text-[11px] text-yellow-300/90 group-hover:text-yellow-200 font-bold transition-colors">
                                    <Layers size={13} className="text-yellow-400" />
                                    <span>배열법 선택 / 변경</span>
                                    <ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform" />
                                  </div>
                                </div>
                                <p className="text-sm text-white font-bold group-hover:text-yellow-200 transition-colors">
                                  {tarotSpreadRecommendation.name}
                                </p>
                                <p className="text-[11px] text-white/60 mt-1 leading-relaxed break-keep">
                                  {tarotSpreadRecommendation.reason}
                                </p>
                                <div className="flex flex-wrap items-center gap-1 mt-2.5">
                                  {tarotSpreadRecommendation.positions.map((pos, pIdx) => (
                                    <span
                                      key={pIdx}
                                      className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-black/50 border border-white/10 text-white/70"
                                    >
                                      {pos}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {(smartTarotQuestions.length > 0 || isGeneratingQuestions) && (
                              <div className="space-y-2 mt-2 w-full text-left">
                                <span className="text-[10px] text-yellow-400/90 font-bold uppercase tracking-wider pl-2 flex items-center gap-1">
                                  <Wand2 size={10} /> AI 맞춤 질문
                                  {isGeneratingQuestions && <RefreshCw size={8} className="animate-spin text-yellow-400" />}
                                </span>
                                <div 
                                  onWheel={(e) => {
                                    if (e.currentTarget) {
                                      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
                                      e.currentTarget.scrollLeft += delta * 1.5;
                                    }
                                  }}
                                  className="flex items-center gap-2 overflow-x-auto select-none px-1 pb-2 scroll-smooth [scrollbar-width:thin] [scrollbar-color:rgba(234,179,8,0.3)_transparent]"
                                >
                                  {smartTarotQuestions.map((q, idx) => (
                                    <button
                                      key={`smart-${idx}`}
                                      type="button"
                                      onClick={() => {
                                        setTarotConcern(q);
                                        setCustomSpread(null);
                                      }}
                                      className="flex-none px-4 py-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-200/90 hover:bg-yellow-500/20 hover:border-yellow-400/40 active:scale-[0.98] transition-all font-sans whitespace-nowrap cursor-pointer shadow-sm"
                                    >
                                      {q}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Tarot Match Suggestions (고민 입력 전) */}
                            {!tarotConcern.trim() && (
                              <div className="space-y-2 mt-2 w-full text-left">
                                <div className="flex items-center justify-between pl-2 pr-1">
                                  <span className="text-[10px] text-yellow-500/80 font-bold uppercase tracking-wider flex items-center gap-1 font-sans">
                                    <Sparkles size={10} className="animate-pulse" /> 맞춤 고민 질문 예시
                                  </span>
                                  <button
                                    type="button"
                                    onClick={handleRefreshTarotSuggestions}
                                    className="flex items-center gap-1.5 text-[10px] text-yellow-500/60 hover:text-yellow-400 font-bold transition-all cursor-pointer bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-full border border-yellow-500/10 hover:border-yellow-500/30 active:scale-95"
                                  >
                                    <RefreshCw size={8} className="animate-pulse" /> 다른 우주 고민 보기
                                  </button>
                                </div>
                                <div 
                                  onWheel={(e) => {
                                    if (e.currentTarget) {
                                      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
                                      e.currentTarget.scrollLeft += delta * 1.5;
                                    }
                                  }}
                                  className="flex items-center gap-2 overflow-x-auto select-none px-1 pb-2 scroll-smooth [scrollbar-width:thin] [scrollbar-color:rgba(234,179,8,0.3)_transparent]"
                                >
                                  {tarotSuggestions.map((q, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => {
                                        setTarotConcern(q);
                                        setCustomSpread(null);
                                      }}
                                      className="flex-none px-4 py-2.5 rounded-xl bg-white/5 border border-yellow-500/15 text-xs text-yellow-500/90 hover:bg-yellow-500/15 hover:border-yellow-500/30 hover:text-yellow-300 active:scale-[0.98] transition-all font-sans whitespace-nowrap cursor-pointer shadow-sm"
                                    >
                                      {q}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="mt-4 flex flex-col gap-3 w-full">
                              <button
                                onClick={() => handleUnifiedReading("tarot")}
                                disabled={isTarotGenerating || !tarotConcern.trim()}
                                className="w-full py-3.5 rounded-2xl bg-yellow-600 hover:bg-yellow-500 text-white font-bold tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:hover:bg-yellow-600 shadow-[0_0_30px_rgba(234,179,8,0.3)] cursor-pointer text-xs uppercase"
                              >
                                {isTarotGenerating ? (
                                  <RefreshCw className="animate-spin" size={18} />
                                ) : (
                                  <>
                                    <TarotCardIcon size={18} />
                                    78장 타로 휠 펼치기 (DRAW 78 CARDS)
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col overflow-hidden relative w-full text-left">
                            <div className="flex-1 overflow-y-auto no-scrollbar space-y-5 pb-6">
                              {drawnCards && (
                                <div className="flex gap-3 flex-wrap justify-center p-3 max-w-full">
                                  {drawnCards.map((c, i) => {
                                    const visual = getTarotCardVisual(c);
                                    return (
                                      <div
                                        key={i}
                                        className="w-20 h-30 bg-zinc-900 border border-yellow-500/50 rounded-2xl flex flex-col items-center justify-between p-2 text-center shadow-[0_0_20px_rgba(234,179,8,0.2)] relative overflow-hidden group hover:border-yellow-400 hover:shadow-[0_0_25px_rgba(234,179,8,0.4)] transition-all duration-300 cursor-pointer"
                                      >
                                        <img 
                                          src={getTarotCardImageUrl(c)} 
                                          alt={c.name}
                                          className="absolute inset-0 w-full h-full object-cover z-0 opacity-80 group-hover:opacity-100 transition-opacity duration-300" 
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/60 z-10 pointer-events-none" />
                                        
                                        <div className="flex justify-between items-center w-full z-20 shrink-0 text-[6px] font-mono text-yellow-500/60">
                                          <span>TRINITY</span>
                                          <Sparkles size={6} className="text-yellow-400" />
                                        </div>

                                        <div className="w-7 h-7 rounded-full bg-black/60 border border-yellow-500/20 flex items-center justify-center text-yellow-400 z-20 transition-all duration-300 group-hover:scale-110 shadow-inner">
                                          {React.createElement(visual.icon, { size: 14, className: visual.color })}
                                        </div>

                                        <div className="text-center z-20 flex flex-col gap-0.5 w-full bg-black/60 py-1 rounded-lg border border-yellow-500/10 backdrop-blur-[1px] select-none">
                                          <span className="font-bold text-yellow-300 text-[9px] leading-tight truncate px-1 font-sans">
                                            {c.nameKo}
                                          </span>
                                          <span className="text-[6px] text-white/50 uppercase tracking-widest leading-none truncate px-1 font-mono">
                                            {c.name}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {(tarotResult || isTarotGenerating) && (
                                <div className="glass p-5 rounded-2xl border border-yellow-500/30 shadow-2xl flex flex-col relative overflow-hidden">
                                  <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-500/5 blur-[60px] pointer-events-none rounded-full" />
                                  <div className="flex justify-between items-center mb-4 shrink-0 relative z-10 w-full font-sans">
                                    <div className="flex items-center gap-2 text-yellow-400">
                                      <Sparkles size={16} />
                                      <h4 className="text-xs font-bold tracking-widest uppercase">
                                        Trinity's Insight
                                      </h4>
                                    </div>
                                    <button
                                      onClick={async () => {
                                        if (isTTSActive) {
                                          stopTTS();
                                        } else if (tarotResult) {
                                          await playTTSInChunks(tarotResult, 'Kore', 220, '신비');
                                        }
                                      }}
                                      className={`p-1.5 rounded-full transition-all ${isTTSActive ? "bg-yellow-500/20 text-yellow-400 animate-pulse" : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10"}`}
                                      title={isTTSActive ? "낭독 중지하기" : "음성으로 듣기"}
                                    >
                                      {isTTSActive ? <VolumeX size={14} /> : <Volume2 size={14} />}
                                    </button>
                                  </div>

                                  <div
                                    className="text-white/80 text-sm leading-relaxed relative z-10 w-full font-sans"
                                    style={{ wordBreak: "keep-all" }}
                                  >
                                    {isTarotGenerating && !tarotResult?.trim() ? (
                                      <div className="flex flex-col items-center justify-center py-8 gap-4 text-white/40">
                                        <RefreshCw
                                          className="animate-spin text-yellow-500/50"
                                          size={28}
                                        />
                                        <p className="font-sans text-xs tracking-widest uppercase animate-pulse">
                                          우주의 메시지 해독 중...
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="space-y-3">
                                        <Streamdown>{tarotResult || ""}</Streamdown>
                                        {isTarotGenerating && (
                                          <p className="text-[10px] text-yellow-400/60 uppercase tracking-widest animate-pulse text-center">
                                            리딩 수신 중...
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                            </div>

                            {/* Modal Tarot Result Bottom Actions: Deep Insight with Lucy + Redraw */}
                            {tarotResult && !isTarotGenerating && (
                              <div className="pt-3 border-t border-white/10 flex flex-col gap-3 w-full shrink-0">
                                {/* Tarot Dependency Prevention & Healthy Mindfulness Disclaimer Card */}
                                <div className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex items-start gap-3 text-left">
                                  <div className="w-7 h-7 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-300 shrink-0 mt-0.5">
                                    <Compass size={15} />
                                  </div>
                                  <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                                      <ShieldCheck size={13} className="text-amber-400" />
                                      <span>건강한 타로 활용 안내 (Mindful Tarot & Free Will)</span>
                                    </div>
                                    <p className="text-[11px] text-white/65 font-sans leading-relaxed">
                                      타로는 정해진 미래를 맹신하거나 과도하게 의존하기 위한 도구가 아닌, 현재 내면의 무의식을 비추고 더 나은 선택을 돕는 <strong className="text-amber-200/90 font-semibold">‘마음의 나침반’</strong>입니다. 삶을 창조하는 진정한 힘과 최종 결정권은 언제나 당신 자신의 용기 있는 실천과 자유의지(Free Will)에 있습니다.
                                    </p>
                                  </div>
                                </div>

                                {/* Redraw Button */}
                                <div className="flex justify-center pt-1">
                                  <button
                                    onClick={() => {
                                      setTarotResult(null);
                                      setDrawnCards(null);
                                      setTarotConcern('');
                                      setTarotVirtualMode(false);
                                    }}
                                    className="text-yellow-400/85 hover:text-yellow-300 hover:bg-yellow-500/10 transition-all text-[11px] uppercase tracking-widest font-bold flex items-center gap-2 py-2 px-6 rounded-full bg-yellow-500/5 border border-yellow-500/20 hover:border-yellow-500/40 cursor-pointer active:scale-95 duration-200"
                                  >
                                    <RefreshCw size={11} />
                                    <span>새로운 리딩 (Redraw)</span>
                                  </button>
                                </div>

                                {/* Lucy Deep Insight Card */}
                                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-yellow-500/15 via-black/70 to-purple-500/15 border border-yellow-500/30 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                                  <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-1.5 text-yellow-300 font-bold text-xs sm:text-sm">
                                      <Sparkles size={15} className="text-yellow-400 animate-pulse shrink-0" />
                                      <span>루시와 1:1 심층 상담 (Deep Insight)</span>
                                    </div>
                                    <p className="text-[11px] text-white/70 font-sans leading-relaxed">
                                      방금 나온 타로 마스터의 리딩 결과를 바탕으로, 루시와 함께 마음속 깊은 심층 통찰과 영적 대화를 이어가세요.
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const dailyCard = dailyResult?.drawnCard || null;
                                      const cardSummary = drawnCards
                                        ? drawnCards.map((c) => `${c.nameKo}${c.reversed ? '(역방향)' : ''}`).join(', ')
                                        : '';
                                      const deepContext = `[🔮 78장 타로 마스터 리딩 심층 연계]\n- 질문 고민: "${tarotConcern}"\n- 적용 배열법: ${tarotSpreadRecommendation.name} (${tarotSpreadRecommendation.cardCount}장)\n- 펼쳐진 카드: [${cardSummary}]\n${dailyCard ? `- 오늘의 지배 카드: ${dailyCard.nameKo}\n` : ''}\n- 트리니티 마스터 리딩 결과:\n${tarotResult.slice(0, 900)}`;
                                      setShowTarotModal(false);
                                      setTarotVirtualMode(false);
                                      void handleSend(
                                        `트리니티 타로 마스터에게 받은 "${tarotConcern}" 리딩 결과에 대해 루시와 심층 상담(Deep Insight)을 나누고 싶어.\n\n[타로 리딩 요약]\n- 배열법: ${tarotSpreadRecommendation.name} (${tarotSpreadRecommendation.cardCount}장)\n- 카드: ${cardSummary}\n\n이 리딩 내용을 바탕으로 내 무의식과 앞으로의 방향성을 더 깊이 통찰해줘.`,
                                        {
                                          force: true,
                                          oracleContext: deepContext,
                                        },
                                      );
                                    }}
                                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(234,179,8,0.4)] active:scale-95 cursor-pointer shrink-0"
                                  >
                                    <Sparkles size={14} />
                                    <span>루시와 심층 상담하기</span>
                                    <ChevronRight size={14} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <StatusBarDashboard
        isOpen={showDashboard}
        onClose={() => setShowDashboard(false)}
        color={THEME_COLOR}
        appName="Trinity"
      />

      {/* Tarot Spread Selection Modal */}
      <TarotSpreadSelectionModal
        isOpen={isSpreadModalOpen}
        onClose={() => setIsSpreadModalOpen(false)}
        currentSpread={tarotSpreadRecommendation}
        isAutoRecommended={isAutoRecommended}
        onSelectSpread={(spread) => setCustomSpread(spread)}
      />
    </div>
  );
}
