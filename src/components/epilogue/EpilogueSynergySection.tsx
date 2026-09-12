import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Award,
  Volume2,
  VolumeX,
  Check,
  Copy,
  RefreshCw,
  Moon,
  Star,
  Compass,
  Zap,
  Flame,
  Feather,
  Palette,
  Shield,
  Play,
  Square
} from 'lucide-react';
import { useApp, getPersistentUserProfile } from '@/contexts/AppContext';
import { invokeLLM } from '@/lib/ai';
import { recordPrismFeature } from '@/lib/prismOmniSync';
import { playTTS, stopTTS, useTTSActive } from '@/utils/tts';

interface CosmicFocusOption {
  id: string;
  icon: string;
  label: string;
  desc: string;
  frequency: number;
}

const COSMIC_FOCUS_OPTIONS: CosmicFocusOption[] = [
  {
    id: 'consciousness',
    icon: '🌌',
    label: '의식 확장 & 송과체 각성',
    desc: '3차원 시공간을 넘어 고차원 순수 의식 및 우주적 자아와 일체화',
    frequency: 963
  },
  {
    id: 'abundance',
    icon: '💎',
    label: '무한 풍요 & 양자 도약 동조',
    desc: '부와 기회의 주파수를 잠재의식 심층에 각인하여 물질화 가속',
    frequency: 528
  },
  {
    id: 'peace',
    icon: '🕊️',
    label: '절대 평온 & 카르마 완전 해방',
    desc: '모든 집착과 과거의 무거운 카르마를 0(Zero)으로 증발시키고 영혼 휴식',
    frequency: 432
  },
  {
    id: 'destiny',
    icon: '👑',
    label: '대운 개운 & 황금 사명 완성',
    desc: '인생의 흐름을 대길(大吉)의 운로로 정렬하고 타고난 천명 발현',
    frequency: 741
  },
  {
    id: 'genius',
    icon: '🎨',
    label: '거장의 직관 & 창작 돌파',
    desc: '잠든 뇌의 영감 채널을 열어 예술적 영감과 번뜩이는 지혜 수신',
    frequency: 852
  },
  {
    id: 'sleep_priming',
    icon: '🔮',
    label: '기적의 잠재의식 수면 프로그래밍',
    desc: '수면 중 델타파 상태에서 원하는 최상의 현실을 잠재의식에 영구 각인',
    frequency: 963
  }
];

interface ChronicleStampData {
  title: string;
  soulEvolutionLevel: string;
  dailyCoreTheme: string;
  soulAlignmentSynthesis: string;
  sevenPrismStampStatus: {
    space: string;
    seal: string;
    frequency: string;
    status: string;
  }[];
  preSleepPrimingAffirmation: string;
  chronicleSealCode: string;
}

const FALLBACK_CHRONICLE: ChronicleStampData = {
  title: '963Hz 다이아몬드 영혼 연대기 (Master Soul Chronicle)',
  soulEvolutionLevel: 'Mastery Level IX · 초월적 황금 의식',
  dailyCoreTheme: '7대 프리즘의 모든 파동이 하나의 눈부신 빛으로 융합된 완전한 날',
  soulAlignmentSynthesis:
    '당신이 오늘 지나온 모든 사유와 호흡은 우주의 거대한 직조판 위에 빛나는 황금실로 새겨졌습니다. 이제 모든 긴장을 내려놓고 깊은 수면 속에서 잠재의식과 우주의 무한한 지혜가 온전히 하나로 녹아듭니다.',
  sevenPrismStampStatus: [
    { space: 'PROLOGUE (프롤로그)', seal: '불굴의 멘탈 방패 각인 🛡️', frequency: '432Hz', status: 'SYNCHRONIZED' },
    { space: 'ORANGE (오렌지)', seal: '양자 현실화 528Hz 도약 🌲', frequency: '528Hz', status: 'SYNCHRONIZED' },
    { space: 'TRINITY (트리니티)', seal: '대운 개운 & 타로 오라클 ✨', frequency: '741Hz', status: 'SYNCHRONIZED' },
    { space: 'AURA (오라)', seal: '저항 0% 완전 방하착 ⚡', frequency: '639Hz', status: 'SYNCHRONIZED' },
    { space: 'BLUEBIRD (블루버드)', seal: '호오포노포노 순수 백지 환생 🐦', frequency: '417Hz', status: 'SYNCHRONIZED' },
    { space: 'MUSE (뮤즈)', seal: '거장의 영감 마스터클래스 🎶', frequency: '852Hz', status: 'SYNCHRONIZED' },
    { space: 'EPILOGUE (에필로그)', seal: '영혼 연대기 마스터 아카이브 🌙', frequency: '963Hz', status: 'SYNCHRONIZED' }
  ],
  preSleepPrimingAffirmation:
    '나는 오늘 하루의 모든 배움과 깨달음을 황금빛 축복으로 품고, 잠든 동안 무한한 우주의 잠재의식과 온전히 하나가 되어 기적의 내일을 창조한다.',
  chronicleSealCode: 'SOUL-CHRONICLE-PRISM-999-ULTRA'
};

