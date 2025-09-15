/**
 * Enhanced Button Component with Consistent Material Design Patterns
 */

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden",
  {
    variants: {
      variant: {
        // Material Design 3 variants
        filled: "bg-primary text-primary-foreground shadow-sm hover:shadow-md hover:bg-primary/90",
        "filled-tonal": "bg-secondary-container text-on-secondary-container hover:shadow-sm hover:bg-secondary-container/80",
        elevated: "bg-surface-container-low text-primary shadow-md hover:shadow-lg border border-border",
        outlined: "border border-border bg-transparent text-primary hover:bg-primary/10",
        text: "text-primary hover:bg-primary/10",
        // Special variants
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:shadow-md hover:bg-destructive/90",
        success: "bg-green-600 text-white shadow-sm hover:shadow-md hover:bg-green-700",
        warning: "bg-yellow-600 text-white shadow-sm hover:shadow-md hover:bg-yellow-700",
        // Legacy compatibility
        default: "bg-primary text-primary-foreground shadow-sm hover:shadow-md hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 rounded-full px-3 text-xs",
        default: "h-10 px-6 py-2",
        lg: "h-12 rounded-full px-8 text-base",
        xl: "h-14 rounded-full px-10 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
      loading: {
        true: "pointer-events-none",
        false: "",
      }
    },
    defaultVariants: {
      variant: "filled",
      size: "default",
      fullWidth: false,
      loading: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    fullWidth,
    loading = false,
    loadingText,
    asChild = false, 
    children, 
    disabled,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    return (
      <Comp
        className={cn(buttonVariants({ 
          variant, 
          size, 
          fullWidth, 
          loading,
          className 
        }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {loading && loadingText ? loadingText : children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

// Button group component for consistent spacing
interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  spacing?: "sm" | "md" | "lg";
  align?: "start" | "center" | "end" | "stretch";
}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ 
    className, 
    orientation = "horizontal", 
    spacing = "md",
    align = "start",
    children,
    ...props 
  }, ref) => {
    const orientationClasses = {
      horizontal: "flex-row",
      vertical: "flex-col",
    };

    const spacingClasses = {
      sm: "gap-2",
      md: "gap-3", 
      lg: "gap-4",
    };

    const alignClasses = {
      start: "justify-start items-start",
      center: "justify-center items-center",
      end: "justify-end items-end", 
      stretch: "justify-stretch items-stretch",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "flex",
          orientationClasses[orientation],
          spacingClasses[spacing],
          alignClasses[align],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ButtonGroup.displayName = "ButtonGroup";

// Convenience components for common patterns
export function PrimaryButton(props: ButtonProps) {
  return <Button variant="filled" {...props} />;
}

export function SecondaryButton(props: ButtonProps) {
  return <Button variant="filled-tonal" {...props} />;
}

export function OutlineButton(props: ButtonProps) {
  return <Button variant="outlined" {...props} />;
}

export function TextButton(props: ButtonProps) {
  return <Button variant="text" {...props} />;
}

export function DestructiveButton(props: ButtonProps) {
  return <Button variant="destructive" {...props} />;
}

export function LoadingButton({ 
  loading, 
  loadingText = "Loading...", 
  children, 
  ...props 
}: ButtonProps) {
  return (
    <Button 
      loading={loading} 
      loadingText={loadingText} 
      {...props}
    >
      {children}
    </Button>
  );
}

export { Button, ButtonGroup, buttonVariants };