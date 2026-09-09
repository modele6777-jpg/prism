import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Leaf, Timer, Sparkles, Wind, Volume2, VolumeX, Check, Copy, RefreshCw, Zap, Award, ArrowRight, ShieldCheck, Heart, Play, Square } from 'lucide-react';
import { useApp, getPersistentUserProfile } from '@/contexts/AppContext';
import { invokeLLM } from '@/lib/ai';
import { recordPrismFeature } from '@/lib/prismOmniSync';
import { playTTS, stopTTS, useTTSActive } from '@/utils/tts';

interface SanctuaryData {
  title: string;
  tensionArea: string;
  sedonaInquiryAnswer: string;
  sixtySecondSanctuaryProtocol: string[];
  zeroResistanceDeclaration: string;
  pureLightState: string;
}

const FALLBACK_SANCTUARY: SanctuaryData = {
  title: "완전 해방 방하착 챔버 (Zero-Resistance Sanctuary)",
  tensionArea: "가슴 답답함 & 어깨 긴장",
  sedonaInquiryAnswer: "지금 쥐고 있는 통제의 욕구와 불안을 가슴 밖으로 완전히 열어놓습니다. 손을 펴듯 마음에 쥔 힘을 내려놓습니다.",
  sixtySecondSanctuaryProtocol: [
    "00~15초: 숨을 깊게 들이쉬며 긴장된 몸 부위를 따뜻한 시선으로 자각합니다.",
    "15~35초: '이 느낌을 환영하고 기꺼이 머물게 할 수 있는가?' 속으로 묻고 허용합니다.",
    "35~50초: '이 감정을 놓아줄 수 있는가? 놓아줄 것인가? 언제? 지금!' 호흡과 함께 날려보냅니다.",
    "50~60초: 텅 빈 공간에 채워지는 순수한 평온과 고요함을 누립니다."
  ],
  zeroResistanceDeclaration: "나는 모든 저항과 집착을 허공 속으로 가볍게 흘려보내고, 본래의 완전한 자유와 평온으로 돌아옵니다.",
  pureLightState: "저항 0% · 순수 현존 (Zero-Resistance Pure Presence)"
};

const TENSION_PRESETS = [
  { id: 'chest', label: '가슴의 압박감과 답답함', icon: '🫀' },
  { id: 'shoulders', label: '어깨와 목덜미의 뻐근한 긴장', icon: '🧘' },
  { id: 'head', label: '머릿속 복잡한 생각과 두통', icon: '🧠' },
  { id: 'stomach', label: '명치와 복부의 조여듦', icon: '🌀' },
  { id: 'control', label: '모든 것을 통제하려는 강박', icon: '⛓️' },
  { id: 'fear', label: '불확실성에 대한 막연한 두려움', icon: '🌫️' },
];

