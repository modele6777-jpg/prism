import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  RotateCcw,
  Square,
  Play,
  Check,
  Copy,
  X,
  ArrowRight,
  Download,
} from "lucide-react";
import { sacredAudio } from "@/lib/omniWarp/sacredAudio";
import { triggerHaptic } from "@/lib/omniWarp/omniWarpHaptics";
import { playTTS, stopTTS, useTTSActive } from "@/utils/tts";
import { getPendingPrismToss, clearPrismToss } from "@/lib/prismToss";
import { startBinauralBeat, stopBinauralBeat } from "@/lib/binauralBeats";

import { CrystalOrbIcon } from "@/components/icons/CrystalOrbIcon";
import { safeLocalStorage } from "@/utils/safeStorage";
import { useNarrowPhone } from "@/hooks/useNarrowPhone";
import { detectSeptagramChannelsFromText } from "@/lib/lucyAutoModeDetector";
import { getAndClearPendingSelection } from "@/lib/selectionBridge";

export interface SeptagramAppDimension {
  id: string;
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
 * 🪐 칠요 성진(Septagram) 7대 차원(앱) 메타데이터
 * 7대 전용 동심 궤도(Concentric Planetary Orrery) & 고대 룬 표식(Elder Runic Sigils)
 * 각 룬의 명칭을 실제 앱 제목과 1:1로 정확하게 일치
 */
export const SEPTAGRAM_APPS: SeptagramAppDimension[] = [
  // Tier 1 (r=120): PROLOGUE
  {
    id: "prologue",
    name: "PROLOGUE",
    shortName: "프롤로그",
    subTitle: "운명의 서막 & 프리즘 허브",
    path: "/",
    icon: "☀️",
    runeSymbol: "ᚠ",
    runeName: "Fehu",
    runeMeaning: "새로운 시작과 운명의 창조",
    orbitTier: 1,
    orbitRadius: 120,
    initialAngle: 0,
    color: "#f59e0b", // 골드 앰버
    glowColor: "rgba(245, 158, 11, 0.9)",
    keywords: ["시작", "운명", "서막", "프리즘", "허브", "탄생", "비전", "전체", "홈"],
    description: "새로운 운명의 서막과 전체 프리즘 유니버스의 관문",
  },
  // Tier 2 (r=135): ORANGE
  {
    id: "orange",
    name: "ORANGE",
    shortName: "오렌지",
    subTitle: "감정 성찰과 소원의 우물",
    path: "/orange",
    icon: "🍊",
    runeSymbol: "ᛋ",
    runeName: "Sowilo",
    runeMeaning: "태양과 내면의 빛",
    orbitTier: 2,
    orbitRadius: 135,
    initialAngle: 51.4,
    color: "#f97316", // 오렌지
    glowColor: "rgba(249, 115, 22, 0.9)",
    keywords: ["성찰", "소원의 우물", "감정", "마음", "소원", "치유", "불안", "시크릿", "평온"],
    description: "불안과 감정을 성찰하고 소원의 우물에 소망을 띄우는 비밀의 숲",
  },
  // Tier 3 (r=150): TRINITY
  {
    id: "trinity",
    name: "TRINITY",
    shortName: "트리니티",
    subTitle: "3장의 타로와 무의식 탐색",
    path: "/trinity",
    icon: "🔮",
    runeSymbol: "ᛈ",
    runeName: "Pertho",
    runeMeaning: "운명과 심층 무의식의 비밀",
    orbitTier: 3,
    orbitRadius: 150,
    initialAngle: 102.8,
    color: "#a855f7", // 퍼플
    glowColor: "rgba(168, 85, 247, 0.9)",
    keywords: ["미래", "갈림길", "선택", "운명", "무의식", "타로", "상징", "카드", "심층", "직관", "점괘", "예견", "방향"],
    description: "3장의 상징 카드로 무의식의 심층 심리를 해독",
  },
  // Tier 4 (r=165): AURA
  {
    id: "aura",
    name: "AURA",
    shortName: "오라",
    subTitle: "소울 바이오 스펙트럼 & 방하착 치유",
    path: "/heal",
    icon: "🧘",
    runeSymbol: "ᛉ",
    runeName: "Algiz",
    runeMeaning: "보호와 내면의 치유",
    orbitTier: 4,
    orbitRadius: 165,
    initialAngle: 154.3,
    color: "#10b981", // 에메랄드
    glowColor: "rgba(16, 185, 129, 0.9)",
    keywords: ["집착", "불안", "긴장", "내려놓기", "방하착", "흘려보냄", "명상", "통제", "수용", "오라", "치유", "바이오"],
    description: "마음의 긴장과 번뇌를 내려놓는 세도나 방하착 명상과 오라 바이오",
  },
  // Tier 5 (r=180): BLUEBIRD
  {
    id: "bluebird",
    name: "BLUEBIRD",
    shortName: "파랑새",
    subTitle: "호오포노포노 정화 & 웰니스 성소",
    path: "/bluebird",
    icon: "🐦",
    runeSymbol: "ᛒ",
    runeName: "Berkana",
    runeMeaning: "영혼을 감싸는 안식처",
    orbitTier: 5,
    orbitRadius: 180,
    initialAngle: 205.7,
    color: "#06b6d4", // 청록 아쿠아
    glowColor: "rgba(6, 182, 212, 0.9)",
    keywords: ["상처", "죄책감", "미안", "용서", "화해", "참회", "인간관계", "갈등", "정화", "사랑합니다", "안식", "웰니스", "파랑새"],
    description: "미안합니다·용서하세요·감사합니다·사랑합니다 정화와 웰니스 성소",
  },
  // Tier 6 (r=195): MUSE
  {
    id: "muse",
    name: "MUSE",
    shortName: "뮤즈",
    subTitle: "명화·명시·명곡 예술처방",
    path: "/muse",
    icon: "🎨",
    runeSymbol: "ᚹ",
    runeName: "Wunjo",
    runeMeaning: "예술적 희열과 하모니",
    orbitTier: 6,
    orbitRadius: 195,
    initialAngle: 257.1,
    color: "#ec4899", // 핑크
    glowColor: "rgba(236, 72, 153, 0.9)",
    keywords: ["감성", "예술", "명화", "음악", "영감", "시", "창의", "처방", "클래식", "노래", "아름다움"],
    description: "클래식 명곡과 명화, 시구로 메마른 감성을 소생",
  },
  // Tier 7 (r=210): EPILOGUE
  {
    id: "epilogue",
    name: "EPILOGUE",
    shortName: "에필로그",
    subTitle: "밤 서재 하루 마감 영감 일기",
    path: "/epilogue",
    icon: "🌙",
    runeSymbol: "ᚨ",
    runeName: "Ansuz",
    runeMeaning: "신성한 지혜와 영감의 기록",
    orbitTier: 7,
    orbitRadius: 210,
    initialAngle: 308.6,
    color: "#6366f1", // 인디고
    glowColor: "rgba(99, 102, 241, 0.9)",
    keywords: ["밤", "하루", "마감", "일기", "회고", "성찰", "마무리", "오늘", "기록", "지혜", "서재", "기억", "에필로그"],
    description: "오늘 하루를 고요히 마무리하고 지혜로 기록하는 서재",
  },
];

export interface ScryingResult {
  query: string;
  keyTheme: string;
  directAnswer: string;
  actionSolution: string;
  color?: string;
  glow?: string;
  timestamp: number;
  recommendedAppId?: string;
  modeTitle?: string;
  activeRunes?: string[];
  isMaster?: boolean;
}

/**
 * 🪐 440x440 오러리 좌표계 상에서 각 룬의 정밀 중심 좌표(cx, cy) 계산
 */
export function getRuneCoordinates(appId: string): { x: number; y: number } {
  const app = SEPTAGRAM_APPS.find((a) => a.id === appId);
  if (!app) return { x: 220, y: 220 };
  const r = app.orbitRadius;
  const rad = (app.initialAngle * Math.PI) / 180;
  return {
    x: 220 + r * Math.cos(rad),
    y: 220 + r * Math.sin(rad),
  };
}

const DEFAULT_ORACLE_SOLUTIONS: Array<{
  keyTheme: string;
  directAnswer: string;
  actionSolution: string;
  color: string;
  glow: string;
}> = [
  {
    keyTheme: "명료한 결단",
    directAnswer: "망설임이 길어질수록 생각의 무게만 늘어납니다. 이미 마음 깊은 곳에서 당신이 느끼고 있는 그 첫 번째 선택을 신뢰하고 방향을 확정하세요.",
    actionSolution: "불필요한 비교를 멈추고, 선택한 방향에 오늘 바로 첫 걸음을 떼어보세요.",
    color: "#38bdf8",
    glow: "rgba(56, 189, 248, 0.6)",
  },
  {
    keyTheme: "과감한 실행",
    directAnswer: "완벽한 타이밍을 기다리지 마세요. 작은 움직임이 거대한 생각의 정체를 깨뜨리고 새로운 돌파구를 열어줍니다.",
    actionSolution: "5분 안에 끝낼 수 있는 가장 쉬운 행동 하나를 지금 즉시 실행하세요.",
    color: "#f59e0b",
    glow: "rgba(245, 158, 11, 0.6)",
  },
  {
    keyTheme: "순리적 흐름",
    directAnswer: "지금은 억지로 힘을 주어 상황을 통제하려 하기보다, 흐름을 한 박자 관망하며 주변의 신호를 지켜보는 편이 훨씬 유리합니다.",
    actionSolution: "조급한 마음에 즉각적인 답을 요구하지 말고 하루만 여유를 두어보세요.",
    color: "#a855f7",
    glow: "rgba(168, 85, 247, 0.6)",
  },
  {
    keyTheme: "내면의 정돈",
    directAnswer: "외부의 소음과 타인의 기준에서 한 걸음 물러설 때, 진짜 당신이 원하고 집중해야 할 본질이 뚜렷해집니다.",
    actionSolution: "머릿속을 어지럽히는 복잡한 생각들을 종이에 적어보고 불필요한 것을 지워보세요.",
    color: "#10b981",
    glow: "rgba(16, 185, 129, 0.6)",
  },
  {
    keyTheme: "시야의 전환",
    directAnswer: "지금 부딪힌 문제는 막다른 길이 아니라, 지금까지와는 다른 시각으로 접근하라는 기회의 신호입니다.",
    actionSolution: "문제를 정반대 입장에서 생각해보거나 다른 분야의 방식을 대입해보세요.",
    color: "#ec4899",
    glow: "rgba(236, 72, 153, 0.6)",
  },
  {
    keyTheme: "자기 신뢰",
    directAnswer: "당신은 이미 이 상황을 지혜롭게 풀어갈 충분한 내적 역량을 갖추고 있습니다. 의심의 안개를 걷어내세요.",
    actionSolution: "과거에 어려움을 지혜롭게 극복했던 경험을 떠올리며 스스로를 격려하세요.",
    color: "#6366f1",
    glow: "rgba(99, 102, 241, 0.6)",
  },
];

export default function OrbGatewayPage() {
  const [, navigate] = useLocation();
  const [inquiry, setInquiry] = useState("");
  const [isScrying, setIsScrying] = useState(false);
  const [scryingResult, setScryingResult] = useState<ScryingResult | null>(null);
  const [hoveredApp, setHoveredApp] = useState<SeptagramAppDimension | null>(null);
  const [hoveredRuneInfo, setHoveredRuneInfo] = useState<{
    app: SeptagramAppDimension;
    x: number;
    y: number;
  } | null>(null);
  const hoveredRuneRef = useRef<HTMLElement | null>(null);
  const narrow = useNarrowPhone();
  const resultCardRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll into view when scrying result is revealed on mobile
  useEffect(() => {
    if (scryingResult && resultCardRef.current) {
      const timer = setTimeout(() => {
        resultCardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [scryingResult]);

  // 오브 사이트 이탈 시 재생 중인 바이노럴 비트 안전 종료
  useEffect(() => {
    return () => {
      try {
        stopBinauralBeat();
      } catch (_) {}
    };
  }, []);

  // 룬 선택 및 연동 모드 상태 (최대 2개 선택)
  const [selectedRuneIds, setSelectedRuneIds] = useState<string[]>([]);
  // 가운데 오브 터치 시 활성화되는 마스터 모드 (7대 차원 통합 공명)
  const [isMasterMode, setIsMasterMode] = useState<boolean>(false);

  // 🤖 AI 스마트 자동 감지 (상시 고정)
  const isAutoDetect = true;
  const [autoDetectedTitle, setAutoDetectedTitle] = useState<string | null>(null);

  // 실시간 질문 텍스트 분석 및 룬/차원 모드 지능형 자동 감지 (루시 AI 엔진 연동)
  useEffect(() => {
    const text = inquiry.trim();
    if (!text || text.length < 2) {
      setIsMasterMode(false);
      setSelectedRuneIds([]);
      setAutoDetectedTitle(null);
      return;
    }
    const timer = setTimeout(() => {
      const detected = detectSeptagramChannelsFromText(text);

      if (detected.isMaster || detected.channels.length === 7) {
        setIsMasterMode(true);
        setSelectedRuneIds(SEPTAGRAM_APPS.map((a) => a.id));
        setAutoDetectedTitle(detected.modeTitle || "7대 차원 올인원 마스터");
      } else if (detected.channels.length > 0) {
        setIsMasterMode(false);
        setSelectedRuneIds(detected.channels);
        if (detected.channels.length === 1) {
          const app = SEPTAGRAM_APPS.find((a) => a.id === detected.channels[0]);
          setAutoDetectedTitle(`${app?.name || detected.channels[0]} 모드`);
        } else {
          const names = detected.channels
            .map((id) => SEPTAGRAM_APPS.find((a) => a.id === id)?.shortName || id)
            .join(" × ");
          setAutoDetectedTitle(`${detected.channels.length}중 융합 (${names})`);
        }
      } else {
        setIsMasterMode(false);
        setSelectedRuneIds([]);
        setAutoDetectedTitle(null);
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [inquiry]);

  // 현재 활성 모드 sessionStorage 동기화 (옴니워프 빅뱅 버튼 등과 연동)
  useEffect(() => {
    try {
      let currentMode = 'casual';
      if (isMasterMode) {
        currentMode = 'master';
      } else if (selectedRuneIds.length === 1) {
        const id = selectedRuneIds[0];
        currentMode = id === 'heal' ? 'aura' : (id === 'prologue' ? 'casual' : (id === 'epilogue' ? 'master' : id));
      } else if (selectedRuneIds.length > 1) {
        currentMode = selectedRuneIds
          .map((id) => (id === 'heal' ? 'aura' : (id === 'prologue' ? 'casual' : (id === 'epilogue' ? 'master' : id))))
          .filter((m) => m !== 'casual')
          .join(',');
        if (!currentMode) currentMode = 'casual';
      }
      sessionStorage.setItem('prism_orb_active_mode', currentMode);
    } catch (_) {}
  }, [isMasterMode, selectedRuneIds]);

  // PWA Standalone 감지
  const [isStandalone, setIsStandalone] = useState(false);
  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(!!standalone);
  }, []);

  // 크리스탈 오브 단독 PWA 메타데이터 및 매니페스트 동적 설정
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "크리스탈 오브 (Crystal Orb)";

    let manifestTag = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
    const prevManifestHref = manifestTag ? manifestTag.getAttribute("href") : null;
    if (manifestTag) {
      manifestTag.setAttribute("href", "/manifest-orb.webmanifest");
    }

    const appleTouchIcons = document.querySelectorAll('link[rel^="apple-touch-icon"]') as NodeListOf<HTMLLinkElement>;
    const prevAppleIconHrefs: string[] = [];
    appleTouchIcons.forEach((iconTag) => {
      prevAppleIconHrefs.push(iconTag.href);
      iconTag.href = "/apple-touch-icon-orb.png";
    });

    const favicons = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]') as NodeListOf<HTMLLinkElement>;
    const prevFaviconHrefs: string[] = [];
    favicons.forEach((favTag) => {
      prevFaviconHrefs.push(favTag.href);
      favTag.href = "/orb-icon-192.png";
    });

    let appleTitleTag = document.querySelector('meta[name="apple-mobile-web-app-title"]') as HTMLMetaElement | null;
    const prevAppleTitle = appleTitleTag ? appleTitleTag.getAttribute("content") : null;
    if (appleTitleTag) {
      appleTitleTag.setAttribute("content", "크리스탈 오브");
    }

    let themeColorTag = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    const prevThemeColor = themeColorTag ? themeColorTag.getAttribute("content") : null;
    if (themeColorTag) {
      themeColorTag.setAttribute("content", "#030308");
    }

    return () => {
      document.title = prevTitle;
      if (manifestTag && prevManifestHref) manifestTag.setAttribute("href", prevManifestHref);
      appleTouchIcons.forEach((iconTag, idx) => {
        if (prevAppleIconHrefs[idx]) iconTag.href = prevAppleIconHrefs[idx];
      });
      favicons.forEach((favTag, idx) => {
        if (prevFaviconHrefs[idx]) favTag.href = prevFaviconHrefs[idx];
      });
      if (appleTitleTag && prevAppleTitle) appleTitleTag.setAttribute("content", prevAppleTitle);
      if (themeColorTag && prevThemeColor) themeColorTag.setAttribute("content", prevThemeColor);
    };
  }, []);

  // 룬 호버 시 궤도 회전 중에도 배지가 항상 정방향(수평)으로 정밀 추적되도록 애니메이션 프레임 동기화
  useEffect(() => {
    if (!hoveredApp || !hoveredRuneRef.current) return;
    let animId: number;
    const updatePosition = () => {
      if (hoveredRuneRef.current && hoveredApp) {
        const rect = hoveredRuneRef.current.getBoundingClientRect();
        setHoveredRuneInfo({
          app: hoveredApp,
          x: rect.left + rect.width / 2,
          y: rect.top,
        });
        animId = requestAnimationFrame(updatePosition);
      }
    };
    animId = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(animId);
  }, [hoveredApp]);

  // 룬 클릭 시 최대 7개까지 연동 모드 확장 가능 (7개 연동 시 마스터 모드 가동)
  const handleRuneClick = (app: SeptagramAppDimension) => {
    setScryingResult(null); // 이전 결과 리셋하여 전환된 모드 상태가 오브 중심에 즉시 표기되게 함
    setHoveredRuneInfo(null); // 연동 모드 전환/조작 시 팝업메시지 즉시 소멸

    setSelectedRuneIds((prev) => {
      let next: string[];
      const isDeselecting = prev.includes(app.id);

      if (isDeselecting) {
        // 이미 선택된 룬 클릭 시 즉시 선택 해제
        next = prev.filter((id) => id !== app.id);
        triggerHaptic("whitehole");
        sacredAudio.playSingingBowl(639);

        // 🛑 룬문자 선택 취소 시 바이노럴 비트 즉각 정지 또는 잔여 선택 룬 사운드로 전환
        try {
          if (next.length === 0) {
            stopBinauralBeat();
          } else {
            const nextActiveId = next[next.length - 1];
            startBinauralBeat(nextActiveId);
          }
        } catch (binauralErr) {
          console.warn("[OrbGateway] Binaural beat stop/switch error:", binauralErr);
        }
      } else {
        // 최대 7개까지 연동 선택 추가
        if (prev.length >= 7) {
          next = [...prev.slice(1), app.id];
        } else {
          next = [...prev, app.id];
        }
        triggerHaptic("whitehole");
        sacredAudio.playSingingBowl(639);

        // 🎧 해당 룬의 어플 바이노럴 비트 즉각 재생
        try {
          startBinauralBeat(app.id);
        } catch (binauralErr) {
          console.warn("[OrbGateway] Binaural beat start error:", binauralErr);
        }
      }

      // 7개 연동되면 그게 바로 마스터 모드!
      if (next.length === 7) {
        setIsMasterMode(true);
        triggerHaptic("blackhole");
        sacredAudio.playSingingBowl(528);
      } else {
        setIsMasterMode(false);
      }
      return next;
    });
  };

  // 가운데 오브 클릭 시: 마스터 모드(7개 전 차원 연동)와 수다 모드 간의 즉각 토글!
  const handleCenterOrbClick = () => {
    setScryingResult(null); // 이전 결과 리셋하여 모드 변경 상태 즉각 노출

    if (isMasterMode || selectedRuneIds.length === 7) {
      // 마스터 모드에서 가운데 오브 누르면 바로 수다모드로 전환 (모든 룬 연동 해제)
      triggerHaptic("whitehole");
      sacredAudio.playSingingBowl(528);
      setIsMasterMode(false);
      setSelectedRuneIds([]);
      try {
        stopBinauralBeat();
      } catch (_) {}
    } else {
      // 일반/연동 모드에서 가운데 오브 터치 시 -> 7개 룬 전체 동시 연동으로 마스터 모드 즉각 가동!
      triggerHaptic("blackhole");
      sacredAudio.playSingingBowl(528);
      setIsMasterMode(true);
      setSelectedRuneIds(SEPTAGRAM_APPS.map((a) => a.id));
    }
  };

  // Audio & Mic States
  const [isDroneOn, setIsDroneOn] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // TTS State from Prism Hook
  const isTTSActive = useTTSActive();

  // 7대 앱 중 질문과 해답에 가장 알맞은 앱 판별
  const determineRecommendedApp = (queryText: string, theme: string, answer: string): string => {
    const combined = `${queryText} ${theme} ${answer}`.toLowerCase();
    let bestId = "bluebird";
    let maxScore = -1;

    for (const app of SEPTAGRAM_APPS) {
      let score = 0;
      for (const kw of app.keywords) {
        if (combined.includes(kw.toLowerCase())) {
          score += 2;
        }
      }
      if (score > maxScore) {
        maxScore = score;
        bestId = app.id;
      }
    }

    if (maxScore <= 0) {
      const hash = queryText.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
      bestId = SEPTAGRAM_APPS[Math.abs(hash) % SEPTAGRAM_APPS.length].id;
    }

    return bestId;
  };

  // 룬 보석 클릭 시 영시 문맥을 품고 해당 차원으로 즉시 도약(Toss)
  const handleTossToDimension = (app: SeptagramAppDimension) => {
    try {
      const tossPayload = {
        source: "orb",
        sourceName: "크리스탈 오브",
        targetAppId: app.id,
        timestamp: Date.now(),
        query: scryingResult?.query || inquiry || "",
        keyTheme: scryingResult?.keyTheme || "직관의 통찰",
        directAnswer: scryingResult?.directAnswer || "",
        actionSolution: scryingResult?.actionSolution || "",
      };
      safeLocalStorage.setItem("prism_toss_context", JSON.stringify(tossPayload));
      safeLocalStorage.setItem("pending_prism_toss", JSON.stringify(tossPayload));
    } catch (_) {}

    triggerHaptic("whitehole");
    sacredAudio.playSingingBowl(852);

    if (app.id === "hooponopono") {
      navigate("/bluebird?tab=hooponopono");
    } else {
      navigate(app.path);
    }
  };

  // Prism Sync Info
  const [prismUserName, setPrismUserName] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Dynamic Head & PWA Meta for iPhone Safari "Add to Home Screen"
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "크리스탈 오브 (Crystal Orb)";

    // 1. Manifest
    let manifestTag = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
    const prevManifestHref = manifestTag ? manifestTag.getAttribute("href") : null;
    if (manifestTag) {
      manifestTag.setAttribute("href", "/manifest-orb.webmanifest");
    } else {
      manifestTag = document.createElement("link");
      manifestTag.rel = "manifest";
      manifestTag.href = "/manifest-orb.webmanifest";
      document.head.appendChild(manifestTag);
    }

    // 2. Apple Touch Icons (Critical for iOS Safari "Add to Home Screen")
    const appleTouchIcons = document.querySelectorAll('link[rel^="apple-touch-icon"]') as NodeListOf<HTMLLinkElement>;
    const prevAppleIconHrefs: Array<{ el: HTMLLinkElement; href: string }> = [];
    appleTouchIcons.forEach((iconTag) => {
      prevAppleIconHrefs.push({ el: iconTag, href: iconTag.href });
      iconTag.href = "/apple-touch-icon-orb.png";
    });

    let standardAppleIcon = document.querySelector('link[rel="apple-touch-icon"]:not([sizes])') as HTMLLinkElement | null;
    let createdStandardAppleIcon = false;
    if (!standardAppleIcon) {
      standardAppleIcon = document.createElement("link");
      standardAppleIcon.rel = "apple-touch-icon";
      standardAppleIcon.href = "/apple-touch-icon-orb.png";
      document.head.appendChild(standardAppleIcon);
      createdStandardAppleIcon = true;
    } else {
      standardAppleIcon.href = "/apple-touch-icon-orb.png";
    }

    let standardPrecomposedIcon = document.querySelector('link[rel="apple-touch-icon-precomposed"]:not([sizes])') as HTMLLinkElement | null;
    let createdPrecomposedIcon = false;
    if (!standardPrecomposedIcon) {
      standardPrecomposedIcon = document.createElement("link");
      standardPrecomposedIcon.rel = "apple-touch-icon-precomposed";
      standardPrecomposedIcon.href = "/apple-touch-icon-orb.png";
      document.head.appendChild(standardPrecomposedIcon);
      createdPrecomposedIcon = true;
    } else {
      standardPrecomposedIcon.href = "/apple-touch-icon-orb.png";
    }

    // 3. Favicons
    const favicons = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]') as NodeListOf<HTMLLinkElement>;
    const prevFaviconHrefs: Array<{ el: HTMLLinkElement; href: string }> = [];
    favicons.forEach((favTag) => {
      prevFaviconHrefs.push({ el: favTag, href: favTag.href });
      favTag.href = "/orb-icon-192.png";
    });

    // 4. Apple Mobile Web App Title
    let appleTitleTag = document.querySelector('meta[name="apple-mobile-web-app-title"]') as HTMLMetaElement | null;
    const prevAppleTitle = appleTitleTag ? appleTitleTag.getAttribute("content") : null;
    if (appleTitleTag) {
      appleTitleTag.setAttribute("content", "크리스탈 오브");
    } else {
      appleTitleTag = document.createElement("meta");
      appleTitleTag.name = "apple-mobile-web-app-title";
      appleTitleTag.content = "크리스탈 오브";
      document.head.appendChild(appleTitleTag);
    }

    // 5. Application Name
    let appNameTag = document.querySelector('meta[name="application-name"]') as HTMLMetaElement | null;
    const prevAppName = appNameTag ? appNameTag.getAttribute("content") : null;
    if (appNameTag) {
      appNameTag.setAttribute("content", "크리스탈 오브");
    }

    // 6. Theme Color
    let themeColorTag = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    const prevThemeColor = themeColorTag ? themeColorTag.getAttribute("content") : null;
    if (themeColorTag) {
      themeColorTag.setAttribute("content", "#030308");
    }

    return () => {
      document.title = prevTitle;
      if (manifestTag && prevManifestHref) manifestTag.setAttribute("href", prevManifestHref);
      prevAppleIconHrefs.forEach(({ el, href }) => {
        el.href = href;
      });
      if (createdStandardAppleIcon && standardAppleIcon && standardAppleIcon.parentNode) {
        standardAppleIcon.parentNode.removeChild(standardAppleIcon);
      }
      if (createdPrecomposedIcon && standardPrecomposedIcon && standardPrecomposedIcon.parentNode) {
        standardPrecomposedIcon.parentNode.removeChild(standardPrecomposedIcon);
      }
      prevFaviconHrefs.forEach(({ el, href }) => {
        el.href = href;
      });
      if (appleTitleTag && prevAppleTitle) appleTitleTag.setAttribute("content", prevAppleTitle);
      if (appNameTag && prevAppName) appNameTag.setAttribute("content", prevAppName);
      if (themeColorTag && prevThemeColor) themeColorTag.setAttribute("content", prevThemeColor);
    };
  }, []);

  // Synchronize Prism identity
  useEffect(() => {
    try {
      const profileRaw = localStorage.getItem("prism_user_profile");
      if (profileRaw) {
        const p = JSON.parse(profileRaw);
        if (p?.displayName) setPrismUserName(p.displayName);
      }
    } catch (_) {}

    const handlePrismNavigate = (e: any) => {
      const targetPath = e?.detail?.path;
      if (targetPath && typeof targetPath === "string") {
        window.location.href = targetPath;
      }
    };
    window.addEventListener("prism-navigate", handlePrismNavigate);

    return () => {
      stopTTS();
      window.removeEventListener("prism-navigate", handlePrismNavigate);
    };
  }, []);

  // Swirling Particle Nebula Inside Orb Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const width = (canvas.width = 380);
    const height = (canvas.height = 380);

    const particles: Array<{
      x: number;
      y: number;
      radius: number;
      angle: number;
      speed: number;
      dist: number;
      alpha: number;
      color: string;
    }> = [];

    const colors = ["#60a5fa", "#a78bfa", "#38bdf8", "#c084fc", "#ffffff"];

    for (let i = 0; i < 90; i++) {
      particles.push({
        x: width / 2,
        y: height / 2,
        radius: Math.random() * 2.2 + 0.6,
        angle: Math.random() * Math.PI * 2,
        speed: (Math.random() * 0.012 + 0.003) * (Math.random() > 0.5 ? 1 : -1),
        dist: Math.random() * 130 + 8,
        alpha: Math.random() * 0.65 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Deep glowing core
      const grad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        width / 2
      );
      grad.addColorStop(0, "rgba(96, 165, 250, 0.22)");
      grad.addColorStop(0.5, "rgba(167, 139, 250, 0.12)");
      grad.addColorStop(1, "rgba(4, 3, 10, 0.95)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, width / 2 - 4, 0, Math.PI * 2);
      ctx.fill();

      // Swirling Stardust Particles
      particles.forEach((p) => {
        p.angle += p.speed * (1 + audioLevel * 2.5 + (isScrying ? 4 : 0));
        const px = width / 2 + Math.cos(p.angle) * p.dist;
        const py = height / 2 + Math.sin(p.angle) * p.dist;

        ctx.beginPath();
        ctx.arc(px, py, p.radius * (1 + audioLevel * 0.4), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha * (isScrying ? 0.95 : 0.7);
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      ctx.globalAlpha = 1.0;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [audioLevel, isScrying]);

  // Toggle 528Hz Solfeggio Healing Drone
  const handleToggleDrone = () => {
    const active = sacredAudio.toggleDrone();
    setIsDroneOn(active);
    triggerHaptic("whitehole");
  };

  // Toggle Vocal Resonance Microphone
  const handleToggleMic = async () => {
    if (isMicActive) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      setIsMicActive(false);
      setAudioLevel(0);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const actx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = actx;
      const src = actx.createMediaStreamSource(stream);
      const analyser = actx.createAnalyser();
      analyser.fftSize = 128;
      src.connect(analyser);
      analyserRef.current = analyser;
      setIsMicActive(true);

      const buf = new Uint8Array(analyser.frequencyBinCount);
      const poll = () => {
        if (!analyserRef.current || !mediaStreamRef.current) return;
        analyserRef.current.getByteFrequencyData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i];
        const avg = sum / buf.length;
        setAudioLevel(Math.min(1.0, avg / 70));
        requestAnimationFrame(poll);
      };
      poll();
    } catch {
      setIsMicActive(true);
      const interval = setInterval(() => {
        setAudioLevel(Math.random() * 0.3 + 0.1);
      }, 250);
      setTimeout(() => clearInterval(interval), 15000);
    }
  };

  // Speak Oracle Message with TTS
  const handleSpeakTTS = (result: ScryingResult) => {
    if (isTTSActive) {
      stopTTS();
      return;
    }

    const speechScript = `${result.keyTheme}. ${result.directAnswer} 실천 가이드입니다. ${result.actionSolution}`;
    playTTS(speechScript, "lucy");
  };

  const [isCopied, setIsCopied] = useState(false);

  const handleCopyResult = (result: ScryingResult) => {
    try {
      navigator.clipboard.writeText(`[직관의 해답 - ${result.keyTheme}]\n질문: "${result.query}"\n해답: ${result.directAnswer}\n실천 가이드: ${result.actionSolution}`);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (_) {}
  };

  // Execute Direct Question-Answering & Insight Scrying with guaranteed safety timeout
  const executeScrying = async (questionText?: string) => {
    if (isScrying) return; // Prevent concurrent overlapping requests

    const query = questionText || inquiry.trim() || "지금 나에게 가장 필요한 명료한 방향과 선택";
    setInquiry(""); // 🔮 고민 실행 즉시 대화창/입력창 초기화
    stopTTS();
    setIsScrying(true);
    setScryingResult(null);

    sacredAudio.playSingingBowl(528);
    triggerHaptic("blackhole");

    // Gather Prism background knowledge (Profile, MBTI, Saju)
    let prismContextBriefing = "";
    try {
      const profileRaw = localStorage.getItem("prism_user_profile");
      if (profileRaw) {
        const p = JSON.parse(profileRaw);
        if (p?.displayName) prismContextBriefing += `이름: ${p.displayName}. `;
        if (p?.basic?.mbti) prismContextBriefing += `성향/MBTI: ${p.basic.mbti}. `;
      }
    } catch (_) {}

    // Base fallback oracle solution
    const hash = query.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const baseFallback = DEFAULT_ORACLE_SOLUTIONS[Math.abs(hash) % DEFAULT_ORACLE_SOLUTIONS.length];

    // Determine Mode, System Instruction, and Mode-Tuned Fallbacks
    let effectiveMasterMode = isMasterMode;
    let effectiveRuneIds = selectedRuneIds;

    // AI 자동 감지가 켜져 있으면 질문 텍스트에서 즉시 의도 감지 반영
    if (isAutoDetect && query.trim().length >= 2) {
      const detected = detectSeptagramChannelsFromText(query);

      if (detected.isMaster || detected.channels.length === 7) {
        effectiveMasterMode = true;
        effectiveRuneIds = SEPTAGRAM_APPS.map((a) => a.id);
        setIsMasterMode(true);
        setSelectedRuneIds(effectiveRuneIds);
      } else if (detected.channels.length > 0) {
        effectiveMasterMode = false;
        effectiveRuneIds = detected.channels;
        setIsMasterMode(false);
        setSelectedRuneIds(effectiveRuneIds);
      } else {
        effectiveMasterMode = false;
        effectiveRuneIds = [];
        setIsMasterMode(false);
        setSelectedRuneIds([]);
      }
    }

    let modeTitle = "🔮 직관 모드";
    let promptInstruction = "";
    let defaultKeyTheme = "직관의 답";
    let defaultAnswer = baseFallback.directAnswer;
    let defaultAction = baseFallback.actionSolution;
    let modeColor = "#c084fc";
    let modeGlow = "rgba(192, 132, 252, 0.7)";

    if (effectiveMasterMode || effectiveRuneIds.length === 7) {
      modeTitle = "👑 7대 차원 통합 마스터 신탁";
      modeColor = "#fbbf24";
      modeGlow = "rgba(251, 191, 36, 0.85)";
      defaultKeyTheme = "우주의 통섭";
      defaultAnswer = `현재 마주한 질문은 삶의 전체 맥락이 한 단계 도약하려는 중대한 변곡점입니다. 두려움을 내려놓고 내면의 직관을 신뢰할 때, 7대 차원의 에너지가 당신의 길을 가장 밝고 온전하게 비춥니다.`;
      defaultAction = `조급한 마음을 멈추고 깊은 호흡과 함께, 내면에서 자연스럽게 떠오르는 가장 맑은 첫 번째 결단을 따르세요.`;
      promptInstruction = `[현재 모드: 7대 차원 통합 마스터 신탁 (Master Cosmic Synthesis)]
오브의 7대 차원(프롤로그 운명의 서막, 오렌지 소원의 우물, 트리니티 심층 무의식, 오라 방하착 치유, 파랑새 호오포노포노 정화, 뮤즈 예술처방, 에필로그 삶의 지혜)의 모든 지혜를 집대성한 최고 권위의 7대 차원 '올인원 마스터 신탁'입니다.
고민의 근원적 본질을 꿰뚫고, 입체적이며 총체적인 통찰과 구체적 실천 솔루션을 명쾌하고 깊이 있게 제시하세요.`;
    } else if (effectiveRuneIds.length >= 2) {
      const activeApps = effectiveRuneIds
        .map((id) => SEPTAGRAM_APPS.find((a) => a.id === id))
        .filter(Boolean) as SeptagramAppDimension[];
      const names = activeApps.map((a) => a.shortName).join(" × ");
      modeTitle = `🔮 ${names} ${activeApps.length}중 연동`;
      modeColor = activeApps[0]?.color || "#c084fc";
      modeGlow = activeApps[0]?.glowColor || "rgba(192, 132, 252, 0.7)";
      defaultKeyTheme = activeApps.slice(0, 2).map((a) => a.shortName).join("과 ");
      defaultAnswer = `[${activeApps.map((a) => a.name).join(", ")}]의 영적 파동이 공명하며, 보이지 않던 새로운 관점과 치유의 통찰이 열리고 있습니다.`;
      defaultAction = `${activeApps.length}개 연동 차원의 조화로운 흐름을 신뢰하며, 지금 떠오르는 현실적인 영감을 행동으로 옮겨보세요.`;
      const dimensionDescriptions = activeApps
        .map((a, i) => `- 차원 ${i + 1} (${a.name}): ${a.description} (룬: ${a.runeMeaning})`)
        .join("\n");
      promptInstruction = `[현재 모드: ${names} ${activeApps.length}중 연동 시너지 신탁]
선택된 ${activeApps.length}개 차원의 고유한 상징과 지혜를 유기적으로 융합하여, 질문/고민에 대한 깊이 있는 통찰과 실천적 해결책을 제시하세요.
${dimensionDescriptions}`;
    } else if (effectiveRuneIds.length === 1) {
      const app = SEPTAGRAM_APPS.find((a) => a.id === effectiveRuneIds[0]);
      modeTitle = `✨ ${app?.name} 신탁`;
      modeColor = app?.color || "#c084fc";
      modeGlow = app?.glowColor || "rgba(192, 132, 252, 0.7)";
      defaultKeyTheme = app?.shortName || "직관의 답";

      if (app?.id === "prologue") {
        defaultAnswer = `새로운 시작의 서막이 열리고 있습니다. 과거의 망설임을 뒤로하고, 당신 본연의 가능성과 비전을 당당히 펼치세요.`;
        defaultAction = `마음의 문을 활짝 열고 새로운 기회와 운명의 흐름을 기쁘게 맞아들이세요.`;
      } else if (app?.id === "aura") {
        defaultAnswer = `잡고 있으려 할수록 긴장만 더해집니다. 그 상황을 억지로 통제하려 하지 말고 '있는 그대로 내려놓아도 괜찮다'고 스스로를 다독여 주세요.`;
        defaultAction = `어깨와 가슴의 힘을 툭 빼고, 깊은 날숨과 함께 마음에 쥔 긴장을 허공으로 흘려보내세요.`;
      } else if (app?.id === "bluebird") {
        defaultAnswer = `기억의 매듭을 정화할 시간입니다. 네 마디 정화의 말(미안합니다, 용서하세요, 감사합니다, 사랑합니다)로 내면의 평화를 회복하세요.`;
        defaultAction = `가슴에 손을 얹고 마음속으로 4마디 정화의 말을 고요히 속삭여 보세요.`;
      } else if (app?.id === "orange") {
        defaultAnswer = `내면의 진솔한 소망은 결코 사라지지 않습니다. 감추어 둔 진짜 갈망을 마주하고, 마음의 우물에 당신만의 소망의 빛을 띄워보세요.`;
        defaultAction = `마음 깊은 곳에서 진정으로 바라는 소망을 가만히 소리 내어 읊어보세요.`;
      } else if (app?.id === "trinity") {
        defaultAnswer = `거울에 비친 운명은 이미 당신이 걸어가야 할 방향을 가리키고 있습니다. 불필요한 의심을 거두고 직관적 통찰을 신뢰하세요.`;
        defaultAction = `복잡한 계산보다 당신의 순수한 영혼이 속삭이는 첫 번째 감각을 나침반 삼으세요.`;
      } else if (app?.id === "muse") {
        defaultAnswer = `메마른 생각의 틀을 깨고 감성의 물결에 온전히 젖어드세요. 지금 마주한 과정 또한 삶을 더욱 깊고 풍요롭게 빚어내는 예술입니다.`;
        defaultAction = `고요한 선율에 귀를 기울이며 굳어있던 마음에 따뜻한 영감의 숨결을 불어넣으세요.`;
      } else if (app?.id === "epilogue") {
        defaultAnswer = `오늘 마주했던 혼란도 영혼의 서재에서는 아름다운 한 줄의 지혜가 됩니다. 지나간 시간에 미련을 두지 말고 편안한 안식을 누리세요.`;
        defaultAction = `오늘 나를 성장시킨 소중한 깨달음을 가슴에 품고 홀가분하게 하루를 마무리하세요.`;
      } else {
        defaultAnswer = `지친 마음에 온전한 자기 연민을 선물하세요. 따스한 사랑과 수용이야말로 상처를 아물게 하는 가장 위대한 치유의 힘입니다.`;
        defaultAction = `두 팔로 나 자신을 따뜻하게 감싸 안으며 "지금 그대로도 충분히 잘하고 있다"고 말해주세요.`;
      }

      promptInstruction = `[현재 모드: ${app?.name} 신탁 모드]
해당 앱의 핵심 철학(${app?.description}, 룬 의미: ${app?.runeMeaning})에 집중하여, 질문/고민에 대해 명쾌하고 영감 넘치는 해답과 실천 가이드를 제시하세요.`;
    } else {
      modeTitle = "🔮 직관 모드";
      modeColor = "#c084fc";
      modeGlow = "rgba(192, 132, 252, 0.7)";
      defaultKeyTheme = baseFallback.keyTheme || "직관의 답";
      promptInstruction = `[현재 모드: 크리스탈 오브 직관 모드]
크리스탈 오브의 맑고 신비로운 직관과 영적 통찰로 내담자의 질문을 비춰주세요.
질문자가 털어놓은 고민에 대해 명쾌하고 따뜻한 직관적 해답과 현실적인 실천 가이드를 제시하세요.`;
    }

    let finalResult: ScryingResult = {
      query,
      keyTheme: defaultKeyTheme,
      directAnswer: defaultAnswer,
      actionSolution: defaultAction,
      color: modeColor,
      glow: modeGlow,
      timestamp: Date.now(),
      modeTitle,
      activeRunes: selectedRuneIds,
      isMaster: isMasterMode,
    };

    // Call API with strict 3.5s timeout via AbortController to guarantee no infinite hang
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 3500);

    try {
      const resp = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortController.signal,
        body: JSON.stringify({
          prompt: `[질문자 정보: ${prismContextBriefing || "자유 탐색자"}]\n사용자의 질문/고민: "${query}"\n\n${promptInstruction}\n\n반드시 다음 순수 JSON 포맷으로만 응답하세요:\n{\n  "keyTheme": "2~4글자의 핵심 키워드",\n  "directAnswer": "고민에 대한 2~3문장의 명쾌하고 직관적인 직접 해답",\n  "actionSolution": "1문장의 구체적이고 현실적인 실천 가이드"\n}`,
        }),
      });

      clearTimeout(timeoutId);

      if (resp.ok) {
        const data = await resp.json();
        const rawContent = data?.text || data?.response || data?.content || "";
        if (typeof rawContent === "string" && rawContent.trim().length > 0) {
          const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[0]);
              if (parsed.keyTheme && parsed.directAnswer) {
                finalResult = {
                  query,
                  keyTheme: String(parsed.keyTheme).trim(),
                  directAnswer: String(parsed.directAnswer).trim(),
                  actionSolution: String(parsed.actionSolution || defaultAction).trim(),
                  color: modeColor,
                  glow: modeGlow,
                  timestamp: Date.now(),
                  modeTitle,
                  activeRunes: effectiveRuneIds,
                  isMaster: effectiveMasterMode,
                };
              }
            } catch (_) {}
          } else if (rawContent.trim().length > 10) {
            finalResult = {
              query,
              keyTheme: defaultKeyTheme,
              directAnswer: rawContent.trim(),
              actionSolution: defaultAction,
              color: modeColor,
              glow: modeGlow,
              timestamp: Date.now(),
              modeTitle,
              activeRunes: effectiveRuneIds,
              isMaster: effectiveMasterMode,
            };
          }
        }
      }
    } catch (e) {
      // Aborted or network failure -> seamlessly use fallback instant solution
      console.warn("[OrbGateway] AI generation completed with fallback:", e);
    } finally {
      clearTimeout(timeoutId);
    }

