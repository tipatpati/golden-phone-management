-- Fix overly permissive RLS policies and inconsistencies

-- 1. Fix repair_parts policies (currently allows unrestricted access)
DROP POLICY IF EXISTS "Users can create repair parts" ON public.repair_parts;
DROP POLICY IF EXISTS "Users can delete repair parts" ON public.repair_parts;
DROP POLICY IF EXISTS "Users can update repair parts" ON public.repair_parts;
DROP POLICY IF EXISTS "Users can view all repair parts" ON public.repair_parts;

CREATE POLICY "Authorized users can manage repair parts" 
ON public.repair_parts 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['admin'::app_role, 'manager'::app_role, 'salesperson'::app_role]));

-- 2. Fix sale_items policies (currently allows unrestricted access)
DROP POLICY IF EXISTS "Users can create sale items" ON public.sale_items;
DROP POLICY IF EXISTS "Users can delete sale items" ON public.sale_items;
DROP POLICY IF EXISTS "Users can update sale items" ON public.sale_items;
DROP POLICY IF EXISTS "Users can view all sale items" ON public.sale_items;

CREATE POLICY "Authorized users can manage sale items" 
ON public.sale_items 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['admin'::app_role, 'manager'::app_role, 'salesperson'::app_role]));

-- 3. Fix inconsistent authentication patterns - replace auth.role() with proper role checks
DROP POLICY IF EXISTS "Authenticated users can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can update categories" ON public.categories;

CREATE POLICY "Authorized users can insert categories" 
ON public.categories 
FOR INSERT 
WITH CHECK (get_current_user_role() = ANY (ARRAY['admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role]));

CREATE POLICY "Authorized users can update categories" 
ON public.categories 
FOR UPDATE 
USING (get_current_user_role() = ANY (ARRAY['admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role]));

-- 4. Fix products policies - use role-based access instead of generic authenticated
DROP POLICY IF EXISTS "Authenticated users can delete products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products;
DROP POLICY IF EXISTS "Products are viewable by authenticated users" ON public.products;

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

-- 5. Fix supplier-related policies - use role-based access
DROP POLICY IF EXISTS "Authenticated users can create suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can delete suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can update suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can view suppliers" ON public.suppliers;

CREATE POLICY "Authorized users can view suppliers" 
ON public.suppliers 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role]));

CREATE POLICY "Admins and managers can manage suppliers" 
ON public.suppliers 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['admin'::app_role, 'manager'::app_role]));

-- 6. Fix supplier transaction policies
DROP POLICY IF EXISTS "Authenticated users can create transactions" ON public.supplier_transactions;
DROP POLICY IF EXISTS "Authenticated users can delete transactions" ON public.supplier_transactions;
DROP POLICY IF EXISTS "Authenticated users can update transactions" ON public.supplier_transactions;
DROP POLICY IF EXISTS "Authenticated users can view transactions" ON public.supplier_transactions;

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

-- 7. Fix supplier transaction items policies
DROP POLICY IF EXISTS "Authenticated users can create transaction items" ON public.supplier_transaction_items;
DROP POLICY IF EXISTS "Authenticated users can delete transaction items" ON public.supplier_transaction_items;
DROP POLICY IF EXISTS "Authenticated users can update transaction items" ON public.supplier_transaction_items;
DROP POLICY IF EXISTS "Authenticated users can view transaction items" ON public.supplier_transaction_items;

CREATE POLICY "Authorized users can manage transaction items" 
ON public.supplier_transaction_items 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role]));

-- 8. Fix product recommendations policies
DROP POLICY IF EXISTS "Authenticated users can create recommendations" ON public.product_recommendations;
DROP POLICY IF EXISTS "Authenticated users can delete recommendations" ON public.product_recommendations;
DROP POLICY IF EXISTS "Authenticated users can update recommendations" ON public.product_recommendations;
DROP POLICY IF EXISTS "Authenticated users can view recommendations" ON public.product_recommendations;

CREATE POLICY "Authorized users can view recommendations" 
ON public.product_recommendations 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role, 'salesperson'::app_role]));

CREATE POLICY "Inventory managers can manage recommendations" 
ON public.product_recommendations 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role]));

-- 9. Remove duplicate profile policies and consolidate
DROP POLICY IF EXISTS "Admins can update employee profiles" ON public.profiles;

-- 10. Add missing foreign key constraints for data integrity
ALTER TABLE public.employees 
ADD CONSTRAINT employees_profile_id_fkey 
FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.sales 
ADD CONSTRAINT sales_salesperson_id_fkey 
FOREIGN KEY (salesperson_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;

ALTER TABLE public.sales 
ADD CONSTRAINT sales_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;

ALTER TABLE public.repairs 
ADD CONSTRAINT repairs_technician_id_fkey 
FOREIGN KEY (technician_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.repairs 
ADD CONSTRAINT repairs_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;

-- 11. Add missing triggers for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'salesperson'::public.app_role)
  );
  RETURN NEW;
END;
$$;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 12. Add updated_at triggers for audit trail
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 13. Add proper indexing for performance
CREATE INDEX IF NOT EXISTS idx_employees_profile_id ON public.employees(profile_id);
CREATE INDEX IF NOT EXISTS idx_sales_salesperson_id ON public.sales(salesperson_id);
CREATE INDEX IF NOT EXISTS idx_repairs_technician_id ON public.repairs(technician_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON public.security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_event_type ON public.security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON public.security_audit_log(created_at DESC);