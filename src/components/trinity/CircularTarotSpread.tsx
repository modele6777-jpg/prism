import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  RotateCcw,
  Compass,
  Eye,
  Layers,
  Shuffle,
  ZoomIn,
  Info,
  Sliders,
  Play,
  Pause,
  Check,
  ChevronRight,
  ShieldCheck,
  Flame,
  Heart,
  Wind,
  Coins,
  Sun,
  Moon,
  Star,
  Activity,
  Zap,
} from 'lucide-react';
import { TAROT_DECK, type TarotCard, getTarotCardImageUrl } from '@/data/tarotData';
import { TarotCardBackFace } from './TarotCardBackFace';
import { playAudioHaptic } from '@/lib/audioHaptics';

export interface CircularTarotSpreadProps {
  /** 펼칠 타로 카드 배열 (기본값: 메이저 아르카나 22장) */
  cards?: TarotCard[];
  /** 원형에 배치할 카드 수 N (기본값: 22장 또는 cards.length) */
  cardCount?: number;
  /** 원형 반지름(px) — 미지정 시 카드 크기와 N에 맞춰 자동 계산 */
  radius?: number;
  /** 각 카드의 너비 (px, 기본값: 74) */
  cardWidth?: number;
  /** 각 카드의 높이 (px, 기본값: 128) */
  cardHeight?: number;
  /** 카드 겹침 순환 방향 (기본: 'clockwise' 시계방향) */
  direction?: 'clockwise' | 'counter-clockwise';
  /** 카드 앞면(일러스트) 또는 뒷면(테마 패턴) 기본 표시 여부 */
  showFaces?: boolean;
  /** 현재 선택된 카드 ID */
  selectedCardId?: string | null;
  /** 카드 클릭/선택 콜백 */
  onSelectCard?: (card: TarotCard, index: number) => void;
  /** 카드 뒷면 테마 ID (TarotCardBackFace 연동) */
  cardBackThemeId?: string;
  /** 사운드 및 햅틱 효과 활성화 여부 */
  enableSound?: boolean;
  /** 상단/하단 인터랙티브 컨트롤 툴바 표시 여부 (기본: true) */
  showControls?: boolean;
  /** 에셔 레이어 분할 절개선 시각화 모드 (X-Ray 트릭 데모) */
  showEscherDebug?: boolean;
  /** 추가 컨테이너 클래스 */
  className?: string;
}

