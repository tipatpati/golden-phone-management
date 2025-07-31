-- Update RLS policies to properly support technician role access

-- Update repairs policies to allow technicians full access to repairs
DROP POLICY IF EXISTS "Role-based repairs view access" ON public.repairs;
DROP POLICY IF EXISTS "Role-based repairs update access" ON public.repairs;

CREATE POLICY "Role-based repairs view access" 
ON public.repairs 
FOR SELECT 
USING (
  get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'technician'::app_role])
  OR technician_id = auth.uid()
);

CREATE POLICY "Role-based repairs update access" 
ON public.repairs 
FOR UPDATE 
USING (
  get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'technician'::app_role])
  OR technician_id = auth.uid()
);

-- Update clients policies to allow technicians access
DROP POLICY IF EXISTS "Role-based clients access" ON public.clients;

CREATE POLICY "Role-based clients view access" 
ON public.clients 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'salesperson'::app_role, 'technician'::app_role]));

CREATE POLICY "Role-based clients insert access" 
ON public.clients 
FOR INSERT 
WITH CHECK (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'salesperson'::app_role, 'technician'::app_role]));

CREATE POLICY "Role-based clients update access" 
ON public.clients 
FOR UPDATE 
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'salesperson'::app_role, 'technician'::app_role]));

CREATE POLICY "Role-based clients delete access" 
ON public.clients 
FOR DELETE 
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role]));

-- Update products policies to allow read access to all roles that need inventory
DROP POLICY IF EXISTS "Authorized users can view products" ON public.products;

CREATE POLICY "Authorized users can view products" 
ON public.products 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role, 'salesperson'::app_role, 'technician'::app_role]));

-- Ensure repair_parts access for technicians
DROP POLICY IF EXISTS "Authorized users can manage repair parts" ON public.repair_parts;

CREATE POLICY "Authorized users can manage repair parts" 
ON public.repair_parts 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'salesperson'::app_role, 'technician'::app_role]));

-- Update sales policies to ensure salesperson can only manage their own sales  
DROP POLICY IF EXISTS "Role-based sales view access" ON public.sales;
DROP POLICY IF EXISTS "Role-based sales update access" ON public.sales;

CREATE POLICY "Role-based sales view access" 
ON public.sales 
FOR SELECT 
USING (
  get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role])
  OR (get_current_user_role() = 'salesperson'::app_role AND salesperson_id = auth.uid())
);

CREATE POLICY "Role-based sales update access" 
ON public.sales 
FOR UPDATE 
USING (
  get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role])
  OR (get_current_user_role() = 'salesperson'::app_role AND salesperson_id = auth.uid())
);