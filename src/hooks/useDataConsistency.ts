// ============================================
// DATA CONSISTENCY HOOKS
// Now includes exchange module validation
// ============================================

import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { dataConsistencyLayer, ConsistencyReport, ConsistencyViolation } from '@/services/core/DataConsistencyLayer';
import { conflictResolution, DataConflict } from '@/services/core/ConflictResolution';
import { eventBus } from '@/services/core/EventBus';
import { logger } from '@/utils/logger';
import { useExchangeConsistency } from './useExchangeConsistency';

export function useConsistencyReport() {
  const queryClient = useQueryClient();
  const [isRunning, setIsRunning] = useState(false);

  const { data: report, refetch } = useQuery({
    queryKey: ['consistency', 'report'],
    queryFn: async () => {
      setIsRunning(true);
      try {
        return await dataConsistencyLayer.runFullConsistencyCheck();
      } finally {
        setIsRunning(false);
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: false // Manual trigger only
  });

  const runCheck = useCallback(async () => {
    await refetch();
  }, [refetch]);

  useEffect(() => {
    const handleReport = (event: any) => {
      if (event.type === 'consistency:report') {
        queryClient.setQueryData(['consistency', 'report'], event.data);
      }
    };

    eventBus.on('consistency:report', handleReport);
    return () => eventBus.off('consistency:report', handleReport);
  }, [queryClient]);

  return {
    report,
    isRunning,
    runCheck,
    hasViolations: report?.violations.length > 0,
    status: report?.status || 'unknown'
  };
}

export function useConsistencyViolations() {
  const [violations, setViolations] = useState<ConsistencyViolation[]>([]);

  useEffect(() => {
    const handleViolation = (violation: ConsistencyViolation) => {
      setViolations(prev => {
        const existing = prev.find(v => 
          v.ruleId === violation.ruleId && 
          v.entityId === violation.entityId
        );
        if (existing) return prev;
        return [...prev, violation];
      });
    };

    const handleReport = (event: any) => {
      if (event.type === 'consistency:report') {
        setViolations(event.data.violations || []);
      }
    };

    eventBus.on('consistency:violation', handleViolation);
    eventBus.on('consistency:report', handleReport);

    return () => {
      eventBus.off('consistency:violation', handleViolation);
      eventBus.off('consistency:report', handleReport);
    };
  }, []);

  const clearViolation = useCallback((violationId: string) => {
    setViolations(prev => prev.filter(v => 
      `${v.ruleId}-${v.entityId}` !== violationId
    ));
  }, []);

  const getViolationsByEntity = useCallback((entity: string) => {
    return violations.filter(v => v.entity === entity);
  }, [violations]);

  const getViolationsBySeverity = useCallback((severity: 'warning' | 'error' | 'critical') => {
    return violations.filter(v => v.severity === severity);
  }, [violations]);

  return {
    violations,
    clearViolation,
    getViolationsByEntity,
    getViolationsBySeverity,
    criticalCount: violations.filter(v => v.severity === 'critical').length,
    errorCount: violations.filter(v => v.severity === 'error').length,
    warningCount: violations.filter(v => v.severity === 'warning').length
  };
}

export function useConflictResolution() {
  const [conflicts, setConflicts] = useState<DataConflict[]>([]);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    const handleConflict = (conflict: DataConflict) => {
      setConflicts(prev => {
        const existing = prev.find(c => c.id === conflict.id);
        if (existing) return prev;
        return [...prev, conflict];
      });
    };

    const handleResolved = (event: any) => {
      if (event.type === 'conflict:resolved') {
        const resolvedConflictId = event.data.conflict.id;
        setConflicts(prev => prev.filter(c => c.id !== resolvedConflictId));
      }
    };

    eventBus.on('data:conflict', handleConflict);
    eventBus.on('conflict:resolved', handleResolved);
    eventBus.on('conflict:manual_resolution_required', handleConflict);

    // Load pending conflicts
    setConflicts(conflictResolution.getPendingConflicts());

    return () => {
      eventBus.off('data:conflict', handleConflict);
      eventBus.off('conflict:resolved', handleResolved);
      eventBus.off('conflict:manual_resolution_required', handleConflict);
    };
  }, []);

  const resolveConflict = useCallback(async (conflictId: string, resolution?: any) => {
    setIsResolving(true);
    try {
      const conflict = conflicts.find(c => c.id === conflictId);
      if (!conflict) {
        throw new Error('Conflict not found');
      }

      let result;
      if (resolution) {
        result = await conflictResolution.resolveManualConflict(conflictId, resolution);
      } else {
        result = await conflictResolution.resolveConflict(conflict);
      }

      if (result.success) {
        logger.info(`Conflict ${conflictId} resolved successfully`);
      } else {
        logger.error(`Failed to resolve conflict ${conflictId}:`, result.error);
      }

      return result;
    } catch (error) {
      logger.error('Error resolving conflict:', error);
      throw error;
    } finally {
      setIsResolving(false);
    }
  }, [conflicts]);

  const getPendingConflicts = useCallback(() => {
    return conflicts.filter(c => !c.resolutionStrategy?.autoApply);
  }, [conflicts]);

  const getCriticalConflicts = useCallback(() => {
    return conflicts.filter(c => c.severity === 'critical');
  }, [conflicts]);

  return {
    conflicts,
    pendingConflicts: getPendingConflicts(),
    criticalConflicts: getCriticalConflicts(),
    isResolving,
    resolveConflict,
    hasConflicts: conflicts.length > 0,
    hasCriticalConflicts: conflicts.some(c => c.severity === 'critical')
  };
}

/**
 * Convenience hook that combines consistency and conflict management
 * for a specific entity, including exchange validation
 */
export function useDataIntegrity(entity: string, entityId?: string) {
  const { violations, getViolationsByEntity } = useConsistencyViolations();
  const { conflicts } = useConflictResolution();
  const exchangeConsistency = useExchangeConsistency();

  const entityViolations = getViolationsByEntity(entity);
  const entityConflicts = conflicts.filter(c => 
    c.entity === entity && (!entityId || c.entityId === entityId)
  );

  // Include exchange violations if checking exchange entity
  const exchangeViolations = entity === 'exchange' && entityId
    ? exchangeConsistency.getViolationsForExchange(entityId)
    : [];

  const hasIssues = entityViolations.length > 0 || entityConflicts.length > 0 || exchangeViolations.length > 0;
  const hasCriticalIssues = 
    entityViolations.some(v => v.severity === 'critical') ||
    entityConflicts.some(c => c.severity === 'critical') ||
    exchangeViolations.some(v => v.severity === 'critical');

  return {
    violations: entityViolations,
    conflicts: entityConflicts,
    exchangeViolations,
    hasIssues,
    hasCriticalIssues,
    issueCount: entityViolations.length + entityConflicts.length + exchangeViolations.length,
    exchangeConsistency
  };
}