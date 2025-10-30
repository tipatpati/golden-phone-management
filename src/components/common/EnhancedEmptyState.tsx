import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface EnhancedEmptyStateProps {
  /** Icon to display */
  icon: LucideIcon;
  /** Main title */
  title: string;
  /** Description text */
  description: string;
  /** Primary action button */
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  /** Secondary action button */
  secondaryAction?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'ghost';
  };
  /** Additional className for container */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * EnhancedEmptyState - A reusable, actionable empty state component
 * Provides clear guidance and actions when no data is available
 */
export function EnhancedEmptyState({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
  size = 'md',
}: EnhancedEmptyStateProps) {
  const sizeClasses = {
    sm: {
      container: 'py-8',
      iconContainer: 'w-12 h-12',
      icon: 'h-6 w-6',
      title: 'text-base',
      description: 'text-sm',
    },
    md: {
      container: 'py-12',
      iconContainer: 'w-16 h-16',
      icon: 'h-8 w-8',
      title: 'text-lg',
      description: 'text-base',
    },
    lg: {
      container: 'py-16',
      iconContainer: 'w-20 h-20',
      icon: 'h-10 w-10',
      title: 'text-xl',
      description: 'text-lg',
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div className={cn('text-center', sizes.container, className)}>
      {/* Icon */}
      <div
        className={cn(
          'inline-flex items-center justify-center rounded-full mb-4',
          'bg-primary/10 text-primary',
          'transition-colors duration-200',
          sizes.iconContainer
        )}
      >
        <Icon className={sizes.icon} aria-hidden="true" />
      </div>

      {/* Title */}
      <h3 className={cn('font-semibold mb-2 text-foreground', sizes.title)}>
        {title}
      </h3>

      {/* Description */}
      <p className={cn('text-muted-foreground mb-6 max-w-sm mx-auto', sizes.description)}>
        {description}
      </p>

      {/* Actions */}
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {primaryAction && (
            <Button onClick={primaryAction.onClick} size={size === 'sm' ? 'sm' : 'default'}>
              {primaryAction.icon && (
                <primaryAction.icon className="h-4 w-4 mr-2" aria-hidden="true" />
              )}
              {primaryAction.label}
            </Button>
          )}

          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant={secondaryAction.variant || 'ghost'}
              size={size === 'sm' ? 'sm' : 'default'}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
