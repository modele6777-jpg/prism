import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Key, RefreshCw, ArrowRight, MessageSquare, Check, Copy, Zap } from 'lucide-react';
import {
  generateLucyKeyDigest,
  getCachedLucyKeyDigest,
  getRecentLucyDialogue,
  type LucyKeyDigest,
} from '@/lib/lucyKeyDigest';
import { triggerHaptic } from '@/lib/omniWarp/omniWarpHaptics';
import { sacredAudio } from '@/lib/omniWarp/sacredAudio';

interface LucyKeyDigestViewProps {
  onNavigateToLucy: (prompt?: string) => void;
  className?: string;
}

export function LucyKeyDigestView({
  onNavigateToLucy,
  className = '',
}: LucyKeyDigestViewProps) {
  const [digest, setDigest] = useState<LucyKeyDigest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [hasConversation, setHasConversation] = useState(false);

  // 초기 로드 시 캐시 확인 및 대화 유무 판별
  useEffect(() => {
    const { userMessages } = getRecentLucyDialogue();
    const hasTalk = userMessages.length > 0;
    setHasConversation(hasTalk);

    const cached = getCachedLucyKeyDigest();
    if (cached) {
      setDigest(cached);
    } else if (hasTalk) {
      handleGenerateDigest();
    }
  }, []);

  const handleGenerateDigest = async () => {
    setIsLoading(true);
    triggerHaptic('whitehole');
    sacredAudio.playSingingBowl(528);

    try {
      const res = await generateLucyKeyDigest();
      setDigest(res);
      triggerHaptic('bigbang');
      sacredAudio.playSingingBowl(741);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!digest) return;
    const text = `[LucKey: 루시 대화 3대 핵심 키포인트]\n\n🎯 핵심 주제: ${digest.coreTheme}\n\n${digest.keyPoints.join(
      '\n'
    )}\n\n⚡ 오늘 1가지 실천 액션: ${digest.microAction}\n\n🏷️ ${digest.mindKeywords.join(' ')}`;

    navigator.clipboard.writeText(text).catch(() => {});
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleContinueWithLucy = () => {
    if (!digest) {
      onNavigateToLucy();
      return;
    }
    const prompt = `루시야, 방금 LucKey에서 우리 대화의 핵심 키포인트를 정리해 봤어:\n• 핵심 주제: "${digest.coreTheme}"\n• 실천 과제: "${digest.microAction}"\n\n이 실천 과제를 오늘 바로 행동으로 옮기기 위해 구체적인 팁을 좀 더 들려줄 수 있어?`;
    onNavigateToLucy(prompt);
  };

  return (
    <div
      className={`w-full max-w-lg rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-950/90 to-black/95 border border-cyan-500/30 p-5 sm:p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden flex flex-col gap-4 text-white ${className}`}
    >
      {/* Background Subtle Key Glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between z-10 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-black shadow-lg shadow-cyan-500/30">
            <Key size={18} className="stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black tracking-tight text-white flex items-center gap-1">
                LucKey 대화 응축
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/40 font-bold">
                LucKey Insights
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              방대한 대화에서 뽑아낸 3대 핵심 지혜와 오늘의 1가지 실천 액션
            </p>
          </div>
        </div>

        {hasConversation && (
          <button
            type="button"
            onClick={handleGenerateDigest}
            disabled={isLoading}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 border border-white/10 transition-colors disabled:opacity-50"
            title="최신 대화로 키포인트 다시 응축"
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin text-cyan-400' : ''} />
            <span className="text-[11px] font-medium">{isLoading ? '응축 중...' : '새로고침'}</span>
          </button>
        )}
      </div>

      {/* Main Body */}
      <div className="z-10 flex flex-col gap-3 min-h-[220px] justify-center">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
            <div className="relative w-16 h-16 rounded-full flex items-center justify-center bg-cyan-500/10 border border-cyan-400/40 animate-pulse">
              <Key size={28} className="text-cyan-300 animate-spin" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">대화의 에센스를 응축하는 중...</p>
              <p className="text-xs text-slate-400 mt-1">루시와의 기억 속에서 핵심 Key를 벼려내고 있습니다</p>
            </div>
          </div>
        ) : !hasConversation ? (
          /* No Conversation State */
          <div className="flex flex-col items-center justify-center py-8 gap-3 text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
              <MessageSquare size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">아직 루시와 나눈 대화가 없습니다</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                루시와 대화를 나누신 후 Key에 오시면, 대화의 3대 핵심 키포인트와 실천 가이드를 보석처럼 응축해 드립니다.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToLucy()}
              className="mt-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 text-black font-black text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <span>루시와 대화 시작하기</span>
              <ArrowRight size={14} />
            </button>
          </div>
        ) : digest ? (
          /* Digest Presentation */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-3"
          >
            {/* Core Theme Box */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-cyan-500/20 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                대화의 본질 주제 (Core Theme)
              </span>
              <p className="text-xs sm:text-sm font-bold text-slate-100 leading-snug">
                "{digest.coreTheme}"
              </p>
            </div>

            {/* 3 Key Points */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                루시의 3대 지혜 키포인트 (Key Insights)
              </span>
              <div className="flex flex-col gap-1.5">
                {digest.keyPoints.map((kp, idx) => (
                  <div
                    key={`kp-${idx}`}
                    className="p-2.5 rounded-xl bg-gradient-to-r from-white/[0.07] to-white/[0.02] border border-white/10 flex items-start gap-2.5 hover:border-cyan-400/40 transition-colors"
                  >
                    <div className="w-5 h-5 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed font-medium">
                      {kp.replace(/^Key\s*\d+:\s*/i, '')}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 1 Micro Action */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-transparent border border-amber-400/30 flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-xl bg-amber-400 text-black flex items-center justify-center shrink-0 shadow-md">
                <Zap size={14} className="fill-black" />
              </div>
              <div>
                <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider">
                  오늘 당장 실천할 1가지 Key 액션
                </span>
                <p className="text-xs sm:text-sm font-bold text-amber-100 leading-snug mt-0.5">
                  {digest.microAction}
                </p>
              </div>
            </div>

            {/* Mind Keywords */}
            <div className="flex flex-wrap items-center gap-1.5 px-1 pt-1">
              {digest.mindKeywords.map((kw) => (
                <span
                  key={kw}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-cyan-300/90 font-medium"
                >
                  {kw}
                </span>
              ))}
            </div>
          </motion.div>
        ) : null}
      </div>

      {/* Footer Actions */}
      {hasConversation && digest && (
        <div className="z-10 flex items-center justify-between pt-2 border-t border-white/10 gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-200 transition-colors"
          >
            {isCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span>{isCopied ? '복사됨' : '요약 복사'}</span>
          </button>

          <button
            type="button"
            onClick={handleContinueWithLucy}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 text-black font-black text-xs shadow-lg shadow-cyan-500/30 transition-all active:scale-95 cursor-pointer"
          >
            <span>루시와 실천 대화하기</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
