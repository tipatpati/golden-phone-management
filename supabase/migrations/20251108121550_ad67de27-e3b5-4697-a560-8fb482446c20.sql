-- Drop the public read access policy for sales
DROP POLICY IF EXISTS "Allow public read access to sales by sale_number" ON sales;

-- Drop the admin/manager full access policy since only super_admin should have full history
DROP POLICY IF EXISTS "Admins and managers can view store sales" ON sales;

-- Keep existing policies:
-- 1. "Salespersons can view own store sales from last 10 minutes" - Already restricts to 10 min window
-- 2. "Super admins can view all sales" - Full access for super_admin only

-- Note: Salespersons can still create and update their own sales
-- Super admins retain full CRUD access to all sales