    // Always finish scrying and present result cleanly
    setTimeout(() => {
      finalResult.recommendedAppId = determineRecommendedApp(
        finalResult.query,
        finalResult.keyTheme,
        finalResult.directAnswer
      );
      setIsScrying(false);
      setScryingResult(finalResult);
      setInquiry(""); // 🔮 고민 완료 후 대화창/입력창 확실히 초기화
      sacredAudio.playSingingBowl(639);

      // Auto play TTS voice reading
      const speechScript = `${finalResult.keyTheme}. ${finalResult.directAnswer} 실천 가이드입니다. ${finalResult.actionSolution}`;
      playTTS(speechScript, "lucy");

      // Bidirectional Synchronization: Save Insight into Prism Background Knowledge
      try {
        const todayKey = new Date().toISOString().slice(0, 10);
        const orbPayload = {
          query: finalResult.query,
          keyTheme: finalResult.keyTheme,
          directAnswer: finalResult.directAnswer,
          actionSolution: finalResult.actionSolution,
          timestamp: finalResult.timestamp,
          dateKey: todayKey,
        };

        // 1. Dedicated Prism background storage slots
        localStorage.setItem("prism_orb_latest_scrying", JSON.stringify(orbPayload));
        localStorage.setItem(`prism_daily_oracle_orb_${todayKey}`, JSON.stringify(orbPayload));
        localStorage.setItem("prism_latest_daily_orb", JSON.stringify(orbPayload));

        // 2. Register to general Prism feature history directly
        try {
          const entry = {
            id: `feat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            app: "hub",
            appName: "크리스탈 오라클",
            featureName: "직관의 해답",
            summary: `[${finalResult.keyTheme}] ${finalResult.directAnswer.slice(0, 80)}`,
            details: orbPayload,
            timestamp: Date.now(),
            dateKey: todayKey,
          };
          const rawHist = localStorage.getItem("prism_omni_feature_history");
          let hist = rawHist ? JSON.parse(rawHist) : [];
          if (!Array.isArray(hist)) hist = [];
          hist.unshift(entry);
          if (hist.length > 60) hist = hist.slice(0, 60);
          localStorage.setItem("prism_omni_feature_history", JSON.stringify(hist));
        } catch (_) {}

        // 3. Real-time Cross-tab Broadcast Channel
        if ("BroadcastChannel" in window) {
          const bc = new BroadcastChannel("prism-cross-app");
          bc.postMessage({
            type: "PRISM_ORB_INSIGHT",
            payload: orbPayload,
          });
          bc.close();
        }

        // 4. CustomEvents for live reactivity
        window.dispatchEvent(new CustomEvent("prism:orb_scrying_updated", { detail: orbPayload }));
        window.dispatchEvent(new CustomEvent("prism:feature_updated", { detail: orbPayload }));
      } catch (syncErr) {
        console.warn("[OrbGateway] Prism sync error:", syncErr);
      }
    }, 600);
  };

  // Check for incoming cross-app toss payload into Orb (One-touch Auto-Scrying)
  useEffect(() => {
    try {
      const pending = getPendingPrismToss("orb");
      if (pending) {
        clearPrismToss();
        // 15초 이내에 명시적으로 발생한 유효 토스만 수신
        const isFresh = pending.tossedAt && (Date.now() - pending.tossedAt < 15000);
        // 이전 감정 상담 흔적(우울/부정적 기본 문구 등)은 자동 주입되지 않도록 정제
        const incomingQuestion = (pending.autoPrompt || pending.contextMessage || (pending as any).query || "").trim();
        const isEmotionalSpillover =
          incomingQuestion.includes("우울해") ||
          incomingQuestion.includes("자존감이 낮아") ||
          incomingQuestion.includes("너무 우울");

        if (isFresh && incomingQuestion && !isEmotionalSpillover) {
          setInquiry(incomingQuestion);
          if (pending.autoTrigger) {
            setTimeout(() => {
              executeScrying(incomingQuestion || undefined);
            }, 450);
          }
        }
      }

      // 🔮 텍스트 드래그(선택) 연동: 앱 어디서든 선택한 내용을 직관 오브로 전송한 경우 자동 처리
      const pendingSel = getAndClearPendingSelection();
      if (pendingSel && pendingSel.text) {
        setInquiry(pendingSel.text);
        setTimeout(() => {
          executeScrying(pendingSel.text);
        }, 350);
      }
    } catch (_) {}

    const handleDynamicSelection = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail?.text && detail?.target === "orb") {
        setInquiry(detail.text);
        setTimeout(() => {
          executeScrying(detail.text);
        }, 300);
      }
    };
    window.addEventListener("prism:selection_saved", handleDynamicSelection);
    return () => {
      window.removeEventListener("prism:selection_saved", handleDynamicSelection);
    };
  }, []);

  return (
    <div
      className="relative w-full h-[100dvh] min-h-[100dvh] text-slate-100 flex flex-col items-center justify-between overflow-y-auto overflow-x-hidden select-none font-sans bg-[#05050c] no-scrollbar"
      style={{
        background: "radial-gradient(circle at 50% 30%, #0d0d1e 0%, #05050e 65%, #020206 100%)",
      }}
    >
      {/* Background Soft Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-40 w-full max-w-4xl px-3 sm:px-6 pt-[max(env(safe-area-inset-top,0px),0.75rem)] sm:pt-6 pr-14 sm:pr-24 flex items-center justify-between gap-1.5 sm:gap-3 shrink-0">
        {/* Left: Real-time Prism Sync Status Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl text-slate-300 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse shrink-0" />
            <span className="hidden sm:inline">오라클 연동</span>
            <span className="sm:hidden text-[11px]">오브</span>
          </div>
        </div>

        {/* Center Title */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-purple-500/10 border border-purple-400/30 backdrop-blur-xl shadow-lg min-w-0 max-w-[170px] xs:max-w-[220px] sm:max-w-none">
          <CrystalOrbIcon size={15} className="shrink-0 text-purple-300 animate-pulse" />
          <span className="text-xs sm:text-sm font-semibold tracking-wider text-purple-200 truncate">
            {prismUserName ? `${prismUserName}의 크리스탈 오브` : "크리스탈 오브"}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {!isStandalone && (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("trigger-pwa-install"))}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-medium backdrop-blur-xl border border-purple-400/40 bg-purple-500/15 text-purple-200 hover:bg-purple-500/25 transition-all active:scale-95 shadow-[0_0_12px_rgba(168,85,247,0.25)] touch-manipulation cursor-pointer"
              title="크리스탈 오브 독립 앱 설치"
            >
              <Download size={12} className="text-purple-300 shrink-0" />
              <span className="hidden sm:inline">앱 설치</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleToggleDrone}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-medium backdrop-blur-xl border transition-all active:scale-95 touch-manipulation cursor-pointer ${
              isDroneOn
                ? "bg-purple-500/20 text-purple-300 border-purple-400/40 shadow-sm"
                : "bg-white/5 text-slate-400 border-white/10 hover:text-white"
            }`}
            title="528Hz 치유 사운드 토글"
          >
            {isDroneOn ? <Volume2 size={12} className="text-purple-400 animate-pulse shrink-0" /> : <VolumeX size={12} className="shrink-0" />}
            <span className="hidden sm:inline">528Hz</span>
          </button>

          <button
            type="button"
            onClick={handleToggleMic}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-medium backdrop-blur-xl border transition-all active:scale-95 touch-manipulation cursor-pointer ${
              isMicActive
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/40 shadow-sm"
                : "bg-white/5 text-slate-400 border-white/10 hover:text-white"
            }`}
            title="마이크 공명 토글"
          >
            {isMicActive ? <Mic size={12} className="text-cyan-400 animate-bounce shrink-0" /> : <MicOff size={12} className="shrink-0" />}
            <span className="hidden sm:inline">{isMicActive ? "공명 중" : "음성"}</span>
          </button>
        </div>
      </header>

      {/* Main Stage: Pristine 3D Crystal Ball with Arcane Magic Circle Matrix */}
      <main className="relative z-30 flex-1 flex flex-col items-center justify-center w-full max-w-lg px-2 sm:px-4 my-auto min-h-0">
        <div
          className={`relative flex items-center justify-center transition-transform duration-300 origin-center my-1 sm:my-auto shrink-0 ${
            narrow
              ? "w-72 h-72 scale-[0.86]"
              : "w-80 h-80 scale-[0.92] xs:scale-100 sm:w-96 sm:h-96 sm:scale-105"
          }`}
        >
          {/* 🌟 1. 대형 아케인 마법진 & 태양계 다층 오러리 (Concentric Planetary Orrery Matrix) */}
          <div
            className="absolute inset-[-68px] sm:inset-[-88px] pointer-events-none flex items-center justify-center transition-all duration-700 select-none z-0"
            style={{
              transform: `scale(${1 + audioLevel * 0.12})`,
            }}
          >
            {/* 회전하는 마법진 후광 코로나 오라 */}
            <div
              className="absolute inset-6 rounded-full pointer-events-none blur-3xl transition-opacity duration-500"
              style={{
                background: isScrying
                  ? "radial-gradient(circle, rgba(56,189,248,0.35) 0%, rgba(168,85,247,0.3) 45%, rgba(251,191,36,0.15) 70%, transparent 85%)"
                  : "radial-gradient(circle, rgba(56,189,248,0.18) 0%, rgba(168,85,247,0.15) 45%, transparent 75%)",
              }}
            />

            {/* 마법진 방사형 빛살 (8-Fold Arcane Light Flares) */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: isScrying ? 18 : 60, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30"
            >
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                <div
                  key={`arcane-ray-${deg}`}
                  className="absolute w-0.5 h-full pointer-events-none"
                  style={{
                    transform: `rotate(${deg}deg)`,
                    background:
                      "linear-gradient(180deg, transparent 5%, rgba(56,189,248,0.6) 20%, transparent 45%, transparent 55%, rgba(168,85,247,0.6) 80%, transparent 95%)",
                  }}
                />
              ))}
            </motion.div>

            {/* 최외곽 황도 성간 눈금 림 (Outer Celestial Zodiac Rim - 440px) */}
            <svg
              viewBox="0 0 440 440"
              className="absolute inset-0 w-full h-full text-slate-400/30 pointer-events-none"
            >
              <circle cx="220" cy="220" r="216" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 6" />
              <circle cx="220" cy="220" r="212" fill="none" stroke="rgba(251,191,36,0.25)" strokeWidth="0.5" />
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
                    strokeOpacity={i % 6 === 0 ? 0.7 : 0.4}
                  />
                );
              })}
            </svg>

            {/* 🪐 칠요 성진 7대 전용 동심 궤도 시스템 (7 Concentric Planetary Tiers)
                - 선택모드/연동모드에서도 멈추지 않고 계속 동일 방향 회전
                - 2개 룬 연동 시: 마지막 선택된 룬이 신속히(0.35s) 이동하여 오브 중심(220, 220)을 관통하는 일직선 축 완성
                - 일직선 축 완성 후에도 정지하지 않고 오브 중심으로 같은 방향 회전 지속
            */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{ rotate: 360 }}
              transition={{
                duration: isScrying ? 16 : 48,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              {/* 1. 7대 전용 동심 궤도 링 (7 Dedicated Orbit Rings, 1 ring per orb) */}
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
                        strokeWidth={isSelected ? "1.6" : "0.85"}
                        strokeDasharray={isSelected ? "6 4" : "4 6"}
                        strokeOpacity={isSelected ? 0.85 : 0.3}
                        className="transition-all duration-300"
                      />
                      {isSelected && (
                        <circle
                          cx="220"
                          cy="220"
                          r={app.orbitRadius}
                          fill="none"
                          stroke={app.color}
                          strokeWidth="3.5"
                          strokeOpacity="0.25"
                          className="blur-[2px]"
                        />
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* 2. 성간 공명 일직선 레이저 및 기하 결속 레이어 (Laser Beams rotating synchronously) */}
              <svg
                viewBox="0 0 440 440"
                className="absolute inset-0 w-full h-full pointer-events-none z-20"
              >
                {/* ✨ [단일 모드] 1개 룬 선택 시: 선택된 룬에서 중심 오브(220, 220)로 뻗는 공명 유도 광선 */}
                {selectedRuneIds.length === 1 && !isMasterMode && (() => {
                  const app = SEPTAGRAM_APPS.find((a) => a.id === selectedRuneIds[0]);
                  if (!app) return null;
                  const rad = (app.initialAngle * Math.PI) / 180;
                  const x = 220 + app.orbitRadius * Math.cos(rad);
                  const y = 220 + app.orbitRadius * Math.sin(rad);
                  const lineColor = app.color;

                  return (
                    <g key={`single-beam-${app.id}`} className="pointer-events-none">
                      <line
                        x1={x}
                        y1={y}
                        x2={220}
                        y2={220}
                        stroke={lineColor}
                        strokeWidth="6"
                        strokeOpacity="0.25"
                        className="blur-[3px]"
                      />
                      <line
                        x1={x}
                        y1={y}
                        x2={220}
                        y2={220}
                        stroke={lineColor}
                        strokeWidth="2"
                        strokeDasharray="4 6"
                        strokeOpacity="0.85"
                        className="animate-pulse"
                      />
                    </g>
                  );
                })()}

                {/* ⚡ [일직선 공명 레이저] 2~7개 룬 연동 및 마스터 모드: 모든 선택된 룬이 일직선 축에 정렬되어 중심 오브(220, 220)를 관통하는 단 하나의 강력한 레이저 일직선 */}
                {(selectedRuneIds.length >= 2 || isMasterMode) && (() => {
                  const isMaster = isMasterMode || selectedRuneIds.length === 7;
                  const baseApp = selectedRuneIds.length > 0
                    ? (SEPTAGRAM_APPS.find((a) => a.id === selectedRuneIds[0]) || SEPTAGRAM_APPS[0])
                    : SEPTAGRAM_APPS[0];
                  const baseAngle = baseApp.initialAngle;
                  const rad = (baseAngle * Math.PI) / 180;
                  const cos = Math.cos(rad);
                  const sin = Math.sin(rad);

                  const selectedApps = selectedRuneIds
                    .map((id) => SEPTAGRAM_APPS.find((a) => a.id === id))
                    .filter(Boolean) as SeptagramAppDimension[];

                  // Ray A (짝수 인덱스 룬들)의 최외곽 거리
                  const rayAApps = selectedApps.filter((app) => selectedRuneIds.indexOf(app.id) % 2 === 0);
                  const maxDistA = isMaster ? 218 : Math.max(...rayAApps.map((a) => a.orbitRadius), 60);

                  // Ray B (홀수 인덱스 룬들)의 최외곽 거리
                  const rayBApps = selectedApps.filter((app) => selectedRuneIds.indexOf(app.id) % 2 === 1);
                  const maxDistB = isMaster ? 218 : (rayBApps.length > 0 ? Math.max(...rayBApps.map((a) => a.orbitRadius)) : 0);

                  // 일직선 축 양 끝단 좌표 ((220, 220) 중심을 완벽히 관통하는 일직선)
                  const x1 = 220 + (maxDistA + 10) * cos;
                  const y1 = 220 + (maxDistA + 10) * sin;
                  const x2 = 220 - (maxDistB > 0 ? (maxDistB + 10) : 0) * cos;
                  const y2 = 220 - (maxDistB > 0 ? (maxDistB + 10) : 0) * sin;

                  const glowColor = isMaster ? "#fbbf24" : baseApp.color;
                  const subColor = isMaster
                    ? "#f59e0b"
                    : (selectedApps[selectedApps.length - 1]?.color || "#38bdf8");
                  const pulseColor = isMaster ? "#fde047" : "#38bdf8";

                  return (
                    <motion.g
                      key={`straight-axis-beam-${baseApp.id}-${selectedRuneIds.length}-${isMaster ? "master" : "link"}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="pointer-events-none"
                    >
                      {/* 1. 외곽 코로나 블러 글로우 (단 하나의 일직선 광선) */}
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={glowColor}
                        strokeWidth={isMaster ? "14" : "10"}
                        strokeOpacity={isMaster ? "0.45" : "0.35"}
                        strokeLinecap="round"
                        className="blur-[5px]"
                      />
                      {/* 2. 보조 듀얼/골든 컬러 글로우 */}
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={subColor}
                        strokeWidth={isMaster ? "5" : "4"}
                        strokeOpacity={isMaster ? "0.85" : "0.75"}
                        strokeLinecap="round"
                      />
                      {/* 3. 코어 화이트 순수 관통 레이저 빔 */}
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="#ffffff"
                        strokeWidth={isMaster ? "3" : "2"}
                        strokeLinecap="round"
                      />
                      {/* 4. 활주하는 에너지 파동 점선 */}
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={pulseColor}
                        strokeWidth="2.5"
                        strokeDasharray="6 8"
                        className="animate-pulse"
                      />
                      {/* 5. 오브 중심 관통 에너지 코어 포인트 (220, 220) */}
                      <circle
                        cx="220"
                        cy="220"
                        r={isMaster ? "6" : "5"}
                        fill="#ffffff"
                        className="opacity-95 shadow-sm"
                      />
                      <circle
                        cx="220"
                        cy="220"
                        r={isMaster ? "10" : "8"}
                        fill="none"
                        stroke={glowColor}
                        strokeWidth="1.5"
                        className="opacity-75"
                      />
                    </motion.g>
                  );
                })()}
              </svg>

