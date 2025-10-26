-- Drop existing INSERT policy on clients table
DROP POLICY IF EXISTS "Authorized users can create clients" ON clients;

-- Create new policy that includes salespersons
CREATE POLICY "Authorized users can create clients"
ON clients
FOR INSERT
TO authenticated
WITH CHECK (
  get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'salesperson'::app_role])
  AND (
    (get_current_user_role() = 'super_admin'::app_role) 
    OR (store_id = get_user_current_store_id())
  )
);