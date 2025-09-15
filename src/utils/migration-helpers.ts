/**
 * Migration Utilities for UI Component Updates
 * Helps with systematic migration to enhanced UI system
 */

import { cn } from "@/lib/utils";

// Button variant migration helper
export function migrateButtonVariant(oldVariant: string): string {
  const migrations = {
    'outline': 'outlined',
    'default': 'filled',
    'secondary': 'filled-tonal',
    'ghost': 'text',
    'link': 'text',
    'destructive': 'destructive',
  } as const;
  
  return migrations[oldVariant as keyof typeof migrations] || oldVariant;
}

// Color class migration helper
export function migrateColorClasses(className: string): string {
  const colorMigrations = {
    'text-gray-500': 'text-muted-foreground',
    'text-gray-600': 'text-muted-foreground', 
    'text-gray-700': 'text-foreground',
    'bg-gray-50': 'bg-muted/50',
    'bg-gray-100': 'bg-muted',
    'border-gray-200': 'border-border',
    'text-blue-600': 'text-primary',
    'text-purple-600': 'text-primary',
  } as const;

  let migratedClassName = className;
  
  for (const [oldClass, newClass] of Object.entries(colorMigrations)) {
    migratedClassName = migratedClassName.replace(
      new RegExp(oldClass, 'g'), 
      newClass
    );
  }
  
  return migratedClassName;
}

// Dialog size migration helper
export function migrateDialogSize(className: string): { size: string; cleanClassName: string } {
  const sizeMappings = {
    'max-w-md': 'sm',
    'max-w-lg': 'md',
    'max-w-xl': 'md', 
    'max-w-2xl': 'md',
    'max-w-3xl': 'lg',
    'max-w-4xl': 'lg',
    'max-w-5xl': 'xl',
    'max-w-6xl': 'xl',
  } as const;

  let detectedSize = 'md';
  let cleanClassName = className;

  // Remove size-related classes and detect size
  for (const [sizeClass, size] of Object.entries(sizeMappings)) {
    if (className.includes(sizeClass)) {
      detectedSize = size;
      cleanClassName = cleanClassName.replace(sizeClass, '');
    }
  }

  // Remove other dialog-specific classes that are now handled by enhanced components
  const removePatterns = [
    /w-\[95vw\]/g,
    /sm:w-full/g,
    /max-h-\[85vh\]/g, 
    /sm:max-h-\[90vh\]/g,
    /overflow-y-auto/g,
    /p-4\s+sm:p-6/g,
    /p-6\s+sm:p-8/g,
  ];

  removePatterns.forEach(pattern => {
    cleanClassName = cleanClassName.replace(pattern, '');
  });

  // Clean up extra whitespace
  cleanClassName = cleanClassName.replace(/\s+/g, ' ').trim();

  return { size: detectedSize, cleanClassName };
}

// Comprehensive class migration
export function migrateClassName(className: string): string {
  if (!className) return className;
  
  // Apply color migrations
  let migratedClass = migrateColorClasses(className);
  
  // Apply spacing standardization
  const spacingMigrations = {
    'p-3': 'p-4',
    'p-5': 'p-6',
    'gap-3': 'gap-4', 
    'space-y-3': 'space-y-4',
  } as const;
  
  for (const [oldSpacing, newSpacing] of Object.entries(spacingMigrations)) {
    migratedClass = migratedClass.replace(
      new RegExp(oldSpacing, 'g'),
      newSpacing
    );
  }
  
  return migratedClass;
}

// Component props migration helpers
export interface MigratedButtonProps {
  variant?: string;
  size?: string;
  className?: string;
  loading?: boolean;
  fullWidth?: boolean;
}

export function migrateButtonProps(props: any): MigratedButtonProps {
  return {
    ...props,
    variant: props.variant ? migrateButtonVariant(props.variant) : undefined,
    className: props.className ? migrateClassName(props.className) : undefined,
  };
}

export interface MigratedDialogProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  hideCloseButton?: boolean;
}

export function migrateDialogProps(props: any): MigratedDialogProps {
  const { size, cleanClassName } = migrateDialogSize(props.className || '');
  
  return {
    ...props,
    size: size as any,
    className: cleanClassName || undefined,
  };
}

// Helper to create migration-friendly className combinations
export function createMigratedClassName(...classes: (string | undefined)[]): string {
  const filteredClasses = classes.filter(Boolean) as string[];
  const combinedClassName = cn(...filteredClasses);
  return migrateClassName(combinedClassName);
}