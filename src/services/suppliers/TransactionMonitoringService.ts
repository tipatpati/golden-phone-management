import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { eventBus } from '../core/EventBus';

export interface TransactionAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  transactionId?: string;
  timestamp: number;
  data?: any;
}

export class TransactionMonitoringService {
  private static alerts: TransactionAlert[] = [];
  private static maxAlerts = 100;
  private static isMonitoring = false;

  /**
   * Start real-time monitoring of transaction integrity
   */
  static startMonitoring(): void {
    if (this.isMonitoring) return;

    logger.info('🔍 Starting transaction monitoring service');
    this.isMonitoring = true;

    // Monitor new transactions
    this.setupRealtimeMonitoring();

    // Periodic integrity checks
    this.schedulePeriodicChecks();
  }

  /**
   * Stop monitoring
   */
  static stopMonitoring(): void {
    this.isMonitoring = false;
    logger.info('🛑 Transaction monitoring stopped');
  }

  /**
   * Set up real-time monitoring for new transactions
   */
  private static setupRealtimeMonitoring(): void {
    // Monitor new supplier transactions
    supabase
      .channel('transaction-monitoring')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'supplier_transactions'
        },
        (payload) => {
          this.validateNewTransaction(payload.new as any);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'supplier_transactions'
        },
        (payload) => {
          this.validateUpdatedTransaction(payload.new as any);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'supplier_transaction_items'
        },
        (payload) => {
          this.validateNewTransactionItem(payload.new as any);
        }
      )
      .subscribe();
  }

  /**
   * Schedule periodic integrity checks
   */
  private static schedulePeriodicChecks(): void {
    const checkInterval = 5 * 60 * 1000; // 5 minutes

    const runPeriodicCheck = async () => {
      if (!this.isMonitoring) return;

      try {
        await this.performPeriodicIntegrityCheck();
      } catch (error) {
        logger.error('Periodic integrity check failed', { error });
      }

      // Schedule next check
      setTimeout(runPeriodicCheck, checkInterval);
    };

    // Start first check after 1 minute
    setTimeout(runPeriodicCheck, 60000);
  }

  /**
   * Validate a newly created transaction
   */
  private static async validateNewTransaction(transaction: any): Promise<void> {
    const issues: string[] = [];

    // Check for zero total amount
    if (transaction.total_amount === 0) {
      issues.push('Transaction created with zero total amount');
    }

    // Check if transaction number is generated
    if (!transaction.transaction_number) {
      issues.push('Transaction missing transaction number');
    }

    if (issues.length > 0) {
      this.addAlert({
        type: 'warning',
        title: 'New Transaction Issues',
        message: issues.join('; '),
        transactionId: transaction.id,
        data: { transaction }
      });
    }
  }

  /**
   * Validate an updated transaction
   */
  private static async validateUpdatedTransaction(transaction: any): Promise<void> {
    // Check if total was corrected from zero
    if (transaction.total_amount > 0) {
      this.addAlert({
        type: 'info',
        title: 'Transaction Total Updated',
        message: `Transaction ${transaction.transaction_number} total updated to ${transaction.total_amount}`,
        transactionId: transaction.id
      });
    }
  }

  /**
   * Validate a new transaction item
   */
  private static async validateNewTransactionItem(item: any): Promise<void> {
    const issues: string[] = [];

    // Check for zero total cost
    if (item.total_cost === 0 && item.unit_cost > 0) {
      issues.push(`Item has zero total cost despite unit cost of ${item.unit_cost}`);
    }

    // Check for missing product units for serialized products
    const unitIds = item.product_unit_ids;
    if (unitIds && Array.isArray(unitIds) && unitIds.length === 0) {
      issues.push('Item marked with product_unit_ids but array is empty');
    }

    if (issues.length > 0) {
      this.addAlert({
        type: 'warning',
        title: 'Transaction Item Issues',
        message: issues.join('; '),
        transactionId: item.transaction_id,
        data: { item }
      });
    }
  }

  /**
   * Perform periodic integrity check on recent transactions
   */
  private static async performPeriodicIntegrityCheck(): Promise<void> {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    // Check recent transactions with potential issues
    const { data: recentTransactions } = await supabase
      .from('supplier_transactions')
      .select(`
        id,
        transaction_number,
        total_amount,
        created_at,
        supplier_transaction_items (
          id,
          total_cost,
          product_unit_ids
        )
      `)
      .gte('created_at', oneDayAgo.toISOString())
      .eq('total_amount', 0);

    recentTransactions?.forEach(transaction => {
      const items = transaction.supplier_transaction_items || [];
      const hasUnitsWithCost = items.some(item => {
        const unitIds = item.product_unit_ids;
        return item.total_cost > 0 || 
               (unitIds && Array.isArray(unitIds) && unitIds.length > 0);
      });

      if (hasUnitsWithCost) {
        this.addAlert({
          type: 'error',
          title: 'Data Inconsistency Detected',
          message: `Transaction ${transaction.transaction_number} has zero total but contains items with costs or units`,
          transactionId: transaction.id,
          data: { 
            itemsCount: items.length,
            itemsWithCost: items.filter(i => i.total_cost > 0).length,
            itemsWithUnits: items.filter(i => {
              const unitIds = i.product_unit_ids;
              return Array.isArray(unitIds) && unitIds.length > 0;
            }).length
          }
        });
      }
    });
  }

  /**
   * Add an alert to the monitoring system
   */
  private static addAlert(alertData: Omit<TransactionAlert, 'id' | 'timestamp'>): void {
    const alert: TransactionAlert = {
      ...alertData,
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      timestamp: Date.now()
    };

    this.alerts.unshift(alert);

    // Keep only the most recent alerts
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(0, this.maxAlerts);
    }

    // Log the alert
    const logLevel = alert.type === 'error' ? 'error' : alert.type === 'warning' ? 'warn' : 'info';
    logger[logLevel](`🚨 Transaction Alert: ${alert.title}`, {
      message: alert.message,
      transactionId: alert.transactionId,
      data: alert.data
    });

    // Emit event for UI updates
    eventBus.emit({
      type: 'transaction_alert',
      module: 'suppliers',
      operation: 'create',
      entityId: alert.transactionId || 'system',
      data: alert
    });
  }

  /**
   * Get recent alerts
   */
  static getAlerts(limit = 50): TransactionAlert[] {
    return this.alerts.slice(0, limit);
  }

  /**
   * Get alerts for a specific transaction
   */
  static getTransactionAlerts(transactionId: string): TransactionAlert[] {
    return this.alerts.filter(alert => alert.transactionId === transactionId);
  }

  /**
   * Clear all alerts
   */
  static clearAlerts(): void {
    this.alerts = [];
    logger.info('🧹 Transaction alerts cleared');
  }

  /**
   * Clear alerts for a specific transaction
   */
  static clearTransactionAlerts(transactionId: string): void {
    this.alerts = this.alerts.filter(alert => alert.transactionId !== transactionId);
    logger.info(`🧹 Cleared alerts for transaction ${transactionId}`);
  }

  /**
   * Get monitoring status
   */
  static getMonitoringStatus(): {
    isMonitoring: boolean;
    totalAlerts: number;
    errorAlerts: number;
    warningAlerts: number;
    recentAlerts: TransactionAlert[];
  } {
    const errorAlerts = this.alerts.filter(a => a.type === 'error').length;
    const warningAlerts = this.alerts.filter(a => a.type === 'warning').length;
    const recentAlerts = this.alerts.slice(0, 10);

    return {
      isMonitoring: this.isMonitoring,
      totalAlerts: this.alerts.length,
      errorAlerts,
      warningAlerts,
      recentAlerts
    };
  }
}
