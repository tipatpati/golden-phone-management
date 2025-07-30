import { useRef, useCallback } from 'react';
import { logger } from '@/utils/logger';

interface RateLimitOptions {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs?: number;
}

interface RateLimitState {
  attempts: number[];
  isBlocked: boolean;
  blockUntil?: number;
}

export function useRateLimit(options: RateLimitOptions) {
  const { maxAttempts, windowMs, blockDurationMs = windowMs * 2 } = options;
  const stateRef = useRef<RateLimitState>({
    attempts: [],
    isBlocked: false
  });

  const checkRateLimit = useCallback((): boolean => {
    const now = Date.now();
    const state = stateRef.current;

    // Check if currently blocked
    if (state.isBlocked && state.blockUntil && now < state.blockUntil) {
      return false;
    }

    // Clear block if expired
    if (state.isBlocked && state.blockUntil && now >= state.blockUntil) {
      state.isBlocked = false;
      state.blockUntil = undefined;
      state.attempts = [];
    }

    // Remove old attempts outside the window
    state.attempts = state.attempts.filter(attempt => now - attempt < windowMs);

    // Check if rate limit exceeded
    if (state.attempts.length >= maxAttempts) {
      state.isBlocked = true;
      state.blockUntil = now + blockDurationMs;
      
      logger.warn('Rate limit exceeded', {
        maxAttempts,
        windowMs,
        blockDurationMs,
        attempts: state.attempts.length
      }, 'RateLimit');
      
      return false;
    }

    return true;
  }, [maxAttempts, windowMs, blockDurationMs]);

  const attempt = useCallback((): boolean => {
    const canProceed = checkRateLimit();
    
    if (canProceed) {
      stateRef.current.attempts.push(Date.now());
      return true;
    }
    
    return false;
  }, [checkRateLimit]);

  const getRemainingAttempts = useCallback((): number => {
    if (stateRef.current.isBlocked) return 0;
    return Math.max(0, maxAttempts - stateRef.current.attempts.length);
  }, [maxAttempts]);

  const getTimeUntilReset = useCallback((): number => {
    const state = stateRef.current;
    
    if (state.isBlocked && state.blockUntil) {
      return Math.max(0, state.blockUntil - Date.now());
    }
    
    if (state.attempts.length > 0) {
      const oldestAttempt = Math.min(...state.attempts);
      return Math.max(0, windowMs - (Date.now() - oldestAttempt));
    }
    
    return 0;
  }, [windowMs]);

  return {
    attempt,
    canAttempt: !stateRef.current.isBlocked,
    remainingAttempts: getRemainingAttempts(),
    timeUntilReset: getTimeUntilReset(),
    isBlocked: stateRef.current.isBlocked
  };
}