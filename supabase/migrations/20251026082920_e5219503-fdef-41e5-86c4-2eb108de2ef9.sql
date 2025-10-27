-- Update RLS policies to enforce store-based data isolation
-- This migration updates all RLS policies to filter by store_id

-- ==========================================
-- PRODUCTS TABLE RLS POLICIES
-- ==========================================

-- Drop existing product RLS policies and create store-aware ones
DROP POLICY IF EXISTS "Authenticated users can view products" ON products;
DROP POLICY IF EXISTS "Authorized users can view products" ON products;

-- Super admins see all products across all stores
CREATE POLICY "Super admins can view all products"
ON products FOR SELECT
TO authenticated
USING (get_current_user_role() = 'super_admin');

-- Regular users see only products from their current store
CREATE POLICY "Users can view products from current store"
ON products FOR SELECT
TO authenticated
USING (
  get_current_user_role() != 'super_admin' 
  AND store_id = get_user_current_store_id()
);

-- Insert/Update/Delete policies remain the same but add store_id check
DROP POLICY IF EXISTS "Inventory managers can insert products" ON products;
CREATE POLICY "Inventory managers can insert products"
ON products FOR INSERT
TO authenticated
WITH CHECK (
  get_current_user_role() IN ('super_admin', 'admin', 'manager', 'inventory_manager')
  AND (
    get_current_user_role() = 'super_admin' 
    OR store_id = get_user_current_store_id()
  )
);

DROP POLICY IF EXISTS "Inventory managers can update products" ON products;
CREATE POLICY "Inventory managers can update products"
ON products FOR UPDATE
TO authenticated
USING (
  get_current_user_role() IN ('super_admin', 'admin', 'manager', 'inventory_manager')
  AND (
    get_current_user_role() = 'super_admin' 
    OR store_id = get_user_current_store_id()
  )
);

-- ==========================================
-- SALES TABLE RLS POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Admins and managers can view all sales" ON sales;
DROP POLICY IF EXISTS "Salespersons can view own sales within 10 minutes" ON sales;
DROP POLICY IF EXISTS "Super admins can view all sales" ON sales;

-- Super admins see all sales across all stores
CREATE POLICY "Super admins can view all sales"
ON sales FOR SELECT
TO authenticated
USING (get_current_user_role() = 'super_admin');

-- Admins and managers see only sales from their current store
CREATE POLICY "Admins and managers can view store sales"
ON sales FOR SELECT
TO authenticated
USING (
  get_current_user_role() IN ('admin', 'manager')
  AND store_id = get_user_current_store_id()
);

-- Salespersons can view own sales from current store
CREATE POLICY "Salespersons can view own store sales"
ON sales FOR SELECT
TO authenticated
USING (
  get_current_user_role() = 'salesperson'
  AND salesperson_id = auth.uid()
  AND store_id = get_user_current_store_id()
);

-- Update insert policy to include store check
DROP POLICY IF EXISTS "Salespersons can insert own sales" ON sales;
CREATE POLICY "Salespersons can insert own sales"
ON sales FOR INSERT
TO authenticated
WITH CHECK (
  get_current_user_role() = 'salesperson'
  AND salesperson_id = auth.uid()
  AND store_id = get_user_current_store_id()
);

-- ==========================================
-- CLIENTS TABLE RLS POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Admins can view all client data" ON clients;
DROP POLICY IF EXISTS "Managers can view limited client data" ON clients;

-- Super admins see all clients across all stores
CREATE POLICY "Super admins can view all clients"
ON clients FOR SELECT
TO authenticated
USING (get_current_user_role() = 'super_admin');

-- Admins see clients from their current store
CREATE POLICY "Admins can view store clients"
ON clients FOR SELECT
TO authenticated
USING (
  get_current_user_role() = 'admin'
  AND store_id = get_user_current_store_id()
);

-- Managers see clients from their current store
CREATE POLICY "Managers can view store clients"
ON clients FOR SELECT
TO authenticated
USING (
  get_current_user_role() = 'manager'
  AND store_id = get_user_current_store_id()
);

-- Update insert/update policies
DROP POLICY IF EXISTS "Authorized users can create clients" ON clients;
CREATE POLICY "Authorized users can create clients"
ON clients FOR INSERT
TO authenticated
WITH CHECK (
  get_current_user_role() IN ('super_admin', 'admin', 'manager')
  AND (
    get_current_user_role() = 'super_admin' 
    OR store_id = get_user_current_store_id()
  )
);

