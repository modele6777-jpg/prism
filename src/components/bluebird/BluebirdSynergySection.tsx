import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Flame, Sparkles, Mail, Send, Check, Copy, RefreshCw, Volume2, VolumeX, Shield, Award, Feather, Wind } from 'lucide-react';
import { useApp, getPersistentUserProfile } from '@/contexts/AppContext';
import { invokeLLM } from '@/lib/ai';
import { recordPrismFeature } from '@/lib/prismOmniSync';
import { playTTS, stopTTS, useTTSActive } from '@/utils/tts';

interface PureZeroData {
  title: string;
  cleansingCode: string;
  hoponoponoWhisper: {
    sorry: string;
    forgive: string;
    thanks: string;
    love: string;
  };
  transmutedOracleResponse: string;
  pureZeroDeclaration: string;
  spiritualResetDate: string;
}

const FALLBACK_ZERO: PureZeroData = {
  title: "감정 소각 & 순수 백지 환생 (Pure Zero Transmutation)",
  cleansingCode: "HOOPONOPONO-ZERO-LIMIT-BLUEBIRD",
  hoponoponoWhisper: {
    sorry: "나의 무의식 속에 쌓여 있던 기억과 고통의 패턴들에 대해 미안합니다.",
    forgive: "스스로를 자책하고 타인을 원망했던 과거의 마음을 너그럽게 용서합니다.",
    thanks: "이 아픔을 통해 내면을 마주하고 정화할 기회를 주어 진심으로 고맙습니다.",
    love: "상처를 딛고 온전한 본래의 빛으로 회귀하는 나 자신을 온 마음 다해 사랑합니다."
  },
  transmutedOracleResponse: "그대가 남긴 비밀스러운 아픔과 상처의 편지는 푸른 정화의 불꽃 속에서 완전히 재가 되어 흩어졌습니다. 이제 그대의 마음은 아무런 얼룩도 없는 순수한 백지(Pure White Zero)로 환생하였습니다.",
  pureZeroDeclaration: "나는 모든 기억의 얽힘을 영점(Zero)으로 돌려보내고, 온전한 평화와 사랑의 빛으로 다시 태어납니다.",
  spiritualResetDate: new Date().toLocaleDateString('ko-KR')
};

