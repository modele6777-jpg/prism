import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "motion/react";
import {
  Volume2,
  VolumeX,
  ArrowLeft,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Scroll,
  X,
  RefreshCw,
  Sparkle,
  Share2,
  Send,
  Radio,
  ExternalLink,
  KeyRound,
  MessageCircle,
  TreeDeciduous,
  Compass,
  Activity,
  Bird,
  Palette,
  Moon,
  HeartPulse,
  Leaf,
  Lightbulb,
  Sun,
} from "lucide-react";
import { LucKeyLogoText } from "@/components/LucKeyLogoText";
import { sacredAudio } from "@/lib/omniWarp/sacredAudio";
import { omniWarpAudio } from "@/lib/omniWarp/omniWarpAudio";
import { triggerHaptic } from "@/lib/omniWarp/omniWarpHaptics";
import { CrystalOrbIcon } from "@/components/icons/CrystalOrbIcon";
import { useNarrowPhone } from "@/hooks/useNarrowPhone";
import { TTSButton } from "@/components/TTSButton";
import {
  extractAllKeyArchiveItems,
  get40TechniqueScrolls,
  searchPrescriptionsByConcern,
  KeyArchiveItem,
  KeyArchiveCategory,
} from "@/lib/keyArchiveExtractor";
import {
  detectSeptagramChannelsFromText,
  SeptagramAutoDetectResult,
} from "@/lib/lucyAutoModeDetector";
import { getPendingPrismToss, clearPrismToss } from "@/lib/prismToss";
import {
  executeSmartToss,
  TOSS_DESTINATIONS,
  TossDestination,
} from "@/lib/prismTossRegistry";
import { getAndClearPendingSelection } from "@/lib/selectionBridge";
import { getTodayDateKey } from "@/lib/dailyCache";

interface StardustParticle {
  x: number;
  y: number;
  radius: number;
  angle: number;
  speed: number;
  dist: number;
  alpha: number;
  color: string;
}

export interface SeptagramAppDimension {
  id: string;
  tossId: string;
  name: string;
  shortName: string;
  subTitle: string;
  path: string;
  icon: string;
  runeSymbol: string;
  runeName: string;
  runeMeaning: string;
  orbitTier: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  orbitRadius: number;
  initialAngle: number;
  color: string;
  glowColor: string;
  keywords: string[];
  description: string;
}

/**
 * 🪐 칠요 성진 기본 벡터 아이콘 렌더러 (이모지 대신 기본 Lucide 벡터 아이콘 적용)
 */
export function PlanetIcon({ id, className = "w-3.5 h-3.5" }: { id: string; className?: string }) {
  switch (id) {
    case "prologue":
      return <Sun className={className} />;
    case "lucy":
      return <MessageCircle className={className} />;
    case "orange":
      return <TreeDeciduous className={className} />;
    case "trinity":
      return <Compass className={className} />;
    case "heal":
      return <Activity className={className} />;
    case "bluebird":
      return <Bird className={className} />;
    case "muse":
      return <Palette className={className} />;
    case "epilogue":
      return <Moon className={className} />;
    default:
      return <Sparkles className={className} />;
  }
}

/**
 * 🪐 칠요 성진(Septagram) 7대 차원 행성 메타데이터
 * 7대 전용 동심 궤도(Concentric Planetary Orrery) & 고대 룬 표식(Elder Runic Sigils)
 * 양피지의 영시/처방을 각 차원(프롤로그·오렌지·트리니티·아우라·파랑새·뮤즈·에필로그)으로 즉시 토스
 */
export const SEPTAGRAM_APPS: SeptagramAppDimension[] = [
  // Tier 1 (r=124): PROLOGUE (수다모드 - 오늘의 두루마리)
  {
    id: "prologue",
    tossId: "prologue",
    name: "PROLOGUE",
    shortName: "프롤로그",
    subTitle: "수다모드 (오늘의 두루마리)",
    path: "/prologue",
    icon: "prologue",
    runeSymbol: "ᚠ",
    runeName: "Fehu",
    runeMeaning: "새로운 시작과 수다모드 (오늘의 두루마리)",
    orbitTier: 1,
    orbitRadius: 124,
    initialAngle: 0,
    color: "#38bdf8",
    glowColor: "rgba(56, 189, 248, 0.9)",
    keywords: ["프롤로그", "시작", "수다", "두루마리", "일상", "대화", "오늘의두루마리"],
    description: "가벼운 일상 수다와 함께 오늘의 두루마리를 음미하는 프롤로그 성소",
  },
  // Tier 2 (r=138): ORANGE
  {
    id: "orange",
    tossId: "orange",
    name: "ORANGE",
    shortName: "오렌지",
    subTitle: "감정 성찰과 소원의 우물",
    path: "/orange",
    icon: "orange",
    runeSymbol: "ᛋ",
    runeName: "Sowilo",
    runeMeaning: "태양과 내면의 빛",
    orbitTier: 2,
    orbitRadius: 138,
    initialAngle: 51.4,
    color: "#f97316",
    glowColor: "rgba(249, 115, 22, 0.9)",
    keywords: ["성찰", "소원의 우물", "감정", "마음", "소원", "치유", "불안"],
    description: "불안과 감정을 성찰하고 소원의 우물에 소망을 띄우는 비밀의 숲",
  },
  // Tier 3 (r=152): TRINITY
  {
    id: "trinity",
    tossId: "trinity",
    name: "TRINITY",
    shortName: "트리니티",
    subTitle: "3장의 타로와 무의식 탐색",
    path: "/trinity",
    icon: "trinity",
    runeSymbol: "ᛈ",
    runeName: "Pertho",
    runeMeaning: "운명과 심층 무의식의 비밀",
    orbitTier: 3,
    orbitRadius: 152,
    initialAngle: 102.8,
    color: "#a855f7",
    glowColor: "rgba(168, 85, 247, 0.9)",
    keywords: ["미래", "갈림길", "선택", "운명", "무의식", "타로", "상징"],
    description: "3장의 상징 카드로 무의식의 심층 심리를 해독하는 타로 나침반",
  },
  // Tier 4 (r=166): AURA HEAL
  {
    id: "heal",
    tossId: "heal",
    name: "AURA HEAL",
    shortName: "아우라",
    subTitle: "신체 웰니스 & 호오포노포노",
    path: "/heal",
    icon: "heal",
    runeSymbol: "ᛉ",
    runeName: "Algiz",
    runeMeaning: "보호와 내면의 치유",
    orbitTier: 4,
    orbitRadius: 166,
    initialAngle: 154.3,
    color: "#10b981",
    glowColor: "rgba(16, 185, 129, 0.9)",
    keywords: ["집착", "불안", "긴장", "내려놓기", "방하착", "흘려보냄", "명상", "호오포노포노"],
    description: "마음의 긴장과 번뇌를 내려놓는 호오포노포노 정화와 웰니스 성소",
  },
  // Tier 5 (r=180): BLUEBIRD
  {
    id: "bluebird",
    tossId: "bluebird",
    name: "BLUEBIRD",
    shortName: "파랑새",
    subTitle: "행복과 평온의 안식처",
    path: "/bluebird",
    icon: "bluebird",
    runeSymbol: "ᛒ",
    runeName: "Berkana",
    runeMeaning: "영혼을 감싸는 안식처",
    orbitTier: 5,
    orbitRadius: 180,
    initialAngle: 205.7,
    color: "#06b6d4",
    glowColor: "rgba(6, 182, 212, 0.9)",
    keywords: ["상처", "죄책감", "용서", "화해", "인간관계", "안식", "파랑새"],
    description: "지친 마음에 일상의 평온과 행복, 따뜻한 감사의 온기를 되찾는 성소",
  },
  // Tier 6 (r=194): MUSE
  {
    id: "muse",
    tossId: "muse",
    name: "MUSE",
    shortName: "뮤즈",
    subTitle: "명화·명시·명곡 예술처방",
    path: "/muse",
    icon: "muse",
    runeSymbol: "ᚹ",
    runeName: "Wunjo",
    runeMeaning: "예술적 희열과 하모니",
    orbitTier: 6,
    orbitRadius: 194,
    initialAngle: 257.1,
    color: "#ec4899",
    glowColor: "rgba(236, 72, 153, 0.9)",
    keywords: ["감성", "예술", "명화", "음악", "영감", "시", "창의", "처방"],
    description: "클래식 명곡과 명화, 시구로 메마른 감성을 소생시키는 예술처방",
  },
  // Tier 7 (r=208): EPILOGUE
  {
    id: "epilogue",
    tossId: "epilogue",
    name: "EPILOGUE",
    shortName: "에필로그",
    subTitle: "밤 서재 하루 마감 영감 일기",
    path: "/epilogue",
    icon: "epilogue",
    runeSymbol: "ᚨ",
    runeName: "Ansuz",
    runeMeaning: "신성한 지혜와 영감의 기록",
    orbitTier: 7,
    orbitRadius: 208,
    initialAngle: 308.6,
    color: "#6366f1",
    glowColor: "rgba(99, 102, 241, 0.9)",
    keywords: ["밤", "하루", "마감", "일기", "회고", "성찰", "마무리", "오늘"],
    description: "오늘 하루를 고요히 마무리하고 지혜로 기록하는 밤 서재",
  },
];

