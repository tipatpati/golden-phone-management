/**
 * Production error tracking and monitoring service
 */

import { logger } from '@/utils/logger';
import { env } from '@/config/environment';
import { errorTrackingConfig } from '@/config/production';

interface ErrorContext {
  userId?: string;
  component?: string;
  action?: string;
  timestamp: string;
  userAgent: string;
  url: string;
}

interface ErrorReport {
  error: Error;
  context: ErrorContext;
  stackTrace?: string;
  breadcrumbs?: string[];
}

class ErrorTrackingService {
  private breadcrumbs: string[] = [];
  private maxBreadcrumbs = 50;

  /**
   * Track an error for monitoring and analysis
   */
  trackError(error: Error, context: Partial<ErrorContext> = {}): void {
    if (!errorTrackingConfig.enabled) {
      logger.error('Error tracked in development', { error: error.message }, 'ErrorTracking');
      return;
    }

    const errorReport: ErrorReport = {
      error,
      context: {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        ...context
      },
      stackTrace: error.stack,
      breadcrumbs: [...this.breadcrumbs]
    };

    // Apply error filtering
    const filteredError = errorTrackingConfig.beforeSend?.(error);
    if (!filteredError) {
      return;
    }

    // Sample errors in production
    if (Math.random() > errorTrackingConfig.sampleRate) {
      return;
    }

    this.sendErrorReport(errorReport);
  }

  /**
   * Add breadcrumb for error context
   */
  addBreadcrumb(message: string, category: string = 'user'): void {
    const breadcrumb = `[${new Date().toISOString()}] ${category}: ${message}`;
    
    this.breadcrumbs.push(breadcrumb);
    
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  /**
   * Track performance issues
   */
  trackPerformance(metric: string, value: number, context?: Record<string, any>): void {
    if (!env.IS_PRODUCTION) return;

    logger.info('Performance metric', { metric, value, context }, 'Performance');
  }

  /**
   * Send error report to monitoring service
   */
  private async sendErrorReport(report: ErrorReport): Promise<void> {
    try {
      // In a real implementation, this would send to your error tracking service
      // For now, we'll log it securely
      logger.error('Production error report', {
        message: report.error.message,
        component: report.context.component,
        url: report.context.url,
        timestamp: report.context.timestamp
      }, 'ErrorTracking');

      // Here you would integrate with services like:
      // - Sentry
      // - LogRocket
      // - Bugsnag
      // - Custom error reporting endpoint
      
    } catch (sendError) {
      logger.error('Failed to send error report', { 
        originalError: report.error.message,
        sendError: sendError instanceof Error ? sendError.message : 'Unknown error'
      }, 'ErrorTracking');
    }
  }

  /**
   * Clear all breadcrumbs
   */
  clearBreadcrumbs(): void {
    this.breadcrumbs = [];
  }
}

export const errorTracking = new ErrorTrackingService();

// Global error handler for unhandled errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    errorTracking.trackError(event.error, {
      component: 'Global',
      action: 'unhandled_error'
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const error = new Error(event.reason?.toString() || 'Unhandled promise rejection');
    errorTracking.trackError(error, {
      component: 'Global',
      action: 'unhandled_promise_rejection'
    });
  });
}