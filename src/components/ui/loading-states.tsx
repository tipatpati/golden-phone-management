/**
 * Standardized Loading States and Skeleton Components
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2, RefreshCw } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

// Loading spinner variants
const spinnerVariants = cva(
  "animate-spin",
  {
    variants: {
      size: {
        xs: "h-3 w-3",
        sm: "h-4 w-4",
        md: "h-6 w-6",
        lg: "h-8 w-8",
        xl: "h-12 w-12",
      },
      variant: {
        default: "text-muted-foreground",
        primary: "text-primary",
        white: "text-white",
        current: "text-current",
      }
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    }
  }
);

export interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  icon?: "loader" | "refresh";
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size, variant, icon = "loader", ...props }, ref) => {
    const IconComponent = icon === "loader" ? Loader2 : RefreshCw;
    
    return (
      <div ref={ref} className={cn("inline-flex", className)} {...props}>
        <IconComponent className={spinnerVariants({ size, variant })} />
      </div>
    );
  }
);
LoadingSpinner.displayName = "LoadingSpinner";

// Loading state wrapper
export interface LoadingStateProps {
  loading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export function LoadingState({ 
  loading, 
  children, 
  fallback, 
  size = "md",
  text = "Loading...",
  className 
}: LoadingStateProps) {
  if (!loading) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  return (
    <div className={cn(
      "flex items-center justify-center gap-3 p-8 text-muted-foreground",
      className
    )}>
      <LoadingSpinner size={size} />
      <span className="text-sm">{text}</span>
    </div>
  );
}

// Skeleton loading component
const skeletonVariants = cva(
  "animate-pulse bg-muted rounded",
  {
    variants: {
      variant: {
        default: "bg-muted",
        lighter: "bg-muted/50",
        text: "bg-muted rounded-sm",
        circular: "bg-muted rounded-full",
      }
    },
    defaultVariants: {
      variant: "default",
    }
  }
);

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(skeletonVariants({ variant }), className)}
      {...props}
    />
  )
);
Skeleton.displayName = "Skeleton";

// Pre-built skeleton layouts
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="space-y-4 p-6 border rounded-lg">
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

export function ListSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center gap-4">
          <Skeleton variant="circular" className="h-10 w-10" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

// Empty state component
export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  className 
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-8 text-center",
      className
    )}>
      {icon && (
        <div className="mb-4 text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-foreground mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}

export { LoadingSpinner, Skeleton, spinnerVariants, skeletonVariants };