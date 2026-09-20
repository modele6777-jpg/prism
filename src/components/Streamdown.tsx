import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'motion/react';
import { StructuredDataRenderer } from './StructuredDataRenderer';

import remarkGfm from 'remark-gfm';

const markdownComponents: any = {
  p: ({ children }: any) => (
    <p className="mb-4">
      {children}
    </p>
  ),
  input({ type, checked, disabled, ...props }: any) {
    if (type === 'checkbox') {
      return (
        <motion.span 
          initial={false}
          animate={{
            scale: checked ? [1, 1.2, 1] : 1,
            rotate: checked ? [0, 5, -5, 0] : 0,
            color: checked ? '#34d399' : '#9ca3af'
          }}
          transition={{ duration: 0.3 }}
          className="inline-flex items-center justify-center mr-2 mb-0.5"
        >
          <input 
            type="checkbox" 
            checked={checked} 
            disabled={disabled}
            className="w-4 h-4 rounded border-white/20 bg-white/5 text-emerald-400 focus:ring-emerald-500 focus:ring-offset-black transition-colors"
            {...props} 
          />
        </motion.span>
      );
    }
    return <input type={type} checked={checked} disabled={disabled} {...props} />;
  },
  code({ node, inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || '');
    const isJson = match && match[1] === 'json';
    const codeString = String(children).replace(/\n$/, '');

    if (isJson) {
      try {
        const data = JSON.parse(codeString);
        return <StructuredDataRenderer data={data} className="my-4" />;
      } catch (e) {
        return (
          <code className={className} {...props}>
            {children}
          </code>
        );
      }
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
};

function replaceEmotionWithEmoji(text: string): string {
  if (typeof text !== 'string') return text;
  
  const getEmotionEmoji = (emotionStr: string): string => {
    const clean = emotionStr.trim().toLowerCase();
    if (clean.includes("comfort") || clean.includes("위로") || clean.includes("편안") || clean.includes("안심")) return "😌";
    if (clean.includes("sad") || clean.includes("슬픔") || clean.includes("우울") || clean.includes("눈물") || clean.includes("아픔")) return "😢";
    if (clean.includes("joy") || clean.includes("기쁨") || clean.includes("행복") || clean.includes("정글") || clean.includes("웃음") || clean.includes("신남")) return "😊";
    if (clean.includes("love") || clean.includes("사랑") || clean.includes("설렘") || clean.includes("애정")) return "🥰";
    if (clean.includes("worry") || clean.includes("걱정") || clean.includes("불안") || clean.includes("두려움")) return "🥺";
    if (clean.includes("angry") || clean.includes("분노") || clean.includes("화남") || clean.includes("짜증")) return "😡";
    if (clean.includes("funny") || clean.includes("유쾌") || clean.includes("재미") || clean.includes("웃기")) return "😆";
    if (clean.includes("surprised") || clean.includes("놀람") || clean.includes("당황") || clean.includes("놀라운")) return "😲";
    if (clean.includes("hope") || clean.includes("희망") || clean.includes("기대")) return "🌟";
    if (clean.includes("empathy") || clean.includes("공감") || clean.includes("이해")) return "🤝";
    if (clean.includes("reflect") || clean.includes("성찰") || clean.includes("생각") || clean.includes("고민")) return "💭";
    if (clean.includes("curious") || clean.includes("호기심") || clean.includes("질문")) return "👀";
    if (clean.includes("proud") || clean.includes("자랑") || clean.includes("뿌듯")) return "😎";
    
    return "✨";
  };

  // 1. Replace [EMOTION: value] or similar
  let res = text.replace(/\[EMOTION:\s*([^\]]+)\]/gi, (match, p1) => {
    return ` ${getEmotionEmoji(p1)} `;
  });

  // 2. Replace [EMOTION] value or [Emotion] value
  res = res.replace(/\[EMOTION\]\s*([a-zA-Z가-힣]+)/gi, (match, p1) => {
    return ` ${getEmotionEmoji(p1)} `;
  });

  // 3. Replace word EMOTION: value or Emotion: value (checking word boundaries)
  res = res.replace(/\bEMOTION:\s*([a-zA-Z가-힣a-zA-Z_]+)/gi, (match, p1) => {
    return ` ${getEmotionEmoji(p1)} `;
  });

  // 4. Clean runaway degenerate repeating tokens (e.g. "shame shame shame...")
  res = res.replace(/\b([a-zA-Z가-힣]{2,})\b(?:\s*[,.\s-]*\s*\1){3,}/gi, "");

  return res;
}

export function Streamdown({
  children = '',
  typewriterSpeed = 15,
  fixedChunkSize,
  immediate = false,
}: {
  children?: string;
  typewriterSpeed?: number;
  fixedChunkSize?: number;
  immediate?: boolean;
}) {
  const textContent = useMemo(() => {
    if (children === null || children === undefined) return '';
    let rawText = '';
    if (typeof children === 'string') {
      rawText = children;
    } else if (typeof children === 'object') {
      try {
        rawText = JSON.stringify(children);
      } catch {
        rawText = String(children);
      }
    } else {
      rawText = String(children);
    }
    return replaceEmotionWithEmoji(rawText);
  }, [children]);

  const [displayedText, setDisplayedText] = useState(() => (immediate || typewriterSpeed <= 0 ? textContent : ''));
  
  useEffect(() => {
    if (immediate || typewriterSpeed <= 0) {
      setDisplayedText(textContent);
      return;
    }

    // If the new content completely changed and isn't just appending, reset
    if (!textContent.startsWith(displayedText)) {
      setDisplayedText('');
      return;
    }

    const targetText = textContent;
    
    if (displayedText.length < targetText.length) {
      const timeout = setTimeout(() => {
        const remainder = targetText.slice(displayedText.length);
        // Calculate dynamic chunk size: type faster if we are far behind,
        // but try to maintain a smooth flow.
        const distance = remainder.length;
        let chunkSize = 1;

        if (fixedChunkSize) {
          chunkSize = fixedChunkSize;
        } else if (distance > 400) {
          chunkSize = 25;
        } else if (distance > 200) {
          chunkSize = 10;
        } else if (distance > 100) {
          chunkSize = 5;
        } else if (distance > 20) {
          chunkSize = 2;
        }

        const charsToAdd = remainder.slice(0, chunkSize);
        setDisplayedText(prev => prev + charsToAdd);
      }, typewriterSpeed);
      
      return () => clearTimeout(timeout);
    }
  }, [textContent, displayedText, typewriterSpeed, fixedChunkSize, immediate]);

  // Check if the entire string is valid JSON
  let jsonData = null;
  try {
    const trimmed = textContent.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      jsonData = JSON.parse(trimmed);
    }
  } catch (e) {
    // Not a pure JSON string
  }

  if (jsonData) {
    return <StructuredDataRenderer data={jsonData} />;
  }

  // Render cursor if we are still typing
  const isTyping = displayedText.length > 0 && displayedText.length < textContent.length;
  const textWithCursor = isTyping ? displayedText + ' ▍' : displayedText;

  return (
    <div className="streamdown-container font-sans text-white/90 prose prose-invert max-w-none prose-p:leading-relaxed prose-p:mb-4 [&_h1]:text-white [&_h1]:font-bold [&_h1]:text-2xl [&_h1]:mb-4 [&_h2]:text-white [&_h2]:font-bold [&_h2]:text-xl [&_h2]:mb-3 [&_h3]:text-white [&_h3]:font-bold [&_h3]:text-lg [&_h3]:mb-2 [&_h4]:text-white [&_h4]:font-bold [&_h4]:text-base [&_h4]:mb-2 [&_strong]:text-blue-100 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4 [&_li]:mb-1 [&_li]:text-white/80 [&_p]:mb-4 [&_p]:text-white/90">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {textWithCursor}
      </ReactMarkdown>
    </div>
  );
}

