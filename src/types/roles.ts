
export type UserRole = 'admin' | 'manager' | 'inventory_manager' | 'salesperson';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
}

export interface RoleConfig {
  name: string;
  description: string;
  allowedRoutes: string[];
  features: string[];
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  admin: {
    name: 'Store Owner',
    description: 'Full access to all features and analytics',
    allowedRoutes: ['/dashboard', '/sales', '/clients', '/inventory', '/repairs', '/reports', '/settings'],
    features: ['analytics', 'user_management', 'system_settings', 'reports', 'full_inventory', 'all_sales']
  },
  manager: {
    name: 'Store Manager',
    description: 'Manage daily operations and staff',
    allowedRoutes: ['/dashboard', '/sales', '/clients', '/inventory', '/repairs'],
    features: ['sales_management', 'client_management', 'inventory_view', 'repairs_management']
  },
  inventory_manager: {
    name: 'Inventory Manager',
    description: 'Manage stock and inventory',
    allowedRoutes: ['/inventory', '/dashboard'],
    features: ['inventory_management', 'stock_alerts', 'product_management']
  },
  salesperson: {
    name: 'Salesperson',
    description: 'Handle sales and customer service',
    allowedRoutes: ['/sales', '/clients', '/dashboard'],
    features: ['sales_creation', 'client_interaction', 'basic_inventory_view']
  }
};
