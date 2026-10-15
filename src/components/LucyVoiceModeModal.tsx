import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  RotateCcw,
  Radio,
  MessageCircle,
  Headphones,
} from 'lucide-react';
import { invokeLLM, PERSONAS } from '@/lib/ai';
import { playTTS, stopTTS, subscribeTTS } from '@/utils/tts';
import { unlockAudioPlayback } from '@/lib/audio';
import { playAudioHaptic } from '@/lib/audioHaptics';
import { useApp } from '@/contexts/AppContext';
import { appendSavedUnifiedMessage } from '@/lib/chatHistorySync';

type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

export function openLucyVoiceMode() {
  if (typeof window !== 'undefined') {
    unlockAudioPlayback();
    window.dispatchEvent(new CustomEvent('prism:open_lucy_voice_mode'));
  }
}

export function LucyVoiceModeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [lucyReply, setLucyReply] = useState('');
  const [isHandsFree, setIsHandsFree] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [recognizedInterim, setRecognizedInterim] = useState('');

  const { sharedState } = useApp();
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const voiceStateRef = useRef<VoiceState>('idle');
  voiceStateRef.current = voiceState;
  const startListeningRef = useRef<() => void>(() => {});

  // Listen to open/close events
  useEffect(() => {
    const handleOpen = () => {
      unlockAudioPlayback();
      setIsOpen(true);
      setVoiceState('idle');
      setTranscript('');
      setLucyReply('안녕하세요! 편하게 말씀해 주세요. 귀 기울이고 있어요.');
      setTimeout(() => {
        startListeningRef.current?.();
      }, 450);
    };
    const handleClose = () => {
      stopListening();
      stopTTS();
      setIsOpen(false);
    };

    window.addEventListener('prism:open_lucy_voice_mode', handleOpen);
    window.addEventListener('prism:close_lucy_voice_mode', handleClose);
    return () => {
      window.removeEventListener('prism:open_lucy_voice_mode', handleOpen);
      window.removeEventListener('prism:close_lucy_voice_mode', handleClose);
    };
  }, []);

  // Subscribe to TTS state to switch from speaking to listening
  useEffect(() => {
    const unsub = subscribeTTS((state) => {
      if (voiceStateRef.current === 'speaking' && !state.isSpeaking && !state.isLoading) {
        setVoiceState('idle');
        if (isHandsFree) {
          // In hands-free mode, start listening for user's next utterance after short pause
          setTimeout(() => {
            startListening();
          }, 350);
        }
      }
    });
    return unsub;
  }, [isHandsFree]);

  // Speech Recognition Setup (Web Speech API)
  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (_) {}
      recognitionRef.current = null;
    }
    setRecognizedInterim('');
  }, []);

  const handleUserSpokenInput = useCallback(async (userText: string) => {
    if (!userText || !userText.trim()) {
      setVoiceState('idle');
      return;
    }

    setTranscript(userText);
    setVoiceState('thinking');
    playAudioHaptic('tap_light');

    // Save user message to persistent unified chat
    appendSavedUnifiedMessage({
      id: `voice_u_${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: Date.now(),
      persona: 'lucy',
    });

    try {
      const userProfile = sharedState?.userProfile;
      const userName = userProfile?.basic?.nickname || userProfile?.basic?.name || '친구';
      const userMbti = userProfile?.psych?.mbti || '';

      const systemPrompt = `당신은 사용자의 든든한 행운과 마음치유 AI 친구 'Lucy(루시)'입니다.
[음성 대화 모드 전용 지침]:
1. 당신은 다정하고 따뜻하며 명쾌한 여성 목소리의 AI 동반자입니다.
2. 실시간 음성 대화이므로, 짧고 자연스러운 한국어 구어체(1~3문장 이내)로 핵심을 산뜻하게 말하세요.
3. 마크다운 특수기호(#, *, 불릿, 백틱 등)를 쓰지 말고, 귀로 듣기 편안한 한글 문장으로만 답변하세요.
4. 사용자 호칭: ${userName}${userMbti ? ` (MBTI: ${userMbti})` : ''}`;

      const aiReply = await invokeLLM({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userText },
        ],
      });

      const cleanReply = aiReply.replace(/[*#_~`\[\]]/g, '').trim() || '네, 말씀 잘 들었어요. 어떤 점이 더 궁금하신가요?';
      setLucyReply(cleanReply);
      setVoiceState('speaking');

      // Save assistant message to persistent unified chat
      appendSavedUnifiedMessage({
        id: `voice_a_${Date.now()}`,
        role: 'model',
        content: cleanReply,
        timestamp: Date.now(),
        persona: 'lucy',
      });

      // Play using Korean female voice (Kore / ko-KR-SunHiNeural)
      unlockAudioPlayback();
      await playTTS(cleanReply, 'Kore', true, '다정');
    } catch (err) {
      console.warn('[LucyVoiceMode] LLM error:', err);
      const fallback = '잠시 생각이 길어졌네요. 다시 한 번 편안히 말씀해 주시겠어요?';
      setLucyReply(fallback);
      setVoiceState('speaking');
      await playTTS(fallback, 'Kore', true);
    }
  }, [sharedState]);

  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;
    stopTTS();
    stopListening();
    unlockAudioPlayback();

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('현재 브라우저에서 실시간 음성 인식을 지원하지 않습니다. Chrome 또는 Safari 최신 버전을 권장합니다.');
      setVoiceState('idle');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ko-KR';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        isListeningRef.current = true;
        setVoiceState('listening');
        playAudioHaptic('tap_light');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        setRecognizedInterim(interim || final);

        if (final && final.trim()) {
          stopListening();
          handleUserSpokenInput(final.trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('[LucyVoiceMode] Recognition error:', event.error);
        if (event.error === 'not-allowed') {
          alert('마이크 사용 권한이 필요합니다. 브라우저 설정에서 마이크를 허용해 주세요.');
        }
        stopListening();
        setVoiceState('idle');
      };

      recognition.onend = () => {
        isListeningRef.current = false;
        if (voiceStateRef.current === 'listening') {
          setVoiceState('idle');
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn('[LucyVoiceMode] Failed to start recognition:', e);
      setVoiceState('idle');
    }
  }, [handleUserSpokenInput, stopListening]);

  startListeningRef.current = startListening;

  // Handle tap on the main orb
  const handleOrbClick = () => {
    if (voiceState === 'speaking') {
      // Tap while speaking = interrupt Lucy
      stopTTS();
      setVoiceState('idle');
      if (isHandsFree) {
        startListening();
      }
    } else if (voiceState === 'listening') {
      // Tap while listening = cancel listening
      stopListening();
      setVoiceState('idle');
    } else {
      // Tap while idle = start listening
      startListening();
    }
  };

  const handleCloseModal = () => {
    stopListening();
    stopTTS();
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] flex flex-col items-center justify-between p-6 sm:p-10 select-none bg-slate-950/95 backdrop-blur-3xl overflow-hidden font-sans"
      >
        {/* Ambient Cosmic Radial Glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{
              scale: voiceState === 'listening' ? [1, 1.25, 1] : voiceState === 'speaking' ? [1, 1.35, 1.1] : [1, 1.08, 1],
              opacity: voiceState === 'speaking' ? 0.45 : voiceState === 'listening' ? 0.35 : 0.2,
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] sm:w-[560px] sm:h-[560px] rounded-full blur-[100px] pointer-events-none"
            style={{
              background:
                voiceState === 'speaking'
                  ? 'radial-gradient(circle, #34d399 0%, #06b6d4 45%, #6366f1 80%, transparent 100%)'
                  : voiceState === 'listening'
                  ? 'radial-gradient(circle, #f59e0b 0%, #ec4899 50%, #8b5cf6 85%, transparent 100%)'
                  : voiceState === 'thinking'
                  ? 'radial-gradient(circle, #38bdf8 0%, #818cf8 60%, transparent 100%)'
                  : 'radial-gradient(circle, #10b981 0%, #3b82f6 50%, transparent 100%)',
            }}
          />
        </div>

        {/* Top Header */}
        <div className="relative z-10 w-full max-w-lg flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-slate-950 font-black shadow-[0_0_16px_rgba(52,211,153,0.5)]">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-white tracking-tight">Lucy AI Voice</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  여성 음성
                </span>
              </div>
              <p className="text-[10px] text-slate-400">자연스러운 실시간 대화 모드</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Hands-free Toggle */}
            <button
              type="button"
              onClick={() => setIsHandsFree((prev) => !prev)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                isHandsFree
                  ? 'bg-emerald-500/25 text-emerald-300 border-emerald-400/50 shadow-[0_0_12px_rgba(52,211,153,0.3)]'
                  : 'bg-white/5 text-slate-400 border-white/10'
              }`}
              title="연속 대화 모드 토글"
            >
              <Radio size={13} className={isHandsFree ? 'animate-pulse text-emerald-400' : ''} />
              <span>연속 대화</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={handleCloseModal}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer border border-white/10"
              title="음성 모드 닫기"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Center Animated Voice Orb */}
        <div className="relative z-10 flex flex-col items-center justify-center my-auto w-full max-w-md">
          <div
            onClick={handleOrbClick}
            className="relative cursor-pointer group flex items-center justify-center touch-manipulation"
            title={
              voiceState === 'speaking'
                ? '탭하여 루시 말 끊기'
                : voiceState === 'listening'
                ? '탭하여 듣기 중지'
                : '탭하여 말씀하기'
            }
          >
            {/* Outer Pulsing Wave Rings */}
            <motion.div
              animate={{
                scale: voiceState === 'speaking' ? [1, 1.45, 1.1] : voiceState === 'listening' ? [1, 1.3, 1] : [1, 1.12, 1],
                opacity: voiceState === 'speaking' ? [0.4, 0.7, 0.4] : voiceState === 'listening' ? [0.3, 0.6, 0.3] : [0.2, 0.4, 0.2],
              }}
              transition={{ duration: voiceState === 'speaking' ? 1.4 : 2.2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute w-56 h-56 sm:w-64 sm:h-64 rounded-full border border-emerald-400/30"
            />
            <motion.div
              animate={{
                scale: voiceState === 'speaking' ? [1, 1.25, 1.05] : voiceState === 'listening' ? [1, 1.2, 1] : [1, 1.06, 1],
                opacity: voiceState === 'speaking' ? [0.5, 0.85, 0.5] : voiceState === 'listening' ? [0.4, 0.7, 0.4] : [0.25, 0.5, 0.25],
              }}
              transition={{ duration: voiceState === 'speaking' ? 1.0 : 1.8, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute w-44 h-44 sm:w-52 sm:h-52 rounded-full border border-teal-300/40"
            />

            {/* Glowing Core Sphere */}
            <motion.div
              animate={{
                scale: voiceState === 'listening' ? [1, 1.08, 1] : voiceState === 'speaking' ? [1, 1.15, 1] : [1, 1.04, 1],
                boxShadow:
                  voiceState === 'speaking'
                    ? '0 0 50px rgba(52,211,153,0.7), inset 0 0 30px rgba(255,255,255,0.6)'
                    : voiceState === 'listening'
                    ? '0 0 50px rgba(245,158,11,0.6), inset 0 0 30px rgba(255,255,255,0.6)'
                    : '0 0 35px rgba(56,189,248,0.5), inset 0 0 25px rgba(255,255,255,0.4)',
              }}
              transition={{ duration: voiceState === 'speaking' ? 0.8 : 2.0, repeat: Infinity, ease: 'easeInOut' }}
              className="w-36 h-36 sm:w-44 sm:h-44 rounded-full flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden"
              style={{
                background:
                  voiceState === 'speaking'
                    ? 'radial-gradient(circle at 35% 30%, #a7f3d0 0%, #10b981 50%, #047857 100%)'
                    : voiceState === 'listening'
                    ? 'radial-gradient(circle at 35% 30%, #fef3c7 0%, #f59e0b 50%, #b45309 100%)'
                    : voiceState === 'thinking'
                    ? 'radial-gradient(circle at 35% 30%, #e0f2fe 0%, #0284c7 50%, #0369a1 100%)'
                    : 'radial-gradient(circle at 35% 30%, #bae6fd 0%, #0284c7 50%, #0f172a 100%)',
              }}
            >
              {voiceState === 'listening' ? (
                <Mic size={44} className="text-amber-950 animate-pulse" />
              ) : voiceState === 'speaking' ? (
                <Volume2 size={44} className="text-emerald-950 animate-bounce" />
              ) : voiceState === 'thinking' ? (
                <Sparkles size={40} className="text-cyan-950 animate-spin" />
              ) : (
                <Mic size={40} className="text-white/90 group-hover:scale-110 transition-transform" />
              )}
            </motion.div>
          </div>

          {/* Status Label */}
          <div className="mt-8 text-center space-y-1.5">
            <p className="text-sm font-bold tracking-wide">
              {voiceState === 'listening' ? (
                <span className="text-amber-300 flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  듣고 있어요... 말씀해 주세요
                </span>
              ) : voiceState === 'thinking' ? (
                <span className="text-cyan-300 flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  루시가 생각하고 있어요...
                </span>
              ) : voiceState === 'speaking' ? (
                <span className="text-emerald-300 flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  루시가 대답하고 있어요 (탭하여 말 끊기)
                </span>
              ) : (
                <span className="text-slate-300">구슬을 탭하여 말씀해 보세요</span>
              )}
            </p>
          </div>
        </div>

        {/* Live Subtitle Transcript Banner */}
        <div className="relative z-10 w-full max-w-lg mb-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-lg min-h-[90px] flex flex-col justify-center">
            {voiceState === 'listening' && recognizedInterim ? (
              <p className="text-xs sm:text-sm text-amber-200 font-medium leading-relaxed italic animate-pulse">
                "{recognizedInterim}"
              </p>
            ) : lucyReply ? (
              <p className="text-xs sm:text-sm text-slate-100 font-medium leading-relaxed">
                {lucyReply}
              </p>
            ) : (
              <p className="text-xs text-slate-400 text-center">
                대화 내용이 이곳에 실시간으로 표시됩니다.
              </p>
            )}
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div className="relative z-10 w-full max-w-lg flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={handleOrbClick}
            className={`px-6 py-3.5 rounded-full font-bold text-sm shadow-xl transition-all cursor-pointer flex items-center gap-2 ${
              voiceState === 'listening'
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_24px_rgba(245,158,11,0.5)]'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_24px_rgba(52,211,153,0.5)]'
            }`}
          >
            {voiceState === 'listening' ? <MicOff size={18} /> : <Mic size={18} />}
            <span>{voiceState === 'listening' ? '듣기 완료' : '말하기 시작'}</span>
          </button>

          <button
            type="button"
            onClick={handleCloseModal}
            className="px-5 py-3.5 rounded-full bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white font-bold text-sm border border-white/10 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <MessageCircle size={16} />
            <span>채팅으로 복귀</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
