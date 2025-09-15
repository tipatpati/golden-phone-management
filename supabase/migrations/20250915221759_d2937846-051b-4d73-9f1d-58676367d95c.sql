-- Fix remaining security functions that likely need search_path
-- These are the remaining functions that are probably causing the warnings

ALTER FUNCTION public.sync_product_stock_from_units() SET search_path = public;
ALTER FUNCTION public.validate_unique_product_unit_identifiers() SET search_path = public;
ALTER FUNCTION public.update_unit_status_on_sale() SET search_path = public;
ALTER FUNCTION public.update_product_unit_status_on_sale() SET search_path = public;
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public;
ALTER FUNCTION public.get_current_user_role() SET search_path = public;
ALTER FUNCTION public.get_user_roles(uuid) SET search_path = public;
ALTER FUNCTION public.admin_update_user_role(uuid, app_role) SET search_path = public;