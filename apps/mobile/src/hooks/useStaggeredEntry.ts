/**
 * useStaggeredEntry — Staggered list-entry animation with reduced-motion support.
 *
 * Returns a `getEntering` function that creates a Reanimated entering
 * animation for a given list index — each item enters `baseDelay` ms after
 * the previous one.
 *
 * Usage:
 *   const { getEntering } = useStaggeredEntry({ direction: 'down' });
 *   <Animated.View entering={getEntering(index)}>
 */
import { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useReducedMotion } from '@/hooks/useReducedMotion';

type AnimationDirection = 'down' | 'up' | 'fade';

interface UseStaggeredEntryOptions {
  direction?: AnimationDirection;
  /** Delay between each item in ms. */
  baseDelay?: number;
  /** Duration of each item's enter animation in ms. */
  duration?: number;
}

const ENTERING_MAP = {
  down: FadeInDown,
  up: FadeInUp,
  fade: FadeIn,
} as const;

export function useStaggeredEntry(options: UseStaggeredEntryOptions = {}) {
  const { direction = 'down', baseDelay = 50, duration = 400 } = options;
  const reduceMotion = useReducedMotion();

  const getEntering = (index: number) => {
    if (reduceMotion) return undefined;
    const Animation = ENTERING_MAP[direction];
    return Animation.delay(index * baseDelay).duration(duration);
  };

  return { getEntering };
}
