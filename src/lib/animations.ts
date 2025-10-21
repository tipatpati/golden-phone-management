/**
 * Animation Utilities
 * Reusable animation helpers using Material Design motion tokens
 */

export const MOTION = {
  // Durations from CSS variables
  duration: {
    short1: 'var(--motion-duration-short-1)', // 50ms
    short2: 'var(--motion-duration-short-2)', // 100ms
    short3: 'var(--motion-duration-short-3)', // 150ms
    short4: 'var(--motion-duration-short-4)', // 200ms
    medium1: 'var(--motion-duration-medium-1)', // 250ms
    medium2: 'var(--motion-duration-medium-2)', // 300ms
    medium3: 'var(--motion-duration-medium-3)', // 350ms
    medium4: 'var(--motion-duration-medium-4)', // 400ms
    long1: 'var(--motion-duration-long-1)', // 450ms
    long2: 'var(--motion-duration-long-2)', // 500ms
    long3: 'var(--motion-duration-long-3)', // 550ms
    long4: 'var(--motion-duration-long-4)', // 600ms
    extraLong1: 'var(--motion-duration-extra-long-1)', // 700ms
    extraLong2: 'var(--motion-duration-extra-long-2)', // 800ms
    extraLong3: 'var(--motion-duration-extra-long-3)', // 900ms
    extraLong4: 'var(--motion-duration-extra-long-4)', // 1000ms
  },
  
  // Easing curves
  easing: {
    standard: 'var(--motion-standard)',
    emphasizedDecelerate: 'var(--motion-emphasized-decelerate)',
    emphasizedAccelerate: 'var(--motion-emphasized-accelerate)',
  }
} as const;

/**
 * Staggered animation delay calculator
 * @param index - Item index in the list
 * @param baseDelay - Base delay in milliseconds (default: 100)
 */
export function getStaggerDelay(index: number, baseDelay: number = 100): string {
  return `${index * baseDelay}ms`;
}

/**
 * Generate animation style object
 */
export function getAnimationStyle(
  index: number,
  options: {
    baseDelay?: number;
    duration?: keyof typeof MOTION.duration;
    easing?: keyof typeof MOTION.easing;
  } = {}
) {
  const {
    baseDelay = 100,
    duration = 'medium2',
    easing = 'emphasizedDecelerate'
  } = options;

  return {
    animationDelay: getStaggerDelay(index, baseDelay),
    animationDuration: MOTION.duration[duration],
    animationTimingFunction: MOTION.easing[easing],
  };
}

/**
 * Copy to clipboard with animation feedback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}
