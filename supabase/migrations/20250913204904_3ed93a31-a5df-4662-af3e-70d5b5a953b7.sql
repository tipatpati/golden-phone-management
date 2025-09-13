-- Fix supplier transaction access issues by improving RLS policies
-- The current policies require authentication but users seem to have auth issues

-- First, let's check if we need a more permissive policy for development
-- or if there's an issue with the get_current_user_role function

-- Update the supplier_transactions SELECT policy to be more robust
DROP POLICY IF EXISTS "Authorized users can view supplier transactions" ON public.supplier_transactions;

CREATE POLICY "Authorized users can view supplier transactions"
ON public.supplier_transactions
FOR SELECT
TO public
USING (
  -- Allow if user has required role (existing logic)
  get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role])
  OR
  -- Fallback: allow if user exists in user_roles table with required role
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role])
  )
);

-- Also update supplier_transaction_items policy to be more robust
DROP POLICY IF EXISTS "Authorized users can manage transaction items" ON public.supplier_transaction_items;

CREATE POLICY "Authorized users can manage transaction items"
ON public.supplier_transaction_items
FOR ALL
TO authenticated
USING (
  get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role])
  OR
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role])
  )
);

-- Ensure the suppliers table has proper fallback policies too
DROP POLICY IF EXISTS "Authorized users can view suppliers" ON public.suppliers;

CREATE POLICY "Authorized users can view suppliers"
ON public.suppliers
FOR SELECT
TO authenticated
USING (
  get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role])
  OR
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role])
  )
);

-- Add some debug info
COMMENT ON POLICY "Authorized users can view supplier transactions" ON public.supplier_transactions IS 
'Updated policy with fallback for when get_current_user_role() fails. Allows access based on user_roles table.';

COMMENT ON POLICY "Authorized users can manage transaction items" ON public.supplier_transaction_items IS 
'Updated policy with fallback for when get_current_user_role() fails. Allows access based on user_roles table.';

COMMENT ON POLICY "Authorized users can view suppliers" ON public.suppliers IS 
'Updated policy with fallback for when get_current_user_role() fails. Allows access based on user_roles table.';