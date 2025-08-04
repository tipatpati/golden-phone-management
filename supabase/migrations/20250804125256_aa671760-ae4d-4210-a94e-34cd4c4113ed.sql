-- Address security warnings
-- Note: OTP expiry and leaked password protection settings should be configured in Supabase dashboard
-- These settings are typically managed through the Auth provider settings UI

-- Create additional security constraints for employee profiles
ALTER TABLE public.employee_profiles 
ADD CONSTRAINT positive_targets CHECK (
  monthly_sales_target >= 0 AND 
  quarterly_sales_target >= 0 AND 
  yearly_sales_target >= 0
);

ALTER TABLE public.employee_profiles 
ADD CONSTRAINT valid_commission_rate CHECK (
  commission_rate >= 0 AND commission_rate <= 1
);

ALTER TABLE public.employee_profiles 
ADD CONSTRAINT valid_performance_score CHECK (
  performance_score >= 0 AND performance_score <= 100
);

ALTER TABLE public.employee_profiles 
ADD CONSTRAINT valid_satisfaction_rating CHECK (
  customer_satisfaction_rating >= 0 AND customer_satisfaction_rating <= 5
);

-- Add audit logging for sensitive profile operations
CREATE OR REPLACE FUNCTION public.log_employee_profile_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log profile changes for audit trail
  INSERT INTO public.security_audit_log (
    user_id,
    event_type,
    event_data
  ) VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    'employee_profile_' || TG_OP,
    jsonb_build_object(
      'table', 'employee_profiles',
      'operation', TG_OP,
      'profile_id', COALESCE(NEW.id, OLD.id),
      'old_data', CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) ELSE NULL END,
      'new_data', CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END,
      'timestamp', now()
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for audit logging
CREATE TRIGGER log_employee_profile_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.employee_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_employee_profile_changes();

-- Create secure function to get employee profile safely
CREATE OR REPLACE FUNCTION public.get_employee_profile(target_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  employee_id UUID,
  user_id UUID,
  monthly_sales_target NUMERIC,
  quarterly_sales_target NUMERIC,
  yearly_sales_target NUMERIC,
  current_monthly_sales NUMERIC,
  current_quarterly_sales NUMERIC,
  current_yearly_sales NUMERIC,
  commission_rate NUMERIC,
  current_bonus_earned NUMERIC,
  performance_score NUMERIC,
  customer_satisfaction_rating NUMERIC,
  achievements JSONB,
  badges JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_to_query UUID;
  current_user_role app_role;
BEGIN
  -- Determine which user to query
  user_to_query := COALESCE(target_user_id, auth.uid());
  
  -- Get current user role
  SELECT get_current_user_role() INTO current_user_role;
  
  -- Security check: users can only view their own profile unless admin
  IF target_user_id IS NOT NULL AND target_user_id != auth.uid() THEN
    IF current_user_role NOT IN ('admin', 'super_admin', 'manager') THEN
      RAISE EXCEPTION 'Access denied: Cannot view other user profiles';
    END IF;
  END IF;
  
  -- Return profile data
  RETURN QUERY
  SELECT 
    ep.id,
    ep.employee_id,
    ep.user_id,
    ep.monthly_sales_target,
    ep.quarterly_sales_target,
    ep.yearly_sales_target,
    ep.current_monthly_sales,
    ep.current_quarterly_sales,
    ep.current_yearly_sales,
    ep.commission_rate,
    ep.current_bonus_earned,
    ep.performance_score,
    ep.customer_satisfaction_rating,
    ep.achievements,
    ep.badges
  FROM public.employee_profiles ep
  WHERE ep.user_id = user_to_query;
END;
$$;