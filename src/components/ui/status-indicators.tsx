/**
 * Standardized Status Indicators and Color System
 * Replaces hardcoded colors with semantic design tokens
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { CheckCircle, XCircle, AlertCircle, Activity, Info, AlertTriangle } from "lucide-react";

// Status indicator variants using semantic colors
const statusVariants = cva(
  "inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium",
  {
    variants: {
      status: {
        success: "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
        error: "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
        warning: "bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
        info: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
        neutral: "bg-muted text-muted-foreground border border-border",
        active: "bg-primary/10 text-primary border border-primary/20",
      },
      size: {
        sm: "text-xs px-2 py-0.5",
        md: "text-sm px-3 py-1",
        lg: "text-base px-4 py-1.5",
      }
    },
    defaultVariants: {
      status: "neutral",
      size: "md",
    }
  }
);

const iconVariants = cva(
  "",
  {
    variants: {
      status: {
        success: "text-green-600 dark:text-green-400",
        error: "text-red-600 dark:text-red-400", 
        warning: "text-yellow-600 dark:text-yellow-400",
        info: "text-blue-600 dark:text-blue-400",
        neutral: "text-muted-foreground",
        active: "text-primary",
      },
      size: {
        sm: "h-3 w-3",
        md: "h-4 w-4", 
        lg: "h-5 w-5",
      }
    },
    defaultVariants: {
      status: "neutral",
      size: "md",
    }
  }
);

export interface StatusIndicatorProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusVariants> {
  icon?: boolean;
  label?: string;
}

const StatusIndicator = React.forwardRef<HTMLSpanElement, StatusIndicatorProps>(
  ({ className, status, size, icon = true, label, children, ...props }, ref) => {
    const getStatusIcon = () => {
      if (!icon) return null;
      
      const iconClass = iconVariants({ status, size });
      
      switch (status) {
        case "success":
          return <CheckCircle className={iconClass} />;
        case "error":
          return <XCircle className={iconClass} />;
        case "warning":
          return <AlertTriangle className={iconClass} />;
        case "info":
          return <Info className={iconClass} />;
        case "active":
          return <Activity className={iconClass} />;
        default:
          return <AlertCircle className={iconClass} />;
      }
    };

    return (
      <span
        ref={ref}
        className={cn(statusVariants({ status, size }), className)}
        {...props}
      >
        {getStatusIcon()}
        {label || children}
      </span>
    );
  }
);
StatusIndicator.displayName = "StatusIndicator";

// Icon-only status indicators
export interface StatusIconProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof iconVariants> {}

const StatusIcon = React.forwardRef<HTMLSpanElement, StatusIconProps>(
  ({ className, status, size, ...props }, ref) => {
    const getStatusIcon = () => {
      const iconClass = iconVariants({ status, size });
      
      switch (status) {
        case "success":
          return <CheckCircle className={iconClass} />;
        case "error":
          return <XCircle className={iconClass} />;
        case "warning":
          return <AlertTriangle className={iconClass} />;
        case "info":
          return <Info className={iconClass} />;
        case "active":
          return <Activity className={iconClass} />;
        default:
          return <AlertCircle className={iconClass} />;
      }
    };

    return (
      <span ref={ref} className={cn("inline-flex", className)} {...props}>
        {getStatusIcon()}
      </span>
    );
  }
);
StatusIcon.displayName = "StatusIcon";

// Service health status component
export interface ServiceStatusProps {
  status: "healthy" | "degraded" | "down" | "unknown";
  label?: string;
  size?: "sm" | "md" | "lg";
}

export function ServiceStatus({ status, label, size = "md" }: ServiceStatusProps) {
  const statusMap = {
    healthy: "success",
    degraded: "warning", 
    down: "error",
    unknown: "neutral",
  } as const;

  return (
    <StatusIndicator 
      status={statusMap[status]} 
      size={size}
      label={label || status.charAt(0).toUpperCase() + status.slice(1)}
    />
  );
}

// Data integrity status
export interface DataIntegrityStatusProps {
  isValid: boolean;
  label?: string;
  size?: "sm" | "md" | "lg";
}

export function DataIntegrityStatus({ isValid, label, size = "md" }: DataIntegrityStatusProps) {
  return (
    <StatusIndicator
      status={isValid ? "success" : "error"}
      size={size}
      label={label || (isValid ? "Valid" : "Invalid")}
    />
  );
}

// Client type badges with consistent colors
export interface ClientTypeBadgeProps {
  type: "individual" | "business";
  size?: "sm" | "md" | "lg";
}

export function ClientTypeBadge({ type, size = "md" }: ClientTypeBadgeProps) {
  const typeStatus = type === "business" ? "info" : "active";
  
  return (
    <StatusIndicator
      status={typeStatus}
      size={size}
      icon={false}
      label={type === "business" ? "Business" : "Individual"}
    />
  );
}

export { StatusIndicator, StatusIcon, statusVariants, iconVariants };