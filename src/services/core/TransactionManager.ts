/**
 * TRANSACTION MANAGER
 * Handles multi-step operations with automatic rollback on failure
 * Ensures data integrity across related entities
 */

import { logger } from '@/utils/logger';

export interface TransactionStep<T = any> {
  name: string;
  execute: () => Promise<T>;
  rollback?: (result?: T) => Promise<void>;
}

export interface TransactionResult<T = any> {
  success: boolean;
  results: T[];
  errors: Error[];
  rolledBack: boolean;
}

/**
 * Executes multiple operations as a transaction
 * Automatically rolls back on failure
 */
export class TransactionManager {
  /**
   * Execute steps in sequence with automatic rollback
   */
  static async executeTransaction<T = any>(
    steps: TransactionStep<T>[],
    transactionName: string = 'Transaction'
  ): Promise<TransactionResult<T>> {
    logger.info(`Starting transaction: ${transactionName}`, { stepCount: steps.length }, 'TransactionManager');

    const results: T[] = [];
    const errors: Error[] = [];
    const executedSteps: Array<{ step: TransactionStep<T>; result: T }> = [];

    try {
      // Execute each step
      for (const step of steps) {
        try {
          logger.debug(`Executing step: ${step.name}`, {}, 'TransactionManager');
          const result = await step.execute();
          results.push(result);
          executedSteps.push({ step, result });
        } catch (error) {
          logger.error(`Step failed: ${step.name}`, { error }, 'TransactionManager');
          errors.push(error as Error);
          
          // Rollback all executed steps
          await this.rollback(executedSteps, transactionName);
          
          return {
            success: false,
            results,
            errors,
            rolledBack: true
          };
        }
      }

      logger.info(`Transaction completed successfully: ${transactionName}`, {}, 'TransactionManager');
      
      return {
        success: true,
        results,
        errors: [],
        rolledBack: false
      };
    } catch (error) {
      logger.error(`Transaction failed: ${transactionName}`, { error }, 'TransactionManager');
      
      // Attempt rollback
      await this.rollback(executedSteps, transactionName);
      
      return {
        success: false,
        results,
        errors: [error as Error],
        rolledBack: true
      };
    }
  }

  /**
   * Rollback executed steps in reverse order
   */
  private static async rollback<T>(
    executedSteps: Array<{ step: TransactionStep<T>; result: T }>,
    transactionName: string
  ): Promise<void> {
    logger.warn(`Rolling back transaction: ${transactionName}`, { stepCount: executedSteps.length }, 'TransactionManager');

    // Rollback in reverse order
    for (let i = executedSteps.length - 1; i >= 0; i--) {
      const { step, result } = executedSteps[i];
      
      if (step.rollback) {
        try {
          logger.debug(`Rolling back step: ${step.name}`, {}, 'TransactionManager');
          await step.rollback(result);
        } catch (rollbackError) {
          logger.error(`Rollback failed for step: ${step.name}`, { rollbackError }, 'TransactionManager');
          // Continue rolling back other steps even if one fails
        }
      }
    }

    logger.info(`Rollback completed: ${transactionName}`, {}, 'TransactionManager');
  }

  /**
   * Execute operations in parallel with partial rollback support
   */
  static async executeParallel<T = any>(
    steps: TransactionStep<T>[],
    transactionName: string = 'Parallel Transaction'
  ): Promise<TransactionResult<T>> {
    logger.info(`Starting parallel transaction: ${transactionName}`, { stepCount: steps.length }, 'TransactionManager');

    try {
      // Execute all steps in parallel
      const settled = await Promise.allSettled(
        steps.map(step => step.execute())
      );

      const results: T[] = [];
      const errors: Error[] = [];
      const successfulSteps: Array<{ step: TransactionStep<T>; result: T; index: number }> = [];

      settled.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
          successfulSteps.push({ step: steps[index], result: result.value, index });
        } else {
          errors.push(result.reason);
        }
      });

      // If any failed, rollback successful ones
      if (errors.length > 0) {
        logger.warn(`${errors.length} steps failed, rolling back successful steps`, {}, 'TransactionManager');
        
        for (const { step, result } of successfulSteps) {
          if (step.rollback) {
            try {
              await step.rollback(result);
            } catch (rollbackError) {
              logger.error(`Rollback failed for step: ${step.name}`, { rollbackError }, 'TransactionManager');
            }
          }
        }

        return {
          success: false,
          results,
          errors,
          rolledBack: true
        };
      }

      logger.info(`Parallel transaction completed successfully: ${transactionName}`, {}, 'TransactionManager');

      return {
        success: true,
        results,
        errors: [],
        rolledBack: false
      };
    } catch (error) {
      logger.error(`Parallel transaction failed: ${transactionName}`, { error }, 'TransactionManager');
      
      return {
        success: false,
        results: [],
        errors: [error as Error],
        rolledBack: false
      };
    }
  }
}
