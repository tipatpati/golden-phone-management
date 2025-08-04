-- Create employee profiles with role-specific metrics
CREATE TABLE public.employee_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Sales-specific metrics
  monthly_sales_target NUMERIC DEFAULT 0,
  quarterly_sales_target NUMERIC DEFAULT 0,
  yearly_sales_target NUMERIC DEFAULT 0,
  current_monthly_sales NUMERIC DEFAULT 0,
  current_quarterly_sales NUMERIC DEFAULT 0,
  current_yearly_sales NUMERIC DEFAULT 0,
  
  -- Commission and bonus tracking
  commission_rate NUMERIC DEFAULT 0.05, -- 5% default
  bonus_threshold NUMERIC DEFAULT 0, -- Minimum sales for bonus
  current_bonus_earned NUMERIC DEFAULT 0,
  
  -- Performance metrics
  performance_score NUMERIC DEFAULT 0, -- Out of 100
  customer_satisfaction_rating NUMERIC DEFAULT 0, -- Out of 5
  
  -- Technician-specific metrics
  avg_repair_time_hours NUMERIC DEFAULT 0,
  repairs_completed_monthly INTEGER DEFAULT 0,
  repair_success_rate NUMERIC DEFAULT 0, -- Percentage
  
  -- Inventory manager metrics
  inventory_accuracy_rate NUMERIC DEFAULT 0, -- Percentage
  stock_turnover_rate NUMERIC DEFAULT 0,
  cost_savings_monthly NUMERIC DEFAULT 0,
  
  -- Achievement tracking
  achievements JSONB DEFAULT '[]'::jsonb,
  badges JSONB DEFAULT '[]'::jsonb,
  milestones JSONB DEFAULT '[]'::jsonb,
  
  -- Goal periods
  goal_start_date DATE DEFAULT CURRENT_DATE,
  goal_end_date DATE DEFAULT (CURRENT_DATE + INTERVAL '1 month'),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(employee_id),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.employee_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile"
  ON public.employee_profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile data"
  ON public.employee_profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all employee profiles"
  ON public.employee_profiles FOR SELECT
  USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role]));

CREATE POLICY "Admins can manage all employee profiles"
  ON public.employee_profiles FOR ALL
  USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role]));

CREATE POLICY "Admins can create employee profiles"
  ON public.employee_profiles FOR INSERT
  WITH CHECK (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role]));

-- Create performance tracking table
CREATE TABLE public.performance_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_profile_id UUID NOT NULL REFERENCES public.employee_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Performance metrics
  metric_type TEXT NOT NULL, -- 'sales', 'repair', 'inventory', 'customer_satisfaction'
  metric_value NUMERIC NOT NULL,
  metric_target NUMERIC,
  
  -- Achievement data
  achievement_type TEXT, -- 'goal_reached', 'milestone', 'bonus_earned'
  achievement_data JSONB DEFAULT '{}'::jsonb,
  
  -- Period tracking
  period_type TEXT NOT NULL DEFAULT 'daily', -- 'daily', 'weekly', 'monthly', 'quarterly'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.performance_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for performance logs
CREATE POLICY "Users can view their own performance logs"
  ON public.performance_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can insert performance logs"
  ON public.performance_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all performance logs"
  ON public.performance_logs FOR SELECT
  USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role]));

CREATE POLICY "Admins can manage performance logs"
  ON public.performance_logs FOR ALL
  USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role]));

-- Create function to update performance metrics automatically
CREATE OR REPLACE FUNCTION public.update_employee_performance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  emp_profile_id UUID;
  current_month_start DATE;
  current_quarter_start DATE;
  current_year_start DATE;
  monthly_sales NUMERIC;
  quarterly_sales NUMERIC;
  yearly_sales NUMERIC;
