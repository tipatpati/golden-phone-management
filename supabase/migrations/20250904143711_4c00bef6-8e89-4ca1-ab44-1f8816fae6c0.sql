-- Tighten RLS on clients table to prevent broad data exposure
-- Ensure RLS is enabled (safe if already enabled)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Drop existing overly broad policies
DROP POLICY IF EXISTS "Salespersons and technicians limited client access" ON public.clients;
DROP POLICY IF EXISTS "Managers can view basic client data" ON public.clients;

-- Create least-privilege policy: salespersons only see clients from their sales
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

-- Create least-privilege policy: technicians only see clients from their repairs
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

-- Tighten rate_limit_attempts table RLS policies
-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "System can manage rate limit attempts" ON public.rate_limit_attempts;

-- Create secure policies for rate limiting
CREATE POLICY "System can insert rate limit attempts"
ON public.rate_limit_attempts
FOR INSERT
WITH CHECK (true); -- System needs to log attempts

CREATE POLICY "Admins can view rate limit attempts"
ON public.rate_limit_attempts
FOR SELECT
USING (get_current_user_role() IN ('super_admin','admin'));

-- No UPDATE or DELETE allowed for audit integrity
-- Rate limit records should be immutable for security audit trail