export default function OrbGatewayPage() {
  const [, navigate] = useLocation();
  const narrow = useNarrowPhone();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Audio & Animation states
  const [isDroneOn, setIsDroneOn] = useState(false);
  const [isResonating, setIsResonating] = useState(false);
  const [rippleKey, setRippleKey] = useState(0);

  // Planetary Orrery & Alignment States
  const [selectedRuneIds, setSelectedRuneIds] = useState<string[]>([]);
  const [hoveredApp, setHoveredApp] = useState<SeptagramAppDimension | null>(null);
  const [hoveredRuneInfo, setHoveredRuneInfo] = useState<{
    app: SeptagramAppDimension;
    x: number;
    y: number;
  } | null>(null);
  const [isTossing, setIsTossing] = useState(false);
  // 두루마리는 처음에 말아서 나오도록 설정 (오늘의 두루마리)
  const [isParchmentRolled, setIsParchmentRolled] = useState(true);

  // 💬 상황·고민 맞춤 기법 조제 대화창 상태 (오직 40개 기법 두루마리 중 맞춤 기법으로만 즉각 발현)
  const [concernQuery, setConcernQuery] = useState("");
  const [activeConcern, setActiveConcern] = useState<string | null>(null);

  // Archive & Scrying States
  const [archiveItems, setArchiveItems] = useState<KeyArchiveItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState<KeyArchiveCategory>("all");
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Cross-App Toss Notification State (when receiving tossed text into Key)
  const [tossNotice, setTossNotice] = useState<string | null>(null);

  // PWA Standalone Detection
  const [isStandalone, setIsStandalone] = useState(false);
  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(!!standalone);
  }, []);

  // Set Document Title & Manifest for Key PWA
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Key";

    const manifestTag = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
    const prevManifestHref = manifestTag ? manifestTag.getAttribute("href") : null;
    if (manifestTag) {
      manifestTag.setAttribute("href", "/manifest-orb.webmanifest");
    }

    return () => {
      document.title = prevTitle;
      if (manifestTag && prevManifestHref) {
        manifestTag.setAttribute("href", prevManifestHref);
      }
      try {
        sacredAudio.stopDrone();
      } catch (_) {}
    };
  }, []);

  // Initial Archive Extraction
  useEffect(() => {
    const items = extractAllKeyArchiveItems();
    setArchiveItems(items);
  }, []);

  // 🎯 Incoming Toss Listener (수신: 다른 앱에서 스크롤/선택하여 Key/Orb로 토스된 텍스트 처리)
  const processIncomingToss = useCallback((incomingText?: string) => {
    // 0. 루시 대화에서 Key 버튼을 눌러 전달된 40기법 맞춤 처방 수신
    const matchedConcern = sessionStorage.getItem("prism_key_matched_concern");
    const matchedTechId = sessionStorage.getItem("prism_key_matched_technique_id");
    if (matchedConcern || matchedTechId) {
      sessionStorage.removeItem("prism_key_matched_concern");
      sessionStorage.removeItem("prism_key_matched_technique_id");
      sessionStorage.removeItem("prism_key_start_rolled");

      const concern = (matchedConcern || "").trim();
      const matchedList = concern ? searchPrescriptionsByConcern(concern) : get40TechniqueScrolls();
      setArchiveItems(matchedList);
      if (concern) {
        setActiveConcern(concern);
        setConcernQuery(concern);
      }
      if (matchedTechId) {
        const foundIdx = matchedList.findIndex((it) => it.id === matchedTechId);
        if (foundIdx !== -1) {
          setCurrentIndex(foundIdx);
        }
      }
      setIsParchmentRolled(true); // 말려져있는 두루마리로 표출
      setIsResonating(true);
      try {
        omniWarpAudio.playWhiteHole();
        sacredAudio.playSingingBowl(528);
      } catch (_) {}
      setTimeout(() => setIsResonating(false), 800);
      return;
    }

    let text = (incomingText || "").trim();

    if (!text) {
      // 1. Pending Prism Toss 체크
      const pending = getPendingPrismToss("orb") || getPendingPrismToss("key");
      if (pending) {
        text = (pending.contextMessage || pending.autoPrompt || "").trim();
        clearPrismToss();
      }
    }

    if (!text) {
      // 2. SessionStorage auto execute text 체크
      const autoText = sessionStorage.getItem("prism_auto_execute_text");
      if (autoText && autoText.trim().length >= 2) {
        text = autoText.trim();
        sessionStorage.removeItem("prism_auto_execute_text");
        sessionStorage.removeItem("prism_auto_execute_target");
      }
    }

    if (!text) {
      // 3. SelectionBridge pending selection 체크
      const sel = getAndClearPendingSelection();
      if (sel && sel.text && sel.text.length >= 2) {
        text = sel.text.trim();
      }
    }

    if (!text || text.length < 2) return;

    // 🌟 새로운 스크롤 토스 영시 아이템 합성 및 상단 주입
    const newTossedMemory: KeyArchiveItem = {
      id: `toss-received-${Date.now()}`,
      category: "oracle",
      categoryLabel: "✨ 스크롤 토스 수신",
      iconType: "key",
      badgeColor: "text-amber-300 bg-amber-500/20 border-amber-400/40",
      glowColor: "rgba(251, 191, 36, 0.6)",
      title: "스크롤 토스된 영감·질문",
      keypoint: text.length > 130 ? text.slice(0, 127) + "..." : text,
      fullText: `스크롤을 통해 Key로 토스된 영감입니다. ${text}`,
      dateStr: getTodayDateKey(),
      timeStr: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
      timestamp: Date.now(),
      sourceLabel: "LucKey 스크롤 토스 연계",
      tags: ["#스크롤토스", "#영시수신", "#직관조율"],
    };

    setArchiveItems((prev) => [newTossedMemory, ...prev]);
    setCurrentIndex(0);
    setActiveFilter("all");
    setIsParchmentRolled(true);

    // 공명 이펙트 & 알림
    setIsResonating(true);
    omniWarpAudio.playWhiteHole();
    sacredAudio.playSingingBowl(528);
    triggerHaptic("whitehole");
    setTossNotice("✨ 스크롤 선택 텍스트가 Key의 수정구슬로 토스되었습니다!");

    setTimeout(() => {
      setIsResonating(false);
    }, 1200);

    setTimeout(() => {
      setTossNotice(null);
    }, 3500);
  }, []);

  // Mount & Window Event Listeners for Tosses
  useEffect(() => {
    // 즉시 확인
    processIncomingToss();

    const handleTossReceived = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      const text = detail?.contextMessage || detail?.autoPrompt || detail?.text;
      processIncomingToss(text);
    };

    const handleSelectionTossed = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      const text = detail?.text;
      processIncomingToss(text);
    };

    window.addEventListener("prism:toss_received", handleTossReceived);
    window.addEventListener("prism:selection_tossed", handleSelectionTossed);
    window.addEventListener("prism:selection_execute", handleSelectionTossed);

    return () => {
      window.removeEventListener("prism:toss_received", handleTossReceived);
      window.removeEventListener("prism:selection_tossed", handleSelectionTossed);
      window.removeEventListener("prism:selection_execute", handleSelectionTossed);
    };
  }, [processIncomingToss]);

  // Filtered Archive Items
  const filteredItems = useMemo(() => {
    if (activeFilter === "all") return archiveItems;
    return archiveItems.filter((it) => it.category === activeFilter);
  }, [archiveItems, activeFilter]);

  // Active Keypoint Memory (Safeguarded against out-of-bounds)
  const currentMemory = useMemo(() => {
    if (!filteredItems || filteredItems.length === 0) {
      return archiveItems[0] || null;
    }
    const safeIndex = Math.min(currentIndex, filteredItems.length - 1);
    return filteredItems[safeIndex] || filteredItems[0];
  }, [filteredItems, currentIndex, archiveItems]);

  // 🔮 마음의 고민·상황 텍스트 기반 7대 행성(Septagram) 자동 감지 모드 (루시채팅의 지능형 오토모드 감지 연동)
  const autoDetectResult: SeptagramAutoDetectResult = useMemo(() => {
    return detectSeptagramChannelsFromText(concernQuery);
  }, [concernQuery]);

  // 🔮 Swirling Stardust Particle Simulation Canvas inside the Crystal Orb
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const width = (canvas.width = 300);
    const height = (canvas.height = 300);

    const colors = [
      "#ffffff",
      "#a5f3fc",
      "#38bdf8",
      "#c084fc",
      "#fef08a",
      "#818cf8",
      "#f472b6",
    ];

    const particleCount = 56;
    const particles: StardustParticle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: width / 2,
        y: height / 2,
        radius: Math.random() * 2.2 + 0.8,
        angle: Math.random() * Math.PI * 2,
        speed: (Math.random() * 0.012 + 0.004) * (Math.random() > 0.5 ? 1 : -1),
        dist: Math.random() * 125 + 10,
        alpha: Math.random() * 0.65 + 0.25,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Deep glowing refractive core
      const grad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        width / 2
      );
      grad.addColorStop(0, "rgba(96, 165, 250, 0.28)");
      grad.addColorStop(0.45, "rgba(168, 85, 247, 0.16)");
      grad.addColorStop(0.85, "rgba(6, 182, 212, 0.08)");
      grad.addColorStop(1, "rgba(2, 3, 10, 0.96)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, width / 2 - 4, 0, Math.PI * 2);
      ctx.fill();

      // Swirling Stardust Particles
      const speedMultiplier = isResonating ? 3.5 : 1.0;
      particles.forEach((p) => {
        p.angle += p.speed * speedMultiplier;
        const px = width / 2 + Math.cos(p.angle) * p.dist;
        const py = height / 2 + Math.sin(p.angle) * p.dist;

        ctx.beginPath();
        ctx.arc(px, py, p.radius * (isResonating ? 1.3 : 1.0), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha * (isResonating ? 0.95 : 0.75);
        ctx.shadowBlur = isResonating ? 12 : 6;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      ctx.globalAlpha = 1.0;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isResonating]);

  // 🔔 528Hz Solfeggio Healing Drone Toggle
  const handleToggleDrone = () => {
    const active = sacredAudio.toggleDrone();
    setIsDroneOn(active);
    triggerHaptic("whitehole");
  };

  // 🔮 Crystal Orb Tap:
  // 1) 고민이나 상황을 적지 않고 오브만 클릭시 -> 오늘의 기법 두루마리만 나오도록 (인덱스 0, 활짝 펼침)
  // 2) 대화창을 입력하고 엔터버튼 없이 오브를 누르면 -> 해당 고민에 맞는 두루마리가 나오게 (인덱스 0, 활짝 펼침)
  const handleOrbTouch = () => {
    setIsResonating(true);
    setRippleKey((k) => k + 1);

    // Sacred audio chime & tactile haptics
    omniWarpAudio.playWhiteHole();
    sacredAudio.playSingingBowl(528);
    triggerHaptic("whitehole");

    const trimmed = concernQuery.trim();
    if (trimmed) {
      // 대화창에 고민·상황이 입력된 경우 -> 엔터버튼 없이 오브를 누르면 해당 고민에 맞는 두루마리가 펼쳐져 발현
      const matched = searchPrescriptionsByConcern(trimmed);
      setArchiveItems(matched);
      setActiveConcern(trimmed);
      setCurrentIndex(0);
      setIsParchmentRolled(false);
    } else {
      // 고민이나 상황을 적지 않고 오브만 클릭시 -> 오늘의 기법 두루마리만 펼쳐져 나오도록
      if (activeConcern) {
        const regular = get40TechniqueScrolls();
        setArchiveItems(regular);
        setActiveConcern(null);
      }
      setCurrentIndex(0);
      setIsParchmentRolled(false);
    }

    setTimeout(() => {
      setIsResonating(false);
    }, 900);
  };

  // Navigation handlers
  const handleNextMemory = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (filteredItems.length === 0) return;
    triggerHaptic("wormhole");
    setCurrentIndex((prev) => (prev + 1) % filteredItems.length);
  };

  const handlePrevMemory = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (filteredItems.length === 0) return;
    triggerHaptic("wormhole");
    setCurrentIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
  };

  // Select memory from modal list
  const handleSelectMemory = (item: KeyArchiveItem) => {
    setIsParchmentRolled(true);
    const idx = filteredItems.findIndex((it) => it.id === item.id);
    if (idx !== -1) {
      setCurrentIndex(idx);
    } else {
      setActiveFilter("all");
      const allIdx = archiveItems.findIndex((it) => it.id === item.id);
      if (allIdx !== -1) setCurrentIndex(allIdx);
    }
    setIsArchiveModalOpen(false);
    triggerHaptic("whitehole");
    sacredAudio.playSingingBowl(528);
  };

  // 📜 Toggle Parchment Roll State (양피지 두루마리 돌돌 말기/펼치기)
  const handleToggleRoll = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsParchmentRolled((prev) => {
      const next = !prev;
      triggerHaptic(next ? "wormhole" : "whitehole");
      sacredAudio.playSingingBowl(next ? 528 : 432);
      return next;
    });
  };

  // Refresh Archive from Storage
  const handleRefreshArchive = () => {
    setIsRefreshing(true);
    triggerHaptic("whitehole");
    omniWarpAudio.playWhiteHole();

    setTimeout(() => {
      if (activeConcern) {
        const items = searchPrescriptionsByConcern(activeConcern);
        setArchiveItems(items);
      } else {
        const items = extractAllKeyArchiveItems();
        setArchiveItems(items);
      }
      setIsRefreshing(false);
    }, 600);
  };

  // 💬 상황·고민 맞춤 기법 조제 대화창 핸들러
  const executeConcernSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      const regular = get40TechniqueScrolls();
      setArchiveItems(regular);
      setActiveConcern(null);
      setCurrentIndex(0);
      setIsParchmentRolled(false);
      return;
    }
    const matched = searchPrescriptionsByConcern(trimmed);
    setArchiveItems(matched);
    setActiveConcern(trimmed);
    setCurrentIndex(0);
    setIsParchmentRolled(false);
    setIsResonating(true);
    try {
      sacredAudio.playSingingBowl(528);
      omniWarpAudio.playWhiteHole();
    } catch (_) {}
    triggerHaptic("whitehole");
    setTimeout(() => setIsResonating(false), 900);
  }, []);

  const handleConcernSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!concernQuery.trim()) return;
    executeConcernSearch(concernQuery);
  };

  const handleApplyPresetConcern = (presetText: string) => {
    setConcernQuery(presetText);
    executeConcernSearch(presetText);
  };

  const handleClearConcern = () => {
    setConcernQuery("");
    setActiveConcern(null);
    const regular = get40TechniqueScrolls();
    setArchiveItems(regular);
    setCurrentIndex(0);
    setIsParchmentRolled(false);
    try {
      sacredAudio.playSingingBowl(432);
    } catch (_) {}
    triggerHaptic("wormhole");
  };

  // Return to LucKey Home
  const handleGoHome = () => {
    triggerHaptic("whitehole");
    const returnPath = sessionStorage.getItem("prism_orb_return_path") || "/";
    sessionStorage.removeItem("prism_orb_return_path");
    const safePath = returnPath.includes("orb") ? "/" : returnPath;

    if (typeof window !== "undefined" && window.location.pathname.includes("orb")) {
      window.location.href = safePath;
    } else {
      navigate(safePath);
      window.dispatchEvent(new CustomEvent("prism-navigate", { detail: { path: safePath } }));
    }
  };

  // 🪐 칠요 성진 앱으로 즉시 이동 & 양피지 영시 토스 (지체 없이 바로 이동)
  const handleTossToApp = useCallback(
    (app: SeptagramAppDimension) => {
      setSelectedRuneIds([app.id]);
      setHoveredApp(null);
      setHoveredRuneInfo(null);
      setIsParchmentRolled(true);

      // 1. 즉각 햅틱 및 사운드 재생
      triggerHaptic("wormhole");
      try {
        omniWarpAudio.playWormhole();
        sacredAudio.playSingingBowl(639);
      } catch (_) {}

      // 2. 현재 양피지 영시 본문 추출 (토스 페이로드)
      const title = currentMemory?.title || "Key 크리스탈 오브 영시";
      const keypoint = currentMemory?.keypoint || "";
      const guidance = currentMemory?.actionGuidance || "";
      const fullText = currentMemory?.fullText || "";

      const tossMessage = [
        `[Key 영시 신탁] ${title}`,
        keypoint ? `[핵심 통찰] ${keypoint}` : "",
        guidance ? `[실천 지침] ${guidance}` : "",
        fullText ? `[원문]\n${fullText}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      const dest =
        TOSS_DESTINATIONS[app.tossId] ||
        TOSS_DESTINATIONS[app.id] || {
          id: app.id,
          name: app.name,
          subName: app.subTitle,
          icon: app.icon,
          path: app.path,
          description: app.description,
          themeColor: app.color,
        };

      // 3. 지체 없이 즉각 스마트 토스 실행 (sessionStorage/localStorage 저장 및 이벤트 디스패치)
      executeSmartToss("key", dest, {
        text: tossMessage,
        contextMessage: tossMessage,
        autoPrompt: tossMessage,
      });

      // 4. SPA wouter 네비게이트 및 location.href를 통한 100% 즉시 이동 보장
      const safePath = dest.path;
      try {
        navigate(safePath);
      } catch (_) {}

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("prism-navigate", { detail: { path: safePath } }));
        window.dispatchEvent(new CustomEvent("nav-click-active", { detail: { path: safePath } }));
        window.scrollTo({ top: 0, behavior: "smooth" });

        // 독립 PWA(orb.html) 또는 라우트 미반영 시 즉시 location.href 이동
        if (window.location.pathname.includes("orb") || !window.location.pathname.includes(safePath.replace("/", ""))) {
          window.location.href = safePath;
        }
      }
    },
    [currentMemory, navigate]
  );

  return (
    <div className="relative w-full h-[100dvh] flex flex-col items-center justify-between overflow-hidden bg-[#020308] text-white">
      {/* 🌌 Deep Space Ambient Glow Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden>
        {/* Soft Radial Ambient Nebulae */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[620px] h-[90vw] max-h-[620px] rounded-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.12)_0%,rgba(168,85,247,0.08)_45%,transparent_75%)] blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] max-w-[450px] h-[70vw] max-h-[450px] rounded-full bg-[radial-gradient(circle_at_center,rgba(253,230,138,0.08)_0%,transparent_60%)] blur-2xl pointer-events-none" />
      </div>

      {/* 🧭 Top Minimal Royal Navigation Header */}
      <header className="relative z-40 w-full max-w-lg px-3 sm:px-5 pt-[calc(var(--sat)+0.75rem)] pb-2 flex items-center justify-between shrink-0 select-none">
        {/* Back to LucKey Home */}
        <button
          type="button"
          onClick={handleGoHome}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-amber-100/90 hover:text-white bg-black/60 hover:bg-black/80 border border-amber-500/25 hover:border-amber-400/50 backdrop-blur-2xl transition-all active:scale-95 touch-manipulation cursor-pointer shadow-[0_2px_12px_rgba(0,0,0,0.6)]"
          title="LucKey 홈으로 이동"
        >
          <ArrowLeft size={13} className="text-amber-300 shrink-0" />
          <LucKeyLogoText size="sm" />
        </button>

        {/* Center Title: Sophisticated Luxury KEY Emblem */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#171008]/90 via-[#0d0a06]/90 to-[#171008]/90 border border-amber-400/40 backdrop-blur-2xl shadow-[0_4px_20px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.12)]">
          <KeyRound size={13} className="text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
          <span className="text-xs sm:text-[13px] font-serif font-bold tracking-[0.25em] text-amber-100 uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
            KEY
          </span>
        </div>

        {/* Controls: 528Hz Sound */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleToggleDrone}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-serif backdrop-blur-2xl border transition-all active:scale-95 touch-manipulation cursor-pointer ${
              isDroneOn
                ? "bg-amber-500/15 text-amber-200 border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.25)]"
                : "bg-black/50 text-amber-200/60 border-amber-500/20 hover:text-amber-200 hover:border-amber-400/40"
            }`}
            title="528Hz 솔페지오 주파수 사운드"
          >
            {isDroneOn ? (
              <Volume2 size={13} className="text-amber-400 animate-pulse shrink-0" />
            ) : (
              <VolumeX size={13} className="shrink-0" />
            )}
            <span className="text-[10.5px] font-mono">528Hz</span>
          </button>
        </div>
      </header>

      {/* 🌟 Toast Notification (Toss Received Notice) */}
      <AnimatePresence>
        {tossNotice && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-16 z-50 px-4 py-2 rounded-full bg-cyan-950/90 border border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.5)] backdrop-blur-xl text-cyan-200 text-xs font-medium flex items-center gap-2 pointer-events-none"
          >
            <Sparkle size={14} className="text-amber-300 animate-spin" />
            <span>{tossNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🔮 Center Stage: Left Crystal Orb + Right Sacred Parchment Layout */}
      <main className="relative z-30 flex-1 w-full max-w-6xl mx-auto px-3 sm:px-6 py-2 sm:py-4 flex flex-col justify-center min-h-0 select-none">
        <div className="w-full flex flex-col lg:flex-row items-center lg:items-center justify-center gap-6 lg:gap-10">
          {/* 🔮 [LEFT COLUMN] Pure Mystical 3D Crystal Orb + Resurrected Concern/Situation Chat Input */}
          <div className="w-full lg:w-[48%] flex flex-col items-center justify-center">
            <div
              className={`relative flex items-center justify-center transition-transform duration-500 origin-center my-auto shrink-0 ${
                narrow
                  ? "w-72 h-72 scale-[0.92]"
                  : "w-80 h-80 sm:w-96 sm:h-96 scale-100 sm:scale-105"
              }`}
            >
          {/* 🌟 1. Outer Concentric Arcane Magic Circle Matrix */}
          <div className="absolute inset-[-54px] sm:inset-[-74px] pointer-events-none flex items-center justify-center select-none z-0">
            {/* Pulsing Arcane Glow Corona */}
            <div
              className={`absolute inset-4 rounded-full pointer-events-none blur-3xl transition-all duration-700 ${
                isResonating
                  ? "bg-[radial-gradient(circle,rgba(56,189,248,0.5)_0%,rgba(168,85,247,0.4)_40%,rgba(251,191,36,0.25)_65%,transparent_85%)] scale-110"
                  : "bg-[radial-gradient(circle,rgba(56,189,248,0.22)_0%,rgba(168,85,247,0.18)_45%,transparent_75%)]"
              }`}
            />

            {/* 8-Fold Rotating Arcane Celestial Light Flares */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: isResonating ? 15 : 60, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-35"
            >
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                <div
                  key={`arcane-ray-${deg}`}
                  className="absolute w-0.5 h-full pointer-events-none"
                  style={{
                    transform: `rotate(${deg}deg)`,
                    background:
                      "linear-gradient(180deg, transparent 6%, rgba(56,189,248,0.6) 22%, transparent 45%, transparent 55%, rgba(168,85,247,0.6) 78%, transparent 94%)",
                  }}
                />
              ))}
            </motion.div>

            {/* Outer Celestial Zodiac Rim */}
            <svg
              viewBox="0 0 440 440"
              className="absolute inset-0 w-full h-full text-slate-400/30 pointer-events-none"
            >
              <circle cx="220" cy="220" r="216" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 6" />
              <circle cx="220" cy="220" r="212" fill="none" stroke="rgba(251,191,36,0.28)" strokeWidth="0.6" />
              {Array.from({ length: 24 }).map((_, i) => {
                const angle = (i * 15 * Math.PI) / 180;
                const x1 = 220 + 210 * Math.cos(angle);
                const y1 = 220 + 210 * Math.sin(angle);
                const x2 = 220 + 216 * Math.cos(angle);
                const y2 = 220 + 216 * Math.sin(angle);
                return (
                  <line
                    key={`celestial-tick-${i}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="currentColor"
                    strokeWidth={i % 6 === 0 ? "1.5" : "0.8"}
                    strokeOpacity={i % 6 === 0 ? 0.75 : 0.4}
                  />
                );
              })}
            </svg>

            {/* 🪐 칠요 성진 7대 전용 동심 궤도 시스템 (7 Concentric Planetary Orbit Rings) */}
            <svg viewBox="0 0 440 440" className="absolute inset-0 w-full h-full pointer-events-none">
              {SEPTAGRAM_APPS.map((app) => {
                const isSelected = selectedRuneIds.includes(app.id);
                return (
                  <g key={`orbit-ring-${app.id}`}>
                    <circle
                      cx="220"
                      cy="220"
                      r={app.orbitRadius}
                      fill="none"
                      stroke={app.color}
                      strokeWidth={isSelected ? "1.8" : "0.85"}
                      strokeDasharray={isSelected ? "6 4" : "4 6"}
                      strokeOpacity={isSelected ? 0.9 : 0.28}
                      className="transition-all duration-300"
                    />
                    {isSelected && (
                      <circle
                        cx="220"
                        cy="220"
                        r={app.orbitRadius}
                        fill="none"
                        stroke={app.color}
                        strokeWidth="4"
                        strokeOpacity="0.3"
                        className="blur-[2px]"
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* 🪐 칠요 성진 7대 전용 룬 노드 및 일직선 축 정렬 모션 레이어 (Concentric Planetary Orrery & Alignment Motion) */}
          <div className="absolute inset-[-54px] sm:inset-[-74px] pointer-events-none flex items-center justify-center select-none z-30">
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{ rotate: 360 }}
              transition={{
                duration: isResonating ? 15 : 52,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              {/* 성간 공명 일직선 레이저 빔 (Laser Beam connecting Center to Aligned App) */}
              <svg viewBox="0 0 440 440" className="absolute inset-0 w-full h-full pointer-events-none z-20">
                {selectedRuneIds.length === 1 && (() => {
                  const app = SEPTAGRAM_APPS.find((a) => a.id === selectedRuneIds[0]);
                  if (!app) return null;
                  const rad = (90 * Math.PI) / 180; // 90° points straight down toward the Sacred Parchment
                  const x = 220 + app.orbitRadius * Math.cos(rad);
                  const y = 220 + app.orbitRadius * Math.sin(rad);
                  const lineColor = app.color;

                  return (
                    <motion.g
                      key={`single-beam-${app.id}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="pointer-events-none"
                    >
                      <line
                        x1={220}
                        y1={220}
                        x2={x}
                        y2={y + 16}
                        stroke={lineColor}
                        strokeWidth="8"
                        strokeOpacity="0.45"
                        strokeLinecap="round"
                        className="blur-[4px]"
                      />
                      <line
                        x1={220}
                        y1={220}
                        x2={x}
                        y2={y}
                        stroke="#ffffff"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <line
                        x1={220}
                        y1={220}
                        x2={x}
                        y2={y}
                        stroke={lineColor}
                        strokeWidth="2"
                        strokeDasharray="4 6"
                        strokeOpacity="0.9"
                        className="animate-pulse"
                      />
                      <circle cx={220} cy={220} r="5" fill="#ffffff" />
                      <circle cx={220} cy={220} r="9" fill="none" stroke={lineColor} strokeWidth="1.5" className="animate-ping" />
                      <circle cx={x} cy={y} r="4" fill="#ffffff" />
                      <circle cx={x} cy={y} r="8" fill="none" stroke="#fde047" strokeWidth="1.5" className="animate-ping" />
                    </motion.g>
                  );
                })()}

                {selectedRuneIds.length >= 2 && (() => {
                  const baseApp = SEPTAGRAM_APPS.find((a) => a.id === selectedRuneIds[0]) || SEPTAGRAM_APPS[0];
                  const selectedApps = selectedRuneIds
                    .map((id) => SEPTAGRAM_APPS.find((a) => a.id === id))
                    .filter(Boolean) as SeptagramAppDimension[];
                  const maxRadius = Math.max(...selectedApps.map((a) => a.orbitRadius), 160);
                  const x1 = 220;
                  const y1 = 220 - (maxRadius + 10);
                  const x2 = 220;
                  const y2 = 220 + (maxRadius + 10);
                  const glowColor = baseApp.color;

                  return (
                    <motion.g
                      key={`axis-beam-${selectedRuneIds.join("-")}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="pointer-events-none"
                    >
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={glowColor}
                        strokeWidth="10"
                        strokeOpacity="0.45"
                        strokeLinecap="round"
                        className="blur-[5px]"
                      />
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="#ffffff"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="#fde047"
                        strokeWidth="2"
                        strokeDasharray="6 8"
                        className="animate-pulse"
                      />
                      <circle cx={220} cy={220} r="6" fill="#ffffff" />
                      <circle cx={220} cy={220} r="10" fill="none" stroke={glowColor} strokeWidth="1.5" className="opacity-80" />
                    </motion.g>
                  );
                })()}
              </svg>

              {/* 3. 7대 전용 룬 노드 (각 궤도당 1개 행성, 정렬 모션 & 자전 역보정) */}
              {SEPTAGRAM_APPS.map((app) => {
                const isSelected = selectedRuneIds.includes(app.id);
                const selectedIndex = selectedRuneIds.indexOf(app.id);
                const isHovered = hoveredApp?.id === app.id;

                // 🔮 루시채팅 스타일 자동감지 모드 판별:
                // 고민이 없으면 '프롤로그(수다모드 - 오늘의 두루마리)', 고민 입력 시 맥락에 맞는 행성이 자동 선택/강조됨
                const isAutoMatched = (() => {
                  const query = concernQuery.trim();
                  if (!query) {
                    return app.id === "prologue";
                  }
                  if (autoDetectResult.channels.includes(app.id as any)) {
                    return true;
                  }
                  if (autoDetectResult.isCasual && app.id === "prologue") {
                    return true;
                  }
                  return false;
                })();

                // 룬 일직선 축 정렬 각도 오프셋 계산:
                // 선택 시 90도(하단 양피지 방향) 축으로 신속히(0.38s) 회전 이동
                let alignmentDelta = 0;
                if (isSelected) {
                  if (selectedRuneIds.length === 1) {
                    const targetAngle = 90; // 하단 양피지 방향
                    alignmentDelta = (targetAngle - app.initialAngle) % 360;
                    if (alignmentDelta > 180) alignmentDelta -= 360;
                    if (alignmentDelta < -180) alignmentDelta += 360;
                  } else {
                    const targetAngle = selectedIndex % 2 === 0 ? 90 : 270;
                    alignmentDelta = (targetAngle - app.initialAngle) % 360;
                    if (alignmentDelta > 180) alignmentDelta -= 360;
                    if (alignmentDelta < -180) alignmentDelta += 360;
                  }
                }

                // 좌표 계산 (회전 좌표계 내부의 고유 위치)
                const rad = (app.initialAngle * Math.PI) / 180;
                const cx = 220 + app.orbitRadius * Math.cos(rad);
                const cy = 220 + app.orbitRadius * Math.sin(rad);
                const leftPercent = (cx / 440) * 100;
                const topPercent = (cy / 440) * 100;

                return (
                  <motion.div
                    key={`tier-node-wrap-${app.id}`}
                    className="absolute inset-0 pointer-events-none"
                    animate={{ rotate: alignmentDelta }}
                    transition={{
                      duration: 0.38,
                      ease: [0.2, 0.8, 0.2, 1],
                    }}
                  >
                    <div
                      className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-30"
                      style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTossToApp(app);
                        }}
                        onMouseEnter={(e) => {
                          setHoveredApp(app);
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredRuneInfo({
                            app,
                            x: rect.left + rect.width / 2,
                            y: rect.top,
                          });
                        }}
                        onMouseLeave={() => {
                          setHoveredApp(null);
                          setHoveredRuneInfo(null);
                        }}
                        className={`group/rune relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-all duration-300 active:scale-90 cursor-pointer touch-manipulation ${
                          isSelected
                            ? "scale-125 ring-2 ring-amber-300 shadow-[0_0_25px_rgba(251,191,36,0.95)] z-40"
                            : isAutoMatched
                            ? "scale-115 ring-2 ring-amber-300/85 shadow-[0_0_22px_rgba(251,191,36,0.85)] z-35 animate-pulse"
                            : isHovered
                            ? "scale-120 shadow-[0_0_20px_rgba(56,189,248,0.9)] z-40"
                            : "hover:scale-115 opacity-80 hover:opacity-100"
                        }`}
                        style={{
                          background: isSelected
                            ? `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.6) 0%, ${app.color} 85%)`
                            : isAutoMatched
                            ? `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.45) 0%, ${app.color} 85%)`
                            : `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.3) 0%, rgba(12,16,28,0.95) 80%)`,
                          border: `1.5px solid ${isSelected || isAutoMatched ? "#fef08a" : app.color}`,
                          boxShadow: isSelected
                            ? `0 0 24px ${app.glowColor}, inset 0 0 8px rgba(255,255,255,0.8)`
                            : isAutoMatched
                            ? `0 0 20px ${app.glowColor}, inset 0 0 6px rgba(255,255,255,0.6)`
                            : `0 0 14px ${app.glowColor}`,
                        }}
                        aria-label={`${app.name} (${app.shortName}) 토스`}
                        title={`${app.name} (${app.subTitle}) 터치 시 양피지 토스`}
                      >
                        {/* 정방향 자전 보정 (Counter-rotation so icon stays upright) */}
                        <motion.div
                          animate={{ rotate: -alignmentDelta }}
                          transition={{
                            duration: 0.38,
                            ease: [0.2, 0.8, 0.2, 1],
                          }}
                          className="flex items-center justify-center w-full h-full pointer-events-none"
                        >
                          <motion.span
                            animate={{ rotate: -360 }}
                            transition={{
                              duration: isResonating ? 15 : 52,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                            className="flex items-center justify-center select-none"
                          >
                            <PlanetIcon id={app.id} className="w-3.5 h-3.5 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
                          </motion.span>
                        </motion.div>

                        {/* Subtle Counter-Rotated Planetary Name Tag - 마우스 오버 시에만 노출 */}
                        <motion.div
                          animate={{ rotate: -alignmentDelta }}
                          transition={{
                            duration: 0.38,
                            ease: [0.2, 0.8, 0.2, 1],
                          }}
                          className="pointer-events-none absolute top-[108%] left-1/2 -translate-x-1/2 opacity-0 group-hover/rune:opacity-100 transition-opacity duration-200 z-50"
                        >
                          <motion.span
                            animate={{ rotate: -360 }}
                            transition={{
                              duration: isResonating ? 15 : 52,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                            className="inline-flex items-center gap-1 text-[8.5px] sm:text-[9px] font-sans font-bold px-1.5 py-0.5 rounded-full bg-black/90 border border-white/20 text-slate-200 whitespace-nowrap shadow-[0_2px_8px_rgba(0,0,0,0.9)] backdrop-blur-md"
                          >
                            <span>{app.shortName}</span>
                            {isAutoMatched && (
                              <span className="text-[7.5px] text-amber-300 font-mono">
                                {app.id === "prologue" ? "수다" : "자동감지"}
                              </span>
                            )}
                          </motion.span>
                        </motion.div>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {/* 🌟 2. Interactive Resonance Waves (Triggered on Tap) */}
          <AnimatePresence>
            {isResonating && (
              <motion.div
                key={`ripple-${rippleKey}`}
                initial={{ opacity: 0.95, scale: 0.8 }}
                animate={{ opacity: 0, scale: 1.55 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.1, ease: "easeOut" }}
                className="absolute inset-0 rounded-full border-2 border-cyan-300 shadow-[0_0_35px_rgba(56,189,248,0.8),inset_0_0_25px_rgba(168,85,247,0.6)] pointer-events-none z-10"
              />
            )}
          </AnimatePresence>

          {/* 🌟 3. Glass Crystal Orb Outer Halos */}
          <div
            className={`absolute -inset-2 rounded-full border border-cyan-400/30 pointer-events-none transition-all duration-700 z-10 ${
              isResonating ? "scale-105 shadow-[0_0_50px_rgba(56,189,248,0.6)]" : "shadow-[0_0_25px_rgba(56,189,248,0.25)]"
            }`}
          />
          <div className="absolute -inset-4 rounded-full border border-purple-500/20 pointer-events-none animate-pulse z-10" />

          {/* 🌟 4. Pure Hyper-Realistic Glass Crystal Orb */}
          <div
            onClick={handleOrbTouch}
            className={`group relative rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 active:scale-95 overflow-hidden touch-manipulation z-20 ${
              narrow ? "w-44 h-44" : "w-48 h-48 sm:w-56 sm:h-56"
            }`}
            style={{
              background: isResonating
                ? "radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.4) 0%, rgba(168, 85, 247, 0.25) 45%, rgba(0, 0, 0, 0.92) 100%)"
                : "radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.04) 45%, rgba(0, 0, 0, 0.88) 100%)",
              boxShadow: isResonating
                ? "inset 0 0 45px rgba(56, 189, 248, 0.55), inset -10px -10px 25px rgba(0,0,0,0.95), 0 0 60px rgba(56, 189, 248, 0.5), 0 0 90px rgba(168, 85, 247, 0.35)"
                : "inset 0 0 32px rgba(255, 255, 255, 0.25), inset -10px -10px 25px rgba(0, 0, 0, 0.9), 0 0 35px rgba(56, 189, 248, 0.3)",
            }}
            title={
              concernQuery.trim()
                ? "터치: 입력한 고민에 맞는 기법 두루마리 조제"
                : "터치: 오늘의 기법 두루마리 열기"
            }
          >
            {/* Swirling Stardust Particle Simulation Canvas */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full rounded-full pointer-events-none z-10"
            />

            {/* Specular Glare Reflection on Glass Curved Surface */}
            <div
              className="absolute top-3 left-6 sm:top-4 sm:left-8 w-20 sm:w-28 h-8 sm:h-10 rounded-full pointer-events-none z-30 -rotate-[28deg]"
              style={{
                background: "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.8) 0%, transparent 75%)",
              }}
            />

            {/* Bottom Refraction Rim Glow */}
            <div
              className="absolute bottom-3 inset-x-6 h-6 rounded-full pointer-events-none z-25 opacity-70"
              style={{
                background: "radial-gradient(ellipse at center, rgba(56, 189, 248, 0.45) 0%, transparent 80%)",
              }}
            />

            {/* 🔮 Center Projected Keypoint Vision (Luminous Key & Celestial Scrying Focus) */}
            <div className="relative z-20 flex flex-col items-center justify-center text-center pointer-events-none p-2 select-none w-[88%] max-w-[200px]">
              <AnimatePresence mode="wait">
                {currentMemory ? (
                  <motion.div
                    key={currentMemory.id}
                    initial={{ opacity: 0, scale: 0.88, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.06, filter: "blur(4px)" }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    className="flex flex-col items-center w-full"
                  >
                    {/* Glowing Astral Key Crest */}
                    {/* Glowing Sacred Golden Key Seal inside Orb */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 via-amber-400/30 to-amber-600/20 border border-amber-300/60 mb-1 shadow-[0_0_20px_rgba(251,191,36,0.6),inset_0_1px_2px_rgba(255,255,255,0.4)]">
                      <KeyRound size={17} className="text-amber-200 animate-pulse drop-shadow-[0_0_6px_rgba(251,191,36,0.9)]" />
                    </div>

                    {/* Category Capsule Badge */}
                    <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-amber-400/30 backdrop-blur-md mb-1 shadow-sm bg-black/70">
                      <span className="text-[9.5px] sm:text-[10px] font-serif font-medium tracking-wide text-amber-200">
                        {currentMemory.categoryLabel}
                      </span>
                    </div>

                    {/* Concise Scrying Title inside Orb */}
                    <h2 className="text-[12px] sm:text-[13px] font-bold text-amber-50 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] font-serif tracking-wide line-clamp-1">
                      {currentMemory.title.split(':')[0]}
                    </h2>

                    {/* Starlight Indicator */}
                    <div className="flex items-center gap-1 mt-0.5 text-[9px] font-mono text-amber-300/90 tracking-wider">
                      <span>{currentIndex + 1} / {filteredItems.length}</span>
                      <span>·</span>
                      {isParchmentRolled ? (
                        <span className="text-amber-300 font-sans font-bold animate-pulse">
                          {concernQuery.trim() ? "터치 시 맞춤 조제 ✧" : "오늘의 두루마리 ✧"}
                        </span>
                      ) : (
                        <span className="text-amber-200/90 font-sans">
                          {activeConcern ? "맞춤 기법 발현 ✧" : "기법 발현 중 ✧"}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center"
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-500/15 border border-amber-400/40 flex items-center justify-center mb-1.5 shadow-[0_0_18px_rgba(251,191,36,0.4)]">
                      <KeyRound size={18} className="text-amber-300" />
                    </div>
                    <span className="text-amber-100 text-sm sm:text-base font-serif font-bold tracking-[0.22em] drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                      KEY
                    </span>
                    <span className="text-[8.5px] font-mono uppercase tracking-[0.2em] text-amber-300/70 mt-0.5">
                      DIVINE ARCHIVE
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

        {/* 📜 [RIGHT COLUMN] The Sacred Parchment Scroll & Consultation Chamber */}
        <div className="w-full lg:w-[52%] flex flex-col items-center justify-center min-h-[440px]">
          <AnimatePresence mode="wait">
            {currentMemory && (
              isParchmentRolled ? (
                /* 📜 [상태 1] 두루마리가 말려있을 때: 진짜 앤틱 원통형 두루마리 + 그 아래 마음의 고민 대화창 (말려있을 때만 등장!) */
                <motion.div
                  key={`rolled-view-${currentMemory.id}`}
                  initial={{ opacity: 0, scale: 0.96, y: 10 }}
                  animate={
                    isTossing
                      ? { y: -260, scale: 0.15, opacity: 0, rotate: 360 }
                      : { opacity: 1, scale: 1, y: 0, rotate: 0 }
                  }
                  exit={{ opacity: 0, scale: 0.96, y: -10 }}
                  transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
                  className="relative z-40 w-full max-w-sm sm:max-w-md px-1 sm:px-2 flex flex-col items-center gap-3.5 select-none"
                >
                  {/* 🌟 Authentic 3D Royal Rolled Scroll Cylinder with Carmine Wax Seal */}
                  <div
                    onClick={handleToggleRoll}
                    className={`group relative w-full rounded-2xl p-3.5 flex items-center justify-between gap-2.5 backdrop-blur-2xl border transition-all duration-500 shadow-2xl cursor-pointer active:scale-[0.98] ${
                      isResonating
                        ? "bg-gradient-to-r from-[#201208] via-[#382212] via-[#52331b] via-[#382212] to-[#201208] border-amber-400/80 shadow-[0_0_40px_rgba(251,191,36,0.35),0_12px_30px_rgba(0,0,0,0.9)]"
                        : "bg-gradient-to-r from-[#170e07] via-[#2a190e] via-[#3e2615] via-[#2a190e] to-[#170e07] border-amber-400/45 hover:border-amber-400/75 shadow-[0_0_30px_rgba(0,0,0,0.95),inset_0_1px_1px_rgba(255,255,255,0.12)]"
                    }`}
                    title="터치하여 두루마리 펼치기"
                  >
                    {/* Left Turned-Wood Knob with Gilded Brass Ring */}
                    <div className="flex items-center shrink-0">
                      <div className="w-1.5 h-8 rounded-l-full bg-amber-400/80 shadow-inner" />
                      <div className="w-3 h-14 rounded-l-md bg-gradient-to-b from-[#78350f] via-[#d97706] via-[#b45309] to-[#451a03] border-l-2 border-amber-200/90 shadow-[inset_1px_1px_3px_rgba(255,255,255,0.6),-2px_0_6px_rgba(0,0,0,0.8)]" />
                    </div>

                    {/* Center Scroll Body & Carmine Wax Seal */}
                    <div className="flex-1 flex items-center justify-between min-w-0 px-1">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Royal Carmine Wax Seal with Gold Key */}
                        <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#991b1b] via-[#dc2626] to-[#450a0a] border-2 border-amber-300 flex items-center justify-center shadow-[0_0_18px_rgba(220,38,38,0.7),inset_0_2px_4px_rgba(255,255,255,0.4)] shrink-0">
                          <KeyRound size={16} className="text-amber-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-300 animate-ping" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-serif font-bold text-amber-100 tracking-wide truncate drop-shadow-sm">
                              {currentIndex === 0 ? "오늘의 두루마리" : "기법 두루마리"}
                            </span>
                            <span className="text-[9px] font-mono text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/40">
                              {currentIndex === 0 ? "오늘의 추천" : `${currentIndex + 1} / ${filteredItems.length}`}
                            </span>
                          </div>
                          <p className="text-[11px] text-amber-200/85 truncate mt-0.5 font-serif">
                            {currentMemory.title}
                          </p>
                        </div>
                      </div>

                      {/* Unroll Button & Prev/Next Fast Navigation */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrevMemory();
                          }}
                          className="p-1.5 rounded-full hover:bg-amber-400/10 active:scale-90 text-amber-300/80 hover:text-amber-200 transition-all cursor-pointer"
                          title="이전 기법 두루마리"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNextMemory();
                          }}
                          className="p-1.5 rounded-full hover:bg-amber-400/10 active:scale-90 text-amber-300/80 hover:text-amber-200 transition-all cursor-pointer"
                          title="다음 기법 두루마리"
                        >
                          <ChevronRight size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleRoll();
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/25 via-amber-400/35 to-amber-500/25 hover:from-amber-500/40 hover:to-amber-400/45 border border-amber-300/60 text-amber-100 text-xs font-serif font-bold active:scale-95 transition-all shadow-[0_0_12px_rgba(251,191,36,0.3)] cursor-pointer shrink-0"
                          title="양피지 두루마리 펼치기"
                        >
                          <Scroll size={13} className="text-amber-300" />
                          <span>펼치기</span>
                        </button>
                      </div>
                    </div>

                    {/* Right Turned-Wood Knob with Gilded Brass Ring */}
                    <div className="flex items-center shrink-0">
                      <div className="w-3 h-14 rounded-r-md bg-gradient-to-b from-[#78350f] via-[#d97706] via-[#b45309] to-[#451a03] border-r-2 border-amber-200/90 shadow-[inset_-1px_1px_3px_rgba(255,255,255,0.6),2px_0_6px_rgba(0,0,0,0.8)]" />
                      <div className="w-1.5 h-8 rounded-r-full bg-amber-400/80 shadow-inner" />
                    </div>
                  </div>

                  {/* 🪐 Planetary Guidance Notice when Rolled */}
                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-amber-200/80 font-serif tracking-wide select-none">
                    <Sparkles size={11} className="text-amber-300 animate-pulse shrink-0" />
                    <span>오브 둘레의 7대 행성을 터치하여 두루마리를 즉시 토스하세요</span>
                  </div>

                  {/* 💬 [대화창 - 오른쪽에 위치, 두루마리가 말려있을 때만 노출!] */}
                  <div className="w-full p-3.5 rounded-2xl bg-gradient-to-b from-[#140e08]/95 via-[#0b0805]/95 to-[#130d07]/95 border border-amber-500/35 shadow-[0_6px_25px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.08)] backdrop-blur-xl flex flex-col gap-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-amber-200">
                        <MessageCircle size={14} className="text-amber-400" />
                        <span className="text-xs font-serif font-bold tracking-wide">마음의 고민·상황 나누기</span>
                      </div>
                      {/* 🔮 루시채팅 스타일 자동감지모드 표시 뱃지 */}
                      <span className="text-[10px] text-amber-300/90 font-mono bg-amber-500/15 border border-amber-400/30 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                        <Sparkles size={9} className="text-amber-400 animate-pulse" />
                        <span>자동감지: {autoDetectResult.modeTitle}</span>
                      </span>
                    </div>

                    <form onSubmit={handleConcernSubmit} className="relative flex items-center gap-1.5">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={concernQuery}
                          onChange={(e) => setConcernQuery(e.target.value)}
                          placeholder="고민이나 상황을 적고 오브를 터치하세요..."
                          className="w-full pl-3 pr-8 py-2 rounded-xl bg-black/70 border border-amber-500/35 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 text-xs text-amber-50 placeholder-amber-200/40 outline-none transition-all shadow-inner font-sans"
                        />
                        {concernQuery && (
                          <button
                            type="button"
                            onClick={handleClearConcern}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-amber-300/50 hover:text-amber-200 p-0.5 cursor-pointer"
                            title="지우기"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={!concernQuery.trim()}
                        className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-xs flex items-center gap-1 shadow-[0_0_12px_rgba(251,191,36,0.35)] active:scale-95 transition-all cursor-pointer shrink-0"
                      >
                        <Send size={12} />
                        <span>조제</span>
                      </button>
                    </form>

                    {/* Hint: Enter 없이 오브만 눌러도 조제됨 안내 */}
                    <div className="flex items-center justify-between text-[10px] text-amber-200/60 font-sans px-0.5">
                      <span>✧ 대화창을 입력하고 오브를 터치하면 해당 맞춤 두루마리가 펼쳐집니다</span>
                    </div>

                    {/* Active Concern Notification Banner & Reset */}
                    {activeConcern && (
                      <div className="mt-0.5 px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-400/40 flex items-center justify-between gap-2 text-[11px] text-amber-200">
                        <div className="truncate">
                          <span className="text-amber-400 font-bold font-serif mr-1">맞춤 조제됨:</span>
                          <span className="text-amber-100 font-sans truncate">"{activeConcern}"</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleClearConcern}
                          className="shrink-0 text-[10px] text-cyan-300 hover:text-cyan-200 underline cursor-pointer"
                        >
                          오늘의 두루마리로 복귀
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                /* 📜 [상태 2] 두루마리가 펼쳐졌을 때: 대화창은 완전히 숨겨지고, 진짜 고서 두루마리 본문만 위엄 있게 펼쳐짐! */
                <motion.div
                  key={`open-view-${currentMemory.id}`}
                  initial={{ opacity: 0, scaleY: 0.35, y: 12 }}
                  animate={
                    isTossing
                      ? { y: -260, scale: 0.15, opacity: 0, rotate: 360 }
                      : { opacity: 1, scaleY: 1, y: 0, scale: 1, rotate: 0 }
                  }
                  exit={{ opacity: 0, scaleY: 0.35, y: -8 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className="relative z-40 w-full max-w-sm sm:max-w-md px-1 sm:px-2 select-text"
                >
                  {/* 📜 Top Turned Wooden Roller Rod with Gilded Brass End-Caps */}
                  <div className="w-full flex items-center justify-center mb-[-6px] z-20 relative select-none">
                    <div className="w-3 h-5 rounded-l-md bg-gradient-to-r from-[#92400e] to-[#d97706] border border-amber-300 shadow-md" />
                    <div className="flex-1 h-3.5 bg-gradient-to-b from-[#5c2e0b] via-[#8c4b1a] via-[#5c2e0b] to-[#3a1d07] rounded-full border-y border-amber-500/60 shadow-[0_2px_8px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.3)]" />
                    <div className="w-3 h-5 rounded-r-md bg-gradient-to-l from-[#92400e] to-[#d97706] border border-amber-300 shadow-md" />
                  </div>

                  {/* Outer Antique Royal Parchment Body */}
                  <div
                    className={`relative rounded-2xl p-4 sm:p-5 transition-all duration-700 backdrop-blur-xl border ${
                      isResonating
                        ? "bg-gradient-to-b from-[#22180f]/98 via-[#17100a]/98 to-[#22180f]/98 border-amber-400/70 shadow-[0_0_40px_rgba(251,191,36,0.35),inset_0_0_30px_rgba(245,158,11,0.15)]"
                        : "bg-gradient-to-b from-[#1c130b]/98 via-[#130d07]/98 to-[#1c130b]/98 border-amber-500/40 shadow-[0_12px_45px_rgba(0,0,0,0.95),inset_0_0_25px_rgba(217,119,6,0.1)]"
                    }`}
                  >
                    {/* Antique Parchment Ornate Corner Brackets */}
                    <div className="absolute top-2 left-2.5 text-amber-400/50 text-[12px] select-none font-serif">⌜</div>
                    <div className="absolute top-2 right-2.5 text-amber-400/50 text-[12px] select-none font-serif">⌝</div>
                    <div className="absolute bottom-2 left-2.5 text-amber-400/50 text-[12px] select-none font-serif">⌞</div>
                    <div className="absolute bottom-2 right-2.5 text-amber-400/50 text-[12px] select-none font-serif">⌟</div>

                    {/* Parchment Header Ribbon */}
                    <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-amber-500/25 select-none">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <Scroll size={14} className="text-amber-400/90 shrink-0" />
                        <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${currentMemory.badgeColor}`}>
                          {currentMemory.categoryLabel}
                        </span>
                        <span className="text-[10px] font-mono text-amber-200/70">
                          {currentIndex + 1} / {filteredItems.length}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* TTS Voice Narration Button */}
                        <TTSButton
                          text={currentMemory.fullText}
                          voice="Kore"
                          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/35 text-amber-200 text-xs font-medium active:scale-95 transition-all cursor-pointer shadow-sm"
                        />

                        {/* 📜 돌돌 말기 Button in Header (터치 시 다시 대화창이 있는 말린 두루마리로 복귀) */}
                        <button
                          type="button"
                          onClick={handleToggleRoll}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/30 to-amber-600/30 hover:from-amber-500/45 hover:to-amber-600/45 border border-amber-400/50 text-amber-100 text-xs font-bold active:scale-95 transition-all shadow-[0_0_12px_rgba(251,191,36,0.3)] cursor-pointer"
                          title="양피지를 두루마리로 돌돌 말아 토스 준비"
                        >
                          <Scroll size={12} className="text-amber-300" />
                          <span>돌돌 말기</span>
                        </button>

                        {/* Previous Memory */}
                        <button
                          type="button"
                          onClick={handlePrevMemory}
                          className="p-1 rounded-full hover:bg-white/10 active:scale-90 text-amber-300 transition-all cursor-pointer"
                          title="이전 영시"
                        >
                          <ChevronLeft size={16} />
                        </button>

                        {/* Next Memory */}
                        <button
                          type="button"
                          onClick={handleNextMemory}
                          className="p-1 rounded-full hover:bg-white/10 active:scale-90 text-amber-300 transition-all cursor-pointer"
                          title="다음 영시"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Scrollable Parchment Body (Completely Visible, Never Cut Off) */}
                    <div className="max-h-[36vh] sm:max-h-[40vh] overflow-y-auto pr-1 space-y-2.5 overscroll-contain select-text custom-scrollbar">
                      {/* Complete Title */}
                      <h3 className="text-sm sm:text-[16px] font-serif font-bold text-[#fffdf7] tracking-wide leading-snug drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                        {currentMemory.title}
                      </h3>

                      {/* Distilled Keypoint / Clinical Insight */}
                      <p className="text-xs sm:text-[13px] text-[#fef3c7]/95 leading-relaxed font-sans pl-3 border-l-2 border-amber-400/60 bg-amber-950/30 py-1.5 rounded-r-lg">
                        {currentMemory.keypoint}
                      </p>

                      {/* Prescription Action Guidance / 1-Minute Practice & Affirmation */}
                      {currentMemory.actionGuidance && (
                        <div
                          className={`text-[12px] rounded-xl p-3 flex items-start gap-2.5 border leading-relaxed ${
                            currentMemory.category === "pharmacy"
                              ? "text-emerald-100 bg-emerald-950/45 border-emerald-500/40"
                              : "text-amber-100 bg-amber-950/40 border-amber-500/40"
                          }`}
                        >
                          <Sparkles
                            size={14}
                            className={`shrink-0 mt-0.5 select-none ${
                              currentMemory.category === "pharmacy" ? "text-emerald-400" : "text-amber-400"
                            }`}
                          />
                          <span>
                            {currentMemory.category === "pharmacy"
                              ? currentMemory.actionGuidance
                              : `실천 화두: ${currentMemory.actionGuidance}`}
                          </span>
                        </div>
                      )}

                      {/* 📜 Bottom Prompt to Roll Up for Toss */}
                      <div className="pt-2 mt-2 border-t border-amber-500/20 flex items-center justify-between gap-2 select-none">
                        <p className="text-[11px] text-amber-200/80 leading-tight font-serif">
                          영시를 확인한 후 두루마리를 말아 행성으로 토스하세요.
                        </p>
                        <button
                          type="button"
                          onClick={handleToggleRoll}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/35 via-amber-400/25 to-amber-500/35 hover:from-amber-500/50 hover:to-amber-500/50 border border-amber-400/65 text-amber-100 text-xs font-bold active:scale-95 transition-all shadow-[0_0_15px_rgba(251,191,36,0.35)] shrink-0 cursor-pointer"
                        >
                          <Scroll size={13} className="text-amber-300" />
                          <span>두루마리 말기</span>
                        </button>
                      </div>

                      {/* Parchment Footer: Tags & Time Estimate / Date */}
                      <div className="flex items-center justify-between text-[10px] text-amber-300/60 pt-1.5 border-t border-amber-500/15 font-mono select-none">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          {currentMemory.tags.slice(0, 3).map((t, idx) => (
                            <span key={idx} className="opacity-80">
                              {t}
                            </span>
                          ))}
                        </div>
                        <span>
                          {currentMemory.dateStr} {currentMemory.timeStr || ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 📜 Bottom Turned Wooden Roller Rod with Gilded Brass End-Caps */}
                  <div className="w-full flex items-center justify-center mt-[-6px] z-20 relative select-none">
                    <div className="w-3 h-5 rounded-l-md bg-gradient-to-r from-[#92400e] to-[#d97706] border border-amber-300 shadow-md" />
                    <div className="flex-1 h-3.5 bg-gradient-to-b from-[#5c2e0b] via-[#8c4b1a] via-[#5c2e0b] to-[#3a1d07] rounded-full border-y border-amber-500/60 shadow-[0_2px_8px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.3)]" />
                    <div className="w-3 h-5 rounded-r-md bg-gradient-to-l from-[#92400e] to-[#d97706] border border-amber-300 shadow-md" />
                  </div>
                </motion.div>
              )
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>

      {/* 🏷️ 데스크톱 행성 호버 팝업 툴팁 */}
      <AnimatePresence>
        {hoveredRuneInfo && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 3, scale: 0.9 }}
            transition={{ duration: 0.12 }}
            className="fixed z-[9999] pointer-events-none -translate-x-1/2 -translate-y-full px-3 py-1.5 rounded-full bg-zinc-950/95 border text-xs font-bold text-white shadow-[0_4px_24px_rgba(0,0,0,0.9)] backdrop-blur-md flex items-center gap-2 whitespace-nowrap select-none hidden sm:flex"
            style={{
              left: `${hoveredRuneInfo.x}px`,
              top: `${hoveredRuneInfo.y - 10}px`,
              borderColor: hoveredRuneInfo.app.color,
              boxShadow: `0 0 16px ${hoveredRuneInfo.app.glowColor}, 0 4px 18px rgba(0,0,0,0.85)`,
            }}
          >
            <PlanetIcon id={hoveredRuneInfo.app.id} className="w-3.5 h-3.5 shrink-0" />
            <span style={{ color: hoveredRuneInfo.app.color }}>{hoveredRuneInfo.app.name}</span>
            <span className="text-slate-300 font-normal">({hoveredRuneInfo.app.subTitle})</span>
            <span className="text-[10px] text-amber-300/80 bg-amber-400/10 px-1.5 py-0.5 rounded-full font-sans">
              터치하여 토스
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📜 Full Archive Drawer Modal */}
      <AnimatePresence>
        {isArchiveModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-md"
            onClick={() => setIsArchiveModalOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg mx-auto bg-gradient-to-b from-[#161009] via-[#0c0912] to-[#07060a] border-t border-amber-400/35 rounded-t-3xl shadow-[0_-12px_50px_rgba(0,0,0,0.95)] max-h-[86dvh] flex flex-col overflow-hidden"
            >
              {/* Drawer Top Handle */}
              <div className="w-12 h-1.5 rounded-full bg-amber-400/30 mx-auto mt-3 mb-1 shrink-0" />

              {/* Drawer Header */}
              <div className="px-5 py-3 flex items-center justify-between border-b border-amber-500/15 shrink-0 select-none">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-300">
                    <Scroll size={17} />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-serif font-bold text-amber-100 flex items-center gap-1.5">
                      Key 영시 보관함
                      <span className="text-xs font-mono text-amber-300 font-normal">
                        ({archiveItems.length})
                      </span>
                    </h2>
                    <p className="text-[11px] text-amber-200/60 font-serif">
                      기록을 선택하거나 오브 둘레의 행성으로 즉시 토스하세요
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleRefreshArchive}
                    className={`p-2 rounded-full hover:bg-amber-400/10 text-amber-300 transition-all cursor-pointer ${
                      isRefreshing ? "animate-spin" : ""
                    }`}
                    title="최신 대화 및 활동 동기화"
                  >
                    <RefreshCw size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsArchiveModalOpen(false)}
                    className="p-2 rounded-full hover:bg-white/10 text-amber-300/60 hover:text-amber-100 transition-all cursor-pointer"
                  >
                    <X size={17} />
                  </button>
                </div>
              </div>

              {/* Category Filter Tabs */}
              <div className="px-4 py-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-amber-500/10 shrink-0 select-none">
                {[
                  { id: "all", label: "전체", count: archiveItems.length },
                  { id: "pharmacy", label: "40대 마음약", count: archiveItems.filter((i) => i.category === "pharmacy").length },
                  { id: "lucy", label: "루시 대화", count: archiveItems.filter((i) => i.category === "lucy").length },
                  { id: "tarot", label: "타로·운세", count: archiveItems.filter((i) => i.category === "tarot").length },
                  { id: "saju", label: "사주·명리", count: archiveItems.filter((i) => i.category === "saju").length },
                  { id: "healing", label: "마음치유", count: archiveItems.filter((i) => i.category === "healing").length },
                  { id: "muse", label: "창작영감", count: archiveItems.filter((i) => i.category === "muse").length },
                  { id: "oracle", label: "신탁", count: archiveItems.filter((i) => i.category === "oracle").length },
                ].map((tab) => {
                  const isActive = activeFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic("wormhole");
                        setActiveFilter(tab.id as KeyArchiveCategory);
                        setCurrentIndex(0);
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                        isActive
                          ? "bg-amber-500/20 text-amber-200 border border-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.25)] font-serif"
                          : "bg-white/5 text-amber-200/50 hover:text-amber-200 border border-transparent"
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className="text-[10px] opacity-70 font-mono">({tab.count})</span>
                    </button>
                  );
                })}
              </div>

              {/* Archive Item Cards List */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 overscroll-contain">
                {filteredItems.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                    <Sparkles size={20} className="text-slate-500 animate-pulse" />
                    <span>해당 카테고리에 저장된 기억 파편이 아직 없습니다.</span>
                  </div>
                ) : (
                  filteredItems.map((item) => {
                    const isSelected = currentMemory?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isSelected
                            ? "bg-cyan-950/40 border-cyan-400/50 shadow-[0_0_18px_rgba(6,182,212,0.25)]"
                            : "bg-white/[0.03] border-white/10 hover:border-white/20"
                        }`}
                      >
                        {/* Card Header: Category & Date */}
                        <div className="flex items-center justify-between gap-2 mb-1.5 select-none">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${item.badgeColor}`}
                          >
                            {item.categoryLabel}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {item.dateStr} {item.timeStr || ""}
                          </span>
                        </div>

                        {/* Title (Text Selectable for Toss) */}
                        <h3 className="text-sm font-bold text-white mb-1 select-text cursor-text">
                          {item.title}
                        </h3>

                        {/* Keypoint Quote (Text Selectable for Toss) */}
                        <p className="text-xs text-cyan-100/90 leading-relaxed font-sans mb-2 pl-2 border-l-2 border-cyan-400/40 select-text cursor-text">
                          {item.keypoint}
                        </p>

                        {/* Action Guidance / Prescription Dosage Guide */}
                        {item.actionGuidance && (
                          <div
                            className={`text-[11px] rounded-xl px-2.5 py-1.5 mb-2.5 flex items-start gap-1.5 select-text cursor-text ${
                              item.category === "pharmacy"
                                ? "text-emerald-200/90 bg-emerald-500/10 border border-emerald-500/20"
                                : "text-purple-200/80 bg-purple-500/10 border border-purple-500/20"
                            }`}
                          >
                            <Sparkle
                              size={12}
                              className={`shrink-0 mt-0.5 select-none ${
                                item.category === "pharmacy" ? "text-emerald-400" : "text-purple-400"
                              }`}
                            />
                            <span>
                              {item.category === "pharmacy"
                                ? item.actionGuidance
                                : `실천 화두: ${item.actionGuidance}`}
                            </span>
                          </div>
                        )}

                        {/* Card Footer: Tags, TTS & Toss buttons */}
                        <div className="flex items-center justify-between pt-1 border-t border-white/5 select-none">
                          <div className="flex items-center gap-1 overflow-hidden text-[10px] text-slate-400">
                            {item.tags.slice(0, 2).map((t, idx) => (
                              <span key={idx} className="opacity-75">
                                {t}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Individual TTS Button */}
                            <TTSButton
                              text={item.fullText}
                              voice="Kore"
                              className="px-2.5 py-1 rounded-full bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 text-cyan-200 text-[11px] font-medium active:scale-95 transition-all cursor-pointer"
                            />

                            {/* Beam to Crystal Orb */}
                            <button
                              type="button"
                              onClick={() => handleSelectMemory(item)}
                              className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium border border-white/15 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                            >
                              <span>구슬 투영</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

