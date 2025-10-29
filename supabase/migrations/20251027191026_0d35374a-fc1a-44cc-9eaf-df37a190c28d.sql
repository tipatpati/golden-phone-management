-- Drop existing restrictive SELECT policy for salespersons
DROP POLICY IF EXISTS "Salespersons can view limited client data for their sales only" ON clients;

-- Create new policy allowing salespersons to view all clients from their store
CREATE POLICY "Salespersons can view store clients"
ON clients
FOR SELECT
TO authenticated
USING (
  get_current_user_role() = 'salesperson'::app_role
  AND store_id = get_user_current_store_id()
);

-- Update the UPDATE policy to include salespersons
DROP POLICY IF EXISTS "Authorized users can update clients" ON clients;

CREATE POLICY "Authorized users can update clients"
ON clients
FOR UPDATE
TO authenticated
USING (
  get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'salesperson'::app_role])
  AND (
    (get_current_user_role() = 'super_admin'::app_role) 
    OR (store_id = get_user_current_store_id())
  )
);

-- Update the DELETE policy to include salespersons
DROP POLICY IF EXISTS "Role-based clients delete access" ON clients;

CREATE POLICY "Role-based clients delete access"
ON clients
FOR DELETE
TO authenticated
USING (
  get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'salesperson'::app_role])
  AND (
    (get_current_user_role() = 'super_admin'::app_role)
    OR (store_id = get_user_current_store_id())
  )
);