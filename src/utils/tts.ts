import { useState, useEffect } from 'react';
import {
  getSharedAudioContext,
  unlockAudioPlayback,
  playTTSAudio,
  playCompressedAudio,
  playRawPCM,
  primeTTSAudioElement,
  pauseTTSAudio,
  resumeTTSAudio,
  stopTTSPlayback,
  initTTSAudioLifecycle,
  analyzeTextEmotion,
  duckAmbientAudio,
} from '../lib/audio';
import { setTTSSessionActive, clearTTSSession, initTTSSessionHandlers } from '../lib/ttsMediaSession';
import { acquireScreenWakeLock, releaseScreenWakeLock } from '../lib/wakeLock';
import { prepareNaturalSpeechText } from './speechText';
import { isIOSDevice } from '../lib/perfMode';

// Pre-warm the browser's speechSynthesis engine to load premium voices asynchronously immediately on load
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

export function playNativeBrowserSpeech(
  cleanText: string,
  wait: boolean = false,
  sessionToVerify?: string | null,
  isSequenceChunk: boolean = false,
  voiceNameOrType: string = 'Kore',
): Promise<void> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return Promise.resolve();
  }

  // Cancel any existing speech only if not in a sequence chunk
  if (!isSequenceChunk) {
    window.speechSynthesis.cancel();
  }

  const isKorean = /[가-힣]/.test(cleanText);
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = isKorean ? 'ko-KR' : 'en-US';
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  const isMale =
    voiceNameOrType === 'Fenrir' ||
    voiceNameOrType === 'Charon' ||
    voiceNameOrType === 'Michael' ||
    voiceNameOrType === 'Guy' ||
    voiceNameOrType === 'onyx' ||
    voiceNameOrType === 'user' ||
    voiceNameOrType === 'male' ||
    voiceNameOrType === 'ko-KR-InJoonNeural' ||
    voiceNameOrType === 'en-US-GuyNeural';

  const voicesList = window.speechSynthesis.getVoices();
  const langCode = isKorean ? 'ko' : 'en';
  const langVoices = voicesList.filter((v) => v.lang.toLowerCase().startsWith(langCode));

  if (langVoices.length > 0) {
    const getVoiceScore = (voiceItem: SpeechSynthesisVoice) => {
      const name = voiceItem.name.toLowerCase();
      const isMaleVoiceName =
        name.includes('injoon') ||
        name.includes('minsu') ||
        name.includes('david') ||
        name.includes('guy') ||
        name.includes('mark') ||
        name.includes('george') ||
        name.includes('male') ||
        name.includes('남성');

      const isFemaleVoiceName =
        name.includes('sunhi') ||
        name.includes('heami') ||
        name.includes('yuna') ||
        name.includes('narae') ||
        name.includes('seoyeon') ||
        name.includes('sohee') ||
        name.includes('jiwon') ||
        name.includes('siri') ||
        name.includes('female') ||
        name.includes('여성') ||
        name.includes('kore') ||
        name.includes('aoede') ||
        name.includes('clara') ||
        name.includes('zira');

      if (isMale) {
        // User voice: Prioritize MALE voices
        if (isMaleVoiceName) {
          if (name.includes('injoon') || name.includes('guy')) return 120;
          return 100;
        }
        if (isFemaleVoiceName) return -1000;
        return 10;
      } else {
        // Lucy voice: MUST ALWAYS BE STRICTLY FEMALE!
        if (isMaleVoiceName) return -1000; // STRICTLY BAN male voices for Lucy
        if (isFemaleVoiceName) {
          if (name.includes('sunhi') || name.includes('heami') || name.includes('yuna') || name.includes('seoyeon') || name.includes('siri')) return 120;
          return 100;
        }
        return 10;
      }
    };

    const sorted = langVoices.sort((a, b) => getVoiceScore(b) - getVoiceScore(a));
    if (sorted.length > 0 && getVoiceScore(sorted[0]) > -500) {
      utterance.voice = sorted[0];
    }
  }

  updateTTSState({ isLoading: false, isSpeaking: true, activeText: cleanText });
  setTTSSessionActive(cleanText);

  // Chrome/iOS keepalive timer
  let keepAliveInterval: any = null;
  const startKeepAlive = () => {
    keepAliveInterval = setInterval(() => {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 8000);
  };
  const clearKeepAlive = () => {
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
      keepAliveInterval = null;
    }
  };

  return new Promise<void>((resolve) => {
    let isSettled = false;
    const finish = () => {
      if (isSettled) return;
      isSettled = true;
      clearKeepAlive();
      if (sessionToVerify && ttsState.activeSessionId === sessionToVerify && !isSequenceChunk) {
        stopTTS();
      }
      resolve();
    };

    utterance.onend = finish;
    utterance.onerror = finish;

    startKeepAlive();
    window.speechSynthesis.speak(utterance);

    if (!wait) {
      resolve();
    }
  });
}

