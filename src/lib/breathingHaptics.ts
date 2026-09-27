/**
 * Breathing Studio Haptic Feedback Engine
 * Provides gentle, meditative vibration pulses for mobile devices
 * during Inhale and Exhale phases.
 */

const STORAGE_KEY = 'prism_breathing_haptic';

/**
 * Checks whether the current device/browser supports the Vibration API.
 */
export function isHapticsSupported(): boolean {
  return typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

/**
 * Retrieves the saved Haptic Feedback toggle state (defaults to true).
 */
export function getBreathingHapticSetting(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

/**
 * Saves the Haptic Feedback toggle state and dispatches an event for cross-component sync.
 */
export function setBreathingHapticSetting(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('breathing-haptic-setting-changed', { detail: { enabled } }));
  } catch (e) {
    console.warn('[Haptics] Failed to save setting:', e);
  }
}

export type BreathingPhaseType = 'inhale' | 'hold' | 'exhale' | 'idle' | 'test' | 'test-inhale' | 'test-exhale';

/**
 * Triggers gentle, distinct vibration pulses on mobile devices during Inhale, Exhale, or Test.
 * 
 * - Inhale: Rising 3-stage gentle swell [35ms, pause 60ms, 45ms, pause 60ms, 55ms]
 * - Exhale: Soothing 3-stage descending release [50ms, pause 70ms, 35ms, pause 80ms, 20ms]
 * - Hold: Very faint 15ms micro-tick (optional presence anchor)
 * - Test: Short double pulse confirmation
 */
export function triggerBreathingHaptic(phase: BreathingPhaseType): boolean {
  if (!isHapticsSupported()) return false;
  
  // If haptic is toggled off and it's not a manual test trigger, do nothing
  if (!phase.startsWith('test') && !getBreathingHapticSetting()) {
    return false;
  }

  try {
    switch (phase) {
      case 'inhale':
      case 'test-inhale':
        // Gentle swelling pulse for expanding chest/lungs: 35ms -> 45ms -> 55ms
        navigator.vibrate?.([35, 60, 45, 60, 55]);
        return true;

      case 'exhale':
      case 'test-exhale':
        // Gentle soothing release pulse: 50ms -> 35ms -> 20ms
        navigator.vibrate?.([50, 70, 35, 80, 20]);
        return true;

      case 'hold':
        // Ultra-soft single micro-ping
        navigator.vibrate?.(15);
        return true;

      case 'test':
        // Double pleasant acknowledgement pulse
        navigator.vibrate?.([35, 60, 35]);
        return true;

      default:
        return false;
    }
  } catch (err) {
    console.warn('[Haptics] Trigger error:', err);
    return false;
  }
}
