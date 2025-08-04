import { supabase } from '@/integrations/supabase/client';
import type { EmployeeProfile, PerformanceLog, CreateEmployeeProfileData, UpdateEmployeeProfileData } from './types';

export class EmployeeProfileApiService {
  // Get current user's profile
  async getCurrentUserProfile(): Promise<EmployeeProfile | null> {
    const { data, error } = await supabase.rpc('get_employee_profile');
    
    if (error) {
      console.error('Error fetching employee profile:', error);
      throw error;
    }

    return data?.[0] as EmployeeProfile || null;
  }

  // Get specific user's profile (admin only)
  async getUserProfile(userId: string): Promise<EmployeeProfile | null> {
    const { data, error } = await supabase.rpc('get_employee_profile', {
      target_user_id: userId
    });
    
    if (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }

    return data?.[0] as EmployeeProfile || null;
  }

  // Get all employee profiles (admin/manager only)
  async getAllProfiles(): Promise<EmployeeProfile[]> {
    const { data, error } = await supabase
      .from('employee_profiles')
      .select(`
        *,
        employees (
          first_name,
          last_name,
          position,
          department
        )
      `);
    
    if (error) {
      console.error('Error fetching all profiles:', error);
      throw error;
    }

    return (data || []) as EmployeeProfile[];
  }

  // Create employee profile
  async createProfile(profileData: CreateEmployeeProfileData): Promise<EmployeeProfile> {
    const { data, error } = await supabase
      .from('employee_profiles')
      .insert([profileData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating employee profile:', error);
      throw error;
    }

    return data as EmployeeProfile;
  }

  // Update employee profile
  async updateProfile(profileId: string, updates: UpdateEmployeeProfileData): Promise<EmployeeProfile> {
    const { data, error } = await supabase
      .from('employee_profiles')
      .update(updates)
      .eq('id', profileId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating employee profile:', error);
      throw error;
    }

    return data as EmployeeProfile;
  }

  // Get performance logs for user
  async getPerformanceLogs(userId?: string, limit: number = 50): Promise<PerformanceLog[]> {
    let query = supabase
      .from('performance_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching performance logs:', error);
      throw error;
    }

    return data || [];
  }

  // Calculate progress percentage
  calculateProgress(current: number, target: number): number {
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  }

  // Calculate bonus eligibility
  calculateBonusEligibility(profile: EmployeeProfile): {
    eligible: boolean;
    amount: number;
    reason: string;
  } {
    const { current_monthly_sales, monthly_sales_target, commission_rate, bonus_threshold } = profile;
    
    if (current_monthly_sales < bonus_threshold) {
      return {
        eligible: false,
        amount: 0,
        reason: `Need €${bonus_threshold - current_monthly_sales} more to reach bonus threshold`
      };
    }

    if (current_monthly_sales >= monthly_sales_target) {
      const bonusAmount = (current_monthly_sales - monthly_sales_target) * commission_rate;
      return {
        eligible: true,
        amount: bonusAmount,
        reason: `Target exceeded! Bonus earned: €${bonusAmount.toFixed(2)}`
      };
    }

    return {
      eligible: false,
      amount: 0,
      reason: `Need €${monthly_sales_target - current_monthly_sales} more to reach target`
    };
  }

  // Get role-specific metrics
  getRoleMetrics(profile: EmployeeProfile, userRole: string) {
    switch (userRole) {
      case 'salesperson':
        return {
          primary: [
            {
              label: 'Monthly Sales',
              current: profile.current_monthly_sales,
              target: profile.monthly_sales_target,
              format: 'currency'
            },
            {
              label: 'Quarterly Sales',
              current: profile.current_quarterly_sales,
              target: profile.quarterly_sales_target,
              format: 'currency'
            }
          ],
          secondary: [
            {
              label: 'Performance Score',
              value: profile.performance_score,
              format: 'percentage'
            },
            {
              label: 'Customer Satisfaction',
              value: profile.customer_satisfaction_rating,
              format: 'rating'
            }
          ]
        };

      case 'technician':
        return {
          primary: [
            {
              label: 'Repairs This Month',
              current: profile.repairs_completed_monthly,
              target: 50, // Could be configurable
              format: 'number'
            },
            {
              label: 'Avg Repair Time',
              current: profile.avg_repair_time_hours,
              target: 4, // Could be configurable
              format: 'hours'
            }
          ],
          secondary: [
            {
              label: 'Success Rate',
              value: profile.repair_success_rate,
              format: 'percentage'
            },
            {
              label: 'Customer Satisfaction',
              value: profile.customer_satisfaction_rating,
              format: 'rating'
            }
          ]
        };

      case 'inventory_manager':
        return {
          primary: [
            {
              label: 'Inventory Accuracy',
              current: profile.inventory_accuracy_rate,
              target: 98, // Could be configurable
              format: 'percentage'
            },
            {
              label: 'Cost Savings',
              current: profile.cost_savings_monthly,
              target: 1000, // Could be configurable
              format: 'currency'
            }
          ],
          secondary: [
            {
              label: 'Stock Turnover',
              value: profile.stock_turnover_rate,
              format: 'number'
            },
            {
              label: 'Performance Score',
              value: profile.performance_score,
              format: 'percentage'
            }
          ]
        };

      default:
        return {
          primary: [],
          secondary: [
            {
              label: 'Performance Score',
              value: profile.performance_score,
              format: 'percentage'
            }
          ]
        };
    }
  }
}