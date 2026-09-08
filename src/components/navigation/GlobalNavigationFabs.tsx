import React from "react";
import { motion } from "motion/react";
import { useLocation } from "wouter";
import { Triangle, CircleDot, MessageSquareHeart } from "lucide-react";
import { triggerHaptic } from "@/lib/omniWarp/omniWarpHaptics";
import { omniWarpAudio } from "@/lib/omniWarp/omniWarpAudio";

interface GlobalNavigationFabsProps {
  /**
   * Explicit override for whether the current page is the Orb site.
   * Useful when rendered in orb.html outside of wouter.
   */
  forceIsOrb?: boolean;
  /**
   * Explicit override for whether the current page is Lucy chat.
   */
  forceIsChat?: boolean;
}

export function GlobalNavigationFabs({ forceIsOrb, forceIsChat }: GlobalNavigationFabsProps) {
  let location = "/";
  let navigate = (to: string) => {
    window.location.href = to;
  };

  try {
    const [wouterLoc, wouterNav] = useLocation();
    location = wouterLoc;
    navigate = wouterNav;
  } catch (_) {
    // Fallback if rendered outside Wouter Router
    if (typeof window !== "undefined") {
      location = window.location.pathname;
    }
  }

  const isOrbSite =
    forceIsOrb ??
    (location === "/orb" ||
      location === "/gateway" ||
      location === "/crystal" ||
      (typeof window !== "undefined" && window.location.pathname.includes("orb")));

  const isChatView =
    forceIsChat ??
    (location === "/chat" ||
      location === "/lucy" ||
      (typeof window !== "undefined" && window.location.pathname.includes("chat")));

  const handleLeftClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    triggerHaptic("whitehole");
    omniWarpAudio.playClick();

    if (isOrbSite) {
      // On Orb site: Left button is Prism Home
      if (typeof window !== "undefined" && window.location.pathname.includes("orb")) {
        window.location.href = "/";
      } else {
        navigate("/");
      }
    } else {
      // Everywhere else: Left button is Orb site
      if (typeof window !== "undefined") {
        window.location.href = "/orb.html";
      } else {
        navigate("/orb");
      }
    }
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    triggerHaptic("whitehole");
    omniWarpAudio.playClick();

    if (isChatView) {
      // In Lucy chat: Right button is Prism Home
      navigate("/");
    } else {
      // Everywhere else: Right button is Lucy Chat
      if (typeof window !== "undefined" && window.location.pathname.includes("orb")) {
        window.location.href = "/chat";
      } else {
        navigate("/chat");
      }
    }
  };

  return (
    <>
      {/* Left FAB: Prism on Orb site, Orb on all other sites */}
      <div
        id="global-fab-left-container"
        className="fixed left-3 sm:left-6 z-[340] pointer-events-none select-none bottom-safe-fab flex items-center"
      >
        <motion.button
          id="global-fab-left-btn"
          type="button"
          onClick={handleLeftClick}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="group pointer-events-auto relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          style={{
            background: isOrbSite
              ? "radial-gradient(circle at 35% 30%, #1e1b4b 0%, #0f172a 60%, #030712 100%)"
              : "radial-gradient(circle at 35% 30%, #2e1065 0%, #0f0a1e 60%, #030208 100%)",
            boxShadow: isOrbSite
              ? "0 8px 30px rgba(99, 102, 241, 0.35), inset 0 0 12px rgba(129, 140, 248, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.6)"
              : "0 8px 30px rgba(168, 85, 247, 0.35), inset 0 0 12px rgba(192, 132, 252, 0.35), inset 0 1px 2px rgba(255, 255, 255, 0.5)",
            border: isOrbSite ? "1.5px solid rgba(129, 140, 248, 0.4)" : "1.5px solid rgba(192, 132, 252, 0.4)",
          }}
          aria-label={isOrbSite ? "프리즘 홈으로 이동" : "크리스탈 오브로 이동"}
          title={isOrbSite ? "프리즘 홈" : "크리스탈 오브"}
        >
          {/* Ambient Glow */}
          <div
            className={`absolute -inset-1 rounded-full blur-[8px] opacity-40 group-hover:opacity-75 transition-opacity pointer-events-none ${
              isOrbSite ? "bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-500" : "bg-gradient-to-tr from-purple-600 via-violet-500 to-cyan-400"
            }`}
          />

          {/* Icon */}
          <div className="relative z-10 flex items-center justify-center text-white">
            {isOrbSite ? (
              <Triangle
                size={22}
                className="text-cyan-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.8)] fill-cyan-400/20 stroke-[2.2] -translate-y-[1px]"
              />
            ) : (
              <CircleDot
                size={24}
                className="text-purple-300 drop-shadow-[0_0_10px_rgba(168,85,247,0.85)] stroke-[2.2]"
              />
            )}
          </div>

          {/* Mini Badge / Tooltip on Hover */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap px-2.5 py-1 rounded-full bg-black/85 border border-white/20 text-[10px] font-bold text-white shadow-xl backdrop-blur-md">
            {isOrbSite ? "프리즘 홈" : "크리스탈 오브"}
          </div>
        </motion.button>
      </div>

      {/* Right FAB: Prism in Lucy chat, Lucy on all other sites */}
      <div
        id="global-fab-right-container"
        className="fixed right-3 sm:right-6 z-[340] pointer-events-none select-none bottom-safe-fab flex items-center"
      >
        <motion.button
          id="global-fab-right-btn"
          type="button"
          onClick={handleRightClick}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="group pointer-events-auto relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400"
          style={{
            background: isChatView
              ? "radial-gradient(circle at 35% 30%, #1e1b4b 0%, #0f172a 60%, #030712 100%)"
              : "radial-gradient(circle at 35% 30%, #4a044e 0%, #170420 60%, #05010a 100%)",
            boxShadow: isChatView
              ? "0 8px 30px rgba(99, 102, 241, 0.35), inset 0 0 12px rgba(129, 140, 248, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.6)"
              : "0 8px 30px rgba(236, 72, 153, 0.35), inset 0 0 12px rgba(244, 114, 182, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.5)",
            border: isChatView ? "1.5px solid rgba(129, 140, 248, 0.4)" : "1.5px solid rgba(244, 114, 182, 0.4)",
          }}
          aria-label={isChatView ? "프리즘 홈으로 이동" : "루시와 대화하기"}
          title={isChatView ? "프리즘 홈" : "루시 채팅"}
        >
          {/* Ambient Glow */}
          <div
            className={`absolute -inset-1 rounded-full blur-[8px] opacity-40 group-hover:opacity-75 transition-opacity pointer-events-none ${
              isChatView ? "bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-500" : "bg-gradient-to-tr from-pink-500 via-rose-500 to-purple-500"
            }`}
          />

          {/* Icon */}
          <div className="relative z-10 flex items-center justify-center text-white">
            {isChatView ? (
              <Triangle
                size={22}
                className="text-cyan-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.8)] fill-cyan-400/20 stroke-[2.2] -translate-y-[1px]"
              />
            ) : (
              <MessageSquareHeart
                size={24}
                className="text-pink-300 drop-shadow-[0_0_10px_rgba(244,114,182,0.85)] stroke-[2.2]"
              />
            )}
          </div>

          {/* Mini Badge / Tooltip on Hover */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap px-2.5 py-1 rounded-full bg-black/85 border border-white/20 text-[10px] font-bold text-white shadow-xl backdrop-blur-md">
            {isChatView ? "프리즘 홈" : "루시 대화"}
          </div>
        </motion.button>
      </div>
    </>
  );
}
