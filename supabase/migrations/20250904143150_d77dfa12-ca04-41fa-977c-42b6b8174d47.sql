-- Tighten RLS on repairs to least-privilege and prevent broad technician access
-- Ensure RLS is enabled (safe if already enabled)
ALTER TABLE public.repairs ENABLE ROW LEVEL SECURITY;

-- Drop existing broad view policy
DROP POLICY IF EXISTS "Role-based repairs view access" ON public.repairs;

-- Create least-privilege view policy: admins/managers see all; technicians only their assigned rows
CREATE POLICY "Repairs view: admins/managers all, technicians only assigned"
ON public.repairs
FOR SELECT
USING (
  public.get_current_user_role() IN ('super_admin','admin','manager')
  OR technician_id = auth.uid()
);

-- Drop existing broad update policy
DROP POLICY IF EXISTS "Role-based repairs update access" ON public.repairs;

-- Create least-privilege update policy: admins/managers any; technicians only assigned
CREATE POLICY "Repairs update: admins/managers all, technicians only assigned"
ON public.repairs
FOR UPDATE
USING (
  public.get_current_user_role() IN ('super_admin','admin','manager')
  OR technician_id = auth.uid()
)
WITH CHECK (
  public.get_current_user_role() IN ('super_admin','admin','manager')
  OR technician_id = auth.uid()
);

-- Keep existing INSERT and DELETE policies unchanged to avoid breaking flows
-- INSERT is limited to super_admin/admin/manager/salesperson via existing policy
-- DELETE limited to admins/managers via existing policy
