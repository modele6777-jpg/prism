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
  Package,
  Layers,
  HelpCircle,
  CheckSquare,
  Square,
  Feather,
  Sparkle,
} from 'lucide-react';
import {
  type CalmPrescription,
  type CalmPracticeStep,
  type InnerPauseTeaching,
  INNER_PAUSE_TEACHINGS,
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

// ── ⏱️ 정밀 인라인 인터랙티브 타이머 (원형 프로그레스 + 사운드 + 햅틱) ────────────
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
            try {
              sacredAudio.playSingingBowl(528);
            } catch (_) {}
            return 0;
          }
          if (prev % 15 === 0) triggerHaptic('mirrorhole');
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

  const fmt = (s: number) => `${Math.floor(s / 60)}:${s % 60 < 10 ? '0' : ''}${s % 60}`;
  const progress = ((duration - timeLeft) / duration) * 100;

  return (
    <div className="mt-3 p-3.5 rounded-2xl bg-black/60 border border-emerald-500/25 flex items-center justify-between gap-3 shadow-inner">
      <div className="flex items-center gap-3">
        <div className="relative w-12 h-12 shrink-0">
          <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
            <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(16,185,129,0.15)" strokeWidth="3.5" />
            <circle
              cx="22"
              cy="22"
              r="18"
              fill="none"
              stroke={timeLeft === 0 ? '#34d399' : '#10b981'}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 18}`}
              strokeDashoffset={`${2 * Math.PI * 18 * (1 - progress / 100)}`}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            {timeLeft === 0 ? (
              <CheckCircle2 size={16} className="text-emerald-400" />
            ) : (
              <Clock size={13} className="text-emerald-300/80" />
            )}
          </div>
        </div>
        <div>
          <div className="text-xl font-mono font-bold text-emerald-100 leading-none">
            {fmt(timeLeft)}
          </div>
          <div className="text-[10.5px] text-emerald-400/70 font-mono mt-1">
            {isRunning ? '의식 집중 진행 중…' : timeLeft === 0 ? '✓ 실천 시간 완료' : `권장 시간: ${duration}초`}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('mirrorhole');
            setIsRunning((r) => !r);
          }}
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md ${
            isRunning
              ? 'bg-amber-500/25 border border-amber-400/50 text-amber-200'
              : 'bg-emerald-500/25 border border-emerald-400/50 text-emerald-100 hover:bg-emerald-500/35'
          }`}
        >
          {isRunning ? <Pause size={12} /> : <Play size={12} />}
          <span>{isRunning ? '정지' : timeLeft === 0 ? '다시 시작' : '타이머 시작'}</span>
        </button>
        {timeLeft !== duration && (
          <button
            type="button"
            onClick={() => {
              setIsRunning(false);
              setTimeLeft(duration);
            }}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="초기화"
          >
            <RotateCcw size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

function parseStepField(f: any, defaultId: string) {
  if (typeof f === 'string') {
    return { id: defaultId, label: f, placeholder: '여기에 솔직한 느낌을 적어보세요…' };
  }
  return {
    id: f?.id || defaultId,
    label: f?.label || f?.placeholder || '',
    placeholder: f?.placeholder || '여기에 솔직한 느낌을 적어보세요…',
  };
}

// ── 📝 단계별 워크시트 질문 & 입력 필드 (fields, field, options 완전 렌더링) ──────
function StepWorksheetFields({ step }: { step: CalmPracticeStep }) {
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [selectedOptions, setSelectedOptions] = useState<Record<string, boolean>>({});

  const hasFields = step.fields && step.fields.length > 0;
  const hasSingleField = !!step.field;
  const hasOptions = step.options && step.options.length > 0;

  if (!hasFields && !hasSingleField && !hasOptions && step.type !== 'textarea') {
    return null;
  }

  const toggleOption = (opt: string) => {
    triggerHaptic('mirrorhole');
    setSelectedOptions((prev) => ({
      ...prev,
      [opt]: !prev[opt],
    }));
  };

  return (
    <div className="mt-3.5 space-y-3 p-3.5 rounded-2xl bg-black/50 border border-emerald-500/20 shadow-inner">
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-300/90 font-serif">
        <HelpCircle size={13} className="text-emerald-400" />
        <span>마음 워크시트 기록</span>
      </div>

      {/* 1. 다중 입력 필드 목록 (fields) */}
      {hasFields && (
        <div className="space-y-2.5">
          {step.fields!.map((rawField, i) => {
            const f = parseStepField(rawField, `field_${i}`);
            return (
              <div key={f.id} className="space-y-1">
                <label className="text-[11.5px] text-emerald-200/85 font-medium block leading-snug">
                  {f.label}
                </label>
                <input
                  type="text"
                  value={textAnswers[f.id] || ''}
                  onChange={(e) =>
                    setTextAnswers({ ...textAnswers, [f.id]: e.target.value })
                  }
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/25 text-emerald-50 text-xs placeholder:text-emerald-700/60 focus:outline-none focus:border-emerald-400/70 transition-all font-sans"
                />
              </div>
            );
          })}
        </div>
      )}

      {/* 2. 단일 필드 (field) */}
      {hasSingleField && !hasFields && (() => {
        const f = parseStepField(step.field, 'single_field');
        return (
          <div className="space-y-1">
            <label className="text-[11.5px] text-emerald-200/85 font-medium block leading-snug">
              {f.label}
            </label>
            <input
              type="text"
              value={textAnswers['single_field'] || ''}
              onChange={(e) => setTextAnswers({ ...textAnswers, single_field: e.target.value })}
              placeholder={f.placeholder}
              className="w-full px-3 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/25 text-emerald-50 text-xs placeholder:text-emerald-700/60 focus:outline-none focus:border-emerald-400/70 transition-all font-sans"
            />
          </div>
        );
      })()}

      {/* 3. 장문 서술형 (textarea) */}
      {step.type === 'textarea' && !hasFields && !hasSingleField && (
        <div className="space-y-1">
          <textarea
            rows={3}
            value={textAnswers['textarea'] || ''}
            onChange={(e) => setTextAnswers({ ...textAnswers, textarea: e.target.value })}
            placeholder="떠오르는 생각이나 신체 감각을 편안하게 적어보세요…"
            className="w-full px-3 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/25 text-emerald-50 text-xs placeholder:text-emerald-700/60 focus:outline-none focus:border-emerald-400/70 transition-all font-sans resize-none"
          />
        </div>
      )}

      {/* 4. 선택지 옵션 (options - 체크리스트) */}
      {hasOptions && (
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] text-emerald-300/80 block mb-1">체크해 보세요:</span>
          {step.options!.map((opt, i) => {
            const checked = !!selectedOptions[opt];
            return (
              <button
                key={i}
                type="button"
                onClick={() => toggleOption(opt)}
                className={`w-full text-left px-3 py-2 rounded-xl border flex items-center gap-2 text-xs transition-all active:scale-[0.99] cursor-pointer ${
                  checked
                    ? 'bg-emerald-500/25 border-emerald-400/60 text-emerald-100 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                    : 'bg-black/30 border-white/10 text-slate-300 hover:border-emerald-500/30'
                }`}
              >
                {checked ? (
                  <CheckSquare size={14} className="text-emerald-400 shrink-0" />
                ) : (
                  <Square size={14} className="text-slate-500 shrink-0" />
                )}
                <span className="leading-snug">{opt}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── 🌸 CALM 40대 마음 기법 전체 가이드 럭셔리 모달 ──────────────────────────────
export function CalmTechniquePracticeModal({
  isOpen,
  onClose,
  prescription,
  sourceParchmentTitle,
  onNavigateToLucy,
  onNavigateToHeal,
}: CalmTechniquePracticeModalProps) {
  if (!isOpen || !prescription) return null;

  const [activeTab, setActiveTab] = useState<'practice' | 'teachings'>('practice');
  const [isSoundOn, setIsSoundOn] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // 해당 챕터/기법에 부합하는 치유 가르침 추천
  const matchedTeaching: InnerPauseTeaching =
    INNER_PAUSE_TEACHINGS[(prescription.globalIndex - 1) % INNER_PAUSE_TEACHINGS.length] ||
    INNER_PAUSE_TEACHINGS[0];

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
          },
        ];

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

  useEffect(() => {
    return () => {
      try {
        sacredAudio.toggleDrone(false);
      } catch (_) {}
    };
  }, []);

  const handleDone = () => {
    setIsDone(true);
    triggerHaptic('bigbang');
    try {
      sacredAudio.playSingingBowl(741);
    } catch (_) {}
    recordPrescriptionCompleted(prescription.globalIndex, '');
  };

  const handleConsultWithLucy = () => {
    if (!onNavigateToLucy) return;
    const ctx = `방금 Key(영혼의 조제실)에서 《FIND YOUR 왜 나는 불안할까》 제${prescription.globalIndex}호 마음 연습 '${prescription.title}(${prescription.subtitle})' 기법을 실천했습니다.\n\n[도서 출처]: 제${prescription.chapter}장 ${prescription.chapterTitle} (p.${prescription.page})\n[목적]: ${prescription.purpose}\n[오늘의 확언]: "${prescription.affirmation}"\n\n루시님, 이 기법을 제 일상과 마음에 더 깊이 적용할 수 있도록 따뜻한 통찰과 상담을 부탁해요.`;
    onNavigateToLucy(ctx);
    onClose();
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-2xl p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.96 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-xl rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden select-none"
          style={{
            maxHeight: '94dvh',
            background:
              'radial-gradient(ellipse at 50% 0%, #0d281c 0%, #06150e 45%, #020805 100%)',
            border: '1.5px solid rgba(52,211,153,0.35)',
            boxShadow:
              '0 0 80px rgba(16,185,129,0.22), 0 20px 60px rgba(0,0,0,0.95), inset 0 1px 1px rgba(255,255,255,0.2)',
          }}
        >
          {/* 모바일 상단 드래그 핸들 */}
          <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mt-3 mb-1 shrink-0 sm:hidden" />

          {/* ── 🌟 HEADER: 원작 도서 출처 및 프리미엄 메타 배지 ─────────────────── */}
          <div
            className="relative px-5 pt-4 pb-3.5 border-b border-emerald-500/20 shrink-0 select-none"
            style={{
              background:
                'linear-gradient(135deg, rgba(5,150,105,0.15) 0%, rgba(4,120,87,0.06) 100%)',
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 overflow-hidden">
                {/* 기법 아이콘 */}
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 mt-0.5"
                  style={{
                    background:
                      'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.25) 0%, rgba(16,185,129,0.35) 100%)',
                    border: '1.5px solid rgba(52,211,153,0.5)',
                    boxShadow: '0 0 24px rgba(16,185,129,0.35), inset 0 0 8px rgba(255,255,255,0.3)',
                  }}
                >
                  {prescription.icon}
                </div>

                <div className="min-w-0">
                  {/* 도서 챕터 및 페이지 태그 */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-400/45 text-emerald-200 shadow-sm">
                      제{prescription.globalIndex}호 마음 연습
                    </span>
                    <span className="text-[9.5px] font-serif px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/35 text-amber-200">
                      [제{prescription.chapter}장] {prescription.chapterTitle}
                    </span>
                    {prescription.page && (
                      <span className="text-[9px] font-mono text-emerald-300/80">
                        p.{prescription.page}
                      </span>
                    )}
                  </div>

                  {/* 기법 타이틀 & 부제 */}
                  <h2 className="text-base sm:text-lg font-serif font-bold text-white leading-snug tracking-wide drop-shadow-sm">
                    {prescription.title}
                    <span className="text-xs font-sans font-normal text-emerald-300/80 ml-2">
                      ({prescription.subtitle})
                    </span>
                  </h2>

                  {sourceParchmentTitle && (
                    <p className="text-[10px] text-emerald-400/60 mt-0.5 truncate font-serif">
                      📜 신탁 연동: {sourceParchmentTitle}
                    </p>
                  )}
                </div>
              </div>

              {/* 사운드 및 닫기 버튼 */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={toggleSound}
                  className={`p-2 rounded-xl border transition-all active:scale-95 cursor-pointer shadow-sm ${
                    isSoundOn
                      ? 'bg-emerald-500/30 border-emerald-400/60 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                  title={isSoundOn ? '528Hz 치유 사운드 끄기' : '528Hz 솔페지오 사운드 재생'}
                >
                  {isSoundOn ? (
                    <Volume2 size={15} className="text-emerald-300 animate-pulse" />
                  ) : (
                    <VolumeX size={15} />
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-slate-400 hover:text-white transition-all active:scale-95 cursor-pointer"
                  title="닫기"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* 탭 네비게이션 */}
            <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-emerald-500/15 pt-2.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('mirrorhole');
                    setActiveTab('practice');
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold font-serif transition-all active:scale-95 cursor-pointer ${
                    activeTab === 'practice'
                      ? 'bg-emerald-500/30 border border-emerald-400/60 text-emerald-100 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                      : 'text-emerald-400/60 hover:text-emerald-200'
                  }`}
                >
                  실천 단계 & 워크시트 ({steps.length}단계)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('mirrorhole');
                    setActiveTab('teachings');
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold font-serif transition-all active:scale-95 cursor-pointer flex items-center gap-1 ${
                    activeTab === 'teachings'
                      ? 'bg-amber-500/25 border border-amber-400/50 text-amber-100 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                      : 'text-amber-300/60 hover:text-amber-200'
                  }`}
                >
                  <Sparkles size={11} className="text-amber-400" />
                  <span>내면의 쉼표 치유 지혜</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400/70">
                <Clock size={11} />
                <span>{prescription.timeEstimate}</span>
              </div>
            </div>
          </div>

          {/* ── 📜 BODY: 스크롤 본문 ─────────────────────────── */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-4 custom-scrollbar select-text">
            {activeTab === 'practice' ? (
              <>
                {/* 1. 필수 준비물 카드 ([준비물]) */}
                <div
                  className="p-3.5 rounded-2xl flex items-start gap-2.5 border"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(8,40,24,0.6) 0%, rgba(4,20,12,0.6) 100%)',
                    borderColor: 'rgba(52,211,153,0.25)',
                  }}
                >
                  <Package size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold text-emerald-300 block font-serif">
                      [준비물]
                    </span>
                    <p className="text-xs text-emerald-100/90 mt-0.5 leading-relaxed">
                      {prescription.preparation || '조용하고 편안한 공간'}
                    </p>
                  </div>
                </div>

                {/* 2. 기법 목적 & 임상 가이드 */}
                <div
                  className="p-4 rounded-2xl space-y-3 border"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(6,32,20,0.7) 0%, rgba(3,16,10,0.7) 100%)',
                    borderColor: 'rgba(16,185,129,0.25)',
                  }}
                >
                  <div>
                    <div className="flex items-center gap-1.5 text-[11.5px] font-bold text-emerald-300 font-serif">
                      <BookOpen size={13} className="text-emerald-400" />
                      <span>기법 목적 (Clinical Purpose)</span>
                    </div>
                    <p className="text-xs sm:text-[13px] text-emerald-100/95 leading-relaxed mt-1">
                      {prescription.purpose}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-emerald-500/15 flex items-start gap-2">
                    <ShieldCheck size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10.5px] font-bold text-emerald-300 block font-serif">
                        임상 조언 (Dr. Zuckerman's Clinical Tip)
                      </span>
                      <p className="text-xs text-emerald-200/85 leading-relaxed mt-0.5">
                        {prescription.clinicalTip}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. 오늘의 치유 확언 (Affirmation) */}
                <div
                  className="p-4 rounded-2xl flex items-start gap-3 border shadow-sm"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(120,80,20,0.18) 0%, rgba(60,40,10,0.15) 100%)',
                    borderColor: 'rgba(251,191,36,0.3)',
                  }}
                >
                  <Quote size={18} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10.5px] font-bold text-amber-300 block font-serif">
                      오늘의 치유 확언 (Healing Affirmation)
                    </span>
                    <p className="text-xs sm:text-[13px] font-serif italic text-amber-100 leading-relaxed mt-1">
                      "{prescription.affirmation}"
                    </p>
                  </div>
                </div>

                {/* 4. 단계 구분선 */}
                <div className="flex items-center gap-3 py-1 select-none">
                  <div
                    className="h-px flex-1"
                    style={{
                      background:
                        'linear-gradient(90deg, transparent, rgba(52,211,153,0.35), transparent)',
                    }}
                  />
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400/70 tracking-widest uppercase">
                    <Layers size={11} />
                    <span>전체 {steps.length}단계 실천 가이드</span>
                  </div>
                  <div
                    className="h-px flex-1"
                    style={{
                      background:
                        'linear-gradient(90deg, transparent, rgba(52,211,153,0.35), transparent)',
                    }}
                  />
                </div>

                {/* 5. 모든 단계 카드 */}
                <div className="space-y-4">
                  {steps.map((step, idx) => (
                    <motion.div
                      key={step.stepNum || idx}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.04 }}
                      className="rounded-2xl overflow-hidden border shadow-lg"
                      style={{
                        borderColor: 'rgba(52,211,153,0.22)',
                        background:
                          'linear-gradient(135deg, rgba(8,24,16,0.92) 0%, rgba(3,12,8,0.96) 100%)',
                      }}
                    >
                      {/* 단계 헤더 */}
                      <div
                        className="px-4 py-3 flex items-center justify-between gap-3 border-b border-emerald-500/15"
                        style={{
                          background:
                            'linear-gradient(90deg, rgba(16,185,129,0.12) 0%, rgba(6,182,212,0.06) 100%)',
                        }}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 font-mono shadow-md"
                            style={{
                              background: 'linear-gradient(135deg, #34d399, #10b981)',
                              color: '#022c22',
                            }}
                          >
                            {idx + 1}
                          </div>
                          <h3 className="text-xs sm:text-[13px] font-bold text-emerald-50 font-serif leading-snug">
                            {step.title}
                          </h3>
                        </div>

                        {step.duration && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 shrink-0">
                            {step.duration}초
                          </span>
                        )}
                      </div>

                      {/* 단계 본문 */}
                      <div className="p-4 space-y-3">
                        <p className="text-xs sm:text-[12.5px] text-emerald-50/95 leading-relaxed whitespace-pre-line font-sans">
                          {step.instruction}
                        </p>

                        {step.tip && (
                          <div
                            className="flex items-start gap-2 p-2.5 rounded-xl border"
                            style={{
                              background: 'rgba(16,185,129,0.08)',
                              borderColor: 'rgba(52,211,153,0.25)',
                            }}
                          >
                            <Sparkles size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-emerald-200 leading-relaxed font-sans">
                              {step.tip}
                            </p>
                          </div>
                        )}

                        {step.example && (
                          <div
                            className="flex items-start gap-2 p-2.5 rounded-xl border"
                            style={{
                              background: 'rgba(251,191,36,0.06)',
                              borderColor: 'rgba(251,191,36,0.22)',
                            }}
                          >
                            <Feather size={13} className="text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-amber-200 font-serif italic leading-relaxed">
                              예시: {step.example}
                            </p>
                          </div>
                        )}

                        {/* 인라인 타이머 */}
                        {(step.type === 'timer' || step.type === 'guided') && step.duration && (
                          <StepTimer step={step} />
                        )}

                        {/* 워크시트 질문 / 체크리스트 입력 필드 */}
                        <StepWorksheetFields step={step} />
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* 6. 완료 축하 배너 */}
                <AnimatePresence>
                  {isDone && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 rounded-2xl flex items-center gap-3.5 border shadow-xl"
                      style={{
                        background:
                          'linear-gradient(135deg, rgba(16,185,129,0.3) 0%, rgba(5,150,105,0.2) 100%)',
                        borderColor: 'rgba(52,211,153,0.6)',
                        boxShadow: '0 0 30px rgba(16,185,129,0.3)',
                      }}
                    >
                      <CheckCircle2 size={24} className="text-emerald-300 shrink-0 animate-bounce" />
                      <div>
                        <div className="text-xs sm:text-[13px] font-bold text-white font-serif">
                          제{prescription.globalIndex}호 처방약 실천 기록 완료! 🌿
                        </div>
                        <div className="text-[11px] text-emerald-200/90 mt-0.5 leading-relaxed">
                          불안과 거리를 두고 내면의 평온한 중심을 되찾았습니다.
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              /* ── 🧘 TAB 2: 내면의 쉼표 3단계 치유 가르침 ────────────────────────── */
              <div className="space-y-4">
                <div
                  className="p-4 rounded-2xl border"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(30,58,138,0.2) 0%, rgba(15,23,42,0.4) 100%)',
                    borderColor: 'rgba(56,189,248,0.3)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{matchedTeaching.icon}</span>
                    <div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-400/35">
                        {matchedTeaching.theme}
                      </span>
                      <h3 className="text-sm font-serif font-bold text-white mt-1">
                        {matchedTeaching.headline}
                      </h3>
                    </div>
                  </div>
                  <p className="text-xs font-serif italic text-cyan-200/90 pl-3 border-l-2 border-cyan-400/50 py-1 bg-cyan-950/20 rounded-r-lg">
                    "{matchedTeaching.quote}"
                  </p>
                </div>

                {/* 1단계: 신체 접지 */}
                <div className="p-3.5 rounded-2xl bg-black/40 border border-emerald-500/20 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 font-serif">
                    <Sparkle size={12} className="text-emerald-400" />
                    <span>{matchedTeaching.grounding.title}</span>
                  </div>
                  <p className="text-xs text-emerald-100 leading-relaxed">
                    {matchedTeaching.grounding.instruction}
                  </p>
                  <p className="text-[11px] text-emerald-300/80 bg-emerald-950/40 p-2 rounded-xl border border-emerald-500/20 font-sans">
                    실천법: {matchedTeaching.grounding.practice}
                  </p>
                </div>

                {/* 2단계: 기적수업 용서 */}
                <div className="p-3.5 rounded-2xl bg-black/40 border border-amber-500/20 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 font-serif">
                    <Sparkle size={12} className="text-amber-400" />
                    <span>{matchedTeaching.healing.title}</span>
                  </div>
                  <p className="text-xs text-amber-100 leading-relaxed">
                    {matchedTeaching.healing.instruction}
                  </p>
                  <p className="text-[11px] text-amber-300/80 bg-amber-950/40 p-2 rounded-xl border border-amber-500/20 font-serif italic">
                    실천법: {matchedTeaching.healing.practice}
                  </p>
                </div>

                {/* 3단계: 본래의 온전함 선언 */}
                <div className="p-3.5 rounded-2xl bg-black/40 border border-purple-500/20 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300 font-serif">
                    <Sparkle size={12} className="text-purple-400" />
                    <span>{matchedTeaching.liberation.title}</span>
                  </div>
                  <p className="text-xs text-purple-100 leading-relaxed font-serif italic">
                    "{matchedTeaching.liberation.declaration}"
                  </p>
                </div>

                {/* 성찰 질문 */}
                <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 flex items-start gap-2.5">
                  <HelpCircle size={15} className="text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[11px] font-bold text-cyan-200 block font-serif">
                      오늘의 성찰 질문
                    </span>
                    <p className="text-xs text-slate-200 leading-relaxed mt-0.5">
                      {matchedTeaching.reflectionQuestion}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="h-2" />
          </div>

          {/* ── 🌟 FOOTER: 실천 완료 & 타 차원 연계 액션 ──────────────────────── */}
          <div
            className="px-5 py-3.5 border-t border-emerald-500/20 shrink-0 space-y-2.5 select-none"
            style={{ background: 'rgba(3,10,7,0.98)' }}
          >
            {!isDone ? (
              <button
                type="button"
                onClick={handleDone}
                className="w-full py-3 rounded-2xl text-[13px] font-bold font-serif flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #34d399 0%, #10b981 50%, #059669 100%)',
                  color: '#022c22',
                  boxShadow: '0 0 25px rgba(16,185,129,0.45)',
                }}
              >
                <Sparkles size={15} />
                <span>오늘의 기법 실천 완료 기록하기</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-2xl text-[13px] font-bold text-slate-200 active:scale-98 transition-all cursor-pointer border border-white/10 hover:bg-white/5"
              >
                가이드 닫기
              </button>
            )}

            {(onNavigateToLucy || onNavigateToHeal) && (
              <div className="flex items-center gap-2">
                {onNavigateToLucy && (
                  <button
                    type="button"
                    onClick={handleConsultWithLucy}
                    className="flex-1 py-2 rounded-xl text-xs font-serif font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer border shadow-sm"
                    style={{
                      background: 'rgba(8,32,60,0.65)',
                      borderColor: 'rgba(56,189,248,0.3)',
                      color: '#bae6fd',
                    }}
                  >
                    <MessageCircle size={13} className="text-cyan-400" />
                    <span>루시에게 마음 상담</span>
                  </button>
                )}
                {onNavigateToHeal && (
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateToHeal();
                      onClose();
                    }}
                    className="flex-1 py-2 rounded-xl text-xs font-serif font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer border shadow-sm"
                    style={{
                      background: 'rgba(5,28,18,0.65)',
                      borderColor: 'rgba(16,185,129,0.3)',
                      color: '#a7f3d0',
                    }}
                  >
                    <Heart size={13} className="text-emerald-400" />
                    <span>아우라 치유 주파수</span>
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
