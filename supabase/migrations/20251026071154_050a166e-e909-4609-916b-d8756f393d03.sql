-- =====================================================
-- MULTI-TENANT ARCHITECTURE - PHASE 1: STORE FOUNDATION
-- =====================================================
-- This migration adds support for multiple stores/locations
-- with complete data isolation and user-store assignments

-- =====================================================
-- 1. CREATE STORES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE, -- Short code like "STORE-001", "MAIN", "BRANCH-A"
  address text,
  city text,
  postal_code text,
  phone text,
  email text,
  manager_id uuid REFERENCES public.profiles(id),
  is_active boolean NOT NULL DEFAULT true,
  settings jsonb DEFAULT '{}'::jsonb, -- Store-specific settings
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT stores_name_not_empty CHECK (length(trim(name)) > 0),
  CONSTRAINT stores_code_not_empty CHECK (length(trim(code)) > 0),
  CONSTRAINT stores_code_format CHECK (code ~ '^[A-Z0-9_-]+$') -- Uppercase, numbers, underscore, hyphen only
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stores_code ON public.stores(code);
CREATE INDEX IF NOT EXISTS idx_stores_active ON public.stores(is_active);
CREATE INDEX IF NOT EXISTS idx_stores_manager ON public.stores(manager_id);

-- Add updated_at trigger
CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 2. CREATE USER-STORE JUNCTION TABLE
-- =====================================================
-- Links users to one or more stores they can access
CREATE TABLE IF NOT EXISTS public.user_stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  is_default boolean NOT NULL DEFAULT false, -- User's default store
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT user_stores_unique_user_store UNIQUE (user_id, store_id)
);

