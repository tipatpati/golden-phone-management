-- =====================================================
-- MULTI-TENANT ARCHITECTURE - PHASE 3: UPDATE RLS POLICIES
-- =====================================================
-- Updates Row Level Security policies to enforce store-based data isolation

-- =====================================================
-- HELPER: DROP ALL EXISTING POLICIES (SAFE RECREATION)
-- =====================================================

-- Sales table policies
DROP POLICY IF EXISTS "Authenticated users can view all sales" ON public.sales;
DROP POLICY IF EXISTS "Authenticated users can create sales" ON public.sales;
DROP POLICY IF EXISTS "Authenticated users can update sales" ON public.sales;
DROP POLICY IF EXISTS "Authenticated users can delete sales" ON public.sales;
DROP POLICY IF EXISTS "Users can view sales" ON public.sales;
DROP POLICY IF EXISTS "Users can insert sales" ON public.sales;
DROP POLICY IF EXISTS "Users can update sales" ON public.sales;

-- Sale items policies
DROP POLICY IF EXISTS "Authenticated users can view sale items" ON public.sale_items;
DROP POLICY IF EXISTS "Authenticated users can create sale items" ON public.sale_items;
DROP POLICY IF EXISTS "Users can view sale items" ON public.sale_items;

-- Products policies
DROP POLICY IF EXISTS "Authenticated users can view products" ON public.products;
DROP POLICY IF EXISTS "Inventory managers can create products" ON public.products;
DROP POLICY IF EXISTS "Inventory managers can update products" ON public.products;
DROP POLICY IF EXISTS "Users can view products" ON public.products;

-- Clients policies
DROP POLICY IF EXISTS "Authenticated users can view clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can create clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON public.clients;
DROP POLICY IF EXISTS "Users can view clients" ON public.clients;

-- Repairs policies
DROP POLICY IF EXISTS "Authenticated users can view repairs" ON public.repairs;
DROP POLICY IF EXISTS "Technicians can create repairs" ON public.repairs;
DROP POLICY IF EXISTS "Technicians can update repairs" ON public.repairs;
DROP POLICY IF EXISTS "Users can view repairs" ON public.repairs;

-- =====================================================
-- 1. SALES TABLE RLS POLICIES (STORE-FILTERED)
-- =====================================================

-- View: Super admins see all stores, others see only their assigned stores
CREATE POLICY "Users can view sales from their assigned stores"
ON public.sales FOR SELECT
TO authenticated
USING (
  get_current_user_role() = 'super_admin'::app_role
  OR store_id = ANY(get_user_store_ids())
);

