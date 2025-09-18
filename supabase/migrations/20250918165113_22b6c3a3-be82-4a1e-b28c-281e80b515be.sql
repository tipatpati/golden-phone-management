-- Drop the existing policy and create one that allows any salesperson to view these specific sales
DROP POLICY IF EXISTS "Immediate access for specific sales" ON public.sales;

-- Create a policy that allows any salesperson to view these specific sales
CREATE POLICY "Cross-salesperson access for specific sales" 
ON public.sales 
FOR SELECT 
TO authenticated
USING (
  (get_current_user_role() = 'salesperson'::app_role) 
  AND (sale_number IN ('2509180011', '2509180013'))
);