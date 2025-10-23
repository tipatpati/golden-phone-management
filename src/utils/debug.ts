/**
 * Debug utility for safe logging in development only
 * Prevents console statements from appearing in production builds
 */

const isDevelopment = import.meta.env.MODE === 'development';

/**
 * Log debug information (only in development)
 */
export const debugLog = (...args: any[]): void => {
  if (isDevelopment) {
    console.log('[DEBUG]', ...args);
  }
};

/**
 * Log warning information (only in development)
 */
export const debugWarn = (...args: any[]): void => {
  if (isDevelopment) {
    console.warn('[WARN]', ...args);
  }
};

/**
 * Log error information (sanitized in production)
 */
export const debugError = (message: string, error?: any): void => {
  if (isDevelopment) {
    console.error('[ERROR]', message, error);
  } else {
    // In production, only log the message without sensitive stack traces
    console.error('[ERROR]', message);
  }
};

/**
 * Log info with safe data filtering (omits sensitive fields)
 */
export const debugInfo = (message: string, data?: any): void => {
  if (isDevelopment && data) {
    // Filter out potentially sensitive fields
    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'api_key'];
    const safeData = { ...data };

    sensitiveKeys.forEach(key => {
      if (safeData[key]) {
        safeData[key] = '[REDACTED]';
      }
    });

    console.info('[INFO]', message, safeData);
  } else if (isDevelopment) {
    console.info('[INFO]', message);
  }
};

/**
 * Performance timing helper (only in development)
 */
export const debugTime = (label: string): void => {
  if (isDevelopment) {
    console.time(`[PERF] ${label}`);
  }
};

/**
 * End performance timing (only in development)
 */
export const debugTimeEnd = (label: string): void => {
  if (isDevelopment) {
    console.timeEnd(`[PERF] ${label}`);
  }
};

/**
 * Table logging for structured data (only in development)
 */
export const debugTable = (data: any): void => {
  if (isDevelopment) {
    console.table(data);
  }
};
