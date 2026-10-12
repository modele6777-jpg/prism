import React, { useMemo } from 'react';
import { useTTSState } from '@/utils/tts';

/**
 * Clean string for fuzzy speech-to-text sentence alignment.
 * Strips all whitespace, punctuation, quotes, markdown formatting, emojis.
 */
export function cleanSentenceForMatching(s: string): string {
  if (!s) return '';
  return s
    .replace(/\[(?:EMOTION|YOUTUBE|TOOL|IMAGE|PROMPT|STAGE|SOUL_UPDATE|CARD_DRAWN|SYSTEM):[\s\S]*?\]/gi, '')
    .replace(/[*_~`#>\[\]():;·•|/\\-]/g, ' ')
    .replace(/(?:첫\s*번째|첫째|제\s*1\s*장|1\s*번|1\s*단계|챕터\s*1)/gi, '1')
    .replace(/(?:두\s*번째|둘째|제\s*2\s*장|2\s*번|2\s*단계|챕터\s*2)/gi, '2')
    .replace(/(?:세\s*번째|셋째|제\s*3\s*장|3\s*번|3\s*단계|챕터\s*3)/gi, '3')
    .replace(/(?:네\s*번째|넷째|제\s*4\s*장|4\s*번|4\s*단계|챕터\s*4)/gi, '4')
    .replace(/(?:다섯\s*번째|다섯째|제\s*5\s*장|5\s*번|5\s*단계|챕터\s*5)/gi, '5')
    .replace(/[^가-힣a-zA-Z0-9]/g, '')
    .toLowerCase();
}

/**
 * Tests whether a given sentence segment matches the currently active TTS sentence/chunk.
 * Supports full sentences, titles (제목), subtitles (부제목), and section labels.
 */
export function isSentenceActive(sentence: string, activeText: string | null | undefined): boolean {
  if (!activeText || !sentence) return false;
  const cleanS = cleanSentenceForMatching(sentence);
  const cleanA = cleanSentenceForMatching(activeText);
  if (cleanS.length < 2 || cleanA.length < 2) return false;

  // 1. Direct containment in either direction
  if (cleanS.includes(cleanA) || cleanA.includes(cleanS)) return true;

  // 2. High partial overlap for titles, subtitles & tags
  const minLen = Math.min(cleanS.length, cleanA.length);
  if (minLen >= 3) {
    const windowSize = Math.min(4, minLen);
    for (let i = 0; i <= cleanA.length - windowSize; i++) {
      const sub = cleanA.slice(i, i + windowSize);
      if (cleanS.includes(sub)) return true;
    }
    for (let i = 0; i <= cleanS.length - windowSize; i++) {
      const sub = cleanS.slice(i, i + windowSize);
      if (cleanA.includes(sub)) return true;
    }
  }

  return false;
}

/**
 * Highlighter styling: authentic yellow/gold highlighter marker with glowing accent
 */
export const TTS_HIGHLIGHT_CLASS =
  'tts-active-sentence-highlight bg-amber-400/35 text-amber-50 px-1 py-0.5 rounded-sm border-b-2 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.35)] font-medium inline transition-all duration-300';

/**
 * Recursively scans React children and wraps any sentence matching the currently spoken TTS text with a highlighter marker.
 * When the active sentence changes or ends, previous highlighters are immediately cleared.
 */
export function highlightSentencesInChildren(
  children: React.ReactNode,
  activeSentence: string | null | undefined,
): React.ReactNode {
  if (!activeSentence) return children;

  if (typeof children === 'string') {
    if (!children.trim()) return children;

    // Split text into sentence tokens preserving delimiters (. ! ? \n)
    const rawTokens = children.split(/([.!?。！？\n]+)/);
    if (rawTokens.length <= 1) {
      if (isSentenceActive(children, activeSentence)) {
        return (
          <mark className={TTS_HIGHLIGHT_CLASS} data-tts-active="true">
            {children}
          </mark>
        );
      }
      return children;
    }

    const sentences: string[] = [];
    for (let i = 0; i < rawTokens.length; i += 2) {
      const body = rawTokens[i] || '';
      const punct = rawTokens[i + 1] || '';
      if (body || punct) {
        sentences.push(body + punct);
      }
    }

    return (
      <>
        {sentences.map((sent, idx) => {
          if (isSentenceActive(sent, activeSentence)) {
            return (
              <mark key={idx} className={TTS_HIGHLIGHT_CLASS} data-tts-active="true">
                {sent}
              </mark>
            );
          }
          return <React.Fragment key={idx}>{sent}</React.Fragment>;
        })}
      </>
    );
  }

  if (Array.isArray(children)) {
    return React.Children.map(children, (child) => highlightSentencesInChildren(child, activeSentence));
  }

  if (React.isValidElement(children)) {
    // If element is a pure text container or inline tag, drill down
    const element = children as React.ReactElement<any>;
    if (element.props && element.props.children) {
      return React.cloneElement(element, {
        children: highlightSentencesInChildren(element.props.children, activeSentence),
      });
    }
  }

  return children;
}

/**
 * Standalone component that renders text with real-time TTS sentence highlighter.
 */
export function TTSHighlightedText({
  text,
  className = '',
}: {
  text: string;
  className?: string;
}) {
  const { isSpeaking, activeText, currentSentence } = useTTSState();
  const activeTarget = isSpeaking ? (currentSentence || activeText) : null;

  const content = useMemo(() => {
    return highlightSentencesInChildren(text, activeTarget);
  }, [text, activeTarget]);

  return <span className={className}>{content}</span>;
}