              {/* 3. 7대 전용 룬 노드 (각 오브당 1개의 층, 총 7개 층) */}
              {SEPTAGRAM_APPS.map((app) => {
                const isSelected = selectedRuneIds.includes(app.id);
                const selectedIndex = selectedRuneIds.indexOf(app.id);
                const isHovered = hoveredApp?.id === app.id;

                // 룬 일직선 축 정렬 각도 오프셋 계산:
                // 연동 모드(2개 이상) 또는 마스터 모드 가동 시, 나중에 선택된 룬들이 첫 번째 룬의 일직선 축에 맞춰 빠르게 회전 이동
                let alignmentDelta = 0;
                if (isSelected && (selectedRuneIds.length >= 2 || isMasterMode)) {
                  const baseApp = selectedRuneIds.length > 0
                    ? (SEPTAGRAM_APPS.find((a) => a.id === selectedRuneIds[0]) || SEPTAGRAM_APPS[0])
                    : SEPTAGRAM_APPS[0];
                  const baseAngle = baseApp.initialAngle;
                  // 짝수 번째 인덱스(0, 2, 4, 6)는 첫 번째 룬과 동일한 baseAngle 축
                  // 홀수 번째 인덱스(1, 3, 5)는 180도 반대편 축에 배치하여 오브 중심을 관통하는 하나의 일직선 완성
                  const targetAngle = (selectedIndex % 2 === 0) ? baseAngle : (baseAngle + 180) % 360;
                  alignmentDelta = (targetAngle - app.initialAngle) % 360;
                  if (alignmentDelta > 180) alignmentDelta -= 360;
                  if (alignmentDelta < -180) alignmentDelta += 360;
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
                      duration: 0.35,
                      ease: [0.2, 0.8, 0.2, 1],
                    }}
                  >
                    <div
                      className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-30"
                      style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                    >
                      <button
                        type="button"
                        onClick={() => handleRuneClick(app)}
                        onMouseEnter={(e) => {
                          hoveredRuneRef.current = e.currentTarget;
                          setHoveredApp(app);
                          // 연동 모드/마스터 모드에서는 팝업메시지 미표시
                          if (!isMasterMode && selectedRuneIds.length < 2) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredRuneInfo({
                              app,
                              x: rect.left + rect.width / 2,
                              y: rect.top,
                            });
                          }
                        }}
                        onMouseMove={(e) => {
                          hoveredRuneRef.current = e.currentTarget;
                          // 연동 모드/마스터 모드에서는 팝업메시지 미표시
                          if (!isMasterMode && selectedRuneIds.length < 2) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredRuneInfo({
                              app,
                              x: rect.left + rect.width / 2,
                              y: rect.top,
                            });
                          }
                        }}
                        onMouseLeave={() => {
                          hoveredRuneRef.current = null;
                          setHoveredApp(null);
                          setHoveredRuneInfo(null);
                        }}
                        className={`group/rune relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-all duration-300 active:scale-90 cursor-pointer touch-manipulation ${
                          (isMasterMode || selectedRuneIds.length === 7)
                            ? "scale-120 ring-2 ring-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.95)] z-40"
                            : isSelected
                            ? "scale-125 ring-2 ring-white shadow-[0_0_25px_rgba(255,255,255,0.95)] z-40"
                            : isHovered
                            ? "scale-120 shadow-[0_0_18px_rgba(56,189,248,0.85)]"
                            : "hover:scale-115 opacity-85 hover:opacity-100"
                        }`}
                        style={{
                          background: (isMasterMode || selectedRuneIds.length === 7)
                            ? `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.6) 0%, #fbbf24 60%, ${app.color} 100%)`
                            : isSelected
                            ? `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.4) 0%, ${app.color} 85%)`
                            : "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.25) 0%, rgba(15,20,35,0.95) 75%)",
                          border: `1.5px solid ${(isMasterMode || selectedRuneIds.length === 7) ? "#fbbf24" : isSelected ? "#ffffff" : app.color}`,
                          boxShadow: (isMasterMode || selectedRuneIds.length === 7)
                            ? "0 0 20px rgba(251,191,36,0.9), inset 0 0 8px rgba(255,255,255,0.9)"
                            : isSelected
                            ? `0 0 25px ${app.glowColor}, inset 0 0 10px rgba(255,255,255,0.8)`
                            : `0 0 12px ${app.glowColor}`,
                        }}
                        aria-label={`${app.name} 룬 선택`}
                      >
                        {isSelected && selectedRuneIds.length >= 2 && selectedRuneIds.length < 7 && (
                          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-cyan-400 text-black text-[9px] font-black flex items-center justify-center shadow-md">
                            {selectedIndex + 1}
                          </span>
                        )}

