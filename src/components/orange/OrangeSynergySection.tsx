import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Zap, Radio, CheckCircle, Copy, Check, Volume2, VolumeX, ArrowRight, Compass, RefreshCw, Send, Shield, Award, Layers } from 'lucide-react';
import { useApp, getPersistentUserProfile } from '@/contexts/AppContext';
import { invokeLLM } from '@/lib/ai';
import { recordPrismFeature } from '@/lib/prismOmniSync';
import { getLocalWishes } from '@/lib/wishingWell';
import { playTTS, stopTTS, useTTSActive } from '@/utils/tts';

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
  { id: 'wealth', label: '금전 & 비즈니스 대박', icon: '💎', defaultWish: '월 3,000만원 이상의 자유로운 패시브 인컴과 재정적 독립' },
  { id: 'career', label: '커리어 & 합격 & 승진', icon: '🚀', defaultWish: '원하던 글로벌 프로젝트 성공 및 꿈의 포지션 안착' },
  { id: 'love', label: '운명적 사랑 & 소울메이트', icon: '💖', defaultWish: '서로를 깊이 존중하고 영혼을 성장시키는 평생의 인연' },
  { id: 'health', label: '완벽한 생명력 & 활력', icon: '🌿', defaultWish: '지치지 않는 에너제틱한 건강과 맑고 깊은 숙면' },
  { id: 'creative', label: '창작 & 영감 폭발', icon: '🎨', defaultWish: '세상을 놀라게 할 위대한 예술작품/콘텐츠 완성' },
  { id: 'freedom', label: '공간/시간 완전한 자유', icon: '🕊️', defaultWish: '언제 어디서든 원하는 일을 하며 사는 라이프스타일' },
];