// 로마 숫자 변환기
const toRomanNumeral = (num: number): string => {
  const romanMap: [number, string][] = [
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  if (num === 0) return '0';
  let result = '';
  let n = num;
  for (const [val, roman] of romanMap) {
    while (n >= val) {
      result += roman;
      n -= val;
    }
  }
  return result;
};

// 카드 원소 심볼 아이콘
const getCardSuitVisual = (card: TarotCard) => {
  if (card.type === 'major') return { icon: Sparkles, color: 'text-amber-400' };
  if (card.type === 'wands') return { icon: Flame, color: 'text-orange-400' };
  if (card.type === 'cups') return { icon: Heart, color: 'text-sky-400' };
  if (card.type === 'swords') return { icon: Wind, color: 'text-indigo-400' };
  if (card.type === 'pentacles') return { icon: Coins, color: 'text-emerald-400' };
  return { icon: Sparkles, color: 'text-amber-400' };
};

export const CircularTarotSpread: React.FC<CircularTarotSpreadProps> = ({
  cards = TAROT_DECK.slice(0, 22),
  cardCount: initialCount = 22,
  radius: customRadius,
  cardWidth = 74,
  cardHeight = 128,
  direction: initialDirection = 'clockwise',
  showFaces: initialShowFaces = false,
  selectedCardId,
  onSelectCard,
  cardBackThemeId = 'cosmic_midnight',
  enableSound = true,
  showControls = true,
  showEscherDebug: initialDebug = false,
  className = '',
}) => {
  // 상태 관리
  const [activeCount, setActiveCount] = useState<number>(Math.min(initialCount, cards.length));
  const [isFaceUp, setIsFaceUp] = useState<boolean>(initialShowFaces);
  const [direction, setDirection] = useState<'clockwise' | 'counter-clockwise'>(initialDirection);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isAutoSpinning, setIsAutoSpinning] = useState<boolean>(false);
  const [spinAngle, setSpinAngle] = useState<number>(0);
  const [showXRay, setShowXRay] = useState<boolean>(initialDebug);
  const [isZoomOpen, setIsZoomOpen] = useState<boolean>(false);

  const lastHapticTime = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // 사용할 카드 슬라이스
  const activeDeck = useMemo(() => {
    return cards.slice(0, activeCount);
  }, [cards, activeCount]);

  const N = activeDeck.length;

  // 동적 최적 반지름 계산:
  // 둘레 2 * PI * R 에 N장의 카드가 서로 20~35% 폭으로 균등 겹치도록 계산
  const effectiveRadius = useMemo(() => {
    if (customRadius && customRadius > 0) return customRadius;
    // 평균 겹침 비율 65% 노출, 35% 겹침
    const targetCircumference = N * cardWidth * 0.72;
    const computedR = targetCircumference / (2 * Math.PI);
    return Math.max(140, Math.min(280, Math.round(computedR)));
  }, [customRadius, N, cardWidth]);

  // 천문 자이로스코프 자동 회전 루프
  useEffect(() => {
    if (!isAutoSpinning) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }
    const tick = () => {
      setSpinAngle((prev) => (prev + 0.12) % 360);
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isAutoSpinning]);

  // 햅틱 사운드 트리거
  const triggerHaptic = useCallback(
    (type: 'card_hover' | 'card_snap' | 'tap_light') => {
      if (!enableSound) return;
      const now = Date.now();
      if (type === 'card_hover' && now - lastHapticTime.current < 60) return;
      lastHapticTime.current = now;
      try {
        playAudioHaptic(type);
      } catch {
        // AudioContext fallback
      }
    },
    [enableSound]
  );

  // 카드 호버 핸들러
  const handleCardHover = useCallback(
    (index: number | null) => {
      if (index !== hoveredIdx) {
        setHoveredIdx(index);
        if (index !== null) {
          triggerHaptic('card_hover');
        }
      }
    },
    [hoveredIdx, triggerHaptic]
  );

  // 카드 클릭/선택 핸들러
  const handleCardClick = useCallback(
    (card: TarotCard, index: number) => {
      setSelectedIdx(index);
      triggerHaptic('card_snap');
      if (onSelectCard) {
        onSelectCard(card, index);
      }
    },
    [triggerHaptic, onSelectCard]
  );

  // 현재 호버 또는 선택된 카드
  const activeFocusCard = useMemo(() => {
    const idx = hoveredIdx !== null ? hoveredIdx : selectedIdx;
    if (idx !== null && activeDeck[idx]) {
      return { card: activeDeck[idx], index: idx };
    }
    return null;
  }, [hoveredIdx, selectedIdx, activeDeck]);

  // 베이스 z-index 단위
  const BASE_Z = 20;
  const Z_STEP = 5;

  /**
   * 단일 카드 렌더러 함수
   * @param card 대상 타로 카드
   * @param i 카드 인덱스 (0 ~ N-1)
   * @param isLastCard N-1번째 에셔 루프 클로징 카드 여부
   * @param escherLayer 에셔 루프 분할 레이어 ('none' | 'overlap' | 'under')
   */
  const renderCardElement = (
    card: TarotCard,
    i: number,
    isLastCard: boolean,
    escherLayer: 'none' | 'overlap' | 'under' = 'none'
  ) => {
    // 1. 방사형 회전 각도 계산 (0도 = 12시 방향에서 시작)
    const angleStep = 360 / N;
    const baseAngle = i * angleStep;
    const currentAngle = (baseAngle + spinAngle) % 360;

    const isHovered = hoveredIdx === i;
    const isSelected = selectedIdx === i || selectedCardId === card.id;

    // 2. 호버/선택 시 바깥쪽으로 부드럽게 떠오르는 래디얼 리프트
    const hoverLift = isHovered ? 26 : isSelected ? 16 : 0;
    const hoverScale = isHovered ? 1.09 : isSelected ? 1.04 : 1.0;

    // 3. z-index 계층 산출 (핵심 요구사항: 에셔 루프 해결 트릭)
    let zIndex = BASE_Z + (i + 1) * Z_STEP;

    if (isHovered) {
      // 호버 시에는 모든 카드가 최상위 9999로 승격되어 온전하게 관찰 가능
      zIndex = 9999;
    } else if (isSelected) {
      zIndex = 9000;
    } else if (isLastCard) {
      if (direction === 'clockwise') {
        // [시계방향 셔터 규칙]:
        // N번째 카드의 왼쪽 절반은 N-1번 카드를 덮어야 함 (가장 높은 z-index)
        // N번째 카드의 오른쪽 절반은 1번 카드(0번 인덱스) 밑에 깔려야 함 (가장 낮은 z-index)
        if (escherLayer === 'overlap') {
          zIndex = BASE_Z + (N + 2) * Z_STEP; // N-1번 카드보다 명백히 위
        } else if (escherLayer === 'under') {
          zIndex = BASE_Z - 10; // 0번 카드(BASE_Z + Z_STEP)보다 명백히 아래
        }
      } else {
        // [반시계방향 셔터 규칙]:
        if (escherLayer === 'overlap') {
          zIndex = BASE_Z + (N + 2) * Z_STEP;
        } else if (escherLayer === 'under') {
          zIndex = BASE_Z - 10;
        }
      }
    }

    // 4. CSS clip-path 절단 마스크 산출
    let clipPathStyle: string | undefined = undefined;
    if (isLastCard && !isHovered) {
      // 틈새 및 서브픽셀 렌더링 갭을 원천 차단하기 위해 50% 분기선에 0.5% 오버랩 브릿지 적용
      if (direction === 'clockwise') {
        if (escherLayer === 'overlap') {
          // 덮어야 하는 왼쪽 절반 영역 (0% ~ 50.5%)
          clipPathStyle = 'polygon(0% 0%, 50.5% 0%, 50.5% 100%, 0% 100%)';
        } else if (escherLayer === 'under') {
          // 밑에 깔려야 하는 오른쪽 절반 영역 (49.5% ~ 100%)
          clipPathStyle = 'polygon(49.5% 0%, 100% 0%, 100% 100%, 49.5% 100%)';
        }
      } else {
        if (escherLayer === 'overlap') {
          clipPathStyle = 'polygon(49.5% 0%, 100% 0%, 100% 100%, 49.5% 100%)';
        } else if (escherLayer === 'under') {
          clipPathStyle = 'polygon(0% 0%, 50.5% 0%, 50.5% 100%, 0% 100%)';
        }
      }
    }

    const SuitIcon = getCardSuitVisual(card).icon;
    const suitColor = getCardSuitVisual(card).color;
    const imageUrl = getTarotCardImageUrl(card);

    return (
      <div
        key={`${card.id}-${escherLayer}-${i}`}
        data-card-index={i}
        data-escher-layer={escherLayer}
        onMouseEnter={() => handleCardHover(i)}
        onMouseLeave={() => handleCardHover(null)}
        onClick={() => handleCardClick(card, i)}
        style={{
          width: `${cardWidth}px`,
          height: `${cardHeight}px`,
          position: 'absolute',
          top: '50%',
          left: '50%',
          marginLeft: `-${cardWidth / 2}px`,
          marginTop: `-${cardHeight / 2}px`,
          transformOrigin: '50% 50%',
          transform: `rotate(${currentAngle}deg) translateY(-${effectiveRadius + hoverLift}px) scale(${hoverScale})`,
          zIndex,
          clipPath: clipPathStyle,
          WebkitClipPath: clipPathStyle,
          transition: isAutoSpinning
            ? 'transform 0.15s ease-out, box-shadow 0.28s, filter 0.28s'
            : 'transform 0.32s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.32s, filter 0.32s',
          cursor: 'pointer',
          willChange: 'transform, z-index',
        }}
        className={`group select-none rounded-xl overflow-hidden transition-all duration-300 ${
          isHovered
            ? 'ring-2 ring-amber-300 shadow-[0_16px_36px_rgba(245,158,11,0.5),0_0_24px_rgba(251,191,36,0.6)] brightness-110'
            : isSelected
            ? 'ring-2 ring-yellow-400 shadow-[0_12px_28px_rgba(234,179,8,0.4)]'
            : 'shadow-[0_6px_16px_rgba(0,0,0,0.7),0_1px_3px_rgba(255,255,255,0.08)] hover:brightness-105'
        }`}
      >
        {/* X-Ray 에셔 트릭 디버그 오버레이 (절반 절단선 시각화) */}
        {showXRay && isLastCard && !isHovered && (
          <div
            className={`absolute inset-0 pointer-events-none z-50 flex items-center justify-center font-mono text-[9px] font-black border ${
              escherLayer === 'overlap'
                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200'
                : 'bg-rose-500/25 border-rose-400 text-rose-200'
            }`}
          >
            <span className="px-1 py-0.5 rounded bg-black/80">
              {escherLayer === 'overlap' ? 'OVER (상단 50%)' : 'UNDER (하단 50%)'}
            </span>
          </div>
        )}

        {/* 🃏 카드 앞면 vs 뒷면 렌더링 */}
        {isFaceUp ? (
          /* [앞면 일러스트] */
          <div className="relative w-full h-full bg-gradient-to-b from-stone-900 via-zinc-950 to-black flex flex-col justify-between border border-amber-500/40 rounded-xl overflow-hidden">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={card.nameKo}
                className="w-full h-full object-cover object-center pointer-events-none"
                loading="eager"
              />
            ) : (
              /* Fallback 명화/원소 아트워크 */
              <div className="w-full h-full flex flex-col items-center justify-between p-2 relative bg-zinc-900/90">
                <div className="flex items-center justify-between w-full text-[9px] font-mono text-amber-300/80">
                  <span>{toRomanNumeral(i)}</span>
                  <SuitIcon size={11} className={suitColor} />
                </div>
                <div className="flex flex-col items-center justify-center text-center my-auto">
                  <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-400/40 flex items-center justify-center mb-1 shadow-inner">
                    <SuitIcon size={18} className={suitColor} />
                  </div>
                  <span className="text-[10px] font-bold text-white font-serif tracking-tight line-clamp-1">
                    {card.nameKo}
                  </span>
                </div>
                <div className="w-full text-center text-[8px] text-zinc-400 font-sans truncate">
                  {card.keywords?.[0] || '지혜'}
                </div>
              </div>
            )}

            {/* 카드 상단 로마 숫자 / 인덱스 칩 */}
            <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/75 border border-amber-400/40 text-[8px] font-mono font-bold text-amber-300 leading-none shadow-sm backdrop-blur-xs">
              #{i + 1}
            </div>

            {/* 카드 하단 명칭 반투명 비네팅 배지 */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/75 to-transparent px-1.5 py-1 text-center">
              <span className="text-[9px] font-bold text-amber-200 tracking-tight font-serif truncate block drop-shadow">
                {card.nameKo}
              </span>
            </div>
          </div>
        ) : (
          /* [뒷면 패턴 Face] — TarotCardBackFace 컴포넌트 활용 */
          <div className="relative w-full h-full rounded-xl overflow-hidden border border-amber-400/35 bg-black">
            <TarotCardBackFace
              cardBackId={cardBackThemeId}
              isHovered={isHovered}
              size="wheel"
              className="w-full h-full"
            />
            {/* 세련된 황금 모서리 테두리 빛 */}
            <div className="absolute inset-0 rounded-xl border border-amber-400/20 pointer-events-none" />
            <div className="absolute top-1.5 left-1.5 px-1 py-0.5 rounded-sm bg-black/60 border border-amber-500/30 text-[7px] font-mono text-amber-300 font-bold leading-none">
              #{i + 1}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`relative flex flex-col items-center justify-center p-3 sm:p-6 w-full select-none ${className}`}
    >
      {/* 1. 상단 인포메이션 및 에셔 셔터 상태 헤더 */}
      {showControls && (
        <div className="w-full max-w-2xl mb-4 flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/10 shadow-lg text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-sm">
              <Compass size={15} className="animate-spin text-amber-400" style={{ animationDuration: '24s' }} />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                <span>원형 에셔 셔터 타로 스프레드</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  {N} CARDS
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-sans">
                순환 셔터 분할 렌더링으로 완성된 균등 겹침 에셔 루프 (Escher Loop)
              </p>
            </div>
          </div>

          {/* 퀵 토글 버튼 그룹 */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* 앞면/뒷면 뒤집기 */}
            <button
              type="button"
              onClick={() => {
                setIsFaceUp((prev) => !prev);
                triggerHaptic('card_snap');
              }}
              className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all cursor-pointer ${
                isFaceUp
                  ? 'bg-amber-400/25 text-amber-200 border border-amber-400/40'
                  : 'bg-white/10 hover:bg-white/15 text-white/85 border border-white/10'
              }`}
              title="카드 앞면/뒷면 뒤집기"
            >
              <Eye size={12} />
              <span>{isFaceUp ? '앞면 공개' : '뒷면 가림'}</span>
            </button>

            {/* 자동 회전 천문 자이로스코프 */}
            <button
              type="button"
              onClick={() => {
                setIsAutoSpinning((prev) => !prev);
                triggerHaptic('tap_light');
              }}
              className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all cursor-pointer ${
                isAutoSpinning
                  ? 'bg-purple-500/25 text-purple-200 border border-purple-400/40 animate-pulse'
                  : 'bg-white/10 hover:bg-white/15 text-white/85 border border-white/10'
              }`}
              title="천문 자이로스코프 자전 토글"
            >
              {isAutoSpinning ? <Pause size={12} /> : <Play size={12} />}
              <span>{isAutoSpinning ? '자전 중지' : '천문 자전'}</span>
            </button>

            {/* 시계/반시계 셔터 방향 전환 */}
            <button
              type="button"
              onClick={() => {
                setDirection((prev) => (prev === 'clockwise' ? 'counter-clockwise' : 'clockwise'));
                triggerHaptic('tap_light');
              }}
              className="px-2.5 py-1.5 rounded-xl font-bold bg-white/10 hover:bg-white/15 text-white/85 border border-white/10 flex items-center gap-1 transition-all cursor-pointer"
              title="셔터 겹침 방향 전환"
            >
              <RotateCcw size={12} className={direction === 'counter-clockwise' ? '-scale-x-100' : ''} />
              <span>{direction === 'clockwise' ? '시계 ↻' : '반시계 ↺'}</span>
            </button>

            {/* X-Ray 에셔 트릭 절개선 디버그 보기 */}
            <button
              type="button"
              onClick={() => {
                setShowXRay((prev) => !prev);
                triggerHaptic('tap_light');
              }}
              className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all cursor-pointer ${
                showXRay
                  ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50'
                  : 'bg-white/5 hover:bg-white/10 text-zinc-400 border border-white/10'
              }`}
              title="마지막 N번째 카드 절단 레이어(OVER/UNDER) X-Ray 시각화"
            >
              <Layers size={12} />
              <span>{showXRay ? 'X-Ray ON' : 'X-Ray 트릭'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. 카드 수 조절 프리셋 버튼 바 (8장 / 12장 / 16장 / 22장 메이저) */}
      {showControls && (
        <div className="flex items-center justify-center gap-1.5 mb-4 max-w-full overflow-x-auto no-scrollbar py-1">
          <span className="text-[11px] text-zinc-400 font-mono mr-1 shrink-0">배치 장수 (N):</span>
          {[8, 12, 16, 22].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => {
                setActiveCount(num);
                triggerHaptic('tap_light');
              }}
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
                activeCount === num
                  ? 'bg-amber-400 text-black shadow-md shadow-amber-400/30 scale-105'
                  : 'bg-white/5 hover:bg-white/10 text-white/80 border border-white/10'
              }`}
            >
              {num}장
            </button>
          ))}
        </div>
      )}

      {/* 3. 메인 원형 휠 컨테이너 (고정 지름 영역) */}
      <div
        className="relative flex items-center justify-center overflow-visible my-3 sm:my-6"
        style={{
          width: `${(effectiveRadius + cardHeight) * 2 + 20}px`,
          height: `${(effectiveRadius + cardHeight) * 2 + 20}px`,
          maxWidth: '96vw',
          maxHeight: '96vw',
        }}
      >
        {/* 원형 배경 천문 링 & 가이드라인 */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* 외곽 부드러운 앰비언트 글로우 */}
          <div
            className="rounded-full bg-gradient-to-tr from-amber-500/10 via-purple-500/5 to-cyan-500/10 blur-2xl"
            style={{
              width: `${effectiveRadius * 2 + cardHeight}px`,
              height: `${effectiveRadius * 2 + cardHeight}px`,
            }}
          />
          {/* 천문 황도대 궤도선 */}
          <div
            className="rounded-full border border-amber-400/20 border-dashed"
            style={{
              width: `${effectiveRadius * 2}px`,
              height: `${effectiveRadius * 2}px`,
            }}
          />
          {/* 내부 동심원 데코 */}
          <div
            className="rounded-full border border-white/10"
            style={{
              width: `${effectiveRadius * 1.3}px`,
              height: `${effectiveRadius * 1.3}px`,
            }}
          />
        </div>

        {/* 🌟 원형 중심 만다라 및 포커스 카드 프리뷰 허브 */}
        <div
          className="absolute z-10 flex flex-col items-center justify-center rounded-full p-4 text-center pointer-events-none transition-all duration-300"
          style={{
            width: `${Math.max(120, effectiveRadius * 0.95)}px`,
            height: `${Math.max(120, effectiveRadius * 0.95)}px`,
          }}
        >
          <div className="absolute inset-0 rounded-full bg-black/60 backdrop-blur-md border border-amber-400/30 shadow-2xl pointer-events-auto flex flex-col items-center justify-center p-3">
            {activeFocusCard ? (
              <motion.div
                key={activeFocusCard.card.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center text-center space-y-1"
              >
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                  CARD #{activeFocusCard.index + 1}
                </span>
                <h4 className="text-sm font-bold text-white font-serif tracking-tight line-clamp-1">
                  {activeFocusCard.card.nameKo}
                </h4>
                <p className="text-[10px] text-zinc-400 font-sans italic line-clamp-1">
                  {activeFocusCard.card.name}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[9px] text-amber-400/90 font-sans">
                    {activeFocusCard.card.keywords?.slice(0, 2).join(' · ')}
                  </span>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center space-y-1">
                <Compass size={22} className="text-amber-400 animate-pulse" />
                <span className="text-[10px] font-serif font-bold text-amber-300">
                  ESCHER IRIS
                </span>
                <span className="text-[9px] text-zinc-400 font-sans leading-tight">
                  카드를 터치하여<br />상세 살펴보기
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 🎴 방사형 타로 카드 렌더링 루프 */}
        {activeDeck.map((card, i) => {
          const isLastCard = i === N - 1;

          if (!isLastCard) {
            // 0번부터 N-2번 카드: 순차적 z-index로 겹치며 일반 렌더링
            return renderCardElement(card, i, false, 'none');
          }

          // ★ [핵심 에셔 루프 해결 트릭]: 마지막 N번째 카드는 모양 변형 없이 원형 유지!
          // CSS clip-path로 분할하여:
          // 1) 덮어야 하는 절반 영역 (OVER) -> 최고 z-index로 N-1번 카드 위를 덮음
          // 2) 밑에 깔려야 하는 절반 영역 (UNDER) -> 최저 z-index로 0번 카드(1번 카드) 밑에 깔림
          // 결과적으로 어떤 카드도 이중으로 갇히지 않고 모든 카드가 동일하게 한쪽 면만 노출됨!
          return (
            <React.Fragment key={`escher-split-${card.id}`}>
              {/* Layer A: 덮어야 하는 절반 레이어 (OVER) */}
              {renderCardElement(card, i, true, 'overlap')}
              {/* Layer B: 밑에 깔려야 하는 절반 레이어 (UNDER) */}
              {renderCardElement(card, i, true, 'under')}
            </React.Fragment>
          );
        })}
      </div>

      {/* 4. 하단 상세 안내 및 에셔 트릭 설명 바 */}
      <div className="w-full max-w-xl mt-3 p-3.5 rounded-2xl bg-amber-500/[0.06] border border-amber-500/20 text-xs text-zinc-300 space-y-1.5 shadow-sm">
        <div className="flex items-center gap-1.5 font-bold text-amber-300 text-xs">
          <Info size={13} className="text-amber-400 shrink-0" />
          <span>에셔 순환 셔터 (Escher Iris Loop) 렌더링 원리</span>
        </div>
        <p className="text-[11px] text-zinc-300/80 leading-relaxed font-sans">
          현실에서 원형으로 덱을 겹치면 마지막 카드가 처음 카드를 덮어 시작 카드가 양옆에 파묻히는 모순이 발생합니다. 본 컴포넌트는 마지막 #{N}번 카드를 동일한 형태와 좌표에서 CSS <code className="text-amber-300 font-mono bg-black/40 px-1 py-0.5 rounded">clip-path</code>로 좌우 50% 분할 렌더링하여, <strong>#{N-1}번 카드를 덮는 상위 레이어</strong>와 <strong>#1번 카드 밑으로 파고드는 하위 레이어</strong>를 동시에 구현해 모든 카드가 완벽히 균일하게 맞물리도록 제작되었습니다.
        </p>
      </div>
    </div>
  );
};

export default CircularTarotSpread;