-- Insert: Sales must be created in user's accessible stores
CREATE POLICY "Users can create sales in their assigned stores"
ON public.sales FOR INSERT
TO authenticated
WITH CHECK (
  get_current_user_role() IN ('super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'salesperson'::app_role)
  AND (
    get_current_user_role() = 'super_admin'::app_role
    OR store_id = ANY(get_user_store_ids())
  )
);

-- Update: Can only update sales from accessible stores
CREATE POLICY "Users can update sales in their assigned stores"
ON public.sales FOR UPDATE
TO authenticated
USING (
  get_current_user_role() IN ('super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'salesperson'::app_role)
  AND (
    get_current_user_role() = 'super_admin'::app_role
    OR store_id = ANY(get_user_store_ids())
  )
)
WITH CHECK (
  get_current_user_role() IN ('super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'salesperson'::app_role)
  AND (
    get_current_user_role() = 'super_admin'::app_role
    OR store_id = ANY(get_user_store_ids())
  )
);

-- Delete: Only super admins can delete sales
CREATE POLICY "Super admins can delete sales"
ON public.sales FOR DELETE
TO authenticated
USING (get_current_user_role() = 'super_admin'::app_role);

-- =====================================================
-- 2. SALE ITEMS TABLE RLS POLICIES (STORE-FILTERED)
-- =====================================================

CREATE POLICY "Users can view sale items from their assigned stores"
ON public.sale_items FOR SELECT
TO authenticated
USING (
  get_current_user_role() = 'super_admin'::app_role
  OR store_id = ANY(get_user_store_ids())
);

CREATE POLICY "Users can create sale items in their assigned stores"
ON public.sale_items FOR INSERT
TO authenticated
WITH CHECK (
  get_current_user_role() IN ('super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'salesperson'::app_role)
  AND (
    get_current_user_role() = 'super_admin'::app_role
    OR store_id = ANY(get_user_store_ids())
  )
);

CREATE POLICY "Users can update sale items in their assigned stores"
ON public.sale_items FOR UPDATE
TO authenticated
USING (
  get_current_user_role() IN ('super_admin'::app_role, 'admin'::app_role)
  AND (
    get_current_user_role() = 'super_admin'::app_role
    OR store_id = ANY(get_user_store_ids())
  )
);

CREATE POLICY "Super admins can delete sale items"
ON public.sale_items FOR DELETE
TO authenticated
USING (get_current_user_role() = 'super_admin'::app_role);

-- =====================================================
-- 3. PRODUCTS TABLE RLS POLICIES (STORE-FILTERED)
-- =====================================================

CREATE POLICY "Users can view products from their assigned stores"
ON public.products FOR SELECT
TO authenticated
USING (
  get_current_user_role() = 'super_admin'::app_role
  OR store_id = ANY(get_user_store_ids())
);

CREATE POLICY "Inventory managers can create products in their assigned stores"
ON public.products FOR INSERT
TO authenticated
WITH CHECK (
  get_current_user_role() IN ('super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role)
  AND (
    get_current_user_role() = 'super_admin'::app_role
    OR store_id = ANY(get_user_store_ids())
  )
);

CREATE POLICY "Inventory managers can update products in their assigned stores"
ON public.products FOR UPDATE
TO authenticated
USING (
  get_current_user_role() IN ('super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role)
  AND (
    get_current_user_role() = 'super_admin'::app_role
    OR store_id = ANY(get_user_store_ids())
  )
);

CREATE POLICY "Super admins can delete products"
ON public.products FOR DELETE
TO authenticated
USING (get_current_user_role() = 'super_admin'::app_role);

-- =====================================================
-- 4. CLIENTS TABLE RLS POLICIES (STORE-FILTERED)
-- =====================================================

CREATE POLICY "Users can view clients from their assigned stores"
ON public.clients FOR SELECT
TO authenticated
USING (
  get_current_user_role() = 'super_admin'::app_role
  OR store_id = ANY(get_user_store_ids())
);

CREATE POLICY "Users can create clients in their assigned stores"
ON public.clients FOR INSERT
TO authenticated
WITH CHECK (
  get_current_user_role() IN ('super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'salesperson'::app_role, 'technician'::app_role)
  AND (
    get_current_user_role() = 'super_admin'::app_role
    OR store_id = ANY(get_user_store_ids())
  )
);

CREATE POLICY "Users can update clients in their assigned stores"
ON public.clients FOR UPDATE
TO authenticated
USING (
  get_current_user_role() IN ('super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'salesperson'::app_role)
  AND (
    get_current_user_role() = 'super_admin'::app_role
    OR store_id = ANY(get_user_store_ids())
  )
);

CREATE POLICY "Admins can delete clients"
ON public.clients FOR DELETE
TO authenticated
USING (get_current_user_role() IN ('super_admin'::app_role, 'admin'::app_role));

-- =====================================================
-- 5. REPAIRS TABLE RLS POLICIES (STORE-FILTERED)
-- =====================================================

CREATE POLICY "Users can view repairs from their assigned stores"
ON public.repairs FOR SELECT
TO authenticated
USING (
  get_current_user_role() = 'super_admin'::app_role
  OR store_id = ANY(get_user_store_ids())
);

CREATE POLICY "Technicians can create repairs in their assigned stores"
ON public.repairs FOR INSERT
TO authenticated
WITH CHECK (
  get_current_user_role() IN ('super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'technician'::app_role)
  AND (
    get_current_user_role() = 'super_admin'::app_role
    OR store_id = ANY(get_user_store_ids())
  )
);

CREATE POLICY "Technicians can update repairs in their assigned stores"
ON public.repairs FOR UPDATE
TO authenticated
USING (
  get_current_user_role() IN ('super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'technician'::app_role)
  AND (
    get_current_user_role() = 'super_admin'::app_role
    OR store_id = ANY(get_user_store_ids())
  )
);

CREATE POLICY "Admins can delete repairs"
ON public.repairs FOR DELETE
TO authenticated
USING (get_current_user_role() IN ('super_admin'::app_role, 'admin'::app_role));

-- =====================================================
-- 6. REPAIR PARTS TABLE RLS POLICIES (STORE-FILTERED)
-- =====================================================

CREATE POLICY "Users can view repair parts from their assigned stores"
ON public.repair_parts FOR SELECT
TO authenticated
USING (
  get_current_user_role() = 'super_admin'::app_role
  OR store_id = ANY(get_user_store_ids())
);

CREATE POLICY "Technicians can manage repair parts in their assigned stores"
ON public.repair_parts FOR ALL
TO authenticated
USING (
  get_current_user_role() IN ('super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'technician'::app_role)
  AND (
    get_current_user_role() = 'super_admin'::app_role
    OR store_id = ANY(get_user_store_ids())
  )
);

-- =====================================================
-- 7. SUPPLIERS TABLE RLS POLICIES (STORE-FILTERED)
-- =====================================================

CREATE POLICY "Users can view suppliers from their assigned stores"
ON public.suppliers FOR SELECT
TO authenticated
USING (
  get_current_user_role() = 'super_admin'::app_role
  OR store_id = ANY(get_user_store_ids())
);

CREATE POLICY "Managers can manage suppliers in their assigned stores"
ON public.suppliers FOR ALL
TO authenticated
USING (
  get_current_user_role() IN ('super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role)
  AND (
    get_current_user_role() = 'super_admin'::app_role
    OR store_id = ANY(get_user_store_ids())
  )
);

-- =====================================================
-- 8. SUPPLIER TRANSACTIONS RLS POLICIES (STORE-FILTERED)
-- =====================================================

CREATE POLICY "Users can view supplier transactions from their assigned stores"
ON public.supplier_transactions FOR SELECT
TO authenticated
USING (
  get_current_user_role() = 'super_admin'::app_role
  OR store_id = ANY(get_user_store_ids())
);

CREATE POLICY "Managers can manage supplier transactions in their assigned stores"
ON public.supplier_transactions FOR ALL
TO authenticated
USING (
  get_current_user_role() IN ('super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role)
  AND (
    get_current_user_role() = 'super_admin'::app_role
    OR store_id = ANY(get_user_store_ids())
  )
);

-- =====================================================
-- 9. EMPLOYEES TABLE RLS POLICIES (STORE-FILTERED)
-- =====================================================

CREATE POLICY "Users can view employees from their assigned stores"
ON public.employees FOR SELECT
TO authenticated
USING (
  get_current_user_role() = 'super_admin'::app_role
  OR store_id = ANY(get_user_store_ids())
);

CREATE POLICY "Admins can manage employees in their assigned stores"
ON public.employees FOR ALL
TO authenticated
USING (
  get_current_user_role() IN ('super_admin'::app_role, 'admin'::app_role, 'manager'::app_role)
  AND (
    get_current_user_role() = 'super_admin'::app_role
    OR store_id = ANY(get_user_store_ids())
  )
);

-- =====================================================
-- 10. PRODUCT UNITS RLS POLICIES (STORE-FILTERED)
-- =====================================================

CREATE POLICY "Users can view product units from their assigned stores"
ON public.product_units FOR SELECT
TO authenticated
USING (
  get_current_user_role() = 'super_admin'::app_role
  OR store_id = ANY(get_user_store_ids())
);

CREATE POLICY "Inventory managers can manage product units in their assigned stores"
ON public.product_units FOR ALL
TO authenticated
USING (
  get_current_user_role() IN ('super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role, 'salesperson'::app_role)
  AND (
    get_current_user_role() = 'super_admin'::app_role
    OR store_id = ANY(get_user_store_ids())
  )
);

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON POLICY "Users can view sales from their assigned stores" ON public.sales
IS 'Multi-tenant: Users can only view sales from stores they are assigned to. Super admins see all.';

COMMENT ON POLICY "Users can view products from their assigned stores" ON public.products
IS 'Multi-tenant: Users can only view products from stores they are assigned to. Super admins see all.';
