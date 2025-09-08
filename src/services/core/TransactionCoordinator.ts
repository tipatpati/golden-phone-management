import { logger } from '@/utils/logger';
import { eventBus, EVENT_TYPES, type ModuleEvent } from './EventBus';

/**
 * Transaction state for saga pattern implementation
 */
export interface TransactionStep {
  id: string;
  operation: string;
  module: 'sales' | 'inventory' | 'clients';
  data: any;
  compensationAction?: () => Promise<void>;
  status: 'pending' | 'completed' | 'failed' | 'compensated';
  timestamp: number;
}

export interface TransactionContext {
  id: string;
  steps: TransactionStep[];
  status: 'active' | 'committed' | 'aborted' | 'compensating';
  startTime: number;
  metadata?: any;
}

/**
 * Saga-based transaction coordinator for cross-module operations
 * Ensures data consistency through compensation patterns
 */
export class TransactionCoordinator {
  private static instance: TransactionCoordinator;
  private activeTransactions = new Map<string, TransactionContext>();
  private maxTransactionTime = 30000; // 30 seconds

  private constructor() {}

  static getInstance(): TransactionCoordinator {
    if (!TransactionCoordinator.instance) {
      TransactionCoordinator.instance = new TransactionCoordinator();
    }
    return TransactionCoordinator.instance;
  }

  /**
   * Begin a new distributed transaction
   */
  async beginTransaction(metadata?: any): Promise<string> {
    const transactionId = `txn_${Date.now()}_${Math.random()}`;
    
    const context: TransactionContext = {
      id: transactionId,
      steps: [],
      status: 'active',
      startTime: Date.now(),
      metadata
    };

    this.activeTransactions.set(transactionId, context);
    
    logger.info('TransactionCoordinator: Transaction started', { 
      transactionId, 
      metadata 
    });

    // Set timeout for transaction
    setTimeout(() => {
      this.timeoutTransaction(transactionId);
    }, this.maxTransactionTime);

    return transactionId;
  }

  /**
   * Add a step to the transaction
   */
  async addStep(
    transactionId: string,
    operation: string,
    module: 'sales' | 'inventory' | 'clients',
    data: any,
    compensationAction?: () => Promise<void>
  ): Promise<string> {
    const context = this.activeTransactions.get(transactionId);
    if (!context || context.status !== 'active') {
      throw new Error(`Transaction ${transactionId} is not active`);
    }

    const stepId = `step_${Date.now()}_${Math.random()}`;
    const step: TransactionStep = {
      id: stepId,
      operation,
      module,
      data,
      compensationAction,
      status: 'pending',
      timestamp: Date.now()
    };

    context.steps.push(step);
    
    logger.debug('TransactionCoordinator: Step added', { 
      transactionId, 
      stepId, 
      operation, 
      module 
    });

    return stepId;
  }

  /**
   * Mark a step as completed
   */
  async completeStep(transactionId: string, stepId: string): Promise<void> {
    const context = this.activeTransactions.get(transactionId);
    if (!context) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    const step = context.steps.find(s => s.id === stepId);
    if (!step) {
      throw new Error(`Step ${stepId} not found in transaction ${transactionId}`);
    }

    step.status = 'completed';
    
    logger.debug('TransactionCoordinator: Step completed', { 
      transactionId, 
      stepId 
    });
  }

  /**
   * Mark a step as failed and trigger compensation
   */
  async failStep(transactionId: string, stepId: string, error: Error): Promise<void> {
    const context = this.activeTransactions.get(transactionId);
    if (!context) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    const step = context.steps.find(s => s.id === stepId);
    if (!step) {
      throw new Error(`Step ${stepId} not found in transaction ${transactionId}`);
    }

    step.status = 'failed';
    context.status = 'compensating';
    
    logger.error('TransactionCoordinator: Step failed, starting compensation', { 
      transactionId, 
      stepId, 
      error 
    });

    // Start compensation process
    await this.compensateTransaction(transactionId);
  }

