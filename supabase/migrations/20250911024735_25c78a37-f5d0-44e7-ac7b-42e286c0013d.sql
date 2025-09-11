-- Fix supplier transactions delete policy to be more permissive temporarily for debugging
DROP POLICY IF EXISTS "Users can delete supplier transactions" ON supplier_transactions;

-- Create a more permissive policy for testing (we'll tighten it later)
CREATE POLICY "Authenticated users can delete supplier transactions"
ON supplier_transactions
FOR DELETE
TO authenticated
USING (true); -- Temporarily allow all authenticated users to delete

-- Also ensure proper RLS bypass for admin operations
-- This is a fallback for when auth.uid() is not properly set
CREATE POLICY "Service role bypass for supplier transactions"
ON supplier_transactions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);