export function AuraSynergySection() {
  const { updateSharedState } = useApp();
  const userProfile = getPersistentUserProfile();
  const [selectedTension, setSelectedTension] = useState<string>(TENSION_PRESETS[0].id);
  const [customDetail, setCustomDetail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // Initial state is null so result does not appear prematurely before user action
  const [sanctuaryData, setSanctuaryData] = useState<SanctuaryData | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isChamberActive, setIsChamberActive] = useState<boolean>(false);
  const [isChamberCompleted, setIsChamberCompleted] = useState<boolean>(false);
  const [chamberTimer, setChamberTimer] = useState<number>(60);
  const [isTtsGuideEnabled, setIsTtsGuideEnabled] = useState<boolean>(true);
  const isTTSActive = useTTSActive();
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const lastSpokenPhaseRef = useRef<number | null>(null);

  const toggleTone = () => {
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
        osc.frequency.setValueAtTime(528, ctx.currentTime);

        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 1.5);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        oscRef.current = osc;
        setIsAudioPlaying(true);
      } catch (e) {
        console.warn('Sanctuary audio error:', e);
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

  // Helper to extract clean voice prompt from protocol item
  const getCleanPhaseSpeech = (text: string, phaseIndex: number): string => {
    const raw = text.replace(/^\d+~\d+초\s*:\s*/, '').trim();
    const phaseTitles = [
      '1단계, 자각 단계입니다. ',
      '2단계, 허용과 환영 단계입니다. ',
      '3단계, 놓아줌과 흘려보내기 단계입니다. ',
      '4단계, 순수 현존 정착 단계입니다. '
    ];
    return (phaseTitles[phaseIndex] || '') + raw;
  };

  // Compute current protocol phase from remaining seconds
  // 60s total:
  // Phase 0: 60 ~ 46 (0~15s elapsed)
  // Phase 1: 45 ~ 26 (15~35s elapsed)
  // Phase 2: 25 ~ 11 (35~50s elapsed)
  // Phase 3: 10 ~ 1  (50~60s elapsed)
  // Complete: 0
  const getCurrentPhaseIndex = (timer: number): number => {
    if (timer > 45) return 0;
    if (timer > 25) return 1;
    if (timer > 10) return 2;
    if (timer > 0) return 3;
    return 4; // Completed
  };

  // Chamber 60-second countdown and timed real-time TTS narration
  useEffect(() => {
    if (!isChamberActive) {
      lastSpokenPhaseRef.current = null;
      return;
    }

    const interval = setInterval(() => {
      setChamberTimer((prev) => {
        if (prev <= 1) {
          setIsChamberActive(false);
          setIsChamberCompleted(true);
          // On completion, speak final declaration if enabled - continues to the very end
          if (isTtsGuideEnabled && sanctuaryData?.zeroResistanceDeclaration) {
            playTTS(
              `60초 방하착 챔버가 온전히 완성되었습니다. 이제 모든 무거운 저항과 집착이 0으로 녹아내렸습니다. ${sanctuaryData.zeroResistanceDeclaration}`,
              'Kore',
              false,
              '평온'
            );
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isChamberActive, isTtsGuideEnabled, sanctuaryData]);

  // Real-time TTS trigger matching the current active phase
  useEffect(() => {
    if (!isChamberActive || !isTtsGuideEnabled || !sanctuaryData) return;

    const currentPhase = getCurrentPhaseIndex(chamberTimer);
    if (currentPhase < 4 && lastSpokenPhaseRef.current !== currentPhase) {
      lastSpokenPhaseRef.current = currentPhase;
      const protocolText = sanctuaryData.sixtySecondSanctuaryProtocol[currentPhase];
      if (protocolText) {
        const speechText = getCleanPhaseSpeech(protocolText, currentPhase);
        playTTS(speechText, 'Kore', false, '치유');
      }
    }
  }, [chamberTimer, isChamberActive, isTtsGuideEnabled, sanctuaryData]);

  const handleStartChamber = () => {
    if (isChamberActive || isChamberCompleted) {
      setIsChamberActive(false);
      setIsChamberCompleted(false);
      setChamberTimer(60);
      lastSpokenPhaseRef.current = null;
      stopTTS();
    } else {
      setIsChamberCompleted(false);
      setChamberTimer(60);
      setIsChamberActive(true);
      lastSpokenPhaseRef.current = null;
      // Immediately start 1st phase speech
      if (isTtsGuideEnabled && sanctuaryData?.sixtySecondSanctuaryProtocol?.[0]) {
        lastSpokenPhaseRef.current = 0;
        const firstSpeech = getCleanPhaseSpeech(sanctuaryData.sixtySecondSanctuaryProtocol[0], 0);
        playTTS(firstSpeech, 'Kore', false, '치유');
      }
    }
  };

  const handleSynthesizeSanctuary = async () => {
    setIsLoading(true);
    // Stop ongoing chamber or speech
    setIsChamberActive(false);
    setIsChamberCompleted(false);
    setChamberTimer(60);
    stopTTS();

    const item = TENSION_PRESETS.find(p => p.id === selectedTension);
    const tensionLabel = item ? item.label : '긴장';
    const combined = customDetail.trim() ? `${tensionLabel} (${customDetail.trim()})` : tensionLabel;

    const systemPrompt = "당신은 오라(AURA)의 완전 해방 방하착 챔버 마스터입니다. 세도나 메서드의 흘려보내기 5문답과 1분 마이크로 명상의 60초 집중 동조를 융합하여 '완전 해방 방하착 챔버' 가이드를 설계하세요.";
    const userPrompt = `[집착/긴장 상태]: "${combined}"
[사용자 닉네임]: "${userProfile?.basic?.nickname || '치유자'}"

반드시 아래 JSON 스키마로만 엄격하게 응답하세요:
{
  "title": "방하착 챔버 고유 명칭 (예: 528Hz 완전 해방 무저항 챔버)",
  "tensionArea": "${tensionLabel}",
  "sedonaInquiryAnswer": "세도나 5문답을 바탕으로 쥐고 있던 집착을 놓아주는 해방적 깨달음 문장",
  "sixtySecondSanctuaryProtocol": [
    "00~15초: 자각 단계 가이드",
    "15~35초: 허용 및 환영 단계 가이드",
    "35~50초: 흘려보내기(놓아줌) 단계 가이드",
    "50~60초: 순수 현존 상태 정착 가이드"
  ],
  "zeroResistanceDeclaration": "저항 0%로 회귀하는 1인칭 완전 해방 선언문",
  "pureLightState": "순수 해방 상태 명칭 (예: 저항 0% · 절대 평온)"
}`;

    const safetyTimeout = new Promise<SanctuaryData>((resolve) => {
      setTimeout(() => {
        resolve({
          ...FALLBACK_SANCTUARY,
          tensionArea: tensionLabel,
          title: `〈${tensionLabel} 해방〉 완전 방하착 챔버`
        });
      }, 6500);
    });

    const runAI = async (): Promise<SanctuaryData> => {
      try {
        const raw = await invokeLLM({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          responseFormat: { type: 'json_object' }
        });
        const parsed = typeof raw === 'string' ? JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim()) : raw;
        if (parsed && parsed.zeroResistanceDeclaration) {
          return parsed;
        }
      } catch (e) {
        console.warn('[AuraSynergy] invokeLLM error:', e);
      }
      throw new Error('Need fallback');
    };

    try {
      const result = await Promise.race([runAI(), safetyTimeout]);
      setSanctuaryData(result);
      recordPrismFeature({
        app: 'heal',
        featureName: 'Aura Zero-Resistance Sanctuary Synergy',
        summary: result.title,
        details: { tension: combined, title: result.title }
      });
      updateSharedState({}, 'HEAL');
    } catch (e) {
      console.warn('Aura fallback error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!sanctuaryData) return;
    const text = `⚡ [${sanctuaryData.title}]\n\n🌿 타겟 긴장: ${sanctuaryData.tensionArea}\n💬 세도나 방하착: ${sanctuaryData.sedonaInquiryAnswer}\n\n⏱️ 60초 챔버 프로토콜:\n${sanctuaryData.sixtySecondSanctuaryProtocol.join('\n')}\n\n🕊️ 완전 해방 선언: "${sanctuaryData.zeroResistanceDeclaration}"\n- PRISM AURA Zero-Resistance Sanctuary`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const currentPhaseIndex = isChamberActive ? getCurrentPhaseIndex(chamberTimer) : -1;
  const phaseNames = ['1단계: 자각', '2단계: 허용', '3단계: 놓아줌', '4단계: 순수 평온'];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-12 text-white font-sans">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 border border-emerald-500/30 bg-gradient-to-br from-emerald-950/50 via-zinc-950/90 to-teal-950/40 shadow-[0_0_50px_rgba(16,185,129,0.15)] backdrop-blur-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-teal-500/10 blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold font-mono tracking-widest uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <Sparkles size={12} className="text-emerald-400 animate-pulse" />
                SEDONA METHOD + 1-MIN MEDITATION FUSION
              </span>
              <span className="text-[10px] text-white/40 font-mono">ZERO RESISTANCE 528Hz</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Leaf className="text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.8)]" size={28} />
              <span>완전 해방 방하착 챔버 (Zero-Resistance)</span>
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/70 max-w-xl leading-relaxed">
              <strong>세도나 메서드(섹션1)</strong>의 5문답 흘려보내기 원리와 <strong>1분 마이크로 명상(섹션2)</strong>의 60초 집중 동조를 융합하여, 몸과 마음에 맺힌 저항을 0%로 증발시키는 방하착 챔버입니다.
            </p>
          </div>

          <button
            onClick={toggleTone}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold font-sans flex items-center gap-2 border transition-all cursor-pointer shrink-0 ${
              isAudioPlaying
                ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.6)] animate-pulse'
                : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'
            }`}
          >
            {isAudioPlaying ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{isAudioPlaying ? '치유 주파수 재생 중' : '528Hz 치유음 켜기'}</span>
          </button>
        </div>
      </div>

      {/* Tension Preset Selection */}
      <div className="glass p-6 sm:p-8 rounded-[32px] border border-white/10 space-y-6">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-emerald-300 flex items-center gap-2 font-mono uppercase tracking-wider">
            <Wind size={16} className="text-emerald-400" />
            <span>1. 오늘 즉시 흘려보내고 싶은 긴장/집착 영역 선택</span>
          </label>
          <span className="text-[10px] text-white/40 font-sans">실시간 해방 처방</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {TENSION_PRESETS.map((p) => {
            const isSelected = selectedTension === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedTension(p.id)}
                className={`p-3.5 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500/25 border-emerald-400/80 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] scale-[1.02]'
                    : 'bg-white/[0.03] border-white/10 text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="text-xl">{p.icon}</span>
                <span className="text-xs font-bold font-sans truncate">{p.label}</span>
              </button>
            );
          })}
        </div>

        <div>
          <label className="block text-[11px] text-white/50 mb-2 font-medium">
            마음에 걸리는 생각이나 쥐고 있는 감정이 있다면 자유롭게 적어주세요 (선택):
          </label>
          <input
            type="text"
            value={customDetail}
            onChange={(e) => setCustomDetail(e.target.value)}
            placeholder="예: 이번 프로젝트 결과에 대해 온종일 초조하고 안절부절못하겠어요..."
            className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-400/60 font-sans"
          />
        </div>

        <button
          onClick={handleSynthesizeSanctuary}
          disabled={isLoading}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-black text-sm tracking-wider uppercase transition-all shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:shadow-[0_0_40px_rgba(16,185,129,0.6)] active:scale-[0.99] flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <RefreshCw size={18} className="animate-spin text-black" />
              <span>세도나 5문답 & 60초 명상 챔버 융합 중...</span>
            </>
          ) : (
            <>
              <Zap size={18} className="text-black" />
              <span>〈완전 해방 방하착 챔버 & 60초 프로토콜〉 가동하기</span>
            </>
          )}
        </button>
      </div>

      {/* Output Chamber Card: Rendered ONLY when synthesized, avoiding premature results */}
      {sanctuaryData ? (
        <motion.div
          key={sanctuaryData.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[36px] sm:rounded-[44px] bg-gradient-to-b from-zinc-900/95 via-zinc-950/95 to-black/95 border border-emerald-500/30 p-6 sm:p-10 space-y-8 shadow-2xl relative overflow-hidden backdrop-blur-2xl"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400">
                  ZERO-RESISTANCE CHAMBER
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
                  {sanctuaryData.pureLightState}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">{sanctuaryData.title}</h3>
              <p className="text-xs text-emerald-200/70 mt-1 font-sans">
                타겟 저항: <strong className="text-white">{sanctuaryData.tensionArea}</strong> · {sanctuaryData.sedonaInquiryAnswer}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copied ? '복사 완료' : '전체 복사'}</span>
              </button>
            </div>
          </div>

          {/* 60s Interactive Chamber Timer Widget with Real-time TTS Narration */}
          <div className="p-6 rounded-3xl bg-emerald-950/20 border border-emerald-500/30 flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between w-full gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-2 font-mono">
                  <Timer size={16} className="text-emerald-400" />
                  <span>60초 무저항 방하착 챔버 가동</span>
                </span>
                {isChamberActive && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-[11px] font-bold text-emerald-300 animate-pulse font-sans">
                    {phaseNames[currentPhaseIndex] || '완전 해방 중'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* TTS Guide Toggle */}
                <button
                  onClick={() => setIsTtsGuideEnabled(!isTtsGuideEnabled)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isTtsGuideEnabled
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                      : 'bg-white/5 text-white/50 border-white/10 hover:text-white'
                  }`}
                  title="60초 단계별 실시간 음성 가이드 낭독 토글"
                >
                  {isTtsGuideEnabled ? <Volume2 size={13} className="text-emerald-400" /> : <VolumeX size={13} />}
                  <span>{isTtsGuideEnabled ? '실시간 TTS 낭독 ON' : 'TTS 낭독 OFF'}</span>
                </button>

                {/* Chamber Start/Stop Button */}
                <button
                  onClick={handleStartChamber}
                  className={`text-xs font-bold px-4 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                    isChamberActive
                      ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                      : isChamberCompleted && isTTSActive
                      ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 animate-pulse'
                      : isChamberCompleted
                      ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                      : 'bg-emerald-500 text-black hover:bg-emerald-400 border border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                  }`}
                >
                  {isChamberActive ? (
                    <>
                      <Square size={12} />
                      <span>챔버 중단</span>
                    </>
                  ) : isChamberCompleted && isTTSActive ? (
                    <>
                      <VolumeX size={12} />
                      <span>낭독 중단</span>
                    </>
                  ) : isChamberCompleted ? (
                    <>
                      <RefreshCw size={12} />
                      <span>다시 시작하기</span>
                    </>
                  ) : (
                    <>
                      <Play size={12} />
                      <span>60초 방하착 시작</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {isChamberActive ? (
              <div className="relative w-40 h-40 flex items-center justify-center py-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 rounded-full border border-dashed border-emerald-400/40"
                />
                <div className="w-32 h-32 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex flex-col items-center justify-center shadow-[0_0_35px_rgba(16,185,129,0.5)]">
                  <span className="text-3xl font-mono font-black text-white">{chamberTimer}s</span>
                  <span className="text-[10px] uppercase tracking-widest text-emerald-300 font-bold mt-0.5">
                    {phaseNames[currentPhaseIndex] || 'LETTING GO'}
                  </span>
                </div>
              </div>
            ) : isChamberCompleted ? (
              <div className="py-4 flex flex-col items-center justify-center space-y-3">
                <div className="relative flex items-center justify-center">
                  <div className={`w-20 h-20 rounded-full flex flex-col items-center justify-center border-2 transition-all ${
                    isTTSActive
                      ? 'bg-emerald-500/20 border-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.7)] animate-pulse'
                      : 'bg-emerald-500/30 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.4)]'
                  }`}>
                    {isTTSActive ? (
                      <Volume2 size={32} className="text-emerald-300 animate-bounce" />
                    ) : (
                      <Check size={36} className="text-emerald-300" />
                    )}
                  </div>
                </div>
                <div className="space-y-1 max-w-md">
                  <span className="text-sm font-bold text-emerald-300 flex items-center justify-center gap-1.5 font-sans">
                    <Sparkles size={15} className="text-emerald-400" />
                    <span>{isTTSActive ? '60초 챔버 완료 · 최종 해방 선언 낭독 중' : '저항 0% 완전 해방 달성 완료'}</span>
                  </span>
                  <p className="text-xs text-emerald-100/70 leading-relaxed font-sans">
                    {isTTSActive
                      ? '60초 챔버 타이머가 끝나도 선언문 낭독은 마지막 문장까지 온전히 전해집니다. 깊은 호흡과 함께 평온을 누리세요.'
                      : '모든 무거운 저항과 긴장이 허공으로 증발했습니다. 가벼워진 영혼으로 온전한 평화를 누리세요.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-3 text-xs text-white/50 max-w-md font-sans">
                '60초 방하착 시작'을 누르면 시간에 맞춰 4개 구간의 방하착 안내가 실시간 음성(TTS)과 함께 순서대로 흐릅니다.
              </div>
            )}
          </div>

          {/* 60s Protocol Timeline with Live Step Highlight & Narration Badge */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-emerald-300 uppercase font-mono tracking-wider flex items-center gap-2">
                <Wind size={14} /> 60초 단계별 방하착 가이드
              </h4>
              <span className="text-[11px] text-white/40 font-sans">
                {isChamberActive ? '실시간 챔버 가동 중' : '시간 맞춰 음성 낭독'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sanctuaryData.sixtySecondSanctuaryProtocol.map((proto, idx) => {
                const isCurrentPhase = isChamberActive && currentPhaseIndex === idx;
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition-all duration-300 relative ${
                      isCurrentPhase
                        ? 'bg-emerald-950/60 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.3)] scale-[1.01]'
                        : 'bg-white/[0.03] border-white/10 text-white/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className={`text-[11px] font-bold font-mono tracking-wide ${isCurrentPhase ? 'text-emerald-300' : 'text-white/60'}`}>
                        {phaseNames[idx]}
                      </span>
                      {isCurrentPhase && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full animate-pulse">
                          <Volume2 size={11} />
                          실시간 안내 중
                        </span>
                      )}
                    </div>
                    <p className={`text-xs leading-relaxed font-sans ${isCurrentPhase ? 'text-white font-medium' : 'text-white/70'}`}>
                      {proto}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Zero Resistance Declaration */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-900/30 via-zinc-900/50 to-teal-900/20 border border-emerald-400/40 relative shadow-inner space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-emerald-300 uppercase tracking-widest font-bold flex items-center gap-1.5">
                <Sparkles size={14} className="text-emerald-400" />
                저항 0% 완전 해방 선언문 (Zero-Resistance Declaration)
              </span>
              <button
                onClick={() => {
                  playTTS(sanctuaryData.zeroResistanceDeclaration, 'Kore', false, '평온');
                }}
                className="text-[11px] font-bold text-emerald-300 hover:text-emerald-200 flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-full border border-emerald-400/20 transition-all cursor-pointer"
                title="선언문 음성 낭독 듣기"
              >
                <Volume2 size={12} />
                선언문 듣기
              </button>
            </div>
            <p className="text-base sm:text-lg font-bold text-white leading-relaxed tracking-tight break-keep">
              "{sanctuaryData.zeroResistanceDeclaration}"
            </p>
          </div>
        </motion.div>
      ) : (
        /* Standby State: Before Synthesizing */
        <div className="rounded-[32px] border border-dashed border-white/15 bg-white/[0.02] p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
            <Timer size={28} />
          </div>
          <div className="space-y-1.5 max-w-md">
            <h4 className="text-base font-bold text-white">방하착 챔버 대기 상태</h4>
            <p className="text-xs text-white/50 leading-relaxed font-sans">
              상단에서 흘려보내고 싶은 긴장·집착 영역을 선택하고 <strong>〈가동하기〉</strong> 버튼을 누르면,
              당신만을 위한 세도나 5문답 해방 처방과 60초 실시간 TTS 음성 안내 챔버가 시작됩니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

