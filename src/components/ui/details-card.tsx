/**
 * Details Card Component
 * Reusable glassmorphic card for detail dialogs with animations
 */

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { getAnimationStyle } from "@/lib/animations";

interface DetailsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  icon?: LucideIcon;
  accentColor?: 'primary' | 'success' | 'warning' | 'destructive';
  delay?: number;
  variant?: 'glass' | 'elevated' | 'outlined';
}

export function DetailsCard({
  title,
  icon: Icon,
  accentColor = 'primary',
  delay = 0,
  variant = 'glass',
  className,
  children,
  ...props
}: DetailsCardProps) {
  const accentClasses = {
    primary: 'neon-border-left',
    success: 'border-l-success/60 shadow-[-2px_0_8px_hsl(var(--success)/_0.3)]',
    warning: 'border-l-warning/60 shadow-[-2px_0_8px_hsl(var(--warning)/_0.3)]',
    destructive: 'border-l-destructive/60 shadow-[-2px_0_8px_hsl(var(--destructive)/_0.3)]',
  };

  const variantClasses = {
    glass: 'glass-card bg-surface/60 backdrop-blur-md',
    elevated: 'bg-surface-container shadow-[var(--elevation-2)]',
    outlined: 'bg-surface border-border',
  };

  return (
    <Card
      className={cn(
        "stagger-fade-in border-l-4 transition-all duration-300 hover:shadow-[var(--elevation-3)]",
        variantClasses[variant],
        accentClasses[accentColor],
        className
      )}
      style={getAnimationStyle(delay, { baseDelay: 100 })}
      {...props}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg font-medium flex items-center gap-2">
          {Icon && (
            <div className={cn(
              "p-2 rounded-lg transition-colors",
              accentColor === 'primary' && "bg-primary/10 text-primary",
              accentColor === 'success' && "bg-success/10 text-success",
              accentColor === 'warning' && "bg-warning/10 text-warning",
              accentColor === 'destructive' && "bg-destructive/10 text-destructive"
            )}>
              <Icon className="h-4 w-4" />
            </div>
          )}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );
}

interface DetailFieldProps {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  copyable?: boolean;
  className?: string;
}

export function DetailField({ label, value, icon: Icon, copyable, className }: DetailFieldProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    if (typeof value === 'string') {
      try {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }
  };

  return (
    <div className={cn("space-y-1", className)}>
      <label className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </label>
      <div className={cn(
        "text-sm sm:text-base font-medium",
        copyable && "cursor-pointer hover:text-primary transition-colors"
      )} onClick={copyable ? handleCopy : undefined}>
        {copied ? (
          <span className="text-success flex items-center gap-1">
            ✓ Copiato!
          </span>
        ) : (
          value
        )}
      </div>
    </div>
  );
}
