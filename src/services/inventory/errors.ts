// ============================================
// UNIFIED ERROR HANDLING FOR INVENTORY
// ============================================

export class InventoryError extends Error {
  public readonly code: string;
  public readonly context?: Record<string, any>;
  public readonly originalError?: Error;

  constructor(
    message: string, 
    code: string, 
    context?: Record<string, any>, 
    originalError?: Error
  ) {
    super(message);
    this.name = 'InventoryError';
    this.code = code;
    this.context = context;
    this.originalError = originalError;
  }

  static createValidationError(
    field: string, 
    message: string, 
    value?: any
  ): InventoryError {
    return new InventoryError(
      message,
      'VALIDATION_ERROR',
      { field, value }
    );
  }

  static createDatabaseError(
    operation: string,
    originalError: Error,
    context?: Record<string, any>
  ): InventoryError {
    return new InventoryError(
      `Database operation failed: ${operation}`,
      'DATABASE_ERROR',
      { operation, ...context },
      originalError
    );
  }

  static createBarcodeError(
    reason: string,
    context?: Record<string, any>
  ): InventoryError {
    return new InventoryError(
      `Barcode operation failed: ${reason}`,
      'BARCODE_ERROR',
      context
    );
  }

  static createBusinessLogicError(
    rule: string,
    context?: Record<string, any>
  ): InventoryError {
    return new InventoryError(
      `Business rule violation: ${rule}`,
      'BUSINESS_RULE_ERROR',
      context
    );
  }
}

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  BARCODE_ERROR: 'BARCODE_ERROR',
  BUSINESS_RULE_ERROR: 'BUSINESS_RULE_ERROR',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  UNIT_NOT_FOUND: 'UNIT_NOT_FOUND',
  DUPLICATE_SERIAL: 'DUPLICATE_SERIAL',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

export function isInventoryError(error: any): error is InventoryError {
  return error instanceof InventoryError;
}

export function handleInventoryError(error: unknown): InventoryError {
  if (isInventoryError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new InventoryError(
      error.message,
      'UNKNOWN_ERROR',
      undefined,
      error
    );
  }

  return new InventoryError(
    String(error),
    'UNKNOWN_ERROR'
  );
}