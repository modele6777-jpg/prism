import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Zap,
  Radio,
  CheckCircle,
  Copy,
  Check,
  Volume2,
  VolumeX,
  ArrowRight,
  Compass,
  RefreshCw,
  Layers,
  History,
  Coins,
  ChevronDown,
  ChevronUp,
  Flame,
  Heart,
  Smile,
  MessageSquare,
  Sparkle,
  Edit3
} from 'lucide-react';
import { useApp, getPersistentUserProfile } from '@/contexts/AppContext';
import { invokeLLM } from '@/lib/ai';
import { recordPrismFeature } from '@/lib/prismOmniSync';
import {
  getLocalWishes,
  loadWishesHistory,
  deduplicateWishes,
  WishEntry,
  WISH_CATEGORIES
} from '@/lib/wishingWell';
import { auth } from '@/lib/firebase';
import { playTTS, stopTTS, useTTSActive } from '@/utils/tts';
import { safeLocalStorage } from '@/utils/safeStorage';
import {
  getDynamicVibrationalAffirmation,
  getUserCounselingVibeContext,
  generateAIVibrationalAffirmation,
  UserCounselingVibeContext
} from '@/lib/vibrationalAffirmations';

interface QuantumCatalystData {
  title: string;
  manifestationFrequency: number;
  fusionMatrix: {
    secretElement: string;
    wishWellElement: string;
    quantumLeapAlchemy: string;
  };
  sensoryScript: string;
  quantumLeapActions: string[];
  vibrationalAnchorAffirmation: string;
  secretBibleFormula: string;
  timelineWindow: string;
}

const FALLBACK_CATALYST: QuantumCatalystData = {
  title: "시크릿 끌어당김 × 소원우물 양자 도약 융합 매트릭스",
  manifestationFrequency: 528,
  fusionMatrix: {
    secretElement: "시크릿 바이블 3단계 (Ask 명확한 파동 방출 ➜ Believe 기정사실화 ➜ Receive 수용)",
    wishWellElement: "소원의 우물에 투사된 동전의 간절한 소망 에너지",
    quantumLeapAlchemy: "528Hz 솔페지오 주파수와 결합하여 미래 시점의 성취를 현재 시간대로 즉각 붕괴(Collapse)"
  },
  sensoryScript: "나는 이미 바라는 풍요와 성취의 중심에 서 있다. 손끝으로 만져지는 성공의 감촉, 가슴 벅찬 안도감과 감사함이 온몸의 세포마다 생생하게 맥동한다. 나는 끌어당기는 자이자 이미 그것이다.",
  quantumLeapActions: [
    "이미 소원이 이루어진 사람의 걸음걸이와 태도로 오늘 하루를 살아보기",
    "목표 실현에 필요한 첫 번째 결정(연락, 예약, 결제, 작성 등)을 24시간 내 즉시 실행하기",
    "자기 전 528Hz 진동을 떠올리며 감사한 결과 상태를 생생히 1분간 시각화하기"
  ],
  vibrationalAnchorAffirmation: "나의 의식 주파수는 지금 이 순간 528Hz 기적의 장에 완전히 고정되었으며, 현실은 나의 고진동을 따라 즉각 재배열된다.",
  secretBibleFormula: "Ask (명확한 주파수 방출) ➜ Believe (이미 도달한 시공간 확신) ➜ Receive (의심 없는 감사 수용)",
  timelineWindow: "지금 이 순간부터 72시간 양자 중첩 가속기 가동"
};

const MANIFESTATION_CATEGORIES = [
  {
    id: 'wealth',
    label: '금전 & 비즈니스',
    subLabel: '재정적 독립 · 무한 풍요',
    icon: '💎',
    vibe: '무한 풍요 & 기적',
    vibeId: 'abundance',
    frequency: 528,
    freqLabel: '528Hz 풍요',
    defaultWish: '월 3,000만원 이상의 자유로운 패시브 인컴과 재정적 독립'
  },
  {
    id: 'career',
    label: '커리어 & 도약',
    subLabel: '합격 · 승진 · 전문성',
    icon: '🚀',
    vibe: '자신감 & 강력한 돌파',
    vibeId: 'confidence',
    frequency: 528,
    freqLabel: '528Hz 돌파',
    defaultWish: '원하던 글로벌 프로젝트 성공 및 꿈의 포지션 안착'
  },
  {
    id: 'love',
    label: '운명적 사랑 & 인연',
    subLabel: '소울메이트 · 온기 회복',
    icon: '💖',
    vibe: '사랑 & 온기 회복',
    vibeId: 'love',
    frequency: 639,
    freqLabel: '639Hz 조화',
    defaultWish: '서로를 깊이 존중하고 영혼을 성장시키는 평생의 인연'
  },
  {
    id: 'health',
    label: '완벽한 생명력 & 활력',
    subLabel: '건강 회복 · 평온과 이완',
    icon: '🌿',
    vibe: '평온 & 불안 정화',
    vibeId: 'peace',
    frequency: 432,
    freqLabel: '432Hz 치유',
    defaultWish: '지치지 않는 에너제틱한 건강과 맑고 깊은 숙면'
  },
  {
    id: 'creative',
    label: '창작 & 영감 폭발',
    subLabel: '독창적 예술 · 직관 발현',
    icon: '🎨',
    vibe: '명료한 통찰 & 직관',
    vibeId: 'clarity',
    frequency: 741,
    freqLabel: '741Hz 영감',
    defaultWish: '세상을 놀라게 할 위대한 예술작품과 창작의 결실'
  },
  {
    id: 'freedom',
    label: '공간/시간 완전한 자유',
    subLabel: '시공간 초월 · 자유로운 삶',
    icon: '🕊️',
    vibe: '해방 & 무한한 자유',
    vibeId: 'freedom',
    frequency: 852,
    freqLabel: '852Hz 초월',
    defaultWish: '언제 어디서든 원하는 일을 하며 사는 자유로운 라이프스타일'
  },
];