export function OrangeSynergySection() {
  const { updateSharedState } = useApp();
  const userProfile = getPersistentUserProfile();
  const [selectedCategory, setSelectedCategory] = useState<string>(MANIFESTATION_CATEGORIES[0].id);
  const [targetWish, setTargetWish] = useState<string>(MANIFESTATION_CATEGORIES[0].defaultWish);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [catalystData, setCatalystData] = useState<QuantumCatalystData>(FALLBACK_CATALYST);
  const [isSynthesized, setIsSynthesized] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [dialValue, setDialValue] = useState<number>(528);
  const [recentWishingWellWish, setRecentWishingWellWish] = useState<string | null>(null);
  const isTTSActive = useTTSActive();

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);

  // Load latest wish from Wishing Well (Section 2) if present
  useEffect(() => {
    try {
      const wishes = getLocalWishes(userProfile?.basic?.nickname || 'default');
      if (wishes && wishes.length > 0) {
        setRecentWishingWellWish(wishes[wishes.length - 1].wish);
      }
    } catch (_) {}
  }, []);

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
      const speech = `양자 현실화 오감 스크립트입니다. ${catalystData.sensoryScript} 진동 고정 확언입니다. ${catalystData.vibrationalAnchorAffirmation}`;
      playTTS(speech, 'Kore', false, '확신');
    }
  };

  const handleCategorySelect = (cat: typeof MANIFESTATION_CATEGORIES[0]) => {
    setSelectedCategory(cat.id);
    setTargetWish(cat.defaultWish);
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
[소원의 우물 최근 연동]: ${recentWishingWellWish ? `"${recentWishingWellWish}"` : '새로운 소원 투사'}

반드시 아래 JSON 스키마로만 엄격하게 응답하세요:
{
  "title": "양자 현실화 고유 명칭 (예: 528Hz 황금 풍요 양자 도약 가속기)",
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
  "vibrationalAnchorAffirmation": "우주와 나의 주파수를 일치시키는 강력한 1문장 확언",
  "secretBibleFormula": "시크릿 바이블 3단계 맞춤 가이드라인 (Ask - Believe - Receive)",
  "timelineWindow": "가속화 타임라인 주기 (예: 72시간 양자 중첩 포털 활성화)"
}`;

    const safetyTimeout = new Promise<QuantumCatalystData>((resolve) => {
      setTimeout(() => {
        resolve({
          ...FALLBACK_CATALYST,
          title: `〈${categoryName}〉 양자 현실화 가속기`,
          sensoryScript: `나는 이미 '${targetWish}'을(를) 완벽하게 손에 쥐고 풍요를 누리고 있다. 온 우주의 에너지가 나의 확신에 공명하며 물질세계로 현실화된다.`
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
        details: { category: categoryName, wish: targetWish }
      });
      updateSharedState({}, 'ORANGE');
    } catch (e) {
      console.warn('Catalyst error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    const text = `🌲 [${catalystData.title}]\n\n🎯 목표 소원: ${targetWish}\n🌀 진동 주파수: ${catalystData.manifestationFrequency}Hz\n\n✨ 이미 이루어진 오감 스크립트:\n"${catalystData.sensoryScript}"\n\n🚀 24시간 양자 도약 실천 행동:\n${catalystData.quantumLeapActions.map((a, i) => `${i+1}. ${a}`).join('\n')}\n\n⚡ 주파수 고정 확언:\n"${catalystData.vibrationalAnchorAffirmation}"\n\n- PRISM ORANGE Quantum Manifestation Catalyst`;
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
              <span className="text-[10px] text-white/40 font-mono">528Hz MIRACLE TONE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Zap className="text-orange-400 drop-shadow-[0_0_12px_rgba(249,115,22,0.8)]" size={28} />
              <span>양자 현실화 가속기 (Quantum Manifestation Catalyst)</span>
            </h2>
            <p className="text-xs sm:text-sm text-orange-100/70 max-w-xl leading-relaxed">
              <strong>Secret(좌측: 끌어당김 진동 일치)</strong>과 <strong>WELL(우측: 소원의 우물 투사)</strong>의 양쪽 메뉴 에너지를 융합하여, 바라는 미래를 현재 시점으로 즉각 붕괴시키는 〈양자 현실화 가속기〉입니다.
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
            <span>{isAudioPlaying ? '528Hz 기적 주파수 재생 중' : '528Hz 주파수 켜기'}</span>
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

          {/* Right Menu Status: Wishing Well */}
          <div className="p-4 rounded-2xl bg-black/30 border border-amber-400/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                <Compass size={13} className="text-amber-400" />
                우측 메뉴 : 소원의 우물 동전 투사
              </span>
              <span className="text-[10px] text-amber-400 font-mono">양자장 각인</span>
            </div>
            <div className="text-xs text-white/80 font-sans">
              {recentWishingWellWish ? (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                  <div className="text-[10px] text-amber-300 font-bold">최근 투사된 우물 소원:</div>
                  <div className="text-xs text-white line-clamp-1 font-medium">"{recentWishingWellWish}"</div>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/5 text-[11px] text-white/50">
                  우물에 소원을 던져 양자 도약 속도를 배가하세요.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Target Wish Formulation Card */}
      <div className="glass p-6 sm:p-8 rounded-[32px] border border-white/10 space-y-6">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-orange-300 flex items-center gap-2 font-mono uppercase tracking-wider">
            <Radio size={16} className="text-orange-400" />
            <span>1. 현실화하고자 하는 핵심 영역 선택</span>
          </label>
          <span className="text-[10px] text-white/40 font-sans">양자장 동판 각인</span>
        </div>

        {/* Category Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {MANIFESTATION_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat)}
                className={`p-3.5 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-orange-500/25 border-orange-400/80 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)] scale-[1.02]'
                    : 'bg-white/[0.03] border-white/10 text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="text-xl">{cat.icon}</span>
                <span className="text-xs font-bold font-sans truncate">{cat.label}</span>
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
            onChange={(e) => setTargetWish(e.target.value)}
            placeholder="예: 2026년 가을까지 온전한 경제적 자유를 이루고 사랑하는 사람들과 함께 세계를 여행한다..."
            className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-orange-400/60 leading-relaxed resize-none font-sans"
          />
          {recentWishingWellWish && (
            <button
              type="button"
              onClick={() => setTargetWish(recentWishingWellWish)}
              className="text-[11px] text-orange-300 hover:text-orange-200 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all cursor-pointer mt-2"
            >
              <Sparkles size={12} className="text-orange-400 animate-pulse" />
              <span>소원의 우물에서 올린 최근 소원 불러오기: "{recentWishingWellWish.slice(0, 30)}{recentWishingWellWish.length > 30 ? '...' : ''}"</span>
            </button>
          )}
        </div>

        {/* Frequency Tuning Bar */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Zap size={14} className="text-yellow-400" />
              양자 진동수 조율: <strong className="text-orange-400 font-mono">{dialValue}Hz</strong>
            </span>
            <p className="text-[10px] text-white/40">528Hz는 DNA 복구와 기적을 부르는 솔페지오 주파수입니다.</p>
          </div>
          <div className="flex gap-2">
            {[432, 528, 639, 741, 852].map((freq) => (
              <button
                key={freq}
                onClick={() => setDialValue(freq)}
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
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-orange-400">
                  QUANTUM MANIFESTATION CERTIFICATE
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-300 border border-yellow-500/20 font-mono">
                  {catalystData.manifestationFrequency}Hz
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
          <div className="p-5 rounded-2xl bg-orange-950/30 border border-orange-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] text-orange-300/70 font-mono font-bold uppercase">
                VIBRATIONAL ANCHOR AFFIRMATION
              </span>
              <p className="text-xs sm:text-sm font-bold text-amber-200">
                "{catalystData.vibrationalAnchorAffirmation}"
              </p>
            </div>
            <div className="text-[10px] text-white/40 font-mono shrink-0">
              {catalystData.timelineWindow}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
