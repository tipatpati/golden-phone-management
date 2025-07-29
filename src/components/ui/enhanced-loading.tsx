import React from 'react';
import { Loader2, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface EnhancedLoadingProps {
  isLoading: boolean;
  error?: string | null;
  isEmpty?: boolean;
  isOffline?: boolean;
  onRetry?: () => void;
  loadingText?: string;
  emptyText?: string;
  emptyIcon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function EnhancedLoading({
  isLoading,
  error,
  isEmpty,
  isOffline,
  onRetry,
  loadingText = 'Loading...',
  emptyText = 'No data available',
  emptyIcon,
  children,
  className = ''
}: EnhancedLoadingProps) {
  // Error state
  if (error) {
    return (
      <Card className={`border-destructive/20 ${className}`}>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold text-destructive mb-2">Something went wrong</h3>
          <p className="text-muted-foreground mb-4 max-w-md">
            {error === 'Failed to fetch' ? 
              'Unable to connect to the server. Please check your internet connection.' : 
              error
            }
          </p>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm">
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center p-8">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-muted-foreground">{loadingText}</span>
          </div>
          {isOffline && (
            <Badge variant="outline" className="mt-4 bg-orange-50 text-orange-700 border-orange-200">
              <WifiOff className="h-3 w-3 mr-1" />
              Offline Mode
            </Badge>
          )}
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (isEmpty) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          {emptyIcon || <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <span className="text-2xl text-muted-foreground">📭</span>
          </div>}
          <h3 className="text-lg font-medium mb-2">No Data Found</h3>
          <p className="text-muted-foreground">{emptyText}</p>
        </CardContent>
      </Card>
    );
  }

  // Success state - render children
  return (
    <div className={className}>
      {isOffline && (
        <div className="mb-4 flex justify-center">
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            <WifiOff className="h-3 w-3 mr-1" />
            Working Offline
          </Badge>
        </div>
      )}
      {children}
    </div>
  );
}

// Skeleton components for better loading UX
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <div key={j} className="h-4 bg-muted rounded animate-pulse flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
        <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
        <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
      </CardContent>
    </Card>
  );
}