export interface TTSState {
  isSpeaking: boolean;
  isLoading: boolean;
  activeText: string | null;
  activeFullText?: string | null;
  activeSessionId: string | null;
}

let ttsState: TTSState = {
  isSpeaking: false,
  isLoading: false,
  activeText: null,
  activeFullText: null,
  activeSessionId: null,
};

type TTSListener = (state: TTSState) => void;
const listeners = new Set<TTSListener>();

export const subscribeTTS = (listener: TTSListener) => {
  listeners.add(listener);
  // Emit current state immediately
  listener(ttsState);
  return () => {
    listeners.delete(listener);
  };
};

const updateTTSState = (newState: Partial<TTSState>) => {
  const prevActive = ttsState.isSpeaking || ttsState.isLoading;
  ttsState = { ...ttsState, ...newState };
  const nextActive = ttsState.isSpeaking || ttsState.isLoading;

  if (!prevActive && nextActive) {
    duckAmbientAudio(true, 0.3);
  } else if (prevActive && !nextActive) {
    duckAmbientAudio(false, 0.5);
  }

  listeners.forEach((l) => l(ttsState));
};

export interface TTSAudioData {
  audioContent: string;
  encoding: 'pcm' | 'mp3';
  sampleRate: number;
}

const ttsCache = new Map<string, Promise<TTSAudioData | null>>();

export function getTTSCacheKey(text: string, voice?: string, emotion?: string): string {
  const clean = normalizeTextForSpeech(text);
  return `${voice || 'default'}_${emotion || 'none'}_${clean}`;
}

export function prefetchTTS(text: string, voice?: string, emotion?: string): Promise<TTSAudioData | null> {
  const cleanText = normalizeTextForSpeech(text);
  if (!cleanText) return Promise.resolve(null);

  const key = getTTSCacheKey(text, voice, emotion);
  if (ttsCache.has(key)) {
    return ttsCache.get(key)!;
  }

  let activeEmotion = emotion;
  if (!activeEmotion) {
    const emotionMatch = text.match(/\[EMOTION:\s*([^\]]+)\]/i);
    if (emotionMatch) activeEmotion = emotionMatch[1].trim();
  }

  const promise = (async (): Promise<TTSAudioData | null> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, voice, emotion: activeEmotion }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        ttsCache.delete(key);
        return null;
      }
      const data = await response.json();
      if (data?.audioContent) {
        return {
          audioContent: data.audioContent,
          encoding: data.encoding === 'pcm' ? 'pcm' : 'mp3',
          sampleRate: data.sampleRate ?? 24000,
        };
      }
      ttsCache.delete(key);
      return null;
    } catch {
      ttsCache.delete(key);
      return null;
    }
  })();

  ttsCache.set(key, promise);
  return promise;
}

let isPlayingSequence = false;
let ttsLifecycleReady = false;

function ensureTTSLifecycle() {
  if (ttsLifecycleReady || typeof window === 'undefined') return;
  ttsLifecycleReady = true;
  initTTSAudioLifecycle();
  initTTSSessionHandlers(stopTTS);
}

export const pauseTTS = (): void => {
  updateTTSState({ isSpeaking: false, isLoading: false });
  pauseTTSAudio();
  if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
    window.speechSynthesis.pause();
  }
};

export const resumeTTS = (): void => {
  updateTTSState({ isSpeaking: true, isLoading: false });
  resumeTTSAudio();
  if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }
};

