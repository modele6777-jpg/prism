import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Sparkles, Brain, X, Shuffle, Check, Copy } from 'lucide-react';
import { savePendingSelection } from '../lib/selectionBridge';
import {
  getRecommendedMenu,
  tossSelectionToMenu,
  type RecommendedMenuResult,
} from '../lib/selectionContextRecommender';

/**
 * 텍스트 클립보드 즉시 복사 유틸리티 (브라우저 및 보안 컨텍스트 호환)
 */
const copyToClipboard = async (textToCopy: string): Promise<boolean> => {
  if (!textToCopy) return false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(textToCopy);
      return true;
    }
  } catch (_) {
    // fallback 아래로 진행
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = textToCopy;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (_) {
    return false;
  }
};

export default function SelectionBridgeToolbar() {
  const [location, navigate] = useLocation();
  const [selectedText, setSelectedText] = useState('');
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);
  const [cycleOffset, setCycleOffset] = useState(0);
  const [copied, setCopied] = useState(false);
  const lastCopiedTextRef = useRef<string>('');
  const copyToastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // We only show toolbar if not already on the chat or orb page with the same query
  const isExcludedPage =
    location === '/chat' ||
    location === '/lucy' ||
    location === '/orb' ||
    location === '/crystal' ||
    location === '/gateway';

  // 실시간 맥락 감지 및 20대 메뉴 중 무작위 셔플된 추천 후보군 산출
  const recommendedResult: RecommendedMenuResult = useMemo(() => {
    return getRecommendedMenu(selectedText, location, cycleOffset);
  }, [selectedText, location, cycleOffset]);

  useEffect(() => {
    return () => {
      if (copyToastTimerRef.current) clearTimeout(copyToastTimerRef.current);
    };
  }, []);

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

        // 📋 스크롤/선택 시 바로 클립보드에 자동 복사
        if (text && lastCopiedTextRef.current !== text) {
          lastCopiedTextRef.current = text;
          copyToClipboard(text).then((ok) => {
            if (ok) {
              setCopied(true);
              if (copyToastTimerRef.current) clearTimeout(copyToastTimerRef.current);
              copyToastTimerRef.current = setTimeout(() => setCopied(false), 2000);
            }
          });
        }

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

  // 🌟 추천 메뉴 클릭 시 즉각 토스 & 이동 핸들러
  const handleSelectMenu = (menu: any) => (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    tossSelectionToMenu(selectedText, menu, location, navigate);
    setVisible(false);
  };

  // 🔀 다른 추천 경로 순환 (상시 다른 추천경로 즉각 전환)
  const handleReroll = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCycleOffset((prev) => prev + 1);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setVisible(false);
  };

  const top3 = recommendedResult.top3 || [];

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
      {/* 🌟 맥락 감지 기반 무작위 셔플된 추천 경로 목록 (순위 표시는 완전히 가림) */}
      <div className="flex items-center gap-1.5 shrink-0">
        {top3.map((item, idx) => (
          <button
            key={item.menu.id}
            id={`selection-bridge-btn-opt-${idx}`}
            onClick={handleSelectMenu(item.menu)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${item.menu.buttonClass} border ${item.menu.borderClass} text-xs font-bold tracking-tight transition-all active:scale-95 shadow-md group shrink-0`}
            title={`${item.menu.name}: ${item.contextReason} (클릭 시 이동)`}
          >
            <span className="text-sm shrink-0 drop-shadow">{item.menu.emoji}</span>
            <span className="truncate max-w-[110px] sm:max-w-none">{item.menu.name}</span>
          </button>
        ))}

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

      {/* 📋 바로 자동 복사 완료 뱃지 피드백 */}
      {copied && (
        <div
          className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/25 border border-emerald-400/40 text-[10px] font-bold text-emerald-300 animate-in fade-in shrink-0 shadow-sm"
          title="선택한 텍스트가 클립보드에 자동으로 복사되었습니다."
        >
          <Check size={11} className="text-emerald-400" />
          <span>복사됨</span>
        </div>
      )}

      {/* 세로 구분선 */}
      <div className="w-px h-4 bg-white/20 mx-0.5 shrink-0" />

      {/* 💡 빅뱅 버튼 연동 가이드 뱃지 (글자 스크롤 후 빅뱅 버튼 탭=루시, 홀드=오브 안내) */}
      <div
        className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/10 text-[11px] text-slate-300 font-medium shrink-0"
        title="글자를 스크롤한 상태에서 화면의 빅뱅 버튼을 탭하면 루시 대화로, 홀드하면 크리스탈 오브로 선택 내용이 즉시 연결됩니다."
      >
        <span className="text-xs">💥</span>
        <span className="text-white/60">빅뱅:</span>
        <span className="text-cyan-300 font-semibold">탭➔루시</span>
        <span className="text-white/30">·</span>
        <span className="text-purple-300 font-semibold">홀드➔오브</span>
      </div>

      {/* 닫기 버튼 */}
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

