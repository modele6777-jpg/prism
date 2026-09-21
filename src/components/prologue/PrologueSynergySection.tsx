import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Sparkles, HeartPulse, Compass, RefreshCw, Volume2, VolumeX, CheckCircle, Copy, Check, Flame, ShieldAlert, Award, Zap, ArrowRight, Sun, Play, Square } from 'lucide-react';
import { useApp, getPersistentUserProfile } from '@/contexts/AppContext';
import { invokeLLM } from '@/lib/ai';
import { recordPrismFeature } from '@/lib/prismOmniSync';
import { playTTS, stopTTS, useTTSActive } from '@/utils/tts';

interface AegisData {
  title: string;
  stoicQuote: string;
  quoteAuthor: string;
  resilienceShieldDeclaration: string;
  cprStep1Acknowledge: string;
  cprStep2ShieldBreath: string;
  cprStep3Transmute: string;
  cprStep4RebirthAction: string;
  dailyMentalArmorPoints: string[];
  powerFrequency: number;
}

export interface MasterQuote {
  quote: string;
  author: string;
  triggerId?: string;
}

export const RESILIENCE_MASTER_QUOTES: MasterQuote[] = [
  // 번아웃 & 극심한 피로
  {
    quote: "폭풍우 속에서도 마음의 닻을 내린 자는 침몰하지 않는다. 휴식은 멈춤이 아니라 더 높이 도약하기 위한 침묵의 충전이다.",
    author: "세네카 (스토아 철학자)",
    triggerId: "burnout"
  },
  {
    quote: "자연은 서두르지 않지만, 모든 것을 이룬다. 지친 나무가 잎을 떨구듯 당신의 조급함도 지금 내려놓아라.",
    author: "노자 (도덕경)",
    triggerId: "burnout"
  },
  {
    quote: "때로는 아무것도 하지 않는 것이 영혼을 치유하는 가장 위대한 예술이다.",
    author: "장자 (동양 철학자)",
    triggerId: "burnout"
  },
  {
    quote: "꺼지지 않는 불꽃은 거센 바람 속에서도 자기 안의 기름을 태운다. 지침은 새로운 성장의 전조다.",
    author: "헤라클레이토스 (자연철학자)",
    triggerId: "burnout"
  },

  // 미래 불안 & 압박감
  {
    quote: "우리가 두려워해야 할 유일한 것은 두려움 그 자체다. 아직 오지 않은 내일의 짐으로 오늘을 소모하지 마라.",
    author: "에픽테토스 (스토아 철학자)",
    triggerId: "anxiety"
  },
  {
    quote: "우리는 실제보다 상상 속에서 더 많은 고통을 겪는다. 파도는 거칠지만 당신의 배는 결코 침몰하지 않는다.",
    author: "루키우스 세네카 (로마 철학자)",
    triggerId: "anxiety"
  },
  {
    quote: "어두운 밤하늘일수록 별들은 더욱 찬란히 빛난다. 불안은 당신이 더 높은 곳을 향하고 있다는 증거다.",
    author: "랄프 왈도 에머슨 (사상가)",
    triggerId: "anxiety"
  },
  {
    quote: "미래를 예측하는 가장 완벽한 방법은, 지금 이 순간 침착하게 나만의 길을 창조하는 것이다.",
    author: "피터 드러커 (경영사상가)",
    triggerId: "anxiety"
  },

  // 자책 & 무력감
  {
    quote: "나를 죽이지 못하는 고통은 나를 더욱 강하게 만들 뿐이다. 부서진 틈 사이로 새로운 빛이 들어온다.",
    author: "프리드리히 니체 (철학자)",
    triggerId: "self_doubt"
  },
  {
    quote: "인간에게서 모든 것을 빼앗아 갈 수 있어도, 주어진 상황에서 자신의 태도를 선택할 마지막 자유는 빼앗을 수 없다.",
    author: "빅터 프랭클 (정신의학자·'죽음의 수용소에서')",
    triggerId: "self_doubt"
  },
  {
    quote: "다이아몬드는 엄청난 압력과 열기를 견뎌낸 후에야 영원한 광채를 얻는다. 당신의 시련 또한 그러하다.",
    author: "요한 볼프강 폰 괴테 (대문호)",
    triggerId: "self_doubt"
  },
  {
    quote: "자기 자신을 용서하는 자만이 세상의 어떤 시련 앞에서도 꺾이지 않는 영혼의 방패를 쥔다.",
    author: "칼 구스타프 융 (심리학자)",
    triggerId: "self_doubt"
  },

  // 타인의 비난 & 관계 상처
  {
    quote: "누군가 당신을 비난하더라도 그것은 그의 영혼의 거울일 뿐이다. 고결한 바위는 파도가 부딪혀도 결코 흔들리지 않는다.",
    author: "마르쿠스 아우렐리우스 (명상록)",
    triggerId: "criticism"
  },
  {
    quote: "타인의 입에서 나오는 독화살은 내가 그것을 움켜쥐어 가슴에 꽂지 않는 한 아무런 해를 끼칠 수 없다.",
    author: "에픽테토스 (엥키리디온)",
    triggerId: "criticism"
  },
  {
    quote: "사자가 짖는 개들의 소리에 발걸음을 멈추는 법은 없다. 당신의 높은 길을 묵묵히 걸어가라.",
    author: "동양 현인 격언",
    triggerId: "criticism"
  },
  {
    quote: "세상의 소음에 내면의 나침반을 내맡기지 마라. 진정한 평화는 외부의 인정이 아닌 내면의 침묵에서 온다.",
    author: "헤르만 헤세 (데미안)",
    triggerId: "criticism"
  },

  // 방황 & 방향성 상실
  {
    quote: "길을 잃었다는 것은, 곧 새로운 길을 발견하기 직전이라는 뜻이다. 별은 짙은 어둠 속에서만 방향을 가리킨다.",
    author: "라이너 마리아 릴케 (시인)",
    triggerId: "indecision"
  },
  {
    quote: "바람이 불지 않을 때 바람개비를 돌리는 유일한 방법은, 내가 직접 앞으로 달려나가는 것이다.",
    author: "데일 카네기 (인간관계론)",
    triggerId: "indecision"
  },
  {
    quote: "시작하기 위해 위대해질 필요는 없지만, 위대해지기 위해서는 반드시 지금 한 걸음을 내딛어야 한다.",
    author: "레프 톨스토이 (대문호)",
    triggerId: "indecision"
  },
  {
    quote: "어디로 가야 할지 모를 때는, 오직 지금 디딜 수 있는 눈앞의 가장 정직한 한 발짝에 집중하라.",
    author: "소크라테스 (철학자)",
    triggerId: "indecision"
  },

  // 과도한 잡념 & 불면
  {
    quote: "진흙탕 물을 맑게 하는 가장 빠른 길은 가만히 놓아두는 것이다. 마음의 소용돌이도 응시할 때 고요해진다.",
    author: "노자 (도덕경)",
    triggerId: "overthinking"
  },
  {
    quote: "생각은 구름과 같아서 머물지 않고 지나간다. 당신은 구름이 아니라, 그 모든 것을 품는 광활한 푸른 하늘이다.",
    author: "틱낫한 (선사·평화운동가)",
    triggerId: "overthinking"
  },
  {
    quote: "지나간 과거는 이미 존재하지 않고, 오지 않은 미래는 아직 실체가 없다. 지금 숨 쉬는 이 찰나만이 당신의 우주다.",
    author: "달라이 라마",
    triggerId: "overthinking"
  },
  {
    quote: "모든 번뇌의 뿌리는 실재하지 않는 것을 붙잡으려는 집착이다. 손을 펼칠 때 비로소 온 우주를 쥘 수 있다.",
    author: "법정 스님 (무소유)",
    triggerId: "overthinking"
  }
];

