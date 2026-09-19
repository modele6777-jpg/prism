import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Check,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  MessageCircle,
  Heart,
  Share2,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import {
  type CalmPrescription,
  type CalmPracticeStep,
  recordPrescriptionCompleted,
} from '@/lib/calmPharmacopeia';
import { sacredAudio } from '@/lib/omniWarp/sacredAudio';
import { triggerHaptic } from '@/lib/omniWarp/omniWarpHaptics';

interface CalmTechniquePracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  prescription: CalmPrescription | null;
  sourceParchmentTitle?: string;
  onNavigateToLucy?: (contextPrompt: string) => void;
  onNavigateToHeal?: () => void;
}

export function CalmTechniquePracticeModal({
  isOpen,
  onClose,
  prescription,
  sourceParchmentTitle,
  onNavigateToLucy,
  onNavigateToHeal,
}: CalmTechniquePracticeModalProps) {
  if (!isOpen || !prescription) return null;

  const steps: CalmPracticeStep[] = useMemo(() => {
    if (prescription.steps && prescription.steps.length > 0) {
      return prescription.steps;
    }
    // Fallback single step
    return [
      {
        stepNum: 1,
        title: `${prescription.title} 1분 실천`,
        instruction: prescription.prescriptionGuide || prescription.clinicalTip,
        type: 'timer',
        duration: 60,
        tip: prescription.clinicalTip,
        example: prescription.affirmation,
      },
    ];
  }, [prescription]);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStep = steps[currentStepIndex] || steps[0];

  // Timer State
  const initialDuration = currentStep.duration || 60;
  const [timeLeft, setTimeLeft] = useState(initialDuration);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Sound State
  const [isSoundOn, setIsSoundOn] = useState(false);

  // User input answers / reflections
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [isCompleted, setIsCompleted] = useState(false);

  // Reset timer when step changes
  useEffect(() => {
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(currentStep.duration || 60);
  }, [currentStepIndex, currentStep.duration]);

  // Timer interval
  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            triggerHaptic('whitehole');
            try {
              sacredAudio.playSingingBowl(528);
            } catch (_) {}
            return 0;
          }
          if (prev % 15 === 0) {
            triggerHaptic('mirrorhole');
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  // Handle sound toggle
  const toggleSound = () => {
    const next = !isSoundOn;
    setIsSoundOn(next);
    triggerHaptic('mirrorhole');
    try {
      if (next) {
        sacredAudio.playSingingBowl(528);
        sacredAudio.toggleDrone(true);
      } else {
        sacredAudio.toggleDrone(false);
      }
    } catch (_) {}
  };

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      try {
        sacredAudio.toggleDrone(false);
      } catch (_) {}
    };
  }, []);

  // Step navigation
  const handleNextStep = () => {
    triggerHaptic('mirrorhole');
    try {
      sacredAudio.playSingingBowl(432);
    } catch (_) {}
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevStep = () => {
    triggerHaptic('mirrorhole');
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  // Mark completion
  const handleComplete = () => {
    setIsCompleted(true);
    triggerHaptic('bigbang');
    try {
      sacredAudio.playSingingBowl(741);
    } catch (_) {}

    const reflectionNotes = Object.values(inputValues).filter(Boolean).join(' | ');
    recordPrescriptionCompleted(prescription.globalIndex, reflectionNotes);
  };

  // Toss to Lucy
  const handleConsultWithLucy = () => {
    if (!onNavigateToLucy) return;
    const reflectionNotes = Object.values(inputValues).filter(Boolean).join(' / ');
    const contextPrompt = `방금 Key(영혼의 조제실)에서 제${prescription.globalIndex}호 마음 처방약 '${prescription.title}(${prescription.subtitle})' 기법을 실천했습니다.\n\n[목적]: ${prescription.purpose}\n[오늘의 확언]: "${prescription.affirmation}"\n[실천 중 자각한 내용]: ${reflectionNotes || '호흡과 감각에 집중하며 마음을 정화했습니다.'}\n\n루시님, 이 기법을 일상에서 더 잘 유지할 수 있도록 따뜻한 조언과 상담을 부탁해요.`;
    onNavigateToLucy(contextPrompt);
    onClose();
  };

  // Format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xl animate-fade-in select-text">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#0c1813] via-[#09140f] to-[#070e0b] border border-emerald-500/40 shadow-[0_0_50px_rgba(16,185,129,0.25),inset_0_0_20px_rgba(5,150,105,0.15)] overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Top Emerald Header */}
          <div className="relative p-4 sm:p-5 border-b border-emerald-500/25 bg-gradient-to-r from-emerald-950/60 via-[#0d221a]/70 to-emerald-950/60 shrink-0">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-1/4 w-32 h-16 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-2xl p-1 rounded-xl bg-emerald-500/15 border border-emerald-400/30">
                  {prescription.icon}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-400/50 text-emerald-200 font-mono tracking-wide">
                      제{prescription.globalIndex}호 처방약
                    </span>
                    <span className="text-[10px] text-emerald-400/80 font-mono">
                      {prescription.tag} • {prescription.timeEstimate}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-serif font-bold text-emerald-50 mt-0.5 truncate drop-shadow-sm">
                    {prescription.title} <span className="text-xs font-normal text-emerald-300/80">({prescription.subtitle})</span>
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Healing Sound Button */}
                <button
                  type="button"
                  onClick={toggleSound}
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    isSoundOn
                      ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                  title={isSoundOn ? '치유 사운드 끄기' : '528Hz 싱잉볼 치유 사운드 켜기'}
                >
                  {isSoundOn ? <Volume2 size={16} className="text-emerald-300 animate-pulse" /> : <VolumeX size={16} />}
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white active:scale-95 transition-all cursor-pointer"
                  title="닫기"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Step Progress Tracker */}
            <div className="mt-3.5">
              <div className="flex items-center justify-between text-[11px] font-medium text-emerald-300/80 mb-1.5 font-mono">
                <span>단계 {currentStepIndex + 1} / {steps.length}</span>
                <span className="truncate max-w-[65%] text-right text-emerald-200/90">{currentStep.title}</span>
              </div>
              <div className="w-full h-1.5 bg-emerald-950/80 rounded-full overflow-hidden border border-emerald-500/20">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </div>

          {/* Scrollable Content Body */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
            {/* Step Instruction Card */}
            <div className="p-4 rounded-2xl bg-[#0e2119]/85 border border-emerald-500/35 shadow-inner space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                <Sparkles size={14} className="text-emerald-400" />
                <span>실천 가이드</span>
              </div>
              <p className="text-xs sm:text-[13px] text-emerald-100/95 leading-relaxed font-sans whitespace-pre-line">
                {currentStep.instruction}
              </p>

              {currentStep.tip && (
                <div className="pt-2 mt-2 border-t border-emerald-500/20 text-[11.5px] text-emerald-300/90 flex items-start gap-1.5 leading-relaxed bg-emerald-950/40 p-2 rounded-xl">
                  <ShieldCheck size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>{currentStep.tip}</span>
                </div>
              )}
            </div>

            {/* Interactive Timer (if applicable or timer-ready) */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-black/50 to-emerald-950/30 border border-emerald-500/25 flex flex-col items-center justify-center">
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-300/70 mb-2 font-mono">
                <Clock size={12} className="text-emerald-400" />
                <span>집중 타이머 ({formatTime(timeLeft)})</span>
              </div>

              <div className="relative flex items-center justify-center my-1">
                {/* Visual Circle Indicator */}
                <div className="text-3xl sm:text-4xl font-mono font-bold text-emerald-100 tracking-wider drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                  {formatTime(timeLeft)}
                </div>
              </div>

              {/* Timer Controls */}
              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('mirrorhole');
                    setIsRunning(!isRunning);
                    if (!isRunning && !isSoundOn) {
                      toggleSound();
                    }
                  }}
                  className={`px-4 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                    isRunning
                      ? 'bg-amber-500/30 border border-amber-400/60 text-amber-200'
                      : 'bg-emerald-500/30 hover:bg-emerald-500/45 border border-emerald-400/60 text-emerald-100 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  }`}
                >
                  {isRunning ? (
                    <>
                      <Pause size={13} />
                      <span>일시정지</span>
                    </>
                  ) : (
                    <>
                      <Play size={13} />
                      <span>{timeLeft === 0 ? '다시 시작' : '타이머 시작'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('mirrorhole');
                    setIsRunning(false);
                    setTimeLeft(initialDuration);
                  }}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white active:scale-95 transition-all cursor-pointer"
                  title="타이머 리셋"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>

            {/* Input / Reflection Fields (if step has fields or text input) */}
            {currentStep.fields && currentStep.fields.length > 0 && (
              <div className="space-y-2.5 p-3.5 rounded-2xl bg-black/40 border border-emerald-500/20">
                <div className="text-[11.5px] font-bold text-emerald-300 flex items-center gap-1.5">
                  <Zap size={13} className="text-amber-400" />
                  <span>마음 자각 및 기록</span>
                </div>
                {currentStep.fields.map((field) => (
                  <div key={field.id} className="space-y-1">
                    <label className="text-[11px] text-emerald-200/80 block leading-tight font-sans">
                      {field.label}
                    </label>
                    <input
                      type="text"
                      value={inputValues[field.id] || ''}
                      onChange={(e) => setInputValues({ ...inputValues, [field.id]: e.target.value })}
                      placeholder={field.placeholder || '생각나는 내용을 자유롭게 적어보세요...'}
                      className="w-full px-3 py-2 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-50 text-xs placeholder:text-emerald-600/60 focus:outline-none focus:border-emerald-400/80 transition-all font-sans"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Dr. Zuckerman Clinical Guidance & Affirmation Banner */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/25 space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-300">
                <Heart size={12} className="text-rose-400" />
                <span>임상 심리학자 복약 지도</span>
              </div>
              <p className="text-xs text-emerald-200/90 leading-relaxed font-sans pl-2 border-l-2 border-emerald-400/50">
                {prescription.clinicalTip}
              </p>

              <div className="pt-2 border-t border-emerald-500/20 text-xs font-serif text-amber-200/95 italic bg-amber-950/20 p-2 rounded-xl">
                "{prescription.affirmation}"
              </div>
            </div>

            {/* Completed Success Banner */}
            {isCompleted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-2xl bg-emerald-900/40 border border-emerald-400/70 shadow-[0_0_20px_rgba(16,185,129,0.35)] flex items-center gap-3"
              >
                <CheckCircle2 size={24} className="text-emerald-300 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-emerald-100">
                    제{prescription.globalIndex}호 처방약 실천이 완료되었습니다.
                  </div>
                  <div className="text-[11px] text-emerald-300/80 mt-0.5">
                    마음의 긴장이 이완되고 고요한 중심이 회복되었습니다.
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Bottom Action Footer */}
          <div className="p-3.5 sm:p-4 border-t border-emerald-500/25 bg-[#08120e] shrink-0 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={currentStepIndex === 0}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer ${
                  currentStepIndex === 0
                    ? 'opacity-40 pointer-events-none text-slate-500'
                    : 'bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200'
                }`}
              >
                <ChevronLeft size={14} />
                <span>이전 단계</span>
              </button>

              {currentStepIndex < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-1 py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-500/40 via-emerald-500/50 to-teal-500/40 hover:from-emerald-500/55 hover:to-teal-500/55 border border-emerald-400/70 text-emerald-50 text-xs font-bold active:scale-95 transition-all shadow-[0_0_15px_rgba(16,185,129,0.35)] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>다음 단계로</span>
                  <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleComplete}
                  className="flex-1 py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 hover:brightness-110 border border-emerald-300 text-slate-950 text-xs font-bold active:scale-95 transition-all shadow-[0_0_20px_rgba(16,185,129,0.6)] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check size={14} />
                  <span>기법 실천 완료 & 복약 기록</span>
                </button>
              )}
            </div>

            {/* Quick Cross-App Toss Actions */}
            <div className="flex items-center justify-between gap-2 pt-1">
              {onNavigateToLucy && (
                <button
                  type="button"
                  onClick={handleConsultWithLucy}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-500/30 text-cyan-200 text-[11px] font-medium flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                  title="이 기법 실천 내용을 루시에게 상담하기"
                >
                  <MessageCircle size={12} className="text-cyan-400" />
                  <span>루시에게 상담하기</span>
                </button>
              )}

              {onNavigateToHeal && (
                <button
                  type="button"
                  onClick={() => {
                    onNavigateToHeal();
                    onClose();
                  }}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-500/30 text-emerald-200 text-[11px] font-medium flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                  title="치유 사운드와 주파수로 이동"
                >
                  <Sparkles size={12} className="text-emerald-400" />
                  <span>아우라 치유 듣기</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
