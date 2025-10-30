import React from 'react';
import { Store } from 'lucide-react';
import { useStore } from '@/contexts/store/StoreContext';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StoreBadgeProps {
  className?: string;
  showIcon?: boolean;
}

/**
 * StoreBadge displays the currently selected store as a badge
 * Provides visual confirmation of which store the user is working in
 */
export function StoreBadge({ className, showIcon = true }: StoreBadgeProps) {
  const { currentStore, isLoading } = useStore();

  // Don't show anything while loading or if no store is selected
  if (isLoading || !currentStore) {
    return null;
  }

  return (
    <Badge
      variant="secondary"
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5',
        'bg-primary/10 text-primary hover:bg-primary/20',
        'border border-primary/20',
        'transition-colors duration-200',
        className
      )}
    >
      {showIcon && <Store className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />}
      <span className="font-medium text-sm truncate max-w-[120px] sm:max-w-[180px]">
        {currentStore.name}
      </span>
    </Badge>
  );
}