                        {(isMasterMode || selectedRuneIds.length === 7) && (
                          <>
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-400 text-black text-[9px] font-black flex items-center justify-center shadow-md">
                              ✦
                            </span>
                            <span className="absolute -inset-1 rounded-full animate-pulse bg-amber-400/25 pointer-events-none" />
                          </>
                        )}

                        {/* 정방향 자전 보정 (Counter-rotation so rune symbol stays upright) */}
                        <motion.div
                          animate={{ rotate: -alignmentDelta }}
                          transition={{
                            duration: 0.35,
                            ease: [0.2, 0.8, 0.2, 1],
                          }}
                          className="flex items-center justify-center w-full h-full pointer-events-none"
                        >
                          <motion.span
                            animate={{ rotate: -360 }}
                            transition={{
                              duration: isScrying ? 16 : 48,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                            className="font-serif font-black text-sm sm:text-base select-none text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.85)] transition-transform group-hover/rune:scale-110 inline-block"
                          >
                            {app.runeSymbol}
                          </motion.span>
                        </motion.div>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* 영시 결과 추천 시 에테르 공명 코로나 펄스 */}
            {scryingResult?.recommendedAppId && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-56 h-56 rounded-full border border-amber-400/40 animate-pulse opacity-60" />
                <div className="w-80 h-80 rounded-full border border-cyan-400/30 animate-pulse" />
              </div>
            )}
          </div>