export const stopTTS = () => {
  isPlayingSequence = false;
  updateTTSState({ isSpeaking: false, isLoading: false, activeText: null, activeFullText: null, activeSessionId: null });
  stopTTSPlayback();
  clearTTSSession();
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

export function normalizeTextForSpeech(text: string): string {
  return prepareNaturalSpeechText(text);
}

export const playTTS = async (
  text: string,
  voice: string = 'Kore',
  wait: boolean = false,
  emotion?: string,
  sequenceSessionId?: string,
  isSequenceChunk: boolean = false,
  fullTextReference?: string,
): Promise<void> => {
  ensureTTSLifecycle();
  const cleanText = normalizeTextForSpeech(text);
  if (!cleanText) return;

  // If we are calling playTTS standalone (without wait / without sequence) and something is already loading/speaking for this exact text, second click stops it
  if (!wait && !sequenceSessionId && (ttsState.isSpeaking || ttsState.isLoading) && (ttsState.activeText === cleanText || ttsState.activeFullText === cleanText)) {
    stopTTS();
    return;
  }

  // Determine active session ID
  let mySessionId = sequenceSessionId;
  if (!mySessionId) {
    mySessionId = Math.random().toString();
    if (!wait) {
      stopTTS();
      updateTTSState({ isLoading: true, isSpeaking: false, activeText: cleanText, activeFullText: fullTextReference || cleanText, activeSessionId: mySessionId });
    } else {
      if (!ttsState.activeSessionId) {
        updateTTSState({ isLoading: true, isSpeaking: false, activeText: cleanText, activeFullText: fullTextReference || cleanText, activeSessionId: mySessionId });
      }
    }
  } else {
    // External caller (e.g. EFT cycle) provided a sequenceSessionId directly.
    // If no session is active yet, register it so abort-checks (activeSessionId !== sessionToVerify) don't fire immediately.
    if (!ttsState.activeSessionId) {
      updateTTSState({ isLoading: true, isSpeaking: false, activeText: cleanText, activeFullText: fullTextReference || cleanText, activeSessionId: mySessionId });
    }
  }

  const sessionToVerify = mySessionId;

  // Auto-extract emotion tag if not explicitly provided
  let activeEmotion = emotion;
  if (!activeEmotion) {
    const emotionMatch = text.match(/\[EMOTION:\s*([^\]]+)\]/i);
    if (emotionMatch) {
      activeEmotion = emotionMatch[1].trim();
    }
  }

  try {
    // Synchronously unlock audio during user gesture (required for mobile iOS/Android WebAudio playback)
    try {
      unlockAudioPlayback();
    } catch (e) {
      console.warn("[TTS] Failed to warm up audio systems:", e);
    }

    const cacheKey = getTTSCacheKey(text, voice, activeEmotion);
    let data: TTSAudioData | null = null;
    if (ttsCache.has(cacheKey)) {
      data = await ttsCache.get(cacheKey)!;
    }

    if (!data) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const response = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, voice, emotion: activeEmotion }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      // CRITICAL ABORT CHECK after async action
      if (sessionToVerify && ttsState.activeSessionId !== sessionToVerify) {
        console.log("[TTS] Playback aborted as active session changed mid-download.");
        return;
      }

      if (!response.ok) throw new Error('Failed to generate TTS');
      const rawData = await response.json();
      if (rawData?.audioContent) {
        data = {
          audioContent: rawData.audioContent,
          encoding: rawData.encoding === 'pcm' ? 'pcm' : 'mp3',
          sampleRate: rawData.sampleRate ?? 24000,
        };
        ttsCache.set(cacheKey, Promise.resolve(data));
      }
    }

    // CRITICAL ABORT CHECK after JSON parse
    if (sessionToVerify && ttsState.activeSessionId !== sessionToVerify) {
      console.log("[TTS] Playback aborted as active session changed mid-parse.");
      return;
    }

    // Now transition state from loading to speaking
    updateTTSState({
      isLoading: false,
      isSpeaking: true,
      activeText: cleanText,
      ...(fullTextReference ? { activeFullText: fullTextReference } : {}),
    });
    setTTSSessionActive(cleanText);

    if (data?.audioContent) {
      const encoding = data.encoding === 'pcm' ? 'pcm' : 'mp3';
      const playAudio = async () => {
        try {
          await playTTSAudio(
            data!.audioContent,
            encoding,
            data!.sampleRate ?? 24000,
            activeEmotion || cleanText,
            isSequenceChunk,
          );
        } catch (err) {
          console.warn('[TTS] playTTSAudio failed, applying WebAudio direct buffer fallback:', err);
          if (encoding === 'pcm') {
            await playRawPCM(data!.audioContent, data!.sampleRate ?? 24000);
          } else {
            await playCompressedAudio(data!.audioContent);
          }
        }
      };

      if (wait) {
        try {
          await playAudio();
        } finally {
          if (sessionToVerify && ttsState.activeSessionId === sessionToVerify && !isSequenceChunk) {
            stopTTS();
          }
        }
      } else {
        if (sessionToVerify && ttsState.activeSessionId !== sessionToVerify) return;
        playAudio()
          .then(() => {
            if (sessionToVerify && ttsState.activeSessionId === sessionToVerify && !isSequenceChunk) {
              stopTTS();
            }
          })
          .catch((err) => {
            console.warn('playTTS silent failure:', err);
            if (sessionToVerify && ttsState.activeSessionId === sessionToVerify && !isSequenceChunk) {
              stopTTS();
            }
          });
      }
      return;
    }
    throw new Error('No audio content returned');
  } catch (error) {
    if (sessionToVerify && ttsState.activeSessionId !== sessionToVerify) return;

    if (sequenceSessionId) {
      // In sequence streaming mode, retry up to 3 times with fresh requests to avoid skipping chunks and avoid voice switching
      for (let retryCount = 1; retryCount <= 3; retryCount++) {
        if (sessionToVerify && ttsState.activeSessionId !== sessionToVerify) return;
        try {
          console.warn(`[TTS] Sequence chunk API call attempt ${retryCount}/3 failed, retrying in ${retryCount * 300}ms...`, error);
          await new Promise((r) => setTimeout(r, retryCount * 300));
          const retryRes = await fetch('/api/ai/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: cleanText, voice, emotion: activeEmotion }),
          });
          if (retryRes.ok) {
            const retryData = await retryRes.json();
            if (retryData?.audioContent) {
              if (sessionToVerify && ttsState.activeSessionId !== sessionToVerify) return;
              updateTTSState({
                isLoading: false,
                isSpeaking: true,
                activeText: cleanText,
                ...(fullTextReference ? { activeFullText: fullTextReference } : {}),
              });
              setTTSSessionActive(cleanText);
              const encoding = retryData.encoding === 'pcm' ? 'pcm' : 'mp3';
              await playTTSAudio(retryData.audioContent, encoding, retryData.sampleRate ?? 24000, activeEmotion || cleanText, isSequenceChunk);
              return;
            }
          }
        } catch (retryErr) {
          console.warn(`[TTS] Sequence chunk retry ${retryCount} error:`, retryErr);
        }
      }
      // Never fall back to native robot speech in sequence mode to prevent abrupt voice change
      return;
    }

    console.warn('[TTS] API generation failed, falling back to Native Browser Speech...', error);
    return playNativeBrowserSpeech(cleanText, wait, sessionToVerify, isSequenceChunk, voice);
  }
};

