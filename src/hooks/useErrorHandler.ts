/**
 * Enhanced Error Handling Hook
 * Provides consistent error handling across components
 */

import { useCallback, useState } from 'react';
import { toast } from '@/components/ui/sonner';
import { logger } from '@/utils/secureLogger';
import { errorTracking } from '@/services/core/ErrorTracking';
import { AppError, LoadingState } from '@/types/global';
import { TypeSafetyMigration } from '@/utils/migration/TypeSafetyMigration';

interface UseErrorHandlerOptions {
  context?: string;
  showToast?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  trackError?: boolean;
}

interface ErrorHandlerState {
  error: AppError | null;
  hasError: boolean;
  loading: LoadingState;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const {
    context = 'Component',
    showToast = true,
    logLevel = 'error',
    trackError = true
  } = options;

  const [state, setState] = useState<ErrorHandlerState>({
    error: null,
    hasError: false,
    loading: 'idle'
  });

  const handleError = useCallback((error: unknown, customMessage?: string) => {
    let appError: AppError;

    // Convert any error to AppError
    if (TypeSafetyMigration.isAppError(error)) {
      appError = error;
    } else {
      appError = new Error(
        error instanceof Error ? error.message : String(error)
      ) as AppError;
      appError.code = 'UNKNOWN_ERROR';
      appError.context = { originalError: error };
      appError.timestamp = new Date().toISOString();
      appError.severity = 'medium';
    }

    // Update state
    setState({
      error: appError,
      hasError: true,
      loading: 'error'
    });

    // Log error
    logger[logLevel](
      customMessage || appError.message,
      {
        error: appError.message,
        code: appError.code,
        context: appError.context,
        severity: appError.severity
      },
      context
    );

    // Track error
    if (trackError) {
      errorTracking.trackError(appError, {
        component: context,
        action: 'error_handled'
      });
    }

    // Show toast notification
    if (showToast) {
      const displayMessage = customMessage || appError.message || 'An error occurred';
      toast.error(displayMessage);
    }

    return appError;
  }, [context, showToast, logLevel, trackError]);

  const clearError = useCallback(() => {
    setState({
      error: null,
      hasError: false,
      loading: 'idle'
    });
  }, []);

  const setLoading = useCallback((loading: LoadingState) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const executeWithErrorHandling = useCallback(async <T>(
    asyncFunction: () => Promise<T>,
    errorMessage?: string
  ): Promise<T | null> => {
    try {
      setLoading('loading');
      const result = await asyncFunction();
      setLoading('success');
      clearError();
      return result;
    } catch (error) {
      setLoading('error');
      handleError(error, errorMessage);
      return null;
    }
  }, [handleError, clearError, setLoading]);

  const retryWithErrorHandling = useCallback(async <T>(
    asyncFunction: () => Promise<T>,
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): Promise<T | null> => {
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        setLoading('loading');
        const result = await asyncFunction();
        setLoading('success');
        clearError();
        return result;
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          logger.warn(`Retry attempt ${attempt} failed, retrying...`, {
            error: error instanceof Error ? error.message : String(error),
            attempt,
            maxRetries
          }, context);
          
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    setLoading('error');
    handleError(lastError, `Failed after ${maxRetries} attempts`);
    return null;
  }, [handleError, clearError, setLoading, context]);

  return {
    // State
    error: state.error,
    hasError: state.hasError,
    loading: state.loading,
    isLoading: state.loading === 'loading',

    // Actions
    handleError,
    clearError,
    setLoading,
    executeWithErrorHandling,
    retryWithErrorHandling,

    // Utilities
    createError: (message: string, code?: string, severity?: AppError['severity']) => {
      const error = new Error(message) as AppError;
      error.code = code || 'CUSTOM_ERROR';
      error.context = { component: context };
      error.timestamp = new Date().toISOString();
      error.severity = severity || 'medium';
      return error;
    }
  };
}