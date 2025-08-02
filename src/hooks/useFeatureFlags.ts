import { useCurrentUserRole } from '@/hooks/useRoleManagement';
import { featureFlagService } from '@/services/featureFlags';

export function useFeatureFlag(featureName: string) {
  const { data: currentRole } = useCurrentUserRole();
  
  const isEnabled = currentRole 
    ? featureFlagService.isFeatureEnabled(featureName, currentRole)
    : false;
    
  return {
    isEnabled,
    feature: featureFlagService.getAllFeatures()[featureName] || null
  };
}

export function useAvailableFeatures() {
  const { data: currentRole } = useCurrentUserRole();
  
  const features = currentRole 
    ? featureFlagService.getAvailableFeatures(currentRole)
    : [];
    
  const betaFeatures = currentRole 
    ? featureFlagService.getBetaFeatures(currentRole)
    : [];
    
  return {
    features,
    betaFeatures,
    hasFeatures: features.length > 0,
    hasBetaFeatures: betaFeatures.length > 0
  };
}