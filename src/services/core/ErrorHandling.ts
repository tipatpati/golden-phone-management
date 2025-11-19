/**
 * UNIFIED ERROR HANDLING
 * Standardized error handling across all services
 */

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  errors: string[];
  warnings?: string[];
}

export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'ServiceError';
    
    // Maintains proper stack trace for where error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ServiceError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      stack: this.stack
    };
  }
}

/**
 * Common error codes
 */
export const ERROR_CODES = {
  // Validation errors
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  
  // Business logic errors
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  INVALID_STATUS: 'INVALID_STATUS',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',
  DEPENDENCY_EXISTS: 'DEPENDENCY_EXISTS',
  
  // System errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

/**
 * Wraps an operation in error handling, converting to ServiceResult
 */
export async function wrapServiceCall<T>(
  operation: () => Promise<T>,
  errorContext?: string
): Promise<ServiceResult<T>> {
  try {
    const data = await operation();
    return {
      success: true,
      data,
      errors: []
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorCode = error instanceof ServiceError ? error.code : ERROR_CODES.UNKNOWN_ERROR;
    
    return {
      success: false,
      errors: [errorContext ? `${errorContext}: ${errorMessage}` : errorMessage],
      warnings: []
    };
  }
}
