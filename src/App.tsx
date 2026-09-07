import React from "react";
import { Route, Switch, Redirect, useLocation } from "wouter";
import { motion, AnimatePresence } from "motion/react";
import { LogOut, User, Volume2, VolumeX, Download, Triangle, RefreshCw, HelpCircle, Sparkles } from "lucide-react";

import { AppProvider, useApp } from "./contexts/AppContext";
import { LoginScreen } from "./components/LoginScreen";
import { BigBangButton } from "./components/omniwarp/BigBangButton";
import { BigBangExpansionOverlay } from "./components/omniwarp/BigBangExpansionOverlay";
import ErrorBoundary from "./components/ErrorBoundary";
import ReloadPrompt from "./components/ReloadPrompt";
import InstallPrompt from "./components/InstallPrompt";
import { GuideModal } from "./components/GuideModal";
import { GlobalHandbookAudioWidget } from "./components/GlobalHandbookAudioWidget";
import { GlobalReBibleAudioWidget } from "./components/GlobalReBibleAudioWidget";

import ProfileModal from "./components/ProfileModal";
import { PageLoader } from "./components/PageLoader";

import { BgMusicPlayer } from "./components/trinity/BgMusicPlayer";
import { initTTSAudioLifecycle, unlockAudioPlayback, getSharedAudioContext } from "./lib/audio";
import { shouldUsePageTransitions, shouldMountBgMusicPlayer } from "./lib/perfMode";
import AuroraBackground from "./components/AuroraBackground";
import HubHome from "./pages/HubHome";

function lazyWithRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) {
  return React.lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return await componentImport();
      } catch (retryError) {
        console.error("Failed to dynamically import module after retry:", retryError);
        throw retryError;
      }
    }
  });
}

const TrinityApp = lazyWithRetry(() => import("./pages/TrinityApp"));
const MuseApp = lazyWithRetry(() => import("./pages/MuseApp"));
const OrangeApp = lazyWithRetry(() => import("./pages/OrangeApp"));
const BluebirdApp = lazyWithRetry(() => import("./pages/BluebirdApp"));
const HealApp = lazyWithRetry(() => import("./pages/HealApp"));
const ProfilePage = lazyWithRetry(() => import("./pages/ProfilePage"));
const LibraryPage = lazyWithRetry(() => import("./pages/LibraryPage"));
const EpilogueApp = lazyWithRetry(() => import("./pages/EpilogueApp"));
const LucyStandalonePage = lazyWithRetry(() => import("./pages/LucyStandalonePage"));
const HandbookStandalonePage = lazyWithRetry(() => import("./pages/HandbookStandalonePage"));
const OmniWarpPage = lazyWithRetry(() => import("./pages/OmniWarpPage"));
const OrbGatewayPage = lazyWithRetry(() => import("./pages/OrbGatewayPage"));
// Legacy UnifiedChat replaced by full standalone LucyStandalonePage (/chat)
import { resetAppScroll } from "./utils/scrollToTop";
import { useAutoPrismSync } from "./hooks/useAutoPrismSync";
import { useUpdateNotice } from "./hooks/useUpdateNotice";
import { UpdateNoticeModal } from "./components/UpdateNoticeModal";
import { PinLockScreen } from "./components/PinLockScreen";
import { UPDATE_ACK_KEY } from "./lib/updateNotice";
import { applyServiceWorkerUpdate, forceAppUpgradeAndReload } from "./lib/prismSync";
import { safeLocalStorage, safeSessionStorage } from "./utils/safeStorage";
import { usePinScreenLock } from "./hooks/usePinScreenLock";
import { resolveCanonicalPath } from "./lib/prismRouteRegistry";

const ROUTES_MAP = [
  { path: "/", Component: HubHome },
  { path: "/universe", Component: HubHome },
  { path: "/ecpr", Component: HubHome },
  { path: "/synergy", Component: HubHome },
  { path: "/aegis", Component: HubHome },
  { path: "/trinity", Component: TrinityApp },
  { path: "/muse", Component: MuseApp },
  { path: "/orange", Component: OrangeApp },
  { path: "/bluebird", Component: BluebirdApp },
  { path: "/heal", Component: HealApp },
  { path: "/epilogue", Component: EpilogueApp },
  { path: "/library", Component: LibraryPage },
  { path: "/profile", Component: EpilogueApp },
  { path: "/handbook", Component: HandbookStandalonePage },
  { path: "/rebible", Component: HandbookStandalonePage },
  { path: "/chat", Component: LucyStandalonePage },
  { path: "/lucy", Component: LucyStandalonePage },
  { path: "/omniwarp", Component: OmniWarpPage },
  { path: "/bigbang", Component: OmniWarpPage },
  { path: "/orb", Component: OrbGatewayPage },
  { path: "/gateway", Component: OrbGatewayPage },
  { path: "/crystal", Component: OrbGatewayPage },
];

