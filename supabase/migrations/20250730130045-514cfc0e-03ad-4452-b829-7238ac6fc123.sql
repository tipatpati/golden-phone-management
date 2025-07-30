-- Fix security warnings by setting proper search paths for functions

-- Fix function search path warnings
ALTER FUNCTION public.check_failed_auth_attempts(text) SET search_path = 'public';
ALTER FUNCTION public.is_ip_blocked(inet) SET search_path = 'public';
ALTER FUNCTION public.validate_role_change() SET search_path = 'public';
ALTER FUNCTION public.log_sensitive_operations() SET search_path = 'public';
ALTER FUNCTION public.cleanup_old_security_logs() SET search_path = 'public';
ALTER FUNCTION public.detect_concurrent_sessions(uuid) SET search_path = 'public';

-- Also fix existing functions
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = 'public';
ALTER FUNCTION public.get_user_roles(uuid) SET search_path = 'public';
ALTER FUNCTION public.admin_update_user_role(uuid, app_role) SET search_path = 'public';
ALTER FUNCTION public.admin_add_user_role(uuid, app_role) SET search_path = 'public';
ALTER FUNCTION public.admin_remove_user_role(uuid, app_role) SET search_path = 'public';
ALTER FUNCTION public.ensure_user_profile_exists() SET search_path = 'public';
ALTER FUNCTION public.cleanup_invalid_auth_state() SET search_path = 'public';
ALTER FUNCTION public.get_current_user_role() SET search_path = 'public';
ALTER FUNCTION public.generate_repair_number() SET search_path = 'public';
ALTER FUNCTION public.generate_sale_number() SET search_path = 'public';
ALTER FUNCTION public.handle_new_user() SET search_path = 'public';
ALTER FUNCTION public.update_updated_at_column() SET search_path = 'public';
ALTER FUNCTION public.set_repair_number() SET search_path = 'public';
ALTER FUNCTION public.set_sale_number() SET search_path = 'public';
ALTER FUNCTION public.generate_transaction_number() SET search_path = 'public';
ALTER FUNCTION public.set_transaction_number() SET search_path = 'public';
ALTER FUNCTION public.update_product_stock_on_sale() SET search_path = 'public';
ALTER FUNCTION public.validate_product_stock(jsonb) SET search_path = 'public';