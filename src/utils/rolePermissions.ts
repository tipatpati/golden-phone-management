import { UserRole, ROLE_CONFIGS } from "@/types/roles";

/**
 * Comprehensive role permission system for consistent access control
 */

// Define all possible permissions in the system
export const PERMISSIONS = {
  // Dashboard permissions
  DASHBOARD_VIEW: 'dashboard:view',
  DASHBOARD_ANALYTICS: 'dashboard:analytics',
  
  // Sales permissions
  SALES_VIEW: 'sales:view',
  SALES_CREATE: 'sales:create',
  SALES_UPDATE: 'sales:update',
  SALES_DELETE: 'sales:delete',
  SALES_VIEW_ALL: 'sales:view:all', // View all sales vs own sales
  
  // Clients permissions
  CLIENTS_VIEW: 'clients:view',
  CLIENTS_CREATE: 'clients:create',
  CLIENTS_UPDATE: 'clients:update',
  CLIENTS_DELETE: 'clients:delete',
  
  // Inventory permissions
  INVENTORY_VIEW: 'inventory:view',
  INVENTORY_CREATE: 'inventory:create',
  INVENTORY_UPDATE: 'inventory:update',
  INVENTORY_DELETE: 'inventory:delete',
  INVENTORY_BULK_OPERATIONS: 'inventory:bulk:operations',
  
  // Repairs permissions
  REPAIRS_VIEW: 'repairs:view',
  REPAIRS_CREATE: 'repairs:create',
  REPAIRS_UPDATE: 'repairs:update',
  REPAIRS_DELETE: 'repairs:delete',
  REPAIRS_VIEW_ALL: 'repairs:view:all', // View all repairs vs assigned repairs
  
  // Suppliers permissions
  SUPPLIERS_VIEW: 'suppliers:view',
  SUPPLIERS_CREATE: 'suppliers:create',
  SUPPLIERS_UPDATE: 'suppliers:update',
  SUPPLIERS_DELETE: 'suppliers:delete',
  
  // Employee management permissions
  EMPLOYEES_VIEW: 'employees:view',
  EMPLOYEES_CREATE: 'employees:create',
  EMPLOYEES_UPDATE: 'employees:update',
  EMPLOYEES_DELETE: 'employees:delete',
  
  // Admin permissions
  ADMIN_PANEL: 'admin:panel',
  ADMIN_ROLES: 'admin:roles',
  ADMIN_SYSTEM_SETTINGS: 'admin:system:settings',
  ADMIN_SECURITY_LOGS: 'admin:security:logs',
  
  // Finance permissions (super_admin only)
  FINANCE_VIEW: 'finance:view',
  FINANCE_REPORTS: 'finance:reports',
  FINANCE_SETTINGS: 'finance:settings',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Role to permissions mapping - ensures consistent permissions across the app
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    // All permissions for super admin
    ...Object.values(PERMISSIONS)
  ],
  
  admin: [
    // All permissions except finance
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.DASHBOARD_ANALYTICS,
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.SALES_CREATE,
    PERMISSIONS.SALES_UPDATE,
    PERMISSIONS.SALES_DELETE,
    PERMISSIONS.SALES_VIEW_ALL,
    PERMISSIONS.CLIENTS_VIEW,
    PERMISSIONS.CLIENTS_CREATE,
    PERMISSIONS.CLIENTS_UPDATE,
    PERMISSIONS.CLIENTS_DELETE,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_CREATE,
    PERMISSIONS.INVENTORY_UPDATE,
    PERMISSIONS.INVENTORY_DELETE,
    PERMISSIONS.INVENTORY_BULK_OPERATIONS,
    PERMISSIONS.REPAIRS_VIEW,
    PERMISSIONS.REPAIRS_CREATE,
    PERMISSIONS.REPAIRS_UPDATE,
    PERMISSIONS.REPAIRS_DELETE,
    PERMISSIONS.REPAIRS_VIEW_ALL,
    PERMISSIONS.SUPPLIERS_VIEW,
    PERMISSIONS.SUPPLIERS_CREATE,
    PERMISSIONS.SUPPLIERS_UPDATE,
    PERMISSIONS.SUPPLIERS_DELETE,
    PERMISSIONS.EMPLOYEES_VIEW,
    PERMISSIONS.EMPLOYEES_CREATE,
    PERMISSIONS.EMPLOYEES_UPDATE,
    PERMISSIONS.EMPLOYEES_DELETE,
    PERMISSIONS.ADMIN_PANEL,
    PERMISSIONS.ADMIN_ROLES,
    PERMISSIONS.ADMIN_SYSTEM_SETTINGS,
    PERMISSIONS.ADMIN_SECURITY_LOGS,
  ],
  
  manager: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.DASHBOARD_ANALYTICS,
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.SALES_CREATE,
    PERMISSIONS.SALES_UPDATE,
    PERMISSIONS.SALES_VIEW_ALL,
    PERMISSIONS.CLIENTS_VIEW,
    PERMISSIONS.CLIENTS_CREATE,
    PERMISSIONS.CLIENTS_UPDATE,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_UPDATE,
    PERMISSIONS.REPAIRS_VIEW,
    PERMISSIONS.REPAIRS_CREATE,
    PERMISSIONS.REPAIRS_UPDATE,
    PERMISSIONS.REPAIRS_VIEW_ALL,
    PERMISSIONS.SUPPLIERS_VIEW,
    PERMISSIONS.EMPLOYEES_VIEW,
  ],
  
  inventory_manager: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_CREATE,
    PERMISSIONS.INVENTORY_UPDATE,
    PERMISSIONS.INVENTORY_BULK_OPERATIONS,
    PERMISSIONS.SUPPLIERS_VIEW,
    PERMISSIONS.SUPPLIERS_CREATE,
    PERMISSIONS.SUPPLIERS_UPDATE,
  ],
  
  technician: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.CLIENTS_VIEW,
    PERMISSIONS.CLIENTS_CREATE,
    PERMISSIONS.CLIENTS_UPDATE,
    PERMISSIONS.REPAIRS_VIEW,
    PERMISSIONS.REPAIRS_CREATE,
    PERMISSIONS.REPAIRS_UPDATE,
  ],
  
  salesperson: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.SALES_CREATE,
    PERMISSIONS.SALES_UPDATE,
    PERMISSIONS.CLIENTS_VIEW,
    PERMISSIONS.CLIENTS_CREATE,
    PERMISSIONS.CLIENTS_UPDATE,
    PERMISSIONS.INVENTORY_VIEW,
  ],
};

