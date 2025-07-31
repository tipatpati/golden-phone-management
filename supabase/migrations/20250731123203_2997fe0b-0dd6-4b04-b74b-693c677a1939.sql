-- Update RLS policy for clients table to include super_admin role
DROP POLICY IF EXISTS "Role-based clients access" ON public.clients;

CREATE POLICY "Role-based clients access" 
ON public.clients 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'salesperson'::app_role]));