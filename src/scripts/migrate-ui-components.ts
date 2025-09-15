/**
 * UI Migration Script - Updates all components to use enhanced UI system
 * This ensures consistent design patterns throughout the application
 */

// Component import mappings for migration
export const UI_COMPONENT_MIGRATIONS = {
  // Dialog components
  '@/components/ui/dialog': '@/components/ui/updated-dialog',
  
  // Card components
  '@/components/ui/card': '@/components/ui/updated-card',
  
  // Button components
  '@/components/ui/button': '@/components/ui/updated-button',
  
  // Status indicators (new)
  'LoadingSpinner': '@/components/ui/loading-states',
  'StatusIndicator': '@/components/ui/status-indicators',
} as const;

// Button variant mappings
export const BUTTON_VARIANT_MIGRATIONS = {
  'outline': 'outlined',
  'default': 'filled',
  'secondary': 'filled-tonal',
  'ghost': 'text',
  'link': 'text',
  'destructive': 'destructive',
} as const;

// Color class replacements for semantic tokens
export const COLOR_CLASS_MIGRATIONS = {
  // Text colors
  'text-gray-500': 'text-muted-foreground',
  'text-gray-600': 'text-muted-foreground',
  'text-gray-700': 'text-foreground',
  'text-gray-800': 'text-foreground',
  'text-gray-900': 'text-foreground',
  'text-white': 'text-primary-foreground',
  'text-black': 'text-foreground',
  
  // Background colors
  'bg-gray-50': 'bg-muted/50',
  'bg-gray-100': 'bg-muted',
  'bg-gray-200': 'bg-border',
  'bg-white': 'bg-background',
  'bg-black': 'bg-foreground',
  
  // Border colors
  'border-gray-200': 'border-border',
  'border-gray-300': 'border-border',
  'border-white': 'border-primary-foreground',
  'border-black': 'border-foreground',
  
  // Status colors - use semantic variants
  'text-red-500': 'text-destructive',
  'text-red-600': 'text-destructive',
  'text-green-500': 'text-green-600 dark:text-green-400',
  'text-green-600': 'text-green-600 dark:text-green-400',
  'text-blue-500': 'text-primary',
  'text-blue-600': 'text-primary',
  'text-purple-600': 'text-primary',
  'text-yellow-600': 'text-yellow-600 dark:text-yellow-400',
  
  // Icon colors (avoiding duplicates)
  'text-indigo-600': 'text-primary',
  'text-violet-600': 'text-primary',
} as const;

// Typography class standardization
export const TYPOGRAPHY_MIGRATIONS = {
  'text-on-surface': 'text-foreground',
  'text-on-surface-variant': 'text-muted-foreground',
  'text-on-primary': 'text-primary-foreground',
} as const;

// Spacing standardization
export const SPACING_MIGRATIONS = {
  // Padding - standardize to design system values
  'p-3': 'p-4',
  'p-5': 'p-6', 
  'p-7': 'p-8',
  
  // Margins
  'm-3': 'm-4',
  'm-5': 'm-6',
  'm-7': 'm-8',
  
  // Gaps
  'gap-3': 'gap-4',
  'gap-5': 'gap-6',
  'gap-7': 'gap-8',
  
  // Space between
  'space-y-3': 'space-y-4',
  'space-y-5': 'space-y-6',
  'space-y-7': 'space-y-8',
} as const;

// Dialog size standardization
export const DIALOG_SIZE_MIGRATIONS = {
  'max-w-md': 'size="sm"',
  'max-w-lg': 'size="md"', 
  'max-w-xl': 'size="md"',
  'max-w-2xl': 'size="md"',
  'max-w-3xl': 'size="lg"',
  'max-w-4xl': 'size="lg"',
  'max-w-5xl': 'size="xl"',
  'max-w-6xl': 'size="xl"',
} as const;

// Custom class removal patterns (remove hardcoded styles)
export const REMOVE_CUSTOM_CLASSES = [
  'w-\\[95vw\\]',
  'sm:w-full',
  'max-h-\\[85vh\\]',
  'sm:max-h-\\[90vh\\]',
  'overflow-y-auto',
  'p-4 sm:p-6',
] as const;

export function getMigrationPatterns() {
  return {
    UI_COMPONENT_MIGRATIONS,
    BUTTON_VARIANT_MIGRATIONS,
    COLOR_CLASS_MIGRATIONS,
    TYPOGRAPHY_MIGRATIONS,
    SPACING_MIGRATIONS,
    DIALOG_SIZE_MIGRATIONS,
    REMOVE_CUSTOM_CLASSES,
  };
}