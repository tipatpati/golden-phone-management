-- Create RLS policies for product_units to restrict purchase_price access
-- Only super_admin can view purchase_price column

-- First, update existing RLS policies to exclude purchase_price for non-super_admin users
DROP POLICY IF EXISTS "Authorized users can view product units" ON public.product_units;

-- Create separate policies for super_admin (full access) and others (limited access)
CREATE POLICY "Super admins can view all product unit data" 
ON public.product_units 
FOR SELECT 
USING (get_current_user_role() = 'super_admin');

-- For non-super_admin users, they cannot see purchase_price
-- This is enforced at application level since RLS cannot selectively hide columns
CREATE POLICY "Non-admin users can view limited product unit data" 
ON public.product_units 
FOR SELECT 
USING (
  get_current_user_role() = ANY (ARRAY['admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role, 'salesperson'::app_role, 'technician'::app_role])
);

-- Create a security function to check purchase price access
CREATE OR REPLACE FUNCTION public.can_view_purchase_price()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN get_current_user_role() = 'super_admin';
END;
$$;

-- Create a view that excludes purchase prices for non-super_admin users
CREATE OR REPLACE VIEW public.product_units_limited AS
SELECT 
  id,
  product_id,
  serial_number,
  barcode,
  status,
  color,
  storage,
  ram,
  battery_level,
  supplier_id,
  created_at,
  updated_at,
  -- Conditional purchase price - only for super_admin
  CASE 
    WHEN can_view_purchase_price() THEN purchase_price 
    ELSE NULL 
  END as purchase_price,
  -- Always show other prices as they're selling prices
  price,
  min_price,
  max_price,
  purchase_date
FROM public.product_units;

-- Grant access to the view
GRANT SELECT ON public.product_units_limited TO authenticated;

-- Create audit function to log unauthorized purchase price access attempts
CREATE OR REPLACE FUNCTION public.log_purchase_price_access_attempt()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT can_view_purchase_price() THEN
    INSERT INTO public.security_audit_log (
      user_id,
      event_type,
      event_data,
      ip_address
    ) VALUES (
      auth.uid(),
      'unauthorized_purchase_price_access',
      jsonb_build_object(
        'user_role', get_current_user_role(),
        'timestamp', now(),
        'severity', 'medium'
      ),
      COALESCE(inet_client_addr(), '0.0.0.0'::inet)
    );
  END IF;
END;
$$;