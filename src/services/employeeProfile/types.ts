export interface EmployeeProfile {
  id: string;
  employee_id: string;
  user_id: string;
  monthly_sales_target: number;
  quarterly_sales_target: number;
  yearly_sales_target: number;
  current_monthly_sales: number;
  current_quarterly_sales: number;
  current_yearly_sales: number;
  commission_rate: number;
  bonus_threshold: number;
  current_bonus_earned: number;
  performance_score: number;
  customer_satisfaction_rating: number;
  avg_repair_time_hours: number;
  repairs_completed_monthly: number;
  repair_success_rate: number;
  inventory_accuracy_rate: number;
  stock_turnover_rate: number;
  cost_savings_monthly: number;
  achievements: any;
  badges: any;
  milestones: any;
  goal_start_date: string;
  goal_end_date: string;
  created_at: string;
  updated_at: string;
}

export interface PerformanceLog {
  id: string;
  employee_profile_id: string;
  user_id: string;
  metric_type: string;
  metric_value: number;
  metric_target?: number;
  achievement_type?: string;
  achievement_data?: any;
  period_type: string;
  period_start: string;
  period_end: string;
  notes?: string;
  created_at: string;
}

export interface CreateEmployeeProfileData {
  employee_id: string;
  user_id: string;
  monthly_sales_target?: number;
  quarterly_sales_target?: number;
  yearly_sales_target?: number;
  commission_rate?: number;
  bonus_threshold?: number;
}

export interface UpdateEmployeeProfileData {
  monthly_sales_target?: number;
  quarterly_sales_target?: number;
  yearly_sales_target?: number;
  commission_rate?: number;
  bonus_threshold?: number;
  performance_score?: number;
  customer_satisfaction_rating?: number;
}