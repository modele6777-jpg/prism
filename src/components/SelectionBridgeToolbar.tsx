import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { Sparkles, Brain, X } from 'lucide-react';
import { savePendingSelection } from '../lib/selectionBridge';

export default function SelectionBridgeToolbar() {
  const [location, navigate] = useLocation();
  const [selectedText, setSelectedText] = useState('');
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // We only show toolbar if not already on the chat or orb page with the same query
  const isExcludedPage = location === '/chat' || location === '/lucy' || location === '/orb' || location === '/crystal' || location === '/gateway';

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
        const parentElem = anchorNode?.nodeType === Node.ELEMENT_NODE 
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
              const x = Math.max(16, Math.min(window.innerWidth - 300, rect.left + rect.width / 2 - 140));
              const y = rect.top > 80 ? rect.top - 52 : rect.bottom + 12;
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
      className={`fixed z-[9999] flex items-center gap-1.5 p-1.5 rounded-full bg-slate-900/95 backdrop-blur-md border border-white/20 shadow-2xl transition-all duration-200 animate-in fade-in zoom-in-95 select-none max-w-[95vw]`}
    >
      <button
        id="selection-bridge-btn-lucy"
        onClick={handleGoLucy}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 hover:text-cyan-100 border border-cyan-400/30 text-xs font-semibold tracking-tight transition-all active:scale-95"
        title="선택한 내용을 루시 채팅으로 보내 이성적·좌뇌적 심층 분석 받기"
      >
        <Brain size={14} className="text-cyan-300 animate-pulse" />
        <span>루시 이성 분석</span>
      </button>

      <button
        id="selection-bridge-btn-orb"
        onClick={handleGoOrb}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 hover:text-purple-100 border border-purple-400/30 text-xs font-semibold tracking-tight transition-all active:scale-95"
        title="선택한 내용을 크리스탈 오브로 보내 감성적·우뇌적 무의식 신탁 받기"
      >
        <Sparkles size={14} className="text-purple-300 animate-pulse" />
        <span>오브 감성 신탁</span>
      </button>

      <button
        id="selection-bridge-btn-close"
        onClick={handleClose}
        className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-0.5"
        title="닫기"
      >
        <X size={13} />
      </button>
    </div>
  );
}
