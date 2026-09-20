import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { AnimatePresence, motion } from "motion/react";
import { KeyCosmicLoader } from "@/components/KeyCosmicLoader";

export default function CalmApp() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [minTimerDone, setMinTimerDone] = useState(false);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Key - 40대 불안 치유 연습 & Dr.Z RAG";

    // Forward any pending prism toss payload or navigation to Lucy
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === "NAVIGATE_LUCKEY") {
        if (e.data.text) {
          try {
            sessionStorage.setItem('lucy_injected_auto_send', e.data.text);
            sessionStorage.setItem('lucy_injected_input_draft', e.data.text);
          } catch (_) {}
        }
        navigate(e.data.path || "/chat");
      }
    };
    window.addEventListener("message", handleMessage);

    // Guaranteed minimum display (1.5 seconds) so the user clearly experiences the Key cosmic loader
    const minTimer = setTimeout(() => {
      setMinTimerDone(true);
    }, 1500);

    // Fallback maximum timer (3.5 seconds) in case iframe onLoad doesn't fire
    const fallbackTimer = setTimeout(() => {
      setIsLoading(false);
    }, 3500);

    return () => {
      clearTimeout(minTimer);
      clearTimeout(fallbackTimer);
      document.title = prevTitle;
      window.removeEventListener("message", handleMessage);
    };
  }, [navigate]);

  useEffect(() => {
    if (minTimerDone && iframeLoaded) {
      setIsLoading(false);
    }
  }, [minTimerDone, iframeLoaded]);

  // 전달받은 특정 실천 연습이 있으면 iframe 로드 후 즉시 실행 요청
  useEffect(() => {
    if (iframeLoaded) {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const exParam = urlParams.get('ex') || sessionStorage.getItem('key_target_exercise');
        if (exParam) {
          const exIdx = parseInt(exParam, 10);
          if (exIdx) {
            const timer = setTimeout(() => {
              iframeRef.current?.contentWindow?.postMessage({ type: 'START_PRACTICE', exerciseIdx: exIdx }, '*');
            }, 350);
            return () => clearTimeout(timer);
          }
        }
      } catch (_) {}
    }
  }, [iframeLoaded]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-[#fcf9f5] z-40 overflow-hidden flex flex-col">
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="key-cosmic-loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
            className="fixed inset-0 z-50 pointer-events-auto"
          >
            <KeyCosmicLoader
              fullScreen
              message="Key 마음약방 처방 조율 중..."
              subMessage="40 CALM PRACTICES & CLINICAL SOMATIC RAG"
            />
          </motion.div>
        )}
      </AnimatePresence>
      <iframe
        ref={iframeRef}
        src={`/calm/index.html${typeof window !== 'undefined' ? window.location.search : ''}`}
        title="Key"
        className="w-full h-full border-0 m-0 p-0 flex-1"
        allow="autoplay; microphone"
        onLoad={() => {
          setIframeLoaded(true);
        }}
      />
    </div>
  );
}
