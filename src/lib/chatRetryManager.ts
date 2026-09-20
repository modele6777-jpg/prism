/**
 * =========================================================================
 * PRISM & LUCY: 채팅 통신 복원력 및 로컬 임시 저장 관리자 (Chat Retry & Offline Engine)
 * =========================================================================
 * - 일시적 네트워크 단절, 지연, 502/503/504 게이트웨이 오류 발생 시 지수 백오프(Exponential Backoff with Jitter) 재시도
 * - 사용자 입력 실시간 로컬 임시 저장(Draft Auto-Save) 및 비정상 종료 후 자동 복원
 * - 전송 실패 메시지 로컬 큐잉(Pending Queue) 및 원클릭 재전송 지원
 * - 온라인/오프라인 네트워크 상태 실시간 감지
 */

import { safeLocalStorage } from '../utils/safeStorage';
import type { PersonaType } from '../contexts/AppContext';

export interface PendingChatMessage {
  id: string;
  userText: string;
  persona: PersonaType;
  channels?: string[];
  mode?: string;
  keyExerciseIndex?: number;
  imageUrl?: string;
  timestamp: number;
  status: 'pending' | 'retrying' | 'failed' | 'success';
  retryCount: number;
  lastError?: string;
}

const STORAGE_KEYS = {
  INPUT_DRAFT: 'lucy_chat_active_input_draft',
  PENDING_QUEUE: 'lucy_chat_pending_queue_v1',
};

// ============================================================================
// 1. 사용자 입력(Draft) 실시간 로컬 임시 저장 및 복원
// ============================================================================

export function saveChatInputDraft(draft: string): void {
  try {
    if (!draft || !draft.trim()) {
      safeLocalStorage.removeItem(STORAGE_KEYS.INPUT_DRAFT);
    } else {
      safeLocalStorage.setItem(STORAGE_KEYS.INPUT_DRAFT, draft);
    }
  } catch (e) {
    console.warn('[ChatRetryManager] Failed to save input draft:', e);
  }
}

export function loadChatInputDraft(): string {
  try {
    return safeLocalStorage.getItem(STORAGE_KEYS.INPUT_DRAFT) || '';
  } catch {
    return '';
  }
}

export function clearChatInputDraft(): void {
  try {
    safeLocalStorage.removeItem(STORAGE_KEYS.INPUT_DRAFT);
  } catch (_) {}
}

// ============================================================================
// 2. 전송 메시지 로컬 임시 저장 큐 (Pending Message Queue)
// ============================================================================

export function getPendingChatMessages(): PendingChatMessage[] {
  try {
    const raw = safeLocalStorage.getItem(STORAGE_KEYS.PENDING_QUEUE);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePendingChatMessage(message: PendingChatMessage): void {
  try {
    const queue = getPendingChatMessages().filter((m) => m.id !== message.id);
    queue.push(message);
    // 최대 20개까지만 보관하여 용량 관리
    const trimmed = queue.slice(-20);
    safeLocalStorage.setItem(STORAGE_KEYS.PENDING_QUEUE, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('[ChatRetryManager] Failed to save pending message:', e);
  }
}

export function removePendingChatMessage(id: string): void {
  try {
    const queue = getPendingChatMessages().filter((m) => m.id !== id);
    safeLocalStorage.setItem(STORAGE_KEYS.PENDING_QUEUE, JSON.stringify(queue));
  } catch (e) {
    console.warn('[ChatRetryManager] Failed to remove pending message:', e);
  }
}

export function updatePendingChatMessageStatus(
  id: string,
  status: PendingChatMessage['status'],
  error?: string
): void {
  try {
    const queue = getPendingChatMessages().map((m) => {
      if (m.id === id) {
        return {
          ...m,
          status,
          retryCount: status === 'retrying' ? m.retryCount + 1 : m.retryCount,
          lastError: error || m.lastError,
          timestamp: Date.now(),
        };
      }
      return m;
    });
    safeLocalStorage.setItem(STORAGE_KEYS.PENDING_QUEUE, JSON.stringify(queue));
  } catch (e) {
    console.warn('[ChatRetryManager] Failed to update pending message status:', e);
  }
}

// ============================================================================
// 3. 지수 백오프(Exponential Backoff with Jitter) 재시도 엔진
// ============================================================================

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  shouldRetry?: (error: any) => boolean;
  onRetry?: (attempt: number, delayMs: number, error: any) => void;
  signal?: AbortSignal;
}

/**
 * 일시적인 네트워크 오류인지 검사
 */
export function isTransientNetworkError(err: any): boolean {
  if (!err) return false;
  if (err.name === 'AbortError') return false;

  const msg = (err?.message || String(err)).toLowerCase();

  // 사용자 수동 중단
  if (msg.includes('aborted') || msg.includes('user cancelled')) return false;

  // 영구적 인증 및 크레딧 소진 오류는 재시도 불가
  if (msg.includes('resource_exhausted') || msg.includes('prepayment credits') || msg.includes('unauthenticated') || msg.includes('401')) {
    return false;
  }

  // 일시적 네트워크 오류 키워드
  return (
    msg.includes('failed to fetch') ||
    msg.includes('network') ||
    msg.includes('networkerror') ||
    msg.includes('load failed') ||
    msg.includes('timeout') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout') ||
    msg.includes('socket') ||
    msg.includes('502') ||
    msg.includes('503') ||
    msg.includes('504') ||
    msg.includes('429') ||
    msg.includes('stream max duration reached') ||
    msg.includes('stream idle timeout') ||
    msg.includes('all streaming models failed')
  );
}

/**
 * 지수 백오프 재시도 함수
 */
export async function retryWithBackoff<T>(
  fn: (attempt: number) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 8000,
    backoffFactor = 2,
    shouldRetry = isTransientNetworkError,
    onRetry,
    signal,
  } = options;

  let attempt = 0;

  while (true) {
    if (signal?.aborted) {
      throw new Error('Operation aborted');
    }

    try {
      return await fn(attempt);
    } catch (err: any) {
      attempt++;

      if (attempt > maxRetries || !shouldRetry(err) || signal?.aborted) {
        throw err;
      }

      // 지수 백오프 계산 + Jitter (지연 분산으로 서버 폭풍 요청 방지)
      const exponentialDelay = initialDelayMs * Math.pow(backoffFactor, attempt - 1);
      const jitter = Math.random() * 400;
      const delayMs = Math.min(exponentialDelay + jitter, maxDelayMs);

      console.warn(`[ChatRetryManager] Transient network error (attempt ${attempt}/${maxRetries}). Retrying in ${Math.round(delayMs)}ms...`, err?.message || err);

      if (onRetry) {
        try {
          onRetry(attempt, delayMs, err);
        } catch (_) {}
      }

      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          if (signal) signal.removeEventListener('abort', onAbort);
          resolve();
        }, delayMs);

        const onAbort = () => {
          clearTimeout(timer);
          reject(new Error('Operation aborted during backoff'));
        };

        if (signal) {
          if (signal.aborted) {
            clearTimeout(timer);
            reject(new Error('Operation aborted during backoff'));
            return;
          }
          signal.addEventListener('abort', onAbort, { once: true });
        }
      });
    }
  }
}

// ============================================================================
// 4. 온라인/오프라인 네트워크 상태 실시간 감지기
// ============================================================================

export function isOnline(): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.onLine === 'undefined') {
    return true;
  }
  return navigator.onLine;
}

export function subscribeNetworkStatus(callback: (online: boolean) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
