import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  KeyRound,
  X,
  Sparkles,
  Scroll,
  ExternalLink,
  Volume2,
  VolumeX,
  Copy,
  Check,
  RotateCcw,
} from "lucide-react";
import { useLocation } from "wouter";
import {
  KeyArchiveItem,
  searchPrescriptionsByConcern,
  get40TechniqueScrolls,
} from "@/lib/keyArchiveExtractor";
import { UnifiedMessage } from "@/lib/chatHistorySync";
import { playTTS, stopTTS, subscribeTTS } from "@/utils/tts";
import { sacredAudio } from "@/lib/omniWarp/sacredAudio";
import { omniWarpAudio } from "@/lib/omniWarp/omniWarpAudio";
import { triggerHaptic } from "@/lib/omniWarp/omniWarpHaptics";

interface KeyRolledScrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: UnifiedMessage[];
  initialConcern?: string;
  onNavigateToKey?: () => void;
}

/**
 * 🗝️ KeyRolledScrollModal: 루시 대화 고민 맞춤 40기법 두루마리 모달
 * - 루시와의 대화 속 고민을 분석하여 40가지 기법 중 최적의 1가지를 매칭
 * - 초기 진입 시 봉인된 앤틱 원통형 두루마리(말려져있는 상태)로 출현
 * - 터치 시 부드럽게 펼쳐지며 40기법 심층 처방과 오디오 낭독, Key 성소 연계 제공
 */
