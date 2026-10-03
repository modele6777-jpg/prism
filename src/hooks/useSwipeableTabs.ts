import { useState, useRef, useCallback } from 'react';
import { playAudioHaptic } from '@/lib/audioHaptics';

export interface UseSwipeableTabsOptions<T extends string> {
  tabs: readonly T[];
  activeTab: T;
  onTabChange: (newTab: T, direction: 1 | -1) => void;
  minSwipeDistance?: number;
  maxPerpendicularRatio?: number;
  enabled?: boolean;
  enableHaptics?: boolean;
}

export function useSwipeableTabs<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  minSwipeDistance = 45,
  maxPerpendicularRatio = 1.25,
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

      // Ignore touches originating on interactive controls, sliders, text inputs, or horizontal carousels
      const isInteractive = target?.closest(
        'input, textarea, select, [role="slider"], .no-swipe, [data-no-swipe], audio, video'
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

      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;
      touchStartRef.current = null;

      // Gesture must complete within 800ms
      if (deltaTime > 800) return;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Must meet distance and be horizontal
      if (absX >= minSwipeDistance && absX > absY * maxPerpendicularRatio) {
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
    [enabled, minSwipeDistance, maxPerpendicularRatio, tabs, activeTab, onTabChange, enableHaptics]
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
      onTouchEnd: handleTouchEnd,
    },
  };
}
