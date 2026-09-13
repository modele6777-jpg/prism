/**
 * selectionBridge.ts
 * 앱 내 텍스트 선택(드래그) 감지 및 루시 채팅/크리스탈 오브 즉시 연동 브릿지
 */

export interface DraggedSelectionContext {
  text: string;
  timestamp: number;
  sourcePath?: string;
  target?: 'lucy' | 'orb' | string;
  targetMenuId?: string;
  targetPath?: string;
  contextReason?: string;
}

const SELECTION_STORAGE_KEY = 'prism_dragged_selection_context';
const MAX_VALIDITY_MS = 10 * 60 * 1000; // 10분 유효

/**
 * 선택된 텍스트를 세션 스토리지에 안전하게 저장
 */
export function savePendingSelection(
  text: string,
  target?: 'lucy' | 'orb' | string,
  sourcePath?: string,
  extra?: Partial<DraggedSelectionContext>
): void {
  if (!text || text.trim().length < 2) return;
  try {
    const payload: DraggedSelectionContext = {
      text: text.trim(),
      timestamp: Date.now(),
      sourcePath: sourcePath || (typeof window !== 'undefined' ? window.location.pathname : undefined),
      target,
      ...(extra || {})
    };
    sessionStorage.setItem(SELECTION_STORAGE_KEY, JSON.stringify(payload));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('prism:selection_saved', { detail: payload }));
    }
  } catch (e) {
    console.warn('[SelectionBridge] Failed to save selection:', e);
  }
}

/**
 * 대기 중인 선택 텍스트를 가져오고 즉시 소모(삭제)
 */
export function getAndClearPendingSelection(): DraggedSelectionContext | null {
  try {
    const raw = sessionStorage.getItem(SELECTION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraggedSelectionContext;
    sessionStorage.removeItem(SELECTION_STORAGE_KEY);

    if (Date.now() - parsed.timestamp > MAX_VALIDITY_MS) {
      return null;
    }
    return parsed;
  } catch (e) {
    console.warn('[SelectionBridge] Failed to get pending selection:', e);
    return null;
  }
}

/**
 * 현재 선택된 텍스트 가져오기 (소모하지 않음)
 */
export function peekPendingSelection(): DraggedSelectionContext | null {
  try {
    const raw = sessionStorage.getItem(SELECTION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraggedSelectionContext;
    if (Date.now() - parsed.timestamp > MAX_VALIDITY_MS) {
      sessionStorage.removeItem(SELECTION_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch (_) {
    return null;
  }
}
