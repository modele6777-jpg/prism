import React, { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import OrbGatewayPage from "./pages/OrbGatewayPage";
import { BgMusicPlayer } from "./components/trinity/BgMusicPlayer";
import { BigBangButton } from "./components/omniwarp/BigBangButton";
import { BigBangExpansionOverlay } from "./components/omniwarp/BigBangExpansionOverlay";
import InstallPrompt from "./components/InstallPrompt";
import { OrbCosmicLoader } from "./components/OrbCosmicLoader";
import "./index.css";
import { initPerfMode, getSwUpdateIntervalMs, shouldMountBgMusicPlayer } from "./lib/perfMode";

// Initialize performance mode
initPerfMode();

// Register Service Worker in production for independent PWA support
const SW_UPDATE_INTERVAL_MS = getSwUpdateIntervalMs();

if (import.meta.env.PROD) {
  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      window.setInterval(() => {
        void registration.update().catch(() => undefined);
      }, SW_UPDATE_INTERVAL_MS);
    },
  });
}

// Prevent extension unhandled rejections
if (typeof window !== "undefined") {
  window.addEventListener(
    "unhandledrejection",
    (event) => {
      const msg = String(event?.reason?.message || event?.reason || "");
      if (/MetaMask|ethereum|web3|inpage/i.test(msg)) {
        event.preventDefault();
        event.stopImmediatePropagation?.();
      }
    },
    true
  );
}

function OrbApp() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return (
      <OrbCosmicLoader
        fullScreen
        message="크리스탈 오브 차원 궤도 동기화 중..."
        subMessage="ASTRAL SCRYING SPHERE & CONSCIOUSNESS"
      />
    );
  }

  return (
    <>
      <OrbGatewayPage />
      {/* Top-Right Background Music Player (Expands Leftwards) */}
      {shouldMountBgMusicPlayer() && (
        <div className="fixed top-safe-2 right-4 sm:right-6 md:top-safe-4 z-[300]">
          <BgMusicPlayer />
        </div>
      )}
      <BigBangButton />
      <BigBangExpansionOverlay />
      <InstallPrompt />
    </>
  );
}

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <OrbApp />
    </StrictMode>
  );
}

