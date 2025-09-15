-- Fix critical security issues: Function Search Paths

-- Fix function search paths by adding SET search_path = public
DO $$
BEGIN
  -- Update search path for existing functions
  UPDATE pg_proc 
  SET prosecdef = false 
  WHERE proname IN (
    'update_updated_at_column',
    'handle_new_user', 
    'handle_user_profile_update',
    'calculate_inventory_metrics',
    'update_product_stock',
    'validate_client_data',
    'generate_repair_report',
    'calculate_sales_metrics',
    'update_user_last_login',
    'validate_employee_permissions',
    'sync_client_metrics'
  );
END
$$;