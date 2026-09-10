import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, Eye, RefreshCw, Sun, Compass,
  Flame, Heart, Wind, Coins, ShieldCheck, BookOpen, Zap, Star, Moon,
  ChevronLeft, ChevronRight, Shuffle,
} from 'lucide-react';
import { TAROT_DECK, TarotCard, getTarotCardImageUrl, rollTarotReversed } from '../../data/tarotData';

export interface SelectedTarotCardEntry extends TarotCard {
  touchMetadata?: any | null;
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArr = [...array];
  // Multi-pass cryptographic Fisher-Yates shuffle
  for (let pass = 0; pass < 3; pass += 1) {
    for (let i = newArr.length - 1; i > 0; i -= 1) {
      let rand = Math.random();
      if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
        const buffer = new Uint32Array(1);
        window.crypto.getRandomValues(buffer);
        rand = buffer[0] / (0xffffffff + 1);
      }
      const j = Math.floor(rand * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
  }
  return newArr;
};

const getTarotCardVisual = (card: TarotCard | null | undefined) => {
  if (!card) return { icon: Sparkles, color: 'text-yellow-400' };

  if (card.id?.startsWith('trinity_')) {
    const map: Record<string, { icon: typeof Sparkles; color: string }> = {
      trinity_01_source: { icon: Eye, color: 'text-indigo-400' },
      trinity_02_geometry: { icon: RefreshCw, color: 'text-cyan-400' },
      trinity_03_ascension: { icon: Sparkles, color: 'text-yellow-400' },
      trinity_04_mirror: { icon: Activity, color: 'text-zinc-400' },
      trinity_05_logos: { icon: Sun, color: 'text-amber-400' },
      trinity_06_alignment: { icon: Compass, color: 'text-yellow-400' },
      trinity_07_eye: { icon: Eye, color: 'text-purple-400' },
      trinity_08_shaman: { icon: Sparkles, color: 'text-rose-400' },
      trinity_09_cube: { icon: ShieldCheck, color: 'text-blue-400' },
      trinity_10_trinity: { icon: Sparkles, color: 'text-yellow-500' },
    };
    return map[card.id] ?? { icon: Sparkles, color: 'text-yellow-400' };
  }

  if (card.id?.startsWith('wands_')) return { icon: Flame, color: 'text-amber-500' };
  if (card.id?.startsWith('cups_')) return { icon: Heart, color: 'text-blue-400' };
  if (card.id?.startsWith('swords_')) return { icon: Wind, color: 'text-purple-400' };
  if (card.id?.startsWith('pent_')) return { icon: Coins, color: 'text-yellow-400' };

  const majorMap: Record<string, { icon: typeof Sparkles; color: string }> = {
    major_0: { icon: Eye, color: 'text-zinc-400' },
    major_1: { icon: Sparkles, color: 'text-amber-400' },
    major_2: { icon: Eye, color: 'text-indigo-400' },
    major_3: { icon: Heart, color: 'text-rose-400' },
    major_4: { icon: ShieldCheck, color: 'text-yellow-500' },
    major_5: { icon: BookOpen, color: 'text-blue-400' },
    major_6: { icon: Heart, color: 'text-pink-400' },
    major_7: { icon: Zap, color: 'text-yellow-400' },
    major_8: { icon: ShieldCheck, color: 'text-amber-500' },
    major_9: { icon: Eye, color: 'text-amber-400' },
    major_10: { icon: RefreshCw, color: 'text-cyan-400' },
    major_11: { icon: Activity, color: 'text-yellow-400' },
    major_12: { icon: RefreshCw, color: 'text-violet-400' },
    major_13: { icon: Activity, color: 'text-purple-500' },
    major_14: { icon: Wind, color: 'text-cyan-300' },
    major_15: { icon: Zap, color: 'text-red-500' },
    major_16: { icon: Zap, color: 'text-orange-500' },
    major_17: { icon: Star, color: 'text-yellow-300' },
    major_18: { icon: Moon, color: 'text-blue-300' },
    major_19: { icon: Sun, color: 'text-orange-400' },
    major_20: { icon: Sparkles, color: 'text-purple-400' },
    major_21: { icon: Sparkles, color: 'text-indigo-500' },
  };
  return majorMap[card.id] ?? { icon: Sparkles, color: 'text-yellow-400' };
};

type DeckWheelCardProps = {
  card: TarotCard;
  originalIdx: number;
  positionIdx: number;
  radius: number;
  offset: { radOffset: number; angleOffset: number };
  isMobile: boolean;
  totalCards: number;
  isPicked?: boolean;
  isHovered?: boolean;
};

// Ultra-lightweight card memoization with physical drawing lift effect & celestial oracle back design
const DeckWheelCard = React.memo(
  function DeckWheelCard({
    card,
    positionIdx,
    radius,
    offset,
    isMobile,
    totalCards,
    isPicked = false,
    isHovered = false,
  }: DeckWheelCardProps) {
    // Distribute cards evenly along the full 360 degree wheel
    const step = (2 * Math.PI) / totalCards;
    const localAngle = positionIdx * step + offset.angleOffset;
    const liftAmount = isHovered ? (isMobile ? 6 : 10) : 0;
    const finalRadius = radius + offset.radOffset + liftAmount;
    const cardRotate = (localAngle * 180) / Math.PI + 90;
    const x = Math.round(finalRadius * Math.cos(localAngle) * 10) / 10;
    const y = Math.round(finalRadius * Math.sin(localAngle) * 10) / 10;

    return (
      <div
        data-card-id={card.id}
        className={`absolute left-1/2 top-1/2 w-16 h-26 sm:w-20 sm:h-32 md:w-28 md:h-44 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center select-none transition-[transform,opacity] duration-150 ease-out overflow-hidden cursor-pointer ${
          isPicked
            ? 'opacity-0 scale-75 pointer-events-none'
            : isHovered
            ? 'pointer-events-auto border-2 border-amber-300 ring-1 ring-yellow-400/60 shadow-lg shadow-amber-500/25 z-[300] scale-[1.04] bg-gradient-to-b from-indigo-950 via-zinc-950 to-black'
            : 'pointer-events-auto border border-amber-500/40 shadow-md bg-gradient-to-b from-indigo-950 via-zinc-950 to-black'
        }`}
        style={{
          transform: `translate3d(-50%, -50%, 0) translate3d(${x}px, ${y}px, 0) rotate(${cardRotate}deg) ${isHovered ? 'translateY(-5px)' : ''}`,
          transformOrigin: 'center center',
          zIndex: isHovered ? 300 : 10 + positionIdx,
          backfaceVisibility: 'hidden',
          contain: 'layout style paint',
          willChange: isHovered ? 'transform' : 'auto',
        }}
      >
        {!isPicked && (
          <>
            {/* 1. Subtle cosmic shimmer texture */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(99,102,241,0.15),transparent_70%)] pointer-events-none" />

            {/* 2. Outer filigree gold border */}
            <div className={`absolute inset-1 sm:inset-1.5 border rounded-md sm:rounded-lg md:rounded-xl pointer-events-none transition-colors ${isHovered ? 'border-yellow-400/80' : 'border-amber-400/30'}`} />

            {/* 3. Inner filigree frame with corner stars */}
            <div className={`absolute inset-2 sm:inset-2.5 border rounded-sm sm:rounded-md pointer-events-none transition-colors flex flex-col justify-between items-center p-1 sm:p-1.5 ${isHovered ? 'border-yellow-300/60 bg-yellow-500/10' : 'border-amber-400/20 bg-black/40'}`}>
              {/* Top Moon & Star motif */}
              <div className="flex items-center gap-1 opacity-70 text-[6px] sm:text-[8px] md:text-[9px] text-amber-200">
                <span>☽</span>
                <span className="text-[8px] sm:text-[10px] md:text-[11px] text-yellow-300">✧</span>
                <span>☾</span>
              </div>

              {/* Sacred Geometry / Metatron Cross & Concentric Rings */}
              <div className="relative w-7 h-7 sm:w-10 sm:h-10 md:w-14 md:h-14 flex items-center justify-center">
                {/* Diamond rotated frame */}
                <div className={`absolute inset-0 rotate-45 border transition-all ${isHovered ? 'border-yellow-400/60 scale-105' : 'border-amber-500/25'}`} />
                {/* Circular ring */}
                <div className={`absolute inset-1 rounded-full border transition-all ${isHovered ? 'border-yellow-300/80' : 'border-amber-500/35'}`} />
                {/* Center core */}
                <div className={`w-5 h-5 sm:w-7 sm:h-7 md:w-9 md:h-9 rounded-full border flex items-center justify-center relative z-10 transition-all ${
                  isHovered
                    ? 'border-yellow-300 bg-gradient-to-tr from-amber-500/40 to-yellow-300/40 scale-110 shadow-[0_0_10px_rgba(250,204,21,0.5)]'
                    : 'border-amber-400/40 bg-zinc-950/90 shadow-inner'
                }`}>
                  {/* Ultra-lightweight inline star SVG to eliminate 78 Lucide component overhead */}
                  <svg
                    viewBox="0 0 24 24"
                    className={`transition-colors ${isHovered ? 'text-yellow-100' : 'text-amber-400'}`}
                    style={{ width: isMobile ? 10 : 14, height: isMobile ? 10 : 14 }}
                    fill="currentColor"
                  >
                    <path d="M12 2l2.4 7.2h7.6l-6.2 4.5 2.4 7.3-6.2-4.5-6.2 4.5 2.4-7.3-6.2-4.5h7.6z" />
                  </svg>
                </div>
              </div>

              {/* Bottom Symmetry Moon & Star motif */}
              <div className="flex items-center gap-1 opacity-70 text-[6px] sm:text-[8px] md:text-[9px] text-amber-200 rotate-180">
                <span>☽</span>
                <span className="text-[8px] sm:text-[10px] md:text-[11px] text-yellow-300">✧</span>
                <span>☾</span>
              </div>
            </div>

            {/* 4. Diagonal light-glimmer sweep */}
            <div className={`absolute -inset-[100%] bg-gradient-to-tr from-transparent via-white/10 to-transparent rotate-45 pointer-events-none transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
          </>
        )}
      </div>
    );
  },
  (prev, next) => {
    return (
      prev.card.id === next.card.id &&
      prev.positionIdx === next.positionIdx &&
      prev.radius === next.radius &&
      prev.isMobile === next.isMobile &&
      prev.totalCards === next.totalCards &&
      prev.isPicked === next.isPicked &&
      prev.isHovered === next.isHovered
    );
  }
);

interface TarotSpreadProps {
  onComplete: (cards: SelectedTarotCardEntry[], touchMetadata?: any | null) => void;
  onCancel: () => void;
  maxCards?: number;
  concern?: string;
  positions?: string[];
  spreadName?: string;
  spreadReason?: string;
  deckSource?: TarotCard[];
  cardBackVariant?: 'classic' | 'oracle';
  allowReversed?: boolean;
}

export const TarotSpread: React.FC<TarotSpreadProps> = ({
  onComplete,
  onCancel,
  maxCards = 3,
  concern = '',
  positions = [],
  spreadName = '',
  spreadReason = '',
  deckSource,
  cardBackVariant = 'oracle',
  allowReversed = true,
}) => {
  const concernText = concern.trim();
  const hasConcern = concernText.length > 0;
  const hasSpreadMeta = spreadName.trim().length > 0;
  const compactSlots = maxCards >= 4;
  const slotClass = compactSlots
    ? 'w-14 h-20 sm:w-16 sm:h-24 md:w-20 md:h-32'
    : 'w-18 h-28 md:w-28 md:h-44';
  const slotsWrapClass = compactSlots
    ? 'flex flex-wrap items-end justify-center gap-2 sm:gap-3 max-w-[92vw]'
    : 'flex items-center justify-center gap-4 md:gap-6';

  const activeSource = useMemo(() => {
    return deckSource && deckSource.length > 0 ? deckSource : TAROT_DECK;
  }, [deckSource]);

  const [deck, setDeck] = useState(() => shuffleArray(activeSource));

  useEffect(() => {
    setDeck(shuffleArray(activeSource));
    setSelectedEntries([]);
  }, [activeSource]);

  const cardOffsets = useMemo(
    () =>
      Array.from({ length: 78 }).map((_, i) => ({
        radOffset: ((i % 3) - 1) * 1.5,
        angleOffset: 0,
      })),
    [],
  );

  const [selectedEntries, setSelectedEntries] = useState<Array<{ card: TarotCard; reversed: boolean }>>([]);
  const [isFinishing, setIsFinishing] = useState(false);
  const touchedCardIdRef = useRef<string | null>(null);
  const touchStartTimeRef = useRef<number>(0);
  const selectedIds = useMemo(
    () => selectedEntries.map((entry) => entry.card.id),
    [selectedEntries],
  );
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [wheelReady, setWheelReady] = useState(false);
  const [radius, setRadius] = useState(600);
  const [yOffset, setYOffset] = useState(580);
  const [isMobile, setIsMobile] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const wheelLayerRef = useRef<HTMLDivElement>(null);
  
  // High-performance physics refs
  const isDraggingRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const lastPointerPosRef = useRef({ x: 0, y: 0 });
  const startPointerPosRef = useRef({ x: 0, y: 0 });
  const lastAngleRef = useRef(0);
  const lastTimeRef = useRef(0);
  const velocityRef = useRef(0); // degrees per frame
  const rotationRef = useRef(Math.floor(Math.random() * 360));
  const hadMovedRef = useRef(false);
  const momentumRafRef = useRef<number | null>(null);

  // Preload cards in the deck asynchronously to eliminate image decoding lag on card selection
  useEffect(() => {
    if (typeof window === 'undefined' || deck.length === 0) return;
    const urls = deck.slice(0, 24).map((c) => getTarotCardImageUrl(c)).filter(Boolean);
    const preload = () => {
      urls.forEach((u) => {
        const img = new Image();
        img.src = u;
      });
    };
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(preload);
    } else {
      setTimeout(preload, 100);
    }
  }, [deck]);

  const buildWheelTransform = useCallback(
    (deg: number) => `translate3d(-50%, calc(-50% + ${yOffset}px), 0) rotate(${deg}deg)`,
    [yOffset],
  );

  const applyRotation = useCallback(
    (deg: number) => {
      rotationRef.current = deg;
      if (wheelLayerRef.current) {
        wheelLayerRef.current.style.transform = buildWheelTransform(deg);
      }
    },
    [buildWheelTransform],
  );

  // Stop any active inertia loop
  const stopMomentum = useCallback(() => {
    if (momentumRafRef.current !== null) {
      cancelAnimationFrame(momentumRafRef.current);
      momentumRafRef.current = null;
    }
  }, []);

  // Smooth kinetic deceleration loop (60-120fps physics)
  const startMomentum = useCallback(
    (initialVelocity: number) => {
      stopMomentum();
      velocityRef.current = Math.max(-14, Math.min(14, initialVelocity));

      const step = () => {
        if (Math.abs(velocityRef.current) < 0.015) {
          velocityRef.current = 0;
          momentumRafRef.current = null;
          return;
        }

        applyRotation(rotationRef.current + velocityRef.current);
        velocityRef.current *= 0.94; // Friction damping
        momentumRafRef.current = requestAnimationFrame(step);
      };

      momentumRafRef.current = requestAnimationFrame(step);
    },
    [applyRotation, stopMomentum],
  );

  // Responsive layout calibration
  useEffect(() => {
    const updateRadius = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (w < 480) {
        setRadius(Math.max(300, Math.min(380, h * 0.48)));
        setYOffset(Math.max(380, Math.min(460, h * 0.58)));
        setIsMobile(true);
      } else if (w < 768) {
        setRadius(440);
        setYOffset(520);
        setIsMobile(true);
      } else {
        setRadius(580);
        setYOffset(680);
        setIsMobile(false);
      }
    };

    updateRadius();
    const onResize = () => {
      if (!isDraggingRef.current) {
        updateRadius();
      }
    };
    window.addEventListener('resize', onResize);
    const timer = window.setTimeout(() => {
      updateRadius();
      setWheelReady(true);
    }, 50);

    return () => {
      window.removeEventListener('resize', onResize);
      window.clearTimeout(timer);
      stopMomentum();
    };
  }, [stopMomentum]);

  // Synchronize initial wheel position
  useEffect(() => {
    if (wheelReady) {
      applyRotation(rotationRef.current);
    }
  }, [wheelReady, applyRotation]);

  // Fast direct hit-test + O(1) candidate lookup with circular unwrapping
  const findTappedCard = useCallback(
    (clientX: number, clientY: number): TarotCard | null => {
      if (!containerRef.current || deck.length === 0) return null;

      // 1. Instant direct DOM hit test
      try {
        const el = document.elementFromPoint(clientX, clientY);
        const cardEl = el?.closest('[data-card-id]');
        if (cardEl) {
          const cardId = cardEl.getAttribute('data-card-id');
          if (cardId && !selectedIds.includes(cardId)) {
            const found = deck.find((c) => c.id === cardId);
            if (found) return found;
          }
        }
      } catch (_) {}

      // 2. High-precision geometric fallback
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2 + yOffset;
      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const dist = Math.hypot(dx, dy);
      const band = isMobile ? 260 : 360;

      // Ensure tap / hover is in the broad card ring band
      if (dist < Math.max(40, radius - band) || dist > radius + band) return null;

      const pointerAngle = Math.atan2(dy, dx);
      const rotationRad = (rotationRef.current * Math.PI) / 180;
      const currentRelativeAngle = pointerAngle - rotationRad;

      const total = deck.length;
      const step = (2 * Math.PI) / total;

      // Normalize currentRelativeAngle to [0, 2*PI)
      let norm = currentRelativeAngle % (2 * Math.PI);
      if (norm < 0) norm += 2 * Math.PI;

      const centerIdx = Math.round(norm / step) % total;

      // Check centerIdx and nearby neighbors (-3 to +3)
      const candidateIndices = [
        centerIdx,
        (centerIdx - 1 + total) % total,
        (centerIdx + 1) % total,
        (centerIdx - 2 + total) % total,
        (centerIdx + 2) % total,
        (centerIdx - 3 + total) % total,
        (centerIdx + 3) % total,
      ];

      let bestCard: TarotCard | null = null;
      let bestDiff = Infinity;

      for (const idx of candidateIndices) {
        const card = deck[idx];
        if (!card || selectedIds.includes(card.id)) continue;

        const cardAngle = idx * step;
        const rawDiff = Math.atan2(Math.sin(currentRelativeAngle - cardAngle), Math.cos(currentRelativeAngle - cardAngle));
        const diff = Math.abs(rawDiff);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestCard = card;
        }
      }

      return bestDiff < Math.max(0.28, step * 2.2) ? bestCard : null;
    },
    [deck, isMobile, radius, selectedIds, yOffset],
  );

  const handleSelect = useCallback(
    (cardToSelect: TarotCard) => {
      if (isFinishing || selectedEntries.length >= maxCards) return;

      // Tactile haptic vibration on mobile
      try {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate(15);
        }
      } catch (_) {}

      setSelectedEntries((prev) => {
        if (prev.some((entry) => entry.card.id === cardToSelect.id) || prev.length >= maxCards) return prev;
        const isReversed = allowReversed ? rollTarotReversed() : false;
        const next = [...prev, { card: cardToSelect, reversed: isReversed }];
        if (next.length === maxCards) {
          setIsFinishing(true);
          // Allow final card animation to smoothly settle before completing
          window.setTimeout(() => {
            onComplete(
              next.map((entry) => ({
                ...entry.card,
                reversed: entry.reversed,
              })),
              null,
            );
          }, 450);
        }
        return next;
      });
    },
    [allowReversed, isFinishing, maxCards, onComplete, selectedEntries.length],
  );

  // Quick Spin & Shuffle Controls (Strictly shuffles ONLY remaining unpicked cards)
  const handleQuickSpin = (direction: 'left' | 'right') => {
    stopMomentum();
    const impulse = direction === 'left' ? -6 : 6;
    startMomentum(impulse);
  };

  const handleShuffleDeck = () => {
    stopMomentum();
    setDeck((prevDeck) => {
      const remaining = prevDeck.filter((card) => !selectedIds.includes(card.id));
      const picked = prevDeck.filter((card) => selectedIds.includes(card.id));
      return [...picked, ...shuffleArray(remaining)];
    });
    startMomentum((Math.random() - 0.5) * 12);
  };

  const handleAutoPick = () => {
    const unpicked = deck.filter((card) => !selectedIds.includes(card.id));
    if (unpicked.length === 0 || selectedEntries.length >= maxCards || isFinishing) return;
    const randomCard = unpicked[Math.floor(Math.random() * unpicked.length)];
    if (randomCard) {
      handleSelect(randomCard);
    }
  };

  // High performance Pointer & Mobile Touch handling
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isFinishing) return;
    stopMomentum();
    if (!containerRef.current) return;

    touchStartTimeRef.current = performance.now();

    // Direct card element identification under touch pointer
    const targetEl = e.target as HTMLElement | null;
    const cardEl = targetEl?.closest('[data-card-id]');
    touchedCardIdRef.current = cardEl?.getAttribute('data-card-id') || null;

    if (e.pointerType === 'touch') {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (_) {}
    }

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2 + yOffset;

    activePointerIdRef.current = e.pointerId;
    isDraggingRef.current = false;
    hadMovedRef.current = false;
    startPointerPosRef.current = { x: e.clientX, y: e.clientY };
    lastPointerPosRef.current = { x: e.clientX, y: e.clientY };
    lastAngleRef.current = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current || isFinishing) return;

    // Hover detection when mouse is moving without dragging (Desktop only)
    if (activePointerIdRef.current === null) {
      if (e.pointerType !== 'touch') {
        const hovered = findTappedCard(e.clientX, e.clientY);
        const nextId = hovered?.id || null;
        if (nextId !== hoveredCardId) {
          setHoveredCardId(nextId);
        }
      }
      return;
    }

    if (activePointerIdRef.current !== e.pointerId) return;

    // During drag, remove any hover highlight
    if (hoveredCardId) {
      setHoveredCardId(null);
    }

    const moveDist = Math.hypot(
      e.clientX - startPointerPosRef.current.x,
      e.clientY - startPointerPosRef.current.y,
    );

    // Realistic touch drag threshold to prevent micro-jitter during taps from cancelling selection
    const dragThreshold = e.pointerType === 'touch' ? 14 : 8;

    if (!isDraggingRef.current && moveDist > dragThreshold) {
      isDraggingRef.current = true;
      hadMovedRef.current = true;
      touchedCardIdRef.current = null;
      containerRef.current.classList.add('cursor-grabbing');
      containerRef.current.classList.remove('cursor-grab');
    }

    if (!isDraggingRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2 + yOffset;
    const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);

    // Shortest arc unwrapped angular delta (prevents -PI to +PI snap glitches)
    let deltaAngle = currentAngle - lastAngleRef.current;
    while (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
    while (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;

    const deltaDeg = deltaAngle * (180 / Math.PI);
    const now = performance.now();
    const dt = Math.max(1, now - lastTimeRef.current);

    // Instant direct transform without state re-render latency
    applyRotation(rotationRef.current + deltaDeg);

    // Calculate instantaneous velocity for smooth flick release
    const instantVelocity = (deltaDeg / dt) * 16.67; // Normalize to 60fps frame rate
    velocityRef.current = velocityRef.current * 0.4 + instantVelocity * 0.6;

    lastAngleRef.current = currentAngle;
    lastPointerPosRef.current = { x: e.clientX, y: e.clientY };
    lastTimeRef.current = now;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== e.pointerId) return;

    const wasDragging = isDraggingRef.current;
    const hadMoved = hadMovedRef.current;
    const elapsed = performance.now() - touchStartTimeRef.current;
    const totalDist = Math.hypot(
      e.clientX - startPointerPosRef.current.x,
      e.clientY - startPointerPosRef.current.y,
    );

    isDraggingRef.current = false;
    activePointerIdRef.current = null;
    setHoveredCardId(null);

    if (containerRef.current) {
      containerRef.current.classList.remove('cursor-grabbing');
      containerRef.current.classList.add('cursor-grab');
      try {
        if (containerRef.current.hasPointerCapture(e.pointerId)) {
          containerRef.current.releasePointerCapture(e.pointerId);
        }
      } catch (_) {}
    }

    // Natural tap detection: if user tapped quickly (< 380ms) and within 18px radius, guarantee tap selection
    const isIntentionalTap = (!hadMoved && !wasDragging) || (elapsed < 380 && totalDist < 18);

    if (isIntentionalTap && !isFinishing) {
      let tapped: TarotCard | null = null;
      if (touchedCardIdRef.current) {
        tapped = deck.find((c) => c.id === touchedCardIdRef.current) || null;
      }
      if (!tapped) {
        tapped = findTappedCard(e.clientX, e.clientY);
      }

      if (tapped !== null && !selectedIds.includes(tapped.id)) {
        handleSelect(tapped);
      }
    } else if (wasDragging) {
      // If user flicked with velocity, apply smooth momentum
      if (Math.abs(velocityRef.current) > 0.08) {
        startMomentum(velocityRef.current);
      }
    }
    touchedCardIdRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.stopPropagation();
    stopMomentum();
    const delta = (e.deltaY || e.deltaX) * 0.05;
    applyRotation(rotationRef.current + delta);
    startMomentum(delta * 0.8);
  };

  return (
    <div
      className="fixed inset-0 z-[300] bg-zinc-950 overflow-hidden flex flex-col items-center justify-between font-sans select-none"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      {/* Top Floating Close Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onCancel();
        }}
        className="absolute z-[320] px-4 py-2 min-h-[44px] min-w-[44px] rounded-full border border-yellow-500/40 bg-zinc-900/95 text-xs font-bold uppercase tracking-widest text-yellow-300 hover:text-yellow-200 hover:border-yellow-400/60 shadow-[0_4px_24px_rgba(0,0,0,0.8)] backdrop-blur-md active:scale-95 transition-all flex items-center justify-center cursor-pointer pointer-events-auto"
        style={{
          top: 'calc(env(safe-area-inset-top, 0px) + 14px)',
          right: 'calc(env(safe-area-inset-right, 0px) + 16px)',
        }}
        aria-label="닫기"
      >
        닫기
      </button>

      {/* Main Interactive Interactive Stage */}
      <div
        ref={containerRef}
        className="flex-1 w-full relative flex items-center justify-center overflow-hidden touch-none select-none cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={() => setHoveredCardId(null)}
        onWheel={handleWheel}
      >
        {/* Subtle Vignette & Depth Masking */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(9,9,11,0.6)_80%)] pointer-events-none z-[15]" />
        <div className="absolute top-0 left-0 right-0 h-44 bg-gradient-to-b from-zinc-950 via-zinc-950/70 to-transparent pointer-events-none z-[20]" />

        {/* 78-Card GPU Composited Wheel Layer - Single Hardware Composite Target */}
        <div
          ref={wheelLayerRef}
          className="absolute left-1/2 top-1/2 transition-opacity duration-300"
          style={{
            transform: buildWheelTransform(0),
            willChange: 'transform',
            transformOrigin: 'center center',
            opacity: wheelReady ? 1 : 0,
          }}
        >
          {/* Subtle concentric orbit rings */}
          <div
            className="absolute left-1/2 top-1/2 rounded-full border border-yellow-500/15 bg-[radial-gradient(circle,rgba(234,179,8,0.03)_0%,transparent_75%)] pointer-events-none"
            style={{
              width: radius * 2,
              height: radius * 2,
              transform: 'translate(-50%, -50%)',
            }}
          />
          <div
            className="absolute left-1/2 top-1/2 rounded-full border border-dashed border-yellow-500/20 pointer-events-none"
            style={{
              width: radius * 2 + 16,
              height: radius * 2 + 16,
              transform: 'translate(-50%, -50%)',
            }}
          />

          {deck.map((card, positionIdx) => (
            <DeckWheelCard
              key={card.id}
              card={card}
              originalIdx={positionIdx}
              positionIdx={positionIdx}
              radius={radius}
              offset={cardOffsets[positionIdx % cardOffsets.length] || { radOffset: 0, angleOffset: 0 }}
              isMobile={isMobile}
              totalCards={deck.length}
              isPicked={selectedIds.includes(card.id)}
              isHovered={hoveredCardId === card.id}
            />
          ))}
        </div>

        {/* Top Info Banner (Theme / Spread Meta / Question) */}
        {(hasConcern || hasSpreadMeta) && (
          <div
            className="absolute left-0 right-0 z-[96] px-4 pointer-events-none flex justify-center"
            style={{
              top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
              paddingRight: 'calc(env(safe-area-inset-right, 0px) + 72px)',
              paddingLeft: 'calc(env(safe-area-inset-left, 0px) + 16px)',
            }}
          >
            <div className="w-full max-w-md rounded-2xl border border-yellow-500/25 bg-zinc-900/90 backdrop-blur-md px-3.5 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] space-y-1.5 pointer-events-none">
              {hasSpreadMeta && (
                <div className="text-center">
                  <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.25em] text-yellow-500/75 mb-0.5 font-mono">
                    자동 추천 배열법
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-yellow-200">
                    {spreadName} · {maxCards}장
                  </p>
                  {spreadReason && (
                    <p className="text-[9px] sm:text-[10px] text-white/50 leading-tight mt-0.5 line-clamp-1 break-keep">
                      {spreadReason}
                    </p>
                  )}
                </div>
              )}
              {hasConcern && (
                <div className="text-center border-t border-white/5 pt-1">
                  <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.25em] text-yellow-500/75 mb-0.5 font-mono">
                    나의 고민
                  </p>
                  <p className="text-[11px] sm:text-xs text-white/90 leading-tight line-clamp-2 break-keep">
                    {concernText}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selected Card Slots Layer */}
        <div
          className="absolute flex flex-col items-center justify-center gap-3 sm:gap-4 md:gap-6 z-[95] pointer-events-none w-full px-2"
          style={{
            top: isMobile
              ? hasConcern || hasSpreadMeta
                ? compactSlots
                  ? 'calc(env(safe-area-inset-top, 0px) + 7.2rem)'
                  : 'calc(env(safe-area-inset-top, 0px) + 6.5rem)'
                : 'calc(env(safe-area-inset-top, 0px) + 3.8rem)'
              : hasConcern || hasSpreadMeta
                ? compactSlots
                  ? 'calc(env(safe-area-inset-top, 0px) + 9.5rem)'
                  : 'calc(env(safe-area-inset-top, 0px) + 8.5rem)'
                : 'calc(env(safe-area-inset-top, 0px) + 4.5rem)',
          }}
        >
          <div className={slotsWrapClass}>
            {Array.from({ length: maxCards }).map((_, i) => {
              const entry = selectedEntries[i];
              const hasCard = entry !== undefined;
              const drawnCard = hasCard ? entry.card : null;
              const positionLabel = positions[i] || `Card ${i + 1}`;
              return (
                <div
                  key={`slot-${i}`}
                  className={`${slotClass} bg-zinc-950/80 border border-yellow-500/30 rounded-xl md:rounded-2xl flex items-center justify-center relative shadow-2xl backdrop-blur-md`}
                >
                  {!hasCard ? (
                    <div className="text-yellow-500/35 text-[7px] md:text-[9px] uppercase tracking-widest font-sans flex flex-col items-center gap-1 md:gap-1.5 px-1 text-center">
                      <div className="w-5 h-5 md:w-7 md:h-7 rounded-full border border-yellow-500/30 flex items-center justify-center bg-yellow-500/10 animate-pulse shadow-inner">
                        <span className="text-yellow-500/70 text-[8px] md:text-[10px] font-serif font-black">
                          {i + 1}
                        </span>
                      </div>
                      <span className="font-bold tracking-wide leading-tight break-keep">{positionLabel}</span>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ scale: 0.25, y: 70, opacity: 0, rotateZ: i % 2 === 0 ? -8 : 8 }}
                      animate={{ scale: 1, y: 0, opacity: 1, rotateZ: 0 }}
                      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                      className="absolute inset-0 border-2 border-yellow-400 rounded-xl md:rounded-2xl flex flex-col justify-between p-1.5 sm:p-2 md:p-3 text-center shadow-lg shadow-yellow-500/20 overflow-hidden"
                      style={{ contain: 'layout style paint' }}
                    >
                      <img
                        src={getTarotCardImageUrl(drawnCard!)}
                        alt={drawnCard!.name}
                        loading="eager"
                        decoding="async"
                        style={{ transform: entry.reversed ? 'rotate(180deg)' : undefined }}
                        className="absolute inset-0 w-full h-full object-cover z-0 rounded-xl md:rounded-2xl opacity-90 transition-opacity duration-200 group-hover:opacity-100"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/70 z-10 pointer-events-none rounded-xl md:rounded-2xl" />
                      <div className="absolute inset-0.5 border border-yellow-500/20 rounded-lg md:rounded-xl pointer-events-none z-20" />

                      <div className="flex justify-between items-center text-[6px] md:text-[7px] font-mono text-yellow-500/80 z-20 shrink-0">
                        <span>{entry.reversed ? 'REVERSED' : 'TRINITY'}</span>
                        <Sparkles size={6} className="text-yellow-400/80" />
                      </div>

                      <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 mx-auto rounded-full bg-black/60 border border-yellow-500/30 flex items-center justify-center text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.4)] z-20 shrink-0">
                        {React.createElement(getTarotCardVisual(drawnCard!).icon, {
                          size: isMobile ? 12 : 20,
                          className: getTarotCardVisual(drawnCard!).color,
                        })}
                      </div>

                      <div className="text-center z-20 flex flex-col gap-0.5 shrink-0 bg-black/80 py-0.5 sm:py-1 rounded-lg border border-yellow-500/20">
                        <span className="text-[8px] sm:text-[9px] md:text-[11px] font-bold text-yellow-300 block leading-tight">
                          {drawnCard!.nameKo}
                        </span>
                        <span className="text-[5px] sm:text-[6px] md:text-[7px] font-mono text-white/50 uppercase tracking-widest block">
                          {entry.reversed ? '역방향' : drawnCard!.name}
                        </span>
                      </div>

                      <span className="text-[5px] sm:text-[6px] md:text-[7px] font-mono text-yellow-500/60 uppercase tracking-widest block z-20 shrink-0">
                        {drawnCard!.type}
                      </span>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selection Instruction and Help */}
          <div className="text-center pointer-events-none flex flex-col items-center gap-1.5 px-4 w-full select-none">
            <div className="flex items-center gap-2">
              <span className="text-yellow-400 font-bold tracking-[0.15em] text-xs sm:text-[13px] md:text-sm font-sans drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                {selectedEntries.length} / {maxCards} 카드를 선택하세요
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 font-mono font-bold">
                남은 덱: {deck.length - selectedEntries.length}장
              </span>
            </div>
            <span className="text-white/60 text-[10px] sm:text-[11px] tracking-wide font-normal max-w-xs md:max-w-md drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
              부드럽게 밀어서 회전시키거나 마음에 와닿는 카드를 탭하세요
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Quick Control Bar */}
      <div
        className="relative z-[310] flex items-center justify-center gap-2 sm:gap-3 px-4 py-3 bg-zinc-950/80 backdrop-blur-md border-t border-yellow-500/20 w-full"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
      >
        <button
          type="button"
          onClick={() => handleQuickSpin('left')}
          className="px-3 py-2 rounded-xl bg-zinc-900 border border-yellow-500/25 hover:border-yellow-400 text-yellow-300 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all shadow-md cursor-pointer"
        >
          <ChevronLeft size={14} />
          <span>좌회전</span>
        </button>

        <button
          type="button"
          onClick={handleShuffleDeck}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-yellow-500/20 border border-yellow-500/40 hover:border-yellow-400 text-yellow-200 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-md cursor-pointer"
          title={`현재 남은 ${deck.length - selectedEntries.length}장의 덱을 셔플합니다 (이미 뽑은 카드는 덱에 다시 들어가지 않습니다)`}
        >
          <Shuffle size={13} className="text-yellow-400" />
          <span>남은 덱 셔플 ({deck.length - selectedEntries.length}장)</span>
        </button>

        <button
          type="button"
          onClick={handleAutoPick}
          disabled={selectedEntries.length >= maxCards}
          className="px-3.5 py-2 rounded-xl bg-yellow-500 text-zinc-950 font-bold text-xs flex items-center gap-1.5 hover:bg-yellow-400 active:scale-95 transition-all shadow-[0_0_16px_rgba(234,179,8,0.4)] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          <Sparkles size={13} />
          <span>자동 한 장</span>
        </button>

        <button
          type="button"
          onClick={() => handleQuickSpin('right')}
          className="px-3 py-2 rounded-xl bg-zinc-900 border border-yellow-500/25 hover:border-yellow-400 text-yellow-300 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all shadow-md cursor-pointer"
        >
          <span>우회전</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};