export function KeyRolledScrollModal({
  isOpen,
  onClose,
  messages,
  initialConcern,
  onNavigateToKey,
}: KeyRolledScrollModalProps) {
  const [, setLocation] = useLocation();
  const [isRolled, setIsRolled] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // 대화 기록 속 질문자(사용자)의 최근 고민과 맥락 텍스트 정밀 추출
  const userConcernText = useMemo(() => {
    if (initialConcern && initialConcern.trim().length >= 2) {
      return initialConcern.trim();
    }

    const extractMsgText = (m: any): string => {
      if (typeof m?.content === "string") return m.content;
      if (typeof m?.text === "string") return m.text;
      if (Array.isArray(m?.content)) {
        return m.content
          .map((part: any) => (typeof part === "string" ? part : part?.text || ""))
          .join(" ");
      }
      return "";
    };

    const isUserMsg = (m: any) => m?.role === "user" || m?.sender === "user";

    const userMsgs = messages
      .filter(isUserMsg)
      .map(extractMsgText)
      .filter((t) => t && t.trim().length > 0);

    if (userMsgs.length > 0) {
      // 최근 질문들 위주로 조합
      return userMsgs.slice(-3).join(" ").trim();
    }

    const allMsgs = messages.map(extractMsgText).filter((t) => t && t.trim().length > 0);
    if (allMsgs.length > 0) {
      return allMsgs.slice(-2).join(" ").trim();
    }

    return "마음의 평온과 긴장 완화, 내면의 중심 회복";
  }, [messages, initialConcern]);

  // 40가지 기법 중 사용자의 고민에 가장 깊이 공명하는 1가지 기법 매칭
  const matchedItem: KeyArchiveItem = useMemo(() => {
    if (userConcernText) {
      const results = searchPrescriptionsByConcern(userConcernText);
      if (results && results.length > 0) {
        return results[0];
      }
    }
    const allTechniques = get40TechniqueScrolls();
    return allTechniques[0];
  }, [userConcernText]);

  // 모달이 열릴 때마다 두루마리를 항상 '말려진 상태'로 초기화
  useEffect(() => {
    if (isOpen) {
      setIsRolled(true);
      setIsCopied(false);
      try {
        omniWarpAudio.playWhiteHole();
        sacredAudio.playSingingBowl(528);
        triggerHaptic("whitehole");
      } catch (_) {}
    } else {
      stopTTS();
      setIsSpeaking(false);
    }
  }, [isOpen]);

  // TTS 재생 상태 동기화
  useEffect(() => {
    const unsub = subscribeTTS((state) => {
      setIsSpeaking(state.isSpeaking);
    });
    return unsub;
  }, []);

  if (!isOpen || !matchedItem) return null;

  // 두루마리 펼치기 / 말기 토글
  const handleToggleRoll = () => {
    setIsRolled((prev) => {
      const next = !prev;
      try {
        if (next) {
          sacredAudio.playSingingBowl(432);
          triggerHaptic("wormhole");
        } else {
          sacredAudio.playSingingBowl(528);
          omniWarpAudio.playWhiteHole();
          triggerHaptic("whitehole");
        }
      } catch (_) {}
      return next;
    });
  };

  // 복사 핸들러
  const handleCopy = () => {
    const textToCopy = `[LucKey 40기법 Key 처방전]\n제목: ${matchedItem.title}\n핵심: ${matchedItem.keypoint}\n\n${matchedItem.fullText}`;
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // TTS 오디오 읽어주기 핸들러
  const handleToggleAudio = () => {
    if (isSpeaking) {
      stopTTS();
      setIsSpeaking(false);
    } else {
      const textToRead = `${matchedItem.title}. ${matchedItem.keypoint}. ${matchedItem.fullText}`;
      playTTS(textToRead);
      setIsSpeaking(true);
    }
  };

  // Key 신탁 성소(/key)로 바로 이동하며 매칭된 기법 및 고민 전달
  const handleGoToKeySanctuary = () => {
    stopTTS();
    sessionStorage.setItem("prism_key_matched_concern", userConcernText.slice(0, 100));
    sessionStorage.setItem("prism_key_matched_technique_id", matchedItem.id);
    sessionStorage.setItem("prism_key_start_rolled", "true");
    onClose();
    if (onNavigateToKey) {
      onNavigateToKey();
    } else {
      setLocation("/key");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[3000] flex items-center justify-center p-3 sm:p-4 font-sans select-none overflow-hidden">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
          onClick={() => {
            stopTTS();
            onClose();
          }}
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
          className="relative z-10 w-full max-w-lg flex flex-col items-center max-h-[90vh]"
        >
          {/* Top Floating Badge & Close Button */}
          <div className="w-full flex items-center justify-between px-2 mb-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-400/40 text-amber-200 text-xs font-serif shadow-lg backdrop-blur-md">
              <KeyRound size={13} className="text-amber-300 animate-pulse" />
              <span className="tracking-wide">루시 대화 맞춤 Key 두루마리</span>
            </div>
            <button
              onClick={() => {
                stopTTS();
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-lg"
              title="닫기"
            >
              <X size={16} />
            </button>
          </div>

          <AnimatePresence mode="wait">
            {isRolled ? (
              /* 📜 [상태 1] 두루마리가 말려있는 상태: 진짜 앤틱 원통형 두루마리 */
              <motion.div
                key="rolled-scroll"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.3 }}
                className="w-full flex flex-col items-center gap-3.5"
              >
                {/* 🌟 3D Royal Rolled Scroll Cylinder */}
                <div
                  onClick={handleToggleRoll}
                  className="group relative w-full rounded-2xl p-4 flex items-center justify-between gap-3 backdrop-blur-2xl border transition-all duration-500 shadow-2xl cursor-pointer active:scale-[0.98] bg-gradient-to-r from-[#170e07] via-[#2a190e] via-[#3e2615] via-[#2a190e] to-[#170e07] border-amber-400/60 hover:border-amber-400/90 shadow-[0_0_35px_rgba(251,191,36,0.3),0_12px_30px_rgba(0,0,0,0.9)]"
                  title="터치하여 두루마리 펼치기"
                >
                  {/* Left Turned-Wood Knob with Gilded Brass Ring */}
                  <div className="flex items-center shrink-0">
                    <div className="w-1.5 h-10 rounded-l-full bg-amber-400/80 shadow-inner" />
                    <div className="w-3.5 h-16 rounded-l-md bg-gradient-to-b from-[#78350f] via-[#d97706] via-[#b45309] to-[#451a03] border-l-2 border-amber-200/90 shadow-[inset_1px_1px_3px_rgba(255,255,255,0.6),-2px_0_6px_rgba(0,0,0,0.8)]" />
                  </div>

                  {/* Center Scroll Body & Carmine Wax Seal */}
                  <div className="flex-1 flex items-center justify-between min-w-0 px-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Royal Carmine Wax Seal with Gold Key */}
                      <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#991b1b] via-[#dc2626] to-[#450a0a] border-2 border-amber-300 flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.7),inset_0_2px_4px_rgba(255,255,255,0.4)] shrink-0">
                        <KeyRound size={20} className="text-amber-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-300 animate-ping" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-serif font-bold text-amber-100 tracking-wide truncate drop-shadow-sm">
                            고민 맞춤 기법 두루마리
                          </span>
                          <span className="text-[10px] font-mono text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/40 shrink-0">
                            40기법 선별
                          </span>
                        </div>
                        <p className="text-xs text-amber-200/90 truncate mt-0.5 font-serif">
                          {matchedItem.title}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0 pl-2">
                      <span className="text-[10px] font-bold text-amber-300 animate-pulse tracking-wider">
                        터치하여 펼침 ✧
                      </span>
                      <span className="text-[9px] text-amber-400/70 font-mono mt-0.5">
                        UNROLL
                      </span>
                    </div>
                  </div>

                  {/* Right Turned-Wood Knob with Gilded Brass Ring */}
                  <div className="flex items-center shrink-0">
                    <div className="w-3.5 h-16 rounded-r-md bg-gradient-to-b from-[#78350f] via-[#d97706] via-[#b45309] to-[#451a03] border-r-2 border-amber-200/90 shadow-[inset_-1px_1px_3px_rgba(255,255,255,0.6),2px_0_6px_rgba(0,0,0,0.8)]" />
                    <div className="w-1.5 h-10 rounded-r-full bg-amber-400/80 shadow-inner" />
                  </div>
                </div>

                {/* Detected concern quote pill */}
                <div className="w-full px-3 py-2 rounded-xl bg-black/60 border border-amber-500/20 backdrop-blur-md flex items-center gap-2 text-xs text-amber-200/80">
                  <Sparkles size={13} className="text-amber-400 shrink-0" />
                  <span className="text-amber-400/90 font-bold shrink-0 font-serif">대화 고민:</span>
                  <span className="truncate text-amber-100/90 italic">"{userConcernText}"</span>
                </div>

                {/* Direct Action Buttons */}
                <div className="w-full flex items-center gap-2.5 mt-1">
                  <button
                    onClick={handleToggleRoll}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Scroll size={15} />
                    <span>두루마리 펼쳐서 처방 보기</span>
                  </button>
                  <button
                    onClick={handleGoToKeySanctuary}
                    className="py-2.5 px-3.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/70 border border-amber-400/40 text-amber-200 font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
                    title="Key 신탁 성소에서 이어보기"
                  >
                    <ExternalLink size={14} />
                    <span className="hidden sm:inline">Key 성소</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              /* 📜 [상태 2] 두루마리가 활짝 펼쳐진 상태: 40기법 상세 심층 처방전 */
              <motion.div
                key="unrolled-scroll"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.35 }}
                className="w-full rounded-2xl bg-[#0c0906]/95 border border-amber-400/50 shadow-[0_0_45px_rgba(251,191,36,0.25),0_20px_50px_rgba(0,0,0,0.95)] backdrop-blur-2xl flex flex-col overflow-hidden max-h-[82vh]"
              >
                {/* Scroll Top Roll Rod Header */}
                <div className="h-3 w-full bg-gradient-to-r from-[#451a03] via-[#d97706] via-[#f59e0b] via-[#d97706] to-[#451a03] shadow-inner shrink-0" />

                {/* Content Body */}
                <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar flex flex-col gap-3.5">
                  {/* Category & Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 font-bold">
                        {matchedItem.categoryLabel || "40기법 처방"}
                      </span>
                      <span className="text-xs text-amber-400/70 font-mono">
                        #{matchedItem.id.replace("tech-", "")}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handleToggleAudio}
                        className={`p-1.5 rounded-lg border text-xs transition-all active:scale-95 flex items-center gap-1 cursor-pointer ${
                          isSpeaking
                            ? "bg-amber-500/30 border-amber-400 text-amber-200"
                            : "bg-black/40 hover:bg-black/60 border-amber-500/30 text-amber-300"
                        }`}
                        title="처방 음성 낭독"
                      >
                        {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                        <span className="text-[10px] font-bold">{isSpeaking ? "정지" : "낭독"}</span>
                      </button>

                      <button
                        onClick={handleCopy}
                        className="p-1.5 rounded-lg bg-black/40 hover:bg-black/60 border border-amber-500/30 text-amber-300 transition-all active:scale-95 cursor-pointer"
                        title="처방전 복사"
                      >
                        {isCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg sm:text-xl font-serif font-bold text-amber-100 tracking-wide leading-snug drop-shadow-sm">
                    {matchedItem.title}
                  </h3>

                  {/* Core Insight Box */}
                  <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-400/30 shadow-inner flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300 font-serif">
                      <Sparkles size={12} className="text-amber-400" />
                      <span>핵심 요점 (Core Insight)</span>
                    </div>
                    <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed font-serif">
                      {matchedItem.keypoint}
                    </p>
                  </div>

                  {/* Full Prescription Text */}
                  <div className="p-3.5 rounded-xl bg-black/50 border border-white/5 flex flex-col gap-2">
                    <div className="text-[11px] font-bold text-amber-200/80 font-serif">
                      기법 실천 가이드 & 처방
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-line font-sans">
                      {matchedItem.fullText}
                    </p>
                  </div>

                  {/* Tags */}
                  {matchedItem.tags && matchedItem.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {matchedItem.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300/80"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="p-3 bg-black/70 border-t border-amber-400/20 flex items-center justify-between gap-2 shrink-0">
                  <button
                    onClick={handleToggleRoll}
                    className="py-2 px-3 rounded-xl bg-black/60 hover:bg-black/90 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw size={13} />
                    <span>다시 말아두기</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleGoToKeySanctuary}
                      className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    >
                      <ExternalLink size={13} />
                      <span>Key 성소에서 이어보기</span>
                    </button>
                  </div>
                </div>

                {/* Scroll Bottom Roll Rod Footer */}
                <div className="h-3 w-full bg-gradient-to-r from-[#451a03] via-[#d97706] via-[#f59e0b] via-[#d97706] to-[#451a03] shadow-inner shrink-0" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
