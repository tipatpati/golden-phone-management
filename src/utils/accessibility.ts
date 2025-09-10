/**
 * Accessibility utilities for production-ready components
 */

import { logger } from '@/utils/logger';

/**
 * ARIA labels and accessibility configuration
 */
export const ariaLabels = {
  navigation: {
    main: 'Main navigation',
    breadcrumb: 'Breadcrumb navigation',
    pagination: 'Pagination navigation',
    tabs: 'Tab navigation'
  },
  actions: {
    add: 'Add new item',
    edit: 'Edit item',
    delete: 'Delete item',
    save: 'Save changes',
    cancel: 'Cancel action',
    search: 'Search',
    filter: 'Filter results',
    sort: 'Sort results'
  },
  forms: {
    required: 'Required field',
    optional: 'Optional field',
    error: 'Field has errors',
    success: 'Field is valid'
  },
  status: {
    loading: 'Loading content',
    error: 'Error occurred',
    success: 'Operation successful',
    empty: 'No items found'
  }
};

/**
 * Keyboard navigation helper
 */
export const keyboardHandlers = {
  /**
   * Handle escape key to close modals/dialogs
   */
  escapeKey: (callback: () => void) => (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      callback();
    }
  },

  /**
   * Handle enter key for form submission
   */
  enterKey: (callback: () => void) => (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      callback();
    }
  },

  /**
   * Arrow key navigation for lists/grids
   */
  arrowNavigation: (
    currentIndex: number,
    maxIndex: number,
    onIndexChange: (index: number) => void
  ) => (event: KeyboardEvent) => {
    let newIndex = currentIndex;
    
    switch (event.key) {
      case 'ArrowDown':
        newIndex = Math.min(currentIndex + 1, maxIndex);
        break;
      case 'ArrowUp':
        newIndex = Math.max(currentIndex - 1, 0);
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = maxIndex;
        break;
      default:
        return;
    }
    
    event.preventDefault();
    onIndexChange(newIndex);
  }
};

/**
 * Focus management utilities
 */
export const focusManagement = {
  /**
   * Trap focus within a container
   */
  trapFocus: (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };
    
    container.addEventListener('keydown', handleTabKey);
    
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  },

  /**
   * Restore focus to a previously focused element
   */
  restoreFocus: (element: HTMLElement | null) => {
    if (element && typeof element.focus === 'function') {
      setTimeout(() => element.focus(), 0);
    }
  }
};

/**
 * Screen reader announcements
 */
export const announcements = {
  /**
   * Announce status changes to screen readers
   */
  announce: (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
    
    logger.debug('Screen reader announcement', { message, priority }, 'Accessibility');
  }
};

/**
 * Color contrast and visual accessibility
 */
export const visualAccessibility = {
  /**
   * Check if user prefers reduced motion
   */
  prefersReducedMotion: (): boolean => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  /**
   * Check if user prefers high contrast
   */
  prefersHighContrast: (): boolean => {
    return window.matchMedia('(prefers-contrast: high)').matches;
  },

  /**
   * Get appropriate transition duration based on user preferences
   */
  getTransitionDuration: (defaultDuration: string = '200ms'): string => {
    return visualAccessibility.prefersReducedMotion() ? '0ms' : defaultDuration;
  }
};