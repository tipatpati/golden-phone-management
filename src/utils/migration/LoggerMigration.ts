/**
 * Logger Migration Utility
 * Provides automated migration from console.log to structured logging
 */

import { logger } from '@/utils/secureLogger';
import { AppError } from '@/types/global';

export class LoggerMigration {
  private static instance: LoggerMigration;
  private migrationStats = {
    replaced: 0,
    errors: 0,
    startTime: Date.now()
  };

  private constructor() {}

  static getInstance(): LoggerMigration {
    if (!LoggerMigration.instance) {
      LoggerMigration.instance = new LoggerMigration();
    }
    return LoggerMigration.instance;
  }

  /**
   * Replace console.log with structured logger
   */
  replaceConsoleLog(): void {
    if (typeof window !== 'undefined') {
      const originalLog = console.log;
      const originalWarn = console.warn;
      const originalError = console.error;

      // Override console.log
      console.log = (...args: any[]) => {
        this.migrationStats.replaced++;
        const message = args[0];
        const data = args.length > 1 ? args.slice(1) : undefined;
        logger.info(message, data);
      };

      // Override console.warn
      console.warn = (...args: any[]) => {
        this.migrationStats.replaced++;
        const message = args[0];
        const data = args.length > 1 ? args.slice(1) : undefined;
        logger.warn(message, data);
      };

      // Override console.error
      console.error = (...args: any[]) => {
        this.migrationStats.replaced++;
        const message = args[0];
        const data = args.length > 1 ? args.slice(1) : undefined;
        logger.error(message, data);
      };

      // Store originals for potential restoration
      (window as any).__originalConsole = {
        log: originalLog,
        warn: originalWarn,
        error: originalError
      };
    }
  }

  /**
   * Log structured message with context
   */
  logWithContext(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any, context?: string): void {
    try {
      logger[level](message, data, context);
    } catch (error) {
      this.migrationStats.errors++;
      // Fallback to original console
      const original = (window as any).__originalConsole;
      if (original) {
        original[level](message, data);
      }
    }
  }

  /**
   * Get migration statistics
   */
  getStats() {
    return {
      ...this.migrationStats,
      duration: Date.now() - this.migrationStats.startTime
    };
  }

  /**
   * Create error from any value
   */
  createError(error: any, context?: string): AppError {
    const appError = new Error(
      error instanceof Error ? error.message : String(error)
    ) as AppError;
    
    appError.code = 'MIGRATION_ERROR';
    appError.context = { originalError: error, migrationContext: context };
    appError.timestamp = new Date().toISOString();
    appError.severity = 'medium';
    
    return appError;
  }
}

// Export singleton instance
export const loggerMigration = LoggerMigration.getInstance();