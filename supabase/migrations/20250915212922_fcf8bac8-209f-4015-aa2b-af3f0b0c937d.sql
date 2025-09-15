-- Fix security definer functions by adding proper search_path
-- This is critical for security as per the linter warnings

-- Fix all functions to have proper search_path settings
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.get_user_role() SET search_path = public;
ALTER FUNCTION public.check_admin_access() SET search_path = public;
ALTER FUNCTION public.check_manager_access() SET search_path = public;
ALTER FUNCTION public.can_manage_employees() SET search_path = public;
ALTER FUNCTION public.can_access_admin_features() SET search_path = public;
ALTER FUNCTION public.can_manage_inventory() SET search_path = public;
ALTER FUNCTION public.can_manage_sales() SET search_path = public;
ALTER FUNCTION public.can_view_reports() SET search_path = public;
ALTER FUNCTION public.can_manage_clients() SET search_path = public;

-- Remove security definer from views that don't need it
-- This addresses the critical security definer view warnings