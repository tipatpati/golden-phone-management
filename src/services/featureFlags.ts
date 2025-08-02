import { UserRole } from '@/types/roles';
import { roleUtils } from '@/utils/roleUtils';

export interface FeatureFlag {
  name: string;
  description: string;
  enabled: boolean;
  requiredRole?: UserRole;
  requiredPermission?: string;
  beta?: boolean;
}

export const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  // Sales Features
  bulk_sales_operations: {
    name: 'Bulk Sales Operations',
    description: 'Create multiple sales at once',
    enabled: true,
    requiredPermission: 'sales_management',
  },
  
  advanced_sales_analytics: {
    name: 'Advanced Sales Analytics',
    description: 'Detailed sales reports and trends',
    enabled: true,
    requiredRole: 'manager',
  },
  
  // Inventory Features
  inventory_forecasting: {
    name: 'Inventory Forecasting',
    description: 'AI-powered stock predictions',
    enabled: false,
    requiredPermission: 'inventory_management',
    beta: true,
  },
  
  automated_reordering: {
    name: 'Automated Reordering',
    description: 'Automatic purchase orders when stock is low',
    enabled: false,
    requiredRole: 'inventory_manager',
    beta: true,
  },
  
  // Admin Features
  security_monitoring: {
    name: 'Security Monitoring',
    description: 'Real-time security alerts and monitoring',
    enabled: true,
    requiredRole: 'admin',
  },
  
  audit_trail: {
    name: 'Comprehensive Audit Trail',
    description: 'Detailed logging of all user actions',
    enabled: true,
    requiredRole: 'admin',
  },
  
  // Employee Features
  employee_performance_tracking: {
    name: 'Employee Performance Tracking',
    description: 'Track and analyze employee performance metrics',
    enabled: false,
    requiredRole: 'manager',
    beta: true,
  },
  
  // Repair Features
  repair_workflow_automation: {
    name: 'Repair Workflow Automation',
    description: 'Automated repair status updates and notifications',
    enabled: false,
    requiredPermission: 'repair_management',
    beta: true,
  },
  
  // Financial Features
  advanced_financial_reports: {
    name: 'Advanced Financial Reports',
    description: 'Comprehensive financial analytics and forecasting',
    enabled: true,
    requiredRole: 'super_admin',
  },
  
  tax_automation: {
    name: 'Tax Calculation Automation',
    description: 'Automatic tax calculations and filing assistance',
    enabled: false,
    requiredRole: 'super_admin',
    beta: true,
  },
};

export class FeatureFlagService {
  private static instance: FeatureFlagService;
  
  static getInstance(): FeatureFlagService {
    if (!FeatureFlagService.instance) {
      FeatureFlagService.instance = new FeatureFlagService();
    }
    return FeatureFlagService.instance;
  }

  // Check if a feature is enabled for the current user
  isFeatureEnabled(featureName: string, userRole: UserRole): boolean {
    const feature = FEATURE_FLAGS[featureName];
    if (!feature) return false;
    
    // Feature must be globally enabled
    if (!feature.enabled) return false;
    
    // Check role requirement
    if (feature.requiredRole && !roleUtils.hasPermissionLevel(userRole, feature.requiredRole)) {
      return false;
    }
    
    // Check permission requirement
    if (feature.requiredPermission && !roleUtils.hasPermission(userRole, feature.requiredPermission)) {
      return false;
    }
    
    return true;
  }

  // Get all features available to a user
  getAvailableFeatures(userRole: UserRole): FeatureFlag[] {
    return Object.values(FEATURE_FLAGS).filter(feature => 
      this.isFeatureEnabled(feature.name.toLowerCase().replace(/\s+/g, '_'), userRole)
    );
  }

  // Get beta features available to a user
  getBetaFeatures(userRole: UserRole): FeatureFlag[] {
    return this.getAvailableFeatures(userRole).filter(feature => feature.beta);
  }

  // Admin function to toggle feature flags
  toggleFeature(featureName: string, enabled: boolean): boolean {
    if (FEATURE_FLAGS[featureName]) {
      FEATURE_FLAGS[featureName].enabled = enabled;
      return true;
    }
    return false;
  }

  // Get all feature flags (admin only)
  getAllFeatures(): Record<string, FeatureFlag> {
    return FEATURE_FLAGS;
  }
}

export const featureFlagService = FeatureFlagService.getInstance();