-- Final security fixes: Add remaining search_path to functions and improve auth config

-- Add search_path to any remaining functions that may need it
ALTER FUNCTION public.brands_set_derived_fields() SET search_path = public;
ALTER FUNCTION public.models_set_derived_fields() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.ensure_user_profile_exists() SET search_path = public;
ALTER FUNCTION public.auto_create_employee_record() SET search_path = public;

-- Fix any remaining functions we might have missed
ALTER FUNCTION public.update_employee_performance() SET search_path = public;
ALTER FUNCTION public.calculate_employee_bonuses() SET search_path = public;
ALTER FUNCTION public.log_employee_profile_changes() SET search_path = public;
ALTER FUNCTION public.get_employee_profile(uuid) SET search_path = public;