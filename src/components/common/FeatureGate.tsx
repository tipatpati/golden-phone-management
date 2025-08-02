import React from 'react';
import { useFeatureFlag } from '@/hooks/useFeatureFlags';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({ feature, children, fallback = null }: FeatureGateProps) {
  const { isEnabled } = useFeatureFlag(feature);
  
  if (!isEnabled) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

// Convenience components for common features
export function BetaFeature({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <FeatureGate feature="beta_features" fallback={fallback}>
      {children}
    </FeatureGate>
  );
}