/**
 * Check if a user role has a specific permission
 */
export function hasPermission(userRole: UserRole | null | undefined, permission: Permission): boolean {
  if (!userRole) return false;
  return ROLE_PERMISSIONS[userRole].includes(permission);
}

/**
 * Check if a user role has any of the specified permissions
 */
export function hasAnyPermission(userRole: UserRole | null | undefined, permissions: Permission[]): boolean {
  if (!userRole) return false;
  return permissions.some(permission => hasPermission(userRole, permission));
}

/**
 * Check if a user role has all of the specified permissions
 */
export function hasAllPermissions(userRole: UserRole | null | undefined, permissions: Permission[]): boolean {
  if (!userRole) return false;
  return permissions.every(permission => hasPermission(userRole, permission));
}

/**
 * Get all permissions for a user role
 */
export function getRolePermissions(userRole: UserRole | null | undefined): Permission[] {
  if (!userRole) return [];
  return ROLE_PERMISSIONS[userRole];
}

/**
 * Check if a role can access a specific route/module
 */
export function canAccessModule(userRole: UserRole | null | undefined, module: string): boolean {
  if (!userRole) return false;
  
  switch (module) {
    case 'dashboard':
      return hasPermission(userRole, PERMISSIONS.DASHBOARD_VIEW);
    case 'sales':
      return hasPermission(userRole, PERMISSIONS.SALES_VIEW);
    case 'clients':
      return hasPermission(userRole, PERMISSIONS.CLIENTS_VIEW);
    case 'inventory':
      return hasPermission(userRole, PERMISSIONS.INVENTORY_VIEW);
    case 'repairs':
      return hasPermission(userRole, PERMISSIONS.REPAIRS_VIEW);
    case 'suppliers':
      return hasPermission(userRole, PERMISSIONS.SUPPLIERS_VIEW);
    case 'employees':
      return hasPermission(userRole, PERMISSIONS.EMPLOYEES_VIEW);
    case 'admin':
      return hasPermission(userRole, PERMISSIONS.ADMIN_PANEL);
    case 'finance':
      return hasPermission(userRole, PERMISSIONS.FINANCE_VIEW);
    default:
      return false;
  }
}

/**
 * Get role hierarchy level (higher number = more privileges)
 */
export function getRoleLevel(userRole: UserRole | null | undefined): number {
  if (!userRole) return 0;
  
  const roleLevels = {
    super_admin: 6,
    admin: 5,
    manager: 4,
    inventory_manager: 3,
    technician: 2,
    salesperson: 1,
  };
  
  return roleLevels[userRole] || 0;
}

/**
 * Check if one role has higher privileges than another
 */
export function roleHasHigherPrivileges(userRole: UserRole | null | undefined, targetRole: UserRole): boolean {
  return getRoleLevel(userRole) > getRoleLevel(targetRole);
}

/**
 * Validate if a user can perform an action on data owned by another user
 */
export function canAccessOtherUserData(
  userRole: UserRole | null | undefined, 
  ownerId: string, 
  currentUserId: string
): boolean {
  if (!userRole) return false;
  
  // Own data is always accessible
  if (ownerId === currentUserId) return true;
  
  // Super admin and admin can access all data
  if (userRole === 'super_admin' || userRole === 'admin') return true;
  
  // Manager can access data from lower level roles
  if (userRole === 'manager') return true;
  
  // Other roles can only access their own data
  return false;
}
