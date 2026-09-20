import React, { useEffect, useRef } from "react";
import { useLocation } from "wouter";

export default function CalmApp() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Key - 40대 불안 치유 연습 & Dr.Z RAG";

    // Forward any pending prism toss payload to calm iframe
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === "NAVIGATE_LUCKEY") {
        navigate("/");
      }
    };
    window.addEventListener("message", handleMessage);

    return () => {
      document.title = prevTitle;
      window.removeEventListener("message", handleMessage);
    };
  }, [navigate]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-[#fcf9f5] z-40 overflow-hidden flex flex-col">
      <iframe
        ref={iframeRef}
        src="/calm/"
        title="Key"
        className="w-full h-full border-0 m-0 p-0 flex-1"
        allow="autoplay; microphone"
      />
    </div>
  );
}
