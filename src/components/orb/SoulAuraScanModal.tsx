import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Sparkles, Volume2, VolumeX, RotateCcw, Copy, Check, ArrowRight, Heart } from 'lucide-react';
import { scanSoulAura, type SoulAuraProfile } from '@/lib/orbRituals';
import { triggerHaptic } from '@/lib/omniWarp/omniWarpHaptics';
import { sacredAudio } from '@/lib/omniWarp/sacredAudio';

interface SoulAuraScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToLucy?: (contextPrompt: string) => void;
}

export function SoulAuraScanModal({
  isOpen,
  onClose,
  onNavigateToLucy,
}: SoulAuraScanModalProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [aura, setAura] = useState<SoulAuraProfile | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const scanTimerRef = useRef<number | null>(null);
  const scanStartRef = useRef<number>(0);

  const handleStartScan = () => {
    if (aura) return;
    setIsScanning(true);
    setScanProgress(0);
    scanStartRef.current = Date.now();
    triggerHaptic('whitehole');
    sacredAudio.playSingingBowl(528);

    const totalDuration = 2200; // 2.2초 스캔
    const updateInterval = 25;

    scanTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - scanStartRef.current;
      const progress = Math.min(100, (elapsed / totalDuration) * 100);
      setScanProgress(progress);

      if (Math.floor(progress) % 20 === 0) {
        triggerHaptic('whitehole');
      }

      if (progress >= 100) {
        if (scanTimerRef.current) clearInterval(scanTimerRef.current);
        scanTimerRef.current = null;
        triggerHaptic('bigbang');
        setIsScanning(false);

        const scannedAura = scanSoulAura();
        setAura(scannedAura);

        // 솔페지오 주파수 사운드 연주
        sacredAudio.playSingingBowl(scannedAura.solfeggioHz);
        sacredAudio.toggleDrone(true);
        setIsAudioPlaying(true);
      }
    }, updateInterval);
  };

  const handleCancelScan = () => {
    if (aura) return;
    if (scanProgress < 100) {
      if (scanTimerRef.current) clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
      setIsScanning(false);
      setScanProgress(0);
    }
  };

  const toggleSound = () => {
    if (isAudioPlaying) {
      sacredAudio.toggleDrone(false);
      setIsAudioPlaying(false);
    } else if (aura) {
      sacredAudio.playSingingBowl(aura.solfeggioHz);
      sacredAudio.toggleDrone(true);
      setIsAudioPlaying(true);
    }
  };

  const handleReset = () => {
    sacredAudio.toggleDrone(false);
    setIsAudioPlaying(false);
    setAura(null);
    setScanProgress(0);
    setIsScanning(false);
    triggerHaptic('whitehole');
  };

  const handleCopy = () => {
    if (!aura) return;
    const text = `[오늘의 소울 오라 스캔]\n오라 명칭: ${aura.name} (${aura.tagline})\n오행/차크라: ${aura.element} / ${aura.chakra}\n치유 주파수: ${aura.solfeggioName}\n에너지 지수: ${aura.energyLevel}%\n치유 확언: "${aura.healingAffirmation}"\n행운 가이드: ${aura.luckyGuide}`;
    navigator.clipboard.writeText(text).catch(() => {});
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  useEffect(() => {
    return () => {
      if (scanTimerRef.current) clearInterval(scanTimerRef.current);
      sacredAudio.toggleDrone(false);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-black border border-emerald-500/30 p-5 sm:p-6 shadow-2xl relative overflow-hidden flex flex-col gap-4 text-white max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                소울 오라 & 주파수 스캔
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 font-semibold">
                  Aura Resonance
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">오브와 손가락 접촉으로 측정하는 내면의 빛과 주파수</p>
            </div>
          </div>
          <button
            onClick={() => {
              sacredAudio.toggleDrone(false);
              onClose();
            }}
            className="p-1.5 rounded-full text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Center Scanner or Result */}
        <div className="py-2 flex flex-col items-center justify-center min-h-[250px]">
          {!aura ? (
            <div className="flex flex-col items-center gap-4">
              {/* Touch & Hold Aura Orb */}
              <div
                onMouseDown={handleStartScan}
                onMouseUp={handleCancelScan}
                onTouchStart={handleStartScan}
                onTouchEnd={handleCancelScan}
                className="relative w-44 h-44 rounded-full flex items-center justify-center cursor-pointer select-none touch-none active:scale-95 transition-transform"
                style={{
                  background: isScanning
                    ? `radial-gradient(circle at 35% 30%, rgba(16,185,129,0.5) 0%, rgba(56,189,248,0.3) 50%, rgba(0,0,0,0.95) 100%)`
                    : `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.2) 0%, rgba(16,185,129,0.1) 45%, rgba(0,0,0,0.9) 100%)`,
                  boxShadow: isScanning
                    ? `0 0 60px rgba(16,185,129,0.6), inset 0 0 30px rgba(16,185,129,0.8)`
                    : `0 0 35px rgba(16,185,129,0.25), inset 0 0 20px rgba(255,255,255,0.15)`,
                }}
              >
                {/* SVG Progress Ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                  <circle
                    cx="88"
                    cy="88"
                    r="80"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="4"
                  />
                  <circle
                    cx="88"
                    cy="88"
                    r="80"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="5"
                    strokeDasharray={502}
                    strokeDashoffset={502 - (502 * scanProgress) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-75"
                  />
                </svg>

                <div className="flex flex-col items-center justify-center text-center p-3 z-10 pointer-events-none">
                  <Heart size={26} className={`text-emerald-300 mb-1 ${isScanning ? 'animate-ping' : 'animate-pulse'}`} />
                  <span className="text-xs font-bold text-white tracking-tight">
                    {isScanning ? `${Math.round(scanProgress)}% 오라 공명 중` : '오브에 손을 얹으세요'}
                  </span>
                  <span className="text-[10px] text-emerald-200/70">
                    {isScanning ? '생체 파동 측정 중...' : '3초간 터치 유지'}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 text-center max-w-xs leading-relaxed">
                숨을 깊이 들이쉬고 내쉬며 구체 위에 손가락을 얹어보세요.<br />
                당신의 생체 리듬과 사주 오행이 실시간 주파수로 변환됩니다.
              </p>
            </div>
          ) : (
            /* Scanned Aura Result Card */
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full flex flex-col items-center text-center gap-3"
            >
              {/* Resonating Aura Orb Display */}
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-black shadow-2xl border relative animate-pulse"
                style={{
                  background: `radial-gradient(circle at 35% 30%, ${aura.primaryColor}88 0%, ${aura.secondaryColor}44 50%, rgba(0,0,0,0.95) 90%)`,
                  borderColor: aura.primaryColor,
                  boxShadow: `0 0 45px ${aura.glowColor}`,
                }}
              >
                <Sparkles size={28} className="text-white" />
              </div>

              <div>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-emerald-300 border border-emerald-400/30 font-bold">
                    {aura.element} 오행
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-cyan-300 border border-cyan-400/30 font-bold">
                    {aura.chakra}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-amber-300 border border-amber-400/30 font-bold">
                    에너지 {aura.energyLevel}%
                  </span>
                </div>
                <h4 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  {aura.name}
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">{aura.tagline}</p>
              </div>

              {/* Solfeggio Hz Player Bar */}
              <div className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-semibold text-emerald-300">{aura.solfeggioName}</span>
                </div>
                <button
                  type="button"
                  onClick={toggleSound}
                  className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                >
                  {isAudioPlaying ? <Volume2 size={13} className="text-emerald-300 animate-pulse" /> : <VolumeX size={13} />}
                  <span>{isAudioPlaying ? '주파수 재생 중' : '소리 켜기'}</span>
                </button>
              </div>

              {/* Detailed Reading */}
              <div className="w-full p-3.5 rounded-2xl bg-white/5 border border-white/10 text-left flex flex-col gap-2.5">
                <p className="text-xs text-slate-200 leading-relaxed">
                  {aura.description}
                </p>

                <div className="pt-2 border-t border-white/5">
                  <span className="text-[10px] font-bold text-emerald-400">오늘의 치유 확언</span>
                  <p className="text-xs text-emerald-100 font-medium leading-relaxed mt-0.5">
                    "{aura.healingAffirmation}"
                  </p>
                </div>

                <div className="pt-1 text-[11px] text-slate-400 flex items-center gap-1.5">
                  <span className="text-amber-300/90 font-semibold shrink-0">행운 가이드:</span>
                  <span>{aura.luckyGuide}</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
          {aura ? (
            <>
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-200 transition-colors"
              >
                <RotateCcw size={13} />
                <span>재측정</span>
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
                      const prompt = `[소울 오라 심층 조율 요청]\n오늘 나의 오라는 "${aura.name}"이며, 주파수는 "${aura.solfeggioName}"로 측정되었습니다. 이 오라 에너지의 잠재력을 극대화하고 멘탈을 조율할 수 있는 루시의 맞춤 처방을 부탁해.`;
                      sacredAudio.toggleDrone(false);
                      onNavigateToLucy(prompt);
                      onClose();
                    }}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 text-black font-bold text-xs shadow-md transition-all active:scale-95"
                  >
                    <span>루시와 에너지 조율</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="w-full text-center text-[10px] text-slate-500">
              구체 표면에 손가락을 얹고 있으면 오라 측정이 완료됩니다
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