function ActivePage({ loc }: { loc: string }) {
  const [frozenLoc] = React.useState(loc);
  return (
    <React.Suspense fallback={<PageLoader />}>
      <Switch location={frozenLoc}>
        <Route path="/"><HubHome /></Route>
        <Route path="/universe"><HubHome /></Route>
        <Route path="/ecpr"><HubHome /></Route>
        <Route path="/synergy"><HubHome /></Route>
        <Route path="/aegis"><HubHome /></Route>
        <Route path="/trinity"><TrinityApp /></Route>
        <Route path="/muse"><MuseApp /></Route>
        <Route path="/orange"><OrangeApp /></Route>
        <Route path="/bluebird"><BluebirdApp /></Route>
        <Route path="/heal"><HealApp /></Route>
        <Route path="/epilogue"><EpilogueApp /></Route>
        <Route path="/library"><LibraryPage /></Route>
        <Route path="/profile"><EpilogueApp /></Route>
        <Route path="/handbook"><HandbookStandalonePage /></Route>
        <Route path="/rebible"><HandbookStandalonePage /></Route>
        <Route path="/chat"><LucyStandalonePage /></Route>
        <Route path="/lucy"><LucyStandalonePage /></Route>
        <Route path="/omniwarp"><OmniWarpPage /></Route>
        <Route path="/bigbang"><OmniWarpPage /></Route>
        <Route path="/orb"><OrbGatewayPage /></Route>
        <Route path="/gateway"><OrbGatewayPage /></Route>
        <Route path="/crystal"><OrbGatewayPage /></Route>
      </Switch>
    </React.Suspense>
  );
}

