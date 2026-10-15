import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sparkles,
  Radio,
  Key,
  Orbit,
  ArrowRight,
  ShieldCheck,
  Volume2,
  Compass,
  Heart,
  Palette,
  Activity,
} from 'lucide-react';
import { LucKeyCloverKeyIcon } from './LucKeySidebar';

interface LucKeyIntroModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartChat?: () => void;
}

export function LucKeyIntroModal({ isOpen, onClose, onStartChat }: LucKeyIntroModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[3000] flex items-center justify-center p-3 sm:p-5 font-sans overflow-hidden">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/75 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ type: 'spring', damping: 26, stiffness: 260 }}
          className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#090b14]/92 border border-white/10 rounded-3xl shadow-[0_20px_70px_rgba(0,0,0,0.85)] backdrop-blur-2xl text-slate-100 overflow-hidden z-10"
        >
          {/* Top Rainbow Accent Rim */}
          <div className="h-[2px] w-full bg-gradient-to-r from-emerald-400 via-teal-300 via-amber-300 to-indigo-400 shrink-0" />

          {/* Ambient background glows */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-[90px] pointer-events-none" />
          <div className="absolute bottom-10 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

          {/* Header */}
          <div className="relative px-5 sm:px-7 pt-5 pb-4 border-b border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500/25 via-teal-500/20 to-cyan-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shadow-[0_0_16px_rgba(52,211,153,0.35)] shrink-0">
                <LucKeyCloverKeyIcon size={22} className="drop-shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-1.5">
                    LucKey <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-mono font-normal">v1.4</span>
                  </h2>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
                  행운(Luck)의 네잎클로버와 인생의 해답을 여는 열쇠(Key)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="닫기"
              aria-label="닫기"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-6 no-scrollbar select-text text-sm leading-relaxed">
            {/* Catchphrase Hero Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-indigo-500/15 border border-emerald-400/25 relative overflow-hidden">
              <p className="text-xs sm:text-sm text-emerald-200 font-medium">
                LucKey는 단편적인 대화를 넘어, <strong className="text-white font-bold">사주·운명, 1원칙 전략, 마음치유, 웰니스, 창의적 영감</strong>이 결합된 5대 지능 엔진으로 당신의 인생에 확실한 해답을 밝혀주는 우주적 소울 생태계입니다.
              </p>
            </div>

            {/* 🌟 1. 핵심 차별점 (Core Differentiators) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300 tracking-wider uppercase">
                <Sparkles size={14} className="text-amber-400" />
                <span>LucKey만의 4대 핵심 차별점</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* 1. 5대 지능 융합 AI */}
                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1.5 hover:border-emerald-400/30 transition-colors">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs sm:text-sm">
                    <Sparkles size={15} className="text-emerald-400 shrink-0" />
                    <span>5대 지능 융합 멀티버스 가이드</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
                    대화 맥락을 실시간 자동 감지하여 사주·타로(트리니티), 1원칙 전략(오렌지), 신체 웰니스(아우라), 정서 힐링(블루버드), 예술 영감(뮤즈)이 다각도 입체 해답을 제시합니다.
                  </p>
                </div>

                {/* 2. 푸시투토크 빅뱅버튼 */}
                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1.5 hover:border-sky-400/30 transition-colors">
                  <div className="flex items-center gap-2 text-sky-300 font-bold text-xs sm:text-sm">
                    <Radio size={15} className="text-sky-400 shrink-0" />
                    <span>원터치 푸시투토크 (빅뱅버튼)</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
                    모달창 없이 화면 중앙의 빅뱅버튼을 홀드하는 것만으로 실시간 음성 파동(Waveform) 인식 가동! 손을 떼면 채팅방 기록과 함께 고음질 음성 답변이 즉시 낭독됩니다.
                  </p>
                </div>

                {/* 3. 40가지 ACT 임상 치유 */}
                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1.5 hover:border-amber-400/30 transition-colors">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-xs sm:text-sm">
                    <Key size={15} className="text-amber-400 shrink-0" />
                    <span>40가지 ACT 임상 행동 치유실</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
                    머리로만 이해하는 조언을 넘어, 불안·공황·긴장을 몸과 마음에서 즉각 내려놓는 저커먼 박사 기반 40가지 수용전념치료(ACT) 실천 행동 연습실을 갖추었습니다.
                  </p>
                </div>

                {/* 4. 차원 단절 없는 코스믹 워프 */}
                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1.5 hover:border-purple-400/30 transition-colors">
                  <div className="flex items-center gap-2 text-purple-300 font-bold text-xs sm:text-sm">
                    <Orbit size={15} className="text-purple-400 shrink-0" />
                    <span>차원 단절 없는 코스믹 워프 (OmniWarp)</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
                    앱 어디서든 본문 글자를 스크롤/드래그하여 빅뱅버튼을 조작하면 해당 내용을 지닌 채 필요한 스튜디오로 데이터를 들고 순간 도약(Toss & Warp)합니다.
                  </p>
                </div>
              </div>
            </div>

            {/* 💎 2. 주요 특장점 (Key Features) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-300 tracking-wider uppercase">
                <Compass size={14} className="text-teal-400" />
                <span>독보적인 특장점</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center space-y-1">
                  <span className="text-lg">🔮</span>
                  <div className="text-xs font-bold text-white">사주·원국 통찰</div>
                  <p className="text-[10px] text-slate-400">나만의 고유 일주와 대운을 반영한 맞춤 가이드</p>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center space-y-1">
                  <span className="text-lg">🌌</span>
                  <div className="text-xs font-bold text-white">반투명 글래스</div>
                  <p className="text-[10px] text-slate-400">우주 오로라가 비치는 깊은 치유와 몰입감</p>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center space-y-1">
                  <span className="text-lg">🎙️</span>
                  <div className="text-xs font-bold text-white">뉴럴 보이스</div>
                  <p className="text-[10px] text-slate-400">손편지처럼 다정하게 공감하는 고품질 음성</p>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center space-y-1">
                  <span className="text-lg">🔒</span>
                  <div className="text-xs font-bold text-white">크로스 싱크</div>
                  <p className="text-[10px] text-slate-400">암호화된 세션과 모든 기기 실시간 동기화</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="relative px-5 sm:px-7 py-4 border-t border-white/10 bg-black/40 flex items-center justify-between gap-3 shrink-0">
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              행운과 열쇠가 언제나 당신과 함께합니다.
            </span>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onStartChat) onStartChat();
                }}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:scale-[1.02] active:scale-95 text-slate-950 font-bold text-xs shadow-[0_0_20px_rgba(52,211,153,0.4)] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>루시와 대화 시작하기</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