export function EpilogueSynergySection() {
  const { updateSharedState } = useApp();
  const userProfile = getPersistentUserProfile();
  const [selectedFocus, setSelectedFocus] = useState<string>(COSMIC_FOCUS_OPTIONS[0].id);
  const [customInsight, setCustomInsight] = useState<string>('');
  const [activeFrequency, setActiveFrequency] = useState<number>(963);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [chronicleData, setChronicleData] = useState<ChronicleStampData>(FALLBACK_CHRONICLE);
  const [isSynthesized, setIsSynthesized] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [savedToast, setSavedToast] = useState<boolean>(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);

  const isTTSActive = useTTSActive();
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);

  // Toggle Solfeggio frequency tone generator (852Hz / 963Hz)
  const toggleFrequencyTone = (freq?: number) => {
    const targetFreq = freq || activeFrequency;
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
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        audioCtxRef.current = ctx;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(targetFreq, ctx.currentTime);

        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        oscRef.current = osc;
        setIsAudioPlaying(true);
      } catch (e) {
        console.warn('Audio synthesis error:', e);
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

  const handleSynthesizeChronicle = async () => {
    setIsLoading(true);
    stopTTS();

    const focusObj = COSMIC_FOCUS_OPTIONS.find((f) => f.id === selectedFocus) || COSMIC_FOCUS_OPTIONS[0];
    const mbti = (userProfile as any)?.psychology?.mbti || 'INFJ';
    const nickname = userProfile?.basic?.nickname || '빛의 마스터';

    const systemPrompt =
      '당신은 PRISM 7대 우주 공간을 총괄하는 〈영혼 연대기 & 마스터 아카이브〉 대마스터입니다. 좌측 메뉴 [Diary]의 밤의 내면 성찰 기록과 우측 메뉴 [Profile]의 고유 영혼 프로필(MBTI, 영혼 사명, 비전), 그리고 밤의 영혼 진화 도약 포커스를 완벽히 융합하여 오늘의 영혼 진화 등급과 7대 우주 황금 봉인 스탬프, 그리고 수면 전 잠재의식 프라이밍 선언문을 발행하세요.';

    const userPrompt = `[양쪽 메뉴 융합: DIARY 성찰 일기 ✕ PROFILE 영혼 프로필]
[선택된 밤의 영혼 도약 포커스]: ${focusObj.label} (${focusObj.desc})
[오늘 영혼의 깨달음/메아리]: "${customInsight.trim() || '온 우주와 내가 하나임을 자각하는 깊은 현존'}"
[조율 솔페지오 주파수]: ${activeFrequency}Hz
[사용자 프로필]: 닉네임(${nickname}), 성향/MBTI(${mbti})

반드시 아래 JSON 스키마로만 엄격하게 응답하세요:
{
  "title": "영혼 연대기 고유 칭호 (예: ${activeFrequency}Hz 다이아몬드 영혼 연대기 마스터 아카이브)",
  "soulEvolutionLevel": "오늘의 영혼 진화 등급 (예: Mastery Level IX · 초월적 황금 의식)",
  "dailyCoreTheme": "오늘 하루를 관통하는 핵심 영혼 테마 1문장",
  "soulAlignmentSynthesis": "선택된 영혼 포커스와 개인의 영혼 사명이 어떻게 융합되어 진화했는지를 통찰하는 거룩하고 품격 있는 해설 (3~4문장)",
  "sevenPrismStampStatus": [
    { "space": "PROLOGUE", "seal": "불굴의 멘탈 방패 각인 🛡️", "frequency": "432Hz", "status": "SYNCHRONIZED" },
    { "space": "ORANGE", "seal": "양자 현실화 528Hz 도약 🌲", "frequency": "528Hz", "status": "SYNCHRONIZED" },
    { "space": "TRINITY", "seal": "대운 개운 & 타로 오라클 ✨", "frequency": "741Hz", "status": "SYNCHRONIZED" },
    { "space": "AURA", "seal": "저항 0% 완전 방하착 ⚡", "frequency": "639Hz", "status": "SYNCHRONIZED" },
    { "space": "BLUEBIRD", "seal": "호오포노포노 백지 환생 🐦", "frequency": "417Hz", "status": "SYNCHRONIZED" },
    { "space": "MUSE", "seal": "거장의 영감 마스터클래스 🎶", "frequency": "852Hz", "status": "SYNCHRONIZED" },
    { "space": "EPILOGUE", "seal": "영혼 연대기 마스터 아카이브 🌙", "frequency": "963Hz", "status": "SYNCHRONIZED" }
  ],
  "preSleepPrimingAffirmation": "취침 전 잠재의식을 우주와 동조시키는 수면 전 영혼 프라이밍 확언 1~2문장",
  "chronicleSealCode": "SOUL-CHRONICLE-PRISM-999-GOLD"
}`;

    const safetyTimeout = new Promise<ChronicleStampData>((resolve) => {
      setTimeout(() => {
        resolve({
          ...FALLBACK_CHRONICLE,
          title: `〈${nickname}의 ${focusObj.label}〉 영혼 연대기 마스터 아카이브`,
          soulAlignmentSynthesis: `오늘 선택하신 [${focusObj.label}]의 거룩한 의도는 당신의 잠재의식 깊은 곳에 찬란한 씨앗으로 심어졌습니다. 수면의 고요 속에서 우주의 무한한 지혜가 당신을 최상의 축복으로 인도합니다.`
        });
      }, 6500);
    });

    const runAI = async (): Promise<ChronicleStampData> => {
      try {
        const raw = await invokeLLM({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          responseFormat: { type: 'json_object' }
        });
        const parsed = typeof raw === 'string' ? JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim()) : raw;
        if (parsed && parsed.soulAlignmentSynthesis) {
          return parsed;
        }
      } catch (e) {
        console.warn('[EpilogueSynergy] invokeLLM error:', e);
      }
      throw new Error('Need fallback');
    };

    try {
      const result = await Promise.race([runAI(), safetyTimeout]);
      setChronicleData(result);
      setIsSynthesized(true);
      recordPrismFeature({
        app: 'epilogue',
        featureName: 'Soul Chronicle Master Synergy',
        summary: result.title,
        details: { focus: focusObj.label, title: result.title }
      });
      updateSharedState({}, 'EPILOGUE');
    } catch (e) {
      console.warn('Epilogue fallback error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleVoicePriming = () => {
    if (isTTSActive) {
      stopTTS();
    } else {
      const speech = `오늘의 영혼 연대기 선언. ${chronicleData.soulAlignmentSynthesis} 수면 전 프라이밍 확언입니다. ${chronicleData.preSleepPrimingAffirmation}`;
      playTTS(speech, 'Kore', false, '신비');
    }
  };

  const handleCopy = () => {
    const text = `🌙 [${chronicleData.title}]\n👑 등급: ${chronicleData.soulEvolutionLevel}\n\n✨ 오늘의 영혼 테마: ${chronicleData.dailyCoreTheme}\n\n🌌 영혼 정렬 합성 계시:\n"${chronicleData.soulAlignmentSynthesis}"\n\n🛡️ 7대 프리즘 우주 각인:\n${chronicleData.sevenPrismStampStatus.map((s) => `• [${s.space}] ${s.seal} (${s.frequency})`).join('\n')}\n\n💤 취침 전 잠재의식 프라이밍 확언:\n"${chronicleData.preSleepPrimingAffirmation}"\n\n- PRISM EPILOGUE Soul Chronicle Master Archive`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-12 text-white font-sans">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 border border-purple-500/30 bg-gradient-to-br from-purple-950/50 via-zinc-950/90 to-pink-950/40 shadow-[0_0_50px_rgba(168,85,247,0.15)] backdrop-blur-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-purple-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-pink-500/10 blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold font-mono tracking-widest uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
                <Sparkles size={12} className="text-purple-400 animate-pulse" />
                DIARY ✕ PROFILE FUSION
              </span>
              <span className="text-[10px] text-white/40 font-mono">{activeFrequency}Hz PINEAL AWAKENING</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Award className="text-purple-400 drop-shadow-[0_0_12px_rgba(168,85,247,0.8)]" size={28} />
              <span>영혼 연대기 &amp; 마스터 아카이브</span>
            </h2>
            <p className="text-xs sm:text-sm text-purple-100/70 max-w-xl leading-relaxed">
              <strong>Diary(밤의 성찰 일기)</strong>와 <strong>Profile(영혼 프로필 &amp; 사명)</strong>의 양쪽 메뉴를 융합하여, 오늘의 영혼 진화 등급과 7대 우주 황금 봉인 스탬프, 잠재의식 프라이밍을 완성하는 마스터 아카이브입니다.
            </p>
          </div>

          {/* Solfeggio Tone & Frequency Controls */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="flex rounded-xl bg-black/40 border border-white/10 p-1">
              {[852, 963].map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setActiveFrequency(f);
                    if (isAudioPlaying) {
                      toggleFrequencyTone(f);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                    activeFrequency === f
                      ? 'bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  {f}Hz
                </button>
              ))}
            </div>

            <button
              onClick={() => toggleFrequencyTone()}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold font-sans flex items-center gap-2 border transition-all cursor-pointer shrink-0 ${
                isAudioPlaying
                  ? 'bg-purple-500 text-white border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.6)] animate-pulse'
                  : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'
              }`}
            >
              {isAudioPlaying ? <Volume2 size={15} /> : <VolumeX size={15} />}
              <span>{isAudioPlaying ? `${activeFrequency}Hz 재생 중` : `${activeFrequency}Hz 켜기`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 7-Prism Cosmic Live Footprint Grid */}
      <div className="glass p-6 sm:p-7 rounded-[32px] border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-purple-300 flex items-center gap-2 font-mono uppercase tracking-wider">
            <Compass size={16} className="text-purple-400" />
            <span>1. PRISM 7대 우주 공간 공명 현황 (Omni-Resonance Matrix)</span>
          </label>
          <span className="text-[10px] text-emerald-400 font-mono font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            ALL SPACES READY
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {[
            { name: 'PROLOGUE', icon: Shield, color: 'text-sky-400', desc: '멘탈 방패 각인' },
            { name: 'ORANGE', icon: Zap, color: 'text-amber-400', desc: '528Hz 양자 실현' },
            { name: 'TRINITY', icon: Star, color: 'text-yellow-400', desc: '사주 타로 개운' },
            { name: 'AURA', icon: Flame, color: 'text-emerald-400', desc: '0% 방하착 챔버' },
            { name: 'BLUEBIRD', icon: Feather, color: 'text-cyan-400', desc: '감정 백지 환생' },
            { name: 'MUSE', icon: Palette, color: 'text-pink-400', desc: '거장 마스터클래스' },
            { name: 'EPILOGUE', icon: Moon, color: 'text-purple-400', desc: '영혼 연대기 아카이브' }
          ].map((sp) => {
            const Icon = sp.icon;
            return (
              <div
                key={sp.name}
                className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center text-center space-y-1 hover:border-purple-500/30 transition-all"
              >
                <Icon size={16} className={sp.color} />
                <span className="text-[10px] font-mono font-bold text-white/90">{sp.name}</span>
                <span className="text-[9px] text-white/40 leading-tight font-sans">{sp.desc}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cosmic Focus Selection */}
      <div className="glass p-6 sm:p-8 rounded-[32px] border border-white/10 space-y-6">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-purple-300 flex items-center gap-2 font-mono uppercase tracking-wider">
            <Moon size={16} className="text-purple-400" />
            <span>2. 오늘 밤 영혼 진화 &amp; 잠재의식 도약 테마 선택</span>
          </label>
          <span className="text-[10px] text-white/40 font-sans">고차원 정렬</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {COSMIC_FOCUS_OPTIONS.map((focus) => {
            const isSelected = selectedFocus === focus.id;
            return (
              <button
                key={focus.id}
                type="button"
                onClick={() => {
                  setSelectedFocus(focus.id);
                  setActiveFrequency(focus.frequency);
                }}
                className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between space-y-2 relative overflow-hidden ${
                  isSelected
                    ? 'bg-purple-500/20 border-purple-400/80 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                    : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/10'
                }`}
              >
                {isSelected && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                )}
                <div className="flex items-center gap-2">
                  <span className="text-xl">{focus.icon}</span>
                  <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-white/80'}`}>
                    {focus.label}
                  </span>
                </div>
                <p className="text-[11px] text-white/50 leading-relaxed font-sans">{focus.desc}</p>
                <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[9px] font-mono text-purple-300">
                  <span>추천 주파수</span>
                  <span>{focus.frequency}Hz</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom Insight Input (Optional) */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-white/60 flex items-center justify-between font-sans">
            <span>오늘 영혼에 남은 가장 거룩한 깨달음 또는 우주의 메아리 (선택 입력)</span>
            <span className="text-[10px] text-white/30">직접 입력 가능</span>
          </label>
          <input
            type="text"
            value={customInsight}
            onChange={(e) => setCustomInsight(e.target.value)}
            placeholder="예: 모든 상황 속에서 평온을 지켜낸 나의 본래 빛을 발견한 날..."
            className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-purple-400/60 font-sans"
          />
        </div>

        {/* Synthesis Button */}
        <button
          onClick={handleSynthesizeChronicle}
          disabled={isLoading}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-black text-sm tracking-wider uppercase transition-all shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] active:scale-[0.99] flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <RefreshCw size={18} className="animate-spin text-white" />
              <span>영혼 연대기 &amp; 마스터 아카이브 각인 중...</span>
            </>
          ) : (
            <>
              <Sparkles size={18} className="text-yellow-300" />
              <span>〈영혼 연대기 스탬프 &amp; 수면 프라이밍〉 즉시 발행</span>
            </>
          )}
        </button>
      </div>

      {/* Output Display */}
      {isSynthesized && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-[36px] sm:rounded-[44px] bg-gradient-to-b from-zinc-900/95 via-zinc-950/95 to-black/95 border border-purple-500/30 p-6 sm:p-10 space-y-8 shadow-2xl relative overflow-hidden backdrop-blur-2xl"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-purple-400">
                  SOUL CHRONICLE GOLDEN STAMP
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono">
                  {chronicleData.soulEvolutionLevel}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">{chronicleData.title}</h3>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              {/* Pre-Sleep TTS Voice Priming Button */}
              <button
                onClick={handleToggleVoicePriming}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isTTSActive
                    ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                    : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                }`}
              >
                {isTTSActive ? <VolumeX size={14} className="text-amber-300" /> : <Play size={14} className="text-purple-300" />}
                <span>{isTTSActive ? '음성 낭독 중지' : '수면 프라이밍 음성 낭독'}</span>
              </button>

              <button
                onClick={handleCopy}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copied ? '복사 완료' : '전체 복사'}</span>
              </button>
            </div>
          </div>

          {/* Core Theme & Synthesis Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-purple-900/30 via-zinc-900/50 to-pink-900/20 border border-purple-400/40 relative shadow-inner space-y-3">
            <span className="text-[10px] font-mono text-purple-300 uppercase tracking-widest font-bold flex items-center gap-1.5">
              <Star size={14} className="text-yellow-400" />
              오늘의 영혼 테마: {chronicleData.dailyCoreTheme}
            </span>
            <p className="text-base sm:text-lg font-bold text-white leading-relaxed tracking-tight break-keep">
              "{chronicleData.soulAlignmentSynthesis}"
            </p>
          </div>

          {/* 7 Space Synergy Stamp Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-purple-300 uppercase font-mono tracking-wider flex items-center gap-2">
              <Award size={14} className="text-pink-400" /> PRISM 7대 우주 공간 통합 여정 황금 봉인
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {chronicleData.sevenPrismStampStatus.map((stamp, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white/90">{stamp.space}</span>
                    <span className="text-[9px] text-purple-400/80 font-mono">{stamp.frequency}</span>
                  </div>
                  <span className="text-[11px] text-purple-200 font-mono font-semibold">{stamp.seal}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pre-Sleep Priming Affirmation Banner */}
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-purple-950/60 via-indigo-950/50 to-pink-950/60 border border-purple-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-purple-300 font-mono font-bold uppercase flex items-center gap-1.5">
                <Moon size={13} className="text-purple-400" /> PRE-SLEEP SUBCONSCIOUS PRIMING AFFIRMATION
              </span>
              <span className="text-[9px] text-white/40 font-mono">{chronicleData.chronicleSealCode}</span>
            </div>
            <p className="text-sm sm:text-base font-black text-white leading-relaxed">
              "{chronicleData.preSleepPrimingAffirmation}"
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