-- Ensure each user has only one default store per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_stores_one_default_per_user
  ON public.user_stores(user_id)
  WHERE is_default = true;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_stores_user ON public.user_stores(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stores_store ON public.user_stores(store_id);

-- =====================================================
-- 3. CREATE STORE MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to get user's current store ID (defaults to their default store)
CREATE OR REPLACE FUNCTION public.get_user_current_store_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_store uuid;
  user_default_store uuid;
BEGIN
  -- Try to get from session variable (set by frontend when user switches stores)
  BEGIN
    current_store := current_setting('app.current_store_id', true)::uuid;
    IF current_store IS NOT NULL THEN
      RETURN current_store;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Ignore errors, continue to default
  END;

  -- Get user's default store
  SELECT store_id INTO user_default_store
  FROM public.user_stores
  WHERE user_id = auth.uid() AND is_default = true
  LIMIT 1;

  RETURN user_default_store;
END;
$$;

-- Function to get all store IDs a user has access to
CREATE OR REPLACE FUNCTION public.get_user_store_ids()
RETURNS uuid[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  store_ids uuid[];
BEGIN
  SELECT ARRAY_AGG(store_id) INTO store_ids
  FROM public.user_stores
  WHERE user_id = auth.uid();

  RETURN COALESCE(store_ids, ARRAY[]::uuid[]);
END;
$$;

-- Function to check if user has access to a specific store
CREATE OR REPLACE FUNCTION public.user_has_store_access(target_store_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  has_access boolean;
  user_role app_role;
BEGIN
  -- Super admins have access to all stores
  SELECT get_current_user_role() INTO user_role;
  IF user_role = 'super_admin' THEN
    RETURN true;
  END IF;

  -- Check if user is assigned to this store
  SELECT EXISTS(
    SELECT 1 FROM public.user_stores
    WHERE user_id = auth.uid() AND store_id = target_store_id
  ) INTO has_access;

  RETURN has_access;
END;
$$;

-- Function to set user's current store (for session)
CREATE OR REPLACE FUNCTION public.set_user_current_store(target_store_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify user has access to this store
  IF NOT public.user_has_store_access(target_store_id) THEN
    RAISE EXCEPTION 'Access denied: User does not have access to store %', target_store_id;
  END IF;

  -- Set session variable (persists for the session)
  PERFORM set_config('app.current_store_id', target_store_id::text, false);
END;
$$;

-- =====================================================
-- 4. ROW LEVEL SECURITY POLICIES FOR NEW TABLES
-- =====================================================

-- Enable RLS on stores table
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- Super admins can view all stores
CREATE POLICY "Super admins can view all stores"
ON public.stores FOR SELECT
TO authenticated
USING (get_current_user_role() = 'super_admin');

-- Admins can view all stores
CREATE POLICY "Admins can view all stores"
ON public.stores FOR SELECT
TO authenticated
USING (get_current_user_role() = 'admin');

-- Users can view stores they're assigned to
CREATE POLICY "Users can view their assigned stores"
ON public.stores FOR SELECT
TO authenticated
USING (
  id IN (SELECT store_id FROM public.user_stores WHERE user_id = auth.uid())
);

-- Only super admins can create stores
CREATE POLICY "Super admins can create stores"
ON public.stores FOR INSERT
TO authenticated
WITH CHECK (get_current_user_role() = 'super_admin');

-- Only super admins can update stores
CREATE POLICY "Super admins can update stores"
ON public.stores FOR UPDATE
TO authenticated
USING (get_current_user_role() = 'super_admin')
WITH CHECK (get_current_user_role() = 'super_admin');

-- Only super admins can delete stores (soft delete recommended)
CREATE POLICY "Super admins can delete stores"
ON public.stores FOR DELETE
TO authenticated
USING (get_current_user_role() = 'super_admin');

-- Enable RLS on user_stores table
ALTER TABLE public.user_stores ENABLE ROW LEVEL SECURITY;

-- Super admins can view all user-store assignments
CREATE POLICY "Super admins can view all user-store assignments"
ON public.user_stores FOR SELECT
TO authenticated
USING (get_current_user_role() = 'super_admin');

-- Admins can view user-store assignments
CREATE POLICY "Admins can view user-store assignments"
ON public.user_stores FOR SELECT
TO authenticated
USING (get_current_user_role() = 'admin');

-- Users can view their own store assignments
CREATE POLICY "Users can view their own store assignments"
ON public.user_stores FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Only super admins can create user-store assignments
CREATE POLICY "Super admins can create user-store assignments"
ON public.user_stores FOR INSERT
TO authenticated
WITH CHECK (get_current_user_role() = 'super_admin');

-- Only super admins can update user-store assignments
CREATE POLICY "Super admins can update user-store assignments"
ON public.user_stores FOR UPDATE
TO authenticated
USING (get_current_user_role() = 'super_admin')
WITH CHECK (get_current_user_role() = 'super_admin');

-- Only super admins can delete user-store assignments
CREATE POLICY "Super admins can delete user-store assignments"
ON public.user_stores FOR DELETE
TO authenticated
USING (get_current_user_role() = 'super_admin');

-- =====================================================
-- 5. CREATE DEFAULT STORE AND MIGRATE EXISTING DATA
-- =====================================================

-- Insert default store (this will be the store for all existing data)
INSERT INTO public.stores (id, name, code, is_active, settings)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Main Store',
  'MAIN',
  true,
  '{"is_default": true, "created_by": "system"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Assign all existing users to the default store
INSERT INTO public.user_stores (user_id, store_id, is_default)
SELECT
  id as user_id,
  '00000000-0000-0000-0000-000000000001'::uuid as store_id,
  true as is_default
FROM public.profiles
WHERE id NOT IN (SELECT user_id FROM public.user_stores)
ON CONFLICT (user_id, store_id) DO NOTHING;

-- =====================================================
-- 6. COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.stores IS 'Stores/locations/branches for multi-tenant support';
COMMENT ON TABLE public.user_stores IS 'Junction table linking users to stores they can access';
COMMENT ON FUNCTION public.get_user_current_store_id() IS 'Returns the store ID for the current user session';
COMMENT ON FUNCTION public.get_user_store_ids() IS 'Returns array of all store IDs a user has access to';
COMMENT ON FUNCTION public.user_has_store_access(uuid) IS 'Checks if user has access to a specific store';
COMMENT ON FUNCTION public.set_user_current_store(uuid) IS 'Sets the current store for the user session';