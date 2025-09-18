-- Create a temporary policy to allow salespersons to view specific sales for extended time
CREATE POLICY "Temporary extended access for specific sales" 
ON public.sales 
FOR SELECT 
TO authenticated
USING (
  (get_current_user_role() = 'salesperson'::app_role) 
  AND (salesperson_id = auth.uid()) 
  AND (sale_number IN ('2509180011', '2509180013'))
  AND (created_at > (now() - INTERVAL '20 minutes'))
);