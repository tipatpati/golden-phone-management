import React, { Suspense, memo } from 'react';
import { LoadingState } from './LoadingState';
import { ErrorBoundaryWithRetry } from './ErrorBoundaryWithRetry';

interface OptimizedLoadingBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  minHeight?: string;
}

// Optimized loading boundary with error handling and minimum height
export const OptimizedLoadingBoundary = memo(function OptimizedLoadingBoundary({ 
  children, 
  fallback,
  errorFallback,
  minHeight = "200px"
}: OptimizedLoadingBoundaryProps) {
  const defaultFallback = (
    <div className={`flex items-center justify-center`} style={{ minHeight }}>
      <LoadingState />
    </div>
  );

  return (
    <ErrorBoundaryWithRetry fallback={errorFallback}>
      <Suspense fallback={fallback || defaultFallback}>
        {children}
      </Suspense>
    </ErrorBoundaryWithRetry>
  );
});

// Skeleton components for specific content types
export const DataCardSkeleton = memo(function DataCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 rounded-lg p-4 space-y-3">
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        <div className="h-6 bg-gray-300 rounded w-1/2"></div>
        <div className="h-3 bg-gray-300 rounded w-full"></div>
      </div>
    </div>
  );
});

export const TableSkeleton = memo(function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-10 bg-gray-200 rounded"></div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 bg-gray-100 rounded"></div>
      ))}
    </div>
  );
});

export const StatsSkeleton = memo(function StatsSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: cards }).map((_, i) => (
        <DataCardSkeleton key={i} />
      ))}
    </div>
  );
});