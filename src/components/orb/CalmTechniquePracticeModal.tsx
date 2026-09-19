import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  MessageCircle,
  Heart,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Quote,
  BookOpen,
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

// ── 단계별 독립 인라인 타이머 ──────────────────────────────────────
function StepTimer({ step }: { step: CalmPracticeStep }) {
  const duration = step.duration || 60;
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            triggerHaptic('whitehole');
            try { sacredAudio.playSingingBowl(528); } catch (_) {}
            return 0;
          }
          if (prev % 15 === 0) triggerHaptic('mirrorhole');
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${s % 60 < 10 ? '0' : ''}${s % 60}`;
  const progress = ((duration - timeLeft) / duration) * 100;

  return (
    <div className="mt-3 p-3 rounded-2xl bg-black/40 border border-emerald-500/20 flex items-center gap-3">
      <div className="relative w-11 h-11 shrink-0">
        <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
          <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(16,185,129,0.15)" strokeWidth="3.5" />
          <circle cx="22" cy="22" r="18" fill="none"
            stroke={timeLeft === 0 ? '#34d399' : '#10b981'} strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 18}`}
            strokeDashoffset={`${2 * Math.PI * 18 * (1 - progress / 100)}`}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {timeLeft === 0
            ? <CheckCircle2 size={14} className="text-emerald-400" />
            : <Clock size={11} className="text-emerald-300/70" />}
        </div>
      </div>
      <div className="flex-1">
        <div className="text-lg font-mono font-bold text-emerald-100 leading-none">{fmt(timeLeft)}</div>
        <div className="text-[10px] text-emerald-400/60 font-mono mt-0.5">
          {isRunning ? '집중 중…' : timeLeft === 0 ? '✓ 완료' : `${duration}초`}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => { triggerHaptic('mirrorhole'); setIsRunning((r) => !r); }}
          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer ${
            isRunning
              ? 'bg-amber-500/20 border border-amber-400/40 text-amber-200'
              : 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-100'
          }`}
        >
          {isRunning ? <Pause size={11} /> : <Play size={11} />}
          <span>{isRunning ? '정지' : timeLeft === 0 ? '재시작' : '시작'}</span>
        </button>
        {timeLeft !== duration && (
          <button
            type="button"
            onClick={() => { setIsRunning(false); setTimeLeft(duration); }}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/8 border border-white/10 text-slate-400 transition-all cursor-pointer"
            title="리셋"
          >
            <RotateCcw size={11} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── 단계별 입력 필드 ───────────────────────────────────────────────
function StepFields({ step }: { step: CalmPracticeStep }) {
  const [values, setValues] = useState<Record<string, string>>({});
  if (!step.fields || step.fields.length === 0) return null;
  return (
    <div className="mt-3 space-y-2 p-3 rounded-2xl bg-black/40 border border-emerald-500/18">
      {step.fields.map((field) => (
        <div key={field.id} className="space-y-1">
          <label className="text-[11px] text-emerald-200/75 block">{field.label}</label>
          <input
            type="text"
            value={values[field.id] || ''}
            onChange={(e) => setValues({ ...values, [field.id]: e.target.value })}
            placeholder={field.placeholder || '자유롭게 적어보세요…'}
            className="w-full px-3 py-2 rounded-xl bg-emerald-950/30 border border-emerald-500/22 text-emerald-50 text-xs placeholder:text-emerald-700/60 focus:outline-none focus:border-emerald-400/60 transition-all"
          />
        </div>
      ))}
    </div>
  );
}

// ── 메인 모달 ─────────────────────────────────────────────────────
export function CalmTechniquePracticeModal({
  isOpen,
  onClose,
  prescription,
  sourceParchmentTitle,
  onNavigateToLucy,
  onNavigateToHeal,
}: CalmTechniquePracticeModalProps) {
  if (!isOpen || !prescription) return null;

  const steps: CalmPracticeStep[] =
    prescription.steps && prescription.steps.length > 0
      ? prescription.steps
      : [
          {
            stepNum: 1,
            title: `${prescription.title} 실천`,
            instruction: prescription.prescriptionGuide || prescription.clinicalTip,
            type: 'timer',
            duration: 60,
            tip: prescription.clinicalTip,
            example: prescription.affirmation,
            fields: [],
          },
        ];

  const [isSoundOn, setIsSoundOn] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const toggleSound = () => {
    const next = !isSoundOn;
    setIsSoundOn(next);
    triggerHaptic('mirrorhole');
    try {
      if (next) { sacredAudio.playSingingBowl(528); sacredAudio.toggleDrone(true); }
      else { sacredAudio.toggleDrone(false); }
    } catch (_) {}
  };

  useEffect(() => {
    return () => { try { sacredAudio.toggleDrone(false); } catch (_) {} };
  }, []);

  const handleDone = () => {
    setIsDone(true);
    triggerHaptic('bigbang');
    try { sacredAudio.playSingingBowl(741); } catch (_) {}
    recordPrescriptionCompleted(prescription.globalIndex, '');
  };

  const handleConsultWithLucy = () => {
    if (!onNavigateToLucy) return;
    const ctx = `방금 Key(영혼의 조제실)에서 제${prescription.globalIndex}호 마음 처방약 '${prescription.title}(${prescription.subtitle})' 기법을 실천했습니다.\n\n[목적]: ${prescription.purpose}\n[오늘의 확언]: "${prescription.affirmation}"\n\n루시님, 이 기법을 일상에서 더 잘 유지할 수 있도록 따뜻한 조언과 상담을 부탁해요.`;
    onNavigateToLucy(ctx);
    onClose();
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-xl"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 48, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 48, scale: 0.97 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden"
          style={{
            maxHeight: '94dvh',
            background: 'linear-gradient(160deg, #071a10 0%, #060f0a 40%, #040d08 100%)',
            border: '1px solid rgba(16,185,129,0.32)',
            boxShadow: '0 0 70px rgba(16,185,129,0.15), 0 0 140px rgba(5,150,105,0.08), inset 0 0 40px rgba(5,150,105,0.06)',
          }}
        >
          {/* 모바일 핸들 */}
          <div className="w-9 h-1 rounded-full bg-white/12 mx-auto mt-3 mb-0.5 shrink-0 sm:hidden" />

          {/* ── HEADER ─────────────────────────────────── */}
          <div
            className="relative px-4 sm:px-5 pt-4 pb-3.5 border-b border-emerald-500/18 shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(5,150,105,0.1) 0%, rgba(4,120,87,0.05) 100%)' }}
          >
            <div className="absolute -top-6 -right-6 w-36 h-36 bg-emerald-400/8 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 overflow-hidden">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 mt-0.5"
                  style={{
                    background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.14) 0%, rgba(5,150,105,0.28) 100%)',
                    border: '1px solid rgba(52,211,153,0.36)',
                    boxShadow: '0 0 18px rgba(16,185,129,0.25)',
                  }}
                >
                  {prescription.icon}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <span
                      className="text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded-full text-emerald-200 tracking-wide"
                      style={{ background: 'rgba(16,185,129,0.18)', border: '1px solid rgba(52,211,153,0.35)' }}
                    >
                      제{prescription.globalIndex}호
                    </span>
                    <span className="text-[9.5px] text-emerald-400/65 font-mono">{prescription.tag} · {prescription.timeEstimate}</span>
                  </div>
                  <h2 className="text-sm sm:text-[15px] font-serif font-bold text-white leading-snug">
                    {prescription.title}
                    <span className="text-[11px] font-sans font-normal text-emerald-300/65 ml-1.5">
                      ({prescription.subtitle})
                    </span>
                  </h2>
                  {sourceParchmentTitle && (
                    <p className="text-[9.5px] text-emerald-500/55 mt-0.5 truncate">📜 {sourceParchmentTitle}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={toggleSound}
                  className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                    isSoundOn
                      ? 'bg-emerald-500/22 border-emerald-400/45 text-emerald-200'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                  title={isSoundOn ? '사운드 끄기' : '528Hz 사운드'}
                >
                  {isSoundOn
                    ? <Volume2 size={14} className="text-emerald-300 animate-pulse" />
                    : <VolumeX size={14} />}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* 전체 단계 표시바 */}
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[9.5px] text-emerald-400/55 font-mono shrink-0">전체 {steps.length}단계 가이드</span>
              <div className="flex-1 flex gap-0.5">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 h-1 rounded-full"
                    style={{ background: 'linear-gradient(90deg, #10b981, #06b6d4)', opacity: 0.55 }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ── BODY (스크롤) ───────────────────────────── */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5 py-4 space-y-4 custom-scrollbar">

            {/* 기법 목적 + 임상 지도 */}
            <div
              className="p-3.5 rounded-2xl space-y-2.5"
              style={{
                background: 'linear-gradient(135deg, rgba(5,150,105,0.09) 0%, rgba(4,120,87,0.04) 100%)',
                border: '1px solid rgba(16,185,129,0.18)',
              }}
            >
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-300">
                <BookOpen size={12} className="text-emerald-400" />
                <span>기법 목적</span>
              </div>
              <p className="text-xs text-emerald-100/88 leading-relaxed">{prescription.purpose}</p>
              <div className="pt-2 border-t border-emerald-500/12 flex items-start gap-1.5">
                <ShieldCheck size={12} className="text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-emerald-200/80 leading-relaxed">{prescription.clinicalTip}</p>
              </div>
            </div>

            {/* 오늘의 확언 */}
            <div
              className="p-3.5 rounded-2xl flex items-start gap-2.5"
              style={{
                background: 'linear-gradient(135deg, rgba(180,140,60,0.07) 0%, rgba(120,100,40,0.04) 100%)',
                border: '1px solid rgba(251,191,36,0.18)',
              }}
            >
              <Quote size={15} className="text-amber-400/65 shrink-0 mt-0.5" />
              <p className="text-[11.5px] sm:text-xs font-serif italic text-amber-100/92 leading-relaxed">
                "{prescription.affirmation}"
              </p>
            </div>

            {/* 구분선 */}
            <div className="flex items-center gap-2">
              <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.28), transparent)' }} />
              <span className="text-[9px] font-mono text-emerald-400/50 tracking-widest px-2">실천 단계</span>
              <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.28), transparent)' }} />
            </div>

            {/* 모든 단계 — 스크롤, 페이지네이션 없음 */}
            <div className="space-y-3.5">
              {steps.map((step, idx) => (
                <motion.div
                  key={step.stepNum}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, delay: idx * 0.05 }}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    border: '1px solid rgba(16,185,129,0.2)',
                    background: 'linear-gradient(135deg, rgba(6,15,10,0.92) 0%, rgba(4,11,8,0.96) 100%)',
                  }}
                >
                  {/* 단계 헤더 */}
                  <div
                    className="px-3.5 py-2.5 flex items-center gap-2.5 border-b border-emerald-500/10"
                    style={{ background: 'rgba(5,150,105,0.07)' }}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                      style={{ background: 'linear-gradient(135deg, #34d399, #10b981)', color: '#022c22' }}
                    >
                      {idx + 1}
                    </div>
                    <h3 className="text-[12px] font-bold text-emerald-100 leading-snug flex-1">{step.title}</h3>
                    {step.duration && (
                      <span className="text-[9.5px] font-mono text-emerald-400/55 shrink-0">{step.duration}초</span>
                    )}
                  </div>

                  {/* 단계 본문 */}
                  <div className="p-3.5 space-y-2.5">
                    <p className="text-xs text-emerald-50/93 leading-relaxed whitespace-pre-line">{step.instruction}</p>

                    {step.tip && (
                      <div
                        className="flex items-start gap-1.5 p-2 rounded-xl"
                        style={{ background: 'rgba(5,150,105,0.09)', border: '1px solid rgba(16,185,129,0.15)' }}
                      >
                        <Sparkles size={11} className="text-emerald-400 shrink-0 mt-0.5" />
                        <p className="text-[10.5px] text-emerald-200/82 leading-relaxed">{step.tip}</p>
                      </div>
                    )}

                    {step.example && (
                      <div
                        className="flex items-start gap-1.5 p-2 rounded-xl"
                        style={{ background: 'rgba(180,140,60,0.05)', border: '1px solid rgba(251,191,36,0.13)' }}
                      >
                        <Quote size={10} className="text-amber-400/55 shrink-0 mt-0.5" />
                        <p className="text-[10.5px] text-amber-200/78 leading-relaxed font-serif italic">
                          예시: {step.example}
                        </p>
                      </div>
                    )}

                    {/* 인라인 타이머 */}
                    {(step.type === 'timer' || step.type === 'guided') && step.duration && (
                      <StepTimer step={step} />
                    )}

                    {/* 인라인 입력 */}
                    {(step.type === 'text_input' || step.type === 'textarea' || step.type === 'checklist') && (
                      <StepFields step={step} />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* 완료 배너 */}
            <AnimatePresence>
              {isDone && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.93 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3.5 rounded-2xl flex items-center gap-3"
                  style={{
                    background: 'linear-gradient(135deg, rgba(5,150,105,0.22) 0%, rgba(4,120,87,0.12) 100%)',
                    border: '1px solid rgba(52,211,153,0.45)',
                    boxShadow: '0 0 18px rgba(16,185,129,0.18)',
                  }}
                >
                  <CheckCircle2 size={20} className="text-emerald-300 shrink-0" />
                  <div>
                    <div className="text-[11.5px] font-bold text-emerald-100">
                      제{prescription.globalIndex}호 처방약 실천 완료! 💊
                    </div>
                    <div className="text-[10.5px] text-emerald-300/70 mt-0.5">
                      마음의 긴장이 이완되고 고요한 중심이 회복되었습니다.
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="h-1" />
          </div>

          {/* ── FOOTER ─────────────────────────────────── */}
          <div
            className="px-4 sm:px-5 py-3 border-t border-emerald-500/15 shrink-0 space-y-2"
            style={{ background: 'rgba(4,10,7,0.97)' }}
          >
            {!isDone ? (
              <button
                type="button"
                onClick={handleDone}
                className="w-full py-2.5 rounded-2xl text-[13px] font-bold flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #34d399, #10b981, #0d9488)',
                  color: '#022c22',
                  boxShadow: '0 0 18px rgba(16,185,129,0.38)',
                }}
              >
                <Sparkles size={13} />
                <span>실천 완료 기록하기</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-2xl text-[13px] font-bold text-slate-200 active:scale-98 transition-all cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                닫기
              </button>
            )}

            {(onNavigateToLucy || onNavigateToHeal) && (
              <div className="flex items-center gap-2">
                {onNavigateToLucy && (
                  <button
                    type="button"
                    onClick={handleConsultWithLucy}
                    className="flex-1 py-1.5 rounded-xl text-[11px] font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                    style={{
                      background: 'rgba(8,32,60,0.55)',
                      border: '1px solid rgba(56,189,248,0.22)',
                      color: '#bae6fd',
                    }}
                  >
                    <MessageCircle size={11} className="text-cyan-400" />
                    <span>루시에게 상담하기</span>
                  </button>
                )}
                {onNavigateToHeal && (
                  <button
                    type="button"
                    onClick={() => { onNavigateToHeal(); onClose(); }}
                    className="flex-1 py-1.5 rounded-xl text-[11px] font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                    style={{
                      background: 'rgba(5,28,18,0.55)',
                      border: '1px solid rgba(16,185,129,0.22)',
                      color: '#a7f3d0',
                    }}
                  >
                    <Heart size={11} className="text-emerald-400" />
                    <span>아우라 치유 듣기</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
