import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import OrbGatewayPage from "./pages/OrbGatewayPage";
import { BigBangButton } from "./components/omniwarp/BigBangButton";
import { BigBangExpansionOverlay } from "./components/omniwarp/BigBangExpansionOverlay";
import InstallPrompt from "./components/InstallPrompt";
import "./index.css";
import { initPerfMode, getSwUpdateIntervalMs } from "./lib/perfMode";

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

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <OrbGatewayPage />
      <BigBangButton />
      <BigBangExpansionOverlay />
      <InstallPrompt />
    </StrictMode>
  );
}
