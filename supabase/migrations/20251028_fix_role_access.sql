-- Fix role access for store selector
-- Ensures get_current_user_role() function works correctly from client

-- Step 1: Ensure the function exists and is correct
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid()),
    'salesperson'::app_role
  )
$function$;

-- Step 2: Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO anon;

-- Step 3: Ensure profiles table has proper RLS policy for self-read
-- Drop old policies that might conflict
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for users to their own profile" ON profiles;

-- Create clear self-read policy
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Step 4: Ensure super_admins can read all profiles (for future admin features)
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;

CREATE POLICY "Super admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'::app_role
);

-- Step 5: Ensure profiles table RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 6: Verify stores table is accessible
-- Super admins should see all stores
DROP POLICY IF EXISTS "Super admins can view all stores" ON stores;

CREATE POLICY "Super admins can view all stores"
ON public.stores
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'::app_role
);

-- Step 7: Add helpful comment
COMMENT ON FUNCTION public.get_current_user_role() IS
'Returns the current authenticated user role from profiles table. Used by StoreContext to determine super_admin status. Returns salesperson if no profile exists.';
