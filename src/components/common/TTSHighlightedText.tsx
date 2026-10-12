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
    .replace(/[*_~`#>\[\]()]/g, '')
    .replace(/[^가-힣a-zA-Z0-9]/g, '')
    .toLowerCase();
}

/**
 * Tests whether a given sentence segment matches the currently active TTS sentence/chunk.
 */
export function isSentenceActive(sentence: string, activeText: string | null | undefined): boolean {
  if (!activeText || !sentence) return false;
  const cleanS = cleanSentenceForMatching(sentence);
  const cleanA = cleanSentenceForMatching(activeText);
  if (cleanS.length < 2 || cleanA.length < 2) return false;

  // Direct containment
  if (cleanS.includes(cleanA) || cleanA.includes(cleanS)) return true;

  // Long sentence fuzzy prefix / substring match (handles slight TTS normalizations)
  if (cleanS.length >= 6 && cleanA.length >= 6) {
    const minLen = Math.min(12, cleanS.length, cleanA.length);
    const subA = cleanA.slice(0, minLen);
    if (cleanS.includes(subA)) return true;
    const subS = cleanS.slice(0, minLen);
    if (cleanA.includes(subS)) return true;
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
