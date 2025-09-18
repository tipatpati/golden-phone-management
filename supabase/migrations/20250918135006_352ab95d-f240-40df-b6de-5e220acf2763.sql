-- Update RLS policy for salespersons to only view sales from last 10 minutes
DROP POLICY IF EXISTS "Salespersons can view own sales" ON public.sales;

CREATE POLICY "Salespersons can view own sales within 10 minutes" 
ON public.sales 
FOR SELECT 
TO authenticated
USING (
  (get_current_user_role() = 'salesperson'::app_role) 
  AND (salesperson_id = auth.uid()) 
  AND (created_at > (now() - interval '10 minutes'))
);

-- Ensure super admins still have full access (policy already exists but adding comment for clarity)
-- "Super admins can view all sales" policy remains unchanged for full historical access