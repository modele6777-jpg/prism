import { useEffect, useRef } from 'react';
import { savePendingSelection, clearPendingSelection } from '../lib/selectionBridge';

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
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.warn('[Clipboard] Failed to copy text:', err);
    return false;
  }
};

interface SelectionBridgeToolbarProps {
  currentPath?: string;
}

/**
 * 🌟 SelectionBridgeToolbar (선택 텍스트 백그라운드 브릿지)
 * - 사용자가 텍스트를 스크롤(선택)할 때 글자 위에 시각적 플로팅 배지를 띄우지 않고,
 *   빅뱅 버튼 토스 연동 및 자동 복사 파이프라인만 안전하게 백그라운드에서 실행합니다.
 * - 스크롤 취소/해제 시 clearPendingSelection()을 호출하여 대기 토스 모드를 즉각 초기화합니다.
 */
export default function SelectionBridgeToolbar({ currentPath }: SelectionBridgeToolbarProps) {
  const lastCopiedTextRef = useRef<string>('');

  useEffect(() => {
    let debounceTimer: NodeJS.Timeout | null = null;

    const handleSelectionChange = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (typeof window === 'undefined') return;
        const selection = window.getSelection();

        // 🎯 스크롤(선택) 취소 감지:
        // 선택이 없거나 해제(isCollapsed)되었거나 비어있으면 자동 토스모드 즉시 취소!
        if (!selection || selection.isCollapsed || !selection.toString().trim()) {
          clearPendingSelection();
          return;
        }

        const text = selection.toString().trim();
        // 2글자 미만 또는 인풋/텍스트에어리어 내부일 때도 취소
        if (text.length < 2) {
          clearPendingSelection();
          return;
        }

        const anchorNode = selection.anchorNode;
        const parentElem =
          anchorNode?.nodeType === Node.ELEMENT_NODE
            ? (anchorNode as Element)
            : anchorNode?.parentElement;

        if (parentElem?.closest('input, textarea, [contenteditable="true"]')) {
          clearPendingSelection();
          return;
        }

        // 유효한 선택 텍스트 백그라운드 저장 (빅뱅 버튼 연동용)
        savePendingSelection(text, undefined, window.location.pathname);

        // 📋 스크롤/선택 시 클립보드에 자동 복사
        if (text && lastCopiedTextRef.current !== text) {
          lastCopiedTextRef.current = text;
          copyToClipboard(text);
        }
      }, 100);
    };

    const handleDocumentMouseDown = () => {
      setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || !sel.toString().trim()) {
          clearPendingSelection();
        }
      }, 120);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearPendingSelection();
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('mouseup', handleSelectionChange);
    document.addEventListener('mousedown', handleDocumentMouseDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('mouseup', handleSelectionChange);
      document.removeEventListener('mousedown', handleDocumentMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // 🎯 스크롤할 때 선택 영역 위에 일체의 배지나 툴바를 노출하지 않음
  return null;
}
