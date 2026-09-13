import { useEffect, useRef } from 'react';
import { savePendingSelection, clearPendingSelection, getLiveSelectedText } from '../lib/selectionBridge';

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
 * - 일반 본문 텍스트뿐만 아니라 input, textarea (빈칸 입력창) 및 모든 텍스트 선택(스크롤)을 포착하여
 *   빅뱅 버튼 토스 연동 및 자동 복사 파이프라인을 백그라운드에서 안전하게 구동합니다.
 * - 스크롤 취소/해제 시 clearPendingSelection()을 호출하여 대기 토스 모드를 안전하게 초기화합니다.
 */
export default function SelectionBridgeToolbar({ currentPath: _currentPath }: SelectionBridgeToolbarProps) {
  const lastCopiedTextRef = useRef<string>('');

  useEffect(() => {
    let debounceTimer: NodeJS.Timeout | null = null;

    const handleSelectionChange = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (typeof window === 'undefined') return;

        // 🌟 일반 본문 및 input/textarea 빈칸 입력창 내부 선택 텍스트까지 포괄 추출
        const text = getLiveSelectedText();

        // 🎯 스크롤(선택) 취소 감지:
        // 선택이 없거나 해제되었거나 2글자 미만이면 대기 토스모드 즉시 정리
        if (!text || text.length < 2) {
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
      }, 80);
    };

    const handleDocumentMouseDown = (e: MouseEvent | TouchEvent) => {
      // 🛡️ 빅뱅 버튼이나 토스 조작 트리거를 클릭/터치할 때는 selection을 지우지 않고 유지!
      const target = e.target as HTMLElement | null;
      if (target?.closest?.('#bigbang-omnibutton, [data-bigbang], [data-no-clear-selection]')) {
        return;
      }

      setTimeout(() => {
        const text = getLiveSelectedText();
        if (!text || text.length < 2) {
          clearPendingSelection();
        }
      }, 120);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearPendingSelection();
      }
    };

    // 브라우저 텍스트 선택 관련 다각도 이벤트 리스너 등록
    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('mouseup', handleSelectionChange);
    document.addEventListener('touchend', handleSelectionChange);
    document.addEventListener('keyup', handleSelectionChange);
    // 💡 input / textarea 등 빈칸 내부 드래그 선택 시 발생하는 select 이벤트 (capture 모드로 감지)
    document.addEventListener('select', handleSelectionChange, true);

    document.addEventListener('mousedown', handleDocumentMouseDown);
    document.addEventListener('touchstart', handleDocumentMouseDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('mouseup', handleSelectionChange);
      document.removeEventListener('touchend', handleSelectionChange);
      document.removeEventListener('keyup', handleSelectionChange);
      document.removeEventListener('select', handleSelectionChange, true);

      document.removeEventListener('mousedown', handleDocumentMouseDown);
      document.removeEventListener('touchstart', handleDocumentMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // 🎯 스크롤할 때 선택 영역 위에 일체의 배지나 툴바를 노출하지 않음
  return null;
}