function formatWishDate(dateVal: any): string {
  if (!dateVal) return '최근';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '최근';
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}일 전`;
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  } catch {
    return '최근';
  }
}

export function OrangeSynergySection() {
  const { updateSharedState } = useApp();
  const userProfile = getPersistentUserProfile();
  const [selectedCategory, setSelectedCategory] = useState<string>(MANIFESTATION_CATEGORIES[0].id);
  const [targetWish, setTargetWish] = useState<string>(MANIFESTATION_CATEGORIES[0].defaultWish);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // User Counseling Context & Real-time Vibe (Mood)
  const [vibeContext, setVibeContext] = useState<UserCounselingVibeContext>(() => getUserCounselingVibeContext());
  const [selectedVibe, setSelectedVibe] = useState<string>(() => vibeContext.currentVibe);
  const [selectedVibeId, setSelectedVibeId] = useState<string>(() => vibeContext.vibeId);
  const [isCustomVibeEditing, setIsCustomVibeEditing] = useState<boolean>(false);
  const [customVibeInputText, setCustomVibeInputText] = useState<string>('');
  const [isAffirmationGenerating, setIsAffirmationGenerating] = useState<boolean>(false);

  const [catalystData, setCatalystData] = useState<QuantumCatalystData>(() => {
    const initialContext = getUserCounselingVibeContext();
    const { affirmation } = getDynamicVibrationalAffirmation(
      MANIFESTATION_CATEGORIES[0].id,
      MANIFESTATION_CATEGORIES[0].defaultWish,
      528,
      0,
      initialContext
    );
    return {
      ...FALLBACK_CATALYST,
      vibrationalAnchorAffirmation: affirmation
    };
  });

  const [isSynthesized, setIsSynthesized] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedAffirmation, setCopiedAffirmation] = useState<boolean>(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [dialValue, setDialValue] = useState<number>(528);
  const [recentWishingWellWish, setRecentWishingWellWish] = useState<string | null>(null);
  const [wishesHistory, setWishesHistory] = useState<WishEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(true);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState<boolean>(false);
  const [affirmationCycleIndex, setAffirmationCycleIndex] = useState<number>(0);
  const [isAffirmationSpeaking, setIsAffirmationSpeaking] = useState<boolean>(false);
  const isTTSActive = useTTSActive();

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);

  // Refresh counseling & vibe context when component loads
  useEffect(() => {
    const updated = getUserCounselingVibeContext();
    setVibeContext(updated);
    if (!safeLocalStorage.getItem('orange_catalyst_user_vibe')) {
      setSelectedVibe(updated.currentVibe);
      setSelectedVibeId(updated.vibeId);
    }
  }, []);

  // Load wishing well history (both local and cloud)
  const fetchWishesHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const uid = auth.currentUser?.uid || 'guest';
      const remoteList = await loadWishesHistory(uid);
      const guestList = getLocalWishes('guest');
      const nickList = userProfile?.basic?.nickname ? getLocalWishes(userProfile.basic.nickname) : [];
      const userList = uid !== 'guest' ? getLocalWishes(uid) : [];
      const merged = deduplicateWishes([...remoteList, ...userList, ...guestList, ...nickList]);
      setWishesHistory(merged);
      if (merged.length > 0) {
        setRecentWishingWellWish(merged[0].wish);
      }
    } catch (e) {
      console.warn('[OrangeSynergySection] Error loading wishes history:', e);
    } finally {
      setLoadingHistory(false);
    }
  }, [userProfile?.basic?.nickname]);

  useEffect(() => {
    fetchWishesHistory();

    const handleWishCast = () => {
      fetchWishesHistory();
    };
    window.addEventListener('prism:wish_cast', handleWishCast);
    return () => {
      window.removeEventListener('prism:wish_cast', handleWishCast);
    };
  }, [fetchWishesHistory]);

  const toggle528Hz = () => {
    if (isAudioPlaying) {
      try {
        oscRef.current?.stop();
        audioCtxRef.current?.close();
      } catch (e) {}
      audioCtxRef.current = null;
      oscRef.current = null;
      setIsAudioPlaying(false);
    } else {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(dialValue || 528, ctx.currentTime);

        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        oscRef.current = osc;
        setIsAudioPlaying(true);
      } catch (e) {
        console.warn('528Hz audio synthesis error:', e);
      }
    }
  };

  useEffect(() => {
    return () => {
      try {
        oscRef.current?.stop();
        audioCtxRef.current?.close();
      } catch (e) {}
      stopTTS();
    };
  }, []);

  const handleSpeakCatalyst = () => {
    if (isTTSActive) {
      stopTTS();
    } else {
      const speech = `양자 현실화 오감 스크립트입니다. ${catalystData.sensoryScript} 주파수 고정 진동 확언입니다. ${catalystData.vibrationalAnchorAffirmation}`;
      playTTS(speech, 'Kore', false, '확신');
    }
  };

  const handleSpeakAffirmation = () => {
    if (isTTSActive || isAffirmationSpeaking) {
      stopTTS();
      setIsAffirmationSpeaking(false);
    } else {
      setIsAffirmationSpeaking(true);
      playTTS(catalystData.vibrationalAnchorAffirmation, 'Kore', false, '확신');
      setTimeout(() => setIsAffirmationSpeaking(false), 8000);
    }
  };

  const handleCopyAffirmation = () => {
    navigator.clipboard.writeText(catalystData.vibrationalAnchorAffirmation);
    setCopiedAffirmation(true);
    setTimeout(() => setCopiedAffirmation(false), 2000);
  };

  // 🎲 Dynamic Affirmation Generation & Shuffle attuned to Counseling Topic & Current Vibe
  const cycleNextAffirmation = async (delta: number = 1) => {
    const nextIdx = affirmationCycleIndex + delta;
    setAffirmationCycleIndex(nextIdx);
    setIsAffirmationGenerating(true);

    // 1. Immediately apply fast procedural vibe-attuned synthesis
    const { affirmation } = getDynamicVibrationalAffirmation(
      selectedCategory,
      targetWish,
      dialValue,
      nextIdx,
      {
        counselingTopic: vibeContext.counselingTopic,
        currentVibe: selectedVibe
      }
    );
    setCatalystData(prev => ({
      ...prev,
      vibrationalAnchorAffirmation: affirmation
    }));

    // 2. Asynchronously request AI-generated dynamic affirmation tailored to counseling + vibe
    try {
      const aiAffirmation = await generateAIVibrationalAffirmation({
        category: selectedCategory,
        wish: targetWish,
        frequency: dialValue,
        counselingTopic: vibeContext.counselingTopic,
        currentVibe: selectedVibe,
        cycleOffset: nextIdx
      });

      if (aiAffirmation && aiAffirmation.length >= 15) {
        setCatalystData(prev => ({
          ...prev,
          vibrationalAnchorAffirmation: aiAffirmation
        }));
      }
    } catch (e) {
      console.warn('[OrangeSynergySection] AI affirmation generation error:', e);
    } finally {
      setIsAffirmationGenerating(false);
    }
  };

  // Custom Vibe Submission
  const handleCustomVibeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customVibeInputText.trim()) return;

    const trimmed = customVibeInputText.trim();
    setSelectedVibe(trimmed);
    setSelectedVibeId('custom');
    safeLocalStorage.setItem('orange_catalyst_user_vibe', trimmed);
    setIsCustomVibeEditing(false);
    setCustomVibeInputText('');

    const nextIdx = affirmationCycleIndex + 1;
    setAffirmationCycleIndex(nextIdx);
    const { affirmation } = getDynamicVibrationalAffirmation(
      selectedCategory,
      targetWish,
      dialValue,
      nextIdx,
      {
        counselingTopic: vibeContext.counselingTopic,
        currentVibe: trimmed
      }
    );
    setCatalystData(prev => ({
      ...prev,
      vibrationalAnchorAffirmation: affirmation
    }));
  };

  const handleCategorySelect = (cat: typeof MANIFESTATION_CATEGORIES[0]) => {
    setSelectedCategory(cat.id);
    setTargetWish(cat.defaultWish);
    setSelectedVibe(cat.vibe);
    setSelectedVibeId(cat.vibeId);
    setDialValue(cat.frequency);

    const nextIdx = affirmationCycleIndex + 1;
    setAffirmationCycleIndex(nextIdx);
    const { affirmation } = getDynamicVibrationalAffirmation(
      cat.id,
      cat.defaultWish,
      cat.frequency,
      nextIdx,
      {
        counselingTopic: vibeContext.counselingTopic,
        currentVibe: cat.vibe
      }
    );
    setCatalystData(prev => ({
      ...prev,
      manifestationFrequency: cat.frequency,
      vibrationalAnchorAffirmation: affirmation
    }));
  };

  const handleDialChange = (freq: number) => {
    setDialValue(freq);
    const nextIdx = affirmationCycleIndex + 1;
    setAffirmationCycleIndex(nextIdx);
    const { affirmation } = getDynamicVibrationalAffirmation(
      selectedCategory,
      targetWish,
      freq,
      nextIdx,
      {
        counselingTopic: vibeContext.counselingTopic,
        currentVibe: selectedVibe
      }
    );
    setCatalystData(prev => ({
      ...prev,
      manifestationFrequency: freq,
      vibrationalAnchorAffirmation: affirmation
    }));
  };

  const handleSelectWishFromHistory = (entry: WishEntry) => {
    setTargetWish(entry.wish);
    // Find matching category if any
    const cat = MANIFESTATION_CATEGORIES.find(c => 
      c.id === entry.category ||
      (entry.category === 'inner_peace' && c.id === 'health') ||
      (entry.category === 'self_love' && c.id === 'love') ||
      (entry.category === 'courage' && c.id === 'career') ||
      (entry.category === 'dream' && c.id === 'creative') ||
      (entry.category === 'relationship' && c.id === 'love')
    ) || MANIFESTATION_CATEGORIES[0];

    setSelectedCategory(cat.id);
    setSelectedVibe(cat.vibe);
    setSelectedVibeId(cat.vibeId);
    setDialValue(cat.frequency);

    const nextIdx = affirmationCycleIndex + 1;
    setAffirmationCycleIndex(nextIdx);
    const { affirmation } = getDynamicVibrationalAffirmation(
      cat.id,
      entry.wish,
      cat.frequency,
      nextIdx,
      {
        counselingTopic: vibeContext.counselingTopic,
        currentVibe: cat.vibe
      }
    );
    setCatalystData(prev => ({
      ...prev,
      manifestationFrequency: cat.frequency,
      vibrationalAnchorAffirmation: affirmation
    }));
  };

  const handleAccelerateManifestation = async () => {
    setIsLoading(true);
    const catObj = MANIFESTATION_CATEGORIES.find(c => c.id === selectedCategory);
    const categoryName = catObj ? catObj.label : '목표';

    const systemPrompt = "당신은 오렌지 양자 현실화 가속기(Quantum Catalyst) 마스터입니다. 좌측 메뉴 [Secret]의 내면아이 진동 일치/끌어당김 원리와 우측 메뉴 [WELL]의 소원의 우물 투사 및 즉각적 현실화 에너지를 완벽히 융합하여 이미 실현된 상태의 오감 스크립트와 융합 매트릭스를 생성하세요.";
    const userPrompt = `[양쪽 메뉴 융합: SECRET 끌어당김 진동 ✕ WELL 소원 투사]
