/**
 * Centralized State Management Service
 * Provides Redux-like state management without Redux complexity
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { logger } from '@/utils/secureLogger';
import { AppError, LoadingState } from '@/types/global';
import { errorTracking } from '@/services/core/ErrorTracking';

type StateListener<T> = (state: T) => void;
type StateMiddleware<T> = (action: string, prevState: T, nextState: T) => T;

interface StoreOptions<T> {
  initialState: T;
  middleware?: StateMiddleware<T>[];
  persistKey?: string;
  validation?: (state: T) => boolean;
}

export class StateStore<T> {
  private state: T;
  private listeners = new Set<StateListener<T>>();
  private middleware: StateMiddleware<T>[];
  private persistKey?: string;
  private validation?: (state: T) => boolean;

  constructor(options: StoreOptions<T>) {
    this.state = options.initialState;
    this.middleware = options.middleware || [];
    this.persistKey = options.persistKey;
    this.validation = options.validation;

    // Load from localStorage if persist key is provided
    if (this.persistKey) {
      this.loadFromStorage();
    }

    logger.debug('StateStore initialized', { 
      persistKey: this.persistKey,
      hasValidation: !!this.validation,
      middlewareCount: this.middleware.length
    }, 'StateStore');
  }

  /**
   * Get current state
   */
  getState(): T {
    return this.state;
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: StateListener<T>): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Update state with action tracking
   */
  setState(updater: Partial<T> | ((prevState: T) => T), action: string = 'UPDATE'): void {
    try {
      const prevState = this.state;
      let nextState: T;

      if (typeof updater === 'function') {
        nextState = updater(prevState);
      } else {
        nextState = { ...prevState, ...updater };
      }

      // Apply middleware
      for (const middleware of this.middleware) {
        nextState = middleware(action, prevState, nextState);
      }

      // Validate state if validation function is provided
      if (this.validation && !this.validation(nextState)) {
        logger.error('State validation failed', { action, nextState }, 'StateStore');
        return;
      }

      this.state = nextState;

      // Persist to localStorage
      if (this.persistKey) {
        this.saveToStorage();
      }

      // Notify listeners
      this.listeners.forEach(listener => {
        try {
          listener(nextState);
        } catch (error) {
          logger.error('State listener error', { error, action }, 'StateStore');
        }
      });

      logger.debug('State updated', { action, hasListeners: this.listeners.size > 0 }, 'StateStore');
    } catch (error) {
      logger.error('setState failed', { error, action }, 'StateStore');
      errorTracking.trackError(error as Error, {
        component: 'StateStore',
        action: 'setState_failed'
      });
    }
  }

  /**
   * Reset to initial state
   */
  reset(initialState?: T): void {
    if (initialState) {
      this.setState(initialState, 'RESET');
    } else {
      this.setState(this.state, 'RESET');
    }
  }

  /**
   * Load state from localStorage
   */
  private loadFromStorage(): void {
    try {
      if (this.persistKey && typeof window !== 'undefined') {
        const stored = localStorage.getItem(this.persistKey);
        if (stored) {
          const parsedState = JSON.parse(stored);
          this.state = { ...this.state, ...parsedState };
          logger.debug('State loaded from storage', { persistKey: this.persistKey }, 'StateStore');
        }
      }
    } catch (error) {
      logger.warn('Failed to load state from storage', { error, persistKey: this.persistKey }, 'StateStore');
    }
  }

  /**
   * Save state to localStorage
   */
  private saveToStorage(): void {
    try {
      if (this.persistKey && typeof window !== 'undefined') {
        localStorage.setItem(this.persistKey, JSON.stringify(this.state));
      }
    } catch (error) {
      logger.warn('Failed to save state to storage', { error, persistKey: this.persistKey }, 'StateStore');
    }
  }

  /**
   * Destroy store and cleanup
   */
  destroy(): void {
    this.listeners.clear();
    if (this.persistKey && typeof window !== 'undefined') {
      localStorage.removeItem(this.persistKey);
    }
    logger.debug('StateStore destroyed', { persistKey: this.persistKey }, 'StateStore');
  }
}

/**
 * React hook for using state store
 */
export function useStateStore<T>(store: StateStore<T>) {
  const [state, setState] = useState(store.getState());
  const storeRef = useRef(store);

  useEffect(() => {
    storeRef.current = store;
    setState(store.getState());

    const unsubscribe = store.subscribe(setState);
    return unsubscribe;
  }, [store]);

  const updateState = useCallback((updater: Partial<T> | ((prev: T) => T), action?: string) => {
    storeRef.current.setState(updater, action);
  }, []);

  const resetState = useCallback((initialState?: T) => {
    storeRef.current.reset(initialState);
  }, []);

  return {
    state,
    setState: updateState,
    resetState
  };
}

/**
 * Create async state store with loading states
 */
export function createAsyncStore<T>(initialData: T) {
  interface AsyncState {
    data: T;
    loading: LoadingState;
    error: string | null;
  }

  const store = new StateStore<AsyncState>({
    initialState: {
      data: initialData,
      loading: 'idle' as LoadingState,
      error: null
    },
    middleware: [
      (action, prevState, nextState) => {
        // Auto-clear errors when loading starts
        if (nextState.loading === 'loading' && prevState.error) {
          return { ...nextState, error: null };
        }
        return nextState;
      }
    ]
  });

  return {
    store,
    setLoading: (loading: LoadingState) => store.setState({ loading }, 'SET_LOADING'),
    setData: (data: T) => store.setState({ data, loading: 'success' }, 'SET_DATA'),
    setError: (error: string) => store.setState({ error, loading: 'error' }, 'SET_ERROR'),
    reset: () => store.setState({ data: initialData, loading: 'idle', error: null }, 'RESET')
  };
}

/**
 * Global store instances for common app state
 */
export const appStateStore = new StateStore({
  initialState: {
    user: null,
    theme: 'light',
    sidebarCollapsed: false,
    notifications: [],
    connectionStatus: 'online'
  },
  persistKey: 'app-state',
  middleware: [
    // Theme persistence middleware
    (action, prev, next) => {
      if (action === 'SET_THEME' && typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', next.theme);
      }
      return next;
    }
  ]
});

export const formStateStore = new StateStore({
  initialState: {
    activeForm: null,
    formData: {},
    validationErrors: {},
    isDirty: false
  }
});