function AppContent() {
  const { firebaseUser, isAuthReady, logout, signInWithGoogle, sharedState, isUnlocked, unlock, isChatOpen, syncPrismDevices } = useApp();
  const [location, navigate] = useLocation();
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const [isGuideOpen, setIsGuideOpen] = React.useState(false);

  // Loading transition state with the rainbow triangle emblem
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [transitionLocation, setTransitionLocation] = React.useState(location);
  const isFirstMount = React.useRef(true);
  const usePageTransitions = shouldUsePageTransitions();

  const [checkingUpdate, setCheckingUpdate] = React.useState(false);
  const [updateMessage, setUpdateMessage] = React.useState<string | null>(null);
  const [isTarotActive, setIsTarotActive] = React.useState(false);
  const isTarotActiveRef = React.useRef(isTarotActive);
  isTarotActiveRef.current = isTarotActive;
  const isSessionBusy = React.useCallback(() => isTarotActiveRef.current, []);

  const pinScreenActive = !isUnlocked && !!firebaseUser;
  usePinScreenLock(pinScreenActive);

  React.useEffect(() => {
    const handlePrismNavigate = (e: any) => {
      const targetPath = e?.detail?.path;
      if (targetPath && typeof targetPath === 'string') {
        const safePath = resolveCanonicalPath(targetPath);
        navigate(safePath);
      }
    };

    window.addEventListener("prism-navigate", handlePrismNavigate);
    return () => {
      window.removeEventListener("prism-navigate", handlePrismNavigate);
    };
  }, [navigate]);

  React.useEffect(() => {
    const handleActive = () => setIsTarotActive(true);
    const handleInactive = () => setIsTarotActive(false);

    window.addEventListener("tarot-active", handleActive);
    window.addEventListener("tarot-inactive", handleInactive);
    window.addEventListener("special-feature-active", handleActive);
    window.addEventListener("special-feature-inactive", handleInactive);

    return () => {
      window.removeEventListener("tarot-active", handleActive);
      window.removeEventListener("tarot-inactive", handleInactive);
      window.removeEventListener("special-feature-active", handleActive);
      window.removeEventListener("special-feature-inactive", handleInactive);
    };
  }, []);

  const syncEnabled = isAuthReady && !!firebaseUser && isUnlocked;

  const { runSync, applyDeferredReload } = useAutoPrismSync({
    enabled: syncEnabled,
    sync: syncPrismDevices,
    isSessionBusy,
    onMessage: setUpdateMessage,
    onCheckingChange: setCheckingUpdate,
  });

  const {
    isOpen: isUpdateNoticeOpen,
    entries: updateEntries,
    mode: updateNoticeMode,
    noticeKey: updateNoticeKey,
    dismiss: dismissUpdateNotice,
    showManualSyncNotice,
  } = useUpdateNotice(syncEnabled);

  const handleApplyUpdateNow = async () => {
    dismissUpdateNotice();
    setCheckingUpdate(true);
    setUpdateMessage("최신 업데이트 적용 중...");
    const reloading = await applyDeferredReload();
    if (!reloading) {
      const swState = await applyServiceWorkerUpdate();
      if (swState === 'reloading') return;
      window.setTimeout(() => window.location.reload(), 400);
    }
  };

  const handleUpdateCheck = async () => {
    setCheckingUpdate(true);
    setUpdateMessage("PC·모바일 최신 동기화 및 업그레이드 확인 중...");
    try {
      const result = await runSync({ silent: false, force: true, deferReload: false });

      if (result) {
        safeLocalStorage.setItem(UPDATE_ACK_KEY, result.targetVersion);

        if (result.needsReload) {
          setUpdateMessage(`최신 v${result.targetVersion}으로 업데이트 적용 중...`);
          await forceAppUpgradeAndReload();
          return;
        }
      }

      // Non-blocking changelog display if already up-to-date
      void showManualSyncNotice(result?.targetVersion);
    } catch (e) {
      console.warn('[ManualSync] Error:', e);
      setUpdateMessage('현재 최신 데이터로 동기화 완료되었습니다.');
    } finally {
      setCheckingUpdate(false);
      window.setTimeout(() => setUpdateMessage(null), 3500);
    }
  };

  React.useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setIsTarotActive(false);
    if (!usePageTransitions) {
      setTransitionLocation(location);
      setIsTransitioning(false);
      return;
    }
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setTransitionLocation(location);
      setIsTransitioning(false);
    }, 240);
    return () => clearTimeout(timer);
  }, [location, usePageTransitions]);

  React.useEffect(() => {
    if (isTransitioning) return;
    resetAppScroll();
  }, [transitionLocation, isTransitioning]);

  // Redirect unknown routes
  React.useEffect(() => {
    const validPaths = ROUTES_MAP.map(r => r.path);
    if (!validPaths.includes(location)) {
      navigate("/");
    }
    if (location === '/orb' || location === '/gateway' || location === '/crystal') {
      window.location.replace('/orb.html' + window.location.search + window.location.hash);
    }
  }, [location, navigate]);

  React.useEffect(() => {
    initTTSAudioLifecycle();
  }, []);

  // Unlock Web Audio and HTML5 Audio from real user gestures and maintain wake state.
  React.useEffect(() => {
    let unlocked = false;
    const handleUserGesture = () => {
      if (!unlocked) {
        unlocked = true;
        unlockAudioPlayback();
      } else {
        try {
          const ctx = getSharedAudioContext();
          if (ctx && ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
          }
        } catch (_) {}
      }
    };

    window.addEventListener('pointerdown', handleUserGesture, { passive: true });
    window.addEventListener('touchstart', handleUserGesture, { passive: true });
    window.addEventListener('click', handleUserGesture, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', handleUserGesture);
      window.removeEventListener('touchstart', handleUserGesture);
      window.removeEventListener('click', handleUserGesture);
    };
  }, []);


  // 잠금 해제 후에만 테마 색 적용 (PIN 배경은 usePinScreenLock이 고정)
  React.useEffect(() => {
    if (!isUnlocked) return;
    if (sharedState?.themeColor) {
      document.body.style.backgroundColor = sharedState.themeColor;
      document.body.style.transition = 'background-color 2s ease-in-out';
    } else {
      document.body.style.backgroundColor = 'oklch(0.08 0.02 270)';
    }
  }, [isUnlocked, sharedState?.themeColor]);

  if (!isAuthReady) {
    return (
      <div className="h-dvh bg-[oklch(0.08_0.02_270)] flex items-center justify-center pt-safe pb-safe">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
      </div>
    );
  }

  const hasStoredAuthUid = (() => {
    try {
      return !!safeSessionStorage.getItem('prism_auth_uid');
    } catch {
      return false;
    }
  })();

  const isStandaloneChat = location === '/chat' || location === '/lucy' || location === '/handbook' || location === '/rebible' || location === '/orb' || location === '/gateway' || location === '/crystal';
  const isOrbSite = location === '/orb' || location === '/gateway' || location === '/crystal';
  const isChatView = location === '/chat' || location === '/lucy';

  if (!firebaseUser && !isStandaloneChat) {
    return (
      <div className="prism-app-shell relative z-[1] bg-transparent">
        <LoginScreen />
      </div>
    );
  }

  if (!isUnlocked && !isStandaloneChat) {
    return (
      <div className="prism-app-shell relative z-[1] bg-transparent">
        <PinLockScreen onUnlock={unlock} />
      </div>
    );
  }

  return (
    <div className="prism-app-shell relative z-[1] bg-transparent">
      {/* Top-Right Background Music Player (Expands Leftwards) */}
      {shouldMountBgMusicPlayer() && (
        <div className={`fixed top-safe-2 right-4 sm:right-6 md:top-safe-4 z-[300] transition-opacity duration-200 ${isTransitioning ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
          <BgMusicPlayer />
        </div>
      )}


      <AnimatePresence>
        {updateMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed top-14 right-4 z-[9999] p-4 rounded-2xl bg-yellow-950/70 border border-yellow-500/30 text-[11px] font-bold text-yellow-400 tracking-wide shadow-[0_10px_35px_rgba(234,179,8,0.25)] backdrop-blur-xl flex items-center gap-2 max-w-xs font-sans"
          >
            <RefreshCw size={12} className="animate-spin text-yellow-400 shrink-0" />
            <span>{updateMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      <main className="flex-1 min-h-0 overflow-hidden flex flex-col relative w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={transitionLocation}
            initial={{ opacity: 0, scale: 0.98, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -12 }}
            transition={{
              duration: usePageTransitions ? 0.35 : 0.12,
              ease: usePageTransitions ? [0.16, 1, 0.3, 1] : 'easeOut',
            }}
            className="w-full h-full flex flex-col min-h-0"
          >
            <ActivePage loc={transitionLocation} />
          </motion.div>
        </AnimatePresence>

        {/* Rainbow Triangle portal transitional loader */}
        <AnimatePresence>
          {isTransitioning && usePageTransitions && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-[oklch(0.08_0.02_270)]/90 backdrop-blur-md"
            >
              <div className="flex flex-col items-center gap-6">
                <div className="relative w-24 h-24 rounded-full border border-white/10 flex items-center justify-center shadow-[0_0_25px_rgba(255,255,255,0.15)] group backdrop-blur-md bg-white/[0.02]">
                  {/* Glowing rainbow background layer */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#ff6b6b] via-[#feca57] via-[#1dd1a1] via-[#54a0ff] to-[#5f27cd] opacity-40 mix-blend-screen rounded-full animate-pulse" />
                  
                  {/* Rotating dashed border line */}
                  <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "linear" }} 
                    className="absolute inset-0 rounded-full border border-dashed border-white/40" 
                  />
                  
                  {/* Inner container with the glowing triangle */}
                  <div className="absolute inset-[6px] rounded-full border border-white/5 bg-white/5 flex items-center justify-center">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.15, 1],
                        rotate: [0, 5, 0, -5, 0]
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Number.POSITIVE_INFINITY, 
                        ease: "easeInOut" 
                      }}
                    >
                      <Triangle 
                        className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,1)] -translate-y-[2px]" 
                        fill="transparent"
                        strokeWidth={2} 
                        size={28} 
                      />
                    </motion.div>
                  </div>
                </div>
                
                {/* Subtle text design */}
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 0.8, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-[10px] font-bold tracking-[0.3em] text-white/60 uppercase font-sans animate-pulse"
                >
                  TRANSLATING DIMENSION...
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <BigBangButton />
      <BigBangExpansionOverlay />

      <ReloadPrompt />
      <InstallPrompt />
      <GlobalHandbookAudioWidget />
      <GlobalReBibleAudioWidget />
      <UpdateNoticeModal
        key={updateNoticeKey}
        isOpen={isUpdateNoticeOpen}
        entries={updateEntries}
        mode={updateNoticeMode}
        onClose={dismissUpdateNotice}
        onApply={handleApplyUpdateNow}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuroraBackground />
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}

// Prism Universe dev auto-bump anchor
