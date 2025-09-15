/**
 * Centralized Design System Components and Utilities
 * Provides consistent spacing, sizes, and patterns across the application
 */

import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";

// Standardized Dialog Sizes
export const DIALOG_SIZES = {
  sm: "max-w-md",
  md: "max-w-2xl", 
  lg: "max-w-4xl",
  xl: "max-w-6xl",
} as const;

// Standardized Spacing Scale
export const SPACING = {
  xs: "gap-2",
  sm: "gap-4", 
  md: "gap-6",
  lg: "gap-8",
  xl: "gap-12",
} as const;

// Standardized Padding Scale
export const PADDING = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
  xl: "p-12",
} as const;

// Container variants for consistent layouts
export const containerVariants = cva(
  "w-full mx-auto",
  {
    variants: {
      size: {
        sm: "max-w-3xl",
        md: "max-w-5xl",
        lg: "max-w-7xl",
        xl: "max-w-[1400px]",
        full: "max-w-none",
      },
      padding: {
        none: "",
        sm: "px-4 sm:px-6",
        md: "px-4 sm:px-6 md:px-8",
        lg: "px-6 sm:px-8 md:px-12",
      }
    },
    defaultVariants: {
      size: "xl",
      padding: "md",
    }
  }
);

// Card spacing variants
export const cardSpacingVariants = cva(
  "",
  {
    variants: {
      padding: {
        sm: "p-4",
        md: "p-6", 
        lg: "p-8",
      },
      spacing: {
        sm: "space-y-3",
        md: "space-y-4",
        lg: "space-y-6",
      }
    },
    defaultVariants: {
      padding: "md",
      spacing: "md",
    }
  }
);

// Grid layout variants
export const gridVariants = cva(
  "grid",
  {
    variants: {
      cols: {
        1: "grid-cols-1",
        2: "grid-cols-1 md:grid-cols-2",
        3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        auto: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
      },
      gap: {
        sm: "gap-3",
        md: "gap-4 md:gap-6",
        lg: "gap-6 md:gap-8",
      }
    },
    defaultVariants: {
      cols: "auto",
      gap: "md",
    }
  }
);

// Responsive dialog pattern
export const responsiveDialogVariants = cva(
  "w-[95vw] sm:w-full",
  {
    variants: {
      size: {
        sm: "max-w-md p-4 sm:p-6",
        md: "max-w-2xl p-4 sm:p-6 md:p-8",
        lg: "max-w-4xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6",
        xl: "max-w-6xl max-h-[90vh] overflow-y-auto p-6 sm:p-8",
      }
    },
    defaultVariants: {
      size: "md",
    }
  }
);

// Typography scale variants
export const typographyVariants = cva(
  "",
  {
    variants: {
      variant: {
        h1: "text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight",
        h2: "text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight",
        h3: "text-lg sm:text-xl md:text-2xl font-medium tracking-tight",
        h4: "text-base sm:text-lg font-medium",
        body: "text-base leading-relaxed",
        caption: "text-sm text-muted-foreground",
        label: "text-sm font-medium",
      }
    }
  }
);

// Button group patterns
export const buttonGroupVariants = cva(
  "flex",
  {
    variants: {
      orientation: {
        horizontal: "flex-row gap-3",
        vertical: "flex-col gap-3",
        responsive: "flex-col sm:flex-row gap-3",
      },
      justify: {
        start: "justify-start",
        center: "justify-center", 
        end: "justify-end",
        between: "justify-between",
      }
    },
    defaultVariants: {
      orientation: "responsive",
      justify: "end",
    }
  }
);

// Design System Helper Components
interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl" | "full";
  padding?: "none" | "sm" | "md" | "lg";
}

export function Container({ 
  className, 
  size, 
  padding, 
  ...props 
}: ContainerProps) {
  return (
    <div 
      className={cn(containerVariants({ size, padding }), className)} 
      {...props} 
    />
  );
}

interface SectionSpaceProps extends React.HTMLAttributes<HTMLDivElement> {
  spacing?: "sm" | "md" | "lg";
}

export function SectionSpace({ 
  className, 
  spacing = "md", 
  ...props 
}: SectionSpaceProps) {
  const spacingClasses = {
    sm: "space-y-3 sm:space-y-4",
    md: "space-y-4 sm:space-y-6", 
    lg: "space-y-6 sm:space-y-8",
  };

  return (
    <div 
      className={cn(spacingClasses[spacing], className)} 
      {...props} 
    />
  );
}

// Export design tokens for consistent usage
export const DESIGN_TOKENS = {
  spacing: {
    xs: "0.5rem",  // 8px
    sm: "1rem",    // 16px  
    md: "1.5rem",  // 24px
    lg: "2rem",    // 32px
    xl: "3rem",    // 48px
  },
  borderRadius: {
    sm: "4px",
    md: "8px", 
    lg: "12px",
    xl: "16px",
  },
  elevation: {
    1: "var(--elevation-1)",
    2: "var(--elevation-2)",
    3: "var(--elevation-3)",
    4: "var(--elevation-4)",
    5: "var(--elevation-5)",
  }
} as const;