DROP POLICY IF EXISTS "Authorized users can update clients" ON clients;
CREATE POLICY "Authorized users can update clients"
ON clients FOR UPDATE
TO authenticated
USING (
  get_current_user_role() IN ('super_admin', 'admin', 'manager')
  AND (
    get_current_user_role() = 'super_admin' 
    OR store_id = get_user_current_store_id()
  )
);

-- ==========================================
-- REPAIRS TABLE RLS POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Repairs view: admins/managers all, technicians only assigned" ON repairs;

-- Super admins see all repairs across all stores
CREATE POLICY "Super admins can view all repairs"
ON repairs FOR SELECT
TO authenticated
USING (get_current_user_role() = 'super_admin');

-- Admins and managers see repairs from their current store
CREATE POLICY "Admins and managers can view store repairs"
ON repairs FOR SELECT
TO authenticated
USING (
  get_current_user_role() IN ('admin', 'manager')
  AND store_id = get_user_current_store_id()
);

-- Technicians see only assigned repairs from current store
CREATE POLICY "Technicians can view assigned store repairs"
ON repairs FOR SELECT
TO authenticated
USING (
  get_current_user_role() = 'technician'
  AND technician_id = auth.uid()
  AND store_id = get_user_current_store_id()
);

-- Update insert policy
DROP POLICY IF EXISTS "Authorized users can create repairs" ON repairs;
CREATE POLICY "Authorized users can create repairs"
ON repairs FOR INSERT
TO authenticated
WITH CHECK (
  get_current_user_role() IN ('super_admin', 'admin', 'manager', 'salesperson')
  AND (
    get_current_user_role() = 'super_admin' 
    OR store_id = get_user_current_store_id()
  )
);

-- ==========================================
-- EMPLOYEES TABLE RLS POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Admins can view employee data except salary" ON employees;
DROP POLICY IF EXISTS "Super admins can view all employee data" ON employees;

-- Super admins see all employees across all stores
CREATE POLICY "Super admins can view all employees"
ON employees FOR SELECT
TO authenticated
USING (get_current_user_role() = 'super_admin');

-- Admins see employees from their current store
CREATE POLICY "Admins can view store employees"
ON employees FOR SELECT
TO authenticated
USING (
  get_current_user_role() = 'admin'
  AND store_id = get_user_current_store_id()
);

-- ==========================================
-- PRODUCT_UNITS TABLE RLS POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Non-admin users can view limited product unit data" ON product_units;
DROP POLICY IF EXISTS "Super admins can view all product unit data" ON product_units;

-- Super admins see all product units across all stores
CREATE POLICY "Super admins can view all product units"
ON product_units FOR SELECT
TO authenticated
USING (get_current_user_role() = 'super_admin');

-- Regular users see product units from their current store
CREATE POLICY "Users can view store product units"
ON product_units FOR SELECT
TO authenticated
USING (
  get_current_user_role() IN ('admin', 'manager', 'inventory_manager', 'salesperson', 'technician')
  AND store_id = get_user_current_store_id()
);

-- Update insert/update policy
DROP POLICY IF EXISTS "Inventory managers can manage product units" ON product_units;
CREATE POLICY "Inventory managers can manage product units"
ON product_units FOR ALL
TO authenticated
USING (
  get_current_user_role() IN ('super_admin', 'admin', 'manager', 'inventory_manager')
  AND (
    get_current_user_role() = 'super_admin' 
    OR store_id = get_user_current_store_id()
  )
)
WITH CHECK (
  get_current_user_role() IN ('super_admin', 'admin', 'manager', 'inventory_manager')
  AND (
    get_current_user_role() = 'super_admin' 
    OR store_id = get_user_current_store_id()
  )
);

-- Add helpful comments
COMMENT ON POLICY "Super admins can view all products" ON products IS 'Super admins have unrestricted access to all products across all stores';
COMMENT ON POLICY "Users can view products from current store" ON products IS 'Regular users can only see products from their currently selected store';
COMMENT ON POLICY "Super admins can view all sales" ON sales IS 'Super admins have unrestricted access to all sales across all stores';
COMMENT ON POLICY "Admins and managers can view store sales" ON sales IS 'Admins and managers can only see sales from their currently selected store';