-- Fix the get_current_user_role function to handle auth context properly
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = COALESCE(
    auth.uid(),
    (current_setting('request.jwt.claims', true)::json ->> 'sub')::uuid
  )
  LIMIT 1
$$;

-- Also create a simpler approach for RLS policies that doesn't depend on functions
-- Drop the existing restrictive delete policy
DROP POLICY IF EXISTS "Admins can delete supplier transactions" ON supplier_transactions;

-- Create a new delete policy that allows authenticated users to delete their own transactions
-- or allow users with proper roles based on direct role checking
CREATE POLICY "Users can delete supplier transactions"
ON supplier_transactions
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('super_admin', 'admin', 'manager')
  )
);

-- Similarly fix the suppliers policies to be more reliable
DROP POLICY IF EXISTS "Admins and managers can manage suppliers" ON suppliers;

CREATE POLICY "Authenticated users can view suppliers"
ON suppliers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('super_admin', 'admin', 'manager', 'inventory_manager')
  )
);

CREATE POLICY "Managers can insert suppliers"
ON suppliers
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('super_admin', 'admin', 'manager')
  )
);

CREATE POLICY "Managers can update suppliers"
ON suppliers
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('super_admin', 'admin', 'manager')
  )
);

CREATE POLICY "Admins can delete suppliers"
ON suppliers
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('super_admin', 'admin')
  )
);