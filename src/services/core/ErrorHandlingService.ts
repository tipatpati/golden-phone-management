import { toast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface ErrorResponse {
  message: string;
  code?: string;
  details?: any;
}

export class ErrorHandlingService {
  private static instance: ErrorHandlingService;

  private constructor() {}

  public static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  /**
   * Handle errors with consistent logging and user feedback
   */
  public handleError(
    error: unknown,
    context: ErrorContext,
    showToast: boolean = true
  ): ErrorResponse {
    const errorResponse = this.parseError(error);
    
    // Log error for monitoring
    logger.error(
      `${context.component || 'Unknown'}: ${context.action || 'Unknown action'} failed`,
      {
        error: errorResponse,
        context,
        timestamp: new Date().toISOString(),
      },
      context.component || 'ErrorHandling'
    );

    // Show user feedback if requested
    if (showToast) {
      this.showErrorToast(errorResponse, context);
    }

    return errorResponse;
  }

  /**
   * Parse different error types into consistent format
   */
  private parseError(error: unknown): ErrorResponse {
    if (error instanceof Error) {
      return {
        message: error.message,
        details: error.stack,
      };
    }

    if (typeof error === 'string') {
      return { message: error };
    }

    if (error && typeof error === 'object') {
      const err = error as any;
      return {
        message: err.message || err.error || 'An unexpected error occurred',
        code: err.code || err.status,
        details: err,
      };
    }

    return { message: 'An unknown error occurred' };
  }

  /**
   * Show appropriate toast message based on error type
   */
  private showErrorToast(error: ErrorResponse, context: ErrorContext) {
    const isNetworkError = error.message.includes('fetch') || 
                          error.message.includes('network') ||
                          error.code === 'NETWORK_ERROR';

    const isAuthError = error.code === 'INVALID_CREDENTIALS' ||
                       error.message.includes('authentication') ||
                       error.message.includes('unauthorized');

    const isValidationError = error.code === 'VALIDATION_ERROR' ||
                            error.message.includes('required') ||
                            error.message.includes('invalid');

    let title = 'Error';
    let description = error.message;

    if (isNetworkError) {
      title = 'Connection Error';
      description = 'Unable to connect to the server. Please check your internet connection.';
    } else if (isAuthError) {
      title = 'Authentication Error';
      description = 'Please check your credentials and try again.';
    } else if (isValidationError) {
      title = 'Validation Error';
      description = error.message;
    }

    toast({
      title,
      description,
      variant: 'destructive',
    });
  }

  /**
   * Handle success messages consistently
   */
  public handleSuccess(
    message: string,
    context: ErrorContext,
    details?: any
  ) {
    logger.info(
      `${context.component || 'Unknown'}: ${context.action || 'Action'} succeeded`,
      { message, details, context },
      context.component || 'Success'
    );

    toast({
      title: 'Success',
      description: message,
    });
  }

  /**
   * Handle validation errors specifically
   */
  public handleValidationErrors(
    errors: Record<string, string[]>,
    context: ErrorContext
  ) {
    const firstError = Object.values(errors)[0]?.[0];
    
    if (firstError) {
      this.handleError(
        { message: firstError, code: 'VALIDATION_ERROR' },
        context
      );
    }
  }

  /**
   * Retry wrapper for async operations
   */
  public async withRetry<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          break;
        }

        logger.warn(
          `${context.component}: Attempt ${attempt} failed, retrying...`,
          { error: this.parseError(error), attempt, maxRetries },
          context.component || 'Retry'
        );

        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }

    throw lastError;
  }
}

// Export singleton instance
export const errorHandler = ErrorHandlingService.getInstance();

// Convenience hook for components
export function useErrorHandler(component: string) {
  return {
    handleError: (error: unknown, action: string, showToast: boolean = true) =>
      errorHandler.handleError(error, { component, action }, showToast),
    
    handleSuccess: (message: string, action: string, details?: any) =>
      errorHandler.handleSuccess(message, { component, action }, details),
    
    handleValidationErrors: (errors: Record<string, string[]>, action: string) =>
      errorHandler.handleValidationErrors(errors, { component, action }),
    
    withRetry: <T>(operation: () => Promise<T>, action: string, maxRetries?: number) =>
      errorHandler.withRetry(operation, { component, action }, maxRetries),
  };
}