/**
 * Splits any long reading (e.g. Tarot 78-cards reading, horoscope, meditation)
 * into optimal, sentence-safe chunks and streams them with active prefetching.
 * This guarantees zero cutoffs, zero network gaps, and rock-solid mobile audio continuity.
 */
export const playTTSInChunks = async (
  text: string,
  voice?: string,
  maxChunkLength = 220,
  emotion?: string,
): Promise<void> => {
  // If already speaking or loading this exact sequence, click again stops playback
  if (ttsState.isSpeaking || ttsState.isLoading) {
    stopTTS();
    return;
  }

  const cleanText = prepareNaturalSpeechText(text);
  if (!cleanText) return;

  // Split into natural sentence tokens at punctuation or newline
  const rawSentences = cleanText.match(/[^.!?。！？\n]+[.!?。！？\n]?/g) || [cleanText];
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of rawSentences) {
    const s = sentence.trim();
    if (!s) continue;

    // If a single sentence exceeds maxChunkLength, split on commas or spaces
    if (s.length > maxChunkLength) {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      const subClauses = s.split(/,\s*/);
      let subCurrent = '';
      for (const clause of subClauses) {
        const nextSub = subCurrent ? `${subCurrent}, ${clause}` : clause;
        if (subCurrent && nextSub.length > maxChunkLength) {
          chunks.push(subCurrent.trim() + (/[.!?]$/.test(subCurrent) ? '' : '.'));
          subCurrent = clause;
        } else {
          subCurrent = nextSub;
        }
      }
      if (subCurrent.trim()) {
        currentChunk = subCurrent.trim();
      }
      continue;
    }

    const next = currentChunk ? `${currentChunk} ${s}` : s;
    if (currentChunk && next.length > maxChunkLength) {
      chunks.push(currentChunk.trim());
      currentChunk = s;
    } else {
      currentChunk = next;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  if (chunks.length === 0) return;

  // Start sequence session
  stopTTS();
  const sequenceSessionId = `seq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  updateTTSState({
    isLoading: true,
    isSpeaking: true,
    activeText: chunks[0] || cleanText.slice(0, 50),
    activeFullText: cleanText,
    activeSessionId: sequenceSessionId,
  });
  isPlayingSequence = true;
  acquireScreenWakeLock().catch(() => {});

  try {
    // Prime the audio context and element during user click
    try {
      const ctx = getSharedAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      primeTTSAudioElement();
    } catch (_) {}

    // Pre-fetch the very next upcoming chunk ahead of playback
    if (chunks.length > 1) {
      prefetchTTS(chunks[1], voice, emotion).catch(() => {});
    }

    for (let i = 0; i < chunks.length; i++) {
      if (ttsState.activeSessionId !== sequenceSessionId || !isPlayingSequence) {
        break;
      }

      // Proactively pre-fetch next upcoming chunk in advance
      if (i + 1 < chunks.length) {
        prefetchTTS(chunks[i + 1], voice, emotion).catch(() => {});
      }

      const isLastChunk = i === chunks.length - 1;
      await playTTS(
        chunks[i],
        voice,
        true,
        emotion,
        sequenceSessionId,
        !isLastChunk, // keep session alive until final chunk
        cleanText,    // preserve activeFullText for UI synchronization
      );

      if (ttsState.activeSessionId !== sequenceSessionId || !isPlayingSequence) {
        break;
      }

      // Micro-pause between sentences (80ms) for natural human speech rhythm
      if (!isLastChunk) {
        await new Promise((resolve) => setTimeout(resolve, 80));
      }
    }
  } catch (err) {
    console.error("[TTS] playTTSInChunks sequence error:", err);
  } finally {
    if (ttsState.activeSessionId === sequenceSessionId) {
      isPlayingSequence = false;
      stopTTS();
    }
  }
};

export const playConversation = async (
  messages: { role: string; content: string; id?: string }[],
  aiVoice: string = 'Kore',
  userVoice: string = 'Fenrir',
  onMessageStart?: (index: number, msg: { role: string; content: string; id?: string }) => void,
) => {
  // If we are already speaking or loading, click again to stop
  if (ttsState.isSpeaking || ttsState.isLoading) {
    stopTTS();
    return;
  }

  stopTTS();
  const mySessionId = Math.random().toString();
  updateTTSState({ isLoading: true, isSpeaking: false, activeText: '__CONVERSATION__', activeSessionId: mySessionId });
  isPlayingSequence = true;
  acquireScreenWakeLock().catch(() => {});

  // 화자(루시 AI: Kore)와 타자(사용자: Fenrir)의 음성을 명확히 분리 및 배치
  const resolvedAiVoice = aiVoice || 'Kore';
  const resolvedUserVoice = userVoice || 'Fenrir';

  try {
    for (let i = 0; i < messages.length; i++) {
      if (ttsState.activeSessionId !== mySessionId) break;
      const m = messages[i];
      const isUser = m.role === 'user';
      const voice = isUser ? resolvedUserVoice : resolvedAiVoice;

      if (onMessageStart) {
        onMessageStart(i, m);
      }

      await playTTS(m.content, voice, true);
      if (ttsState.activeSessionId !== mySessionId) break;

      // Natural pause between speaker turns
      if (i < messages.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
    }
  } catch (err) {
    console.error("[TTS] playConversation error:", err);
  } finally {
    if (ttsState.activeSessionId === mySessionId) {
      isPlayingSequence = false;
      stopTTS();
    }
  }
};

export const useTTSActive = () => {
  const [active, setActive] = useState(false);
  useEffect(() => {
    return subscribeTTS((state) => {
      setActive(state.isSpeaking || state.isLoading);
    });
  }, []);
  return active;
};
