import { QueryClient } from "@tanstack/react-query";
import { isInventoryError, handleInventoryError } from '@/services/inventory/errors';
import { conflictResolution } from './ConflictResolution';

/**
 * Enhanced global error handler with conflict detection and inventory error integration
 * Provides consistent error handling across the application
 */
export class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  private queryClient: QueryClient | null = null;

  private constructor() {}

  static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler();
    }
    return GlobalErrorHandler.instance;
  }

  setQueryClient(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  handleError(error: any, context?: string) {
    console.error(`Error in ${context || 'API call'}:`, error);
    
    // Handle inventory-specific errors
    if (isInventoryError(error)) {
      const processedError = handleInventoryError(error);
      return processedError.message;
    }
    
    // Handle different types of errors
    if (error?.code === 'PGRST116') {
      return 'Database connection error. Please try again.';
    }
    
    if (error?.message?.includes('duplicate key')) {
      this.handleDuplicateKeyError(error, context);
      return 'This item already exists. Please use a different identifier.';
    }
    
    if (error?.message?.includes('foreign key')) {
      return 'Cannot complete operation due to related data dependencies.';
    }
    
    if (error?.status === 403) {
      return 'You do not have permission to perform this action.';
    }
    
    if (error?.status === 401) {
      return 'Please log in to continue.';
    }

    // Check for data conflicts
    this.detectAndHandleConflicts(error, context);
    
    // Generic error message
    return error?.message || 'An unexpected error occurred. Please try again.';
  }

  private async handleDuplicateKeyError(error: any, context?: string) {
    // Extract entity information from error for conflict detection
    const errorDetails = error?.details || error?.message || '';
    
    // This could indicate a data conflict scenario
    if (errorDetails.includes('serial_number') || errorDetails.includes('barcode')) {
      console.warn('Potential inventory conflict detected:', errorDetails);
    }
  }

  private async detectAndHandleConflicts(error: any, context?: string) {
    // Check if this error might indicate a data conflict
    const conflictIndicators = [
      'version',
      'concurrent',
      'modified',
      'constraint',
      'unique'
    ];

    const errorMessage = (error?.message || '').toLowerCase();
    const hasConflictIndicator = conflictIndicators.some(indicator => 
      errorMessage.includes(indicator)
    );

    if (hasConflictIndicator && context) {
      console.info('Potential data conflict detected, context:', context);
      // In a real scenario, you might trigger conflict detection here
    }
  }

  handleQueryError(error: any, queryKey: string[]) {
    const errorMessage = this.handleError(error, `Query: ${queryKey.join('/')}`);
    
    // Could add retry logic here if needed
    if (this.queryClient && error?.status >= 500) {
      // Server errors - could implement retry with exponential backoff
      console.log('Server error detected, could implement retry logic');
    }
    
    return errorMessage;
  }

  handleMutationError(error: any, operation: string) {
    const errorMessage = this.handleError(error, `Mutation: ${operation}`);
    
    // Log for analytics/monitoring
    this.logErrorForMonitoring(error, operation);
    
    return errorMessage;
  }

  private logErrorForMonitoring(error: any, operation: string) {
    // In a real app, you'd send this to your monitoring service
    console.warn('Logging error for monitoring:', {
      operation,
      error: error?.message,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    });
  }
}

export const globalErrorHandler = GlobalErrorHandler.getInstance();