  /**
   * Commit the transaction
   */
  async commitTransaction(transactionId: string): Promise<void> {
    const context = this.activeTransactions.get(transactionId);
    if (!context) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    // Check all steps are completed
    const failedSteps = context.steps.filter(s => s.status === 'failed');
    if (failedSteps.length > 0) {
      throw new Error(`Cannot commit transaction with failed steps: ${failedSteps.map(s => s.id).join(', ')}`);
    }

    const pendingSteps = context.steps.filter(s => s.status === 'pending');
    if (pendingSteps.length > 0) {
      throw new Error(`Cannot commit transaction with pending steps: ${pendingSteps.map(s => s.id).join(', ')}`);
    }

    context.status = 'committed';
    
    logger.info('TransactionCoordinator: Transaction committed', { 
      transactionId, 
      stepCount: context.steps.length,
      duration: Date.now() - context.startTime
    });

    // Emit transaction committed event
    await eventBus.emit({
      type: 'system.transaction_committed',
      module: 'inventory',
      operation: 'update',
      entityId: transactionId,
      data: { transaction: context }
    });

    // Clean up after a delay
    setTimeout(() => {
      this.activeTransactions.delete(transactionId);
    }, 5000);
  }

  /**
   * Abort the transaction and trigger compensation
   */
  async abortTransaction(transactionId: string, reason?: string): Promise<void> {
    const context = this.activeTransactions.get(transactionId);
    if (!context) {
      return; // Already cleaned up
    }

    context.status = 'aborted';
    
    logger.warn('TransactionCoordinator: Transaction aborted', { 
      transactionId, 
      reason 
    });

    await this.compensateTransaction(transactionId);
  }

  /**
   * Compensate completed steps in reverse order
   */
  private async compensateTransaction(transactionId: string): Promise<void> {
    const context = this.activeTransactions.get(transactionId);
    if (!context) return;

    logger.info('TransactionCoordinator: Starting compensation', { transactionId });

    // Get completed steps in reverse order
    const completedSteps = context.steps
      .filter(s => s.status === 'completed')
      .reverse();

    for (const step of completedSteps) {
      try {
        if (step.compensationAction) {
          await step.compensationAction();
          step.status = 'compensated';
          
          logger.debug('TransactionCoordinator: Step compensated', { 
            transactionId, 
            stepId: step.id 
          });
        }
      } catch (error) {
        logger.error('TransactionCoordinator: Compensation failed', { 
          transactionId, 
          stepId: step.id, 
          error 
        });
        
        // Continue with other compensations even if one fails
      }
    }

    // Emit compensation completed event
    await eventBus.emit({
      type: 'system.transaction_compensated',
      module: 'inventory',
      operation: 'update',
      entityId: transactionId,
      data: { transaction: context }
    });

    // Clean up
    setTimeout(() => {
      this.activeTransactions.delete(transactionId);
    }, 1000);
  }

  /**
   * Handle transaction timeout
   */
  private async timeoutTransaction(transactionId: string): Promise<void> {
    const context = this.activeTransactions.get(transactionId);
    if (!context || context.status !== 'active') {
      return;
    }

    logger.warn('TransactionCoordinator: Transaction timed out', { 
      transactionId, 
      duration: Date.now() - context.startTime 
    });

    await this.abortTransaction(transactionId, 'timeout');
  }

  /**
   * Execute operation within a transaction context
   */
  async executeInTransaction<T>(
    transactionId: string,
    operation: string,
    module: 'sales' | 'inventory' | 'clients',
    action: () => Promise<T>,
    compensationAction?: () => Promise<void>
  ): Promise<T> {
    const stepId = await this.addStep(transactionId, operation, module, {}, compensationAction);
    
    try {
      const result = await action();
      await this.completeStep(transactionId, stepId);
      return result;
    } catch (error) {
      await this.failStep(transactionId, stepId, error as Error);
      throw error;
    }
  }

  /**
   * Get transaction status
   */
  getTransactionStatus(transactionId: string): TransactionContext | null {
    return this.activeTransactions.get(transactionId) || null;
  }

  /**
   * Get all active transactions (for monitoring)
   */
  getActiveTransactions(): TransactionContext[] {
    return Array.from(this.activeTransactions.values());
  }

  /**
   * Clean up completed transactions
   */
  cleanup(): void {
    const now = Date.now();
    for (const [id, context] of this.activeTransactions.entries()) {
      if (
        (context.status === 'committed' || context.status === 'aborted') &&
        (now - context.startTime) > 60000 // 1 minute
      ) {
        this.activeTransactions.delete(id);
      }
    }
  }
}

// Export singleton instance
export const transactionCoordinator = TransactionCoordinator.getInstance();