export function getRandomQuoteForTrigger(triggerId?: string, excludeQuote?: string): MasterQuote {
  let matched = RESILIENCE_MASTER_QUOTES.filter(q => !triggerId || q.triggerId === triggerId);
  if (matched.length === 0) matched = RESILIENCE_MASTER_QUOTES;
  const filtered = matched.filter(q => q.quote !== excludeQuote);
  const pool = filtered.length > 0 ? filtered : matched;
  return pool[Math.floor(Math.random() * pool.length)];
}

const FALLBACK_AEGIS: AegisData = {
  title: "불멸의 멘탈 방패 (Resilience Aegis)",
  stoicQuote: "폭풍우 속에서도 마음의 닻을 내린 자는 침몰하지 않는다. 휴식은 멈춤이 아니라 더 높이 도약하기 위한 침묵의 충전이다.",
  quoteAuthor: "세네카 (스토아 철학자)",
  resilienceShieldDeclaration: "나는 외부의 혼란에 휘둘리지 않고, 내면의 고요한 성채를 굳건히 지킨다. 어떤 비바람도 나의 본질을 꺾을 수 없다.",
  cprStep1Acknowledge: "현재 일어난 감정의 동요를 부정하지 않고 있는 그대로 인정합니다.",
  cprStep2ShieldBreath: "가슴 한가운데 멘탈 방패를 상상하며 4초 들이쉬고, 4초 멈추고, 8초 동안 내쉽니다.",
  cprStep3Transmute: "상처와 분노의 에너지를 나를 더 단단하게 만드는 성장의 연료로 치환합니다.",
  cprStep4RebirthAction: "지금 통제할 수 있는 가장 작은 행동 하나에 집중하여 즉각 실행합니다.",
  dailyMentalArmorPoints: [
    "통제할 수 없는 타인의 시선과 결과는 과감히 내려놓습니다.",
    "모든 시련은 내면의 근력을 단련시키는 우주적 훈련장입니다.",
    "나의 가치는 외부의 성공이나 실패로 결정되지 않습니다."
  ],
  powerFrequency: 432
};

