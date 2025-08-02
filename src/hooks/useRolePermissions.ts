import { useAuth } from "@/contexts/AuthContext";
import { 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions, 
  canAccessModule,
  canAccessOtherUserData,
  getRolePermissions,
  roleHasHigherPrivileges,
  type Permission 
} from "@/utils/rolePermissions";

/**
 * Hook for centralized role permission checking
 * Ensures consistent permission handling across the entire application
 */
export function useRolePermissions() {
  const { userRole, user } = useAuth();

  return {
    // Core permission checking methods
    hasPermission: (permission: Permission) => hasPermission(userRole, permission),
    hasAnyPermission: (permissions: Permission[]) => hasAnyPermission(userRole, permissions),
    hasAllPermissions: (permissions: Permission[]) => hasAllPermissions(userRole, permissions),
    
    // Module access checking
    canAccessModule: (module: string) => canAccessModule(userRole, module),
    
    // Data access checking
    canAccessOtherUserData: (ownerId: string) => 
      canAccessOtherUserData(userRole, ownerId, user?.id || ''),
    
    // Role comparison
    roleHasHigherPrivileges: (targetRole: any) => roleHasHigherPrivileges(userRole, targetRole),
    
    // Utility methods
    getAllPermissions: () => getRolePermissions(userRole),
    
    // Current role info
    userRole,
    userId: user?.id,
    
    // Role checking shortcuts for common scenarios
    isAdmin: () => userRole === 'admin' || userRole === 'super_admin',
    isSuperAdmin: () => userRole === 'super_admin',
    isManager: () => userRole === 'manager',
    isInventoryManager: () => userRole === 'inventory_manager',
    isTechnician: () => userRole === 'technician',
    isSalesperson: () => userRole === 'salesperson',
    
    // Permission group checks
    canManageInventory: () => hasAnyPermission(userRole, [
      'inventory:create',
      'inventory:update',
      'inventory:delete'
    ] as Permission[]),
    
    canManageSales: () => hasAnyPermission(userRole, [
      'sales:create',
      'sales:update',
      'sales:delete'
    ] as Permission[]),
    
    canManageClients: () => hasAnyPermission(userRole, [
      'clients:create',
      'clients:update',
      'clients:delete'
    ] as Permission[]),
    
    canManageRepairs: () => hasAnyPermission(userRole, [
      'repairs:create',
      'repairs:update',
      'repairs:delete'
    ] as Permission[]),
    
    canViewAllData: () => hasAnyPermission(userRole, [
      'sales:view:all',
      'repairs:view:all'
    ] as Permission[]),
    
    canAccessAdminFeatures: () => hasPermission(userRole, 'admin:panel' as Permission),
    canAccessFinanceFeatures: () => hasPermission(userRole, 'finance:view' as Permission),
  };
}