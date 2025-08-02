import React from 'react';
import { UserRole } from '@/types/roles';
import { useCurrentUserRole } from '@/hooks/useRoleManagement';
import { roleUtils } from '@/utils/roleUtils';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredRoles?: UserRole[];
  requiredPermission?: string;
  requiredFeature?: string;
  fallback?: React.ReactNode;
  allowEqual?: boolean; // If true, allows equal permission level
}

export function RoleGuard({
  children,
  requiredRole,
  requiredRoles,
  requiredPermission,
  requiredFeature,
  fallback = null,
  allowEqual = true
}: RoleGuardProps) {
  const { data: currentRole, isLoading } = useCurrentUserRole();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!currentRole) {
    return <>{fallback}</>;
  }

  // Check single required role
  if (requiredRole) {
    const hasAccess = allowEqual 
      ? roleUtils.hasPermissionLevel(currentRole, requiredRole)
      : roleUtils.hasPermissionLevel(currentRole, requiredRole) && currentRole !== requiredRole;
    
    if (!hasAccess) {
      return <>{fallback}</>;
    }
  }

  // Check multiple required roles (user must have one of them)
  if (requiredRoles && requiredRoles.length > 0) {
    const hasAnyRole = requiredRoles.some(role => 
      allowEqual 
        ? roleUtils.hasPermissionLevel(currentRole, role)
        : roleUtils.hasPermissionLevel(currentRole, role) && currentRole !== role
    );
    
    if (!hasAnyRole) {
      return <>{fallback}</>;
    }
  }

  // Check required permission
  if (requiredPermission && !roleUtils.hasPermission(currentRole, requiredPermission)) {
    return <>{fallback}</>;
  }

  // Check required feature
  if (requiredFeature && !roleUtils.canAccessFeature(currentRole, requiredFeature)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Convenience components for common role checks
export function AdminOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard requiredRoles={['admin', 'super_admin']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function SuperAdminOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard requiredRole="super_admin" fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function ManagerOrAbove({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard requiredRole="manager" fallback={fallback}>
      {children}
    </RoleGuard>
  );
}