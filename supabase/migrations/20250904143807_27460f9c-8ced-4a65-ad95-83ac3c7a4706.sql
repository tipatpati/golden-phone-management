-- Fix clients table RLS policies to prevent data exposure
-- Drop and recreate policies one by one to avoid deadlocks

-- First drop old policies
DROP POLICY IF EXISTS "Salespersons and technicians limited client access" ON public.clients;

-- Create new least-privilege policy for salespersons
CREATE POLICY "Salespersons see only their sales clients"
ON public.clients
FOR SELECT
USING (
  get_current_user_role() IN ('super_admin','admin','manager')
  OR (
    get_current_user_role() = 'salesperson'
    AND EXISTS (
      SELECT 1 FROM public.sales 
      WHERE sales.client_id = clients.id 
      AND sales.salesperson_id = auth.uid()
    )
  )
);