          {/* Subtle Outer Energy Rings */}
          <div
            className="absolute inset-0 rounded-full border border-cyan-500/30 pointer-events-none transition-all duration-700 z-10"
            style={{
              transform: `scale(${1 + audioLevel * 0.15})`,
              boxShadow: isScrying ? "0 0 45px rgba(56, 189, 248, 0.45), 0 0 80px rgba(168, 85, 247, 0.3)" : "0 0 20px rgba(56, 189, 248, 0.2)",
            }}
          />
          <div
            className="absolute -inset-4 rounded-full border border-purple-500/25 pointer-events-none transition-all duration-700 animate-pulse z-10"
            style={{
              transform: `scale(${1 + audioLevel * 0.25})`,
            }}
          />

          {/* Pure Hyper-Realistic Glass Crystal Orb (터치 시: 마스터 모드 토글) */}
          <div
            onClick={handleCenterOrbClick}
            className={`group relative rounded-full flex items-center justify-center cursor-pointer transition-transform duration-300 active:scale-95 overflow-hidden touch-manipulation ${
              narrow ? "w-56 h-56" : "w-60 h-60 xs:w-64 xs:h-64 sm:w-72 sm:h-72"
            }`}
            style={{
              background: isMasterMode
                ? "radial-gradient(circle at 35% 30%, rgba(251, 191, 36, 0.35) 0%, rgba(245, 158, 11, 0.1) 45%, rgba(0, 0, 0, 0.92) 100%)"
                : "radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.04) 45%, rgba(0, 0, 0, 0.88) 100%)",
              boxShadow: isScrying
                ? "inset 0 0 40px rgba(56, 189, 248, 0.45), inset -10px -10px 25px rgba(0,0,0,0.95), 0 0 50px rgba(56, 189, 248, 0.4), 0 0 80px rgba(168, 85, 247, 0.25)"
                : isMasterMode
                ? "inset 0 0 40px rgba(251, 191, 36, 0.5), inset -10px -10px 25px rgba(0,0,0,0.95), 0 0 50px rgba(251, 191, 36, 0.5), 0 0 80px rgba(245, 158, 11, 0.3)"
                : "inset 0 0 30px rgba(255, 255, 255, 0.25), inset -10px -10px 25px rgba(0, 0, 0, 0.9), 0 0 35px rgba(56, 189, 248, 0.25)",
              transform: `scale(${1 + audioLevel * 0.08})`,
            }}
            title="오브 터치: 마스터 모드 전환 (전체 통섭)"
          >
            {/* Swirling Stardust Particle Canvas */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full rounded-full pointer-events-none z-10"
            />

            {/* Top Specular Glare (Glass Surface Reflection) */}
            <div
              className="absolute top-3 left-6 sm:top-5 sm:left-10 w-24 sm:w-32 h-9 sm:h-12 rounded-full pointer-events-none z-30 -rotate-[28deg]"
              style={{
                background: "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.75) 0%, transparent 75%)",
              }}
            />

            {/* Internal Center Revelation Typography */}
            <div className="relative z-20 flex flex-col items-center justify-center text-center pointer-events-none p-4 sm:p-6 select-none">
              <AnimatePresence mode="wait">
                {isScrying ? (
                  <motion.div
                    key="scrying"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: [1, 1.05, 1] }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ repeat: Infinity, duration: 1.6 }}
                    className="flex flex-col items-center"
                  >
                    <span className="text-xs sm:text-sm font-semibold tracking-widest text-cyan-300 animate-pulse">
                      답변 숙고 중...
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1">
                      {isMasterMode
                        ? "7대 차원 통섭 공명 중"
                        : selectedRuneIds.length === 2
                        ? "2개 차원 연동 융합 중"
                        : selectedRuneIds.length === 1
                        ? "선택 차원 심층 공명 중"
                        : "다정한 수다 준비 중"}
                    </span>
                  </motion.div>
                ) : scryingResult ? (
                  <motion.div
                    key="revealed"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center px-3"
                  >
                    <span
                      style={{
                        color: scryingResult.color || "#38bdf8",
                        textShadow: `0 0 14px ${scryingResult.glow || "rgba(56, 189, 248, 0.6)"}`,
                      }}
                      className="text-base sm:text-lg font-extrabold tracking-wider"
                    >
                      {scryingResult.keyTheme}
                    </span>
                    <span className="text-[10px] text-slate-300 mt-1">
                      {scryingResult.modeTitle || "직관의 해답"}
                    </span>
                  </motion.div>
                ) : (isMasterMode || selectedRuneIds.length === 7) ? (
                  <motion.div key="master" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
                    <span className="text-amber-300 text-xl sm:text-2xl font-black drop-shadow-[0_0_12px_rgba(251,191,36,0.95)] animate-pulse">
                      ✦ 👑 ✦
                    </span>
                    <span className="text-sm sm:text-base font-extrabold tracking-widest text-amber-200 mt-1">
                      마스터 모드
                    </span>
                    <span className="text-[10px] sm:text-xs text-amber-300/90 mt-1 font-medium">
                      7대 차원 통합 공명 (7/7)
                    </span>
                  </motion.div>
                ) : selectedRuneIds.length >= 2 ? (
                  (() => {
                    const activeApps = selectedRuneIds
                      .map((id) => SEPTAGRAM_APPS.find((a) => a.id === id))
                      .filter(Boolean) as SeptagramAppDimension[];
                    return (
                      <motion.div key={`multi-${selectedRuneIds.length}`} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
                        <span className="text-cyan-300 text-lg sm:text-xl font-serif font-black tracking-widest drop-shadow-[0_0_10px_rgba(56,189,248,0.9)]">
                          {activeApps.map((a) => a.runeSymbol).join(" · ")}
                        </span>
                        <span className="text-sm sm:text-base font-bold tracking-wider text-cyan-200 mt-1">
                          {activeApps.length}중 연동 모드
                        </span>
                        <span className="text-[10px] sm:text-xs text-slate-300 mt-1">
                          {activeApps.map((a) => a.shortName).join(" + ")}
                        </span>
                      </motion.div>
                    );
                  })()
                ) : selectedRuneIds.length === 1 ? (
                  (() => {
                    const app = SEPTAGRAM_APPS.find((a) => a.id === selectedRuneIds[0]);
                    return (
                      <motion.div key="single" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
                        <span className="text-2xl sm:text-3xl font-serif font-black drop-shadow-[0_0_10px_rgba(255,255,255,0.85)]" style={{ color: app?.color || "#38bdf8" }}>
                          {app?.runeSymbol}
                        </span>
                        <span className="text-sm sm:text-base font-bold tracking-wider text-white mt-1">
                          {app?.name}
                        </span>
                        <span className="text-[10px] sm:text-xs text-slate-300 mt-1">
                          다른 룬 클릭 시 연동 확장
                        </span>
                      </motion.div>
                    );
                  })()
                ) : (
                  <motion.div key="casual" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
                    <span className="text-base sm:text-lg">💬</span>
                    <span className="text-sm sm:text-base font-medium tracking-wider text-slate-200 mt-1">
                      수다 모드
                    </span>
                    <span className="text-[10px] sm:text-xs text-slate-300 mt-1">
                      룬 클릭: 연동(최대 7개) · 오브 터치: 마스터
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Glass Rim Light */}
            <div className="absolute inset-x-8 bottom-1.5 h-2.5 rounded-full bg-gradient-to-t from-cyan-400/25 to-transparent blur-[1px] pointer-events-none z-30" />
          </div>
        </div>

        {/* Revealed Direct Solution Card with TTS Player */}
        <AnimatePresence>
          {scryingResult && (
            <motion.div
              ref={resultCardRef}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="w-full mt-3 sm:mt-4 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-zinc-900/90 border border-white/10 backdrop-blur-2xl shadow-2xl flex flex-col gap-3"
            >
              {/* Card Header & TTS Button */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex-1 pr-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                      scryingResult.isMaster || (scryingResult.activeRunes && scryingResult.activeRunes.length === 7)
                        ? "bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                        : "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                    }`}>
                      {scryingResult.modeTitle || "직관의 해답"}
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">
                      {scryingResult.keyTheme}
                    </h4>
                  </div>
                  {scryingResult.query && (
                    <p className="text-[11px] text-slate-400 mt-1 truncate max-w-xs">
                      Q. "{scryingResult.query}"
                    </p>
                  )}
                </div>

                {/* Right: TTS Voice Reading & Close (X) Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSpeakTTS(scryingResult)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all active:scale-95 shrink-0 ${
                      isTTSActive
                        ? "bg-cyan-500/25 text-cyan-300 border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                        : "bg-white/10 text-slate-200 border-white/15 hover:bg-white/15"
                    }`}
                    title={isTTSActive ? "낭독 중지" : "루시 음성으로 답변 듣기"}
                  >
                    {isTTSActive ? (
                      <>
                        <Square size={12} className="fill-cyan-300 text-cyan-300" />
                        <span>낭독 중지</span>
                      </>
                    ) : (
                      <>
                        <Play size={12} className="fill-slate-200 text-slate-200" />
                        <span>음성 낭독</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      stopTTS();
                      setScryingResult(null);
                    }}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/15 border border-white/10 transition-all active:scale-90"
                    title="결과창 닫기"
                    aria-label="결과창 닫기"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Direct Answer & Practical Solution */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex flex-col gap-2.5">
                <p className="text-xs sm:text-sm text-slate-100 leading-relaxed font-normal">
                  {scryingResult.directAnswer}
                </p>
                <div className="pt-2 border-t border-white/5 flex items-start gap-1.5 text-[11px] text-cyan-200/90 leading-normal">
                  <span className="font-semibold text-cyan-300 shrink-0">실천 가이드:</span>
                  <span>{scryingResult.actionSolution}</span>
                </div>
              </div>

              {/* 🌟 추천 차원 도약 (Recommended Dimension Link Banner) */}
              {scryingResult.recommendedAppId && (() => {
                const recApp = SEPTAGRAM_APPS.find((a) => a.id === scryingResult.recommendedAppId);
                if (!recApp) return null;
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-purple-950/30 to-zinc-900/70 border border-cyan-500/30 flex items-center justify-between gap-3 shadow-lg"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border font-serif font-black text-lg text-white"
                        style={{
                          background: "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.2) 0%, rgba(20,20,35,0.9) 80%)",
                          borderColor: recApp.color,
                          boxShadow: `0 0 14px ${recApp.glowColor}`,
                        }}
                      >
                        {recApp.runeSymbol}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 font-bold border border-cyan-400/40">
                            추천 차원 도약
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-white truncate">
                            {recApp.name}
                          </span>
                          <span className="text-amber-300/80 text-[11px] font-serif">
                            ({recApp.runeName} 룬)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 truncate mt-0.5">
                          {recApp.description}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleTossToDimension(recApp)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-black shadow-md hover:brightness-110 active:scale-95 transition-all shrink-0 cursor-pointer"
                      style={{
                        background: `linear-gradient(135deg, ${recApp.color}, #f59e0b)`,
                        boxShadow: `0 0 15px ${recApp.glowColor}`,
                      }}
                    >
                      <span>차원 도약</span>
                      <ArrowRight size={13} />
                    </button>
                  </motion.div>
                );
              })()}

              {/* Action Buttons: Standalone Tools & Prism Sync Indicator */}
              <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                {/* Left: Auto-Sync Confirmation Badge */}
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                  <Check size={12} className="text-emerald-400" />
                  <span>프리즘 배경지식 연동 완료</span>
                </div>

                {/* Right: Copy & Ask Again */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyResult(scryingResult)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300 transition-all active:scale-95 border border-white/10"
                    title="해답 및 실천 가이드 복사"
                  >
                    {isCopied ? (
                      <>
                        <Check size={12} className="text-emerald-400" />
                        <span className="text-emerald-300">복사됨</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>답변 복사</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => executeScrying()}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/15 hover:bg-white/20 text-white transition-all active:scale-95 border border-white/15"
                  >
                    <RotateCcw size={12} />
                    <span>다시 묻기</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      stopTTS();
                      setScryingResult(null);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all active:scale-95 border border-white/10"
                    title="결과창 닫기"
                  >
                    <X size={12} />
                    <span>닫기</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Divination Inquiry Console */}
      <footer className="relative z-40 w-full max-w-lg px-2.5 sm:px-4 pb-[calc(var(--sab)+7.75rem)] sm:pb-32 flex flex-col items-center shrink-0">
        {/* Live Auto-Detect Indicator Banner */}
        <AnimatePresence>
          {autoDetectedTitle && autoDetectedTitle !== "수다 모드" && (
            <motion.div
              initial={{ opacity: 0, y: 3, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 3, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="w-full flex items-center justify-between gap-2 px-3 py-1 mb-1.5 bg-violet-950/70 border border-violet-500/40 text-violet-200 rounded-xl text-[10px] sm:text-[11px] font-medium shadow-sm backdrop-blur-md"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Sparkles size={11} className="text-amber-300 animate-spin shrink-0" />
                <span className="text-violet-300/80 text-[10px] shrink-0 font-semibold">AI 자동 감지:</span>
                <span className="font-bold text-white truncate text-[10px] sm:text-[11px]">
                  {autoDetectedTitle}
                </span>
              </div>
              <span className="text-[9px] text-emerald-300 bg-emerald-950/90 border border-emerald-500/40 px-1.5 py-0.5 rounded-full font-bold shrink-0">
                실시간 전환됨
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Question Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (inquiry.trim()) executeScrying(inquiry);
          }}
          className="w-full flex items-center gap-1 sm:gap-2 p-1 sm:p-1.5 rounded-2xl bg-zinc-900/90 border border-white/10 backdrop-blur-2xl shadow-xl transition-all focus-within:border-cyan-400/50 focus-within:ring-2 focus-within:ring-cyan-400/20"
        >
          <input
            type="text"
            enterKeyHint="send"
            autoComplete="off"
            value={inquiry}
            onChange={(e) => setInquiry(e.target.value)}
            placeholder={
              autoDetectedTitle && autoDetectedTitle !== "직관 모드"
                ? `[${autoDetectedTitle}] 크리스탈 오브에게 물어보세요...`
                : (narrow ? "무엇이든 물어보세요..." : "크리스탈 오브에게 무엇이든 말해보세요... 음성 또는 텍스트")
            }
            className="flex-1 bg-transparent px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base text-white placeholder-slate-500 outline-none"
          />
          <button
            type="submit"
            disabled={isScrying}
            className="shrink-0 flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black active:scale-95 transition-all disabled:opacity-50 shadow-md cursor-pointer touch-manipulation"
          >
            <span>답변받기</span>
            <Send size={12} className="sm:w-[13px] sm:h-[13px]" />
          </button>
        </form>
      </footer>



      {/* 🏷️ 연동 모드 및 마스터 모드에서는 팝업메시지 제거 (단일/일반 모드에서만 표시, 데스크톱 호버 전용) */}
      <AnimatePresence>
        {!isMasterMode && selectedRuneIds.length < 2 && hoveredRuneInfo && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 3, scale: 0.9 }}
            transition={{ duration: 0.12 }}
            className="fixed z-[9999] pointer-events-none -translate-x-1/2 -translate-y-full px-3 py-1 rounded-full bg-zinc-950/95 border text-xs font-bold text-white shadow-[0_4px_24px_rgba(0,0,0,0.9)] backdrop-blur-md flex items-center gap-1.5 whitespace-nowrap select-none hidden sm:flex"
            style={{
              left: `${hoveredRuneInfo.x}px`,
              top: `${hoveredRuneInfo.y - 10}px`,
              borderColor: hoveredRuneInfo.app.color,
              boxShadow: `0 0 16px ${hoveredRuneInfo.app.glowColor}, 0 4px 18px rgba(0,0,0,0.85)`,
            }}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0 shadow-xs"
              style={{ backgroundColor: hoveredRuneInfo.app.color }}
            />
            <span style={{ color: hoveredRuneInfo.app.color }}>
              {hoveredRuneInfo.app.name}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
