-- Fix the missing INSERT policy for products table
DROP POLICY IF EXISTS "Inventory managers can insert products" ON public.products;
CREATE POLICY "Inventory managers can insert products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role]));

-- Log the fix
INSERT INTO public.security_audit_log (
  event_type, 
  event_data
) VALUES (
  'rls_policy_fix',
  jsonb_build_object(
    'action', 'added_missing_insert_policy_for_products',
    'timestamp', now(),
    'description', 'Fixed missing INSERT policy for products table to include super_admin access'
  )
);