import { UserRole } from '@/types/roles';

/**
 * Utility functions for purchase price access control
 */

/**
 * Check if a user role can view purchase prices
 * Only super_admin users are allowed to view purchase prices
 */
export function canViewPurchasePrice(userRole: UserRole | null): boolean {
  return userRole === 'super_admin';
}

/**
 * Filter object to remove purchase price if user doesn't have permission
 */
export function sanitizePurchasePrice<T extends Record<string, any>>(
  data: T, 
  userRole: UserRole | null
): T {
  if (!canViewPurchasePrice(userRole)) {
    const { purchase_price, ...sanitized } = data;
    return sanitized as T;
  }
  return data;
}

/**
 * Filter array of objects to remove purchase prices if user doesn't have permission
 */
export function sanitizePurchasePriceArray<T extends Record<string, any>>(
  data: T[], 
  userRole: UserRole | null
): T[] {
  return data.map(item => sanitizePurchasePrice(item, userRole));
}

/**
 * Create a select query that conditionally excludes purchase_price based on user role
 */
export function createRoleAwareSelect(userRole: UserRole | null): string {
  const baseFields = `
    id,
    product_id,
    serial_number,
    barcode,
    status,
    color,
    storage,
    ram,
    battery_level,
    supplier_id,
    created_at,
    updated_at,
    price,
    min_price,
    max_price,
    purchase_date
  `;
  
  if (canViewPurchasePrice(userRole)) {
    return `${baseFields}, purchase_price`;
  }
  
  return baseFields;
}