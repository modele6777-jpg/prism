import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Sparkles, Brain, X, Shuffle } from 'lucide-react';
import { savePendingSelection } from '../lib/selectionBridge';
import {
  getRecommendedMenu,
  tossSelectionToMenu,
  type RecommendedMenuResult,
} from '../lib/selectionContextRecommender';

export default function SelectionBridgeToolbar() {
  const [location, navigate] = useLocation();
  const [selectedText, setSelectedText] = useState('');
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);
  const [cycleOffset, setCycleOffset] = useState(0);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // We only show toolbar if not already on the chat or orb page with the same query
  const isExcludedPage =
    location === '/chat' ||
    location === '/lucy' ||
    location === '/orb' ||
    location === '/crystal' ||
    location === '/gateway';

  // 실시간 맥락 감지 및 20대 메뉴 중 최적의 추천 경로 산출
  const recommendedResult: RecommendedMenuResult = useMemo(() => {
    return getRecommendedMenu(selectedText, location, cycleOffset);
  }, [selectedText, location, cycleOffset]);

  useEffect(() => {
    let debounceTimer: NodeJS.Timeout | null = null;

    const handleSelectionChange = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (typeof window === 'undefined') return;
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) {
          // If collapsed, don't immediately hide if user is clicking inside our toolbar
          return;
        }

        const text = selection.toString().trim();
        // Ignore if text is too short or inside input/textarea
        if (text.length < 2) return;

        const anchorNode = selection.anchorNode;
        const parentElem =
          anchorNode?.nodeType === Node.ELEMENT_NODE
            ? (anchorNode as Element)
            : anchorNode?.parentElement;

        if (parentElem?.closest('input, textarea, [contenteditable="true"]')) {
          return;
        }

        // Always save to pending storage automatically so navigation via header/menu picks it up!
        savePendingSelection(text, undefined, window.location.pathname);
        setSelectedText(text);

        if (!isExcludedPage) {
          try {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              // Position slightly above selection, or clamp to viewport
              const toolbarWidth = 440;
              const x = Math.max(
                12,
                Math.min(window.innerWidth - toolbarWidth, rect.left + rect.width / 2 - toolbarWidth / 2)
              );
              const y = rect.top > 80 ? rect.top - 54 : rect.bottom + 12;
              setCoords({ x, y });
              setVisible(true);
            }
          } catch (_) {
            setCoords(null);
            setVisible(true);
          }
        }
      }, 120);
    };

    const handleDocumentMouseDown = (e: MouseEvent) => {
      if (toolbarRef.current && toolbarRef.current.contains(e.target as Node)) {
        return;
      }
      // Check if selection is cleared
      setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || !sel.toString().trim()) {
          setVisible(false);
        }
      }, 150);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('mouseup', handleSelectionChange);
    document.addEventListener('mousedown', handleDocumentMouseDown);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('mouseup', handleSelectionChange);
      document.removeEventListener('mousedown', handleDocumentMouseDown);
    };
  }, [isExcludedPage]);

  if (!visible || !selectedText || isExcludedPage) return null;

  // 🌟 20대 메뉴 중 맥락 감지 기반 동적 추천 경로로 즉각 토스 & 이동
  const handleGoRecommended = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    tossSelectionToMenu(selectedText, recommendedResult.menu, location, navigate);
    setVisible(false);
  };

  // 🔀 다른 추천 경로 순환 (상시 다른 추천경로 즉각 전환)
  const handleReroll = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCycleOffset((prev) => prev + 1);
  };

  const handleGoLucy = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    savePendingSelection(selectedText, 'lucy', location);
    setVisible(false);
    navigate('/chat');
  };

  const handleGoOrb = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    savePendingSelection(selectedText, 'orb', location);
    setVisible(false);
    navigate('/orb');
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setVisible(false);
  };

  return (
    <div
      ref={toolbarRef}
      id="selection-bridge-floating-toolbar"
      style={
        coords
          ? { left: `${coords.x}px`, top: `${coords.y}px` }
          : { left: '50%', transform: 'translateX(-50%)', bottom: '80px' }
      }
      className="fixed z-[9999] flex items-center gap-1.5 p-1.5 rounded-full bg-slate-950/95 backdrop-blur-xl border border-white/20 shadow-[0_12px_40px_rgba(0,0,0,0.6)] transition-all duration-200 animate-in fade-in zoom-in-95 select-none max-w-[96vw] overflow-x-auto no-scrollbar ring-1 ring-white/10"
    >
      {/* 1. 맥락 감지 기반 20대 메뉴 동적 추천 버튼 */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          id="selection-bridge-btn-recommended"
          onClick={handleGoRecommended}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${recommendedResult.menu.buttonClass} border ${recommendedResult.menu.borderClass} text-xs font-bold tracking-tight transition-all active:scale-95 shadow-md group`}
          title={`${recommendedResult.contextReason} (클릭 시 해당 메뉴로 즉시 토스)`}
        >
          <span className="text-sm shrink-0 drop-shadow">{recommendedResult.menu.emoji}</span>
          <span className="truncate max-w-[125px] sm:max-w-none">{recommendedResult.menu.name}</span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-white/20 text-white shrink-0 border border-white/25 shadow-sm">
            ✨ 추천
          </span>
        </button>

        {/* 🔀 상시 다른 추천 경로로 교체 (셔플/순환 버튼) */}
        <button
          id="selection-bridge-btn-reroll"
          onClick={handleReroll}
          className="w-7 h-7 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/15 border border-white/10 transition-colors shrink-0 active:scale-90"
          title={`다른 추천 경로로 교체 (${recommendedResult.currentIndex + 1}/${recommendedResult.totalCandidates}) - 20가지 메뉴 중 순환`}
        >
          <Shuffle size={12} className="opacity-80" />
        </button>
      </div>

      {/* 세로 구분선 */}
      <div className="w-px h-4 bg-white/20 mx-0.5 shrink-0" />

      {/* 2. 루시 이성 분석 버튼 */}
      <button
        id="selection-bridge-btn-lucy"
        onClick={handleGoLucy}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 hover:text-cyan-100 border border-cyan-400/30 text-xs font-semibold tracking-tight transition-all active:scale-95 shrink-0"
        title="선택한 내용을 루시 채팅으로 보내 이성적·좌뇌적 심층 분석 받기"
      >
        <Brain size={13} className="text-cyan-300 animate-pulse" />
        <span className="hidden sm:inline">루시 이성 분석</span>
        <span className="sm:hidden">루시</span>
      </button>

      {/* 3. 오브 감성 신탁 버튼 */}
      <button
        id="selection-bridge-btn-orb"
        onClick={handleGoOrb}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 hover:text-purple-100 border border-purple-400/30 text-xs font-semibold tracking-tight transition-all active:scale-95 shrink-0"
        title="선택한 내용을 크리스탈 오브로 보내 감성적·우뇌적 무의식 신탁 받기"
      >
        <Sparkles size={13} className="text-purple-300 animate-pulse" />
        <span className="hidden sm:inline">오브 감성 신탁</span>
        <span className="sm:hidden">오브</span>
      </button>

      {/* 4. 닫기 버튼 */}
      <button
        id="selection-bridge-btn-close"
        onClick={handleClose}
        className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-0.5 shrink-0"
        title="닫기"
      >
        <X size={13} />
      </button>
    </div>
  );
}
