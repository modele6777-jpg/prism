import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  MessageCircle, 
  RefreshCw, 
  Copy, 
  Check, 
  Heart, 
  Zap, 
  ArrowRight,
  Sun,
  Headphones,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { TTSButton } from '@/components/TTSButton';
import { 
  TodayLucyPersonaData, 
  getCachedTodayLucyPersona, 
  generatePersonalizedLucyPersonaMessage, 
  shuffleNextLucyPersonaMessage 
} from '@/lib/todayLucyPersona';
import { getTodayTrinityDailyResult } from '@/lib/todayTarotNarration';
import { TodayTarotNarrationModal } from '@/components/trinity/TodayTarotNarrationModal';

interface TodayLucyPersonaCardProps {
  saju?: any;
  biometrics?: { fatigue: number; stress: number; focus: number; sleep: number };
  globalInsight?: string;
  className?: string;
}

export function TodayLucyPersonaCard({
  saju,
  biometrics,
  globalInsight,
  className = "",
}: TodayLucyPersonaCardProps) {
  const { sharedState, openLucyChat } = useApp();
  const [data, setData] = useState<TodayLucyPersonaData>(() => getCachedTodayLucyPersona());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isTarotNarrationOpen, setIsTarotNarrationOpen] = useState(false);

  const nickname = sharedState?.userProfile?.basic?.nickname || '여행자';
  const vibe = sharedState?.currentVibe || '평온함';

  // Check today's daily tarot result from cache/sharedState
  const todayTarotResult = useMemo(() => {
    return getTodayTrinityDailyResult();
  }, [isRefreshing]);

  // Format today's date in Korean: e.g. "9월 25일 목요일"
  const formattedTodayDate = useMemo(() => {
    return new Date().toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  }, []);

  // Update with AI-personalized message if cached item is from a previous state or default
  useEffect(() => {
    // If we only have curated data and hasn't been generated today, try a background enhancement
    if (data.source === 'curated') {
      const sajuText = saju ? `${saju.dayMaster?.hanja || ''}(${saju.dayMaster?.korean || ''}) 본원, ${saju.elements?.dominant?.element || ''} 기운` : undefined;
      generatePersonalizedLucyPersonaMessage({
        nickname,
        sajuSummary: sajuText,
        vibe,
        biometrics,
        globalInsight,
      }).then((fresh) => {
        setData(fresh);
      }).catch(() => {
        // Keep curated fallback
      });
    }
  }, []);

  // Handle manual refresh / shuffle
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);

    try {
      const sajuText = saju ? `${saju.dayMaster?.hanja || ''}(${saju.dayMaster?.korean || ''}) 본원` : undefined;
      // Shuffle or generate fresh
      const next = shuffleNextLucyPersonaMessage(data.id);
      setData(next);
    } catch (_) {
      // fallback
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [data.id, isRefreshing, saju]);

  // Handle copying text to clipboard
  const handleCopy = useCallback(() => {
    const fullText = `[루시의 오늘의 페르소나 메시지]\n"${data.headline}"\n\n${data.message}\n\n💡 오늘의 실천: ${data.actionTip}\n#Lucy #PRISM #오늘의메시지`;
    navigator.clipboard.writeText(fullText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [data]);

  // Open Lucy Chat with context
  const handleOpenLucyChat = useCallback(() => {
    const draftPrompt = `루시야, 오늘 전해준 메시지 "${data.headline}"에 대해 더 깊이 이야기 나누고 싶어!`;
    openLucyChat('lucy', { draftPrompt });
  }, [data.headline, openLucyChat]);

  const speechText = `${data.headline}. ${data.message} 오늘의 실천 팁: ${data.actionTip}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`glass prism-xs-hub-card relative rounded-[32px] p-5 sm:p-7 md:p-8 border border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.35)] overflow-hidden group bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-black/60 backdrop-blur-xl mb-6 transition-all duration-300 hover:border-white/25 hover:shadow-[0_16px_50px_rgba(99,102,241,0.15)] ${className}`}
    >
      {/* Iridescent Cosmic Aura Background Glow */}
      <div 
        className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-[90px] opacity-20 pointer-events-none transition-transform duration-1000 group-hover:scale-125"
        style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.8) 0%, rgba(59,130,246,0.5) 50%, transparent 80%)' }}
      />
      <div 
        className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full blur-[80px] opacity-15 pointer-events-none transition-transform duration-1000 group-hover:scale-110"
        style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.7) 0%, rgba(245,158,11,0.4) 60%, transparent 80%)' }}
      />

      <div className="relative z-10 flex flex-col gap-4 sm:gap-5">
        {/* Top Header Bar: Clean unboxed typography (zero-pill discipline) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            {/* Lucy Avatar with Rainbow Gradient Border */}
            <div className="relative w-11 h-11 rounded-2xl border border-white/20 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(168,85,247,0.3)] backdrop-blur-md bg-gradient-to-br from-purple-500/30 via-pink-500/20 to-amber-500/30 group/avatar">
              <Sparkles size={20} className="text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] transition-transform duration-500 group-hover/avatar:rotate-12 group-hover/avatar:scale-110" />
              <div className="absolute inset-0 rounded-2xl border border-white/30 animate-pulse pointer-events-none" />
            </div>

            {/* Title & Metadata Line */}
            <div>
              <div className="flex items-center gap-2 text-[11px] font-mono tracking-wider uppercase text-white/50">
                <span className="font-bold text-amber-300/90 flex items-center gap-1">
                  <Sun size={12} className="text-amber-400" />
                  LUCY PERSONA
                </span>
                <span aria-hidden="true" className="text-white/20">·</span>
                <span>오늘의 메시지</span>
                <span aria-hidden="true" className="text-white/20">·</span>
                <span className="text-white/40">{formattedTodayDate}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-display font-bold text-white tracking-tight flex items-center gap-2 mt-0.5">
                <span>오늘의 루시 페르소나 메시지</span>
                {data.vibe && (
                  <span className="text-xs font-normal text-purple-300/80 font-sans hidden sm:inline">
                    ({data.vibe})
                  </span>
                )}
              </h2>
            </div>
          </div>

          {/* Quick Header Controls (TTS, Refresh, Copy) */}
          <div className="flex items-center gap-1.5 self-end sm:self-center">
            {/* Audio TTS Button */}
            <div title="루시 목소리로 듣기" className="flex items-center">
              <TTSButton 
                text={speechText} 
                voice="Lucy"
                className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95" 
              />
            </div>

            {/* Refresh / Next Message Button */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="새로운 페르소나 메시지 보기"
              className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
            >
              <RefreshCw size={15} className={`transition-transform duration-500 ${isRefreshing ? 'animate-spin text-purple-400' : 'group-hover:rotate-45'}`} />
            </button>

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              title="메시지 복사하기"
              className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95"
            >
              {isCopied ? (
                <Check size={15} className="text-emerald-400" />
              ) : (
                <Copy size={15} />
              )}
            </button>
          </div>
        </div>

        {/* Content Body: Dynamic Persona Message */}
        <AnimatePresence mode="wait">
          <motion.div
            key={data.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-3"
          >
            {/* Headline Quote */}
            <div className="flex items-start gap-2.5">
              <span className="text-2xl text-purple-400/80 leading-none select-none font-serif">“</span>
              <h3 className="text-lg sm:text-xl font-bold font-display text-white tracking-tight break-keep pt-0.5">
                {data.headline}
              </h3>
            </div>

            {/* Deep Lucy Message (100% 반말 친근한 톤) */}
            <p className="text-sm sm:text-[15px] text-white/85 leading-relaxed font-sans break-keep pl-5 sm:pl-6 border-l-2 border-purple-500/40 my-0.5">
              {data.message}
            </p>

            {/* Action Tip Kicker (현실 실천 가이드) */}
            {data.actionTip && (
              <div className="flex items-center gap-2 pl-5 sm:pl-6 pt-1 text-xs text-amber-300/90 font-medium font-sans">
                <Zap size={13} className="text-amber-400 shrink-0" />
                <span className="text-white/40 font-mono text-[10px] uppercase">LUCY'S TIP</span>
                <span className="text-white/30">·</span>
                <span className="break-keep">{data.actionTip}</span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* 🌟 오늘의 타로 결과 데일리 배너 & 낭독 버전 바로듣기 (오늘 뽑은 카드가 있을 때 상시 노출) */}
        {todayTarotResult?.drawnCard && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-purple-950/20 border border-yellow-500/30 text-xs text-white/90 shadow-inner">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center text-yellow-300 shrink-0 shadow-[0_0_10px_rgba(234,179,8,0.25)]">
                <Sparkles size={15} className="animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-yellow-400 font-extrabold">
                    오늘의 타로 (TODAY'S TAROT)
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-yellow-400/20 text-yellow-200 border border-yellow-400/30 font-semibold">
                    {todayTarotResult.drawnCard.reversed ? '역방향' : '정방향'}
                  </span>
                </div>
                <p className="text-xs text-stone-200 font-medium truncate mt-0.5">
                  ✨ {todayTarotResult.drawnCard.nameKo} <span className="text-[10px] text-white/50">({todayTarotResult.drawnCard.name})</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsTarotNarrationOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(234,179,8,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0 font-sans"
              title="오늘의 타로 결과를 낭독 버전으로 듣기"
            >
              <Headphones size={13} />
              <span>오늘의 타로 낭독버전으로 다시 보기</span>
            </button>
          </div>
        )}

        {/* Bottom Interactive Bar: Soft scale-on-hover CTA to converse with Lucy */}
        <div className="pt-2 sm:pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-white/40 font-sans">
            <Heart size={13} className="text-rose-400/70" />
            <span>루시와 실시간으로 속마음을 나누고 통찰을 얻어보세요</span>
          </div>

          <button
            type="button"
            onClick={handleOpenLucyChat}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 text-white bg-gradient-to-r from-purple-600/60 via-indigo-600/50 to-pink-600/60 hover:from-purple-600/80 hover:via-indigo-600/70 hover:to-pink-600/80 border border-purple-400/40 hover:border-purple-300/60 shadow-[0_4px_20px_rgba(168,85,247,0.3)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer font-sans"
          >
            <MessageCircle size={14} className="text-purple-200" />
            <span>루시에게 답장하고 대화 나누기</span>
            <ArrowRight size={13} className="opacity-70 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* 🔮 오늘의 타로 낭독 버전 전용 모달 */}
      <TodayTarotNarrationModal
        isOpen={isTarotNarrationOpen}
        onClose={() => setIsTarotNarrationOpen(false)}
        dailyResult={todayTarotResult}
        initialMode="narration"
        onConsultLucy={(cardContext) => {
          setIsTarotNarrationOpen(false);
          openLucyChat('lucy', {
            draftPrompt: `루시야, 방금 뽑은 오늘의 타로 카드 결과를 낭독 버전으로 들었어!\n\n${cardContext}\n\n이 카드의 메시지와 실천 방향에 대해 더 깊은 통찰을 나눠줘.`,
          });
        }}
      />
    </motion.div>
  );
}

export default TodayLucyPersonaCard;
