import { useCallback, useRef } from 'react';

interface ClickHandlerOptions {
  debounceMs?: number;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  disabled?: boolean;
}

/**
 * Optimized click handler hook that prevents double clicks and provides debugging
 */
export function useClickHandler(
  handler: (event?: React.MouseEvent) => void | Promise<void>,
  options: ClickHandlerOptions = {}
) {
  const {
    debounceMs = 300,
    preventDefault = false,
    stopPropagation = false,
    disabled = false
  } = options;

  const lastCallRef = useRef<number>(0);
  const isProcessingRef = useRef<boolean>(false);

  const optimizedHandler = useCallback(
    async (event: React.MouseEvent) => {
      if (disabled) {
        console.log('Click handler disabled');
        return;
      }

      const now = Date.now();
      if (now - lastCallRef.current < debounceMs) {
        console.log('Click debounced');
        return;
      }

      if (isProcessingRef.current) {
        console.log('Click ignored - already processing');
        return;
      }

      if (preventDefault) {
        event.preventDefault();
      }

      if (stopPropagation) {
        event.stopPropagation();
      }

      lastCallRef.current = now;
      isProcessingRef.current = true;

      try {
        console.log('Executing click handler');
        await handler(event);
      } catch (error) {
        console.error('Click handler error:', error);
      } finally {
        isProcessingRef.current = false;
      }
    },
    [handler, debounceMs, preventDefault, stopPropagation, disabled]
  );

  return optimizedHandler;
}