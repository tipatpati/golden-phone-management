import { UserRole, ROLE_CONFIGS } from '@/types/roles';

// Role hierarchy (higher number = more permissions)
const ROLE_HIERARCHY: Record<UserRole, number> = {
  'salesperson': 1,
  'technician': 2,
  'inventory_manager': 3,
  'manager': 4,
  'admin': 5,
  'super_admin': 6
};

export const roleUtils = {
  // Check if role1 has equal or higher permissions than role2
  hasPermissionLevel(userRole: UserRole, requiredRole: UserRole): boolean {
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
  },

  // Check if user can manage another user's role
  canManageRole(currentUserRole: UserRole, targetRole: UserRole): boolean {
    // Super admin can manage all roles
    if (currentUserRole === 'super_admin') return true;
    
    // Admin can manage all roles except super_admin
    if (currentUserRole === 'admin' && targetRole !== 'super_admin') return true;
    
    // Others cannot manage roles
    return false;
  },

  // Get role display name
  getRoleName(role: UserRole): string {
    return ROLE_CONFIGS[role]?.name || role;
  },

  // Get role description
  getRoleDescription(role: UserRole): string {
    return ROLE_CONFIGS[role]?.description || '';
  },

  // Get role permissions
  getRolePermissions(role: UserRole): string[] {
    return ROLE_CONFIGS[role]?.permissions || [];
  },

  // Get role features
  getRoleFeatures(role: UserRole): string[] {
    return ROLE_CONFIGS[role]?.features || [];
  },

  // Check if role can access a specific feature
  canAccessFeature(userRole: UserRole, feature: string): boolean {
    const roleConfig = ROLE_CONFIGS[userRole];
    return roleConfig?.features.includes(feature) || false;
  },

  // Check if role has specific permission
  hasPermission(userRole: UserRole, permission: string): boolean {
    const roleConfig = ROLE_CONFIGS[userRole];
    return roleConfig?.permissions.includes(permission) || false;
  },

  // Get all available roles (for admins)
  getAllRoles(): UserRole[] {
    return Object.keys(ROLE_CONFIGS) as UserRole[];
  },

  // Get manageable roles for current user
  getManageableRoles(currentUserRole: UserRole): UserRole[] {
    const allRoles = this.getAllRoles();
    return allRoles.filter(role => this.canManageRole(currentUserRole, role));
  },

  // Validate role assignment
  validateRoleAssignment(currentUserRole: UserRole, targetRole: UserRole): {
    isValid: boolean;
    error?: string;
  } {
    if (!this.canManageRole(currentUserRole, targetRole)) {
      return {
        isValid: false,
        error: `You don't have permission to assign the ${this.getRoleName(targetRole)} role`
      };
    }

    return { isValid: true };
  }
};
