import { useState, useRef, useCallback } from 'react';
import { playAudioHaptic } from '@/lib/audioHaptics';

export interface UseSwipeableTabsOptions<T extends string> {
  tabs: readonly T[];
  activeTab: T;
  onTabChange: (newTab: T, direction: 1 | -1) => void;
  minSwipeDistance?: number;
  minSwipeRatio?: number;
  requireEdgeReach?: boolean;
  maxPerpendicularRatio?: number;
  enabled?: boolean;
  enableHaptics?: boolean;
}

export function useSwipeableTabs<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  minSwipeDistance = 180,
  minSwipeRatio = 0.55,
  requireEdgeReach = true,
  maxPerpendicularRatio = 2.2,
  enabled = true,
  enableHaptics = true,
}: UseSwipeableTabsOptions<T>) {
  const [direction, setDirection] = useState<1 | -1>(1);
  const touchStartRef = useRef<{
    x: number;
    y: number;
    time: number;
    shouldIgnore: boolean;
  } | null>(null);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent | TouchEvent) => {
      if (!enabled) return;
      if (e.touches.length !== 1) return;

      const touch = e.touches[0];
      const target = e.target as HTMLElement | null;

      // Ignore touches originating on interactive controls, sliders, text inputs, buttons, or designated no-swipe areas
      const isInteractive = target?.closest(
        'input, textarea, select, [role="slider"], .no-swipe, [data-no-swipe], audio, video, button, [role="button"]'
      );

      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
        shouldIgnore: Boolean(isInteractive),
      };
    },
    [enabled]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent | TouchEvent) => {
      if (!enabled || !touchStartRef.current) return;
      if (touchStartRef.current.shouldIgnore) {
        touchStartRef.current = null;
        return;
      }

      const touch = e.changedTouches?.[0];
      if (!touch) {
        touchStartRef.current = null;
        return;
      }

      const startX = touchStartRef.current.x;
      const startY = touchStartRef.current.y;
      const startTime = touchStartRef.current.time;
      touchStartRef.current = null;

      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      const deltaTime = Date.now() - startTime;

      // Gesture must complete within 1000ms and take at least 50ms
      if (deltaTime > 1000 || deltaTime < 50) return;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 390;
      const effectiveMinDist = Math.max(minSwipeDistance, screenWidth * minSwipeRatio);

      // Must meet distance and be clearly horizontal (prevent diagonal scroll conflict)
      if (absX >= effectiveMinDist && absX > absY * maxPerpendicularRatio) {
        // 화면 끝까지 도달해야 넘어가는 안전장치 (Edge Reach Check)
        if (requireEdgeReach) {
          const reachedLeftEdge = touch.clientX <= screenWidth * 0.28 || absX >= screenWidth * 0.65;
          const reachedRightEdge = touch.clientX >= screenWidth * 0.72 || absX >= screenWidth * 0.65;
          if (deltaX < 0 && !reachedLeftEdge) return;
          if (deltaX > 0 && !reachedRightEdge) return;
        }

        const currentIndex = tabs.indexOf(activeTab);
        if (currentIndex === -1) return;

        if (deltaX < 0) {
          // Swiped LEFT -> advance to next tab
          if (currentIndex < tabs.length - 1) {
            const nextTab = tabs[currentIndex + 1];
            setDirection(1);
            if (enableHaptics) {
              try { playAudioHaptic('tap_light'); } catch (_) {}
            }
            onTabChange(nextTab, 1);
          }
        } else {
          // Swiped RIGHT -> return to previous tab
          if (currentIndex > 0) {
            const prevTab = tabs[currentIndex - 1];
            setDirection(-1);
            if (enableHaptics) {
              try { playAudioHaptic('tap_light'); } catch (_) {}
            }
            onTabChange(prevTab, -1);
          }
        }
      }
    },
    [enabled, minSwipeDistance, minSwipeRatio, requireEdgeReach, maxPerpendicularRatio, tabs, activeTab, onTabChange, enableHaptics]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent | TouchEvent) => {
      if (!enabled || !touchStartRef.current || touchStartRef.current.shouldIgnore) return;
      const touch = e.touches[0];
      if (!touch) return;
      const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
      const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
      // 오직 뚜렷하고 긴 수평 드래그일 때만 브라우저 뒤로가기 제스처 간섭 방지 (수직 스크롤 방해 금지)
      if (deltaX > 60 && deltaX > deltaY * 2.5 && e.cancelable) {
        e.preventDefault();
      }
    },
    [enabled]
  );

  const changeTabWithDirection = useCallback(
    (newTab: T) => {
      const currentIndex = tabs.indexOf(activeTab);
      const nextIndex = tabs.indexOf(newTab);
      const newDir: 1 | -1 = nextIndex >= currentIndex ? 1 : -1;
      setDirection(newDir);
      onTabChange(newTab, newDir);
    },
    [tabs, activeTab, onTabChange]
  );

  return {
    direction,
    setDirection,
    changeTabWithDirection,
    swipeHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}
