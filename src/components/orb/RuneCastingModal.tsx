import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, RotateCcw, Copy, Check, ArrowRight, Compass } from 'lucide-react';
import { castRunes, type ElderRune } from '@/lib/orbRituals';
import { triggerHaptic } from '@/lib/omniWarp/omniWarpHaptics';
import { sacredAudio } from '@/lib/omniWarp/sacredAudio';

interface RuneCastingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToLucy?: (contextPrompt: string) => void;
}

export function RuneCastingModal({
  isOpen,
  onClose,
  onNavigateToLucy,
}: RuneCastingModalProps) {
  const [castCount, setCastCount] = useState<1 | 3>(1);
  const [isCasting, setIsCasting] = useState(false);
  const [castResults, setCastResults] = useState<ElderRune[] | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleCast = (count?: 1 | 3) => {
    const targetCount = count || castCount;
    setIsCasting(true);
    triggerHaptic('whitehole');
    sacredAudio.playSingingBowl(639);

    setTimeout(() => {
      triggerHaptic('bigbang');
      sacredAudio.playSingingBowl(528);
      const runes = castRunes(targetCount);
      setCastResults(runes);
      setIsCasting(false);
    }, 1200);
  };

  const handleReset = () => {
    setCastResults(null);
    triggerHaptic('whitehole');
  };

  const handleCopy = () => {
    if (!castResults || castResults.length === 0) return;
    const text = castResults
      .map(
        (r, idx) =>
          `[룬 ${castResults.length > 1 ? (idx === 0 ? '과거/원인' : idx === 1 ? '현재/상황' : '미래/조언') : '단일 신탁'}: ${r.symbol} ${r.name}(${r.koreanName})]\n의미: ${r.meaning}\n신탁: "${r.oracleMessage}"`
      )
      .join('\n\n');

    navigator.clipboard.writeText(text).catch(() => {});
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-black border border-purple-500/30 p-5 sm:p-6 shadow-2xl relative overflow-hidden flex flex-col gap-4 text-white max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 font-serif font-black text-lg">
              ᛟ
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                고대 룬 에테르 캐스팅
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-400/20 text-purple-300 border border-purple-400/30 font-semibold">
                  Elder Futhark
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">오브 내부의 24개 고대 북유럽 상징이 빚어내는 신탁</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Count Toggle */}
        {!castResults && (
          <div className="flex items-center justify-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
            <button
              onClick={() => setCastCount(1)}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                castCount === 1 ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              단일 룬 (직관의 열쇠 1개)
            </button>
            <button
              onClick={() => setCastCount(3)}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                castCount === 3 ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              삼위일체 룬 (원인 · 상황 · 해답 3개)
            </button>
          </div>
        )}

        {/* Main Casting View */}
        <div className="py-2 flex flex-col items-center justify-center min-h-[260px]">
          {!castResults ? (
            <div className="flex flex-col items-center gap-4 text-center">
              {/* Spinning Rune Orb */}
              <div
                onClick={() => handleCast()}
                className={`relative w-40 h-40 rounded-full flex items-center justify-center cursor-pointer select-none active:scale-95 transition-transform ${
                  isCasting ? 'animate-spin' : ''
                }`}
                style={{
                  background: `radial-gradient(circle at 35% 30%, rgba(168,85,247,0.3) 0%, rgba(20,20,35,0.95) 80%)`,
                  boxShadow: `0 0 40px rgba(168,85,247,0.3), inset 0 0 25px rgba(168,85,247,0.5)`,
                }}
              >
                <div className="flex flex-col items-center justify-center pointer-events-none">
                  <span className="font-serif font-black text-4xl text-purple-200 drop-shadow-[0_0_10px_rgba(168,85,247,0.9)] mb-1">
                    ᚦ
                  </span>
                  <span className="text-xs font-bold text-white tracking-wide">
                    {isCasting ? '룬 소용돌이 중...' : '터치하여 캐스팅'}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                오브를 탭하면 고대 신탁의 룬 스톤들이 은하수처럼 회전하며<br />
                당신의 현재 운명을 비추는 상징 문양이 수면 위로 떠오릅니다.
              </p>

              <button
                type="button"
                onClick={() => handleCast()}
                disabled={isCasting}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <Sparkles size={14} />
                <span>룬 캐스팅 시작</span>
              </button>
            </div>
          ) : (
            /* Results Presentation */
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full flex flex-col gap-3"
            >
              <div className={`grid gap-2.5 ${castResults.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1'}`}>
                {castResults.map((rune, idx) => {
                  const roleLabel =
                    castResults.length === 3
                      ? idx === 0
                        ? '1. 원인과 배경'
                        : idx === 1
                        ? '2. 현재의 흐름'
                        : '3. 미래와 해답'
                      : '단일 상징 직관 신탁';

                  return (
                    <div
                      key={`rune-card-${rune.name}-${idx}`}
                      className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center text-center gap-2 relative overflow-hidden"
                    >
                      <div className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {roleLabel}
                      </div>

                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center font-serif font-black text-2xl text-white shadow-lg border my-1"
                        style={{
                          background: `radial-gradient(circle at 35% 30%, ${rune.color}44 0%, rgba(10,10,25,0.95) 80%)`,
                          borderColor: rune.color,
                          boxShadow: `0 0 20px ${rune.color}66`,
                        }}
                      >
                        {rune.symbol}
                      </div>

                      <div>
                        <h4 className="text-sm font-black text-white">
                          {rune.name} <span className="text-xs text-purple-300">({rune.koreanName})</span>
                        </h4>
                        <p className="text-[11px] text-amber-300/90 font-medium mt-0.5">{rune.meaning}</p>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-1 mt-0.5">
                        {rune.keywords.map((kw) => (
                          <span
                            key={kw}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-300 border border-white/5"
                          >
                            #{kw}
                          </span>
                        ))}
                      </div>

                      <p className="text-xs text-slate-200 leading-relaxed text-left pt-2 border-t border-white/5 w-full">
                        "{rune.oracleMessage}"
                      </p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
          {castResults ? (
            <>
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-200 transition-colors"
              >
                <RotateCcw size={13} />
                <span>다시 뽑기</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-200 transition-colors"
                >
                  {isCopied ? <Check size={13} className="text-purple-400" /> : <Copy size={13} />}
                  <span>{isCopied ? '복사됨' : '복사'}</span>
                </button>

                {onNavigateToLucy && (
                  <button
                    onClick={() => {
                      const summary = castResults
                        .map((r) => `${r.name}(${r.koreanName}: ${r.meaning})`)
                        .join(', ');
                      const prompt = `[고대 룬 에테르 심층 상담]\n방금 오브에서 캐스팅된 룬은 [${summary}] 입니다. 이 룬 상징들이 현재 내 삶과 고민에 시사하는 심층적인 운명의 방향성과 루시의 조언을 듣고 싶어.`;
                      onNavigateToLucy(prompt);
                      onClose();
                    }}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                  >
                    <span>루시와 룬 심층 해석</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="w-full text-center text-[10px] text-slate-500">
              구체를 터치하여 룬의 신탁을 받으세요
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
