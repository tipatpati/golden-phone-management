import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { roleUtils } from '@/utils/roleUtils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock } from 'lucide-react';

interface SalesPermissionGuardProps {
  children: React.ReactNode;
  requiredRole: 'view' | 'create' | 'edit' | 'delete' | 'analytics';
  fallback?: React.ReactNode;
}

export function SalesPermissionGuard({ 
  children, 
  requiredRole, 
  fallback 
}: SalesPermissionGuardProps) {
  const { userRole } = useAuth();

  const hasPermission = () => {
    if (!userRole) return false;

    switch (requiredRole) {
      case 'view':
        // All authenticated users can view their own sales
        return roleUtils.hasPermissionLevel(userRole, 'salesperson');
      
      case 'create':
        // Salespersons and above can create sales
        return roleUtils.hasPermissionLevel(userRole, 'salesperson');
      
      case 'edit':
        // Salespersons can edit their own, managers+ can edit all
        return roleUtils.hasPermissionLevel(userRole, 'salesperson');
      
      case 'delete':
        // Only super admins can delete sales
        return userRole === 'super_admin';
      
      case 'analytics':
        // Only admins and above can view analytics
        return roleUtils.hasPermissionLevel(userRole, 'admin');
      
      default:
        return false;
    }
  };

  if (!hasPermission()) {
    if (fallback) return <>{fallback}</>;
    
    return (
      <Alert className="border-destructive">
        <Lock className="h-4 w-4" />
        <AlertDescription>
          Non hai i permessi necessari per accedere a questa funzionalità.
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}