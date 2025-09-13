/**
 * Global Type Definitions
 * Centralizes common types to eliminate 'any' usage and improve type safety
 */

// Replace common 'any' patterns with proper types
export type UnknownRecord = Record<string, unknown>;
export type StringRecord = Record<string, string>;
export type NumberRecord = Record<string, number>;

// Form field change handler type
export type FieldChangeHandler<T> = <K extends keyof T>(field: K, value: T[K]) => void;

// Generic API response type
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  success: boolean;
  message?: string;
}

// Generic error type with context
export interface AppError extends Error {
  code?: string;
  context?: UnknownRecord;
  timestamp?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

// Event handler types
export type EventHandler<T = Event> = (event: T) => void;
export type AsyncEventHandler<T = Event> = (event: T) => Promise<void>;

// Component props with strict typing
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  testId?: string;
}

// Form validation types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// Search and filter types
export interface SearchFilters {
  searchTerm?: string;
  category?: string;
  status?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// Pagination types
export interface PaginationState {
  page: number;
  limit: number;
  total: number;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: PaginationState;
}

// Loading states
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  loading: LoadingState;
  error: string | null;
}

// Database entity types
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// File upload types
export interface FileUpload {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

// Theme and styling types
export type ThemeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error';
export type ComponentSize = 'sm' | 'md' | 'lg';

// Permission and role types
export type Permission = string;
export type Role = string;

export interface UserPermissions {
  roles: Role[];
  permissions: Permission[];
}

// Utility types for better type safety
export type NonEmptyArray<T> = [T, ...T[]];
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Replace any[] with proper array types
export type StringArray = string[];
export type NumberArray = number[];
export type BooleanArray = boolean[];

// Function types
export type VoidFunction = () => void;
export type AsyncVoidFunction = () => Promise<void>;
export type ValueFunction<T> = () => T;
export type AsyncValueFunction<T> = () => Promise<T>;

// Environment types
export interface Environment {
  NODE_ENV: 'development' | 'production' | 'test';
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_PUBLISHABLE_KEY: string;
}