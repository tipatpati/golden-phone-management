-- CRITICAL SECURITY FIX: Remove privilege escalation vulnerability
-- Phase 1: Fix user self-role update and implement proper access controls

-- 1. Remove dangerous policy that allows users to update their own role
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- 2. Create secure profile update policy (excluding role changes)
CREATE POLICY "Users can update own profile data only" ON public.profiles
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND OLD.role = NEW.role  -- Prevent role changes
);

-- 3. Create admin-only role management policy
CREATE POLICY "Only admins can change user roles" ON public.profiles
FOR UPDATE 
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- 4. Fix overly permissive business data policies
-- Sales: Replace "true" with role-based access
DROP POLICY IF EXISTS "Users can view all sales" ON public.sales;
DROP POLICY IF EXISTS "Users can create sales" ON public.sales;
DROP POLICY IF EXISTS "Users can update sales" ON public.sales;
DROP POLICY IF EXISTS "Users can delete sales" ON public.sales;

CREATE POLICY "Role-based sales view access" ON public.sales
FOR SELECT 
USING (
  get_current_user_role() IN ('admin', 'manager') 
  OR salesperson_id = auth.uid()
);

CREATE POLICY "Authorized users can create sales" ON public.sales
FOR INSERT 
WITH CHECK (
  get_current_user_role() IN ('admin', 'manager', 'salesperson')
  AND salesperson_id = auth.uid()
);

CREATE POLICY "Role-based sales update access" ON public.sales
FOR UPDATE 
USING (
  get_current_user_role() IN ('admin', 'manager')
  OR (get_current_user_role() = 'salesperson' AND salesperson_id = auth.uid())
);

CREATE POLICY "Only admins and managers can delete sales" ON public.sales
FOR DELETE 
USING (get_current_user_role() IN ('admin', 'manager'));

-- 5. Fix clients policies
DROP POLICY IF EXISTS "Users can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Users can create clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete clients" ON public.clients;

CREATE POLICY "Role-based clients access" ON public.clients
FOR ALL 
USING (get_current_user_role() IN ('admin', 'manager', 'salesperson'));

-- 6. Fix repairs policies  
DROP POLICY IF EXISTS "Users can view all repairs" ON public.repairs;
DROP POLICY IF EXISTS "Users can create repairs" ON public.repairs;
DROP POLICY IF EXISTS "Users can update repairs" ON public.repairs;
DROP POLICY IF EXISTS "Users can delete repairs" ON public.repairs;

CREATE POLICY "Role-based repairs view access" ON public.repairs
FOR SELECT 
USING (
  get_current_user_role() IN ('admin', 'manager')
  OR technician_id = auth.uid()
);

CREATE POLICY "Authorized users can create repairs" ON public.repairs
FOR INSERT 
WITH CHECK (get_current_user_role() IN ('admin', 'manager', 'salesperson'));

CREATE POLICY "Role-based repairs update access" ON public.repairs
FOR UPDATE 
USING (
  get_current_user_role() IN ('admin', 'manager')
  OR technician_id = auth.uid()
);

CREATE POLICY "Only admins and managers can delete repairs" ON public.repairs
FOR DELETE 
USING (get_current_user_role() IN ('admin', 'manager'));

-- 7. Secure inventory access
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Products are viewable by authenticated users" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can delete products" ON public.products;

CREATE POLICY "Role-based products view access" ON public.products
FOR SELECT 
USING (get_current_user_role() IN ('admin', 'manager', 'inventory_manager', 'salesperson'));

CREATE POLICY "Inventory managers can manage products" ON public.products
FOR ALL 
USING (get_current_user_role() IN ('admin', 'manager', 'inventory_manager'));

-- 8. Create audit log table for security events
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  event_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs" ON public.security_audit_log
FOR SELECT 
USING (get_current_user_role() = 'admin');

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" ON public.security_audit_log
FOR INSERT 
WITH CHECK (true);

-- 9. Create secure role management function
CREATE OR REPLACE FUNCTION public.admin_update_user_role(
  target_user_id UUID,
  new_role app_role
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role app_role;
  old_role app_role;
BEGIN
  -- Check if current user is admin
  SELECT get_current_user_role() INTO current_user_role;
  
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied: Only admins can change user roles';
  END IF;
  
  -- Get old role for audit
  SELECT role INTO old_role FROM public.profiles WHERE id = target_user_id;
  
  -- Update the role
  UPDATE public.profiles 
  SET role = new_role, updated_at = now()
  WHERE id = target_user_id;
  
  -- Log the role change
  INSERT INTO public.security_audit_log (
    user_id, 
    event_type, 
    event_data
  ) VALUES (
    auth.uid(),
    'role_change',
    jsonb_build_object(
      'target_user_id', target_user_id,
      'old_role', old_role,
      'new_role', new_role
    )
  );
  
  RETURN TRUE;
END;
$$;