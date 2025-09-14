import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock } from 'lucide-react';

interface PurchasePriceGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component that restricts access to purchase price information
 * Only super_admin users can view purchase prices
 */
export function PurchasePriceGuard({ 
  children, 
  fallback 
}: PurchasePriceGuardProps) {
  const { userRole } = useAuth();

  const canViewPurchasePrice = () => {
    return userRole === 'super_admin';
  };

  if (!canViewPurchasePrice()) {
    if (fallback) return <>{fallback}</>;
    
    return (
      <Alert className="border-destructive">
        <Lock className="h-4 w-4" />
        <AlertDescription>
          Non hai i permessi necessari per visualizzare i prezzi di acquisto.
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}