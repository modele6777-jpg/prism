import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Zap, RotateCcw, Copy, Check, ArrowRight } from 'lucide-react';
import { calculateQuantumDecision, type QuantumDecisionResult } from '@/lib/orbRituals';
import { triggerHaptic } from '@/lib/omniWarp/omniWarpHaptics';
import { sacredAudio } from '@/lib/omniWarp/sacredAudio';

interface QuantumDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToLucy?: (contextPrompt: string) => void;
}

export function QuantumDecisionModal({
  isOpen,
  onClose,
  onNavigateToLucy,
}: QuantumDecisionModalProps) {
  const [query, setQuery] = useState('');
  const [isCharging, setIsCharging] = useState(false);
  const [chargeProgress, setChargeProgress] = useState(0);
  const [result, setResult] = useState<QuantumDecisionResult | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const chargeTimerRef = useRef<number | null>(null);
  const chargeStartRef = useRef<number>(0);

  // 충전 인터랙션 시작 (Touch Down / Mouse Down)
  const handleStartCharge = () => {
    if (result) return;
    setIsCharging(true);
    setChargeProgress(0);
    chargeStartRef.current = Date.now();
    triggerHaptic('whitehole');
    sacredAudio.playSingingBowl(528);

    const updateInterval = 25; // 25ms
    const totalDuration = 1600; // 1.6초 충전

    chargeTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - chargeStartRef.current;
      const progress = Math.min(100, (elapsed / totalDuration) * 100);
      setChargeProgress(progress);

      // 중간 햅틱 진동
      if (Math.floor(progress) % 25 === 0) {
        triggerHaptic('whitehole');
      }

      if (progress >= 100) {
        if (chargeTimerRef.current) clearInterval(chargeTimerRef.current);
        chargeTimerRef.current = null;
        triggerHaptic('bigbang');
        sacredAudio.playSingingBowl(741);
        setIsCharging(false);
        const decision = calculateQuantumDecision(query);
        setResult(decision);
      }
    }, updateInterval);
  };

  // 충전 중 손을 뗐을 때 (충전 취소)
  const handleCancelCharge = () => {
    if (result) return;
    if (chargeProgress < 100) {
      if (chargeTimerRef.current) clearInterval(chargeTimerRef.current);
      chargeTimerRef.current = null;
      setIsCharging(false);
      setChargeProgress(0);
    }
  };

  const handleReset = () => {
    setResult(null);
    setChargeProgress(0);
    setIsCharging(false);
    triggerHaptic('whitehole');
  };

  const handleCopy = () => {
    if (!result) return;
    const text = `[양자 결단 신탁: ${result.title}]\n질문: ${query || '마음속의 양자 고민'}\n에너지 공명: ${result.energyScore}%\n직관 신탁: ${result.oracleMessage}\n실천 지침: ${result.cosmicGuidance}`;
    navigator.clipboard.writeText(text).catch(() => {});
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  useEffect(() => {
    return () => {
      if (chargeTimerRef.current) clearInterval(chargeTimerRef.current);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-black border border-cyan-500/30 p-5 sm:p-6 shadow-2xl relative overflow-hidden flex flex-col gap-4 text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <Zap size={16} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                양자 결단 오라클
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 font-semibold">
                  Quantum Yes/No
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">망설임과 기로를 3초 만에 꿰뚫는 단호한 직관 결단</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Query Input */}
        {!result && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-cyan-300/80 font-medium">
              마음속 결단하고 싶은 고민 (비워두고 마음으로만 생각해도 됩니다)
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="예: 지금 이 제안을 수락해야 할까? / 이직할까?"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm outline-none focus:border-cyan-400/60 transition-colors"
            />
          </div>
        )}

        {/* Center Interactive Orb or Result */}
        <div className="py-4 flex flex-col items-center justify-center min-h-[260px]">
          {!result ? (
            <div className="flex flex-col items-center gap-4">
              {/* Chargeable Touch Orb */}
              <div
                onMouseDown={handleStartCharge}
                onMouseUp={handleCancelCharge}
                onTouchStart={handleStartCharge}
                onTouchEnd={handleCancelCharge}
                className="relative w-40 h-40 rounded-full flex items-center justify-center cursor-pointer select-none touch-none active:scale-95 transition-transform"
                style={{
                  background: isCharging
                    ? `radial-gradient(circle at 35% 30%, rgba(56,189,248,0.5) 0%, rgba(168,85,247,0.3) 50%, rgba(0,0,0,0.95) 100%)`
                    : `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.25) 0%, rgba(56,189,248,0.1) 45%, rgba(0,0,0,0.9) 100%)`,
                  boxShadow: isCharging
                    ? `0 0 50px rgba(56,189,248,0.6), inset 0 0 30px rgba(56,189,248,0.8)`
                    : `0 0 30px rgba(56,189,248,0.2), inset 0 0 20px rgba(255,255,255,0.2)`,
                }}
              >
                {/* SVG Progress Ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                  <circle
                    cx="80"
                    cy="80"
                    r="74"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="4"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="74"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="5"
                    strokeDasharray={465}
                    strokeDashoffset={465 - (465 * chargeProgress) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-75"
                  />
                </svg>

                <div className="flex flex-col items-center justify-center text-center p-3 z-10 pointer-events-none">
                  <Zap size={24} className={`text-cyan-300 mb-1 ${isCharging ? 'animate-bounce' : 'animate-pulse'}`} />
                  <span className="text-xs font-bold text-white tracking-tight">
                    {isCharging ? `${Math.round(chargeProgress)}% 충전 중` : '오브를 꾹 누르세요'}
                  </span>
                  <span className="text-[10px] text-cyan-200/70">
                    {isCharging ? '결단 에너지가 모이는 중...' : '터치 유지하여 결단'}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 text-center max-w-xs leading-relaxed">
                마음속 고민을 응시한 채 구체를 1.5초간 꾹 누르면<br />
                우주의 양자 확률이 붕괴하며 하나의 명확한 결단이 떠오릅니다.
              </p>
            </div>
          ) : (
            /* Result Card */
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full flex flex-col items-center text-center gap-3.5"
            >
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black shadow-2xl border"
                style={{
                  background: `radial-gradient(circle at 35% 30%, ${result.color}33 0%, rgba(0,0,0,0.95) 80%)`,
                  borderColor: result.color,
                  boxShadow: `0 0 35px ${result.glow}`,
                }}
              >
                <span>{result.symbol}</span>
              </div>

              <div>
                <h4 className="text-xl font-black tracking-tight" style={{ color: result.color }}>
                  {result.title}
                </h4>
                <p className="text-xs text-slate-300 mt-1 max-w-sm">{result.subtitle}</p>
                <div className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-[10px] text-slate-300">
                  <span>에너지 공명도</span>
                  <span className="font-bold text-cyan-300">{result.energyScore}%</span>
                </div>
              </div>

              {/* Message Box */}
              <div className="w-full p-3.5 rounded-2xl bg-white/5 border border-white/10 text-left flex flex-col gap-2">
                <div>
                  <span className="text-[10px] font-bold text-cyan-400">오브의 직관 신탁</span>
                  <p className="text-xs sm:text-sm text-slate-100 font-medium leading-relaxed mt-0.5">
                    "{result.oracleMessage}"
                  </p>
                </div>
                <div className="pt-2 border-t border-white/5">
                  <span className="text-[10px] font-bold text-amber-300">실천 지침</span>
                  <p className="text-xs text-slate-300 leading-relaxed mt-0.5">
                    {result.cosmicGuidance}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
          {result ? (
            <>
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-200 transition-colors"
              >
                <RotateCcw size={13} />
                <span>다시 묻기</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-200 transition-colors"
                >
                  {isCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>{isCopied ? '복사됨' : '복사'}</span>
                </button>

                {onNavigateToLucy && (
                  <button
                    onClick={() => {
                      const prompt = `[오브 양자 결단 연계 상담]\n질문: "${query || '양자택일 고민'}"\n결단: "${result.title}"\n신탁: "${result.oracleMessage}"\n이 결단에 맞춰 앞으로 어떤 구체적 실행 전략을 세우는 것이 좋을까요?`;
                      onNavigateToLucy(prompt);
                      onClose();
                    }}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 text-black font-bold text-xs shadow-md transition-all active:scale-95"
                  >
                    <span>루시와 심층 상담</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="w-full text-center text-[10px] text-slate-500">
              오브의 중심을 꾹 누르고 있으면 결단이 완성됩니다
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
