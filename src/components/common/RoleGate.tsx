import React from 'react';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { Permission } from '@/utils/rolePermissions';
import { UserRole } from '@/types/roles';

interface RoleGateProps {
  children: React.ReactNode;
  
  // Permission-based access
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean; // If true, requires ALL permissions; if false, requires ANY permission
  
  // Role-based access
  roles?: UserRole[];
  
  // Module-based access
  module?: string;
  
  // Custom condition
  condition?: boolean;
  
  // Fallback content when access is denied
  fallback?: React.ReactNode;
  
  // Debug mode (shows permission info in development)
  debug?: boolean;
}

/**
 * Component for conditional rendering based on user roles and permissions
 * Ensures consistent permission checking across UI components
 */
export function RoleGate({
  children,
  permission,
  permissions,
  requireAll = false,
  roles,
  module,
  condition,
  fallback = null,
  debug = false
}: RoleGateProps) {
  const rolePermissions = useRolePermissions();

  // Check access based on the provided criteria
  const hasAccess = React.useMemo(() => {
    // If custom condition is provided, use it
    if (condition !== undefined) {
      return condition;
    }

    // Check role-based access
    if (roles) {
      const hasRole = rolePermissions.userRole && roles.includes(rolePermissions.userRole);
      if (!hasRole) return false;
    }

    // Check single permission
    if (permission) {
      if (!rolePermissions.hasPermission(permission)) return false;
    }

    // Check multiple permissions
    if (permissions) {
      if (requireAll) {
        if (!rolePermissions.hasAllPermissions(permissions)) return false;
      } else {
        if (!rolePermissions.hasAnyPermission(permissions)) return false;
      }
    }

    // Check module access
    if (module) {
      if (!rolePermissions.canAccessModule(module)) return false;
    }

    return true;
  }, [
    condition,
    roles,
    permission,
    permissions,
    requireAll,
    module,
    rolePermissions
  ]);

  // Debug information (only in development)
  if (debug && process.env.NODE_ENV === 'development') {
    console.log('RoleGate Debug:', {
      hasAccess,
      userRole: rolePermissions.userRole,
      userId: rolePermissions.userId,
      requiredPermission: permission,
      requiredPermissions: permissions,
      requiredRoles: roles,
      requiredModule: module,
      condition
    });
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

// Convenience components for common role checks
export const AdminGate: React.FC<Pick<RoleGateProps, 'children' | 'fallback'>> = ({ children, fallback }) => (
  <RoleGate roles={['admin', 'super_admin']} fallback={fallback}>
    {children}
  </RoleGate>
);

export const SuperAdminGate: React.FC<Pick<RoleGateProps, 'children' | 'fallback'>> = ({ children, fallback }) => (
  <RoleGate roles={['super_admin']} fallback={fallback}>
    {children}
  </RoleGate>
);

export const ManagerGate: React.FC<Pick<RoleGateProps, 'children' | 'fallback'>> = ({ children, fallback }) => (
  <RoleGate roles={['manager', 'admin', 'super_admin']} fallback={fallback}>
    {children}
  </RoleGate>
);

export const SalesGate: React.FC<Pick<RoleGateProps, 'children' | 'fallback'>> = ({ children, fallback }) => (
  <RoleGate module="sales" fallback={fallback}>
    {children}
  </RoleGate>
);

export const InventoryGate: React.FC<Pick<RoleGateProps, 'children' | 'fallback'>> = ({ children, fallback }) => (
  <RoleGate module="inventory" fallback={fallback}>
    {children}
  </RoleGate>
);

export const RepairsGate: React.FC<Pick<RoleGateProps, 'children' | 'fallback'>> = ({ children, fallback }) => (
  <RoleGate module="repairs" fallback={fallback}>
    {children}
  </RoleGate>
);