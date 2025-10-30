-- Fix supplier RLS policies - remove invalid store_id filtering
-- Issue: Policies reference non-existent store_id column in suppliers table
-- Solution: Make suppliers global (shared across all stores)

-- =====================================================
-- DROP ALL EXISTING SUPPLIER POLICIES
-- =====================================================

-- Drop all possible policy names that might exist
DROP POLICY IF EXISTS "Users can view suppliers from their assigned stores" ON suppliers;
DROP POLICY IF EXISTS "Managers can manage suppliers in their assigned stores" ON suppliers;
DROP POLICY IF EXISTS "Authorized users can view suppliers" ON suppliers;
DROP POLICY IF EXISTS "Managers can manage suppliers" ON suppliers;
DROP POLICY IF EXISTS "Authenticated users can view suppliers" ON suppliers;
DROP POLICY IF EXISTS "Authenticated users can create suppliers" ON suppliers;
DROP POLICY IF EXISTS "Authenticated users can update suppliers" ON suppliers;
DROP POLICY IF EXISTS "Authenticated users can delete suppliers" ON suppliers;
DROP POLICY IF EXISTS "Admins and managers can manage suppliers" ON suppliers;
DROP POLICY IF EXISTS "Managers can insert suppliers" ON suppliers;
DROP POLICY IF EXISTS "Managers can update suppliers" ON suppliers;
DROP POLICY IF EXISTS "Admins can delete suppliers" ON suppliers;

-- Drop supplier transaction policies
DROP POLICY IF EXISTS "Users can view supplier transactions from their assigned stores" ON supplier_transactions;
DROP POLICY IF EXISTS "Managers can manage supplier transactions" ON supplier_transactions;
DROP POLICY IF EXISTS "Authorized users can view supplier transactions" ON supplier_transactions;
DROP POLICY IF EXISTS "Authenticated users can view transactions" ON supplier_transactions;
DROP POLICY IF EXISTS "Authenticated users can create transactions" ON supplier_transactions;
DROP POLICY IF EXISTS "Authenticated users can update transactions" ON supplier_transactions;
DROP POLICY IF EXISTS "Authenticated users can delete transactions" ON supplier_transactions;

-- Drop supplier transaction items policies
DROP POLICY IF EXISTS "Authorized users can view supplier transaction items" ON supplier_transaction_items;
DROP POLICY IF EXISTS "Managers can manage supplier transaction items" ON supplier_transaction_items;
DROP POLICY IF EXISTS "Authenticated users can view transaction items" ON supplier_transaction_items;
DROP POLICY IF EXISTS "Authenticated users can create transaction items" ON supplier_transaction_items;
DROP POLICY IF EXISTS "Authenticated users can update transaction items" ON supplier_transaction_items;
DROP POLICY IF EXISTS "Authenticated users can delete transaction items" ON supplier_transaction_items;

-- =====================================================
-- CREATE CORRECT GLOBAL SUPPLIER POLICIES
-- =====================================================

-- Suppliers are GLOBAL (serve all stores)
CREATE POLICY "Authorized users can view suppliers"
ON suppliers FOR SELECT
TO authenticated
USING (
  get_current_user_role() IN (
    'super_admin'::app_role,
    'admin'::app_role,
    'manager'::app_role,
    'inventory_manager'::app_role
  )
);

CREATE POLICY "Managers can manage suppliers"
ON suppliers FOR ALL
TO authenticated
USING (
  get_current_user_role() IN (
    'super_admin'::app_role,
    'admin'::app_role,
    'manager'::app_role,
    'inventory_manager'::app_role
  )
);

-- =====================================================
-- SUPPLIER TRANSACTIONS POLICIES
-- =====================================================

-- Supplier transactions are also global (tied to suppliers, not stores)
CREATE POLICY "Authorized users can view supplier transactions"
ON supplier_transactions FOR SELECT
TO authenticated
USING (
  get_current_user_role() IN (
    'super_admin'::app_role,
    'admin'::app_role,
    'manager'::app_role,
    'inventory_manager'::app_role
  )
);

CREATE POLICY "Managers can manage supplier transactions"
ON supplier_transactions FOR ALL
TO authenticated
USING (
  get_current_user_role() IN (
    'super_admin'::app_role,
    'admin'::app_role,
    'manager'::app_role,
    'inventory_manager'::app_role
  )
);

-- =====================================================
-- SUPPLIER TRANSACTION ITEMS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Authorized users can view supplier transaction items" ON supplier_transaction_items;
DROP POLICY IF EXISTS "Managers can manage supplier transaction items" ON supplier_transaction_items;

CREATE POLICY "Authorized users can view supplier transaction items"
ON supplier_transaction_items FOR SELECT
TO authenticated
USING (
  get_current_user_role() IN (
    'super_admin'::app_role,
    'admin'::app_role,
    'manager'::app_role,
    'inventory_manager'::app_role
  )
);

CREATE POLICY "Managers can manage supplier transaction items"
ON supplier_transaction_items FOR ALL
TO authenticated
USING (
  get_current_user_role() IN (
    'super_admin'::app_role,
    'admin'::app_role,
    'manager'::app_role,
    'inventory_manager'::app_role
  )
);

COMMENT ON POLICY "Authorized users can view suppliers" ON suppliers IS
'Suppliers are global entities that serve all stores. No store_id filtering needed.';

COMMENT ON POLICY "Managers can manage suppliers" ON suppliers IS
'Managers and inventory managers can create/update/delete suppliers globally.';
