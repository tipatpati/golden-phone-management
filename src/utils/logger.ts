/**
 * Production-ready logging system that replaces console.log usage
 * Automatically filters out logs in production builds
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  component?: string;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 100;

  private formatMessage(level: LogLevel, message: string, data?: any, component?: string): LogEntry {
    return {
      level,
      message,
      data: this.sanitizeData(data),
      timestamp: new Date().toISOString(),
      component
    };
  }

  private sanitizeData(data: any): any {
    if (!data) return data;
    
    // Remove sensitive fields
    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'auth', 
      'session', 'cookie', 'authorization', 'credential',
      'user_metadata', 'raw_user_meta_data'
    ];
    
    if (typeof data === 'object' && data !== null) {
      const sanitized = Array.isArray(data) ? [...data] : { ...data };
      
      const sanitizeObject = (obj: any): any => {
        if (typeof obj !== 'object' || obj === null) return obj;
        
        if (Array.isArray(obj)) {
          return obj.map(item => sanitizeObject(item));
        }
        
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
          if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
            result[key] = '[REDACTED]';
          } else if (typeof value === 'object') {
            result[key] = sanitizeObject(value);
          } else {
            result[key] = value;
          }
        }
        return result;
      };
      
      return sanitizeObject(sanitized);
    }
    
    return data;
  }

  private shouldLog(level: LogLevel): boolean {
    // Only log in development, or errors/warnings in production
    return this.isDevelopment || level === 'error' || level === 'warn';
  }

  private writeToBuffer(entry: LogEntry) {
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }
  }

  debug(message: string, data?: any, component?: string) {
    const entry = this.formatMessage('debug', message, data, component);
    this.writeToBuffer(entry);
    
    if (this.shouldLog('debug')) {
      console.log(`[DEBUG] ${component ? `[${component}] ` : ''}${message}`, data || '');
    }
  }

  info(message: string, data?: any, component?: string) {
    const entry = this.formatMessage('info', message, data, component);
    this.writeToBuffer(entry);
    
    if (this.shouldLog('info')) {
      console.log(`[INFO] ${component ? `[${component}] ` : ''}${message}`, data || '');
    }
  }

  warn(message: string, data?: any, component?: string) {
    const entry = this.formatMessage('warn', message, data, component);
    this.writeToBuffer(entry);
    
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${component ? `[${component}] ` : ''}${message}`, data || '');
    }
  }

  error(message: string, data?: any, component?: string) {
    const entry = this.formatMessage('error', message, data, component);
    this.writeToBuffer(entry);
    
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${component ? `[${component}] ` : ''}${message}`, data || '');
    }

    // In production, could send to error tracking service
    if (!this.isDevelopment) {
      // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    }
  }

  // Get recent logs for debugging
  getRecentLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logBuffer.filter(entry => entry.level === level);
    }
    return [...this.logBuffer];
  }

  // Clear log buffer
  clearLogs() {
    this.logBuffer = [];
  }
}

// Export singleton logger instance
export const logger = new Logger();

// Export convenient methods for easier migration from console.log
export const log = {
  debug: (message: string, data?: any, component?: string) => logger.debug(message, data, component),
  info: (message: string, data?: any, component?: string) => logger.info(message, data, component),
  warn: (message: string, data?: any, component?: string) => logger.warn(message, data, component),
  error: (message: string, data?: any, component?: string) => logger.error(message, data, component),
};