import { toast } from "@/components/ui/sonner";
import { logger } from "@/utils/logger";

/**
 * Standardized error handling utility for consistent error management across the app
 */
export interface ErrorContext {
  component: string;
  operation: string;
  userId?: string;
}

export interface AppError {
  message: string;
  code?: string;
  details?: any;
  context?: ErrorContext;
}

/**
 * Handles errors consistently across the application
 * @param error - The error object or message
 * @param context - Context information about where the error occurred
 * @param showToast - Whether to show a user-facing toast notification
 */
export function handleError(
  error: unknown,
  context: ErrorContext,
  showToast: boolean = true
): AppError {
  const appError: AppError = {
    message: 'An unexpected error occurred',
    context
  };

  // Parse different error types
  if (error instanceof Error) {
    appError.message = error.message;
    appError.details = { stack: error.stack };
  } else if (typeof error === 'string') {
    appError.message = error;
  } else if (error && typeof error === 'object') {
    const errorObj = error as any;
    appError.message = errorObj.message || errorObj.error || 'Unknown error';
    appError.code = errorObj.code;
    appError.details = errorObj;
  }

  // Log the error securely
  logger.error(`${context.component}:${context.operation} failed`, {
    message: appError.message,
    code: appError.code,
    userId: context.userId,
    details: appError.details
  }, context.component);

  // Show user-friendly toast if requested
  if (showToast) {
    const userMessage = getUserFriendlyMessage(appError);
    toast.error(userMessage);
  }

  return appError;
}

/**
 * Converts technical error messages to user-friendly ones
 */
function getUserFriendlyMessage(error: AppError): string {
  const { message, code } = error;

  // Common error code mappings
  const errorMappings: Record<string, string> = {
    'PGRST116': 'No records found',
    'PGRST301': 'Access denied',
    'JWT_EXPIRED': 'Your session has expired. Please log in again.',
    'RATE_LIMIT_EXCEEDED': 'Too many requests. Please try again later.',
    '23505': 'This record already exists',
    '23503': 'Cannot delete: this item is being used elsewhere',
    '42501': 'Permission denied'
  };

  if (code && errorMappings[code]) {
    return errorMappings[code];
  }

  // Pattern-based error handling
  if (message.includes('duplicate key')) {
    return 'This item already exists';
  }
  if (message.includes('foreign key')) {
    return 'Cannot complete action: related data exists';
  }
  if (message.includes('not found')) {
    return 'Item not found';
  }
  if (message.includes('permission') || message.includes('unauthorized')) {
    return 'You do not have permission to perform this action';
  }
  if (message.includes('network') || message.includes('fetch')) {
    return 'Connection error. Please check your internet connection.';
  }

  // Return original message if no mapping found
  return message || 'An unexpected error occurred';
}

/**
 * Async wrapper that handles errors consistently
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: ErrorContext,
  showToast: boolean = true
): Promise<{ data?: T; error?: AppError }> {
  try {
    const data = await operation();
    return { data };
  } catch (error) {
    const appError = handleError(error, context, showToast);
    return { error: appError };
  }
}

/**
 * Custom hook for handling async operations with consistent error handling
 */
export function useErrorHandler(component: string) {
  return {
    handleError: (error: unknown, operation: string, showToast = true) =>
      handleError(error, { component, operation }, showToast),
    
    withErrorHandling: <T>(operation: () => Promise<T>, operationName: string, showToast = true) =>
      withErrorHandling(operation, { component, operation: operationName }, showToast)
  };
}