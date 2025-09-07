import { useAuth } from '@/contexts/AuthContext';

export interface SalesMetrics {
  timestamp: number;
  action: 'create' | 'update' | 'delete' | 'view' | 'search';
  duration: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export interface SalesAuditLog {
  timestamp: number;
  userId: string;
  action: string;
  entityId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

class SalesMonitoringClass {
  private metrics: SalesMetrics[] = [];
  private auditLogs: SalesAuditLog[] = [];
  private performanceObserver: PerformanceObserver | null = null;

  constructor() {
    this.initPerformanceMonitoring();
  }

  // Initialize performance monitoring
  private initPerformanceMonitoring() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name.includes('sales') || entry.name.includes('garentille')) {
            this.recordMetric({
              timestamp: Date.now(),
              action: 'view',
              duration: entry.duration,
              success: true,
              metadata: {
                entryType: entry.entryType,
                name: entry.name
              }
            });
          }
        }
      });

      this.performanceObserver.observe({ entryTypes: ['navigation', 'resource', 'measure'] });
    }
  }

  // Record performance metrics
  recordMetric(metric: SalesMetrics) {
    this.metrics.push(metric);
    
    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Send critical errors to monitoring service
    if (!metric.success && metric.error) {
      this.reportError(metric);
    }
  }

  // Record audit logs for compliance
  recordAuditLog(log: SalesAuditLog) {
    this.auditLogs.push(log);
    
    // Keep only last 500 audit logs locally
    if (this.auditLogs.length > 500) {
      this.auditLogs = this.auditLogs.slice(-500);
    }

    // Send to backend for permanent storage
    this.sendAuditLogToBackend(log);
  }

  // Measure operation performance
  async measureOperation<T>(
    operation: () => Promise<T>,
    action: SalesMetrics['action'],
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      
      this.recordMetric({
        timestamp: Date.now(),
        action,
        duration,
        success: true,
        metadata
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.recordMetric({
        timestamp: Date.now(),
        action,
        duration,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata
      });
      
      throw error;
    }
  }

  // Get performance statistics
  getPerformanceStats(action?: SalesMetrics['action']) {
    const filteredMetrics = action 
      ? this.metrics.filter(m => m.action === action)
      : this.metrics;

    if (filteredMetrics.length === 0) {
      return { count: 0, avgDuration: 0, successRate: 0, errorRate: 0 };
    }

    const durations = filteredMetrics.map(m => m.duration);
    const successCount = filteredMetrics.filter(m => m.success).length;
    
    return {
      count: filteredMetrics.length,
      avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      successRate: (successCount / filteredMetrics.length) * 100,
      errorRate: ((filteredMetrics.length - successCount) / filteredMetrics.length) * 100,
      recentErrors: filteredMetrics
        .filter(m => !m.success)
        .slice(-5)
        .map(m => ({ error: m.error, timestamp: m.timestamp }))
    };
  }

  // Report error to external monitoring service
  private reportError(metric: SalesMetrics) {
    // In a real app, send to services like Sentry, DataDog, etc.
    console.error('Sales operation error:', {
      action: metric.action,
      error: metric.error,
      duration: metric.duration,
      metadata: metric.metadata,
      timestamp: new Date(metric.timestamp).toISOString()
    });
  }

  // Send audit log to backend
  private async sendAuditLogToBackend(log: SalesAuditLog) {
    try {
      // In a real app, send to audit logging service
      console.log('Audit log:', {
        ...log,
        timestamp: new Date(log.timestamp).toISOString()
      });
    } catch (error) {
      console.error('Failed to send audit log:', error);
    }
  }

  // Track user interactions
  trackUserInteraction(action: string, details?: Record<string, any>) {
    this.recordMetric({
      timestamp: Date.now(),
      action: 'view',
      duration: 0,
      success: true,
      metadata: {
        userInteraction: action,
        ...details
      }
    });
  }

  // Get recent audit logs
  getAuditLogs(limit: number = 50): SalesAuditLog[] {
    return this.auditLogs.slice(-limit);
  }

  // Cleanup resources
  destroy() {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
  }
}

// Singleton instance
export const SalesMonitoringService = new SalesMonitoringClass();

// React hook for easy monitoring
export function useSalesMonitoring() {
  const { user } = useAuth();

  const recordAudit = (action: string, details?: {
    entityId?: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
  }) => {
    if (!user?.id) return;

    SalesMonitoringService.recordAuditLog({
      timestamp: Date.now(),
      userId: user.id,
      action,
      entityId: details?.entityId,
      oldValues: details?.oldValues,
      newValues: details?.newValues,
      ipAddress: 'client-side', // Would be set by backend
      userAgent: navigator.userAgent
    });
  };

  const measureAsync = <T,>(
    operation: () => Promise<T>,
    action: SalesMetrics['action'],
    metadata?: Record<string, any>
  ) => {
    return SalesMonitoringService.measureOperation(operation, action, metadata);
  };

  const trackInteraction = (action: string, details?: Record<string, any>) => {
    SalesMonitoringService.trackUserInteraction(action, details);
  };

  return {
    recordAudit,
    measureAsync,
    trackInteraction,
    getStats: () => SalesMonitoringService.getPerformanceStats(),
    getAuditLogs: (limit?: number) => SalesMonitoringService.getAuditLogs(limit)
  };
}
