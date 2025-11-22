/**
 * Exchange Data Consistency and Integrity Hook
 * Validates exchange data integrity and provides auto-fix capabilities
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export interface ExchangeViolation {
  exchange_id: string;
  issue_type: string;
  severity: 'warning' | 'error' | 'critical';
  description: string;
  details: Record<string, any>;
}

export interface ExchangeConsistencyReport {
  isHealthy: boolean;
  violations: ExchangeViolation[];
  orphanedTradeIns: number;
  missingInventory: number;
  inconsistentTotals: number;
  missingLinkedSales: number;
  invalidStatuses: number;
  lastCheckTime: Date;
}

export function useExchangeConsistency() {
  const [isChecking, setIsChecking] = useState(false);
  const [report, setReport] = useState<ExchangeConsistencyReport | null>(null);

  /**
   * Run full exchange integrity check
   */
  const runIntegrityCheck = useCallback(async (): Promise<ExchangeConsistencyReport> => {
    setIsChecking(true);
    console.log('🔍 [Exchange Integrity] Running full consistency check...');

    try {
      const { data: violations, error } = await supabase.rpc('validate_exchange_integrity');

      if (error) {
        console.error('❌ [Exchange Integrity] Check failed:', error);
        throw error;
      }

      const typedViolations = (violations || []) as ExchangeViolation[];

      const newReport: ExchangeConsistencyReport = {
        isHealthy: typedViolations.length === 0,
        violations: typedViolations,
        orphanedTradeIns: typedViolations.filter(v => v.issue_type === 'orphaned_trade_in').length,
        missingInventory: typedViolations.filter(v => v.issue_type === 'missing_inventory').length,
        inconsistentTotals: typedViolations.filter(v => v.issue_type === 'inconsistent_totals').length,
        missingLinkedSales: typedViolations.filter(v => v.issue_type === 'missing_linked_sale').length,
        invalidStatuses: typedViolations.filter(v => v.issue_type === 'invalid_status').length,
        lastCheckTime: new Date()
      };

      console.log('📊 [Exchange Integrity] Check complete:', newReport);
      setReport(newReport);

      if (newReport.isHealthy) {
        toast.success('Exchange integrity check passed - all systems healthy');
      } else {
        toast.warning(`Found ${typedViolations.length} integrity issue(s) in exchanges`);
      }

      return newReport;

    } catch (error: any) {
      console.error('❌ [Exchange Integrity] Check failed:', error);
      toast.error(`Integrity check failed: ${error.message}`);
      
      const errorReport: ExchangeConsistencyReport = {
        isHealthy: false,
        violations: [],
        orphanedTradeIns: 0,
        missingInventory: 0,
        inconsistentTotals: 0,
        missingLinkedSales: 0,
        invalidStatuses: 0,
        lastCheckTime: new Date()
      };
      
      setReport(errorReport);
      return errorReport;
    } finally {
      setIsChecking(false);
    }
  }, []);

  /**
   * Get violations by severity
   */
  const getViolationsBySeverity = useCallback((severity: 'warning' | 'error' | 'critical'): ExchangeViolation[] => {
    if (!report) return [];
    return report.violations.filter(v => v.severity === severity);
  }, [report]);

  /**
   * Get violations for a specific exchange
   */
  const getViolationsForExchange = useCallback((exchangeId: string): ExchangeViolation[] => {
    if (!report) return [];
    return report.violations.filter(v => v.exchange_id === exchangeId);
  }, [report]);

  const criticalCount = report?.violations.filter(v => v.severity === 'critical').length || 0;
  const errorCount = report?.violations.filter(v => v.severity === 'error').length || 0;
  const warningCount = report?.violations.filter(v => v.severity === 'warning').length || 0;

  return {
    isChecking,
    report,
    runIntegrityCheck,
    getViolationsBySeverity,
    getViolationsForExchange,
    hasViolations: (report?.violations.length || 0) > 0,
    hasCriticalViolations: criticalCount > 0,
    criticalCount,
    errorCount,
    warningCount
  };
}
