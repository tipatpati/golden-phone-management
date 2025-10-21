/**
 * Theme-Aware Status Badge Component
 * Provides consistent, accessible status indicators across light and dark modes
 */

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const statusBadgeVariants = cva(
  "font-medium border transition-colors",
  {
    variants: {
      status: {
        success: "bg-success-container text-success border-success/20",
        warning: "bg-warning-container text-warning border-warning/20",
        error: "bg-destructive/10 text-destructive border-destructive/20",
        info: "bg-info-container text-info border-info/20",
        active: "bg-success-container text-success border-success/20",
        inactive: "bg-muted text-muted-foreground border-border",
        pending: "bg-warning-container text-warning border-warning/20",
        default: "bg-muted text-muted-foreground border-border",
        business: "bg-info-container text-info border-info/20",
        individual: "bg-secondary-container text-secondary border-secondary/20",
      },
      size: {
        sm: "text-xs px-2 py-0.5",
        md: "text-sm px-2.5 py-0.5",
        lg: "text-base px-3 py-1",
      }
    },
    defaultVariants: {
      status: "default",
      size: "md",
    }
  }
);

export interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
  children: React.ReactNode;
  className?: string;
}

export function StatusBadge({ status, size, children, className }: StatusBadgeProps) {
  return (
    <Badge 
      variant="outline" 
      className={cn(statusBadgeVariants({ status, size }), className)}
    >
      {children}
    </Badge>
  );
}

// Convenience components for common use cases
export function SuccessBadge({ children, className, size }: Omit<StatusBadgeProps, 'status'>) {
  return <StatusBadge status="success" size={size} className={className}>{children}</StatusBadge>;
}

export function WarningBadge({ children, className, size }: Omit<StatusBadgeProps, 'status'>) {
  return <StatusBadge status="warning" size={size} className={className}>{children}</StatusBadge>;
}

export function ErrorBadge({ children, className, size }: Omit<StatusBadgeProps, 'status'>) {
  return <StatusBadge status="error" size={size} className={className}>{children}</StatusBadge>;
}

export function InfoBadge({ children, className, size }: Omit<StatusBadgeProps, 'status'>) {
  return <StatusBadge status="info" size={size} className={className}>{children}</StatusBadge>;
}