[소원 카테고리]: ${categoryName}
[실현 목표]: "${targetWish}"
[사용자]: "${userProfile?.basic?.nickname || '창조자'}"
[조율 주파수]: ${dialValue}Hz
[사용자 최근 상담 맥락]: "${vibeContext.counselingTopic}" (${vibeContext.sourceDescription})
[사용자 현재 기분(Vibe)]: "${selectedVibe}"
[소원의 우물 최근 연동]: ${recentWishingWellWish ? `"${recentWishingWellWish}"` : '새로운 소원 투사'}

반드시 아래 JSON 스키마로만 엄격하게 응답하세요:
{
  "title": "양자 현실화 고유 명칭 (예: ${dialValue}Hz 황금 풍요 양자 도약 가속기)",
  "manifestationFrequency": ${dialValue},
  "fusionMatrix": {
    "secretElement": "시크릿 바이블의 끌어당김 및 주파수 일치 원리가 이 소원에 작동하는 방식 (1~2문장)",
    "wishWellElement": "소원의 우물에 던져진 간절한 염원이 양자장에 각인되는 원리 (1~2문장)",
    "quantumLeapAlchemy": "양쪽 메뉴가 융합되어 즉각적으로 시공간을 접어 현실화하는 양자 도약 결과 (1~2문장)"
  },
  "sensoryScript": "1인칭 현재형으로 이미 완벽하게 이루어졌을 때의 시각·청각·촉각·감정을 묘사한 생생한 스크립트 (3~4문장)",
  "quantumLeapActions": [
    "24시간 내 즉시 실행할 양자 도약 실천 1 (구체적 행동)",
    "24시간 내 즉시 실행할 양자 도약 실천 2 (마인드셋/환경 전환)",
    "24시간 내 즉시 실행할 양자 도약 실천 3 (취침 전 감사 시각화)"
  ],
  "vibrationalAnchorAffirmation": "상투적이거나 중복된 뻔한 문장을 절대 금지하고, 사용자의 최근 상담 고민('${vibeContext.counselingTopic}')의 저항을 해소하고 현재 기분('${selectedVibe}')의 주파수와 결합하여 '${targetWish}'과 ${dialValue}Hz를 온몸에 각인시키는 전율 돋는 독창적인 1인칭 현재형 고진동 확언 (1문장, 45~80자 내외)",
  "secretBibleFormula": "시크릿 바이블 3단계 맞춤 가이드라인 (Ask - Believe - Receive)",
  "timelineWindow": "가속화 타임라인 주기 (예: 72시간 양자 중첩 포털 활성화)"
}`;

    const fallbackAffirmation = getDynamicVibrationalAffirmation(
      selectedCategory,
      targetWish,
      dialValue,
      affirmationCycleIndex + 1,
      {
        counselingTopic: vibeContext.counselingTopic,
        currentVibe: selectedVibe
      }
    ).affirmation;

    const safetyTimeout = new Promise<QuantumCatalystData>((resolve) => {
      setTimeout(() => {
        resolve({
          ...FALLBACK_CATALYST,
          title: `〈${categoryName}〉 ${dialValue}Hz 양자 현실화 가속기`,
          manifestationFrequency: dialValue,
          sensoryScript: `나는 이미 '${targetWish}'을(를) 완벽하게 손에 쥐고 풍요를 누리고 있다. ${dialValue}Hz 기적의 파동이 '${selectedVibe}'의 고진동에 공명하며 물질세계로 즉각 현실화된다. 온몸의 세포마다 벅찬 감사의 눈물이 샘솟는다.`,
          vibrationalAnchorAffirmation: fallbackAffirmation
        });
      }, 6500);
    });

    const runAI = async (): Promise<QuantumCatalystData> => {
      try {
        const raw = await invokeLLM({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          responseFormat: { type: 'json_object' }
        });
        const parsed = typeof raw === 'string' ? JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim()) : raw;
        if (parsed && parsed.sensoryScript) {
          if (!parsed.vibrationalAnchorAffirmation || parsed.vibrationalAnchorAffirmation.length < 10) {
            parsed.vibrationalAnchorAffirmation = fallbackAffirmation;
          }
          return parsed;
        }
      } catch (e) {
        console.warn('[OrangeSynergy] invokeLLM error:', e);
      }
      throw new Error('Need fallback');
    };

    try {
      const result = await Promise.race([runAI(), safetyTimeout]);
      setCatalystData(result);
      setIsSynthesized(true);
      recordPrismFeature({
        app: 'orange',
        featureName: 'Orange Quantum Catalyst Synergy',
        summary: result.title,
        details: { category: categoryName, wish: targetWish, vibe: selectedVibe }
      });
      updateSharedState({}, 'ORANGE');
    } catch (e) {
      console.warn('Catalyst error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    const text = `🌲 [${catalystData.title}]\n\n🎯 목표 소원: ${targetWish}\n🌀 진동 주파수: ${catalystData.manifestationFrequency}Hz\n✨ 조율 Vibe: ${selectedVibe}\n\n✨ 이미 이루어진 오감 스크립트:\n"${catalystData.sensoryScript}"\n\n🚀 24시간 양자 도약 실천 행동:\n${catalystData.quantumLeapActions.map((a, i) => `${i+1}. ${a}`).join('\n')}\n\n⚡ 주파수 고정 확언:\n"${catalystData.vibrationalAnchorAffirmation}"\n\n- PRISM ORANGE Quantum Manifestation Catalyst`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-12 text-white font-sans">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 border border-orange-500/30 bg-gradient-to-br from-orange-950/50 via-zinc-950/90 to-amber-950/40 shadow-[0_0_50px_rgba(249,115,22,0.15)] backdrop-blur-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-orange-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-amber-500/10 blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold font-mono tracking-widest uppercase bg-orange-500/20 text-orange-300 border border-orange-500/30 flex items-center gap-1.5">
                <Sparkles size={12} className="text-yellow-400 animate-pulse" />
                SECRET ✕ WELL FUSION
              </span>
              <span className="text-[10px] text-white/40 font-mono">{dialValue}Hz MIRACLE TONE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Zap className="text-orange-400 drop-shadow-[0_0_12px_rgba(249,115,22,0.8)]" size={28} />
              <span>양자 현실화 가속기 (Quantum Manifestation Catalyst)</span>
            </h2>
            <p className="text-xs sm:text-sm text-orange-100/70 max-w-xl leading-relaxed">
              <strong>Secret(끌어당김 진동 일치)</strong>과 <strong>WELL(소원의 우물 투사)</strong>의 양쪽 메뉴 에너지를 융합하여, 바라는 미래를 현재 시점으로 즉각 붕괴시키는 〈양자 현실화 가속기〉입니다.
            </p>
          </div>

          <button
            onClick={toggle528Hz}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold font-sans flex items-center gap-2 border transition-all cursor-pointer shrink-0 ${
              isAudioPlaying
                ? 'bg-orange-500 text-white border-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.6)] animate-pulse'
                : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'
            }`}
          >
            {isAudioPlaying ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{isAudioPlaying ? `${dialValue}Hz 주파수 재생 중` : `${dialValue}Hz 주파수 켜기`}</span>
          </button>
        </div>
      </div>

      {/* Dual-Menu Synergy Status Panel */}
      <div className="p-5 sm:p-6 rounded-[28px] bg-gradient-to-r from-orange-950/40 via-amber-950/30 to-yellow-950/40 border border-orange-500/20 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Layers className="text-orange-400" size={16} />
            <span className="text-xs font-bold text-orange-200 font-mono tracking-wider uppercase">
              DUAL-MENU SYNERGY MATRIX : THE SECRET × WISHING WELL
            </span>
          </div>
          <span className="text-[10px] text-white/50 font-mono">
            {dialValue}Hz 기적 진동 동조
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Menu Status: The Secret 3-Step */}
          <div className="p-4 rounded-2xl bg-black/30 border border-orange-400/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-orange-300 flex items-center gap-1.5">
                <Zap size={13} className="text-orange-400" />
                좌측 메뉴 : 시크릿 끌어당김 3단계 공식
              </span>
              <span className="text-[10px] text-orange-400 font-mono">진동 일치</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="p-2 rounded-xl bg-white/[0.04] border border-white/5">
                <div className="text-[9px] text-white/50">STEP 1</div>
                <div className="text-xs font-bold text-orange-200 font-sans">Ask (요청)</div>
                <div className="text-[9px] text-white/40 mt-0.5">명확한 방출</div>
              </div>
              <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-400/30">
                <div className="text-[9px] text-orange-300">STEP 2</div>
                <div className="text-xs font-bold text-white font-sans">Believe (믿음)</div>
                <div className="text-[9px] text-orange-200/60 mt-0.5">기정사실화</div>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.04] border border-white/5">
                <div className="text-[9px] text-white/50">STEP 3</div>
                <div className="text-xs font-bold text-yellow-200 font-sans">Receive (수용)</div>
                <div className="text-[9px] text-white/40 mt-0.5">감사의 진동</div>
              </div>
            </div>
          </div>

          {/* Right Menu Status: Wishing Well (소원의 우물 과거 투사 기록 리스트) */}
          <div className="p-4 rounded-2xl bg-black/30 border border-amber-400/25 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Compass size={14} className="text-amber-400" />
                <span className="text-[11px] font-bold text-amber-300">
                  우측 메뉴 : 소원의 우물 동전 투사
                </span>
                <span className="text-[9px] text-amber-300 font-mono font-bold bg-amber-500/15 border border-amber-400/25 px-1.5 py-0.5 rounded-full">
                  과거 투사 {wishesHistory.length}건
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => fetchWishesHistory()}
                  title="기록 새로고침"
                  className="p-1 rounded-lg text-white/40 hover:text-amber-300 hover:bg-white/5 transition-all cursor-pointer"
                >
                  <RefreshCw size={11} className={loadingHistory ? 'animate-spin text-amber-400' : ''} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('prism-tab-change', { detail: { tab: 'wishingWell' } }));
                    }
                  }}
                  className="text-[10px] text-amber-300/80 hover:text-amber-200 flex items-center gap-0.5 transition-all cursor-pointer"
                >
                  <span>우물 가기</span>
                  <ArrowRight size={10} />
                </button>
              </div>
            </div>

            {/* Past Wish Records Display */}
            {loadingHistory ? (
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center text-[11px] text-white/40 flex items-center justify-center gap-2">
                <RefreshCw size={12} className="animate-spin text-amber-400" />
                <span>과거 투사된 동전의 소원을 불러오는 중...</span>
              </div>
            ) : wishesHistory.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] text-amber-200/60 font-mono">
                  <span>과거 투사 기록 (클릭 시 아래 목표로 자동 입력):</span>
                  {wishesHistory.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                      className="text-amber-300 hover:text-amber-200 flex items-center gap-0.5 underline cursor-pointer"
                    >
                      <span>{isHistoryExpanded ? '접기 (최근 2개)' : `더보기 (총 ${wishesHistory.length}개)`}</span>
                      {isHistoryExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                    </button>
                  )}
                </div>

                <div className={`space-y-1.5 overflow-y-auto pr-1 ${isHistoryExpanded ? 'max-h-56' : 'max-h-36'}`}>
                  {(isHistoryExpanded ? wishesHistory : wishesHistory.slice(0, 2)).map((item, idx) => {
                    const isSelected = targetWish === item.wish;
                    const catMeta = WISH_CATEGORIES.find(c => c.id === item.category);

                    return (
                      <div
                        key={item.id || idx}
                        onClick={() => handleSelectWishFromHistory(item)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer group ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400/80 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                            : 'bg-white/[0.03] hover:bg-amber-500/10 border-white/10 hover:border-amber-400/30'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                              {catMeta?.emoji || '🪙'} {item.categoryLabel || catMeta?.label || '소원'}
                            </span>
                            {item.crystalKeyword && (
                              <span className="text-[9px] text-yellow-200/80 font-mono bg-yellow-500/10 px-1 rounded border border-yellow-500/20">
                                ✨ {item.crystalKeyword}
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] text-white/40 font-mono shrink-0">
                            {formatWishDate(item.createdAt)}
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-white/90 group-hover:text-amber-100 transition-colors line-clamp-2">
                          "{item.wish}"
                        </p>

                        <div className="mt-1 flex items-center justify-between text-[9px]">
                          <span className="text-amber-400/70 group-hover:text-amber-300 font-mono flex items-center gap-1">
                            <Sparkles size={9} />
                            {isSelected ? '현재 가속 목표 선택됨' : '목표로 불러오기'}
                          </span>
                          {isSelected && (
                            <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                              <CheckCircle size={10} /> 활성
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center space-y-2">
                <p className="text-[11px] text-white/50">아직 우물에 투사된 동전 소원이 없습니다.</p>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('prism-tab-change', { detail: { tab: 'wishingWell' } }));
                    }
                  }}
                  className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                >
                  <Sparkles size={11} className="text-amber-400" />
                  <span>소원의 우물에서 동전 던지기</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Target Wish Formulation Card */}
      <div className="glass p-6 sm:p-8 rounded-[32px] border border-white/10 space-y-6">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-orange-300 flex items-center gap-2 font-mono uppercase tracking-wider">
            <Radio size={16} className="text-orange-400" />
            <span>현실화 핵심 영역 선택</span>
          </label>
          <span className="text-[10px] text-white/40 font-sans">양자장 동판 각인</span>
        </div>

        {/* Category Chips - Unified Single Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {MANIFESTATION_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat)}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between gap-2.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-orange-500/25 border-orange-400/90 text-white shadow-[0_0_20px_rgba(249,115,22,0.35)] scale-[1.02] ring-1 ring-orange-400/50'
                    : 'bg-white/[0.03] border-white/10 text-white/70 hover:bg-white/5 hover:text-white hover:border-orange-400/30'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl shrink-0">{cat.icon}</span>
                  <div className="min-w-0">
                    <span className="text-xs font-bold font-sans block truncate text-white">{cat.label}</span>
                    <span className="text-[10px] text-white/40 block truncate">{cat.subLabel}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[9px] font-mono pt-1.5 border-t border-white/5">
                  <span className={isSelected ? 'text-amber-300 font-bold' : 'text-white/40'}>
                    {cat.freqLabel}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded-full truncate max-w-[110px] ${isSelected ? 'bg-orange-500/30 text-orange-200 font-bold' : 'bg-white/5 text-white/40'}`}>
                    {cat.vibe}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Target Wish Input */}
        <div>
          <label className="block text-[11px] text-white/60 mb-2 font-medium">
            현실화할 소망을 구체적으로 확정하세요 (이미 이루어진 것처럼 작성하면 가속화됩니다):
          </label>
          <textarea
            rows={3}
            value={targetWish}
            onChange={(e) => {
              setTargetWish(e.target.value);
              const { affirmation } = getDynamicVibrationalAffirmation(
                selectedCategory,
                e.target.value,
                dialValue,
                affirmationCycleIndex,
                { counselingTopic: vibeContext.counselingTopic, currentVibe: selectedVibe }
              );
              setCatalystData(prev => ({ ...prev, vibrationalAnchorAffirmation: affirmation }));
            }}
            placeholder="예: 2026년 가을까지 온전한 경제적 자유를 이루고 사랑하는 사람들과 함께 세계를 여행한다..."
            className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-orange-400/60 leading-relaxed resize-none font-sans"
          />
          {recentWishingWellWish && targetWish !== recentWishingWellWish && (
            <button
              type="button"
              onClick={() => {
                setTargetWish(recentWishingWellWish);
                const { affirmation } = getDynamicVibrationalAffirmation(
                  selectedCategory,
                  recentWishingWellWish,
                  dialValue,
                  affirmationCycleIndex,
                  { counselingTopic: vibeContext.counselingTopic, currentVibe: selectedVibe }
                );
                setCatalystData(prev => ({ ...prev, vibrationalAnchorAffirmation: affirmation }));
              }}
              className="text-[11px] text-orange-300 hover:text-orange-200 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all cursor-pointer mt-2"
            >
              <Sparkles size={12} className="text-orange-400 animate-pulse" />
              <span>우물 최근 소원 적용: "{recentWishingWellWish.slice(0, 30)}{recentWishingWellWish.length > 30 ? '...' : ''}"</span>
            </button>
          )}
        </div>

        {/* 🌟 Real-time Counseling Topic & Vibe Tuning Panel */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 via-orange-950/30 to-zinc-950/60 border border-orange-400/30 space-y-3 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-orange-500/20 text-orange-300 border border-orange-500/30">
                <Smile size={14} className="text-amber-400" />
              </span>
              <div>
                <div className="text-[11px] font-bold text-orange-200 font-mono tracking-wide uppercase flex items-center gap-1.5">
                  <span>상담 맥락 & 현재 Vibe(기분) 동적 연동</span>
                  <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded font-mono">
                    REALTIME SYNC
                  </span>
                </div>
                <div className="text-[10px] text-white/50 flex items-center gap-1">
                  <span>최근 상담 맥락:</span>
                  <strong className="text-orange-300 font-normal">"{vibeContext.counselingTopic}"</strong>
                  <span className="text-[9px] text-white/40">({vibeContext.sourceDescription})</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setIsCustomVibeEditing(!isCustomVibeEditing)}
                className="text-[10px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 flex items-center gap-1 transition-all cursor-pointer"
              >
                <Edit3 size={10} />
                <span>{isCustomVibeEditing ? '닫기' : '기분 직접 입력'}</span>
              </button>
            </div>
          </div>

          {/* Custom Vibe Input Form (Optional) */}
          {isCustomVibeEditing && (
            <form onSubmit={handleCustomVibeSubmit} className="flex gap-2 pt-1 pb-1">
              <input
                type="text"
                value={customVibeInputText}
                onChange={(e) => setCustomVibeInputText(e.target.value)}
                placeholder="현재 기분/원하는 Vibe를 직접 적어주세요 (예: 답답함을 뚫는 시원한 해방감)..."
                className="flex-1 px-3 py-1.5 rounded-xl bg-black/60 border border-orange-400/40 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-orange-400 font-sans"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-bold text-xs shrink-0 cursor-pointer"
              >
                적용
              </button>
            </form>
          )}

          {/* Current tuned Vibe indicator */}
          <div className="flex items-center justify-between text-[11px] bg-black/30 p-2.5 rounded-xl border border-white/5">
            <span className="text-white/60">선택된 핵심 영역 공명 Vibe:</span>
            <span className="text-amber-300 font-bold font-mono">"{selectedVibe}"</span>
          </div>
        </div>

        {/* Frequency Tuning Bar */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Zap size={14} className="text-yellow-400" />
              양자 진동수 조율: <strong className="text-orange-400 font-mono">{dialValue}Hz</strong>
            </span>
            <p className="text-[10px] text-white/40">솔페지오 주파수에 맞춰 의식과 세포의 진동을 정렬합니다.</p>
          </div>
          <div className="flex gap-2">
            {[432, 528, 639, 741, 852].map((freq) => (
              <button
                key={freq}
                onClick={() => handleDialChange(freq)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  dialValue === freq
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-white/5 text-white/50 hover:text-white'
                }`}
              >
                {freq}Hz
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Vibrational Anchor Affirmation Interactive Preview Card */}
        {!isSynthesized && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-orange-950/40 via-amber-950/30 to-yellow-950/30 border border-orange-500/30 space-y-2.5 shadow-inner">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] text-orange-300 font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Zap size={13} className="text-yellow-400" />
                  VIBRATIONAL ANCHOR AFFIRMATION (주파수 고정 진동 확언)
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 font-mono border border-orange-400/30">
                  {dialValue}Hz 동조
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 font-mono border border-amber-400/30">
                  VIBE: {selectedVibe}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => cycleNextAffirmation(1)}
                  disabled={isAffirmationGenerating}
                  title="상담 주제와 현재 기분(Vibe)에 맞춰 매번 새로운 고진동 확언으로 동적 교체"
                  className="px-2.5 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-200 border border-orange-500/30 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw size={11} className={`text-orange-300 ${isAffirmationGenerating ? 'animate-spin' : ''}`} />
                  <span>{isAffirmationGenerating ? '확언 조율 중...' : '확언 셔플'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleSpeakAffirmation}
                  title="확언 음성 낭독"
                  className={`p-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
                    isAffirmationSpeaking
                      ? 'bg-amber-500 text-white border-amber-400 animate-pulse'
                      : 'bg-white/5 hover:bg-white/10 text-white/70 border-white/10'
                  }`}
                >
                  {isAffirmationSpeaking ? <VolumeX size={12} /> : <Volume2 size={12} />}
                </button>
                <button
                  type="button"
                  onClick={handleCopyAffirmation}
                  title="확언 문장 복사"
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 text-xs transition-all cursor-pointer"
                >
                  {copiedAffirmation ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            <p className="text-xs sm:text-sm font-bold text-amber-100 leading-relaxed tracking-tight break-keep">
              "{catalystData.vibrationalAnchorAffirmation}"
            </p>

            <div className="text-[10px] text-white/40 flex items-center gap-1 font-mono">
              <Sparkles size={10} className="text-amber-400" />
              <span>최근 대화 상담 맥락 및 '{selectedVibe}' Vibe 파동이 결합되어 실시간 생성된 확언입니다.</span>
            </div>
          </div>
        )}

        <button
          onClick={handleAccelerateManifestation}
          disabled={isLoading}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 text-black font-black text-sm tracking-wider uppercase transition-all shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_40px_rgba(249,115,22,0.6)] active:scale-[0.99] flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <RefreshCw size={18} className="animate-spin text-black" />
              <span>시크릿 & 소원의 우물 양자장 가속 중...</span>
            </>
          ) : (
            <>
              <Sparkles size={18} className="text-black" />
              <span>〈양자 현실화 가속기 & 오감 스크립트〉 즉시 가동</span>
            </>
          )}
        </button>
      </div>

      {/* Synthesized Output Display */}
      {isSynthesized && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-[36px] sm:rounded-[44px] bg-gradient-to-b from-zinc-900/95 via-zinc-950/95 to-black/95 border border-orange-500/30 p-6 sm:p-10 space-y-8 shadow-2xl relative overflow-hidden backdrop-blur-2xl"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-orange-400">
                  QUANTUM MANIFESTATION CERTIFICATE
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-300 border border-yellow-500/20 font-mono">
                  {catalystData.manifestationFrequency}Hz
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono">
                  {selectedVibe}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">{catalystData.title}</h3>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <button
                onClick={handleSpeakCatalyst}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isTTSActive
                    ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 animate-pulse'
                    : 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-200 border border-orange-500/30'
                }`}
              >
                {isTTSActive ? <VolumeX size={14} className="text-amber-300" /> : <Volume2 size={14} className="text-orange-300" />}
                <span>{isTTSActive ? '낭독 중단' : '오감 스크립트 음성 낭독'}</span>
              </button>

              <button
                onClick={handleCopy}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copied ? '복사 완료' : '전체 스크립트 복사'}</span>
              </button>
            </div>
          </div>

          {/* Fusion Matrix Report */}
          {catalystData.fusionMatrix && (
            <div className="p-5 rounded-3xl bg-orange-950/30 border border-orange-400/30 space-y-3">
              <div className="flex items-center gap-2 text-orange-300 text-xs font-bold font-mono uppercase tracking-wider">
                <Layers size={14} className="text-orange-400" />
                <span>양쪽 메뉴 융합 매트릭스 (Fusion Matrix)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                  <div className="text-[10px] font-bold text-orange-400">좌측 : 시크릿 끌어당김 진동</div>
                  <div className="text-xs text-white/80 font-sans leading-relaxed">{catalystData.fusionMatrix.secretElement}</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                  <div className="text-[10px] font-bold text-amber-400">우측 : 소원 우물 투사 각인</div>
                  <div className="text-xs text-white/80 font-sans leading-relaxed">{catalystData.fusionMatrix.wishWellElement}</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-black/40 border border-yellow-500/30 space-y-1">
                  <div className="text-[10px] font-bold text-yellow-300">융합 : 양자 도약 연금술</div>
                  <div className="text-xs text-white/80 font-sans leading-relaxed">{catalystData.fusionMatrix.quantumLeapAlchemy}</div>
                </div>
              </div>
            </div>
          )}

          {/* Sensory Script Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-orange-900/30 via-zinc-900/50 to-yellow-900/20 border border-orange-400/40 relative shadow-inner space-y-3">
            <span className="text-[10px] font-mono text-orange-300 uppercase tracking-widest font-bold flex items-center gap-1.5">
              <Sparkles size={14} className="text-yellow-400" />
              이미 이루어진 오감 현실화 스크립트 (Sensory Script)
            </span>
            <p className="text-base sm:text-lg font-bold text-white leading-relaxed tracking-tight break-keep">
              "{catalystData.sensoryScript}"
            </p>
          </div>

          {/* 3 Quantum Leap Actions */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-orange-300 uppercase font-mono tracking-wider flex items-center gap-2">
              <Zap size={14} /> 24시간 내 즉시 실행할 양자 도약 실천 3가지
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {catalystData.quantumLeapActions.map((act, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                  <span className="text-[10px] font-mono font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md">
                    LEAP #{idx + 1}
                  </span>
                  <p className="text-xs text-white/80 leading-relaxed font-sans">{act}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Affirmation & Formula Banner */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-orange-950/50 via-amber-950/40 to-yellow-950/30 border border-orange-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] text-orange-300 font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Zap size={12} className="text-yellow-400" />
                  VIBRATIONAL ANCHOR AFFIRMATION (주파수 고정 진동 확언)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 font-mono border border-orange-400/30">
                  {catalystData.manifestationFrequency}Hz 동조
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 font-mono border border-amber-400/30">
                  VIBE: {selectedVibe}
                </span>
              </div>
              <p className="text-sm sm:text-base font-bold text-amber-200 leading-relaxed break-keep">
                "{catalystData.vibrationalAnchorAffirmation}"
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={() => cycleNextAffirmation(1)}
                disabled={isAffirmationGenerating}
                title="상담 맥락과 현재 Vibe에 맞춰 다른 고진동 확언으로 동적 교체 (셔플)"
                className="px-3 py-2 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-200 border border-orange-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <RefreshCw size={13} className={`text-orange-300 ${isAffirmationGenerating ? 'animate-spin' : ''}`} />
                <span>{isAffirmationGenerating ? '조율 중...' : '확언 셔플'}</span>
              </button>
              <button
                type="button"
                onClick={handleSpeakAffirmation}
                title="확언 음성 낭독"
                className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  isAffirmationSpeaking
                    ? 'bg-amber-500 text-white border-amber-400 animate-pulse'
                    : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'
                }`}
              >
                {isAffirmationSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
              <button
                type="button"
                onClick={handleCopyAffirmation}
                title="확언 문장 복사"
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 text-xs font-bold transition-all cursor-pointer"
              >
                {copiedAffirmation ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
