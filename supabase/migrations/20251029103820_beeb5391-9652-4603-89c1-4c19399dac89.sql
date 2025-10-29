-- Fix user_has_store_access() function to bypass RLS issues
CREATE OR REPLACE FUNCTION public.user_has_store_access(target_store_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  has_access boolean;
  user_role app_role;
  current_user_id uuid;
  store_count integer;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Log the check attempt
  RAISE NOTICE 'Checking store access: user_id=%, store_id=%', current_user_id, target_store_id;
  
  -- Super admins have access to all stores
  SELECT get_current_user_role() INTO user_role;
  RAISE NOTICE 'User role: %', user_role;
  
  IF user_role = 'super_admin' THEN
    RAISE NOTICE 'Access granted: super admin';
    RETURN true;
  END IF;

  -- Count total stores for this user (for debugging)
  SELECT COUNT(*) INTO store_count
  FROM public.user_stores
  WHERE user_id = current_user_id;
  
  RAISE NOTICE 'User has % store assignments', store_count;

  -- Check if user is assigned to this store
  -- Explicitly filter by current_user_id to bypass RLS issues
  SELECT EXISTS(
    SELECT 1 FROM public.user_stores
    WHERE user_id = current_user_id 
      AND store_id = target_store_id
  ) INTO has_access;
  
  RAISE NOTICE 'Access check result: %', has_access;

  RETURN has_access;
END;
$$;

-- Add comprehensive logging to set_user_current_store
CREATE OR REPLACE FUNCTION public.set_user_current_store(target_store_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  has_access boolean;
BEGIN
  RAISE NOTICE 'Setting current store: user=%, store=%', auth.uid(), target_store_id;
  
  -- Verify user has access to this store
  SELECT public.user_has_store_access(target_store_id) INTO has_access;
  
  IF NOT has_access THEN
    RAISE NOTICE 'Access denied for user % to store %', auth.uid(), target_store_id;
    RAISE EXCEPTION 'Access denied: User does not have access to store %', target_store_id;
  END IF;

  -- Set session variable (persists for the session)
  PERFORM set_config('app.current_store_id', target_store_id::text, false);
  
  RAISE NOTICE 'Successfully set app.current_store_id to %', target_store_id;
END;
$$;

-- Create debug function for troubleshooting
CREATE OR REPLACE FUNCTION public.debug_user_store_access()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb;
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  SELECT jsonb_build_object(
    'user_id', current_user_id,
    'user_role', get_current_user_role(),
    'current_store_setting', current_setting('app.current_store_id', true),
    'user_stores', (
      SELECT jsonb_agg(jsonb_build_object(
        'store_id', store_id,
        'store_name', s.name,
        'is_default', is_default
      ))
      FROM user_stores us
      LEFT JOIN stores s ON s.id = us.store_id
      WHERE us.user_id = current_user_id
    ),
    'can_access_main_store', public.user_has_store_access('00000000-0000-0000-0000-000000000001'::uuid),
    'timestamp', now()
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Ensure all necessary grants are in place
GRANT EXECUTE ON FUNCTION public.user_has_store_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_current_store(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_current_store_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_store_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.debug_user_store_access() TO authenticated;

-- Ensure function owner has necessary permissions
GRANT SELECT ON TABLE public.user_stores TO postgres;
GRANT SELECT ON TABLE public.stores TO postgres;