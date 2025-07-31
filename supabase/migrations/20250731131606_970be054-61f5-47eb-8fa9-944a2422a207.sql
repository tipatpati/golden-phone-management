-- Update RLS policies to include super_admin role where needed

-- Update clients RLS policy to include super_admin
DROP POLICY IF EXISTS "Role-based clients access" ON public.clients;
CREATE POLICY "Role-based clients access"
ON public.clients
FOR ALL
TO authenticated
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'salesperson'::app_role]));

-- Update security audit log policies to include super_admin
DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.security_audit_log;
CREATE POLICY "Only admins can view audit logs"
ON public.security_audit_log
FOR SELECT
TO authenticated
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role]));

-- Update employees table policies to include super_admin
DROP POLICY IF EXISTS "Admins can view all employees" ON public.employees;
CREATE POLICY "Admins can view all employees"
ON public.employees
FOR SELECT
TO authenticated
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role]));

DROP POLICY IF EXISTS "Admins can manage all employees" ON public.employees;
CREATE POLICY "Admins can manage all employees"
ON public.employees
FOR ALL
TO authenticated
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role]));

DROP POLICY IF EXISTS "Admins can create employees" ON public.employees;
CREATE POLICY "Admins can create employees"
ON public.employees
FOR INSERT
TO authenticated
WITH CHECK (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role]));

DROP POLICY IF EXISTS "Admins can update employees" ON public.employees;
CREATE POLICY "Admins can update employees"
ON public.employees
FOR UPDATE
TO authenticated
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role]));

DROP POLICY IF EXISTS "Admins can delete employees" ON public.employees;
CREATE POLICY "Admins can delete employees"
ON public.employees
FOR DELETE
TO authenticated
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role]));

-- Update profiles table policies to include super_admin
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role]));

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role]));

DROP POLICY IF EXISTS "Admins can update employee profiles" ON public.profiles;
CREATE POLICY "Admins can update employee profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role]));

DROP POLICY IF EXISTS "Only admins can change user roles" ON public.profiles;
CREATE POLICY "Only admins can change user roles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role]))
WITH CHECK (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role]));

DROP POLICY IF EXISTS "Admins can create profiles for employees" ON public.profiles;
CREATE POLICY "Admins can create profiles for employees"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role]));

-- Update user_roles table policies to include super_admin
DROP POLICY IF EXISTS "Admins can manage all user roles" ON public.user_roles;
CREATE POLICY "Admins can manage all user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Update brands table policies
DROP POLICY IF EXISTS "Authorized users can manage brands" ON public.brands;
CREATE POLICY "Authorized users can manage brands"
ON public.brands
FOR ALL
TO authenticated
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role]));

-- Update models table policies
DROP POLICY IF EXISTS "Authorized users can manage models" ON public.models;
CREATE POLICY "Authorized users can manage models"
ON public.models
FOR ALL
TO authenticated
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role]));

-- Update products table policies
DROP POLICY IF EXISTS "Authorized users can view products" ON public.products;
CREATE POLICY "Authorized users can view products"
ON public.products
FOR SELECT
TO authenticated
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role, 'salesperson'::app_role]));

DROP POLICY IF EXISTS "Inventory managers can update products" ON public.products;
CREATE POLICY "Inventory managers can update products"
ON public.products
FOR UPDATE
TO authenticated
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role]));

DROP POLICY IF EXISTS "Admins and managers can delete products" ON public.products;
CREATE POLICY "Admins and managers can delete products"
ON public.products
FOR DELETE
TO authenticated
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role]));

-- Update sales table policies
DROP POLICY IF EXISTS "Authorized users can create sales" ON public.sales;
CREATE POLICY "Authorized users can create sales"
ON public.sales
FOR INSERT
TO authenticated
WITH CHECK ((get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'salesperson'::app_role])) AND (salesperson_id = auth.uid()));

DROP POLICY IF EXISTS "Role-based sales view access" ON public.sales;
CREATE POLICY "Role-based sales view access"
ON public.sales
FOR SELECT
TO authenticated
USING ((get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role])) OR (salesperson_id = auth.uid()));

DROP POLICY IF EXISTS "Role-based sales update access" ON public.sales;
CREATE POLICY "Role-based sales update access"
ON public.sales
FOR UPDATE
TO authenticated
USING ((get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role])) OR ((get_current_user_role() = 'salesperson'::app_role) AND (salesperson_id = auth.uid())));

DROP POLICY IF EXISTS "Only admins and managers can delete sales" ON public.sales;
CREATE POLICY "Only admins and managers can delete sales"
ON public.sales
FOR DELETE
TO authenticated
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role]));

