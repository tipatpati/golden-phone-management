-- Continue fixing clients table RLS policies
-- Drop the remaining broad policy and add technician policy

DROP POLICY IF EXISTS "Managers can view basic client data" ON public.clients;

-- Create policy for technicians to see only their repair clients  
CREATE POLICY "Technicians see only their repair clients"
ON public.clients
FOR SELECT
USING (
  get_current_user_role() IN ('super_admin','admin','manager')
  OR (
    get_current_user_role() = 'technician'
    AND EXISTS (
      SELECT 1 FROM public.repairs 
      WHERE repairs.client_id = clients.id 
      AND repairs.technician_id = auth.uid()
    )
  )
);

-- Fix rate_limit_attempts table RLS policies
DROP POLICY IF EXISTS "System can manage rate limit attempts" ON public.rate_limit_attempts;

CREATE POLICY "System can insert rate limit attempts"
ON public.rate_limit_attempts
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view rate limit attempts"
ON public.rate_limit_attempts
FOR SELECT
USING (get_current_user_role() IN ('super_admin','admin'));