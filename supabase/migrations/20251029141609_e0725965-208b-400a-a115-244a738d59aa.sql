-- Phase 1 & 3: Fix Multi-Tenant Store Context Issues

-- 1. Create user_session_preferences table for persistent store selection
CREATE TABLE IF NOT EXISTS public.user_session_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_selected_store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on user_session_preferences
ALTER TABLE public.user_session_preferences ENABLE ROW LEVEL SECURITY;

-- Users can manage their own preferences
CREATE POLICY "Users can manage own session preferences"
ON public.user_session_preferences
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. Update get_user_current_store_id() to use persistent storage with fallbacks
CREATE OR REPLACE FUNCTION public.get_user_current_store_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_store uuid;
  user_role app_role;
BEGIN
  -- Super admins don't need a specific store context (NULL = all stores)
  SELECT get_current_user_role() INTO user_role;
  IF user_role = 'super_admin' THEN
    -- Try to get from session first, otherwise return NULL
    BEGIN
      current_store := current_setting('app.current_store_id', true)::uuid;
    EXCEPTION WHEN OTHERS THEN
      current_store := NULL;
    END;
    RETURN current_store; -- May be NULL, which means "all stores"
  END IF;

  -- Try session variable first (performance optimization)
  BEGIN
    current_store := current_setting('app.current_store_id', true)::uuid;
    IF current_store IS NOT NULL THEN
      RETURN current_store;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    current_store := NULL;
  END;
  
  -- Fallback to persisted preference
  IF current_store IS NULL THEN
    SELECT last_selected_store_id INTO current_store
    FROM user_session_preferences
    WHERE user_id = auth.uid();
  END IF;
  
  -- Fallback to default store assignment
  IF current_store IS NULL THEN
    SELECT store_id INTO current_store
    FROM user_stores
    WHERE user_id = auth.uid() AND is_default = true
    LIMIT 1;
  END IF;
  
  -- Last resort: any assigned store
  IF current_store IS NULL THEN
    SELECT store_id INTO current_store
    FROM user_stores
    WHERE user_id = auth.uid()
    LIMIT 1;
  END IF;
  
  RETURN current_store;
END;
$$;

-- 3. Update set_user_current_store() to persist selection
CREATE OR REPLACE FUNCTION public.set_user_current_store(target_store_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_access boolean;
  user_role app_role;
BEGIN
  RAISE NOTICE 'Setting current store: user=%, store=%', auth.uid(), target_store_id;
  
  SELECT get_current_user_role() INTO user_role;
  
  -- Super admins have access to all stores
  IF user_role = 'super_admin' THEN
    has_access := true;
  ELSE
    -- Verify user has access to this store
    SELECT public.user_has_store_access(target_store_id) INTO has_access;
  END IF;
  
  IF NOT has_access THEN
    RAISE NOTICE 'Access denied for user % to store %', auth.uid(), target_store_id;
    RAISE EXCEPTION 'Access denied: User does not have access to store %', target_store_id;
  END IF;

  -- Set session variable (for current request/transaction)
  PERFORM set_config('app.current_store_id', target_store_id::text, false);
  
  -- Persist to database (survives across requests and connections)
  INSERT INTO public.user_session_preferences (user_id, last_selected_store_id, updated_at)
  VALUES (auth.uid(), target_store_id, now())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    last_selected_store_id = target_store_id,
    updated_at = now();
  
  RAISE NOTICE 'Successfully set and persisted store context to %', target_store_id;
END;
$$;

-- 4. Update RLS policies to allow super admins to bypass store context checks

-- Sales table: Super admins can view all sales without store filter
DROP POLICY IF EXISTS "Super admins can view all sales" ON public.sales;
CREATE POLICY "Super admins can view all sales"
ON public.sales
FOR SELECT
USING (get_current_user_role() = 'super_admin');

-- Products table: Super admins can view all products
DROP POLICY IF EXISTS "Super admins can view all products" ON public.products;
CREATE POLICY "Super admins can view all products"
ON public.products
FOR SELECT
USING (get_current_user_role() = 'super_admin');

-- Clients table: Super admins can view all clients
DROP POLICY IF EXISTS "Super admins can view all clients" ON public.clients;
CREATE POLICY "Super admins can view all clients"
ON public.clients
FOR SELECT
USING (get_current_user_role() = 'super_admin');

-- Product units table: Super admins can view all product units
DROP POLICY IF EXISTS "Super admins can view all product units" ON public.product_units;
CREATE POLICY "Super admins can view all product units"
ON public.product_units
FOR SELECT
USING (get_current_user_role() = 'super_admin');

-- Repairs table: Super admins can view all repairs
DROP POLICY IF EXISTS "Super admins can view all repairs" ON public.repairs;
CREATE POLICY "Super admins can view all repairs"
ON public.repairs
FOR SELECT
USING (get_current_user_role() = 'super_admin');

-- Employees table: Super admins can view all employees
DROP POLICY IF EXISTS "Super admins can view all employees" ON public.employees;
CREATE POLICY "Super admins can view all employees"
ON public.employees
FOR SELECT
USING (get_current_user_role() = 'super_admin');

-- 5. Assign orphaned super admins to Main Store
INSERT INTO public.user_stores (user_id, store_id, is_default)
SELECT DISTINCT ur.user_id, '00000000-0000-0000-0000-000000000001'::uuid, true
FROM public.user_roles ur
WHERE ur.role = 'super_admin'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_stores us WHERE us.user_id = ur.user_id
  )
  AND EXISTS (
    SELECT 1 FROM public.stores s WHERE s.id = '00000000-0000-0000-0000-000000000001'::uuid
  )
ON CONFLICT (user_id, store_id) DO NOTHING;

-- 6. Create trigger to auto-assign super admins to all active stores
CREATE OR REPLACE FUNCTION public.auto_assign_super_admin_to_stores()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  store_count integer;
BEGIN
  IF NEW.role = 'super_admin' THEN
    -- Check if user already has store assignments
    SELECT COUNT(*) INTO store_count
    FROM user_stores
    WHERE user_id = NEW.user_id;
    
    -- Only auto-assign if they have no stores
    IF store_count = 0 THEN
      -- Assign to all active stores
      INSERT INTO user_stores (user_id, store_id, is_default)
      SELECT NEW.user_id, s.id, (ROW_NUMBER() OVER (ORDER BY s.created_at ASC) = 1) as is_default
      FROM stores s
      WHERE s.is_active = true
      ON CONFLICT (user_id, store_id) DO NOTHING;
      
      RAISE NOTICE 'Auto-assigned super admin % to all active stores', NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS auto_assign_stores_on_super_admin ON public.user_roles;

-- Create trigger
CREATE TRIGGER auto_assign_stores_on_super_admin
AFTER INSERT OR UPDATE OF role ON public.user_roles
FOR EACH ROW
WHEN (NEW.role = 'super_admin')
EXECUTE FUNCTION public.auto_assign_super_admin_to_stores();