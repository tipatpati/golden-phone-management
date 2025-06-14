
-- Update the profiles table RLS policies to allow admins to create profiles for employees
DROP POLICY IF EXISTS "Admins can create profiles for employees" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;

CREATE POLICY "Admins can create profiles for employees" ON public.profiles
  FOR INSERT WITH CHECK (public.get_current_user_role() = 'admin');

-- Also ensure admins can update profiles when editing employees  
DROP POLICY IF EXISTS "Admins can update employee profiles" ON public.profiles;

CREATE POLICY "Admins can update employee profiles" ON public.profiles
  FOR UPDATE USING (public.get_current_user_role() = 'admin');
