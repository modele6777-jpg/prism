import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Flame, Send, ArrowRight, Check, History, CircleDot, Sun, Disc } from 'lucide-react';
import { saveCosmicRecord, getCosmicRecords, type CosmicWishRecord } from '@/lib/orbRituals';
import { triggerHaptic } from '@/lib/omniWarp/omniWarpHaptics';
import { sacredAudio } from '@/lib/omniWarp/sacredAudio';

interface VoidNebulaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToLucy?: (contextPrompt: string) => void;
}

export function VoidNebulaModal({
  isOpen,
  onClose,
  onNavigateToLucy,
}: VoidNebulaModalProps) {
  const [activeTab, setActiveTab] = useState<'void' | 'nebula'>('void');
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedType, setCompletedType] = useState<'void' | 'nebula' | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState<CosmicWishRecord[]>([]);

  const handlePurgeVoid = () => {
    if (!inputText.trim() || isProcessing) return;
    setIsProcessing(true);
    triggerHaptic('blackhole');
    sacredAudio.playSingingBowl(396);

    setTimeout(() => {
      triggerHaptic('bigbang');
      saveCosmicRecord('void_purge', inputText.trim());
      setIsProcessing(false);
      setCompletedType('void');
      setInputText('');
    }, 2000);
  };

  const handleLaunchNebula = () => {
    if (!inputText.trim() || isProcessing) return;
    setIsProcessing(true);
    triggerHaptic('whitehole');
    sacredAudio.playSingingBowl(528);

    setTimeout(() => {
      triggerHaptic('bigbang');
      sacredAudio.playSingingBowl(741);
      saveCosmicRecord('nebula_wish', inputText.trim());
      setIsProcessing(false);
      setCompletedType('nebula');
      setInputText('');
    }, 2000);
  };

  const openHistory = () => {
    setHistoryList(getCosmicRecords());
    setShowHistory(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-black border border-indigo-500/30 p-5 sm:p-6 shadow-2xl relative overflow-hidden flex flex-col gap-4 text-white max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                activeTab === 'void'
                  ? 'bg-rose-500/20 border-rose-400/40 text-rose-300'
                  : 'bg-amber-500/20 border-amber-400/40 text-amber-300'
              }`}
            >
              {activeTab === 'void' ? <Flame size={16} /> : <Sparkles size={16} />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                {activeTab === 'void' ? '고민 삼키기 (Void)' : '소원 방출 (Nebula)'}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-semibold border border-white/10">
                  Cosmic Purge & Wish
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {activeTab === 'void'
                  ? '마음의 어둠을 블랙홀로 빨아들여 완전 소멸'
                  : '간절한 소망을 초신성 파티클로 우주에 쏘아 올림'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={openHistory}
              className="p-1.5 rounded-full text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
              title="우주 기록소 열람"
            >
              <History size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center p-1 bg-white/5 rounded-2xl border border-white/10">
          <button
            onClick={() => {
              setActiveTab('void');
              setCompletedType(null);
            }}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'void'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame size={13} />
            <span>고민 소멸 (Black Hole)</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('nebula');
              setCompletedType(null);
            }}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'nebula'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-lg shadow-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles size={13} />
            <span>소원 방출 (Nebula)</span>
          </button>
        </div>

        {/* History Modal Overlay */}
        {showHistory ? (
          <div className="flex flex-col gap-3 py-2 min-h-[260px]">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1">
                <History size={14} className="text-cyan-300" />
                우주 기억소 (최근 기록)
              </span>
              <button
                onClick={() => setShowHistory(false)}
                className="text-[11px] text-cyan-300 hover:underline"
              >
                닫기
              </button>
            </div>
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
              {historyList.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">아직 기록된 의식이 없습니다.</p>
              ) : (
                historyList.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2"
                  >
                    <span className="shrink-0 mt-0.5 text-slate-300">
                      {item.type === 'void_purge' ? <CircleDot size={14} className="text-rose-400" /> : <Sparkles size={14} className="text-amber-300" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-200 break-words">{item.text}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {item.type === 'void_purge' ? '소멸 완료' : '방출 완료'} ·{' '}
                        {new Date(item.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* Main Interactive Form */
          <div className="py-2 flex flex-col items-center justify-center min-h-[260px]">
            {completedType ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center gap-3 py-4"
              >
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-2xl border ${
                    completedType === 'void'
                      ? 'bg-black border-rose-500/50 shadow-[0_0_35px_rgba(244,63,94,0.6)] text-rose-400'
                      : 'bg-amber-400/20 border-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.6)] text-amber-300'
                  }`}
                >
                  {completedType === 'void' ? <CircleDot size={36} /> : <Sparkles size={36} />}
                </div>

                <div>
                  <h4 className="text-lg font-black text-white">
                    {completedType === 'void' ? '근심의 완전 소멸' : '우주 성간 방출 완료'}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 max-w-xs leading-relaxed">
                    {completedType === 'void'
                      ? '당신의 모든 두려움과 불안이 우주의 블랙홀 속으로 빨려 들어가 무(無)로 정화되었습니다. 이제 가벼운 마음으로 나아가세요.'
                      : '당신의 순수한 소망이 초신성의 빛을 타고 온 우주에 가 닿았습니다. 우주의 섭리가 알맞은 결실을 맺어줄 것입니다.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => setCompletedType(null)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-200 font-bold transition-colors"
                  >
                    새로운 의식하기
                  </button>

                  {onNavigateToLucy && (
                    <button
                      onClick={() => {
                        const prompt =
                          completedType === 'void'
                            ? `[고민 소멸 후 멘탈 케어]\n방금 오브의 블랙홀에 무거운 고민을 던져 정화했어. 마음이 한결 가벼워졌는데, 이 맑아진 마음에 새로운 긍정 에너지를 채울 수 있도록 루시의 따뜻한 응원을 듣고 싶어.`
                            : `[소원 방출 후 응원 대화]\n방금 오브를 통해 소원을 우주에 쏘아 올렸어! 이 소망을 현실로 구체화하기 위해 내가 지금 취할 수 있는 작은 첫 걸음에 대해 루시와 이야기 나누고 싶어.`;
                        onNavigateToLucy(prompt);
                        onClose();
                      }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-black text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1"
                    >
                      <span>루시와 대화 나누기</span>
                      <ArrowRight size={13} />
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              /* Writing Form */
              <div className="w-full flex flex-col gap-3">
                <div className="flex flex-col items-center text-center gap-2 mb-1">
                  {/* Central Void / Nebula Orb Visualizer */}
                  <div
                    className={`relative w-28 h-28 rounded-full flex items-center justify-center transition-transform ${
                      isProcessing ? 'scale-110 animate-spin' : 'hover:scale-105'
                    }`}
                    style={{
                      background:
                        activeTab === 'void'
                          ? `radial-gradient(circle at 35% 30%, rgba(244,63,94,0.3) 0%, rgba(0,0,0,0.98) 70%)`
                          : `radial-gradient(circle at 35% 30%, rgba(251,191,36,0.4) 0%, rgba(168,85,247,0.3) 50%, rgba(0,0,0,0.95) 90%)`,
                      boxShadow:
                        activeTab === 'void'
                          ? `0 0 35px rgba(244,63,94,0.4), inset 0 0 25px rgba(0,0,0,0.9)`
                          : `0 0 35px rgba(251,191,36,0.4), inset 0 0 25px rgba(251,191,36,0.5)`,
                    }}
                  >
                    <span className="select-none pointer-events-none">
                      {isProcessing ? (
                        <Disc size={30} className={`animate-spin ${activeTab === 'void' ? 'text-rose-400' : 'text-amber-300'}`} />
                      ) : activeTab === 'void' ? (
                        <CircleDot size={28} className="text-rose-400" />
                      ) : (
                        <Sparkles size={28} className="text-amber-300" />
                      )}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    {activeTab === 'void'
                      ? '지우고 싶은 상처, 불안, 두려움을 솔직하게 적어주세요.'
                      : '우주에 전하고 싶은 간절한 소망을 한 문장으로 적어주세요.'}
                  </p>
                </div>

                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={isProcessing}
                  placeholder={
                    activeTab === 'void'
                      ? '예: 시험에 대한 극심한 불안감과 자책감을 완전히 비우고 싶습니다.'
                      : '예: 이번 가을에 준비 중인 프로젝트가 큰 사랑을 받게 해주세요.'
                  }
                  rows={3}
                  className="w-full p-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm outline-none focus:border-cyan-400/60 transition-colors resize-none"
                />

                <button
                  type="button"
                  onClick={activeTab === 'void' ? handlePurgeVoid : handleLaunchNebula}
                  disabled={!inputText.trim() || isProcessing}
                  className={`w-full py-3 rounded-2xl font-bold text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer ${
                    !inputText.trim() || isProcessing
                      ? 'opacity-50 cursor-not-allowed bg-white/10 text-slate-400'
                      : activeTab === 'void'
                      ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 text-white shadow-rose-600/30'
                      : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-black shadow-amber-500/30'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <Sparkles size={16} className="animate-spin" />
                      <span>{activeTab === 'void' ? '블랙홀로 삼키는 중...' : '우주 성간으로 방출 중...'}</span>
                    </>
                  ) : (
                    <>
                      {activeTab === 'void' ? <Flame size={16} /> : <Send size={16} />}
                      <span>{activeTab === 'void' ? '블랙홀로 완전 소멸하기' : '우주 성간으로 쏘아 올리기'}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
