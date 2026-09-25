import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Compass,
  Sun,
  Eye,
  ChevronRight,
  Copy,
  Check,
} from 'lucide-react';
import { Streamdown } from '@/components/Streamdown';
import { playTTSInChunks, stopTTS, useTTSActive, useTTSState } from '@/utils/tts';
import {
  buildTarotNarrationContent,
  type TarotNarrationChapter,
} from '@/lib/todayTarotNarration';

export interface TodayTarotNarrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyResult: any;
  initialMode?: 'narration' | 'text';
  onConsultLucy?: (cardContext: string) => void;
  onGoToTarotWheel?: () => void;
}

export function TodayTarotNarrationModal({
  isOpen,
  onClose,
  dailyResult,
  onConsultLucy,
  onGoToTarotWheel,
}: TodayTarotNarrationModalProps) {
  const [selectedVoice, setSelectedVoice] = useState<'Lucy' | 'Kore'>('Lucy');
  const [activeChapterIndex, setActiveChapterIndex] = useState<number | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const isTTSActive = useTTSActive();
  const ttsState = useTTSState();

  const narrationData = useMemo(() => {
    return buildTarotNarrationContent(dailyResult);
  }, [dailyResult]);

  // Clean up TTS audio on close
  const handleClose = useCallback(() => {
    stopTTS();
    setActiveChapterIndex(null);
    onClose();
  }, [onClose]);

  // Sync active chapter highlighting with current ttsState
  useEffect(() => {
    if (!isTTSActive) {
      setActiveChapterIndex(null);
      return;
    }
    if (!ttsState.activeFullText) return;

    const matchedIdx = narrationData.chapters.findIndex(
      (ch) =>
        ch.speechText === ttsState.activeFullText ||
        ttsState.activeFullText?.includes(ch.speechText.slice(0, 30))
    );
    if (matchedIdx !== -1) {
      setActiveChapterIndex(matchedIdx);
    }
  }, [isTTSActive, ttsState.activeFullText, narrationData.chapters]);

  // Full Narration Playback (Sequential chunks)
  const handlePlayFullNarration = useCallback(async () => {
    if (isTTSActive) {
      stopTTS();
      setActiveChapterIndex(null);
      return;
    }
    if (!narrationData.fullSpeech) return;

    setActiveChapterIndex(0);
    const voiceName = selectedVoice === 'Lucy' ? 'Lucy' : 'Kore';
    await playTTSInChunks(narrationData.fullSpeech, voiceName, 320, '신비');
  }, [isTTSActive, narrationData.fullSpeech, selectedVoice]);

  // Play a specific single chapter
  const handlePlayChapter = useCallback(
    async (chapter: TarotNarrationChapter, index: number) => {
      if (isTTSActive && activeChapterIndex === index) {
        stopTTS();
        setActiveChapterIndex(null);
        return;
      }
      stopTTS();
      setActiveChapterIndex(index);
      const voiceName = selectedVoice === 'Lucy' ? 'Lucy' : 'Kore';
      await playTTSInChunks(chapter.speechText, voiceName, 260, '신비');
    },
    [isTTSActive, activeChapterIndex, selectedVoice],
  );

  const handleCopyText = useCallback(() => {
    if (!narrationData.fullSpeech) return;
    const cardInfo = narrationData.card
      ? `[오늘의 타로] ${narrationData.card.nameKo} (${narrationData.card.reversed ? '역방향' : '정방향'})\n\n`
      : '';
    const textToCopy =
      `✨ [오늘의 타로 리딩 결과]\n` +
      cardInfo +
      `■ 마스터 심층 비전 진단\n${narrationData.rawDiagnosis}\n\n` +
      (narrationData.rawRemedy ? `■ 오늘의 개운 실천 처방\n${narrationData.rawRemedy}\n\n` : '') +
      (narrationData.rawBlessing
        ? `■ 행운의 파동과 축복\n주파수: ${narrationData.frequency} · 행운수: ${narrationData.luckyNumber} · 행운색: ${narrationData.luckyColor}\n"${narrationData.rawBlessing}"\n`
        : '') +
      `- PRISM TRINITY ORACLE`;
    navigator.clipboard.writeText(textToCopy).catch(() => {});
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [narrationData]);

  const handleConsult = useCallback(() => {
    if (!onConsultLucy) return;
    const cardName = narrationData.card?.nameKo || '오늘의 타로';
    const orientation = narrationData.card?.reversed ? '역방향' : '정방향';
    const diag = narrationData.rawDiagnosis || '';
    const remedy = narrationData.rawRemedy || '';
    const context = `[🔮 오늘의 타로 데일리 연계]\n- 뽑은 카드: ${cardName} (${orientation})\n- 마스터 비전 진단: ${diag.slice(0, 600)}\n- 개운 처방: ${remedy}`;
    handleClose();
    onConsultLucy(context);
  }, [onConsultLucy, narrationData, handleClose]);

  if (!isOpen) return null;

  const card = narrationData.card;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl bg-[#0c0c12] border border-yellow-500/35 p-5 sm:p-7 rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-white max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col space-y-5"
        >
          {/* Subtle Ambient Cosmic Glow */}
          <div
            className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[80px] opacity-20 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #eab308 0%, #a855f7 50%, transparent 80%)' }}
          />
          <div
            className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full blur-[80px] opacity-15 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #f59e0b 0%, #6366f1 50%, transparent 80%)' }}
          />

          {/* Close Button */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer z-10"
            title="닫기"
          >
            <X size={18} />
          </button>

          {/* Header Title */}
          <div className="flex flex-col justify-start gap-1 border-b border-white/10 pb-3 pr-8">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-yellow-400 font-mono">
              <Sparkles size={13} className="text-yellow-400 animate-pulse" />
              <span>오늘의 타로 오라클 (Today&apos;s Tarot Oracle)</span>
            </div>
            <h2 className="text-lg sm:text-xl font-display font-bold text-white tracking-tight flex items-center gap-2">
              <span>오늘의 타로 결과 & 음성 낭독</span>
            </h2>
          </div>

          {/* Card Showcase Banner or Empty State */}
          {!card ? (
            <div className="py-8 px-4 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400 mx-auto">
                <Sparkles size={24} className="animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">오늘의 타로 카드가 아직 없습니다</h4>
                <p className="text-xs text-white/50 max-w-sm mx-auto leading-relaxed">
                  오늘 하루의 우주적 기운과 배경 에너지를 담은 데일리 타로 카드를 아직 뽑지 않았습니다.
                </p>
              </div>
              {onGoToTarotWheel && (
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    onGoToTarotWheel();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold text-xs flex items-center justify-center gap-2 mx-auto shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <Sparkles size={14} />
                  <span>오늘의 타로 보기 (1장 뽑기)</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-yellow-500/15 via-amber-500/10 to-purple-950/20 border border-yellow-500/30 shadow-md">
              <div className="w-16 h-24 sm:w-20 sm:h-32 rounded-xl overflow-hidden border border-yellow-400/40 bg-zinc-900 shadow-lg shrink-0 relative group">
                {card.imageUrl ? (
                  <img
                    src={card.imageUrl}
                    alt={`${card.nameKo} 타로 카드`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-yellow-400 font-bold text-xs">
                    {card.nameKo.slice(0, 2)}
                  </div>
                )}
                {card.reversed && (
                  <div className="absolute inset-x-0 bottom-0 bg-red-950/80 text-[9px] text-red-200 text-center font-bold py-0.5 border-t border-red-500/30">
                    역방향
                  </div>
                )}
              </div>

              <div className="space-y-1.5 text-center sm:text-left flex-1 min-w-0">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-yellow-400/80 font-bold">
                    COSMIC ANCHOR
                  </span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-200 border border-yellow-400/30 font-semibold">
                    {card.reversed ? '역방향 (Reversed)' : '정방향 (Upright)'}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                  {card.nameKo} <span className="text-xs text-white/50 font-mono font-normal">({card.name})</span>
                </h3>
                {card.keywords?.length > 0 && (
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap pt-1">
                    {card.keywords.slice(0, 4).map((kw: string) => (
                      <span
                        key={kw}
                        className="text-[9px] px-2 py-0.5 rounded-full bg-white/10 text-yellow-300/90 border border-white/10"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Integrated Narration Controller (기본 텍스트에 통합된 낭독 바) */}
          {card && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-purple-950/20 border border-yellow-500/30 shadow-inner space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Master Play Button */}
                  <button
                    type="button"
                    onClick={handlePlayFullNarration}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 ${
                      isTTSActive
                        ? 'bg-amber-400 text-black border border-amber-300 animate-pulse'
                        : 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black'
                    }`}
                  >
                    {isTTSActive ? <VolumeX size={15} /> : <Play size={15} className="fill-current" />}
                    <span>{isTTSActive ? '낭독 중지' : '전체 낭독 듣기'}</span>
                  </button>

                  {/* Replay Button */}
                  <button
                    type="button"
                    onClick={handlePlayFullNarration}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all cursor-pointer"
                    title="처음부터 다시 듣기"
                  >
                    <RotateCcw size={14} />
                  </button>

                  {/* Animated Equalizer Wavebars */}
                  {isTTSActive && (
                    <div className="flex items-end gap-1 h-5 px-2">
                      <span className="w-1 bg-yellow-400 rounded-full animate-bounce [animation-delay:0ms] h-4" />
                      <span className="w-1 bg-yellow-400 rounded-full animate-bounce [animation-delay:150ms] h-5" />
                      <span className="w-1 bg-yellow-400 rounded-full animate-bounce [animation-delay:300ms] h-3" />
                      <span className="w-1 bg-yellow-400 rounded-full animate-bounce [animation-delay:450ms] h-5" />
                      <span className="w-1 bg-yellow-400 rounded-full animate-bounce [animation-delay:200ms] h-2" />
                    </div>
                  )}
                </div>

                {/* Voice Selector & Copy Button */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 p-1 bg-black/40 border border-white/10 rounded-xl text-[11px]">
                    <span className="text-white/40 pl-1.5 font-mono text-[10px]">목소리:</span>
                    <button
                      type="button"
                      onClick={() => setSelectedVoice('Lucy')}
                      className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                        selectedVoice === 'Lucy'
                          ? 'bg-yellow-400/25 text-yellow-300 border border-yellow-400/40'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      루시
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedVoice('Kore')}
                      className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                        selectedVoice === 'Kore'
                          ? 'bg-yellow-400/25 text-yellow-300 border border-yellow-400/40'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Kore
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyText}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all cursor-pointer"
                    title="타로 결과 및 낭독 텍스트 전체 복사"
                  >
                    {isCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-white/50 pt-1 font-mono">
                <span>텍스트 리딩 원문 & 실시간 음성 동조</span>
                <span>
                  {activeChapterIndex !== null
                    ? `현재: ${narrationData.chapters[activeChapterIndex]?.title || '낭독 중'}`
                    : '단락별 개별 청취 가능'}
                </span>
              </div>
            </div>
          )}

          {/* Core Text Body with Integrated Audio Narration (기본 텍스트에 낭독 기능 탑재) */}
          {card && (
            <div className="space-y-4 text-left">
              {/* Section 1: 오늘의 심층 비전 진단 */}
              <div
                className={`p-5 rounded-2xl border transition-all duration-300 relative ${
                  activeChapterIndex === 1
                    ? 'bg-gradient-to-r from-yellow-500/15 via-amber-500/10 to-transparent border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.25)]'
                    : 'bg-white/[0.03] border-white/10'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        activeChapterIndex === 1 ? 'bg-yellow-400 text-black' : 'bg-white/10 text-yellow-400'
                      }`}
                    >
                      <Eye size={14} />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-yellow-400/80 block font-bold">
                        COSMIC INSIGHT
                      </span>
                      <h4 className="text-sm font-bold text-white">마스터 심층 비전 진단</h4>
                    </div>
                  </div>

                  {/* Section TTS Play Button */}
                  {narrationData.chapters[1] && (
                    <button
                      type="button"
                      onClick={() => handlePlayChapter(narrationData.chapters[1], 1)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        activeChapterIndex === 1
                          ? 'bg-yellow-400 text-black shadow-sm animate-pulse'
                          : 'bg-white/10 hover:bg-white/20 text-white/90 border border-white/15'
                      }`}
                    >
                      {activeChapterIndex === 1 ? <VolumeX size={11} /> : <Volume2 size={11} />}
                      <span>{activeChapterIndex === 1 ? '낭독 중지' : '이 단락 듣기'}</span>
                    </button>
                  )}
                </div>

                <div className="text-sm text-stone-200 leading-relaxed font-sans pl-1">
                  <Streamdown immediate>{narrationData.rawDiagnosis}</Streamdown>
                </div>
              </div>

              {/* Section 2: 오늘의 개운 실천 처방 */}
              {narrationData.rawRemedy && (
                <div
                  className={`p-5 rounded-2xl border transition-all duration-300 relative ${
                    activeChapterIndex === 2
                      ? 'bg-gradient-to-r from-yellow-500/15 via-amber-500/10 to-transparent border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.25)]'
                      : 'bg-white/[0.03] border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          activeChapterIndex === 2 ? 'bg-yellow-400 text-black' : 'bg-white/10 text-amber-400'
                        }`}
                      >
                        <Compass size={14} />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400/80 block font-bold">
                          ACTION REMEDY
                        </span>
                        <h4 className="text-sm font-bold text-white">오늘의 개운 실천 처방</h4>
                      </div>
                    </div>

                    {/* Section TTS Play Button */}
                    {narrationData.chapters[2] && (
                      <button
                        type="button"
                        onClick={() => handlePlayChapter(narrationData.chapters[2], 2)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          activeChapterIndex === 2
                            ? 'bg-yellow-400 text-black shadow-sm animate-pulse'
                            : 'bg-white/10 hover:bg-white/20 text-white/90 border border-white/15'
                        }`}
                      >
                        {activeChapterIndex === 2 ? <VolumeX size={11} /> : <Volume2 size={11} />}
                        <span>{activeChapterIndex === 2 ? '낭독 중지' : '이 단락 듣기'}</span>
                      </button>
                    )}
                  </div>

                  <div className="text-sm text-stone-200 leading-relaxed font-sans whitespace-pre-line pl-1">
                    {narrationData.rawRemedy}
                  </div>
                </div>
              )}

              {/* Section 3: 행운의 파동과 축복 */}
              {narrationData.rawBlessing && (
                <div
                  className={`p-5 rounded-2xl border transition-all duration-300 relative ${
                    activeChapterIndex === 3
                      ? 'bg-gradient-to-r from-yellow-500/15 via-amber-500/10 to-transparent border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.25)]'
                      : 'bg-white/[0.03] border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          activeChapterIndex === 3 ? 'bg-yellow-400 text-black' : 'bg-white/10 text-amber-300'
                        }`}
                      >
                        <Sun size={14} />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300/80 block font-bold">
                          COSMIC BLESSING
                        </span>
                        <h4 className="text-sm font-bold text-white">행운의 파동과 축복</h4>
                      </div>
                    </div>

                    {/* Section TTS Play Button */}
                    {narrationData.chapters[3] && (
                      <button
                        type="button"
                        onClick={() => handlePlayChapter(narrationData.chapters[3], 3)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          activeChapterIndex === 3
                            ? 'bg-yellow-400 text-black shadow-sm animate-pulse'
                            : 'bg-white/10 hover:bg-white/20 text-white/90 border border-white/15'
                        }`}
                      >
                        {activeChapterIndex === 3 ? <VolumeX size={11} /> : <Volume2 size={11} />}
                        <span>{activeChapterIndex === 3 ? '낭독 중지' : '이 단락 듣기'}</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-2.5 pl-1">
                    <div className="flex items-center gap-2 text-xs font-mono text-yellow-300/90 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-yellow-400/10 border border-yellow-400/20">
                        주파수: {narrationData.frequency}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-yellow-400/10 border border-yellow-400/20">
                        행운수: {narrationData.luckyNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-yellow-400/10 border border-yellow-400/20">
                        행운색: {narrationData.luckyColor}
                      </span>
                    </div>
                    <p className="text-xs text-stone-300 font-sans italic leading-relaxed">
                      &quot;{narrationData.rawBlessing}&quot;
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Footer Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-white/10">
            {onGoToTarotWheel && (
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  onGoToTarotWheel();
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-300 hover:text-yellow-200 border border-yellow-400/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Sparkles size={14} />
                <span>새로운 타로 뽑기</span>
              </button>
            )}

            {onConsultLucy && (
              <button
                type="button"
                onClick={handleConsult}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(250,204,21,0.3)] active:scale-95 cursor-pointer"
              >
                <Sparkles size={13} />
                <span>루시와 심층 상담하기</span>
                <ChevronRight size={13} />
              </button>
            )}

            <button
              type="button"
              onClick={handleClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 hover:text-white text-xs font-bold transition-all cursor-pointer"
            >
              닫기
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default TodayTarotNarrationModal;
