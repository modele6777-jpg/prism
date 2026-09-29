import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Tag,
  Compass,
} from 'lucide-react';
import { type TarotCard, getTarotCardImageUrl } from '@/data/tarotData';

export interface TarotCardZoomData {
  id?: string;
  name?: string;
  nameKo: string;
  type?: string;
  keywords?: string[];
  reversed?: boolean;
  imageUrl?: string;
  slotName?: string;
}

export interface TarotCardZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: TarotCard | TarotCardZoomData | null;
  slotName?: string;
}

export function TarotCardZoomModal({
  isOpen,
  onClose,
  card,
  slotName,
}: TarotCardZoomModalProps) {
  const [isEnlarged, setIsEnlarged] = useState(false);

  // Reset zoom state whenever modal opens or card changes
  useEffect(() => {
    if (isOpen) {
      setIsEnlarged(false);
    }
  }, [isOpen, card]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const toggleZoom = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEnlarged((prev) => !prev);
  }, []);

  const cardImageUrl = card
    ? ('imageUrl' in card && card.imageUrl
        ? card.imageUrl
        : card.id
        ? getTarotCardImageUrl(card as TarotCard)
        : '')
    : '';

  const initialReversed = !!card?.reversed;

  const effectiveSlotName = slotName || (card as TarotCardZoomData | null)?.slotName;
  const nameKo = card?.nameKo || '타로 카드';
  const nameEn = card?.name || '';
  const keywords = card?.keywords && card.keywords.length > 0 ? card.keywords : [];
  const cardType = card ? ((card as any).type as string | undefined) : undefined;

  let typeBadgeLabel = 'TAROT CARD';
  if (cardType === 'major') typeBadgeLabel = 'MAJOR ARCANA (메이저)';
  else if (cardType === 'wands') typeBadgeLabel = 'SUIT OF WANDS (완드)';
  else if (cardType === 'cups') typeBadgeLabel = 'SUIT OF CUPS (컵)';
  else if (cardType === 'swords') typeBadgeLabel = 'SUIT OF SWORDS (소드)';
  else if (cardType === 'pentacles') typeBadgeLabel = 'SUIT OF PENTACLES (펜타클)';

  return (
    <AnimatePresence>
      {isOpen && card && (
        <motion.div
          key="tarot-zoom-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[80] flex items-center justify-center p-2.5 sm:p-6 bg-black/85 backdrop-blur-xl"
          onClick={onClose}
        >
          <motion.div
            key="tarot-zoom-dialog"
            initial={{ opacity: 0, scale: 0.75, y: 25 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.78, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full ${
              isEnlarged ? 'max-w-2xl' : 'max-w-md'
            } max-w-[94vw] bg-[#0e0c18] border border-yellow-500/40 p-3.5 sm:p-6 rounded-[28px] sm:rounded-[32px] shadow-[0_25px_80px_rgba(0,0,0,0.9)] text-white max-h-[92vh] sm:max-h-[94vh] overflow-y-auto custom-scrollbar flex flex-col space-y-3 sm:space-y-4 transition-all duration-300`}
          >
            {/* Subtle Ambient Cosmic Aura */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.28 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="absolute -top-20 -right-20 w-72 h-72 rounded-full blur-[100px] pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle, #eab308 0%, #a855f7 50%, transparent 80%)',
              }}
            />
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.22 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.08 }}
              className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full blur-[100px] pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle, #6366f1 0%, #ec4899 50%, transparent 80%)',
              }}
            />

            {/* Modal Header */}
            <div className="flex items-center justify-between gap-2.5 border-b border-white/10 pb-2.5 sm:pb-3 relative z-10">
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.25em] text-yellow-400 font-mono">
                  <Sparkles size={12} className="text-yellow-400 animate-pulse shrink-0" />
                  <span className="truncate">TAROT DETAIL INSPECTION</span>
                </div>
                <h2 className="text-sm sm:text-lg font-bold text-white tracking-tight flex items-center gap-1.5 truncate">
                  <span>{nameKo}</span>
                  {nameEn && (
                    <span className="text-[11px] sm:text-sm font-normal text-white/50 font-serif italic truncate">
                      ({nameEn})
                    </span>
                  )}
                </h2>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Zoom Scale Toggle Button */}
                <button
                  type="button"
                  onClick={toggleZoom}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white/80 hover:text-white transition-all cursor-pointer hover:scale-105 active:scale-95"
                  title={isEnlarged ? '표준 크기로 축소' : '화면 가득 확대 보기'}
                >
                  {isEnlarged ? <ZoomOut size={15} /> : <ZoomIn size={15} />}
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="닫기"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Badges Bar: Slot Position + Upright/Reversed + Arcana Type */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 relative z-10">
              {effectiveSlotName && (
                <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/35 flex items-center gap-1 shadow-sm">
                  <Compass size={10} />
                  <span>{effectiveSlotName}</span>
                </span>
              )}

              <span
                className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold border flex items-center gap-1 ${
                  initialReversed
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.25)]'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.25)]'
                }`}
              >
                <span>
                  {initialReversed ? '역방향 (Reversed)' : '정방향 (Upright)'}
                </span>
              </span>

              {cardType && (
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-white/60 border border-white/10">
                  {typeBadgeLabel}
                </span>
              )}
            </div>

            {/* Main Card Viewport - Fixed orientation (no rotation allowed) */}
            <div className="relative w-full flex flex-col items-center justify-center py-1.5 sm:py-3 select-none">
              <motion.div
                initial={{ scale: 0.65, opacity: 0, y: 20 }}
                animate={{
                  scale: isEnlarged ? 1.03 : 1,
                  opacity: 1,
                  y: 0,
                }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{
                  type: 'spring',
                  damping: 22,
                  stiffness: 280,
                  delay: 0.05,
                }}
                className={`relative rounded-2xl sm:rounded-3xl p-1.5 bg-gradient-to-b from-yellow-400/60 via-amber-600/35 to-purple-600/45 shadow-[0_10px_50px_rgba(234,179,8,0.35)] transition-all duration-300 ${
                  isEnlarged ? 'w-56 sm:w-72 md:w-80' : 'w-44 sm:w-56'
                }`}
              >
                {/* Glowing halo behind card */}
                <div className="absolute -inset-1 rounded-2xl sm:rounded-3xl bg-yellow-400/20 blur-md pointer-events-none" />

                <div className="relative aspect-[9/15] max-h-[52vh] rounded-xl sm:rounded-2xl overflow-hidden bg-zinc-950 border border-yellow-400/40 flex items-center justify-center shadow-inner group">
                  {cardImageUrl ? (
                    <img
                      src={cardImageUrl}
                      alt={nameKo}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4 text-center text-yellow-400/60 gap-1.5">
                      <Sparkles size={28} />
                      <span className="font-bold text-base text-white">{nameKo}</span>
                      <span className="text-[11px] text-white/40">{nameEn}</span>
                    </div>
                  )}

                  {/* Subtle Inner Glass Vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

                  {/* Orientation Ribbon Over Card */}
                  {initialReversed && (
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-rose-950/85 border border-rose-500/50 text-rose-200 text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm pointer-events-none shadow-md">
                      REVERSED
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Keywords & Symbolic Meaning */}
            {keywords.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.12 }}
                className="p-3 sm:p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1.5 sm:space-y-2"
              >
                <div className="flex items-center gap-1.5 text-yellow-300 font-bold text-xs">
                  <Tag size={12} className="text-yellow-400" />
                  <span>카드의 핵심 상징 키워드</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-lg sm:rounded-xl bg-yellow-500/10 border border-yellow-500/25 text-yellow-200 font-medium text-[11px] sm:text-xs shadow-sm"
                    >
                      #{kw}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Modal Bottom CTA */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                닫기
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
