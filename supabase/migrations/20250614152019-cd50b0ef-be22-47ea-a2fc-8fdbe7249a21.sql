
-- First, let's create the enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'inventory_manager', 'salesperson');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create a temporary column with the new enum type
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role_new public.app_role;

-- Update the new column with properly mapped values
UPDATE public.profiles SET role_new = CASE 
  WHEN role::text = 'admin' THEN 'admin'::public.app_role
  WHEN role::text = 'manager' THEN 'manager'::public.app_role
  WHEN role::text = 'inventory_manager' THEN 'inventory_manager'::public.app_role
  WHEN role::text = 'salesperson' THEN 'salesperson'::public.app_role
  ELSE 'salesperson'::public.app_role
END
WHERE role_new IS NULL;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Drop the old column and rename the new one (only if the old column still exists)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role' AND data_type != 'USER-DEFINED') THEN
        ALTER TABLE public.profiles DROP COLUMN role;
        ALTER TABLE public.profiles RENAME COLUMN role_new TO role;
    END IF;
END $$;

-- Set the column constraints
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'salesperson'::public.app_role;
ALTER TABLE public.profiles ALTER COLUMN role SET NOT NULL;

-- Create a security definer function to get current user role (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS public.app_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create RLS policies for profiles table
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (public.get_current_user_role() = 'admin');

-- Update the handle_new_user function to use the new enum and handle role properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'salesperson'::public.app_role)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