export function BluebirdSynergySection() {
  const { updateSharedState } = useApp();
  const userProfile = getPersistentUserProfile();
  const [confessionText, setConfessionText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isIncinerated, setIsIncinerated] = useState<boolean>(false);
  const [pureZeroData, setPureZeroData] = useState<PureZeroData>(FALLBACK_ZERO);
  const [copied, setCopied] = useState<boolean>(false);
  const [savedToast, setSavedToast] = useState<boolean>(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const isTTSActive = useTTSActive();

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);

  const toggle417Hz = () => {
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
        osc.frequency.setValueAtTime(417, ctx.currentTime);

        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 1.2);

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

  const handleSpeakHooponopono = () => {
    if (isTTSActive) {
      stopTTS();
    } else {
      const text = `블루버드 영점 회귀 정화입니다. 오라클의 계시: ${pureZeroData.transmutedOracleResponse}. 미안합니다: ${pureZeroData.hoponoponoWhisper.sorry}. 용서하세요: ${pureZeroData.hoponoponoWhisper.forgive}. 고맙습니다: ${pureZeroData.hoponoponoWhisper.thanks}. 사랑합니다: ${pureZeroData.hoponoponoWhisper.love}. 순수 백지 환생 선언: ${pureZeroData.pureZeroDeclaration}`;
      playTTS(text, 'Kore', false, '치유');
    }
  };

  const handleIncinerateAndTransmute = async () => {
    if (!confessionText.trim()) return;
    setIsLoading(true);

    const systemPrompt = "당신은 블루버드의 호오포노포노 & 감정 소각 연금술 마스터입니다. 사용자가 털어놓은 아픔/후회/상처의 비밀쪽지를 호오포노포노 4대 정화 언어(미안합니다, 용서하세요, 고맙습니다, 사랑합니다)와 융합하여 완전히 0(Zero State)으로 승화시키는 정화의 계시를 생성하세요.";
    const userPrompt = `[비밀 편지 내용]: "${confessionText.trim()}"
[사용자 닉네임]: "${userProfile?.basic?.nickname || '순수한 영혼'}"

반드시 아래 JSON 스키마로만 엄격하게 응답하세요:
{
  "title": "감정 소각 정화 명칭 (예: 417Hz 영점 회귀 백지 환생)",
  "cleansingCode": "영문 대문자 시길 코드",
  "hoponoponoWhisper": {
    "sorry": "이 상황과 기억에 건네는 '미안합니다' 정화 문장 1개",
    "forgive": "자신과 대상을 감싸안는 '용서하세요' 정화 문장 1개",
    "thanks": "정화의 계기가 되어준 것에 대한 '고맙습니다' 문장 1개",
    "love": "영혼을 채우는 '사랑합니다' 축복 문장 1개"
  },
  "transmutedOracleResponse": "편지가 불꽃 속에서 타올라 순수한 백지로 변환되었음을 전하는 시적이고 따뜻한 위로의 계시 (3~4문장)",
  "pureZeroDeclaration": "0(Zero)의 본래 빛으로 되돌아왔음을 선언하는 1인칭 확언문",
  "spiritualResetDate": "${new Date().toLocaleDateString('ko-KR')}"
}`;

    const safetyTimeout = new Promise<PureZeroData>((resolve) => {
      setTimeout(() => {
        resolve({
          ...FALLBACK_ZERO,
          transmutedOracleResponse: `당신이 털어놓은 아픔은 푸른 불꽃 속에서 영원한 사랑의 빛으로 승화되었습니다. 이제 당신의 마음은 아무런 앙금도 남지 않은 눈부신 백지입니다.`
        });
      }, 6500);
    });

    const runAI = async (): Promise<PureZeroData> => {
      try {
        const raw = await invokeLLM({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          responseFormat: { type: 'json_object' }
        });
        const parsed = typeof raw === 'string' ? JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim()) : raw;
        if (parsed && parsed.transmutedOracleResponse) {
          return parsed;
        }
      } catch (e) {
        console.warn('[BluebirdSynergy] invokeLLM error:', e);
      }
      throw new Error('Need fallback');
    };

    try {
      const result = await Promise.race([runAI(), safetyTimeout]);
      setPureZeroData(result);
      setIsIncinerated(true);
      recordPrismFeature({
        app: 'bluebird',
        featureName: 'Bluebird Pure Zero Synergy',
        summary: result.title,
        details: { title: result.title }
      });
      updateSharedState({}, 'BLUEBIRD');
    } catch (e) {
      console.warn('Bluebird fallback error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    const text = `🐦 [${pureZeroData.title}]\n\n🔥 호오포노포노 4대 정화:\n1. 미안합니다: ${pureZeroData.hoponoponoWhisper.sorry}\n2. 용서하세요: ${pureZeroData.hoponoponoWhisper.forgive}\n3. 고맙습니다: ${pureZeroData.hoponoponoWhisper.thanks}\n4. 사랑합니다: ${pureZeroData.hoponoponoWhisper.love}\n\n✨ 백지 환생 오라클:\n"${pureZeroData.transmutedOracleResponse}"\n\n🕊️ 영점 회귀 확언: "${pureZeroData.pureZeroDeclaration}"\n- PRISM BLUEBIRD Pure Zero Transmutation`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-12 text-white font-sans">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 border border-sky-500/30 bg-gradient-to-br from-sky-950/50 via-zinc-950/90 to-blue-950/40 shadow-[0_0_50px_rgba(14,165,233,0.15)] backdrop-blur-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-sky-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-blue-500/10 blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold font-mono tracking-widest uppercase bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1.5">
                <Sparkles size={12} className="text-sky-400 animate-pulse" />
                HO'OPONOPONO + SECRET NOTE FUSION
              </span>
              <span className="text-[10px] text-white/40 font-mono">417Hz PURIFICATION</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Feather className="text-sky-400 drop-shadow-[0_0_12px_rgba(14,165,233,0.8)]" size={28} />
              <span>감정 소각 & 순수 백지 환생 (Pure Zero)</span>
            </h2>
            <p className="text-xs sm:text-sm text-sky-100/70 max-w-xl leading-relaxed">
              <strong>호오포노포노(섹션1)</strong>의 4대 치유 언어와 <strong>비밀쪽지(섹션2)</strong>의 솔직한 고백을 융합하여, 마음에 맺힌 상처와 응어리를 푸른 불꽃으로 소각하고 완전한 순수 백지로 환생시킵니다.
            </p>
          </div>

          <button
            onClick={toggle417Hz}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold font-sans flex items-center gap-2 border transition-all cursor-pointer shrink-0 ${
              isAudioPlaying
                ? 'bg-sky-500 text-black border-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.6)] animate-pulse'
                : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'
            }`}
          >
            {isAudioPlaying ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{isAudioPlaying ? '417Hz 정화음 재생 중' : '417Hz 정화음 켜기'}</span>
          </button>
        </div>
      </div>

      {/* Secret Letter Form */}
      {!isIncinerated ? (
        <div className="glass p-6 sm:p-8 rounded-[32px] border border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-sky-300 flex items-center gap-2 font-mono uppercase tracking-wider">
              <Mail size={16} className="text-sky-400" />
              <span>1. 소각하고 싶은 마음의 짐, 상처, 혹은 비밀스러운 고백 작성</span>
            </label>
            <span className="text-[10px] text-white/40 font-sans">작성 후 즉시 정화 소각</span>
          </div>

          <textarea
            rows={5}
            value={confessionText}
            onChange={(e) => setConfessionText(e.target.value)}
            placeholder="누구에게도 말하지 못했던 마음의 상처, 스스로에 대한 자책, 후회, 원망, 혹은 서운했던 감정을 이곳에 모두 털어놓으세요. 당신이 누르는 순간 푸른 불꽃 속에서 영원히 소각됩니다..."
            className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-sky-400/60 leading-relaxed resize-none font-sans"
          />

          <button
            onClick={handleIncinerateAndTransmute}
            disabled={isLoading || !confessionText.trim()}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white font-black text-sm tracking-wider uppercase transition-all shadow-[0_0_30px_rgba(14,165,233,0.4)] hover:shadow-[0_0_40px_rgba(14,165,233,0.6)] active:scale-[0.99] flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw size={18} className="animate-spin text-white" />
                <span>푸른 불꽃으로 소각 및 백지 환생 중...</span>
              </>
            ) : (
              <>
                <Flame size={18} className="text-amber-300 animate-pulse" />
                <span>〈감정 소각 & 순수 백지 환생〉 단행하기</span>
              </>
            )}
          </button>
        </div>
      ) : (
        /* Reborn Pure Zero Card */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-[36px] sm:rounded-[44px] bg-gradient-to-b from-zinc-900/95 via-zinc-950/95 to-black/95 border border-sky-500/30 p-6 sm:p-10 space-y-8 shadow-2xl relative overflow-hidden backdrop-blur-2xl"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-sky-400">
                  PURE ZERO TRANSMUTATION COMPLETE
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20 font-mono">
                  {pureZeroData.spiritualResetDate}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">{pureZeroData.title}</h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleSpeakHooponopono}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isTTSActive
                    ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 animate-pulse'
                    : 'bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-500/30'
                }`}
              >
                {isTTSActive ? <VolumeX size={14} className="text-amber-300" /> : <Volume2 size={14} className="text-sky-300" />}
                <span>{isTTSActive ? '낭독 중단' : '정화 확언 음성 낭독'}</span>
              </button>

              <button
                onClick={handleCopy}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copied ? '복사 완료' : '정화 확언 복사'}</span>
              </button>

              <button
                onClick={() => {
                  setIsIncinerated(false);
                  setConfessionText('');
                }}
                className="px-3.5 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-xs font-bold transition-all cursor-pointer"
              >
                새로운 쪽지 작성
              </button>
            </div>
          </div>

          {/* Incineration Result Oracle */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-sky-900/30 via-zinc-900/50 to-blue-900/20 border border-sky-400/40 relative shadow-inner space-y-3">
            <span className="text-[10px] font-mono text-sky-300 uppercase tracking-widest font-bold flex items-center gap-1.5">
              <Sparkles size={14} className="text-sky-400" />
              블루버드 정화 오라클의 계시 (Oracle Response)
            </span>
            <p className="text-base sm:text-lg font-bold text-white leading-relaxed tracking-tight break-keep">
              "{pureZeroData.transmutedOracleResponse}"
            </p>
          </div>

          {/* 4-Step Ho'oponopono Whispers */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-sky-300 uppercase font-mono tracking-wider flex items-center gap-2">
              <Heart size={14} className="text-rose-400" /> 호오포노포노 4대 정화 속삭임
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { title: '미안합니다 (I am sorry)', text: pureZeroData.hoponoponoWhisper.sorry, color: 'text-indigo-300' },
                { title: '용서하세요 (Please forgive me)', text: pureZeroData.hoponoponoWhisper.forgive, color: 'text-sky-300' },
                { title: '고맙습니다 (Thank you)', text: pureZeroData.hoponoponoWhisper.thanks, color: 'text-teal-300' },
                { title: '사랑합니다 (I love you)', text: pureZeroData.hoponoponoWhisper.love, color: 'text-rose-300' },
              ].map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                  <span className={`text-[10px] font-mono font-bold ${item.color} uppercase`}>
                    {item.title}
                  </span>
                  <p className="text-xs text-white/80 leading-relaxed font-sans">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Affirmation Banner */}
          <div className="p-5 rounded-2xl bg-sky-950/40 border border-sky-500/30 space-y-1">
            <span className="text-[10px] text-sky-400 font-mono font-bold uppercase">
              PURE ZERO RESET AFFIRMATION
            </span>
            <p className="text-xs sm:text-sm font-bold text-white leading-relaxed">
              "{pureZeroData.pureZeroDeclaration}"
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
