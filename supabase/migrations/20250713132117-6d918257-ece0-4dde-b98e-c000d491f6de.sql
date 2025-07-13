-- Final cleanup of remaining deprecated policies that weren't properly replaced

-- The previous migration didn't properly remove these old policies, let's fix them now

-- 1. Force drop and recreate remaining problematic policies
DROP POLICY IF EXISTS "Authenticated users can update categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can create recommendations" ON public.product_recommendations;
DROP POLICY IF EXISTS "Authenticated users can delete recommendations" ON public.product_recommendations;
DROP POLICY IF EXISTS "Authenticated users can update recommendations" ON public.product_recommendations;
DROP POLICY IF EXISTS "Authenticated users can view recommendations" ON public.product_recommendations;
DROP POLICY IF EXISTS "Authenticated users can delete products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products;
DROP POLICY IF EXISTS "Products are viewable by authenticated users" ON public.products;
DROP POLICY IF EXISTS "Users can create repair parts" ON public.repair_parts;
DROP POLICY IF EXISTS "Users can delete repair parts" ON public.repair_parts;
DROP POLICY IF EXISTS "Users can update repair parts" ON public.repair_parts;
DROP POLICY IF EXISTS "Users can view all repair parts" ON public.repair_parts;
DROP POLICY IF EXISTS "Users can create sale items" ON public.sale_items;
DROP POLICY IF EXISTS "Users can delete sale items" ON public.sale_items;
DROP POLICY IF EXISTS "Users can update sale items" ON public.sale_items;
DROP POLICY IF EXISTS "Users can view all sale items" ON public.sale_items;
DROP POLICY IF EXISTS "Authenticated users can create suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can delete suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can update suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can view suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can create transactions" ON public.supplier_transactions;
DROP POLICY IF EXISTS "Authenticated users can delete transactions" ON public.supplier_transactions;
DROP POLICY IF EXISTS "Authenticated users can update transactions" ON public.supplier_transactions;
DROP POLICY IF EXISTS "Authenticated users can view transactions" ON public.supplier_transactions;
DROP POLICY IF EXISTS "Authenticated users can create transaction items" ON public.supplier_transaction_items;
DROP POLICY IF EXISTS "Authenticated users can delete transaction items" ON public.supplier_transaction_items;
DROP POLICY IF EXISTS "Authenticated users can update transaction items" ON public.supplier_transaction_items;
DROP POLICY IF EXISTS "Authenticated users can view transaction items" ON public.supplier_transaction_items;

-- 2. Create proper role-based policies that should have been created but seem to be missing

-- Categories - keep public read, restrict write to inventory managers
CREATE POLICY "Authorized users can insert categories" 
ON public.categories 
FOR INSERT 
WITH CHECK (get_current_user_role() = ANY (ARRAY['admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role]));

CREATE POLICY "Authorized users can update categories" 
ON public.categories 
FOR UPDATE 
USING (get_current_user_role() = ANY (ARRAY['admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role]));

-- Products - role-based access
CREATE POLICY "Authorized users can view products" 
ON public.products 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role, 'salesperson'::app_role]));

CREATE POLICY "Inventory managers can insert products" 
ON public.products 
FOR INSERT 
WITH CHECK (get_current_user_role() = ANY (ARRAY['admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role]));

CREATE POLICY "Inventory managers can update products" 
ON public.products 
FOR UPDATE 
USING (get_current_user_role() = ANY (ARRAY['admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role]));

CREATE POLICY "Admins and managers can delete products" 
ON public.products 
FOR DELETE 
USING (get_current_user_role() = ANY (ARRAY['admin'::app_role, 'manager'::app_role]));

-- Product recommendations
CREATE POLICY "Authorized users can view recommendations" 
ON public.product_recommendations 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role, 'salesperson'::app_role]));

CREATE POLICY "Inventory managers can manage recommendations" 
ON public.product_recommendations 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role]));

-- Repair parts - role-based access
CREATE POLICY "Authorized users can manage repair parts" 
ON public.repair_parts 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['admin'::app_role, 'manager'::app_role, 'salesperson'::app_role]));

-- Sale items - role-based access
CREATE POLICY "Authorized users can manage sale items" 
ON public.sale_items 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['admin'::app_role, 'manager'::app_role, 'salesperson'::app_role]));

-- Suppliers - role-based access
CREATE POLICY "Authorized users can view suppliers" 
ON public.suppliers 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role]));

CREATE POLICY "Admins and managers can manage suppliers" 
ON public.suppliers 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['admin'::app_role, 'manager'::app_role]));

-- Supplier transactions
CREATE POLICY "Authorized users can view transactions" 
ON public.supplier_transactions 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role]));

CREATE POLICY "Authorized users can manage transactions" 
ON public.supplier_transactions 
FOR INSERT 
WITH CHECK (get_current_user_role() = ANY (ARRAY['admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role]));

CREATE POLICY "Authorized users can update transactions" 
ON public.supplier_transactions 
FOR UPDATE 
USING (get_current_user_role() = ANY (ARRAY['admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role]));

CREATE POLICY "Admins and managers can delete transactions" 
ON public.supplier_transactions 
FOR DELETE 
USING (get_current_user_role() = ANY (ARRAY['admin'::app_role, 'manager'::app_role]));

-- Supplier transaction items
CREATE POLICY "Authorized users can manage transaction items" 
ON public.supplier_transaction_items 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role]));