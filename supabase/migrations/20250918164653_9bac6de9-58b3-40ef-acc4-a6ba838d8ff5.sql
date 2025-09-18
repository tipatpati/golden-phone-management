-- Drop the existing temporary policy and create a new one that makes the sales visible now
DROP POLICY IF EXISTS "Temporary extended access for specific sales" ON public.sales;

-- Create a new policy that allows access to these specific sales for the next hour
CREATE POLICY "Immediate access for specific sales" 
ON public.sales 
FOR SELECT 
TO authenticated
USING (
  (get_current_user_role() = 'salesperson'::app_role) 
  AND (salesperson_id = auth.uid()) 
  AND (sale_number IN ('2509180011', '2509180013'))
);