-- Update sale_items table policies
DROP POLICY IF EXISTS "Authorized users can manage sale items" ON public.sale_items;
CREATE POLICY "Authorized users can manage sale items"
ON public.sale_items
FOR ALL
TO authenticated
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'salesperson'::app_role]));

-- Update repairs table policies
DROP POLICY IF EXISTS "Authorized users can create repairs" ON public.repairs;
CREATE POLICY "Authorized users can create repairs"
ON public.repairs
FOR INSERT
TO authenticated
WITH CHECK (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'salesperson'::app_role]));

DROP POLICY IF EXISTS "Role-based repairs view access" ON public.repairs;
CREATE POLICY "Role-based repairs view access"
ON public.repairs
FOR SELECT
TO authenticated
USING ((get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role])) OR (technician_id = auth.uid()));

DROP POLICY IF EXISTS "Role-based repairs update access" ON public.repairs;
CREATE POLICY "Role-based repairs update access"
ON public.repairs
FOR UPDATE
TO authenticated
USING ((get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role])) OR (technician_id = auth.uid()));

DROP POLICY IF EXISTS "Only admins and managers can delete repairs" ON public.repairs;
CREATE POLICY "Only admins and managers can delete repairs"
ON public.repairs
FOR DELETE
TO authenticated
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role]));

-- Update repair_parts table policies
DROP POLICY IF EXISTS "Authorized users can manage repair parts" ON public.repair_parts;
CREATE POLICY "Authorized users can manage repair parts"
ON public.repair_parts
FOR ALL
TO authenticated
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'salesperson'::app_role]));

-- Update suppliers table policies
DROP POLICY IF EXISTS "Admins and managers can manage suppliers" ON public.suppliers;
CREATE POLICY "Admins and managers can manage suppliers"
ON public.suppliers
FOR ALL
TO authenticated
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role]));

DROP POLICY IF EXISTS "Authorized users can view suppliers" ON public.suppliers;
CREATE POLICY "Authorized users can view suppliers"
ON public.suppliers
FOR SELECT
TO authenticated
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role]));

-- Update supplier_transactions table policies
DROP POLICY IF EXISTS "Authorized users can manage transactions" ON public.supplier_transactions;
CREATE POLICY "Authorized users can manage transactions"
ON public.supplier_transactions
FOR INSERT
TO authenticated
WITH CHECK (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role]));

DROP POLICY IF EXISTS "Authorized users can view transactions" ON public.supplier_transactions;
CREATE POLICY "Authorized users can view transactions"
ON public.supplier_transactions
FOR SELECT
TO authenticated
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role]));

DROP POLICY IF EXISTS "Authorized users can update transactions" ON public.supplier_transactions;
CREATE POLICY "Authorized users can update transactions"
ON public.supplier_transactions
FOR UPDATE
TO authenticated
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role]));

DROP POLICY IF EXISTS "Admins and managers can delete transactions" ON public.supplier_transactions;
CREATE POLICY "Admins and managers can delete transactions"
ON public.supplier_transactions
FOR DELETE
TO authenticated
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role]));

-- Update supplier_transaction_items table policies
DROP POLICY IF EXISTS "Authorized users can manage transaction items" ON public.supplier_transaction_items;
CREATE POLICY "Authorized users can manage transaction items"
ON public.supplier_transaction_items
FOR ALL
TO authenticated
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role]));

-- Update product_recommendations table policies
DROP POLICY IF EXISTS "Authorized users can view recommendations" ON public.product_recommendations;
CREATE POLICY "Authorized users can view recommendations"
ON public.product_recommendations
FOR SELECT
TO authenticated
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role, 'salesperson'::app_role]));

DROP POLICY IF EXISTS "Inventory managers can manage recommendations" ON public.product_recommendations;
CREATE POLICY "Inventory managers can manage recommendations"
ON public.product_recommendations
FOR ALL
TO authenticated
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role]));

-- Update categories table policies
DROP POLICY IF EXISTS "Authorized users can insert categories" ON public.categories;
CREATE POLICY "Authorized users can insert categories"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role]));

DROP POLICY IF EXISTS "Authorized users can update categories" ON public.categories;
CREATE POLICY "Authorized users can update categories"
ON public.categories
FOR UPDATE
TO authenticated
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role]));

-- Log the super admin access update
INSERT INTO public.security_audit_log (
  event_type, 
  event_data
) VALUES (
  'super_admin_access_granted',
  jsonb_build_object(
    'action', 'updated_all_rls_policies_for_super_admin',
    'timestamp', now(),
    'description', 'Granted super_admin role access to all RLS policies across the system'
  )
);