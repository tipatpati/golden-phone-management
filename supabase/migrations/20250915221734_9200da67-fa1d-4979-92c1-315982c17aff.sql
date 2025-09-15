-- Fix remaining function search_path issues
-- Add search_path to all remaining functions that need it

ALTER FUNCTION public.validate_product_stock(jsonb) SET search_path = public;
ALTER FUNCTION public.validate_sale_serial_numbers(jsonb) SET search_path = public;
ALTER FUNCTION public.generate_repair_number() SET search_path = public;
ALTER FUNCTION public.generate_sale_number() SET search_path = public;
ALTER FUNCTION public.validate_unit_pricing() SET search_path = public;
ALTER FUNCTION public.set_repair_number() SET search_path = public;  
ALTER FUNCTION public.set_sale_number() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.update_product_stock_on_sale() SET search_path = public;
ALTER FUNCTION public.can_view_purchase_price() SET search_path = public;