BEGIN
  -- Get the employee profile for the salesperson
  SELECT ep.id INTO emp_profile_id
  FROM public.employee_profiles ep
  JOIN public.employees e ON e.id = ep.employee_id
  WHERE e.profile_id = NEW.salesperson_id;
  
  IF emp_profile_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Calculate date ranges
  current_month_start := DATE_TRUNC('month', CURRENT_DATE);
  current_quarter_start := DATE_TRUNC('quarter', CURRENT_DATE);
  current_year_start := DATE_TRUNC('year', CURRENT_DATE);
  
  -- Calculate current sales totals
  SELECT COALESCE(SUM(s.total_amount), 0) INTO monthly_sales
  FROM public.sales s
  WHERE s.salesperson_id = NEW.salesperson_id
    AND s.sale_date >= current_month_start;
    
  SELECT COALESCE(SUM(s.total_amount), 0) INTO quarterly_sales
  FROM public.sales s
  WHERE s.salesperson_id = NEW.salesperson_id
    AND s.sale_date >= current_quarter_start;
    
  SELECT COALESCE(SUM(s.total_amount), 0) INTO yearly_sales
  FROM public.sales s
  WHERE s.salesperson_id = NEW.salesperson_id
    AND s.sale_date >= current_year_start;
  
  -- Update employee profile with current sales
  UPDATE public.employee_profiles
  SET 
    current_monthly_sales = monthly_sales,
    current_quarterly_sales = quarterly_sales,
    current_yearly_sales = yearly_sales,
    updated_at = now()
  WHERE id = emp_profile_id;
  
  -- Log performance achievement
  INSERT INTO public.performance_logs (
    employee_profile_id,
    user_id,
    metric_type,
    metric_value,
    period_type,
    period_start,
    period_end
  ) VALUES (
    emp_profile_id,
    NEW.salesperson_id,
    'sales',
    NEW.total_amount,
    'daily',
    CURRENT_DATE,
    CURRENT_DATE
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger to update performance on new sales
CREATE TRIGGER update_employee_performance_on_sale
  AFTER INSERT ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_employee_performance();

-- Create function to calculate bonuses and achievements
CREATE OR REPLACE FUNCTION public.calculate_employee_bonuses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  profile_record RECORD;
  bonus_amount NUMERIC;
  achievement_data JSONB;
BEGIN
  -- Loop through all employee profiles
  FOR profile_record IN 
    SELECT * FROM public.employee_profiles 
    WHERE monthly_sales_target > 0
  LOOP
    -- Calculate bonus if monthly target is reached
    IF profile_record.current_monthly_sales >= profile_record.monthly_sales_target THEN
      bonus_amount := (profile_record.current_monthly_sales - profile_record.monthly_sales_target) * profile_record.commission_rate;
      
      -- Update bonus earned
      UPDATE public.employee_profiles
      SET current_bonus_earned = current_bonus_earned + bonus_amount
      WHERE id = profile_record.id;
      
      -- Add achievement if first time reaching target
      achievement_data := jsonb_build_object(
        'type', 'monthly_target_reached',
        'amount', profile_record.current_monthly_sales,
        'target', profile_record.monthly_sales_target,
        'bonus', bonus_amount,
        'date', CURRENT_DATE
      );
      
      -- Log the achievement
      INSERT INTO public.performance_logs (
        employee_profile_id,
        user_id,
        metric_type,
        metric_value,
        metric_target,
        achievement_type,
        achievement_data,
        period_type,
        period_start,
        period_end
      ) VALUES (
        profile_record.id,
        profile_record.user_id,
        'bonus',
        bonus_amount,
        profile_record.monthly_sales_target,
        'goal_reached',
        achievement_data,
        'monthly',
        DATE_TRUNC('month', CURRENT_DATE),
        (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE
      );
    END IF;
  END LOOP;
END;
$$;

-- Create indexes for better performance
CREATE INDEX idx_employee_profiles_user_id ON public.employee_profiles(user_id);
CREATE INDEX idx_employee_profiles_employee_id ON public.employee_profiles(employee_id);
CREATE INDEX idx_performance_logs_user_id ON public.performance_logs(user_id);
CREATE INDEX idx_performance_logs_profile_id ON public.performance_logs(employee_profile_id);
CREATE INDEX idx_performance_logs_period ON public.performance_logs(period_start, period_end);

-- Create trigger for updating timestamps
CREATE TRIGGER update_employee_profiles_updated_at
  BEFORE UPDATE ON public.employee_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();