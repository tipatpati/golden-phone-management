-- Drop existing salesperson SELECT policy
DROP POLICY IF EXISTS "Salespersons can view own store sales" ON sales;

-- Create new time-restricted policy for salespersons (10 minutes only)
CREATE POLICY "Salespersons can view own store sales from last 10 minutes"
ON sales
FOR SELECT
TO authenticated
USING (
  get_current_user_role() = 'salesperson'::app_role
  AND salesperson_id = auth.uid()
  AND store_id = get_user_current_store_id()
  AND created_at >= NOW() - INTERVAL '10 minutes'
);