type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  debug: (message: string, data?: any, context?: string) => void;
  info: (message: string, data?: any, context?: string) => void;
  warn: (message: string, data?: any, context?: string) => void;
  error: (message: string, data?: any, context?: string) => void;
}

class SecureLogger implements Logger {
  private isProduction = process.env.NODE_ENV === 'production';
  private isDevelopment = process.env.NODE_ENV === 'development';

  private shouldLog(level: LogLevel): boolean {
    if (this.isProduction) {
      // In production, only log warnings and errors
      return level === 'warn' || level === 'error';
    }
    return true; // Log everything in development
  }

  private sanitizeData(data: any): any {
    if (!data) return data;
    
    // Remove sensitive fields
    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'auth', 
      'session', 'cookie', 'authorization', 'credential'
    ];
    
    if (typeof data === 'object') {
      const sanitized = { ...data };
      sensitiveFields.forEach(field => {
        if (field in sanitized) {
          sanitized[field] = '[REDACTED]';
        }
      });
      return sanitized;
    }
    
    return data;
  }

  private formatMessage(level: LogLevel, message: string, context?: string): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    return `${timestamp} [${level.toUpperCase()}]${contextStr} ${message}`;
  }

  debug(message: string, data?: any, context?: string): void {
    if (!this.shouldLog('debug')) return;
    console.debug(this.formatMessage('debug', message, context), this.sanitizeData(data));
  }

  info(message: string, data?: any, context?: string): void {
    if (!this.shouldLog('info')) return;
    console.info(this.formatMessage('info', message, context), this.sanitizeData(data));
  }

  warn(message: string, data?: any, context?: string): void {
    if (!this.shouldLog('warn')) return;
    console.warn(this.formatMessage('warn', message, context), this.sanitizeData(data));
  }

  error(message: string, data?: any, context?: string): void {
    if (!this.shouldLog('error')) return;
    console.error(this.formatMessage('error', message, context), this.sanitizeData(data));
    
    // In production, you could send errors to an external service
    if (this.isProduction) {
      // TODO: Integrate with error reporting service (Sentry, LogRocket, etc.)
    }
  }
}

export const logger = new SecureLogger();

// Re-export the existing log object for backwards compatibility
export const log = {
  debug: logger.debug,
  info: logger.info,
  warn: logger.warn,
  error: logger.error
};