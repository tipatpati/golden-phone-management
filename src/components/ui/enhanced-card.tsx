/**
 * Enhanced Card Component with Consistent Spacing and Material Design
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const cardVariants = cva(
  "rounded-2xl border text-card-foreground overflow-hidden md-motion-smooth",
  {
    variants: {
      variant: {
        default: "glass-card",
        elevated: "glass-intense md-elevation-2 hover:md-elevation-3",
        outlined: "border-2 border-outline-variant bg-surface-container-lowest/50 backdrop-blur-sm hover:border-primary/30",
        filled: "bg-surface-container-high/80 backdrop-blur-md border-border/50",
        glass: "glass-card",
      },
      padding: {
        none: "",
        sm: "p-4",
        md: "p-6", 
        lg: "p-8",
      },
      spacing: {
        none: "",
        sm: "space-y-3",
        md: "space-y-4",
        lg: "space-y-6",
      },
      interactive: {
        false: "",
        true: "cursor-pointer hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      }
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
      spacing: "md",
      interactive: false,
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, spacing, interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding, spacing, interactive, className }))}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    spacing?: "sm" | "md" | "lg";
  }
>(({ className, spacing = "md", ...props }, ref) => {
  const spacingClasses = {
    sm: "space-y-1",
    md: "space-y-1.5",
    lg: "space-y-2",
  };

  return (
    <div
      ref={ref}
      className={cn("flex flex-col", spacingClasses[spacing], className)}
      {...props}
    />
  );
});
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement> & {
    level?: 1 | 2 | 3 | 4;
  }
>(({ className, level = 3, ...props }, ref) => {
  const sizeClasses = {
    1: "text-2xl font-medium",
    2: "text-xl font-medium", 
    3: "text-lg font-medium",
    4: "text-base font-medium",
  };

  if (level === 1) {
    return (
      <h1
        ref={ref}
        className={cn("leading-none tracking-tight", sizeClasses[level], className)}
        {...props}
      />
    );
  }

  if (level === 2) {
    return (
      <h2
        ref={ref}
        className={cn("leading-none tracking-tight", sizeClasses[level], className)}
        {...props}
      />
    );
  }

  if (level === 4) {
    return (
      <h4
        ref={ref}
        className={cn("leading-none tracking-tight", sizeClasses[level], className)}
        {...props}
      />
    );
  }

  // Default to h3
  return (
    <h3
      ref={ref}
      className={cn("leading-none tracking-tight", sizeClasses[level], className)}
      {...props}
    />
  );
});
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground leading-relaxed", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    padding?: "none" | "sm" | "md" | "lg";
  }
>(({ className, padding, ...props }, ref) => {
  const paddingClasses = {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  };

  return (
    <div 
      ref={ref} 
      className={cn(
        padding ? paddingClasses[padding] : "",
        className
      )} 
      {...props} 
    />
  );
});
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    justify?: "start" | "center" | "end" | "between";
  }
>(({ className, justify = "end", ...props }, ref) => {
  const justifyClasses = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-3 pt-4",
        justifyClasses[justify],
        className
      )}
      {...props}
    />
  );
});
CardFooter.displayName = "CardFooter";

// Convenience components for common card patterns
export function DataCard({ 
  children, 
  className,
  ...props 
}: React.ComponentProps<typeof Card>) {
  return (
    <Card 
      variant="glass" 
      className={className}
      {...props}
    >
      {children}
    </Card>
  );
}

export function StatsCard({ 
  children, 
  className,
  ...props 
}: React.ComponentProps<typeof Card>) {
  return (
    <Card 
      variant="elevated" 
      padding="md"
      spacing="sm"
      className={cn("text-center border-glow", className)}
      {...props}
    >
      {children}
    </Card>
  );
}

export function InteractiveCard({ 
  children, 
  className,
  onClick,
  ...props 
}: React.ComponentProps<typeof Card> & { onClick?: () => void }) {
  return (
    <Card 
      variant="outlined" 
      interactive
      className={cn("hover:border-primary/60 border-glow", className)}
      onClick={onClick}
      {...props}
    >
      {children}
    </Card>
  );
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };