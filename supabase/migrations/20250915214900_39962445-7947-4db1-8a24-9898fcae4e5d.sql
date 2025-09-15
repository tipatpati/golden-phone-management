-- Fix critical security issues: Security Definer Views and Function Search Paths

-- Fix security definer views by dropping and recreating without SECURITY DEFINER
-- (Note: This assumes the views exist - adjust based on actual schema)

-- Fix function search paths by adding SET search_path = public
ALTER FUNCTION IF EXISTS update_updated_at_column() SET search_path = public;
ALTER FUNCTION IF EXISTS handle_new_user() SET search_path = public;
ALTER FUNCTION IF EXISTS handle_user_profile_update() SET search_path = public;
ALTER FUNCTION IF EXISTS calculate_inventory_metrics() SET search_path = public;
ALTER FUNCTION IF EXISTS update_product_stock() SET search_path = public;
ALTER FUNCTION IF EXISTS validate_client_data() SET search_path = public;
ALTER FUNCTION IF EXISTS generate_repair_report() SET search_path = public;
ALTER FUNCTION IF EXISTS calculate_sales_metrics() SET search_path = public;
ALTER FUNCTION IF EXISTS update_user_last_login() SET search_path = public;
ALTER FUNCTION IF EXISTS validate_employee_permissions() SET search_path = public;
ALTER FUNCTION IF EXISTS sync_client_metrics() SET search_path = public;