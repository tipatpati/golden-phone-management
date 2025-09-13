/**
 * Type Safety Migration Utility
 * Provides utilities to replace 'any' types with proper TypeScript types
 */

import { UnknownRecord, StringRecord, NumberRecord, ApiResponse, AppError } from '@/types/global';

export class TypeSafetyMigration {
  /**
   * Safe type assertion with validation
   */
  static assertType<T>(value: unknown, validator: (value: any) => value is T): T {
    if (!validator(value)) {
      throw new Error(`Type assertion failed: value does not match expected type`);
    }
    return value;
  }

  /**
   * Safe object access with type checking
   */
  static safeAccess<T>(obj: UnknownRecord, key: string): T | undefined {
    if (typeof obj === 'object' && obj !== null && key in obj) {
      return obj[key] as T;
    }
    return undefined;
  }

  /**
   * Convert any[] to typed array with validation
   */
  static typedArray<T>(arr: unknown[], validator: (item: any) => item is T): T[] {
    return arr.filter(validator);
  }

  /**
   * Safe JSON parsing with type validation
   */
  static parseJson<T>(json: string, validator: (value: any) => value is T): T | null {
    try {
      const parsed = JSON.parse(json);
      return validator(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  /**
   * Type-safe form data handling
   */
  static extractFormData<T extends Record<string, any>>(
    formData: FormData, 
    schema: Record<keyof T, 'string' | 'number' | 'boolean'>
  ): Partial<T> {
    const result: Partial<T> = {};
    
    for (const [key, type] of Object.entries(schema)) {
      const value = formData.get(key as string);
      if (value !== null) {
        switch (type) {
          case 'string':
            result[key as keyof T] = value.toString() as T[keyof T];
            break;
          case 'number':
            const num = Number(value);
            if (!isNaN(num)) {
              result[key as keyof T] = num as T[keyof T];
            }
            break;
          case 'boolean':
            result[key as keyof T] = (value === 'true' || value === 'on') as T[keyof T];
            break;
        }
      }
    }
    
    return result;
  }

  /**
   * Type guards for common patterns
   */
  static isStringRecord(value: unknown): value is StringRecord {
    return typeof value === 'object' && 
           value !== null && 
           Object.values(value).every(v => typeof v === 'string');
  }

  static isNumberRecord(value: unknown): value is NumberRecord {
    return typeof value === 'object' && 
           value !== null && 
           Object.values(value).every(v => typeof v === 'number');
  }

  static isApiResponse<T>(value: unknown): value is ApiResponse<T> {
    return typeof value === 'object' && 
           value !== null && 
           'success' in value && 
           typeof (value as any).success === 'boolean';
  }

  static isAppError(value: unknown): value is AppError {
    return value instanceof Error && 
           'code' in value && 
           'severity' in value;
  }

  /**
   * Convert unknown to safe types
   */
  static toSafeString(value: unknown): string {
    if (typeof value === 'string') return value;
    if (value === null || value === undefined) return '';
    return String(value);
  }

  static toSafeNumber(value: unknown): number | null {
    if (typeof value === 'number' && !isNaN(value)) return value;
    if (typeof value === 'string') {
      const num = Number(value);
      return isNaN(num) ? null : num;
    }
    return null;
  }

  static toSafeBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value === 'true';
    return Boolean(value);
  }

  /**
   * Create typed error with context
   */
  static createTypedError(message: string, context?: UnknownRecord): AppError {
    const error = new Error(message) as AppError;
    error.code = 'TYPE_SAFETY_ERROR';
    error.context = context;
    error.timestamp = new Date().toISOString();
    error.severity = 'medium';
    return error;
  }
}