const EMOTIONAL_TRIGGERS = [
  { id: 'burnout', label: '번아웃 & 극심한 피로', icon: '🔋' },
  { id: 'anxiety', label: '미래 불안 & 압박감', icon: '⚡' },
  { id: 'self_doubt', label: '자책 & 무력감', icon: '🥀' },
  { id: 'criticism', label: '타인의 비난 & 관계 상처', icon: '🛡️' },
  { id: 'indecision', label: '방황 & 방향성 상실', icon: '🧭' },
  { id: 'overthinking', label: '과도한 잡념 & 불면', icon: '🌌' },
];

export function PrologueSynergySection() {
  const { updateSharedState } = useApp();
  const userProfile = getPersistentUserProfile();
  const [selectedTrigger, setSelectedTrigger] = useState<string>(EMOTIONAL_TRIGGERS[0].id);
  const [customWorry, setCustomWorry] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasSynthesized, setHasSynthesized] = useState<boolean>(false);
  const [aegisData, setAegisData] = useState<AegisData>(() => {
    const q = getRandomQuoteForTrigger(EMOTIONAL_TRIGGERS[0].id);
    return {
      ...FALLBACK_AEGIS,
      stoicQuote: q.quote,
      quoteAuthor: q.author
    };
  });
  const [activeTab, setActiveTab] = useState<'creed' | 'cpr_protocol' | 'armor_core'>('creed');
  const [copied, setCopied] = useState<boolean>(false);
  const [isBreathing, setIsBreathing] = useState<boolean>(false);
  const [breathPhase, setBreathPhase] = useState<'들숨 (Inhale)' | '유지 (Hold)' | '날숨 (Exhale)'>('들숨 (Inhale)');
  const [breathCount, setBreathCount] = useState<number>(4);
  const [isSoundPlaying, setIsSoundPlaying] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const isTTSActive = useTTSActive();

  // Load Section 1 cached daily quote if valid and unique
  useEffect(() => {
    try {
      const cached = localStorage.getItem("trinity_cached_global_data");
      if (cached) {
        const parsed = JSON.parse(cached);
        const quoteText = parsed?.quote || parsed?.summary;
        const authorText = parsed?.quote_author || parsed?.author;
        if (quoteText && !quoteText.includes("당신을 괴롭히는 것은 외부의 사건")) {
          setAegisData(prev => ({
            ...prev,
            stoicQuote: quoteText,
            quoteAuthor: authorText || prev.quoteAuthor
          }));
        }
      }
    } catch (_) {}
  }, []);

  // Synthesizer Audio (432Hz Healing Frequency)
  const toggleSound = () => {
    if (isSoundPlaying) {
      try {
        oscRef.current?.stop();
        audioCtxRef.current?.close();
      } catch (e) {}
      audioCtxRef.current = null;
      oscRef.current = null;
      setIsSoundPlaying(false);
    } else {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        audioCtxRef.current = ctx;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(aegisData.powerFrequency || 432, ctx.currentTime);

        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 1.5);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        oscRef.current = osc;
        gainRef.current = gain;
        setIsSoundPlaying(true);
      } catch (e) {
        console.warn('Audio synthesis failed:', e);
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

  const handleSpeakDeclaration = () => {
    if (isTTSActive) {
      stopTTS();
    } else {
      const text = `불멸의 멘탈 방패 부활 선언입니다. 오늘의 명언: ${aegisData.stoicQuote} — ${aegisData.quoteAuthor}. ${aegisData.resilienceShieldDeclaration}`;
      playTTS(text, 'Kore', false, '확신');
    }
  };

  const handleToggleShieldBreathing = () => {
    if (isBreathing || isTTSActive) {
      setIsBreathing(false);
      stopTTS();
    } else {
      setIsBreathing(true);
      setBreathPhase('들숨 (Inhale)');
      setBreathCount(4);
      // 호흡 가이드 애니메이션과 음성 낭독을 동시에 동조 실행
      const text = `방패 호흡 가이드입니다. ${aegisData.cprStep2ShieldBreath}. 천천히 4초 동안 숨을 들이쉬고, 4초 동안 머금으며 에너지를 모으고, 8초 동안 길게 내쉬며 마음의 멘탈 방패를 굳건히 세웁니다. 1단계 감정 인지: ${aegisData.cprStep1Acknowledge}. 3단계 에너지 치환: ${aegisData.cprStep3Transmute}. 4단계 행동 재탄생: ${aegisData.cprStep4RebirthAction}.`;
      playTTS(text, 'Kore', false, '치유');
    }
  };

  const handleSelectTrigger = (triggerId: string) => {
    setSelectedTrigger(triggerId);
    if (!hasSynthesized) {
      const q = getRandomQuoteForTrigger(triggerId, aegisData.stoicQuote);
      setAegisData(prev => ({
        ...prev,
        stoicQuote: q.quote,
        quoteAuthor: q.author
      }));
    }
  };

  const handleShuffleQuote = () => {
    const q = getRandomQuoteForTrigger(selectedTrigger, aegisData.stoicQuote);
    setAegisData(prev => ({
      ...prev,
      stoicQuote: q.quote,
      quoteAuthor: q.author
    }));
  };

  // Tab switch cleanup for breathing and TTS
  useEffect(() => {
    if (activeTab !== 'cpr_protocol' && isBreathing) {
      setIsBreathing(false);
      stopTTS();
    }
  }, [activeTab, isBreathing]);

  // Breathing Loop Guide
  useEffect(() => {
    if (!isBreathing) return;
    let timer: any;
    let count = 4;
    let phaseIdx = 0; // 0: Inhale 4s, 1: Hold 4s, 2: Exhale 8s
    const phases: Array<{ name: '들숨 (Inhale)' | '유지 (Hold)' | '날숨 (Exhale)'; duration: number }> = [
      { name: '들숨 (Inhale)', duration: 4 },
      { name: '유지 (Hold)', duration: 4 },
      { name: '날숨 (Exhale)', duration: 8 }
    ];

    timer = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        phaseIdx = (phaseIdx + 1) % phases.length;
        setBreathPhase(phases[phaseIdx].name);
        count = phases[phaseIdx].duration;
      }
      setBreathCount(count);
    }, 1000);

    return () => clearInterval(timer);
  }, [isBreathing]);

  // Generate Synergy Aegis via AI
  const handleSynthesizeAegis = async () => {
    setIsLoading(true);
    const triggerItem = EMOTIONAL_TRIGGERS.find(t => t.id === selectedTrigger);
    const triggerLabel = triggerItem ? triggerItem.label : '감정 혼란';
    const combinedConcern = customWorry.trim() ? `${triggerLabel} - ${customWorry.trim()}` : triggerLabel;

    const systemPrompt = "당신은 프롤로그의 멘탈 방패 마스터입니다. 좌측 메뉴 [Universe]의 우주적 운명 통찰/실시간 바이오리듬 회복 지혜와 우측 메뉴 [eCPR]의 4단계 감정 응급 소생 프로토콜을 완벽히 융합하여 사용자의 마음에 뚫리지 않는 불멸의 멘탈 방패(Resilience Aegis) 선언문을 주조하세요.";
    const userPrompt = `[양쪽 메뉴 융합: UNIVERSE 우주 통찰 ✕ eCPR 응급 소생]
[사용자 상태 / 위기 트리거]: "${combinedConcern}"
사용자 닉네임: "${userProfile?.basic?.nickname || '여행자'}"

아래 JSON 스키마로만 정확하게 응답하세요:
{
  "title": "방패의 고유 칭호 (예: 흔들림 없는 다이아몬드 성채의 방패)",
  "stoicQuote": "이 위기에 직관적으로 답하는 역사적 거장/철학자(니체, 세네카, 에픽테토스, 장자, 빅터 프랭클, 칼 융, 릴케, 쇼펜하우어, 괴테, 노자, 헤세 등)의 깊이 있는 명언 1문장 (주의: 흔해빠진 '당신을 괴롭히는 것은 외부의 사건이 아니라' 같은 문구는 절대 쓰지 말고 새롭고 강렬한 명언을 발굴할 것)",
  "quoteAuthor": "명언의 인물 및 배경/출처",
  "resilienceShieldDeclaration": "1인칭 현재형의 단단하고 웅장한 멘탈 방패 부활 선언문 (2~3문장)",
  "cprStep1Acknowledge": "1단계: 현재 감정을 정면으로 마주하는 인정 확언",
  "cprStep2ShieldBreath": "2단계: 가슴의 에너지를 모으는 멘탈 방패 호흡법",
  "cprStep3Transmute": "3단계: 위기 에너지를 성장의 불꽃으로 치환하는 연금술 선언",
  "cprStep4RebirthAction": "4단계: 지금 1분 안에 즉시 실행할 수 있는 현실적 극복 행동",
  "dailyMentalArmorPoints": [
    "방패의 제1수칙 (1문장)",
    "방패의 제2수칙 (1문장)",
    "방패의 제3수칙 (1문장)"
  ],
  "powerFrequency": 432
}`;

    const safetyTimeout = new Promise<AegisData>((resolve) => {
      setTimeout(() => {
        const fallbackQuote = getRandomQuoteForTrigger(selectedTrigger, aegisData.stoicQuote);
        resolve({
          ...FALLBACK_AEGIS,
          title: `〈${triggerLabel} 극복〉 불멸의 멘탈 방패`,
          stoicQuote: fallbackQuote.quote,
          quoteAuthor: fallbackQuote.author,
          resilienceShieldDeclaration: `나는 지금 겪고 있는 '${triggerLabel}'의 파도 속에서도 내면의 고요한 성채를 단단히 수호한다. 나의 영혼은 어떤 혼란보다 위대하다.`
        });
      }, 6500);
    });

    const runAI = async (): Promise<AegisData> => {
      try {
        const raw = await invokeLLM({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          responseFormat: { type: 'json_object' }
        });
        const parsed = typeof raw === 'string' ? JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim()) : raw;
        if (parsed && (parsed.resilienceShieldDeclaration || parsed.title)) {
          const freshQuote = (!parsed.stoicQuote || parsed.stoicQuote.includes("당신을 괴롭히는 것은 외부의 사건"))
            ? getRandomQuoteForTrigger(selectedTrigger, aegisData.stoicQuote)
            : { quote: parsed.stoicQuote, author: parsed.quoteAuthor || '스토아 철학자' };

          return {
            ...FALLBACK_AEGIS,
            ...parsed,
            stoicQuote: freshQuote.quote,
            quoteAuthor: freshQuote.author,
            dailyMentalArmorPoints: Array.isArray(parsed.dailyMentalArmorPoints) && parsed.dailyMentalArmorPoints.length > 0
              ? parsed.dailyMentalArmorPoints
              : FALLBACK_AEGIS.dailyMentalArmorPoints,
            powerFrequency: typeof parsed.powerFrequency === 'number' ? parsed.powerFrequency : 432
          };
        }
      } catch (e) {
        console.warn('[PrologueSynergy] invokeLLM error:', e);
      }
      throw new Error('Fallback needed');
    };

    try {
      const result = await Promise.race([runAI(), safetyTimeout]);
      setAegisData(result);
      setHasSynthesized(true);
      recordPrismFeature({
        app: 'hub',
        featureName: 'Prologue Resilience Aegis Synergy',
        summary: result.title,
        details: { trigger: combinedConcern, title: result.title }
      });
      updateSharedState({}, 'HUB');
    } catch (e) {
      console.warn('Aegis generation fallback used:', e);
      setHasSynthesized(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    const text = `🛡️ [${aegisData.title}]\n\n✨ 오늘의 철학 명언:\n"${aegisData.stoicQuote}" - ${aegisData.quoteAuthor}\n\n⚡ 멘탈 방패 부활 선언:\n${aegisData.resilienceShieldDeclaration}\n\n🔥 4단계 감정 CPR 방패 프로토콜:\n1. 인지: ${aegisData.cprStep1Acknowledge}\n2. 호흡: ${aegisData.cprStep2ShieldBreath}\n3. 치환: ${aegisData.cprStep3Transmute}\n4. 행동: ${aegisData.cprStep4RebirthAction}\n\n- PRISM PROLOGUE Resilience Aegis`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-12 text-white font-sans">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 border border-red-500/30 bg-gradient-to-br from-red-950/40 via-zinc-950/90 to-amber-950/30 shadow-[0_0_50px_rgba(239,68,68,0.15)] backdrop-blur-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-red-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-amber-500/10 blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold font-mono tracking-widest uppercase bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1.5">
                <Sparkles size={12} className="text-amber-400 animate-pulse" />
                UNIVERSE ✕ eCPR FUSION
              </span>
              <span className="text-[10px] text-white/40 font-mono">432Hz SOLAR FREQUENCY</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Shield className="text-red-400 drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]" size={28} />
              <span>오늘의 감정 부활 선언 & 멘탈 방패 (Resilience Aegis)</span>
            </h2>
            <p className="text-xs sm:text-sm text-red-100/70 max-w-xl leading-relaxed">
              <strong>Universe(우주 통찰 & 바이오리듬)</strong>의 거시적 지혜와 <strong>eCPR(감정 응급 소생)</strong>의 4단계 회복력을 융합하여, 어떤 심리적 위기에도 부서지지 않는 〈불멸의 멘탈 방패〉를 주조합니다.
            </p>
          </div>

          <button
            onClick={toggleSound}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold font-sans flex items-center gap-2 border transition-all cursor-pointer shrink-0 ${
              isSoundPlaying
                ? 'bg-red-500 text-white border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-pulse'
                : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'
            }`}
          >
            {isSoundPlaying ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{isSoundPlaying ? '432Hz 방패 주파수 재생 중' : '432Hz 주파수 켜기'}</span>
          </button>
        </div>
      </div>

      {/* Trigger Selection Form */}
      <div className="glass p-6 sm:p-8 rounded-[32px] border border-white/10 space-y-6">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-red-300 flex items-center gap-2 font-mono uppercase tracking-wider">
            <ShieldAlert size={16} className="text-red-400" />
            <span>1. 현재 방패가 필요한 감정 위기 상태 선택</span>
          </label>
          <span className="text-[10px] text-white/40 font-sans">실시간 AI 융합 주조</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {EMOTIONAL_TRIGGERS.map((trigger) => {
            const isSelected = selectedTrigger === trigger.id;
            return (
              <button
                key={trigger.id}
                type="button"
                onClick={() => handleSelectTrigger(trigger.id)}
                className={`p-3.5 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-red-500/25 border-red-400/80 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] scale-[1.02]'
                    : 'bg-white/[0.03] border-white/10 text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="text-xl">{trigger.icon}</span>
                <span className="text-xs font-bold font-sans truncate">{trigger.label}</span>
              </button>
            );
          })}
        </div>

        <div>
          <label className="block text-[11px] text-white/50 mb-2 font-medium">
            추가로 마음에 맺힌 상황이나 구체적인 고민이 있다면 적어주세요 (선택):
          </label>
          <input
            type="text"
            value={customWorry}
            onChange={(e) => setCustomWorry(e.target.value)}
            placeholder="예: 오늘 중요한 회의에서 실수를 해서 마음이 계속 무너져요..."
            className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-red-400/60 transition-all font-sans"
          />
        </div>

        <button
          onClick={handleSynthesizeAegis}
          disabled={isLoading}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-500 via-rose-500 to-amber-500 hover:from-red-400 hover:to-amber-400 text-white font-bold text-sm tracking-wider uppercase transition-all shadow-[0_0_25px_rgba(239,68,68,0.4)] hover:shadow-[0_0_35px_rgba(239,68,68,0.6)] active:scale-[0.99] flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <RefreshCw size={18} className="animate-spin text-white" />
              <span>우주 명언 & 감정 CPR 융합 주조 중...</span>
            </>
          ) : (
            <>
              <Zap size={18} className="text-amber-300" />
              <span>〈불멸의 멘탈 방패 & 부활 선언문〉 즉시 주조하기</span>
            </>
          )}
        </button>
      </div>

      {/* Synthesized Aegis Output (Only visible after user triggers synthesis) */}
      {hasSynthesized && (
        <motion.div
          key={aegisData.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[36px] sm:rounded-[44px] bg-gradient-to-b from-zinc-900/95 via-zinc-950/95 to-black/95 border border-red-500/30 p-6 sm:p-10 space-y-8 shadow-2xl relative overflow-hidden backdrop-blur-2xl"
        >
        {/* Top Header info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-red-400">
                FORGED RESILIENCE AEGIS
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
                {aegisData.powerFrequency}Hz
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">{aegisData.title}</h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleSpeakDeclaration}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isTTSActive
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 animate-pulse'
                  : 'bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30'
              }`}
            >
              {isTTSActive ? <VolumeX size={14} className="text-amber-300" /> : <Volume2 size={14} className="text-red-300" />}
              <span>{isTTSActive ? '낭독 중단' : '방패 선언문 음성 낭독'}</span>
            </button>

            <button
              onClick={handleCopy}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? '복사 완료' : '선언 복사'}</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-2xl bg-white/5 p-1 border border-white/10">
          {[
            { id: 'creed', label: '🛡️ 부활 선언문 (Creed)' },
            { id: 'cpr_protocol', label: '🔥 4단계 방패 CPR' },
            { id: 'armor_core', label: '⚡ 멘탈 장갑 수칙' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-red-500 to-amber-500 text-white shadow-md'
                  : 'text-white/40 hover:text-white/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Creed & Stoic Quote */}
        {activeTab === 'creed' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Philosophical Quote Card */}
            <div className="p-5 sm:p-6 rounded-3xl bg-red-950/20 border border-red-500/20 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-red-300/70 uppercase tracking-widest font-bold flex items-center gap-1.5">
                  <Sparkles size={12} className="text-amber-400" />
                  <span>우주 명언 (Cosmic Insight)</span>
                </span>
                <button
                  type="button"
                  onClick={handleShuffleQuote}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-amber-300/80 hover:text-amber-200 border border-white/10 text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                  title="다른 명언으로 변경"
                >
                  <RefreshCw size={11} className="hover:rotate-180 transition-transform duration-500" />
                  <span>다른 명언 보기</span>
                </button>
              </div>
              <p className="text-base sm:text-lg font-serif italic text-amber-100/90 leading-relaxed">
                "{aegisData.stoicQuote}"
              </p>
              <p className="text-xs font-bold text-amber-300/75 mt-3 text-right">
                — {aegisData.quoteAuthor}
              </p>
            </div>

            {/* Declaration Big Box */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-red-900/30 via-zinc-900/50 to-amber-900/20 border border-red-400/40 relative shadow-inner space-y-4">
              <div className="flex items-center gap-2">
                <Flame size={20} className="text-red-400 animate-pulse" />
                <h4 className="text-sm font-bold text-red-200 uppercase tracking-wider font-mono">
                  1인칭 멘탈 방패 부활 선언
                </h4>
              </div>
              <p className="text-base sm:text-xl font-bold text-white leading-relaxed tracking-tight break-keep">
                "{aegisData.resilienceShieldDeclaration}"
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: 4-Step CPR Protocol with Interactive Breath */}
        {activeTab === 'cpr_protocol' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Interactive Shield Breathing Widget */}
            <div className="p-6 rounded-3xl bg-black/40 border border-red-500/20 flex flex-col items-center justify-center text-center space-y-4">
              <div className="flex items-center justify-between w-full">
                <span className="text-[11px] font-bold text-red-300 flex items-center gap-1.5 font-mono">
                  <HeartPulse size={14} className="text-red-400" />
                  <span>방패 호흡 가이드 (Shield Rhythm)</span>
                </span>
                <button
                  type="button"
                  onClick={handleToggleShieldBreathing}
                  className={`text-xs font-bold px-4 py-2 rounded-full border transition-all cursor-pointer flex items-center gap-2 shadow-md ${
                    isBreathing || isTTSActive
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white border-red-400 shadow-red-500/40 animate-pulse'
                      : 'bg-red-500/20 hover:bg-red-500/30 text-red-200 border-red-500/40 hover:border-red-400'
                  }`}
                >
                  {isBreathing || isTTSActive ? (
                    <>
                      <Square size={12} className="fill-current text-white" />
                      <span>호흡 & 음성 안내 멈추기</span>
                    </>
                  ) : (
                    <>
                      <Play size={12} className="fill-current text-red-300" />
                      <span>방패 호흡 & CPR 음성 시작</span>
                    </>
                  )}
                </button>
              </div>

              {isBreathing ? (
                <div className="relative w-36 h-36 flex items-center justify-center py-4">
                  <motion.div
                    animate={{
                      scale: breathPhase === '들숨 (Inhale)' ? [1, 1.3] : breathPhase === '유지 (Hold)' ? 1.3 : [1.3, 1],
                    }}
                    transition={{
                      duration: breathPhase === '날숨 (Exhale)' ? 8 : 4,
                      ease: 'easeInOut',
                    }}
                    className="w-28 h-28 rounded-full bg-gradient-to-tr from-red-500/30 to-amber-500/30 border-2 border-red-400 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.5)]"
                  >
                    <span className="text-xs font-black text-white">{breathPhase}</span>
                    <span className="text-2xl font-mono font-bold text-amber-300">{breathCount}s</span>
                  </motion.div>
                </div>
              ) : (
                <p className="text-xs text-white/50 py-2">
                  ‘방패 호흡 & CPR 음성 시작’을 누르면 4-4-8 방패 호흡 리듬과 음성 가이드가 동시에 진행됩니다.
                </p>
              )}
            </div>

            {/* 4 Steps Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { step: '01', title: '감정 인지 (Acknowledge)', text: aegisData.cprStep1Acknowledge, color: 'text-red-400' },
                { step: '02', title: '방패 호흡 (Shield Breath)', text: aegisData.cprStep2ShieldBreath, color: 'text-orange-400' },
                { step: '03', title: '에너지 치환 (Transmute)', text: aegisData.cprStep3Transmute, color: 'text-amber-400' },
                { step: '04', title: '부활 행동 (Rebirth Action)', text: aegisData.cprStep4RebirthAction, color: 'text-emerald-400' },
              ].map((item) => (
                <div key={item.step} className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono font-bold ${item.color}`}>{item.step}</span>
                    <h5 className="text-xs font-bold text-white">{item.title}</h5>
                  </div>
                  <p className="text-xs text-white/70 leading-relaxed font-sans">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Armor Core Points */}
        {activeTab === 'armor_core' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {(Array.isArray(aegisData?.dailyMentalArmorPoints) ? aegisData.dailyMentalArmorPoints : FALLBACK_AEGIS.dailyMentalArmorPoints).map((point, idx) => (
              <div
                key={idx}
                className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3.5 hover:bg-white/[0.06] transition-all"
              >
                <div className="w-7 h-7 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 text-xs font-bold font-mono mt-0.5">
                  #{idx + 1}
                </div>
                <p className="text-xs sm:text-sm text-white/85 leading-relaxed font-medium">
                  {point}
                </p>
              </div>
            ))}
          </div>
        )}
      </motion.div>
      )}
    </div>
  );
}
