import { useState, useEffect } from 'react';
import { TransactionMonitoringService, type TransactionAlert } from '@/services/suppliers/TransactionMonitoringService';
import { TransactionIntegrityService, type IntegrityCheckResult } from '@/services/suppliers/TransactionIntegrityService';
import { eventBus } from '@/services/core/EventBus';

export function useTransactionMonitoring() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [alerts, setAlerts] = useState<TransactionAlert[]>([]);
  const [integrityStatus, setIntegrityStatus] = useState<IntegrityCheckResult | null>(null);

  useEffect(() => {
    // Start monitoring when component mounts
    TransactionMonitoringService.startMonitoring();
    setIsMonitoring(true);

    // Load initial alerts
    setAlerts(TransactionMonitoringService.getAlerts(50));

    // Cleanup on unmount
    return () => {
      TransactionMonitoringService.stopMonitoring();
      setIsMonitoring(false);
    };
  }, []);

  const runIntegrityCheck = async () => {
    try {
      const result = await TransactionIntegrityService.checkAllTransactions();
      setIntegrityStatus(result);
      return result;
    } catch (error) {
      console.error('Failed to run integrity check:', error);
      throw error;
    }
  };

  const fixTransactionIssues = async () => {
    try {
      const report = await TransactionIntegrityService.fixTransactionIssues();
      // Refresh integrity status after fixes
      const newStatus = await TransactionIntegrityService.checkAllTransactions();
      setIntegrityStatus(newStatus);
      return report;
    } catch (error) {
      console.error('Failed to fix transaction issues:', error);
      throw error;
    }
  };

  const clearAlerts = () => {
    TransactionMonitoringService.clearAlerts();
    setAlerts([]);
  };

  const clearTransactionAlerts = (transactionId: string) => {
    TransactionMonitoringService.clearTransactionAlerts(transactionId);
    setAlerts(prev => prev.filter(alert => alert.transactionId !== transactionId));
  };

  const getMonitoringStatus = () => {
    return TransactionMonitoringService.getMonitoringStatus();
  };

  return {
    isMonitoring,
    alerts,
    integrityStatus,
    runIntegrityCheck,
    fixTransactionIssues,
    clearAlerts,
    clearTransactionAlerts,
    getMonitoringStatus
  };
}